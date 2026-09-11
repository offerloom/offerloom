import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

const source = (await readFile(new URL("../app/lib/collected-deal.ts", import.meta.url), "utf8")).replace('"./amazon"', JSON.stringify(new URL("../app/lib/amazon.ts", import.meta.url).href));
const { validateCollectedDeal } = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString("base64")}`);
const valid = () => ({ sourceUrl: "https://www.amazon.in/dp/B07PPS3ZZY?tag=someone-21", name: "Rapoo headphones", category: "Audio", imageUrl: "https://m.media-amazon.com/images/I/product.jpg", price: 159900, mrp: 349900, currency: "INR", checkedAt: new Date().toISOString() });
test("normalizes collected identity without trusting merchant supplied in JSON", () => {
  const result = validateCollectedDeal({ ...valid(), merchant: "ajio", merchantProductId: "WRONG" });
  assert.equal(result.merchant,"amazon"); assert.equal(result.merchantProductId,"B07PPS3ZZY");
  assert.equal(result.sourceUrl,"https://www.amazon.in/dp/B07PPS3ZZY");
});
test("rejects stale prices, fabricated discount math and arbitrary image URLs", () => {
  for (const change of [{ checkedAt: "2020-01-01" }, { checkedAt: "invalid" }, { price: -1 }, { price: 1.5 }, { mrp: 100 }, { imageUrl: "https://attacker.example/photo.jpg" }, { sourceUrl: "https://secret@www.amazon.in/dp/B07PPS3ZZY" }]) assert.throws(() => validateCollectedDeal({ ...valid(), ...change }));
});

test("accepts the current AJIO product CDN but rejects lookalike hosts", () => {
  const ajio = { ...valid(), sourceUrl: "https://www.ajio.com/bag/p/442710962_offwhite", imageUrl: "https://assets-jiocdn.ajio.com/medias/bag.jpg" };
  assert.equal(validateCollectedDeal(ajio).merchant,"ajio");
  assert.throws(() => validateCollectedDeal({...ajio,imageUrl:"https://assets-jiocdn.ajio.com.evil.test/bag.jpg"}));
});
