import { chromium } from "playwright";
import { readFile, writeFile, appendFile, mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { lookup } from "node:dns/promises";

const ALLOWED_IMAGE_HOSTS = {
  amazon: ["m.media-amazon.com", "images-na.ssl-images-amazon.com", "images-eu.ssl-images-amazon.com"],
  ajio: ["assets.ajio.com", "assets-jiocdn.ajio.com"],
};

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

const HOME_KEYWORDS = /\b(container|containers|bottle|bottles|cookware|kitchen|storage jar|jars?|cooktop|induction|utensil|dinnerware|cutlery|casserole|tiffin|lunch box|flask|garbage bags?|trash bags?|weighing (machine|scale))\b/i;
const FASHION_KEYWORDS = /\b(backpack|bag|handbag|wallet|shoe|shoes|footwear|sneaker|sandal|trouser|shirt|t-shirt|jacket|dress|saree|kurta|jeans)\b/i;
const BEAUTY_KEYWORDS = /\b(sunscreen|face ?wash|skincare|moisturi[sz]er|serum|shampoo|conditioner|lipstick|makeup|cosmetic|spf)\b/i;
const SPORTS_KEYWORDS = /\b(yoga mat|resistance band|dumbbell|gym|fitness|foam roller|exercise|workout)\b/i;
const BOOKS_KEYWORDS = /\b(paperback|hardcover|hardback|a novel by|book set|books?:|books?)\b/i;
const AUTO_KEYWORDS = /\b(car mount|dashboard|car holder|car mobile holder|windshield|dash ?cam|car accessor)\b/i;
const TOYS_KEYWORDS = /\b(board game|card game|strategy game|puzzle|jigsaw|action figure|building blocks|soft toy|stuffed toy|remote control car|rc car|toys?)\b/i;

export function categorize(merchant, name, id = "") {
  if (merchant === "ajio") return "Fashion";
  // An all-numeric Amazon ASIN is an ISBN-10, i.e. a book — many book titles ("Atomic Habits: Tiny
  // Changes, Remarkable Results") contain none of the BOOKS_KEYWORDS and would land in Electronics.
  if (merchant === "amazon" && /^\d{9}[\dX]$/i.test(id)) return "Books";
  if (HOME_KEYWORDS.test(name)) return "Home";
  if (FASHION_KEYWORDS.test(name)) return "Fashion";
  if (BEAUTY_KEYWORDS.test(name)) return "Beauty";
  if (SPORTS_KEYWORDS.test(name)) return "Sports";
  if (BOOKS_KEYWORDS.test(name)) return "Books";
  if (AUTO_KEYWORDS.test(name)) return "Auto";
  if (TOYS_KEYWORDS.test(name)) return "Toys";
  return "Electronics";
}

// Selector lists are tried in priority order and the first element with real digits wins.
// Amazon serves several price layouts; when the collector reports "Missing product title, image
// or price" the failure diagnostics in outputs/collector/failures/ show which layout it met.
const SELECTORS = {
  amazon: {
    title: "#productTitle",
    image: ["#landingImage", "#imgBlkFront", "#ebooksImgBlkFront", "#imgTagWrapperId img", "#main-image-container img"],
    price: [
      "#corePriceDisplay_desktop_feature_div .a-price:not(.a-text-price) .a-offscreen",
      "#corePrice_feature_div .a-price:not(.a-text-price) .a-offscreen",
      "#apex_desktop .a-price:not(.a-text-price) .a-offscreen",
      "#tp_price_block_total_price_ww .a-offscreen",
      ".priceToPay .a-offscreen",
      // Variant ("twister") layout, e.g. B0B6HM36Z8 on 20 Sep 2026: no #corePrice*/#apex_desktop
      // wrapper, and the price-to-pay span carries the a-text-price class, so the selectors above
      // never matched. The accessibility label reads "₹299.00 with 63 percent saving".
      "#apex_price .apex-pricetopay-value .a-offscreen",
      "#apex_price .apex-pricetopay-accessibility-label",
      "#apex_price .a-price:not(.a-text-price) .a-offscreen",
      "#buybox .a-price:not(.a-text-price) .a-offscreen",
    ],
    mrp: [
      "#corePriceDisplay_desktop_feature_div .a-text-price .a-offscreen",
      "#apex_desktop .a-text-price .a-offscreen",
      "#apex_price .apex-basisprice-value .a-offscreen",
      "#corePrice_feature_div .a-text-price .a-offscreen",
    ],
  },
  ajio: { title: ".prod-name", image: ["#myCarousel img"], price: [".prod-sp"], mrp: [".prod-cp"] },
};

const CHALLENGE = /captcha|robot check|access denied|verify you are human|automated access|enter the characters you see/i;
const UNAVAILABLE = /currently unavailable|temporarily out of stock|out of stock/i;

// Runs inside the page: first non-empty text that contains a digit, across all matches of each selector.
function firstTextWithDigits(list) {
  for (const selector of list) {
    for (const el of document.querySelectorAll(selector)) {
      const text = (el.textContent || "").trim();
      if (/\d/.test(text)) return text;
    }
  }
  return "";
}

function firstHttpsImage(list) {
  for (const selector of list) {
    const el = document.querySelector(selector);
    for (const value of [el?.getAttribute("src"), el?.getAttribute("data-old-hires")]) if (value && value.startsWith("https://")) return value;
  }
  const og = document.querySelector('meta[property="og:image"]')?.getAttribute("content");
  return og && og.startsWith("https://") ? og : null;
}

export function imageAllowed(merchant, imageUrl) {
  try {
    const url = new URL(imageUrl);
    return url.protocol === "https:" && !url.username && !url.password && !url.port && (ALLOWED_IMAGE_HOSTS[merchant] ?? []).includes(url.hostname);
  } catch { return false; }
}

export async function collect(page, sourceUrl) {
  const source = productSource(sourceUrl);
  // "commit" resolves as soon as Amazon's response arrives. Waiting for domcontentloaded inside
  // goto() was the source of the 45 s timeouts: the document can be slow to finish parsing behind
  // Amazon's bot-mitigation script even though the product is perfectly readable.
  const response = await page.goto(source.url, { waitUntil: "commit", timeout: 60000 });
  if (!response || !response.ok()) throw new Error(`Page unavailable (${response?.status() ?? "no response"})`);
  const final = productSource(page.url());
  if (final.id !== source.id || final.merchant !== source.merchant) throw new Error("Unexpected product redirect");
  try { await page.waitForLoadState?.("domcontentloaded", { timeout: 20000 }); } catch { /* best effort; the title wait below is the real gate */ }
  const text = (await page.locator("body").innerText()).slice(0, 6000);
  if (CHALLENGE.test(text)) throw new Error("Access challenge; collection stopped");
  const selectors = SELECTORS[source.merchant];
  // Amazon sometimes gates first paint behind a bot-mitigation JS challenge that resolves on
  // its own after several seconds — give it real time before treating a slow page as a failure.
  await page.locator(selectors.title).first().waitFor({ state: "visible", timeout: 35000 });
  let name = (await page.locator(selectors.title).first().innerText()).trim();
  // The price block renders after the title. Wait until a price-shaped value is actually present
  // instead of reading immediately (which raced the render and returned blanks).
  // An explicit "Currently unavailable" notice also ends the wait: no price is coming.
  await page.waitForFunction((list) => list.some((selector) => [...document.querySelectorAll(selector)].some((el) => /\d/.test(el.textContent || "")))
    || /currently unavailable|temporarily out of stock/i.test(document.querySelector("#availability, #outOfStock")?.textContent || ""), selectors.price, { timeout: 15000 }).catch(() => {});
  if (source.merchant === "ajio") {
    const brand = await page.locator(".brand-name").first().textContent({ timeout: 3000 }).catch(() => "");
    name = `${brand ?? ""} ${name}`.trim();
  }
  const imageUrl = await page.evaluate(firstHttpsImage, selectors.image);
  const price = money(await page.evaluate(firstTextWithDigits, selectors.price));
  const mrp = money(await page.evaluate(firstTextWithDigits, selectors.mrp));
  if (!price) {
    const bodyText = (await page.locator("body").innerText().catch(() => "")).slice(0, 20000);
    const availability = await page.locator("#availability, #outOfStock, #buybox").first().innerText({ timeout: 2000 }).catch(() => "");
    if (UNAVAILABLE.test(availability) || (!/₹\s?\d/.test(bodyText) && UNAVAILABLE.test(bodyText))) throw new Error("Currently unavailable; no draft created");
  }
  if (name.length < 3 || !price || !imageUrl?.startsWith("https://")) throw new Error("Missing product title, image or price; no draft created");
  if (!imageAllowed(source.merchant, imageUrl)) throw new Error("Product image is not on an approved merchant image host; no draft created");
  return { sourceUrl: source.url, merchant: source.merchant, merchantProductId: source.id, name: name.slice(0, 300), imageUrl,
    price, mrp: mrp && mrp >= price ? mrp : null, currency: "INR", checkedAt: new Date().toISOString(), category: categorize(source.merchant, name, source.id) };
}

// --- Retry, connectivity and diagnostics -------------------------------------------------------

// Permanent outcomes: retrying would only add load on Amazon (a challenge page, a listing that now
// belongs to another ASIN, or a product with no buy-box price) without changing the answer.
export function isTransientError(message) {
  if (/^(Access challenge|Unexpected product redirect|Currently unavailable|Product image is not on an approved)/i.test(message)) return false;
  if (/^Page unavailable \((4\d\d)\)/.test(message) && !/\(429\)/.test(message)) return false;
  return /Timeout|timed out|net::ERR_|Page unavailable|Missing product title|Target (page|closed)|Navigation failed/i.test(message);
}

export function isNetworkError(message) {
  return /ERR_NETWORK_CHANGED|ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED|ERR_NETWORK_ACCESS_DENIED|ERR_CONNECTION_(RESET|CLOSED|REFUSED|TIMED_OUT)|ERR_ADDRESS_UNREACHABLE/i.test(message);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// After a Wi-Fi/VPN switch or wake from sleep, wait until DNS answers again instead of burning retries.
export async function waitForNetwork({ resolve = () => lookup("www.amazon.in"), pause = sleep, maxWaitMs = 120000, stepMs = 5000 } = {}) {
  for (let waited = 0; waited <= maxWaitMs; waited += stepMs) {
    try { await resolve(); return true; } catch { await pause(stepMs); }
  }
  return false;
}

// attempt(n) performs one full fetch on a fresh page and throws on failure.
export async function withRetry(attempt, { maxAttempts = 3, delaysMs = [8000, 25000], pause = sleep, onRetry = async () => {}, checkNetwork = waitForNetwork, retryable = isTransientError } = {}) {
  let lastError;
  for (let n = 1; n <= maxAttempts; n += 1) {
    try { return await attempt(n); } catch (error) {
      lastError = error;
      const message = String(error?.message ?? error);
      // "Missing product title..." is usually a selector gap, not a hiccup: one retry, not three.
      const limit = /^Missing product title/.test(message) ? Math.min(2, maxAttempts) : maxAttempts;
      if (n >= limit || !retryable(message)) throw error;
      await onRetry(n, message);
      if (isNetworkError(message)) await checkNetwork();
      await pause((delaysMs[Math.min(n - 1, delaysMs.length - 1)] ?? 8000) + Math.random() * 2000);
    }
  }
  throw lastError;
}

// Best effort and local-only (outputs/ is gitignored): what page did we actually get, and where on it is a price?
export async function saveFailureDiagnostics(page, source, message, dir = "outputs/collector/failures") {
  try {
    await mkdir(dir, { recursive: true });
    const info = await page.evaluate(() => ({
      finalUrl: location.href,
      title: document.title,
      hasProductTitle: Boolean(document.querySelector("#productTitle")),
      availability: (document.querySelector("#availability, #outOfStock")?.textContent || "").trim().slice(0, 120),
      // Leaf elements whose text starts with a rupee amount, with their ancestry: shows where the price lives.
      priceCandidates: [...document.querySelectorAll("#ppd *, #centerCol *, #buybox *")]
        .filter((el) => el.children.length === 0 && /^\s*₹\s?[\d,]+/.test(el.textContent || "")).slice(0, 8)
        .map((el) => {
          const chain = []; let node = el;
          for (let i = 0; i < 4 && node; i += 1, node = node.parentElement) chain.push(node.tagName.toLowerCase() + (node.id ? `#${node.id}` : "") + (typeof node.className === "string" && node.className ? `.${node.className.trim().split(/\s+/).slice(0, 2).join(".")}` : ""));
          return `${(el.textContent || "").trim().slice(0, 40)} | ${chain.join(" < ")}`;
        }),
      bodyStart: (document.body?.innerText || "").slice(0, 300),
    })).catch(() => ({ note: "page not readable" }));
    await writeFile(`${dir}/${source.id}.json`, JSON.stringify({ at: new Date().toISOString(), error: message, ...info }, null, 2), { mode: 0o600 });
    await page.screenshot({ path: `${dir}/${source.id}.png`, timeout: 5000 }).catch(() => {});
  } catch { /* diagnostics must never mask the real error */ }
}

async function main() {
  const configPath = process.argv[2];
  if (!configPath) throw new Error("Usage: node scripts/browser-collector.mjs config.json [--watch]");
  const config = JSON.parse(await readFile(configPath, "utf8"));
  if (!Array.isArray(config.urls) || !config.urls.length) throw new Error("Configure at least 1 product URL");
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
  const progressLog = "outputs/collector/progress.log";
  const logProgress = async (line) => {
    const stamped = `${new Date().toISOString()} ${line}`;
    console.error(stamped); // visible when run in the foreground or tailed via 2>&1
    await appendFile(progressLog, stamped + "\n", { mode: 0o600 }).catch(() => {});
  };
  do {
    await writeFile(progressLog, "", { mode: 0o600 }).catch(() => {}); // reset at the start of each run
    await logProgress(`Starting run: ${config.urls.length} URLs`);
    const browser = await chromium.launch({ headless: !process.argv.includes("--headed"), ...(process.env.OFFERLOOM_CHROME_CHANNEL ? { channel: process.env.OFFERLOOM_CHROME_CHANNEL } : {}) });
    const results = [], errors = [];
    try {
      let index = 0;
      for (const url of config.urls) {
        index += 1;
        const label = `[${index}/${config.urls.length}] ${url}`;
        await logProgress(`${label} - fetching...`);
        const urlStartedAt = Date.now();
        try {
          const deal = await withRetry(async (attemptNumber) => {
            const page = await browser.newPage();
            try {
              // Never follow navigations outside the merchant's public web domain, and skip video/fonts
              // (nothing we read needs them) to keep pages lighter and faster to settle.
              await page.route("**/*", async (route) => {
                const request = route.request();
                if (request.isNavigationRequest()) {
                  const host = new URL(request.url()).hostname;
                  if (!["www.amazon.in", "amazon.in", "www.ajio.com"].includes(host)) return route.abort();
                }
                if (["media", "font"].includes(request.resourceType())) return route.abort();
                return route.continue();
              });
              if (attemptNumber > 1) await logProgress(`${label} - retry ${attemptNumber - 1}`);
              try { return await collect(page, url); } catch (error) {
                const message = String(error?.message ?? error);
                if (/Missing product title|Timeout|Currently unavailable|Unexpected product redirect/i.test(message)) await saveFailureDiagnostics(page, productSource(url), message);
                throw error;
              }
            } finally { await page.close().catch(() => {}); }
          }, { onRetry: async (attemptNumber, message) => { await logProgress(`${label} - attempt ${attemptNumber} failed (${message.slice(0, 120)}); retrying`); } });
          results.push(deal);
          await logProgress(`${label} - OK: "${deal.name.slice(0, 60)}" ${deal.price ? `Rs.${(deal.price / 100).toFixed(0)}` : "(no price)"}`);
        } catch (error) {
          // Keep the real reason (timeout, missing selector, etc.) instead of a generic
          // message — when every URL fails identically it's the only way to tell "Amazon
          // changed the page" from "this runner's IP is being challenged" from a real bug.
          const known = /^(Page unavailable|Access challenge|Missing product title|Currently unavailable|Unexpected product redirect|Product image is not on)/.test(error.message);
          const message = known ? error.message : `Product could not be collected: ${error.message}`.slice(0, 300);
          errors.push({ sourceUrl: productSource(url).url, error: message });
          await logProgress(`${label} - FAILED: ${message}`);
        }
        // A single product should take seconds. Minutes means the machine was suspended (sleep/App Nap) mid-run.
        if (Date.now() - urlStartedAt > 180000) await logProgress(`${label} - NOTE: took ${Math.round((Date.now() - urlStartedAt) / 60000)} min; the computer was probably asleep or suspended during this run`);
        // Space out requests so a multi-product run reads like ordinary browsing, not a scraping burst.
        if (url !== config.urls[config.urls.length - 1]) await new Promise((resolve) => setTimeout(resolve, 4000 + Math.random() * 4000));
      }
    } finally { await browser.close(); }
    await logProgress(`Run finished: ${results.length} collected, ${errors.length} failed`);
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

      const preserveSources = "CASE WHEN json_type(excluded.approved_payload,'$.discoverySources')='array' THEN excluded.approved_payload WHEN json_type(collected_deals.approved_payload,'$.discoverySources')='array' THEN json_set(excluded.approved_payload,'$.discoverySources',json_extract(collected_deals.approved_payload,'$.discoverySources')) WHEN json_type(collected_deals.approved_payload,'$.discoverySource')='text' THEN json_set(excluded.approved_payload,'$.discoverySources',json_array(json_extract(collected_deals.approved_payload,'$.discoverySource'))) ELSE excluded.approved_payload END";
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
          `INSERT INTO collected_deals (id,payload,approved_payload,product_id,status,updated_at) VALUES (${quote(dealId)},${quote(JSON.stringify(deal))},${quote(JSON.stringify(deal))},${quote(productId)},'approved',${quote(now)}) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,approved_payload=${preserveSources},product_id=excluded.product_id,status='approved',updated_at=excluded.updated_at;`,
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
      // Every statement is an idempotent upsert, so a retry after a network blip cannot duplicate products.
      await withRetry(() => promisify(execFile)("npx", ["--no-install", "wrangler", "d1", "execute", "offerloom", "--remote", "--file", "outputs/collector/drafts.sql"], { timeout: 180000 }),
        { maxAttempts: 3, delaysMs: [15000, 45000], retryable: () => true, onRetry: async (n) => { await logProgress(`D1 write attempt ${n} failed; retrying`); } });
    }
    await writeFile("outputs/collector/summary.json", JSON.stringify({
      checkedAt: new Date().toISOString(),
      collected: results.length,
      errors: errors.length,
      failed: errors.map((failure) => ({ asin: productSource(failure.sourceUrl).id, error: failure.error })),
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
