import { env } from "cloudflare:workers";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./product.module.css";

export const dynamic = "force-dynamic";

type ProductRow = {
  id:string; name:string; slug:string; brand:string|null; modelNumber:string|null;
  summary:string; specsJson:string; category:string; updatedAt:string;
};
type ListingRow = { id:string; merchant:string; lastCheckedAt:string|null };

export default async function ProductPage({ params }: { params: Promise<{ slug:string }> }) {
  const { slug } = await params;
  const product = await env.DB.prepare(`
    SELECT p.id, p.name, p.slug, p.brand, p.model_number AS modelNumber,
      p.summary, p.specs_json AS specsJson, p.updated_at AS updatedAt, c.name AS category
    FROM products p JOIN categories c ON c.id = p.category_id
    WHERE p.slug = ? AND p.status = 'published'
  `).bind(slug).first<ProductRow>();
  if (!product) notFound();

  const listings = await env.DB.prepare(`
    SELECT ml.id, ml.merchant, ml.last_checked_at AS lastCheckedAt
    FROM merchant_listings ml JOIN merchants m ON m.id = ml.merchant
    WHERE ml.product_id = ? AND ml.status = 'active' AND m.status = 'active'
    ORDER BY merchant
  `).bind(product.id).all<ListingRow>();
  const specs = safeSpecs(product.specsJson);
  const amazon = listings.results.find((listing) => listing.merchant === "amazon");

  return <main className={styles.shell}>
    <header className={styles.header}><Link className={styles.brand} href="/">Offer<span>Loom</span></Link><Link href="/#catalog">Back to catalogue</Link></header>
    <p className={styles.disclosure}>As an Amazon Associate I earn from qualifying purchases.</p>
    <section className={styles.product}>
      <div className={styles.visual} aria-hidden="true">◇</div>
      <div className={styles.copy}>
        <span className={styles.category}>{product.category}</span>
        <h1>{product.name}</h1>
        {(product.brand || product.modelNumber) && <p className={styles.identity}>{[product.brand,product.modelNumber].filter(Boolean).join(" · ")}</p>}
        <p className={styles.summary}>{product.summary}</p>
        {specs.length > 0 && <div className={styles.specs}>{specs.map((spec) => <span key={spec}>{spec}</span>)}</div>}
      </div>
    </section>
    <section className={styles.offers}>
      <div className={styles.title}><div><span>MERCHANT COMPARISON</span><h2>Choose where to shop</h2></div><p>Price and availability are confirmed on the merchant website.</p></div>
      <div className={styles.table}>
        <div className={styles.row}><div><strong>Amazon</strong><small>{amazon?.lastCheckedAt ? `Link checked ${formatDate(amazon.lastCheckedAt)}` : "Approved affiliate destination"}</small></div><b>Check current price</b>{amazon ? <a href={`/go/amazon/${amazon.id}`} target="_blank" rel="sponsored noopener noreferrer">View on Amazon ↗</a> : <button disabled>Unavailable</button>}</div>
        {(["Flipkart","Croma","Reliance Digital"] as const).map((merchant) => <div className={styles.row} key={merchant}><div><strong>{merchant}</strong><small>Partner feed not connected</small></div><b>Not available</b><button disabled>Coming soon</button></div>)}
      </div>
      <p className={styles.notice}>OfferLoom does not sell this product or handle payment, delivery, cancellation, return or refund. Merchant prices can change after you leave OfferLoom.</p>
    </section>
  </main>;
}

function safeSpecs(value:string):string[] { try { const parsed=JSON.parse(value); return Array.isArray(parsed)?parsed.filter((item):item is string=>typeof item==="string"):[]; } catch { return []; } }
function formatDate(value:string):string { return new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(value)); }
