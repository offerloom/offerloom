import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import { collect, productSource, withRetry } from "./browser-collector.mjs";

const SOURCES = [
  "https://www.amazon.in/gp/bestsellers/electronics",
  "https://www.amazon.in/gp/bestsellers/kitchen",
  "https://www.amazon.in/gp/bestsellers/apparel",
  "https://www.amazon.in/gp/bestsellers/beauty",
  "https://www.amazon.in/gp/bestsellers/sports",
  "https://www.amazon.in/gp/bestsellers/toys",
];
const challenge = /captcha|robot check|access denied|verify you are human|automated access|enter the characters you see/i;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

export function uniqueProductUrls(links) {
  const found = new Map();
  for (const link of links) {
    try {
      const source = productSource(link);
      if (source.merchant === "amazon") found.set(source.id, source.url);
    } catch { /* Non-product and outside links are not discovery inputs. */ }
  }
  return [...found.values()];
}

export async function discover(page, url) {
  if (!SOURCES.includes(url)) throw new Error("Unapproved discovery page");
  const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  if (!response?.ok()) throw new Error(`Discovery unavailable (${response?.status() ?? "no response"})`);
  const destination = new URL(page.url());
  if (destination.hostname !== "www.amazon.in" || !destination.pathname.startsWith("/gp/bestsellers")) throw new Error("Unexpected discovery redirect");
  if (challenge.test((await page.locator("body").innerText()).slice(0, 12000))) throw new Error("Access challenge; cloud run stopped");
  const cards = page.locator('#zg-ordered-list a[href], #gridItemRoot a[href], .zg-grid-general-faceout a[href]');
  await cards.first().waitFor({ state: "attached", timeout: 15000 });
  const urls = uniqueProductUrls(await cards.evaluateAll((elements) => elements.map((element) => element.href)));
  if (!urls.length) throw new Error("Discovery returned no product links");
  return urls;
}

export function selectDeals(deals, existing, maxNew = 10) {
  const unique = [...new Map(deals.map((deal) => [deal.merchantProductId, deal])).values()];
  const allowed = (old) => old?.status === "published" && old?.listingStatus === "active";
  const refresh = unique.filter((deal) => allowed(existing.get(deal.merchantProductId)));
  const additions = unique.filter((deal) => !existing.has(deal.merchantProductId) && deal.mrp && (1 - deal.price / deal.mrp) >= 0.1)
    .sort((a, b) => (1 - b.price / b.mrp) - (1 - a.price / a.mrp) || a.merchantProductId.localeCompare(b.merchantProductId)).slice(0, maxNew);
  return { refresh, additions };
}

export function publishSql(deals, existing, now = new Date().toISOString()) {
  const statements = [];
  for (const deal of deals) {
    const old = existing.get(deal.merchantProductId);
    if (old && (old.status !== "published" || old.listingStatus !== "active")) continue;
    const id = old?.productId ?? `amazon-${deal.merchantProductId.toLowerCase()}`;
    const category = slug(deal.category), dealId = `amazon-${deal.merchantProductId}`;
    const affiliate = `https://www.amazon.in/dp/${deal.merchantProductId}?tag=offerloom-21`;
    const payload = quote(JSON.stringify(deal));
    statements.push(
      `INSERT INTO categories (id,name,slug,position,created_at) VALUES (${quote(`cat-${category}`)},${quote(deal.category)},${quote(category)},0,${quote(now)}) ON CONFLICT(slug) DO NOTHING;`,
      `INSERT INTO products (id,category_id,name,slug,summary,image_url,specs_json,status,source,created_at,updated_at,published_at) VALUES (${quote(id)},(SELECT id FROM categories WHERE slug=${quote(category)}),${quote(deal.name)},${quote(`${slug(deal.name)}-${id}`)},'Confirm current price, stock and specifications on Amazon.in before buying.',${quote(deal.imageUrl)},'[]','published','browser_auto',${quote(now)},${quote(now)},${quote(now)}) ON CONFLICT(id) DO UPDATE SET name=excluded.name,image_url=excluded.image_url,updated_at=excluded.updated_at WHERE products.status='published';`,
      `INSERT INTO merchant_listings (id,product_id,merchant,merchant_product_id,source_url,affiliate_url,status,last_checked_at,created_at,updated_at) VALUES (${quote(`cloud-${deal.merchantProductId}`)},${quote(id)},'amazon',${quote(deal.merchantProductId)},${quote(deal.sourceUrl)},${quote(affiliate)},'active',${quote(deal.checkedAt)},${quote(now)},${quote(now)}) ON CONFLICT(merchant,merchant_product_id) DO UPDATE SET affiliate_url=excluded.affiliate_url,last_checked_at=excluded.last_checked_at,updated_at=excluded.updated_at WHERE merchant_listings.status='active';`,
      `INSERT INTO collected_deals (id,payload,approved_payload,product_id,status,updated_at) VALUES (${quote(dealId)},${payload},${payload},${quote(id)},'approved',${quote(now)}) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,approved_payload=excluded.approved_payload,product_id=excluded.product_id,status='approved',updated_at=excluded.updated_at;`,
    );
  }
  return statements.join("\n");
}

async function d1(args) {
  try {
    const { stdout } = await promisify(execFile)("npx", ["--no-install", "wrangler", "d1", "execute", "offerloom", "--remote", ...args], { timeout: 180000, maxBuffer: 4000000 });
    return stdout;
  } catch { throw new Error("Cloudflare D1 command failed; check runner credentials and D1 access"); }
}
async function readCatalogue() {
  const result = JSON.parse(await d1(["--json", "--command", "SELECT ml.merchant_product_id AS asin,p.id AS productId,p.status,ml.status AS listingStatus,ml.last_checked_at AS checkedAt FROM merchant_listings ml JOIN products p ON p.id=ml.product_id WHERE ml.merchant='amazon' ORDER BY COALESCE(ml.last_checked_at,'') ASC"]));
  return new Map(result[0].results.map((row) => [row.asin, row]));
}
async function activeMerchant() {
  const result = JSON.parse(await d1(["--json", "--command", "SELECT status FROM merchants WHERE id='amazon'"]));
  if (result[0]?.results[0]?.status !== "active") throw new Error("Amazon merchant is paused; no publication");
}

async function main() {
  const probe = process.argv.includes("--probe"), started = Date.now();
  await mkdir("outputs/cloud-collector", { recursive: true });
  let existing = new Map();
  if (!probe) { await activeMerchant(); existing = await readCatalogue(); }
  const browser = await chromium.launch({ headless: true });
  const deals = [], failures = [];
  let discovered = [];
  try {
    const page = await browser.newPage();
    await page.route("**/*", (route) => {
      const request = route.request();
      if (request.isNavigationRequest() && !["amazon.in", "www.amazon.in"].includes(new URL(request.url()).hostname)) return route.abort();
      return ["media", "font"].includes(request.resourceType()) ? route.abort() : route.continue();
    });
    for (const url of probe ? SOURCES.slice(0, 1) : SOURCES) {
      discovered.push(...(await discover(page, url)).filter((candidate) => !existing.has(productSource(candidate).id)).slice(0, 5));
      await pause(5000);
    }
    discovered = uniqueProductUrls(discovered);
    const refresh = [...existing.entries()].filter(([, row]) => row.status === "published" && row.listingStatus === "active").slice(0, 100).map(([asin]) => `https://www.amazon.in/dp/${asin}`);
    const newUrls = discovered.filter((url) => !existing.has(productSource(url).id)).slice(0, 30);
    const urls = probe ? discovered.slice(0, 1) : uniqueProductUrls([...newUrls, ...refresh]);
    for (const url of urls) {
      if (Date.now() - started > 20 * 60000) throw new Error("Cloud run exceeded its collection budget; no publication");
      try {
        deals.push(await withRetry(() => collect(page, url), { maxAttempts: 2 }));
        console.log(`Collected ${productSource(url).id}`);
      } catch (error) {
        if (/Access challenge|Page unavailable \((403|429)\)/i.test(error.message)) throw new Error("Amazon blocked the cloud browser; no publication");
        failures.push({ asin: productSource(url).id, reason: "Product unavailable or could not be validated" });
      }
      await pause(5000);
    }
  } finally { await browser.close(); }
  if (!deals.length) throw new Error("No validated product observations; no publication");
  let added = 0, refreshed = 0;
  if (!probe) {
    await activeMerchant();
    existing = await readCatalogue();
    const selection = selectDeals(deals, existing);
    added = selection.additions.length; refreshed = selection.refresh.length;
    const sql = publishSql([...selection.refresh, ...selection.additions], existing);
    const now = new Date().toISOString();
    const record = `INSERT INTO sync_runs (merchant_id,status,products_seen,products_updated,error_message,started_at,finished_at) VALUES ('amazon',${quote(failures.length ? "failed" : "succeeded")},${deals.length + failures.length},${added + refreshed},${failures.length ? quote(`Cloud browser: ${failures.length} products unavailable`) : "NULL"},${quote(new Date(started).toISOString())},${quote(now)});`;
    await writeFile("outputs/cloud-collector/publish.sql", sql + "\n" + record, { mode: 0o600 });
    await d1(["--file", "outputs/cloud-collector/publish.sql"]);
  }
  const summary = { mode: probe ? "probe (no database writes)" : "publish", discovered: discovered.length, validated: deals.length, added, refreshed, failed: failures.length };
  await writeFile("outputs/cloud-collector/summary.json", JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((error) => {
  console.error(error.message.startsWith("Cloudflare") || /Discovery|discovery|cloud|publication|Amazon merchant/.test(error.message) ? error.message : "Cloud collection failed; no successful run recorded");
  process.exitCode = 1;
});
