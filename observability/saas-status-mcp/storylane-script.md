# Storylane Script: SaaS Status MCP Server for AWS DevOps Agent

## Overview

| Field | Detail |
|-------|--------|
| **Total Slides** | 15 |
| **Duration** | ~10-12 minutes self-guided |
| **Scenario** | Application latency spike caused by upstream Snowflake incident |
| **Flow** | Problem → Architecture → Deploy → Alert → Investigation → Correlation → Resolution → Extensibility → CTA |
| **Key Message** | "Stop chasing internal ghosts — give DevOps Agent eyes on upstream SaaS health" |

---

## Slide 1: Title / Hook

**Screen:** Hero slide with demo title and key metrics badge.

**Script:**
"Your app is slow. Your team spends 25 minutes digging through pods, logs, databases — everything is fine. Then someone checks status.snowflake.com..."

**Callout:**
`25 min → 2 min | 28 SaaS providers | $2-5/month | Zero API keys`

---

## Slide 2: The Problem

**Screen:** Split view — left side shows DevOps Agent visibility (VPC, ECS, RDS, Lambda), right side shows a blind spot with external SaaS logos grayed out.

**Script:**
"DevOps Agent sees inside AWS — your containers, databases, queues, functions. But it can't see outside. When upstream SaaS providers degrade, operators waste 15-30 minutes on internal deep-dives before anyone thinks to check an external status page. That's the gap."

**Callout:**
`15-30 min wasted per incident when root cause is external`

---

## Slide 3: Architecture

**Screen:** Architecture diagram with components and data flow.

**Script:**
"The solution is an MCP server that gives DevOps Agent real-time visibility into upstream SaaS health. It queries public Statuspage.io APIs — no API keys, no authentication, no vendor contracts."

```
┌─────────────────┐     ┌──────────────────────────┐     ┌─────────────────────┐
│  DevOps Agent   │────▶│  AgentCore Runtime (MCP) │────▶│  Statuspage.io APIs │
│  (Orchestrator) │     │  saas-status-mcp server  │     │  (28+ providers)    │
└─────────────────┘     └──────────────────────────┘     └─────────────────────┘
                                    │
                                    ▼
                        ┌──────────────────────┐
                        │  S3: providers.json  │
                        │  (registry config)   │
                        └──────────────────────┘
```

**Callout:**
- DevOps Agent: Orchestrates investigation, calls MCP tools
- AgentCore Runtime: Hosts MCP server with 4 tools
- Statuspage.io APIs: Public, free, no auth required
- S3 providers.json: Customizable provider registry

---

## Slide 4: The 4 MCP Tools

**Screen:** Table showing available tools.

**Script:**
"The MCP server exposes four tools. The agent decides which to call based on context — it might check all dependencies first, then drill into active events for any degraded provider."

| Tool | Purpose | When Agent Uses It |
|------|---------|-------------------|
| `list_providers` | Show all monitored SaaS providers | Discovery, initial setup |
| `get_service_status` | Get status for a specific provider | Targeted investigation |
| `get_active_events` | Get incident details with timeline | Deep-dive after detecting degradation |
| `check_all_dependencies` | Check all providers in one call | Broad sweep during incident triage |

**Callout:**
`4 tools — agent autonomously decides which to invoke based on investigation context`

---

## Slide 5: One-Command Deployment

**Screen:** Terminal showing deployment output.

**Script:**
"Deployment is a single command. It provisions the Lambda function, S3 bucket for the provider registry, IAM roles, and registers the MCP server with AgentCore — all in about 8 minutes."

```
$ ./deploy-all.sh

[1/4] Checking prerequisites... ✓ AWS CLI 2.31+, CDK 2.x, Python 3.9+
[2/4] Deploying CDK stack... SaaSStatusMcp-us-east-1
[3/4] Uploading providers.json to S3... 28 providers configured
[4/4] Registering MCP server with AgentCore...

========================================
  Deployment Complete!
========================================
  MCP Server ARN:  arn:aws:agentcore:us-east-1:123456789012:mcp-server/saas-status
  Runtime Endpoint: https://mcp.agentcore.us-east-1.amazonaws.com/saas-status
  Providers:        28 SaaS services monitored
  Region:           us-east-1
========================================
```

**Callout:**
`Single command | ~8 min deploy | Zero API keys required`

---

## Slide 6: DevOps Agent Registration

**Screen:** Terminal showing agent setup script output.

**Script:**
"Next, we register the MCP server with DevOps Agent so it can call these tools during investigations. One script, supports cross-region if your agent is in a different region."

```
$ ./setup-devops-agent.sh

Registering saas-status-mcp with DevOps Agent...
  Agent Region: us-west-2
  MCP Server Region: us-east-1
  Cross-region: enabled ✓

DevOps Agent configuration updated.
MCP tools now available:
  ✓ list_providers
  ✓ get_service_status
  ✓ get_active_events
  ✓ check_all_dependencies

Agent ready to investigate external dependencies.
```

**Callout:**
`Cross-region support — agent in us-west-2 can call MCP server in us-east-1`

---

## Slide 7: The Alert Fires

**Screen:** CloudWatch alarm dashboard showing latency spike.

**Script:**
"It's Tuesday at 2:47 PM. A CloudWatch alarm fires — API latency has spiked from a baseline of 200ms to over 8 seconds, breaching the 5-second threshold."

```
ALARM: APILatencyHigh
  Metric: p99 Latency
  Baseline: 200ms
  Current:  8,247ms ⚠️
  Threshold: 5,000ms
  Duration: 3 consecutive datapoints
  Time: 2025-03-18T14:47:00Z
```

**Callout:**
`p99 latency: 200ms → 8,247ms | Alarm triggered at 14:47 UTC`

---

## Slide 8: DevOps Agent Opens Investigation

**Screen:** DevOps Agent investigation console showing the agent beginning its work.

**Script:**
"DevOps Agent picks up the alarm automatically and opens an investigation. It starts with internal infrastructure — checking ECS task health, RDS connections, Lambda errors."

```
╔══════════════════════════════════════════════╗
║  DevOps Agent — Investigation Started        ║
╠══════════════════════════════════════════════╣
║  Trigger: CloudWatch Alarm APILatencyHigh    ║
║  Time:    2025-03-18T14:47:12Z               ║
║                                              ║
║  Step 1: Checking ECS service health... ✓    ║
║  Step 2: Checking RDS connections... ✓       ║
║  Step 3: Checking Lambda errors... ✓         ║
║  Step 4: Checking SQS queue depth... ✓       ║
║                                              ║
║  Internal infrastructure: ALL HEALTHY        ║
║  Proceeding to external dependency check...  ║
╚══════════════════════════════════════════════╝
```

**Callout:**
`All internal checks pass — agent escalates to external dependency check`

---

## Slide 9: Agent Calls check_all_dependencies

**Screen:** MCP tool invocation showing the agent's reasoning and the tool call.

**Script:**
"Internal infrastructure is healthy, so the agent reasons that the issue may be external. It calls `check_all_dependencies` with the providers relevant to this application — Snowflake for the data warehouse and Datadog for monitoring."

```
Agent Reasoning:
  "Internal infrastructure is healthy. The API queries Snowflake for 
   analytics data and reports to Datadog. Let me check external 
   dependency status."

Tool Call: check_all_dependencies
Parameters:
  providers: ["snowflake", "datadog"]
```

**Callout:**
`Agent autonomously decides to check external dependencies after ruling out internal causes`

---

## Slide 10: check_all_dependencies Response

**Screen:** JSON response from the MCP tool.

**Script:**
"The response comes back in under 2 seconds. Snowflake is showing degraded performance with one active event. Datadog is operational. The `any_degraded` flag immediately tells the agent there's an external issue."

```json
{
  "results": {
    "snowflake": {
      "status": "degraded_performance",
      "description": "Partially Degraded Service",
      "active_events": 1,
      "last_checked": "2025-03-18T14:47:15Z"
    },
    "datadog": {
      "status": "operational",
      "description": "All Systems Operational",
      "active_events": 0,
      "last_checked": "2025-03-18T14:47:15Z"
    }
  },
  "summary": {
    "total_checked": 2,
    "degraded": ["snowflake"],
    "any_degraded": true
  }
}
```

**Callout:**
`Snowflake: degraded_performance | Datadog: operational | Response time: <2 sec`

---

## Slide 11: Agent Drills Into Active Events

**Screen:** Follow-up tool call and detailed incident response.

**Script:**
"The agent follows up by calling `get_active_events` for Snowflake to get incident details — when it started, what's affected, and the latest update from Snowflake's team."

```
Tool Call: get_active_events
Parameters:
  provider: "snowflake"

Response:
{
  "provider": "snowflake",
  "active_events": [
    {
      "id": "incident-2025-0318-1430",
      "title": "Increased Query Latency — US Regions",
      "status": "investigating",
      "severity": "major",
      "started_at": "2025-03-18T14:30:00Z",
      "affected_components": [
        "Query Processing — US East",
        "Query Processing — US West"
      ],
      "latest_update": {
        "timestamp": "2025-03-18T14:42:00Z",
        "body": "We are investigating reports of increased query latency 
                 affecting US regions. Our engineering team is actively 
                 working on mitigation."
      }
    }
  ]
}
```

**Callout:**
`Major incident | Started 14:30 UTC | Affecting US East & West query processing`

---

## Slide 12: The Verdict

**Screen:** DevOps Agent's final investigation summary.

**Script:**
"The agent correlates the timeline — Snowflake's incident started at 14:30, our latency spiked at 14:47. Internal infrastructure is healthy. Root cause identified: upstream Snowflake degradation. Total time to root cause: 1 minute 47 seconds."

```
╔══════════════════════════════════════════════════════════╗
║  Investigation Complete                                  ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Root Cause: Upstream Snowflake incident                 ║
║  Incident:   Increased Query Latency — US Regions        ║
║  Severity:   Major                                       ║
║  Status:     Investigating (Snowflake engineering)       ║
║                                                          ║
║  Timeline:                                               ║
║    14:30 — Snowflake incident begins                     ║
║    14:47 — Our API latency alarm fires                   ║
║    14:47 — Agent investigation starts                    ║
║    14:48 — Root cause identified ✓                       ║
║                                                          ║
║  Internal Infrastructure: ALL HEALTHY                    ║
║  Action: Monitor Snowflake status page for resolution    ║
║                                                          ║
║  Time to Root Cause: 1 min 47 sec                        ║
╚══════════════════════════════════════════════════════════╝
```

**Callout:**
`1 min 47 sec to root cause | Zero wasted internal investigation | Automated correlation`

---

## Slide 13: Provider Registry Customization

**Screen:** providers.json file and refresh command.

**Script:**
"Adding a new provider is one line of JSON. Run the refresh script, it pushes to S3, and the MCP server picks it up within 60 seconds. No redeploy, no downtime."

```json
// providers.json — add a new provider
{
  "providers": {
    "snowflake": { "page_id": "sfc5ykbkvhkb", "name": "Snowflake" },
    "datadog":   { "page_id": "4yp34gdqln2y", "name": "Datadog" },
    "stripe":    { "page_id": "t56d1yr9hqpj", "name": "Stripe" },
    "twilio":    { "page_id": "gpkpyklzq55q", "name": "Twilio" },
    "newrelic":  { "page_id": "pjg0g2hm3yyy", "name": "New Relic" }  // ← added
  }
}
```

```
$ ./refresh-providers.sh

Uploading providers.json to S3...
  New provider count: 29 (was 28)
  Added: newrelic
  Live in: ~60 seconds (no redeploy needed)

Done ✓
```

**Callout:**
`Add provider = 1 JSON line | No redeploy | Live in 60 seconds`

---

## Slide 14: Business Value — Before / After

**Screen:** Comparison table showing operational improvement.

**Script:**
"The business impact is clear. What used to take 25 minutes of engineer time — checking pods, databases, network — now takes under 2 minutes with automated external correlation."

| Metric | Before | After |
|--------|--------|-------|
| Time to identify external root cause | 25 min (manual) | < 2 min (automated) |
| Wasted internal investigations | 3-5 per week | 0 |
| SaaS providers monitored | 0 (ad-hoc checking) | 28+ (continuous) |
| Monthly cost | Engineer time (~$200/incident) | $2-5/month (Lambda + S3) |
| API keys / vendor contracts required | Varies | Zero |
| Setup time | N/A | 10 minutes |

**Callout:**
`25 min → <2 min | $2-5/month | Zero API keys | 28+ providers out of the box`

---

## Slide 15: Call to Action

**Screen:** Clean CTA slide with three paths.

**Script:**
"Ready to give your DevOps Agent eyes on external dependencies? Deploy in 10 minutes, customize the provider list for your stack, or explore the code on GitHub."

| Action | Command / Link |
|--------|---------------|
| **Deploy** | `./deploy-all.sh` — 10 minutes, single command |
| **Customize** | Edit `providers.json` — add your SaaS dependencies |
| **Learn More** | [GitHub: sample-genai-ops-demos/observability/saas-status-mcp](https://github.com/aws-samples/sample-genai-ops-demos/tree/main/observability/saas-status-mcp) |

**Callout:**
`10 min to deploy | Your providers, your rules | Open source`

---

## Capture Tips for Storylane

1. **Terminal slides (5, 6, 7, 8, 9, 10, 11, 12, 13):** Use a dark terminal theme with syntax highlighting. Pre-render the output — don't capture live deployments.
2. **Architecture slide (3):** Use a clean diagram tool (draw.io, Excalidraw) with AWS icon set.
3. **Comparison slide (14):** Use a clean table layout with green/red color coding for before/after.
4. **Hotspots:** Add interactive hotspots on architecture components, tool names, and JSON fields.
5. **Transitions:** Use fade transitions between investigation steps (7-12) to create narrative flow.
6. **Annotations:** Add numbered annotations on the architecture diagram matching the data flow.

---

## Hotspot Suggestions

| Slide | Element | Hotspot Action |
|-------|---------|---------------|
| 3 | AgentCore Runtime box | Tooltip: "Serverless MCP hosting — scales to zero, no infrastructure to manage" |
| 3 | S3 providers.json | Tooltip: "Hot-reloadable config — add providers without redeployment" |
| 4 | check_all_dependencies | Tooltip: "Most common tool — agent uses this for broad triage sweeps" |
| 5 | deploy-all.sh | Tooltip: "Single command deploys Lambda, S3, IAM, and AgentCore registration" |
| 10 | any_degraded: true | Tooltip: "This flag triggers the agent to drill deeper into affected providers" |
| 11 | affected_components | Tooltip: "Component-level detail helps correlate with specific application queries" |
| 12 | Time to Root Cause | Tooltip: "Compare to 25+ min manual process — 93% reduction" |
| 13 | refresh-providers.sh | Tooltip: "Operational simplicity — no CDK redeploy for config changes" |
| 14 | $2-5/month | Tooltip: "Lambda invocations + S3 storage — effectively free at typical investigation volumes" |

---

## Demo Narrative Arc

1. **Pain** (Slides 1-2): Establish the problem — blind spot in external visibility
2. **Solution** (Slides 3-4): Show the architecture and capabilities
3. **Deploy** (Slides 5-6): Prove it's easy to set up
4. **Live Demo** (Slides 7-12): Walk through a real incident investigation
5. **Extend** (Slide 13): Show customization is trivial
6. **Value** (Slide 14): Quantify the business impact
7. **CTA** (Slide 15): Clear next steps for the audience
