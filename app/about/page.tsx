import type { Metadata } from "next";
import ContentShell from "../components/ContentShell";
import { SITE } from "../lib/site";

export const metadata: Metadata = {
  title: `About Us — ${SITE.brand}`,
  description: `Learn about ${SITE.brand}, an India-first product-discovery and price-comparison website operated by ${SITE.legalEntity}.`,
};

export default function AboutPage() {
  return (
    <ContentShell title="About OfferLoom" eyebrow="ABOUT US">
      <p>
        {SITE.brand} is an India-first product-discovery and price-comparison website operated by {SITE.legalEntity}.
        Our goal is simple: help shoppers compare useful products across categories, understand what matters before they buy,
        and reach approved merchant destinations from one organised place.
      </p>
      <h2>What we do</h2>
      <p>
        {SITE.brand} curates product collections, publishes original summaries and buying guides, and links visitors to
        approved affiliate destinations such as Amazon.in. We do not sell products, process payments, ship orders, or handle
        returns. Checkout always happens on the merchant website.
      </p>
      <h2>How we earn</h2>
      <p>
        {SITE.brand} may earn a commission when you use eligible merchant links, at no extra cost to you. As an Amazon Associate
        we earn from qualifying purchases. We only use approved affiliate links and clearly disclose our commercial relationships.
      </p>
      <h2>Our editorial approach</h2>
      <p>
        Product summaries and buying guides on {SITE.brand} are written for clarity, not hype. We distinguish between curated
        demonstration collections, manually reviewed catalogue entries, and future API-synchronized data. We do not present
        illustrative prices as live merchant prices.
      </p>
    </ContentShell>
  );
}
