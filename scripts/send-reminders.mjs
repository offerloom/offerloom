import { access, readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import { pathToFileURL } from "node:url";

// Emails the owner when the Claude OAuth token that powers `@claude` on GitHub is close to its one-year
// expiry. It runs after every scheduled collector run, but only sends when a reminder is due, so it is
// quiet until 60 days before expiry. It uses the same Gmail settings as the sync email (GMAIL_USER and
// GMAIL_APP_PASSWORD) and never throws into the caller. A missed reminder is not an outage: the live site
// and the collector keep working, only automatic fix proposals from `@claude` stop.
//
// The token cannot be inspected for its real expiry, so the date is the creation date plus 365 days.
// After renewing, record the new date with one command (no git needed):
//   date +%F > outputs/collector/token-renewed-on.txt   (the reminder email has a ready-made block that does this)

const DAY = 86400000;
const CONFIG_PATH = "scripts/maintenance-reminders.json";
const RENEWED_PATH = "outputs/collector/token-renewed-on.txt";
const STATE_PATH = "outputs/collector/reminder-state.json";
// Creating this empty file makes the next scheduled run send one sample reminder (marked [TEST]) and remove the file,
// which proves the email path works without waiting for the real window:  touch outputs/collector/send-test-reminder
const TEST_MARKER = "outputs/collector/send-test-reminder";

export function parseDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? "").trim());
  if (!match) return null;
  const time = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(time) ? null : time;
}

export function formatDate(time) {
  return new Date(time).toISOString().slice(0, 10);
}

// How many days may pass between two reminders: weekly at first, then more often as expiry nears,
// daily in the last week and every day after it has expired.
export function reminderIntervalDays(daysLeft) {
  if (daysLeft > 14) return 7;
  if (daysLeft > 7) return 3;
  return 1;
}

// Returns null when nothing is due, otherwise what to send. All dates are UTC calendar days.
export function planReminder({ today, createdOn, renewedOn, validDays = 365, windowDays = 60, lastSentOn }) {
  const todayTime = parseDate(today);
  let created = parseDate(createdOn);
  const renewed = parseDate(renewedOn);
  if (todayTime === null || created === null) return null;
  if (renewed !== null && renewed > created) created = renewed; // a newer renewal date wins
  const expiresOn = created + validDays * DAY;
  const daysLeft = Math.round((expiresOn - todayTime) / DAY);
  if (daysLeft > windowDays) return null;
  const last = parseDate(lastSentOn);
  if (last !== null && last >= created && Math.round((todayTime - last) / DAY) < reminderIntervalDays(daysLeft)) return null;
  const overdue = daysLeft < 0;
  const subject = overdue
    ? `OfferLoom: Claude GitHub token expired ${-daysLeft} day${daysLeft === -1 ? "" : "s"} ago - renew it`
    : daysLeft === 0
      ? "OfferLoom: Claude GitHub token expires today - renew it"
      : `OfferLoom: Claude GitHub token expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"} (${formatDate(expiresOn)})`;
  return { daysLeft, overdue, expiresOn: formatDate(expiresOn), subject };
}

export function buildReminderText(plan, repoDir = ".") {
  const renewedFile = `${repoDir}/${RENEWED_PATH}`;
  const when = plan.overdue
    ? `expired on ${plan.expiresOn}`
    : plan.daysLeft === 0
      ? `expires today (${plan.expiresOn})`
      : `expires on ${plan.expiresOn}, in ${plan.daysLeft} day${plan.daysLeft === 1 ? "" : "s"}`;
  return [
    `The Claude token that lets @claude work on the offerloom/offerloom GitHub repository ${when}.`,
    "",
    "Nothing else stops: the live site and the product collector keep running. Only the automatic fix proposals on GitHub stop working (the @claude replies fail).",
    "",
    "To renew it (about 3 minutes, on the Mac, in Terminal):",
    "1. Run: claude setup-token   and approve in the browser. A new token is printed.",
    "2. Triple-click ONLY the line that starts with sk-ant-oat01- and press Cmd+C. Do not copy any other text. Do not paste the token into email or chat.",
    "3. Paste this whole block into Terminal. It saves the secret only if the clipboard holds a real token and Claude accepts it:",
    "",
    'T="$(pbpaste | tr -d \'[:space:]\')"',
    'case "$T" in',
    "  sk-ant-oat01-*)",
    "    if [ ${#T} -lt 120 ]; then",
    `      CLAUDE_CODE_OAUTH_TOKEN="$T" claude -p "Reply with the single word OK" && printf %s "$T" | gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo offerloom/offerloom && date +%F > \"${renewedFile}\"`,
    "    else",
    '      echo "Too long: the clipboard has extra text. Nothing was saved."',
    "    fi;;",
    '  *) echo "The clipboard does not hold a token. Nothing was saved.";;',
    "esac",
    "unset T",
    "",
    "When it prints OK and \"Set Actions secret\", the renewal date is recorded and the reminders stop until the next window.",
    "",
    "4. Optional check: open issue #2 on GitHub and comment '@claude hello'. A reply means it works.",
    "",
    "This reminder repeats until the renewal date is recorded: weekly at first, then every few days, daily in the last week.",
  ].join("\n");
}

async function readText(path) {
  try { return await readFile(path, "utf8"); } catch { return ""; }
}

async function run() {
  const config = JSON.parse((await readText(CONFIG_PATH)) || "{}").claudeOauthToken;
  if (!config) return;
  let state = {};
  try { state = JSON.parse(await readText(STATE_PATH) || "{}"); } catch { state = {}; }
  const today = formatDate(Date.now());
  const isTest = await access(TEST_MARKER).then(() => true, () => false);
  const realPlan = planReminder({
    today,
    createdOn: config.createdOn,
    renewedOn: (await readText(RENEWED_PATH)).trim(),
    validDays: config.validDays,
    windowDays: config.reminderWindowDays,
    lastSentOn: state.claudeOauthToken?.lastSentOn,
  });
  const plan = isTest
    ? { daysLeft: 60, overdue: false, expiresOn: formatDate(parseDate(config.createdOn) + (config.validDays ?? 365) * DAY), subject: "[TEST] OfferLoom reminder email works - no action needed" }
    : realPlan;
  if (!plan) return;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) { console.error("Reminder due but GMAIL_USER / GMAIL_APP_PASSWORD are not set; not sent."); return; }
  const { default: nodemailer } = await import("nodemailer");
  const transport = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user, pass } });
  const text = (isTest ? "This is a test of the token-expiry reminder. Nothing is wrong and no action is needed. The real reminders start 60 days before expiry and look like this:\n\n" : "") + buildReminderText(plan, process.cwd());
  await transport.sendMail({ from: user, to: user, subject: plan.subject, text });
  if (isTest) { await unlink(TEST_MARKER).catch(() => {}); console.log("Test reminder email sent."); return; }
  await mkdir("outputs/collector", { recursive: true });
  state.claudeOauthToken = { lastSentOn: today, expiresOn: plan.expiresOn };
  await writeFile(STATE_PATH, JSON.stringify(state, null, 2), { mode: 0o600 });
  console.log(`Token expiry reminder sent (${plan.subject}).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => console.error(`Reminder skipped: ${error?.message ?? error}`)); // never fail the run
}
