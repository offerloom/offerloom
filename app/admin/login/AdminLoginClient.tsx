"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import BrandMark from "../../components/BrandMark";
import styles from "../admin.module.css";

type AdminLoginClientProps = {
  returnTo: string;
};

export default function AdminLoginClient({ returnTo }: AdminLoginClientProps) {
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not sign in.");
      window.location.href = returnTo;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/"><BrandMark />Offer<span>Loom</span></Link>
        <Link href="/">Back to site</Link>
      </header>
      <section className={styles.intro}>
        <p>OWNER ACCESS</p>
        <h1>Admin sign-in</h1>
        <span>Enter the Workers admin token configured as the `ADMIN_API_TOKEN` secret for this deployment.</span>
      </section>
      <form className={styles.form} onSubmit={submit}>
        <label>
          Admin token
          <input
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            required
            autoComplete="current-password"
            placeholder="Paste the ADMIN_API_TOKEN secret"
          />
        </label>
        <button disabled={busy}>{busy ? "Signing in…" : "Sign in to admin"}</button>
        {message && <p className={styles.message} role="status">{message}</p>}
      </form>
    </main>
  );
}
