import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("social compose includes WhatsApp channel link and hashtags", async () => {
  const [compose, site] = await Promise.all([
    readFile(new URL("../app/lib/social/compose.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/site.ts", import.meta.url), "utf8"),
  ]);

  assert.match(compose, /composeSocialPost/);
  assert.match(compose, /buildHashtagLine/);
  assert.match(compose, /COMMUNITY\.whatsapp\.url/);
  assert.match(site, /whatsapp\.com\/channel\/0029VbD63wj6RGJ94VedZ42W/);
});

test("admin exposes social post scheduling API and panel", async () => {
  const [route, panel] = await Promise.all([
    readFile(new URL("../app/api/admin/social-posts/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/SocialPostsPanel.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(route, /publish_now/);
  assert.match(route, /processDueSocialPosts/);
  assert.match(panel, /Schedule post/);
  assert.match(panel, /Apply post now/);
});
