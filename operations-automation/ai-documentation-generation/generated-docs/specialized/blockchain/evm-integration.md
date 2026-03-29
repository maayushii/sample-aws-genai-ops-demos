# EVM Blockchain Integration

> **Navigation:** [← README](../../README.md) | [Solana Integration →](solana-integration.md) | [Business Logic →](../../behavior/business-logic.md)

## ethers.js v6 Usage Patterns

The EVM implementation uses ethers.js v6 for all blockchain interactions.

### HD Wallet Derivation (BIP-44)

**Derivation Path:** `m/44'/60'/0'/0/{index}`
- Coin type: 60 (Ethereum)
- Account: 0, Change: 0 (external chain)
- Index: Auto-incremented from DynamoDB counter

```javascript
// Invoice Lambda (lambda/invoice/index.js)
const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic, path);
console.log(hdNode.address); // 0x...
```

### ERC20 ABI Interactions

**Read-only ABI (Watcher):**
```javascript
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
];
const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
const [balance, decimals] = await Promise.all([token.balanceOf(address), token.decimals()]);
```

**Transfer ABI (Sweeper):**
```javascript
const ERC20_ABI = [
  'function transfer(address to, uint256 value) public returns (bool)',
  'function decimals() public view returns (uint8)',
  'function balanceOf(address owner) public view returns (uint256)',
];
const token = new ethers.Contract(tokenAddress, ERC20_ABI, invoiceWallet);
await token.transfer(DEPOSIT_WALLET_ADDRESS, tokenBalance, { gasLimit, gasPrice });
```

### Gas Estimation and Buffering

```javascript
// 10% gas buffer
function addGasBuffer(estimatedGas, bufferPercent = 10n) {
  return (estimatedGas * (100n + bufferPercent)) / 100n;
}

// Gas top-up with 20% gas price buffer
const bufferedGasPrice = (gasPrice * 120n) / 100n;
```

### Wei/Gwei Conversions

| Unit | Conversion | ethers.js Method |
|------|------------|------------------|
| Wei → ETH | ÷ 10^18 | `ethers.formatEther(weiValue)` |
| ETH → Wei | × 10^18 | `ethers.parseEther(ethString)` |
| Token → Base | × 10^decimals | `ethers.parseUnits(amount, decimals)` |
| Base → Token | ÷ 10^decimals | `ethers.formatUnits(baseValue, decimals)` |

### Payment URI Format

| Type | Format |
|------|--------|
| ETH | `ethereum:{address}?value={amountInWei}` |
| ERC20 | `ethereum:{tokenAddress}/transfer?address={addr}&uint256={baseUnits}` |

---

## Related Documentation

- [Solana Integration →](solana-integration.md)
- [Business Logic →](../../behavior/business-logic.md)
- [Decision Logic →](../../behavior/decision-logic.md)
