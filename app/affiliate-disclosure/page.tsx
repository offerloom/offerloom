import type { Metadata } from "next";
import ContentShell from "../components/ContentShell";
import { SITE } from "../lib/site";

export const metadata: Metadata = {
  title: `Affiliate Disclosure — ${SITE.brand}`,
  description: `How ${SITE.brand} uses affiliate links and earns commissions.`,
};

export default function AffiliateDisclosurePage() {
  return (
    <ContentShell title="Affiliate Disclosure" eyebrow="LEGAL">
      <p><strong>Last updated:</strong> 25 August 2026</p>
      <p>
        {SITE.brand} is supported in part through affiliate partnerships. This means we may earn a commission when you click
        certain links and complete a qualifying purchase on a partner website, at no extra cost to you.
      </p>
      <h2>Amazon Associates</h2>
      <p>
        As an Amazon Associate, {SITE.brand} earns from qualifying purchases. Amazon destinations on this website use Store ID{" "}
        <strong>{SITE.amazonStoreId}</strong> unless otherwise stated.
      </p>
      <h2>Editorial independence</h2>
      <p>
        Affiliate relationships do not determine which products we describe or how we explain them. We aim to present useful,
        accurate information and clearly show the merchant destination before you leave {SITE.brand}.
      </p>
      <h2>Other merchants</h2>
      <p>
        Additional merchant connectors may be added only after approved affiliate access and authorized data rights are confirmed.
        Disabled or pending merchants are shown as unavailable rather than linked without permission.
      </p>
      <h2>Your responsibility</h2>
      <p>
        Always review the merchant website for the current price, delivery terms, warranty and return policy before purchasing.
      </p>
    </ContentShell>
  );
}
