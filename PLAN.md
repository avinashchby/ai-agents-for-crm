## ⚠️ UPDATED PLAN — v2 (April 2026)

### What Changed From v1
- Removed (BLOCKED / acquired by G2 Jan 2026):
  - G2 (Cloudflare)
  - Capterra (acquired by G2)
  - GetApp (acquired by G2)
- Added: Futurepedia (sales category), TrustRadius (crm category), TopAI.tools
- Scraping method updated: Cheerio (G2/Capterra) → CheerioCrawler on open-HTML AI directories
- Dual-mode architecture added: compare-tools + extract-data
- RemoteLama attribution added

### v2 Source Selection
**compare-tools mode sources (in priority order):**
  - Futurepedia (sales category)
  - TrustRadius (crm category)
  - TopAI.tools
  - Product Hunt (sales topic) — PlaywrightCrawler + RESIDENTIAL proxy, extract from window.__NEXT_DATA__
- Vendor direct pages — always scrapable, used as hardcoded fallback
  - trustradius.com/crm/ — CheerioCrawler, static HTML

**extract-data mode:**
  - Primary: Futurepedia.io sales/CRM AI tools
  - Method: CheerioCrawler

### v2 Input Schema
**Mode field (required, first field):**
- mode: "compare-tools" | "extract-data" (default: "compare-tools")

**compare-tools inputs:**
- mode (string, required)
- maxResults (integer, default: 25, min: 1, max: 200)

**extract-data inputs:**
- mode (string, required)
- maxResults (integer, default: 25)

### v2 Output Schema
**compare-tools output per item:**
```json
{
  "name": "Tool Name",
  "vendor": "Vendor Inc",
  "description": "What the tool does",
  "pricing_model": "freemium",
  "rating": 4.5,
  "source": "futurepedia",
  "url": "https://...",
  "scraped_at": "2026-04-24T00:00:00Z"
}
```

**extract-data output per item:**
```json
{
  "name": "Tool Name",
  "description": "What the tool does",
  "features": [],
  "pricing": "...",
  "source": "futurepedia",
  "url": "https://...",
  "scraped_at": "2026-04-24T00:00:00Z"
}
```

### v2 Technical Approach
- compare-tools method: CheerioCrawler (Futurepedia/TopAI/TrustRadius) + PlaywrightCrawler+RESIDENTIAL for Product Hunt
- extract-data method: CheerioCrawler
- Proxy: not required for Futurepedia/TrustRadius
- Memory: 256MB
- Estimated run time: 20–35 seconds

### v2 Build Status
- [ ] Code updated
- [ ] Local test passed
- [ ] GitHub pushed
- [ ] Apify deployed
- [ ] Dry run passed


---

# AI Agents for CRM

## Keyword
ai agents for crm

## Problem Statement
Revenue teams using CRMs like Salesforce, HubSpot, and Pipedrive face a specific problem: their CRM is full of stale data. AI agents that update contact records, write deal summaries, auto-log call notes, and forecast pipeline health are now essential — but finding CRM-native AI agents vs. third-party integrations is confusing. Buyers need to know which tools natively embed inside their CRM vs. which require an API bridge.

A HubSpot admin at a 200-person company wants to deploy an AI agent that auto-enriches contact data and writes follow-up email drafts. They need to compare HubSpot's native AI features, Clay, Gong, and third-party plugins — structured, not from a blog post.

## What This Actor Does
Scrapes G2 CRM software category with AI filter, HubSpot Marketplace, and Salesforce AppExchange for AI agent add-ons. Returns structured list of AI CRM agents with CRM compatibility, key capabilities, pricing, and ratings.

## Target Users
- Primary: CRM Admin / RevOps Manager at B2B companies (50–500 employees)
- Secondary: HubSpot/Salesforce partner consultants building client tech stacks
- Use case examples:
  1. Evaluating AI add-ons for a Salesforce Enterprise renewal
  2. Comparing HubSpot native AI vs. third-party AI agents
  3. Building a tech stack recommendation for a RevOps audit

## Input Schema Design
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| maxResults | integer | no | 25 | Max tools to return |
| crmPlatform | string | no | "all" | "salesforce","hubspot","pipedrive","all" |
| capabilities | array | no | [] | Filter: "data-enrichment","email-drafting","forecasting","call-logging" |
| minRating | number | no | 0 | Minimum rating |
| pricingModel | string | no | "all" | "free","freemium","paid","all" |

## Output Schema Design
```json
{
  "results": [
    {
      "name": "Gong AI Deal Intelligence",
      "vendor": "Gong",
      "description": "AI agent that analyzes sales calls, updates CRM fields, and forecasts deal risk.",
      "crm_compatibility": ["Salesforce", "HubSpot"],
      "capabilities": ["call-logging", "forecasting", "coaching"],
      "pricing_model": "paid",
      "starting_price_usd": 150,
      "rating": 4.7,
      "review_count": 3200,
      "source": "g2",
      "url": "https://www.g2.com/products/gong-io/reviews",
      "scraped_at": "2026-04-23T15:00:00Z"
    }
  ],
  "metadata": {
    "total_results": 25,
    "run_duration_seconds": 13.5,
    "sources_scraped": ["g2", "hubspot_marketplace"]
  }
}
```

## Technical Approach
- Scraping method: Cheerio (G2 category pages); Playwright for HubSpot Marketplace
- Proxy needed: Yes
- Authentication needed: No
- Rate limiting strategy: 2s delay, proxy rotation
- Estimated run time: 25–40 seconds
- Memory requirement: 512MB

## Build Complexity
LOW — standard directory scraping pattern.

## Monetization Plan
- Phase 1: Free
- Phase 2: $9/month with Salesforce AppExchange scraping
- Rationale: CRM admins have procurement budgets and high willingness to pay for accurate vendor data
