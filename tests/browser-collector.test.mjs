import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { productSource, money, collect, categorize, isTransientError, isNetworkError, withRetry, waitForNetwork, saveFailureDiagnostics, imageAllowed } from "../scripts/browser-collector.mjs";

test("collector only accepts direct merchant product pages and removes affiliate parameters", () => {
  assert.equal(productSource("https://www.amazon.in/title/dp/B07PPS3ZZY?tag=other-21").url, "https://www.amazon.in/dp/B07PPS3ZZY");
  for (const url of ["http://www.amazon.in/dp/B07PPS3ZZY", "https://amazon.in.evil.test/dp/B07PPS3ZZY", "https://127.0.0.1/", "https://www.amazon.in/s?k=shoes", "https://user:pass@www.amazon.in/dp/B07PPS3ZZY"]) assert.throws(() => productSource(url));
});
test("prices preserve paise and reject absent observations", () => {
  assert.equal(money("₹1,599.50"),159950);
  assert.equal(money(""),null);
  assert.equal(money("Currently unavailable"),null);
});
test("collector stops at challenges before extracting product details", async () => {
  const page = { goto: async () => ({ok: () => true}), url: () => "https://www.amazon.in/dp/B07PPS3ZZY", locator: () => ({innerText: async () => "Robot Check: Enter the characters you see"}) };
  await assert.rejects(collect(page,"https://www.amazon.in/dp/B07PPS3ZZY"),/Access challenge/);
});

test("all-numeric (ISBN-10) Amazon ASINs are categorised as Books even without book keywords in the title", () => {
  assert.equal(categorize("amazon", "Atomic Habits: Tiny Changes, Remarkable Results", "1847941834"), "Books");
  assert.equal(categorize("amazon", "Atomic Habits: Tiny Changes, Remarkable Results", "935543135X"), "Books");
  assert.equal(categorize("amazon", "Atomic Habits: Tiny Changes, Remarkable Results", "B0B6HM36Z8"), "Electronics");
  assert.equal(categorize("amazon", "Portronics Car Mobile Phone Holder for Dashboard", "B0B6HM36Z8"), "Auto");
});

// --- Retry / classification -------------------------------------------------------------------

test("transient failures are retried; permanent ones are not", () => {
  for (const message of ["page.goto: Timeout 45000ms exceeded.", "page.goto: net::ERR_NETWORK_CHANGED at https://www.amazon.in/dp/B0HB5JNXPX", "Page unavailable (503)", "Page unavailable (429)", "Missing product title, image or price; no draft created"]) assert.equal(isTransientError(message), true, message);
  for (const message of ["Access challenge; collection stopped", "Unexpected product redirect", "Currently unavailable; no draft created", "Page unavailable (404)", "Product image is not on an approved merchant image host; no draft created"]) assert.equal(isTransientError(message), false, message);
  assert.equal(isNetworkError("net::ERR_NETWORK_CHANGED"), true);
  assert.equal(isNetworkError("Timeout 45000ms exceeded"), false);
});

test("withRetry retries transient errors with backoff and waits for the network after a network change", async () => {
  const pauses = []; let networkChecks = 0; const retried = [];
  const result = await withRetry(async (n) => { if (n === 1) throw new Error("net::ERR_NETWORK_CHANGED at https://www.amazon.in/dp/B09NKYWRD2"); if (n === 2) throw new Error("Timeout 60000ms exceeded"); return "ok"; },
    { pause: async (ms) => pauses.push(ms), checkNetwork: async () => { networkChecks += 1; }, onRetry: async (n) => retried.push(n) });
  assert.equal(result, "ok");
  assert.equal(networkChecks, 1);
  assert.deepEqual(retried, [1, 2]);
  assert.equal(pauses.length, 2);
  assert.ok(pauses[0] >= 8000 && pauses[1] >= 25000);
});

test("withRetry gives up immediately on challenges and after one retry on missing fields", async () => {
  let calls = 0;
  await assert.rejects(withRetry(async () => { calls += 1; throw new Error("Access challenge; collection stopped"); }, { pause: async () => {} }), /Access challenge/);
  assert.equal(calls, 1);
  calls = 0;
  await assert.rejects(withRetry(async () => { calls += 1; throw new Error("Missing product title, image or price; no draft created"); }, { pause: async () => {} }), /Missing product/);
  assert.equal(calls, 2);
  calls = 0;
  await assert.rejects(withRetry(async () => { calls += 1; throw new Error("Timeout 60000ms exceeded"); }, { pause: async () => {} }), /Timeout/);
  assert.equal(calls, 3);
});

test("waitForNetwork returns once DNS answers and gives up after the limit", async () => {
  let attempts = 0;
  assert.equal(await waitForNetwork({ resolve: async () => { attempts += 1; if (attempts < 3) throw new Error("ENOTFOUND"); }, pause: async () => {}, stepMs: 1, maxWaitMs: 100 }), true);
  assert.equal(attempts, 3);
  assert.equal(await waitForNetwork({ resolve: async () => { throw new Error("ENOTFOUND"); }, pause: async () => {}, stepMs: 10, maxWaitMs: 30 }), false);
});

test("only approved merchant image hosts are accepted", () => {
  assert.equal(imageAllowed("amazon", "https://m.media-amazon.com/images/I/x.jpg"), true);
  assert.equal(imageAllowed("amazon", "https://evil.example.com/x.jpg"), false);
  assert.equal(imageAllowed("amazon", "http://m.media-amazon.com/x.jpg"), false);
  assert.equal(imageAllowed("ajio", "https://assets-jiocdn.ajio.com/x.jpg"), true);
});

// --- Layout fixtures in a real browser (no Amazon traffic: every request is intercepted) ---------

let browser;
try { browser = await chromium.launch({ headless: true, ...(process.env.OFFERLOOM_CHROME_CHANNEL ? { channel: process.env.OFFERLOOM_CHROME_CHANNEL } : {}), ...(process.env.OFFERLOOM_TEST_CHROMIUM ? { executablePath: process.env.OFFERLOOM_TEST_CHROMIUM } : {}) }); } catch { browser = null; }

async function fixturePage(name, asin = "B0FIXTURE1") {
  const html = await readFile(new URL(`../fixtures/amazon/${name}.html`, import.meta.url), "utf8");
  const page = await browser.newPage();
  const requested = [];
  await page.route("**/*", (route) => {
    const url = route.request().url(); requested.push(url);
    return url === `https://www.amazon.in/dp/${asin}` ? route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: html }) : route.abort();
  });
  return { page, requested, url: `https://www.amazon.in/dp/${asin}` };
}

for (const [name, expected] of [
  ["core-desktop", { price: 159900, mrp: 349900, category: "Electronics" }],
  ["apex-price-variant", { price: 29900, mrp: 79900, category: "Auto" }],
  ["book", { price: 47200, mrp: 89900, category: "Books", asin: "1847941834" }],
  ["delayed-price", { price: 47500, mrp: null, category: "Toys" }],
]) {
  test(`collector reads the ${name} price layout`, { skip: !browser && "no Chromium available" }, async () => {
    const { page, url, requested } = await fixturePage(name, expected.asin);
    try {
      const deal = await collect(page, url);
      assert.equal(deal.price, expected.price);
      assert.equal(deal.mrp, expected.mrp);
      assert.equal(deal.category, expected.category);
      assert.ok(deal.imageUrl.startsWith("https://m.media-amazon.com/"));
      assert.ok(requested.some((u) => u.startsWith("https://www.amazon.in/")));
    } finally { await page.close(); }
  });
}

test("collector reports unavailable products as permanent, not as a selector failure", { skip: !browser && "no Chromium available" }, async () => {
  const { page, url } = await fixturePage("unavailable");
  try { await assert.rejects(collect(page, url), /Currently unavailable/); } finally { await page.close(); }
});

test("collector refuses images outside approved merchant hosts", { skip: !browser && "no Chromium available" }, async () => {
  const { page, url } = await fixturePage("bad-image");
  try { await assert.rejects(collect(page, url), /approved merchant image host/); } finally { await page.close(); }
});

test("unknown price layout fails loudly and saves diagnostics showing where the price is", { skip: !browser && "no Chromium available" }, async () => {
  const { page, url } = await fixturePage("no-price", "B0FIXTURE2");
  const dir = await mkdtemp(join(tmpdir(), "offerloom-diag-"));
  try {
    await assert.rejects(collect(page, url), /Missing product title, image or price/);
    await saveFailureDiagnostics(page, productSource(url), "Missing product title, image or price", dir);
    const files = await readdir(dir);
    assert.ok(files.includes("B0FIXTURE2.json"));
    const report = JSON.parse(await readFile(join(dir, "B0FIXTURE2.json"), "utf8"));
    assert.equal(report.hasProductTitle, true);
    assert.ok(report.priceCandidates.some((line) => line.includes("₹999.00") && line.includes("mystery-price-box")));
  } finally { await page.close(); }
});

after(async () => { await browser?.close(); });
