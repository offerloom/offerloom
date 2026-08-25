import type { Metadata } from "next";
import ContentShell from "../components/ContentShell";
import { SITE } from "../lib/site";

export const metadata: Metadata = {
  title: `Price and Availability Disclaimer — ${SITE.brand}`,
  description: `Important information about prices, stock and merchant availability on ${SITE.brand}.`,
};

export default function PriceDisclaimerPage() {
  return (
    <ContentShell title="Price and Availability Disclaimer" eyebrow="LEGAL">
      <p><strong>Last updated:</strong> 25 August 2026</p>
      <p>
        {SITE.brand} helps you discover products and compare options. Unless a page clearly states that a price was refreshed
        from an approved merchant API, we do not guarantee that any price shown on {SITE.brand} is current.
      </p>
      <h2>Confirm on the merchant website</h2>
      <p>
        Prices, discounts, bank offers, delivery dates, stock status and seller information can change at any time after you
        leave {SITE.brand}. Always confirm the live details on the merchant checkout page before paying.
      </p>
      <h2>Illustrative and curated content</h2>
      <p>
        Some homepage collections are curated demonstrations intended to show how categories work. Managed catalogue entries
        may display “Check current price” rather than a stored merchant price until authorized synchronization is enabled.
      </p>
      <h2>No offer guarantee</h2>
      <p>
        A product listed on {SITE.brand} does not guarantee that a specific offer, coupon or EMI plan is available at the
        moment you shop.
      </p>
      <h2>Taxes and fees</h2>
      <p>
        Final payable amounts may include taxes, shipping, handling or payment-method charges determined by the merchant.
      </p>
    </ContentShell>
  );
}
