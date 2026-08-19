# Storylane Script: AI-Powered Aurora MySQL Cost Optimization Assistant

## Demo Overview
- **Total slides**: 10
- **Duration**: ~8-12 minutes self-guided
- **Flow**: Problem → One Command → AI Analysis → Prioritized Report → CTA

---

## Slide 1: Title / Hook
**Screen**: Custom intro slide
**Script**: "How much are you overspending on Aurora right now? Most teams don't know — the review is manual and nobody has time. This assistant reads your clusters' real utilization and hands you a prioritized, evidence-backed savings report in under two minutes."
**Callout**: "Right-sizing • Serverless v2 • Graviton • Reserved Instances • orphaned snapshots"

---

## Slide 2: The Problem
**Screen**: A cluttered spreadsheet / CloudWatch graphs (stock or a screenshot)
**Script**: "Today an Aurora cost review means exporting CloudWatch, eyeballing instance classes, and debating Serverless v2 versus provisioned. It's slow, subjective, and rarely repeated."
**Callout**: "Manual, subjective, infrequent"

---

## Slide 3: Architecture (One Read-Only Analyzer)
**Screen**: Architecture diagram (see ARCHITECTURE.md)
**Script**: "The assistant is a small, read-only analyzer Lambda plus an S3 results bucket. It calls only Describe and GetMetric APIs — no database credentials, no writes — so it's safe to run against production."
**Callout**: Highlight "read-only" and the fetch (code) → judge (Bedrock Nova) split

---

## Slide 4: One Command
**Screen**: Terminal running `bash assess-aurora-cost.sh`
**Script**: "One command deploys the analyzer the first time and runs it. On later runs, add -s to skip the deploy and just re-analyze."
**Callout**: Highlight the command and the "Running analysis (calls Amazon Bedrock)..." line

---

## Slide 5: Discovery & Utilization
**Screen**: Terminal output / `inventory.json` opened
**Script**: "The analyzer inventories every Aurora MySQL cluster and instance and pulls 14 days of CPU, connections, and freeable memory — the evidence behind every recommendation."
**Callout**: Point to an instance entry showing low `cpu_avg_pct_14d`

---

## Slide 6: Bedrock Nova Reasons Over the Data
**Screen**: A short highlight of the analysis step (or a diagram callout)
**Script**: "Amazon Bedrock Nova reasons over the structured inventory. The mechanical facts — counts, metrics, orphaned snapshots — come from code; the judgment about what to change comes from the model, grounded in those facts."
**Callout**: "Facts in code, judgment in the model"

---

## Slide 7: The Report — Executive Summary + Top 3
**Screen**: `report.md` rendered → top of the report
**Script**: "Seconds later you have a Markdown report: an executive summary and a prioritized top-3 list. This is what you'd walk a customer or a FinOps team through."
**Callout**: Highlight the top-3 prioritized recommendations

---

## Slide 8: A Finding in Detail
**Screen**: `report.md` → a right-sizing or Graviton finding
**Script**: "Each finding has a severity, the affected resource, a rationale tied to the actual metrics, an estimated monthly savings range, and the implementation effort — for example, moving an over-provisioned db.r6i writer at 8% average CPU to Graviton or Serverless v2."
**Callout**: Highlight severity + savings range + effort

---

## Slide 9: Evidence & Honesty
**Screen**: `inventory.json` side-by-side with the report
**Script**: "Every number traces back to inventory.json, and the report is explicit that dollar figures are directional estimates to confirm against Cost Explorer before you commit to Reserved Instances or I/O-Optimized storage. No hand-waving."
**Callout**: "Estimates are labeled; raw data is provided"

---

## Slide 10: CTA — Try It Yourself
**Screen**: Custom closing slide
**Script**: "Run it against your own account in minutes — it's read-only and costs a few cents per run. Pair it with the Aurora Incident Investigation demo for a full database story: keep it healthy, and keep it cost-efficient."
**Links to show**:
- GitHub: https://github.com/aws-samples/sample-aws-genai-ops-demos
- Demo Site: https://aws-samples.github.io/sample-aws-genai-ops-demos/
**Callout**: "Read-only | ~10 min | a few cents per run | safe for production"

---

## Capture Tips
- Render `report.md` in a Markdown previewer for clean screenshots.
- If your demo account has few clusters, deploy the Aurora Incident Investigation demo first so there's a real cluster (and some utilization) to analyze.
- Blur/redact account IDs and bucket names in captures.

## Timing Notes
- First run (deploy + analyze): ~2-3 min.
- Analysis-only run (`-s`): 30-90s.
- Total capture time: ~8-12 min.
