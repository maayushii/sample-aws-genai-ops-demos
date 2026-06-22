# Bedrock Account Intelligence Dashboard

A TAM-ready dashboard for analyzing Amazon Bedrock usage, performance, cost, and quotas across customer accounts. Built for customer meetings, QBRs, and account team reviews.

## What It Does

### BQM-equivalent features
- **Quota Monitoring** — All Bedrock service quotas with adjustability status
- **Cost Intelligence** — Daily cost breakdown, cost by usage type, 30-day trends
- **Model Catalog** — All foundation models with access/enablement status
- **Provisioned Throughput** — Active provisioned throughput configurations
- **Token Tracking** — Input/output token counts over time

### Beyond BQM
- **Invocation Analytics** — Invocation trends, latency (avg), error rates, throttle rates with interactive charts
- **Throttle Detection** — Real-time throttle rate calculation with visual alerts
- **Custom Models** — Fine-tuned model inventory
- **Guardrails** — Bedrock guardrails configuration overview
- **Recommendations Engine** — Auto-generated optimization suggestions based on usage patterns:
  - Throttling alerts with remediation steps
  - High error rate detection
  - Provisioned throughput recommendations for high-usage accounts
  - Legacy model migration warnings
  - Cost spike detection (WoW comparison)
- **QBR Export** — One-click JSON export of summary + recommendations for decks
- **Interactive Charts** — Plotly-powered charts (invocations, latency, throttles, tokens, cost)
- **Multi-Region** — Scan any Bedrock-supported region
- **Profile Support** — Works with Isengard credentials via AWS profiles

## Quick Start

```bash
cd AWS-GenAI-Operations-Demos/bedrock-account-intelligence
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Set up credentials for the customer account
isengard credentials <account-id> --role ReadOnly

# Start the dashboard
python app.py
```

Then open: **http://localhost:5003**

## Usage

1. Get Isengard credentials for the customer account
2. Open http://localhost:5003
3. Enter the AWS profile name (or leave blank for default)
4. Select region and lookback period
5. Click "Scan Account"
6. Review dashboard — share screen in meetings or use "Export for QBR"

## Port

Runs on **port 5003** (BQM uses 5002, so they can run side by side).

## Author

Aayushi Mittal (maayushi) — Principal TAM
