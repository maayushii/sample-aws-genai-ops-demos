"""Aurora MySQL Cost Optimization analyzer Lambda.

Mechanical work (this code): discover Aurora MySQL clusters + instances, pull 14-day
CloudWatch utilization, and find orphaned manual snapshots.
Judgment work (Amazon Bedrock Nova): reason over the inventory to produce right-sizing,
Serverless v2, Graviton, I/O-Optimized, idle-cluster, and Reserved-Instance findings.
"""
import datetime
import json
import os

import boto3

RESULTS_BUCKET = os.environ["RESULTS_BUCKET"]
MODEL_ID = os.environ.get("MODEL_ID", "amazon.nova-lite-v1:0")

rds = boto3.client("rds")
cw = boto3.client("cloudwatch")
s3 = boto3.client("s3")
bedrock = boto3.client("bedrock-runtime")


def _metric(instance_id, name, stat, days=14):
    end = datetime.datetime.utcnow()
    start = end - datetime.timedelta(days=days)
    try:
        resp = cw.get_metric_statistics(
            Namespace="AWS/RDS",
            MetricName=name,
            Dimensions=[{"Name": "DBInstanceIdentifier", "Value": instance_id}],
            StartTime=start,
            EndTime=end,
            Period=3600,
            Statistics=[stat],
        )
    except Exception:
        return None
    dps = resp.get("Datapoints", [])
    if not dps:
        return None
    vals = [d[stat] for d in dps]
    if stat == "Average":
        return round(sum(vals) / len(vals), 2)
    if stat == "Minimum":
        return round(min(vals), 2)
    return round(max(vals), 2)


def gather_inventory(cluster_filter=None):
    clusters = rds.describe_db_clusters().get("DBClusters", [])
    inventory = []
    for c in clusters:
        if not str(c.get("Engine", "")).startswith("aurora-mysql"):
            continue
        cid = c["DBClusterIdentifier"]
        if cluster_filter and cid != cluster_filter:
            continue
        instances = []
        for m in c.get("DBClusterMembers", []):
            iid = m["DBInstanceIdentifier"]
            try:
                di = rds.describe_db_instances(DBInstanceIdentifier=iid)["DBInstances"][0]
            except Exception:
                continue
            instances.append(
                {
                    "instance_id": iid,
                    "instance_class": di.get("DBInstanceClass"),
                    "is_writer": m.get("IsClusterWriter"),
                    "engine_version": di.get("EngineVersion"),
                    "performance_insights_enabled": di.get("PerformanceInsightsEnabled"),
                    "cpu_avg_pct_14d": _metric(iid, "CPUUtilization", "Average"),
                    "cpu_max_pct_14d": _metric(iid, "CPUUtilization", "Maximum"),
                    "connections_avg_14d": _metric(iid, "DatabaseConnections", "Average"),
                    "connections_max_14d": _metric(iid, "DatabaseConnections", "Maximum"),
                    "freeable_memory_min_bytes_14d": _metric(iid, "FreeableMemory", "Minimum"),
                }
            )
        inventory.append(
            {
                "cluster_id": cid,
                "engine": c.get("Engine"),
                "engine_version": c.get("EngineVersion"),
                "multi_az": c.get("MultiAZ"),
                "storage_type": c.get("StorageType") or "aurora (Standard)",
                "backup_retention_days": c.get("BackupRetentionPeriod"),
                "serverless_v2_scaling": c.get("ServerlessV2ScalingConfiguration"),
                "instance_count": len(instances),
                "instances": instances,
            }
        )
    return inventory


def find_orphaned_snapshots():
    try:
        snaps = rds.describe_db_cluster_snapshots(SnapshotType="manual").get(
            "DBClusterSnapshots", []
        )
        existing = {
            c["DBClusterIdentifier"] for c in rds.describe_db_clusters().get("DBClusters", [])
        }
    except Exception:
        return []
    return [
        {
            "snapshot_id": s["DBClusterSnapshotIdentifier"],
            "source_cluster": s.get("DBClusterIdentifier"),
            "created": str(s.get("SnapshotCreateTime")),
            "size_gb": s.get("AllocatedStorage"),
        }
        for s in snaps
        if s.get("DBClusterIdentifier") not in existing
    ]


PROMPT_TEMPLATE = """You are a senior AWS Aurora MySQL cost-optimization advisor.
Analyze the inventory and utilization JSON below and produce a concise, actionable
Markdown report. Ground every recommendation in the data provided; do not invent
resources or exact dollar figures you cannot justify — use clearly-labeled estimate
ranges and state the assumption.

Cover these categories where the data supports them:
1. Right-sizing — instances with low CPU/connection utilization over 14 days.
2. Aurora Serverless v2 candidacy — spiky or low average utilization workloads.
3. Graviton migration — db.t3/db.r5/db.r6i -> db.t4g/db.r7g equivalents (~10-20% price/perf).
4. I/O-Optimized vs Standard storage — call out that a billing/CUR review is needed to decide.
5. Idle or over-provisioned clusters — very low utilization or unused readers.
6. Reserved Instances / Savings Plans — steady-state instances suitable for commitment.
7. Orphaned manual snapshots — flag for deletion after verification.

For each finding include: title, affected resource(s), severity (High/Medium/Low),
rationale tied to the metrics, estimated monthly savings range, and implementation effort.
Start with a short executive summary and a prioritized top-3 list.

INVENTORY_JSON:
{inventory_json}

ORPHANED_SNAPSHOTS_JSON:
{snapshots_json}
"""


def analyze_with_bedrock(inventory, orphans):
    prompt = PROMPT_TEMPLATE.format(
        inventory_json=json.dumps(inventory, default=str, indent=2),
        snapshots_json=json.dumps(orphans, default=str, indent=2),
    )
    resp = bedrock.converse(
        modelId=MODEL_ID,
        messages=[{"role": "user", "content": [{"text": prompt}]}],
        inferenceConfig={"maxTokens": 3000, "temperature": 0.2},
    )
    return resp["output"]["message"]["content"][0]["text"]


def handler(event, context):
    event = event or {}
    cluster_filter = event.get("cluster_id")
    job_id = event.get("job_id") or datetime.datetime.utcnow().strftime("%Y%m%d-%H%M%S")

    inventory = gather_inventory(cluster_filter)
    orphans = find_orphaned_snapshots()

    generated = datetime.datetime.utcnow().isoformat() + "Z"
    header = f"# Aurora MySQL Cost Optimization Report\n\n_Generated: {generated}_\n\n"
    if not inventory:
        report = header + "No Aurora MySQL clusters were found in this region."
    else:
        report = header + analyze_with_bedrock(inventory, orphans)

    prefix = f"reports/{job_id}"
    s3.put_object(
        Bucket=RESULTS_BUCKET,
        Key=f"{prefix}/report.md",
        Body=report.encode("utf-8"),
        ContentType="text/markdown",
    )
    s3.put_object(
        Bucket=RESULTS_BUCKET,
        Key=f"{prefix}/inventory.json",
        Body=json.dumps(
            {"inventory": inventory, "orphaned_snapshots": orphans}, default=str, indent=2
        ).encode("utf-8"),
        ContentType="application/json",
    )

    return {
        "job_id": job_id,
        "bucket": RESULTS_BUCKET,
        "report_key": f"{prefix}/report.md",
        "inventory_key": f"{prefix}/inventory.json",
        "clusters_analyzed": len(inventory),
        "orphaned_snapshots": len(orphans),
    }
