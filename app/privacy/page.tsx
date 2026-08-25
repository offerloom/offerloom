import type { Metadata } from "next";
import ContentShell from "../components/ContentShell";
import { SITE } from "../lib/site";

export const metadata: Metadata = {
  title: `Privacy Policy — ${SITE.brand}`,
  description: `How ${SITE.brand} collects, uses and protects personal information.`,
};

export default function PrivacyPage() {
  return (
    <ContentShell title="Privacy Policy" eyebrow="LEGAL">
      <p><strong>Last updated:</strong> 25 August 2026</p>
      <p>
        {SITE.legalEntity} (“we”, “us”) operates {SITE.brand}. This policy explains how we handle information when you visit
        our website.
      </p>
      <h2>Information we may collect</h2>
      <ul>
        <li>Technical data such as browser type, device type, approximate location and pages viewed</li>
        <li>Referrer information when you arrive from another website</li>
        <li>Outbound click metadata when you use tracked merchant links, including product and merchant identifiers</li>
        <li>Information you send us voluntarily by email</li>
      </ul>
      <h2>How we use information</h2>
      <ul>
        <li>Operate, secure and improve the website</li>
        <li>Measure which products and pages are useful</li>
        <li>Respond to enquiries and legal requests</li>
        <li>Comply with affiliate-program and advertising obligations</li>
      </ul>
      <h2>What we do not do</h2>
      <p>
        We do not sell your personal information. We do not collect payment card details because checkout happens on merchant
        websites. We do not request passwords for third-party shopping accounts.
      </p>
      <h2>Cookies and analytics</h2>
      <p>
        We may use cookies or similar technologies for essential site operation and measurement. See our{" "}
        <a href="/cookies">Cookie Policy</a> for details.
      </p>
      <h2>Data retention</h2>
      <p>
        We keep information only as long as needed for the purposes above, unless a longer period is required by law or
        affiliate-program records.
      </p>
      <h2>Your choices</h2>
      <p>
        You can control cookies through your browser settings. You may contact us at{" "}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> with privacy questions or requests permitted by law.
      </p>
      <h2>Changes</h2>
      <p>We may update this policy from time to time. Material changes will be reflected on this page.</p>
    </ContentShell>
  );
}
