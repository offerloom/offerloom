export const MAX_AUTO_SOCIAL_RETRIES = 3;

const RETRY_DELAYS_MS = [10 * 60_000, 60 * 60_000, 6 * 60 * 60_000];

export function nextSocialRetryAt(retryAttempts, from = Date.now()) {
  if (retryAttempts >= MAX_AUTO_SOCIAL_RETRIES) return null;
  return new Date(from + RETRY_DELAYS_MS[retryAttempts]).toISOString();
}

export function platformsNeedingPublish(platforms, previousResults = []) {
  const alreadyPublished = new Set(
    previousResults.filter((result) => result.status === "published").map((result) => result.platform),
  );
  return platforms.filter((platform) => !alreadyPublished.has(platform));
}

export function mergePublishResults(platforms, previousResults = [], newResults = []) {
  const byPlatform = new Map(previousResults.map((result) => [result.platform, result]));
  for (const result of newResults) byPlatform.set(result.platform, result);
  return platforms.flatMap((platform) => {
    const result = byPlatform.get(platform);
    return result ? [result] : [];
  });
}
