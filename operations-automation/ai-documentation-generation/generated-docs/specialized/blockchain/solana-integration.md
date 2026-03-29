# Solana Blockchain Integration

> **Navigation:** [← EVM Integration](evm-integration.md) | [Business Logic →](../../behavior/business-logic.md)

## @solana/web3.js v1 Patterns

### Ed25519 Key Derivation (BIP-44)

**Derivation Path:** `m/44'/501'/{index}'/0'`
- Coin type: 501 (Solana)
- All components hardened (')

```javascript
const { mnemonicToSeedSync } = require('bip39');
const { derivePath } = require('ed25519-hd-key');
const { Keypair } = require('@solana/web3.js');

const seed = mnemonicToSeedSync(mnemonic);
const derivedSeed = derivePath(path, seed.toString('hex')).key;
const keypair = Keypair.fromSeed(derivedSeed);
const publicKey = keypair.publicKey.toBase58();
```

### SPL Token Handling with Associated Token Accounts

```javascript
const { getAssociatedTokenAddress, getAccount, getMint } = require('@solana/spl-token');

// Find ATA for an owner + mint
const ata = await getAssociatedTokenAddress(mintPublicKey, ownerPublicKey);

// Check if ATA exists
try {
  const tokenAccount = await getAccount(connection, ata);
  const balance = Number(tokenAccount.amount);
} catch (err) {
  if (err.name === 'TokenAccountNotFoundError') {
    // ATA not yet created
  }
}

// Create ATA if needed (sweeper)
const { createAssociatedTokenAccountInstruction } = require('@solana/spl-token');
transaction.add(createAssociatedTokenAccountInstruction(payer, ata, owner, mint));
```

### KMS-Based Ed25519 Signing

```javascript
const { KMSClient, GetPublicKeyCommand, SignCommand } = require('@aws-sdk/client-kms');

// Get public key (cached)
async function getHotWalletPublicKey() {
  const result = await kms.send(new GetPublicKeyCommand({ KeyId: KMS_KEY_ID }));
  const publicKeyBytes = new Uint8Array(result.PublicKey).slice(-32); // Extract raw 32 bytes
  return new PublicKey(publicKeyBytes);
}

// Sign transaction message
async function signWithKms(message) {
  const result = await kms.send(new SignCommand({
    KeyId: KMS_KEY_ID,
    Message: message,
    MessageType: 'RAW',
    SigningAlgorithm: 'ED25519_SHA_512',
  }));
  return new Uint8Array(result.Signature);
}

// Multi-signer transaction
transaction.feePayer = hotWallet;
const message = transaction.serializeMessage();
const hotWalletSig = await signWithKms(message);
transaction.addSignature(hotWallet, Buffer.from(hotWalletSig));
transaction.partialSign(invoiceKeypair);
```

### Lamports Handling

| Unit | Value | Conversion |
|------|-------|------------|
| 1 SOL | 1,000,000,000 lamports | `LAMPORTS_PER_SOL` constant |
| SOL → lamports | × LAMPORTS_PER_SOL | Direct multiplication |
| lamports → SOL | ÷ LAMPORTS_PER_SOL | Direct division |

### Payment URI Format

| Type | Format |
|------|--------|
| SOL | `solana:{publicKey}?amount={amount}&label=Invoice%20{id}` |
| SPL | `solana:{publicKey}?amount={amount}&spl-token={tokenMint}&label=Invoice%20{id}` |

---

## Related Documentation

- [EVM Integration →](evm-integration.md)
- [Business Logic →](../../behavior/business-logic.md)
