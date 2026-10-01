export function prioritizeFacebook(platforms) {
  if (!platforms.includes("facebook")) return [...platforms];
  return ["facebook", ...platforms.filter((platform) => platform !== "facebook")];
}

export function isSocialPublishSuccessful(results, requestedPlatforms = []) {
  const requiredMetaPlatforms = ["facebook", "instagram"].filter((platform) => requestedPlatforms.includes(platform));
  if (requiredMetaPlatforms.length === 2) {
    return requiredMetaPlatforms.every((platform) => results.some((result) => result.platform === platform && result.status === "published"));
  }
  if (requiredMetaPlatforms.length === 1) {
    const [platform] = requiredMetaPlatforms;
    return results.some((result) => result.platform === platform && result.status === "published");
  }
  return results.some((result) => result.status === "published");
}
