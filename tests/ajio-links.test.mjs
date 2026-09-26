import assert from "node:assert/strict";
import test from "node:test";
import { isApprovedAjioLink, isApprovedAjioCampaignLink } from "../app/lib/ajio.ts";

test("AJIO links require the approved publisher and an approved product or campaign destination", () => {
  const base = "https://ajiotrk.vibconnect.in/click?campaign_id=1&pub_id=1072&url=";
  assert.equal(isApprovedAjioLink(base + encodeURIComponent("https://www.ajio.com/bag/p/442710962_offwhite")), true);
  assert.equal(isApprovedAjioLink(base + encodeURIComponent("https://evil.example/bag/p/442710962_offwhite")), false);
  assert.equal(isApprovedAjioLink(base.replace("1072", "999") + encodeURIComponent("https://www.ajio.com/bag/p/442710962_offwhite")), false);
  assert.equal(isApprovedAjioLink(base + encodeURIComponent("https://www.ajio.com/")), false);
  assert.equal(isApprovedAjioCampaignLink(base + encodeURIComponent("https://www.ajio.com/s/underrs399-240950")), true);
  assert.equal(isApprovedAjioCampaignLink(base + encodeURIComponent("https://www.ajio.com/s/other-offer-240950")), false);
  assert.equal(isApprovedAjioCampaignLink(base + encodeURIComponent("https://www.ajio.com/s/underrs399-240950?redirect=evil")), false);
  assert.equal(isApprovedAjioLink(base + encodeURIComponent("https://www.ajio.com/s/underrs399-240950")), false);
  assert.equal(isApprovedAjioLink(base + encodeURIComponent("https://www.ajio.com/bag/p/442710962_offwhite") + "&url=https://evil.example"), false);
});
