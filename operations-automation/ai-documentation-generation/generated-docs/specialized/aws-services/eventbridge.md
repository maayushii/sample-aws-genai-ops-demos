# EventBridge Configuration

> **Navigation:** [← SNS Patterns](sns-patterns.md) | [DynamoDB →](dynamodb-patterns.md)

## Watcher Schedule Rule

```typescript
new events.Rule(this, 'WatcherScheduleRule', {
  schedule: events.Schedule.rate(cdk.Duration.minutes(1)),
  targets: [new targets.LambdaFunction(watcherFn)],
});
```

- **Rate:** Every 1 minute
- **Target:** Watcher Lambda function
- **Purpose:** Periodic polling of blockchain for payment detection

## Design Considerations
- 1-minute interval provides near real-time payment detection
- No event payload used by the watcher handler
- Same configuration for both EVM and Solana stacks

→ [Architecture Patterns](../../architecture/patterns.md) | [Workflows](../../behavior/workflows.md)
