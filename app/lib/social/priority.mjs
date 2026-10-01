export function prioritizeFacebook(platforms) {
  if (!platforms.includes("facebook")) return [...platforms];
  return ["facebook", ...platforms.filter((platform) => platform !== "facebook")];
}

export function shouldSkipInstagramAfterFacebookFailure(platform, results) {
  if (platform !== "instagram") return false;
  const facebook = results.find((result) => result.platform === "facebook");
  return Boolean(facebook && facebook.status !== "published");
}

export function isSocialPublishSuccessful(results, requestedPlatforms = []) {
  if (requestedPlatforms.includes("facebook")) {
    return results.some((result) => result.platform === "facebook" && result.status === "published");
  }
  return results.some((result) => result.status === "published");
}
