# Technical Debt Summary

> **Navigation:** [← Technical Debt Report](../technical-debt-report.md) | [Outdated Components →](outdated-components.md) | [Security Vulnerabilities →](security-vulnerabilities.md)

## Executive Overview

The crypto-invoice-cdk project contains 16 identified technical debt items spanning SDK modernization, security hardening, and code quality. The most impactful item is the AWS SDK v2 usage in all EVM Lambda functions, which can be addressed via the `AWS/nodejs-aws-sdk-v2-to-v3` transformation.

---

## Debt Items by Severity

### 🔴 HIGH Priority (4 items)

| # | Item | Category | Location |
|---|------|----------|----------|
| 1 | AWS SDK v2 in all 4 EVM Lambdas | Outdated | lambda/*/index.js |
| 2 | CORS set to ALL_ORIGINS | Security | Both CDK stacks |
| 3 | dataTraceEnabled: true in API Gateway | Security | Both CDK stacks |
| 4 | Code duplication between EVM/Solana management handlers | Maintenance | invoice-management/index.js |

### 🟡 MEDIUM Priority (7 items)

| # | Item | Category | Location |
|---|------|----------|----------|
| 5 | Inconsistent SDK versions (v2 EVM vs v3 Solana) | Outdated | All Lambda packages |
| 6 | Raw private key in Secrets Manager (EVM) | Security | sweeper/index.js |
| 7 | No WAF protection | Security | CDK stacks |
| 8 | No Cognito/IAM authorizer (API key only) | Security | CDK stacks |
| 9 | No request validation at API Gateway level | Maintenance | CDK stacks |
| 10 | Hardcoded log group names in sweeper error notifications | Maintenance | sweeper/index.js |
| 11 | ethers.js and @solana/web3.js version alignment | Outdated | package.json files |

### 🟢 LOW Priority (5 items)

| # | Item | Category | Location |
|---|------|----------|----------|
| 12 | ESLint v8 → v9 upgrade available | Outdated | .eslintrc.js |
| 13 | TypeScript ESLint plugin v6 → v7/v8 | Outdated | package.json |
| 14 | CDK Nag suppressions may mask real issues | Security | CDK stacks |
| 15 | RPC URL in Lambda environment variables | Security | CDK stacks |
| 16 | Integration tests require external blockchain | Maintenance | test/integration/ |

---

## Impact Assessment

### Cost Impact
- SDK v2 full package (~100MB) vs v3 modular (~1-5MB) affects Lambda cold start time and memory usage
- Unnecessary Lambda invocations from missing API Gateway request validation
- `dataTraceEnabled` increases CloudWatch Logs storage costs

### Security Impact
- CORS ALL_ORIGINS + API key could enable unauthorized cross-site access
- Raw private key exposure risk in Secrets Manager (EVM) vs KMS-protected signing (Solana)
- No WAF leaves API exposed to common web attacks

### Operational Impact
- Code duplication means every business logic change must be applied in two places
- Hardcoded log group names will break if stack names change
- No pagination limit enforcement in EVM getInvoices could cause timeouts

---

## Related Documentation

- [Outdated Components →](outdated-components.md)
- [Security Vulnerabilities →](security-vulnerabilities.md)
- [Maintenance Burden →](maintenance-burden.md)
- [Remediation Plan →](remediation-plan.md)
