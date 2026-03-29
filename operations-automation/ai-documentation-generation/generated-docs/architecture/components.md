# Component Documentation

> **Navigation:** [← System Overview](system-overview.md) | [Dependencies →](dependencies.md) | [Program Structure →](../reference/program-structure.md)

## CDK Application Entry Points

### EVM Entry Point (`bin/crypto-invoice.ts`)
- **Lines:** 9
- **Purpose:** Creates CDK app, attaches `AwsSolutionsChecks` CDK Nag aspect, instantiates `CryptoInvoiceStack`
- **Stack name:** `CryptoInvoiceStack`

### Solana Entry Point (`non-evm-deployments/solana/bin/solana-invoice.ts`)
- **Lines:** 17
- **Purpose:** Creates CDK app with AwsSolutionsChecks, loads `.env` config, instantiates `SolanaInvoiceStack`
- **Stack name:** `SolanaInvoiceStack`
- **Region:** Configurable via `CDK_DEFAULT_REGION` / `AWS_REGION` (default: `us-east-1`)

---

## CDK Stack Components

### CryptoInvoiceStack (`lib/crypto-invoice-stack.ts` — 436 lines)

#### DynamoDB Tables
1. **CryptoInvoices** — Main invoice storage
   - Partition key: `invoiceId` (String)
   - Billing: PAY_PER_REQUEST
   - Stream: NEW_IMAGE
   - GSI: `status-index` (partition: `status`, projection: ALL)
   - Removal: DESTROY

2. **HdWalletCounter** — Atomic HD wallet index counter
   - Partition key: `counterId` (String)
   - Billing: PAY_PER_REQUEST
   - Removal: DESTROY

#### Secrets Manager Secrets
1. **HdWalletMnemonic** (`hd-wallet-mnemonic`) — HD wallet seed phrase
   - Resource policy: DENY all except Invoice Lambda and Sweeper Lambda roles
2. **WalletHotPkSecret** (`wallet/hot-pk`) — Hot wallet private key
   - Resource policy: DENY all except Sweeper Lambda role

#### SNS Topic
- **PaymentNotificationTopic** — "Merchant Payment Notifications"
  - HTTPS-only policy enforced (deny non-SSL publish)
  - Granted to: Watcher Lambda, Sweeper Lambda

#### API Gateway (REST)
- **InvoiceApi** — "Invoice Service"
  - Stage: `prod`
  - CORS: ALL_ORIGINS / ALL_METHODS
  - Logging: JSON, INFO level, data trace enabled
  - API Key: `CryptoInvoiceApiKey`
  - Usage Plan: `CryptoInvoiceUsagePlan` (100 req/s, 200 burst, 10K/month)

**Endpoints:**
| Method | Resource | Lambda | API Key |
|--------|----------|--------|---------|
| POST | `/generateInvoice` | InvoiceFunction | Required |
| GET | `/invoices` | InvoiceManagementFunction | Required |
| GET | `/invoices/{invoiceId}` | InvoiceManagementFunction | Required |
| PUT | `/invoices/{invoiceId}` | InvoiceManagementFunction | Required |
| DELETE | `/invoices/{invoiceId}` | InvoiceManagementFunction | Required |

#### Lambda Functions
1. **InvoiceFunction** — Invoice generation
   - Entry: `lambda/invoice/index.js`
   - Memory: 256 MB, Timeout: 30s
   - Permissions: DynamoDB (invoices + counter) RW, Secrets Manager (mnemonic) Read
   - Environment: `TABLE`, `COUNTER_TABLE`

2. **InvoiceManagementFunction** — CRUD operations
   - Entry: `lambda/invoice-management/index.js`
   - Memory: 256 MB, Timeout: 30s
   - Permissions: DynamoDB (invoices) RW
   - Environment: `TABLE`

3. **WatcherFunction** — Payment monitoring
   - Entry: `lambda/watcher/index.js`
   - Memory: 256 MB, Timeout: 30s
   - Permissions: DynamoDB (invoices) RW, SNS Publish
   - Environment: `TABLE`, `RPC_URL`, `SNS_TOPIC_ARN`
   - Trigger: EventBridge rule (every 1 minute)

4. **SweeperFunction** — Fund sweeping
   - Entry: `lambda/sweeper/index.js`
   - Memory: 256 MB, Timeout: 15 minutes
   - Reserved concurrency: 1
   - Permissions: DynamoDB (invoices) RW, Secrets Manager (mnemonic + hot-pk) Read, SNS Publish
   - Environment: `TABLE`, `TREASURY_PUBLIC_ADDRESS`, `RPC_URL`, `SNS_TOPIC_ARN`
   - Trigger: DynamoDB Stream (filtered: eventName=MODIFY, status=paid)
   - Event source config: batchSize=1, retryAttempts=3, parallelizationFactor=1, reportBatchItemFailures=true

#### EventBridge Rule
- **WatcherScheduleRule** — `rate(1 minute)` → WatcherFunction

#### CloudWatch Log Groups
- InvoiceFunction: 2-week retention
- InvoiceManagementFunction: 2-week retention
- WatcherFunction: 2-week retention
- SweeperFunction: 1-month retention (longer for audit trail)
- API Gateway Access Logs: 2-week retention

---

### SolanaInvoiceStack (`non-evm-deployments/solana/lib/solana-invoice-stack.ts` — 406 lines)

The Solana stack mirrors the EVM stack with these notable differences:

#### Key Differences from EVM Stack

| Aspect | EVM Stack | Solana Stack |
|--------|-----------|--------------|
| Hot Wallet | Raw private key in Secrets Manager | KMS CfnKey (ECC_NIST_EDWARDS25519) |
| Secret Name (Mnemonic) | `hd-wallet-mnemonic` | `solana-wallet-mnemonic` |
| RPC URL Env Var | `RPC_URL` | `SOLANA_RPC_URL` |
| Treasury Env Var | `TREASURY_PUBLIC_ADDRESS` | `SOLANA_TREASURY_PUBLIC_KEY` |
| Sweeper Extra Permissions | Secrets Manager (hot-pk) | KMS (Sign + GetPublicKey) |
| Sweeper Extra Env | — | `KMS_KEY_ID` |
| Log Group (Sweeper) | Default name | Explicit: `/aws/lambda/${stackName}-SolanaSweeperFunction` |
| Counter Key | `hd-index` | `solana-index` |

#### KMS Key (Solana-specific)
- **SolanaHotWalletKey** — Ed25519 signing key
  - Key Spec: `ECC_NIST_EDWARDS25519`
  - Key Usage: `SIGN_VERIFY`
  - Granted actions: `kms:Sign`, `kms:GetPublicKey` (to Sweeper Lambda)

---

## Stack Outputs (CloudFormation)

### EVM Stack Outputs
| Output | Description |
|--------|-------------|
| `InvoiceFunctionName` | Invoice Lambda function name |
| `InvoiceManagementFunctionName` | Management Lambda function name |
| `WatcherFunctionName` | Watcher Lambda function name |
| `SweeperFunctionName` | Sweeper Lambda function name |
| `WalletSeedSecretName` | Secrets Manager mnemonic name |
| `WalletHotPkSecretName` | Secrets Manager hot-pk name |
| `PaymentNotificationTopicArn` | SNS topic ARN |
| `InvoiceApiUrl` | Full API URL for invoice generation |
| `InvoiceApiBaseUrl` | Base API URL |
| `InvoiceApiKeyId` | API Key ID |

### Solana Stack Outputs
| Output | Description |
|--------|-------------|
| `SolanaInvoiceFunctionName` | Solana Invoice Lambda name |
| `SolanaInvoiceManagementFunctionName` | Solana Management Lambda name |
| `SolanaWatcherFunctionName` | Solana Watcher Lambda name |
| `SolanaSweeperFunctionName` | Solana Sweeper Lambda name |
| `SolanaWalletSeedSecretName` | Solana mnemonic secret name |
| `SolanaHotWalletKmsKeyId` | KMS Key ID for signing |
| `SolanaPaymentNotificationTopicArn` | Solana SNS topic ARN |
| `SolanaInvoiceApiUrl` | Solana API URL for invoice generation |
| `SolanaInvoiceApiBaseUrl` | Solana Base API URL |
| `SolanaInvoiceApiKeyId` | Solana API Key ID |

---

## Related Documentation

- [System Overview →](system-overview.md)
- [Dependencies →](dependencies.md)
- [Architecture Patterns →](patterns.md)
- [Data Models →](../reference/data-models.md)
