# Lambda Configuration

> **Navigation:** [← API Gateway](api-gateway-config.md) | [Secrets Manager →](secrets-manager.md)

## NodejsFunction Bundling
All Lambdas use `NodejsFunction` which bundles with esbuild automatically.

## Function Settings
| Function | Memory | Timeout | Reserved Concurrency | Log Retention |
|----------|--------|---------|---------------------|---------------|
| Invoice | 256 MB | 30s | Default | 2 weeks |
| Management | 256 MB | 30s | Default | 2 weeks |
| Watcher | 256 MB | 30s | Default | 2 weeks |
| Sweeper | 256 MB | 15 min | 1 | 1 month |

## Event Source Mapping (Sweeper)
```typescript
sweeperFn.addEventSource(new eventsources.DynamoEventSource(invoiceTable, {
  startingPosition: lambda.StartingPosition.LATEST,
  batchSize: 1,
  retryAttempts: 3,
  parallelizationFactor: 1,
  reportBatchItemFailures: true,
  filters: [lambda.FilterCriteria.filter({
    eventName: lambda.FilterRule.isEqual('MODIFY'),
    dynamodb: { NewImage: { status: { S: lambda.FilterRule.isEqual('paid') } } },
  })],
}));
```

## Runtime
- All functions: `lambda.Runtime.NODEJS_22_X`

→ [Architecture Components](../../architecture/components.md) | [Complexity Analysis](../../analysis/complexity-analysis.md)
