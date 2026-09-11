"use client";
import { useEffect, useState, type FormEvent } from "react";
import type { CollectedDeal } from "../lib/collected-deal";
import styles from "./admin.module.css";

type Draft = { id: string; status: string; deal: CollectedDeal };
type Run = { merchant: string; status: string; collected: number; error: string | null; finishedAt: string };
export default function CollectedDealsPanel() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkedNow, setCheckedNow] = useState(0);
  async function load() {
    const response = await fetch("/api/admin/collected-deals", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load collected products");
    const data = await response.json();
    setDrafts(data.drafts); setRuns(data.runs ?? []);
    setCheckedNow(data.serverTime ?? 0);
  }
  useEffect(() => {
    let active = true;
    fetch("/api/admin/collected-deals", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error("Unavailable");
      return response.json();
    }).then((data) => { if (active) { setDrafts(data.drafts); setRuns(data.runs ?? []); setCheckedNow(data.serverTime ?? 0); } }).catch(() => { if (active) setMessage("Collected products are unavailable."); });
    return () => { active = false; };
  }, []);
  async function send(payload: unknown) {
    const response = await fetch("/api/admin/collected-deals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    await load();
  }
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    try {
      const file = new FormData(event.currentTarget).get("observations");
      if (!(file instanceof File) || file.size > 200000) throw new Error("Select a collector JSON file under 200 KB");
      const data = JSON.parse(await file.text());
      await send({ action: "ingest", deals: data.deals }); setMessage("Observations saved for review.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Import failed"); }
    finally { setBusy(false); }
  }
  async function approve(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault(); setBusy(true);
    const form = new FormData(event.currentTarget);
    try { await send({ action: "approve", id, summary: form.get("summary"), affiliateUrl: form.get("affiliateUrl"), imageRightsConfirmed: form.get("rights") === "on" }); setMessage("Product published. Prices expire after 24 hours from collection."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Publish failed"); }
    finally { setBusy(false); }
  }
  return <section className={styles.form}>
    <h2>Browser-collected products</h2>
    <button type="button" disabled={busy} onClick={() => load().catch(() => setMessage("Could not refresh collection status."))}>Refresh collection status</button>
    <h3>Recent collection checks</h3>
    {!runs.length && <p>No collector check has been reported yet.</p>}
    {runs[0] && checkedNow - Date.parse(runs[0].finishedAt) > 8*3600000 && <p role="status">No recent check received. The collector computer may be asleep or offline.</p>}
    {runs.slice(0,4).map((run,index) => <p key={`${run.merchant}-${index}`}><strong>{run.merchant.toUpperCase()}</strong> · {run.collected} collected · {run.status} · {new Date(run.finishedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})}{run.error && ` · ${run.error}`}</p>)}
    <p>The separate browser collector saves observations here. Review each product before publishing. Scheduled checks create fresh drafts; they do not overwrite approved offers.</p>
    <form onSubmit={upload}><label>Import collector output<input name="observations" type="file" accept=".json,application/json" required /></label><button disabled={busy}>Import observations</button></form>
    <p role="status">{message}</p>
    {!drafts.length && <p>No browser observations yet.</p>}
    {drafts.map(({ id, deal, status }) => <form key={id} onSubmit={(event) => approve(event,id)}>
      <h3>{deal.name}</h3><p>{deal.merchant} · {status} · Checked {new Date(deal.checkedAt).toLocaleString("en-IN")}</p>
      <p>₹{(deal.price / 100).toLocaleString("en-IN")}{deal.mrp ? ` · MRP ₹${(deal.mrp / 100).toLocaleString("en-IN")}` : ""}</p>
      <a href={deal.sourceUrl} target="_blank" rel="noreferrer">Review source product</a>{" · "}<a href={deal.imageUrl} target="_blank" rel="noreferrer">Review product photo</a>
      {status === "pending" && <><label>Original summary<textarea name="summary" required minLength={20} maxLength={1000} /></label>
      {deal.merchant === "ajio" && <label>AJIO ACE deep link (leave blank to retain an existing link)<input name="affiliateUrl" type="url" /></label>}
      <label><input name="rights" type="checkbox" required /> I have permission to display this image and reviewed the product and price.</label>
      <button disabled={busy}>Publish reviewed product</button></>}
    </form>)}
  </section>;
}
