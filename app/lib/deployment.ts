export async function isWorkersDeployment(): Promise<boolean> {
  try {
    const { env } = await import("cloudflare:workers");
    return env.DEPLOYMENT_PLATFORM === "workers";
  } catch {
    return false;
  }
}
