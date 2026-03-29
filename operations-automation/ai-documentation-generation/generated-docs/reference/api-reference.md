# API Reference

> **Navigation:** [← README](../README.md) | [Interfaces →](interfaces.md) | [Data Models →](data-models.md) | [Business Logic →](../behavior/business-logic.md)

## Base URL

```
EVM:    https://{api-id}.execute-api.{region}.amazonaws.com/prod/
Solana: https://{api-id}.execute-api.{region}.amazonaws.com/prod/
```

## Authentication

All endpoints require an API key passed via the `X-API-Key` header.

```
X-API-Key: <your-api-key>
```

---

## Endpoints

### POST `/generateInvoice`

Creates a new cryptocurrency invoice with a unique HD-derived wallet address.

#### Headers
| Header | Required | Value |
|--------|----------|-------|
| Content-Type | Yes | `application/json` |
| X-API-Key | Yes | API key value |

#### Request Body (EVM)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `currency` | string | Yes | `"ETH"` or `"ERC20"` |
| `amount` | string | Yes | Payment amount (e.g., `"0.01"`, `"5.00"`) |
| `tokenAddress` | string | If ERC20 | ERC20 contract address |
| `tokenSymbol` | string | If ERC20 | Token symbol (e.g., `"USDC"`) |
| `decimals` | number | If ERC20 | Token decimal places (default: 6 for ERC20, 18 for ETH) |

**EVM Example — Native ETH:**
```json
{
  "currency": "ETH",
  "amount": "0.01"
}
```

**EVM Example — ERC20 Token (USDC):**
```json
{
  "currency": "ERC20",
  "tokenAddress": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  "tokenSymbol": "USDC",
  "amount": "5.00",
  "decimals": 6
}
```

#### Request Body (Solana)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `currency` | string | Yes | `"SOL"` or `"SPL"` |
| `amount` | string | Yes | Payment amount |
| `tokenMint` | string | If SPL | SPL token mint address |
| `tokenSymbol` | string | If SPL | Token symbol |

**Solana Example — Native SOL:**
```json
{
  "currency": "SOL",
  "amount": "0.01"
}
```

**Solana Example — SPL Token:**
```json
{
  "currency": "SPL",
  "tokenMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "tokenSymbol": "USDC",
  "amount": "5.00"
}
```

#### Success Response (`200`)
```json
{
  "invoiceId": "524dd9e8-82c3-4f70-8540-74c693111dbe",
  "address": "0xF67e4b8078d837822b8E602F12af76B228a0c1f5",
  "index": 8,
  "qrcodeBase64": "data:image/png;base64,..."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `invoiceId` | string (UUID) | Unique invoice identifier |
| `address` | string | HD-derived deposit wallet address |
| `index` | number | HD wallet derivation index |
| `qrcodeBase64` | string | Base64-encoded QR code data URL |

#### Error Responses
| Status | Condition | Body |
|--------|-----------|------|
| 500 | Unsupported currency | `{ "error": "Unsupported currency type..." }` |
| 500 | Secrets Manager failure | `{ "error": "<error message>" }` |

---

### GET `/invoices`

Retrieves all invoices with optional status filtering and pagination.

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `status` | string | No | — | Filter by status: `pending`, `paid`, `swept`, `cancelled` |
| `limit` | string | No | `"50"` | Max results (EVM max: unlimited, Solana enforced max: 100) |
| `lastKey` | string | No | — | Pagination token (URL-encoded JSON) |

#### Success Response (`200`)
```json
{
  "invoices": [
    {
      "invoiceId": "...",
      "address": "...",
      "path": "m/44'/60'/0'/0/8",
      "currency": "ETH",
      "tokenAddress": null,
      "tokenSymbol": "ETH",
      "amount": "0.01",
      "status": "pending",
      "createdAt": "2025-07-07T15:49:41.981Z"
    }
  ],
  "lastEvaluatedKey": "...",
  "count": 1
}
```

**Note:** When `status` is provided, uses GSI query (`status-index`). Otherwise, performs a full table scan.

---

### GET `/invoices/{invoiceId}`

Retrieves a specific invoice by ID.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `invoiceId` | string | Yes | Invoice UUID |

#### Success Response (`200`)
```json
{
  "invoiceId": "ed4880c6-ae2f-4400-ac45-9c263e109caf",
  "address": "0xF67e4b8078d837822b8E602F12af76B228a0c1f5",
  "path": "m/44'/60'/0'/0/8",
  "currency": "ETH",
  "tokenAddress": null,
  "tokenSymbol": "ETH",
  "amount": "0.00001",
  "status": "swept",
  "createdAt": "2025-07-07T15:49:41.981Z",
  "paidAt": "2025-07-07T15:50:07.551Z",
  "sweptAt": "2025-07-07T15:50:40.245Z"
}
```

#### Error Responses
| Status | Condition | Body |
|--------|-----------|------|
| 404 | Invoice not found | `{ "error": "Invoice not found" }` |

---

### PUT `/invoices/{invoiceId}`

Updates invoice status (restricted to safe transitions only).

#### Request Body
```json
{
  "status": "cancelled"
}
```

#### Allowed Status Transitions

| Current Status | Allowed Target | Rule |
|----------------|---------------|------|
| `pending` | `cancelled` | Unpaid invoice can be cancelled |
| `cancelled` | `pending` | Cancelled invoice can be reactivated |
| `paid` | *(none)* | Immutable — payment detected |
| `swept` | *(none)* | Immutable — funds transferred |

#### Success Response (`200`)

**EVM:** Returns full updated invoice object
```json
{
  "invoiceId": "...",
  "status": "cancelled",
  "updatedAt": "2025-07-07T16:00:00.000Z",
  "..."
}
```

**Solana:** Returns success message
```json
{
  "message": "Invoice updated successfully"
}
```

#### Error Responses
| Status | Condition | Body |
|--------|-----------|------|
| 400 | Missing status | `{ "error": "Status is required" }` |
| 400 | Invalid transition (EVM) | `{ "error": "Invalid status transition: cannot change from 'paid' to 'cancelled'..." }` |
| 400 | Invalid target status (Solana) | `{ "error": "Only pending and cancelled statuses are allowed" }` |
| 403 | Immutable status (Solana) | `{ "error": "Cannot modify paid or swept invoices" }` |
| 404 | Invoice not found | `{ "error": "Invoice not found" }` |

---

### DELETE `/invoices/{invoiceId}`

Deletes an invoice (only pending or cancelled invoices can be deleted).

#### Success Response (`200`)
```json
{
  "message": "Invoice deleted successfully"
}
```

#### Error Responses
| Status | Condition | Body |
|--------|-----------|------|
| 400 | Missing invoiceId (EVM) | `{ "error": "Invoice ID is required" }` |
| 400 | Non-deletable status (EVM) | `{ "error": "Invoice not found or cannot be deleted (only pending and cancelled invoices can be deleted)" }` |
| 403 | Non-deletable status (Solana) | `{ "error": "Only pending or cancelled invoices can be deleted" }` |
| 404 | Invoice not found (Solana) | `{ "error": "Invoice not found" }` |

---

## Implementation Differences (EVM vs Solana)

| Aspect | EVM | Solana |
|--------|-----|--------|
| Delete validation | Uses DynamoDB ConditionExpression | Uses pre-fetch + explicit status check |
| Update validation | Uses pre-fetch + transition map | Uses pre-fetch + explicit status check |
| Update response | Returns `ALL_NEW` attributes | Returns success message only |
| List without status | Table scan | Table scan |
| List with status | GSI query | GSI query |
| 404 on unmatched route | 405 (Method Not Allowed) | 404 (Not Found) |

---

## Related Documentation

- [Interfaces →](interfaces.md)
- [Data Models →](data-models.md)
- [Business Logic →](../behavior/business-logic.md)
- [Architecture Overview →](../architecture/system-overview.md)
