# AI Incident Response Playbook Builder — Deployment Notes

## What This Demo Does

Point this tool at any AWS account and get tailored incident response playbooks in minutes — with step-by-step containment, eradication, and recovery procedures mapped to MITRE ATT&CK techniques and ready to execute as SSM Automation documents.

Instead of spending weeks writing generic playbooks that don't reflect your actual architecture, this tool scans your account (read-only), identifies your specific threat surface, and generates 6-12 custom playbooks automatically.

## Key Points
- **Duration**: ~2-8 minutes (depending on account complexity)
- **Cost**: ~$0.50-$2.00 per run (Bedrock API calls only)
- **Infrastructure**: Just 1 S3 bucket — no compute, no Lambda, no persistent services
- **Output**: 6-12 tailored playbooks + SSM Automation documents + MITRE ATT&CK coverage matrix
- **Technologies**: Amazon Bedrock (Claude), AWS CDK, Systems Manager, S3

## How It Works
1. **Discover** — Scans your AWS account (read-only) to build an architecture profile: VPCs, subnets, public endpoints, IAM roles, S3 buckets, databases, compute resources
2. **Analyze & Generate** — Sends the architecture profile to Amazon Bedrock, which identifies the most likely threat scenarios and generates tailored playbooks
3. **Output** — Writes SSM Automation documents (JSON) and markdown playbooks to S3 + local directory, with a MITRE ATT&CK coverage matrix

## Example Outputs
- `playbooks/credential-compromise.md` — Compromised IAM credentials response
- `playbooks/data-exfiltration-s3.md` — S3 data exfiltration containment
- `playbooks/cryptomining.md` — Crypto mining detection and eradication
- `playbooks/ransomware.md` — Ransomware containment and recovery
- `ssm-documents/credential-compromise.json` — Automated credential rotation
- `ssm-documents/isolate-instance.json` — EC2 isolation with forensic snapshot
- `reports/architecture-profile.md` — Discovered architecture summary
- `reports/attack-coverage-matrix.md` — MITRE ATT&CK technique coverage map

## Architecture
```
AWS Account (read-only) → Discovery Module → Bedrock (Claude) → S3 Bucket
       │                        │                    │              │
  EC2, VPC, IAM,          Architecture          Threat analysis,  playbooks/*.md
  S3, RDS, Lambda,         Profile              playbook gen      ssm-documents/*.json
  ECS, EKS, ELB,                                                  reports/
  API Gateway
```

## Prerequisites
- AWS CLI 2.31.13+ with configured credentials
- Python 3.10+ and Node.js 20+ (for CDK)
- Amazon Bedrock access with Claude model enabled
- Read-only permissions across discovery services + `bedrock:InvokeModel`

## Deployment (Quick Start)

```bash
# Clone the repo
git clone https://github.com/aws-samples/sample-aws-genai-ops-demos.git
cd sample-aws-genai-ops-demos/security/ai-incident-response-playbook-builder

# Run it
./build-playbooks.sh

# With options
./build-playbooks.sh --output-format both --model-id us.anthropic.claude-sonnet-4-20250514-v1:0
```

The script automatically:
1. ✅ Validates prerequisites (AWS CLI, Python, Node.js, credentials, Bedrock access)
2. 🚀 Deploys S3 bucket via CDK
3. 🔍 Discovers your AWS architecture (read-only API calls)
4. 🤖 Generates tailored playbooks via Amazon Bedrock
5. 📤 Uploads playbooks to S3 + saves locally to `./output/`

## Compliance Value
Generated playbooks support evidence requirements for:
- SOC 2 (CC7.4, CC7.5) — Defined response activities
- PCI-DSS (Req 12.10) — Incident response plan
- HIPAA (§164.308(a)(6)) — Security incident procedures
- FedRAMP (IR family) — IR planning and testing

## Cleanup
```bash
cd infrastructure/cdk
npx cdk destroy --no-cli-pager
```

## Source
https://github.com/aws-samples/sample-aws-genai-ops-demos/tree/main/security/ai-incident-response-playbook-builder
