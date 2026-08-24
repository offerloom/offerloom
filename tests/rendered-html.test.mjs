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
  assert.match(html, /Find it faster\./);
  assert.match(html, /Start with a category/);
  assert.match(html, /Popular Amazon searches/);
  assert.match(html, /As an Amazon Associate I earn from qualifying purchases\./);
  assert.match(html, /tag=offerloom-21/);
  assert.match(html, /rel="sponsored noopener noreferrer"/);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview/);
});

test("keeps shopping claims and unavailable merchants compliant", async () => {
  const [page, handoff] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../docs/PROJECT_HANDOFF.md", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Current price and availability shown on Amazon\.in/);
  assert.match(page, /Amazon handles checkout, payment, delivery and returns/);
  assert.doesNotMatch(page, /scrape|live Amazon price/i);
  assert.match(handoff, /Do not scrape marketplaces without permission\./);
});
