import type { Metadata } from "next";
import ContentShell from "../components/ContentShell";
import { SITE } from "../lib/site";

export const metadata: Metadata = {
  title: `Cookie Policy — ${SITE.brand}`,
  description: `How ${SITE.brand} uses cookies and similar technologies.`,
};

export default function CookiesPage() {
  return (
    <ContentShell title="Cookie Policy" eyebrow="LEGAL">
      <p><strong>Last updated:</strong> 25 August 2026</p>
      <p>
        This Cookie Policy explains how {SITE.brand}, operated by {SITE.legalEntity}, uses cookies and similar technologies.
      </p>
      <h2>What cookies are</h2>
      <p>
        Cookies are small text files stored on your device. They help websites remember preferences, keep sessions secure,
        and understand how visitors use pages.
      </p>
      <h2>How we may use cookies</h2>
      <ul>
        <li><strong>Essential cookies:</strong> required for basic site operation and security</li>
        <li><strong>Preference cookies:</strong> remember choices that improve your visit</li>
        <li><strong>Analytics cookies:</strong> help us understand traffic and page performance</li>
        <li><strong>Advertising or measurement cookies:</strong> may be added later for compliant campaign measurement</li>
      </ul>
      <h2>Third-party cookies</h2>
      <p>
        When you click an outbound merchant link, the merchant website may set its own cookies under its privacy policy.
        {SITE.brand} does not control merchant-site cookies.
      </p>
      <h2>Your choices</h2>
      <p>
        Most browsers let you block or delete cookies. Blocking essential cookies may affect site functionality. If we add
        non-essential measurement cookies in future, we will provide appropriate notice and controls where required.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about this policy can be sent to{" "}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
      </p>
    </ContentShell>
  );
}
