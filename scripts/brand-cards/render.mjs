// Renders the 60 OfferLoom brand quote cards (1080x1350, Instagram portrait) to public/brand/posts/NN.jpg (PNG, then converted to JPEG).
// Run: node scripts/brand-cards/render.mjs   (uses Playwright's Chromium)
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
import { readFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { BRAND_POSTS } from "../../app/lib/social/brand-posts.mjs";

const root = resolve(import.meta.dirname, "../..");
const logo = await readFile(resolve(root, "public/brand/logo-mark.svg"), "utf8");
const THEMES = [
  { bg: "linear-gradient(150deg,#4f46e5,#7c3aed 55%,#db2777)", fg: "#fff", sub: "#e0e7ff", chip: "rgba(255,255,255,.16)" },
  { bg: "linear-gradient(160deg,#fff7ed,#ffedd5 60%,#fed7aa)", fg: "#1c1917", sub: "#9a3412", chip: "#fff" },
  { bg: "linear-gradient(145deg,#0f172a,#1e293b 60%,#334155)", fg: "#f8fafc", sub: "#fbbf24", chip: "rgba(255,255,255,.08)" },
  { bg: "linear-gradient(150deg,#ecfeff,#cffafe 50%,#a5f3fc)", fg: "#083344", sub: "#0e7490", chip: "#fff" },
  { bg: "linear-gradient(155deg,#f43f5e,#fb923c)", fg: "#fff", sub: "#fff1f2", chip: "rgba(255,255,255,.18)" },
  { bg: "linear-gradient(150deg,#f5f3ff,#ede9fe 55%,#ddd6fe)", fg: "#2e1065", sub: "#6d28d9", chip: "#fff" },
  { bg: "linear-gradient(150deg,#064e3b,#047857 60%,#10b981)", fg: "#ecfdf5", sub: "#a7f3d0", chip: "rgba(255,255,255,.12)" },
  { bg: "linear-gradient(150deg,#fefce8,#fef08a)", fg: "#1a2e05", sub: "#4d7c0f", chip: "#fff" },
];
const ICONS = ["🛍️", "💸", "🔎", "🏷️", "⚡", "🎯", "📉", "🛒", "✨", "💡"];
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function html([quote, line], i) {
  const t = THEMES[i % THEMES.length], layout = Math.floor(i / THEMES.length) % 3;
  const align = layout === 1 ? "center" : "left";
  return `<!doctype html><html><head><style>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;700;800&display=swap');
  *{margin:0;box-sizing:border-box}body{width:1080px;height:1350px;background:${t.bg};color:${t.fg};font-family:Poppins,system-ui,sans-serif;
  display:flex;flex-direction:column;justify-content:space-between;padding:96px 88px;text-align:${align};position:relative;overflow:hidden}
  .ring{position:absolute;border-radius:50%;border:2px solid ${t.sub};opacity:.18}
  .brand{display:flex;align-items:center;gap:18px;font-weight:800;font-size:44px;${align === "center" ? "justify-content:center" : ""}}
  .brand svg{width:72px;height:72px}.icon{font-size:110px;margin-bottom:28px}
  h1{font-size:${quote.length > 48 ? 76 : 90}px;line-height:1.08;font-weight:800;letter-spacing:-1.5px}
  p{margin-top:36px;font-size:40px;line-height:1.35;color:${t.sub};font-weight:500}
  .foot{display:flex;${align === "center" ? "justify-content:center" : "justify-content:space-between"};align-items:center;gap:24px;font-size:30px;font-weight:700}
  .chip{background:${t.chip};padding:16px 30px;border-radius:999px}
  </style></head><body>
  <div class="ring" style="width:700px;height:700px;right:-260px;top:-220px"></div><div class="ring" style="width:420px;height:420px;left:-180px;bottom:-140px"></div>
  <div class="brand">${logo.replace(/width="[^"]*"|height="[^"]*"/g, "")}<span>OfferLoom</span></div>
  <div><div class="icon">${ICONS[i % ICONS.length]}</div><h1>${esc(quote)}</h1><p>${esc(line)}</p></div>
  <div class="foot"><span class="chip">Compare · Save · Shop smart</span>${align === "center" ? "" : "<span>#OfferLoom</span>"}</div>
  </body></html>`;
}

await mkdir(resolve(root, "public/brand/posts"), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
for (const [i, post] of BRAND_POSTS.entries()) {
  await page.setContent(html(post, i), { waitUntil: "networkidle" });
  await page.screenshot({ path: resolve(root, `public/brand/posts/${String(i + 1).padStart(2, "0")}.png`) });
}
await browser.close();
console.log(`Rendered ${BRAND_POSTS.length} cards`);
