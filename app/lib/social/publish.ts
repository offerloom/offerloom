import type { PublishResult, SocialPlatform, SocialSecrets } from "./types";

async function publishFacebook(caption: string, imageUrl: string, secrets: SocialSecrets, linkUrl?: string): Promise<PublishResult> {
  if (!secrets.metaPageAccessToken || !secrets.metaPageId) {
    return { platform: "facebook", status: "failed", message: "Meta Page token or Page ID is not configured." };
  }

  // A /photos post's caption text isn't reliably clickable — readers reported the product
  // link in the caption couldn't be tapped. /feed with a `link` param instead renders Facebook's
  // own clickable link-preview card (pulling og:image/title from the product page), so the link
  // itself is the tappable element rather than plain caption text. Falls back to a plain photo
  // post when there's no link to attach (e.g. a generic announcement with no product page).
  const endpoint = linkUrl
    ? `https://graph.facebook.com/v21.0/${secrets.metaPageId}/feed`
    : `https://graph.facebook.com/v21.0/${secrets.metaPageId}/photos`;
  const body = linkUrl
    ? new URLSearchParams({ message: caption, link: linkUrl, access_token: secrets.metaPageAccessToken })
    : new URLSearchParams({ url: imageUrl, caption, access_token: secrets.metaPageAccessToken });
  const response = await fetch(endpoint, { method: "POST", body });
  const data = await response.json() as { id?: string; error?: { message?: string } };
  if (!response.ok) {
    return { platform: "facebook", status: "failed", message: data.error?.message ?? "Facebook publish failed." };
  }
  return { platform: "facebook", status: "published", externalId: data.id, message: "Published to Facebook Page." };
}

async function publishInstagram(caption: string, imageUrl: string, secrets: SocialSecrets): Promise<PublishResult> {
  if (!secrets.metaPageAccessToken || !secrets.metaInstagramUserId) {
    return { platform: "instagram", status: "failed", message: "Meta token or Instagram user ID is not configured." };
  }

  const createEndpoint = `https://graph.facebook.com/v21.0/${secrets.metaInstagramUserId}/media`;
  const createBody = new URLSearchParams({
    image_url: imageUrl,
    caption,
    access_token: secrets.metaPageAccessToken,
  });
  const createResponse = await fetch(createEndpoint, { method: "POST", body: createBody });
  const createData = await createResponse.json() as { id?: string; error?: { message?: string } };
  if (!createResponse.ok || !createData.id) {
    return { platform: "instagram", status: "failed", message: createData.error?.message ?? "Instagram media create failed." };
  }

  const publishEndpoint = `https://graph.facebook.com/v21.0/${secrets.metaInstagramUserId}/media_publish`;
  const publishBody = new URLSearchParams({
    creation_id: createData.id,
    access_token: secrets.metaPageAccessToken,
  });
  const publishResponse = await fetch(publishEndpoint, { method: "POST", body: publishBody });
  const publishData = await publishResponse.json() as { id?: string; error?: { message?: string } };
  if (!publishResponse.ok) {
    return { platform: "instagram", status: "failed", message: publishData.error?.message ?? "Instagram publish failed." };
  }
  return { platform: "instagram", status: "published", externalId: publishData.id, message: "Published to Instagram." };
}

async function publishTelegram(caption: string, imageUrl: string, secrets: SocialSecrets): Promise<PublishResult> {
  if (!secrets.telegramBotToken || !secrets.telegramChannelId) {
    return { platform: "telegram", status: "failed", message: "Telegram bot token or channel ID is not configured." };
  }

  const endpoint = `https://api.telegram.org/bot${secrets.telegramBotToken}/sendPhoto`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: secrets.telegramChannelId,
      photo: imageUrl,
      caption,
    }),
  });
  const data = await response.json() as { ok?: boolean; result?: { message_id?: number }; description?: string };
  if (!response.ok || !data.ok) {
    return { platform: "telegram", status: "failed", message: data.description ?? "Telegram publish failed." };
  }
  return {
    platform: "telegram",
    status: "published",
    externalId: data.result?.message_id ? String(data.result.message_id) : undefined,
    message: "Published to Telegram channel.",
  };
}

function publishWhatsAppChannel(caption: string): PublishResult {
  return {
    platform: "whatsapp_channel",
    status: "manual",
    message: "WhatsApp Channel has no public auto-post API. Copy this caption into WhatsApp Channel admin.",
    caption,
  };
}

function publishX(caption: string): PublishResult {
  return {
    platform: "x",
    status: "manual",
    message: "X's posting API requires a paid developer tier. Copy this caption and post it manually.",
    caption,
  };
}

function publishYouTubeCommunity(caption: string): PublishResult {
  return {
    platform: "youtube_community",
    status: "manual",
    message: "YouTube has no public API for Community posts. Copy this caption into a new Community post.",
    caption,
  };
}

export async function publishToPlatforms(
  platforms: SocialPlatform[],
  captionFor: string | ((platform: SocialPlatform) => string),
  imageUrl: string,
  secrets: SocialSecrets,
  linkUrl?: string,
): Promise<PublishResult[]> {
  const results: PublishResult[] = [];
  const getCaption = typeof captionFor === "function" ? captionFor : () => captionFor;

  for (const platform of platforms) {
    const caption = getCaption(platform);
    if (platform === "facebook") results.push(await publishFacebook(caption, imageUrl, secrets, linkUrl));
    if (platform === "instagram") results.push(await publishInstagram(caption, imageUrl, secrets));
    if (platform === "telegram") results.push(await publishTelegram(caption, imageUrl, secrets));
    if (platform === "whatsapp_channel") results.push(publishWhatsAppChannel(caption));
    if (platform === "x") results.push(publishX(caption));
    if (platform === "youtube_community") results.push(publishYouTubeCommunity(caption));
  }

  return results;
}

export function summarizePublishResults(results: PublishResult[]) {
  const notable = results.filter((item) => item.status === "failed" || item.status === "skipped");
  if (!notable.length) return "";
  return notable.map((item) => `${item.platform}: ${item.message}`).join(" | ");
}

export function isPublishSuccessful(results: PublishResult[]) {
  return results.some((item) => item.status === "published" || item.status === "manual");
}
