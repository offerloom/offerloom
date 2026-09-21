import { execFileSync, spawn } from "node:child_process";

// Keep the Mac awake for exactly as long as this run lasts. The 20 Sep 2026 run logged 34 URLs over
// 3 hours 9 minutes, with single "45 s" timeouts taking 6-26 minutes of wall-clock time: the Mac was
// sleeping mid-run. The separate `caffeinate -s` agent only blocks sleep on AC power; -i also blocks
// idle sleep. Closing the lid still sleeps a MacBook unless it is on power with an external display.
if (process.platform === "darwin") {
  try { spawn("/usr/bin/caffeinate", ["-i", "-m", "-s", "-w", String(process.pid)], { stdio: "ignore", detached: true }).unref(); } catch { /* best effort */ }
}

// Runs the collector, then always sends the sync summary email (mirrors the old
// "if: always()" CI step order). A single node process, not a bash wrapper — launchd
// spawning /bin/bash under this project's path (~/Documents/...) hits macOS's TCC
// privacy protection for Documents ("Operation not permitted" on getcwd), which plain
// node apparently isn't subject to here. Keeping everything inside one node process
// sidesteps that entirely.
const log = (line) => console.error(`${new Date().toISOString()} ${line}`);

// Opt-in (OFFERLOOM_AUTO_UPDATE=1): fast-forward to the reviewed code on main before each run, so a fix
// Claude proposed and the owner merged reaches this machine without anyone touching it. It only ever
// fast-forwards a clean checkout that is on main, and note that whatever is merged then runs here with
// this job's credentials, which is why the merge (a human review) is the safety gate.
if (process.env.OFFERLOOM_AUTO_UPDATE === "1") {
  try {
    const git = (...args) => execFileSync("git", args, { encoding: "utf8", timeout: 60000 }).trim();
    if (git("rev-parse", "--abbrev-ref", "HEAD") !== "main") log("Auto-update skipped: checkout is not on main");
    else if (git("status", "--porcelain")) log("Auto-update skipped: uncommitted changes in the checkout");
    else {
      const before = git("rev-parse", "HEAD");
      git("fetch", "origin", "main");
      git("merge", "--ff-only", "origin/main");
      const after = git("rev-parse", "HEAD");
      log(before === after ? "Auto-update: already up to date" : `Auto-update: ${before.slice(0, 7)} -> ${after.slice(0, 7)}`);
      if (before !== after && git("diff", "--name-only", before, after, "--", "package-lock.json")) log("NOTE: package-lock.json changed; run `npm ci` once");
    }
  } catch (error) { log(`Auto-update skipped: ${String(error.message).split("\n")[0]}`); }
}

try {
  execFileSync(process.execPath, ["scripts/browser-collector.mjs", "scripts/collector-config.json", "--d1-remote", "--auto-approve"], { stdio: "inherit" });
} catch {
  // Failure is still captured in outputs/collector/summary.json or last-error.log;
  // the email step below reports it either way.
}
// Open a GitHub issue for failures that persist across runs (no-op without GITHUB_ISSUES_TOKEN). Never blocks the email.
try { execFileSync(process.execPath, ["scripts/report-failures.mjs"], { stdio: "inherit", timeout: 120000 }); } catch { /* reporting is best effort */ }
// Email a reminder when the Claude token behind @claude is within 60 days of its one-year expiry (no-op otherwise; never blocks the sync email).
try { execFileSync(process.execPath, ["scripts/send-reminders.mjs"], { stdio: "inherit", timeout: 60000 }); } catch { /* reminders are best effort */ }
execFileSync(process.execPath, ["scripts/send-sync-email.mjs"], { stdio: "inherit" });
