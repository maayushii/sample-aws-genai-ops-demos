# Storylane Script: Intelligent Site-to-Site VPN Tunnel Investigation with Amazon DevOps Agent

## Demo Overview
- **Total slides**: 12-13
- **Duration**: ~15-20 minutes self-guided
- **Scenario used**: psk-mismatch (Pre-shared key mismatch)
- **Flow**: Problem → Automated Detection → Agent Investigation → Business Context → Resolution

---

## Slide 1: Title / Hook
**Screen**: Custom intro slide or architecture diagram
**Script**: "Your VPN tunnel goes down at 2 AM. Instead of your on-call engineer spending 45 minutes digging through logs — Amazon DevOps Agent investigates automatically, identifies the root cause, and tells you the business impact in minutes."
**Callout**: "10 real-world failure scenarios | Automated root-cause analysis | Business context enrichment via MCP"

---

## Slide 2: Architecture Overview
**Screen**: Architecture diagram from the repo (`architecture.drawio.png`)
**Script**: "This demo deploys a fully self-contained VPN environment — two VPCs connected via Site-to-Site VPN with two IPsec tunnels. CloudWatch alarms monitor each tunnel individually. When an alarm fires, a Lambda webhook notifies DevOps Agent, which investigates using VPN logs, CloudWatch metrics, and an MCP server for business context."
**Callout**: Highlight the flow: CloudWatch Alarm → SNS → Lambda → DevOps Agent → MCP Server

---

## Slide 3: VPN Tunnels Healthy (Before)
**Screen**: AWS VPN Console — Site-to-Site VPN Connections → Tunnel details tab
**Script**: "Both tunnels are UP and healthy. BGP sessions are established. This is the steady state."
**Callout**: Point to both tunnels showing "UP" status in green

---

## Slide 4: CloudWatch Alarms — All OK (Before)
**Screen**: CloudWatch Console → Alarms → filter "vpn-demo"
**Script**: "Four CloudWatch alarms monitor this VPN — two per-tunnel state alarms, one throughput alarm, and one route-withdrawal alarm. All currently in OK state."
**Callout**: Highlight the 4 alarms all showing green/OK

---

## Slide 5: Inject Failure — PSK Mismatch
**Screen**: Terminal showing the inject command
**Script**: "A common real-world scenario: someone rotates the pre-shared key on the customer gateway but forgets to update the AWS side. We simulate this with one command."
**Callout**: Highlight the command: `bash scripts/inject-failure.sh psk-mismatch --key-file ~/.ssh/vpn-demo-key.pem`
**Also show**: The output showing `AUTHENTICATION_FAILED` — confirms the injection worked

---

## Slide 6: CloudWatch Alarm Fires
**Screen**: CloudWatch Console → Alarms → `vpn-demo-tunnel1-down` in ALARM state (red)
**Script**: "Within 60 seconds, the per-tunnel CloudWatch alarm detects the tunnel is down and transitions to ALARM state. This triggers an SNS notification → Lambda → webhook to DevOps Agent."
**Callout**: Point to the red ALARM state and the timestamp

---

## Slide 7: DevOps Agent — Investigation Received
**Screen**: Operator App → Investigation list showing new investigation
**Script**: "DevOps Agent receives the webhook and automatically opens an investigation. No human triggered this — the agent woke up on its own."
**Callout**: Point to the new investigation title and timestamp

---

## Slide 8: DevOps Agent — Reading VPN Logs
**Screen**: Operator App → Inside the investigation → Agent's investigation steps
**Script**: "The agent starts by reading the VPN tunnel logs from CloudWatch. It finds 'IKE SA authentication request rejected by peer: AUTHENTICATION_FAILED' — the exact error that tells us the pre-shared keys don't match."
**Callout**: Highlight the log line the agent found

---

## Slide 9: DevOps Agent — MCP Server Query (Service Dependencies)
**Screen**: Operator App → Agent calling `get_service_dependencies`
**Script**: "The agent queries the MCP server for business context. It discovers that payment-gateway (CRITICAL), order-api (CRITICAL), and inventory-sync (HIGH) all depend on this VPN. Approximately 12,000 active user sessions are affected."
**Callout**: Highlight the dependent services and criticality levels

---

## Slide 10: DevOps Agent — MCP Server Query (Cost & Compliance)
**Screen**: Operator App → Agent calling `get_cost_impact` and `get_compliance_status`
**Script**: "The agent calculates financial impact: $4,200 per minute in revenue loss, 847 transactions per minute affected. It also flags that PCI-DSS requires incident reporting within 15 minutes and SOC 2 Type II within 60 minutes."
**Callout**: Highlight "$4,200/min" and "PCI-DSS: 15 min reporting threshold"

---

## Slide 11: DevOps Agent — Final Incident Report
**Screen**: Operator App → Agent's summary/conclusion
**Script**: "The agent produces a complete incident report: root cause is a pre-shared key mismatch on the customer gateway, with quantified business impact and compliance deadlines. This is what your on-call engineer sees — actionable intelligence, not raw logs."
**Callout**: Highlight root cause + recommended action

---

## Slide 12: On-Demand Chat — Follow-up Question
**Screen**: Operator App → Chat panel (left sidebar)
**Script**: "The agent isn't just a one-shot report. Your engineer can ask follow-up questions: 'What are the remediation steps?' The agent responds with specific actions to resolve the issue."
**Prompt to type**: "What are the exact steps to fix this PSK mismatch?"
**Callout**: Highlight the agent's remediation steps

---

## Slide 13: CTA — Try It Yourself
**Screen**: Custom closing slide
**Script**: "This is one of 10 failure scenarios available in this demo — including BGP failures, throughput degradation, and route withdrawals. Deploy it in your account and show your customers how DevOps Agent turns 2 AM incidents into automated investigations."
**Links to show**:
- GitHub: https://github.com/aws-samples/sample-aws-genai-ops-demos
- Demo Site: https://aws-samples.github.io/sample-aws-genai-ops-demos/
**Callout**: "10 scenarios | 25 min setup | ~$0.12/hr | Full cleanup script included"

---

## Capture Tips
- Use a clean browser (no extra tabs visible)
- Dark mode OFF in AWS console for better Storylane readability
- Crop terminal screenshots to show only the relevant output
- For the Operator App, wait until the agent finishes each step before capturing
- If the agent's output is long, capture the most impactful section (root cause + business impact)

## Timing Notes
- After injecting failure: wait ~60s for alarm to fire
- After alarm fires: wait ~1-3 min for agent to start investigating
- Agent investigation: takes 2-5 min to complete fully (including MCP queries)
- Total capture time: ~15-20 min for all screenshots
