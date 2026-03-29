# API Gateway Configuration

> **Navigation:** [← DynamoDB](dynamodb-patterns.md) | [Lambda Config →](lambda-config.md)

## REST API Setup
- **Type:** REST API (apigateway.RestApi)
- **Stage:** `prod`
- **Logging:** JSON format, INFO level, `dataTraceEnabled: true` ⚠️

## Usage Plans
- **Rate limit:** 100 requests/second
- **Burst limit:** 200 requests
- **Quota:** 10,000 requests/month

## API Key Management
- Created via CDK: `apigateway.ApiKey`
- All methods require: `apiKeyRequired: true`
- Retrieve via: `aws apigateway get-api-key --api-key <id> --include-value`

## CORS Configuration
```typescript
defaultCorsPreflightOptions: {
  allowOrigins: apigateway.Cors.ALL_ORIGINS,  // ⚠️ Production concern
  allowMethods: apigateway.Cors.ALL_METHODS,
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}
```

## Endpoints
| Method | Path | Lambda | Auth |
|--------|------|--------|------|
| POST | /generateInvoice | Invoice | API Key |
| GET | /invoices | Management | API Key |
| GET | /invoices/{invoiceId} | Management | API Key |
| PUT | /invoices/{invoiceId} | Management | API Key |
| DELETE | /invoices/{invoiceId} | Management | API Key |

→ [API Reference](../../reference/api-reference.md) | [Security Patterns](../../analysis/security-patterns.md)
