import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseCjFixtureCsv } from "../app/lib/cj/parse-fixture.ts";

test("parses authorized CJ fixture rows", async () => {
  const csv = await readFile(new URL("../fixtures/cj/sample-feed.csv", import.meta.url), "utf8");
  const result = parseCjFixtureCsv(csv);

  assert.equal(result.rows.length, 2);
  assert.equal(result.skipped, 0);
  assert.equal(result.errors.length, 0);
  assert.equal(result.rows[0].advertiserName, "Dell Consumer India");
  assert.match(result.rows[0].affiliateUrl, /^https:\/\//);
});

test("rejects malformed CJ fixture CSV", () => {
  assert.throws(() => parseCjFixtureCsv("sku,name\nonly,two"), /missing required columns/i);
});
