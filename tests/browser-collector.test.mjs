import test from "node:test";
import assert from "node:assert/strict";
import { productSource, money, collect } from "../scripts/browser-collector.mjs";

test("collector only accepts direct merchant product pages and removes affiliate parameters", () => {
  assert.equal(productSource("https://www.amazon.in/title/dp/B07PPS3ZZY?tag=other-21").url, "https://www.amazon.in/dp/B07PPS3ZZY");
  for (const url of ["http://www.amazon.in/dp/B07PPS3ZZY", "https://amazon.in.evil.test/dp/B07PPS3ZZY", "https://127.0.0.1/", "https://www.amazon.in/s?k=shoes", "https://user:pass@www.amazon.in/dp/B07PPS3ZZY"]) assert.throws(() => productSource(url));
});
test("prices preserve paise and reject absent observations", () => {
  assert.equal(money("₹1,599.50"),159950);
  assert.equal(money(""),null);
  assert.equal(money("Currently unavailable"),null);
});
test("collector stops at challenges before extracting product details", async () => {
  const page = { goto: async () => ({ok: () => true}), url: () => "https://www.amazon.in/dp/B07PPS3ZZY", locator: () => ({innerText: async () => "Robot Check: Enter the characters you see"}) };
  await assert.rejects(collect(page,"https://www.amazon.in/dp/B07PPS3ZZY"),/Access challenge/);
});
