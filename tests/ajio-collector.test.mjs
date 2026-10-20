import assert from "node:assert/strict";
import test from "node:test";
import { ajioProduct, aceLink, interleave, fullName, ajioCategory, fromSearch, fromDetail, publishSql, searchPath } from "../scripts/ajio-collector.mjs";
import { isApprovedAjioLink } from "../app/lib/ajio.ts";

const product = { id: "464868395_beige", base: "464868395", url: "https://www.ajio.com/the-bear-house-slim-fit-shirt-with-patch-pocket/p/464868395_beige", vertical: "Western Wear Men Shirts" };
const detail = {
  url: "/the-bear-house-slim-fit-shirt-with-patch-pocket/p/464868395_beige",
  name: "Slim Fit Shirt with Patch Pocket", brandName: "THE BEAR HOUSE",
  price: { value: 798 }, wasPriceData: { value: 2495 },
  stock: { stockLevelStatus: "inStock", stockLevel: 10 }, purchasable: true,
  brickName: "Shirts", brickCategory: "Men", brickSubCategory: "Western Wear",
  images: [
    { format: "thumbnail", imageType: "PRIMARY", url: "https://assets.ajio.com/medias/x/-78Wx98H-464868395-beige-MODEL.jpg" },
    { format: "product", imageType: "PRIMARY", url: "https://assets.ajio.com/medias/x/-473Wx593H-464868395-beige-MODEL.jpg" },
  ],
  ratingsResponse: { aggregateRating: { averageRating: 4.1, numUserRatings: "3.3K" } },
};

test("only canonical AJIO product URLs are accepted", () => {
  assert.deepEqual(ajioProduct("/lee-cooper-men-lace-up-sneakers/p/450172989_drkolv?x=1#y"), { id: "450172989_drkolv", base: "450172989", url: "https://www.ajio.com/lee-cooper-men-lace-up-sneakers/p/450172989_drkolv" });
  assert.equal(ajioProduct("https://evil.example/x/p/450172989_drkolv"), null);
  assert.equal(ajioProduct("https://www.ajio.com/s/min-50-percent-off"), null);
  assert.equal(ajioProduct("https://www.ajio.com/x/p/450172989_multi-color"), null);
});

test("built ACE deep links pass the /go/ajio validator and point at the product", () => {
  const link = aceLink(product);
  assert.equal(isApprovedAjioLink(link), true);
  const url = new URL(link);
  assert.equal(url.searchParams.get("url"), product.url);
  assert.equal(url.searchParams.get("p1"), "offerloom-site");
  assert.equal(url.searchParams.get("p2"), "464868395");
});

test("search path filters to the 50%-off facet", () => {
  assert.match(decodeURIComponent(searchPath("sneakers").replaceAll("+", " ")), /query=sneakers:relevance:discountranges:50% and above/);
});

test("names gain the brand once and shouting brands are title-cased", () => {
  assert.equal(fullName("THE BEAR HOUSE", "Slim Fit Shirt"), "The Bear House Slim Fit Shirt");
  assert.equal(fullName("Shein", "Shein Men Polo"), "Shein Men Polo");
  assert.equal(fullName("U.S. Polo Assn.", "Men Krister Sneakers"), "U.S. Polo Assn. Men Krister Sneakers");
});

test("categories come from AJIO's vertical labels", () => {
  assert.equal(ajioCategory("Western Wear", "Men"), "Fashion");
  assert.equal(ajioCategory("Beauty", "Makeup"), "Beauty");
  assert.equal(ajioCategory("Home & Kitchen"), "Home");
});

test("search results keep discounted products, one colour per style", () => {
  const items = fromSearch({ products: [
    { url: "/a/p/450172989_drkolv", price: { value: 920 }, wasPriceData: { value: 2299 } },
    { url: "/a/p/450172989_whitered", price: { value: 920 }, wasPriceData: { value: 2299 } },
    { url: "/b/p/111_black", price: { value: 479 }, wasPriceData: { value: 599 } },
    { url: "/c/p/222_white", price: { value: 499 }, wasPriceData: { value: 499 } },
    { url: "https://evil.example/d/p/333_red", price: { value: 100 }, wasPriceData: { value: 900 } },
  ] });
  assert.deepEqual(items.map((p) => p.id), ["450172989_drkolv"]);
});

test("detail becomes a deal in paise with the product-size image", () => {
  const deal = fromDetail(detail, product, { isNew: true, checkedAt: "2026-10-20T00:00:00.000Z" });
  assert.equal(deal.price, 79800);
  assert.equal(deal.mrp, 249500);
  assert.equal(deal.name, "The Bear House Slim Fit Shirt with Patch Pocket");
  assert.equal(deal.imageUrl, "https://assets.ajio.com/medias/x/-473Wx593H-464868395-beige-MODEL.jpg");
  assert.equal(deal.category, "Fashion");
  assert.deepEqual(deal.rating, { average: 4.1, count: 3300 });
});

test("detail rejects stock-outs, wrong products, foreign images and poorly rated new items", () => {
  assert.throws(() => fromDetail({ ...detail, stock: { stockLevelStatus: "outOfStock" } }, product), /unavailable/);
  assert.throws(() => fromDetail({ ...detail, url: "/x/p/999_red" }, product), /Unexpected product/);
  assert.throws(() => fromDetail({ ...detail, images: [{ format: "product", imageType: "PRIMARY", url: "https://evil.example/a.jpg" }] }, product), /image/);
  const poor = { ...detail, ratingsResponse: { aggregateRating: { averageRating: 2.9, numUserRatings: "40" } } };
  assert.throws(() => fromDetail(poor, product, { isNew: true }), /Low rating/);
  assert.ok(fromDetail(poor, product, { isNew: false }));
  assert.throws(() => fromDetail({ ...detail, price: { value: 2000 } }, product, { isNew: true }), /Discount/);
});

test("publish SQL creates new products with a built ACE link and never overwrites existing links", () => {
  const deal = fromDetail(detail, product, { checkedAt: "2026-10-20T00:00:00.000Z" });
  const fresh = publishSql([{ ...deal, discoverySources: ["todays_deals"] }], new Map(), []);
  assert.match(fresh, /INSERT INTO products .*'ajio-464868395_beige'/);
  assert.match(fresh, /'ajio-464868395_beige','ajio-464868395_beige','ajio','464868395_beige'/);
  assert.match(fresh, /https:\/\/ajiotrk\.vibconnect\.in\/click\?campaign_id=1&pub_id=1072&p1=offerloom-site&p2=464868395&url=/);
  assert.doesNotMatch(fresh.split("ON CONFLICT(merchant,merchant_product_id)")[1], /affiliate_url=/);

  const existing = new Map([["464868395_beige", { productId: "ajio-legacy", status: "published", listingStatus: "active" }]]);
  const refresh = publishSql([deal], existing, []);
  assert.doesNotMatch(refresh, /INSERT INTO products|UPDATE products/);
  assert.match(refresh, /INSERT INTO collected_deals/);

  const paused = new Map([["464868395_beige", { productId: "x", status: "archived", listingStatus: "active" }]]);
  assert.equal(publishSql([deal], paused, []), "");
});

test("a strict cross-store match attaches the AJIO listing to the existing product", () => {
  const sneaker = { ...fromDetail({ ...detail, brandName: "Puma", name: "Smashic Women's Comfort Casual Sneakers White", url: "/p/p/465643001_white" }, { ...product, id: "465643001_white", base: "465643001", url: "https://www.ajio.com/p/p/465643001_white" }), discoverySources: [] };
  const sql = publishSql([sneaker], new Map(), [{ id: "amazon-b0puma", name: "Puma Smashic Women's Comfort Casual Sneakers White", category: "Fashion" }]);
  assert.match(sql, /'ajio-465643001_white','amazon-b0puma','ajio'/);
  assert.doesNotMatch(sql, /INSERT INTO products/);
});

test("discovery takes one candidate per query before any second ones", () => {
  const ids = interleave([[{ id: "a1" }, { id: "a2" }], [{ id: "b1" }], [{ id: "a1" }, { id: "c2" }]]).map((p) => p.id);
  assert.deepEqual(ids, ["a1", "b1", "a2", "c2"]);
});
