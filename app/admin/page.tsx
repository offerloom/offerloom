import BrandMark from "../components/BrandMark";
import { requireOfferLoomAdmin } from "../lib/admin-auth";
import { isWorkersDeployment } from "../lib/deployment";
import AdminClient from "./AdminClient";
import AdminSignOut from "./AdminSignOut";
import styles from "./admin.module.css";
/* eslint @next/next/no-html-link-for-pages: "off" -- Native navigation avoids a Vinext Link runtime error ("e is not a function"). */

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireOfferLoomAdmin("/admin");
  const workers = await isWorkersDeployment();
  return <main className={styles.shell}>
    <header className={styles.header}>
      <a className={styles.brand} href="/"><BrandMark />Offer<span>Loom</span></a>
      <div>
        <span>{user.email}</span>
        {workers ? <AdminSignOut /> : <a href="/signout-with-chatgpt?return_to=/">Sign out</a>}
      </div>
    </header>
    <section className={styles.intro}>
      <p>OWNER-ONLY CATALOGUE</p><h1>Product manager</h1>
      <span>Add Amazon products, schedule social posts for Instagram, Facebook, Telegram and WhatsApp Channel, review outbound click summaries, and manage merchant connector health. OfferLoom extracts the ASIN, removes temporary parameters and creates the `offerloom-21` destination automatically.</span>
    </section>
    <AdminClient />
  </main>;
}
