import type { Metadata } from "next";
import ContentShell from "../components/ContentShell";
import { BUYING_GUIDES } from "../lib/guides";
import { SITE } from "../lib/site";
/* eslint @next/next/no-html-link-for-pages: "off" -- Native navigation avoids a Vinext Link runtime error ("e is not a function"). */

export const metadata: Metadata = {
  title: `Buying Guides — ${SITE.brand}`,
  description: `Original buying guides for electronics, fashion and home from ${SITE.brand}.`,
};

export default function GuidesIndexPage() {
  return (
    <ContentShell title="Buying guides" eyebrow="GUIDES">
      <p>
        Practical, original guides to help you compare products before you shop on a merchant website. These guides explain
        what to look for; they are not live price lists.
      </p>
      <div className="guideCards">
        {BUYING_GUIDES.map((guide) => (
          <article className="guideCard" key={guide.slug}>
            <span className="guideDepartment">{guide.department}</span>
            <h2><a href={`/guides/${guide.slug}`}>{guide.title}</a></h2>
            <p>{guide.summary}</p>
            <footer>
              <span>{guide.readMinutes} min read</span>
              <a href={`/guides/${guide.slug}`}>Read guide →</a>
            </footer>
          </article>
        ))}
      </div>
    </ContentShell>
  );
}
