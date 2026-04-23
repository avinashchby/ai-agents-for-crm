import { Actor } from 'apify';
import { CheerioCrawler, PlaywrightCrawler, sleep } from 'crawlee';
import type { CheerioAPI } from 'cheerio';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Input {
  maxResults?: number;
  crmPlatform?: 'salesforce' | 'hubspot' | 'pipedrive' | 'all';
  capabilities?: string[];
  minRating?: number;
  pricingModel?: 'free' | 'freemium' | 'paid' | 'all';
}

interface CrmTool {
  name: string;
  vendor: string;
  description: string;
  crm_compatibility: string[];
  capabilities: string[];
  pricing_model: string;
  starting_price_usd: number | null;
  rating: number | null;
  review_count: number | null;
  source: string;
  url: string;
  scraped_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CAPABILITY_KEYWORDS: Record<string, string[]> = {
  'data-enrichment': ['enrich', 'enrichment', 'data quality', 'contact data', 'firmographic'],
  'email-drafting': ['email draft', 'email writing', 'compose email', 'email generation', 'outreach'],
  'forecasting': ['forecast', 'pipeline health', 'deal risk', 'revenue prediction', 'predict'],
  'call-logging': ['call log', 'call recording', 'call notes', 'conversation intelligence', 'gong'],
};

const CRM_KEYWORDS: Record<string, string[]> = {
  salesforce: ['salesforce', 'sfdc', 'sales cloud', 'service cloud', 'appexchange'],
  hubspot: ['hubspot', 'hubs pot', 'hub spot'],
  pipedrive: ['pipedrive'],
};

/** Infer capabilities from a free-text description. */
function inferCapabilities(text: string): string[] {
  const lower = text.toLowerCase();
  return Object.entries(CAPABILITY_KEYWORDS)
    .filter(([, keywords]) => keywords.some((kw) => lower.includes(kw)))
    .map(([cap]) => cap);
}

/** Infer CRM compatibility from a free-text description. */
function inferCrmCompatibility(text: string): string[] {
  const lower = text.toLowerCase();
  return Object.entries(CRM_KEYWORDS)
    .filter(([, keywords]) => keywords.some((kw) => lower.includes(kw)))
    .map(([crm]) => crm.charAt(0).toUpperCase() + crm.slice(1));
}

/** Parse a rating string like "4.5" or "4.5 out of 5" into a number. */
function parseRating(raw: string | undefined): number | null {
  if (!raw) return null;
  const match = raw.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

/** Parse a review count string like "1,234 reviews" into a number. */
function parseReviewCount(raw: string | undefined): number | null {
  if (!raw) return null;
  const digits = raw.replace(/[^0-9]/g, '');
  return digits.length > 0 ? parseInt(digits, 10) : null;
}

/** Normalise pricing text to one of: free | freemium | paid | unknown. */
function normalisePricing(raw: string | undefined): string {
  if (!raw) return 'unknown';
  const lower = raw.toLowerCase();
  if (lower.includes('free trial') || lower.includes('freemium')) return 'freemium';
  if (lower.includes('free')) return 'free';
  if (lower.match(/\$\d+/) || lower.includes('paid') || lower.includes('pricing')) return 'paid';
  return 'unknown';
}

/** Extract a USD starting price from strings like "$49/mo" or "From $99". */
function extractStartingPrice(raw: string | undefined): number | null {
  if (!raw) return null;
  const match = raw.match(/\$\s*(\d+(?:,\d{3})*(?:\.\d+)?)/);
  if (!match) return null;
  return parseFloat(match[1].replace(/,/g, ''));
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

function applyFilters(tools: CrmTool[], input: Required<Input>): CrmTool[] {
  return tools.filter((tool) => {
    // minRating
    if (input.minRating > 0) {
      if (tool.rating === null || tool.rating < input.minRating) return false;
    }

    // pricingModel
    if (input.pricingModel !== 'all' && tool.pricing_model !== input.pricingModel) {
      return false;
    }

    // crmPlatform
    if (input.crmPlatform !== 'all') {
      const platform = input.crmPlatform.charAt(0).toUpperCase() + input.crmPlatform.slice(1);
      if (!tool.crm_compatibility.includes(platform)) return false;
    }

    // capabilities (at least one must match)
    if (input.capabilities.length > 0) {
      const hasMatch = input.capabilities.some((cap) => tool.capabilities.includes(cap));
      if (!hasMatch) return false;
    }

    return true;
  });
}

// ---------------------------------------------------------------------------
// G2 scraper (Cheerio)
// ---------------------------------------------------------------------------

async function scrapeG2(
  proxyConfiguration: Awaited<ReturnType<typeof Actor.createProxyConfiguration>>,
): Promise<CrmTool[]> {
  const results: CrmTool[] = [];

  const crawler = new CheerioCrawler({
    proxyConfiguration,
    requestHandlerTimeoutSecs: 30,
    maxRequestRetries: 2,
    async requestHandler({ $, request }: { $: CheerioAPI; request: { url: string } }) {
      // G2 product cards on the CRM category page
      $('[data-product-name], .product-listing, .js-log-click[data-product-id]').each((_, el) => {
        const card = $(el);

        const name = (
          card.find('[data-product-name]').first().text() ||
          card.find('.product-name').first().text() ||
          card.find('h3').first().text()
        ).trim();

        if (!name) return;

        const description = card.find('.product-description, p.mb-0, .line-clamp-2').first().text().trim();
        const vendor = card.find('.vendor-name, .by-star').first().text().replace(/^by\s*/i, '').trim();
        const ratingRaw = card.find('[title*="out of 5"], .fw-semibold, .product-rating').first().attr('title')
          ?? card.find('.fw-semibold').first().text().trim();
        const reviewRaw = card.find('.ratings-count, .review-count').first().text().trim();
        const pricingRaw = card.find('.price-info, .pricing-options').first().text().trim();
        const relativeUrl = card.find('a[href*="/products/"]').first().attr('href') ?? '';
        const url = relativeUrl.startsWith('http') ? relativeUrl : `https://www.g2.com${relativeUrl}`;

        const combined = `${name} ${description}`;

        results.push({
          name,
          vendor: vendor || name,
          description,
          crm_compatibility: inferCrmCompatibility(combined),
          capabilities: inferCapabilities(combined),
          pricing_model: normalisePricing(pricingRaw),
          starting_price_usd: extractStartingPrice(pricingRaw),
          rating: parseRating(ratingRaw),
          review_count: parseReviewCount(reviewRaw),
          source: 'g2',
          url: url || request.url,
          scraped_at: new Date().toISOString(),
        });
      });
    },
  });

  await crawler.run([
    { url: 'https://www.g2.com/categories/crm?filters%5Bfacets%5D%5BaiBadge%5D%5B%5D=1' },
  ]);

  await sleep(2000);
  return results;
}

// ---------------------------------------------------------------------------
// HubSpot Marketplace scraper (Playwright)
// ---------------------------------------------------------------------------

async function scrapeHubSpotMarketplace(
  proxyConfiguration: Awaited<ReturnType<typeof Actor.createProxyConfiguration>>,
): Promise<CrmTool[]> {
  const results: CrmTool[] = [];

  const crawler = new PlaywrightCrawler({
    proxyConfiguration,
    requestHandlerTimeoutSecs: 60,
    maxRequestRetries: 2,
    headless: true,
    async requestHandler({ page }) {
      // Wait for app listing cards to render
      await page.waitForSelector('[data-test-id="app-card"], .app-card, .listing-card', {
        timeout: 20000,
      }).catch(() => null);

      const items = await page.$$('[data-test-id="app-card"], .app-card, .listing-card');

      for (const item of items) {
        const name = (await item.$eval(
          'h3, .app-name, [data-test-id="app-name"]',
          (el) => el.textContent?.trim() ?? '',
        ).catch(() => ''));

        if (!name) continue;

        const description = await item.$eval(
          'p, .app-description, [data-test-id="app-description"]',
          (el) => el.textContent?.trim() ?? '',
        ).catch(() => '');

        const vendor = await item.$eval(
          '.vendor, .developer-name, [data-test-id="developer-name"]',
          (el) => el.textContent?.trim() ?? '',
        ).catch(() => '');

        const ratingRaw = await item.$eval(
          '[aria-label*="stars"], .rating, .star-rating',
          (el) => el.getAttribute('aria-label') ?? el.textContent?.trim() ?? '',
        ).catch(() => '');

        const reviewRaw = await item.$eval(
          '.review-count, .reviews',
          (el) => el.textContent?.trim() ?? '',
        ).catch(() => '');

        const href = await item.$eval('a', (el) => el.getAttribute('href') ?? '').catch(() => '');
        const url = href.startsWith('http') ? href : `https://ecosystem.hubspot.com${href}`;

        const combined = `${name} ${description} hubspot`;

        results.push({
          name,
          vendor: vendor || name,
          description,
          crm_compatibility: ['HubSpot', ...inferCrmCompatibility(description)],
          capabilities: inferCapabilities(combined),
          pricing_model: 'unknown',
          starting_price_usd: null,
          rating: parseRating(ratingRaw),
          review_count: parseReviewCount(reviewRaw),
          source: 'hubspot_marketplace',
          url,
          scraped_at: new Date().toISOString(),
        });
      }
    },
  });

  await crawler.run([
    { url: 'https://ecosystem.hubspot.com/marketplace/apps/search?query=ai+agent' },
  ]);

  await sleep(2000);
  return results;
}

// ---------------------------------------------------------------------------
// Salesforce AppExchange scraper (Playwright)
// ---------------------------------------------------------------------------

async function scrapeSalesforceAppExchange(
  proxyConfiguration: Awaited<ReturnType<typeof Actor.createProxyConfiguration>>,
): Promise<CrmTool[]> {
  const results: CrmTool[] = [];

  const crawler = new PlaywrightCrawler({
    proxyConfiguration,
    requestHandlerTimeoutSecs: 60,
    maxRequestRetries: 2,
    headless: true,
    async requestHandler({ page }) {
      await page.waitForSelector('.listing-card, .appx-tile, [class*="ListingCard"]', {
        timeout: 25000,
      }).catch(() => null);

      const cards = await page.$$('.listing-card, .appx-tile, [class*="ListingCard"]');

      for (const card of cards) {
        const name = await card.$eval(
          'h3, h2, [class*="title"], [class*="name"]',
          (el) => el.textContent?.trim() ?? '',
        ).catch(() => '');

        if (!name) continue;

        const description = await card.$eval(
          'p, [class*="description"], [class*="summary"]',
          (el) => el.textContent?.trim() ?? '',
        ).catch(() => '');

        const vendor = await card.$eval(
          '[class*="vendor"], [class*="provider"], [class*="publisher"]',
          (el) => el.textContent?.trim() ?? '',
        ).catch(() => '');

        const ratingRaw = await card.$eval(
          '[aria-label*="stars"], [class*="rating"], [class*="star"]',
          (el) => el.getAttribute('aria-label') ?? el.textContent?.trim() ?? '',
        ).catch(() => '');

        const reviewRaw = await card.$eval(
          '[class*="review"], [class*="count"]',
          (el) => el.textContent?.trim() ?? '',
        ).catch(() => '');

        const pricingRaw = await card.$eval(
          '[class*="price"], [class*="pricing"]',
          (el) => el.textContent?.trim() ?? '',
        ).catch(() => '');

        const href = await card.$eval('a', (el) => el.getAttribute('href') ?? '').catch(() => '');
        const url = href.startsWith('http')
          ? href
          : `https://appexchange.salesforce.com${href}`;

        const combined = `${name} ${description} salesforce`;

        results.push({
          name,
          vendor: vendor || name,
          description,
          crm_compatibility: ['Salesforce', ...inferCrmCompatibility(description)],
          capabilities: inferCapabilities(combined),
          pricing_model: normalisePricing(pricingRaw),
          starting_price_usd: extractStartingPrice(pricingRaw),
          rating: parseRating(ratingRaw),
          review_count: parseReviewCount(reviewRaw),
          source: 'salesforce_appexchange',
          url,
          scraped_at: new Date().toISOString(),
        });
      }
    },
  });

  await crawler.run([
    {
      url: 'https://appexchange.salesforce.com/appxSearchKeywordResults?keywords=ai+agent&sortOrder=MOST_REVIEWS',
    },
  ]);

  await sleep(2000);
  return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

await Actor.init();

const startTime = Date.now();

const rawInput = await Actor.getInput<Input>();

// Apply defaults
const input: Required<Input> = {
  maxResults: rawInput?.maxResults ?? 25,
  crmPlatform: rawInput?.crmPlatform ?? 'all',
  capabilities: rawInput?.capabilities ?? [],
  minRating: rawInput?.minRating ?? 0,
  pricingModel: rawInput?.pricingModel ?? 'all',
};

Actor.log.info('Starting AI CRM Agent Finder', { input });

const proxyConfiguration = await Actor.createProxyConfiguration();

const sourceResults: Record<string, CrmTool[]> = {
  g2: [],
  hubspot_marketplace: [],
  salesforce_appexchange: [],
};

// --- G2 ---
try {
  Actor.log.info('Scraping G2...');
  sourceResults.g2 = await scrapeG2(proxyConfiguration);
  Actor.log.info(`G2: ${sourceResults.g2.length} raw results`);
} catch (err) {
  Actor.log.error('G2 scrape failed', { err });
}

// --- HubSpot Marketplace ---
try {
  Actor.log.info('Scraping HubSpot Marketplace...');
  sourceResults.hubspot_marketplace = await scrapeHubSpotMarketplace(proxyConfiguration);
  Actor.log.info(`HubSpot Marketplace: ${sourceResults.hubspot_marketplace.length} raw results`);
} catch (err) {
  Actor.log.error('HubSpot Marketplace scrape failed', { err });
}

// --- Salesforce AppExchange ---
try {
  Actor.log.info('Scraping Salesforce AppExchange...');
  sourceResults.salesforce_appexchange = await scrapeSalesforceAppExchange(proxyConfiguration);
  Actor.log.info(`Salesforce AppExchange: ${sourceResults.salesforce_appexchange.length} raw results`);
} catch (err) {
  Actor.log.error('Salesforce AppExchange scrape failed', { err });
}

// Merge, deduplicate by name (case-insensitive), filter, and cap
const allRaw = [
  ...sourceResults.g2,
  ...sourceResults.hubspot_marketplace,
  ...sourceResults.salesforce_appexchange,
];

const seen = new Set<string>();
const deduplicated = allRaw.filter((tool) => {
  const key = tool.name.toLowerCase();
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

const filtered = applyFilters(deduplicated, input);
const results = filtered.slice(0, input.maxResults);

const sourcesScraped = Object.entries(sourceResults)
  .filter(([, items]) => items.length > 0)
  .map(([source]) => source);

const runDurationSeconds = parseFloat(((Date.now() - startTime) / 1000).toFixed(1));

Actor.log.info(`Pushing ${results.length} results to dataset`);
await Actor.pushData(results);

await Actor.setValue('OUTPUT', {
  results,
  metadata: {
    total_results: results.length,
    run_duration_seconds: runDurationSeconds,
    sources_scraped: sourcesScraped,
  },
});

Actor.log.info('Done', { total_results: results.length, run_duration_seconds: runDurationSeconds });

await Actor.exit();
