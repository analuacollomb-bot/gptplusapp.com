import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import matter from "gray-matter";
import { productCategories } from "@/content/products";
import { getCategoryByName } from "@/lib/site";

export type PostFrontmatter = {
  title: string;
  description: string;
  category: string;
  slug: string;
  date: string;
  updatedAt?: string;
  keywords: string[];
  productId: string;
  productUrl: string;
  sourceUrl?: string;
};

export type Post = PostFrontmatter & {
  content: string;
  readingTime: string;
  categorySlug: string;
  filePath: string;
  headings: PostHeading[];
};

export type PostHeading = {
  id: string;
  text: string;
  depth: 2 | 3;
};

const postsDirectory = path.join(process.cwd(), "content/posts");

function isPostFile(fileName: string) {
  return fileName.endsWith(".md") || fileName.endsWith(".mdx");
}

function getReadingTime(content: string) {
  const withoutCode = content.replace(/```[\s\S]*?```/g, "");
  const cjkChars = withoutCode.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  const latinWords =
    withoutCode
      .replace(/[\u3400-\u9fff]/g, " ")
      .match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g)?.length ?? 0;
  const minutes = Math.max(1, Math.ceil((cjkChars + latinWords * 2) / 520));
  return `${minutes} 分钟阅读`;
}

export function getHeadingId(text: string) {
  let hash = 0;
  for (const char of text) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return `section-${hash.toString(36)}`;
}

function extractHeadings(content: string): PostHeading[] {
  return Array.from(content.matchAll(/^(#{2,3})\s+(.+)$/gm))
    .map((match) => {
      const text = match[2].replace(/[#*_`]/g, "").trim();
      return {
        id: getHeadingId(text),
        text,
        depth: match[1].length as 2 | 3,
      };
    })
    .filter((heading) => heading.text.length > 0);
}

function normalizeFrontmatter(data: Record<string, unknown>, filePath: string) {
  const requiredFields = [
    "title",
    "description",
    "category",
    "slug",
    "date",
    "keywords",
    "productId",
    "productUrl",
  ] as const;

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`${filePath} 缺少 frontmatter 字段：${field}`);
    }
  }

  const category = String(data.category);
  const categoryConfig = getCategoryByName(category);

  if (!categoryConfig && !(productCategories as readonly string[]).includes(category)) {
    throw new Error(`${filePath} 的 category 不在已配置分类中：${category}`);
  }

  const keywords = Array.isArray(data.keywords)
    ? data.keywords.map(String)
    : String(data.keywords)
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean);

  return {
    title: String(data.title),
    description: String(data.description),
    category,
    categorySlug: categoryConfig?.slug ?? category.toLowerCase().replace(/\s+/g, "-"),
    slug: String(data.slug),
    date: String(data.date),
    updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
    keywords,
    productId: String(data.productId),
    productUrl: String(data.productUrl),
    sourceUrl: data.sourceUrl ? String(data.sourceUrl) : undefined,
  };
}

export const getAllPosts = cache((): Post[] => {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  return fs
    .readdirSync(postsDirectory)
    .filter(isPostFile)
    .map((fileName) => {
      const filePath = path.join(postsDirectory, fileName);
      const raw = fs.readFileSync(filePath, "utf8");
      const { data, content } = matter(raw);
      const frontmatter = normalizeFrontmatter(data, filePath);

      return {
        ...frontmatter,
        content,
        readingTime: getReadingTime(content),
        filePath,
        headings: extractHeadings(content),
      };
    })
    .sort((a, b) => Number(new Date(b.date)) - Number(new Date(a.date)));
});

export function getPostBySlug(slug: string) {
  return getAllPosts().find((post) => post.slug === slug);
}

export function getPostsByCategory(slug: string) {
  return getAllPosts().filter((post) => post.categorySlug === slug);
}

export function getTelegramPosts(limit?: number) {
  const posts = getAllPosts().filter(
    (post) =>
      post.slug.startsWith("telegram-netfix666-") ||
      post.keywords.some((keyword) => keyword.includes("陈鹏AI服务实时博客")),
  );
  return typeof limit === "number" ? posts.slice(0, limit) : posts;
}

export function getRelatedPosts(post: Post, limit = 3) {
  const sameCategory = getAllPosts().filter(
    (candidate) =>
      candidate.slug !== post.slug && candidate.category === post.category,
  );
  const fallback = getAllPosts().filter((candidate) => candidate.slug !== post.slug);
  return [...sameCategory, ...fallback]
    .filter(
      (candidate, index, array) =>
        array.findIndex((item) => item.slug === candidate.slug) === index,
    )
    .slice(0, limit);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Shanghai",
  }).format(new Date(`${date}T00:00:00+08:00`));
}
