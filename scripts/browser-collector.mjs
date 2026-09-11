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

export function money(text) {
  if (typeof text !== "string" || !text.trim()) return null;
  const match = text.replace(/,/g, "").match(/(?:₹|Rs\.?|INR)?\s*(\d+(?:\.\d{1,2})?)/i);
  const value = match ? Math.round(Number(match[1]) * 100) : NaN;
  return Number.isSafeInteger(value) && value > 0 && value < 100000000 ? value : null;
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
    price: "#corePriceDisplay_desktop_feature_div .a-price:not(.a-text-price) .a-offscreen, #corePrice_feature_div .a-price:not(.a-text-price) .a-offscreen",
    mrp: "#corePriceDisplay_desktop_feature_div .a-text-price .a-offscreen",
  } : { title: ".prod-name", image: "#myCarousel img", price: ".prod-sp", mrp: ".prod-cp" };
  await page.locator(selectors.title).first().waitFor({ state: "visible", timeout: 15000 });
  let name = (await page.locator(selectors.title).first().innerText()).trim();
  const read = async (selector) => await page.locator(selector).first().textContent({ timeout: 3000 }).catch(() => "");
  if (source.merchant === "ajio") name = `${await read(".brand-name")} ${name}`.trim();
  const imageUrl = await page.locator(selectors.image).first().getAttribute("src", { timeout: 3000 }).catch(() => null);
  const price = money(await read(selectors.price));
  const mrp = money(await read(selectors.mrp));
  if (name.length < 3 || !price || !imageUrl?.startsWith("https://")) throw new Error("Missing product title, image or price; no draft created");
  return { sourceUrl: source.url, merchant: source.merchant, merchantProductId: source.id, name: name.slice(0, 300), imageUrl,
    price, mrp: mrp && mrp >= price ? mrp : null, currency: "INR", checkedAt: new Date().toISOString(), category: source.merchant === "ajio" ? "Fashion" : "Electronics" };
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
        } catch (error) { errors.push({ sourceUrl: productSource(url).url, error: error.message.startsWith("Page unavailable") || error.message.startsWith("Access challenge") ? error.message : "Product could not be collected; review source or selectors" }); }
        finally { await page.close(); }
      }
    } finally { await browser.close(); }
    await writeFile("outputs/collector/latest.json", JSON.stringify({ deals: results }, null, 2), { mode: 0o600 });
    await writeFile("outputs/collector/status.json", JSON.stringify({ checkedAt: new Date().toISOString(), collected: results.length, errors }, null, 2), { mode: 0o600 });
    if (endpoint && results.length) {
      const response = await fetch(endpoint, { method: "POST", redirect: "error", signal: AbortSignal.timeout(30000), headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OFFERLOOM_ADMIN_TOKEN}` }, body: JSON.stringify({ action: "ingest", deals: results }) });
      if (!response.ok) throw new Error(`Draft ingestion failed (${response.status})`);
    }
    if (process.argv.includes("--d1-remote")) {
      // Owner-operated alternative when Wrangler is already authenticated. Only stage drafts.
      const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
      const statements = results.map((deal) => `INSERT INTO collected_deals (id,payload,status,updated_at) VALUES (${quote(`${deal.merchant}-${deal.merchantProductId}`)},${quote(JSON.stringify(deal))},'pending',${quote(new Date().toISOString())}) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,status='pending',updated_at=excluded.updated_at;`);
      for (const merchant of new Set(config.urls.map((url) => productSource(url).merchant))) {
        const failures = errors.filter((error) => productSource(error.sourceUrl).merchant === merchant);
        const count = results.filter((deal) => deal.merchant === merchant).length;
        const now = quote(new Date().toISOString());
        statements.push(`INSERT INTO sync_runs (merchant_id,status,products_seen,products_updated,error_message,started_at,finished_at) VALUES (${quote(merchant)},${quote(failures.length ? "failed" : "succeeded")},${count+failures.length},${count},${failures.length ? quote(failures.map((failure) => failure.error).join("; ")) : "NULL"},${now},${now});`);
      }
      const sql = statements.join("\n");
      await writeFile("outputs/collector/drafts.sql", sql, { mode: 0o600 });
      await promisify(execFile)("npx", ["--no-install", "wrangler", "d1", "execute", "offerloom", "--remote", "--file", "outputs/collector/drafts.sql"], { timeout: 60000 });
    }
    console.log(JSON.stringify({ collected: results.length, blockedOrUnavailable: errors.length, draftsSent: Boolean((endpoint || process.argv.includes("--d1-remote")) && results.length) }));
    if (!process.argv.includes("--watch")) break;
    await new Promise((resolve) => setTimeout(resolve, intervalHours * 3600000));
  } while (process.argv.includes("--watch"));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(() => { console.error("Collector failed. Check configuration, browser installation and endpoint access. No credentials logged."); process.exitCode = 1; });
