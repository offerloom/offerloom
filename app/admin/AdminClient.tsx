"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import styles from "./admin.module.css";

type AdminProduct = { id:string; name:string; category:string; summary:string; status:"draft"|"published"|"archived"; asin:string; affiliateUrl:string; updatedAt:string };
type Merchant = { id:string; name:string; status:"active"|"pending"|"paused"|"blocked"; syncMode:"manual"|"feed"|"api"; consecutiveFailures:number; lastSuccessAt:string|null; lastFailureAt:string|null; lastError:string|null };

export default function AdminClient() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/products", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Could not load products.");
    setProducts(data.products);
    setMerchants(data.merchants ?? []);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/products", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load products.");
        return data;
      })
      .then((data) => { if (active) { setProducts(data.products); setMerchants(data.merchants ?? []); } })
      .catch((error) => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/admin/products", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ ...payload, publish:form.get("publish") === "on" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save product.");
      setMessage(`Saved ASIN ${data.asin}. Affiliate link created automatically.`);
      event.currentTarget.reset(); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save product."); }
    finally { setBusy(false); }
  }

  async function changeStatus(productId:string, status:AdminProduct["status"]) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/products", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"status", productId, status }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Could not update product.");
      setMessage(`Product moved to ${status}.`); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not update product."); }
    finally { setBusy(false); }
  }

  async function changeMerchantStatus(merchantId:string, status:Merchant["status"]) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/products", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"merchant_status", merchantId, status }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Could not update merchant.");
      setMessage(`${merchantId} connector moved to ${status}.`); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not update merchant."); }
    finally { setBusy(false); }
  }

  async function bulkImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = event.currentTarget;
    const file = new FormData(form).get("csv");
    try {
      if (!(file instanceof File) || !file.size) throw new Error("Choose a CSV file first.");
      if (file.size > 1_000_000) throw new Error("The CSV must be smaller than 1 MB.");
      const response = await fetch("/api/admin/products", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"bulk_import", csv:await file.text() }) });
      const data = await response.json();
      if (!response.ok) throw new Error([data.error, ...(data.errors ?? [])].join("\n"));
      setMessage(`Bulk import complete: ${data.imported} added, ${data.skipped} duplicates skipped.`);
      form.reset(); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not import CSV."); }
    finally { setBusy(false); }
  }

  function downloadTemplate() {
    const csv = 'amazon_url,brand,model_number,name,category,summary,specs,publish\n"https://www.amazon.in/dp/B000000000","Example Brand","MODEL-123","Example product","Mobiles","Replace this with an original summary of at least twenty characters.","5G, 128 GB, Dual SIM","false"\n';
    const url = URL.createObjectURL(new Blob([csv], { type:"text/csv" }));
    const link = document.createElement("a"); link.href = url; link.download = "offerloom-products-template.csv"; link.click(); URL.revokeObjectURL(url);
  }

  return <div className={styles.workspace}>
    <div className={styles.controls}>
    <form className={styles.form} onSubmit={bulkImport}>
      <div className={styles.formTitle}><h2>Bulk import</h2><span>Up to 500</span></div>
      <p className={styles.help}>Upload reviewed products in one CSV. Duplicate ASINs are skipped, and every Amazon destination is normalized automatically.</p>
      <label>Product CSV<input name="csv" type="file" accept=".csv,text/csv" required /></label>
      <button disabled={busy}>{busy ? "Importing…" : "Import products"}</button>
      <button className={styles.secondary} type="button" onClick={downloadTemplate}>Download CSV template</button>
    </form>
    <form className={styles.form} onSubmit={create}>
      <h2>Add one product</h2>
      <label>Amazon product URL<input name="amazonUrl" type="url" required placeholder="https://www.amazon.in/dp/B0…" /></label>
      <div className={styles.fieldRow}><label>Brand<input name="brand" placeholder="Samsung" /></label><label>Model number<input name="modelNumber" placeholder="SM-A series" /></label></div>
      <label>Product name<input name="name" required minLength={3} placeholder="Exact product name" /></label>
      <label>Category<input name="category" required placeholder="Mobiles" /></label>
      <label>Original summary<textarea name="summary" required minLength={20} rows={4} placeholder="Why this product is useful and who it suits…" /></label>
      <label>Key specifications<input name="specs" placeholder="5G, 128 GB, 5000 mAh" /><small>Separate specifications with commas.</small></label>
      <label className={styles.check}><input name="publish" type="checkbox" /> Publish immediately</label>
      <button disabled={busy}>{busy ? "Saving…" : "Create product"}</button>
      {message && <p className={styles.message} role="status">{message}</p>}
    </form>
    </div>
    <section className={styles.list}>
      <div className={styles.merchantPanel}><div className={styles.listHead}><h2>Merchant health</h2><span>Emergency controls</span></div>{merchants.map((merchant) => <div className={styles.merchant} key={merchant.id}><div><span className={styles.status} data-status={merchant.status}>{merchant.status}</span><strong>{merchant.name}</strong><small>{merchant.syncMode} connector · {merchant.consecutiveFailures} consecutive failures</small></div><select disabled={busy} value={merchant.status} onChange={(event) => changeMerchantStatus(merchant.id,event.target.value as Merchant["status"])} aria-label={`${merchant.name} connector status`}><option value="active">Active</option><option value="pending">Pending</option><option value="paused">Paused</option><option value="blocked">Blocked</option></select></div>)}</div>
      <div className={styles.listHead}><h2>Catalogue</h2><span>{products.length} products</span></div>
      {products.length === 0 ? <p className={styles.empty}>No database products yet. Add the first one using an Amazon product page URL.</p> : products.map((product) => <article key={product.id}>
        <div><span className={styles.status} data-status={product.status}>{product.status}</span><h3>{product.name}</h3><p>{product.category} · ASIN {product.asin}</p></div>
        <div className={styles.actions}>
          {product.status !== "published" && <button disabled={busy} onClick={() => changeStatus(product.id,"published")}>Publish</button>}
          {product.status === "published" && <button disabled={busy} onClick={() => changeStatus(product.id,"draft")}>Unpublish</button>}
          {product.status !== "archived" && <button disabled={busy} onClick={() => changeStatus(product.id,"archived")}>Archive</button>}
          <a href={product.affiliateUrl} target="_blank" rel="noopener noreferrer">Check Amazon ↗</a>
        </div>
      </article>)}
    </section>
  </div>;
}
