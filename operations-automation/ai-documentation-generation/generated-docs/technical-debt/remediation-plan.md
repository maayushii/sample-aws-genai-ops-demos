# Remediation Plan

> **Navigation:** [← Maintenance Burden](maintenance-burden.md) | [Summary →](summary.md) | [Technical Debt Report →](../technical-debt-report.md)

## Prioritized Action Items

### Priority 1: AWS SDK v2 → v3 Migration (🔴 HIGH)

**Recommended Transformation:** `AWS/nodejs-aws-sdk-v2-to-v3`

| Item | Details |
|------|---------|
| **Scope** | 4 EVM Lambda functions + root package.json |
| **Files** | `lambda/invoice/index.js`, `lambda/invoice-management/index.js`, `lambda/watcher/index.js`, `lambda/sweeper/index.js` |
| **Approach** | Use AWS-managed transformation to automatically migrate `require('aws-sdk')` to modular `@aws-sdk/*` imports |
| **Reference** | Solana Lambdas already demonstrate the target pattern |
| **Validation** | All unit and integration tests pass; invoice creation, payment detection, and sweeping work correctly |
| **Business Value** | Smaller bundles, faster cold starts, continued security patching, consistency with Solana code |

**Migration per Lambda:**
- `invoice/index.js`: Replace `AWS.SecretsManager` → `SecretsManagerClient` + `GetSecretValueCommand`, `AWS.DynamoDB.DocumentClient` → `DynamoDBDocumentClient` + `PutCommand`/`UpdateCommand`
- `invoice-management/index.js`: Replace all `.get()`, `.query()`, `.scan()`, `.update()`, `.delete()` with v3 command equivalents
- `watcher/index.js`: Replace DynamoDB DocumentClient + SNS
- `sweeper/index.js`: Replace SecretsManager, DynamoDB, SNS, and `AWS.DynamoDB.Converter.unmarshall` → `unmarshall` from `@aws-sdk/util-dynamodb`

---

### Priority 2: Security Hardening (🔴 HIGH)

#### 2a. Restrict CORS Origins
| Item | Details |
|------|---------|
| **Scope** | Both CDK stacks |
| **Change** | Replace `Cors.ALL_ORIGINS` with merchant domain whitelist |
| **Validation** | Test CORS preflight from allowed and disallowed origins |

#### 2b. Disable dataTraceEnabled
| Item | Details |
|------|---------|
| **Scope** | Both CDK stacks |
| **Change** | Set `dataTraceEnabled: false` |
| **Validation** | Verify API Gateway logs no longer contain request/response bodies |

---

### Priority 3: Code Quality Improvements (🟡 MEDIUM)

#### 3a. Extract Shared Invoice Management Logic
| Item | Details |
|------|---------|
| **Scope** | `lambda/invoice-management/index.js` + Solana equivalent |
| **Approach** | Create shared business logic module with SDK adapter interface |
| **Validation** | Both EVM and Solana management APIs return identical behavior |

#### 3b. Add API Gateway Request Validation
| Item | Details |
|------|---------|
| **Scope** | Both CDK stacks |
| **Change** | Add JSON schema models and request validators |
| **Validation** | Invalid requests rejected at API Gateway level (400) without Lambda invocation |

#### 3c. Fix Hardcoded Log Group Names
| Item | Details |
|------|---------|
| **Scope** | Both sweeper Lambdas |
| **Change** | Pass log group name via environment variable |
| **Validation** | Error SNS notifications reference correct CloudWatch log group |

#### 3d. Add Global Error Handler to Invoice Lambda
| Item | Details |
|------|---------|
| **Scope** | `lambda/invoice/index.js` + Solana equivalent |
| **Change** | Wrap handler in try/catch with consistent error response |

---

### Priority 4: Security Enhancements (🟡 MEDIUM)

#### 4a. Implement KMS-Based Signing for EVM
| Item | Details |
|------|---------|
| **Scope** | EVM sweeper Lambda + CDK stack |
| **Approach** | Use KMS with secp256k1 key for Ethereum transaction signing |
| **Validation** | Sweeper successfully signs and sends transactions without raw key access |

#### 4b. Add WAF Protection
| Item | Details |
|------|---------|
| **Scope** | Both CDK stacks |
| **Change** | Add AWS WAF with rate limiting, IP reputation, and common attack protection |

#### 4c. Evaluate Cognito/Lambda Authorizer
| Item | Details |
|------|---------|
| **Scope** | Both CDK stacks |
| **Approach** | Add Cognito User Pool or Lambda authorizer for merchant identity |

---

### Priority 5: Dev Tooling Updates (🟢 LOW)

#### 5a. Upgrade ESLint to v9
| Item | Details |
|------|---------|
| **Scope** | Root and Solana projects |
| **Change** | Migrate from `.eslintrc.js` to flat config format |

#### 5b. Align Dependency Versions
| Item | Details |
|------|---------|
| **Scope** | All package.json files |
| **Change** | Normalize ethers.js, CDK, and dev tool versions |

#### 5c. Remove Unused aws-sdk v2 from Solana Root
| Item | Details |
|------|---------|
| **Scope** | `non-evm-deployments/solana/package.json` |
| **Change** | Remove `"aws-sdk": "^2.1692.0"` if not used by any Solana Lambda |

---

## Related Documentation

- [Technical Debt Report →](../technical-debt-report.md)
- [Summary →](summary.md)
- [Outdated Components →](outdated-components.md)
- [Dependency Analysis →](../analysis/dependency-analysis.md)
