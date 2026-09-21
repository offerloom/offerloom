import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { access, copyFile, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { buildReminderText, parseDate, planReminder, reminderIntervalDays } from "../scripts/send-reminders.mjs";

const base = { createdOn: "2026-09-21", validDays: 365, windowDays: 60 };

test("parseDate accepts calendar dates and rejects junk", () => {
  assert.equal(parseDate("2026-09-21"), Date.UTC(2026, 8, 21));
  assert.equal(parseDate("2026-09-21\n"), Date.UTC(2026, 8, 21));
  assert.equal(parseDate(""), null);
  assert.equal(parseDate("not a date"), null);
  assert.equal(parseDate(undefined), null);
});

test("nothing is sent before the 60-day window, the first reminder is exactly 60 days before expiry", () => {
  // created 2026-09-21 + 365 days = 2027-09-21; 60 days before that is 2027-07-23
  assert.equal(planReminder({ ...base, today: "2026-10-01" }), null);
  assert.equal(planReminder({ ...base, today: "2027-07-22" }), null);
  const first = planReminder({ ...base, today: "2027-07-23" });
  assert.equal(first.daysLeft, 60);
  assert.equal(first.expiresOn, "2027-09-21");
  assert.equal(first.overdue, false);
  assert.match(first.subject, /expires in 60 days \(2027-09-21\)/);
});

test("the shipped config produces the same window", async () => {
  const config = JSON.parse(await readFile(new URL("../scripts/maintenance-reminders.json", import.meta.url), "utf8")).claudeOauthToken;
  const options = { createdOn: config.createdOn, validDays: config.validDays, windowDays: config.reminderWindowDays };
  assert.equal(config.reminderWindowDays, 60);
  assert.equal(planReminder({ ...options, today: "2027-07-22" }), null);
  assert.ok(planReminder({ ...options, today: "2027-07-23" }));
});

test("reminders repeat weekly, then every 3 days, then daily", () => {
  assert.equal(reminderIntervalDays(60), 7);
  assert.equal(reminderIntervalDays(15), 7);
  assert.equal(reminderIntervalDays(14), 3);
  assert.equal(reminderIntervalDays(8), 3);
  assert.equal(reminderIntervalDays(7), 1);
  assert.equal(reminderIntervalDays(-5), 1);

  // 45 days left: weekly
  assert.equal(planReminder({ ...base, today: "2027-08-07", lastSentOn: "2027-08-04" }), null);
  assert.ok(planReminder({ ...base, today: "2027-08-11", lastSentOn: "2027-08-04" }));
  // 10 days left: every 3 days
  assert.equal(planReminder({ ...base, today: "2027-09-11", lastSentOn: "2027-09-09" }), null);
  assert.ok(planReminder({ ...base, today: "2027-09-11", lastSentOn: "2027-09-08" }));
  // 3 days left: daily
  assert.equal(planReminder({ ...base, today: "2027-09-18", lastSentOn: "2027-09-18" }), null);
  assert.ok(planReminder({ ...base, today: "2027-09-18", lastSentOn: "2027-09-17" }));
});

test("expiry day and overdue days are announced clearly and keep repeating daily", () => {
  const today = planReminder({ ...base, today: "2027-09-21" });
  assert.equal(today.daysLeft, 0);
  assert.match(today.subject, /expires today/);
  const late = planReminder({ ...base, today: "2027-09-24", lastSentOn: "2027-09-23" });
  assert.equal(late.overdue, true);
  assert.match(late.subject, /expired 3 days ago/);
  assert.match(buildReminderText(late), /expired on 2027-09-21/);
  assert.equal(planReminder({ ...base, today: "2027-09-24", lastSentOn: "2027-09-24" }), null);
});

test("a recorded renewal date silences reminders and starts a fresh year", () => {
  assert.equal(planReminder({ ...base, today: "2027-09-10", renewedOn: "2027-09-09", lastSentOn: "2027-09-01" }), null);
  // an older renewal date than the creation date is ignored
  assert.ok(planReminder({ ...base, today: "2027-09-10", renewedOn: "2026-01-01" }));
  // the new window opens 60 days before the renewed expiry
  const renewedOptions = { ...base, renewedOn: "2027-09-09" };
  assert.equal(planReminder({ ...renewedOptions, today: "2028-07-01" }), null);
  assert.ok(planReminder({ ...renewedOptions, today: "2028-07-11" }));
  // a reminder sent before the renewal does not suppress the first one after it
  assert.ok(planReminder({ ...renewedOptions, today: "2028-07-11", lastSentOn: "2027-09-08" }));
});

test("bad input never produces a reminder", () => {
  assert.equal(planReminder({ ...base, today: "garbage" }), null);
  assert.equal(planReminder({ today: "2027-09-01", createdOn: "nope" }), null);
});

test("the reminder text is safe and its shell block parses and only saves a verified token", () => {
  const plan = planReminder({ ...base, today: "2027-08-01" });
  const text = buildReminderText(plan, "/Users/example/offerloom");
  assert.doesNotMatch(text, /sk-ant-oat01-[A-Za-z0-9_-]{10,}/, "must never contain a token");
  assert.match(text, /\/Users\/example\/offerloom\/outputs\/collector\/token-renewed-on\.txt/);
  assert.match(text, /claude setup-token/);
  assert.match(text, /gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo offerloom\/offerloom/);

  const lines = text.split("\n");
  const start = lines.findIndex((line) => line.startsWith('T="$(pbpaste'));
  const end = lines.findIndex((line) => line === "unset T");
  assert.ok(start > 0 && end > start, "the block is present");
  const block = lines.slice(start, end + 1).join("\n");
  assert.equal(execFileSync("bash", ["-n"], { input: block, encoding: "utf8" }), "");

  // Run the block with fake claude/gh/pbpaste on PATH to prove the guards work.
  const run = (clipboard) => {
    const dir = execFileSync("mktemp", ["-d"], { encoding: "utf8" }).trim();
    const script = `set -e
cd "${dir}"; mkdir -p bin
printf '#!/bin/sh\\nprintf %%s "$CLIP"\\n' > bin/pbpaste
printf '#!/bin/sh\\necho OK\\n' > bin/claude
printf '#!/bin/sh\\ncat > saved.txt\\n' > bin/gh
chmod +x bin/*
export PATH="$PWD/bin:$PATH"
export CLIP='${clipboard}'
mkdir -p outputs/collector
${block.replace(/\/Users\/example\/offerloom/g, dir)}
[ -f saved.txt ] && echo SAVED || echo NOT_SAVED`;
    return execFileSync("bash", ["-c", script], { encoding: "utf8" });
  };
  const good = `sk-ant-oat01-${"a".repeat(80)}`;
  assert.match(run(good), /SAVED/);
  assert.doesNotMatch(run(good), /NOT_SAVED/);
  assert.match(run(`exportCLAUDE_CODE_OAUTH_TOKEN=${good}`), /does not hold a token[\s\S]*NOT_SAVED/);
  assert.match(run(`Your OAuth token (valid for 1 year): ${good}`), /does not hold a token[\s\S]*NOT_SAVED/);
  assert.match(run(`${good}${"b".repeat(60)}`), /Too long[\s\S]*NOT_SAVED/);
});

test("the script itself is silent outside the window and, with the test marker, tries to send one sample and keeps the marker when mail is not configured", async () => {
  const script = new URL("../scripts/send-reminders.mjs", import.meta.url).pathname;
  const dir = await mkdtemp(join(tmpdir(), "reminders-"));
  await mkdir(join(dir, "scripts"), { recursive: true });
  await mkdir(join(dir, "outputs/collector"), { recursive: true });
  await copyFile(new URL("../scripts/maintenance-reminders.json", import.meta.url), join(dir, "scripts/maintenance-reminders.json"));
  const env = { ...process.env, GMAIL_USER: "", GMAIL_APP_PASSWORD: "" };
  const run = () => execFileSync(process.execPath, [script], { cwd: dir, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

  // today is well outside the window for the shipped config unless the date is within 60 days of 2027-09-21
  if (Date.now() < Date.UTC(2027, 6, 23)) assert.equal(run(), "");

  await writeFile(join(dir, "outputs/collector/send-test-reminder"), "");
  const result = spawnSync(process.execPath, [script], { cwd: dir, env, encoding: "utf8" });
  assert.equal(result.status, 0);
  assert.match(result.stderr, /GMAIL_USER \/ GMAIL_APP_PASSWORD are not set; not sent/);
  await access(join(dir, "outputs/collector/send-test-reminder")); // still there, so it retries once mail is configured
  await assert.rejects(access(join(dir, "outputs/collector/reminder-state.json")), "no state is written for a test or an unsent reminder");
});
