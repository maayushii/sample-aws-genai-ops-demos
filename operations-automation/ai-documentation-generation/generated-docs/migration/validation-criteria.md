# Validation Criteria

> **Navigation:** [← Test Specifications](test-specifications.md) | [Component Order →](component-order.md)

## Post-Migration Validation

### 1. CDK Synthesis
- [ ] `cdk synth` completes without errors
- [ ] CDK Nag evaluation passes (all existing suppressions still valid)
- [ ] Same number of resources synthesized as before migration
- [ ] All stack outputs remain identical

### 2. Unit Tests
- [ ] `npm test` passes all existing tests
- [ ] `crypto-invoice-stack-simple.test.js` validates 2 tables, 2 secrets, 4 Lambdas, 1 API, 1 SNS, 1 EventBridge rule

### 3. Functional Validation
- [ ] Invoice creation returns valid invoiceId, address, and QR code
- [ ] Invoice management CRUD operations work correctly
- [ ] Status transitions follow business rules (pending↔cancelled, paid/swept immutable)
- [ ] Watcher detects payments and updates status
- [ ] Sweeper transfers funds and marks as swept
- [ ] SNS notifications sent for payments and errors

### 4. SDK Migration Specific
- [ ] No `require('aws-sdk')` imports remain in Lambda files
- [ ] All Lambda functions use `@aws-sdk/*` modular imports
- [ ] No `.promise()` calls remain (v3 uses native promises)
- [ ] `AWS.DynamoDB.Converter.unmarshall` replaced with `unmarshall` from `@aws-sdk/util-dynamodb`
- [ ] Package.json files reference `@aws-sdk/*` instead of `aws-sdk`
- [ ] Bundle sizes reduced (verify via CloudWatch Lambda metrics)

### 5. Integration Tests
- [ ] `npm run test-invoice-management` passes
- [ ] End-to-end payment flow completes (if blockchain testnet available)

### 6. Performance Validation
- [ ] Lambda cold start times equal or improved
- [ ] No increase in error rates
- [ ] API Gateway latency unchanged

→ [Component Order](component-order.md) | [Remediation Plan](../technical-debt/remediation-plan.md)
