#!/usr/bin/env bash
# setup-devops-agent.sh — Guided setup for the Amazon DevOps Agent side of the demo.
#
# The DevOps Agent Space, webhook, and MCP registration are configured in the
# DevOps Agent console. This script walks you through the sequence and prints
# the exact values you need from the deployed stacks.
#
# Usage: ./setup-devops-agent.sh [region]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REGION="${1:-${AWS_DEFAULT_REGION:-${AWS_REGION:-$(aws configure get region 2>/dev/null)}}}"
[[ -z "$REGION" ]] && { echo "ERROR: region required (arg 1 or AWS_DEFAULT_REGION)"; exit 1; }

echo "=== Aurora DevOps Agent — Setup Guide ($REGION) ==="
echo ""
echo "Step 1. Deploy the MCP server stack (business context tools):"
echo "    cd infrastructure/cdk"
echo "    python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
echo "    export PYTHONPATH=\"\$(cd ../.. && pwd)\""
echo "    npx cdk deploy AuroraDemoMcpServer-$REGION --require-approval never"
echo ""

MCP_STACK="AuroraDemoMcpServer-$REGION"
MCP_ENDPOINT=$(aws cloudformation describe-stacks --stack-name "$MCP_STACK" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='McpEndpoint'].OutputValue" --output text --no-cli-pager 2>/dev/null || true)
API_KEY_ID=$(aws cloudformation describe-stacks --stack-name "$MCP_STACK" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiKeyId'].OutputValue" --output text --no-cli-pager 2>/dev/null || true)

if [[ -n "$MCP_ENDPOINT" && "$MCP_ENDPOINT" != "None" ]]; then
  echo "MCP endpoint : $MCP_ENDPOINT"
  if [[ -n "$API_KEY_ID" && "$API_KEY_ID" != "None" ]]; then
    API_KEY_VALUE=$(aws apigateway get-api-key --api-key "$API_KEY_ID" --include-value \
      --region "$REGION" --query 'value' --output text --no-cli-pager 2>/dev/null || true)
    echo "MCP API key  : $API_KEY_VALUE"
  fi
else
  echo "(MCP stack not deployed yet — deploy it with the command above, then re-run this script.)"
fi

echo ""
echo "Step 2. In the DevOps Agent console:"
echo "    a) Create an Agent Space and associate this AWS account."
echo "    b) Create a generic webhook — copy its URL and secret."
echo "    c) Register the MCP server above (endpoint + x-api-key header)."
echo ""
echo "Step 3. Deploy the Aurora demo WITH the webhook so alarms notify the agent:"
echo "    ./deploy-all.sh --key-file ~/.ssh/your-key.pem \\"
echo "        --webhook-url '<WEBHOOK_URL>' --webhook-secret '<WEBHOOK_SECRET>'"
echo ""
echo "Step 4. Inject a scenario and watch the agent investigate:"
echo "    bash scripts/inject-failure.sh connection-storm --key-file ~/.ssh/your-key.pem"
