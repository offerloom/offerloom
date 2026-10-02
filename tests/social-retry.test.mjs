import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_AUTO_SOCIAL_RETRIES,
  mergePublishResults,
  nextSocialRetryAt,
  platformsNeedingPublish,
} from "../app/lib/social/retry.mjs";

test("automatic retries use bounded delays and stop after three attempts", () => {
  const start = Date.parse("2026-10-02T00:00:00.000Z");
  assert.equal(MAX_AUTO_SOCIAL_RETRIES, 3);
  assert.equal(nextSocialRetryAt(0, start), "2026-10-02T00:10:00.000Z");
  assert.equal(nextSocialRetryAt(1, start), "2026-10-02T01:00:00.000Z");
  assert.equal(nextSocialRetryAt(2, start), "2026-10-02T06:00:00.000Z");
  assert.equal(nextSocialRetryAt(3, start), null);
});

test("retry only sends to channels that have not already confirmed publication", () => {
  const previous = [
    { platform: "facebook", status: "published", message: "Published" },
    { platform: "instagram", status: "failed", message: "Temporary error" },
  ];
  assert.deepEqual(platformsNeedingPublish(["facebook", "instagram"], previous), ["instagram"]);
  assert.deepEqual(mergePublishResults(["facebook", "instagram"], previous, [
    { platform: "instagram", status: "published", message: "Published" },
  ]), [
    previous[0],
    { platform: "instagram", status: "published", message: "Published" },
  ]);
});
