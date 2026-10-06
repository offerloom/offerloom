import assert from "node:assert/strict";
import test from "node:test";
import { orderProductCategories, productCategorySectionId } from "../app/lib/product-category-navigation.mjs";

test("category groups use the requested order and include new categories alphabetically", () => {
  assert.deepEqual(orderProductCategories(["Auto", "Home", "Fashion", "Kitchen", "Electronics", "Beauty", "Kitchen"]), [
    "Electronics", "Fashion", "Home", "Beauty", "Auto", "Kitchen",
  ]);
});

test("category group ids are stable, URL-safe anchors", () => {
  assert.equal(productCategorySectionId("Home & Kitchen"), "product-category-home-kitchen");
  assert.equal(productCategorySectionId("   "), "product-category-other");
});
