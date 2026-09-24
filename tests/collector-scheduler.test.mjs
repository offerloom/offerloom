import assert from "node:assert/strict";
import test from "node:test";
import { dispatchDaily } from "../worker/collector-scheduler/index.mjs";
const env = { ENABLED: "true", GITHUB_ACTIONS_TOKEN: "fixture" };
const now = Date.parse("2026-09-24T01:30:00Z");
function transport(runs, calls) {
  return async (url, options) => {
    calls.push({ url, options });
    assert.equal(options.redirect, "error");
    return options.method === "POST" ? new Response(null, { status: 204 }) : Response.json({ workflow_runs: runs });
  };
}
const run = (values = {}) => ({ display_title: "Cloud catalogue · morning", created_at: "2026-09-24T01:30:00Z", status: "completed", conclusion: "success", ...values });
test("dispatches a publish run when today's schedule is missing; probes do not suppress it", async () => {
  const calls = [];
  const result = await dispatchDaily(env, { now, fetcher: transport([run({ display_title: "Cloud catalogue · probe" }), run({ created_at: "2026-09-23T01:30:00Z" })], calls) });
  assert.equal(result.status, "dispatched");
  assert.deepEqual(JSON.parse(calls[1].options.body), { ref: "main", inputs: { probe: false, force: false, window: "morning" } });
});
test("skips successful or active publication and caps retries", async () => {
  for (const record of [run(), run({ status: "queued", conclusion: null })]) {
    const calls = [];
    assert.equal((await dispatchDaily(env, { now, fetcher: transport([record], calls) })).status, "skipped");
    assert.equal(calls.length, 1);
  }
  await assert.rejects(dispatchDaily(env, { now, fetcher: transport(Array(3).fill(run({ conclusion: "failure" })), []) }), /retry limit/);
});
test("morning and evening have separate completion guards", async () => {
  const calls = [];
  const result = await dispatchDaily(env, { now, window: "evening", fetcher: transport([run()], calls) });
  assert.equal(result.status, "dispatched");
  assert.deepEqual(JSON.parse(calls[1].options.body), { ref: "main", inputs: { probe: false, force: false, window: "evening" } });
  assert.equal((await dispatchDaily(env, { now, window: "evening", fetcher: transport([run({ display_title: "Cloud catalogue · evening" })], []) })).status, "skipped");
});
test("missing or rejected credentials cannot report a dispatch", async () => {
  assert.equal((await dispatchDaily({})).status, "disabled");
  await assert.rejects(dispatchDaily({ ENABLED: "true" }), /credential is missing/);
  await assert.rejects(dispatchDaily(env, { fetcher: async () => new Response("private", { status: 401 }) }), /\(401\)/);
});
