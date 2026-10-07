import assert from "node:assert/strict";
import test from "node:test";
import { AJIO_CAMPAIGN_OFFERS } from "../app/lib/ajio-offers.ts";
import { isApprovedAjioCampaignLink } from "../app/lib/ajio.ts";

test("all current AJIO All Stars callouts become OfferLoom publisher-tracked campaign links", () => {
  assert.equal(AJIO_CAMPAIGN_OFFERS.length, 14);
  assert.equal(new Set(AJIO_CAMPAIGN_OFFERS.map((offer) => offer.shortCode)).size, 14);
  for (const offer of AJIO_CAMPAIGN_OFFERS) {
    const url = new URL(offer.href);
    assert.equal(url.hostname, "ajiotrk.vibconnect.in");
    assert.equal(url.searchParams.get("campaign_id"), "1");
    assert.equal(url.searchParams.get("pub_id"), "1072");
    assert.equal(url.searchParams.get("p1"), "offerloom-site");
    assert.equal(url.searchParams.get("p2"), offer.shortCode);
    assert.equal(url.searchParams.get("url"), offer.destination);
    assert.equal(isApprovedAjioCampaignLink(offer.href), true);
    assert.equal(offer.validThrough, "2026-10-11");
  }
});
