import assert from "node:assert/strict";
import test from "node:test";
import { formatCheckedAt } from "../app/lib/format-checked-at.ts";

test("price check time is shown in India time and invalid values are hidden", () => {
  assert.match(formatCheckedAt("2026-09-26T11:33:00.000Z"), /Price checked 26 Sept, 5:03 pm IST/);
  assert.equal(formatCheckedAt(undefined), null);
  assert.equal(formatCheckedAt("not-a-date"), null);
});
