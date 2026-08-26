import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the OfferLoom shopping experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /OfferLoom/);
  assert.match(html, /Upgrade your everyday tech\./);
  assert.match(html, /Start with a category/);
  assert.match(html, /Filter by department/);
  assert.match(html, /Get every deal first on WhatsApp/);
  assert.match(html, /instagram\.com\/offer\.loom/);
  assert.match(html, /youtube\.com\/@offerloom/);
  assert.match(html, /Explore what interests you/);
  assert.match(html, /aria-roledescription="carousel"/);
  assert.match(html, /aria-roledescription="carousel"/);
  assert.match(html, /As an Amazon Associate I earn from qualifying purchases\./);
  assert.match(html, /tag=offerloom-21/);
  assert.match(html, /rel="sponsored noopener noreferrer"/);
  assert.match(html, /Buying guides/);
  assert.match(html, /Privacy Policy/);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview/);
});

test("renders public business and guide pages", async () => {
  const pages = [
    ["/about", /About OfferLoom/],
    ["/contact", /contact\.offerloom@gmail\.com/],
    ["/privacy", /Privacy Policy/],
    ["/guides", /Buying guides/],
    ["/guides/electronics", /Electronics buying guide for Indian shoppers/],
    ["/affiliate-disclosure", /Amazon Associate/],
    ["/grievance", /Grievance Officer/],
  ];

  for (const [path, pattern] of pages) {
    const response = await render(path);
    assert.equal(response.status, 200, `${path} should return 200`);
    const html = await response.text();
    assert.match(html, pattern, `${path} should include expected copy`);
    assert.match(html, /As an Amazon Associate I earn from qualifying purchases\./);
  }
});

test("keeps shopping claims and unavailable merchants compliant", async () => {
  const [page, handoff] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../docs/PROJECT_HANDOFF.md", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Available destination:/);
  assert.match(page, /View current offers/);
  assert.doesNotMatch(page, /AMAZON SHOPPING ENABLED|Browse electronics on Amazon\.in/);
  assert.doesNotMatch(page, /scrape|live Amazon price/i);
  assert.match(handoff, /Do not scrape marketplaces without permission\./);
});
