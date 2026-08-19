<#
.SYNOPSIS
  Deploy (once) and run the Aurora MySQL cost optimization assistant.

.EXAMPLE
  ./assess-aurora-cost.ps1
  ./assess-aurora-cost.ps1 -ClusterId my-aurora-cluster
  ./assess-aurora-cost.ps1 -SkipSetup
#>
param(
  [string]$ClusterId = "",
  [switch]$SkipSetup
)

$ErrorActionPreference = "Stop"
$ScriptDir = $PSScriptRoot
$CdkDir = Join-Path $ScriptDir "infrastructure\cdk"
$SharedScripts = Join-Path $ScriptDir "..\..\shared\scripts"

Write-Host "=== AI-Powered Aurora MySQL Cost Optimization Assistant ===" -ForegroundColor Cyan
Write-Host "Discovers Aurora MySQL clusters, reads 14-day utilization, and uses Amazon Bedrock"
Write-Host "(Nova) to produce right-sizing, Serverless v2, Graviton, and savings recommendations."
Write-Host ""

if (-not $SkipSetup) {
  Write-Host "Running prerequisites check..." -ForegroundColor Yellow
  & "$SharedScripts\check-prerequisites.ps1" -RequiredService "bedrock" -RequireCDK
  Write-Host "`nDeploying infrastructure via CDK..." -ForegroundColor Yellow
  & "$SharedScripts\deploy-cdk.ps1" -CdkDirectory $CdkDir
}

$region = $env:AWS_DEFAULT_REGION
if ([string]::IsNullOrEmpty($region)) { $region = (aws configure get region 2>$null) }
$StackName = "AuroraCostStack-$region"
Write-Host "`n      Region: $region"

$FunctionName = aws cloudformation describe-stacks --stack-name $StackName --region $region --no-cli-pager `
  --query "Stacks[0].Outputs[?OutputKey=='AnalyzerFunctionName'].OutputValue" --output text
$Bucket = aws cloudformation describe-stacks --stack-name $StackName --region $region --no-cli-pager `
  --query "Stacks[0].Outputs[?OutputKey=='ResultsBucketName'].OutputValue" --output text

if ([string]::IsNullOrEmpty($FunctionName) -or $FunctionName -eq "None") {
  Write-Host "ERROR: could not find analyzer function. Run without -SkipSetup to deploy first." -ForegroundColor Red
  exit 1
}
Write-Host "      Analyzer: $FunctionName"
Write-Host "      Bucket:   $Bucket"

$JobId = "aurora-cost-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
if ($ClusterId) {
  $payload = "{`"job_id`":`"$JobId`",`"cluster_id`":`"$ClusterId`"}"
} else {
  $payload = "{`"job_id`":`"$JobId`"}"
}

Write-Host "`nRunning analysis (this calls Amazon Bedrock and may take 30-90s)..." -ForegroundColor Yellow
$responseFile = New-TemporaryFile
aws lambda invoke --function-name $FunctionName --region $region --no-cli-pager `
  --cli-binary-format raw-in-base64-out --payload $payload $responseFile.FullName | Out-Null

$result = Get-Content $responseFile.FullName | ConvertFrom-Json
Remove-Item $responseFile.FullName -Force
if (-not $result.report_key) {
  Write-Host "ERROR: analysis failed." -ForegroundColor Red
  exit 1
}

$localDir = Join-Path $ScriptDir "aurora-cost-report-$JobId"
New-Item -ItemType Directory -Force -Path $localDir | Out-Null
aws s3 cp "s3://$Bucket/reports/$JobId/" $localDir --recursive --region $region --no-cli-pager | Out-Null

Write-Host "`n=== Assessment Complete ===" -ForegroundColor Green
Write-Host "  Clusters analyzed : $($result.clusters_analyzed)" -ForegroundColor Cyan
Write-Host "  Report            : $localDir\report.md" -ForegroundColor Cyan
Write-Host "  Raw inventory     : $localDir\inventory.json" -ForegroundColor Cyan
Write-Host "  In S3             : s3://$Bucket/reports/$JobId/" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Re-run analysis only (skip deploy):  ./assess-aurora-cost.ps1 -SkipSetup" -ForegroundColor Cyan
