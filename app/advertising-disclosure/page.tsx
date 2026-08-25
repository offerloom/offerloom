import type { Metadata } from "next";
import ContentShell from "../components/ContentShell";
import { SITE } from "../lib/site";

export const metadata: Metadata = {
  title: `Advertising Disclosure — ${SITE.brand}`,
  description: `How ${SITE.brand} presents advertising, sponsorships and commercial content.`,
};

export default function AdvertisingDisclosurePage() {
  return (
    <ContentShell title="Advertising Disclosure" eyebrow="LEGAL">
      <p><strong>Last updated:</strong> 25 August 2026</p>
      <p>
        {SITE.brand} may display commercial content, sponsored placements, affiliate links or paid partnerships in future.
        When content is commercial in nature, we aim to label it clearly and avoid misleading claims.
      </p>
      <h2>Affiliate links</h2>
      <p>
        Outbound merchant links may be affiliate links. See our <a href="/affiliate-disclosure">Affiliate Disclosure</a> for
        details about how commissions may be earned.
      </p>
      <h2>No fake urgency</h2>
      <p>
        We do not use fake countdown timers, fabricated stock alerts or misleading “was/now” pricing to pressure purchases.
        If promotional language is used, it should reflect a genuine offer available on the merchant website at the time of publication.
      </p>
      <h2>Social media</h2>
      <p>
        Posts on Facebook, Instagram, WhatsApp or other channels that promote deals should identify {SITE.brand} as the source
        and direct users to merchant websites for checkout.
      </p>
      <h2>Future paid advertising</h2>
      <p>
        If paid campaigns are introduced, they will comply with applicable advertising standards and platform policies.
        Measurement tools such as the Meta Pixel will be added only with appropriate privacy and cookie notices.
      </p>
    </ContentShell>
  );
}
