import type { Metadata } from "next";
import ContentShell from "../components/ContentShell";
import { SITE } from "../lib/site";

export const metadata: Metadata = {
  title: `Contact Us — ${SITE.brand}`,
  description: `Contact ${SITE.brand} for business, editorial and support enquiries.`,
};

export default function ContactPage() {
  return (
    <ContentShell title="Contact OfferLoom" eyebrow="CONTACT US">
      <p>
        For business, editorial, partnership and general enquiries about {SITE.brand}, email us at{" "}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
      </p>
      <h2>What to include</h2>
      <ul>
        <li>Your name and the reason for contacting us</li>
        <li>Any product, merchant or content page URL involved</li>
        <li>A clear description of the issue or request</li>
      </ul>
      <h2>Response time</h2>
      <p>
        We aim to review genuine enquiries within a reasonable period. {SITE.brand} is operated by {SITE.legalEntity} from India.
        We do not provide phone support at this stage.
      </p>
      <h2>Merchant and order support</h2>
      <p>
        {SITE.brand} does not process orders. For payment, delivery, cancellation, return or refund questions, contact the
        merchant where you completed checkout.
      </p>
    </ContentShell>
  );
}
