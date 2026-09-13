const ALLOWED_IMAGE_HOSTS = new Set([
  "m.media-amazon.com",
  "images-na.ssl-images-amazon.com",
  "images-eu.ssl-images-amazon.com",
  "assets.ajio.com",
  "assets-jiocdn.ajio.com",
]);

// Instagram's media-download crawler is blocked by some merchant CDNs even when
// Facebook's own crawler succeeds on the identical URL. Proxying through our own
// domain (fetched here with a normal browser UA) works around that.
export async function GET(request: Request) {
  const src = new URL(request.url).searchParams.get("src");
  if (!src) return Response.json({ error: "Missing src" }, { status: 400 });

  let target: URL;
  try {
    target = new URL(src);
  } catch {
    return Response.json({ error: "Invalid src" }, { status: 400 });
  }
  if (target.protocol !== "https:" || !ALLOWED_IMAGE_HOSTS.has(target.hostname) || target.username || target.password || target.port) {
    return Response.json({ error: "Unsupported image host" }, { status: 400 });
  }

  const upstream = await fetch(target.toString(), {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36" },
  });
  if (!upstream.ok || !upstream.body) return Response.json({ error: "Upstream fetch failed" }, { status: 502 });

  const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
  if (!contentType.startsWith("image/")) return Response.json({ error: "Not an image" }, { status: 502 });

  return new Response(upstream.body, {
    headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=3600" },
  });
}
