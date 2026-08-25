"use client";

export default function AdminSignOut() {
  async function signOut() {
    await fetch("/api/admin/session", { method: "DELETE" });
    window.location.href = "/";
  }

  return <button type="button" onClick={signOut}>Sign out</button>;
}
