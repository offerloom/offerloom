// Flipkart deal discovery + price refresh, run from GitHub Actions after the Amazon collector.
// Owner-authorised (20 Oct 2026) to discover deals from Flipkart's offer/category listings.
// Low volume, fixed pauses, no evasion: an access challenge stops the run without publishing.
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import { categorize } from "./browser-collector.mjs";

// Discount-filtered Flipkart category listings (≥40% off), the same kind linked from flipkart.com/offers-store.
const DISCOUNT = "p%5B%5D=facets.discount_range_v1%255B%255D%3D40%2525%2Bor%2Bmore";
// Popular discounted listings feed Today's Deals + Bestsellers; newest-first listings feed New Releases.
const POPULAR = ["todays_deals", "bestsellers"], NEWEST = ["new_releases"];
export const SOURCES = [
  { url: `https://www.flipkart.com/audio-video/headset/pr?sid=0pm,fcn&${DISCOUNT}&sort=popularity`, tags: POPULAR },
  { url: `https://www.flipkart.com/wearable-smart-devices/smart-watches/pr?sid=ajy,buh&${DISCOUNT}&sort=popularity`, tags: POPULAR },
  { url: `https://www.flipkart.com/clothing-and-accessories/topwear/pr?sid=clo,ash&${DISCOUNT}&sort=popularity`, tags: POPULAR },
  { url: `https://www.flipkart.com/home-kitchen/pr?sid=j9e&${DISCOUNT}&sort=popularity`, tags: POPULAR },
  { url: `https://www.flipkart.com/beauty-and-grooming/pr?sid=g9b&${DISCOUNT}&sort=popularity`, tags: POPULAR },
  { url: "https://www.flipkart.com/audio-video/headset/pr?sid=0pm,fcn&sort=recency_desc", tags: NEWEST },
  { url: "https://www.flipkart.com/wearable-smart-devices/smart-watches/pr?sid=ajy,buh&sort=recency_desc", tags: NEWEST },
];
const MAX_NEW = 10, MAX_REFRESH = 40, PAUSE_MS = 5000, BUDGET_MS = 15 * 60000;
const IMAGE_HOSTS = /^rukmini(m\d)?\d?\.flixcart\.com$/;
const challenge = /captcha|access denied|are you a human|unusual traffic|verify you are human|something is not right/i;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
const note = (level, message) => console.log(`::${level} title=Flipkart collector::${String(message).replace(/[\r\n%]/g, " ").slice(0, 400)}`);

/** Canonical Flipkart product URL and its item id, or null for anything else. */
export function flipkartProduct(href) {
  try {
    const url = new URL(href, "https://www.flipkart.com");
    const match = url.pathname.match(/^\/([a-z0-9-]+)\/p\/(itm[a-z0-9]{10,20})$/i);
    if (!/^(www\.)?flipkart\.com$/.test(url.hostname) || !match) return null;
    return { id: match[2].toLowerCase(), url: `https://www.flipkart.com/${match[1].toLowerCase()}/p/${match[2].toLowerCase()}` };
  } catch { return null; }
}

export const rupeesToPaise = (text) => {
  const value = Number(String(text).replace(/[^\d]/g, ""));
  return Number.isSafeInteger(value) && value > 0 && value < 10000000 ? value * 100 : null;
};

/** Pick the selling price (largest non-struck ₹ amount before any struck one) and the MRP that follows it. */
export function pickPrices(amounts) {
  const sellingIndex = amounts.findIndex((amount) => !amount.struck && amount.size >= 20);
  if (sellingIndex < 0) return null;
  const price = rupeesToPaise(amounts[sellingIndex].text);
  const next = amounts.slice(sellingIndex + 1, sellingIndex + 3).find((amount) => amount.struck);
  const mrp = next ? rupeesToPaise(next.text) : null;
  if (!price) return null;
  return { price, mrp: mrp && mrp > price ? mrp : null };
}

const STOP = new Set(["with", "for", "and", "the", "of", "in", "to", "a", "an", "pack", "set", "men", "women", "black", "white", "blue"]);
const tokens = (name) => new Set(name.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((t) => t.length > 1 && !STOP.has(t)));
/** Conservative cross-store match: same leading brand word and ≥75% token overlap. */
export function matchesProduct(a, b) {
  const brandA = a.toLowerCase().split(/\s+/)[0], brandB = b.toLowerCase().split(/\s+/)[0];
  if (!brandA || brandA !== brandB) return false;
  const ta = tokens(a), tb = tokens(b);
  const shared = [...ta].filter((t) => tb.has(t)).length;
  return shared / Math.min(ta.size, tb.size) >= 0.75 && shared >= 4;
}

async function discover(page, url) {
  const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  if (!response?.ok()) throw new Error(`Discovery unavailable (${response?.status() ?? "no response"})`);
  await page.waitForTimeout(3000);
  if (challenge.test((await page.locator("body").innerText()).slice(0, 4000))) throw new Error("Access challenge; Flipkart run stopped");
  const hrefs = await page.$$eval("a[href*='/p/itm']", (as) => as.map((a) => a.getAttribute("href")));
  return [...new Map(hrefs.map(flipkartProduct).filter(Boolean).map((p) => [p.id, p])).values()];
}

async function extract(page, product) {
  const response = await page.goto(product.url, { waitUntil: "domcontentloaded", timeout: 45000 });
  if (!response?.ok()) throw new Error(`Page unavailable (${response?.status() ?? "no response"})`);
  await page.waitForTimeout(2500);
  const landed = flipkartProduct(page.url());
  if (!landed || landed.id !== product.id) throw new Error("Unexpected product redirect");
  const data = await page.evaluate(() => {
    const body = document.body.innerText.slice(0, 6000);
    const meta = (p) => document.querySelector(`meta[property="${p}"]`)?.getAttribute("content") ?? "";
    let name = "";
    for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
      try { const ld = [].concat(JSON.parse(s.textContent)); const p = ld.find((x) => x?.["@type"] === "Product" || x?.name); if (p?.name) { name = p.name; break; } } catch { /* ignore */ }
    }
    const amounts = [...document.querySelectorAll("div,span")]
      .filter((e) => e.childElementCount === 0 && /^₹[\d,]+$/.test(e.textContent.trim()))
      .slice(0, 8)
      .map((e) => ({ text: e.textContent.trim(), struck: getComputedStyle(e).textDecorationLine.includes("line-through"), size: parseFloat(getComputedStyle(e).fontSize) }));
    return { body, name, ogTitle: meta("og:title"), image: meta("og:image"), amounts };
  });
  if (challenge.test(data.body)) throw new Error("Access challenge; Flipkart run stopped");
  if (/\b(sold out|currently unavailable|coming soon)\b/i.test(data.body)) throw new Error("Currently unavailable");
  const name = (data.name || data.ogTitle.replace(/\s+Price in India.*$/i, "")).trim().slice(0, 200);
  let image = null;
  try { const u = new URL(data.image); if (u.protocol === "https:" && IMAGE_HOSTS.test(u.hostname)) image = u.toString(); } catch { /* invalid */ }
  const prices = pickPrices(data.amounts);
  if (!name || !image || !prices) throw new Error("Missing product title, image or price; no draft created");
  return { merchant: "flipkart", merchantProductId: product.id, sourceUrl: product.url, name, imageUrl: image, price: prices.price, mrp: prices.mrp, currency: "INR", category: categorize("flipkart", name), checkedAt: new Date().toISOString() };
}

export function publishSql(deals, existing, amazonProducts, now = new Date().toISOString()) {
  const out = [];
  for (const deal of deals) {
    const old = existing.get(deal.merchantProductId);
    if (old && (old.status !== "published" || old.listingStatus !== "active")) continue;
    const match = old ? null : amazonProducts.find((p) => p.category === deal.category && matchesProduct(p.name, deal.name));
    const productId = old?.productId ?? match?.id ?? `flipkart-${deal.merchantProductId}`;
    const category = slug(deal.category), payload = quote(JSON.stringify(deal));
    if (!old && !match) {
      out.push(
        `INSERT INTO categories (id,name,slug,position,created_at) VALUES (${quote(`cat-${category}`)},${quote(deal.category)},${quote(category)},0,${quote(now)}) ON CONFLICT(slug) DO NOTHING;`,
        `INSERT INTO products (id,category_id,name,slug,summary,image_url,specs_json,status,source,created_at,updated_at,published_at) VALUES (${quote(productId)},(SELECT id FROM categories WHERE slug=${quote(category)}),${quote(deal.name)},${quote(`${slug(deal.name)}-${productId}`)},'Confirm current price, stock and specifications on Flipkart before buying.',${quote(deal.imageUrl)},'[]','published','browser_auto',${quote(now)},${quote(now)},${quote(now)}) ON CONFLICT(id) DO NOTHING;`,
      );
    } else if (old && productId.startsWith("flipkart-")) {
      out.push(`UPDATE products SET name=${quote(deal.name)},image_url=${quote(deal.imageUrl)},updated_at=${quote(now)} WHERE id=${quote(productId)} AND status='published';`);
    }
    out.push(
      `INSERT INTO merchant_listings (id,product_id,merchant,merchant_product_id,source_url,affiliate_url,status,last_checked_at,created_at,updated_at) VALUES (${quote(`flipkart-${deal.merchantProductId}`)},${quote(productId)},'flipkart',${quote(deal.merchantProductId)},${quote(deal.sourceUrl)},${quote(deal.sourceUrl)},'active',${quote(deal.checkedAt)},${quote(now)},${quote(now)}) ON CONFLICT(merchant,merchant_product_id) DO UPDATE SET source_url=excluded.source_url,affiliate_url=excluded.affiliate_url,last_checked_at=excluded.last_checked_at,updated_at=excluded.updated_at WHERE merchant_listings.status='active';`,
      `INSERT INTO collected_deals (id,payload,approved_payload,product_id,status,updated_at) VALUES (${quote(`flipkart-${deal.merchantProductId}`)},${payload},${payload},${quote(productId)},'approved',${quote(now)}) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,approved_payload=CASE WHEN json_array_length(json_extract(excluded.approved_payload,'$.discoverySources'))>0 THEN excluded.approved_payload ELSE json_set(excluded.approved_payload,'$.discoverySources',json(COALESCE(json_extract(collected_deals.approved_payload,'$.discoverySources'),'[]'))) END,product_id=excluded.product_id,status='approved',updated_at=excluded.updated_at;`,
    );
  }
  return out.join("\n");
}

async function d1(args) {
  try {
    const { stdout } = await promisify(execFile)("npx", ["--no-install", "wrangler", "d1", "execute", "offerloom", "--remote", ...args], { timeout: 180000, maxBuffer: 8000000 });
    return stdout;
  } catch { throw new Error("Cloudflare D1 command failed; check runner credentials and D1 access"); }
}
const rows = async (sql) => JSON.parse(await d1(["--json", "--command", sql]))[0]?.results ?? [];

async function main() {
  const probe = process.argv.includes("--probe"), started = Date.now();
  const window = process.env.COLLECTION_WINDOW === "evening" ? "evening" : "morning";
  const marker = `flipkart-browser:${new Date(started + 19800000).toISOString().slice(0, 10)}:${window}`;
  await mkdir("outputs/flipkart-collector", { recursive: true });
  let existing = new Map(), amazonProducts = [];
  if (!probe) {
    const merchant = await rows("SELECT status FROM merchants WHERE id='flipkart'");
    if (merchant[0]?.status !== "active") { note("warning", "Flipkart merchant is not active; no publication"); return; }
    if (!process.argv.includes("--force") && (await rows(`SELECT id FROM sync_runs WHERE merchant_id='flipkart' AND status='succeeded' AND error_message LIKE ${quote(marker + "%")} LIMIT 1`)).length) {
      console.log(JSON.stringify({ mode: "skipped", reason: "Already published this window" })); return;
    }
    existing = new Map((await rows("SELECT ml.merchant_product_id AS id,p.id AS productId,p.status,ml.status AS listingStatus FROM merchant_listings ml JOIN products p ON p.id=ml.product_id WHERE ml.merchant='flipkart' ORDER BY COALESCE(ml.last_checked_at,'') ASC")).map((r) => [r.id, r]));
    amazonProducts = await rows("SELECT p.id,p.name,c.name AS category FROM products p JOIN categories c ON c.id=p.category_id JOIN merchant_listings ml ON ml.product_id=p.id AND ml.merchant='amazon' AND ml.status='active' WHERE p.status='published' AND NOT EXISTS (SELECT 1 FROM merchant_listings f WHERE f.product_id=p.id AND f.merchant='flipkart')");
  }
  const browser = await chromium.launch({ headless: true });
  const deals = [], failures = [], discoveryCounts = {};
  try {
    const page = await browser.newPage();
    await page.route("**/*", (route) => {
      const request = route.request();
      if (request.isNavigationRequest() && !/(^|\.)flipkart\.com$/.test(new URL(request.url()).hostname)) return route.abort();
      return ["media", "font"].includes(request.resourceType()) ? route.abort() : route.continue();
    });
    const found = new Map();
    const tagsById = new Map();
    for (const { url, tags } of SOURCES) {
      try {
        const products = await discover(page, url);
        discoveryCounts[`${url.split("/pr?")[0].replace("https://www.flipkart.com/", "")}${tags === NEWEST ? " (new)" : ""}`] = products.length;
        for (const product of products.slice(0, tags === NEWEST ? 8 : 15)) {
          found.set(product.id, product);
          tagsById.set(product.id, [...new Set([...(tagsById.get(product.id) ?? []), ...tags])]);
        }
      } catch (error) {
        if (/Access challenge/.test(error.message)) throw error;
        note("warning", `Discovery source skipped: ${error.message}`);
      }
      await pause(PAUSE_MS);
    }
    const unseen = [...found.values()].filter((p) => !existing.has(p.id));
    const newest = unseen.filter((p) => (tagsById.get(p.id) ?? []).includes("new_releases")).slice(0, 6);
    const newOnes = [...new Map([...newest, ...unseen].map((p) => [p.id, p])).values()].slice(0, probe ? 2 : MAX_NEW * 2);
    const refresh = [...existing.entries()].filter(([, r]) => r.status === "published" && r.listingStatus === "active").slice(0, probe ? 0 : MAX_REFRESH)
      .map(([id]) => found.get(id) ?? { id, url: null }).filter((p) => p.url);
    // Refresh rows we know the canonical URL for via their stored source_url.
    if (!probe && existing.size) {
      const urls = new Map((await rows("SELECT merchant_product_id AS id, source_url AS url FROM merchant_listings WHERE merchant='flipkart' AND status='active' ORDER BY COALESCE(last_checked_at,'') ASC LIMIT " + MAX_REFRESH)).map((r) => [r.id, r.url]));
      for (const [id, url] of urls) if (!refresh.some((p) => p.id === id)) refresh.push({ id, url });
    }
    for (const product of [...refresh.slice(0, MAX_REFRESH), ...newOnes]) {
      if (Date.now() - started > BUDGET_MS) { note("notice", "Time budget reached; deferring the rest"); break; }
      try {
        const deal = await extract(page, product);
        const isNew = !existing.has(product.id);
        const discoverySources = tagsById.get(product.id) ?? [];
        // New listings need ≥10% off, except genuinely new releases (as with Amazon).
        if (!isNew || discoverySources.includes("new_releases") || (deal.mrp && 1 - deal.price / deal.mrp >= 0.1)) deals.push({ ...deal, discoverySources });
      } catch (error) {
        if (/Access challenge/.test(error.message)) throw error;
        failures.push({ id: product.id, reason: error.message.slice(0, 80) });
      }
      await pause(PAUSE_MS);
    }
  } finally { await browser.close(); }
  const discount = (d) => (d.mrp ? 1 - d.price / d.mrp : 0);
  const fresh = deals.filter((d) => !existing.has(d.merchantProductId)).sort((a, b) => discount(b) - discount(a));
  const reservedNew = fresh.filter((d) => d.discoverySources.includes("new_releases")).slice(0, 3);
  const additions = [...new Map([...reservedNew, ...fresh].map((d) => [d.merchantProductId, d])).values()].slice(0, MAX_NEW);
  const refreshed = deals.filter((d) => existing.has(d.merchantProductId));
  const summary = { mode: probe ? "probe" : "publish", window, discoveryCounts, validated: deals.length, added: additions.length, refreshed: refreshed.length, failed: failures.length, sample: deals.slice(0, 3).map((d) => `${d.name.slice(0, 50)} ₹${d.price / 100} mrp ₹${(d.mrp ?? 0) / 100}`) };
  note("notice", JSON.stringify(summary));
  if (!probe && (additions.length || refreshed.length)) {
    const sql = publishSql([...refreshed, ...additions], existing, amazonProducts);
    const record = `INSERT INTO sync_runs (merchant_id,status,products_seen,products_updated,error_message,started_at,finished_at) VALUES ('flipkart','succeeded',${deals.length + failures.length},${additions.length + refreshed.length},${quote(`${marker}; added=${additions.length}; refreshed=${refreshed.length}; failed=${failures.length}`)},${quote(new Date(started).toISOString())},${quote(new Date().toISOString())});`;
    await writeFile("outputs/flipkart-collector/publish.sql", sql + "\n" + record, { mode: 0o600 });
    await d1(["--file", "outputs/flipkart-collector/publish.sql"]);
  }
  await writeFile("outputs/flipkart-collector/summary.json", JSON.stringify({ ...summary, failures }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((error) => {
  note("error", error.message);
  process.exitCode = 1;
});
