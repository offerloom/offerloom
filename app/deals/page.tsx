import { env } from "cloudflare:workers";
import SiteFooter from "../components/SiteFooter";
import BrandMark from "../components/BrandMark";
import AjioCampaignOffers from "../components/AjioCampaignOffers";
import { matchesDealListing } from "../lib/deal-collections";
import { publicOffer } from "../lib/public-offer";
import { variantKey } from "../lib/variant-key.mjs";
import { SITE } from "../lib/site";

/* eslint @next/next/no-html-link-for-pages: "off" -- Native navigation avoids a Vinext Link runtime error on this page. */
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
  new_releases: { title: "New Releases", description: "All recently released products validated by OfferLoom." },
  bestsellers: { title: "Bestsellers", description: "All products found on Amazon bestseller category lists and validated by OfferLoom." },
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
  const title = collection?.title ?? (merchantFilter ? "AJIO Fashion Deals & Offers" : "Today’s Deals");
  const description = collection?.description ?? (merchantFilter
    ? "AJIO products with OfferLoom’s approved publisher deep links. Confirm current price and availability on AJIO."
    : "Live prices and photos for OfferLoom deals, checked twice daily.");
  const result = await env.DB.prepare(`
    SELECT p.id, p.slug, p.name, p.image_url AS imageUrl, c.name AS category,
      ml.id AS listingId, ml.merchant, m.name AS merchantName, cd.approved_payload AS approvedPayload
    FROM products p
    JOIN categories c ON c.id = p.category_id
    JOIN merchant_listings ml ON ml.product_id = p.id AND ml.merchant IN ('amazon', 'ajio', 'flipkart', 'myntra', 'croma') AND ml.status = 'active'
    JOIN merchants m ON m.id = ml.merchant AND m.status = 'active'
    LEFT JOIN collected_deals cd ON cd.product_id = p.id AND cd.id = ml.merchant || '-' || ml.merchant_product_id
    WHERE p.status = 'published' AND p.image_url IS NOT NULL
    ORDER BY p.published_at DESC
  `).all<Row>();

  // A product sold by several stores appears once, at its lowest current price.
  const cheapestPerProduct = new Map<string, { row: Row; offer: ReturnType<typeof publicOffer> }>();
  const storeCount = new Map<string, number>();
  for (const row of result.results ?? []) {
    storeCount.set(row.id, (storeCount.get(row.id) ?? 0) + 1);
    const offer = publicOffer(row.approvedPayload);
    const current = cheapestPerProduct.get(row.id);
    if (!current || (offer && (!current.offer || offer.price < current.offer.price))) cheapestPerProduct.set(row.id, { row, offer });
  }
  const byVariant = new Map<string, { row: Row; offer: ReturnType<typeof publicOffer> }>();
  for (const item of cheapestPerProduct.values()) {
    const key = variantKey(item.row.name, item.offer?.price ?? null);
    if (!byVariant.has(key)) byVariant.set(key, item);
  }
  const deals = [...byVariant.values()]
    .filter(({ row }) => matchesDealListing(row, { merchant: merchantFilter, collection: collectionKey }))
    .sort((a, b) => {
      const discount = (offer: ReturnType<typeof publicOffer>) => offer?.mrp ? 1 - offer.price / offer.mrp : -1;
      const compared = (item: { row: Row }) => Number((storeCount.get(item.row.id) ?? 0) > 1);
      return compared(b) - compared(a) || discount(b.offer) - discount(a.offer);
    });

  return <main className="homePage">
    <header className="topbar">
      <a className="brand" href="/" aria-label="OfferLoom home"><BrandMark /><span>Offer<span>Loom</span></span></a>
      <nav aria-label="Main navigation"><a href="/">Home</a><a href="/guides">Buying guides</a></nav>
    </header>
    <section className="frontDeals" aria-labelledby="deals-heading" style={{ marginTop: 24 }}>
      <div className="frontDealsHeading"><h2 id="deals-heading">{title}</h2><span>{deals.length} products</span></div>
      <p className="dealsIntro">{description}</p>
      {(merchantFilter || collectionKey === "todays_deals") && <AjioCampaignOffers />}
      {!deals.length && !merchantFilter && <p>New deals are being reviewed. Check back soon.</p>}
      <div className="frontDealsGrid">{deals.map(({ row, offer }) => {
        const discountPct = offer?.mrp && offer.mrp > offer.price ? Math.round((1 - offer.price / offer.mrp) * 100) : 0;
        const detailPath = `/products/${row.slug}`;
        return <article className="frontDealCard" key={row.id}>
          <a className="dealPhoto" href={detailPath}>
            <img src={row.imageUrl!} alt={row.name} width="320" height="320" loading="lazy" />
            {discountPct > 0 && <span className="dealDiscount">{discountPct}% OFF</span>}
          </a>
          <span className="categoryTag">{row.merchantName} · {row.category}</span>
          <h3><a href={detailPath}>{row.name}</a></h3>
          <div className="frontDealPrice">
            {offer ? <><strong>₹{(offer.price / 100).toLocaleString("en-IN")}</strong>{discountPct > 0 && <del>₹{(offer.mrp! / 100).toLocaleString("en-IN")}</del>}</> : <strong>Check current price</strong>}
          </div>
          <div className="frontDealActions">
            <a href={detailPath}>Product details</a>
            <a className="offerCta" href={`/products/${row.slug}`}>{offer ? "View deal →" : "Check price →"}</a>
          </div>
          <small>{offer ? `Confirm current price and availability on ${row.merchantName}.` : `OfferLoom’s last price check expired; confirm today’s price and availability on ${row.merchantName}.`}</small>
        </article>;
      })}</div>
      <p className="disclosure"><strong>Affiliate and price notice:</strong> OfferLoom may earn a commission when you use eligible merchant links, at no extra cost to you. As an Amazon Associate I earn from qualifying purchases. Prices and availability can change and are confirmed on the merchant website. OfferLoom does not handle checkout, payment, shipping, cancellations, returns or refunds.</p>
    </section>
    <SiteFooter />
  </main>;
}
