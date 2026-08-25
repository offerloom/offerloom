import Link from "next/link";
import { requireOfferLoomAdmin } from "../lib/admin-auth";
import { isWorkersDeployment } from "../lib/deployment";
import AdminClient from "./AdminClient";
import AdminSignOut from "./AdminSignOut";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireOfferLoomAdmin("/admin");
  const workers = await isWorkersDeployment();
  return <main className={styles.shell}>
    <header className={styles.header}>
      <Link className={styles.brand} href="/">Offer<span>Loom</span></Link>
      <div>
        <span>{user.email}</span>
        {workers ? <AdminSignOut /> : <a href="/signout-with-chatgpt?return_to=/">Sign out</a>}
      </div>
    </header>
    <section className={styles.intro}>
      <p>OWNER-ONLY CATALOGUE</p><h1>Product manager</h1>
      <span>Add a real Amazon product URL, review outbound click summaries, and manage merchant connector health. OfferLoom extracts the ASIN, removes temporary parameters and creates the `offerloom-21` destination automatically.</span>
    </section>
    <AdminClient />
  </main>;
}
