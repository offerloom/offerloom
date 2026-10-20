import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContentShell from "../../components/ContentShell";
import { getBuyingGuide } from "../../lib/guides";
import { SITE } from "../../lib/site";
/* eslint @next/next/no-html-link-for-pages: "off" -- Native navigation avoids a Vinext Link runtime error ("e is not a function"). */

type GuidePageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getBuyingGuide(slug);
  if (!guide) return { title: `Guide not found — ${SITE.brand}` };
  return {
    title: `${guide.title} — ${SITE.brand}`,
    description: guide.summary,
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getBuyingGuide(slug);
  if (!guide) notFound();

  return (
    <ContentShell title={guide.title} eyebrow={`${guide.department.toUpperCase()} GUIDE`}>
      <p className="guideIntro">{guide.summary}</p>
      <p className="guideMeta">{guide.readMinutes} min read · Editorial guide · Not a live price list</p>
      {guide.sections.map((section) => (
        <section className="guideSection" key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {section.bullets && (
            <ul>
              {section.bullets.map((item) => <li key={item}>{item}</li>)}
            </ul>
          )}
        </section>
      ))}
      <p className="guideCta">
        Ready to compare products? <a href="/#catalog">Browse the catalogue</a> or return to{" "}
        <a href="/guides">all buying guides</a>.
      </p>
    </ContentShell>
  );
}
