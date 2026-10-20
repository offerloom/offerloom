import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { ajioCampaignHref } from "../app/lib/ajio-offers.ts";
import { isApprovedAjioCampaignLink } from "../app/lib/ajio.ts";

test("email-supplied AJIO short codes become OfferLoom publisher-tracked campaign links", () => {
  for (const code of ["womendressesunderrs599-curated-420487", "menjeansunderrs899-curated-420491", "atrs599-219284"]) {
    const url = new URL(ajioCampaignHref(code));
    assert.equal(url.hostname, "ajiotrk.vibconnect.in");
    assert.equal(url.searchParams.get("campaign_id"), "1");
    assert.equal(url.searchParams.get("pub_id"), "1072");
    assert.equal(url.searchParams.get("p1"), "offerloom-site");
    assert.equal(url.searchParams.get("p2"), code);
    assert.equal(url.searchParams.get("url"), `https://www.ajio.com/s/${code}`);
    assert.equal(isApprovedAjioCampaignLink(ajioCampaignHref(code)), true);
  }
  assert.equal(isApprovedAjioCampaignLink(ajioCampaignHref("not-an-offer")), false);
});

test("the AJIO mail importer only trusts DKIM-signed mailer.ajio.in messages and ajio.com/s links", async () => {
  const script = await readFile(new URL("../scripts/ajio_mail_offers.py", import.meta.url), "utf8");
  assert.match(script, /dkim=pass header\\\.\(\?:i\|d\)=@\?mailer\\\.ajio\\\.in/);
  assert.match(script, /readonly=True/);
  assert.match(script, /ajio\\\.com\/s\//);
  const route = await readFile(new URL("../app/api/ajio-offers/route.ts", import.meta.url), "utf8");
  assert.match(route, /isApprovedAjioCampaignLink/);
  assert.match(route, /valid_through >= \?/);
});
