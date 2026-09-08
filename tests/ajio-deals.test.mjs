import assert from "node:assert/strict";
import test from "node:test";
import { checkDeals, summarizeDeals } from "../scripts/check-ajio-deals.mjs";

test("AJIO check excludes inactive and unrelated campaigns and private fields", () => {
  const summary = summarizeDeals({ deals: [
    { id: "a", name: "Fashion selection", campaign_id: 1, status: "active", secret: "private" },
    { id: "b", campaign_id: 2, status: "active" },
    { id: "c", campaign_id: 1, status: "paused" },
  ] });
  assert.equal(summary.activeAjioDeals, 1);
  assert.deepEqual(summary.deals, [{ id: "a", name: "Fashion selection", campaignId: 1 }]);
  assert.throws(() => summarizeDeals({ success: true, data: { campaigns: [] } }), /Unexpected/);
});

test("AJIO check uses header authentication and follows pagination", async () => {
  let calls = 0;
  const result = await checkDeals("test-key", async (url, options) => {
    assert.equal(url.origin, "https://api.trackier.com");
    assert.equal(url.searchParams.has("apiKey"), false);
    assert.equal(options.headers["X-Api-Key"], "test-key");
    assert.equal(options.redirect, "error");
    calls += 1;
    if (calls === 2) assert.equal(url.searchParams.get("pageToken"), "next");
    return Response.json({ deals: calls === 1 ? [{ id: "a", campaign_id: 1, status: "active" }] : [], ...(calls === 1 ? { pageToken: "next" } : {}) });
  });
  assert.equal(result.complete, true);
  assert.equal(calls, 2);
});

test("AJIO failures do not expose provider response bodies or credentials", async () => {
  await assert.rejects(checkDeals("test-key", async () => new Response("sensitive", { status: 403 })), /HTTP 403/);
  await assert.rejects(checkDeals(""), /Set AJIO_API_KEY/);
});
