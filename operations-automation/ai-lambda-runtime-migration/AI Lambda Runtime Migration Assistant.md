# AI Lambda Runtime Migration Demo — Context & State

## Deployment Info

- **Account**: 746417228652
- **Region**: us-east-1
- **Dashboard URL**: https://d11u421etave1t.cloudfront.net
- **Login**: maayushi@amazon.com / DemoPass123!
- **Deployed**: March 30, 2026

## CloudFormation Stacks (all CREATE_COMPLETE)

| Stack | Status |
|-------|--------|
| LambdaRuntimeMigrationData-us-east-1 | DynamoDB table (`lambda-runtime-migration`) + S3 bucket (`lambda-migration-746417228652-us-east-1`) |
| LambdaRuntimeMigrationAuth-us-east-1 | Cognito User Pool (`us-east-1_ld3VF77vk`), Client (`2956rk2p4vbtpftgvke0puoakl`), Identity Pool (`us-east-1:8c83627f-6879-46d1-a620-fb3849e19b37`) |
| LambdaRuntimeMigrationRuntime-us-east-1 | 3 AgentCore Runtimes (discover, analyze, transform) |
| LambdaRuntimeMigrationFrontend-us-east-1 | CloudFront + S3 website |

## AgentCore Runtime ARNs

- Discover: `arn:aws:bedrock-agentcore:us-east-1:746417228652:runtime/lambdaruntime_discover-S4wdN2G0au`
- Analyze: `arn:aws:bedrock-agentcore:us-east-1:746417228652:runtime/lambdaruntime_analyze-vQM05oHnop`
- Transform: `arn:aws:bedrock-agentcore:us-east-1:746417228652:runtime/lambdaruntime_transform-ohx8e93Z5o`

## Known Limitation: No Trusted Advisor Access

This account does NOT have AWS Business/Enterprise Support, so the Trusted Advisor API (`L4dfs2Q4C5`) returns `SubscriptionRequiredException`. 

**DO NOT click "Scan"** on the dashboard — it calls the Discover agent which hits Trusted Advisor, gets nothing back, and marks ALL existing records as RESOLVED (Green) due to the diff-based logic.

Use "Refresh" button only — it reads from DynamoDB without calling TA.

## Seeded Demo Data (12 functions in DynamoDB)

All data was manually seeded into the `lambda-runtime-migration` DynamoDB table. Dates are accurate for March 2026.

| Function | Runtime | Deprecation Date | Days Past | Alert | Status | Priority | Complexity |
|----------|---------|-----------------|-----------|-------|--------|----------|------------|
| payment-webhook-handler | nodejs16.x | 2024-06-12 | -657 | Red | ASSESSED | CRITICAL (95) | HIGH |
| order-processing-service | python3.8 | 2024-10-14 | -533 | Red | READY_TO_MIGRATE | CRITICAL (92) | MEDIUM |
| user-auth-validator | python3.9 | 2026-02-28 | -30 | Red | ASSESSED | HIGH (78) | MEDIUM |
| email-notification-sender | python3.8 | 2024-10-14 | -533 | Red | READY_TO_MIGRATE | HIGH (72) | LOW |
| image-resize-processor | python3.8 | 2024-10-14 | -533 | Red | TRANSFORM_FAILED | HIGH (68) | HIGH |
| inventory-sync-worker | python3.8 | 2024-10-14 | -533 | Red | ASSESSED | HIGH (65) | HIGH |
| data-pipeline-etl | python3.8 | 2024-10-14 | -533 | Red | ASSESSED | MEDIUM (55) | HIGH |
| health-check-monitor | python3.9 | 2026-02-28 | -30 | Red | ASSESSED | MEDIUM (42) | LOW |
| legacy-report-generator | python3.8 | 2024-10-14 | -533 | Red | ASSESSED | LOW (25) | MEDIUM |
| scheduled-cleanup-job | python3.9 | 2026-02-28 | -30 | Yellow | ASSESSED | INACTIVE (15) | LOW |
| ml-inference-container | python3.8 | 2024-10-14 | -533 | Red | SKIPPED | INACTIVE (0) | — |
| api-rate-limiter | nodejs16.x | 2024-06-12 | -657 | Green | RESOLVED | INACTIVE (0) | — |

## DynamoDB Schema Notes

The frontend Dashboard reads these top-level fields:
- `migration_complexity` — top-level field (LOW/MEDIUM/HIGH) used by the Complexity Breakdown widget and bar chart
- `migration_status` — used by Migration Status widget
- `runtime` — used by Runtime Distribution pie chart
- `alert_status` — used by Deprecation Timeline scatter chart
- `priority_score` / `priority_label` — used by Migration Plan page

The `assessment` field is a nested map with `complexity`, `target_runtime`, `deprecated_apis`, `breaking_changes`, `dependency_issues`, `summary`, `migration_risks` — used by the Function Detail page's Assessment tab.

Both `migration_complexity` (top-level) AND `assessment.complexity` (nested) must be set for full dashboard coverage.

## Dashboard Widget Summary (what you should see)

- **Total Functions**: 12
- **Runtime Distribution**: python3.8 (7), python3.9 (3), nodejs16.x (2)
- **Migration Status**: ASSESSED (7), READY_TO_MIGRATE (2), TRANSFORM_FAILED (1), SKIPPED (1), RESOLVED (1)
- **Complexity Breakdown**: HIGH (4), MEDIUM (3), LOW (3)
- **Deprecation Timeline**: scatter chart with Red/Yellow dots at 2024-06-12, 2024-10-14, 2026-02-28

## Resetting Data If Scan Wipes It

If someone accidentally clicks Scan and everything goes RESOLVED, run this to restore all statuses:

```bash
# Restore all migration statuses and alert statuses
aws dynamodb update-item --table-name lambda-runtime-migration --region us-east-1 --key '{"function_arn":{"S":"arn:aws:lambda:us-east-1:746417228652:function:order-processing-service"}}' --update-expression 'SET migration_status = :s, alert_status = :a, priority_score = :p, priority_label = :l' --expression-attribute-values '{ ":s":{"S":"READY_TO_MIGRATE"},":a":{"S":"Red"},":p":{"N":"92"},":l":{"S":"CRITICAL"}}'

aws dynamodb update-item --table-name lambda-runtime-migration --region us-east-1 --key '{"function_arn":{"S":"arn:aws:lambda:us-east-1:746417228652:function:payment-webhook-handler"}}' --update-expression 'SET migration_status = :s, alert_status = :a, priority_score = :p, priority_label = :l' --expression-attribute-values '{ ":s":{"S":"ASSESSED"},":a":{"S":"Red"},":p":{"N":"95"},":l":{"S":"CRITICAL"}}'

aws dynamodb update-item --table-name lambda-runtime-migration --region us-east-1 --key '{"function_arn":{"S":"arn:aws:lambda:us-east-1:746417228652:function:user-auth-validator"}}' --update-expression 'SET migration_status = :s, alert_status = :a, priority_score = :p, priority_label = :l' --expression-attribute-values '{ ":s":{"S":"ASSESSED"},":a":{"S":"Red"},":p":{"N":"78"},":l":{"S":"HIGH"}}'

aws dynamodb update-item --table-name lambda-runtime-migration --region us-east-1 --key '{"function_arn":{"S":"arn:aws:lambda:us-east-1:746417228652:function:email-notification-sender"}}' --update-expression 'SET migration_status = :s, alert_status = :a, priority_score = :p, priority_label = :l' --expression-attribute-values '{ ":s":{"S":"READY_TO_MIGRATE"},":a":{"S":"Red"},":p":{"N":"72"},":l":{"S":"HIGH"}}'

aws dynamodb update-item --table-name lambda-runtime-migration --region us-east-1 --key '{"function_arn":{"S":"arn:aws:lambda:us-east-1:746417228652:function:image-resize-processor"}}' --update-expression 'SET migration_status = :s, alert_status = :a, priority_score = :p, priority_label = :l' --expression-attribute-values '{ ":s":{"S":"TRANSFORM_FAILED"},":a":{"S":"Red"},":p":{"N":"68"},":l":{"S":"HIGH"}}'

aws dynamodb update-item --table-name lambda-runtime-migration --region us-east-1 --key '{"function_arn":{"S":"arn:aws:lambda:us-east-1:746417228652:function:inventory-sync-worker"}}' --update-expression 'SET migration_status = :s, alert_status = :a, priority_score = :p, priority_label = :l' --expression-attribute-values '{ ":s":{"S":"ASSESSED"},":a":{"S":"Red"},":p":{"N":"65"},":l":{"S":"HIGH"}}'

aws dynamodb update-item --table-name lambda-runtime-migration --region us-east-1 --key '{"function_arn":{"S":"arn:aws:lambda:us-east-1:746417228652:function:data-pipeline-etl"}}' --update-expression 'SET migration_status = :s, alert_status = :a, priority_score = :p, priority_label = :l' --expression-attribute-values '{ ":s":{"S":"ASSESSED"},":a":{"S":"Red"},":p":{"N":"55"},":l":{"S":"MEDIUM"}}'

aws dynamodb update-item --table-name lambda-runtime-migration --region us-east-1 --key '{"function_arn":{"S":"arn:aws:lambda:us-east-1:746417228652:function:health-check-monitor"}}' --update-expression 'SET migration_status = :s, alert_status = :a, priority_score = :p, priority_label = :l' --expression-attribute-values '{ ":s":{"S":"ASSESSED"},":a":{"S":"Red"},":p":{"N":"42"},":l":{"S":"MEDIUM"}}'

aws dynamodb update-item --table-name lambda-runtime-migration --region us-east-1 --key '{"function_arn":{"S":"arn:aws:lambda:us-east-1:746417228652:function:legacy-report-generator"}}' --update-expression 'SET migration_status = :s, alert_status = :a, priority_score = :p, priority_label = :l' --expression-attribute-values '{ ":s":{"S":"ASSESSED"},":a":{"S":"Red"},":p":{"N":"25"},":l":{"S":"LOW"}}'

aws dynamodb update-item --table-name lambda-runtime-migration --region us-east-1 --key '{"function_arn":{"S":"arn:aws:lambda:us-east-1:746417228652:function:scheduled-cleanup-job"}}' --update-expression 'SET migration_status = :s, alert_status = :a, priority_score = :p, priority_label = :l' --expression-attribute-values '{ ":s":{"S":"ASSESSED"},":a":{"S":"Yellow"},":p":{"N":"15"},":l":{"S":"INACTIVE"}}'

aws dynamodb update-item --table-name lambda-runtime-migration --region us-east-1 --key '{"function_arn":{"S":"arn:aws:lambda:us-east-1:746417228652:function:ml-inference-container"}}' --update-expression 'SET migration_status = :s, alert_status = :a, priority_score = :p, priority_label = :l' --expression-attribute-values '{ ":s":{"S":"SKIPPED"},":a":{"S":"Red"},":p":{"N":"0"},":l":{"S":"INACTIVE"}}'
```

## Cleanup

```bash
cd operations-automation/ai-lambda-runtime-migration/cdk
npx cdk destroy "LambdaRuntimeMigrationFrontend-us-east-1" --no-cli-pager --force
npx cdk destroy "LambdaRuntimeMigrationRuntime-us-east-1" --no-cli-pager --force
npx cdk destroy "LambdaRuntimeMigrationAuth-us-east-1" --no-cli-pager --force
npx cdk destroy "LambdaRuntimeMigrationData-us-east-1" --no-cli-pager --force
```
