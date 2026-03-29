# Complexity Analysis

> **Navigation:** [← Code Metrics](code-metrics.md) | [Dependency Analysis →](dependency-analysis.md) | [Security Patterns →](security-patterns.md)

## Complexity Rankings

### 🔴 Highest Complexity: Sweeper Lambda

**EVM Sweeper** (`lambda/sweeper/index.js` — 224 lines)
- Multi-step blockchain transaction with error recovery
- Gas price estimation with dynamic buffering
- Hot wallet gas top-up flow (conditional)
- Two distinct code paths: ETH (native transfer) vs ERC20 (contract call)
- DynamoDB Stream event unmarshalling
- Secrets Manager dual-secret retrieval (mnemonic + hot-pk)
- SNS error notification with hardcoded log group reference
- Transaction wait for confirmation
- Exception handling with re-throw for retry

**Solana Sweeper** (`non-evm-deployments/solana/lambda/sweeper/index.js` — 244 lines)
- All of the above complexity plus:
- KMS-based ed25519 signing (public key extraction from DER encoding)
- Associated Token Account (ATA) management (check existence, create if needed)
- Multi-signer transaction construction (KMS + invoice keypair)
- Token account closure for rent recovery
- Public key caching optimization (`getHotWalletPublicKey()`)

**Risk Factors:**
- Financial operations with irreversible blockchain transactions
- Multiple external service calls in sequence (failure mid-flow leaves partial state)
- No idempotency mechanism — retry on failure could cause issues if tx was sent but status not updated
- Reserved concurrency=1 mitigates but doesn't eliminate race conditions

---

### 🟡 Medium Complexity: Watcher Lambda

**EVM Watcher** (`lambda/watcher/index.js` — 117 lines)
- Queries all pending invoices (potentially unbounded)
- For each invoice: blockchain RPC call (balance check)
- Two currency paths: native ETH balance vs ERC20 contract call
- ERC20 requires fetching token decimals from contract
- Per-invoice error isolation (continues processing on failure)
- SNS notification on payment detection

**Solana Watcher** (`non-evm-deployments/solana/lambda/watcher/index.js` — 131 lines)
- Same pattern plus:
- SPL token: Associated Token Address computation
- SPL token: getAccount + getMint (two RPC calls per SPL invoice)
- TokenAccountNotFoundError handling (graceful skip)
- Dynamic require of `getMint` inside loop

**Risk Factors:**
- Performance degrades linearly with pending invoice count
- RPC rate limits could cause batch failures
- No pagination on pending invoice query (could be large)

---

### 🟡 Medium Complexity: Invoice Management Lambda

**EVM** (`lambda/invoice-management/index.js` — 264 lines)
- Router pattern with switch on httpMethod
- 4 internal functions for CRUD operations
- Status transition state machine with validation
- Pagination support with lastKey encoding/decoding
- ConditionExpression-based atomic operations
- Two query paths: GSI query (with status) vs full scan (without)

**Solana** (`non-evm-deployments/solana/lambda/invoice-management/index.js` — 232 lines)
- Same router pattern but if-else based
- Pre-fetch approach for status validation (non-atomic)
- Simpler delete (no condition expression, explicit check)
- Limit enforcement (Math.min(limit, 100))

---

### 🟢 Lower Complexity: Invoice Lambda

**EVM** (`lambda/invoice/index.js` — 103 lines)
- Sequential flow: fetch secret → increment counter → derive address → store → generate QR
- Two currency branches for payment URI generation
- No loops, no complex error handling
- Straightforward BigInt math for amount conversion

**Solana** (`non-evm-deployments/solana/lambda/invoice/index.js` — 111 lines)
- Same sequential flow with Solana-specific derivation
- ed25519 key derivation (mnemonic → seed → derivePath → Keypair)
- Two currency branches for Solana payment URI format

---

## Complexity Heatmap

```
File                           Complexity  Lines  Risk
━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ━━━━━━━━━━  ━━━━━  ━━━━━━━━
lambda/sweeper/index.js           🔴 HIGH    224   Financial txn
solana/lambda/sweeper/index.js    🔴 HIGH    244   Financial txn + KMS
lambda/watcher/index.js           🟡 MED     117   Scale concern
solana/lambda/watcher/index.js    🟡 MED     131   Scale + ATA
lambda/invoice-mgmt/index.js      🟡 MED     264   State machine
solana/lambda/invoice-mgmt/       🟡 MED     232   State machine
lib/crypto-invoice-stack.ts       🟡 MED     436   Infrastructure
solana/lib/solana-invoice-stack   🟡 MED     406   Infrastructure + KMS
lambda/invoice/index.js           🟢 LOW     103   Sequential
solana/lambda/invoice/index.js    🟢 LOW     111   Sequential
bin/crypto-invoice.ts             🟢 MIN       9   Entry point
solana/bin/solana-invoice.ts      🟢 MIN      17   Entry point
```

---

## Related Documentation

- [Code Metrics →](code-metrics.md)
- [Dependency Analysis →](dependency-analysis.md)
- [Error Handling →](../behavior/error-handling.md)
- [Business Logic →](../behavior/business-logic.md)
