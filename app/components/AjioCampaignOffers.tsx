"use client";

import { useEffect, useState } from "react";
import type { AjioCampaignOffer } from "../lib/ajio-offers";
import AjioOfferArtwork from "./AjioOfferArtwork";

const shortDate = (iso: string) => new Date(`${iso}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

/** AJIO sale callouts, imported automatically from AJIO Affiliate Support emails. */
export default function AjioCampaignOffers({ limit }: { limit?: number }) {
  const compact = typeof limit === "number";
  const [currentOffers, setCurrentOffers] = useState<AjioCampaignOffer[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/ajio-offers").then((response) => response.ok ? response.json() : { offers: [] })
      .then((data) => { if (active) setCurrentOffers(data.offers ?? []); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const offers = limit ? currentOffers.slice(0, limit) : currentOffers;
  if (!offers.length) return null;
  const campaign = offers[0].campaign;
  const window = `${shortDate(offers[0].validFrom)} – ${shortDate(offers[0].validThrough)}`;

  return <section className={`ajioCampaignOffers${compact ? " ajioCampaignOffers-compact" : ""}`} aria-labelledby={compact ? "ajio-offers-home-heading" : "ajio-offers-heading"}>
    <div className="productShelfHeading">
      <div><span>AJIO ACE · {campaign} · {window}</span><h3 id={compact ? "ajio-offers-home-heading" : "ajio-offers-heading"}>{campaign} Offers</h3></div>
      {compact && <a href="/deals?merchant=ajio#ajio-offers-heading">View all {currentOffers.length} <span aria-hidden="true">→</span></a>}
    </div>
    <p className="ajioCampaignIntro">Sale callouts supplied by AJIO Affiliate Support, updated automatically. Offers run through {shortDate(offers[0].validThrough)}; terms, stock and prices may change on AJIO.</p>
    <div className={compact ? "productRail ajioOfferRail" : "ajioOfferGrid"} {...(compact ? { "data-autoscroll": "" } : {})}>
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
