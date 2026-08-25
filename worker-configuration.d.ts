export {};

declare global {
  namespace Cloudflare {
    interface Env {
      ASSETS: Fetcher;
      DB: D1Database;
      DEPLOYMENT_PLATFORM?: string;
      ADMIN_API_TOKEN?: string;
    }
  }
}
