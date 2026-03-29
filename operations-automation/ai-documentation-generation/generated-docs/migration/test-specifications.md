# Test Specifications

> **Navigation:** [← Component Order](component-order.md) | [Validation Criteria →](validation-criteria.md)

## Existing Test Coverage

### Unit Tests (`test/unit/cdk/crypto-invoice-stack-simple.test.js`)
Validates CDK stack synthesizes correctly:
- ✅ 2 DynamoDB tables created
- ✅ 2 Secrets Manager secrets created
- ✅ 4 Lambda functions created
- ✅ 1 API Gateway REST API created
- ✅ 1 SNS topic created
- ✅ 1 EventBridge rule created
- ✅ Lambda functions have correct memory (256 MB) and handler
- ✅ DynamoDB table has GSI (status-index) and PAY_PER_REQUEST billing
- ✅ API Key and Usage Plan created
- ✅ All stack outputs present

### Integration Tests
- **`test/integration/setup.sh`** — Full deployment with prerequisite checks
- **`test/integration/execute_payment.sh`** — End-to-end payment (create invoice → pay → verify sweep)
- **`test/integration/test-invoice-management-api.sh`** — API CRUD operations

## Test Scenarios per Component

### Invoice Management Lambda
| # | Scenario | Expected |
|---|----------|----------|
| 1 | GET /invoices (no filter) | 200, array of invoices |
| 2 | GET /invoices?status=pending | 200, filtered by status |
| 3 | GET /invoices/{id} (valid) | 200, single invoice |
| 4 | GET /invoices/{id} (invalid) | 404, not found |
| 5 | PUT /invoices/{id} (pending→cancelled) | 200, updated |
| 6 | PUT /invoices/{id} (paid→cancelled) | 400/403, immutable |
| 7 | DELETE /invoices/{id} (pending) | 200, deleted |
| 8 | DELETE /invoices/{id} (paid) | 400/403, cannot delete |

### Invoice Lambda
| # | Scenario | Expected |
|---|----------|----------|
| 1 | POST with ETH currency | 200, invoiceId + address |
| 2 | POST with ERC20 currency | 200, invoiceId + tokenAddress |
| 3 | POST with unsupported currency | 500, error |
| 4 | Counter increments atomically | Unique index per call |

### Watcher Lambda
| # | Scenario | Expected |
|---|----------|----------|
| 1 | Pending invoice with sufficient balance | Status → paid, SNS notification |
| 2 | Pending invoice with insufficient balance | Status remains pending |
| 3 | No pending invoices | Empty processed array |
| 4 | RPC failure | Error logged, invoice in failed array |

### Sweeper Lambda
| # | Scenario | Expected |
|---|----------|----------|
| 1 | ETH invoice (sufficient gas) | Funds swept, status → swept |
| 2 | ETH invoice (needs gas top-up) | Hot wallet tops up, then sweeps |
| 3 | ERC20 invoice | Token transferred, status → swept |
| 4 | Error during sweep | SNS notification sent, error re-thrown |

→ [Validation Criteria](validation-criteria.md) | [Component Order](component-order.md)
