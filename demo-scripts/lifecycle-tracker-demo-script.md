# AWS Services Lifecycle Tracker — Demo Script

**Demo:** AI-Powered End-of-Life Tracking for AWS Services
**Presenter:** Habib
**Duration:** ~15 minutes (including Q&A)
**Repository:** [operations-automation/aws-services-lifecycle-tracker/](../operations-automation/aws-services-lifecycle-tracker/README.md)

---

## Introduction (Othman → Habib Handoff)

**Othman:**

Thank you, and as mentioned, the video recordings will be available soon for the previous demo. Moving on to our final demo — this one is by our colleague Habib, and I think it will resonate with many of you.

We all deal with end-of-life announcements for AWS services. The information is scattered across different documentation pages, the formats are inconsistent, and the impact of missing a deprecation can be significant. So how do we organize all of this? How do we build a solution that brings it together?

That's exactly what Habib will walk you through. Habib, over to you.

---

## The Problem (Habib)

Thanks, Othman. I'm sure many of you have faced this before.

Imagine you have an environment running multiple managed services — an EKS cluster, a set of Lambda functions, several RDS instances. For each service, you might be running different runtimes or engine versions. Your Lambda functions could be on Python and Node.js. Your RDS instances might use MySQL, PostgreSQL, and Oracle. And for every single service, runtime, and engine version, there's a separate end-of-life timeline you need to track.

It gets messy fast. Let me show you what I mean.

### Scattered Documentation

- **EKS** — You have to navigate to the EKS documentation, find the version support page buried in the site, and then for each Kubernetes version, check the end of standard support and extended support dates (which come with additional fees).
- **Lambda** — The runtime deprecation information is on a completely different page, in a different format — a matrix showing deprecation dates for each language runtime.
- **RDS** — It gets even more complicated. Each database engine has its own dedicated page. Oracle has one. PostgreSQL has one. MySQL has one. Each with its own format and timeline structure.

### The Core Challenges

1. **Information is scattered** — End-of-life data lives across dozens of separate documentation pages.
2. **Formats are inconsistent** — If you compare the EKS version table to the Lambda runtime matrix, there's no standardized structure.
3. **No centralized view** — There's no single place to see all deprecation timelines across services.
4. **Health notifications aren't enough** — Yes, customers receive AWS Health notifications about upcoming changes, typically around 90 days out. That's useful, but it's reactive. Many customers need longer lead times for planning.

### The Risks of Missing Deprecations

- **Outages and security exposure** — Running unsupported versions means no patches.
- **Cost impact** — Services that move to extended support come with additional fees.
- **Planning gaps** — Without visibility into future deprecations, teams can't make informed decisions about which runtimes or engine versions to adopt for new projects.

---

## The Solution: AWS Services Lifecycle Tracker

So we built a centralized, AI-powered end-of-life tracking tool that brings all of this information into a single dashboard.

### Why AI?

You might wonder — why not just scrape the documentation and display it in a table? The answer goes back to the core challenge: every service exposes this information differently. If you build a static parser for each format, you're constantly maintaining it. And the moment a service team changes their documentation layout or moves a page, your parser breaks.

This is where generative AI adds real value. The LLM handles the dynamic parsing — it can interpret different table formats, extract the relevant dates, and normalize everything into a consistent structure. Even when the documentation format changes, the AI adapts without requiring code changes.

### Architecture

The architecture is straightforward:

- **Data Fetching** — We use a Python library called BeautifulSoup to fetch the HTML content from AWS documentation pages. This gives us clean, structured input without consuming excessive tokens.
- **AI Processing** — The fetched content is passed to Amazon Bedrock Agent Runtime, running Amazon Nova as the LLM. The agent parses the content, categorizes the information, and outputs it in a standardized format.
- **Storage** — All extracted data is stored in Amazon DynamoDB, so you can query it programmatically via API or display it in the UI.
- **Scheduling** — An Amazon EventBridge scheduler triggers the extraction on a configurable cadence — weekly by default, but you can set it to daily or any frequency you prefer.
- **Frontend** — A React application served via Amazon CloudFront with an S3 origin. Authentication is handled through Amazon Cognito (user pool and identity pool with IAM authorization).

---

## Live Demo

*[Opens the dashboard in browser]*

Here's the dashboard. You can see right away that services with versions that have already passed their end-of-life date are highlighted in red.

A few things to note — this isn't scanning your account's resources. It's pulling from the public AWS documentation, giving you a comprehensive view of all deprecation timelines across services.

### Service Management

There's a button to trigger a full extraction across all services, but let me show you a more targeted approach.

If we go to the Services section, you'll see a toggle for each service. If you don't use EKS or RDS, you can simply disable them. The next time the scheduler runs, those services won't be included. This keeps the dashboard focused on what matters to you.

### Per-Service Details

For every service, you can see:
- **Extraction timestamp** — When the data was last fetched
- **Item count** — How many versions or runtimes were identified
- **Processing time** — It's fast. Lambda information, for example, takes about 3 seconds
- **Success rate** — Extraction reliability metrics
- **Trigger type** — Whether it was a scheduled or manual extraction

### On-Demand Refresh

Let me refresh MSK as an example.

*[Clicks the reload button for MSK]*

You get a confirmation prompt, and then — done. What just happened behind the scenes: we fetched the MSK documentation, passed it through BeautifulSoup for clean HTML extraction, sent it to the Bedrock Agent Runtime with Nova, stored the normalized results in DynamoDB, and rendered it in the UI. All in a few seconds.

### Deprecation Details

If we drill into a specific service — let's look at Lambda — you can see each runtime with its deprecation status and dates. For Python, for example, you get the specific deprecation date and current status.

For RDS, it's even richer. You get end of standard support, end of extended support, the community release date, and the RDS-specific release date. All normalized into a consistent view regardless of how the original documentation was structured.

### Timeline View

The timeline view is particularly useful. The AI handles the prioritization — it shows you how much time remains until each deprecation date, so you can quickly identify what needs attention first.

---

## Q&A Highlights

**Q: What about the risk of hallucination? How accurate is this?** *(Jean-Pierre)*

Great question. We addressed this by separating the data fetching from the AI processing. BeautifulSoup handles the HTML parsing in a deterministic way — no AI involved at that stage. We control exactly which documentation pages are fetched. The AI only processes the already-extracted content to normalize and categorize it. Based on our testing, we're seeing above 90% accuracy. That said, adding automated validation tests would further improve confidence in the data quality.

**Q: Why BeautifulSoup instead of APIs? What if the page structure changes?** *(Lino)*

We're using BeautifulSoup only to fetch and clean the HTML sections — not to do the actual parsing of deprecation data. That's the AI's job. This approach is lightweight, fast, and doesn't consume excessive tokens. The key insight is that even if the page structure changes, the LLM can still interpret the content and extract the relevant information. That's the whole point of using AI here — it handles the dynamic, unpredictable aspects of documentation formats.

**Q: Could this become a native AWS service or feature?** *(Luca)*

I'd love to see that happen. Before generative AI, building something like this was extremely painful — you'd need a custom parser for every service, every format, and you'd constantly be maintaining it as documentation changed. Now, with LLMs, we can solve the dynamic parsing problem elegantly. Until it becomes a native feature, this is our way of filling the gap for customers.

**Q: Could this be extended with a second agent step that cross-references your actual account resources?** *(Participant)*

Absolutely — that's the natural next step. You could combine this with data from the CID (Cost and Usage) dashboard or AWS Config to identify which of your running resources are affected by upcoming deprecations. But even without that integration, this tool is valuable during the planning phase. When you're choosing which PostgreSQL version to deploy or which Lambda runtime to adopt, you can check the deprecation timeline upfront and make an informed decision.

**Q: Can customers integrate this with their existing CMDB?** *(Amar)*

Yes. The solution exposes an API, so enterprises that maintain a Configuration Management Database can pull this data programmatically and manage lifecycle information centrally alongside their existing asset inventory.

---

## Key Takeaways

- **The tool is open source** — available in the [AWS GenAI Operations Demos repository](https://github.com/aws-samples/sample-aws-genai-ops-demos) on GitHub.
- **Deploys in ~10 minutes** — fully automated deployment.
- **Configurable** — add new services by updating a config file with a simple template block.
- **API-driven** — use the dashboard UI or integrate directly via API into your CMDB or operational tooling.
- **AI-powered dynamic parsing** — adapts to documentation format changes without code modifications.

---

*Script prepared from recorded session by: Marisha (maayushi), TAM — AWS Account Team*
