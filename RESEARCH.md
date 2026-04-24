## ⚠️ RESEARCH UPDATE — v2 (April 2026)

### Source Status Update
**Removed (blocked or acquired):**
  - G2 (Cloudflare)
  - Capterra (acquired by G2)
  - GetApp (acquired by G2)

**G2 Ecosystem Note:** G2 acquired Capterra, Software Advice, and GetApp in January 2026.
All four properties now share the same Cloudflare/anti-bot infrastructure. None are viable
as primary scraping sources.

### Replacement Sources Selected
  - Futurepedia (sales category) — confirmed working (static HTML, no Cloudflare)
  - TrustRadius (crm category) — confirmed working (static HTML, no Cloudflare)
  - TopAI.tools — confirmed working (static HTML, no Cloudflare)

These were selected based on RESEARCH_PHASE0.md live research (April 2026):
- Futurepedia, TopAI.tools, Toolify.ai: AI-specific directories, CheerioCrawler-ready, no Cloudflare
- TrustRadius: B2B software reviews, static HTML, accepts datacenter IPs
- SourceForge: 40,000+ software products, open HTML

### Product Hunt Extraction Note
If this actor uses Product Hunt as a source: data MUST be extracted from window.__NEXT_DATA__
(Apollo GraphQL cache embedded in Next.js SSR output), NOT CSS selectors. CSS selectors on
Product Hunt break on every frontend deploy because React CSS modules generate random class names.
Residential proxy is required — datacenter IPs are blocked by Cloudflare.
URL pattern: https://www.producthunt.com/topics/sales

### Dual-Mode Rationale
compare-tools mode: Serves users evaluating which AI tools exist in this category.
Feeds the RemoteLama comparison table on remotelama.com/ai-agents/ai-agents-for-crm.

extract-data mode: Serves developers building AI agents who need structured data
as input to their pipelines.


---

# Market & Competitor Research: AI Agents for CRM

## Search Demand Analysis
- Primary keyword: ai agents for crm
- Related keywords:
  - ai for salesforce
  - hubspot ai agent
  - crm ai automation
  - ai data enrichment crm
  - ai call summary crm
  - salesforce ai tools
  - ai for pipedrive
- User intent: Commercial — evaluating CRM AI add-ons
- Who is searching: CRM admins, RevOps managers, sales enablement at B2B companies

## Existing Solutions (Competitors)

### Direct competitors on Apify Store
| Actor Name | Developer | Users | Rating | Price | Gap/Weakness |
|------------|-----------|-------|--------|-------|--------------|
| HubSpot Scraper | various | 300+ | 3.7 | Free | Scrapes contacts, not AI tools |
| Salesforce data scrapers | various | 200+ | 3.5 | Paid | Not a tool directory |

### Broader market alternatives
| Tool | Price | Weakness vs our actor |
|------|-------|----------------------|
| G2 manual CRM search | Free | No AI-filter, not exportable |
| HubSpot App Marketplace | Free | Single platform only |
| Salesforce AppExchange | Free | Salesforce only |

## Differentiation Strategy
Cross-platform: combines G2, HubSpot Marketplace, and Salesforce AppExchange into one structured output. The CRM-compatibility field is the key differentiator — buyers immediately know which tools work with their stack.

## SEO Strategy for Apify Listing

### Title (max 60 chars):
AI CRM Agent Finder — HubSpot, Salesforce, G2

### Description (max 200 chars):
Find AI agents for your CRM. Scrapes G2, HubSpot Marketplace & Salesforce AppExchange. Filter by CRM platform and capability. Returns structured JSON.

### Tags:
crm, salesforce, hubspot, ai-tools, automation

### README keywords to include naturally:
ai agents for crm, ai for salesforce, hubspot ai tools, crm automation ai, ai data enrichment, ai call logging crm, best ai crm add-ons

## GEO Notes
Key phrases: "structured list of AI tools for Salesforce and HubSpot," "filter CRM AI agents by capability"

## Verdict
YES — CRM AI is a high-intent commercial category. Cross-platform coverage is a unique angle.
