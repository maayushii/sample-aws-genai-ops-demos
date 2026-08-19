#!/bin/bash
# assess-aurora-cost.sh — Deploy (once) and run the Aurora MySQL cost optimization
# assistant. Analyzes Aurora MySQL clusters in your region and writes an AI-generated
# cost report to S3, then downloads it locally.
set -e

CLUSTER_ID=""
SKIP_SETUP=false

while [[ $# -gt 0 ]]; do
  case $1 in
    -c|--cluster-id) CLUSTER_ID="$2"; shift 2;;
    -s|--skip-setup) SKIP_SETUP=true; shift;;
    -h|--help)
      echo "Usage: $0 [-c <cluster-id>] [-s]"
      echo "  -c, --cluster-id   Analyze a single Aurora cluster (default: all Aurora MySQL clusters in region)"
      echo "  -s, --skip-setup   Skip CDK deployment, only run the analysis"
      exit 0;;
    *) echo "Unknown option: $1"; exit 1;;
  esac
done

echo "=== AI-Powered Aurora MySQL Cost Optimization Assistant ==="
echo "Discovers Aurora MySQL clusters, reads 14-day utilization, and uses Amazon Bedrock"
echo "(Nova) to produce right-sizing, Serverless v2, Graviton, and savings recommendations."
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CDK_DIR="$SCRIPT_DIR/infrastructure/cdk"
SHARED_SCRIPTS_DIR="$SCRIPT_DIR/../../shared/scripts"

if [ "$SKIP_SETUP" = false ]; then
  echo "Running prerequisites check..."
  "$SHARED_SCRIPTS_DIR/check-prerequisites.sh" --required-service bedrock --require-cdk

  echo ""
  echo "Deploying infrastructure via CDK..."
  "$SHARED_SCRIPTS_DIR/deploy-cdk.sh" --cdk-directory "$CDK_DIR"
fi

# Region via shared utility
source "$SHARED_SCRIPTS_DIR/../utils/aws-utils.sh"
REGION=$(get_aws_region)
STACK_NAME="AuroraCostStack-$REGION"
echo ""
echo "      Region: $REGION"

FUNCTION_NAME=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --no-cli-pager \
  --query "Stacks[0].Outputs[?OutputKey=='AnalyzerFunctionName'].OutputValue" --output text)
BUCKET=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --no-cli-pager \
  --query "Stacks[0].Outputs[?OutputKey=='ResultsBucketName'].OutputValue" --output text)

if [[ -z "$FUNCTION_NAME" || "$FUNCTION_NAME" == "None" ]]; then
  echo "ERROR: could not find analyzer function. Run without -s to deploy first."
  exit 1
fi
echo "      Analyzer: $FUNCTION_NAME"
echo "      Bucket:   $BUCKET"

JOB_ID="aurora-cost-$(date +%Y%m%d-%H%M%S)"
PAYLOAD="{\"job_id\":\"$JOB_ID\""
[[ -n "$CLUSTER_ID" ]] && PAYLOAD="$PAYLOAD,\"cluster_id\":\"$CLUSTER_ID\""
PAYLOAD="$PAYLOAD}"

echo ""
echo "Running analysis (this calls Amazon Bedrock and may take 30-90s)..."
RESPONSE_FILE="$(mktemp)"
aws lambda invoke --function-name "$FUNCTION_NAME" --region "$REGION" --no-cli-pager \
  --cli-binary-format raw-in-base64-out \
  --payload "$PAYLOAD" "$RESPONSE_FILE" > /dev/null

REPORT_KEY=$(jq -r '.report_key' "$RESPONSE_FILE" 2>/dev/null)
CLUSTERS=$(jq -r '.clusters_analyzed' "$RESPONSE_FILE" 2>/dev/null)
if [[ -z "$REPORT_KEY" || "$REPORT_KEY" == "null" ]]; then
  echo "ERROR: analysis failed. Raw response:"
  cat "$RESPONSE_FILE"
  rm -f "$RESPONSE_FILE"
  exit 1
fi
rm -f "$RESPONSE_FILE"

LOCAL_DIR="$SCRIPT_DIR/aurora-cost-report-$JOB_ID"
mkdir -p "$LOCAL_DIR"
aws s3 cp "s3://$BUCKET/reports/$JOB_ID/" "$LOCAL_DIR" --recursive --region "$REGION" --no-cli-pager > /dev/null

echo ""
echo "=== Assessment Complete ==="
echo "  Clusters analyzed : ${CLUSTERS:-0}"
echo "  Report            : $LOCAL_DIR/report.md"
echo "  Raw inventory     : $LOCAL_DIR/inventory.json"
echo "  In S3             : s3://$BUCKET/reports/$JOB_ID/"
echo ""
echo "  Re-run analysis only (skip deploy):  $0 -s"
echo "  Analyze one cluster:                 $0 -c <cluster-id>"
