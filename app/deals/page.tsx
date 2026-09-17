import { env } from "cloudflare:workers";
import Link from "next/link";
import SiteFooter from "../components/SiteFooter";
import BrandMark from "../components/BrandMark";
import { publicOffer } from "../lib/public-offer";
import { SITE } from "../lib/site";

export const dynamic = "force-dynamic";

// Instagram never makes links in a post caption clickable, so the bio link points here
// instead — a standing landing page of today's deals for anyone tapping through from a post.
export function generateMetadata() {
  const title = `Today's Deals | ${SITE.brand}`;
  const description = "Live prices and photos for every current OfferLoom deal, updated every 3 hours.";
  return { title, description, openGraph: { title, description }, twitter: { card: "summary", title, description } };
}

type Row = {
  id: string; slug: string; name: string; category: string; imageUrl: string | null;
  merchant: string; merchantName: string; listingId: string; approvedPayload: string | null;
};

export default async function DealsPage() {
  const result = await env.DB.prepare(`
    SELECT p.id, p.slug, p.name, p.image_url AS imageUrl, c.name AS category,
      ml.id AS listingId, ml.merchant, m.name AS merchantName, cd.approved_payload AS approvedPayload
    FROM products p
    JOIN categories c ON c.id = p.category_id
    JOIN merchant_listings ml ON ml.product_id = p.id AND ml.merchant IN ('amazon', 'ajio') AND ml.status = 'active'
    JOIN merchants m ON m.id = ml.merchant AND m.status = 'active'
    LEFT JOIN collected_deals cd ON cd.product_id = p.id AND cd.id = ml.merchant || '-' || ml.merchant_product_id
    WHERE p.status = 'published' AND p.image_url IS NOT NULL
    ORDER BY p.published_at DESC
    LIMIT 60
  `).all<Row>();

  const deals = (result.results ?? [])
    .map((row) => ({ row, offer: publicOffer(row.approvedPayload) }))
    .filter((item): item is { row: Row; offer: NonNullable<ReturnType<typeof publicOffer>> } => Boolean(item.offer))
    .sort((a, b) => {
      const discount = (offer: { price: number; mrp: number | null }) => (offer.mrp ? 1 - offer.price / offer.mrp : 0);
      return discount(b.offer) - discount(a.offer);
    });

  return <main className="homePage">
    <header className="topbar">
      <Link className="brand" href="/" aria-label="OfferLoom home"><BrandMark /><span>Offer<span>Loom</span></span></Link>
      <nav aria-label="Main navigation"><Link href="/">Home</Link><Link href="/guides">Buying guides</Link></nav>
    </header>
    <section className="frontDeals" aria-labelledby="deals-heading" style={{ marginTop: 24 }}>
      <div className="frontDealsHeading"><h2 id="deals-heading">Today's deals</h2><span>{deals.length} live picks</span></div>
      {!deals.length && <p>New deals are being reviewed. Check back soon.</p>}
      <div className="frontDealsGrid">{deals.map(({ row, offer }) => {
        const discountPct = offer.mrp && offer.mrp > offer.price ? Math.round((1 - offer.price / offer.mrp) * 100) : 0;
        const detailPath = `/products/${row.slug}`;
        return <article className="frontDealCard" key={row.id}>
          <Link className="dealPhoto" href={detailPath}>
            <img src={row.imageUrl!} alt={row.name} width="320" height="320" loading="lazy" />
            {discountPct > 0 && <span className="dealDiscount">{discountPct}% OFF</span>}
          </Link>
          <span className="categoryTag">{row.merchantName} · {row.category}</span>
          <h3><Link href={detailPath}>{row.name}</Link></h3>
          <div className="frontDealPrice">
            <strong>₹{(offer.price / 100).toLocaleString("en-IN")}</strong>
            {discountPct > 0 && <del>₹{(offer.mrp! / 100).toLocaleString("en-IN")}</del>}
          </div>
          <div className="frontDealActions">
            <Link href={detailPath}>Product details</Link>
            <a className="offerCta" href={`/go/${row.merchant}/${row.listingId}`} target="_blank" rel="sponsored noopener noreferrer">Grab deal →</a>
          </div>
          <small>Confirm current price and availability on {row.merchantName}.</small>
        </article>;
      })}</div>
      <p className="disclosure"><strong>Affiliate and price notice:</strong> OfferLoom may earn a commission when you use eligible merchant links, at no extra cost to you. As an Amazon Associate I earn from qualifying purchases. Prices and availability can change and are confirmed on the merchant website. OfferLoom does not handle checkout, payment, shipping, cancellations, returns or refunds.</p>
    </section>
    <SiteFooter />
  </main>;
}
