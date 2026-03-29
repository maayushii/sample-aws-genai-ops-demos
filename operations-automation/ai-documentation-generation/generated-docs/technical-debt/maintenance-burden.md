# Maintenance Burden

> **Navigation:** [← Security Vulnerabilities](security-vulnerabilities.md) | [Remediation Plan →](remediation-plan.md) | [Code Metrics →](../analysis/code-metrics.md)

## 🔴 HIGH: Code Duplication Between EVM and Solana Invoice Management

**Files:**
- `lambda/invoice-management/index.js` (264 lines)
- `non-evm-deployments/solana/lambda/invoice-management/index.js` (232 lines)

**Duplication Analysis:** ~80% identical business logic, differing only in:
- AWS SDK version (v2 `.promise()` vs v3 `send(Command)`)
- Routing pattern (`switch` vs `if-else`)
- Delete approach (ConditionExpression vs pre-fetch)
- Error response codes (400 vs 403 for immutable invoices)
- Response format (full attributes vs message only)

**Impact:**
- Every business logic change must be applied in two places
- Risk of divergent behavior (already visible in error code differences)
- Bug fixes may be missed in one implementation

**Remediation:** Extract shared business logic into a common module that accepts a database adapter interface. Both EVM and Solana implementations would provide their SDK-specific adapter.

---

## 🟡 MEDIUM: No Request Validation at API Gateway Level

**Source:** Both CDK stacks (suppressed via AwsSolutions-APIG2)

```typescript
{ id: 'AwsSolutions-APIG2', reason: 'Request validation handled by Lambda functions' }
```

**Impact:**
- Invalid requests still invoke Lambda functions, consuming resources and incurring cost
- Validation error messages are inconsistent across handlers
- No OpenAPI/Swagger schema documentation auto-generation

**Remediation:** Add API Gateway request validators with JSON schema models:
```typescript
const model = invoiceApi.addModel('InvoiceRequest', {
  schema: {
    type: apigateway.JsonSchemaType.OBJECT,
    required: ['currency', 'amount'],
    properties: { ... }
  }
});
```

---

## 🟡 MEDIUM: Hardcoded Log Group Names in Sweeper Error Notifications

**Source:** `lambda/sweeper/index.js` (line 24), `non-evm-deployments/solana/lambda/sweeper/index.js` (line 62)

```javascript
// EVM Sweeper:
const logGroupName = '/aws/lambda/CryptoInvoiceStack-SweeperFunction';
const functionName = 'SweeperFunction';

// Solana Sweeper:
const logGroupName = '/aws/lambda/SolanaInvoiceStack-SolanaSweeperFunction';
const functionName = 'SolanaSweeperFunction';
```

**Impact:** If the CDK stack name changes, or if the Lambda logical ID changes, the SNS notification will reference the wrong CloudWatch log group, leading operators to a non-existent or incorrect log stream.

**Remediation:** Pass the log group name and function name as environment variables from the CDK stack:
```typescript
environment: {
  LOG_GROUP_NAME: sweeperLogGroup.logGroupName,
  FUNCTION_NAME: sweeperFn.functionName,
}
```

---

## 🟡 MEDIUM: No Limit Enforcement on EVM Invoice Listing

**Source:** `lambda/invoice-management/index.js` (lines 70-116)

The EVM handler accepts the `limit` parameter but doesn't enforce a maximum:
```javascript
Limit: parseInt(limit, 10),  // No Math.min(limit, 100)
```

The Solana handler correctly enforces a maximum:
```javascript
Limit: Math.min(limit, 100),
```

**Impact:** Large limit values could cause DynamoDB timeouts or excessive memory usage.

---

## 🟢 LOW: Integration Tests Require External Blockchain Infrastructure

**Source:** `test/integration/execute_payment.sh` (669 lines), `test/integration/setup.sh` (414 lines)

Integration tests require:
- Deployed CDK stack
- Funded test wallet with testnet tokens
- Active blockchain RPC endpoint
- External tools (`jq`, `bc`, `curl`)

**Impact:** Tests cannot be run in isolated CI/CD environments without blockchain connectivity. No mocking framework for blockchain interactions.

---

## 🟢 LOW: Invoice Lambda Missing Global Error Handler

**Source:** `lambda/invoice/index.js`

Unlike `invoice-management` which has a try/catch wrapper, the invoice handler has no global error handler. Any unhandled error results in a raw 500 response from API Gateway.

---

## Related Documentation

- [Code Metrics →](../analysis/code-metrics.md)
- [Complexity Analysis →](../analysis/complexity-analysis.md)
- [Security Vulnerabilities →](security-vulnerabilities.md)
- [Remediation Plan →](remediation-plan.md)
