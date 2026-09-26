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
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.match(html, /Play<!-- --> banners|Play banners/);
  assert.ok(html.indexOf('class="campaignHero"') < html.indexOf('class="frontDeals"'));
  assert.doesNotMatch(html, /Up to 55% off/);
  assert.match(html, /Shop today.s product picks/);
  assert.match(html, /Filter product deals/);
  assert.match(html, /Follow our page/);
  assert.match(html, /Follow OfferLoom on Facebook for our latest deals/);
  assert.match(html, /dealAlertsFloat/);
  assert.doesNotMatch(html, /instagram\.com|telegram\.me|youtube\.com\/@offerloom|x\.com\/offerloom/);
  assert.match(html, /Amazon New Releases/);
  assert.match(html, /Amazon Bestsellers/);
  assert.match(html, /Today.s Deals/);
  assert.match(html, /facebook\.com\/profile\.php\?id=61594517871499/);
  assert.match(html, /View all/);
  assert.match(html, /AJIO Fashion Deals/);
  assert.match(html, /AJIO Bestselling Offers/);
  assert.match(html, /AJIO ACE partner offers/);
  assert.match(html, /Shop AJIO offer/);
  assert.match(html, /deals\?collection=new_releases/);
  assert.match(html, /deals\?collection=bestsellers/);
  assert.match(html, /deals\?collection=todays_deals/);
  assert.match(html, /deals\?merchant=ajio/);
  assert.match(html, /<a href="\/deals\?collection=bestsellers">View all/);
  assert.doesNotMatch(html, /whatsapp\.com\/channel/);
  assert.match(html, /aria-roledescription="carousel"/);
  assert.match(html, /aria-roledescription="carousel"/);
  assert.match(html, /As an Amazon Associate I earn from qualifying purchases\./);
  assert.match(html, /\/go\/amazon\/search\?k=/);
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
  const [page, memory] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../docs/PROJECT_MEMORY.md", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Browse on Amazon|View on Amazon/);
  // The 13-14 Sep 2026 homepage rework replaced the old "Tagged product link" copy; the compliance signals now are a sponsored rel on outbound Amazon links and the affiliate notice.
  assert.match(page, /rel="sponsored noopener noreferrer"/);
  assert.match(page, /may earn a commission/);
  assert.doesNotMatch(page, /AMAZON SHOPPING ENABLED|Browse electronics on Amazon\.in/);
  assert.doesNotMatch(page, /scrape|live Amazon price/i);
  assert.match(memory, /Never scrape .*without written authorization\./);
});
