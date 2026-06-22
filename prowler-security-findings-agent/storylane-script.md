# Storylane Script: AI-Assisted Security Triage — Prowler + Bedrock + DevOps Agent (FINAL)

## Demo Overview
- **Total slides**: ~14
- **Duration**: ~15 minutes self-guided
- **Dashboard URL**: https://d37q34s287pq9g.cloudfront.net
- **Login**: demo@prowler-security.local / ProwlerDemo2026!
- **Flow**: Intro → Dashboard → Findings → AI Playbook → DevOps Agent → Compliance → Cost → CTA
- **Storylane published**: https://amazon.storylane.io/share/lxqexdsy2lyi

---

## Slide 1: Intro / Hook
**Screen**: GitHub repo page
**Script**: "Most security tools stop at giving you a list of findings and leave your team to figure out what to do next. This demo closes that loop. Prowler continuously scans your AWS environment, Amazon Bedrock generates step-by-step remediation playbooks for every finding, and Amazon DevOps Agent automatically investigates the critical ones."

---

## Slide 2: Dashboard Overview
**Screen**: Dashboard home page (after login)
**Script**: "This is the main dashboard showing your security posture at a glance. You can see severity distribution, compliance scores, a service heatmap showing where failures are concentrated, active scans, and scan history. Everything your team needs to understand the state of your environment in one view."

---

## Slide 3: Run a Scan
**Screen**: Dashboard page — "Run scan now" button
**Script**: "From here you can trigger a full account scan with one click. Prowler checks hundreds of security controls across all your AWS services and surfaces what needs attention."

---

## Slide 4: Triage Shortcuts and Top Priority Findings
**Screen**: Dashboard section showing triage shortcuts and top priority findings
**Script**: "The dashboard surfaces your top priority findings right away so you know where to start. Triage shortcuts let you jump directly to the most critical issues without scrolling through hundreds of entries."

---

## Slide 5: Service Heatmap
**Screen**: Dashboard section showing findings by service and service heatmap
**Script**: "Here are the top 10 AWS services with the most failing findings. The service heatmap gives you a visual breakdown of where your security gaps are clustering so your team knows which areas to prioritize first."

---

## Slide 6: Active Scans and Scan History
**Screen**: Dashboard section showing active scans and scan history
**Script**: "Track every scan that has run against your account. See which scans are currently active, when the last scan completed, and how your findings have changed over time. This gives your team a clear audit trail of when your environment was assessed."

---

## Slide 7: Findings List
**Screen**: Findings page — table with severity badges and filters
**Script**: "Now let us explore the findings in detail. Here are all the findings from the scan. Each one is categorized by severity and status, showing exactly which service and resource is affected. You can filter by severity, service, or compliance framework to zero in on what matters most. Select multiple findings to take bulk actions — generate AI insights for a group at once or dispatch them all to DevOps Agent."

---

## Slide 8: Bulk Actions Dropdown
**Screen**: Findings page — one finding selected, Bulk actions dropdown open
**Script**: "Select any finding and the bulk actions menu gives you two options — investigate it directly with DevOps Agent or generate AI insights to get a remediation playbook. You can select multiple findings and do this at scale for an entire group."

---

## Slide 9: Finding Detail — Overview and Tabs
**Screen**: Finding Detail page — Overview tab visible with all tabs shown
**Script**: "When you click into a finding, you get the complete picture. The Overview shows the affected resource, compliance mappings, risk explanation, and Prowler's remediation guidance. The AI Generated Insights tab is where Bedrock writes you a step-by-step playbook with exact commands to fix it. And Raw OCSF gives you the full finding data in its original format. Let us explore the DevOps Agent Investigation next."

---

## Slide 10: DevOps Agent Investigation
**Screen**: Finding Detail — DevOps Agent Investigation tab
**Script**: "The DevOps Agent Investigation tab shows the full reasoning trace — how the agent validated the finding, checked the resource state, and what remediation it recommended. Your team gets a complete investigation record without doing the work manually."

---

## Slide 11: Investigations Page and Skills
**Screen**: Investigations page — table of investigations + seeded Skills section
**Script**: "Every finding dispatched to DevOps Agent is tracked here with a complete investigation trail. The demo also includes pre-built DevOps Agent Skills that you or your team can use to enhance the agent's capabilities. AWS Security Remediator and Compliance Framework Translator are ready to copy and paste directly into your agent setup. These teach the agent how to reason about security findings and compliance requirements specific to your environment."

---

## Slide 12: Compliance View
**Screen**: Compliance page — framework cards with pass/fail rates
**Script**: "Next we have the Compliance page which maps your findings to industry frameworks — HIPAA, CIS Benchmarks, PCI-DSS, NIST 800-53 and more. See at a glance how your account measures up against each framework. Click any framework to drill into the specific findings that are failing."

---

## Slide 13: HIPAA Drill-Down
**Screen**: Findings page filtered by HIPAA
**Script**: "Let us explore HIPAA as an example. These are all the findings tied to HIPAA. You can see which controls are passing and which need attention. The same workflow applies here — generate AI remediation or dispatch to DevOps Agent, now scoped to what your compliance team needs."

---

## Slide 14: Cost and GenAI Telemetry
**Screen**: Cost & GenAI telemetry page — cost cards, chart, breakdown, events table
**Script**: "Next is the Cost and GenAI telemetry page. Full transparency on what the automation costs. You can see the cumulative cost over time, a breakdown by capability, and every individual cost event logged with its token usage and model details. Every action is logged as a cost event with a timestamp, type, cost, token usage, model used, and which finding it was for."

---

## Slide 15: CTA — Try It
**Screen**: GitHub repo page or architecture diagram
**Script**: "From scan to AI-generated fix to automated investigation, that is everything in action. Deploy it in your AWS account and see how AI transforms the way your team handles security findings. Try it yourself, links below."
**Links**:
- GitHub: https://github.com/aws-samples/sample-aws-genai-ops-demos/tree/main/security/prowler-security-findings-agent
- Demo Site: https://aws-samples.github.io/sample-aws-genai-ops-demos/
- Button: "Explore More Demos"

---

## Capture Order
1. GitHub page → Slide 1
2. Log in → Dashboard → Slides 2, 3, 4, 5, 6
3. Navigate to Findings → Slides 7, 8
4. Click a CRITICAL FAIL finding → Slide 9
5. DevOps Agent Investigation tab → Slide 10
6. Navigate to Investigations → Slide 11
7. Navigate to Compliance → Slide 12
8. Click HIPAA → Slide 13
9. Navigate to Cost & GenAI telemetry → Slide 14
10. GitHub/closing → Slide 15
