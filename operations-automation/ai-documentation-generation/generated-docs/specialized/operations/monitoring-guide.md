# Monitoring Guide

> **Navigation:** [← Deployment](deployment-guide.md) | [Troubleshooting →](troubleshooting-guide.md)

## CloudWatch Log Groups

| Log Group | Function | Retention | Key Signals |
|-----------|----------|-----------|-------------|
| InvoiceFunctionLogGroup | Invoice | 2 weeks | Invoice creation, address derivation |
| InvoiceManagementFunctionLogGroup | Management | 2 weeks | CRUD operations, status transitions |
| WatcherFunctionLogGroup | Watcher | 2 weeks | Payment detection, balance checks |
| SweeperFunctionLogGroup | Sweeper | 1 month | Fund transfers, gas estimation, errors |
| ApiGatewayAccessLogs | API Gateway | 2 weeks | Request volume, latency, error rates |

## Key Metrics to Watch

### Lambda Metrics
- **Duration:** Sweeper can run up to 15 minutes — monitor for approaching timeout
- **Errors:** Any sweeper error could mean stuck funds
- **Throttles:** Sweeper has concurrency=1 — throttles indicate queue buildup
- **ConcurrentExecutions:** Monitor watcher for scaling issues with many pending invoices

### DynamoDB Metrics
- **ConsumedReadCapacityUnits:** Watcher queries all pending invoices every minute
- **ThrottledRequests:** Should be zero with PAY_PER_REQUEST
- **StreamRecordsCount:** Indicates sweeper trigger volume

### API Gateway Metrics
- **4XXError / 5XXError:** Track error rates
- **Latency:** Invoice creation involves Secrets Manager + DynamoDB calls
- **Count:** Track usage against 10K/month quota

## SNS Alerting
- **Payment notifications:** Subscribe to merchant payment topic
- **Sweeper errors:** Error alerts include CloudWatch log group reference
- **Recommended:** Create alarms for Lambda errors, especially sweeper

## Dashboard Recommendations
Create CloudWatch dashboard with:
1. Invoice creation rate (API Gateway Count)
2. Payment detection rate (Watcher processed count)
3. Sweep success rate (Sweeper success/error)
4. Pending invoice count (DynamoDB GSI query)
5. Lambda error rates across all functions

→ [Error Handling](../../behavior/error-handling.md) | [Architecture Overview](../../architecture/system-overview.md)
