# Storylane Script: Operations Automation with AI Browser Agents

## Demo Title
**Automating Legacy IT Operations with Amazon Nova Act & AgentCore Browser Tool**

---

## Scene 1: The Problem
**Title:** Legacy Systems Without APIs Create Operational Bottlenecks

**Narration:**
"Many enterprises run critical IT operations on legacy web portals that have no APIs — just browser interfaces. When HR needs to onboard a new employee, someone has to manually log into three different portals: ITSM for ticketing, Inventory for stock checks, and Procurement for ordering. For a single employee with 5 equipment items, this takes 45-60 minutes of repetitive clicking. Let's fix that with AI."

**Visual:** Show the three legacy portal tabs side by side (ITSM, Inventory, Procurement) — all browser-only, no API endpoints.

---

## Scene 2: The Architecture
**Title:** AI-Powered Browser Automation on AWS

**Narration:**
"Our solution uses Amazon Nova Act as the AI brain and AgentCore Browser Tool as the hands. A mail-polling service watches Outlook for trigger emails. When it detects a new employee equipment request, it kicks off an orchestrator that drives a cloud browser through every portal — creating tickets, checking stock, placing orders, and sending notifications. All browser actions are defined in a single JSON file — no hardcoded clicks."

**Visual:** Architecture diagram showing: Outlook → Mail Polling → Nova Act → AgentCore Browser → Legacy Portals (ITSM, Inventory, Procurement) → SES notification. S3 for recordings.

---

## Scene 3: Deploy the Demo Portal
**Title:** One-Command Deployment of Legacy IT Portals

**Narration:**
"First, we deploy three simulated legacy portals using CDK. One command sets up CloudFront, DynamoDB, Lambda, and API Gateway — and populates sample data."

**Visual:** Terminal showing:
```bash
cd operations-automation/anycompany-it-demo-portal
./deploy-all.sh --populate-data
```
Then the CloudFront domain output. Quick flash of each portal in a browser (ITSM, Inventory, Procurement).

---

## Scene 4: Deploy Browser Automation
**Title:** Setting Up the AI Browser Agent

**Narration:**
"Next, we deploy the browser automation infrastructure — this creates the AgentCore Browser Tool instance, an S3 bucket for session recordings, and the supporting resources."

**Visual:** Terminal showing:
```bash
cd operations-automation/ai-legacy-system-browser-automation
./deploy-all.sh
```
Browser ID output highlighted.

---

## Scene 5: The Trigger Email
**Title:** HR Sends an Equipment Request

**Narration:**
"The workflow starts when HR sends an email. The subject line contains 'NEW EMPLOYEE ORDER' and the body lists the new hire's details and requested equipment — a laptop, mouse and keyboard, headset, phone, and software license."

**Visual:** Outlook compose window with:
- Subject: `NEW EMPLOYEE ORDER - John Doe - CISO Equipment Setup`
- Body showing employee details and 5 equipment items
- Click Send

---

## Scene 6: Email Detection & Parsing
**Title:** AI Detects and Understands the Request

**Narration:**
"The mail-polling service picks up the email within 30 seconds. The parser extracts structured data — employee name, position, department, start date, and each equipment item with auto-categorized types. This becomes the input for the browser automation."

**Visual:** Terminal logs showing email detected, parsed output with employee details and equipment list as structured JSON.

---

## Scene 7: ITSM Ticket Creation
**Title:** AI Creates a Service Ticket

**Narration:**
"The AI opens the ITSM portal in a cloud browser and creates a ticket. Watch it fill in the title, description, category, and priority — then capture the generated ticket ID. This is Nova Act reading the UI and acting on natural language instructions, not scripted selectors."

**Visual:** Live browser view showing the AI navigating to ITSM portal → clicking Create Ticket → filling form fields → submitting → ticket ID `INC-370237` captured.

---

## Scene 8: Inventory Check
**Title:** Checking Stock Levels Across Items

**Narration:**
"For each equipment item, the AI navigates to the Inventory portal and searches for the item. It reads the current stock level to decide whether procurement is needed. If stock is zero, it triggers the full procurement cycle."

**Visual:** Browser showing Inventory portal → search for "Professional Laptop 16" → stock level displayed → AI reads "0 in stock" → flags for procurement.

---

## Scene 9: Procurement Cycle
**Title:** Full Purchase Order Lifecycle — Automated

**Narration:**
"For out-of-stock items, the AI runs the complete procurement workflow: create a purchase order with the right vendor and pricing, submit it, approve it, receive the delivery, then go back to Inventory to add the new stock. All from natural language instructions in a JSON config."

**Visual:** Browser showing Procurement portal → Create PO (vendor: TechCorp Solutions, qty: 10, price: $2,499) → Submit → Approve → Receive Delivery. Then Inventory portal → Add Item with 10 units.

---

## Scene 10: Equipment Allocation
**Title:** Allocating Equipment to the Employee

**Narration:**
"With stock available, the AI allocates one unit of each item to John Doe. It searches for the item in Inventory, selects it, and assigns it — decrementing the stock count automatically."

**Visual:** Inventory portal → search item → select → Allocate to "John Doe" → stock decremented by 1.

---

## Scene 11: Ticket Resolution & Notification
**Title:** Closing the Loop

**Narration:**
"After all 5 items are allocated, the AI returns to the ITSM portal and resolves the ticket. Then it sends an email notification via Amazon SES to the original requester — confirming all equipment has been provisioned with the ticket ID for reference."

**Visual:** ITSM portal → ticket status changed to Resolved. Then email notification preview showing completion summary.

---

## Scene 12: Monitoring & Recordings
**Title:** Full Observability of Every AI Action

**Narration:**
"Every browser session is recorded to S3. You can watch the AI work in real-time through the AgentCore console, review workflow steps in Nova Act, or replay session recordings later. Complete audit trail for compliance."

**Visual:** AWS Console showing:
1. AgentCore → Live browser session view
2. Nova Act → Workflow run with step-by-step data
3. S3 bucket with session recordings

---

## Scene 13: The JSON-Driven Approach
**Title:** No Code Changes — Just Edit JSON

**Narration:**
"Here's what makes this extensible: every browser action is defined in a single JSON file. To adapt this to a different portal or workflow, you edit the JSON instructions — not Python code. Each step is a natural language instruction with variable placeholders that get resolved at runtime."

**Visual:** Code editor showing `new_employee_onboarding_actions.json` with a workflow step highlighted:
```json
{
  "act_id": 2,
  "name": "fill_ticket_form",
  "instruction": "Fill out the form with Title: {{title}}, Category: {{category}}...",
  "description": "Fill all form fields"
}
```

---

## Scene 14: Results Summary
**Title:** From 60 Minutes of Manual Work to Zero Human Intervention

**Narration:**
"What used to take an IT operator 45-60 minutes of manual portal navigation now runs autonomously. The AI processed 5 equipment items across 3 legacy portals — creating tickets, checking inventory, running procurement, allocating equipment, and notifying stakeholders. All triggered by a single email. And it works with any web application, no API integration required."

**Visual:** Summary card:
- ⏱️ ~90 Nova Act actions executed
- 📋 1 ITSM ticket created and resolved
- 📦 5 equipment items checked, procured, and allocated
- 📧 1 notification email sent
- 💰 ~$0.50-2.00 per workflow execution
- 🔄 Zero code changes needed to adapt to new portals

---

## Scene 15: Call to Action
**Title:** Get Started

**Narration:**
"This demo is open source. Clone the repo, deploy with two commands, and start automating your legacy IT operations with AI browser agents."

**Visual:**
```
GitHub: aws-samples/sample-aws-ai-powered-demos
Path:   operations-automation/ai-legacy-system-browser-automation/

Key Technologies:
  • Amazon Nova Act — AI browser control
  • AgentCore Browser Tool — Cloud browser execution
  • AWS CDK — Infrastructure as code
  • Amazon SES — Email notifications
```

---

## Timing Guide
| Scene | Duration | Cumulative |
|-------|----------|------------|
| 1 - The Problem | 20s | 0:20 |
| 2 - Architecture | 25s | 0:45 |
| 3 - Deploy Portal | 15s | 1:00 |
| 4 - Deploy Automation | 15s | 1:15 |
| 5 - Trigger Email | 15s | 1:30 |
| 6 - Email Parsing | 15s | 1:45 |
| 7 - ITSM Ticket | 20s | 2:05 |
| 8 - Inventory Check | 15s | 2:20 |
| 9 - Procurement | 25s | 2:45 |
| 10 - Allocation | 15s | 3:00 |
| 11 - Resolution | 15s | 3:15 |
| 12 - Monitoring | 15s | 3:30 |
| 13 - JSON Approach | 20s | 3:50 |
| 14 - Results | 15s | 4:05 |
| 15 - CTA | 10s | 4:15 |

**Total Runtime: ~4 minutes 15 seconds**
