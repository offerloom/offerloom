import type { Metadata } from "next";
import ContentShell from "../components/ContentShell";
import { SITE } from "../lib/site";

export const metadata: Metadata = {
  title: `Grievance Officer — ${SITE.brand}`,
  description: `Grievance and compliance contact for ${SITE.brand}.`,
};

export default function GrievancePage() {
  return (
    <ContentShell title="Grievance Officer" eyebrow="LEGAL">
      <p><strong>Last updated:</strong> 25 August 2026</p>
      <p>
        In accordance with applicable Indian information-technology and consumer-protection requirements, {SITE.legalEntity}
        provides the following grievance contact for {SITE.brand}.
      </p>
      <h2>Grievance officer</h2>
      <ul>
        <li><strong>Designation:</strong> Grievance Officer, {SITE.brand}</li>
        <li><strong>Entity:</strong> {SITE.legalEntity}</li>
        <li><strong>Email:</strong> <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a></li>
      </ul>
      <h2>What to report</h2>
      <ul>
        <li>Alleged unlawful or harmful content on the website</li>
        <li>Privacy or data concerns</li>
        <li>Copyright or trademark issues relating to site content</li>
        <li>Other compliance matters connected with {SITE.brand}</li>
      </ul>
      <h2>What this channel is not for</h2>
      <p>
        Order, payment, delivery, cancellation, return or refund issues must be raised with the merchant where you completed
        checkout. {SITE.brand} cannot intervene in merchant fulfilment.
      </p>
      <h2>Response</h2>
      <p>
        Valid grievances will be reviewed and addressed within timelines required by applicable law, subject to the nature of
        the request and information provided.
      </p>
    </ContentShell>
  );
}
