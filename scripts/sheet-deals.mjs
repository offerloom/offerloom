// Uploads hand-picked AJIO / Myntra / Croma deals from deals-sheet.csv (filled by the owner or team in a normal
// browser) to the live D1 catalogue, with prices, photos and cross-store matching. Run every 3 hours by the
// com.offerloom.laptop-stores LaunchAgent. Each row keeps its own checked time, so re-uploading an unchanged
// sheet never makes an old price look fresh; prices older than 24 h are hidden by publicOffer().
import { readFile, stat, mkdir, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { categorize } from "./browser-collector.mjs";
import { myntraProduct, cromaProduct, publishSql } from "./laptop-stores.mjs";
import { ajioProduct, aceLink } from "./ajio-collector.mjs";

/** Amway India product pages: https://www.amway.in/<slug>/p/<digits>ID (sold by the owner as an ABO). */
export function amwayProduct(href) {
  try {
    const url = new URL(href);
    const match = url.pathname.match(/^\/([a-z0-9-]+)\/p\/(\d{4,10}ID)$/i);
    if (url.protocol !== "https:" || !/^(www\.)?amway\.in$/.test(url.hostname) || !match) return null;
    return { id: match[2].toUpperCase(), url: `https://www.amway.in/${match[1].toLowerCase()}/p/${match[2].toUpperCase()}` };
  } catch { return null; }
}

export const COLUMNS = ["store", "product_url", "name", "price", "mrp", "image_url", "category", "checked_at"];
const STORES = {
  ajio: { parse: ajioProduct, images: /^(assets|assets-jiocdn)\.ajio\.com$/, link: (p) => aceLink(p) },
  myntra: { parse: myntraProduct, images: /(^|\.)myntassets\.com$/, link: (p) => p.url },
  amway: { parse: amwayProduct, images: /(^|\.)amway\.(in|com)$|(^|\.)amwayglobal\.com$/, link: (p) => p.url },
  croma: { parse: cromaProduct, images: /(^|\.)tatacroma\.com$|(^|\.)croma\.com$/, link: (p) => p.url },
};

/** Minimal CSV parser (quotes, commas and newlines inside quotes). */
export function parseCsv(text) {
  const rows = []; let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) { if (c === '"' && text[i + 1] === '"') { field += '"'; i += 1; } else if (c === '"') quoted = false; else field += c; continue; }
    if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i += 1; row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim()));
}

const rupees = (value) => { const v = Math.round(Number(String(value ?? "").replace(/[^\d.]/g, "")) * 100); return Number.isSafeInteger(v) && v > 0 && v < 100000000 ? v : null; };

/** Validated deal from one sheet row, or throws a short reason. */
export function dealFromRow(record, fallbackCheckedAt) {
  const store = String(record.store ?? "").trim().toLowerCase();
  const config = STORES[store];
  if (!config) throw new Error(`unknown store "${record.store}" (use ajio, myntra, croma or amway)`);
  const product = config.parse(String(record.product_url ?? "").trim());
  if (!product) throw new Error(`not a ${store} product URL`);
  const price = rupees(record.price), mrpValue = rupees(record.mrp);
  if (!price) throw new Error("missing price");
  let imageUrl = null;
  try { const u = new URL(String(record.image_url ?? "").trim().replace(/^http:/, "https:")); if (config.images.test(u.hostname)) imageUrl = u.toString(); } catch { /* invalid */ }
  if (!imageUrl) throw new Error(`image must be a ${store} product photo URL`);
  const name = String(record.name ?? "").trim().slice(0, 200);
  if (name.length < 3) throw new Error("missing name");
  const checked = Date.parse(String(record.checked_at ?? "").trim());
  const checkedAt = Number.isFinite(checked) ? new Date(checked).toISOString() : fallbackCheckedAt;
  if (Date.parse(checkedAt) > Date.now() + 5 * 60000) throw new Error("checked_at is in the future");
  const category = String(record.category ?? "").trim() || (store === "croma" ? categorize("croma", name) : store === "amway" ? "Amway" : "Fashion");
  return { merchant: store, merchantProductId: product.id, sourceUrl: product.url, affiliateUrl: config.link(product), name, brand: name.split(/\s+/)[0], imageUrl, price, mrp: mrpValue && mrpValue > price ? mrpValue : null, currency: "INR", category, checkedAt, discoverySources: ["todays_deals"] };
}

// The Mac often runs this right after login/wake, before the network is up, so D1 calls retry
// (30 s, then 90 s) and the error keeps wrangler's own message text (long tokens masked).
async function d1(args, delays = [30000, 90000]) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const { stdout } = await promisify(execFile)("npx", ["--no-install", "wrangler", "d1", "execute", "offerloom", "--remote", ...args], { timeout: 180000, maxBuffer: 8000000 });
      return stdout;
    } catch (error) {
      if (attempt < delays.length) { console.log(`D1 call failed (attempt ${attempt + 1}); retrying in ${delays[attempt] / 1000}s`); await new Promise((r) => setTimeout(r, delays[attempt])); continue; }
      const text = `${error?.stderr ?? ""}\n${error?.stdout ?? ""}`;
      const message = [...text.matchAll(/"(?:message|text)"\s*:\s*"([^"]{3,200})"/g)].map((m) => m[1]).slice(-2);
      const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 3 && /[a-z]/i.test(l)).slice(-2);
      throw new Error(`Cloudflare D1 command failed (${[...(message.length ? message : lines)].join(" | ").replace(/[A-Za-z0-9_-]{30,}/g, "…").slice(0, 300) || error?.code})`);
    }
  }
}
const rows = async (sql) => JSON.parse(await d1(["--json", "--command", sql]))[0]?.results ?? [];
const quote = (v) => `'${String(v).replaceAll("'", "''")}'`;

async function main() {
  const root = resolve(import.meta.dirname, "..");
  const file = resolve(root, process.argv.find((a) => a.endsWith(".csv")) ?? "deals-sheet.csv");
  let text;
  try { text = await readFile(file, "utf8"); } catch { console.log(`No sheet at ${file}; nothing to upload. Copy deals-sheet.template.csv to deals-sheet.csv to start.`); return; }
  const fallbackCheckedAt = (await stat(file)).mtime.toISOString();
  const [header, ...body] = parseCsv(text);
  const index = Object.fromEntries((header ?? []).map((h, i) => [h.trim().toLowerCase(), i]));
  const missing = ["store", "product_url", "name", "price", "image_url"].filter((c) => !(c in index));
  if (missing.length) throw new Error(`deals-sheet.csv is missing columns: ${missing.join(", ")}`);
  const byStore = new Map(), problems = [];
  body.forEach((cells, n) => {
    const record = Object.fromEntries(Object.entries(index).map(([k, i]) => [k, cells[i]]));
    try { const deal = dealFromRow(record, fallbackCheckedAt); byStore.set(deal.merchant, [...(byStore.get(deal.merchant) ?? []), deal]); }
    catch (error) { problems.push(`row ${n + 2}: ${error.message}`); }
  });
  await mkdir(resolve(root, "outputs/laptop-stores"), { recursive: true });
  const summary = { file, rows: body.length, problems };
  for (const [merchant, deals] of byStore) {
    const status = (await rows(`SELECT status FROM merchants WHERE id=${quote(merchant)}`))[0]?.status;
    if (status !== "active") { summary[merchant] = `skipped: ${merchant} is not active in admin`; continue; }
    const existing = new Map((await rows(`SELECT ml.merchant_product_id AS id,p.id AS productId,p.status,ml.status AS listingStatus FROM merchant_listings ml JOIN products p ON p.id=ml.product_id WHERE ml.merchant=${quote(merchant)}`)).map((r) => [String(r.id), r]));
    const otherProducts = await rows(`SELECT p.id,p.name,c.name AS category FROM products p JOIN categories c ON c.id=p.category_id WHERE p.status='published' AND EXISTS (SELECT 1 FROM merchant_listings o WHERE o.product_id=p.id AND o.merchant<>${quote(merchant)} AND o.status='active') AND NOT EXISTS (SELECT 1 FROM merchant_listings m WHERE m.product_id=p.id AND m.merchant=${quote(merchant)})`);
    const sqlFile = resolve(root, `outputs/laptop-stores/sheet-${merchant}.sql`);
    await writeFile(sqlFile, publishSql(merchant, deals, existing, otherProducts), { mode: 0o600 });
    await d1(["--file", sqlFile]);
    summary[merchant] = `${deals.length} uploaded`;
  }
  console.log(JSON.stringify(summary));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((error) => { console.log(`sheet upload failed: ${error.message}`); process.exitCode = 1; });
