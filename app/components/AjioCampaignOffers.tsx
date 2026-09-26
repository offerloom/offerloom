import { AJIO_CAMPAIGN_OFFERS } from "../lib/ajio-offers";
import AjioOfferArtwork from "./AjioOfferArtwork";

export default function AjioCampaignOffers({ limit }: { limit?: number }) {
  const offers = limit ? AJIO_CAMPAIGN_OFFERS.slice(0, limit) : AJIO_CAMPAIGN_OFFERS;
  const compact = typeof limit === "number";

  return <section className={`ajioCampaignOffers${compact ? " ajioCampaignOffers-compact" : ""}`} aria-labelledby={compact ? "ajio-offers-home-heading" : "ajio-offers-heading"}>
    <div className="productShelfHeading">
      <div><span>AJIO ACE partner offers</span><h3 id={compact ? "ajio-offers-home-heading" : "ajio-offers-heading"}>AJIO Bestselling Offers</h3></div>
      {compact && <a href="/deals?merchant=ajio#ajio-offers-heading">View all 22 <span aria-hidden="true">→</span></a>}
    </div>
    <p className="ajioCampaignIntro">Offers shared by AJIO Affiliate Support. Terms, sizes, stock and prices may change on AJIO.</p>
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
