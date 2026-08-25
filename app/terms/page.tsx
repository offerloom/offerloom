import type { Metadata } from "next";
import ContentShell from "../components/ContentShell";
import { SITE } from "../lib/site";

export const metadata: Metadata = {
  title: `Terms and Conditions — ${SITE.brand}`,
  description: `Terms governing use of the ${SITE.brand} website.`,
};

export default function TermsPage() {
  return (
    <ContentShell title="Terms and Conditions" eyebrow="LEGAL">
      <p><strong>Last updated:</strong> 25 August 2026</p>
      <p>
        These Terms and Conditions (“Terms”) govern your use of {SITE.brand}, operated by {SITE.legalEntity}. By using the
        website you agree to these Terms.
      </p>
      <h2>Service description</h2>
      <p>
        {SITE.brand} provides product discovery, editorial content and links to third-party merchant websites. We are not a
        retailer, marketplace operator or payment intermediary.
      </p>
      <h2>No purchase on OfferLoom</h2>
      <p>
        All purchases, payments, delivery, cancellations, returns and refunds are handled solely by the merchant you choose.
        {SITE.brand} is not responsible for merchant fulfilment or customer service.
      </p>
      <h2>Information accuracy</h2>
      <p>
        Product names, summaries, specifications and availability may change. Prices shown on merchant websites can differ
        from any illustrative content on {SITE.brand}. Always confirm the live price and availability before buying.
      </p>
      <h2>Acceptable use</h2>
      <p>You agree not to misuse the website, attempt unauthorized access, scrape content without permission, or interfere with site operation.</p>
      <h2>Intellectual property</h2>
      <p>
        {SITE.brand} branding, layout and original editorial content belong to {SITE.legalEntity} unless otherwise stated.
        Merchant names, logos and product images remain the property of their respective owners.
      </p>
      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, {SITE.legalEntity} is not liable for indirect, incidental or consequential
        losses arising from your use of the website or any merchant transaction.
      </p>
      <h2>Governing law</h2>
      <p>These Terms are governed by the laws of India, subject to applicable consumer-protection rules.</p>
      <h2>Contact</h2>
      <p>
        Questions about these Terms: <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
      </p>
    </ContentShell>
  );
}
