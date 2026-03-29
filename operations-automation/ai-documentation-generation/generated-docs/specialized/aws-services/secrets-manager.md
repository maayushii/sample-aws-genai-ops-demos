# Secrets Manager Configuration

> **Navigation:** [← Lambda Config](lambda-config.md) | [SNS Patterns →](sns-patterns.md)

## Resource Policy Patterns
Both secrets use DENY-by-default with ArnNotEquals conditions:

```typescript
mnemonicSecret.addToResourcePolicy(new iam.PolicyStatement({
  effect: iam.Effect.DENY,
  principals: [new iam.AnyPrincipal()],
  actions: ['secretsmanager:GetSecretValue'],
  resources: ['*'],
  conditions: {
    ArnNotEquals: {
      'aws:PrincipalArn': [invoiceFn.role?.roleArn, sweeperFn.role?.roleArn]
    }
  }
}));
```

## Secret Structures
| Secret | Name | Access | Content |
|--------|------|--------|---------|
| Mnemonic (EVM) | `hd-wallet-mnemonic` | Invoice + Sweeper | `{mnemonic: "..."}` |
| Hot PK (EVM) | `wallet/hot-pk` | Sweeper only | `{pk: "0x..."}` |
| Mnemonic (Solana) | `solana-wallet-mnemonic` | Invoice + Sweeper | `{mnemonic: "..."}` |

## Setup Script
`scripts/setup-secrets.js` generates mnemonic and stores both secrets.

→ [Security Patterns](../../analysis/security-patterns.md) | [Architecture Components](../../architecture/components.md)
