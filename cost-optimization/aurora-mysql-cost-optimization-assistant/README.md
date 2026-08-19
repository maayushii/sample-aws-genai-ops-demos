# AI-Powered Aurora MySQL Cost Optimization Assistant
*Point it at your account and get a prioritized, evidence-backed Aurora MySQL savings report in under two minutes — no spreadsheets, no guesswork.*

## Overview

A read-only assistant that discovers your Amazon Aurora MySQL clusters, pulls 14 days of CloudWatch utilization, and uses **Amazon Bedrock (Nova)** to produce an actionable cost-optimization report: right-sizing, Aurora Serverless v2 candidacy, Graviton migration, I/O-Optimized vs Standard storage, idle/over-provisioned clusters, Reserved Instance opportunities, and orphaned snapshots. The mechanical data-gathering is done in code; the judgment (what to change and why) is done by the model, grounded in the metrics.

## At a Glance
- **Duration**: ~10 minutes (one-time CDK deploy ~2 min; each analysis run 30-90s)
- **Difficulty**: Beginner–Intermediate
- **Target Audience**: TAMs, DBREs, FinOps, Cloud Operations
- **Key Technologies**: Amazon Aurora MySQL, Amazon Bedrock (Nova), AWS Lambda, CloudWatch, S3, CDK (Python)
- **Estimated Cost**: A few cents per run (one Bedrock Nova call + a short Lambda invocation). The S3 bucket and Lambda are effectively free at rest; delete the stack to zero it out.

## Business Value

Aurora cost reviews are usually manual: someone exports CloudWatch, eyeballs instance classes, and argues about Serverless v2 vs provisioned. This assistant turns that into a repeatable one-command report grounded in real utilization — ideal for a recurring TAM cost cadence or a FinOps review. It reads only (`Describe*` + `GetMetric*`), so it is safe to run against production.

## What You'll See

1. One command deploys a small analyzer (Lambda + S3) and runs it.
2. The analyzer inventories every Aurora MySQL cluster + instance and its 14-day CPU, connections, and memory profile.
3. Amazon Bedrock Nova reasons over the data and writes a Markdown report with a top-3 prioritized list, per-finding severity, estimated monthly savings ranges, and effort.
4. The report + raw inventory JSON are saved to S3 and downloaded locally.

## Prerequisites
- AWS CLI v2.31+ configured with credentials
- Node.js 20+ and Python 3.10+ (for CDK)
- `jq` (bash flow) — preinstalled on most systems
- Amazon Bedrock access with the **Amazon Nova Lite** model enabled in the target region
- At least one Aurora MySQL cluster to analyze (e.g. the one from the Aurora Incident Investigation demo)

## Deployment & Run (Quick Start)
```bash
# macOS / Linux — deploy once, then analyze all Aurora MySQL clusters in the region
bash assess-aurora-cost.sh

# Analyze a single cluster
bash assess-aurora-cost.sh -c my-aurora-cluster

# Re-run analysis without redeploying
bash assess-aurora-cost.sh -s
```
```powershell
# Windows
./assess-aurora-cost.ps1
./assess-aurora-cost.ps1 -ClusterId my-aurora-cluster
./assess-aurora-cost.ps1 -SkipSetup
```
The report is written to `aurora-cost-report-<timestamp>/report.md` locally and to `s3://<results-bucket>/reports/<timestamp>/`.

## What the Report Covers

| Finding category | How it's derived |
|------------------|------------------|
| Right-sizing | Low 14-day CPU / connections vs instance class |
| Aurora Serverless v2 candidacy | Low-average or spiky utilization patterns |
| Graviton migration | Non-Graviton classes (db.t3/db.r5/db.r6i → db.t4g/db.r7g) |
| I/O-Optimized vs Standard | Flags a billing/CUR review to pick the cheaper storage mode |
| Idle / over-provisioned | Very low utilization, unused readers |
| Reserved Instances / Savings Plans | Steady-state instances suitable for commitment |
| Orphaned snapshots | Manual cluster snapshots with no surviving source cluster (mechanical check) |

Dollar figures are model-estimated ranges with stated assumptions — treat them as directional and confirm against Cost Explorer / your rate card before acting.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md). A single CDK stack deploys an S3 results bucket and an analyzer Lambda with a least-privilege, read-only role (`rds:Describe*`, `cloudwatch:GetMetric*`, `pricing:GetProducts`, `bedrock:InvokeModel`). The assess script invokes the Lambda and downloads the report.

## Cost & Cleanup
```bash
cd infrastructure/cdk
export PYTHONPATH="$(cd ../.. && pwd)"
npx cdk destroy "AuroraCostStack-$(aws configure get region)" --force
```

## Security Notes

- The analyzer is **read-only** against RDS and CloudWatch — it never modifies databases.
- The results S3 bucket blocks public access, enforces SSL, and is encrypted with S3-managed keys.
- No database credentials are used or stored; discovery is entirely control-plane (`Describe*`) plus CloudWatch metrics.

## Contributing

We welcome community contributions! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## Security

See [CONTRIBUTING](../../CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the [LICENSE](../../LICENSE) file.
