import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getSocialScheduleTask } from "../app/lib/social/schedule.mjs";
import { isSocialPublishSuccessful, prioritizeFacebook } from "../app/lib/social/priority.mjs";

test("daily social auto-post and hourly retry crons have separate explicit routes", () => {
  assert.equal(getSocialScheduleTask("30 1 * * *"), "auto-post");
  assert.equal(getSocialScheduleTask("30 11 * * *"), "auto-post");
  assert.equal(getSocialScheduleTask("0 * * * *"), "process-due");
  assert.equal(getSocialScheduleTask("30 2 * * *"), "ignore");
  assert.equal(getSocialScheduleTask(undefined), "ignore");
});

test("configured cron expressions are documented and unknown triggers cannot auto-publish", async () => {
  const [wrangler, worker] = await Promise.all([
    readFile(new URL("../wrangler.toml", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
  ]);

  assert.match(wrangler, /crons = \["30 1 \* \* \*", "30 11 \* \* \*", "0 \* \* \* \*"\]/);
  assert.match(wrangler, /Auto-post daily at 7:00 AM and 5:00 PM IST; retry failed channels and drain due posts hourly/);
  assert.match(worker, /if \(task === "ignore"\)[\s\S]*?return;/);
  assert.match(worker, /if \(task === "process-due"\)/);
  assert.match(worker, /throw new Error\(`Social retry cron failed/);
  assert.match(worker, /throw new Error\(`Auto social post failed/);
});

test("Facebook is primary, both Meta channels are attempted, and both are required", async () => {
  const types = await readFile(new URL("../app/lib/social/types.ts", import.meta.url), "utf8");
  assert.match(types, /SOCIAL_PLATFORMS = \["facebook", "instagram"\]/);
  assert.deepEqual(prioritizeFacebook(["instagram", "facebook"]), ["facebook", "instagram"]);
  assert.equal(isSocialPublishSuccessful([
    { platform: "facebook", status: "published" },
    { platform: "instagram", status: "published" },
  ], ["facebook", "instagram"]), true);
  assert.equal(isSocialPublishSuccessful([
    { platform: "instagram", status: "published" },
    { platform: "facebook", status: "failed" },
  ], ["facebook", "instagram"]), false);
  assert.equal(isSocialPublishSuccessful([
    { platform: "facebook", status: "published" },
    { platform: "instagram", status: "failed" },
  ], ["facebook", "instagram"]), false);
  assert.equal(isSocialPublishSuccessful([{ platform: "facebook", status: "published" }], ["facebook"]), true);
  assert.equal(isSocialPublishSuccessful([{ platform: "instagram", status: "published" }], ["instagram"]), true);

  const publish = await readFile(new URL("../app/lib/social/publish.ts", import.meta.url), "utf8");
  const autoPost = await readFile(new URL("../app/lib/social/auto-post.ts", import.meta.url), "utf8");
  assert.match(publish, /for \(const platform of prioritizeFacebook\(platforms\)\)/);
  assert.match(autoPost, /platforms: \["facebook", "instagram"\]/);
  assert.doesNotMatch(publish, /shouldSkipInstagramAfterFacebookFailure/);
  assert.doesNotMatch(publish, /whatsapp_channel|youtube_community|publishX/);
});

test("automated publishing records bounded requests and platform failures", async () => {
  const [publish, service, autoPost] = await Promise.all([
    readFile(new URL("../app/lib/social/publish.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/social/service.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/social/auto-post.ts", import.meta.url), "utf8"),
  ]);

  assert.match(publish, /AbortSignal\.timeout\(PUBLISH_REQUEST_TIMEOUT_MS\)/);
  assert.match(publish, /status: "failed",\s+message: error instanceof Error \? error\.message/);
  assert.match(service, /publishResults = input\.platforms\.map/);
  assert.match(service, /platformsNeedingPublish\(post\.platforms, post\.publishResults \?\? \[\]\)/);
  assert.match(service, /retry_attempts < 3/);
  assert.match(autoPost, /status IN \('published', 'failed'\)/);
});

test("Meta permission blocks retain the error code and trace ID for diagnosis", async () => {
  const publish = await readFile(new URL("../app/lib/social/publish.ts", import.meta.url), "utf8");

  assert.match(publish, /type MetaApiError =/);
  assert.match(publish, /error\?\.fbtrace_id/);
  assert.match(publish, /error\?\.code === 200/);
  assert.match(publish, /replacing the token alone may not resolve an app-level block/);
  assert.match(publish, /describeMetaError\(data\.error, "Facebook publish failed\."\)/);
  assert.match(publish, /describeMetaError\(createData\.error, "Instagram media create failed\."\)/);
});
