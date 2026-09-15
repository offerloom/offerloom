import { readFile } from "node:fs/promises";
import nodemailer from "nodemailer";

function money(paise) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

function buildBody(summary) {
  const lines = [];
  lines.push(`OfferLoom product sync ran at ${summary.checkedAt}`);
  lines.push(`Collected: ${summary.collected} | New: ${summary.newlyAdded.length} | Refreshed: ${summary.refreshed} | Errors: ${summary.errors}`);
  lines.push("");
  if (summary.newlyAdded.length) {
    lines.push("New on the site this run:");
    for (const deal of summary.newlyAdded) {
      const discount = deal.mrp && deal.mrp > deal.price ? `, was ${money(deal.mrp)}` : "";
      lines.push(`- [${deal.category}] ${deal.name} — ${money(deal.price)}${discount}`);
    }
  } else {
    lines.push("No new products this run — only existing listings were refreshed.");
  }
  return lines.join("\n");
}

async function main() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD are required");

  let summary;
  try {
    summary = JSON.parse(await readFile("outputs/collector/summary.json", "utf8"));
  } catch {
    let lastError = "No summary was written — the collector likely failed before completing a run.";
    try { lastError = (await readFile("outputs/collector/last-error.log", "utf8")).trim() || lastError; } catch { /* no log either */ }
    summary = { checkedAt: new Date().toISOString(), collected: 0, errors: 1, newlyAdded: [], refreshed: 0, failureNote: lastError };
  }

  const subject = summary.failureNote
    ? "OfferLoom sync failed"
    : summary.newlyAdded.length
      ? `OfferLoom sync: ${summary.newlyAdded.length} new product${summary.newlyAdded.length === 1 ? "" : "s"}`
      : "OfferLoom sync: no new products";

  const text = summary.failureNote ? `OfferLoom product sync failed at ${summary.checkedAt}.\n\n${summary.failureNote}` : buildBody(summary);

  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  await transport.sendMail({ from: user, to: user, subject, text });
  console.log("Sync summary email sent.");
}

main().catch((error) => {
  console.error("Failed to send sync summary email:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
