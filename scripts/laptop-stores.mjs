// Myntra + Croma discovery, price refresh and cross-store matching, run on the owner's Mac in Microsoft Edge
// by the laptop scheduler (these stores refuse cloud runners). Owner-authorised 21 Oct 2026.
// Low volume, fixed pauses, no evasion: an access challenge stops that store without publishing.
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import { categorize } from "./browser-collector.mjs";
import { matchesProduct, searchQuery } from "./flipkart-collector.mjs";

const PAUSE_MS = 4000, BUDGET_MS = 20 * 60000, MAX_NEW = 10, MAX_REFRESH = 60, CROMA_MATCH = 20;
const MIN_DISCOUNT = 0.4, MIN_RATING = 3.5, MIN_RATING_COUNT = 10;
const challenge = /access denied|captcha|are you a human|unusual traffic|verify you are human|request blocked|site maintenance|something went wrong/i;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
const log = (message) => console.log(`${new Date().toISOString()} ${message}`);
const paise = (rupees) => { const v = Math.round(Number(String(rupees).replace(/[^\d.]/g, "")) * 100); return Number.isSafeInteger(v) && v > 0 && v < 100000000 ? v : null; };
export class Blocked extends Error {}

// ---------- Myntra ----------
export const MYNTRA_LISTINGS = ["men-tshirts", "men-casual-shirts", "men-jeans", "women-kurtas-kurtis-suits", "women-dresses", "men-sports-shoes", "handbags", "watches"];

/** Canonical Myntra product from a landingPageUrl / product URL ("…/<id>/buy"), or null. */
export function myntraProduct(href) {
  try {
    const url = new URL(href, "https://www.myntra.com/");
    const match = url.pathname.match(/^\/((?:[^/]+\/){1,4})(\d{5,12})\/buy$/);
    if (!/^(www\.)?myntra\.com$/.test(url.hostname) || !match) return null;
    return { id: match[2], url: `https://www.myntra.com${url.pathname}` };
  } catch { return null; }
}

const myntraImage = (value) => {
  try { const u = new URL(String(value).replace(/^http:/, "https:")); return /(^|\.)myntassets\.com$/.test(u.hostname) ? u.toString() : null; } catch { return null; }
};

/** Deals from a Myntra listing page's search data: ≥40% off, decent rating, one per product. */
export function myntraFromListing(products, checkedAt = new Date().toISOString()) {
  const out = [];
  for (const p of products ?? []) {
    const product = myntraProduct(p?.landingPageUrl ?? "");
    const price = paise(p?.price), mrp = paise(p?.mrp);
    const image = myntraImage(p?.searchImage);
    if (!product || !price || !image || !p?.productName) continue;
    if (!mrp || mrp <= price || 1 - price / mrp < MIN_DISCOUNT) continue;
    if (Number(p.ratingCount) >= MIN_RATING_COUNT && Number(p.rating) < MIN_RATING) continue;
    const name = String(p.productName).slice(0, 200);
    out.push({ merchant: "myntra", merchantProductId: product.id, sourceUrl: product.url, name, brand: p.brand ?? null, imageUrl: image, price, mrp, currency: "INR", category: categorize("myntra", name) === "Electronics" ? "Fashion" : categorize("myntra", name), checkedAt });
  }
  return out;
}

/** Deal from a Myntra product page's pdpData (used to refresh known listings). */
export function myntraFromPdp(d, product, checkedAt = new Date().toISOString()) {
  if (!d || String(d.id) !== product.id) throw new Error("Unexpected product in response");
  if (d.flags?.outOfStock || !(d.sizes ?? []).some((s) => s.available)) throw new Error("Currently unavailable");
  const price = paise(d.price?.discounted ?? d.price?.mrp), mrp = paise(d.price?.mrp ?? d.mrp);
  const image = myntraImage(d.media?.albums?.[0]?.images?.[0]?.imageURL ?? "");
  if (!price || !image || !d.name) throw new Error("Missing title, image or price");
  const name = String(d.name).slice(0, 200);
  return { merchant: "myntra", merchantProductId: product.id, sourceUrl: product.url, name, brand: d.brand?.name ?? null, imageUrl: image, price, mrp: mrp && mrp > price ? mrp : null, currency: "INR", category: categorize("myntra", name) === "Electronics" ? "Fashion" : categorize("myntra", name), checkedAt };
}

// ---------- Croma ----------
const cromaSearch = (text) => `https://www.croma.com/searchB?q=${encodeURIComponent(`${text}:relevance`)}&text=${encodeURIComponent(text)}`;
// Verified 21 Oct 2026 from the owner's Mac: c/3 = Computers & Tablets, c/5 = Home Appliances; search pages list products too.
export const CROMA_LISTINGS = ["https://www.croma.com/computers-tablets/c/3", "https://www.croma.com/home-appliances/c/5", cromaSearch("earbuds"), cromaSearch("smartwatch"), cromaSearch("headphones")];

/** Canonical Croma product URL ("/<slug>/p/<id>"), or null. */
export function cromaProduct(href) {
  try {
    const url = new URL(href, "https://www.croma.com/");
    const match = url.pathname.match(/^\/([a-z0-9-]+)\/p\/(\d{4,10})$/i);
    if (!/^(www\.)?croma\.com$/.test(url.hostname) || !match) return null;
    return { id: match[2], url: `https://www.croma.com/${match[1].toLowerCase()}/p/${match[2]}` };
  } catch { return null; }
}

/** Deal from fields read off a Croma product page. */
export function cromaFromPage(fields, product, checkedAt = new Date().toISOString()) {
  if (/out of stock|currently unavailable|notify me/i.test(fields.status ?? "")) throw new Error("Currently unavailable");
  const price = paise(fields.price), mrpRaw = paise((String(fields.mrp ?? "").match(/[\d,.]+/) ?? [""])[0]);
  let image = null;
  try { const u = new URL(fields.image); if (u.protocol === "https:" && /(^|\.)tatacroma\.com$|(^|\.)croma\.com$/.test(u.hostname)) image = u.toString(); } catch { /* invalid */ }
  const name = String(fields.name ?? "").trim().slice(0, 200);
  if (!price || !image || name.length < 3) throw new Error("Missing title, image or price");
  return { merchant: "croma", merchantProductId: product.id, sourceUrl: product.url, name, brand: name.split(/\s+/)[0], imageUrl: image, price, mrp: mrpRaw && mrpRaw > price ? mrpRaw : null, currency: "INR", category: categorize("croma", name), checkedAt };
}

// ---------- Publish (shared) ----------
const SUMMARY = { ajio: "Confirm current size, stock and price on AJIO before buying.", myntra: "Confirm current size, stock and price on Myntra before buying.", croma: "Confirm current price, stock and specifications on Croma before buying." };

export function publishSql(merchant, deals, existing, otherProducts, now = new Date().toISOString()) {
  const out = [];
  for (const deal of deals) {
    const old = existing.get(deal.merchantProductId);
    if (old && (old.status !== "published" || old.listingStatus !== "active")) continue;
    const match = old ? null : deal.matchProductId ? { id: deal.matchProductId } : otherProducts.find((p) => p.category === deal.category && matchesProduct(p.name, deal.name));
    const productId = old?.productId ?? match?.id ?? `${merchant}-${deal.merchantProductId}`;
    const category = slug(deal.category), payload = quote(JSON.stringify(deal));
    if (!old && !match) {
      out.push(
        `INSERT INTO categories (id,name,slug,position,created_at) VALUES (${quote(`cat-${category}`)},${quote(deal.category)},${quote(category)},0,${quote(now)}) ON CONFLICT(slug) DO NOTHING;`,
        `INSERT INTO products (id,category_id,brand,name,slug,summary,image_url,specs_json,status,source,created_at,updated_at,published_at) VALUES (${quote(productId)},(SELECT id FROM categories WHERE slug=${quote(category)}),${deal.brand ? quote(deal.brand) : "NULL"},${quote(deal.name)},${quote(`${slug(deal.name)}-${productId}`)},${quote(SUMMARY[merchant])},${quote(deal.imageUrl)},'[]','published','browser_auto',${quote(now)},${quote(now)},${quote(now)}) ON CONFLICT(id) DO NOTHING;`,
      );
    } else if (old && productId === `${merchant}-${deal.merchantProductId}`) {
      out.push(`UPDATE products SET name=${quote(deal.name)},image_url=${quote(deal.imageUrl)},updated_at=${quote(now)} WHERE id=${quote(productId)} AND status='published';`);
    }
    out.push(
      `INSERT INTO merchant_listings (id,product_id,merchant,merchant_product_id,source_url,affiliate_url,status,last_checked_at,created_at,updated_at) VALUES (${quote(`${merchant}-${deal.merchantProductId}`)},${quote(productId)},${quote(merchant)},${quote(deal.merchantProductId)},${quote(deal.sourceUrl)},${quote(deal.affiliateUrl ?? deal.sourceUrl)},'active',${quote(deal.checkedAt)},${quote(now)},${quote(now)}) ON CONFLICT(merchant,merchant_product_id) DO UPDATE SET source_url=excluded.source_url,affiliate_url=excluded.affiliate_url,last_checked_at=excluded.last_checked_at,updated_at=excluded.updated_at WHERE merchant_listings.status='active';`,
      `INSERT INTO collected_deals (id,payload,approved_payload,product_id,status,updated_at) VALUES (${quote(`${merchant}-${deal.merchantProductId}`)},${payload},${payload},${quote(productId)},'approved',${quote(now)}) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,approved_payload=CASE WHEN json_array_length(json_extract(excluded.approved_payload,'$.discoverySources'))>0 THEN excluded.approved_payload ELSE json_set(excluded.approved_payload,'$.discoverySources',json(COALESCE(json_extract(collected_deals.approved_payload,'$.discoverySources'),'[]'))) END,product_id=excluded.product_id,status='approved',updated_at=excluded.updated_at;`,
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
    throw new Error(("Cloudflare D1 command failed; check wrangler login / CLOUDFLARE_API_TOKEN on this Mac") + (detail ? ` (${detail.slice(0, 300)})` : ""));
  }

}
const rows = async (sql) => JSON.parse(await d1(["--json", "--command", sql]))[0]?.results ?? [];

async function open(page, url) {
  const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(3500);
  const text = (await page.locator("body").innerText().catch(() => "")).slice(0, 3000);
  if ((response?.status() ?? 0) === 403 || (response?.status() ?? 0) === 429 || challenge.test(text) || challenge.test(await page.title())) throw new Blocked(`Blocked at ${new URL(url).hostname} (HTTP ${response?.status() ?? "?"})`);
  if (!response?.ok()) throw new Error(`HTTP ${response?.status() ?? "no response"}`);
  return text;
}

async function storeState(merchant, probe) {
  if (probe) return { existing: new Map(), otherProducts: [] };
  const status = (await rows(`SELECT status FROM merchants WHERE id=${quote(merchant)}`))[0]?.status;
  if (status !== "active") return null;
  const existing = new Map((await rows(`SELECT ml.merchant_product_id AS id,p.id AS productId,p.status,ml.status AS listingStatus,ml.source_url AS url FROM merchant_listings ml JOIN products p ON p.id=ml.product_id WHERE ml.merchant=${quote(merchant)} ORDER BY COALESCE(ml.last_checked_at,'') ASC`)).map((r) => [String(r.id), r]));
  const otherProducts = await rows(`SELECT p.id,p.name,c.name AS category FROM products p JOIN categories c ON c.id=p.category_id WHERE p.status='published' AND EXISTS (SELECT 1 FROM merchant_listings o WHERE o.product_id=p.id AND o.merchant<>${quote(merchant)} AND o.status='active') AND NOT EXISTS (SELECT 1 FROM merchant_listings m WHERE m.product_id=p.id AND m.merchant=${quote(merchant)})`);
  return { existing, otherProducts };
}

async function runMyntra(page, { probe, started }) {
  const state = await storeState("myntra", probe);
  if (!state) return { merchant: "myntra", skipped: "Myntra merchant is not active" };
  const { existing, otherProducts } = state;
  const deals = [], failures = [], found = new Map();
  for (const path of probe ? MYNTRA_LISTINGS.slice(0, 1) : MYNTRA_LISTINGS) {
    try {
      await open(page, `https://www.myntra.com/${path}?sort=popularity`);
      const products = await page.evaluate(() => window.__myx?.searchData?.results?.products ?? []);
      for (const deal of myntraFromListing(products).slice(0, 8)) found.set(deal.merchantProductId, deal);
    } catch (error) { if (error instanceof Blocked) throw error; failures.push(`${path}:${error.message.slice(0, 40)}`); }
    await pause(PAUSE_MS);
  }
  const fresh = [...found.values()].filter((d) => !existing.has(d.merchantProductId)).sort((a, b) => (1 - b.price / b.mrp) - (1 - a.price / a.mrp)).slice(0, MAX_NEW);
  deals.push(...fresh.map((d) => ({ ...d, discoverySources: ["todays_deals"] })));
  for (const [id, row] of [...existing].filter(([, r]) => r.status === "published" && r.listingStatus === "active").slice(0, probe ? 0 : MAX_REFRESH)) {
    if (Date.now() - started > BUDGET_MS) break;
    const rediscovered = found.get(id);
    if (rediscovered) { deals.push({ ...rediscovered, discoverySources: [] }); continue; }
    const product = myntraProduct(row.url);
    if (!product) continue;
    try {
      await open(page, product.url);
      deals.push({ ...myntraFromPdp(await page.evaluate(() => window.__myx?.pdpData), product), discoverySources: [] });
    } catch (error) { if (error instanceof Blocked) throw error; failures.push(`${id}:${error.message.slice(0, 40)}`); }
    await pause(PAUSE_MS);
  }
  return { merchant: "myntra", deals, failures, existing, otherProducts, discovered: found.size };
}

async function runCroma(page, { probe, started }) {
  const state = await storeState("croma", probe);
  if (!state) return { merchant: "croma", skipped: "Croma merchant is not active" };
  const { existing, otherProducts } = state;
  const deals = [], failures = [], candidates = new Map();
  for (const url of probe ? CROMA_LISTINGS.slice(0, 1) : CROMA_LISTINGS) {
    try {
      await open(page, url);
      const hrefs = await page.$$eval("a[href*='/p/']", (as) => as.map((a) => a.getAttribute("href")));
      for (const p of hrefs.map(cromaProduct).filter(Boolean).slice(0, 6)) candidates.set(p.id, p);
    } catch (error) { if (error instanceof Blocked) throw error; failures.push(`${url}:${error.message.slice(0, 40)}`); }
    await pause(PAUSE_MS);
  }
  const extract = async (product) => {
    await open(page, product.url);
    const fields = await page.evaluate(() => ({
      name: document.querySelector("h1")?.textContent?.trim(),
      image: document.querySelector('meta[property="og:image"]')?.getAttribute("content"),
      price: document.querySelector("#pdp-product-price")?.textContent,
      mrp: [...document.querySelectorAll("span,div,p")].find((e) => e.childElementCount === 0 && /^MRP/i.test(e.textContent.trim()))?.parentElement?.textContent,
      status: document.body.innerText.slice(0, 5000),
    }));
    return cromaFromPage(fields, product);
  };
  const refresh = [...existing].filter(([, r]) => r.status === "published" && r.listingStatus === "active").slice(0, probe ? 0 : MAX_REFRESH).map(([, r]) => cromaProduct(r.url)).filter(Boolean);
  const fresh = [...candidates.values()].filter((p) => !existing.has(p.id)).slice(0, probe ? 2 : MAX_NEW * 2);
  for (const product of [...refresh, ...fresh]) {
    if (Date.now() - started > BUDGET_MS) break;
    try {
      const deal = await extract(product);
      const isNew = !existing.has(product.id);
      if (!isNew || (deal.mrp && 1 - deal.price / deal.mrp >= 0.1)) deals.push({ ...deal, discoverySources: isNew ? ["todays_deals"] : [] });
    } catch (error) { if (error instanceof Blocked) throw error; failures.push(`${product.id}:${error.message.slice(0, 40)}`); }
    await pause(PAUSE_MS);
  }
  // Cross-store matching: look up electronics already on Amazon/Flipkart in Croma search; attach strict matches.
  const taken = new Set([...existing.keys(), ...deals.map((d) => d.merchantProductId)]);
  const queue = otherProducts.filter((p) => p.category === "Electronics").sort(() => Math.random() - 0.5).slice(0, probe ? 2 : CROMA_MATCH);
  for (const other of queue) {
    if (Date.now() - started > BUDGET_MS) break;
    try {
      const q = searchQuery(other.name);
      await open(page, cromaSearch(q));
      const results = (await page.$$eval("a[href*='/p/']", (as) => as.map((a) => a.getAttribute("href")))).map(cromaProduct).filter(Boolean).slice(0, 2);
      await pause(PAUSE_MS);
      for (const candidate of results) {
        if (taken.has(candidate.id)) continue;
        const deal = await extract(candidate);
        await pause(PAUSE_MS);
        if (matchesProduct(other.name, deal.name)) { deals.push({ ...deal, discoverySources: [], matchProductId: other.id }); taken.add(candidate.id); break; }
      }
    } catch (error) { if (error instanceof Blocked) throw error; }
  }
  return { merchant: "croma", deals, failures, existing, otherProducts, discovered: candidates.size };
}

async function publish(result, marker, started) {
  const { merchant, deals, failures, existing, otherProducts } = result;
  if (!deals.length) return;
  const sql = publishSql(merchant, deals, existing, otherProducts);
  const record = `INSERT INTO sync_runs (merchant_id,status,products_seen,products_updated,error_message,started_at,finished_at) VALUES (${quote(merchant)},'succeeded',${deals.length + failures.length},${deals.length},${quote(`${marker}; updated=${deals.length}; failed=${failures.length}`)},${quote(new Date(started).toISOString())},${quote(new Date().toISOString())});`;
  const file = `outputs/laptop-stores/${merchant}-publish.sql`;
  await writeFile(file, sql + "\n" + record, { mode: 0o600 });
  await d1(["--file", file]);
}

async function main() {
  const probe = process.argv.includes("--probe");
  const only = process.argv.find((arg) => arg.startsWith("--store="))?.slice(8);
  await mkdir("outputs/laptop-stores", { recursive: true });
  const channel = process.env.OFFERLOOM_BROWSER_CHANNEL || "msedge";
  const browser = await chromium.launch({ headless: true, channel });
  const summary = [];
  try {
    for (const [name, run] of [["myntra", runMyntra], ["croma", runCroma]]) {
      if (only && only !== name) continue;
      const started = Date.now();
      const marker = `laptop-browser:${new Date(started + 19800000).toISOString().slice(0, 16)}`;
      const page = await browser.newPage({ locale: "en-IN" });
      try {
        const result = await run(page, { probe, started });
        if (result.skipped) { summary.push({ store: name, skipped: result.skipped }); continue; }
        if (!probe) await publish(result, marker, started);
        summary.push({ store: name, discovered: result.discovered, updated: result.deals.length, matched: result.deals.filter((d) => d.matchProductId).length, failed: result.failures.length, sample: result.deals.slice(0, 2).map((d) => `${d.name.slice(0, 40)} ₹${d.price / 100}`) });
      } catch (error) {
        summary.push({ store: name, [error instanceof Blocked ? "blocked" : "error"]: error.message });
      } finally { await page.close(); }
    }
  } finally { await browser.close(); }
  for (const line of summary) log(JSON.stringify(line));
  await writeFile("outputs/laptop-stores/summary.json", JSON.stringify({ at: new Date().toISOString(), probe, channel, summary }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((error) => {
  log(`laptop-stores failed: ${error.message}`);
  process.exitCode = 1;
});
