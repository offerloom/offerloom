#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const wranglerPath = `${root}/wrangler.toml`;

function run(command, args) {
  return execFileSync(command, args, { cwd: root, encoding: "utf8" });
}

function readWranglerToml() {
  return readFileSync(wranglerPath, "utf8");
}

function writeDatabaseId(databaseId) {
  const next = readWranglerToml().replace(
    /database_id = "REPLACE_AFTER_D1_CREATE"/,
    `database_id = "${databaseId}"`,
  );
  writeFileSync(wranglerPath, next);
}

function existingDatabaseId() {
  const match = readWranglerToml().match(/database_id = "([^"]+)"/);
  return match?.[1];
}

try {
  run("npx", ["wrangler", "whoami"]);
} catch {
  console.error("Run `npm run cf:login` first, then rerun `npm run cf:setup`.");
  process.exit(1);
}

const currentId = existingDatabaseId();
if (currentId && currentId !== "REPLACE_AFTER_D1_CREATE") {
  console.log(`D1 already configured with database_id ${currentId}.`);
  process.exit(0);
}

const output = run("npx", ["wrangler", "d1", "create", "offerloom"]);
const match = output.match(/database_id = "([^"]+)"/);
if (!match) {
  console.error("Could not parse database_id from wrangler d1 create output:\n", output);
  process.exit(1);
}

writeDatabaseId(match[1]);
console.log(`Configured wrangler.toml with database_id ${match[1]}.`);
console.log("Next:");
console.log("  npm run deploy:full");
console.log("  npx wrangler secret put ADMIN_API_TOKEN");
