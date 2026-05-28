import { generatedProducts } from "./products.generated";

export type ProductCategory =
  | "ChatGPT"
  | "Claude"
  | "Gemini"
  | "Grok"
  | "YouTube"
  | "Spotify"
  | "X Premium"
  | "Midjourney"
  | "Poe"
  | "Perplexity"
  | "陈鹏AI服务"
  | "Other";

export type Product = {
  id: string;
  title: string;
  category: ProductCategory;
  platform: string;
  description: string;
  originalUrl: string;
  orderUrl: string;
  keywords: string[];
  tags: string[];
  notices: string[];
  suitableFor: string[];
  riskNotes: string[];
  updatedAt: string;
  price?: string;
};

export const fallbackProducts: Product[] = [
  {
    id: "general-ai-membership",
    title: "AI 会员自助下单总入口",
    category: "Other",
    platform: "GPT Plus App",
    description:
      "当具体商品暂未匹配时，可以先进入陈鹏AI服务自助下单站，阅读对应商品说明后再决定是否购买。",
    originalUrl: "https://gpt3plus.com/",
    orderUrl: "https://gpt3plus.com/",
    keywords: ["AI会员充值", "自助下单", "陈鹏AI服务"],
    tags: ["总入口", "商品说明", "自助下单"],
    notices: ["下单前先阅读商品说明", "确认账号状态和售后边界"],
    suitableFor: ["不确定具体商品入口，需要先浏览商品分类的用户"],
    riskNotes: ["虚拟产品受账号状态、平台规则和风控策略影响"],
    updatedAt: "2026-05-27",
  },
];

function cleanText(value: string) {
  let output = "";

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    const next = value.charCodeAt(index + 1);

    if (code >= 0xd800 && code <= 0xdbff) {
      if (next >= 0xdc00 && next <= 0xdfff) {
        output += value[index] + value[index + 1];
        index += 1;
      }
      continue;
    }

    if (code >= 0xdc00 && code <= 0xdfff) {
      continue;
    }

    output += value[index];
  }

  return output.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}

function cleanProduct(product: Product): Product {
  return {
    ...product,
    title: cleanText(product.title),
    description: cleanText(product.description),
    keywords: product.keywords.map(cleanText),
    tags: product.tags.map(cleanText),
    notices: product.notices.map(cleanText),
    suitableFor: product.suitableFor.map(cleanText),
    riskNotes: product.riskNotes.map(cleanText),
    price: product.price ? cleanText(product.price) : undefined,
  };
}

export const products: Product[] =
  (generatedProducts.length > 0 ? generatedProducts : fallbackProducts).map(cleanProduct);

export const productCategories: ProductCategory[] = [
  "ChatGPT",
  "Claude",
  "Gemini",
  "Grok",
  "YouTube",
  "Spotify",
  "X Premium",
  "Midjourney",
  "Poe",
  "Perplexity",
  "陈鹏AI服务",
  "Other",
];

export function getProductById(id?: string) {
  if (!id) {
    return undefined;
  }
  return products.find((product) => product.id === id);
}

export function getProductsByCategory(category: string, limit?: number) {
  const matched = products.filter((product) => product.category === category);
  return typeof limit === "number" ? matched.slice(0, limit) : matched;
}

export function getRelatedProducts(category: string, limit = 4) {
  const matched = getProductsByCategory(category, limit);
  if (matched.length >= limit) {
    return matched;
  }
  return [...matched, ...products.filter((product) => product.category !== category)]
    .filter(
      (product, index, array) =>
        array.findIndex((item) => item.id === product.id) === index,
    )
    .slice(0, limit);
}
