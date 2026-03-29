# Technical Debt Report

## 🎯 AWS Transformation Recommendation

### **RECOMMENDED TRANSFORMATIONS: AWS/nodejs-aws-sdk-v2-to-v3**

All four EVM Lambda functions (`lambda/invoice`, `lambda/invoice-management`, `lambda/watcher`, `lambda/sweeper`) use the deprecated AWS SDK for JavaScript v2 (`const AWS = require('aws-sdk')`), while the Solana Lambda functions already successfully use AWS SDK v3 modular clients. The `AWS/nodejs-aws-sdk-v2-to-v3` transformation should be applied to migrate the EVM Lambda functions to SDK v3, aligning them with the Solana implementation pattern and gaining benefits of modular architecture, smaller bundle sizes, and improved TypeScript support.

---

## Executive Summary

This report identifies **16 technical debt items** across 4 severity categories in the crypto-invoice-cdk project. The most critical finding is the use of AWS SDK v2 in all EVM Lambda functions, which is a direct candidate for automated transformation.

### Severity Distribution

| Severity | Count | Category |
|----------|-------|----------|
| 🔴 HIGH | 4 | SDK v2 usage, CORS, data trace, code duplication |
| 🟡 MEDIUM | 7 | Security gaps, inconsistencies, validation |
| 🟢 LOW | 5 | Dev tooling, minor improvements |

---

## Top Priority Items

### 1. 🔴 AWS SDK v2 in EVM Lambdas
All 4 EVM Lambda functions use `aws-sdk` v2. The Solana functions already demonstrate the v3 pattern.
- **Impact:** Larger bundle sizes, deprecated API, no tree-shaking benefits
- **Files:** `lambda/invoice/index.js`, `lambda/invoice-management/index.js`, `lambda/watcher/index.js`, `lambda/sweeper/index.js`
- → [Detailed Analysis](technical-debt/outdated-components.md)

### 2. 🔴 CORS ALL_ORIGINS Configuration
Both CDK stacks configure `allowOrigins: Cors.ALL_ORIGINS`, allowing any domain to make cross-origin requests.
- **Impact:** Potential for unauthorized cross-site API access
- → [Security Details](technical-debt/security-vulnerabilities.md)

### 3. 🔴 API Gateway dataTraceEnabled
Full request/response payloads logged to CloudWatch in production.
- **Impact:** Sensitive payment data and API keys exposed in logs
- → [Security Details](technical-debt/security-vulnerabilities.md)

### 4. 🔴 Code Duplication (Invoice Management)
EVM and Solana invoice-management handlers share ~80% identical logic with only SDK differences.
- **Impact:** Maintenance burden, risk of divergent behavior
- → [Maintenance Details](technical-debt/maintenance-burden.md)

---

## Navigation

| Section | Description |
|---------|-------------|
| [Technical Debt Summary](technical-debt/summary.md) | Executive overview of all debt items |
| [Outdated Components](technical-debt/outdated-components.md) | SDK, library, and tooling debt |
| [Security Vulnerabilities](technical-debt/security-vulnerabilities.md) | Security concerns with severity ratings |
| [Maintenance Burden](technical-debt/maintenance-burden.md) | Code quality and maintenance issues |
| [Remediation Plan](technical-debt/remediation-plan.md) | Prioritized action items |
| [Dependency Analysis](analysis/dependency-analysis.md) | Complete dependency tree and conflicts |
| [Security Patterns](analysis/security-patterns.md) | Security implementation analysis |

---

## Related Documentation

- [Architecture Overview →](architecture/system-overview.md)
- [Code Metrics →](analysis/code-metrics.md)
- [Project Overview →](project-overview.md)
