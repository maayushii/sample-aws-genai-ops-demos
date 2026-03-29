# 📚 crypto-invoice-cdk — Comprehensive Documentation

> **Serverless Digital Asset Payment Processing System on AWS**  
> Supporting EVM-compatible blockchains (ETH/ERC20) and Solana (SOL/SPL)

---

## 🎯 Quick Start by Role

### 👨‍💻 Developers
Start with the code reference and business logic:
- [API Reference](reference/api-reference.md) — All endpoints, request/response schemas
- [Data Models](reference/data-models.md) — DynamoDB schemas, status transitions
- [Business Logic](behavior/business-logic.md) — Invoice generation, payment detection, sweeping
- [Interfaces](reference/interfaces.md) — Handler signatures, event structures
- [Program Structure](reference/program-structure.md) — Module hierarchy, function index

### 🏗️ Architects
Start with architecture and analysis:
- [System Overview](architecture/system-overview.md) — High-level architecture with Mermaid diagrams
- [Architecture Patterns](architecture/patterns.md) — Event-driven, HD wallet, atomic counter patterns
- [Components](architecture/components.md) — AWS resource inventory and configuration
- [Dependencies](architecture/dependencies.md) — Dependency map and SDK analysis
- [Complexity Analysis](analysis/complexity-analysis.md) — Risk assessment per component

### 🔧 DevOps Engineers
Start with operations and deployment:
- [Deployment Guide](specialized/operations/deployment-guide.md) — CDK deploy, environment setup
- [Monitoring Guide](specialized/operations/monitoring-guide.md) — CloudWatch, SNS alerting
- [Troubleshooting Guide](specialized/operations/troubleshooting-guide.md) — Common issues and fixes
- [Migration Order](migration/component-order.md) — SDK migration sequence
- [AWS Service Configs](specialized/aws-services/lambda-config.md) — Lambda, DynamoDB, API Gateway

### 📊 Engineering Managers
Start with technical debt and metrics:
- [⚠️ Technical Debt Report](technical-debt-report.md) — **AWS Transformation Recommendation at top**
- [Code Metrics](analysis/code-metrics.md) — File metrics, complexity, duplication
- [Remediation Plan](technical-debt/remediation-plan.md) — Prioritized action items
- [Security Analysis](analysis/security-patterns.md) — Security posture assessment

---

## 📋 Complete Table of Contents

### 📖 Project Overview
- [Project Overview](project-overview.md) — Technology stack, file inventory, project metadata
- [Technical Debt Report](technical-debt-report.md) — Executive summary with AWS transformation recommendation

### 🏛️ Architecture (`architecture/`)
- [System Overview](architecture/system-overview.md) — High-level architecture, AWS service config, Mermaid diagrams
- [Components](architecture/components.md) — CDK stacks, Lambda functions, DynamoDB, API Gateway, secrets
- [Dependencies](architecture/dependencies.md) — Internal/external dependency map, SDK version analysis
- [Patterns](architecture/patterns.md) — Event-driven, HD wallet, atomic counter, state machine patterns

### 📘 Reference (`reference/`)
- [API Reference](reference/api-reference.md) — REST endpoints, request/response schemas, error codes
- [Interfaces](reference/interfaces.md) — Lambda handler signatures, event structures, service contracts
- [Data Models](reference/data-models.md) — DynamoDB schemas, status enums, BIP-44 paths, payment URIs
- [Program Structure](reference/program-structure.md) — Complete module hierarchy, function index

### ⚡ Behavior (`behavior/`)
- [Business Logic](behavior/business-logic.md) — Invoice generation, payment monitoring, fund sweeping, CRUD
- [Workflows](behavior/workflows.md) — Payment lifecycle, EVM/Solana-specific flows
- [Decision Logic](behavior/decision-logic.md) — Currency branching, gas buffering, status transitions
- [Error Handling](behavior/error-handling.md) — SNS notifications, retry config, exception patterns

### 📊 Diagrams (`diagrams/`)
- [System Context](diagrams/architecture/system-context.md) — System context and component relationship Mermaid diagrams
- [Deployment Topology](diagrams/structural/deployment-topology.md) — AWS deployment, module structure, ER diagrams
- [Payment Flows](diagrams/behavioral/payment-flow.md) — Sequence diagrams for invoice creation, detection, sweeping
- [Data Flow](diagrams/data-flow/service-data-flow.md) — AWS service data flow, secrets flow

### ⚠️ Technical Debt (`technical-debt/`)
- [Summary](technical-debt/summary.md) — All 16 debt items by severity
- [Outdated Components](technical-debt/outdated-components.md) — AWS SDK v2, library versions, dev tools
- [Security Vulnerabilities](technical-debt/security-vulnerabilities.md) — CORS, data trace, raw keys, WAF, auth
- [Maintenance Burden](technical-debt/maintenance-burden.md) — Code duplication, validation, hardcoded values
- [Remediation Plan](technical-debt/remediation-plan.md) — Prioritized action items with SDK migration details

### 📈 Analysis (`analysis/`)
- [Code Metrics](analysis/code-metrics.md) — Line counts, function counts, duplication analysis
- [Complexity Analysis](analysis/complexity-analysis.md) — Per-component complexity ranking
- [Dependency Analysis](analysis/dependency-analysis.md) — Complete dependency trees, version conflicts
- [Security Patterns](analysis/security-patterns.md) — Security controls, CDK Nag, CORS, KMS

### 🔄 Migration (`migration/`)
- [Component Order](migration/component-order.md) — Recommended SDK migration sequence
- [Test Specifications](migration/test-specifications.md) — Test scenarios per component
- [Validation Criteria](migration/validation-criteria.md) — Post-migration success criteria

### 🔧 Specialized (`specialized/`)

#### Blockchain Integration
- [EVM Integration](specialized/blockchain/evm-integration.md) — ethers.js v6, BIP-44, ERC20 ABI, gas estimation
- [Solana Integration](specialized/blockchain/solana-integration.md) — @solana/web3.js, ed25519, SPL tokens, KMS signing

#### AWS Services
- [DynamoDB Patterns](specialized/aws-services/dynamodb-patterns.md) — Table design, GSI, streams, conditions
- [API Gateway Config](specialized/aws-services/api-gateway-config.md) — REST API, usage plans, CORS
- [Lambda Config](specialized/aws-services/lambda-config.md) — NodejsFunction, event sources, concurrency
- [Secrets Manager](specialized/aws-services/secrets-manager.md) — Resource policies, secret structures
- [SNS Patterns](specialized/aws-services/sns-patterns.md) — Topic policies, notification templates
- [EventBridge](specialized/aws-services/eventbridge.md) — Watcher schedule configuration

#### Operations
- [Deployment Guide](specialized/operations/deployment-guide.md) — CDK deploy, environment setup, cleanup
- [Monitoring Guide](specialized/operations/monitoring-guide.md) — CloudWatch, metrics, alerting
- [Troubleshooting Guide](specialized/operations/troubleshooting-guide.md) — Common issues, debugging

---

## 📄 Document Count: 31 files across 11 directories
