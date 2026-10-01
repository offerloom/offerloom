import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getSocialScheduleTask } from "../app/lib/social/schedule.mjs";
import { isSocialPublishSuccessful, prioritizeFacebook, shouldSkipInstagramAfterFacebookFailure } from "../app/lib/social/priority.mjs";

test("daily social auto-post and queued-post crons have separate explicit routes", () => {
  assert.equal(getSocialScheduleTask("30 1 * * *"), "auto-post");
  assert.equal(getSocialScheduleTask("30 11 * * *"), "auto-post");
  assert.equal(getSocialScheduleTask("0 4 * * *"), "process-due");
  assert.equal(getSocialScheduleTask("30 2 * * *"), "ignore");
  assert.equal(getSocialScheduleTask(undefined), "ignore");
});

test("configured cron expressions are documented and unknown triggers cannot auto-publish", async () => {
  const [wrangler, worker] = await Promise.all([
    readFile(new URL("../wrangler.toml", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
  ]);

  assert.match(wrangler, /crons = \["30 1 \* \* \*", "30 11 \* \* \*", "0 4 \* \* \*"\]/);
  assert.match(wrangler, /Auto-post daily at 7:00 AM and 5:00 PM IST; drain queued posts at 9:30 AM IST/);
  assert.match(worker, /if \(task === "ignore"\)[\s\S]*?return;/);
  assert.match(worker, /if \(task === "process-due"\)/);
});

test("Facebook is the primary channel and Instagram cannot complete a Facebook campaign", () => {
  assert.deepEqual(prioritizeFacebook(["instagram", "x", "facebook"]), ["facebook", "instagram", "x"]);
  assert.equal(shouldSkipInstagramAfterFacebookFailure("instagram", [{ platform: "facebook", status: "failed" }]), true);
  assert.equal(shouldSkipInstagramAfterFacebookFailure("instagram", [{ platform: "facebook", status: "published" }]), false);
  assert.equal(shouldSkipInstagramAfterFacebookFailure("x", [{ platform: "facebook", status: "failed" }]), false);
  assert.equal(isSocialPublishSuccessful([{ platform: "instagram", status: "published" }, { platform: "facebook", status: "failed" }], ["facebook", "instagram"]), false);
  assert.equal(isSocialPublishSuccessful([{ platform: "facebook", status: "published" }, { platform: "instagram", status: "failed" }], ["facebook", "instagram"]), true);
  assert.equal(isSocialPublishSuccessful([{ platform: "instagram", status: "published" }], ["instagram"]), true);
});

test("automated publishing records bounded requests and platform failures", async () => {
  const [publish, service] = await Promise.all([
    readFile(new URL("../app/lib/social/publish.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/social/service.ts", import.meta.url), "utf8"),
  ]);

  assert.match(publish, /AbortSignal\.timeout\(PUBLISH_REQUEST_TIMEOUT_MS\)/);
  assert.match(publish, /status: "failed",\s+message: error instanceof Error \? error\.message/);
  assert.match(service, /publishResults = input\.platforms\.map/);
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
