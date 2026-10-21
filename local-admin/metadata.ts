import { createHash } from "node:crypto";
import { products, productCategories } from "../content/products";
import type { Fields } from "./store";

export type RelatedPost = { slug: string; title: string; category: string };
export type MetadataSuggestion = {
  title?: string; description?: string; category?: string; slug?: string;
  keywords?: string[]; productId?: string; relatedSlugs?: string[];
};

const categoryTerms: Record<string, string[]> = {
  ChatGPT: ["chatgpt", "gpt", "openai", "codex", "sora", "o3"],
  Claude: ["claude", "anthropic", "克劳德"], Gemini: ["gemini", "google ai", "谷歌ai", "谷歌 ai", "gemini advanced"],
  Grok: ["grok", "supergrok", "grok heavy"], YouTube: ["youtube", "油管"], Spotify: ["spotify", "声田"],
  "X Premium": ["x premium", "twitter", "推特"], Midjourney: ["midjourney", "mj绘画"], Poe: ["poe"], Perplexity: ["perplexity"],
};

const intents: [RegExp, string, string][] = [
  [/支付|付款|银行卡|信用卡|payment/i, "payment", "支付问题"], [/充值|代充|recharge/i, "recharge", "充值教程"],
  [/开通|订阅|subscription/i, "subscription", "会员开通"], [/登录|登陆|login/i, "login", "登录问题"],
  [/封号|风控|风险|安全|risk/i, "account-safety", "账号安全"], [/下载|安装|download/i, "download", "下载安装"],
  [/升级|upgrade/i, "upgrade", "套餐升级"], [/验证|verification/i, "verification", "账号验证"],
];

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const clip = (value: string, length: number) => [...value].slice(0, length).join("");

function plain(value: string) {
  return value.replace(/```[\s\S]*?```/g, " ").replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/https?:\/\/\S+/g, " ")
    .replace(/^[\s#>*_\-]+/gm, "").replace(/[*_`~]/g, "").replace(/\s+/g, " ").trim();
}

export function detectCategory(title: string, content: string) {
  let best = "AI教程";
  let score = 0;
  for (const [category, terms] of Object.entries(categoryTerms)) {
    const titleText = title.toLowerCase();
    const bodyText = content.toLowerCase();
    const matches = (value: string, term: string) => {
      // Avoid classifying Grok as GPT, or Poe as an arbitrary substring.
      if (term === "gpt") return /(?:\bchatgpt\b|\bgpt(?:[-\s]|\b))/i.test(value);
      if (term === "poe") return /\bpoe\b/i.test(value);
      return value.includes(term);
    };
    const current = terms.reduce((sum, term) => sum + (matches(titleText, term) ? 8 : 0) + (matches(bodyText, term) ? 1 : 0), 0);
    if (current > score) { score = current; best = category; }
  }
  return best;
}

export function normalizeSlug(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function generateSlug(title: string, category: string) {
  const prefix = normalizeSlug(category) || "ai";
  const model = title.match(/\b(?:plus|pro|max|codex|advanced|heavy)\b/ig)?.map(s => s.toLowerCase()).filter((s, i, list) => list.indexOf(s) === i).join("-");
  const intent = intents.find(([pattern]) => pattern.test(title))?.[1] || "guide";
  const suffix = createHash("sha256").update(title).digest("hex").slice(0, 8);
  return [prefix, model, intent, suffix].filter(Boolean).join("-");
}

function matchProduct(title: string, content: string, category: string, suggestedId?: string) {
  const suppliedUrls = new Set((content.match(/https?:\/\/[^\s<>"\]]+/g) ?? []).map(url => url.replace(/[。，、；;!！）)]+$/, "").replace(/\/$/, "")));
  const explicit = products.find(product => [product.orderUrl, product.originalUrl].some(url => url && suppliedUrls.has(url.replace(/\/$/, "")) && /\/item\//.test(url)));
  if (explicit) return explicit;
  const suggested = products.find(product => product.id === suggestedId && product.category === category);
  if (suggested) return suggested;
  const wantsAccount = /成品|成品号|账号购买|购买账号|现号/.test(`${title} ${content}`);
  const wantsRecharge = /充值|代充|续费/.test(`${title} ${content}`);
  if (!wantsAccount && !wantsRecharge) return undefined;
  const models = ["plus", "pro", "max", "codex", "supergrok", "advanced", "heavy"];
  const requested = models.filter(model => new RegExp(`\\b${model}\\b`, "i").test(title));
  const factor = title.match(/\b(5|20)\s*(?:x|倍)/i)?.[1];
  const relevant = products.filter(product => product.category === category &&
    (wantsAccount ? /成品|现号/.test(product.title) : !/成品|现号/.test(product.title)) &&
    (!factor || new RegExp(`\\b${factor}\\s*(?:x|倍)`, "i").test(product.title))).map(product => ({
    product, score: requested.reduce((sum, model) => sum + (new RegExp(`\\b${model}\\b`, "i").test(product.title) ? 1 : 0), 0),
  })).filter(entry => entry.score > 0).sort((a, b) => b.score - a.score);
  // Similar plans (for example Max 5x/20x) must never be chosen arbitrarily.
  const best = relevant.filter(entry => entry.score === relevant[0]?.score);
  return best.length === 1 ? best[0].product : undefined;
}

/** Generate metadata only: the author's body is never rewritten. */
export function completeMetadata(
  input: { fields?: unknown; content: string; manualFields?: unknown },
  options: { existing?: Fields; suggestion?: MetadataSuggestion; organize?: boolean } = {},
): Fields {
  const source = input.fields && typeof input.fields === "object" && !Array.isArray(input.fields) ? input.fields as Record<string, unknown> : {};
  const manual = new Set(Array.isArray(input.manualFields) ? input.manualFields.filter(key => typeof key === "string") : []);
  const automatic = options.organize && !options.existing && Array.isArray(input.manualFields);
  const keep = (key: string) => !automatic || manual.has(key);
  const suggestion = options.suggestion ?? {};
  const title = text(source.title) || text(suggestion.title) || clip(plain(input.content.split(/\r?\n/).find(line => plain(line)) ?? ""), 100);
  const description = (keep("description") ? text(source.description) : "") || text(suggestion.description) || clip(plain(input.content).replace(plain(title), "").trim(), 160) || clip(plain(title), 160);
  const rawCategory = text(source.category);
  const category = rawCategory && (!options.organize || manual.has("category") || options.existing || (!automatic && rawCategory !== "AI教程")) ? rawCategory
    : (productCategories as string[]).includes(suggestion.category ?? "") ? suggestion.category! : detectCategory(title, input.content);
  const rawSlug = text(source.slug);
  let slug = (keep("slug") ? rawSlug : "") || text(suggestion.slug);
  if (!options.existing) {
    // Traversal characters remain invalid; ordinary pasted punctuation is harmless.
    if (!/[\\/\x00-\x1f]/.test(slug)) slug = normalizeSlug(slug).slice(0, 150).replace(/-$/, "") || generateSlug(title, category);
  } else if (options.organize || !slug) slug = options.existing.slug;
  const rawKeywords = Array.isArray(source.keywords) ? source.keywords.map(String).filter(Boolean) : text(source.keywords).split(/[,，]/).map(s => s.trim()).filter(Boolean);
  const keywords = rawKeywords.length && keep("keywords") ? rawKeywords : suggestion.keywords?.length ? suggestion.keywords.slice(0, 12) : [category,
    ...intents.filter(([pattern]) => pattern.test(`${title} ${input.content}`)).slice(0, 4).map(([, , label]) => `${category}${label}`)];
  const suppliedId = text(source.productId);
  const suppliedUrl = text(source.productUrl);
  const customProduct = suppliedId && suppliedId !== "general-ai-membership";
  const customUrl = suppliedUrl && !/^https?:\/\/gpt3plus\.com\/?$/.test(suppliedUrl);
  const shouldKeepProduct = options.existing || manual.has("productId") || manual.has("productUrl") || (!automatic && (customProduct || customUrl));
  const product = shouldKeepProduct ? undefined : matchProduct(title, input.content, category, suggestion.productId);
  const date = text(source.date) || new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return { title, description, category, slug, date, keywords,
    productId: product?.id || (shouldKeepProduct ? suppliedId : "") || "general-ai-membership",
    productUrl: product?.orderUrl || (shouldKeepProduct ? suppliedUrl : "") || "https://gpt3plus.com/", sourceUrl: text(source.sourceUrl),
  };
}

export function relatedCandidates(title: string, content: string, category: string, posts: RelatedPost[], excludeSlug = "") {
  const reference = `${title} ${plain(content).slice(0, 1200)}`.toLowerCase();
  const labels = intents.filter(([pattern]) => pattern.test(reference));
  return posts.filter(post => post.slug !== excludeSlug).map(post => ({ post,
    score: (post.category === category ? 8 : 0) + labels.filter(([pattern]) => pattern.test(post.title)).length * 3 +
      (post.title.match(/[A-Za-z][A-Za-z0-9.+-]{2,}/g) ?? []).filter(word => reference.includes(word.toLowerCase())).length,
  })).filter(entry => entry.score >= 8).sort((a, b) => b.score - a.score || a.post.slug.localeCompare(b.post.slug)).slice(0, 12).map(entry => entry.post);
}
