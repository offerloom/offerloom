import { chromium } from "playwright";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

export function productSource(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.port) throw new Error("Invalid product URL");
  if (["amazon.in", "www.amazon.in"].includes(url.hostname)) {
    const asin = url.pathname.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})(?:\/|$)/i)?.[1]?.toUpperCase();
    if (asin) return { merchant: "amazon", id: asin, url: `https://www.amazon.in/dp/${asin}` };
  }
  if (url.hostname === "www.ajio.com") {
    const id = url.pathname.match(/\/p\/(\d+_[a-z0-9]+)\/?$/i)?.[1];
    if (id) return { merchant: "ajio", id, url: url.origin + url.pathname };
  }
  throw new Error("Only Amazon.in and AJIO product pages are supported");
}

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

export function autoSummary(deal) {
  const discount = deal.mrp && deal.mrp > deal.price ? ` (about ${Math.round((1 - deal.price / deal.mrp) * 100)}% off the listed MRP)` : "";
  return `${deal.name}. Seen on Amazon.in at approximately ₹${(deal.price / 100).toFixed(0)}${discount}. Price, stock and specifications are set by Amazon and can change; confirm on the product page before buying.`.slice(0, 1000);
}

export function money(text) {
  if (typeof text !== "string" || !text.trim()) return null;
  const match = text.replace(/,/g, "").match(/(?:₹|Rs\.?|INR)?\s*(\d+(?:\.\d{1,2})?)/i);
  const value = match ? Math.round(Number(match[1]) * 100) : NaN;
  return Number.isSafeInteger(value) && value > 0 && value < 100000000 ? value : null;
}

const HOME_KEYWORDS = /\b(container|containers|bottle|bottles|cookware|kitchen|storage jar|jars?|cooktop|induction|utensil|dinnerware|cutlery|casserole|tiffin|lunch box|flask)\b/i;
const FASHION_KEYWORDS = /\b(backpack|bag|handbag|wallet|shoe|shoes|footwear|sneaker|sandal|trouser|shirt|t-shirt|jacket|dress|saree|kurta|jeans)\b/i;
const BEAUTY_KEYWORDS = /\b(sunscreen|face ?wash|skincare|moisturi[sz]er|serum|shampoo|conditioner|lipstick|makeup|cosmetic|spf)\b/i;
const SPORTS_KEYWORDS = /\b(yoga mat|resistance band|dumbbell|gym|fitness|foam roller|exercise|workout)\b/i;
const BOOKS_KEYWORDS = /\b(paperback|hardcover|hardback|a novel by|book set|books?:)\b/i;
const AUTO_KEYWORDS = /\b(car mount|dashboard|car holder|car mobile holder|windshield|dash ?cam|car accessor)\b/i;

export function categorize(merchant, name) {
  if (merchant === "ajio") return "Fashion";
  if (HOME_KEYWORDS.test(name)) return "Home";
  if (FASHION_KEYWORDS.test(name)) return "Fashion";
  if (BEAUTY_KEYWORDS.test(name)) return "Beauty";
  if (SPORTS_KEYWORDS.test(name)) return "Sports";
  if (BOOKS_KEYWORDS.test(name)) return "Books";
  if (AUTO_KEYWORDS.test(name)) return "Auto";
  return "Electronics";
}

export async function collect(page, sourceUrl) {
  const source = productSource(sourceUrl);
  const response = await page.goto(source.url, { waitUntil: "domcontentloaded", timeout: 30000 });
  if (!response || !response.ok()) throw new Error(`Page unavailable (${response?.status() ?? "no response"})`);
  const final = productSource(page.url());
  if (final.id !== source.id || final.merchant !== source.merchant) throw new Error("Unexpected product redirect");
  const text = (await page.locator("body").innerText()).slice(0, 6000);
  if (/captcha|robot check|access denied|verify you are human|automated access|enter the characters you see/i.test(text)) throw new Error("Access challenge; collection stopped");
  const selectors = source.merchant === "amazon" ? {
    title: "#productTitle", image: "#landingImage, #imgBlkFront",
    price: [
      "#corePriceDisplay_desktop_feature_div .a-price:not(.a-text-price) .a-offscreen",
      "#corePrice_feature_div .a-price:not(.a-text-price) .a-offscreen",
      "#apex_desktop .a-price:not(.a-text-price) .a-offscreen",
      "#tp_price_block_total_price_ww .a-offscreen",
      ".priceToPay .a-offscreen",
    ],
    mrp: ["#corePriceDisplay_desktop_feature_div .a-text-price .a-offscreen", "#apex_desktop .a-text-price .a-offscreen"],
  } : { title: ".prod-name", image: "#myCarousel img", price: [".prod-sp"], mrp: [".prod-cp"] };
  await page.locator(selectors.title).first().waitFor({ state: "visible", timeout: 15000 });
  let name = (await page.locator(selectors.title).first().innerText()).trim();
  const read = async (selector) => await page.locator(selector).first().textContent({ timeout: 3000 }).catch(() => "");
  // Try each candidate selector in order and use the first one with real (non-blank) text —
  // a single comma-joined selector's .first() can land on an earlier, blank placeholder match.
  const readFirst = async (candidates) => {
    for (const selector of candidates) {
      const text = await read(selector);
      if (text && text.trim()) return text;
    }
    return "";
  };
  if (source.merchant === "ajio") name = `${await read(".brand-name")} ${name}`.trim();
  const imageUrl = await page.locator(selectors.image).first().getAttribute("src", { timeout: 3000 }).catch(() => null);
  const price = money(await readFirst(selectors.price));
  const mrp = money(await readFirst(selectors.mrp));
  if (name.length < 3 || !price || !imageUrl?.startsWith("https://")) throw new Error("Missing product title, image or price; no draft created");
  return { sourceUrl: source.url, merchant: source.merchant, merchantProductId: source.id, name: name.slice(0, 300), imageUrl,
    price, mrp: mrp && mrp >= price ? mrp : null, currency: "INR", checkedAt: new Date().toISOString(), category: categorize(source.merchant, name) };
}

async function main() {
  const configPath = process.argv[2];
  if (!configPath) throw new Error("Usage: node scripts/browser-collector.mjs config.json [--watch]");
  const config = JSON.parse(await readFile(configPath, "utf8"));
  if (!Array.isArray(config.urls) || !config.urls.length || config.urls.length > 25) throw new Error("Configure 1–25 product URLs");
  config.urls.forEach(productSource);
  const intervalHours = Number(config.intervalHours ?? 6);
  if (!Number.isFinite(intervalHours) || intervalHours < 1 || intervalHours > 168) throw new Error("intervalHours must be 1–168");
  const endpoint = process.env.OFFERLOOM_COLLECTOR_ENDPOINT;
  if (endpoint) {
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || url.hostname !== "offerloom.contact-offerloom.workers.dev" || url.pathname !== "/api/admin/collected-deals") throw new Error("Unapproved ingestion endpoint");
    if (!process.env.OFFERLOOM_ADMIN_TOKEN) throw new Error("OFFERLOOM_ADMIN_TOKEN is required for server ingestion");
  }
  await mkdir("outputs/collector", { recursive: true });
  do {
    const browser = await chromium.launch({ headless: !process.argv.includes("--headed"), ...(process.env.OFFERLOOM_CHROME_CHANNEL ? { channel: process.env.OFFERLOOM_CHROME_CHANNEL } : {}) });
    const results = [], errors = [];
    try {
      for (const url of config.urls) {
        const page = await browser.newPage();
        try {
          // Never follow navigations outside the merchant's public web domain.
          await page.route("**/*", async (route) => {
            const request = route.request();
            if (request.isNavigationRequest()) {
              const host = new URL(request.url()).hostname;
              if (!["www.amazon.in", "amazon.in", "www.ajio.com"].includes(host)) return route.abort();
            }
            return route.continue();
          });
          results.push(await collect(page, url));
        } catch (error) {
          // Keep the real reason (timeout, missing selector, etc.) instead of a generic
          // message — when every URL fails identically it's the only way to tell "Amazon
          // changed the page" from "this runner's IP is being challenged" from a real bug.
          const known = error.message.startsWith("Page unavailable") || error.message.startsWith("Access challenge") || error.message.startsWith("Missing product title");
          errors.push({ sourceUrl: productSource(url).url, error: known ? error.message : `Product could not be collected: ${error.message}`.slice(0, 300) });
        }
        finally { await page.close(); }
        // Space out requests so a multi-product run reads like ordinary browsing, not a scraping burst.
        if (url !== config.urls[config.urls.length - 1]) await new Promise((resolve) => setTimeout(resolve, 4000 + Math.random() * 4000));
      }
    } finally { await browser.close(); }
    await writeFile("outputs/collector/latest.json", JSON.stringify({ deals: results }, null, 2), { mode: 0o600 });
    await writeFile("outputs/collector/status.json", JSON.stringify({ checkedAt: new Date().toISOString(), collected: results.length, errors }, null, 2), { mode: 0o600 });
    if (endpoint && results.length) {
      const response = await fetch(endpoint, { method: "POST", redirect: "error", signal: AbortSignal.timeout(30000), headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OFFERLOOM_ADMIN_TOKEN}` }, body: JSON.stringify({ action: "ingest", deals: results }) });
      if (!response.ok) throw new Error(`Draft ingestion failed (${response.status})`);
    }
    let newlyAdded = [];
    if (process.argv.includes("--d1-remote")) {
      // Owner-operated alternative when Wrangler is already authenticated. Only stage drafts.
      const autoApprove = process.argv.includes("--auto-approve");
      const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;

      // Figure out which of this run's Amazon deals are brand-new products (not already in
      // the catalog) before upserting, so the sync summary can report "added" vs "refreshed".
      const candidateIds = results.filter((deal) => deal.merchant === "amazon" && autoApprove).map((deal) => `amazon-${deal.merchantProductId.toLowerCase()}`);
      const existingIds = new Set();
      if (candidateIds.length) {
        const { stdout } = await promisify(execFile)("npx", ["--no-install", "wrangler", "d1", "execute", "offerloom", "--remote", "--json", "--command", `SELECT id FROM products WHERE id IN (${candidateIds.map(quote).join(",")});`], { timeout: 60000 });
        for (const row of JSON.parse(stdout)[0]?.results ?? []) existingIds.add(row.id);
      }

      const statements = results.map((deal) => {
        const dealId = `${deal.merchant}-${deal.merchantProductId}`;
        const now = new Date().toISOString();
        if (deal.merchant !== "amazon" || !autoApprove) {
          return `INSERT INTO collected_deals (id,payload,status,updated_at) VALUES (${quote(dealId)},${quote(JSON.stringify(deal))},'pending',${quote(now)}) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,status='pending',updated_at=excluded.updated_at;`;
        }
        // Amazon only: the tagged affiliate URL is deterministic from the ASIN, so it is safe to
        // auto-generate. AJIO needs a per-product ACE dashboard deep link and stays in review.
        const productId = `amazon-${deal.merchantProductId.toLowerCase()}`;
        const categorySlug = slugify(deal.category);
        const affiliateUrl = `https://www.amazon.in/dp/${deal.merchantProductId}?tag=offerloom-21`;
        const summary = autoSummary(deal);
        if (!existingIds.has(productId)) newlyAdded.push({ name: deal.name, price: deal.price, mrp: deal.mrp, category: deal.category, productId });
        return [
          `INSERT INTO collected_deals (id,payload,approved_payload,product_id,status,updated_at) VALUES (${quote(dealId)},${quote(JSON.stringify(deal))},${quote(JSON.stringify(deal))},${quote(productId)},'approved',${quote(now)}) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,approved_payload=excluded.approved_payload,product_id=excluded.product_id,status='approved',updated_at=excluded.updated_at;`,
          `INSERT INTO categories (id,name,slug,position,created_at) VALUES (${quote(`cat-${categorySlug}`)},${quote(deal.category)},${quote(categorySlug)},0,${quote(now)}) ON CONFLICT(slug) DO NOTHING;`,
          `INSERT INTO products (id,category_id,name,slug,summary,image_url,specs_json,status,source,created_at,updated_at,published_at) VALUES (${quote(productId)},(SELECT id FROM categories WHERE slug=${quote(categorySlug)}),${quote(deal.name)},${quote(`${slugify(deal.name)}-${productId.slice(0, 8)}`)},${quote(summary)},${quote(deal.imageUrl)},'[]','published','browser_auto',${quote(now)},${quote(now)},${quote(now)}) ON CONFLICT(id) DO UPDATE SET name=excluded.name,summary=excluded.summary,image_url=excluded.image_url,status='published',source='browser_auto',updated_at=excluded.updated_at,published_at=excluded.published_at;`,
          `INSERT INTO merchant_listings (id,product_id,merchant,merchant_product_id,source_url,affiliate_url,status,last_checked_at,created_at,updated_at) VALUES (${quote(crypto.randomUUID())},${quote(productId)},'amazon',${quote(deal.merchantProductId)},${quote(deal.sourceUrl)},${quote(affiliateUrl)},'active',${quote(deal.checkedAt)},${quote(now)},${quote(now)}) ON CONFLICT(merchant,merchant_product_id) DO UPDATE SET product_id=excluded.product_id,affiliate_url=excluded.affiliate_url,last_checked_at=excluded.last_checked_at,updated_at=excluded.updated_at;`,
        ].join("\n");
      });
      for (const merchant of new Set(config.urls.map((url) => productSource(url).merchant))) {
        const failures = errors.filter((error) => productSource(error.sourceUrl).merchant === merchant);
        const count = results.filter((deal) => deal.merchant === merchant).length;
        const now = quote(new Date().toISOString());
        statements.push(`INSERT INTO sync_runs (merchant_id,status,products_seen,products_updated,error_message,started_at,finished_at) VALUES (${quote(merchant)},${quote(failures.length ? "failed" : "succeeded")},${count+failures.length},${count},${failures.length ? quote(failures.map((failure) => failure.error).join("; ")) : "NULL"},${now},${now});`);
      }
      const sql = statements.join("\n");
      await writeFile("outputs/collector/drafts.sql", sql, { mode: 0o600 });
      await promisify(execFile)("npx", ["--no-install", "wrangler", "d1", "execute", "offerloom", "--remote", "--file", "outputs/collector/drafts.sql"], { timeout: 180000 });
    }
    await writeFile("outputs/collector/summary.json", JSON.stringify({
      checkedAt: new Date().toISOString(),
      collected: results.length,
      errors: errors.length,
      newlyAdded,
      refreshed: results.length - newlyAdded.length,
    }, null, 2), { mode: 0o600 });
    console.log(JSON.stringify({ collected: results.length, blockedOrUnavailable: errors.length, draftsSent: Boolean((endpoint || process.argv.includes("--d1-remote")) && results.length) }));
    if (!process.argv.includes("--watch")) break;
    await new Promise((resolve) => setTimeout(resolve, intervalHours * 3600000));
  } while (process.argv.includes("--watch"));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(async (error) => {
  console.error("Collector failed. Check configuration, browser installation and endpoint access. No credentials logged.");
  // Local-only diagnostic (gitignored, never printed to the console log above) — no credentials pass through this code path.
  await writeFile("outputs/collector/last-error.log", `${new Date().toISOString()} ${error?.message ?? error}\n`, { mode: 0o600 }).catch(() => {});
  process.exitCode = 1;
});
