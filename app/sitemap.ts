import type { MetadataRoute } from "next";
import { seoKeywordPages } from "@/content/seo";
import { getAllPosts } from "@/lib/posts";
import { categories, siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/topics",
    "/telegram",
    "/products",
    "/blog",
    "/reviews",
    "/help",
    "/faq",
    "/rss.xml",
    "/about",
    "/contact",
  ].map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : route === "/products" ? 0.9 : 0.8,
  }));

  const topicRoutes = seoKeywordPages.map((page) => ({
    url: `${siteConfig.url}/topics/${page.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.88,
  }));

  const categoryRoutes = categories.map((category) => ({
    url: `${siteConfig.url}${category.path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  const postRoutes = getAllPosts().map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: new Date(`${post.updatedAt ?? post.date}T00:00:00+08:00`),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  return [...staticRoutes, ...categoryRoutes, ...topicRoutes, ...postRoutes];
}
