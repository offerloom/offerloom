// Runs the Mac-only store collectors (AJIO, Myntra, Croma) in Microsoft Edge, one after another,
// and appends a dated log. Started by the com.offerloom.laptop-stores LaunchAgent (see
// scripts/install-laptop-stores-schedule.mjs). Writes go straight to production D1 via wrangler.
import { spawn } from "node:child_process";
import { appendFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const logFile = resolve(root, "outputs/laptop-stores/run.log");
const env = { ...process.env, OFFERLOOM_BROWSER_CHANNEL: process.env.OFFERLOOM_BROWSER_CHANNEL || "msedge" };
const steps = [
  ["AJIO", ["scripts/ajio-collector.mjs", "--force"]],
  ["Myntra + Croma", ["scripts/laptop-stores.mjs"]],
];

await mkdir(resolve(root, "outputs/laptop-stores"), { recursive: true });
const write = (line) => appendFile(logFile, `${new Date().toISOString()} ${line}\n`);
await write(`=== run started (browser: ${env.OFFERLOOM_BROWSER_CHANNEL}) ===`);
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
