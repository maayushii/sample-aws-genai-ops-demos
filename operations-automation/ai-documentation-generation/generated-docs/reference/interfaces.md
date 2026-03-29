# Interfaces Documentation

> **Navigation:** [← API Reference](api-reference.md) | [Data Models →](data-models.md) | [Program Structure →](program-structure.md)

## Lambda Handler Interfaces

### 1. Invoice Handler

**Source:** `lambda/invoice/index.js` (EVM), `non-evm-deployments/solana/lambda/invoice/index.js` (Solana)

```javascript
// Function Signature
exports.handler = async (event) => { ... }
```

**Input Event:** API Gateway Proxy Event (POST /generateInvoice)
```json
{
  "body": "{\"currency\":\"ETH\",\"amount\":\"0.01\"}",
  "httpMethod": "POST",
  "path": "/generateInvoice",
  "headers": { "Content-Type": "application/json", "X-API-Key": "..." }
}
```

**Also supports:** Direct Lambda invocation (body fields at root level)

**Output:** API Gateway Proxy Response
```json
{
  "statusCode": 200,
  "headers": { "Content-Type": "application/json" },
  "body": "{\"invoiceId\":\"...\",\"address\":\"...\",\"index\":8,\"qrcodeBase64\":\"...\"}"
}
```

**Internal Dependencies:**
- Secrets Manager: `GetSecretValue` (mnemonic)
- DynamoDB: `Update` (counter), `Put` (invoice)
- Blockchain library: HD wallet derivation
- QRCode: Data URL generation

---

### 2. Invoice Management Handler

**Source:** `lambda/invoice-management/index.js` (EVM), `non-evm-deployments/solana/lambda/invoice-management/index.js` (Solana)

```javascript
// Function Signature
exports.handler = async (event) => { ... }
```

**Input Event:** API Gateway Proxy Event (multi-method router)

**Routing Logic:**

| httpMethod | pathParameters.invoiceId | Action |
|------------|--------------------------|--------|
| GET | undefined | `getInvoices(queryStringParameters)` |
| GET | present | `getInvoice(invoiceId)` |
| PUT | present | `updateInvoiceStatus(invoiceId, body)` |
| DELETE | present | `deleteInvoice(invoiceId)` |
| other | — | 405 Method Not Allowed (EVM) / 404 Not Found (Solana) |

**Internal Functions (EVM):**
- `getInvoice(invoiceId)` → DynamoDB Get
- `getInvoices(queryParams)` → DynamoDB Query (GSI) or Scan
- `updateInvoiceStatus(invoiceId, body)` → Get + transition check + Update
- `deleteInvoice(invoiceId)` → Delete with ConditionExpression

**Internal Functions (Solana):**
- `getInvoice(invoiceId)` → DynamoDB Get
- `getAllInvoices(queryParams)` → DynamoDB Query (GSI) or Scan
- `updateInvoice(invoiceId, body)` → Get + status check + Update
- `deleteInvoice(invoiceId)` → Get + status check + Delete

---

### 3. Watcher Handler

**Source:** `lambda/watcher/index.js` (EVM), `non-evm-deployments/solana/lambda/watcher/index.js` (Solana)

```javascript
// Function Signature
exports.handler = async () => { ... }
```

**Input Event:** EventBridge Scheduled Event (no specific event body used)

**Output:**
```json
{
  "status": "completed",
  "processed": ["invoiceId1", "invoiceId2"],
  "failed": [{ "invoiceId": "...", "error": "..." }]
}
```

**Internal Functions (EVM):**
- `markPaid(invoiceId)` → DynamoDB Update (status=paid)
- `notifyMerchant(invoice)` → SNS Publish

**Internal Functions (Solana):**
- `markPaid(invoiceId)` → DynamoDB Update (status=paid)
- `notifyMerchant(invoice)` → SNS Publish

---

### 4. Sweeper Handler

**Source:** `lambda/sweeper/index.js` (EVM), `non-evm-deployments/solana/lambda/sweeper/index.js` (Solana)

```javascript
// Function Signature
exports.handler = async (event) => { ... }
```

**Input Event:** DynamoDB Stream Event
```json
{
  "Records": [
    {
      "eventName": "MODIFY",
      "dynamodb": {
        "NewImage": {
          "invoiceId": { "S": "..." },
          "status": { "S": "paid" },
          "path": { "S": "m/44'/60'/0'/0/8" },
          "currency": { "S": "ETH" },
          "tokenAddress": { "S": "0x..." },
          "..."
        }
      }
    }
  ]
}
```

**Output:**
```json
{
  "sweptCount": 1
}
```

**Internal Functions (EVM):**
- `addGasBuffer(estimatedGas, bufferPercent)` → BigInt gas calculation
- `sendErrorNotification(error, invoiceId)` → SNS Publish
- `ensureSufficientGas(invoiceWallet, hotWallet, estimatedFee, gasPrice, invoiceId, currency)` → Optional gas top-up

**Internal Functions (Solana):**
- `getHotWalletPublicKey()` → KMS GetPublicKey (cached)
- `signWithKms(message)` → KMS Sign (ED25519_SHA_512)
- `sendErrorNotification(error, invoiceId)` → SNS Publish

---

## Event Source Structures

### API Gateway Proxy Event
```typescript
interface APIGatewayProxyEvent {
  httpMethod: string;           // "GET", "POST", "PUT", "DELETE"
  path: string;                 // "/generateInvoice", "/invoices", "/invoices/{invoiceId}"
  pathParameters: {
    invoiceId?: string;
  } | null;
  queryStringParameters: {
    status?: string;
    limit?: string;
    lastKey?: string;
  } | null;
  body: string | null;          // JSON string
  headers: {
    "Content-Type"?: string;
    "X-API-Key"?: string;
  };
}
```

### DynamoDB Stream Event
```typescript
interface DynamoDBStreamEvent {
  Records: Array<{
    eventName: "INSERT" | "MODIFY" | "REMOVE";
    dynamodb: {
      NewImage: Record<string, AttributeValue>;
      OldImage?: Record<string, AttributeValue>;
    };
  }>;
}
```

### EventBridge Scheduled Event
```typescript
// The watcher handler ignores the event payload entirely
// exports.handler = async () => { ... }
```

---

## Service Contracts

### Secrets Manager Contracts
| Secret ID | Expected Shape | Consumers |
|-----------|---------------|-----------|
| `hd-wallet-mnemonic` | `{ "mnemonic": "<BIP-39 phrase>" }` | Invoice, Sweeper (EVM) |
| `wallet/hot-pk` | `{ "pk": "<hex private key>" }` | Sweeper (EVM) |
| `solana-wallet-mnemonic` | `{ "mnemonic": "<BIP-39 phrase>" }` | Invoice, Sweeper (Solana) |

### DynamoDB Contracts
| Operation | Table | Handler | Key/Index |
|-----------|-------|---------|-----------|
| Put (invoice) | Invoices | Invoice | `invoiceId` |
| Update (counter) | Counter | Invoice | `counterId` |
| Get (single) | Invoices | Management | `invoiceId` |
| Query (by status) | Invoices | Management, Watcher | GSI `status-index` |
| Scan (all) | Invoices | Management | — |
| Update (status) | Invoices | Management, Watcher, Sweeper | `invoiceId` |
| Delete | Invoices | Management | `invoiceId` |

---

## Related Documentation

- [API Reference →](api-reference.md)
- [Data Models →](data-models.md)
- [Business Logic →](../behavior/business-logic.md)
- [Architecture Components →](../architecture/components.md)
