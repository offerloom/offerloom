import assert from "node:assert/strict";
import test from "node:test";
import { variantKey, variantName } from "../app/lib/variant-key.mjs";

test("colour variants at the same price share one key", () => {
  assert.equal(variantKey("boAt 2026 Launch Airdopes Joy v2, 35H Battery (Carbon Black)", 89900), variantKey("boAt 2026 Launch Airdopes Joy v2, 35H Battery (Pearl White)", 89900));
  assert.equal(variantName("Noise Twist Smartwatch - Jet Black"), variantName("Noise Twist Smartwatch - Rose Gold"));
});

test("a different price or a different model stays separate", () => {
  assert.notEqual(variantKey("boAt Airdopes Joy v2 (Black)", 89900), variantKey("boAt Airdopes Joy v2 (White)", 99900));
  assert.notEqual(variantKey("boAt Airdopes 141 (Black)", 89900), variantKey("boAt Airdopes 311 (Black)", 89900));
  assert.notEqual(variantName("Samsung Galaxy M35 (8GB RAM, 128GB)"), variantName("Samsung Galaxy M35 (6GB RAM, 128GB)"));
});
