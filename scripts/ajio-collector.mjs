// AJIO deal discovery + price refresh, run from GitHub Actions alongside the Flipkart collector.
// Owner-authorised (20 Oct 2026) to discover discounted products from AJIO's own search data, show
// AJIO product photos, and build ACE deep links in the dashboard's format for each product.
// Low volume, fixed pauses, no evasion: a 403/429 or access challenge stops the run without publishing.
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import { matchesProduct } from "./flipkart-collector.mjs";

// Search terms, each filtered to AJIO's "50% and above" discount facet and sorted by relevance
// (AJIO's popularity ranking), so discovery favours well-selling items rather than clearance junk.
export const QUERIES = ["men shirts", "men tshirts", "men jeans", "women kurtas", "women dresses", "women tops", "sneakers", "handbags", "backpacks", "watches"];
const PER_QUERY = 6, MAX_NEW = 12, MAX_REFRESH = 40, PAUSE_MS = 3000, BUDGET_MS = 25 * 60000;
const MIN_DISCOUNT = 0.4, MIN_RATING = 3.5, MIN_RATING_COUNT = 10;
const ORIGIN = "https://www.ajio.com";
const IMAGE_HOSTS = new Set(["assets.ajio.com", "assets-jiocdn.ajio.com"]);
const challenge = /access denied|captcha|are you a human|unusual traffic|verify you are human|request blocked|reference #\d/i;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
const note = (level, message) => console.log(`::${level} title=AJIO collector::${String(message).replace(/[\r\n%]/g, " ").slice(0, 400)}`);

export class Blocked extends Error {}

/** Search API path for one query, limited to AJIO's ≥50%-off facet. */
export function searchPath(text, pageSize = 24) {
  const params = new URLSearchParams({ fields: "SITE", currentPage: "0", pageSize: String(pageSize), format: "json", query: `${text}:relevance:discountranges:50% and above`, sortBy: "relevance", text, advfilter: "true", platform: "Desktop" });
  return `/api/search?${params}`;
}

/** Canonical AJIO product (colour option) from a relative or absolute product URL, or null. */
export function ajioProduct(href) {
  try {
    const url = new URL(href, ORIGIN);
    const match = url.pathname.match(/^\/([a-z0-9-]+)\/p\/((\d+)_([a-z0-9]+))$/i);
    if (url.hostname !== "www.ajio.com" || url.username || url.password || url.port || !match) return null;
    const id = match[2].toLowerCase();
    return { id, base: match[3], url: `${ORIGIN}/${match[1].toLowerCase()}/p/${id}` };
  } catch { return null; }
}

/** ACE tracking link in the exact format the ACE dashboard's "Add Deeplink" generates (see app/lib/ajio.ts). */
export function aceLink(product) {
  const params = new URLSearchParams({ campaign_id: "1", pub_id: "1072", p1: "offerloom-site", p2: product.base, url: product.url });
  return `https://ajiotrk.vibconnect.in/click?${params}`;
}

const titleCase = (text) => text.toLowerCase().replace(/(^|[\s.-])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
/** AJIO names omit the brand ("Men Lace-Up Sneakers"); prefix it once so cards and matching see it. */
export function fullName(brand, name) {
  const b = String(brand ?? "").trim(), n = String(name ?? "").trim();
  const shown = b.length > 3 && b === b.toUpperCase() ? titleCase(b) : b;
  if (!b || n.toLowerCase().startsWith(b.toLowerCase())) return n.slice(0, 200);
  return `${shown} ${n}`.slice(0, 200);
}

/** OfferLoom category from AJIO's own vertical/brick labels. */
export function ajioCategory(...labels) {
  const text = labels.filter(Boolean).join(" ");
  if (/beauty|makeup|skin ?care|fragrance|perfume|grooming/i.test(text)) return "Beauty";
  if (/home|kitchen|decor|furnishing|bedding|bath/i.test(text)) return "Home";
  return "Fashion";
}

/** Discovery candidates from one search response: valid URLs, discount ≥ MIN_DISCOUNT, one colour per style. */
export function fromSearch(json) {
  const out = new Map();
  for (const p of json?.products ?? []) {
    const product = ajioProduct(p?.url ?? "");
    const price = Number(p?.price?.value), mrp = Number(p?.wasPriceData?.value);
    if (!product || !(price > 0) || !(mrp > price) || 1 - price / mrp < MIN_DISCOUNT) continue;
    if (![...out.values()].some((x) => x.base === product.base)) out.set(product.id, { ...product, vertical: [p.verticalNameText, p.segmentNameText, p.brickNameText].filter(Boolean).join(" ") });
  }
  return [...out.values()];
}

/** Round-robin across query results so every category gets candidates before any gets a second; dedupes by id. */
export function interleave(lists) {
  const out = new Map();
  for (let i = 0; lists.some((l) => i < l.length); i += 1) for (const l of lists) if (l[i] && !out.has(l[i].id)) out.set(l[i].id, l[i]);
  return [...out.values()];
}

const ratingCount = (text) => {
  const m = String(text ?? "").trim().match(/^([\d.]+)\s*([KkMm]?)$/);
  return m ? Math.round(Number(m[1]) * (m[2].toLowerCase() === "k" ? 1e3 : m[2].toLowerCase() === "m" ? 1e6 : 1)) : 0;
};
const paise = (rupees) => {
  const value = Math.round(Number(rupees) * 100);
  return Number.isSafeInteger(value) && value > 0 && value < 100000000 ? value : null;
};

/** Validated deal from the product-detail API, or throws a short reason. */
export function fromDetail(json, product, { isNew = false, checkedAt = new Date().toISOString() } = {}) {
  if (!json || ajioProduct(json.url ?? "")?.id !== product.id) throw new Error("Unexpected product in response");
  if (json.stock?.stockLevelStatus !== "inStock" || json.purchasable === false) throw new Error("Currently unavailable");
  const price = paise(json.price?.value), was = paise(json.wasPriceData?.value);
  if (!price) throw new Error("Missing price");
  const mrp = was && was > price ? was : null;
  const primary = (json.images ?? []).filter((i) => i?.imageType === "PRIMARY");
  const pick = ["product", "superZoomPdp", "mobileProductListingImage"].map((f) => primary.find((i) => i.format === f)).find(Boolean);
  let imageUrl = null;
  try { const u = new URL(pick?.url ?? ""); if (u.protocol === "https:" && IMAGE_HOSTS.has(u.hostname) && !u.username && !u.port) imageUrl = u.toString(); } catch { /* invalid */ }
  const name = fullName(json.brandName, json.name);
  if (name.length < 3 || !imageUrl) throw new Error("Missing title or image");
  const rating = json.ratingsResponse?.aggregateRating;
  const avg = Number(rating?.averageRating), count = ratingCount(rating?.numUserRatings);
  if (isNew) {
    if (!mrp || 1 - price / mrp < MIN_DISCOUNT) throw new Error("Discount below threshold");
    if (count >= MIN_RATING_COUNT && avg < MIN_RATING) throw new Error("Low rating");
  }
  return { merchant: "ajio", merchantProductId: product.id, sourceUrl: product.url, name, brand: String(json.brandName ?? "").trim().slice(0, 80) || null, imageUrl, price, mrp, currency: "INR", category: ajioCategory(product.vertical, json.brickCategory, json.brickSubCategory, json.brickName), rating: Number.isFinite(avg) && avg > 0 ? { average: avg, count } : null, checkedAt };
}

export function publishSql(deals, existing, otherProducts, now = new Date().toISOString()) {
  const out = [];
  for (const deal of deals) {
    const old = existing.get(deal.merchantProductId);
    if (old && (old.status !== "published" || old.listingStatus !== "active")) continue;
    const product = ajioProduct(deal.sourceUrl);
    if (!product) continue;
    const match = old ? null : otherProducts.find((p) => p.category === deal.category && matchesProduct(p.name, deal.name));
    const productId = old?.productId ?? match?.id ?? `ajio-${deal.merchantProductId}`;
    const category = slug(deal.category), payload = quote(JSON.stringify(deal));
    if (!old && !match) {
      out.push(
        `INSERT INTO categories (id,name,slug,position,created_at) VALUES (${quote(`cat-${category}`)},${quote(deal.category)},${quote(category)},0,${quote(now)}) ON CONFLICT(slug) DO NOTHING;`,
        `INSERT INTO products (id,category_id,brand,name,slug,summary,image_url,specs_json,status,source,created_at,updated_at,published_at) VALUES (${quote(productId)},(SELECT id FROM categories WHERE slug=${quote(category)}),${deal.brand ? quote(deal.brand) : "NULL"},${quote(deal.name)},${quote(`${slug(deal.name)}-${productId}`)},'Confirm current size, stock and price on AJIO before buying.',${quote(deal.imageUrl)},'[]','published','browser_auto',${quote(now)},${quote(now)},${quote(now)}) ON CONFLICT(id) DO NOTHING;`,
      );
    } else if (old && productId.startsWith("ajio-") && productId === `ajio-${deal.merchantProductId}`) {
      out.push(`UPDATE products SET name=${quote(deal.name)},image_url=${quote(deal.imageUrl)},updated_at=${quote(now)} WHERE id=${quote(productId)} AND status='published';`);
    }
    // Existing listings keep their affiliate URL (dashboard-generated links are never overwritten).
    out.push(
      `INSERT INTO merchant_listings (id,product_id,merchant,merchant_product_id,source_url,affiliate_url,status,last_checked_at,created_at,updated_at) VALUES (${quote(`ajio-${deal.merchantProductId}`)},${quote(productId)},'ajio',${quote(deal.merchantProductId)},${quote(deal.sourceUrl)},${quote(aceLink(product))},'active',${quote(deal.checkedAt)},${quote(now)},${quote(now)}) ON CONFLICT(merchant,merchant_product_id) DO UPDATE SET last_checked_at=excluded.last_checked_at,updated_at=excluded.updated_at WHERE merchant_listings.status='active';`,
      `INSERT INTO collected_deals (id,payload,approved_payload,product_id,status,updated_at) VALUES (${quote(`ajio-${deal.merchantProductId}`)},${payload},${payload},${quote(productId)},'approved',${quote(now)}) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,approved_payload=CASE WHEN json_array_length(json_extract(excluded.approved_payload,'$.discoverySources'))>0 THEN excluded.approved_payload ELSE json_set(excluded.approved_payload,'$.discoverySources',json(COALESCE(json_extract(collected_deals.approved_payload,'$.discoverySources'),'[]'))) END,product_id=excluded.product_id,status='approved',updated_at=excluded.updated_at;`,
    );
  }
  return out.join("\n");
}

async function d1(args) {
  try {
    const { stdout } = await promisify(execFile)("npx", ["--no-install", "wrangler", "d1", "execute", "offerloom", "--remote", ...args], { timeout: 180000, maxBuffer: 8000000 });
    return stdout;
  } catch (error) {
    // Surface wrangler's own first error line (never includes the token) so auth problems are diagnosable.
    const lines = `${error?.stderr ?? ""}\n${error?.stdout ?? ""}`.split("\n").map((l) => l.trim()).filter(Boolean);
    const detail = [error?.code, ...lines.filter((l) => /error|auth|token|login|permission|account/i.test(l)).slice(-2), ...(lines.length ? [] : [error?.message])].filter(Boolean).join(" | ").replace(/[A-Za-z0-9_-]{30,}/g, "…");
    throw new Error(("Cloudflare D1 command failed; check runner credentials and D1 access") + (detail ? ` (${detail.slice(0, 300)})` : ""));
  }

}
const rows = async (sql) => JSON.parse(await d1(["--json", "--command", sql]))[0]?.results ?? [];

/** JSON GET from inside an ajio.com page, so requests carry the same cookies/headers as a normal visit. */
async function api(page, path) {
  const res = await page.evaluate(async (p) => {
    const r = await fetch(p, { headers: { accept: "application/json" }, credentials: "include" });
    return { status: r.status, text: await r.text() };
  }, path);
  if (res.status === 403 || res.status === 429 || challenge.test(res.text.slice(0, 2000))) throw new Blocked(`Access blocked (HTTP ${res.status}); AJIO run stopped`);
  if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
  try { return JSON.parse(res.text); } catch { throw new Error("Invalid JSON"); }
}

async function main() {
  const probe = process.argv.includes("--probe"), started = Date.now();
  const window = process.env.COLLECTION_WINDOW === "evening" ? "evening" : "morning";
  const marker = `ajio-browser:${new Date(started + 19800000).toISOString().slice(0, 10)}:${window}`;
  await mkdir("outputs/ajio-collector", { recursive: true });
  let existing = new Map(), otherProducts = [], refreshUrls = [];
  if (!probe) {
    const merchant = await rows("SELECT status FROM merchants WHERE id='ajio'");
    if (merchant[0]?.status !== "active") { note("warning", "AJIO merchant is not active; no publication"); return; }
    if (!process.argv.includes("--force") && (await rows(`SELECT id FROM sync_runs WHERE merchant_id='ajio' AND status='succeeded' AND error_message LIKE ${quote(marker + "%")} LIMIT 1`)).length) {
      console.log(JSON.stringify({ mode: "skipped", reason: "Already published this window" })); return;
    }
    existing = new Map((await rows("SELECT ml.merchant_product_id AS id,p.id AS productId,p.status,ml.status AS listingStatus,ml.source_url AS url FROM merchant_listings ml JOIN products p ON p.id=ml.product_id WHERE ml.merchant='ajio' ORDER BY COALESCE(ml.last_checked_at,'') ASC")).map((r) => [String(r.id).toLowerCase(), r]));
    refreshUrls = [...existing.values()].filter((r) => r.status === "published" && r.listingStatus === "active").map((r) => ajioProduct(r.url)).filter(Boolean).slice(0, MAX_REFRESH);
    otherProducts = await rows("SELECT p.id,p.name,c.name AS category FROM products p JOIN categories c ON c.id=p.category_id WHERE p.status='published' AND EXISTS (SELECT 1 FROM merchant_listings o WHERE o.product_id=p.id AND o.merchant IN ('amazon','flipkart') AND o.status='active') AND NOT EXISTS (SELECT 1 FROM merchant_listings a WHERE a.product_id=p.id AND a.merchant='ajio')");
  }
  // On the owner's Mac this runs in Microsoft Edge (OFFERLOOM_BROWSER_CHANNEL=msedge, set by the laptop scheduler).
  const browser = await chromium.launch({ headless: true, ...(process.env.OFFERLOOM_BROWSER_CHANNEL ? { channel: process.env.OFFERLOOM_BROWSER_CHANNEL } : {}) });
  const deals = [], failures = [], discoveryCounts = {};
  let blocked = null;
  try {
    const page = await browser.newPage({ locale: "en-IN" });
    await page.route("**/*", (route) => {
      const request = route.request();
      if (request.isNavigationRequest() && !/(^|\.)ajio\.com$/.test(new URL(request.url()).hostname)) return route.abort();
      return ["image", "media", "font"].includes(request.resourceType()) ? route.abort() : route.continue();
    });
    const home = await page.goto(`${ORIGIN}/`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(3000);
    if (!home?.ok() || challenge.test((await page.locator("body").innerText().catch(() => "")).slice(0, 3000))) throw new Blocked(`AJIO home unavailable (${home?.status() ?? "no response"}); run stopped`);

    const perQuery = [];
    for (const text of QUERIES) {
      try {
        const products = fromSearch(await api(page, searchPath(text)));
        discoveryCounts[text] = products.length;
        perQuery.push(products.filter((p) => !existing.has(p.id)).slice(0, PER_QUERY));
      } catch (error) {
        if (error instanceof Blocked) throw error;
        note("warning", `Discovery query "${text}" skipped: ${error.message}`);
      }
      await pause(PAUSE_MS);
    }
    const newOnes = interleave(perQuery).slice(0, probe ? 3 : MAX_NEW * 2);
    const found = new Map(perQuery.flat().map((p) => [p.id, p]));
    const refresh = refreshUrls.map((p) => found.get(p.id) ?? p);
    for (const product of [...refresh, ...newOnes]) {
      if (Date.now() - started > BUDGET_MS) { note("notice", "Time budget reached; deferring the rest"); break; }
      const isNew = !existing.has(product.id);
      try {
        const deal = fromDetail(await api(page, `/api/p/${product.id}`), product, { isNew });
        deals.push({ ...deal, discoverySources: isNew ? ["todays_deals"] : [] });
      } catch (error) {
        if (error instanceof Blocked) throw error;
        failures.push({ id: product.id, reason: error.message.slice(0, 80) });
      }
      await pause(PAUSE_MS);
    }
  } catch (error) {
    if (!(error instanceof Blocked)) throw error;
    blocked = error.message;
  } finally { await browser.close(); }

  const discount = (d) => (d.mrp ? 1 - d.price / d.mrp : 0);
  const fresh = deals.filter((d) => !existing.has(d.merchantProductId)).sort((a, b) => discount(b) - discount(a)).slice(0, MAX_NEW);
  const refreshed = deals.filter((d) => existing.has(d.merchantProductId));
  const summary = { mode: probe ? "probe" : "publish", window, blocked, discoveryCounts, validated: deals.length, added: fresh.length, refreshed: refreshed.length, failed: failures.length, sample: deals.slice(0, 3).map((d) => `${d.name.slice(0, 50)} ₹${d.price / 100} mrp ₹${(d.mrp ?? 0) / 100}`) };
  note(blocked ? "warning" : "notice", JSON.stringify(summary));
  // A block publishes nothing: no partial writes, no retries, no change of request pattern.
  if (!probe && !blocked && (fresh.length || refreshed.length)) {
    const sql = publishSql([...refreshed, ...fresh], existing, otherProducts);
    const record = `INSERT INTO sync_runs (merchant_id,status,products_seen,products_updated,error_message,started_at,finished_at) VALUES ('ajio','succeeded',${deals.length + failures.length},${fresh.length + refreshed.length},${quote(`${marker}; added=${fresh.length}; refreshed=${refreshed.length}; failed=${failures.length}`)},${quote(new Date(started).toISOString())},${quote(new Date().toISOString())});`;
    await writeFile("outputs/ajio-collector/publish.sql", sql + "\n" + record, { mode: 0o600 });
    await d1(["--file", "outputs/ajio-collector/publish.sql"]);
  }
  await writeFile("outputs/ajio-collector/summary.json", JSON.stringify({ ...summary, failures }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((error) => {
  note("error", error.message);
  process.exitCode = 1;
});
