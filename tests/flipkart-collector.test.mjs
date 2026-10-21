import assert from "node:assert/strict";
import test from "node:test";
import { flipkartProduct, pickPrices, matchesProduct, publishSql, rupeesToPaise } from "../scripts/flipkart-collector.mjs";

test("only canonical Flipkart product URLs are accepted", () => {
  assert.deepEqual(flipkartProduct("/boat-airdopes-141-gen-2-bluetooth/p/itm441116d221f76?pid=ABC&lid=X"), { id: "itm441116d221f76", url: "https://www.flipkart.com/boat-airdopes-141-gen-2-bluetooth/p/itm441116d221f76" });
  assert.equal(flipkartProduct("https://evil.example/boat/p/itm441116d221f76"), null);
  assert.equal(flipkartProduct("https://www.flipkart.com/search?q=boat"), null);
});

test("selling price is the large unstruck amount and MRP the struck one after it", () => {
  const amounts = [
    { text: "₹899", struck: false, size: 27 }, { text: "₹3,999", struck: true, size: 14 },
    { text: "₹799", struck: false, size: 16 }, { text: "₹3,499", struck: true, size: 14 },
  ];
  assert.deepEqual(pickPrices(amounts), { price: 89900, mrp: 399900 });
  assert.deepEqual(pickPrices([{ text: "₹500", struck: false, size: 24 }]), { price: 50000, mrp: null });
  assert.equal(pickPrices([{ text: "₹19", struck: false, size: 12 }]), null);
  assert.equal(rupeesToPaise("₹1,23,456"), 12345600);
});

test("cross-store matching needs the same brand and strong title overlap", () => {
  assert.equal(matchesProduct("boAt Airdopes 141 Gen 2 Bluetooth Earbuds 48H Battery", "boAt Airdopes 141 Gen 2, 4 Mics ENx Tech, 48H Battery, Bluetooth"), true);
  assert.equal(matchesProduct("boAt Airdopes 141 Gen 2 Bluetooth Earbuds", "boAt Airdopes 311 Pro Bluetooth Earbuds"), false);
  assert.equal(matchesProduct("Noise Twist Smartwatch Round Dial", "boAt Twist Smartwatch Round Dial"), false);
});

test("a matched Amazon product gains a Flipkart listing without overwriting the product", () => {
  const deal = { merchant: "flipkart", merchantProductId: "itm441116d221f76", sourceUrl: "https://www.flipkart.com/boat/p/itm441116d221f76", name: "boAt Airdopes 141 Gen 2 Bluetooth Earbuds 48H Battery", imageUrl: "https://rukminim2.flixcart.com/x.jpg", price: 89900, mrp: 399900, category: "Electronics", checkedAt: "2026-10-20T00:00:00Z" };
  const sql = publishSql([deal], new Map(), [{ id: "amazon-b0x", name: "boAt Airdopes 141 Gen 2 Bluetooth Earbuds 48H Battery Low Latency", category: "Electronics" }]);
  assert.match(sql, /'flipkart-itm441116d221f76','amazon-b0x','flipkart'/);
  assert.doesNotMatch(sql, /INSERT INTO products/);
  const fresh = publishSql([deal], new Map(), []);
  assert.match(fresh, /INSERT INTO products .*'flipkart-itm441116d221f76'/);
});

test("Flipkart search query keeps brand and model words from an Amazon title", async () => {
  const { searchQuery } = await import("../scripts/flipkart-collector.mjs");
  assert.equal(searchQuery("boAt Airdopes 219, 4Mics ENx, 40H Battery (Carbon Black)"), "boAt Airdopes 219");
  assert.equal(searchQuery("Noise Twist Go Round dial Smartwatch with BT Calling | 1.39\" Display"), "Noise Twist Go Round dial");
});

test("model-number matching catches real matches and rejects variants", async () => {
  const { matchesProduct: m, modelTokens } = await import("../scripts/flipkart-collector.mjs");
  assert.ok(modelTokens("Casio Vintage A-158WA-1Q Digital Watch").has("a158wa1q"));
  assert.equal(m("Casio Vintage A158WA-1Q Digital Grey Dial Unisex Watch Silver Metal Strap (D011)", "CASIO A158WA-1Q Vintage Digital Watch - For Men & Women"), true);
  assert.equal(m("boAt Airdopes 219, 4Mics ENx, 40H Battery, Bluetooth Earbuds", "boAt Airdopes 219 with 4 Mics ENx Tech, 40 Hours Playback Bluetooth Headset"), true);
  assert.equal(m("boAt Airdopes 141 Bluetooth Earbuds 42H Playtime", "boAt Airdopes 141 Pro Bluetooth Earbuds 45H Playtime"), false);
  assert.equal(m("Samsung Galaxy M35 5G (8GB RAM, 128GB Storage)", "SAMSUNG Galaxy M35 5G (256 GB) (8 GB RAM)"), false);
  assert.equal(m("Samsung Galaxy M35 5G (8GB RAM, 128GB Storage)", "SAMSUNG Galaxy M35 5G (128 GB) (8 GB RAM)"), true);
  assert.equal(m("Noise Twist Go Smartwatch", "boAt Twist Go Smartwatch"), false);
});
