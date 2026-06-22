#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
BOLD='\033[1m'

# --- Usage ---
if [ -z "$1" ]; then
  echo ""
  echo -e "${BOLD}Usage:${NC} ./add-account.sh <ACCOUNT_ID> [REGION]"
  echo ""
  echo "  Adds a source account to the monitoring solution."
  echo "  Checks access, bootstraps, updates cdk.json, and deploys."
  echo ""
  echo "  Examples:"
  echo "    ./add-account.sh 333333333333"
  echo "    ./add-account.sh 333333333333 eu-west-1"
  echo ""
  exit 1
fi

ACCOUNT_ID="$1"
REGION="${2:-us-east-1}"

# Validate account ID
if ! [[ "$ACCOUNT_ID" =~ ^[0-9]{12}$ ]]; then
  echo -e "${RED}✗ Invalid account ID '$ACCOUNT_ID'. Must be exactly 12 digits.${NC}"
  exit 1
fi

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Add Source Account: $ACCOUNT_ID ($REGION)${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo ""

# --- Check cdk.json exists ---
if [ ! -f "cdk.json" ]; then
  echo -e "${RED}✗ cdk.json not found. Run ./setup.sh first.${NC}"
  exit 1
fi

# --- Get monitoring account from cdk.json ---
MON_ACCOUNT_ID=$(node -e "const c=require('./cdk.json');console.log(c.context.monitoringAccount.accountId)")
MON_REGION=$(node -e "const c=require('./cdk.json');console.log(c.context.monitoringAccount.region)")

if [ "$MON_ACCOUNT_ID" = "111111111111" ] || [ -z "$MON_ACCOUNT_ID" ]; then
  echo -e "${RED}✗ cdk.json has placeholder values. Run ./setup.sh first to configure.${NC}"
  exit 1
fi

echo -e "  Monitoring account: $MON_ACCOUNT_ID ($MON_REGION)"
echo ""

# --- Check if account already exists in config ---
ALREADY_EXISTS=$(node -e "
const c=require('./cdk.json');
const exists = c.context.sourceAccounts.some(a => a.accountId === '$ACCOUNT_ID' && a.region === '$REGION');
console.log(exists ? 'yes' : 'no');
")

if [ "$ALREADY_EXISTS" = "yes" ]; then
  echo -e "${YELLOW}⚠ Account $ACCOUNT_ID ($REGION) is already in cdk.json.${NC}"
  echo ""
  read -p "  Re-deploy anyway? [Y/n]: " REDEPLOY
  if [[ "$REDEPLOY" =~ ^[Nn] ]]; then
    exit 0
  fi
else
  echo -e "  ${BLUE}Adding $ACCOUNT_ID ($REGION) to cdk.json...${NC}"
fi

# --- Check access ---
echo -e "  ${BLUE}Checking access to $ACCOUNT_ID...${NC}"

HAS_ACCESS=false
ACCESS_METHOD=""

# Try CDK deploy role (already bootstrapped)
if aws sts assume-role --role-arn "arn:aws:iam::${ACCOUNT_ID}:role/cdk-hnb659fds-deploy-role-${ACCOUNT_ID}-${REGION}" --role-session-name add-account-check --query Account --output text &> /dev/null; then
  HAS_ACCESS=true
  ACCESS_METHOD="CDK role (already bootstrapped)"
  NEEDS_BOOTSTRAP=false
# Try Org role
elif aws sts assume-role --role-arn "arn:aws:iam::${ACCOUNT_ID}:role/OrganizationAccountAccessRole" --role-session-name add-account-check --query Account --output text &> /dev/null; then
  HAS_ACCESS=true
  ACCESS_METHOD="Organization role"
  NEEDS_BOOTSTRAP=true
# Try Control Tower role
elif aws sts assume-role --role-arn "arn:aws:iam::${ACCOUNT_ID}:role/AWSControlTowerExecution" --role-session-name add-account-check --query Account --output text &> /dev/null; then
  HAS_ACCESS=true
  ACCESS_METHOD="Control Tower role"
  NEEDS_BOOTSTRAP=true
# Check if we ARE in that account
else
  CALLER_ACCOUNT=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "")
  if [ "$CALLER_ACCOUNT" = "$ACCOUNT_ID" ]; then
    HAS_ACCESS=true
    ACCESS_METHOD="Direct (current credentials)"
    NEEDS_BOOTSTRAP=true
  fi
fi

if [ "$HAS_ACCESS" = false ]; then
  echo -e "  ${RED}✗ No access to account $ACCOUNT_ID${NC}"
  echo ""
  echo -e "  ${YELLOW}To fix this, you need one of:${NC}"
  echo "    • AWS credentials for that account"
  echo "    • OrganizationAccountAccessRole trust"
  echo "    • AWSControlTowerExecution role access"
  echo ""
  echo -e "  ${YELLOW}Once you have access, bootstrap manually:${NC}"
  echo -e "    ${BOLD}cdk bootstrap aws://$ACCOUNT_ID/$REGION --trust $MON_ACCOUNT_ID${NC}"
  echo ""
  echo -e "  ${YELLOW}Then re-run:${NC}"
  echo -e "    ${BOLD}./add-account.sh $ACCOUNT_ID $REGION${NC}"
  exit 1
fi

echo -e "  ${GREEN}✓ Access confirmed ($ACCESS_METHOD)${NC}"
echo ""

# --- Bootstrap if needed ---
if [ "$NEEDS_BOOTSTRAP" = true ]; then
  echo -e "  ${BLUE}Bootstrapping $ACCOUNT_ID ($REGION) with --trust $MON_ACCOUNT_ID...${NC}"
  if npx cdk bootstrap "aws://$ACCOUNT_ID/$REGION" --trust "$MON_ACCOUNT_ID" --cloudformation-execution-policies "arn:aws:iam::aws:policy/AdministratorAccess" 2>&1 | tail -3; then
    echo -e "  ${GREEN}✓ Bootstrapped${NC}"
  else
    echo -e "  ${RED}✗ Bootstrap failed. You may need to run it manually with appropriate credentials.${NC}"
    echo -e "    ${BOLD}cdk bootstrap aws://$ACCOUNT_ID/$REGION --trust $MON_ACCOUNT_ID${NC}"
    exit 1
  fi
  echo ""
else
  echo -e "  ${GREEN}✓ Already bootstrapped${NC}"
  echo ""
fi

# --- Update cdk.json ---
if [ "$ALREADY_EXISTS" = "no" ]; then
  node -e "
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('cdk.json', 'utf8'));
config.context.sourceAccounts.push({ accountId: '$ACCOUNT_ID', region: '$REGION' });
fs.writeFileSync('cdk.json', JSON.stringify(config, null, 2) + '\n');
console.log('  ✓ cdk.json updated');
"
  echo ""
fi

# --- Deploy source stack ---
echo -e "  ${BLUE}Deploying DevOpsAgent-SourceAccount-$ACCOUNT_ID...${NC}"
echo ""

npx cdk deploy "DevOpsAgent-SourceAccount-$ACCOUNT_ID" --require-approval never

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ Account $ACCOUNT_ID added successfully!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "  The Lambda will automatically pick up metrics from this"
echo "  account on its next hourly run. No restart needed."
echo ""
