import assert from "node:assert/strict";
import test from "node:test";

test("withAmazonAssociateTag adds or replaces the Associates tag on Amazon.in URLs", async () => {
  const { withAmazonAssociateTag } = await import("../app/lib/amazon.ts");

  assert.equal(
    withAmazonAssociateTag("https://www.amazon.in/dp/B0ABCDEFGH"),
    "https://www.amazon.in/dp/B0ABCDEFGH?tag=offerloom-21",
  );
  assert.equal(
    withAmazonAssociateTag("https://www.amazon.in/s?k=mobiles"),
    "https://www.amazon.in/s?k=mobiles&tag=offerloom-21",
  );
  assert.equal(
    withAmazonAssociateTag("https://www.amazon.in/dp/B0ABCDEFGH?tag=old-tag&ref=abc"),
    "https://www.amazon.in/dp/B0ABCDEFGH?tag=offerloom-21&ref=abc",
  );
  assert.equal(withAmazonAssociateTag("https://example.com/product"), "https://example.com/product");
});
