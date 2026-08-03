# IAM Security Assistant

*Help teams identify and remediate overly-permissive IAM roles through natural language conversation using Amazon Bedrock Converse API with tool-calling.*

## Overview

As AWS accounts grow, IAM roles accumulate — created for projects long finished, granted broad permissions "just to get it working," or inherited from teams that moved on. Security Hub and IAM Access Analyzer flag these roles as findings, but translating findings into safe, tested policy changes still requires manual analysis.

This assistant automates that analysis. It's a **read-only** conversational tool — it queries your security findings, analyzes role usage, generates recommended policies, and assesses blast radius, but **never modifies IAM roles, policies, or configurations**.

**The core question it answers:** "What should I fix first, and how do I fix it safely?"

## Interactive Demo

Experience this demo in an interactive click-through walkthrough:

▶️ [Launch Interactive Demo](https://amazon.storylane.io/share/TBD)

## At a Glance

- **Duration**: ~15 min deployment + immediate demo
- **Difficulty**: Beginner
- **Target Audience**: Security Engineers, Cloud Admins, TAMs/SAs demoing IAM remediation workflows
- **Key Technologies**: React + Cloudscape, Amazon Bedrock Converse API (Claude Sonnet, toolConfig), Python 3.12, AWS CDK
- **Estimated Cost**: ~$0.05-0.15 per session

## Business Value

- **Speed**: Reduces IAM finding triage from 30+ min/role to under 2 minutes of conversation
- **Safety**: Read-only analysis with blast radius checks — know what breaks before you touch anything
- **Adoption**: Guided mode lowers the barrier for teams intimidated by IAM complexity
- **Actionable**: Generates ready-to-apply policies, not just findings — export to S3 with one command

## What You Get

- A web-based chat interface for querying IAM security posture
- Automated least-privilege policy generation from CloudTrail analysis
- Blast radius analysis to understand impact before modifying or deleting IAM resources
- Policy validation against AWS best practices and IAM Access Analyzer
- Exportable policy documents in JSON, CDK (Python/TypeScript), and CloudFormation formats

## How It Works

1. **User asks** a question in the chat interface (e.g., "What are my critical IAM findings?")
2. **Request routes** through CloudFront → API Gateway → Conversation Lambda
3. **Lambda calls** Amazon Bedrock Converse API with the user's message and tool definitions
4. **Bedrock decides** which tools to invoke (findings, policy generation, blast radius analysis, validation)
5. **Tool Lambdas** query Security Hub, CloudTrail, and IAM APIs
6. **Bedrock synthesizes** tool results into a natural language response
7. **Response displayed** in the chat interface with formatted policies and findings

## Architecture

```
User → CloudFront → S3 (React + Cloudscape)
                  → API Gateway → Conversation Lambda → Bedrock Converse (Claude)
                                                      → Tool Lambdas:
                                                        • list_findings → Security Hub
                                                        • generate_policy → CloudTrail
                                                        • check_dependencies → IAM
                                                        • validate_policy → Access Analyzer
```

For detailed architecture documentation, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Prerequisites

- Security Hub enabled with IAM Access Analyzer integration
- IAM Access Analyzer — at least one active analyzer
- CloudTrail — logging enabled
- Amazon Bedrock — model access enabled for Claude (Anthropic)
- AWS CLI v2.31.13+
- Node.js 20+
- Python 3.10+

## Quick Start

**Linux/macOS:**
```bash
cd security/ai-iam-access-analyzer-assistant
chmod +x deploy-all.sh
./deploy-all.sh
```

**Windows (PowerShell):**
```powershell
cd security\ai-iam-access-analyzer-assistant
.\deploy-all.ps1
```

## Cost

| Resource | Monthly (Low) | Monthly (Active) |
|---|---|---|
| Lambda (5 functions) | $1-3 | $5-15 |
| API Gateway | $1-2 | $3-5 |
| CloudFront + S3 | $1.50 | $3-7 |
| Cognito (< 50k MAU free) | $0 | $0 |
| Bedrock (Claude) | $2-5 | $10-30 |
| **Total** | **~$6-12** | **~$21-57** |

## Cleanup

```bash
cd infrastructure/cdk
source .venv/bin/activate
npx cdk destroy "IamAnalyzerAssistantStack-$(aws configure get region)"
```

## Contributing

We welcome community contributions! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## Security

See [CONTRIBUTING](../../CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the [LICENSE](../../LICENSE) file.
