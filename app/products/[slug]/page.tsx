import { env } from "cloudflare:workers";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteFooter from "../../components/SiteFooter";
import styles from "./product.module.css";
import { publicOffer } from "../../lib/public-offer";
import { SITE } from "../../lib/site";

export const dynamic = "force-dynamic";

type ProductRow = {
  id:string; name:string; slug:string; brand:string|null; modelNumber:string|null;
  summary:string; specsJson:string; category:string; updatedAt:string; imageUrl:string|null;
};
type ListingRow = { id:string; merchant:string; lastCheckedAt:string|null; approvedPayload:string|null };

// Feeds link-preview cards (Facebook feed posts, WhatsApp, Telegram, iMessage, etc.) so a
// shared product link shows the real photo/title instead of a blank or generic preview.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await env.DB.prepare(`SELECT name, summary, image_url AS imageUrl FROM products WHERE slug = ? AND status = 'published'`)
    .bind(slug).first<{ name: string; summary: string; imageUrl: string | null }>();
  if (!product) return {};
  const url = `${SITE.publicUrl}/products/${slug}`;
  return {
    title: `${product.name} | ${SITE.brand}`,
    description: product.summary,
    openGraph: {
      title: product.name,
      description: product.summary,
      url,
      siteName: SITE.brand,
      images: product.imageUrl ? [{ url: product.imageUrl }] : undefined,
    },
    twitter: { card: "summary_large_image", title: product.name, description: product.summary, images: product.imageUrl ? [product.imageUrl] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug:string }> }) {
  const { slug } = await params;
  const product = await env.DB.prepare(`
    SELECT p.id, p.name, p.slug, p.brand, p.model_number AS modelNumber,
      p.summary, p.image_url AS imageUrl, p.specs_json AS specsJson, p.updated_at AS updatedAt, c.name AS category
    FROM products p JOIN categories c ON c.id = p.category_id
    WHERE p.slug = ? AND p.status = 'published'
  `).bind(slug).first<ProductRow>();
  if (!product) notFound();

  const listings = await env.DB.prepare(`
    SELECT ml.id, ml.merchant, ml.last_checked_at AS lastCheckedAt, cd.approved_payload AS approvedPayload
    FROM merchant_listings ml JOIN merchants m ON m.id = ml.merchant
    LEFT JOIN collected_deals cd ON cd.id=ml.merchant || '-' || ml.merchant_product_id AND cd.product_id=ml.product_id
    WHERE ml.product_id = ? AND ml.status = 'active' AND m.status = 'active'
    ORDER BY merchant
  `).bind(product.id).all<ListingRow>();
  const specs = safeSpecs(product.specsJson);
  const supportedListings = listings.results.filter((listing) => ["amazon", "ajio"].includes(listing.merchant));

  return <main className={styles.shell}>
    <header className={styles.header}><Link className={styles.brand} href="/">Offer<span>Loom</span></Link><Link href="/#catalog">Back to catalogue</Link></header>
    <p className={styles.disclosure}>As an Amazon Associate I earn from qualifying purchases.</p>
    <section className={styles.product}>
      <div className={styles.visual}>{product.imageUrl ? <img src={product.imageUrl} alt={product.name} width={320} height={320} style={{width:"100%",height:"100%",objectFit:"contain",borderRadius:30}} /> : <span aria-hidden="true">◇</span>}</div>
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
        {supportedListings.map((listing) => { const offer = publicOffer(listing.approvedPayload); return <div className={styles.row} key={listing.id}><div><strong>{listing.merchant === "ajio" ? "AJIO" : "Amazon"}</strong><small>{offer ? `Price checked ${formatDate(offer.checkedAt)}` : "Confirm current price on merchant"}</small></div><b>{offer ? `₹${(offer.price/100).toLocaleString("en-IN")}` : "Check current price"}</b><a href={`/go/${listing.merchant}/${listing.id}`} target="_blank" rel="sponsored noopener noreferrer">View on {listing.merchant === "ajio" ? "AJIO" : "Amazon"} ↗</a></div>; })}
        {supportedListings.length === 0 && <p>No active offers available.</p>}
        {(["Flipkart","Croma","Reliance Digital"] as const).map((merchant) => <div className={styles.row} key={merchant}><div><strong>{merchant}</strong><small>Partner feed not connected</small></div><b>Not available</b><button disabled>Coming soon</button></div>)}
      </div>
      <p className={styles.notice}>OfferLoom does not sell this product or handle payment, delivery, cancellation, return or refund. Merchant prices can change after you leave OfferLoom.</p>
    </section>
    <SiteFooter />
  </main>;
}

function safeSpecs(value:string):string[] { try { const parsed=JSON.parse(value); return Array.isArray(parsed)?parsed.filter((item):item is string=>typeof item==="string"):[]; } catch { return []; } }
function formatDate(value:string):string { return new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(value)); }
