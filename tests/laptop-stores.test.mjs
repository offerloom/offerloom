import assert from "node:assert/strict";
import test from "node:test";
import { myntraProduct, myntraFromListing, myntraFromPdp, cromaProduct, cromaFromPage, publishSql } from "../scripts/laptop-stores.mjs";

const listingItem = { productId: 18389666, productName: "Jack & Jones Men Navy Blue Solid Cotton Lounge T-shirt", brand: "Jack & Jones", price: 346, mrp: 699, rating: 4.03, ratingCount: 2025,
  landingPageUrl: "lounge-tshirts/jack+%26+jones/jack--jones-men-navy-blue-solid-cotton-lounge-t-shirt/18389666/buy",
  searchImage: "http://assets.myntassets.com/assets/images/18389666/2022/5/23/x.jpg" };

test("Myntra product URLs are canonical and id-based", () => {
  assert.equal(myntraProduct(listingItem.landingPageUrl).id, "18389666");
  assert.equal(myntraProduct("https://evil.example/a/b/18389666/buy"), null);
  assert.equal(myntraProduct("https://www.myntra.com/men-tshirts"), null);
});

test("Myntra listing data becomes deals: ≥40% off, https image, rating filter", () => {
  const [deal] = myntraFromListing([listingItem, { ...listingItem, productId: 1, landingPageUrl: "a/b/111111/buy", price: 600 }, { ...listingItem, landingPageUrl: "a/b/222222/buy", rating: 2.5 }], "2026-10-21T00:00:00Z");
  assert.equal(deal.merchantProductId, "18389666");
  assert.equal(deal.price, 34600);
  assert.equal(deal.mrp, 69900);
  assert.match(deal.imageUrl, /^https:\/\/assets\.myntassets\.com\//);
  assert.equal(deal.category, "Fashion");
  assert.equal(myntraFromListing([listingItem, { ...listingItem, landingPageUrl: "a/b/111111/buy", price: 600 }]).length, 1);
});

test("Myntra product page data refreshes price and rejects out-of-stock", () => {
  const product = myntraProduct(listingItem.landingPageUrl);
  const pdp = { id: 18389666, name: listingItem.productName, brand: { name: "Jack & Jones" }, price: { mrp: 699, discounted: 346 }, sizes: [{ available: true }], flags: {}, media: { albums: [{ images: [{ imageURL: listingItem.searchImage }] }] } };
  assert.equal(myntraFromPdp(pdp, product).price, 34600);
  assert.throws(() => myntraFromPdp({ ...pdp, sizes: [{ available: false }] }, product), /unavailable/);
  assert.throws(() => myntraFromPdp({ ...pdp, id: 1 }, product), /Unexpected/);
});

test("Croma URLs and product page fields", () => {
  const product = cromaProduct("/apple-macbook-air-13-6-inch-m5-16gb-512gb-macos-tahoe-midnight-/p/324343");
  assert.equal(product.id, "324343");
  assert.equal(cromaProduct("https://evil.example/x/p/324343"), null);
  const deal = cromaFromPage({ name: "Apple MacBook Air (13.6 inch, M5, 16GB, 512GB, macOS Tahoe, Midnight)", image: "https://media.tatacroma.com/Croma%20Assets/x.png", price: "₹139,490.00", mrp: "MRP: ₹149,900.00", status: "" }, product);
  assert.equal(deal.price, 13949000);
  assert.equal(deal.mrp, 14990000);
  assert.throws(() => cromaFromPage({ name: "X Y Z", image: "https://evil.example/a.png", price: "₹1", mrp: "" }, product), /Missing/);
  assert.throws(() => cromaFromPage({ name: "X Y Z", image: "https://media.tatacroma.com/a.png", price: "₹1", status: "Out of Stock" }, product), /unavailable/);
});

test("publish attaches strict matches to existing products and creates new ones otherwise", () => {
  const [deal] = myntraFromListing([listingItem]);
  const fresh = publishSql("myntra", [{ ...deal, discoverySources: ["todays_deals"] }], new Map(), []);
  assert.match(fresh, /INSERT INTO products .*'myntra-18389666'/);
  assert.match(fresh, /'myntra-18389666','myntra-18389666','myntra','18389666'/);
  const matched = publishSql("myntra", [{ ...deal, discoverySources: [], matchProductId: "amazon-b0x" }], new Map(), []);
  assert.match(matched, /'myntra-18389666','amazon-b0x','myntra'/);
  assert.doesNotMatch(matched, /INSERT INTO products/);
});
