// Installs com.offerloom.laptop-stores: uploads deals-sheet.csv (AJIO / Myntra / Croma deals) to the live site
// at login and 12:15, 14:30, 17:30 and 20:30 while the Mac is on; a missed run happens on wake. Usage: node scripts/install-laptop-stores-schedule.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve, dirname } from "node:path";
import { execFileSync } from "node:child_process";

if (process.platform !== "darwin") throw new Error("This installer targets macOS LaunchAgents.");
const label = "com.offerloom.laptop-stores";
const root = resolve(import.meta.dirname, "..");
const agent = resolve(homedir(), "Library/LaunchAgents", `${label}.plist`);
const logs = resolve(root, "outputs/laptop-stores");
const xml = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const times = [[12, 15], [14, 30], [17, 30], [20, 30]];
await mkdir(dirname(agent), { recursive: true });
await mkdir(logs, { recursive: true });
const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${label}</string>
<key>ProgramArguments</key><array><string>${xml(process.execPath)}</string><string>${xml(resolve(root, "scripts/run-laptop-stores.mjs"))}</string></array>
<key>WorkingDirectory</key><string>${xml(root)}</string>
<key>StartCalendarInterval</key><array>${times.map(([h, m]) => `<dict><key>Hour</key><integer>${h}</integer><key>Minute</key><integer>${m}</integer></dict>`).join("")}</array>
<key>RunAtLoad</key><true/>
<key>EnvironmentVariables</key><dict><key>PATH</key><string>${xml(`${dirname(process.execPath)}:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin`)}</string><key>OFFERLOOM_BROWSER_CHANNEL</key><string>msedge</string></dict>
<key>StandardOutPath</key><string>${xml(resolve(logs, "launchd.log"))}</string>
<key>StandardErrorPath</key><string>${xml(resolve(logs, "launchd-error.log"))}</string>
</dict></plist>`;
await writeFile(agent, plist, { mode: 0o600 });
execFileSync("plutil", ["-lint", agent], { stdio: "pipe" });
const domain = `gui/${process.getuid()}`;
for (const target of [[`${domain}/${label}`], [domain, agent]]) {
  try { execFileSync("launchctl", ["bootout", ...target], { stdio: "pipe" }); } catch { /* not loaded */ }
}
try { execFileSync("launchctl", ["enable", `${domain}/${label}`], { stdio: "pipe" }); } catch { /* ignore */ }
for (let attempt = 1; ; attempt++) {
  try { execFileSync("launchctl", ["bootstrap", domain, agent], { stdio: "pipe" }); break; }
  catch (error) {
    if (attempt >= 5) { try { execFileSync("launchctl", ["load", "-w", agent], { stdio: "pipe" }); break; } catch { throw error; } }
    execFileSync("sleep", ["2"]);
  }
}
console.log(`Installed ${label}: deals-sheet.csv upload at login and ${times.map(([h, m]) => `${h}:${String(m).padStart(2, "0")}`).join(", ")}. Log: outputs/laptop-stores/run.log`);
