import { supabase, type Article } from "../lib/supabase";

export const revalidate = 300;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const { data } = await supabase
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(50);

  const articles = (data as Article[]) ?? [];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vantage.vercel.app";

  const items = articles
    .map(
      (a) => `    <item>
      <title>${escapeXml(a.headline)}</title>
      <link>${siteUrl}/article/${a.slug}</link>
      <guid isPermaLink="true">${siteUrl}/article/${a.slug}</guid>
      <description>${escapeXml(a.subheadline ?? a.headline)}</description>
      <category>${escapeXml(a.category ?? "Tech")}</category>
      <pubDate>${new Date(a.published_at).toUTCString()}</pubDate>
    </item>`
    )
    .join("\n");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>VANTAGE — AI-Powered Tech Intelligence</title>
    <link>${siteUrl}</link>
    <description>Tri-signal tech intelligence. Every story cross-referenced across news wires, Reddit, and HackerNews.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
