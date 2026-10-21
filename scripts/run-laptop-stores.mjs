// Runs the Mac-only store collectors (AJIO, Myntra, Croma) in Microsoft Edge, one after another,
// and appends a dated log. Started by the com.offerloom.laptop-stores LaunchAgent (see
// scripts/install-laptop-stores-schedule.mjs). Writes go straight to production D1 via wrangler.
import { spawn } from "node:child_process";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const logFile = resolve(root, "outputs/laptop-stores/run.log");
// Cloudflare credentials for the D1 writes come from the git-ignored .secrets/offerloom.env
// (CLOUDFLARE_API_TOKEN with D1 edit access + CLOUDFLARE_ACCOUNT_ID). launchd jobs can't use the
// interactive `wrangler login` session reliably, so a dedicated token is required.
const secrets = {};
try {
  for (const line of (await readFile(resolve(root, ".secrets/offerloom.env"), "utf8")).split(/\r?\n/)) {
    const match = line.match(/^\s*(CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID)\s*=\s*"?([^"#\s]+)"?/);
    if (match) secrets[match[1]] = match[2];
  }
} catch { /* no secrets file */ }
const env = { ...process.env, ...secrets, OFFERLOOM_BROWSER_CHANNEL: process.env.OFFERLOOM_BROWSER_CHANNEL || "msedge" };
const steps = [
  ["AJIO", ["scripts/ajio-collector.mjs", "--force"]],
  ["Myntra + Croma", ["scripts/laptop-stores.mjs"]],
];

await mkdir(resolve(root, "outputs/laptop-stores"), { recursive: true });
const write = (line) => appendFile(logFile, `${new Date().toISOString()} ${line}\n`);
await write(`=== run started (browser: ${env.OFFERLOOM_BROWSER_CHANNEL}; Cloudflare token: ${env.CLOUDFLARE_API_TOKEN ? "set" : "MISSING — add CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID to .secrets/offerloom.env"}) ===`);
for (const [name, args] of steps) {
  const code = await new Promise((done) => {
    const child = spawn(process.execPath, args, { cwd: root, env });
    child.stdout.on("data", (chunk) => appendFile(logFile, chunk));
    child.stderr.on("data", (chunk) => appendFile(logFile, chunk));
    child.on("close", done);
  });
  await write(`${name}: exit ${code}`);
}
await write("=== run finished ===");
