# Security Vulnerabilities

> **Navigation:** [← Outdated Components](outdated-components.md) | [Maintenance Burden →](maintenance-burden.md) | [Security Patterns →](../analysis/security-patterns.md)

## 🔴 HIGH: CORS Set to ALL_ORIGINS

**Source:** `lib/crypto-invoice-stack.ts` (line ~109), `non-evm-deployments/solana/lib/solana-invoice-stack.ts` (similar)

```typescript
defaultCorsPreflightOptions: {
  allowOrigins: apigateway.Cors.ALL_ORIGINS,
  allowMethods: apigateway.Cors.ALL_METHODS,
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}
```

**Impact:** Any website can make cross-origin API requests. If an API key is leaked or intercepted, attackers from any domain can invoke the API endpoints, potentially creating fraudulent invoices or accessing payment data.

**Remediation:** Replace `ALL_ORIGINS` with a whitelist of authorized merchant domains:
```typescript
allowOrigins: ['https://merchant-app.example.com'],
```

---

## 🔴 HIGH: API Gateway dataTraceEnabled

**Source:** Both CDK stacks

```typescript
deployOptions: {
  dataTraceEnabled: true,
}
```

**Impact:** Full request and response bodies are logged to CloudWatch, including:
- Request body with payment details (amount, currency, token addresses)
- Response body with wallet addresses and QR codes
- Potential API key values in headers

**Remediation:** Set `dataTraceEnabled: false` for production deployments. If detailed logging is needed, use structured logging within Lambda functions with sensitive data masking.

---

## 🟡 MEDIUM: Raw Private Key in Secrets Manager (EVM)

**Source:** `lambda/sweeper/index.js` (line ~92)

```javascript
const pkSecret = await secretsManager.getSecretValue({ SecretId: 'wallet/hot-pk' }).promise();
const { pk } = JSON.parse(pkSecret.SecretString);
const hotWallet = new ethers.Wallet(pk, provider);
```

**Comparison:** The Solana implementation uses AWS KMS for signing, meaning the private key never leaves the KMS HSM. The EVM implementation retrieves the raw private key into Lambda memory.

**Impact:** The private key is exposed in Lambda execution memory. If the Lambda function is compromised (e.g., via dependency vulnerability), the key could be extracted.

**Remediation:** Implement KMS-based signing for EVM similar to the Solana approach, or use AWS Nitro Enclaves for key operations.

---

## 🟡 MEDIUM: No WAF Protection

**Source:** CDK Nag suppression in both stacks

```typescript
{ id: 'AwsSolutions-APIG3', reason: 'WAF not required for crypto invoice API' }
```

**Impact:** The API is exposed to:
- DDoS attacks (partially mitigated by usage plan throttling)
- SQL injection attempts (DynamoDB is not SQL-vulnerable, but still a risk)
- IP-based attacks
- Bot traffic

**Remediation:** Add AWS WAF with rate-limiting rules and IP reputation lists:
```typescript
const webAcl = new wafv2.CfnWebACL(this, 'ApiWaf', { ... });
```

---

## 🟡 MEDIUM: No Cognito/IAM Authorizer

**Source:** CDK Nag suppressions

```typescript
{ id: 'AwsSolutions-APIG4', reason: 'API Gateway has API Key - sufficient for POC' }
{ id: 'AwsSolutions-COG4', reason: 'Cognito not required for POC' }
```

**Impact:** API keys provide rate limiting but not identity-based access control. API keys:
- Cannot be tied to specific merchants
- Cannot be revoked per-user without regenerating the key
- Do not provide audit trails of who made requests
- Can be shared or leaked

**Remediation:** Add Cognito User Pool authorizer or Lambda authorizer for identity-based access control.

---

## 🟢 LOW: CDK Nag Suppressions May Mask Issues

The project suppresses 8 CDK Nag rules. While each has a documented justification, the suppressions may accumulate as the system grows. Regular review of suppressions is recommended.

**Suppressed Rules:**
- AwsSolutions-IAM4 (managed policies)
- AwsSolutions-IAM5 (wildcard permissions)
- AwsSolutions-APIG2 (request validation)
- AwsSolutions-APIG3 (WAF)
- AwsSolutions-DDB3 (point-in-time recovery)
- AwsSolutions-SMG4 (secret rotation)
- AwsSolutions-APIG4 (authorization)
- AwsSolutions-COG4 (Cognito)

---

## 🟢 LOW: RPC URL in Lambda Environment Variables

The `RPC_URL` / `SOLANA_RPC_URL` environment variables are visible in the AWS Lambda console. While these are HTTPS URLs (not credentials), they could reveal infrastructure details (RPC provider, network).

**Remediation:** Store RPC URLs in Secrets Manager or Parameter Store (SecureString).

---

## Related Documentation

- [Security Patterns →](../analysis/security-patterns.md)
- [Outdated Components →](outdated-components.md)
- [Maintenance Burden →](maintenance-burden.md)
- [Remediation Plan →](remediation-plan.md)
