import { AJIO_CAMPAIGN_OFFERS } from "../lib/ajio-offers";
import AjioOfferArtwork from "./AjioOfferArtwork";

export default function AjioCampaignOffers({ limit }: { limit?: number }) {
  const compact = typeof limit === "number";
  const dateParts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()).split("/");
  const today = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
  const currentOffers = AJIO_CAMPAIGN_OFFERS.filter((offer) => today <= offer.validThrough);
  const offers = limit ? currentOffers.slice(0, limit) : currentOffers;

  if (!offers.length) return null;

  return <section className={`ajioCampaignOffers${compact ? " ajioCampaignOffers-compact" : ""}`} aria-labelledby={compact ? "ajio-offers-home-heading" : "ajio-offers-heading"}>
    <div className="productShelfHeading">
      <div><span>AJIO ACE · All Stars Sale · 7–11 Oct</span><h3 id={compact ? "ajio-offers-home-heading" : "ajio-offers-heading"}>AJIO All Stars Sale Offers</h3></div>
      {compact && <a href="/deals?merchant=ajio#ajio-offers-heading">View all {currentOffers.length} <span aria-hidden="true">→</span></a>}
    </div>
    <p className="ajioCampaignIntro">Opening-hour and sale callouts supplied by AJIO Affiliate Support. Offers run through 11 October; terms, stock and prices may change on AJIO.</p>
    <div className={compact ? "productRail ajioOfferRail" : "ajioOfferGrid"}>
      {offers.map((offer) => <article className={compact ? "railProduct ajioOfferCard" : "ajioOfferCard"} key={offer.shortCode}>
        <AjioOfferArtwork title={offer.title} />
        <span className="categoryTag">AJIO · Limited-time offer</span>
        <h4>{offer.title}</h4>
        <p>Check offer details, sizes and availability on AJIO.</p>
        <a className="offerCta" href={offer.href} target="_blank" rel="sponsored noopener noreferrer">Shop AJIO offer →</a>
      </article>)}
    </div>
  </section>;
}
