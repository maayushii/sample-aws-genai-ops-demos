# System Architecture Overview

> **Navigation:** [← README](../README.md) | [Components →](components.md) | [Dependencies →](dependencies.md) | [Patterns →](patterns.md)

## Executive Summary

**crypto-invoice-cdk** is a serverless digital asset payment processing system deployed on AWS. It provides an end-to-end pipeline for creating cryptocurrency invoices, monitoring blockchain payments, and automatically sweeping funds to a treasury wallet. The system supports two blockchain ecosystems through parallel deployments:

- **EVM Stack** (`CryptoInvoiceStack`) — Ethereum and ERC20 tokens on any EVM-compatible chain
- **Solana Stack** (`SolanaInvoiceStack`) — Native SOL and SPL tokens on Solana

---

## High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Merchant[🏪 Merchant Application]
    end

    subgraph "API Layer"
        APIGW[Amazon API Gateway<br/>REST API + API Key Auth]
    end

    subgraph "Compute Layer"
        InvoiceFn[📄 Invoice Lambda<br/>Generate Invoice]
        MgmtFn[📋 Invoice Management Lambda<br/>CRUD Operations]
        WatcherFn[👁 Watcher Lambda<br/>Payment Monitoring]
        SweeperFn[🧹 Sweeper Lambda<br/>Fund Sweeping]
    end

    subgraph "Data Layer"
        DDB_Invoices[(DynamoDB<br/>Invoices Table)]
        DDB_Counter[(DynamoDB<br/>Counter Table)]
        Secrets[🔐 Secrets Manager<br/>Mnemonic + Hot Wallet Key]
    end

    subgraph "Event Layer"
        EB[⏰ EventBridge<br/>1-min Schedule]
        DDBStream[📡 DynamoDB Streams<br/>status=paid Filter]
        SNS[📨 SNS Topic<br/>Notifications]
    end

    subgraph "Blockchain Layer"
        RPC[🌐 Blockchain RPC<br/>EVM / Solana]
        Treasury[🏦 Treasury Wallet<br/>Cold Storage]
    end

    Merchant --> APIGW
    APIGW --> InvoiceFn
    APIGW --> MgmtFn
    
    InvoiceFn --> Secrets
    InvoiceFn --> DDB_Counter
    InvoiceFn --> DDB_Invoices
    
    MgmtFn --> DDB_Invoices
    
    EB --> WatcherFn
    WatcherFn --> DDB_Invoices
    WatcherFn --> RPC
    WatcherFn --> SNS
    
    DDB_Invoices --> DDBStream
    DDBStream --> SweeperFn
    SweeperFn --> Secrets
    SweeperFn --> RPC
    SweeperFn --> DDB_Invoices
    SweeperFn --> SNS
    SweeperFn --> Treasury
```

---

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant M as Merchant
    participant API as API Gateway
    participant Inv as Invoice Lambda
    participant SM as Secrets Manager
    participant DDB as DynamoDB
    participant EB as EventBridge
    participant W as Watcher Lambda
    participant RPC as Blockchain RPC
    participant SNS as SNS Topic
    participant DS as DynamoDB Stream
    participant S as Sweeper Lambda
    participant T as Treasury Wallet

    M->>API: POST /generateInvoice
    API->>Inv: Invoke (API Key validated)
    Inv->>SM: Get mnemonic
    Inv->>DDB: Increment atomic counter
    Inv->>DDB: Store invoice (status=pending)
    Inv-->>M: Return invoiceId, address, QR code

    Note over EB,W: Every 1 minute
    EB->>W: Scheduled trigger
    W->>DDB: Query pending invoices (GSI)
    W->>RPC: Check balances
    W->>DDB: Update status to "paid"
    W->>SNS: Notify merchant (payment received)

    DDB->>DS: Stream event (status=paid)
    DS->>S: Trigger sweeper
    S->>SM: Get mnemonic + hot wallet key
    S->>RPC: Estimate gas / fees
    S->>RPC: Optional: gas top-up
    S->>RPC: Transfer funds to treasury
    S->>DDB: Update status to "swept"
    S-->>T: Funds consolidated
```

---

## Deployment Architecture

### EVM Deployment (`CryptoInvoiceStack`)

| Resource | Configuration |
|----------|---------------|
| **CDK Entry** | `bin/crypto-invoice.ts` |
| **Stack** | `lib/crypto-invoice-stack.ts` |
| **Lambda Runtime** | Node.js 22.x |
| **Lambda Memory** | 256 MB (all functions) |
| **Invoice Timeout** | 30 seconds |
| **Watcher Timeout** | 30 seconds |
| **Sweeper Timeout** | 15 minutes |
| **Sweeper Concurrency** | 1 (reserved) |
| **DynamoDB Billing** | PAY_PER_REQUEST |
| **DynamoDB Stream** | NEW_IMAGE |
| **EventBridge Schedule** | Every 1 minute |
| **API Stage** | `prod` |
| **API Throttle** | 100 req/s rate, 200 burst |
| **API Quota** | 10,000 req/month |
| **Log Retention** | 2 weeks (general), 1 month (sweeper) |
| **CDK Nag** | AwsSolutionsChecks enabled |

### Solana Deployment (`SolanaInvoiceStack`)

| Resource | Configuration |
|----------|---------------|
| **CDK Entry** | `non-evm-deployments/solana/bin/solana-invoice.ts` |
| **Stack** | `non-evm-deployments/solana/lib/solana-invoice-stack.ts` |
| **Lambda Runtime** | Node.js 22.x |
| **Lambda Memory** | 256 MB (all functions) |
| **KMS Key** | ECC_NIST_EDWARDS25519 (for hot wallet signing) |
| **Hot Wallet** | KMS-based ed25519 signing (no raw private key) |
| **Region** | Configurable (default: us-east-1) |

> **Key Difference:** The Solana stack uses AWS KMS for ed25519 signing instead of storing a raw private key in Secrets Manager, representing an improved security posture.

---

## AWS Service Configuration Details

### Lambda Function Settings

| Function | Memory | Timeout | Reserved Concurrency | Event Source |
|----------|--------|---------|---------------------|--------------|
| Invoice | 256 MB | 30s | Default | API Gateway (POST) |
| Invoice Management | 256 MB | 30s | Default | API Gateway (GET/PUT/DELETE) |
| Watcher | 256 MB | 30s | Default | EventBridge (1-min rate) |
| Sweeper | 256 MB | 15 min | 1 | DynamoDB Stream (filtered) |

### DynamoDB Tables

| Table | Partition Key | Billing | Stream | GSI |
|-------|--------------|---------|--------|-----|
| Invoices | `invoiceId` (S) | PAY_PER_REQUEST | NEW_IMAGE | `status-index` (status → ALL) |
| Counter | `counterId` (S) | PAY_PER_REQUEST | None | None |

### API Gateway Configuration

- **Type:** REST API
- **Stage:** `prod`
- **Auth:** API Key required on all endpoints
- **CORS:** ALL_ORIGINS, ALL_METHODS ⚠️
- **Logging:** JSON format, INFO level, data trace enabled ⚠️
- **Usage Plan:** 100 req/s, 200 burst, 10K/month quota

---

## Environment Variables

### EVM Stack
| Lambda | Variables |
|--------|-----------|
| Invoice | `TABLE`, `COUNTER_TABLE` |
| Invoice Management | `TABLE` |
| Watcher | `TABLE`, `RPC_URL`, `SNS_TOPIC_ARN` |
| Sweeper | `TABLE`, `TREASURY_PUBLIC_ADDRESS`, `RPC_URL`, `SNS_TOPIC_ARN` |

### Solana Stack
| Lambda | Variables |
|--------|-----------|
| Invoice | `TABLE`, `COUNTER_TABLE` |
| Invoice Management | `TABLE` |
| Watcher | `TABLE`, `SOLANA_RPC_URL`, `SNS_TOPIC_ARN` |
| Sweeper | `TABLE`, `SOLANA_TREASURY_PUBLIC_KEY`, `SOLANA_RPC_URL`, `SNS_TOPIC_ARN`, `KMS_KEY_ID` |

---

## Related Documentation

- [Component Details →](components.md)
- [Dependency Map →](dependencies.md)
- [Architecture Patterns →](patterns.md)
- [API Reference →](../reference/api-reference.md)
- [Technical Debt Report →](../technical-debt-report.md)
