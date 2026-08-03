# =============================================================================
# Setup DevOps Agent MCP Registration (PowerShell)
# =============================================================================

param(
    [string]$AgentSpaceArn = "",
    [string]$RuntimeRegion = ""
)

$ErrorActionPreference = "Stop"
$env:AWS_PAGER = ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = (Resolve-Path "$ScriptDir/../../..").Path
$CdkDir    = "$ScriptDir/../infrastructure/cdk"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " DevOps Agent MCP Registration (CDK)" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

$AwsAccountId = (aws sts get-caller-identity --query Account --output text)
if (-not $AwsAccountId) {
    Write-Host "ERROR: could not resolve AWS account. Configure credentials first." -ForegroundColor Red
    exit 1
}

if (-not $RuntimeRegion) {
    $RuntimeRegion = if ($env:AWS_REGION) { $env:AWS_REGION } `
                     elseif ($env:AWS_DEFAULT_REGION) { $env:AWS_DEFAULT_REGION } `
                     else { (aws configure get region 2>$null) }
}
if (-not $RuntimeRegion) {
    $RuntimeRegion = Read-Host "Enter the region where the MCP runtime is deployed (e.g. eu-west-3)"
}

Write-Host "[1/3] Reading runtime ARN from CloudFormation stack..." -ForegroundColor Yellow

$MainStackName = "SaasStatusMcpStack-$RuntimeRegion"
$RuntimeArn = aws cloudformation describe-stacks `
    --stack-name $MainStackName `
    --region $RuntimeRegion `
    --query "Stacks[0].Outputs[?OutputKey=='RuntimeArn'].OutputValue" `
    --output text 2>$null

if (-not $RuntimeArn -or $RuntimeArn -eq "None") {
    Write-Host "  ERROR: stack '$MainStackName' not found in $RuntimeRegion." -ForegroundColor Red
    Write-Host "  Deploy the MCP server first: .\deploy-all.ps1" -ForegroundColor Red
    exit 1
}
Write-Host "  Runtime ARN: $RuntimeArn"
Write-Host ""

if (-not $AgentSpaceArn) {
    $AgentSpaceArn = if ($env:AGENT_SPACE_ARN) { $env:AGENT_SPACE_ARN } else { "" }
}
if (-not $AgentSpaceArn) {
    Write-Host "Provide your Agent Space ARN (open the DevOps Agent console and from your space click Actions > Copy ARN)." -ForegroundColor Gray
    $AgentSpaceArn = Read-Host "Enter your Agent Space ARN"
}

if ($AgentSpaceArn -match '^arn:aws[\w-]*:aidevops:([^:]+):(\d+):agentspace/(.+)$') {
    $AgentSpaceRegion = $Matches[1]
    $AgentSpaceAccount = $Matches[2]
    $AgentSpaceId = $Matches[3]
} else {
    Write-Host "ERROR: not a valid Agent Space ARN." -ForegroundColor Red
    exit 1
}

Write-Host "  Account:            $AwsAccountId"
Write-Host "  Runtime region:     $RuntimeRegion"
Write-Host "  Agent Space region: $AgentSpaceRegion"
Write-Host "  Agent Space ID:     $AgentSpaceId"
Write-Host ""

Write-Host "[2/3] Installing CDK dependencies..." -ForegroundColor Yellow
Push-Location $CdkDir
python -m pip install -r requirements.txt --quiet 2>$null
Pop-Location

Write-Host "[3/3] Deploying SaasStatusMcpRegistrationStack via CDK..." -ForegroundColor Yellow

$StackId = "SaasStatusMcpRegistrationStack-$AgentSpaceRegion"
$env:PYTHONPATH = $RepoRoot

Push-Location $CdkDir
npx cdk deploy $StackId `
    --require-approval never `
    --context "agent_space_id=$AgentSpaceId" `
    --context "agent_space_region=$AgentSpaceRegion" `
    --context "runtime_arn=$RuntimeArn" `
    --context "runtime_region=$RuntimeRegion"
$exitCode = $LASTEXITCODE
Pop-Location

if ($exitCode -ne 0) {
    Write-Host "ERROR: CDK deployment failed." -ForegroundColor Red
    exit 1
}

$regOutputs = aws cloudformation describe-stacks `
    --stack-name $StackId `
    --region $AgentSpaceRegion `
    --query "Stacks[0].Outputs" `
    --output json 2>$null | ConvertFrom-Json

$serviceId    = ($regOutputs | Where-Object { $_.OutputKey -eq "ServiceId" }).OutputValue
$signingRole  = ($regOutputs | Where-Object { $_.OutputKey -eq "SigningRoleArn" }).OutputValue

Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host "  Registration Complete" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  CDK stack:    $StackId" -ForegroundColor Cyan
Write-Host "  Service ID:   $serviceId" -ForegroundColor Cyan
Write-Host "  Agent Space:  $AgentSpaceId ($AgentSpaceRegion)" -ForegroundColor Cyan
Write-Host "  Signing role: $signingRole" -ForegroundColor Cyan
Write-Host "  MCP name:     saas-status-mcp" -ForegroundColor Cyan
Write-Host "  Tools:        4 enabled" -ForegroundColor Cyan
Write-Host ""
exit 0
