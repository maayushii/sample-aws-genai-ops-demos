# Decision Logic Documentation

> **Navigation:** [← Workflows](workflows.md) | [Error Handling →](error-handling.md) | [Architecture Patterns →](../architecture/patterns.md)

## 1. Currency Type Branching

### Invoice Generation
```
IF currency === 'ETH':
  paymentUri = "ethereum:{address}?value={amountInWei}"
  valueInWei = BigInt(Math.floor(amount * 10^18))
ELSE IF currency === 'ERC20':
  paymentUri = "ethereum:{tokenAddress}/transfer?address={address}&uint256={baseUnits}"
  valueInBaseUnits = BigInt(Math.floor(amount * 10^decimals))
ELSE IF currency === 'SOL':
  paymentUri = "solana:{address}?amount={amount}&label=Invoice%20{id}"
ELSE IF currency === 'SPL':
  paymentUri = "solana:{address}?amount={amount}&spl-token={tokenMint}&label=Invoice%20{id}"
ELSE:
  THROW "Unsupported currency type"
```

### Watcher Balance Checking
```
IF currency === 'ETH':
  balance = provider.getBalance(address)
  required = ethers.parseEther(amount)
  isPaid = (balance >= required)
ELSE IF currency === 'ERC20':
  token = new Contract(tokenAddress, ERC20_ABI, provider)
  balance = token.balanceOf(address)
  decimals = token.decimals()
  required = ethers.parseUnits(amount, decimals)
  isPaid = (balance >= required)
ELSE IF currency === 'SOL':
  balance = connection.getBalance(publicKey)
  balanceInSol = balance / LAMPORTS_PER_SOL
  isPaid = (balanceInSol >= parseFloat(amount))
ELSE IF currency === 'SPL':
  ata = getAssociatedTokenAddress(mint, publicKey)
  tokenAccount = getAccount(connection, ata)  // may throw TokenAccountNotFoundError
  mintInfo = getMint(connection, mint)
  required = parseFloat(amount) * 10^mintInfo.decimals
  isPaid = (Number(tokenAccount.amount) >= required)
```

### Sweeper Transfer Logic
```
IF currency === 'ETH':
  estimateGas → addBuffer(10%) → ensureGas → send(balance - fee)
ELSE IF currency === 'ERC20':
  checkTokenBalance → skip if zero
  estimateGas(transfer) → addBuffer(10%) → ensureGas → transfer(treasury, tokenBalance)
ELSE IF currency === 'SOL':
  estimateFee via testTransaction → skip if balance <= fee
  SystemProgram.transfer(balance - fee) → sign(invoiceKeypair)
ELSE IF currency === 'SPL':
  checkTokenBalance → skip if zero
  createDestATA(if needed) → transferTokens → closeSourceATA
  sign(KMS for feePayer + invoiceKeypair)
```

---

## 2. Gas Estimation and Buffering

### EVM Gas Buffer Strategy
```javascript
function addGasBuffer(estimatedGas, bufferPercent = 10n) {
  return (estimatedGas * (100n + bufferPercent)) / 100n;
}
```
- Default buffer: **10%** for estimated gas limit
- Gas top-up buffer: **20%** for gas price when sending ETH from hot wallet

### EVM Gas Top-Up Decision
```
ethBalance = provider.getBalance(invoiceAddress)
IF ethBalance < estimatedFee:
  topUpAmount = estimatedFee - ethBalance
  bufferedGasPrice = gasPrice * 120% (20% buffer)
  hotWallet.sendTransaction({to: invoiceAddress, value: topUpAmount, gasPrice: bufferedGasPrice})
  await confirmation
  refresh ethBalance
```

### Solana Fee Estimation
```
Build test transaction with 1 lamport transfer
testTransaction.getEstimatedFee(connection)
IF balance <= estimatedFee:
  skip (balance too low to sweep)
ELSE:
  sweepAmount = balance - estimatedFee
```

---

## 3. Status Transition Validation

### EVM Status Machine (invoice-management/index.js)
```javascript
const allowedTransitions = {
  pending:   ['cancelled'],  // pending can only go to cancelled
  cancelled: ['pending'],    // cancelled can go back to pending
  paid:      [],             // paid cannot be changed (immutable)
  swept:     [],             // swept cannot be changed (immutable)
};

// Validation:
if (!allowedTransitions[currentStatus] || !allowedTransitions[currentStatus].includes(targetStatus)) {
  return 400: "Invalid status transition..."
}
```

### Solana Status Validation (different approach)
```javascript
// Step 1: Check immutability
if (currentStatus === 'paid' || currentStatus === 'swept') {
  return 403: "Cannot modify paid or swept invoices"
}

// Step 2: Check target validity
if (status !== 'pending' && status !== 'cancelled') {
  return 400: "Only pending and cancelled statuses are allowed"
}
```

**Key difference:** EVM uses a transition map; Solana uses sequential if-checks. Both achieve the same business rule but Solana returns 403 for immutable invoices vs EVM's 400.

---

## 4. Conditional Deletion Logic

### EVM Deletion
```
DynamoDB.delete({
  ConditionExpression: 'attribute_exists(invoiceId) AND (#status = :pending OR #status = :cancelled)'
})
// If condition fails: catch ConditionalCheckFailedException → return 400
```

### Solana Deletion
```
// Pre-fetch invoice
IF !invoice: return 404
IF status !== 'pending' AND status !== 'cancelled': return 403
DynamoDB.delete({Key: {invoiceId}})  // No condition expression
```

---

## 5. DynamoDB Stream Event Filtering

### Sweeper Trigger Decision
```
Filter at event source level:
  eventName === 'MODIFY' AND dynamodb.NewImage.status.S === 'paid'

Additional defensive check in handler:
  IF record.eventName !== 'MODIFY' AND record.eventName !== 'INSERT':
    skip
  IF newImage.status !== 'paid':
    skip
```

---

## 6. Invoice Default Value Logic

### EVM Defaults
| Field | Default Value | Condition |
|-------|--------------|-----------|
| `currency` | `'ETH'` | If not provided |
| `amount` | `'0.0001'` | If not provided |
| `tokenAddress` | `null` | If not provided |
| `tokenSymbol` | `'ETH'` if ETH, `'USDC'` if ERC20 | Based on currency |
| `decimals` | `18` if ETH, `6` if ERC20 | Based on currency |

### Solana Defaults
| Field | Default Value | Condition |
|-------|--------------|-----------|
| `currency` | `'SOL'` | If not provided |
| `amount` | `'0.01'` | If not provided |
| `tokenMint` | `null` | If not provided |
| `tokenSymbol` | `'SOL'` if SOL, `'USDC'` if SPL | Based on currency |

---

## Related Documentation

- [Business Logic →](business-logic.md)
- [Error Handling →](error-handling.md)
- [Data Models →](../reference/data-models.md)
- [Architecture Patterns →](../architecture/patterns.md)
