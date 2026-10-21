import assert from "node:assert/strict";
import test from "node:test";
import { parseCsv, dealFromRow } from "../scripts/sheet-deals.mjs";

const row = { store: "myntra", product_url: "https://www.myntra.com/lounge-tshirts/jack+%26+jones/jack--jones-men-navy-blue-solid-cotton-lounge-t-shirt/18389666/buy", name: "Jack & Jones Men Navy T-shirt", price: "346", mrp: "₹699", image_url: "http://assets.myntassets.com/a.jpg", category: "", checked_at: "2026-10-21T12:30:00Z" };

test("CSV parsing handles quotes and commas", () => {
  assert.deepEqual(parseCsv('a,b\n"x, y","say ""hi"""\n'), [["a", "b"], ["x, y", 'say "hi"']]);
});

test("a valid row becomes a priced deal with its own checked time", () => {
  const deal = dealFromRow(row, "2026-10-21T00:00:00.000Z");
  assert.equal(deal.price, 34600);
  assert.equal(deal.mrp, 69900);
  assert.equal(deal.checkedAt, "2026-10-21T12:30:00.000Z");
  assert.match(deal.imageUrl, /^https:/);
  assert.equal(deal.category, "Fashion");
  assert.equal(dealFromRow({ ...row, checked_at: "" }, "2026-10-21T00:00:00.000Z").checkedAt, "2026-10-21T00:00:00.000Z");
});

test("AJIO rows get the ACE tracking link; bad rows are rejected", () => {
  const ajio = dealFromRow({ ...row, store: "AJIO", product_url: "https://www.ajio.com/buda-jeans-co-men-regular-fit-shirt-with-patch-pocket/p/703662434_brown", image_url: "https://assets.ajio.com/medias/x.jpg" }, "2026-10-21T00:00:00.000Z");
  assert.match(ajio.affiliateUrl, /^https:\/\/ajiotrk\.vibconnect\.in\/click\?campaign_id=1&pub_id=1072/);
  assert.throws(() => dealFromRow({ ...row, store: "nykaa" }, "x"), /unknown store/);
  assert.throws(() => dealFromRow({ ...row, product_url: "https://evil.example/x/1/buy" }, "x"), /not a myntra product URL/);
  assert.throws(() => dealFromRow({ ...row, image_url: "https://evil.example/a.jpg" }, "x"), /image/);
  assert.throws(() => dealFromRow({ ...row, checked_at: "2099-01-01" }, "x"), /future/);
});
