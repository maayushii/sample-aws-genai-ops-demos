"""
Bedrock Account Intelligence Dashboard
A TAM-ready dashboard for Bedrock usage, quotas, cost, and performance analysis.
Author: Aayushi Mittal (maayushi)
"""

import json
import os
import logging
from datetime import datetime, timedelta, timezone
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)
app.secret_key = os.urandom(24)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("bedrock-intel")

APP_VERSION = "1.0.0"
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# AWS Client Helpers
# ---------------------------------------------------------------------------

def get_boto3_client(service, region="us-east-1", profile=None):
    """Get a boto3 client with optional profile support."""
    import boto3
    session_kwargs = {}
    if profile:
        session_kwargs["profile_name"] = profile
    session = boto3.Session(region_name=region, **session_kwargs)
    return session.client(service)


def get_boto3_resource(service, region="us-east-1", profile=None):
    """Get a boto3 resource with optional profile support."""
    import boto3
    session_kwargs = {}
    if profile:
        session_kwargs["profile_name"] = profile
    session = boto3.Session(region_name=region, **session_kwargs)
    return session.resource(service)


# ---------------------------------------------------------------------------
# Data Collection Functions
# ---------------------------------------------------------------------------

def get_account_identity(profile=None):
    """Get current AWS account identity."""
    try:
        sts = get_boto3_client("sts", profile=profile)
        identity = sts.get_caller_identity()
        return {
            "account_id": identity["Account"],
            "arn": identity["Arn"],
            "user_id": identity["UserId"],
        }
    except Exception as e:
        logger.error(f"Failed to get identity: {e}")
        return None


def get_bedrock_models(region="us-east-1", profile=None):
    """List all available foundation models."""
    try:
        client = get_boto3_client("bedrock", region=region, profile=profile)
        response = client.list_foundation_models()
        models = []
        for m in response.get("modelSummaries", []):
            models.append({
                "model_id": m.get("modelId", ""),
                "model_name": m.get("modelName", ""),
                "provider": m.get("providerName", ""),
                "input_modalities": m.get("inputModalities", []),
                "output_modalities": m.get("outputModalities", []),
                "streaming": m.get("responseStreamingSupported", False),
                "inference_types": m.get("inferenceTypesSupported", []),
                "status": m.get("modelLifecycle", {}).get("status", "ACTIVE"),
            })
        return models
    except Exception as e:
        logger.error(f"Failed to list models in {region}: {e}")
        return []


def get_model_access_status(region="us-east-1", profile=None):
    """Get model access/enablement status."""
    try:
        client = get_boto3_client("bedrock", region=region, profile=profile)
        response = client.list_model_access()
        access = {}
        for entry in response.get("modelAccessList", []):
            model_id = entry.get("modelId", "")
            access[model_id] = {
                "status": entry.get("accessStatus", "UNKNOWN"),
                "model_id": model_id,
            }
        return access
    except Exception as e:
        logger.warning(f"Failed to get model access in {region}: {e}")
        return {}


def get_provisioned_throughput(region="us-east-1", profile=None):
    """List provisioned throughput configurations."""
    try:
        client = get_boto3_client("bedrock", region=region, profile=profile)
        response = client.list_provisioned_model_throughputs()
        throughputs = []
        for pt in response.get("provisionedModelSummaries", []):
            throughputs.append({
                "name": pt.get("provisionedModelName", ""),
                "model_arn": pt.get("modelArn", ""),
                "model_units": pt.get("desiredModelUnits", 0),
                "status": pt.get("status", ""),
                "commitment": pt.get("commitmentDuration", ""),
                "created": str(pt.get("creationTime", "")),
            })
        return throughputs
    except Exception as e:
        logger.warning(f"Failed to get provisioned throughput in {region}: {e}")
        return []


def get_custom_models(region="us-east-1", profile=None):
    """List custom/fine-tuned models."""
    try:
        client = get_boto3_client("bedrock", region=region, profile=profile)
        response = client.list_custom_models()
        models = []
        for m in response.get("modelSummaries", []):
            models.append({
                "model_name": m.get("modelName", ""),
                "model_arn": m.get("modelArn", ""),
                "base_model": m.get("baseModelId", ""),
                "created": str(m.get("creationTime", "")),
            })
        return models
    except Exception as e:
        logger.warning(f"Failed to get custom models in {region}: {e}")
        return []


def get_guardrails(region="us-east-1", profile=None):
    """List Bedrock guardrails."""
    try:
        client = get_boto3_client("bedrock", region=region, profile=profile)
        response = client.list_guardrails()
        guardrails = []
        for g in response.get("guardrails", []):
            guardrails.append({
                "name": g.get("name", ""),
                "id": g.get("id", ""),
                "status": g.get("status", ""),
                "version": g.get("version", ""),
                "created": str(g.get("createdAt", "")),
                "updated": str(g.get("updatedAt", "")),
            })
        return guardrails
    except Exception as e:
        logger.warning(f"Failed to get guardrails in {region}: {e}")
        return []


def get_bedrock_quotas(region="us-east-1", profile=None):
    """Get Bedrock service quotas."""
    try:
        client = get_boto3_client("service-quotas", region=region, profile=profile)
        quotas = []
        paginator = client.get_paginator("list_service_quotas")
        for page in paginator.paginate(ServiceCode="bedrock"):
            for q in page.get("Quotas", []):
                quotas.append({
                    "name": q.get("QuotaName", ""),
                    "value": q.get("Value", 0),
                    "unit": q.get("Unit", ""),
                    "adjustable": q.get("Adjustable", False),
                    "global_quota": q.get("GlobalQuota", False),
                })
        return quotas
    except Exception as e:
        logger.warning(f"Failed to get quotas in {region}: {e}")
        return []


def get_cloudwatch_metrics(namespace, metric_name, dimensions, region="us-east-1",
                           profile=None, period=3600, hours=168, stat="Sum"):
    """Get CloudWatch metrics for Bedrock."""
    try:
        cw = get_boto3_client("cloudwatch", region=region, profile=profile)
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(hours=hours)
        response = cw.get_metric_statistics(
            Namespace=namespace,
            MetricName=metric_name,
            Dimensions=dimensions,
            StartTime=start_time,
            EndTime=end_time,
            Period=period,
            Statistics=[stat],
        )
        datapoints = sorted(response.get("Datapoints", []), key=lambda x: x["Timestamp"])
        return [{"timestamp": dp["Timestamp"].isoformat(), "value": dp.get(stat, 0)}
                for dp in datapoints]
    except Exception as e:
        logger.warning(f"Failed to get CW metric {metric_name}: {e}")
        return []


def get_invocation_metrics(region="us-east-1", profile=None, model_id=None, hours=168):
    """Get Bedrock invocation metrics from CloudWatch."""
    dims = []
    if model_id:
        dims.append({"Name": "ModelId", "Value": model_id})

    metrics = {}
    for metric_name in ["Invocations", "InvocationLatency",
                        "InvocationClientErrors", "InvocationServerErrors",
                        "InvocationThrottles", "InputTokenCount", "OutputTokenCount"]:
        stat = "Sum" if metric_name != "InvocationLatency" else "Average"
        metrics[metric_name] = get_cloudwatch_metrics(
            namespace="AWS/Bedrock",
            metric_name=metric_name,
            dimensions=dims,
            region=region,
            profile=profile,
            hours=hours,
            stat=stat,
        )
    return metrics


def get_bedrock_cost(region="us-east-1", profile=None, days=30):
    """Get Bedrock cost from Cost Explorer."""
    try:
        ce = get_boto3_client("ce", region="us-east-1", profile=profile)
        end_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        start_date = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
        response = ce.get_cost_and_usage(
            TimePeriod={"Start": start_date, "End": end_date},
            Granularity="DAILY",
            Metrics=["UnblendedCost"],
            Filter={
                "Dimensions": {
                    "Key": "SERVICE",
                    "Values": ["Amazon Bedrock"],
                }
            },
            GroupBy=[{"Type": "DIMENSION", "Key": "USAGE_TYPE"}],
        )
        results = []
        for period in response.get("ResultsByTime", []):
            date = period["TimePeriod"]["Start"]
            for group in period.get("Groups", []):
                usage_type = group["Keys"][0]
                amount = float(group["Metrics"]["UnblendedCost"]["Amount"])
                results.append({
                    "date": date,
                    "usage_type": usage_type,
                    "cost": round(amount, 4),
                })
        return results
    except Exception as e:
        logger.warning(f"Failed to get Bedrock cost: {e}")
        return []


def generate_recommendations(models, quotas, metrics, cost_data, provisioned):
    """Generate optimization recommendations based on collected data."""
    recs = []

    # Check for throttling
    throttles = metrics.get("InvocationThrottles", [])
    total_throttles = sum(dp.get("value", 0) for dp in throttles)
    if total_throttles > 0:
        recs.append({
            "category": "Performance",
            "severity": "HIGH",
            "title": "Invocation Throttling Detected",
            "detail": f"{int(total_throttles)} throttled requests in the last 7 days. "
                      "Consider requesting a quota increase or adding provisioned throughput.",
            "action": "Request quota increase via Service Quotas console or add provisioned throughput.",
        })

    # Check for high error rates
    invocations = sum(dp.get("value", 0) for dp in metrics.get("Invocations", []))
    client_errors = sum(dp.get("value", 0) for dp in metrics.get("InvocationClientErrors", []))
    if invocations > 0 and client_errors / invocations > 0.05:
        error_rate = round(client_errors / invocations * 100, 1)
        recs.append({
            "category": "Reliability",
            "severity": "MEDIUM",
            "title": f"High Client Error Rate ({error_rate}%)",
            "detail": "Client error rate exceeds 5%. Review request payloads and model compatibility.",
            "action": "Check CloudWatch logs for error details. Validate input formats.",
        })

    # Check for no provisioned throughput with high usage
    if invocations > 10000 and not provisioned:
        recs.append({
            "category": "Cost",
            "severity": "MEDIUM",
            "title": "Consider Provisioned Throughput",
            "detail": f"{int(invocations)} invocations in 7 days with no provisioned throughput. "
                      "Provisioned throughput can reduce cost for sustained workloads.",
            "action": "Evaluate provisioned throughput pricing vs on-demand for top models.",
        })

    # Check for deprecated models
    deprecated = [m for m in models if m.get("status") == "LEGACY"]
    if deprecated:
        names = ", ".join(m["model_id"] for m in deprecated[:3])
        recs.append({
            "category": "Lifecycle",
            "severity": "MEDIUM",
            "title": f"{len(deprecated)} Legacy Model(s) in Use",
            "detail": f"Models marked LEGACY: {names}. Plan migration to current versions.",
            "action": "Review model lifecycle page and test replacement models.",
        })

    # Cost trend check
    if cost_data:
        recent_cost = sum(c["cost"] for c in cost_data[-7:])
        prior_cost = sum(c["cost"] for c in cost_data[-14:-7]) if len(cost_data) >= 14 else 0
        if prior_cost > 0:
            wow_change = ((recent_cost - prior_cost) / prior_cost) * 100
            if wow_change > 25:
                recs.append({
                    "category": "Cost",
                    "severity": "HIGH",
                    "title": f"Cost Spike: {wow_change:.0f}% WoW Increase",
                    "detail": f"Bedrock cost jumped from ${prior_cost:.2f} to ${recent_cost:.2f} week-over-week.",
                    "action": "Review usage patterns and identify cost drivers by model/usage type.",
                })

    if not recs:
        recs.append({
            "category": "General",
            "severity": "LOW",
            "title": "No Issues Detected",
            "detail": "Bedrock usage looks healthy. No immediate actions needed.",
            "action": "Continue monitoring.",
        })

    return recs


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html", version=APP_VERSION)


@app.route("/api/identity")
def api_identity():
    profile = request.args.get("profile")
    identity = get_account_identity(profile=profile)
    if identity:
        return jsonify(identity)
    return jsonify({"error": "Failed to get AWS identity. Check credentials."}), 401


@app.route("/api/scan")
def api_scan():
    """Full account scan — returns all Bedrock intelligence for a region."""
    region = request.args.get("region", "us-east-1")
    profile = request.args.get("profile")
    hours = int(request.args.get("hours", 168))
    cost_days = int(request.args.get("cost_days", 30))

    logger.info(f"Scanning region={region} profile={profile} hours={hours}")

    models = get_bedrock_models(region=region, profile=profile)
    access = get_model_access_status(region=region, profile=profile)
    provisioned = get_provisioned_throughput(region=region, profile=profile)
    custom = get_custom_models(region=region, profile=profile)
    guardrails = get_guardrails(region=region, profile=profile)
    quotas = get_bedrock_quotas(region=region, profile=profile)
    metrics = get_invocation_metrics(region=region, profile=profile, hours=hours)
    cost_data = get_bedrock_cost(region=region, profile=profile, days=cost_days)

    # Enrich models with access status
    for m in models:
        mid = m["model_id"]
        if mid in access:
            m["access_status"] = access[mid]["status"]
        else:
            m["access_status"] = "UNKNOWN"

    recommendations = generate_recommendations(models, quotas, metrics, cost_data, provisioned)

    # Summary stats
    total_invocations = sum(dp.get("value", 0) for dp in metrics.get("Invocations", []))
    total_throttles = sum(dp.get("value", 0) for dp in metrics.get("InvocationThrottles", []))
    total_input_tokens = sum(dp.get("value", 0) for dp in metrics.get("InputTokenCount", []))
    total_output_tokens = sum(dp.get("value", 0) for dp in metrics.get("OutputTokenCount", []))
    total_cost = sum(c["cost"] for c in cost_data)
    avg_latency_points = metrics.get("InvocationLatency", [])
    avg_latency = (sum(dp.get("value", 0) for dp in avg_latency_points) / len(avg_latency_points)
                   if avg_latency_points else 0)

    result = {
        "scan_time": datetime.now(timezone.utc).isoformat(),
        "region": region,
        "summary": {
            "total_models_available": len(models),
            "models_enabled": len([m for m in models if m.get("access_status") == "ENABLED"]),
            "provisioned_throughputs": len(provisioned),
            "custom_models": len(custom),
            "guardrails": len(guardrails),
            "total_invocations_7d": int(total_invocations),
            "total_throttles_7d": int(total_throttles),
            "throttle_rate": round(total_throttles / total_invocations * 100, 2) if total_invocations > 0 else 0,
            "total_input_tokens_7d": int(total_input_tokens),
            "total_output_tokens_7d": int(total_output_tokens),
            "avg_latency_ms": round(avg_latency, 1),
            "total_cost_30d": round(total_cost, 2),
        },
        "models": models,
        "provisioned_throughput": provisioned,
        "custom_models": custom,
        "guardrails": guardrails,
        "quotas": quotas,
        "metrics": metrics,
        "cost": cost_data,
        "recommendations": recommendations,
    }

    # Cache result
    cache_file = os.path.join(DATA_DIR, f"scan_{region}.json")
    with open(cache_file, "w") as f:
        json.dump(result, f, default=str)

    return jsonify(result)


@app.route("/api/export")
def api_export():
    """Export QBR-ready summary."""
    region = request.args.get("region", "us-east-1")
    cache_file = os.path.join(DATA_DIR, f"scan_{region}.json")
    if not os.path.exists(cache_file):
        return jsonify({"error": "No scan data. Run a scan first."}), 404

    with open(cache_file) as f:
        data = json.load(f)

    summary = data.get("summary", {})
    recs = data.get("recommendations", [])

    export = {
        "title": f"Bedrock Account Intelligence — {region}",
        "generated": datetime.now(timezone.utc).isoformat(),
        "summary": summary,
        "top_recommendations": recs[:5],
        "cost_trend": data.get("cost", [])[-14:],
    }
    return jsonify(export)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    logger.info(f"Bedrock Account Intelligence v{APP_VERSION} starting on port 5003")
    app.run(host="0.0.0.0", port=5003, debug=False, threaded=True)
