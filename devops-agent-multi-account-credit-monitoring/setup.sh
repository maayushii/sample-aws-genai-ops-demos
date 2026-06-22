#!/bin/bash

# Don't exit on error — we handle failures gracefully
set +e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
BOLD='\033[1m'

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  DevOps Agent Monitoring at Scale — Setup${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "This script will configure and deploy the monitoring solution."
echo -e "You'll need: AWS CLI configured, CDK CLI installed, Node.js 18+."
echo ""

# --- Pre-flight checks ---
echo -e "${BLUE}[1/7] Pre-flight checks...${NC}"

PREFLIGHT_OK=true

if ! command -v node &> /dev/null; then
  echo -e "${RED}✗ Node.js not found. Install Node.js 18+ and try again.${NC}"
  PREFLIGHT_OK=false
fi

if ! command -v npx &> /dev/null; then
  echo -e "${RED}✗ npx not found. Install Node.js 18+ and try again.${NC}"
  PREFLIGHT_OK=false
fi

if ! command -v aws &> /dev/null; then
  echo -e "${RED}✗ AWS CLI not found. Install it: https://aws.amazon.com/cli/${NC}"
  PREFLIGHT_OK=false
fi

if [ "$PREFLIGHT_OK" = false ]; then
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}✗ Node.js 18+ required (found v$(node -v))${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v), AWS CLI, npx — all good${NC}"
echo ""

# --- Configuration ---
echo -e "${BLUE}[2/7] Configuration${NC}"
echo ""

# Monitoring account
read -p "  Monitoring account ID (12 digits): " MON_ACCOUNT_ID
if ! [[ "$MON_ACCOUNT_ID" =~ ^[0-9]{12}$ ]]; then
  echo -e "${RED}✗ Invalid account ID. Must be exactly 12 digits.${NC}"
  exit 1
fi

read -p "  Monitoring account region [us-east-1]: " MON_REGION
MON_REGION=${MON_REGION:-us-east-1}

echo ""

# Source accounts
SOURCE_ACCOUNTS=()
SOURCE_IDS=()
SOURCE_REGIONS=()
echo "  Source accounts (accounts using DevOps Agent):"
echo "  Enter account IDs one per line. Empty line when done."
echo ""
while true; do
  read -p "    Source account ID (or Enter to finish): " SRC_ID
  if [ -z "$SRC_ID" ]; then
    break
  fi
  if ! [[ "$SRC_ID" =~ ^[0-9]{12}$ ]]; then
    echo -e "    ${RED}✗ Invalid. Must be 12 digits. Try again.${NC}"
    continue
  fi
  read -p "    Region for $SRC_ID [us-east-1]: " SRC_REGION
  SRC_REGION=${SRC_REGION:-us-east-1}
  SOURCE_ACCOUNTS+=("{\"accountId\":\"$SRC_ID\",\"region\":\"$SRC_REGION\"}")
  SOURCE_IDS+=("$SRC_ID")
  SOURCE_REGIONS+=("$SRC_REGION")
  echo -e "    ${GREEN}✓ Added $SRC_ID ($SRC_REGION)${NC}"
done

if [ ${#SOURCE_ACCOUNTS[@]} -eq 0 ]; then
  echo -e "${RED}✗ At least one source account is required.${NC}"
  exit 1
fi

echo ""

# Billing
read -p "  Enterprise Support monthly fee (USD): " MONTHLY_FEE
if ! [[ "$MONTHLY_FEE" =~ ^[0-9]+$ ]] || [ "$MONTHLY_FEE" -le 0 ]; then
  echo -e "${RED}✗ Must be a positive number.${NC}"
  exit 1
fi

read -p "  Credit percentage [75]: " CREDIT_PCT
CREDIT_PCT=${CREDIT_PCT:-75}

read -p "  Rate per agent-second [0.0083]: " RATE
RATE=${RATE:-0.0083}

echo ""

# Alerts
read -p "  Alert email (will receive SNS notifications): " ALERT_EMAIL
if [ -z "$ALERT_EMAIL" ]; then
  echo -e "${RED}✗ Email is required.${NC}"
  exit 1
fi

read -p "  Warning threshold % [75]: " WARN_PCT
WARN_PCT=${WARN_PCT:-75}

read -p "  Critical threshold % [100]: " CRIT_PCT
CRIT_PCT=${CRIT_PCT:-100}

echo ""

# --- Calculate and preview ---
echo -e "${BLUE}[3/7] Credit calculation preview${NC}"
echo ""

PREVIEW=$(node -e "
const fee = $MONTHLY_FEE;
const creditPct = $CREDIT_PCT;
const rate = $RATE;
const warnPct = $WARN_PCT;
const critPct = $CRIT_PCT;
const credit = fee * creditPct / 100;
const totalSec = Math.floor(credit / rate);
const warnSec = Math.floor(totalSec * warnPct / 100);
const critSec = Math.floor(totalSec * critPct / 100);
console.log('  Monthly credit:      \$' + credit.toLocaleString());
console.log('  Total agent hours:   ' + (totalSec/3600).toFixed(0) + 'h (' + totalSec.toLocaleString() + 's)');
console.log('  Warning threshold:   ' + (warnSec/3600).toFixed(0) + 'h (' + warnPct + '%)');
console.log('  Critical threshold:  ' + (critSec/3600).toFixed(0) + 'h (' + critPct + '%)');
")
echo "$PREVIEW"
echo ""

read -p "  Does this look correct? [Y/n]: " CONFIRM
if [[ "$CONFIRM" =~ ^[Nn] ]]; then
  echo "Aborted. Run the script again to reconfigure."
  exit 0
fi

echo ""

# --- Access check & Bootstrap ---
echo -e "${BLUE}[4/7] Checking account access & bootstrapping...${NC}"
echo ""

# Helper: try to assume a role, return 0 on success
try_assume_role() {
  local ROLE_ARN="$1"
  aws sts assume-role --role-arn "$ROLE_ARN" --role-session-name "setup-check" --query "Credentials.AccessKeyId" --output text &> /dev/null
  return $?
}

# Helper: bootstrap an account by assuming a cross-account role
bootstrap_via_role() {
  local ACC_ID="$1"
  local ACC_REGION="$2"
  local ROLE_ARN="$3"
  local TRUST_ACCOUNT="$4"

  local CREDS
  CREDS=$(aws sts assume-role --role-arn "$ROLE_ARN" --role-session-name "cdk-bootstrap-${ACC_ID}" --output json 2>/dev/null)
  if [ $? -ne 0 ] || [ -z "$CREDS" ]; then
    return 1
  fi

  # Extract credentials
  local AK SK ST
  AK=$(echo "$CREDS" | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8');console.log(JSON.parse(d).Credentials.AccessKeyId)" 2>/dev/null)
  SK=$(echo "$CREDS" | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8');console.log(JSON.parse(d).Credentials.SecretAccessKey)" 2>/dev/null)
  ST=$(echo "$CREDS" | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8');console.log(JSON.parse(d).Credentials.SessionToken)" 2>/dev/null)

  if [ -z "$AK" ] || [ -z "$SK" ] || [ -z "$ST" ]; then
    return 1
  fi

  # Run bootstrap with assumed credentials
  AWS_ACCESS_KEY_ID="$AK" AWS_SECRET_ACCESS_KEY="$SK" AWS_SESSION_TOKEN="$ST" \
    npx cdk bootstrap "aws://$ACC_ID/$ACC_REGION" \
      --trust "$TRUST_ACCOUNT" \
      --cloudformation-execution-policies "arn:aws:iam::aws:policy/AdministratorAccess" \
      --quiet 2>/dev/null

  return $?
}

MONITOR_ACCESSIBLE=false
DEPLOYABLE_SOURCES=()
SKIPPED_ACCOUNTS=()

# --- Check monitoring account ---
echo -n "  Monitoring account $MON_ACCOUNT_ID... "
CALLER_ACCOUNT=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "")

if [ "$CALLER_ACCOUNT" = "$MON_ACCOUNT_ID" ]; then
  echo -e "${GREEN}✓ Direct access${NC}"
  MONITOR_ACCESSIBLE=true

  # Bootstrap monitoring account (idempotent)
  echo -n "    Bootstrapping... "
  if npx cdk bootstrap "aws://$MON_ACCOUNT_ID/$MON_REGION" --quiet 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
  else
    echo -e "${GREEN}✓ (already bootstrapped)${NC}"
  fi
elif try_assume_role "arn:aws:iam::${MON_ACCOUNT_ID}:role/cdk-hnb659fds-deploy-role-${MON_ACCOUNT_ID}-${MON_REGION}"; then
  echo -e "${GREEN}✓ CDK role access (already bootstrapped)${NC}"
  MONITOR_ACCESSIBLE=true
else
  echo -e "${RED}✗ No access — cannot deploy monitoring stack${NC}"
  SKIPPED_ACCOUNTS+=("$MON_ACCOUNT_ID ($MON_REGION) — monitoring account")
fi

echo ""

# --- Check & bootstrap source accounts ---
for i in "${!SOURCE_IDS[@]}"; do
  SRC_ID="${SOURCE_IDS[$i]}"
  SRC_REGION="${SOURCE_REGIONS[$i]}"
  echo -n "  Source account $SRC_ID ($SRC_REGION)... "

  # Check if already bootstrapped (CDK deploy role exists)
  if try_assume_role "arn:aws:iam::${SRC_ID}:role/cdk-hnb659fds-deploy-role-${SRC_ID}-${SRC_REGION}"; then
    echo -e "${GREEN}✓ Already bootstrapped${NC}"
    DEPLOYABLE_SOURCES+=("$SRC_ID:$SRC_REGION")
    continue
  fi

  # Not bootstrapped — try to bootstrap via various roles
  echo -e "${YELLOW}needs bootstrap${NC}"
  BOOTSTRAPPED=false

  # Try OrganizationAccountAccessRole
  echo -n "    Trying OrganizationAccountAccessRole... "
  if bootstrap_via_role "$SRC_ID" "$SRC_REGION" "arn:aws:iam::${SRC_ID}:role/OrganizationAccountAccessRole" "$MON_ACCOUNT_ID"; then
    echo -e "${GREEN}✓ Bootstrapped${NC}"
    BOOTSTRAPPED=true
  else
    echo -e "${YELLOW}✗${NC}"
  fi

  # Try AWSControlTowerExecution
  if [ "$BOOTSTRAPPED" = false ]; then
    echo -n "    Trying AWSControlTowerExecution... "
    if bootstrap_via_role "$SRC_ID" "$SRC_REGION" "arn:aws:iam::${SRC_ID}:role/AWSControlTowerExecution" "$MON_ACCOUNT_ID"; then
      echo -e "${GREEN}✓ Bootstrapped${NC}"
      BOOTSTRAPPED=true
    else
      echo -e "${YELLOW}✗${NC}"
    fi
  fi

  # Try AWSReservedSSO_AdministratorAccess (SSO)
  if [ "$BOOTSTRAPPED" = false ]; then
    echo -n "    Trying direct bootstrap (current creds)... "
    if npx cdk bootstrap "aws://$SRC_ID/$SRC_REGION" --trust "$MON_ACCOUNT_ID" --cloudformation-execution-policies "arn:aws:iam::aws:policy/AdministratorAccess" --quiet 2>/dev/null; then
      echo -e "${GREEN}✓ Bootstrapped${NC}"
      BOOTSTRAPPED=true
    else
      echo -e "${YELLOW}✗${NC}"
    fi
  fi

  if [ "$BOOTSTRAPPED" = true ]; then
    DEPLOYABLE_SOURCES+=("$SRC_ID:$SRC_REGION")
  else
    echo -e "    ${RED}⚠ Could not bootstrap. Skipping this account.${NC}"
    SKIPPED_ACCOUNTS+=("$SRC_ID ($SRC_REGION)")
  fi

  echo ""
done

echo ""

# --- Summary ---
if [ "$MONITOR_ACCESSIBLE" = false ]; then
  echo -e "${RED}✗ Cannot access monitoring account. Fix credentials and re-run.${NC}"
  echo ""
  exit 1
fi

if [ ${#SKIPPED_ACCOUNTS[@]} -gt 0 ]; then
  echo -e "  ${YELLOW}⚠ Skipped accounts (no access or bootstrap failed):${NC}"
  for sa in "${SKIPPED_ACCOUNTS[@]}"; do
    echo -e "    • $sa"
  done
  echo ""
  echo -e "  ${YELLOW}To add them later, bootstrap manually then run:${NC}"
  echo -e "    ${BOLD}./add-account.sh ACCOUNT_ID REGION${NC}"
  echo ""
fi

echo -e "  ${GREEN}Will deploy:${NC}"
echo -e "    • DevOpsAgent-MonitorAccount → $MON_ACCOUNT_ID ($MON_REGION)"
for src in "${DEPLOYABLE_SOURCES[@]}"; do
  SRC_ID=$(echo "$src" | cut -d: -f1)
  SRC_REGION=$(echo "$src" | cut -d: -f2)
  echo -e "    • DevOpsAgent-SourceAccount-$SRC_ID → $SRC_ID ($SRC_REGION)"
done
echo ""

# --- Generate cdk.json ---
echo -e "${BLUE}[5/7] Generating cdk.json...${NC}"

SOURCE_JSON=$(IFS=,; echo "${SOURCE_ACCOUNTS[*]}")

cat > cdk.json << EOF
{
  "app": "npx ts-node --prefer-ts-exts bin/app.ts",
  "context": {
    "monitoringAccount": {
      "accountId": "$MON_ACCOUNT_ID",
      "region": "$MON_REGION"
    },
    "sourceAccounts": [
      $SOURCE_JSON
    ],
    "billing": {
      "enterpriseSupportMonthlyFee": $MONTHLY_FEE,
      "creditPercentage": $CREDIT_PCT,
      "ratePerAgentSecond": $RATE
    },
    "alerts": {
      "email": "$ALERT_EMAIL",
      "warningPercent": $WARN_PCT,
      "criticalPercent": $CRIT_PCT,
      "enableForecastedAlarm": false
    },
    "dashboardEnabled": true
  }
}
EOF

echo -e "${GREEN}✓ cdk.json generated${NC}"
echo ""

# --- Install dependencies ---
echo -e "${BLUE}[6/7] Installing dependencies...${NC}"
npm install --silent 2>/dev/null
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# --- Deploy ---
echo -e "${BLUE}[7/7] Deploying...${NC}"
echo ""

read -p "  Ready to deploy? [Y/n]: " DEPLOY_CONFIRM
if [[ "$DEPLOY_CONFIRM" =~ ^[Nn] ]]; then
  echo ""
  echo -e "${GREEN}✓ Configuration saved to cdk.json. Deploy later with: npx cdk deploy --all${NC}"
  exit 0
fi

echo ""

# Deploy monitoring stack first
echo -e "  ${BLUE}Deploying DevOpsAgent-MonitorAccount...${NC}"
if npx cdk deploy DevOpsAgent-MonitorAccount --require-approval never 2>&1 | grep -E "✅|❌|error|Error|CREATE_FAILED"; then
  true
fi

# Check if monitoring stack succeeded
if aws cloudformation describe-stacks --stack-name DevOpsAgent-MonitorAccount --region "$MON_REGION" --query "Stacks[0].StackStatus" --output text 2>/dev/null | grep -qE "CREATE_COMPLETE|UPDATE_COMPLETE"; then
  echo -e "  ${GREEN}✓ DevOpsAgent-MonitorAccount deployed${NC}"
else
  echo -e "  ${RED}✗ DevOpsAgent-MonitorAccount deployment failed${NC}"
  echo -e "  ${YELLOW}Check CloudFormation console for details. Source stacks skipped.${NC}"
  echo ""
  exit 1
fi

# Deploy each accessible source stack
DEPLOY_FAILURES=()
for src in "${DEPLOYABLE_SOURCES[@]}"; do
  SRC_ID=$(echo "$src" | cut -d: -f1)
  SRC_REGION=$(echo "$src" | cut -d: -f2)
  echo ""
  echo -e "  ${BLUE}Deploying DevOpsAgent-SourceAccount-$SRC_ID...${NC}"
  DEPLOY_OUTPUT=$(npx cdk deploy "DevOpsAgent-SourceAccount-$SRC_ID" --require-approval never 2>&1)
  DEPLOY_EXIT=$?

  if [ $DEPLOY_EXIT -eq 0 ]; then
    echo -e "  ${GREEN}✓ DevOpsAgent-SourceAccount-$SRC_ID deployed${NC}"
  else
    echo "$DEPLOY_OUTPUT" | grep -E "❌|CREATE_FAILED|Error" | head -3
    echo -e "  ${YELLOW}⚠ DevOpsAgent-SourceAccount-$SRC_ID failed — continuing${NC}"
    DEPLOY_FAILURES+=("$SRC_ID ($SRC_REGION)")
  fi
done

# --- Final summary ---
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ Setup complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

if [ ${#DEPLOY_FAILURES[@]} -gt 0 ] || [ ${#SKIPPED_ACCOUNTS[@]} -gt 0 ]; then
  echo -e "  ${YELLOW}⚠ Some accounts need attention:${NC}"
  for fa in "${SKIPPED_ACCOUNTS[@]}"; do
    echo -e "    • $fa (skipped — no access)"
  done
  for fa in "${DEPLOY_FAILURES[@]}"; do
    echo -e "    • $fa (deploy failed)"
  done
  echo ""
  echo -e "  To add them later:"
  echo -e "    1. Get access to the account"
  echo -e "    2. Run: ${BOLD}./add-account.sh ACCOUNT_ID REGION${NC}"
  echo ""
fi

echo -e "  ${YELLOW}⚠ Check your email ($ALERT_EMAIL) and confirm the SNS subscription.${NC}"
echo ""
echo "  Useful commands:"
echo "    • View dashboard:  Open CloudWatch → Dashboards → DevOpsAgent-CreditDashboard"
echo "    • Add account:     ./add-account.sh ACCOUNT_ID REGION"
echo "    • Update config:   Edit cdk.json, then: npx cdk deploy --all"
echo "    • Tear down:       npx cdk destroy --all"
echo ""
