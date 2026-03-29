# Service Data Flow Diagrams

## AWS Service Data Flow

```mermaid
graph TD
    subgraph "Inbound Flow"
        API[API Gateway] -->|JSON body| INV[Invoice Lambda]
        API -->|JSON body| MGMT[Management Lambda]
    end
    
    subgraph "Data Storage"
        INV -->|Put item| DDB_INV[(Invoices Table)]
        INV -->|Update counter| DDB_CTR[(Counter Table)]
        MGMT -->|Get/Query/Update/Delete| DDB_INV
    end
    
    subgraph "Secret Access"
        INV -->|GetSecretValue| SM[Secrets Manager]
        SWEEP -->|GetSecretValue| SM
    end
    
    subgraph "Event Processing"
        EB[EventBridge<br/>1-min schedule] -->|Scheduled event| WATCH[Watcher Lambda]
        WATCH -->|Query GSI| DDB_INV
        WATCH -->|Update status=paid| DDB_INV
        DDB_INV -->|Stream event<br/>status=paid| STREAM[DynamoDB Stream]
        STREAM -->|Filtered event| SWEEP[Sweeper Lambda]
        SWEEP -->|Update status=swept| DDB_INV
    end
    
    subgraph "External Communication"
        WATCH -->|Balance check| RPC[Blockchain RPC]
        SWEEP -->|Transfer funds| RPC
        WATCH -->|Publish notification| SNS[SNS Topic]
        SWEEP -->|Publish error alert| SNS
    end
    
    subgraph "Treasury"
        RPC -->|Funds| TREASURY[Treasury Wallet]
    end
```

## Data Transformation Flow

```mermaid
graph LR
    subgraph "Invoice Creation"
        REQ[API Request<br/>currency, amount, tokenAddress] 
        --> DERIVE[HD Derivation<br/>mnemonic + index → address]
        --> STORE[DynamoDB Item<br/>invoiceId, address, path,<br/>currency, amount, status]
        --> RESP[API Response<br/>invoiceId, address,<br/>index, qrcodeBase64]
    end
    
    subgraph "Payment Detection"
        PENDING[Pending Invoices<br/>GSI Query]
        --> BALANCE[Blockchain Balance<br/>RPC Call]
        --> COMPARE[Compare<br/>balance >= required?]
        --> PAID[Update: status=paid<br/>paidAt timestamp]
    end
    
    subgraph "Fund Sweeping"
        STREAM_EVT[Stream Event<br/>NewImage with status=paid]
        --> REDERIVE[Re-derive Wallet<br/>mnemonic + path]
        --> ESTIMATE[Gas/Fee Estimation<br/>with buffer]
        --> TRANSFER[Fund Transfer<br/>invoice → treasury]
        --> SWEPT[Update: status=swept<br/>sweptAt timestamp]
    end
```

## Secrets Data Flow

```mermaid
graph TD
    subgraph "EVM Secrets Flow"
        SM_MN[Secrets Manager<br/>hd-wallet-mnemonic<br/>{mnemonic: "..."}]
        SM_PK[Secrets Manager<br/>wallet/hot-pk<br/>{pk: "0x..."}]
        
        SM_MN -->|Read| EVM_INV[Invoice Lambda<br/>→ HD wallet derivation]
        SM_MN -->|Read| EVM_SWEEP[Sweeper Lambda<br/>→ Re-derive invoice wallet]
        SM_PK -->|Read| EVM_SWEEP
    end
    
    subgraph "Solana Secrets Flow"
        SM_SOL[Secrets Manager<br/>solana-wallet-mnemonic<br/>{mnemonic: "..."}]
        KMS[KMS Key<br/>Ed25519 (SIGN_VERIFY)]
        
        SM_SOL -->|Read| SOL_INV[Invoice Lambda<br/>→ ed25519 key derivation]
        SM_SOL -->|Read| SOL_SWEEP[Sweeper Lambda<br/>→ Re-derive invoice keypair]
        KMS -->|GetPublicKey| SOL_SWEEP
        KMS -->|Sign| SOL_SWEEP
    end
```
