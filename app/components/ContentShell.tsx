import Link from "next/link";
import { ReactNode } from "react";
import SiteFooter from "./SiteFooter";

type ContentShellProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
};

export default function ContentShell({ title, eyebrow, children }: ContentShellProps) {
  return (
    <main className="contentShell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="OfferLoom home">
          <span className="brandMark">O</span>
          <span>Offer<span>Loom</span></span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/#catalog">Find products</Link>
          <Link href="/guides">Buying guides</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <Link className="alertButton" href="/#catalog">Find a deal</Link>
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
