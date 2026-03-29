# SNS Patterns

> **Navigation:** [← Secrets Manager](secrets-manager.md) | [EventBridge →](eventbridge.md)

## Topic Policy
HTTPS-only enforcement via resource policy:
```typescript
paymentNotificationTopic.addToResourcePolicy(new iam.PolicyStatement({
  sid: 'AllowPublishThroughSSLOnly',
  effect: iam.Effect.DENY,
  principals: [new iam.AnyPrincipal()],
  actions: ['sns:Publish'],
  conditions: { Bool: { 'aws:SecureTransport': 'false' } }
}));
```

## Notification Templates

### Payment Received (Watcher)
```
Payment Received

Invoice ID: {invoiceId}
Amount: {amount} {tokenSymbol}
Invoice Public Address: {address}
Paid At: {timestamp}

Status: PAID ✅
```

### Sweeper Error Alert
```
Sweeper Error Alert

Error Details: {error.message}
CloudWatch Log Group: {logGroupName}
Function Name: {functionName}
Timestamp: {timestamp}
```

→ [Error Handling](../../behavior/error-handling.md)
