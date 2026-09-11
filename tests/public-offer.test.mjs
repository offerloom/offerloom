import test from "node:test";
import assert from "node:assert/strict";
import { publicOffer } from "../app/lib/public-offer.ts";

test("price display expires after 24 hours and rejects future or malformed observations", () => {
  const now=Date.parse("2026-09-11T12:00:00Z");
  const record={price:60000,mrp:199900,checkedAt:"2026-09-11T10:00:00Z"};
  assert.equal(publicOffer(JSON.stringify(record),now).price,60000);
  for (const change of [{checkedAt:"2026-09-10T11:59:00Z"},{checkedAt:"2026-09-12T12:00:00Z"},{price:-1},{mrp:100},{price:"60000"}]) assert.equal(publicOffer(JSON.stringify({...record,...change}),now),null);
  assert.equal(publicOffer("bad json",now),null);
});
