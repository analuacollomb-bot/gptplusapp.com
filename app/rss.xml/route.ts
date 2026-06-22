import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

const rssLimit = 50;

export async function GET() {
  const posts = getAllPosts().slice(0, rssLimit);
  const updatedAt = posts[0]?.updatedAt ?? posts[0]?.date ?? new Date().toISOString();

  const items = posts
    .map((post) => {
      const url = `${siteConfig.url}/blog/${post.slug}`;
      const pubDate = new Date(`${post.date}T00:00:00+08:00`).toUTCString();

      return `<item>
  <title>${escapeXml(post.title)}</title>
  <link>${escapeXml(url)}</link>
  <guid>${escapeXml(url)}</guid>
  <pubDate>${pubDate}</pubDate>
  <category>${escapeXml(post.category)}</category>
  <description>${escapeXml(post.description)}</description>
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escapeXml(siteConfig.name)} 最新教程</title>
  <link>${escapeXml(siteConfig.url)}</link>
  <atom:link href="${escapeXml(siteConfig.url)}/rss.xml" rel="self" type="application/rss+xml" />
  <description>${escapeXml(siteConfig.description)}</description>
  <language>zh-CN</language>
  <lastBuildDate>${new Date(`${updatedAt}T00:00:00+08:00`).toUTCString()}</lastBuildDate>
  ${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
    },
  });
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
