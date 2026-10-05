import type { PublishResult, SocialPlatform, SocialSecrets } from "./types";
import { isSocialPublishSuccessful, prioritizeFacebook } from "./priority.mjs";

const PUBLISH_REQUEST_TIMEOUT_MS = 20_000;

type MetaApiError = {
  message?: string;
  type?: string;
  code?: number;
  fbtrace_id?: string;
  is_transient?: boolean;
};

function describeMetaError(error: MetaApiError | undefined, fallback: string) {
  const message = error?.message ?? fallback;
  const details = [
    error?.type,
    error?.code === undefined ? undefined : `code ${error.code}`,
    error?.fbtrace_id ? `trace ${error.fbtrace_id}` : undefined,
    error?.is_transient ? "transient" : undefined,
  ].filter(Boolean);
  const diagnosis = error?.code === 200
    ? "Meta blocked this API call. Check the app/business restriction status and publishing permissions; replacing the token alone may not resolve an app-level block."
    : undefined;
  return [message, ...details, diagnosis].filter(Boolean).join(" — ");
}

function postForm(url: string, body: URLSearchParams) {
  return fetch(url, {
    method: "POST",
    body,
    signal: AbortSignal.timeout(PUBLISH_REQUEST_TIMEOUT_MS),
  });
}

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
  const response = await postForm(endpoint, body);
  const data = await response.json() as { id?: string; error?: MetaApiError };
  if (!response.ok) {
    return { platform: "facebook", status: "failed", message: describeMetaError(data.error, "Facebook publish failed.") };
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
  const createResponse = await postForm(createEndpoint, createBody);
  const createData = await createResponse.json() as { id?: string; error?: MetaApiError };
  if (!createResponse.ok || !createData.id) {
    return { platform: "instagram", status: "failed", message: describeMetaError(createData.error, "Instagram media create failed.") };
  }

  const publishEndpoint = `https://graph.facebook.com/v21.0/${secrets.metaInstagramUserId}/media_publish`;
  const publishBody = new URLSearchParams({
    creation_id: createData.id,
    access_token: secrets.metaPageAccessToken,
  });
  const publishResponse = await postForm(publishEndpoint, publishBody);
  const publishData = await publishResponse.json() as { id?: string; error?: MetaApiError };
  if (!publishResponse.ok) {
    return { platform: "instagram", status: "failed", message: describeMetaError(publishData.error, "Instagram publish failed.") };
  }
  return { platform: "instagram", status: "published", externalId: publishData.id, message: "Published to Instagram." };
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

  // Facebook goes first, then Instagram is always attempted independently. Both
  // channels are required for a dual-channel campaign, so a failure on either
  // leaves the campaign retryable instead of silently completing one channel only.
  for (const platform of prioritizeFacebook(platforms)) {
    const caption = getCaption(platform);
    try {
      if (platform === "facebook") results.push(await publishFacebook(caption, imageUrl, secrets, linkUrl));
      if (platform === "instagram") results.push(await publishInstagram(caption, imageUrl, secrets));
    } catch (error) {
      results.push({
        platform,
        status: "failed",
        message: error instanceof Error ? error.message : "The platform request failed unexpectedly.",
      });
    }
  }

  return results;
}

export function summarizePublishResults(results: PublishResult[]) {
  const notable = results.filter((item) => item.status === "failed" || item.status === "skipped");
  if (!notable.length) return "";
  return notable.map((item) => `${item.platform}: ${item.message}`).join(" | ");
}

export function isPublishSuccessful(results: PublishResult[], requestedPlatforms: SocialPlatform[] = []) {
  // For campaigns targeting both Meta channels, completion requires confirmation
  // from both. Facebook remains primary for ordering and remains required on its own.
  return isSocialPublishSuccessful(results, requestedPlatforms);
}
