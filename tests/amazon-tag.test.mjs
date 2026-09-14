import assert from "node:assert/strict";
import test from "node:test";

test("withAmazonAssociateTag adds or replaces the Associates tag on Amazon.in URLs", async () => {
  const { withAmazonAssociateTag } = await import("../app/lib/amazon.ts");

  assert.equal(
    withAmazonAssociateTag("https://www.amazon.in/dp/B0ABCDEFGH"),
    "https://www.amazon.in/dp/B0ABCDEFGH?tag=offerloom-21",
  );
  assert.equal(
    withAmazonAssociateTag("https://www.amazon.in/s?k=mobiles"),
    "https://www.amazon.in/s?k=mobiles&tag=offerloom-21",
  );
  assert.equal(
    withAmazonAssociateTag("https://www.amazon.in/dp/B0ABCDEFGH?tag=old-tag&ref=abc"),
    "https://www.amazon.in/dp/B0ABCDEFGH?tag=offerloom-21&ref=abc",
  );
  assert.equal(withAmazonAssociateTag("https://example.com/product"), "https://example.com/product");
});

test("buildAmazonProductUrl matches SiteStripe-style tagged product links", async () => {
  const {
    buildAmazonProductUrl,
    buildAmazonSearchUrl,
    offerloomAmazonProductPath,
    offerloomAmazonSearchPath,
    parseAmazonAsin,
  } = await import("../app/lib/amazon.ts");

  assert.equal(
    buildAmazonProductUrl("B07PPS3ZZY"),
    "https://www.amazon.in/dp/B07PPS3ZZY?tag=offerloom-21",
  );
  assert.equal(
    parseAmazonAsin("https://www.amazon.in/Rapoo-H120-Headphones/dp/B07PPS3ZZY/ref=sr_1_1"),
    "B07PPS3ZZY",
  );
  const searchUrl = new URL(buildAmazonSearchUrl("mobiles computers"));
  assert.equal(searchUrl.searchParams.get("k"), "mobiles computers");
  assert.equal(searchUrl.searchParams.get("tag"), "offerloom-21");
  assert.equal(offerloomAmazonProductPath("B07PPS3ZZY"), "/go/amazon/dp/B07PPS3ZZY");
  assert.equal(offerloomAmazonSearchPath("mobiles computers"), "/go/amazon/search?k=mobiles%20computers");
});

test("amazon search redirect route applies offerloom-21", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-search`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/go/amazon/search?k=mobiles%20computers", { redirect: "manual" }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(response.status, 302);
  const location = new URL(response.headers.get("location") ?? "");
  assert.equal(location.searchParams.get("tag"), "offerloom-21");
  assert.equal(location.searchParams.get("k"), "mobiles computers");
});
