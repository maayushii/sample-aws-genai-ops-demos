# Project Overview: crypto-invoice-cdk

## Executive Summary

**crypto-invoice-cdk** is a serverless digital asset payment processing system built on AWS, enabling merchants to accept cryptocurrency payments with automated payment detection and fund sweeping capabilities. The system supports two parallel blockchain implementations:

1. **EVM-Compatible** (root project) — Supports native ETH and ERC20 token payments on any EVM-compatible blockchain using ethers.js v6.
2. **Solana** (`non-evm-deployments/solana/`) — Supports native SOL and SPL token payments on the Solana blockchain using @solana/web3.js v1.

**Authors:** Simon Goldberg and David Dornseifer  
**License:** MIT-0  
**Version:** 1.0.0

---

## Technology Stack

### Languages
| Language | Usage | Files |
|----------|-------|-------|
| TypeScript | CDK Infrastructure-as-Code | `lib/*.ts`, `bin/*.ts` |
| JavaScript | Lambda handler functions, utility scripts | `lambda/**/*.js`, `scripts/*.js` |
| Bash | Deployment, testing, and operational scripts | `scripts/*.sh`, `test/**/*.sh` |

### Frameworks & Libraries
| Framework/Library | Version | Purpose |
|---|---|---|
| AWS CDK v2 | ^2.192.0 (EVM), ^2.232.1 (Solana) | Infrastructure as Code |
| ethers.js | ^6.13.5 / ^6.14.3 | EVM blockchain interaction |
| @solana/web3.js | ^1.95.8 | Solana blockchain interaction |
| @solana/spl-token | ^0.4.9 | SPL token handling |
| bip39 | ^3.1.0 | Mnemonic / seed phrase generation |
| ed25519-hd-key | ^1.3.0 | Solana HD key derivation |
| qrcode | ^1.5.4 | QR code generation |
| uuid | ^11.1.0 | Invoice ID generation |
| @aws-crypto/client-node | ^4.2.1 | AWS crypto operations |
| esbuild | ^0.25.5 | Lambda bundling |
| dotenv | ^16.5.0 | Environment variable management |
| bs58 | ^6.0.0 | Base58 encoding (Solana) |
| cdk-nag | ^2.28.0 | CDK security evaluation |

### AWS Services
| Service | Usage |
|---------|-------|
| AWS Lambda | 4 functions per deployment (invoice, invoice-management, watcher, sweeper) |
| Amazon DynamoDB | Invoice storage (invoices table), atomic counter (counter table) |
| Amazon API Gateway (REST) | Public API endpoints with API key authentication |
| AWS Secrets Manager | Mnemonic and hot wallet private key storage |
| Amazon SNS | Payment notification and error alerting |
| Amazon EventBridge | Scheduled watcher invocation (1-minute interval) |
| AWS KMS | Ed25519 signing for Solana hot wallet |
| Amazon CloudWatch | Logging with configurable retention |

### Development Tools
| Tool | Version | Purpose |
|------|---------|---------|
| TypeScript | ^5.0.0 | Type checking for CDK code |
| ESLint | ^8.57.0 | Code linting (standard + security config) |
| Prettier | ^3.6.2 | Code formatting |
| Jest | ^29.7.0 | Unit testing framework |

---

## AWS SDK Usage (Critical Finding)

| Component | AWS SDK Version | Notes |
|-----------|----------------|-------|
| EVM Lambda: invoice | aws-sdk ^2.1692.0 (v2) | ⚠️ Legacy |
| EVM Lambda: invoice-management | aws-sdk ^2.1000.0 (v2) | ⚠️ Legacy, older version |
| EVM Lambda: watcher | aws-sdk ^2.1692.0 (v2) | ⚠️ Legacy |
| EVM Lambda: sweeper | aws-sdk ^2.1692.0 (v2) | ⚠️ Legacy |
| Solana Lambda: invoice | @aws-sdk/* ^3.0.0 (v3) | ✅ Modern modular |
| Solana Lambda: invoice-management | @aws-sdk/* ^3.0.0 (v3) | ✅ Modern modular |
| Solana Lambda: watcher | @aws-sdk/* ^3.0.0 (v3) | ✅ Modern modular |
| Solana Lambda: sweeper | @aws-sdk/* ^3.0.0 (v3) | ✅ Modern modular |
| Root package.json | aws-sdk ^2.1692.0 (v2) + @aws-sdk/* ^3.797.0 (v3) | Mixed |
| Solana root package.json | aws-sdk ^2.1692.0 (v2) | ⚠️ Legacy |

---

## Project Structure

```
crypto-invoice-cdk/
├── bin/
│   └── crypto-invoice.ts                    # CDK app entry point (EVM)
├── lib/
│   └── crypto-invoice-stack.ts              # Main CDK stack (EVM) - 436 lines
├── lambda/
│   ├── invoice/
│   │   ├── index.js                         # Invoice generation handler - 103 lines
│   │   └── package.json
│   ├── invoice-management/
│   │   ├── index.js                         # CRUD handler - 264 lines
│   │   └── package.json
│   ├── watcher/
│   │   ├── index.js                         # Payment monitoring handler - 117 lines
│   │   └── package.json
│   └── sweeper/
│       ├── index.js                         # Fund sweeping handler - 224 lines
│       └── package.json
├── non-evm-deployments/
│   └── solana/
│       ├── bin/
│       │   └── solana-invoice.ts            # CDK app entry point (Solana)
│       ├── lib/
│       │   └── solana-invoice-stack.ts      # Solana CDK stack - 406 lines
│       ├── lambda/
│       │   ├── invoice/
│       │   │   ├── index.js                 # Solana invoice handler - 111 lines
│       │   │   └── package.json
│       │   ├── invoice-management/
│       │   │   ├── index.js                 # Solana CRUD handler - 232 lines
│       │   │   └── package.json
│       │   ├── watcher/
│       │   │   ├── index.js                 # Solana watcher handler - 131 lines
│       │   │   └── package.json
│       │   └── sweeper/
│       │       ├── index.js                 # Solana sweeper handler - 244 lines
│       │       └── package.json
│       ├── scripts/                         # Solana utility/deployment scripts
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
├── scripts/
│   ├── derive-address.js                    # HD wallet address derivation utility
│   ├── setup-secrets.js                     # Secrets Manager setup
│   ├── setup-secrets.sh                     # Shell wrapper for secrets setup
│   ├── wallet-info.js                       # Wallet information utility
│   ├── lint-check.sh                        # Lint checking script
│   └── test-cdk.sh                          # CDK test runner
├── test/
│   ├── unit/
│   │   └── cdk/
│   │       └── crypto-invoice-stack-simple.test.js  # CDK unit test - 92 lines
│   └── integration/
│       ├── setup.sh                         # Integration test setup - 414 lines
│       ├── execute_payment.sh               # End-to-end payment test - 669 lines
│       ├── test-invoice-management-api.sh   # API endpoint testing - 155 lines
│       ├── run_test_pipeline.sh             # Test pipeline orchestration
│       └── cleanup.sh                       # Resource cleanup
├── assets/                                  # Architecture diagram images
├── package.json                             # Root project configuration
├── tsconfig.json                            # TypeScript configuration
├── cdk.json                                 # CDK configuration
├── .env-sample                              # Environment variable template
├── .eslintrc.js                             # ESLint configuration
├── .eslintrc.security.js                    # Security-focused ESLint config
├── jest.config.js                           # Jest test configuration
├── .prettierrc                              # Prettier formatting config
└── README.md                                # Project documentation
```

---

## File Inventory Summary

### By Language
| Language | File Count | Total Lines |
|----------|-----------|-------------|
| TypeScript (.ts) | 4 | 868 |
| JavaScript (.js) | 18 | 1,667 |
| Bash (.sh) | 14 | 1,894 |
| JSON (config) | 16 | 336 |
| Markdown (.md) | 4 | 861 |
| Other (config) | 4 | 124 |

### By Component
| Component | Source Files | Total Lines |
|-----------|-------------|-------------|
| EVM CDK Infrastructure | 2 (.ts) | 445 |
| EVM Lambda Functions | 4 (.js) | 708 |
| Solana CDK Infrastructure | 2 (.ts) | 423 |
| Solana Lambda Functions | 4 (.js) | 718 |
| EVM Utility Scripts | 4 (.js/.sh) | 151 |
| Solana Utility Scripts | 7 (.js/.sh) | 627 |
| Test Files | 6 (.js/.sh) | 1,416 |

### Key Metrics
- **Total source files (excl. config/assets):** ~42
- **Total lines of application code:** ~4,429
- **EVM/Solana code ratio:** ~48% / 52% (near-equal)
- **Lambda runtime:** Node.js 22.x (NODEJS_22_X)
- **CDK target:** ES2020 / CommonJS

---

## Configuration Summary

### TypeScript Configuration
- **Target:** ES2020
- **Module system:** CommonJS
- **Strict mode:** Enabled
- **Includes:** `bin/**/*`, `lib/**/*`
- **Excludes:** `node_modules`, `dist`, `cdk.out`, `test`

### CDK Configuration
- **EVM App:** `npx ts-node --prefer-ts-exts bin/crypto-invoice.ts`
- **Solana App:** `npx ts-node bin/solana-invoice.ts`
- **Context flags:** `@aws-cdk/aws-lambda:recognizeVersionProps: true` (EVM)

### Environment Variables Required
| Variable | Description | Used By |
|----------|-------------|---------|
| `HOT_WALLET_PK` | Hot wallet private key for gas top-up | Sweeper (EVM) |
| `TREASURY_PUBLIC_ADDRESS` | Cold wallet address for fund consolidation | Sweeper |
| `RPC_URL` | Blockchain RPC endpoint | All Lambda functions |
| `PAYER_PRIVATE_KEY` | Test payer key (optional) | Integration tests |

---

## Navigation

- [Architecture Documentation](architecture/system-overview.md)
- [API Reference](reference/api-reference.md)
- [Business Logic](behavior/business-logic.md)
- [Technical Debt Report](technical-debt-report.md)
- [Code Metrics](analysis/code-metrics.md)
- [Back to README](README.md)
