# Workflow Documentation

> **Navigation:** [← Business Logic](business-logic.md) | [Decision Logic →](decision-logic.md) | [Diagrams →](../diagrams/behavioral/payment-flow.md)

## Complete Payment Lifecycle

### Phase 1: Invoice Creation
1. Merchant sends POST `/generateInvoice` with currency, amount, and optional token details
2. API Gateway validates API key and forwards to Invoice Lambda
3. Lambda retrieves mnemonic from Secrets Manager
4. Lambda atomically increments HD wallet counter
5. New blockchain address derived from mnemonic + index
6. Invoice stored in DynamoDB with `status: pending`
7. QR code generated with payment URI
8. Response returned to merchant with invoiceId, address, and QR code

### Phase 2: Payment Detection (1-minute polling)
1. EventBridge triggers Watcher Lambda every minute
2. Watcher queries all `pending` invoices from DynamoDB GSI
3. For each pending invoice, checks blockchain balance via RPC
4. When payment detected (balance ≥ required amount):
   - Updates invoice status to `paid` with `paidAt` timestamp
   - Sends SNS notification to merchant ("Payment Received")
5. Unpaid invoices remain `pending` for next cycle

### Phase 3: Fund Sweeping (DynamoDB Stream trigger)
1. DynamoDB Stream emits MODIFY event when status changes to `paid`
2. Stream filter matches and triggers Sweeper Lambda
3. Sweeper retrieves wallet secrets
4. Re-derives invoice wallet from mnemonic + derivation path
5. Estimates transaction fees
6. If needed: hot wallet tops up gas to invoice address
7. Transfers all funds from invoice address to treasury wallet
8. Updates invoice status to `swept` with `sweptAt` timestamp

### Phase 4: Invoice Management (Ongoing)
- Merchants can list, view, cancel, or delete invoices via REST API
- Only `pending` and `cancelled` invoices are mutable
- `paid` and `swept` statuses are immutable (system-controlled)

---

## EVM Payment Flow (ETH)

```
1. Merchant → POST /generateInvoice {currency: "ETH", amount: "0.01"}
2. Invoice Lambda:
   a. SecretsManager.getSecretValue("hd-wallet-mnemonic")
   b. DynamoDB.update(counter table, increment currentIndex)
   c. ethers.HDNodeWallet.fromPhrase(mnemonic, "m/44'/60'/0'/0/{index}")
   d. DynamoDB.put(invoices table, {status: "pending", ...})
   e. Generate payment URI: "ethereum:{address}?value={weiAmount}"
   f. QRCode.toDataURL(paymentUri)
   g. Return {invoiceId, address, index, qrcodeBase64}
3. Customer pays ETH to the address
4. Watcher (every 1 min):
   a. DynamoDB.query(GSI "status-index", status="pending")
   b. provider.getBalance(invoiceAddress)
   c. If balance >= parseEther(amount):
      - DynamoDB.update(status="paid", paidAt=now)
      - SNS.publish("Payment Received")
5. Sweeper (DynamoDB Stream trigger):
   a. SecretsManager.getSecretValue("hd-wallet-mnemonic")
   b. SecretsManager.getSecretValue("wallet/hot-pk")
   c. Re-derive wallet from mnemonic + path
   d. provider.getFeeData() → estimate gas → add 10% buffer
   e. If balance < gas fee: hotWallet.sendTransaction(topUp)
   f. invoiceWallet.sendTransaction(treasury, balance - gasFee)
   g. DynamoDB.update(status="swept", sweptAt=now)
```

## EVM Payment Flow (ERC20)

```
Steps 1-3: Same as ETH but with currency: "ERC20" + tokenAddress + tokenSymbol + decimals
4. Watcher:
   a-b. Same query
   c. token.balanceOf(invoiceAddress) + token.decimals()
   d. If balance >= parseUnits(amount, decimals): markPaid
5. Sweeper:
   a-d. Same secret retrieval and wallet derivation
   e. token.balanceOf(invoiceAddress) → skip if zero
   f. Estimate gas for token.transfer() → add 10% buffer
   g. If ETH balance < gas fee: hotWallet sends ETH top-up
   h. token.transfer(treasury, tokenBalance) 
   i. DynamoDB.update(status="swept")
```

## Solana Payment Flow (SOL)

```
1. Merchant → POST /generateInvoice {currency: "SOL", amount: "0.01"}
2. Invoice Lambda:
   a. SecretsManagerClient.send(GetSecretValueCommand("solana-wallet-mnemonic"))
   b. DynamoDB UpdateCommand(counter, increment currentIndex)
   c. mnemonicToSeedSync → derivePath("m/44'/501'/{index}'/0'") → Keypair.fromSeed
   d. DynamoDB PutCommand(invoices, {status: "pending", ...})
   e. Payment URI: "solana:{publicKey}?amount={amount}&label=Invoice%20{id}"
   f. QRCode.toDataURL(paymentUri)
3. Customer pays SOL to the address
4. Watcher (every 1 min):
   a. DynamoDB QueryCommand(GSI, status="pending")
   b. connection.getBalance(publicKey)
   c. If (balance / LAMPORTS_PER_SOL) >= amount: markPaid
5. Sweeper:
   a. Get mnemonic → derive keypair
   b. Estimate fee via test transaction
   c. sweepAmount = balance - estimatedFee
   d. SystemProgram.transfer → sign with invoiceKeypair
   e. connection.sendRawTransaction
   f. DynamoDB UpdateCommand(status="swept")
```

## Solana Payment Flow (SPL)

```
Steps 1-3: Same as SOL but with currency: "SPL" + tokenMint
4. Watcher:
   b. getAssociatedTokenAddress(mint, publicKey) → getAccount(ata)
   c. Fetch mint decimals via getMint() → compare token balance
   d. Handle TokenAccountNotFoundError (ATA not yet created)
5. Sweeper:
   a. Get mnemonic → derive keypair
   b. Find source ATA + destination ATA
   c. If dest ATA doesn't exist: createAssociatedTokenAccountInstruction
   d. createTransferInstruction(source → dest, tokenBalance)
   e. createCloseAccountInstruction(source ATA → reclaim rent to hot wallet)
   f. Sign: KMS(hotWallet) + partialSign(invoiceKeypair)
   g. connection.sendRawTransaction
   h. DynamoDB UpdateCommand(status="swept")
```

---

## Related Documentation

- [Business Logic →](business-logic.md)
- [Decision Logic →](decision-logic.md)
- [Payment Flow Diagrams →](../diagrams/behavioral/payment-flow.md)
- [Data Flow Diagrams →](../diagrams/data-flow/service-data-flow.md)
