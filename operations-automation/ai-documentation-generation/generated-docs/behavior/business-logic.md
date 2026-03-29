# Business Logic Documentation

> **Navigation:** [← README](../README.md) | [Workflows →](workflows.md) | [Decision Logic →](decision-logic.md) | [API Reference →](../reference/api-reference.md)

## 1. Invoice Generation Logic

### EVM Invoice Generation (`lambda/invoice/index.js`)

**Sequence:**
1. Parse request body (supports API Gateway proxy event or direct invocation)
2. Retrieve HD wallet mnemonic from Secrets Manager (`hd-wallet-mnemonic`)
3. Atomically increment the counter in DynamoDB (`hd-index`)
4. Derive HD wallet address using BIP-44 path `m/44'/60'/0'/0/{index}`
5. Generate UUID for invoiceId
6. Store invoice in DynamoDB with `status: pending`
7. Generate payment URI based on currency type
8. Generate QR code as Base64 data URL
9. Return invoiceId, address, index, and QR code

**Key Business Rules:**
- Default currency: `ETH` (if not specified)
- Default amount: `0.0001` (if not specified)
- Default decimals: 18 for ETH, 6 for ERC20
- Default token symbol: `ETH` for ETH, `USDC` for ERC20
- `tokenAddress` is null for ETH invoices

### Solana Invoice Generation (`non-evm-deployments/solana/lambda/invoice/index.js`)

**Same sequence but with Solana-specific differences:**
- Uses AWS SDK v3 (`SecretsManagerClient`, `DynamoDBDocumentClient`)
- Secret name: `solana-wallet-mnemonic`
- Counter key: `solana-index`
- Derivation path: `m/44'/501'/{index}'/0'`
- Uses `ed25519-hd-key` for seed derivation + `Keypair.fromSeed`
- Default currency: `SOL`, default amount: `0.01`
- Uses `tokenMint` instead of `tokenAddress`
- Payment URI uses `solana:` protocol

---

## 2. Payment Monitoring Logic (Watcher)

### EVM Watcher (`lambda/watcher/index.js`)

**Sequence:**
1. Query all pending invoices from DynamoDB GSI (`status-index`, status=pending)
2. For each pending invoice:
   - If `currency === 'ETH'`: Check native ETH balance via `provider.getBalance(address)`
   - If `currency === 'ERC20'`: Check token balance via ERC20 `balanceOf(address)` contract call
3. Compare balance against required amount:
   - ETH: `balance >= ethers.parseEther(amount)`
   - ERC20: `balance >= ethers.parseUnits(amount, decimals)` (decimals fetched from contract)
4. If sufficient: `markPaid(invoiceId)` → `notifyMerchant(invoice)`
5. Track processed and failed invoices, return summary

**Key Business Rules:**
- Runs every 1 minute (EventBridge schedule)
- Payment is "all or nothing" — partial payments are not recognized
- Once paid, the `paidAt` timestamp is recorded
- Merchant notification via SNS includes: invoiceId, amount, symbol, address, timestamp

### Solana Watcher (`non-evm-deployments/solana/lambda/watcher/index.js`)

**Solana-specific differences:**
- SOL: `connection.getBalance(publicKey)` → compare in lamports
- SPL: Finds Associated Token Address (ATA) → `getAccount(connection, ata)` → compares token balance
- SPL: Fetches actual decimals from mint via `getMint(connection, mintPublicKey)`
- SPL: Handles `TokenAccountNotFoundError` gracefully (ATA not yet created)
- All AWS operations use SDK v3 (`QueryCommand`, `UpdateCommand`, `PublishCommand`)

---

## 3. Fund Sweeping Logic (Sweeper)

### EVM Sweeper (`lambda/sweeper/index.js`)

**Triggered by:** DynamoDB Stream (filtered for MODIFY events where status=paid)

**Sequence:**
1. Fetch mnemonic and hot wallet private key from Secrets Manager
2. Create hot wallet instance (`ethers.Wallet(pk, provider)`)
3. For each DynamoDB Stream record:
   - Unmarshall the NewImage
   - Skip if status ≠ `paid` (defensive check)
   - Re-derive invoice wallet from mnemonic + path
   - Get current gas price from `provider.getFeeData()`

**ETH Sweep:**
1. Estimate gas for a transfer to treasury
2. Add 10% gas buffer
3. Call `ensureSufficientGas()` — if invoice address has insufficient ETH for gas, hot wallet sends top-up
4. Calculate `sweepAmount = ethBalance - estimatedFee`
5. Send full ETH balance (minus gas) to treasury
6. Wait for transaction confirmation

**ERC20 Sweep:**
1. Check ERC20 token balance (skip if zero)
2. Estimate gas for ERC20 `transfer()` call
3. Add 10% gas buffer
4. Call `ensureSufficientGas()` — hot wallet tops up ETH for gas if needed
5. Execute ERC20 `transfer(treasuryAddress, tokenBalance)`
6. Wait for transaction confirmation

**Post-sweep:** Update invoice status to `swept` with `sweptAt` timestamp

### Solana Sweeper (`non-evm-deployments/solana/lambda/sweeper/index.js`)

**SOL Sweep:**
1. Get balance → estimate fee → skip if balance ≤ fee
2. Transfer `balance - fee` to treasury
3. Sign with invoice keypair

**SPL Sweep:**
1. Get source ATA → check token balance (skip if zero)
2. Get destination ATA → create if doesn't exist (using hot wallet as payer)
3. Transfer all tokens from source to destination ATA
4. Close source ATA (reclaim rent to hot wallet)
5. Sign transaction with both KMS (hot wallet as fee payer) and invoice keypair
6. Serialize and send raw transaction

---

## 4. Invoice Management Logic

### CRUD Operations (`lambda/invoice-management/index.js`)

**GET /invoices (List):**
- Without `status`: Full table scan with pagination (limit default: 50)
- With `status`: GSI query on `status-index` with pagination
- Returns: invoices array, lastEvaluatedKey (pagination token), count

**GET /invoices/{invoiceId} (Read):**
- DynamoDB `Get` by partition key
- Returns 404 if not found

**PUT /invoices/{invoiceId} (Update Status):**
- Pre-fetches current invoice to validate transition
- Checks against `allowedTransitions` map:
  - `pending → [cancelled]`
  - `cancelled → [pending]`
  - `paid → []` (no transitions allowed)
  - `swept → []` (no transitions allowed)
- Uses `ConditionExpression: attribute_exists(invoiceId)` for atomicity
- Sets `updatedAt` timestamp

**DELETE /invoices/{invoiceId} (Delete):**
- EVM: Uses `ConditionExpression` to ensure only `pending` or `cancelled` invoices are deleted
- Solana: Pre-fetches and validates status before deletion
- Returns 400/403 for non-deletable invoices

---

## Related Documentation

- [Workflows →](workflows.md)
- [Decision Logic →](decision-logic.md)
- [Error Handling →](error-handling.md)
- [API Reference →](../reference/api-reference.md)
- [Architecture Patterns →](../architecture/patterns.md)
