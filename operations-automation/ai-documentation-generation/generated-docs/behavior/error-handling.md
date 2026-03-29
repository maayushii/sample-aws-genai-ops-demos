# Error Handling Documentation

> **Navigation:** [← Decision Logic](decision-logic.md) | [Business Logic →](business-logic.md) | [Security Patterns →](../analysis/security-patterns.md)

## Error Handling Patterns by Component

### 1. CDK Stack — Environment Variable Validation

**Source:** `lib/crypto-invoice-stack.ts` (lines ~175, ~193), `non-evm-deployments/solana/lib/solana-invoice-stack.ts` (similar)

```typescript
const rpcUrl = process.env.RPC_URL;
if (!rpcUrl) {
  throw new Error('Missing RPC_URL environment variable');
}
const treasuryPublicAddress = process.env.TREASURY_PUBLIC_ADDRESS;
if (!treasuryPublicAddress) {
  throw new Error('Missing TREASURY_PUBLIC_ADDRESS environment variable');
}
```

**Pattern:** Fail-fast during CDK synthesis if required environment variables are missing. This prevents deployment of a broken stack.

---

### 2. Sweeper — SNS Error Notification

**Source:** `lambda/sweeper/index.js` (lines 22-50), `non-evm-deployments/solana/lambda/sweeper/index.js` (lines 59-85)

```javascript
async function sendErrorNotification(error, invoiceId) {
  try {
    const logGroupName = '/aws/lambda/CryptoInvoiceStack-SweeperFunction';
    const messageBody = `Sweeper Error Alert\n\nError Details:\n${error.message}\n\nLog Group: ${logGroupName}`;
    await sns.publish({ TopicArn: SNS_TOPIC_ARN, Message: messageBody, Subject: '⚠️ Sweeper Error: Invoice ...' });
  } catch (notificationError) {
    console.error(`Failed to send error notification: ${notificationError.message}`);
    // Notification failure is swallowed — does not block re-throw of original error
  }
}
```

**Pattern:** Best-effort error notification. If SNS publish itself fails, the notification error is logged but doesn't mask the original error. The original error is then re-thrown to trigger DynamoDB Stream retry.

**⚠️ Issue:** Log group names are hardcoded (`/aws/lambda/CryptoInvoiceStack-SweeperFunction`, `/aws/lambda/SolanaInvoiceStack-SolanaSweeperFunction`). If stack name changes, the notification points to wrong log group.

---

### 3. Invoice Management — ConditionalCheckFailedException

**Source:** `lambda/invoice-management/index.js` (EVM only)

```javascript
// Update
try {
  const result = await dynamo.update({
    ConditionExpression: 'attribute_exists(invoiceId)',
    ...
  }).promise();
  return { statusCode: 200, body: JSON.stringify(result.Attributes) };
} catch (error) {
  if (error.code === 'ConditionalCheckFailedException') {
    return { statusCode: 404, body: JSON.stringify({ error: 'Invoice not found' }) };
  }
  throw error; // Re-throw unexpected errors → caught by outer try/catch → 500
}

// Delete
try {
  await dynamo.delete({
    ConditionExpression: 'attribute_exists(invoiceId) AND (#status = :pendingStatus OR #status = :cancelledStatus)',
    ...
  }).promise();
} catch (error) {
  if (error.code === 'ConditionalCheckFailedException') {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invoice not found or cannot be deleted...' }) };
  }
  throw error;
}
```

**Pattern:** Uses DynamoDB condition expressions for atomic validation. `ConditionalCheckFailedException` is caught and mapped to appropriate HTTP status codes. Other errors propagate to the global catch block.

**Note:** Solana implementation does NOT use condition expressions — it pre-fetches the invoice and checks status in application code before delete/update.

---

### 4. Watcher — RPC and Balance Check Errors

**Source:** `lambda/watcher/index.js` (lines 58-115)

```javascript
for (const invoice of Items) {
  try {
    // Balance check logic...
    if (balance >= required) {
      await markPaid(invoiceId);
      await notifyMerchant(invoice);
      processed.push(invoiceId);
    } else {
      throw new Error(`Insufficient ${currency}: required ${amount}, got ${actual}`);
    }
  } catch (err) {
    console.error(`Error processing invoice ${invoiceId}: ${err.message}`);
    failed.push({ invoiceId, error: err.message });
    // Error is caught but not re-thrown — processing continues for other invoices
  }
}
```

**Pattern:** Per-invoice error isolation. If one invoice fails (e.g., RPC timeout, contract call failure), others still get processed. Failed invoices are logged and returned in the response but don't block the batch.

**Solana Watcher** also handles `TokenAccountNotFoundError` specifically:
```javascript
try {
  const tokenAccount = await getAccount(connection, ata);
  // ...
} catch (err) {
  if (err.name === 'TokenAccountNotFoundError') {
    console.log(`Token account not yet created for invoice ${invoiceId}`);
    // Silently skip — customer hasn't created ATA yet
  } else {
    throw err; // Re-throw to outer catch
  }
}
```

---

### 5. Sweeper — Retry Configuration

**Source:** `lib/crypto-invoice-stack.ts` (DynamoDB Stream event source config)

```typescript
sweeperFn.addEventSource(new eventsources.DynamoEventSource(invoiceTable, {
  retryAttempts: 3,
  reportBatchItemFailures: true,
  batchSize: 1,
  parallelizationFactor: 1,
}));
```

**Retry Behavior:**
- If sweeper handler throws an error, the DynamoDB Stream record is retried up to **3 times**
- `reportBatchItemFailures: true` allows partial batch success (though batchSize=1 makes this moot)
- After 3 retries, the record is dropped (no DLQ configured)
- `reservedConcurrentExecutions: 1` ensures only one sweeper instance runs at a time

---

### 6. Global Error Handling Patterns

| Lambda | Outer Error Handler | HTTP Status |
|--------|-------------------|-------------|
| Invoice | None (unhandled → API Gateway 500) | 500 |
| Invoice Management | `catch (error) → 500 with error.message` | 500 |
| Watcher | Per-invoice isolation → summary in response | N/A (non-API) |
| Sweeper | Per-record → SNS notification → re-throw for retry | N/A (stream) |

### Error Response Format
All API-facing error responses follow a consistent format:
```json
{
  "error": "<descriptive error message>"
}
```

---

## Related Documentation

- [Business Logic →](business-logic.md)
- [Decision Logic →](decision-logic.md)
- [Security Patterns →](../analysis/security-patterns.md)
- [Troubleshooting Guide →](../specialized/operations/troubleshooting-guide.md)
