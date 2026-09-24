import { ReactNode } from "react";
import BrandMark from "./BrandMark";
import SiteFooter from "./SiteFooter";

type ContentShellProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
};

/* eslint @next/next/no-html-link-for-pages: "off" -- Native navigation avoids the Vinext Link runtime error on public content pages. */
export default function ContentShell({ title, eyebrow, children }: ContentShellProps) {
  return (
    <main className="contentShell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="OfferLoom home">
          <BrandMark />
          <span>Offer<span>Loom</span></span>
        </a>
        <nav aria-label="Main navigation">
          <a href="/#catalog">Find products</a>
          <a href="/guides">Buying guides</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </nav>
        <a className="alertButton" href="/#catalog">Find a deal</a>
      </header>
      <article className="contentPage">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <div className="contentBody">{children}</div>
      </article>
      <SiteFooter />
    </main>
  );
}
