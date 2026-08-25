import type { Metadata } from "next";
import ContentShell from "../components/ContentShell";
import { SITE } from "../lib/site";

export const metadata: Metadata = {
  title: `Checkout and Returns — ${SITE.brand}`,
  description: `How checkout, payment, delivery, cancellation and returns work when you shop through ${SITE.brand}.`,
};

export default function MerchantCheckoutPage() {
  return (
    <ContentShell title="Merchant Checkout and Returns" eyebrow="LEGAL">
      <p><strong>Last updated:</strong> 25 August 2026</p>
      <p>
        {SITE.brand} is a discovery and comparison website. We do not sell products, collect payments, arrange delivery,
        or process cancellations, returns or refunds.
      </p>
      <h2>What happens when you click a deal</h2>
      <ol>
        <li>You review product information on {SITE.brand}.</li>
        <li>You choose an available merchant destination.</li>
        <li>You leave {SITE.brand} and continue on the merchant website.</li>
        <li>The merchant handles checkout, payment, tax, shipping and after-sales support.</li>
      </ol>
      <h2>Returns and warranties</h2>
      <p>
        Return windows, replacement policies, warranty registration and service centres are determined by the merchant and
        the product manufacturer. Read the merchant’s return policy before purchasing.
      </p>
      <h2>Order status and support</h2>
      <p>
        For order tracking, invoice requests, delivery issues or refund status, contact the merchant where you placed the order.
        {SITE.brand} cannot access your merchant account or modify an order on your behalf.
      </p>
      <h2>Questions about this page</h2>
      <p>
        Email <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> if you need clarification about how {SITE.brand}
        works. For purchase support, contact the merchant directly.
      </p>
    </ContentShell>
  );
}
