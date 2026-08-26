import type { PublishResult, SocialPlatform, SocialSecrets } from "./types";

async function publishFacebook(caption: string, imageUrl: string, secrets: SocialSecrets): Promise<PublishResult> {
  if (!secrets.metaPageAccessToken || !secrets.metaPageId) {
    return { platform: "facebook", status: "failed", message: "Meta Page token or Page ID is not configured." };
  }

  const endpoint = `https://graph.facebook.com/v21.0/${secrets.metaPageId}/photos`;
  const body = new URLSearchParams({
    url: imageUrl,
    caption,
    access_token: secrets.metaPageAccessToken,
  });
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
    message: "WhatsApp Channel has no public auto-post API. Copy the prepared caption into WhatsApp Channel admin.",
    externalId: caption.slice(0, 120),
  };
}

export async function publishToPlatforms(
  platforms: SocialPlatform[],
  caption: string,
  imageUrl: string,
  secrets: SocialSecrets,
): Promise<PublishResult[]> {
  const results: PublishResult[] = [];

  for (const platform of platforms) {
    if (platform === "facebook") results.push(await publishFacebook(caption, imageUrl, secrets));
    if (platform === "instagram") results.push(await publishInstagram(caption, imageUrl, secrets));
    if (platform === "telegram") results.push(await publishTelegram(caption, imageUrl, secrets));
    if (platform === "whatsapp_channel") results.push(publishWhatsAppChannel(caption));
  }

  return results;
}

export function summarizePublishResults(results: PublishResult[]) {
  const failed = results.filter((item) => item.status === "failed");
  if (failed.length === results.length) return failed.map((item) => `${item.platform}: ${item.message}`).join(" | ");
  if (failed.length > 0) return failed.map((item) => `${item.platform}: ${item.message}`).join(" | ");
  return "";
}

export function isPublishSuccessful(results: PublishResult[]) {
  return results.some((item) => item.status === "published" || item.status === "manual");
}
