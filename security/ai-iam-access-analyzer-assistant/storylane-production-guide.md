# Storylane Production Guide: IAM Security Assistant

## Final Screen Count: 10 Screens

Based on the VPN demo pattern (12 screens for a multi-component infrastructure demo), this chat-based demo works best with **10 screens** — enough to tell the full story without losing attention.

---

## Screen-by-Screen Build Plan

---

### Screen 1 of 10: Title & Hook

**What to show**: Custom-designed intro slide (create in Canva/Figma or use Storylane's built-in slide builder)

**Visual elements**:
- Title: "IAM Security Assistant"
- Subtitle: "AI-Powered IAM Remediation with Amazon Bedrock"
- 4 value pills: `Read-Only` | `Blast Radius Analysis` | `Policy Generation` | `< 2 min/role`
- Small architecture diagram in the corner

**Storylane config**:
- Type: `Guide step` (no hotspot needed — auto-advance or "Next" button)
- Tooltip text: "Your Security Hub shows dozens of IAM findings. Which ones matter? What breaks if you fix them? This assistant triages, analyzes blast radius, and generates ready-to-apply policies — in under 2 minutes per role."
- Position: Center overlay

**Narrator script** (for voiceover if using Storylane's audio feature):
> "Instead of spending 30+ minutes per role digging through CloudTrail and testing policy changes — ask the IAM Security Assistant."

---

### Screen 2 of 10: Login Page

**What to capture**: The Cognito login screen at `https://d35uakxtpftk0q.cloudfront.net`

**How to capture**:
1. Open the URL in Chrome Incognito (1920x1080)
2. Screenshot the login form BEFORE entering credentials
3. The form should show Email and Password fields with the Cognito-branded UI

**Storylane config**:
- Hotspot: On the "Sign In" button
- Tooltip text: "Secured with Amazon Cognito. Supports SAML/OIDC federation with your corporate IdP (Okta, Azure AD, Ping) for production use."
- Tooltip position: Left of the sign-in button
- Click action: Advance to next screen

**Annotation** (Storylane callout box):
- Text: "Amazon Cognito Authentication"
- Position: Top-right corner

---

### Screen 3 of 10: Chat Interface — Empty State

**What to capture**: The chat UI immediately after login — empty conversation, ready for input

**How to capture**:
1. Log in with admin@example.com / IamAnalyzer2024!
2. Wait for the page to fully load
3. Screenshot the empty chat with any welcome message visible
4. Make sure the chat input box is visible at the bottom

**Storylane config**:
- Hotspot: On the chat input text field
- Tooltip text: "Ask anything about your IAM security posture in natural language. The assistant uses Amazon Bedrock's Converse API with tool-calling to query Security Hub, CloudTrail, and IAM in real-time."
- Tooltip position: Above the input field
- Click action: Show typing animation then advance to next screen

**Annotation**:
- Text: "Natural Language Interface — no dashboards, no filters"
- Position: Top-center

---

### Screen 4 of 10: Findings Discovery

**What to capture**: The assistant's response after asking `What are my active IAM findings?`

**How to capture**:
1. Type: `What are my active IAM findings?`
2. Wait 5-8 seconds for the full response
3. Screenshot showing BOTH the user's message AND the assistant's full response
4. Make sure the findings list is fully visible (scroll if needed to show 5-8 findings)

**Storylane config**:
- Hotspot: On the first finding in the list (a role name)
- Tooltip text: "The assistant queried Security Hub in real-time and found 20 active IAM findings — all unused roles accumulating risk. Each shows severity, role name, and days since last use."
- Tooltip position: Right of the findings list
- Click action: Advance to next screen

**Annotations** (multiple):
1. Callout on severity badge: "MEDIUM — All findings from IAM Access Analyzer"
2. Callout on a role name: "Roles identified for review — unused since creation"
3. Callout on the response timing: "Real-time Security Hub query"

---

### Screen 5 of 10: Blast Radius / Dependency Check

**What to capture**: The assistant's response after asking about dependencies

**Prompt to use** (type this in the live demo):
```
What would break if I deleted ConsoleAdminAccess?
```
OR (pick based on what findings returned):
```
Check dependencies for [role name from Screen 4 — pick one with "Access" or "Admin" in the name]
```

**How to capture**:
1. Type the dependency prompt
2. Wait 8-15 seconds (this one takes longer — multiple API calls)
3. Screenshot the FULL dependency analysis response
4. Key elements to ensure are visible: Risk Level, Dependents, Trust, Recommendation

**Storylane config**:
- Hotspot: On the "Risk Level" or "Recommendation" line
- Tooltip text: "Before touching any role, the assistant maps its dependencies — trust relationships, resource policies, cross-account access, and service-linked usage. This role has a LOW risk score with zero dependents — safe to delete."
- Tooltip position: Left of the risk score
- Click action: Advance to next screen

**Annotations**:
1. Callout on Risk Level: "Risk Score: 0/100 — Safe to delete"
2. Callout on Trust line: "Cross-account trust analysis included"
3. Callout on Recommendation: "Actionable recommendation — no guessing"

**If the response shows LOW risk / no dependencies**, that's GOOD — annotate it as:
> "Zero dependencies confirmed in 8 seconds. In a production account with 200+ roles, this analysis would take hours manually."

---

### Screen 6 of 10: Least-Privilege Policy Generation

**What to capture**: The assistant's response with a generated policy

**Prompt to use**:
```
Generate a least-privilege policy for [pick a role from findings — ideally one that HAD some usage]
```
OR if all roles are unused:
```
Generate a least-privilege policy for [any role with attached policies]
```

**How to capture**:
1. Type the policy generation prompt
2. Wait 10-20 seconds (CloudTrail lookback takes time)
3. Screenshot the response showing:
   - Current vs. used permissions comparison
   - Percentage reduction
   - The generated JSON policy
4. Make sure the JSON policy block is visible (scroll to show it)

**Storylane config**:
- Hotspot: On the percentage reduction number (e.g., "87% reduction")
- Tooltip text: "The assistant analyzed 90 days of CloudTrail data to determine which permissions were actually used. It generated a minimal policy — 87% fewer permissions than the current state. Ready to copy and apply."
- Tooltip position: Above the JSON policy block
- Click action: Advance to next screen

**Annotations**:
1. Callout on reduction %: "87% permission reduction — from CloudTrail analysis"
2. Callout on the JSON policy: "Copy-paste ready — valid IAM policy JSON"
3. Callout on the analysis period: "Based on 90-day CloudTrail lookback"

---

### Screen 7 of 10: Policy Validation

**What to capture**: The assistant's validation response

**Prompt to use**:
```
Validate this policy against AWS best practices
```

**How to capture**:
1. Type the validation prompt
2. Wait 5-10 seconds
3. Screenshot showing validation results (PASS/WARN/FAIL items)

**Storylane config**:
- Hotspot: On a validation result item
- Tooltip text: "The policy passes through IAM Access Analyzer's validation engine — checking for overly broad resources, missing conditions, deprecated actions, and AWS best practice violations. A quality gate before any change hits production."
- Tooltip position: Below the validation results
- Click action: Advance to next screen

**Annotations**:
1. Callout: "Policy validated — no best practice violations"
2. (If there are warnings): "Warnings surfaced for review — not blockers"

---

### Screen 8 of 10: Export as Infrastructure-as-Code

**What to capture**: The assistant's export response with CDK/CloudFormation code

**Prompt to use**:
```
Export this policy as CDK Python and CloudFormation
```

**How to capture**:
1. Type the export prompt
2. Wait 5-8 seconds
3. Screenshot showing at least 2 different format outputs (CDK + CFN)

**Storylane config**:
- Hotspot: On the CDK code block
- Tooltip text: "Not just raw JSON — deployment-ready artifacts in your format of choice. AWS CDK (Python or TypeScript), CloudFormation, or plain JSON. Copy into your repo and deploy through your normal pipeline."
- Tooltip position: Left of the code blocks
- Click action: Advance to next screen

**Annotations**:
1. Callout on CDK output: "AWS CDK Python — deploy via cdk deploy"
2. Callout on CFN output: "CloudFormation — deploy via aws cloudformation"

---

### Screen 9 of 10: Full Conversation Thread (Summary)

**What to capture**: Scroll up to show the entire conversation thread in one screenshot

**How to capture**:
1. Scroll to the top of the conversation
2. Take a TALL screenshot (or use Storylane's scroll-capture feature) showing the journey:
   - Findings discovery
   - Dependency check
   - Policy generation
   - Validation
   - Export
3. If can't fit all, capture showing at least 3-4 of the exchanges visible

**Storylane config**:
- Hotspot: On the last message (or center of the conversation)
- Tooltip text: "In under 5 minutes of conversation: discovered 20 findings, analyzed blast radius, generated a validated least-privilege policy, and exported deployment-ready code. From 'What's wrong?' to 'Here's the fix' — no console, no manual analysis."
- Tooltip position: Center overlay
- Click action: Advance to final screen

**Annotations**:
- Overlay text at the top: "Total time: < 5 minutes | Cost: ~$0.05"
- Flow indicators: "1 Discover - 2 Analyze - 3 Generate - 4 Validate - 5 Export"

---

### Screen 10 of 10: Call to Action

**What to show**: Custom closing slide (Storylane's built-in slide builder)

**Visual elements**:
- Title: "Try It Yourself"
- Subtitle: "Deploy in 15 minutes | Safe for any account | Full cleanup included"
- Two buttons:
  - "View on GitHub" → https://github.com/aws-samples/sample-aws-genai-ops-demos/tree/main/security/ai-iam-access-analyzer-assistant
  - "Demo Library" → https://aws-samples.github.io/sample-aws-genai-ops-demos/
- Stats bar: `15 min setup` | `~$0.05/session` | `Read-only` | `Any region`

**Storylane config**:
- Type: `CTA step` (with clickable buttons)
- Button 1: "Deploy Now" → GitHub link
- Button 2: "See All Demos" → Demo library link

**Narrator script**:
> "Deploy this in your account and show your customers how GenAI turns IAM remediation from a dreaded backlog item into a 2-minute conversation. 15 minutes to deploy, pennies per session, and completely read-only — safe for production accounts."

---

## Storylane Settings

### Global Configuration
| Setting | Value |
|---------|-------|
| Theme | Light (matches Cloudscape) |
| Accent color | #0972d3 (AWS Cloudscape blue) |
| Font | Amazon Ember or Inter |
| Tooltip style | Rounded, with arrow |
| Progress bar | Show (gives users sense of completion) |
| Auto-advance | OFF (let users click through) |
| Screen transitions | Fade (subtle, professional) |

### Hotspot Style
| Setting | Value |
|---------|-------|
| Shape | Pulse circle (animated) |
| Color | #0972d3 (blue pulse) |
| Size | Medium |
| Click behavior | Advance to next step |

### Tooltip Style
| Setting | Value |
|---------|-------|
| Max width | 350px |
| Background | White with subtle shadow |
| Border | 1px solid #e9ebed |
| Text color | #16191f |
| Close button | Hidden (click-to-advance instead) |

---

## Capture Checklist

Before starting Storylane capture:

- [ ] Chrome Incognito mode (no extensions, no bookmarks bar)
- [ ] Window size: 1920x1080
- [ ] Zoom: 100% (no scaling)
- [ ] Light mode in browser
- [ ] No notifications showing
- [ ] URL bar minimal (just the CloudFront URL)
- [ ] Demo URL loaded: https://d35uakxtpftk0q.cloudfront.net
- [ ] Credentials ready: admin@example.com / IamAnalyzer2024!
- [ ] Tested login works before starting capture
- [ ] Ran one test prompt to ensure the assistant is responding

## Capture Order (Recommended)

Capture in this order for efficiency (avoids re-logging in):

1. **Screen 2** — Login page (before signing in)
2. **Screen 3** — Empty chat (right after login)
3. **Screen 4** — Findings response (first prompt)
4. **Screen 5** — Dependency check (second prompt)
5. **Screen 6** — Policy generation (third prompt)
6. **Screen 7** — Validation (fourth prompt)
7. **Screen 8** — Export (fifth prompt)
8. **Screen 9** — Full thread (scroll up)
9. **Screen 1** — Title slide (create in Canva/Storylane)
10. **Screen 10** — CTA slide (create in Canva/Storylane)

---

## Exact Prompts to Type (Copy-Paste Ready)

Use these in order during your capture session:

```
What are my active IAM findings?
```

```
Tell me more about [ROLE_NAME]
```
*(Replace [ROLE_NAME] with the most interesting role from the findings)*

```
What would break if I deleted [ROLE_NAME]?
```
*(Use same role, or pick one with "Access"/"Admin" in the name)*

```
Generate a least-privilege policy for [ROLE_NAME]
```
*(Pick a role that has SOME usage, not completely unused)*

```
Validate this policy against AWS best practices
```

```
Export this policy as CDK Python and CloudFormation
```

---

## If Things Go Wrong

| Problem | Solution |
|---------|----------|
| Login fails | Check credentials, clear browser cache, try again |
| "Failed to fetch" mid-conversation | Token expired — refresh page, re-login, start over |
| No findings returned | Security Hub may not have findings — ask "Show me all IAM roles in this account" as fallback |
| Response too long (can't fit in screenshot) | Scroll to show the most impactful section; split across 2 Storylane screens if needed |
| Response too short/boring | Re-phrase: use "blast radius" or "executive summary" language for richer output |
| Assistant gives generic response | Be more specific: include role name, timeframe, or format preference |

---

## Post-Capture Storylane Polish

After all screenshots are in Storylane:

1. **Add blur** to any account IDs or sensitive role ARNs (optional — demo account, so likely fine)
2. **Add zoom** on key data points (risk score, % reduction, JSON policy)
3. **Test the flow** end-to-end in preview mode
4. **Check mobile** — Storylane demos should work on mobile too
5. **Generate share link** → Update README.md with the Storylane URL
6. **Set SEO** title: "IAM Security Assistant — AI-Powered IAM Remediation Demo"
