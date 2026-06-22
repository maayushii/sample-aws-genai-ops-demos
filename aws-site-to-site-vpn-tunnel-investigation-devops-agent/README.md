# AWS Site-to-Site VPN Tunnel Investigation with DevOps Agent — Deployment Notes

## What This Demo Does

Automated root-cause analysis for AWS Site-to-Site VPN tunnel failures using Amazon DevOps Agent. When a VPN tunnel goes down at 2 AM, instead of an on-call engineer manually sifting through CloudWatch metrics, VPN tunnel logs, and IPsec config — the DevOps Agent automatically investigates, identifies root cause, and enriches findings with business context (service dependencies, cost impact, compliance data) via an MCP server.

## Key Points
- **Duration**: ~25 minutes (Agent Space setup + infra deployment)
- **Cost**: ~$0.12/hr
- **10 failure scenarios**: 5 IKE + 3 BGP + 1 route withdrawal + 1 throughput degradation
- **Technologies**: AWS Site-to-Site VPN, CloudWatch, SNS, Lambda, CDK (Python), Libreswan, GoBGP, Amazon DevOps Agent, MCP

## Architecture
- **Network layer**: 2 VPCs (Cloud 10.0.0.0/16 ↔ On-Prem 172.16.0.0/16) connected via Site-to-Site VPN with 2 IPsec tunnels. CGW runs Libreswan + GoBGP on Amazon Linux 2023.
- **Monitoring layer**: 4 CloudWatch alarms (2 per-tunnel TunnelState, 1 throughput metric-math, 1 route-withdrawn log metric filter) → SNS → Lambda webhook → DevOps Agent
- **Intelligence layer**: DevOps Agent reads VPN logs, correlates metrics, queries MCP server for business context → produces incident report

## DevOps Agent Features Demonstrated
1. **Automated Investigation** — CloudWatch alarm → SNS → Lambda → DevOps Agent auto-triages
2. **MCP Integration** — Agent queries MCP server for service dependencies, cost impact, compliance
3. **On-demand Chat** — Use Operator App for follow-up questions
4. **Per-tunnel Monitoring** — Single tunnel failure triggers investigation
5. **Throughput Monitoring** — Detects performance degradation even when tunnels stay UP
6. **BGP Route Monitoring** — Detects route withdrawals that don't affect tunnel state

## Prerequisites
- AWS CLI v2.34.21+ with credentials configured
- Git
- Node.js 20+
- Python 3.9+
- EC2 key pair in target region
- bash 4+ and jq

## Deployment Steps (Quick Start)

### 1. Clone
```bash
git clone https://github.com/aws-samples/sample-aws-genai-ops-demos.git
cd sample-aws-genai-ops-demos/observability/aws-site-to-site-vpn-tunnel-investigation-devops-agent
```

### 2. Set up DevOps Agent
```bash
bash scripts/setup-devops-agent.sh
```
- Creates IAM roles (DevOpsAgentRole-AgentSpace + DevOpsAgentRole-WebappAdmin)
- Creates Agent Space `vpn-demo-agent-space`
- Associates AWS account
- Enables Operator App
- Pauses for you to create webhook in DevOps Agent console

### 3. Deploy MCP Server
```bash
REGION=$(aws configure get region)
export PYTHONPATH="$(cd ../.. && pwd)"
cd infrastructure/cdk
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
npx cdk bootstrap aws://$(aws sts get-caller-identity --query Account --output text)/$REGION --no-cli-pager
npx cdk deploy VpnDemoMcpServer-$REGION --require-approval never --no-cli-pager
cd ../..
```
Then get endpoint URL + API key and register in DevOps Agent console.

### 4. Deploy VPN Infrastructure
```bash
bash deploy-all.sh \
  --key-file ~/.ssh/vpn-demo-key.pem \
  --key-pair vpn-demo-key \
  --webhook-url 'https://your-webhook-url' \
  --webhook-secret 'your-webhook-secret'
```

## Running Scenarios
```bash
# Inject failure
bash scripts/inject-failure.sh psk-mismatch --key-file ~/.ssh/vpn-demo-key.pem

# Rollback
bash scripts/inject-failure.sh psk-mismatch --key-file ~/.ssh/vpn-demo-key.pem --rollback

# Check status
bash scripts/inject-failure.sh status --key-file ~/.ssh/vpn-demo-key.pem
```

## 10 Failure Scenarios

### IKE (5)
1. `psk-mismatch` — Pre-shared key mismatch
2. `dpd-timeout` — Dead peer detection timeout (blocked UDP 500/4500)
3. `proposal-mismatch` — Wrong DH group in IKE proposal
4. `traffic-selector` — CGW subnet change breaks BGP tunnel IPs
5. `tunnel-down` — CGW shuts down both tunnels

### BGP (3)
6. `bgp-down` — BGP daemon stopped
7. `bgp-asn-mismatch` — Wrong ASN configured
8. `bgp-hold-timer` — Blocked BGP keepalives (TCP 179)

### Dedicated-Alarm (2) — enable alarm before inject, disable after rollback
9. `bgp-route-withdraw` — CGW stops advertising a prefix
10. `throughput-degradation` — Packet loss causing throughput drop

## MCP Server Tools
| Tool | Input | Returns |
|------|-------|---------|
| get_service_dependencies | resource_id | Dependent services, criticality, on-call team, affected users (~12K) |
| get_cost_impact | resource_id, downtime_minutes | Revenue loss ($4,200/min), SLA breach status |
| get_compliance_status | resource_id | PCI-DSS (15 min reporting), SOC 2 Type II (60 min) |

## Cleanup
```bash
bash scripts/cleanup.sh $(aws configure get region)
```
Then manually delete: MCP server registration, Agent Space, IAM roles, key pair.

## Source
https://github.com/aws-samples/sample-aws-genai-ops-demos/tree/main/observability/aws-site-to-site-vpn-tunnel-investigation-devops-agent
