# DevOps Agent Monitoring at Scale

AWS CDK (TypeScript) project that deploys cross-account CloudWatch observability infrastructure to monitor AWS DevOps Agent usage across multiple accounts. The system calculates credit thresholds from Enterprise Support billing, aggregates real cumulative usage via a scheduled Lambda, and sends alerts via SNS when thresholds are exceeded.

## Architecture

![DevOps Agent Monitoring at Scale - Architecture](Architecture/DevOps%20Agent%20Monitoring%20at%20Scale%20-%20Architecture.png)

## Why SNS for Alerts?

This project uses **Amazon SNS** (Simple Notification Service) for threshold alerts. The Lambda publishes to an SNS topic, and subscribers receive notifications via their preferred channel.

### Why Not CloudWatch Alarms Directly?

| Limitation | Impact |
|-----------|--------|
| CloudWatch Alarms max period is **7 days** | We need a **30-day rolling window** (month-to-date) |
| Alarms don't support **SEARCH expressions** | We need to aggregate across all agent spaces dynamically |
| Metrics Insights SQL in alarms is limited to **3 hours** | We need month-to-date aggregation |

So we use a **Lambda + SNS** pattern: the Lambda does the complex query logic hourly, and publishes to SNS when thresholds are breached.

### What You Can Subscribe to the SNS Topic

After deployment, add any combination of subscribers:

| Subscriber | How |
|-----------|-----|
| Email | Automatic — configured via `alerts.email` in `cdk.json` |
| Additional emails | Add subscriptions in SNS console or via CLI |
| Slack | AWS Chatbot → SNS integration |
| PagerDuty / OpsGenie | HTTPS endpoint subscription |
| Lambda (custom logic) | Lambda subscription for custom routing |
| SMS | SMS subscription (where supported) |

### Adding More Subscribers

```bash
# Additional email
aws sns subscribe --topic-arn <TOPIC_ARN> --protocol email --notification-endpoint team@example.com

# HTTPS endpoint (PagerDuty, etc.)
aws sns subscribe --topic-arn <TOPIC_ARN> --protocol https --notification-endpoint https://events.pagerduty.com/integration/...
```

The topic ARN is output during deployment and visible in the CloudFormation stack outputs.

## Design & Components

### 1. OAM Sink (Monitoring Account)

The OAM (Observability Access Manager) Sink is the central receiver for cross-account metrics. Source accounts link to this sink to share their `AWS/AIDevOps` namespace metrics.

- **Organization-scoped policy**: When `orgId` is provided, any account in the organization can link
- **Account-scoped policy**: When no `orgId`, only explicitly listed source accounts can link
- Sink ARN is stored in SSM Parameter Store for cross-account reference

### 2. OAM Link (Source Accounts)

Each source account deploys an OAM Link that connects to the central Sink. This enables the monitoring account to query metrics from all linked accounts as if they were local.

- Shares `AWS::CloudWatch::Metric` resource type
- Includes a Custom Resource Lambda that creates the required Service-Linked Role (handles "already exists" gracefully)

### 3. Usage Checker Lambda (Monitoring Account)

This is the core alerting component. It replaces traditional CloudWatch Alarms because:
- CloudWatch Alarms cannot use a 30-day period (max 7 days)
- CloudWatch Alarms with SEARCH expressions are not supported
- Metrics Insights SQL in alarms is limited to 3 hours

The Lambda runs **every hour** via EventBridge and:

1. **Queries real cumulative usage** since the 1st of the month using Metrics Insights SQL:
   ```sql
   SELECT SUM(ConsumedInvestigationTime) FROM "AWS/AIDevOps"
   ```
   This aggregates across ALL dimensions (AgentSpaceUUID) and ALL linked accounts automatically.

2. **Publishes custom metrics** for the dashboard:
   - `DevOpsAgent/CreditUsage/MonthlyUsageTotal` (seconds)
   - `DevOpsAgent/CreditUsage/MonthlyUsagePercent` (%)

3. **Compares against thresholds** (warning at 75%, critical at 100% of monthly credit)

4. **Sends alert via SNS** if thresholds are exceeded, with:
   - Usage summary (current vs total credit)
   - Time context (day of month, days remaining)
   - Breakdown by metric type (Investigation, Evaluation, On-Demand)
   - Breakdown by source account
   - Direct link to CloudWatch Dashboard

### 4. CloudWatch Dashboard (Monitoring Account)

Provides visual monitoring with:
- **Monthly Usage Total**: Current cumulative seconds (from custom metric)
- **Credit Usage %**: Gauge showing percentage of credit consumed
- **Daily Usage Trend**: Stacked area chart per metric type with threshold annotations
- **Cumulative Monthly Usage**: Line chart with warning/critical/total credit lines
- **Per-Account Breakdown**: Usage per source account

### 5. Credit Calculator

Computes thresholds from billing parameters:

```
monthlyCredit     = enterpriseSupportMonthlyFee × creditPercentage / 100
totalAgentSeconds = floor(monthlyCredit / ratePerAgentSecond)
warningThreshold  = floor(totalAgentSeconds × warningPercent / 100)
criticalThreshold = floor(totalAgentSeconds × criticalPercent / 100)
```

**Example** (with $15,000/month fee, 75% credit, default rate):
- Monthly credit: $11,250
- Total agent seconds: 1,355,421 (~376 hours)
- Warning at 75%: 1,016,565 seconds (~282 hours)
- Critical at 100%: 1,355,421 seconds (~376 hours)

### 6. Config Validator

Validates all configuration at synthesis time with descriptive errors:
- Required fields presence
- Account ID format (12 numeric digits)
- Numeric ranges (percentages, positive values)
- Duplicate source account detection
- Applies defaults for optional fields

## Prerequisites

- Node.js 18+ and npm
- AWS CDK CLI: `npm install -g aws-cdk`
- AWS credentials configured for all target accounts
- Enterprise Support plan (for DevOps Agent credit allocation)

## Quick Start

### One-command setup

```bash
./setup.sh
```

This interactive script will:
1. Validate prerequisites (Node.js, AWS CLI, CDK)
2. Ask for your account IDs, billing params, and alert email
3. Show a credit calculation preview for confirmation
4. Generate `cdk.json`
5. Install dependencies
6. Deploy all stacks

After deployment, confirm the SNS subscription email and you're done.

### Manual setup (alternative)

If you prefer to configure manually:

### 1. Install dependencies

```bash
npm install
```

### 2. Configure your accounts

**Option A — Use the visual configurator:**

Open `configure.html` in your browser. Fill in the form, preview your credit thresholds, and download the generated `cdk.json`.

**Option B — Edit manually:**

Edit `cdk.json` context:

```json
{
  "context": {
    "monitoringAccount": {
      "accountId": "YOUR_MONITORING_ACCOUNT_ID",
      "region": "us-east-1"
    },
    "sourceAccounts": [
      { "accountId": "SOURCE_ACCOUNT_1", "region": "us-east-1" },
      { "accountId": "SOURCE_ACCOUNT_2", "region": "us-west-2" }
    ],
    "billing": {
      "enterpriseSupportMonthlyFee": 15000
    },
    "alerts": {
      "email": "your-verified-ses-email@example.com"
    }
  }
}
```

### 3. Bootstrap accounts

CDK requires each target account/region to be bootstrapped before deployment. The source accounts must **trust** the monitoring account (or your CI/CD account) so that CloudFormation can assume a role and deploy resources there.

#### Monitoring account (deploys locally — no trust needed):

```bash
cdk bootstrap aws://MONITORING_ACCOUNT/us-east-1
```

#### Source accounts (must trust the deploying account):

```bash
cdk bootstrap aws://SOURCE_ACCOUNT_1/us-east-1 --trust MONITORING_ACCOUNT
cdk bootstrap aws://SOURCE_ACCOUNT_2/us-east-1 --trust MONITORING_ACCOUNT
```

The `--trust` flag tells CDK to allow `MONITORING_ACCOUNT` to assume the `cdk-hnb659fds-deploy-role-*` and `cdk-hnb659fds-cfn-exec-role-*` roles in the source account.

> **Tip:** If you use a dedicated CI/CD account (e.g., for CodePipeline), use that account ID in `--trust` instead.

## Cross-Account Deployment — IAM Requirements

Deploying from a central account (monitoring or CI/CD) into source accounts requires specific IAM permissions. Here's what's needed at each level:

### What CDK Bootstrap Creates in Source Accounts

When you run `cdk bootstrap --trust MONITORING_ACCOUNT`, it creates:

| Role | Purpose |
|------|---------|
| `cdk-hnb659fds-deploy-role-ACCOUNT-REGION` | Assumed by the deploying account to initiate deployments |
| `cdk-hnb659fds-cfn-exec-role-ACCOUNT-REGION` | Used by CloudFormation to create/update/delete resources |
| `cdk-hnb659fds-file-publish-role-ACCOUNT-REGION` | Uploads Lambda code and assets to the staging bucket |
| `cdk-hnb659fds-image-publish-role-ACCOUNT-REGION` | Pushes Docker images (not used in this project) |

All these roles have a trust policy allowing `sts:AssumeRole` from the trusted account.

### Permissions Required by the Deploying Identity

The IAM user or role running `cdk deploy` in the **monitoring account** needs:

```json
{
  "Effect": "Allow",
  "Action": "sts:AssumeRole",
  "Resource": [
    "arn:aws:iam::SOURCE_ACCOUNT_1:role/cdk-hnb659fds-deploy-role-*",
    "arn:aws:iam::SOURCE_ACCOUNT_1:role/cdk-hnb659fds-file-publish-role-*",
    "arn:aws:iam::SOURCE_ACCOUNT_2:role/cdk-hnb659fds-deploy-role-*",
    "arn:aws:iam::SOURCE_ACCOUNT_2:role/cdk-hnb659fds-file-publish-role-*"
  ]
}
```

> **Shortcut for Organizations:** If all accounts are in the same AWS Organization, you can use a wildcard:
> ```json
> "Resource": "arn:aws:iam::*:role/cdk-hnb659fds-*"
> "Condition": { "StringEquals": { "aws:PrincipalOrgID": "o-xxxxxxxxxx" } }
> ```

### What the SourceStack Deploys (CloudFormation Execution Role Needs)

The `cfn-exec-role` in each source account must be able to create these resources:

| Resource | IAM Actions Required |
|----------|---------------------|
| OAM Link (`AWS::Oam::CfnLink`) | `oam:CreateLink`, `oam:DeleteLink`, `oam:GetLink` |
| Lambda Function (SLR creator) | `lambda:CreateFunction`, `lambda:DeleteFunction`, `lambda:InvokeFunction`, `lambda:GetFunction` |
| IAM Role (Lambda execution role) | `iam:CreateRole`, `iam:DeleteRole`, `iam:AttachRolePolicy`, `iam:PutRolePolicy`, `iam:PassRole` |
| Service-Linked Role | `iam:CreateServiceLinkedRole` |
| CloudFormation Custom Resource | `cloudformation:*` (managed by CDK) |

By default, the CDK bootstrap `cfn-exec-role` has **AdministratorAccess**. If you use a restricted execution policy, ensure the above actions are allowed.

### Restricted Bootstrap (Least-Privilege)

For organizations that don't allow `AdministratorAccess` on the CloudFormation execution role:

```bash
cdk bootstrap aws://SOURCE_ACCOUNT/us-east-1 \
  --trust MONITORING_ACCOUNT \
  --cloudformation-execution-policies "arn:aws:iam::SOURCE_ACCOUNT:policy/CDKSourceStackPolicy"
```

Create this policy in each source account first:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "OAM",
      "Effect": "Allow",
      "Action": ["oam:CreateLink", "oam:DeleteLink", "oam:GetLink", "oam:UpdateLink", "oam:TagResource"],
      "Resource": "*"
    },
    {
      "Sid": "Lambda",
      "Effect": "Allow",
      "Action": ["lambda:*"],
      "Resource": "arn:aws:lambda:*:*:function:DevOpsAgent-SourceAccount-*"
    },
    {
      "Sid": "IAM",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole", "iam:DeleteRole", "iam:GetRole", "iam:PassRole",
        "iam:AttachRolePolicy", "iam:DetachRolePolicy", "iam:PutRolePolicy",
        "iam:DeleteRolePolicy", "iam:GetRolePolicy",
        "iam:CreateServiceLinkedRole", "iam:TagRole"
      ],
      "Resource": [
        "arn:aws:iam::*:role/DevOpsAgent-SourceAccount-*",
        "arn:aws:iam::*:role/aws-service-role/cloudwatch-crossaccount.amazonaws.com/*"
      ]
    },
    {
      "Sid": "CloudFormation",
      "Effect": "Allow",
      "Action": ["cloudformation:*"],
      "Resource": "*"
    },
    {
      "Sid": "S3Assets",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::cdk-hnb659fds-assets-*"
    },
    {
      "Sid": "SSM",
      "Effect": "Allow",
      "Action": ["ssm:GetParameter"],
      "Resource": "*"
    }
  ]
}
```

### Deployment Patterns

#### Pattern 1: Direct Deploy from Monitoring Account (simplest)

```bash
# Assumes your CLI credentials can assume roles in source accounts
cdk deploy --all
```

CDK automatically assumes the cross-account roles. Your `~/.aws/config` doesn't need profiles for each source account.

#### Pattern 2: AWS Organizations + StackSets (at scale)

For 10+ source accounts, consider deploying the SourceStack via CloudFormation StackSets from the Organization management account. Export the template:

```bash
npx cdk synth DevOpsAgent-SourceAccount-PLACEHOLDER > source-stack-template.yaml
```

Then deploy via StackSets to all target OUs.

#### Pattern 3: CI/CD Pipeline (automated)

Enable the pipeline in `cdk.json`:

```json
{
  "context": {
    "pipeline": {
      "repositoryName": "devops-agent-monitoring",
      "branch": "main"
    }
  }
}
```

The pipeline account needs `--trust` from all target accounts. Deploy once with `cdk deploy DevOpsAgent-Pipeline`, then all future changes are automated via git push.

### Troubleshooting Cross-Account Deployment

| Error | Cause | Fix |
|-------|-------|-----|
| `Need to perform AWS calls for account X, but no credentials have been configured` | Source account not bootstrapped with `--trust` | Run `cdk bootstrap --trust` in the source account |
| `User is not authorized to perform: sts:AssumeRole` | Deploying identity lacks cross-account assume permissions | Add `sts:AssumeRole` for `cdk-hnb659fds-*` roles |
| `Resource handler returned message: "Service role not found"` | OAM service-linked role creation failed | Ensure `iam:CreateServiceLinkedRole` is allowed |
| `The sink does not exist` | Monitoring stack not deployed yet, or Sink ARN mismatch | Deploy DevOpsAgent-MonitorAccount first, then SourceStacks |

### 4. Deploy

```bash
cdk deploy --all
```

After deployment, check your email for the **SNS subscription confirmation** and click the link to activate alerts.

## Configuration Reference

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `monitoringAccount.accountId` | Yes | — | 12-digit AWS account ID for the central monitoring account |
| `monitoringAccount.region` | Yes | — | AWS region for the monitoring stack |
| `sourceAccounts` | Yes | — | Array of `{accountId, region}` objects (at least 1) |
| `billing.enterpriseSupportMonthlyFee` | Yes | — | Monthly Enterprise Support fee in USD |
| `billing.creditPercentage` | No | 75 | Percentage of support fee allocated as DevOps Agent credit (1-100) |
| `billing.ratePerAgentSecond` | No | 0.0083 | Cost per agent-second in USD |
| `alerts.email` | Yes | — | Email address subscribed to the SNS alert topic |
| `alerts.warningPercent` | No | 75 | Percentage of credit that triggers warning (1-99) |
| `alerts.criticalPercent` | No | 100 | Percentage of credit that triggers critical (1-100, >= warningPercent) |
| `alerts.enableForecastedAlarm` | No | false | Reserved for future use |
| `orgId` | No | — | AWS Organization ID for org-wide sink policy |
| `dashboardEnabled` | No | true | Enable/disable the CloudWatch Dashboard |
| `pipeline.repositoryName` | No | — | CodeCommit repo name (enables CI/CD pipeline mode) |
| `pipeline.branch` | No | main | Branch to trigger pipeline |

## How It Works

```
Every hour:
  Lambda wakes up
    → Queries CloudWatch: "What's the total ConsumedInvestigationTime + 
      ConsumedEvaluationTime + ConsumedOnDemandTime since the 1st of this month,
      across ALL accounts and ALL agent spaces?"
    → Publishes the result as a custom metric (for dashboard)
    → If total > criticalThreshold → publishes CRITICAL alert to SNS
    → If total > warningThreshold → publishes WARNING alert to SNS
    → Otherwise → does nothing
```

The key insight: **Metrics Insights SQL** (`SELECT SUM(...) FROM "AWS/AIDevOps"`) automatically aggregates across all dimensions and all linked accounts. No need to know agent space UUIDs or account IDs in advance.

## Project Structure

```
├── setup.sh                           # One-command setup (configure + bootstrap + deploy)
├── add-account.sh                     # Add a source account (access check + bootstrap + deploy)
├── configure.html                     # Visual config generator (open in browser)
├── bin/app.ts                         # CDK app entry point (direct or pipeline mode)
├── lib/
│   ├── types.ts                       # Shared TypeScript interfaces
│   ├── config-validator.ts            # Input validation + defaults
│   ├── credit-calculator.ts           # Threshold computation
│   ├── monitoring-stack.ts            # OAM Sink, Lambda, Dashboard, SNS
│   ├── source-stack.ts                # OAM Link + Service-Linked Role
│   ├── pipeline-stack.ts              # CodePipeline (optional)
│   ├── stages/
│   │   ├── monitoring-stage.ts        # Pipeline stage for monitoring
│   │   └── source-account-stage.ts    # Pipeline stage for source accounts
│   └── lambda/
│       └── usage-checker/
│           └── index.js               # Usage checker Lambda code
├── test/
│   ├── unit/                          # Jest unit tests
│   ├── property/                      # fast-check property-based tests
│   └── integration/                   # Full synthesis integration tests
├── cdk.json                           # CDK config + context
└── package.json
```

## Security (cdk-nag)

This project includes [cdk-nag](https://github.com/cdklabs/cdk-nag) with the AWS Solutions rule pack (in direct deploy mode). Suppressions are documented inline for legitimate patterns:
- Lambda IAM wildcard for `cloudwatch:GetMetricData` (metrics are dynamic)
- Service-Linked Role creation requires `Resource: *`

## CI/CD Pipeline (CodePipeline)

Optional self-mutating pipeline via CDK Pipelines + CodeCommit. Activate by adding `pipeline` to context:

```json
{
  "context": {
    "pipeline": {
      "repositoryName": "devops-agent-monitoring",
      "branch": "main"
    }
  }
}
```

Deploy once: `cdk deploy DevOpsAgent-Pipeline`. After that, every push to `main` triggers: Build → Test → Synth → Deploy DevOpsAgent-MonitorAccount → Deploy DevOpsAgent-SourceAccount stacks.

## Adding a New Source Account

### One-command (recommended)

```bash
./add-account.sh 333333333333 us-east-1
```

This script handles everything: access check → bootstrap → update `cdk.json` → deploy. The Lambda automatically picks up metrics from the new account on its next hourly run.

### Manual alternative

```bash
# 1. Bootstrap the source account
cdk bootstrap aws://333333333333/us-east-1 --trust MONITORING_ACCOUNT_ID

# 2. Add to cdk.json sourceAccounts array
# 3. Deploy
npx cdk deploy DevOpsAgent-SourceAccount-333333333333
```

## Commands

| Command | Description |
|---------|-------------|
| `./setup.sh` | Full interactive setup (configure + bootstrap + deploy) |
| `./add-account.sh ACCOUNT [REGION]` | Add a source account (access check + bootstrap + deploy) |
| `npm run build` | Compile TypeScript |
| `npm test` | Run all tests |
| `npx cdk synth` | Synthesize CloudFormation templates |
| `npx cdk deploy --all` | Deploy all stacks |
| `npx cdk diff` | Show pending changes |
| `npx cdk destroy --all` | Tear down all stacks |

## License

MIT — see [LICENSE](LICENSE)
