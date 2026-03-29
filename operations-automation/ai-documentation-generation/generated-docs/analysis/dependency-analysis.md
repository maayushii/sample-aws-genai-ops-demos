# Dependency Analysis

> **Navigation:** [← Complexity Analysis](complexity-analysis.md) | [Security Patterns →](security-patterns.md) | [Architecture Dependencies →](../architecture/dependencies.md)

## Complete Dependency Tree

### Root Project (`package.json`)

```
crypto-invoice-cdk@1.0.0
├── Production Dependencies
│   ├── @aws-crypto/client-node ^4.2.1
│   ├── @aws-sdk/client-kms ^3.797.0          ← SDK v3 (root only)
│   ├── @aws-sdk/client-secrets-manager ^3.797.0  ← SDK v3 (root only)
│   ├── aws-cdk-lib ^2.192.0
│   ├── aws-sdk ^2.1692.0                     ⚠️ SDK v2
│   ├── bip39 ^3.1.0
│   ├── constructs ^10.3.0
│   ├── dotenv ^16.5.0
│   ├── esbuild ^0.25.5
│   ├── ethers ^6.14.3
│   └── qrcode ^1.5.4
├── Dev Dependencies
│   ├── @types/jest ^29.5.0
│   ├── @types/node ^22.15.2
│   ├── @typescript-eslint/eslint-plugin ^6.21.0
│   ├── @typescript-eslint/parser ^6.21.0
│   ├── cdk-nag ^2.28.0
│   ├── eslint ^8.57.0
│   ├── eslint-plugin-security ^1.7.1
│   ├── jest ^29.7.0
│   ├── prettier ^3.6.2
│   └── typescript ^5.0.0
```

### EVM Lambda Dependencies

```
lambda/invoice@1.0.0
├── aws-sdk ^2.1692.0               ⚠️ SDK v2
├── ethers ^6.13.5
├── qrcode ^1.5.4
├── uuid ^11.1.0
└── @aws-crypto/client-node ^4.2.1

lambda/invoice-management@1.0.0
└── aws-sdk ^2.1000.0               ⚠️ SDK v2 (OLDER VERSION)

lambda/watcher@1.0.0
├── aws-sdk ^2.1692.0               ⚠️ SDK v2
└── ethers ^6.13.5

lambda/sweeper@1.0.0
├── aws-sdk ^2.1692.0               ⚠️ SDK v2
└── ethers ^6.13.5
```

### Solana Lambda Dependencies

```
solana/lambda/invoice@1.0.0
├── @aws-sdk/client-secrets-manager ^3.0.0   ✅ SDK v3
├── @aws-sdk/client-dynamodb ^3.0.0          ✅ SDK v3
├── @aws-sdk/lib-dynamodb ^3.0.0             ✅ SDK v3
├── @solana/web3.js ^1.95.8
├── bip39 ^3.1.0
├── ed25519-hd-key ^1.3.0
└── qrcode ^1.5.4

solana/lambda/invoice-management@1.0.0
├── @aws-sdk/client-dynamodb ^3.0.0          ✅ SDK v3
└── @aws-sdk/lib-dynamodb ^3.0.0             ✅ SDK v3

solana/lambda/watcher@1.0.0
├── @aws-sdk/client-dynamodb ^3.0.0          ✅ SDK v3
├── @aws-sdk/lib-dynamodb ^3.0.0             ✅ SDK v3
├── @aws-sdk/client-sns ^3.0.0               ✅ SDK v3
├── @solana/web3.js ^1.95.8
└── @solana/spl-token ^0.4.9

solana/lambda/sweeper@1.0.0
├── @aws-sdk/client-secrets-manager ^3.0.0   ✅ SDK v3
├── @aws-sdk/client-dynamodb ^3.0.0          ✅ SDK v3
├── @aws-sdk/lib-dynamodb ^3.0.0             ✅ SDK v3
├── @aws-sdk/client-kms ^3.0.0               ✅ SDK v3
├── @aws-sdk/client-sns ^3.0.0               ✅ SDK v3
├── @aws-sdk/util-dynamodb ^3.0.0            ✅ SDK v3
├── @solana/web3.js ^1.95.8
├── @solana/spl-token ^0.4.9
├── bip39 ^3.1.0
├── ed25519-hd-key ^1.3.0
└── bs58 ^6.0.0
```

---

## Version Conflict Analysis

### 🔴 Critical: AWS SDK v2 vs v3

| Package | Version | Location | Issue |
|---------|---------|----------|-------|
| aws-sdk | ^2.1692.0 | lambda/invoice/package.json | v2 — deprecated, larger bundle |
| aws-sdk | ^2.1000.0 | lambda/invoice-management/package.json | v2 — much older version |
| aws-sdk | ^2.1692.0 | lambda/watcher/package.json | v2 — deprecated |
| aws-sdk | ^2.1692.0 | lambda/sweeper/package.json | v2 — deprecated |
| aws-sdk | ^2.1692.0 | package.json (root) | v2 — used in scripts |
| aws-sdk | ^2.1692.0 | non-evm-deployments/solana/package.json | v2 — in root but not in Lambdas |
| @aws-sdk/* | ^3.0.0 | All Solana Lambda packages | v3 ✅ |
| @aws-sdk/* | ^3.797.0 | package.json (root) | v3 (alongside v2) |

### 🟡 Medium: ethers.js Version Mismatch

| Location | Version |
|----------|---------|
| package.json (root) | ^6.14.3 |
| lambda/invoice/package.json | ^6.13.5 |
| lambda/watcher/package.json | ^6.13.5 |
| lambda/sweeper/package.json | ^6.13.5 |

Minor version difference — both resolve to 6.x but could cause subtle issues with esbuild bundling.

### 🟡 Medium: CDK Version Mismatch

| Location | Version |
|----------|---------|
| package.json (EVM root) | ^2.192.0 |
| non-evm-deployments/solana/package.json | ^2.232.1 |

Solana stack uses a newer CDK version, which could have different construct behavior.

### 🟢 Low: Dev Tool Versions

- ESLint ^8.57.0 — v9 available (breaking changes in config format)
- @typescript-eslint/* ^6.21.0 — v7/v8 available
- These affect development only, not runtime

---

## Bundle Size Impact

| AWS SDK Version | Approximate Bundle Size | Impact |
|----------------|------------------------|--------|
| aws-sdk v2 (full) | ~70-100 MB unminified | Large Lambda cold start |
| @aws-sdk v3 (modular) | ~1-5 MB per client | Significantly smaller |

With `NodejsFunction` and esbuild bundling, the v2 SDK is tree-shaken but still larger than modular v3 imports.

---

## Related Documentation

- [Code Metrics →](code-metrics.md)
- [Architecture Dependencies →](../architecture/dependencies.md)
- [Technical Debt: Outdated Components →](../technical-debt/outdated-components.md)
- [Remediation Plan →](../technical-debt/remediation-plan.md)
