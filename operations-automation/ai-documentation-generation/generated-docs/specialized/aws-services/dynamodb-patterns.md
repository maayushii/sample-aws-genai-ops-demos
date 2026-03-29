# DynamoDB Patterns

> **Navigation:** [← README](../../README.md) | [API Gateway →](api-gateway-config.md)

## Table Designs

### Invoices Table
- **Partition Key:** `invoiceId` (String/UUID)
- **Billing:** PAY_PER_REQUEST (on-demand)
- **Stream:** NEW_IMAGE (for sweeper triggering)
- **GSI:** `status-index` (partition: status, projection: ALL)
- **Removal Policy:** DESTROY

### Counter Table
- **Partition Key:** `counterId` (String)
- **Billing:** PAY_PER_REQUEST
- **No stream**

## Atomic Counter Pattern
```javascript
await dynamo.update({
  TableName: COUNTER_TABLE,
  Key: { counterId: 'hd-index' },
  UpdateExpression: 'SET currentIndex = if_not_exists(currentIndex, :start) + :inc',
  ExpressionAttributeValues: { ':start': 0, ':inc': 1 },
  ReturnValues: 'UPDATED_NEW',
}).promise();
```

## Stream Configuration
- View type: NEW_IMAGE
- Filter: `eventName=MODIFY AND NewImage.status.S=paid`
- Batch size: 1, Retries: 3, Parallelization: 1

## Conditional Operations (EVM)
```javascript
// Conditional delete
ConditionExpression: 'attribute_exists(invoiceId) AND (#status = :pending OR #status = :cancelled)'
// Conditional update
ConditionExpression: 'attribute_exists(invoiceId)'
```

→ [Data Models](../../reference/data-models.md) | [Architecture Components](../../architecture/components.md)
