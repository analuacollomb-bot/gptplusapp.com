import fs from "node:fs/promises";
import path from "node:path";
import type { Product, ProductCategory } from "../content/products";

const BASE_URL = "https://gpt3plus.com";
const USER_AGENT =
  "Mozilla/5.0 (compatible; GPTPlusAppContentBot/1.0; public product metadata only)";
const rootDir = process.cwd();
const dataPath = path.join(rootDir, "data/products.json");
const generatedTsPath = path.join(rootDir, "content/products.generated.ts");
const skippedPath = path.join(rootDir, "data/products.skipped.json");
const manualLinksPath = path.join(rootDir, "data/product-links.txt");

type RemoteCategory = {
  id: number | string;
  name: string;
  commodity_count?: number;
  children?: RemoteCategory[];
};

type RemoteProduct = {
  id: number | string;
  name: string;
  price?: number | string;
  category?: { name?: string };
  category_id?: number | string;
  sourceCategory?: string;
};

const categoryKeywords: Array<[ProductCategory, string[]]> = [
  ["ChatGPT", ["chatgpt", "gpt", "openai"]],
  ["Claude", ["claude", "anthropic"]],
  ["Gemini", ["gemini", "google"]],
  ["Grok", ["grok", "supergrok", "xai"]],
  ["YouTube", ["youtube", "油管"]],
  ["Spotify", ["spotify"]],
  ["X Premium", ["x premium", "twitter", "推特", "x账号", "x 账号"]],
  ["Midjourney", ["midjourney", "mj"]],
  ["Poe", ["poe"]],
  ["Perplexity", ["perplexity"]],
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function toSlug(input: string) {
  return input
    .toLowerCase()
    .replace(/✅|🔥|【|】|\(|\)|（|）|\/|\|/g, " ")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function normalizeCategory(text: string): ProductCategory {
  const lower = `${text}`.toLowerCase();
  for (const [category, keywords] of categoryKeywords) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return category;
    }
  }
  return "Other";
}

function chooseCategory(title: string, categoryName: string | undefined, detailText: string) {
  const byTitle = normalizeCategory(title);
  if (byTitle !== "Other") {
    return byTitle;
  }
  const byCategory = normalizeCategory(categoryName || "");
  if (byCategory !== "Other") {
    return byCategory;
  }
  return normalizeCategory(detailText.slice(0, 180));
}

function summarizeDescription(title: string, detailText: string) {
  const source = detailText || title;
  const clean = source
    .replace(/百分百|绝对不会|永久稳定|包成功/g, "")
    .replace(/价格说明[\s\S]*/g, "")
    .slice(0, 220);

  return clean || "公开商品页暂未识别到完整说明，请以下单页当前说明为准。";
}

function extractListItems(text: string, fallback: string[]) {
  const sentences = text
    .split(/[。！？\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 8 && item.length <= 80);
  return [...sentences.slice(0, 3), ...fallback].slice(0, 4);
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { "user-agent": USER_AGENT, accept: "application/json,text/html" },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "user-agent": USER_AGENT, accept: "text/html" },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.text();
}

function flattenCategories(categories: RemoteCategory[], result: RemoteCategory[] = []) {
  for (const category of categories) {
    result.push(category);
    if (Array.isArray(category.children)) {
      flattenCategories(category.children, result);
    }
  }
  return result;
}

function parseItemJson(html: string) {
  const match = html.match(/setVar\("_var_item",(\{[\s\S]*?\})\);<\/script>/);
  if (!match) {
    return undefined;
  }
  try {
    return JSON.parse(match[1]) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function parseDescription(html: string) {
  const match = html.match(
    /<div class="nagoya-description-body">([\s\S]*?)<\/div>\s*<\/div>\s*<\/section>/,
  );
  return match ? stripHtml(match[1]) : "";
}

async function readManualLinks() {
  const links = new Set<string>();
  const envLinks = process.env.PRODUCT_LINKS?.split(",") ?? [];
  for (const link of envLinks) {
    if (link.trim()) links.add(link.trim());
  }
  try {
    const file = await fs.readFile(manualLinksPath, "utf8");
    for (const line of file.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        links.add(trimmed);
      }
    }
  } catch {
    // Optional file.
  }
  return Array.from(links);
}

async function scrape() {
  await fs.mkdir(path.join(rootDir, "data"), { recursive: true });
  const skipped: Array<{ url: string; reason: string }> = [];
  const remoteProducts = new Map<string, RemoteProduct>();

  const categoryResponse = await fetchJson<{ code: number; data: RemoteCategory[] }>(
    `${BASE_URL}/user/api/index/data`,
  );
  const categories = flattenCategories(categoryResponse.data || []);

  for (const category of categories) {
    const url = `${BASE_URL}/user/api/index/commodity?categoryId=${encodeURIComponent(
      String(category.id),
    )}`;
    try {
      const response = await fetchJson<{ code: number; data: RemoteProduct[] }>(url);
      for (const product of response.data || []) {
        remoteProducts.set(String(product.id), {
          ...product,
          sourceCategory: category.name,
        });
      }
    } catch (error) {
      skipped.push({ url, reason: error instanceof Error ? error.message : String(error) });
    }
    await sleep(120);
  }

  for (const keyword of [
    "ChatGPT",
    "Claude",
    "Gemini",
    "Grok",
    "YouTube",
    "Spotify",
    "Premium",
    "Midjourney",
    "Poe",
    "Perplexity",
  ]) {
    const url = `${BASE_URL}/user/api/index/commodity?keywords=${encodeURIComponent(keyword)}`;
    try {
      const response = await fetchJson<{ code: number; data: RemoteProduct[] }>(url);
      for (const product of response.data || []) {
        remoteProducts.set(String(product.id), product);
      }
    } catch (error) {
      skipped.push({ url, reason: error instanceof Error ? error.message : String(error) });
    }
    await sleep(120);
  }

  for (const link of await readManualLinks()) {
    const match = link.match(/\/item\/(\d+)/);
    if (!match) {
      skipped.push({ url: link, reason: "不是可识别的 /item/{id} 商品链接" });
      continue;
    }
    remoteProducts.set(match[1], { id: match[1], name: `手动商品 ${match[1]}` });
  }

  const products: Product[] = [];

  for (const remoteProduct of remoteProducts.values()) {
    const remoteId = String(remoteProduct.id);
    const originalUrl = `${BASE_URL}/item/${remoteId}`;
    try {
      const html = await fetchText(originalUrl);
      const item = parseItemJson(html);
      const title = stripHtml(String(item?.name || remoteProduct.name || `商品 ${remoteId}`))
        .replace(/永久免费/g, "长期使用说明")
        .replace(/绝对不会/g, "风险较低")
        .replace(/百分百/g, "尽量");
      const detailText = parseDescription(html);
      const category = chooseCategory(
        title,
        remoteProduct.category?.name || remoteProduct.sourceCategory,
        detailText,
      );
      const platform = category === "Other" ? "AI 工具" : category;
      const price = item?.price ?? remoteProduct.price;
      const keywords = Array.from(
        new Set([
          `${platform}充值`,
          `${platform}开通`,
          `${platform}支付失败`,
          "AI会员充值",
        ]),
      );

      products.push({
        id: `${toSlug(platform)}-${remoteId}`,
        title,
        category,
        platform,
        description: summarizeDescription(title, detailText),
        originalUrl,
        orderUrl: originalUrl,
        price: price === undefined || price === null ? undefined : `¥${price}`,
        keywords,
        tags: [platform, "自助下单", "商品说明"].filter(Boolean),
        notices: extractListItems(detailText, [
          "下单前先阅读商品页说明",
          "确认账号状态和售后边界",
          "虚拟产品受平台规则影响",
        ]),
        suitableFor: [
          `需要开通或续费 ${platform} 相关服务的用户`,
          "希望先看清商品规则，再自助下单的用户",
        ],
        riskNotes: [
          "不同账号状态和平台风控策略可能影响处理结果",
          "商品说明与售后边界以发卡网页面当前展示为准",
        ],
        updatedAt: new Date().toISOString().slice(0, 10),
      });
    } catch (error) {
      skipped.push({
        url: originalUrl,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
    await sleep(160);
  }

  products.sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));

  const json = JSON.stringify(products, null, 2);
  await fs.writeFile(dataPath, `${json}\n`, "utf8");
  await fs.writeFile(
    generatedTsPath,
    `import type { Product } from "./products";\n\nexport const generatedProducts: Product[] = ${json};\n`,
    "utf8",
  );
  await fs.writeFile(skippedPath, `${JSON.stringify(skipped, null, 2)}\n`, "utf8");

  console.log(`Scraped ${products.length} public products.`);
  console.log(`Wrote ${path.relative(rootDir, dataPath)}`);
  console.log(`Wrote ${path.relative(rootDir, generatedTsPath)}`);
  if (skipped.length > 0) {
    console.log(`Skipped ${skipped.length} URLs. See ${path.relative(rootDir, skippedPath)}`);
  }
}

scrape().catch((error) => {
  console.error(error);
  process.exit(1);
});
