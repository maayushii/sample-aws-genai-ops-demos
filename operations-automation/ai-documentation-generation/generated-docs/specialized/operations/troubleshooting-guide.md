# Troubleshooting Guide

> **Navigation:** [← Monitoring](monitoring-guide.md) | [Deployment →](deployment-guide.md)

## Common Issues

### 1. Invoice Generation Fails
**Symptoms:** 500 error on POST /generateInvoice

**Causes & Solutions:**
- **Missing mnemonic:** Run `npm run setup-secrets` to store seed phrase
- **RPC URL misconfigured:** Verify `.env` file has valid `RPC_URL`
- **Counter table issue:** Check DynamoDB counter table exists and is accessible
- **Lambda logs:** Check CloudWatch InvoiceFunctionLogGroup for detailed error

### 2. Payments Not Detected
**Symptoms:** Invoice remains in `pending` status after payment sent

**Causes & Solutions:**
- **Watcher not running:** Check EventBridge rule is enabled
- **RPC connectivity:** Verify RPC endpoint is reachable from Lambda VPC
- **Insufficient balance:** Payment must be ≥ required amount (no partial payments)
- **Detection delay:** Wait 1-2 minutes for next watcher cycle
- **Wrong network:** Verify RPC URL matches the network where payment was sent

### 3. Sweeping Issues
**Symptoms:** Invoice stuck in `paid` status

**Causes & Solutions:**
- **Hot wallet empty:** Ensure hot wallet has sufficient ETH/SOL for gas
- **Gas price spike:** Increase gas buffer or wait for lower gas prices
- **Treasury address wrong:** Verify `TREASURY_PUBLIC_ADDRESS` in `.env`
- **DynamoDB Stream disabled:** Check stream is active on invoices table
- **Manual recovery:** In DynamoDB Console, change invoice status from `paid` to `pending`, then back to `paid` to re-trigger sweeper

### 4. API Authentication Errors
**Symptoms:** 403 Forbidden responses

**Solutions:**
- Retrieve API key: `aws apigateway get-api-key --api-key <id> --include-value`
- Ensure `X-API-Key` header is set in requests
- Check usage plan quota hasn't been exceeded

### 5. CDK Deployment Fails
**Symptoms:** `cdk deploy` fails

**Causes & Solutions:**
- **Missing env vars:** Ensure `.env` file has `RPC_URL` and `TREASURY_PUBLIC_ADDRESS`
- **CDK bootstrap:** Run `cdk bootstrap` if first deployment
- **TypeScript build:** Run `npm run build` before deploy
- **IAM permissions:** Ensure AWS credentials have CloudFormation + service permissions

### 6. Sweeper Error Notifications
When the sweeper fails, it sends an SNS notification with:
- Error message
- CloudWatch log group name
- Function name
- Timestamp

Check the referenced log group for full stack trace.

---

## Debugging Approaches

### Check Lambda Logs
```bash
aws logs tail /aws/lambda/<stack-name>-<function-name> --follow
```

### Check DynamoDB Items
```bash
aws dynamodb scan --table-name <invoices-table-name> --filter-expression "#s = :status" \
  --expression-attribute-names '{"#s":"status"}' \
  --expression-attribute-values '{":status":{"S":"pending"}}'
```

### Test API Endpoints
```bash
curl -X GET "${API_URL}invoices?status=pending" -H "X-API-Key: $API_KEY"
```

→ [Error Handling](../../behavior/error-handling.md) | [Deployment Guide](deployment-guide.md)
