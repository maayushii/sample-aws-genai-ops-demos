# Storylane Script: IAM Security Assistant — AI-Powered IAM Remediation

## Demo Overview
- **Total slides**: 10-12
- **Duration**: ~10-15 minutes self-guided
- **Live URL**: https://d35uakxtpftk0q.cloudfront.net
- **Credentials**: admin@example.com / IamAnalyzer2024!
- **Flow**: Login → Discover Findings → Analyze Dependencies → Generate Policies → Validate → Export

---

## Slide 1: Title / Hook
**Screen**: Custom intro slide with architecture diagram
**Script**: "Your Security Hub shows 47 IAM findings. Which ones matter? What breaks if you fix them? Instead of spending 30+ minutes per role digging through CloudTrail — ask the IAM Security Assistant. It triages, analyzes blast radius, and generates ready-to-apply least-privilege policies in under 2 minutes."
**Callout**: "Read-only analysis | Blast radius checks | Ready-to-apply policies | Powered by Amazon Bedrock"

---

## Slide 2: Architecture Overview
**Screen**: Architecture diagram (create or screenshot from ARCHITECTURE.md)
**Script**: "The assistant is a serverless, conversational AI tool. Users chat through a Cloudscape React frontend. Questions route through API Gateway to a Lambda that orchestrates Amazon Bedrock Converse API with tool-calling. Bedrock decides which backend tools to invoke — Security Hub for findings, CloudTrail for usage analysis, IAM for dependencies, and Access Analyzer for validation."
**Callout**: Highlight the flow: User → CloudFront → API GW → Bedrock Converse → Tool Lambdas (Security Hub, CloudTrail, IAM, Access Analyzer)

---

## Slide 3: Login Screen
**Screen**: Cognito hosted login page at https://d35uakxtpftk0q.cloudfront.net
**Script**: "Access is secured via Amazon Cognito. In production, you'd integrate this with your corporate IdP (Okta, Azure AD, Ping) via SAML or OIDC federation. For this demo, we use a standalone Cognito User Pool."
**Callout**: Point to the email/password fields
**Action**: Enter admin@example.com / IamAnalyzer2024! → Click Sign In

---

## Slide 4: Chat Interface — Welcome State
**Screen**: Empty chat interface after login (Cloudscape design)
**Script**: "This is the IAM Security Assistant. A clean, conversational interface built with AWS Cloudscape Design System. No dashboards to navigate, no filters to configure — just ask what you need in natural language."
**Callout**: Highlight the chat input area and the assistant's welcome/intro message

---

## Slide 5: First Query — Discover IAM Findings
**Screen**: Chat after typing "What are my active IAM findings?"
**Prompt to type**: `What are my active IAM findings?`
**Script**: "We start by asking what's wrong. The assistant queries Security Hub's IAM Access Analyzer integration in real-time and returns a prioritized list of findings — severity, role name, issue type, and when the role was last used."
**Callout**: Highlight the findings list — severity labels, role names, unused duration
**What to capture**: The full response showing the list of findings with severity and descriptions

---

## Slide 6: Deep Dive — Select a High-Risk Finding
**Screen**: Chat after asking about a specific role from the findings
**Prompt to type**: `Tell me more about [pick the most interesting role from the findings — look for one marked as "unused" or "overly permissive"]`
**Script**: "Let's dig into a specific finding. The assistant pulls detailed metadata — when the role was created, its trust policy, attached permissions, and how long since it was last used."
**Callout**: Highlight key data points: last used date, permission count, trust relationship

---

## Slide 7: Dependency / Blast Radius Analysis
**Screen**: Chat after asking to check dependencies
**Prompt to type**: `Check dependencies for [role name from findings — pick one that looks like it might have dependencies, e.g., a role with "Service" or "Access" in the name]`

**Alternative prompts if first one returns "no dependencies":**
- `What would break if I deleted [role name]?`
- `Show me the blast radius for [role name]`
- `Check dependencies for all my unused roles`

**Script**: "Before you delete or modify any role, you need to know: what depends on it? The assistant maps IAM entity dependencies — trust relationships, resource policies, service-linked usage, and cross-account access. It returns a risk score (0-100) and a clear recommendation."

**Expected output structure:**
```
Dependency Analysis for [RoleName]:

Risk Level: LOW/MEDIUM/HIGH (Score: X/100)
Quick Dependents: [list or "None"]
Trust: [who can assume this role]
Policies Attached: [list]
Cross-Account Access: [yes/no + details]
Service-Linked: [yes/no]

Recommendation: [Safe to delete / Review before modifying / Do NOT delete]
```

**Callout**: Highlight the Risk Level score and the Recommendation
**Why this matters for Storylane**: This is the "safety net" moment — it shows the assistant prevents accidental breakage. Even if the result is "LOW risk, safe to delete" — that's valuable because it gives confidence.

**Pro tip for capture**: If most roles come back as LOW risk with no dependencies (common in demo accounts), that's actually a great story — "Look, 15 unused roles with zero dependencies. You could clean these up TODAY with zero risk." Frame it as a cleanup opportunity, not a lack of drama.

---

## Slide 8: Generate Least-Privilege Policy
**Screen**: Chat after requesting policy generation
**Prompt to type**: `Generate a least-privilege policy for [pick a role that HAD some usage — not a completely unused one]`

**Alternative if all roles are unused:**
- `Generate a least-privilege policy for [any role with attached policies]`

**Script**: "Now for the money shot. The assistant analyzes CloudTrail to see what API calls this role actually made in the last 90 days, then generates a minimal policy that covers only what's needed. It shows: current permissions granted vs. actually used, the percentage reduction, and the exact JSON policy you can apply."

**Expected output structure:**
```
Policy Analysis for [RoleName]:

Current: X actions granted (service1, service2, ...)
Used: Y actions in 90 days
Reduction: Z%

Recommended Policy:
{
  "Version": "2012-10-17",
  "Statement": [...]
}
```

**Callout**: Highlight the permission reduction percentage (e.g., "87% reduction") and the generated JSON policy
**Why this matters**: This transforms a finding into an actionable artifact — copy-paste ready

---

## Slide 9: Policy Validation
**Screen**: Chat after asking to validate the generated policy
**Prompt to type**: `Validate this policy against AWS best practices`
**Script**: "Before applying any policy, we validate it. The assistant runs the generated policy through IAM Access Analyzer's policy validation — checking for overly broad resources, missing conditions, deprecated actions, and best practice violations."
**Callout**: Highlight validation results (PASS/WARN/FAIL items)

---

## Slide 10: Export — Multiple Formats
**Screen**: Chat after asking for export
**Prompt to type**: `Export this policy as CloudFormation and CDK Python`
**Script**: "The assistant doesn't just give you JSON — it generates deployment-ready artifacts. Choose from raw JSON, AWS CDK (Python or TypeScript), or CloudFormation templates. Copy, paste, deploy."
**Callout**: Highlight the different format outputs (JSON, CDK, CloudFormation)

---

## Slide 11: Summary / What We Accomplished
**Screen**: Chat showing the full conversation thread (scroll up to show the journey)
**Script**: "In under 5 minutes of conversation, we went from 'What's wrong?' to 'Here's the fix, validated and ready to deploy.' No console clicking, no CloudTrail log parsing, no manual policy writing."
**Callout**: Annotate the key steps: Discover → Analyze → Generate → Validate → Export

---

## Slide 12: CTA — Try It Yourself
**Screen**: Custom closing slide
**Script**: "Deploy this in your account in 15 minutes. Show your customers how GenAI transforms IAM remediation from a dreaded backlog item into a 2-minute conversation."
**Links to show**:
- GitHub: https://github.com/aws-samples/sample-aws-genai-ops-demos/tree/main/security/ai-iam-access-analyzer-assistant
- Demo Library: https://aws-samples.github.io/sample-aws-genai-ops-demos/
**Callout**: "15 min deploy | ~$0.05/session | Read-only (safe for production accounts) | Full cleanup script"

---

## Screen 4 / Slide 7 — Detailed Guidance for Dependency Check

### What the Dependency Check Actually Does

The `check_dependencies` tool Lambda:
1. Lists all IAM policies attached to the role
2. Searches for the role ARN in resource-based policies across the account
3. Checks if any services are configured to assume this role
4. Looks for cross-account trust relationships
5. Checks if Lambda functions, EC2 instances, or ECS tasks reference this role
6. Calculates a composite risk score (0-100)

### Best Prompts for This Screen

**If you want a LOW risk result (easy win story):**
```
Check dependencies for [any role with "unused" in its finding description]
```
Low risk = "You can clean this up safely" — still valuable

**If you want a MEDIUM/HIGH risk result (dramatic story):**
```
Check dependencies for [any role with "Service" or "Admin" or "Access" in the name]
```
These are more likely to have actual dependencies

**If the role has no dependencies (common in demo accounts):**
Frame it as: "The assistant confirmed zero dependencies — this is a safe cleanup target. In a production account with 200+ roles, this kind of analysis would take hours manually."

### Fallback Prompts if Dependencies Are Sparse

If the demo account has mostly unused roles with no dependencies, pivot to a broader question:
```
Which of my unused roles are safe to delete immediately?
```
or
```
Give me a prioritized cleanup plan for my unused IAM roles
```

This forces the assistant to batch-analyze and produces a satisfying summary table.

---

## Best Prompts for Maximum Impact

### Opening (Findings Discovery)
| Prompt | Why It Works |
|--------|-------------|
| `What are my active IAM findings?` | Broad, shows volume |
| `Show me my most critical IAM security issues` | Filters to high severity |
| `Which IAM roles haven't been used in 90 days?` | Specific, actionable |
| `How many overly-permissive roles do I have?` | Quantifies the problem |

### Deep Analysis
| Prompt | Why It Works |
|--------|-------------|
| `Check dependencies for [RoleName]` | Shows safety-first approach |
| `What would break if I deleted [RoleName]?` | Business language |
| `Show me the blast radius for [RoleName]` | Dramatic, memorable |
| `Is it safe to remove [RoleName]?` | Direct yes/no framing |

### Policy Generation
| Prompt | Why It Works |
|--------|-------------|
| `Generate a least-privilege policy for [RoleName]` | Core value prop |
| `What permissions does [RoleName] actually need?` | Business framing |
| `Right-size the permissions for [RoleName] based on the last 90 days` | Specific timeframe |
| `Create a minimal policy for [RoleName] with only used actions` | Technical precision |

### Validation & Export
| Prompt | Why It Works |
|--------|-------------|
| `Validate this policy against AWS best practices` | Shows quality gate |
| `Export this as CDK Python and CloudFormation` | Multiple formats |
| `Give me a change request document for this remediation` | Enterprise workflow |

### Power Moves (Wow Factor)
| Prompt | Why It Works |
|--------|-------------|
| `Give me a prioritized cleanup plan for my top 5 riskiest roles` | Shows strategic thinking |
| `Create an executive summary of my IAM security posture` | C-level language |
| `What's my least-privilege score across all roles?` | Gamification angle |

---

## Capture Tips

- **Browser**: Use Chrome in Incognito mode (no extensions visible)
- **Theme**: Keep Cloudscape default (light mode) for readability
- **Window size**: 1920x1080 or similar — avoid tiny text
- **Wait for responses**: The assistant takes 3-10 seconds per response (Bedrock inference + tool calls). Wait for the full response before capturing.
- **Scroll position**: Capture with the latest response fully visible
- **Multiple attempts**: If a response isn't visually impressive, try a different role name or rephrased prompt — the assistant's output varies
- **Token display**: The UI shows token usage — this is great for cost transparency callouts

## Timing Notes

- Login → Chat ready: ~2-3 seconds
- Simple query (list findings): ~5-8 seconds
- Dependency check: ~8-15 seconds (multiple API calls)
- Policy generation: ~10-20 seconds (CloudTrail lookback)
- Policy validation: ~5-10 seconds
- Total capture time: ~20-30 min for all screenshots (including retakes)

## Troubleshooting During Capture

| Issue | Fix |
|-------|-----|
| "Failed to fetch" | Session expired — refresh the page and re-login |
| Blank/empty response | Try a simpler prompt first, then build complexity |
| "No findings found" | Security Hub/Access Analyzer may not be enabled in this account — use the findings that ARE there |
| Slow responses | Normal — Bedrock + tool calls take time. Wait it out. |
| Token/session expired | Refresh browser, re-authenticate |
