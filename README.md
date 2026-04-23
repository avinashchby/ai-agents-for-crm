# AI Agents for CRM — HubSpot, Salesforce & G2 Scraper

CRM AI tools live across three separate ecosystems: G2 for cross-platform ratings, the HubSpot Marketplace for native integrations, and Salesforce AppExchange for Salesforce-specific add-ons. This actor scrapes all three in a single run and returns a clean, deduplicated JSON dataset of AI agents for CRM — built for CRM admins, RevOps managers, and sales enablement leads evaluating what to add to their stack.

---

## What it does

- Scrapes **G2** (`/categories/crm`), the **HubSpot App Marketplace**, and **Salesforce AppExchange** for AI-powered CRM tools
- Filters by CRM capability (data enrichment, call logging, pipeline automation, forecasting, lead scoring), platform compatibility, minimum rating, and pricing model
- Returns one **structured JSON record per tool** covering capabilities, platform integrations, pricing, and source URL
- **Deduplicates** by tool name across all three sources
- Caps output at `maxResults` to keep runs fast and predictable

---

## Input

| Field | Type | Default | Description |
|---|---|---|---|
| `maxResults` | integer | `50` | Maximum tools to return across all sources (1–200) |
| `crmCapabilities` | array | `[]` | Filter to tools with at least one of: `data-enrichment`, `call-logging`, `pipeline-automation`, `forecasting`, `email-tracking`, `lead-scoring` |
| `crmPlatforms` | array | `[]` | Filter to tools compatible with at least one of: `salesforce`, `hubspot`, `pipedrive`, `zoho`, `microsoft-dynamics` |
| `minRating` | number | `0` | Minimum star rating (0–5) |
| `pricingModel` | string | `"all"` | One of: `free`, `freemium`, `paid`, `enterprise`, `all` |
| `sources` | array | `["g2", "hubspot-marketplace", "appexchange"]` | Which directories to scrape — any subset |

---

## Output

Each item in the dataset follows this shape:

```json
{
  "name": "Gong",
  "vendor": "Gong.io",
  "description": "AI revenue intelligence platform with call recording, deal forecasting, and pipeline risk detection for Salesforce and HubSpot.",
  "crm_capabilities": ["call-logging", "forecasting", "pipeline-automation"],
  "crm_integrations": ["salesforce", "hubspot", "microsoft-dynamics"],
  "pricing_model": "paid",
  "starting_price_usd": 0,
  "rating": 4.7,
  "review_count": 5840,
  "source": "g2",
  "url": "https://www.g2.com/products/gong/reviews",
  "scraped_at": "2026-04-23T15:00:00.000Z"
}
```

The `OUTPUT` key-value store entry wraps results with run metadata:

```json
{
  "results": [...],
  "metadata": {
    "total_results": 31,
    "run_duration_seconds": 12.8,
    "sources_scraped": ["g2", "hubspot-marketplace", "appexchange"]
  }
}
```

---

## Example use cases

- **Salesforce AI add-ons shortlist**: Set `crmPlatforms: ["salesforce"]` and `sources: ["g2", "appexchange"]` to compare AI for Salesforce across both directories — covers native AppExchange tools and third-party options in one pass
- **HubSpot AI tools audit**: Filter `sources: ["hubspot-marketplace"]` to see every AI-powered HubSpot add-on rated 4.0 or above, sorted by review count
- **CRM data enrichment comparison**: Set `crmCapabilities: ["data-enrichment"]` across all sources to compare AI data enrichment tools for Salesforce, HubSpot, and Pipedrive by pricing and rating

---

## How to run

**Via the Apify API:**

```bash
curl -X POST \
  "https://api.apify.com/v2/acts/avinashchby~ai-agents-for-crm/runs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_API_TOKEN>" \
  -d '{
    "maxResults": 50,
    "crmCapabilities": ["data-enrichment", "call-logging"],
    "crmPlatforms": ["salesforce", "hubspot"],
    "minRating": 4.0,
    "pricingModel": "all"
  }'
```

**Via Apify Console:** Open the actor page, click **Start**, fill in the input form, and hit **Run**. Results appear in the **Dataset** tab once the run completes.

---

## About

This actor is maintained by [avinashchby](https://github.com/avinashchby). Built with [Apify SDK v3](https://docs.apify.com/sdk/js/), [Crawlee](https://crawlee.dev/), and Cheerio. If a source changes its markup and results drop to zero, open an issue on GitHub.
