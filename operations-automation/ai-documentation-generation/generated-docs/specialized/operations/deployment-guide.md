# Deployment Guide

> **Navigation:** [← README](../../README.md) | [Monitoring →](monitoring-guide.md) | [Troubleshooting →](troubleshooting-guide.md)

## Prerequisites
1. AWS Account with appropriate permissions
2. Node.js 18.x or later
3. AWS CDK CLI (`npm install -g aws-cdk`)
4. AWS CLI configured with credentials
5. Blockchain RPC endpoint (Infura, Alchemy, or similar)

## EVM Stack Deployment

### 1. Clone and Install
```bash
git clone <repository-url> && cd sample-serverless-digital-asset-payments
npm install
```

### 2. Configure Environment
```bash
cp .env-sample .env
# Edit .env with: RPC_URL, TREASURY_PUBLIC_ADDRESS, HOT_WALLET_PK
```

### 3. Deploy CDK Stack
```bash
cdk deploy  # or: npm run deploy
```

### 4. Setup Secrets
```bash
npm run setup-secrets
# Generates BIP-39 mnemonic and stores in Secrets Manager
# Stores hot wallet PK in Secrets Manager
```

### 5. (Optional) Subscribe to SNS Notifications
Navigate to AWS Console → SNS → Create subscription → Email

## Solana Stack Deployment

```bash
cd non-evm-deployments/solana
npm install
cp .env-sample .env
# Edit .env with: SOLANA_RPC_URL, SOLANA_TREASURY_PUBLIC_KEY
npm run deploy
npm run setup-secrets
```

## Automated Setup
```bash
npm run setup  # Handles all steps automatically
```

## Stack Outputs
After deployment, retrieve API URL and key:
```bash
export STACK_NAME="CryptoInvoiceStack"
export API_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='InvoiceApiBaseUrl'].OutputValue" --output text)
export API_KEY_ID=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='InvoiceApiKeyId'].OutputValue" --output text)
export API_KEY=$(aws apigateway get-api-key --api-key "$API_KEY_ID" --include-value \
  --query 'value' --output text)
```

## Cleanup
```bash
cdk destroy
rm -rf node_modules/ cdk.out/
```

→ [Architecture Overview](../../architecture/system-overview.md) | [API Reference](../../reference/api-reference.md)
