# GenAI Ops Demo Library - Contribution Context

## Project Overview
- **Product**: AWS GenAI Operations Demos Library
- **GitHub**: https://github.com/aws-samples/sample-aws-genai-ops-demos
- **Website**: https://aws-samples.github.io/sample-aws-genai-ops-demos/
- **Pathfinder**: https://pathfinder.es.aws.dev/opportunity/opportunity-39IYhxbrz25who3uPChtNx8VecA
- **Product Owners**: Benjamin Lecoq, Othman Lahoui
- **Portfolio**: ES → ES Engagements (ESE) → Delivery & Tooling
- **Status**: In Development (Launched January 1, 2026)
- **Tags**: GenAI, Tech First, TAM

## Product Description
Collection of ready-to-present demonstrations designed to help TAMs showcase generative AI applications in operations during customer engagements. Provides polished, easy-to-deliver demos (15-30 minutes) with accompanying code samples focused on operational use cases such as AWS service lifecycle management, incident analysis, and AI-assisted DevOps standardization.

## Key Technologies
- Amazon Bedrock
- Amazon Nova models
- QuickSuite
- AgentCore
- Model Context Protocol (MCP) servers
- AWS FIS
- Amazon DevOps Agent
- Kiro

## My Contribution (Maayushi)

### Role
- Created all 9 Storylane interactive demos
- End-to-end testing of demos
- Bug filing and improvement recommendations
- Collaborated with APSEC (Asia Pacific Security) team
- Presented at Paris Summit and multiple Growth Days (NAMER, APAC, EMEA)

### 9 Storylane Demos Created

| # | Demo Name | Total Views | Engaged | Performance | CTA Clicked | Time Spent |
|---|-----------|-------------|---------|-------------|-------------|------------|
| 1 | Intelligent EKS Incident Investigation with Amazon DevOps Agent & Skills Demo | 161 | 110 (68%) | Medium | 16 (14%) | 06:13:09 |
| 2 | AI Lambda Runtime Migration Assistant | 132 | 83 (62%) | Medium | 16 (19%) | 05:34:37 |
| 3 | AWS GenAI Cost Optimization Kiro Power | 120 | 89 (74%) | High | 6 (6%) | 02:52:52 |
| 4 | Intelligent EKS Incident Investigation with Amazon DevOps Agent | 97 | 61 (62%) | High | 9 (14%) | 02:39:09 |
| 5 | AI-Powered Graviton Migration Assessment | 75 | 55 (73%) | Medium | 6 (10%) | 00:33:46 |
| 6 | AI-Powered Documentation Generation | 59 | 33 (55%) | High | 3 (9%) | 01:00:23 |
| 7 | AWS Services Lifecycle Tracker | 56 | 37 (66%) | High | 9 (24%) | 01:16:27 |
| 8 | AI-Powered Legacy System Automation | 40 | 32 (80%) | Medium | 4 (12%) | 01:42:18 |
| 9 | Natural Language Chaos Engineering with AWS FIS | 26 | 17 (65%) | High | 1 (5%) | 00:53:29 |
| 10 | Password Reset Assistant | 23 | 12 (52%) | High | 1 (8%) | - |

### Aggregate Analytics (as of May 2026)
- **Total Demo Views**: 529
- **Engagement Rate**: 72%
- **CTA Clicks**: 71
- **Total Time Saved**: 22 hours 51 minutes
- **Peak Engagement Period**: April 19-21, 2026 (coinciding with Growth Days)

### Presentations & Events
- **Paris Summit** — Primary presentation of all demos
- **NAMER Growth Day** — Presented demos and received TAM traction
- **APAC Growth Day** — Presented demos and received TAM traction
- **EMEA Growth Day** — Presented demos and received TAM traction

### Cross-Team Collaboration
- **Product Team (Benjamin Lecoq, Othman Lahoui)**: Worked closely on demo quality, bug fixes, and improvements
- **Global TAM Community**: Received traction from TAMs across all regions wanting to use demos with their customers
- Filed bugs via Slack channel
- Worked on getting the approval process for demo publication

### Impact
- Enabled TAMs globally to have ready-to-show GenAI demos for customer engagements
- Bridged the gap between GenAI conversations (typically SA-led) and operational teams (DevOps, CCoE, SREs)
- Demos designed for regular TAM-customer cadence calls (weekly/monthly) without requiring deep AI expertise
- Multiple TAMs across NAMER, APAC, and EMEA adopted demos for their customer engagements

## SIFT Entry Category
- **Type**: Business Contribution
- **Area**: Enablement / Field Readiness / GenAI Adoption

## Demos In Progress

### 10. AI-Powered Security Posture with Prowler + DevOps Agent
- **Storylane published**: https://amazon.storylane.io/share/lxqexdsy2lyi
- **Dashboard**: https://d37q34s287pq9g.cloudfront.net
- **Login**: demo@prowler-security.local / ProwlerDemo2026!
- **GitHub**: https://github.com/aws-samples/sample-aws-genai-ops-demos/tree/main/security/prowler-security-findings-agent
- **Product Owner**: Benjamin Lecoq, Alberto Jimenez (@healbert)
- **Status**: Storylane completed, shipped for Madrid Summit June 4th

### 11. Intelligent AWS Site-to-Site VPN Tunnel Investigation with DevOps Agent
- **GitHub**: https://github.com/aws-samples/sample-aws-genai-ops-demos/tree/main/observability/aws-site-to-site-vpn-tunnel-investigation-devops-agent
- **Author**: Rahul Arya (@ryarah)
- **Deployed in account**: 746417228652 (us-east-1)
- **Agent Space ID**: 3b41b7c4-0265-4d24-bde2-1da43b83cf66
- **Operator App**: https://3b41b7c4-0265-4d24-bde2-1da43b83cf66.aidevops.global.app.aws/home
- **VPN Connection**: vpn-01262c59f1b88127a
- **CGW SSH**: ssh -i ~/.ssh/vpn-demo-key.pem ec2-user@13.219.113.96
- **Webhook URL**: https://event-ai.us-east-1.api.aws/webhook/generic/e8526c28-2418-4214-a1bf-13180ff34bfe
- **MCP Endpoint**: https://6c3z3473ah.execute-api.us-east-1.amazonaws.com/prod/mcp
- **MCP API Key**: UZuRVYiFnz6w5QixbtmQafaHkKeYeyTaFnf2BHv6
- **Status**: Deployed, MCP registered, Storylane in progress (next week)
