# Code Metrics

> **Navigation:** [← README](../README.md) | [Complexity Analysis →](complexity-analysis.md) | [Dependency Analysis →](dependency-analysis.md)

## File-Level Metrics

### EVM Lambda Functions

| File | Lines | Functions | Exported | Cyclomatic Complexity Est. |
|------|-------|-----------|----------|---------------------------|
| lambda/invoice/index.js | 103 | 1 | 1 (handler) | Low (3) — linear flow with 2 currency branches |
| lambda/invoice-management/index.js | 264 | 5 | 1 (handler) | Moderate (8) — switch on httpMethod + status transitions |
| lambda/watcher/index.js | 117 | 3 | 1 (handler) | Medium (5) — loop with 2 currency branches + error handling |
| lambda/sweeper/index.js | 224 | 4 | 1 (handler) | High (10) — gas estimation + top-up + 2 currency paths + error recovery |

### Solana Lambda Functions

| File | Lines | Functions | Exported | Cyclomatic Complexity Est. |
|------|-------|-----------|----------|---------------------------|
| solana/lambda/invoice/index.js | 111 | 1 | 1 (handler) | Low (3) — linear flow with 2 currency branches |
| solana/lambda/invoice-management/index.js | 232 | 5 | 1 (handler) | Moderate (7) — if-else routing + status checks |
| solana/lambda/watcher/index.js | 131 | 3 | 1 (handler) | Medium (6) — loop + 2 currencies + TokenAccountNotFoundError |
| solana/lambda/sweeper/index.js | 244 | 4 | 1 (handler) | High (11) — KMS signing + ATA creation + 2 currencies + error recovery |

### CDK Infrastructure

| File | Lines | Functions | Classes | Complexity |
|------|-------|-----------|---------|------------|
| lib/crypto-invoice-stack.ts | 436 | 2 | 1 (CryptoInvoiceStack) | Moderate — resource creation + Nag suppressions |
| bin/crypto-invoice.ts | 9 | 0 | 0 | Minimal |
| non-evm-deployments/solana/lib/solana-invoice-stack.ts | 406 | 2 | 1 (SolanaInvoiceStack) | Moderate — resource creation + Nag suppressions |
| non-evm-deployments/solana/bin/solana-invoice.ts | 17 | 0 | 0 | Minimal |

### Utility Scripts

| File | Lines | Type |
|------|-------|------|
| scripts/derive-address.js | 32 | Node.js |
| scripts/setup-secrets.js | 45 | Node.js |
| scripts/setup-secrets.sh | 18 | Bash |
| scripts/wallet-info.js | 56 | Node.js |
| scripts/lint-check.sh | 108 | Bash |
| scripts/test-cdk.sh | 54 | Bash |

---

## Code Duplication Analysis

### High Duplication: Invoice Management Handlers

The EVM (`lambda/invoice-management/index.js`, 264 lines) and Solana (`solana/lambda/invoice-management/index.js`, 232 lines) handlers share ~80% identical business logic with these differences:

| Aspect | EVM Handler | Solana Handler |
|--------|-------------|----------------|
| AWS SDK | `const AWS = require('aws-sdk')` | `const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')` |
| DynamoDB init | `new AWS.DynamoDB.DocumentClient()` | `DynamoDBDocumentClient.from(new DynamoDBClient({}))` |
| Operations | `.get({...}).promise()` | `dynamo.send(new GetCommand({...}))` |
| Routing | `switch(httpMethod)` | `if-else chain` |
| Delete approach | `ConditionExpression` | Pre-fetch + check |
| Update response | Returns `ALL_NEW` attributes | Returns message only |
| Error codes | 400 for immutable | 403 for immutable |

### Moderate Duplication: CDK Stacks

Both CDK stacks (`crypto-invoice-stack.ts` and `solana-invoice-stack.ts`) share ~70% structural similarity with blockchain-specific differences (KMS key for Solana, Secrets Manager for EVM hot wallet).

### Low Duplication: Other Lambda Pairs

Invoice, Watcher, and Sweeper Lambdas have significant blockchain-specific logic, reducing duplication to ~30-40%.

---

## Aggregate Metrics Summary

| Metric | Value |
|--------|-------|
| **Total application source files** | 12 (8 Lambda + 4 CDK) |
| **Total application lines** | 2,294 |
| **Average file size** | 191 lines |
| **Largest file** | lib/crypto-invoice-stack.ts (436 lines) |
| **Smallest Lambda** | lambda/invoice/index.js (103 lines) |
| **Total functions** | 36 (18 EVM + 18 Solana) |
| **Total exported handlers** | 8 |
| **Languages** | TypeScript (CDK), JavaScript (Lambda) |

---

## Related Documentation

- [Complexity Analysis →](complexity-analysis.md)
- [Dependency Analysis →](dependency-analysis.md)
- [Security Patterns →](security-patterns.md)
- [Program Structure →](../reference/program-structure.md)
