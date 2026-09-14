import assert from "node:assert/strict";
import test from "node:test";
import { isApprovedAjioLink } from "../app/lib/ajio.ts";

test("AJIO links require the approved publisher and a product destination", () => {
  const base = "https://ajiotrk.vibconnect.in/click?campaign_id=1&pub_id=1072&url=";
  assert.equal(isApprovedAjioLink(base + encodeURIComponent("https://www.ajio.com/bag/p/442710962_offwhite")), true);
  assert.equal(isApprovedAjioLink(base + encodeURIComponent("https://evil.example/bag/p/442710962_offwhite")), false);
  assert.equal(isApprovedAjioLink(base.replace("1072", "999") + encodeURIComponent("https://www.ajio.com/bag/p/442710962_offwhite")), false);
  assert.equal(isApprovedAjioLink(base + encodeURIComponent("https://www.ajio.com/")), false);
  assert.equal(isApprovedAjioLink(base + encodeURIComponent("https://www.ajio.com/bag/p/442710962_offwhite") + "&url=https://evil.example"), false);
});
