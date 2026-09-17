import { mkdir, writeFile, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve, dirname } from "node:path";
import { execFileSync } from "node:child_process";

if (process.platform !== "darwin") throw new Error("This installer targets macOS LaunchAgents.");
const label = "com.offerloom.browser-collector";
const root = resolve(import.meta.dirname, "..");
const config = JSON.parse(await readFile(resolve(root,"scripts/collector-config.json"),"utf8"));
const seconds = Number(config.intervalHours ?? 6)*3600;
if (!Number.isInteger(seconds) || seconds < 3600 || seconds > 604800) throw new Error("Invalid schedule interval");
const xml = (s) => String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const agent = resolve(homedir(),"Library/LaunchAgents",`${label}.plist`);
const logs = resolve(root,"outputs/collector");
await mkdir(dirname(agent),{recursive:true}); await mkdir(logs,{recursive:true});
const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${label}</string>
<key>ProgramArguments</key><array><string>${xml(process.execPath)}</string><string>${xml(resolve(root,"scripts/run-collector-and-notify.mjs"))}</string></array>
<key>WorkingDirectory</key><string>${xml(root)}</string>
<key>StartInterval</key><integer>${seconds}</integer><key>RunAtLoad</key><true/>
<key>EnvironmentVariables</key><dict><key>PATH</key><string>${xml(`${dirname(process.execPath)}:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin`)}</string><key>OFFERLOOM_CHROME_CHANNEL</key><string>chrome</string><key>GMAIL_USER</key><string>${xml(process.env.GMAIL_USER ?? "contact.offerloom@gmail.com")}</string><key>GMAIL_APP_PASSWORD</key><string>${xml(process.env.GMAIL_APP_PASSWORD ?? "")}</string></dict>
<key>StandardOutPath</key><string>${xml(resolve(logs,"scheduler.log"))}</string>
<key>StandardErrorPath</key><string>${xml(resolve(logs,"scheduler-error.log"))}</string>
</dict></plist>`;
await writeFile(agent,plist,{mode:0o600});
execFileSync("plutil",["-lint",agent],{stdio:"pipe"});
const domain=`gui/${process.getuid()}`;
try { execFileSync("launchctl",["bootout",`${domain}/${label}`],{stdio:"pipe"}); } catch { /* First install. */ }
execFileSync("launchctl",["bootstrap",domain,agent],{stdio:"pipe"});
console.log(`Installed ${label}; runs every ${seconds/3600} hours while logged in.`);

// Also install a keep-awake agent so scheduled runs aren't delayed by the Mac sleeping —
// caffeinate -s only holds off sleep while on AC power, so battery life is unaffected.
const awakeLabel = "com.offerloom.keepawake";
const awakeAgent = resolve(homedir(),"Library/LaunchAgents",`${awakeLabel}.plist`);
const awakePlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${awakeLabel}</string>
<key>ProgramArguments</key><array><string>/usr/bin/caffeinate</string><string>-s</string></array>
<key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
<key>StandardOutPath</key><string>/dev/null</string><key>StandardErrorPath</key><string>/dev/null</string>
</dict></plist>`;
await writeFile(awakeAgent,awakePlist,{mode:0o644});
execFileSync("plutil",["-lint",awakeAgent],{stdio:"pipe"});
try { execFileSync("launchctl",["bootout",`${domain}/${awakeLabel}`],{stdio:"pipe"}); } catch { /* First install. */ }
execFileSync("launchctl",["bootstrap",domain,awakeAgent],{stdio:"pipe"});
console.log(`Installed ${awakeLabel}; keeps the Mac awake on AC power so schedules aren't delayed.`);
