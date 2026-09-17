import { execFileSync } from "node:child_process";

// Runs the collector, then always sends the sync summary email (mirrors the old
// "if: always()" CI step order). A single node process, not a bash wrapper — launchd
// spawning /bin/bash under this project's path (~/Documents/...) hits macOS's TCC
// privacy protection for Documents ("Operation not permitted" on getcwd), which plain
// node apparently isn't subject to here. Keeping everything inside one node process
// sidesteps that entirely.
try {
  execFileSync(process.execPath, ["scripts/browser-collector.mjs", "scripts/collector-config.json", "--d1-remote", "--auto-approve"], { stdio: "inherit" });
} catch {
  // Failure is still captured in outputs/collector/summary.json or last-error.log;
  // the email step below reports it either way.
}
execFileSync(process.execPath, ["scripts/send-sync-email.mjs"], { stdio: "inherit" });
