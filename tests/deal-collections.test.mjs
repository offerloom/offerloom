import assert from "node:assert/strict";
import test from "node:test";
import { matchesCollection, matchesMerchant } from "../app/lib/deal-collections.ts";

test("collection filters include all validated products tagged with that source", () => {
  assert.equal(matchesCollection(JSON.stringify({ discoverySources: ["todays_deals", "bestsellers"] }), "todays_deals"), true);
  assert.equal(matchesCollection(JSON.stringify({ discoverySource: "new_releases" }), "new_releases"), true);
  assert.equal(matchesCollection(JSON.stringify({ discoverySources: ["bestsellers"] }), "todays_deals"), false);
  assert.equal(matchesCollection("not json", "todays_deals"), false);
  assert.equal(matchesCollection(null, "todays_deals"), false);
});

test("merchant filter can show every AJIO listing without mixing Amazon products", () => {
  assert.equal(matchesMerchant("ajio", "ajio"), true);
  assert.equal(matchesMerchant("amazon", "ajio"), false);
  assert.equal(matchesMerchant("amazon"), true);
});
