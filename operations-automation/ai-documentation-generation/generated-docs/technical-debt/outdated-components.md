# Outdated Components

> **Navigation:** [← Summary](summary.md) | [Security Vulnerabilities →](security-vulnerabilities.md) | [Remediation Plan →](remediation-plan.md)

## 🔴 HIGH: AWS SDK v2 Usage in All EVM Lambda Functions

### Affected Files

| File | SDK Version | Import Pattern |
|------|-------------|---------------|
| `lambda/invoice/index.js` (line 1) | `aws-sdk ^2.1692.0` | `const AWS = require('aws-sdk')` |
| `lambda/invoice-management/index.js` (line 1) | `aws-sdk ^2.1000.0` | `const AWS = require('aws-sdk')` |
| `lambda/watcher/index.js` (line 1) | `aws-sdk ^2.1692.0` | `const AWS = require('aws-sdk')` |
| `lambda/sweeper/index.js` (line 2) | `aws-sdk ^2.1692.0` | `const AWS = require('aws-sdk')` |

### Description
All four EVM Lambda functions import the monolithic AWS SDK v2 package. AWS SDK v2 entered maintenance mode in 2023 and will reach end-of-support. The Solana Lambda functions demonstrate that the codebase already supports SDK v3 modular imports.

### Current Pattern (EVM - v2)
```javascript
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const result = await dynamo.get({...}).promise();
```

### Target Pattern (Solana - v3, already in codebase)
```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const result = await dynamo.send(new GetCommand({...}));
```

### Business Justification
- **Bundle size reduction:** SDK v3 modular imports (1-5 MB) vs v2 monolithic (~100 MB)
- **Cold start improvement:** Smaller bundles lead to faster Lambda cold starts
- **Maintenance:** SDK v2 will stop receiving security patches
- **Consistency:** Solana functions already use v3 — alignment reduces cognitive load
- **Recommended transformation:** `AWS/nodejs-aws-sdk-v2-to-v3`

### Additional Note
The `invoice-management` Lambda uses an even older version (`^2.1000.0`) compared to the others (`^2.1692.0`), indicating inconsistent dependency management.

---

## 🟡 MEDIUM: Inconsistent SDK Versions Between Stacks

| Component | AWS SDK | CDK Version |
|-----------|---------|-------------|
| EVM Root | aws-sdk ^2.1692.0 + @aws-sdk/* ^3.797.0 | ^2.192.0 |
| Solana Root | aws-sdk ^2.1692.0 (unused by Lambdas) | ^2.232.1 |
| EVM Lambdas | aws-sdk v2 only | — |
| Solana Lambdas | @aws-sdk v3 only | — |

The Solana root `package.json` lists `aws-sdk ^2.1692.0` but none of its Lambda functions use it, suggesting it may be a leftover dependency.

---

## 🟡 MEDIUM: Blockchain Library Version Alignment

| Library | Root Version | Lambda Version | Latest Available |
|---------|-------------|----------------|------------------|
| ethers | ^6.14.3 | ^6.13.5 | Check npmjs.com |
| @solana/web3.js | ^1.95.8 | ^1.95.8 | Check npmjs.com |
| @solana/spl-token | ^0.4.9 | ^0.4.9 | Check npmjs.com |

Minor version mismatch for ethers between root and Lambda packages.

---

## 🟢 LOW: Development Tool Upgrades

| Tool | Current | Available | Impact |
|------|---------|-----------|--------|
| ESLint | ^8.57.0 | v9.x | New flat config format, breaking change |
| @typescript-eslint/eslint-plugin | ^6.21.0 | v7/v8 | Requires ESLint v8+ |
| @typescript-eslint/parser | ^6.21.0 | v7/v8 | Requires ESLint v8+ |
| eslint-plugin-security | ^1.7.1 | v3.x | Updated rules |

These affect development experience only, not runtime behavior.

---

## Related Documentation

- [Dependency Analysis →](../analysis/dependency-analysis.md)
- [Security Vulnerabilities →](security-vulnerabilities.md)
- [Remediation Plan →](remediation-plan.md)
