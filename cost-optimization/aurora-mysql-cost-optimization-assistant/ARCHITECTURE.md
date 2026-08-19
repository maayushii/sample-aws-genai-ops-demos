# Architecture — Aurora MySQL Cost Optimization Assistant

## Flow

```
  assess-aurora-cost.sh / .ps1
        │  (1) cdk deploy (once)          (2) lambda invoke {job_id, cluster_id?}
        ▼                                        │
  ┌──────────────────────────────┐               ▼
  │  AuroraCostStack-<region>    │        ┌────────────────────────────────┐
  │  • S3 results bucket         │◀───────│   aurora-cost-analyzer (Lambda) │
  │  • analyzer Lambda + role    │  write │                                 │
  └──────────────────────────────┘ report │  (3a) rds:Describe* (clusters,  │
        │                                  │       instances, snapshots)     │
        │ (4) aws s3 cp report locally     │  (3b) cloudwatch:GetMetric* 14d │
        ▼                                  │  (3c) bedrock:InvokeModel (Nova)│
  aurora-cost-report-<ts>/                 └────────────────────────────────┘
    report.md + inventory.json
```

1. **Deploy (once)** — `assess-aurora-cost.sh` runs the shared prerequisites check (`--required-service bedrock --require-cdk`) and the shared `deploy-cdk.sh` to create the stack.
2. **Invoke** — the script calls the analyzer Lambda with an optional `cluster_id` and a `job_id`.
3. **Analyze** — the Lambda:
   - **3a** enumerates Aurora MySQL clusters and their instances (`rds:DescribeDBClusters/DBInstances`) and finds orphaned manual snapshots (`rds:DescribeDBClusterSnapshots`) — all mechanical.
   - **3b** pulls 14-day CPU, connections, and freeable-memory statistics per instance from CloudWatch.
   - **3c** sends the structured inventory to **Amazon Bedrock Nova** (`converse`), which returns the Markdown findings — the judgment layer.
4. **Download** — the Lambda writes `report.md` + `inventory.json` to S3; the script copies them locally.

## Stack

Single CDK stack `AuroraCostStack-<region>` (`infrastructure/cdk/stack.py`), region from `shared.utils.get_region()`:

- `s3.Bucket` — results, `BLOCK_ALL` public access, SSL enforced, S3-managed encryption, `auto_delete_objects` for clean teardown.
- `lambda.Function` `aurora-cost-analyzer` — Python 3.12, 512 MB, 5-min timeout, code from `src/analyzer/`, env `RESULTS_BUCKET`.
- IAM role — least privilege: `rds:Describe*` (three read APIs), `cloudwatch:GetMetricStatistics/GetMetricData`, `pricing:GetProducts`, `bedrock:InvokeModel` scoped to `foundation-model/*`, plus bucket read/write.

## Design Notes & Well-Architected Alignment

- **Cost Optimization (the pillar this demo serves)**: the tool itself is nearly free — one short Lambda run and one Nova call per assessment; no always-on compute.
- **Security**: strictly read-only against data-plane-adjacent control APIs; no DB credentials; encrypted, private results bucket. Safe to run against production.
- **Operational Excellence**: one command; repeatable; `-s/--skip-setup` re-runs analysis without redeploying, fitting a recurring cost cadence.

### Fetch-vs-judge split
Per the library's steering, the Lambda gathers and structures the data deterministically (counts, metrics, orphaned-snapshot detection) and hands the *judgment* — right-sizing, Serverless v2, Graviton, RI candidacy — to Bedrock Nova rather than hardcoding heuristics. This keeps recommendations adaptable while the underlying numbers stay verifiable in `inventory.json`.

### Trade-offs
- Savings figures are model estimates with stated assumptions, not billing-accurate numbers. For committed decisions (RI/SP, I/O-Optimized vs Standard), confirm against Cost Explorer / the account's rate card — the report explicitly calls this out.
- The demo reasons from CloudWatch metrics (14 days). A production version could additionally pull Cost Explorer and the AWS Price List API for concrete dollar figures; the role and prompt are structured to make that a small extension.
