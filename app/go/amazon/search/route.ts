import { buildAmazonSearchUrl } from "../../../lib/amazon";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("k")?.trim();
  if (!query) return new Response("Missing search query", { status: 400 });
  return Response.redirect(buildAmazonSearchUrl(query), 302);
}
