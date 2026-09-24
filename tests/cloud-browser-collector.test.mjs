import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { chromium } from "playwright";
import { uniqueProductUrls, discover, selectDeals, publishSql } from "../scripts/cloud-browser-collector.mjs";

const deal = (asin, price = 50000) => ({ merchant: "amazon", merchantProductId: asin, sourceUrl: `https://www.amazon.in/dp/${asin}`, name: "Owner's kitchen storage", category: "Home", imageUrl: "https://m.media-amazon.com/images/I/test.jpg", price, mrp: 100000, currency: "INR", checkedAt: new Date().toISOString() });

test("discovery canonicalizes and deduplicates Amazon product links only", () => {
  assert.deepEqual(uniqueProductUrls(["https://www.amazon.in/name/dp/B000000001?ref=x", "https://www.amazon.in/dp/B000000001", "https://evil.test/dp/B000000002", "https://www.amazon.in/gp/bestsellers", "javascript:alert(1)"]), ["https://www.amazon.in/dp/B000000001"]);
});

test("new deal cap, duplicate checks and unpublished products are respected", () => {
  const existing = new Map([["B000000001", { status: "published", listingStatus: "active" }], ["B000000002", { status: "archived", listingStatus: "active" }]]);
  const result = selectDeals([deal("B000000001"), deal("B000000002"), deal("B000000003", 30000), deal("B000000004", 95000), deal("B000000005"), deal("B000000003", 30000)], existing, 1);
  assert.deepEqual(result.refresh.map((d) => d.merchantProductId), ["B000000001"]);
  assert.deepEqual(result.additions.map((d) => d.merchantProductId), ["B000000003"]);
});

test("publication uses actual schema, escapes titles, preserves URLs and adds affiliate tag", async () => {
  const db = new DatabaseSync(":memory:");
  try {
    for (const file of ["0000_tiny_drax.sql", "0001_lowly_zodiak.sql", "0002_chemical_the_santerians.sql", "0005_redundant_marvel_zombies.sql"]) db.exec(await readFile(new URL(`../drizzle/${file}`, import.meta.url), "utf8"));
    const item = deal("B000000001");
    db.exec(publishSql([item], new Map()));
    const before = db.prepare("SELECT * FROM products").get();
    assert.equal(before.name, item.name);
    assert.match(before.slug, /amazon-b000000001$/);
    assert.equal(db.prepare("SELECT affiliate_url AS url FROM merchant_listings").get().url, "https://www.amazon.in/dp/B000000001?tag=offerloom-21");
    const existing = new Map([[item.merchantProductId, { productId: before.id, status: "published", listingStatus: "active" }]]);
    db.exec(publishSql([{ ...item, name: "Changed title" }], existing));
    assert.equal(db.prepare("SELECT slug FROM products").get().slug, before.slug);
    db.exec("UPDATE products SET status='archived'");
    existing.get(item.merchantProductId).status = "archived";
    assert.equal(publishSql([item], existing), "");
  } finally { db.close(); }
});

test("browser discovery extracts bestseller cards and stops on access challenges", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    let html = '<div id="gridItemRoot"><a href="/dp/B000000001">Item</a></div>';
    await page.route("**/*", (route) => route.fulfill({ status: 200, contentType: "text/html", body: html }));
    assert.deepEqual(await discover(page, "https://www.amazon.in/gp/bestsellers/electronics"), ["https://www.amazon.in/dp/B000000001"]);
    html = "<h1>Robot Check</h1>";
    await assert.rejects(discover(page, "https://www.amazon.in/gp/bestsellers/electronics"), /Access challenge/);
  } finally { await browser.close(); }
});

test("Today's Deals discovery reads only product cards and preserves source diversity", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.route("**/*", (route) => route.fulfill({ status: 200, contentType: "text/html", body: '<a href="/dp/B000000099">Outside</a><div id="slots-container"><div data-testid="product-card"><a href="/dp/B000000003">Deal</a></div></div>' }));
    assert.deepEqual(await discover(page, "https://www.amazon.in/gp/goldbox"), ["https://www.amazon.in/dp/B000000003"]);
    const a = { ...deal("B000000001", 10000), discoverySource: "bestsellers" };
    const b = { ...deal("B000000002", 50000), discoverySource: "todays_deals" };
    const c = { ...deal("B000000003", 20000), discoverySource: "bestsellers" };
    assert.deepEqual(selectDeals([a, b, c], new Map(), 2).additions.map((d) => d.merchantProductId), [b.merchantProductId, a.merchantProductId]);
  } finally { await browser.close(); }
});
