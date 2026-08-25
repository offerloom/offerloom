import Link from "next/link";
import { FOOTER_LINKS, SITE } from "../lib/site";

export default function SiteFooter() {
  return (
    <footer className="siteFooter">
      <div className="footerGrid">
        <div className="footerBrand">
          <Link className="brand" href="/" aria-label={`${SITE.brand} home`}>
            <span className="brandMark">O</span>
            <span>Offer<span>Loom</span></span>
          </Link>
          <p>{SITE.tagline}</p>
          <small>Operated by {SITE.legalEntity}. Product discovery and price comparison for shoppers in {SITE.country}.</small>
        </div>
        <div>
          <strong>Company</strong>
          <nav aria-label="Company links">
            {FOOTER_LINKS.company.map((link) => (
              <Link href={link.href} key={link.href}>{link.label}</Link>
            ))}
          </nav>
        </div>
        <div>
          <strong>Legal</strong>
          <nav aria-label="Legal links">
            {FOOTER_LINKS.legal.map((link) => (
              <Link href={link.href} key={link.href}>{link.label}</Link>
            ))}
          </nav>
        </div>
      </div>
      <p className="footerNotice">
        As an Amazon Associate I earn from qualifying purchases. Prices, availability, checkout, payment, shipping, cancellations, returns and refunds are handled by the merchant website.
      </p>
      <p className="footerCopy">© {new Date().getFullYear()} {SITE.legalEntity}. All rights reserved.</p>
    </footer>
  );
}
