# Program Structure

> **Navigation:** [← Data Models](data-models.md) | [Architecture Components →](../architecture/components.md) | [Code Metrics →](../analysis/code-metrics.md)

## Module Hierarchy

```
crypto-invoice-cdk/
│
├── CDK Application Layer
│   ├── bin/crypto-invoice.ts ─────────────────── EVM App Entry Point
│   │   └── imports: CryptoInvoiceStack, cdk-nag
│   └── non-evm-deployments/solana/bin/solana-invoice.ts ── Solana App Entry Point
│       └── imports: SolanaInvoiceStack, cdk-nag, dotenv
│
├── Infrastructure Layer
│   ├── lib/crypto-invoice-stack.ts ───────────── EVM CDK Stack (436 lines)
│   │   ├── DynamoDB Tables (invoices, counter)
│   │   ├── Secrets Manager (mnemonic, hot-pk)
│   │   ├── SNS Topic
│   │   ├── API Gateway (REST + usage plan)
│   │   ├── Lambda Functions (4x NodejsFunction)
│   │   ├── EventBridge Rule
│   │   ├── DynamoDB Stream Event Source
│   │   ├── IAM Resource Policies
│   │   ├── CloudWatch Log Groups
│   │   └── CDK Nag Suppressions
│   └── non-evm-deployments/solana/lib/solana-invoice-stack.ts ── Solana CDK Stack (406 lines)
│       ├── (same pattern as EVM)
│       └── KMS CfnKey (Ed25519 signing)
│
├── Lambda Handler Layer
│   ├── EVM Handlers (AWS SDK v2 + ethers.js)
│   │   ├── lambda/invoice/index.js ───────────── Invoice Generator (103 lines)
│   │   │   ├── exports.handler(event)
│   │   │   ├── Deps: aws-sdk, ethers, uuid, qrcode
│   │   │   └── Calls: SecretsManager, DynamoDB (counter + invoices)
│   │   ├── lambda/invoice-management/index.js ── CRUD Operations (264 lines)
│   │   │   ├── exports.handler(event)
│   │   │   ├── getInvoice(invoiceId)
│   │   │   ├── getInvoices(queryParams)
│   │   │   ├── updateInvoiceStatus(invoiceId, body)
│   │   │   ├── deleteInvoice(invoiceId)
│   │   │   ├── Deps: aws-sdk
│   │   │   └── Calls: DynamoDB (invoices)
│   │   ├── lambda/watcher/index.js ───────────── Payment Monitor (117 lines)
│   │   │   ├── exports.handler()
│   │   │   ├── markPaid(invoiceId)
│   │   │   ├── notifyMerchant(invoice)
│   │   │   ├── Deps: aws-sdk, ethers
│   │   │   └── Calls: DynamoDB (query GSI), Blockchain RPC, SNS
│   │   └── lambda/sweeper/index.js ──────────── Fund Sweeper (224 lines)
│   │       ├── exports.handler(event)
│   │       ├── addGasBuffer(estimatedGas, bufferPercent)
│   │       ├── sendErrorNotification(error, invoiceId)
│   │       ├── ensureSufficientGas(invoiceWallet, hotWallet, ...)
│   │       ├── Deps: aws-sdk, ethers
│   │       └── Calls: SecretsManager, DynamoDB, Blockchain RPC, SNS
│   │
│   └── Solana Handlers (AWS SDK v3 + @solana/web3.js)
│       ├── non-evm-deployments/solana/lambda/invoice/index.js ── Invoice Generator (111 lines)
│       │   ├── exports.handler(event)
│       │   ├── Deps: @aws-sdk/*, @solana/web3.js, bip39, ed25519-hd-key, qrcode
│       │   └── Calls: SecretsManager, DynamoDB (counter + invoices)
│       ├── non-evm-deployments/solana/lambda/invoice-management/index.js ── CRUD (232 lines)
│       │   ├── exports.handler(event)
│       │   ├── getAllInvoices(queryParams)
│       │   ├── getInvoice(invoiceId)
│       │   ├── updateInvoice(invoiceId, body)
│       │   ├── deleteInvoice(invoiceId)
│       │   ├── Deps: @aws-sdk/*
│       │   └── Calls: DynamoDB (invoices)
│       ├── non-evm-deployments/solana/lambda/watcher/index.js ── Payment Monitor (131 lines)
│       │   ├── exports.handler()
│       │   ├── markPaid(invoiceId)
│       │   ├── notifyMerchant(invoice)
│       │   ├── Deps: @aws-sdk/*, @solana/web3.js, @solana/spl-token
│       │   └── Calls: DynamoDB, Solana RPC, SNS
│       └── non-evm-deployments/solana/lambda/sweeper/index.js ── Fund Sweeper (244 lines)
│           ├── exports.handler(event)
│           ├── getHotWalletPublicKey() [cached]
│           ├── signWithKms(message)
│           ├── sendErrorNotification(error, invoiceId)
│           ├── Deps: @aws-sdk/*, @solana/web3.js, @solana/spl-token, bip39, ed25519-hd-key
│           └── Calls: SecretsManager, KMS, DynamoDB, Solana RPC, SNS
│
├── Utility Scripts
│   ├── scripts/derive-address.js ──────── HD wallet address derivation (32 lines)
│   ├── scripts/setup-secrets.js ───────── Secrets Manager setup (45 lines)
│   ├── scripts/setup-secrets.sh ───────── Shell wrapper for setup (18 lines)
│   ├── scripts/wallet-info.js ─────────── Wallet information display (56 lines)
│   ├── scripts/lint-check.sh ──────────── Lint checking automation (108 lines)
│   └── scripts/test-cdk.sh ────────────── CDK test runner (54 lines)
│
├── Solana Utility Scripts
│   ├── scripts/generate-wallets.js ────── Wallet generation (42 lines)
│   ├── scripts/send-payment.js ────────── SOL payment sender (60 lines)
│   ├── scripts/send-spl-payment.js ────── SPL payment sender (84 lines)
│   ├── scripts/setup-secrets.sh ───────── Solana secrets setup (96 lines)
│   ├── scripts/setup.sh ──────────────── Full deployment setup (192 lines)
│   ├── scripts/wallet-info.js ─────────── Wallet info display (51 lines)
│   ├── scripts/test-sol-payment.sh ────── SOL payment test (50 lines)
│   └── scripts/test-spl-payment.sh ────── SPL payment test (52 lines)
│
└── Test Layer
    ├── test/unit/cdk/crypto-invoice-stack-simple.test.js ── CDK unit test (92 lines)
    ├── test/integration/setup.sh ────── Full setup script (414 lines)
    ├── test/integration/execute_payment.sh ── E2E payment test (669 lines)
    ├── test/integration/test-invoice-management-api.sh ── API tests (155 lines)
    ├── test/integration/run_test_pipeline.sh ── Test orchestration (54 lines)
    └── test/integration/cleanup.sh ──── Resource cleanup (32 lines)
```

## Function Index

### EVM Lambda Functions

| Function | File | Line | Purpose |
|----------|------|------|---------|
| `handler` | lambda/invoice/index.js | 14 | Invoice generation entry point |
| `handler` | lambda/invoice-management/index.js | 7 | CRUD router entry point |
| `getInvoice` | lambda/invoice-management/index.js | 50 | Single invoice retrieval |
| `getInvoices` | lambda/invoice-management/index.js | 70 | Filtered/paginated list |
| `updateInvoiceStatus` | lambda/invoice-management/index.js | 119 | Status transition handler |
| `deleteInvoice` | lambda/invoice-management/index.js | 208 | Conditional deletion |
| `handler` | lambda/watcher/index.js | 56 | Payment monitoring entry point |
| `markPaid` | lambda/watcher/index.js | 18 | Mark invoice as paid |
| `notifyMerchant` | lambda/watcher/index.js | 31 | SNS notification sender |
| `handler` | lambda/sweeper/index.js | 88 | Fund sweeping entry point |
| `addGasBuffer` | lambda/sweeper/index.js | 20 | Gas estimation with buffer |
| `sendErrorNotification` | lambda/sweeper/index.js | 22 | SNS error notification |
| `ensureSufficientGas` | lambda/sweeper/index.js | 56 | Gas top-up logic |

### Solana Lambda Functions

| Function | File | Line | Purpose |
|----------|------|------|---------|
| `handler` | solana/lambda/invoice/index.js | 19 | Solana invoice generation |
| `handler` | solana/lambda/invoice-management/index.js | 16 | Solana CRUD router |
| `getAllInvoices` | solana/lambda/invoice-management/index.js | 52 | Filtered list |
| `getInvoice` | solana/lambda/invoice-management/index.js | 98 | Single retrieval |
| `updateInvoice` | solana/lambda/invoice-management/index.js | 119 | Status update |
| `deleteInvoice` | solana/lambda/invoice-management/index.js | 179 | Delete invoice |
| `handler` | solana/lambda/watcher/index.js | 55 | Solana payment monitoring |
| `markPaid` | solana/lambda/watcher/index.js | 16 | Mark paid |
| `notifyMerchant` | solana/lambda/watcher/index.js | 29 | SNS notification |
| `handler` | solana/lambda/sweeper/index.js | 93 | Solana fund sweeping |
| `getHotWalletPublicKey` | solana/lambda/sweeper/index.js | 38 | KMS public key (cached) |
| `signWithKms` | solana/lambda/sweeper/index.js | 49 | KMS ed25519 signing |
| `sendErrorNotification` | solana/lambda/sweeper/index.js | 59 | SNS error notification |

---

## Related Documentation

- [Data Models →](data-models.md)
- [Architecture Components →](../architecture/components.md)
- [Code Metrics →](../analysis/code-metrics.md)
- [Complexity Analysis →](../analysis/complexity-analysis.md)
