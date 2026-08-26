import { COMMUNITY, SITE } from "../site";
import { absolutePublicUrl, buildHashtagLine, defaultThumbnailPath } from "./hashtags";

export type ComposeInput = {
  headline: string;
  body?: string;
  linkUrl?: string;
  imageUrl?: string;
  siteOrigin?: string;
};

export function composeSocialPost(input: ComposeInput) {
  const headline = input.headline.trim();
  const body = (input.body ?? "").trim();
  const linkUrl = (input.linkUrl ?? SITE.publicUrl).trim();
  const imageUrl = absolutePublicUrl(input.imageUrl?.trim() || defaultThumbnailPath(), input.siteOrigin ?? SITE.publicUrl);

  const captionParts = [
    `🔥 ${headline}`,
    body,
    linkUrl ? `👉 ${linkUrl}` : "",
    `📲 Join our WhatsApp channel for daily deals:\n${COMMUNITY.whatsapp.url}`,
    `✨ ${SITE.tagline}`,
    buildHashtagLine(["OfferLoomIndia", "DealsToday"]),
  ].filter(Boolean);

  return {
    caption: captionParts.join("\n\n"),
    imageUrl,
    thumbnailPath: input.imageUrl?.trim() || defaultThumbnailPath(),
  };
}
