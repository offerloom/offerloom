import { env } from "cloudflare:workers";
import Link from "next/link";
import SiteFooter from "../components/SiteFooter";
import BrandMark from "../components/BrandMark";
import { matchesCollection, matchesMerchant } from "../lib/deal-collections";
import { publicOffer } from "../lib/public-offer";
import { SITE } from "../lib/site";

export const dynamic = "force-dynamic";

// Instagram never makes links in a post caption clickable, so the bio link points here
// instead — a standing landing page of today's deals for anyone tapping through from a post.
export function generateMetadata() {
  const title = `Today's Deals | ${SITE.brand}`;
  const description = "Live prices and photos for OfferLoom deals, checked twice daily.";
  return { title, description, openGraph: { title, description }, twitter: { card: "summary", title, description } };
}

type Row = {
  id: string; slug: string; name: string; category: string; imageUrl: string | null;
  merchant: string; merchantName: string; listingId: string; approvedPayload: string | null;
};

const COLLECTIONS = {
  new_releases: { title: "Amazon New Releases", description: "All recently released products validated by OfferLoom." },
  bestsellers: { title: "Amazon Bestsellers", description: "All products found on Amazon bestseller category lists and validated by OfferLoom." },
  todays_deals: { title: "Today’s Deals", description: "All current deal products checked by OfferLoom." },
} as const;

type DealsPageProps = { searchParams?: Promise<{ collection?: string; merchant?: string }> };

export default async function DealsPage({ searchParams }: DealsPageProps) {
  const params = await searchParams;
  const collectionKey = params?.collection && params.collection in COLLECTIONS
    ? params.collection as keyof typeof COLLECTIONS
    : undefined;
  const merchantFilter = params?.merchant === "ajio" ? "ajio" : undefined;
  const collection = collectionKey ? COLLECTIONS[collectionKey] : undefined;
  const title = collection?.title ?? (merchantFilter ? "AJIO Fashion Deals" : "Today’s Deals");
  const description = collection?.description ?? (merchantFilter
    ? "AJIO products with OfferLoom’s approved publisher deep links. Confirm current price and availability on AJIO."
    : "Live prices and photos for OfferLoom deals, checked twice daily.");
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
  `).all<Row>();

  const deals = (result.results ?? [])
    .map((row) => ({ row, offer: publicOffer(row.approvedPayload) }))
    .filter((item): item is { row: Row; offer: NonNullable<ReturnType<typeof publicOffer>> } => {
      if (!item.offer || !matchesMerchant(item.row.merchant, merchantFilter)) return false;
      return !collectionKey || matchesCollection(item.row.approvedPayload, collectionKey);
    })
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
      <div className="frontDealsHeading"><h2 id="deals-heading">{title}</h2><span>{deals.length} live picks</span></div>
      <p className="dealsIntro">{description}</p>
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
