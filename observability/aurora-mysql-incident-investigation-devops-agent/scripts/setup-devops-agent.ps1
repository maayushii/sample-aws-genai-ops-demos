<#
.SYNOPSIS
  Guided setup for the Amazon DevOps Agent side of the Aurora incident demo.

  The Agent Space, webhook, and MCP registration are configured in the DevOps Agent
  console. This script walks you through the sequence and prints the exact values you
  need from the deployed stacks.

.EXAMPLE
  ./setup-devops-agent.ps1 -Region us-east-1
#>
param(
  [string]$Region = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrEmpty($Region)) {
  $Region = $env:AWS_DEFAULT_REGION
  if ([string]::IsNullOrEmpty($Region)) { $Region = (aws configure get region 2>$null) }
}
if ([string]::IsNullOrEmpty($Region)) { Write-Host "ERROR: -Region required" -ForegroundColor Red; exit 1 }

Write-Host "=== Aurora DevOps Agent — Setup Guide ($Region) ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Step 1. Deploy the MCP server stack (business context tools):"
Write-Host "    cd infrastructure\cdk"
Write-Host "    python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r requirements.txt"
Write-Host "    `$env:PYTHONPATH = (Resolve-Path ..\..).Path"
Write-Host "    npx cdk deploy AuroraDemoMcpServer-$Region --require-approval never"
Write-Host ""

$McpStack = "AuroraDemoMcpServer-$Region"
$McpEndpoint = aws cloudformation describe-stacks --stack-name $McpStack --region $Region --no-cli-pager `
  --query "Stacks[0].Outputs[?OutputKey=='McpEndpoint'].OutputValue" --output text 2>$null
$ApiKeyId = aws cloudformation describe-stacks --stack-name $McpStack --region $Region --no-cli-pager `
  --query "Stacks[0].Outputs[?OutputKey=='ApiKeyId'].OutputValue" --output text 2>$null

if (-not [string]::IsNullOrEmpty($McpEndpoint) -and $McpEndpoint -ne "None") {
  Write-Host "MCP endpoint : $McpEndpoint"
  if (-not [string]::IsNullOrEmpty($ApiKeyId) -and $ApiKeyId -ne "None") {
    $ApiKeyValue = aws apigateway get-api-key --api-key $ApiKeyId --include-value --region $Region `
      --query 'value' --output text --no-cli-pager 2>$null
    Write-Host "MCP API key  : $ApiKeyValue"
  }
} else {
  Write-Host "(MCP stack not deployed yet — deploy it with the command above, then re-run this script.)"
}

Write-Host ""
Write-Host "Step 2. In the DevOps Agent console:"
Write-Host "    a) Create an Agent Space and associate this AWS account."
Write-Host "    b) Create a generic webhook — copy its URL and secret."
Write-Host "    c) Register the MCP server above (endpoint + x-api-key header)."
Write-Host ""
Write-Host "Step 3. Deploy the Aurora demo WITH the webhook so alarms notify the agent:"
Write-Host "    ./deploy-all.ps1 -KeyFile `"$HOME\.ssh\your-key.pem`" -WebhookUrl '<WEBHOOK_URL>' -WebhookSecret '<WEBHOOK_SECRET>'"
Write-Host ""
Write-Host "Step 4. Inject a scenario and watch the agent investigate:"
Write-Host "    ./scripts/inject-failure.ps1 -Scenario connection-storm -KeyFile `"$HOME\.ssh\your-key.pem`""
