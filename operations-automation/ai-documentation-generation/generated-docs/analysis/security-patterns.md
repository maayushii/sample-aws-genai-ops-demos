# Security Patterns Analysis

> **Navigation:** [← Dependency Analysis](dependency-analysis.md) | [Code Metrics →](code-metrics.md) | [Security Vulnerabilities →](../technical-debt/security-vulnerabilities.md)

## Security Architecture Overview

### Implemented Security Controls

#### 1. Secrets Manager Resource Policies (DENY-by-default)

**Source:** `lib/crypto-invoice-stack.ts` (lines 258-290)

Both EVM and Solana stacks implement restrictive resource policies on secrets:

```typescript
// Mnemonic secret: Only Invoice Lambda and Sweeper Lambda can access
mnemonicSecret.addToResourcePolicy(new iam.PolicyStatement({
  sid: 'RestrictMnemonicSecretAccess',
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

// Hot PK secret: Only Sweeper Lambda can access
hotPkSecret.addToResourcePolicy(/* ... only sweeperFn.role */);
```

**Assessment:** ✅ Strong — Principle of least privilege implemented via resource policies.

---

#### 2. API Key Authentication via Usage Plans

**Source:** `lib/crypto-invoice-stack.ts` (lines 110-135)

```typescript
const usagePlan = new apigateway.UsagePlan(this, 'InvoiceUsagePlan', {
  throttle: { rateLimit: 100, burstLimit: 200 },
  quota: { limit: 10000, period: apigateway.Period.MONTH },
});
// All methods have: apiKeyRequired: true
```

**Assessment:** ⚠️ Moderate — API key provides basic protection and rate limiting, but lacks identity-based authorization (Cognito, IAM, or JWT).

---

#### 3. HTTPS Enforcement on SNS Topic

**Source:** Both stacks

```typescript
paymentNotificationTopic.addToResourcePolicy(new iam.PolicyStatement({
  sid: 'AllowPublishThroughSSLOnly',
  effect: iam.Effect.DENY,
  actions: ['sns:Publish'],
  conditions: { Bool: { 'aws:SecureTransport': 'false' } }
}));
```

**Assessment:** ✅ Good — Prevents plaintext SNS publishing.

---

#### 4. CDK Nag Security Evaluation

**Source:** `bin/crypto-invoice.ts`

```typescript
cdk.Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));
```

Documented suppressions with justifications:

| CDK Nag Rule | Suppression Reason | Risk |
|-------------|-------------------|------|
| AwsSolutions-IAM4 | AWS managed policies for Lambda execution | 🟢 Low |
| AwsSolutions-IAM5 | Wildcard needed for DynamoDB GSI access | 🟢 Low |
| AwsSolutions-APIG2 | Request validation done in Lambda | 🟡 Medium |
| AwsSolutions-APIG3 | WAF not required for this use case | 🟡 Medium |
| AwsSolutions-DDB3 | Point-in-time recovery not needed | 🟢 Low |
| AwsSolutions-SMG4 | Secret rotation should be avoided (seeds) | 🟢 Low |
| AwsSolutions-APIG4 | API Key sufficient for POC | 🟡 Medium |
| AwsSolutions-COG4 | Cognito not needed for POC | 🟡 Medium |

---

#### 5. Security ESLint Configuration

**Source:** `.eslintrc.security.js`

Enforced rules:
- `no-eval`, `no-implied-eval`, `no-new-func` — Prevents dynamic code execution
- `no-script-url`, `no-with`, `no-caller` — Prevents legacy dangerous patterns
- `@typescript-eslint/no-explicit-any: 'error'` — Enforces type safety
- `@typescript-eslint/no-non-null-assertion: 'error'` — Prevents null access

**Assessment:** ✅ Good — Proactive static analysis for common vulnerabilities.

---

#### 6. KMS-Based Signing (Solana Only)

**Source:** `non-evm-deployments/solana/lib/solana-invoice-stack.ts`

```typescript
const hotWalletKmsKeyCfn = new cdk.aws_kms.CfnKey(this, 'SolanaHotWalletKey', {
  keySpec: 'ECC_NIST_EDWARDS25519',
  keyUsage: 'SIGN_VERIFY',
});
// Sweeper granted: kms:Sign, kms:GetPublicKey
```

**Assessment:** ✅ Excellent — Private key never leaves AWS KMS. Much more secure than raw key in Secrets Manager (EVM approach).

---

### Security Concerns

#### 🔴 HIGH: CORS Configuration (ALL_ORIGINS)

**Source:** Both stacks
```typescript
defaultCorsPreflightOptions: {
  allowOrigins: apigateway.Cors.ALL_ORIGINS,  // ⚠️
  allowMethods: apigateway.Cors.ALL_METHODS,  // ⚠️
}
```

**Impact:** Any website can make cross-origin requests to the API. Combined with API key (which could be leaked), this enables unauthorized access from malicious domains.

**Recommendation:** Restrict to known merchant domains.

---

#### 🔴 HIGH: API Gateway Data Trace Enabled

**Source:** Both stacks
```typescript
deployOptions: {
  dataTraceEnabled: true,  // ⚠️ Logs full request/response payloads
}
```

**Impact:** Full API request and response bodies are logged to CloudWatch, potentially including sensitive payment data, API keys in headers, and wallet addresses.

**Recommendation:** Disable for production or ensure CloudWatch log encryption.

---

#### 🟡 MEDIUM: Raw Private Key in Secrets Manager (EVM)

The EVM stack stores the hot wallet private key as a raw string in Secrets Manager, while the Solana stack uses KMS for signing operations. The EVM approach means the private key is decrypted in Lambda memory during execution.

---

#### 🟡 MEDIUM: No WAF Protection

Both stacks suppress the AwsSolutions-APIG3 rule (WAF requirement). Without WAF, the API is exposed to DDoS, SQL injection attempts, and other common attacks (though the API key + usage plan provides basic protection).

---

#### 🟡 MEDIUM: No Cognito/IAM Authorizer

Both stacks use API key as the sole authentication mechanism. API keys can be shared, leaked, or brute-forced. For production, Cognito or IAM authorizers would provide identity-based access control.

---

#### 🟢 LOW: Input Validation in Lambda Only

Request body validation is performed in Lambda handlers, not at the API Gateway level (model validation). This means invalid requests still invoke Lambda functions and incur cost.

---

## Related Documentation

- [Technical Debt: Security Vulnerabilities →](../technical-debt/security-vulnerabilities.md)
- [Architecture Patterns →](../architecture/patterns.md)
- [Error Handling →](../behavior/error-handling.md)
