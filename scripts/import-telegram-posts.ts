import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  getProductById,
  products,
  type Product,
  type ProductCategory,
} from "../content/products";

type TelegramPost = {
  id: string;
  channel: string;
  sourceUrl: string;
  date: string;
  text: string;
  links: string[];
  orderUrl: string;
};

type ImportOptions = {
  channel: string;
  source?: string;
  maxPages: number;
  limit: number;
};

const rootDir = process.cwd();
const postsDir = path.join(rootDir, "content/posts");
const dataDir = path.join(rootDir, "data");
const defaultOrderUrl = "https://gpt3plus.com/";
const fallbackProductId = "general-ai-membership";

const args = new Map(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith("--"))
    .map((arg) => {
      const [key, ...rest] = arg.slice(2).split("=");
      return [key, rest.join("=") || "true"];
    }),
);

const options: ImportOptions = {
  channel: args.get("channel") ?? process.env.TELEGRAM_CHANNEL ?? "netfix666",
  source: args.get("source") ?? process.env.TELEGRAM_SOURCE_FILE,
  maxPages: Number(args.get("max-pages") ?? process.env.TELEGRAM_MAX_PAGES ?? 12),
  limit: Number(args.get("limit") ?? process.env.TELEGRAM_IMPORT_LIMIT ?? 300),
};

const categorySignals: Array<{
  category: ProductCategory;
  terms: string[];
  keywords: string[];
}> = [
  {
    category: "ChatGPT",
    terms: ["chatgpt", "gpt plus", "gpt会员", "openai", "gpt-4", "gpt4", "codex", "sora"],
    keywords: ["ChatGPT充值", "ChatGPT Plus充值", "GPT会员开通"],
  },
  {
    category: "Claude",
    terms: ["claude", "anthropic", "organization", "组织 id", "claude pro", "claude max"],
    keywords: ["Claude Pro充值", "Claude会员开通", "Claude账号"],
  },
  {
    category: "Gemini",
    terms: ["gemini", "google ai", "google", "advanced"],
    keywords: ["Gemini Pro充值", "Gemini Advanced开通", "Google AI会员"],
  },
  {
    category: "Grok",
    terms: ["grok", "supergrok", "xai", "x premium", "twitter"],
    keywords: ["Grok会员开通", "SuperGrok充值", "X账号"],
  },
  {
    category: "Other",
    terms: ["netflix", "奈飞", "网飞"],
    keywords: ["Netflix会员", "奈飞账号", "流媒体会员"],
  },
  {
    category: "YouTube",
    terms: ["youtube", "油管"],
    keywords: ["YouTube Premium", "YouTube会员"],
  },
  {
    category: "Spotify",
    terms: ["spotify"],
    keywords: ["Spotify会员", "Spotify订阅"],
  },
  {
    category: "X Premium",
    terms: ["x premium", "twitter blue"],
    keywords: ["X Premium开通", "X会员"],
  },
  {
    category: "Midjourney",
    terms: ["midjourney", "mj"],
    keywords: ["Midjourney会员", "AI绘画会员"],
  },
  {
    category: "Poe",
    terms: ["poe"],
    keywords: ["Poe会员", "Poe订阅"],
  },
  {
    category: "Perplexity",
    terms: ["perplexity"],
    keywords: ["Perplexity会员", "Perplexity Pro"],
  },
];

function decodeHtml(value: string) {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (entity, code: string) => {
    if (code.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    }
    if (code.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    }
    const entities: Record<string, string> = {
      amp: "&",
      gt: ">",
      lt: "<",
      nbsp: " ",
      quot: '"',
      apos: "'",
    };
    return entities[code] ?? entity;
  });
}

function stripHtml(html: string) {
  return decodeHtml(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\r/g, ""),
  )
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function normalizeText(text: string) {
  return text
    .replace(/[\u0000-\u001f\u007f]/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, 6000);
}

function extractLinks(block: string) {
  const links = Array.from(block.matchAll(/\bhref="([^"]+)"/g))
    .map((match) => decodeHtml(match[1]))
    .filter((href) => href.startsWith("http"));

  return Array.from(new Set(links));
}

function extractMessageText(block: string) {
  const textMatch = block.match(
    /<div class="tgme_widget_message_text js-message_text"[^>]*>([\s\S]*?)<\/div>/,
  );
  if (textMatch) {
    return normalizeText(stripHtml(textMatch[1]));
  }

  const serviceMatch = block.match(
    /<div class="tgme_widget_message_service_message"[^>]*>([\s\S]*?)<\/div>/,
  );
  return serviceMatch ? normalizeText(stripHtml(serviceMatch[1])) : "";
}

function parseTelegramHtml(html: string, channel: string) {
  if (html.includes("page_body chat_page") && html.includes('class="message')) {
    return parseTelegramDesktopHtml(html, channel);
  }

  const blocks = Array.from(
    html.matchAll(
      /<div class="tgme_widget_message_wrap js-widget_message_wrap">([\s\S]*?)(?=<div class="tgme_widget_message_wrap js-widget_message_wrap">|<div class="tgme_channel_history|<\/main>|$)/g,
    ),
  ).map((match) => match[1]);

  const posts: TelegramPost[] = [];

  for (const block of blocks) {
    const postMatch = block.match(/data-post="([^"]+)"/);
    const dateMatch = block.match(/<time datetime="([^"]+)"/);
    const text = extractMessageText(block);

    if (!postMatch || !text || text.length < 20) {
      continue;
    }

    const rawId = postMatch[1];
    const id = rawId.split("/").pop() ?? createHash("sha1").update(text).digest("hex").slice(0, 10);
    const links = extractLinks(block);
    const orderUrl = links.find((link) => link.includes("gpt3plus.com")) ?? defaultOrderUrl;
    const date = dateMatch?.[1]?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);

    posts.push({
      id,
      channel,
      sourceUrl: `https://t.me/${channel}/${id}`,
      date,
      text,
      links,
      orderUrl,
    });
  }

  return posts;
}

function parseDesktopDate(value?: string) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  const match = value.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!match) {
    return new Date().toISOString().slice(0, 10);
  }

  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function parseTelegramDesktopHtml(html: string, channel: string) {
  const blocks = Array.from(
    html.matchAll(
      /<div class="message default clearfix(?: joined)?" id="message([^"]+)">([\s\S]*?)(?=<div class="message (?:service|default)|<\/div>\s*<\/div>\s*<\/body>|$)/g,
    ),
  );

  const posts: TelegramPost[] = [];

  for (const match of blocks) {
    const id = match[1].replace(/\D/g, "");
    const block = match[2];
    const dateMatch = block.match(/<div class="pull_right date details" title="([^"]+)"/);
    const textMatch = block.match(/<div class="text">([\s\S]*?)<\/div>/);

    if (!id || !textMatch) {
      continue;
    }

    const text = normalizeText(stripHtml(textMatch[1]));
    if (text.length < 20) {
      continue;
    }

    const links = extractLinks(textMatch[1]);
    const textLinks = Array.from(text.matchAll(/https?:\/\/\S+/g)).map((item) =>
      item[0].replace(/[),.，。]+$/, ""),
    );
    const allLinks = Array.from(new Set([...links, ...textLinks]));

    posts.push({
      id,
      channel,
      sourceUrl: `https://t.me/${channel}/${id}`,
      date: parseDesktopDate(dateMatch?.[1]),
      text,
      links: allLinks,
      orderUrl: allLinks.find((link) => link.includes("gpt3plus.com")) ?? defaultOrderUrl,
    });
  }

  return posts;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function textFromExportValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        if (isRecord(item) && typeof item.text === "string") {
          return item.text;
        }
        return "";
      })
      .join("");
  }

  return "";
}

function linksFromExportValue(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .flatMap((item) => {
      if (!isRecord(item)) {
        return [];
      }
      const href = typeof item.href === "string" ? item.href : undefined;
      const text = typeof item.text === "string" ? item.text : undefined;
      return [href, text].filter((link): link is string => Boolean(link?.startsWith("http")));
    })
    .filter((link, index, array) => array.indexOf(link) === index);
}

function parseTelegramExportJson(raw: string, channel: string) {
  const parsed = JSON.parse(raw) as unknown;
  const messages = Array.isArray(parsed)
    ? parsed
    : isRecord(parsed) && Array.isArray(parsed.messages)
      ? parsed.messages
      : [];

  return messages.flatMap((message): TelegramPost[] => {
    if (!isRecord(message)) {
      return [];
    }

    const id = String(message.id ?? "");
    const text = normalizeText(textFromExportValue(message.text));
    const dateValue = typeof message.date === "string" ? message.date : new Date().toISOString();
    const date = dateValue.slice(0, 10);
    const entityLinks = linksFromExportValue(message.text_entities);
    const textLinks = Array.from(text.matchAll(/https?:\/\/\S+/g)).map((match) =>
      match[0].replace(/[),.，。]+$/, ""),
    );
    const links = Array.from(new Set([...entityLinks, ...textLinks]));

    if (!id || !text || text.length < 20) {
      return [];
    }

    return [
      {
        id,
        channel,
        sourceUrl: `https://t.me/${channel}/${id}`,
        date,
        text,
        links,
        orderUrl: links.find((link) => link.includes("gpt3plus.com")) ?? defaultOrderUrl,
      },
    ];
  });
}

async function fetchText(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; GPTPlusAppContentBot/1.0; +https://gptplusapp.com)",
        accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function loadTelegramPosts({ channel, source, maxPages, limit }: ImportOptions) {
  if (source) {
    const sourcePath = path.isAbsolute(source) ? source : path.join(rootDir, source);
    const raw = await fs.readFile(sourcePath, "utf8");
    const parsed = sourcePath.endsWith(".json")
      ? parseTelegramExportJson(raw, channel)
      : parseTelegramHtml(raw, channel);
    return parsed.slice(0, limit);
  }

  const collected = new Map<string, TelegramPost>();
  let before: number | undefined;

  for (let page = 0; page < maxPages && collected.size < limit; page += 1) {
    const url = before
      ? `https://t.me/s/${channel}?before=${before}`
      : `https://t.me/s/${channel}`;
    const html = await fetchText(url);
    const posts = parseTelegramHtml(html, channel);

    if (posts.length === 0) {
      break;
    }

    for (const post of posts) {
      collected.set(post.id, post);
    }

    const minId = Math.min(...posts.map((post) => Number(post.id)).filter(Number.isFinite));
    if (!Number.isFinite(minId) || minId <= 1 || minId === before) {
      break;
    }
    before = minId;
  }

  return Array.from(collected.values())
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, limit);
}

function detectCategory(text: string): ProductCategory {
  const lower = text.toLowerCase();
  const matched = categorySignals.find((signal) =>
    signal.terms.some((term) => lower.includes(term)),
  );
  return matched?.category ?? "陈鹏AI服务";
}

function extractTitleLine(text: string) {
  return (
    text
      .split("\n")
      .map((line) =>
        line
          .replace(/^#+\s*/, "")
          .replace(/^[-*•\d.、\s]+/, "")
          .replace(/https?:\/\/\S+/g, "")
          .replace(/\s+/g, " ")
          .trim(),
      )
      .find((line) => line.length >= 6) ?? "AI会员开通与使用笔记"
  );
}

function makeTitle(post: TelegramPost, category: ProductCategory) {
  const titleLine = extractTitleLine(post.text);
  const hasIntent = /充值|开通|会员|订阅|支付|账号|教程|使用|问题|风控|续费/.test(titleLine);
  const prefix =
    category === "陈鹏AI服务" || category === "Other" ? "AI会员服务笔记" : `${category}教程`;
  const title = hasIntent ? titleLine : `${prefix}：${titleLine}`;
  return title.length > 54 ? `${title.slice(0, 54)}…` : title;
}

function makeDescription(text: string, category: ProductCategory) {
  const compact = text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const lead = compact.slice(0, 92);
  const subject =
    category === "陈鹏AI服务" || category === "Other" ? "AI会员开通" : `${category}会员开通`;
  return `陈鹏AI服务实时博客整理：${lead}。补充${subject}、账号检查、风险边界和自助下单前注意事项。`;
}

function makeKeywords(text: string, category: ProductCategory) {
  const signal = categorySignals.find((item) => item.category === category);
  const textKeywords = [
    "AI会员充值",
    "陈鹏AI服务实时博客",
    "自助下单",
    "账号检查",
    "支付失败",
    "风控说明",
  ];
  const productKeywords = signal?.keywords ?? ["AI工具使用教程", "AI会员开通"];
  const matchedWords = ["ChatGPT", "Claude", "Gemini", "Grok", "Plus", "Pro", "Max", "SuperGrok", "X Premium"].filter(
    (word) => text.toLowerCase().includes(word.toLowerCase()),
  );

  return Array.from(new Set([...productKeywords, ...matchedWords, ...textKeywords])).slice(0, 12);
}

function scoreProduct(product: Product, post: TelegramPost, category: ProductCategory) {
  const haystack = `${product.title} ${product.description} ${product.keywords.join(" ")} ${product.tags.join(" ")}`.toLowerCase();
  const text = post.text.toLowerCase();
  let score = product.category === category ? 4 : 0;

  for (const keyword of product.keywords) {
    if (text.includes(keyword.toLowerCase())) {
      score += 3;
    }
  }

  for (const word of ["chatgpt", "claude", "gemini", "grok", "youtube", "spotify", "premium", "plus", "pro", "max"]) {
    if (text.includes(word) && haystack.includes(word)) {
      score += 2;
    }
  }

  return score;
}

function matchProduct(post: TelegramPost, category: ProductCategory) {
  if (post.orderUrl !== defaultOrderUrl) {
    const exact = products.find((product) => product.orderUrl === post.orderUrl);
    if (exact && (exact.category === category || category === "Other" || category === "陈鹏AI服务")) {
      return exact;
    }
  }

  const best = products
    .map((product) => ({ product, score: scoreProduct(product, post, category) }))
    .sort((a, b) => b.score - a.score)[0];

  return best && best.score > 0 ? best.product : getProductById(fallbackProductId);
}

function escapeFrontmatter(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function makeSlug(post: TelegramPost) {
  return `telegram-${post.channel}-${post.date.replaceAll("-", "")}-${post.id}`;
}

function paragraphizeOriginal(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (line.startsWith("- ") ? line : line))
    .join("\n\n");
}

function makeAnalysis(category: ProductCategory, title: string) {
  const subject =
    category === "陈鹏AI服务" || category === "Other" ? "AI 工具会员" : `${category} 会员`;

  return [
    `这类信息适合当作下单前的判断材料来看。很多用户搜索“${subject}怎么充值”“${subject}怎么开通”时，真正需要解决的不是按钮在哪里，而是账号状态、商品规则和平台风控能不能提前看清。`,
    `陈鹏AI服务一直强调稳定靠谱、不拼低价。低价只能解决一瞬间的决策冲动，不能替用户处理账号欠款、地区环境、登录验证、支付失败和售后边界。看完这条实时笔记后，建议先把自己的账号状态核对清楚，再决定是否进入自助下单流程。`,
    `如果你是因为“${title.replace(/…$/, "")}”这个问题找到这里，可以重点看三个位置：账号当前是否能正常登录、商品页是否明确支持你的账号状态、出现异常时需要提供哪些截图和订单信息。`,
  ].join("\n\n");
}

function makeArticle(post: TelegramPost) {
  const category = detectCategory(post.text);
  const product = matchProduct(post, category);
  const productUrl =
    post.orderUrl && post.orderUrl !== defaultOrderUrl
      ? post.orderUrl
      : product?.orderUrl ?? defaultOrderUrl;
  const productId = product?.id ?? fallbackProductId;
  const title = makeTitle(post, category);
  const description = makeDescription(post.text, category);
  const keywords = makeKeywords(post.text, category);
  const slug = makeSlug(post);
  const subject =
    category === "陈鹏AI服务" || category === "Other" ? "AI会员" : `${category}会员`;

  return `---
title: "${escapeFrontmatter(title)}"
description: "${escapeFrontmatter(description)}"
category: "${category}"
slug: "${slug}"
date: "${post.date}"
keywords: ${JSON.stringify(keywords)}
productId: "${escapeFrontmatter(productId)}"
productUrl: "${escapeFrontmatter(productUrl)}"
sourceUrl: "${escapeFrontmatter(post.sourceUrl)}"
---

## 频道原文要点

${paragraphizeOriginal(post.text)}

## 军师解读

${makeAnalysis(category, title)}

## 本文适合谁

- 正在搜索 ${subject}充值、开通、续费或支付失败处理方式的用户。
- 已经看过商品页，但不确定自己的账号状态是否适合直接下单的用户。
- 不想只比价格，更希望把账号风险、处理流程和售后边界先看清楚的用户。
- 需要长期使用 ChatGPT、Claude、Gemini、Grok 或其他 AI 工具，希望减少反复试错的用户。

## 常见问题场景

很多用户遇到的不是单纯“能不能买”的问题，而是信息判断不完整：账号当前可能不是 Free 状态，历史订阅可能有未结清欠款，邮箱可能填错，登录环境可能频繁变化，也可能把不同产品的规则混在一起看。

如果你看到频道里提到某个商品、活动或处理方式，建议不要只截取其中一句话下单。更稳妥的做法是把原文、商品页说明和自己的账号状态放在一起看：商品支持什么账号，不支持什么账号，需要提交哪些信息，售后处理边界写在哪里。

## 下单前检查清单

- 当前账号是否能正常登录，是否可以完成必要验证。
- 当前会员状态是否符合商品说明，例如 Free、Plus、Pro、Max 或其他状态。
- 是否存在 overdue、扣款失败、取消订阅未完成、历史退款等账单问题。
- 下单邮箱、账号邮箱、X/Google/Claude 组织信息是否填写正确。
- 是否已经阅读商品页的处理规则、时效说明和售后要求。
- 是否接受平台规则变化和账号风控带来的不确定性。

## 风险说明

本站和陈鹏AI服务会尽量把流程、规则和注意事项讲清楚，但不会承诺脱离平台规则的结果。AI 会员、账号订阅和虚拟产品都可能受到平台策略、地区环境、账号历史、支付通道和安全验证影响。

如果你的账号本身已经出现受限、欠款、异常验证、登录失败或资料不一致，充值并不一定能直接解决基础账号问题。先判断问题来源，再决定是否下单，比反复尝试更稳。

## 自助下单引导

如果你已经看完这条实时博客，并确认账号状态、商品规则和风险说明，可以进入陈鹏AI服务自助下单页查看对应商品。不同产品规则不同，请先阅读商品页说明，再决定是否购买。

[前往自助下单](${productUrl})

## FAQ

### 这篇文章和 Telegram 频道是什么关系？

本文来自陈鹏AI服务公开 Telegram 频道内容整理，并补充了面向搜索用户的账号检查、风险说明和下单前判断。频道内容偏实时，网站文章偏长期沉淀，方便后续通过关键词检索。

### 下单前最应该先看什么？

先看商品说明里的适用账号、需要提交的信息、处理时效和售后边界。然后再核对自己的账号状态，尤其是会员等级、欠款、邮箱、地区环境和登录验证。

### 为什么不建议只看价格？

AI 会员类虚拟产品的核心不是单次价格，而是账号状态、平台规则和售后沟通是否清楚。只追求低价，容易忽略账号不适配、信息填错、风控验证和后续排查成本。

### 如果频道原文和商品页说明不一致怎么办？

以最新商品页说明为准。频道内容有实时性，商品规则可能调整；无法判断时，先联系客服确认，不要带着疑问直接下单。
`;
}

async function writePosts(posts: TelegramPost[]) {
  await fs.mkdir(postsDir, { recursive: true });
  await fs.mkdir(dataDir, { recursive: true });

  const normalized = posts.filter(
    (post, index, array) => array.findIndex((item) => item.id === post.id) === index,
  );

  await fs.writeFile(
    path.join(dataDir, "telegram-posts.json"),
    JSON.stringify(normalized, null, 2),
  );

  let written = 0;

  for (const post of normalized) {
    const slug = makeSlug(post);
    const filePath = path.join(postsDir, `${slug}.md`);
    await fs.writeFile(filePath, makeArticle(post), "utf8");
    written += 1;
  }

  return written;
}

async function main() {
  console.log(`开始导入 Telegram 公开频道：${options.channel}`);
  const posts = await loadTelegramPosts(options);

  if (posts.length === 0) {
    throw new Error(
      "没有解析到公开帖子。可以导出频道公开 HTML 后运行：npm run import:telegram -- --source=data/netfix666.html",
    );
  }

  const written = await writePosts(posts);
  console.log(`已生成 ${written} 篇实时博客文章，数据备份在 data/telegram-posts.json`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Telegram 导入失败：${message}`);
  process.exitCode = 1;
});
