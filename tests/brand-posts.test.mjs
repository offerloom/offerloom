import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { BRAND_POSTS, brandCaption, brandImagePath, isBrandDay, nextBrandIndex } from "../app/lib/social/brand-posts.mjs";
import { getSocialScheduleTask } from "../app/lib/social/schedule.mjs";

test("60 unique brand cards, each with an image", () => {
  assert.equal(new Set(BRAND_POSTS.map(([q]) => q)).size, BRAND_POSTS.length);
  BRAND_POSTS.forEach((_, i) => assert.ok(existsSync(`public${brandImagePath(i)}`), brandImagePath(i)));
});

test("captions stay within Instagram limits and vary hashtags", () => {
  for (let i = 0; i < BRAND_POSTS.length; i += 1) {
    const caption = brandCaption(i, "https://offerloom.offerloom.workers.dev");
    assert.ok(caption.length < 2200);
    assert.ok((caption.match(/#/g) ?? []).length <= 30);
  }
  assert.notEqual(brandCaption(0, "x").split("\n\n").at(-1), brandCaption(1, "x").split("\n\n").at(-1));
});

test("cards rotate: unused first, then least recently posted", () => {
  assert.equal(nextBrandIndex(new Map()), 0);
  const posted = new Map(BRAND_POSTS.map((_, i) => [i, new Date(Date.UTC(2026, 0, 1 + i)).toISOString()]));
  assert.equal(nextBrandIndex(posted), 0);
  posted.delete(7);
  assert.equal(nextBrandIndex(posted), 7);
});

test("alternate days and noon cron", () => {
  const day = Date.UTC(2026, 9, 30, 6, 30);
  assert.notEqual(isBrandDay(day), isBrandDay(day + 86400000));
  assert.equal(getSocialScheduleTask("30 6 * * *"), "brand-post");
});
