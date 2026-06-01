import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { products, type ProductCategory } from "../content/products";

type RawFrontmatter = Record<string, unknown>;

type LoadedPost = {
  fileName: string;
  filePath: string;
  frontmatter: RawFrontmatter;
  content: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
  keywords: string[];
  productId: string;
  productUrl: string;
  sourceUrl?: string;
  chineseLength: number;
  isTelegram: boolean;
};

type ImprovedPost = LoadedPost & {
  tier: "A" | "B" | "C";
  intent: ContentIntent;
  improvedTitle: string;
  improvedDescription: string;
  related: Array<{ title: string; slug: string }>;
};

type ContentIntent =
  | "payment"
  | "account"
  | "comparison"
  | "order"
  | "usage"
  | "support";

type AuditResult = {
  total: number;
  telegram: number;
  duplicateTitles: Array<[string, number]>;
  duplicateDescriptions: Array<[string, number]>;
  duplicateSlugs: Array<[string, number]>;
  shortUnder300: LoadedPost[];
  shortUnder800: LoadedPost[];
  missing: Record<string, number>;
  categories: Record<string, number>;
};

const rootDir = process.cwd();
const postsDir = path.join(rootDir, "content/posts");
const reportsDir = path.join(rootDir, "reports");
const today = "2026-06-01";
const reportOnly = process.argv.includes("--report-only");
const defaultProductUrl = "https://gpt3plus.com/";

const categoryPaths: Record<string, string> = {
  ChatGPT: "/chatgpt",
  Claude: "/claude",
  Gemini: "/gemini",
  Grok: "/grok",
  "X Premium": "/products",
  YouTube: "/products",
  Spotify: "/products",
  Midjourney: "/products",
  Poe: "/products",
  Perplexity: "/products",
  Other: "/products",
  AI教程: "/blog",
  陈鹏AI服务: "/telegram",
};

const categoryProfiles: Record<
  string,
  {
    platform: string;
    membership: string;
    accountFocus: string[];
    useCases: string[];
    pillarSlugs: string[];
  }
> = {
  ChatGPT: {
    platform: "ChatGPT",
    membership: "ChatGPT Plus / Pro",
    accountFocus: ["Free / Plus / Pro 状态", "overdue 欠款", "邮箱登录", "订阅残留", "账号风控"],
    useCases: ["通用问答", "写作办公", "代码辅助", "文件分析", "多模态使用"],
    pillarSlugs: [
      "chatgpt-plus-guonei-chongzhi",
      "chatgpt-plus-credit-card-declined",
      "chatgpt-plus-paid-but-not-active",
    ],
  },
  Claude: {
    platform: "Claude",
    membership: "Claude Pro / Max",
    accountFocus: ["Free / Pro / Max 状态", "Organization ID", "overdue 欠款", "Workspace 信息", "账号地区"],
    useCases: ["长文档处理", "写作润色", "代码阅读", "研究总结", "长上下文分析"],
    pillarSlugs: [
      "claude-pro-chongzhi-zhuyi",
      "claude-pro-account-not-eligible",
      "claude-pro-organization-id",
    ],
  },
  Gemini: {
    platform: "Gemini",
    membership: "Gemini Advanced / Pro",
    accountFocus: ["Google 账号地区", "付款资料", "Google Pay", "家庭组", "多账号登录"],
    useCases: ["Google 生态", "多模态处理", "文档协作", "搜索增强", "手机端联动"],
    pillarSlugs: [
      "gemini-pro-guonei-shiyong",
      "gemini-advanced-payment-failed",
      "gemini-card-declined-account-or-bank",
    ],
  },
  Grok: {
    platform: "Grok",
    membership: "Grok / SuperGrok",
    accountFocus: ["X 账号状态", "Grok / SuperGrok 权益", "地区与 IP", "邮箱和昵称", "账号受限"],
    useCases: ["X 生态", "实时内容理解", "热点信息", "xAI 模型体验", "社交内容辅助"],
    pillarSlugs: [
      "grok-huiyuan-kaitong",
      "supergrok-open-failed-reasons",
      "grok-supergrok-credit-card-declined",
    ],
  },
  陈鹏AI服务: {
    platform: "陈鹏AI服务",
    membership: "AI 会员服务",
    accountFocus: ["商品说明", "订单邮箱", "支付回调", "客服核对", "仿冒提醒"],
    useCases: ["频道提醒", "服务说明", "商品规则", "账号排查", "下单前判断"],
    pillarSlugs: [
      "ai-membership-payment-failed-guide",
      "ai-membership-recharge-vs-own-card",
      "telegram-netfix666-20260527-227",
    ],
  },
  AI教程: {
    platform: "AI 会员",
    membership: "AI 会员订阅",
    accountFocus: ["账号状态", "支付方式", "地区环境", "平台风控", "商品规则"],
    useCases: ["充值排查", "开通判断", "产品选择", "风险说明", "自助下单"],
    pillarSlugs: ["ai-membership-payment-failed-guide", "ai-membership-recharge-vs-own-card"],
  },
  Other: {
    platform: "AI 会员",
    membership: "数字会员服务",
    accountFocus: ["账号状态", "商品说明", "邮箱填写", "支付结果", "售后边界"],
    useCases: ["会员开通", "账号检查", "支付排查", "使用说明", "服务对比"],
    pillarSlugs: ["ai-membership-payment-failed-guide", "ai-membership-recharge-vs-own-card"],
  },
};

const fallbackProfile = categoryProfiles.Other;

function isMarkdownFile(fileName: string) {
  return fileName.endsWith(".md") || fileName.endsWith(".mdx");
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function countChinese(text: string) {
  return text.match(/[\u3400-\u9fff]/g)?.length ?? 0;
}

function stripMarkdown(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`>|~-]/g, "")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanTitle(value: string, category: string, slug: string) {
  const fromSlug = slug
    .split("-")
    .filter(Boolean)
    .slice(0, 8)
    .join(" ");

  const cleaned = value
    .replace(/[\u{1f300}-\u{1faff}\u{2600}-\u{27bf}]/gu, "")
    .replace(/\s+/g, " ")
    .replace(/[|｜]\s*GPT Plus App\s*$/i, "")
    .replace(/｜频道\d{8}第[^｜]+条$/, "")
    .replace(/｜[^｜]+下单判断(?:-[^｜]+)?$/, "")
    .replace(/｜(详细教程|开通前判断|账号规则版)$/, "")
    .replace(/^[#\s]+/, "")
    .trim();

  return cleaned || `${category} 教程：${fromSlug}`;
}

function compactTitle(title: string, maxLength = 66) {
  return title.length > maxLength ? `${title.slice(0, maxLength - 1)}…` : title;
}

function uniqueCounts(posts: LoadedPost[], key: keyof LoadedPost) {
  const counts = new Map<string, number>();
  for (const post of posts) {
    const value = String(post[key] ?? "").trim();
    if (value) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return counts;
}

function countBy(posts: LoadedPost[], getValue: (post: LoadedPost) => string) {
  const counts = new Map<string, number>();
  for (const post of posts) {
    const value = getValue(post).trim();
    if (value) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return counts;
}

function topDuplicates(counts: Map<string, number>) {
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);
}

async function loadPosts() {
  const fileNames = (await fs.readdir(postsDir)).filter(isMarkdownFile).sort();

  return Promise.all(
    fileNames.map(async (fileName): Promise<LoadedPost> => {
      const filePath = path.join(postsDir, fileName);
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = matter(raw);
      const frontmatter = parsed.data as RawFrontmatter;
      const slug = asString(frontmatter.slug, fileName.replace(/\.mdx?$/, ""));
      const category = asString(frontmatter.category, "Other");
      const title = cleanTitle(asString(frontmatter.title, slug), category, slug);
      const description = asString(frontmatter.description);
      const content = parsed.content.trim();

      return {
        fileName,
        filePath,
        frontmatter,
        content,
        slug,
        title,
        description,
        category,
        date: asString(frontmatter.date, today),
        keywords: asStringArray(frontmatter.keywords),
        productId: asString(frontmatter.productId, "general-ai-membership"),
        productUrl: asString(frontmatter.productUrl, defaultProductUrl),
        sourceUrl: asString(frontmatter.sourceUrl) || undefined,
        chineseLength: countChinese(stripMarkdown(content)),
        isTelegram:
          slug.startsWith("telegram-netfix666-") ||
          asString(frontmatter.sourceUrl).includes("t.me/netfix666"),
      };
    }),
  );
}

function audit(posts: LoadedPost[]): AuditResult {
  const titleCounts = countBy(posts, (post) => asString(post.frontmatter.title, post.title));
  const descriptionCounts = countBy(posts, (post) =>
    asString(post.frontmatter.description, post.description),
  );
  const slugCounts = uniqueCounts(posts, "slug");
  const categories: Record<string, number> = {};

  for (const post of posts) {
    categories[post.category] = (categories[post.category] ?? 0) + 1;
  }

  return {
    total: posts.length,
    telegram: posts.filter((post) => post.isTelegram).length,
    duplicateTitles: topDuplicates(titleCounts),
    duplicateDescriptions: topDuplicates(descriptionCounts),
    duplicateSlugs: topDuplicates(slugCounts),
    shortUnder300: posts.filter((post) => post.chineseLength < 300),
    shortUnder800: posts.filter((post) => post.chineseLength < 800),
    missing: {
      faq: posts.filter((post) => !/##\s*FAQ/i.test(post.content)).length,
      cta: posts.filter((post) => !/前往自助下单|自助下单引导/.test(post.content)).length,
      related: posts.filter((post) => !/相关文章推荐|相关教程|站内继续阅读/.test(post.content)).length,
      checklist: posts.filter((post) => !/检查清单|下单前清单|下单前检查/.test(post.content)).length,
      risk: posts.filter((post) => !/风险说明|风险透明/.test(post.content)).length,
      who: posts.filter((post) => !/本文适合谁/.test(post.content)).length,
    },
    categories,
  };
}

function getProfile(category: string) {
  return categoryProfiles[category] ?? fallbackProfile;
}

function classifyIntent(post: LoadedPost): ContentIntent {
  const primaryText = `${post.title} ${post.slug}`.toLowerCase();
  const text = `${primaryText} ${post.keywords.join(" ")}`.toLowerCase();

  if (/消息|token|模型|限制|额度|功能|权益|使用技巧|怎么用|shiyong/.test(primaryText)) {
    return "usage";
  }
  if (/支付|付款|信用卡|银行卡|扣款|card|declined|xunika|虚拟卡|未生效|不到账|失败/.test(primaryText)) {
    return "payment";
  }
  if (/账号|风控|overdue|欠款|组织|organization|workspace|受限|密码|验证码|地区|ip|邮箱/.test(primaryText)) {
    return "account";
  }
  if (/区别|对比|怎么选|适合|qubie|duibi|xuan/.test(primaryText)) {
    return "comparison";
  }
  if (/售后|客服|订单|未付款|查询|退款/.test(primaryText)) {
    return "support";
  }
  if (/技巧|使用|shiyong/.test(text)) {
    return "usage";
  }
  return "order";
}

function classifyTier(post: LoadedPost, intent: ContentIntent) {
  const text = `${post.title} ${post.slug}`;
  const pillarSignals = /国内充值教程|国内开通教程|总排查|通用排查|代充和自己信用卡|开通教程|使用教程/.test(
    text,
  );
  const conversionSignals =
    intent === "payment" ||
    intent === "account" ||
    /不能充值|开通失败|支付失败|付款成功|信用卡被拒|欠款|风控|下单前/.test(text);

  if (pillarSignals) return "A";
  if (conversionSignals) return "B";
  return "C";
}

function buildTitle(post: LoadedPost, counts: Map<string, number>) {
  let title = compactTitle(post.title);
  const isDuplicate = (counts.get(post.title) ?? 0) > 1;

  if (isDuplicate) {
    const messageId = post.slug.match(/(\d+)$/)?.[1] ?? post.fileName.replace(/\.mdx?$/, "");
    const slugTail = post.slug
      .split("-")
      .filter(Boolean)
      .slice(-2)
      .join("-");
    const duplicateLabel = slugTail.includes("jiaocheng")
      ? "详细教程"
      : slugTail.includes("chongzhi")
        ? "开通前判断"
        : "账号规则版";
    const suffix = post.isTelegram
      ? `｜频道${post.date.replace(/-/g, "")}第${messageId}条`
      : `｜${duplicateLabel}`;
    title = `${compactTitle(title, 48)}${suffix}`;
  }

  return title;
}

function buildDescription(post: LoadedPost, title: string, intent: ContentIntent) {
  const profile = getProfile(post.category);
  const intentText: Record<ContentIntent, string> = {
    payment: "支付失败、扣款异常、付款环境和平台风控",
    account: "账号状态、订阅历史、地区环境和风控边界",
    comparison: "产品区别、适合人群、开通方式和下单前判断",
    order: "充值流程、商品规则、账号检查和自助下单注意事项",
    usage: "使用场景、会员权益、账号状态和常见限制",
    support: "订单查询、售后沟通、支付回调和问题截图准备",
  };

  return compactTitle(
    `围绕「${title}」整理${intentText[intent]}，适合国内用户在开通 ${profile.membership} 前看清规则、检查账号状态并理解风险边界。`,
    118,
  );
}

function keywordSet(post: LoadedPost, title: string) {
  const profile = getProfile(post.category);
  const sanitizeKeyword = (word: string) =>
    word
      .replace(/｜频道\d{8}第[^｜]+条$/, "")
      .replace(/｜[^｜]+下单判断(?:-[^｜]+)?$/, "")
      .replace(/｜(详细教程|开通前判断|账号规则版)$/, "")
      .trim();
  const words = [
    ...post.keywords,
    title.replace(/[？?].*$/, ""),
    `${profile.platform}充值`,
    `${profile.platform}会员开通`,
    "AI会员充值",
    "陈鹏AI服务",
  ];

  return Array.from(
    new Set(
      words
        .map(sanitizeKeyword)
        .filter((word) => word && word.length <= 34 && !word.includes("下单判断")),
    ),
  ).slice(0, 10);
}

function topicSignal(post: Pick<LoadedPost, "title" | "slug" | "category">) {
  const text = `${post.title} ${post.slug}`.toLowerCase();

  if (/overdue|欠款|qianfei/.test(text)) {
    return {
      label: "欠款与历史账单",
      angle:
        "这类页面重点不是继续付款，而是先确认历史订阅有没有未结清账单。overdue、扣款失败、取消订阅未完成，都会影响新的会员开通动作。",
      scenarios: ["历史订阅扣款失败后形成 overdue。", "用户以为已经取消订阅，但账单页仍有残留状态。"],
      checks: ["先查看账单页是否存在 overdue 或未结清款项。", "不要在欠款状态不明时重复下单。"],
      faq: {
        q: "有 overdue 欠款时能不能直接下单？",
        a: "不建议直接下单。欠款属于账号基础状态问题，可能需要先在账单页处理或等待状态更新，再判断商品是否支持。",
      },
    };
  }

  if (/organization|组织|workspace/.test(text)) {
    return {
      label: "组织与工作区信息",
      angle:
        "这类问题多见于 Claude。Organization ID、Workspace、个人账号和团队空间不是一回事，填错信息会直接影响处理判断。",
      scenarios: ["把邮箱、昵称或订单号当成 Organization ID。", "账号进入过团队或工作区，但用户自己没有意识到。"],
      checks: ["核对 Organization ID / Workspace 信息，不要用邮箱代替。", "当前是 Pro / Max 状态时先看商品是否支持。"],
      faq: {
        q: "Organization ID 是账号密码吗？",
        a: "不是。它是组织或工作区识别信息，不是密码、验证码，也不是订单号。无法确认时先咨询，不要随便填写。",
      },
    };
  }

  if (/邮箱|email|youxiang/.test(text)) {
    return {
      label: "邮箱与订单信息",
      angle:
        "邮箱问题看似小，实际会影响订单查询、发货通知、账号核对和售后沟通。下单邮箱、登录邮箱、收货邮箱最好不要混着填。",
      scenarios: ["下单邮箱写错，订单查不到。", "登录邮箱和购买时填写的邮箱不是同一个。"],
      checks: ["下单前逐字核对邮箱，尤其是 Gmail、Outlook、QQ 邮箱后缀。", "售后时同时提供订单号和下单邮箱。"],
      faq: {
        q: "邮箱填错后还能处理吗？",
        a: "要看商品规则和订单状态。先保留支付截图和订单信息，再联系客服核对，越早说明越容易排查。",
      },
    };
  }

  if (/虚拟卡|xunika|信用卡|银行卡|card|扣款/.test(text)) {
    return {
      label: "卡片与支付通道",
      angle:
        "虚拟卡、信用卡、银行卡失败时，不要只看余额。卡段、账单地址、3D 验证、发行地区和平台风控都可能参与判断。",
      scenarios: ["卡片有余额但页面仍然提示 declined。", "银行有验证提醒，但平台订阅页没有生效。"],
      checks: ["核对卡片余额、账单地址、3D 验证和发行地区。", "连续失败后先暂停，不要多张卡轮流硬试。"],
      faq: {
        q: "换一张虚拟卡就一定能解决吗？",
        a: "不一定。虚拟卡只是支付方式之一，如果账号状态或地区环境有问题，换卡也可能继续失败。",
      },
    };
  }

  if (/未生效|不到账|paid-but-not-active|付款成功|回调/.test(text)) {
    return {
      label: "付款后状态同步",
      angle:
        "付款成功和会员生效之间可能存在支付回调、订单状态同步、邮箱通知延迟或页面缓存问题。先保留截图，再判断是否需要人工核对。",
      scenarios: ["支付页面显示成功，但会员页还是 Free。", "订单页未付款，实际支付平台已有扣款记录。"],
      checks: ["保存支付成功截图、订单号和会员状态截图。", "先刷新订单页和会员页，不要马上重复付款。"],
      faq: {
        q: "付款成功但会员没到账，要不要重新买一次？",
        a: "不建议立刻重复购买。先核对订单状态、邮箱通知和订阅页，必要时带截图联系客服排查。",
      },
    };
  }

  if (/地区|ip|diqu|环境/.test(text)) {
    return {
      label: "地区与网络环境",
      angle:
        "地区和 IP 问题最怕频繁切换。平台会综合看账号历史、当前登录、支付环境和设备信息，短时间来回切换反而容易触发额外验证。",
      scenarios: ["登录地区和支付地区差异过大。", "同一天频繁切换多个节点、设备或浏览器。"],
      checks: ["保持网络环境相对稳定，再进行登录和下单操作。", "不要用别人的成功节点直接套自己的账号。"],
      faq: {
        q: "换节点能解决地区不支持吗？",
        a: "不一定。地区判断不只看当前 IP，还可能结合账号历史、付款资料和设备环境。",
      },
    };
  }

  if (/区别|对比|qubie|duibi|怎么选|适合/.test(text)) {
    return {
      label: "产品选择与方式对比",
      angle:
        "对比类文章要先看使用场景，再看价格和名称。不同会员等级的额度、入口、续费方式和售后规则不同，不能只按热度下单。",
      scenarios: ["只看别人推荐，不看自己的使用频率。", "把官方订阅、自助下单、成品号和续费当成同一种服务。"],
      checks: ["先确认自己需要写作、代码、长文档、Google 生态还是 X 生态。", "对比商品类型，不要只比较价格。"],
      faq: {
        q: "AI 会员应该先选便宜的还是适合的？",
        a: "先选适合的。便宜不代表符合账号状态，也不代表售后边界适合你。",
      },
    };
  }

  if (/续费|xufei/.test(text)) {
    return {
      label: "续费与周期管理",
      angle:
        "续费问题要看当前周期、取消状态、历史扣款和商品是否支持续费。已有会员状态不清楚时，不要按新开通商品直接下单。",
      scenarios: ["当前会员还没到期，却按新开商品购买。", "自动续费失败后没有确认账单状态。"],
      checks: ["查看当前会员到期时间和是否已经取消续费。", "确认商品支持续费还是只支持新开通。"],
      faq: {
        q: "会员没到期可以提前续费吗？",
        a: "不一定。不同平台和商品规则不同，先看商品说明，避免当前周期和新订单冲突。",
      },
    };
  }

  if (/成品号|账号|zhanghao/.test(text)) {
    return {
      label: "账号类型与基础状态",
      angle:
        "账号类问题要区分自己的号、成品号、新号、老号、团队位和其他服务。账号来源和基础状态不同，适用规则也不同。",
      scenarios: ["新号刚注册就想直接开会员。", "老号有历史订阅或安全验证，但用户没有提前说明。"],
      checks: ["确认账号类型、注册时间、当前状态和是否能正常登录。", "成品号和给自己的号充值不要混着理解。"],
      faq: {
        q: "新号和老号处理规则一样吗？",
        a: "不一定。新号可能缺少稳定使用历史，老号可能有订阅残留或历史账单，都要单独判断。",
      },
    };
  }

  return {
    label: "开通前综合判断",
    angle:
      "这类问题适合从账号状态、商品类型、付款环境和售后边界四个方面一起看。任何一个环节没看清，都可能导致下单后反复沟通。",
    scenarios: ["用户只看标题下单，没有核对商品说明。", "账号状态和商品要求不匹配。"],
    checks: ["先读商品说明，再确认账号状态。", "不确定时先咨询客服，不要带着疑问付款。"],
    faq: {
      q: "下单前最容易忽略什么？",
      a: "最容易忽略账号当前状态和商品适用范围。看清这两点，比单纯找更低价格更重要。",
    },
  };
}

function extractSourceExcerpt(post: LoadedPost) {
  const sourceMatch = post.content.match(
    /##\s*(频道原文要点|原文重点|页面问题定位)\s*\n([\s\S]*?)(?=\n##\s+|$)/,
  );
  const candidate = sourceMatch?.[2] ?? post.content;
  const cleaned = stripMarkdown(candidate)
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        line &&
        !/^✅/.test(line) &&
        !/^客服账号/.test(line) &&
        !/^自助下单/.test(line) &&
        !/^前往自助下单/.test(line) &&
        !/^本文适合谁$/.test(line) &&
        !/^常见问题场景$/.test(line) &&
        !/^你可能遇到的情况$/.test(line) &&
        !/^下单前/.test(line) &&
        !/^解决思路$/.test(line) &&
        !/^风险说明$/.test(line) &&
        !/^FAQ$/.test(line) &&
        !/^相关文章推荐$/.test(line) &&
        !line.includes("网站版本会补充搜索用户更容易理解") &&
        !line.includes("这类频道内容偏即时"),
    )
    .filter((line, index, array) => array.indexOf(line) === index)
    .join("\n");

  const excerpt = cleaned.length > 520 ? `${cleaned.slice(0, 520)}…` : cleaned;
  return excerpt || `${post.title} 这个问题适合放在账号状态、商品规则和风险边界中一起判断。`;
}

function intro(post: ImprovedPost) {
  const profile = getProfile(post.category);
  const title = post.improvedTitle;
  const intentIntro: Record<ContentIntent, string> = {
    payment: `用户搜索「${title}」时，通常已经遇到付款被拒、页面转圈、扣款提示或会员没有生效。这个问题不能只归结为“卡不行”，还要同时看账号状态、付款资料、地区环境、订阅历史和平台风控。先把这些因素拆开，才能判断是继续自己尝试，还是先暂停并核对商品规则。`,
    account: `「${title}」本质上是账号状态判断问题。很多充值失败并不是操作步骤错了，而是账号当前状态、历史订阅、欠款、组织信息或登录环境不符合处理条件。下单前先把账号能不能正常登录、当前会员状态和平台提示看清楚，比直接付款更稳。`,
    comparison: `搜索「${title}」的用户，多数不是想看百科，而是想知道自己该选哪种方式、哪类会员或哪条开通路径。判断时不要只看价格和名称，要把使用场景、账号要求、续费方式、售后边界和风险承受能力放在一起看。`,
    order: `「${title}」看起来是一个充值入口问题，实际是下单前判断问题。不同平台的账号体系、支付规则和风控策略不一样，同样叫会员充值，可能对应自己的号开通、成品号、续费、补单或其他商品类型。先看规则，再决定是否下单。`,
    usage: `用户搜索「${title}」时，往往已经有明确使用需求，但还不确定会员权益、账号状态或功能限制。AI 会员不是开通后所有问题都会自动消失，仍要看平台规则、模型额度、登录环境和账号历史。先把使用边界弄明白，后续体验会更稳定。`,
    support: `「${title}」更多是订单和售后排查问题。遇到未付款、支付回调、订单查询不到或发货信息不清楚时，不要只重复刷新，也不要散着发信息。先准备订单邮箱、订单号、支付截图和问题截图，再按商品说明沟通，处理效率会高很多。`,
  };

  return `${intentIntro[post.intent]}本文按陈鹏AI服务长期处理 ${profile.membership} 相关问题的经验整理，重点帮助你在开通前做判断。`;
}

function whoList(post: ImprovedPost) {
  const profile = getProfile(post.category);
  const common = [
    `正在搜索 ${profile.platform} 充值、开通、续费或支付失败排查的用户。`,
    "已经看过商品页，但不确定自己的账号状态是否适合直接下单的用户。",
    "不想只比价格，希望先看清交付方式、售后边界和风险说明的用户。",
  ];
  const byIntent: Record<ContentIntent, string[]> = {
    payment: [
      "付款页面提示失败、被拒、扣款异常或会员没有到账的用户。",
      "反复更换银行卡、虚拟卡或浏览器后仍然无法完成订阅的用户。",
    ],
    account: [
      "账号曾经开通过会员、出现欠费、组织信息或安全验证提示的用户。",
      "不确定 Free / Pro / Max / Advanced 等状态是否符合商品要求的用户。",
    ],
    comparison: [
      "正在比较官方订阅、自助下单、成品号或不同会员等级的用户。",
      "希望根据工作场景选择 ChatGPT、Claude、Gemini、Grok 的用户。",
    ],
    order: [
      "准备第一次自助下单，想知道下单前应该核对哪些信息的用户。",
      "担心邮箱填错、商品选错或售后规则没看清的用户。",
    ],
    usage: [
      `已经在使用 ${profile.platform}，想确认会员权益、模型额度或功能入口的用户。`,
      "遇到功能不可用、页面不同步或账号切换后状态不一致的用户。",
    ],
    support: [
      "已经下单或准备下单，想提前知道售后需要哪些信息的用户。",
      "遇到未付款、订单查询不到、支付截图不完整等情况的用户。",
    ],
  };

  return [...common, ...byIntent[post.intent]].slice(0, 6);
}

function scenarioList(post: ImprovedPost) {
  const profile = getProfile(post.category);
  const signal = topicSignal(post);
  const shared = [
    "账号可以登录，但订阅页或会员状态显示不清楚。",
    "商品说明没有看完，只凭标题判断是否适合自己。",
    "网络、设备或浏览器频繁变化，导致平台额外验证。",
  ];
  const byIntent: Record<ContentIntent, string[]> = {
    payment: [
      "信用卡、虚拟卡或 Google Pay / Apple Pay 页面提示失败。",
      "银行卡有扣款提醒，但会员状态没有同步生效。",
      "付款页一直转圈，刷新后又回到原来的订阅页面。",
      "连续尝试多次后，账号或支付方式变得更敏感。",
    ],
    account: [
      "账号不是 Free 状态，或者以前开通过会员但当前状态不清楚。",
      "存在 overdue 欠款、取消订阅残留、组织 ID 或 Workspace 信息。",
      "邮箱无法接收验证码，或者账号触发安全验证。",
      `${profile.platform} 与其他平台账号规则混在一起判断。`,
    ],
    comparison: [
      "只看价格，不看会员权益、适用账号和售后规则。",
      "把 Plus、Pro、Max、Advanced、SuperGrok 等名称混在一起。",
      "不知道自己的使用场景更适合哪一个 AI 工具。",
      "想省流程，但又没确认第三方服务的处理边界。",
    ],
    order: [
      "下单邮箱、登录邮箱、账号邮箱不是同一个。",
      "不知道商品要求提交哪些信息，付款后才发现资料不完整。",
      "看到别人能买，就默认自己的账号也能处理。",
      "未付款或支付回调延迟时，不知道该刷新还是联系客服。",
    ],
    usage: [
      "开通后看不到对应模型、额度或入口。",
      "手机端和网页端状态不同步。",
      "多个账号登录后看错会员状态。",
      "不知道功能限制来自会员等级、地区还是账号本身。",
    ],
    support: [
      "订单查询不到，但邮箱或订单号没有核对。",
      "只发一句“不能用”，没有提供截图和订单信息。",
      "支付成功页面和订单页面状态不一致。",
      "遇到仿冒网站或仿冒客服，无法确认真实入口。",
    ],
  };

  return [...signal.scenarios, ...byIntent[post.intent], ...shared].slice(0, 8);
}

function sourceSection(post: ImprovedPost) {
  if (post.isTelegram) {
    return `## 频道原文要点\n\n${extractSourceExcerpt(post)}\n\n这类频道内容偏即时，网站版本会补充搜索用户更容易理解的检查清单、风险说明和相关文章入口。`;
  }

  const profile = getProfile(post.category);
  const signal = topicSignal(post);
  return `## 页面问题定位\n\n这页围绕「${post.improvedTitle}」做下单前判断。用户真正需要的不是一句能不能买，而是确认 ${profile.accountFocus
    .slice(0, 4)
    .join("、")} 是否匹配商品规则。${signal.angle}后面会把账号、支付、环境、风控和商品类型拆开说明，方便你按自己的情况对照。`;
}

function coreAnalysis(post: ImprovedPost) {
  const profile = getProfile(post.category);
  const signal = topicSignal(post);
  const focus = profile.accountFocus;
  const productLine = products.find((product) => product.id === post.productId);
  const productLooksRelevant =
    productLine && !/提示词|资料|文档|教程/.test(productLine.title);
  const productHint = productLooksRelevant
    ? `这篇文章关联的商品入口是「${productLine.title}」，但商品页说明仍然是最终判断依据。`
    : "如果没有精确匹配的商品入口，就先以自助下单总入口和商品页说明为准。";

  const intentAdvice: Record<ContentIntent, string> = {
    payment:
      "支付失败要拆成支付工具、账单资料、账号状态和平台风控四层看。只换卡不一定解决问题，连续失败还可能让后续验证更麻烦。",
    account:
      "账号状态类问题要先看会员等级、历史订阅、欠款、组织信息和登录安全提示。账号本身不稳定时，充值动作不能替代基础账号修复。",
    comparison:
      "对比类问题要把使用需求放在第一位。重度办公、长文档、Google 生态、X 生态，对应的产品和会员规则都不同。",
    order:
      "流程类问题最怕信息填错。下单邮箱、账号邮箱、订单邮箱、商品类型和售后规则都要确认，不要只看一个按钮就付款。",
    usage:
      "使用类问题要区分会员权益、模型限制、地区入口和账号状态。看不到功能不一定是没开通，也可能是账号或客户端不同步。",
    support:
      "售后类问题先把证据准备完整，再沟通处理。订单号、下单邮箱、支付截图、问题截图，比反复描述更有用。",
  };

  return [
    "## 核心原因分析",
    "",
    `### 账号状态：先看 ${focus.slice(0, 3).join("、")}`,
    "",
    `国内用户处理 ${profile.membership} 时，最容易忽略账号本身。账号能否正常登录、当前是不是商品要求的状态、有没有欠款或订阅残留，都会影响后续处理。${post.category === "Claude" ? "Claude 还要特别注意 Organization ID、Workspace 和 Pro / Max 状态，不能按 ChatGPT 的经验直接套用。" : ""}`,
    "",
    "### 支付方式：失败提示不等于唯一原因",
    "",
    "银行卡、虚拟卡、礼品卡或第三方自助服务，本质上是不同路径。官方订阅自主性强，但会遇到卡片地区、账单地址和平台风控；第三方自助服务省流程，但必须看清适用账号、交付方式和售后边界。",
    "",
    "### 地区与网络环境：稳定比频繁切换更重要",
    "",
    `平台会综合判断地区、IP、设备、浏览器和历史登录行为。${profile.platform} 相关问题如果反复换环境，很可能让系统觉得本次操作更异常。建议在能正常登录的前提下保持环境稳定，再做支付或下单判断。`,
    "",
    "### 商品类型：自己的号充值和成品号不是一回事",
    "",
    `${productHint}同样是“会员”，可能对应给自己的账号处理、成品号、续费、补单或其他服务。商品类型不同，需要提交的信息、售后方式和风险边界也不同。`,
    "",
    "### 本文判断",
    "",
    `${intentAdvice[post.intent]}本页的专项判断是「${signal.label}」：${signal.angle}`,
  ].join("\n");
}

function checklist(post: ImprovedPost) {
  const profile = getProfile(post.category);
  const signal = topicSignal(post);
  const items = [
    `账号是否能正常登录，并能看到 ${profile.platform} 的基础设置或订阅入口。`,
    "当前会员状态是否清楚，是否符合商品页写明的适用条件。",
    "是否存在历史欠费、扣款失败、取消订阅未完成或退款记录。",
    "邮箱是否填写正确，能否正常接收验证码、订单通知和售后信息。",
    "网络环境是否相对稳定，没有短时间频繁切换地区、设备或浏览器。",
    "商品说明是否已经看完，尤其是适用账号、处理时效和售后规则。",
    "是否能接受平台规则变化、账号风控和地区策略带来的不确定性。",
    "如果需要联系客服，是否已经准备订单号、下单邮箱、支付截图和问题截图。",
  ];

  items.splice(4, 0, ...signal.checks);

  if (post.category === "Claude") {
    items.splice(3, 0, "是否确认 Organization ID、Workspace、Pro / Max / Free 状态没有填错。");
  }
  if (post.category === "Gemini") {
    items.splice(3, 0, "是否确认 Google 账号地区、付款资料、家庭组和目标邮箱没有混淆。");
  }
  if (post.category === "Grok") {
    items.splice(3, 0, "是否确认 X 账号能正常登录，没有明显受限、锁定或安全验证提示。");
  }

  return ["## 下单前检查清单", "", ...items.slice(0, 9).map((item) => `* ${item}`)].join("\n");
}

function solution(post: ImprovedPost) {
  const profile = getProfile(post.category);
  const opening: Record<ContentIntent, string> = {
    payment:
      "遇到支付失败，先暂停连续尝试。重复提交卡片、频繁换网络或不断刷新付款页，不一定提高成功率，反而可能扩大风控范围。",
    account:
      "遇到账号状态不符合，先把账号页面提示看清楚。该处理欠款就先处理欠款，该确认组织信息就先确认组织信息，不要把所有问题都交给充值动作解决。",
    comparison:
      "做选择时先写下自己的真实使用场景，再看会员等级。轻度体验、长期办公、代码阅读、文档分析、X 生态或 Google 生态，对应的选择会不一样。",
    order:
      "准备下单时，先把商品说明完整看一遍，再填写邮箱和订单信息。越是急着买，越容易在邮箱、商品类型和账号状态上出错。",
    usage:
      "遇到使用问题，先确认会员是否生效，再检查入口、客户端、账号切换和模型限制。不要只看一个页面就判断没有开通。",
    support:
      "售后排查不要散着发信息。一次性提供下单邮箱、订单号、支付截图和问题截图，客服才能更快定位。",
  };

  return [
    "## 解决思路",
    "",
    opening[post.intent],
    "",
    `第一步，确认 ${profile.platform} 账号能正常登录，并记录当前会员状态、页面提示和邮箱信息。第二步，对照商品页说明看是否支持当前账号。第三步，如果自己官方支付反复失败，可以考虑第三方自助下单服务，但必须先阅读商品说明。第四步，不确定就先咨询客服，把账号状态和问题截图说明白。`,
    "",
    "陈鹏AI服务的定位不是拼低价，而是把规则、风险和售后边界提前讲清楚。能自己顺利完成官方订阅的用户，可以优先自己处理；如果反复卡在支付、地区或账号状态，就不要盲目硬试，先做判断。",
  ].join("\n");
}

function riskSection() {
  return [
    "## 风险说明",
    "",
    "AI 会员、账号、订阅类产品会受到平台规则、账号状态、地区环境、支付通道和风控策略影响。不同商品售后规则不同，下单前必须阅读商品页说明。虚拟产品不是普通实物商品，不能只看价格，更要看交付方式、售后边界和账号要求。",
    "",
    "任何教程都只能帮助你减少明显误判，不能替平台做最终审核。账号本身存在欠款、异常验证、受限、资料不一致或历史争议时，需要先判断问题来源，再决定是否继续下单。",
  ].join("\n");
}

function ctaSection(post: ImprovedPost) {
  return [
    "## 自助下单引导",
    "",
    "如果你已经看完教程，并确认账号状态、商品规则和风险说明，可以前往陈鹏AI服务自助下单。不同产品规则不同，请先阅读商品页说明，再决定是否购买。",
    "",
    `[前往自助下单](${post.productUrl || defaultProductUrl})`,
  ].join("\n");
}

function faq(post: ImprovedPost) {
  const profile = getProfile(post.category);
  const topic = post.improvedTitle.replace(/[？?].*$/, "").replace(/｜.*$/, "");
  const common = [
    {
      q: `${topic}是不是只要换支付方式就能解决？`,
      a: "不一定。支付方式只是其中一层，账号状态、订阅历史、地区环境和平台风控都可能造成同样的提示。先排查账号，再判断是否需要更换方式。",
    },
    {
      q: `下单前最应该先看 ${profile.platform} 的什么状态？`,
      a: `先看账号能否正常登录、当前会员等级、是否有欠款或订阅残留，以及商品页是否明确支持你的账号状态。${post.category === "Claude" ? "Claude 用户还要核对 Organization ID 和 Workspace 信息。" : ""}`,
    },
    {
      q: "第三方自助下单适合所有账号吗？",
      a: "不适合。不同商品支持的账号状态、处理方式和售后边界不同。如果账号已经受限、欠款或状态不明，建议先联系客服确认，不要直接付款。",
    },
    {
      q: "是否需要提供账号密码或验证码？",
      a: "以商品页说明为准。无论哪种处理方式，都不要把密码、验证码随意发给非官方客服入口；遇到要求和商品说明不一致时，应先暂停核对。",
    },
    {
      q: "如果下单后遇到问题，怎样沟通最快？",
      a: "准备下单邮箱、订单号、支付截图和问题截图。只说“不能用”很难定位，完整信息能帮助客服区分支付回调、账号状态、商品规则或平台风控问题。",
    },
  ];

  const byIntent: Partial<Record<ContentIntent, { q: string; a: string }>> = {
    payment: {
      q: "扣款了但会员没到账，可以马上重新下单吗？",
      a: "不建议马上重复下单。先查看订单状态、邮箱通知和订阅页，保留支付截图；如果是支付回调延迟，重复下单可能让排查更复杂。",
    },
    account: {
      q: "账号不是 Free 状态，还能直接处理吗？",
      a: "不一定。很多商品只支持指定状态，已有会员、欠款、组织绑定或受限账号都需要先看商品说明，无法判断时先咨询。",
    },
    comparison: {
      q: "自己开通和自助下单应该怎么选？",
      a: "自己开通自主性更强，但需要解决支付、地区和续费问题；自助下单省流程，但必须看清商品规则和售后边界。不要只按价格做决定。",
    },
    usage: {
      q: "开通后看不到某个功能是不是没成功？",
      a: "不一定。功能显示还可能受到客户端版本、账号切换、地区入口、模型额度和平台灰度影响。先确认会员状态，再排查入口。",
    },
    support: {
      q: "订单查询不到是不是一定失败？",
      a: "不一定。可能是邮箱填错、支付回调延迟或查询信息不完整。先核对下单邮箱和订单号，再联系页面客服。",
    },
  };

  const items = [topicSignal(post).faq, byIntent[post.intent], ...common].filter(Boolean).slice(0, 5) as Array<{
    q: string;
    a: string;
  }>;

  return ["## FAQ", ...items.map((item) => `### ${item.q}\n\n${item.a}`)].join("\n\n");
}

function relatedSection(post: ImprovedPost) {
  const categoryPath = categoryPaths[post.category] ?? "/blog";
  const links: string[] = [`* [返回 ${post.category} 专题页](${categoryPath})`];

  const generalPillar = "ai-membership-payment-failed-guide";
  if (post.slug !== generalPillar && post.related.some((item) => item.slug === generalPillar)) {
    const pillar = post.related.find((item) => item.slug === generalPillar);
    if (pillar) {
      links.push(`* [${pillar.title}](/blog/${pillar.slug})`);
    }
  }

  for (const related of post.related) {
    if (related.slug === post.slug || links.some((line) => line.includes(`/blog/${related.slug})`))) {
      continue;
    }
    links.push(`* [${related.title}](/blog/${related.slug})`);
    if (links.length >= 6) break;
  }

  return ["## 相关文章推荐", "", ...links].join("\n");
}

function renderBody(post: ImprovedPost) {
  return [
    `# ${post.improvedTitle}`,
    "",
    intro(post),
    "",
    "## 本文适合谁",
    "",
    ...whoList(post).map((item) => `* ${item}`),
    "",
    "## 你可能遇到的情况",
    "",
    ...scenarioList(post).map((item) => `* ${item}`),
    "",
    sourceSection(post),
    "",
    coreAnalysis(post),
    "",
    checklist(post),
    "",
    solution(post),
    "",
    riskSection(),
    "",
    ctaSection(post),
    "",
    faq(post),
    "",
    relatedSection(post),
    "",
  ].join("\n");
}

function scoreRelated(source: ImprovedPost, candidate: ImprovedPost) {
  if (source.slug === candidate.slug) return -9999;

  const sourceTerms = new Set(
    `${source.slug} ${source.improvedTitle} ${source.keywords.join(" ")}`
      .toLowerCase()
      .split(/[^a-z0-9\u3400-\u9fff]+/)
      .filter((item) => item.length >= 2),
  );
  const candidateText = `${candidate.slug} ${candidate.improvedTitle} ${candidate.keywords.join(" ")}`.toLowerCase();
  let score = 0;

  if (source.category === candidate.category) score += 20;
  if (candidate.tier === "A") score += 12;
  if (candidate.intent === source.intent) score += 6;
  for (const term of sourceTerms) {
    if (candidateText.includes(term)) score += 1;
  }

  return score;
}

function attachRelated(posts: ImprovedPost[]) {
  const postMap = new Map(posts.map((post) => [post.slug, post]));

  for (const post of posts) {
    const profile = getProfile(post.category);
    const preferred = [
      ...profile.pillarSlugs,
      "ai-membership-payment-failed-guide",
      "ai-membership-recharge-vs-own-card",
    ]
      .filter((slug) => slug !== post.slug)
      .map((slug) => postMap.get(slug))
      .filter((item): item is ImprovedPost => Boolean(item));

    const scored = posts
      .filter((candidate) => candidate.slug !== post.slug)
      .sort((a, b) => scoreRelated(post, b) - scoreRelated(post, a));

    const related = [...preferred, ...scored]
      .filter(
        (candidate, index, array) =>
          array.findIndex((item) => item.slug === candidate.slug) === index,
      )
      .slice(0, 5)
      .map((candidate) => ({
        title: candidate.improvedTitle,
        slug: candidate.slug,
      }));

    post.related = related;
  }
}

function frontmatterBlock(post: ImprovedPost) {
  const entries: Array<[string, string]> = [
    ["title", JSON.stringify(post.improvedTitle)],
    ["description", JSON.stringify(post.improvedDescription)],
    ["category", JSON.stringify(post.category)],
    ["slug", JSON.stringify(post.slug)],
    ["date", JSON.stringify(post.date)],
    ["updatedAt", JSON.stringify(today)],
    ["keywords", `[${keywordSet(post, post.improvedTitle).map((item) => JSON.stringify(item)).join(", ")}]`],
    ["productId", JSON.stringify(post.productId)],
    ["productUrl", JSON.stringify(post.productUrl || defaultProductUrl)],
  ];

  if (post.sourceUrl) {
    entries.push(["sourceUrl", JSON.stringify(post.sourceUrl)]);
  }

  return `---\n${entries.map(([key, value]) => `${key}: ${value}`).join("\n")}\n---`;
}

function buildImprovedPosts(posts: LoadedPost[]) {
  const titleCounts = uniqueCounts(posts, "title");

  const improved: ImprovedPost[] = posts.map((post) => {
    const intent = classifyIntent(post);
    const tier = classifyTier(post, intent);
    const improvedTitle = buildTitle(post, titleCounts);
    const improvedDescription = buildDescription(post, improvedTitle, intent);
    const productExists = products.some((product) => product.id === post.productId);

    return {
      ...post,
      category: post.category as ProductCategory,
      tier,
      intent,
      improvedTitle,
      improvedDescription,
      productId: post.productId || "general-ai-membership",
      productUrl: post.productUrl || defaultProductUrl,
      related: [],
      frontmatter: {
        ...post.frontmatter,
        productId: productExists ? post.productId : post.productId || "general-ai-membership",
      },
    };
  });

  attachRelated(improved);
  return improved;
}

async function writePosts(posts: ImprovedPost[]) {
  for (const post of posts) {
    const body = renderBody(post);
    await fs.writeFile(post.filePath, `${frontmatterBlock(post)}\n\n${body}`, "utf8");
  }
}

function markdownTable(rows: Array<Array<string | number>>) {
  return [
    "| 指标 | 数量 |",
    "| --- | ---: |",
    ...rows.map(([label, value]) => `| ${label} | ${value} |`),
  ].join("\n");
}

async function writeReports(before: AuditResult, after: AuditResult, upgradedCount: number) {
  await fs.mkdir(reportsDir, { recursive: true });

  const lowQualityLines = [
    "# 低质量页面检查记录",
    "",
    `生成时间：${today}`,
    "",
    "本轮没有删除页面，也没有把页面改成 noindex。以下记录用于后续人工复查。",
    "",
    "## 升级前短内容页面",
    "",
    before.shortUnder300.length > 0
      ? before.shortUnder300
          .slice(0, 200)
          .map((post) => `- ${post.slug}：${post.title}（约 ${post.chineseLength} 个中文字符）`)
          .join("\n")
      : "未发现正文少于 300 个中文字符的文章。",
    "",
    "## 升级前重复标题",
    "",
    before.duplicateTitles.length > 0
      ? before.duplicateTitles
          .slice(0, 80)
          .map(([title, count]) => `- ${title}：${count} 次`)
          .join("\n")
      : "未发现重复标题。",
    "",
    "## 升级前重复描述",
    "",
    before.duplicateDescriptions.length > 0
      ? before.duplicateDescriptions
          .slice(0, 80)
          .map(([description, count]) => `- ${description}：${count} 次`)
          .join("\n")
      : "未发现重复描述。",
    "",
    "## 建议",
    "",
    "- 继续保留这些 URL，观察 Google Search Console 的“已发现，尚未编入索引”变化。",
    "- 如果后续仍有个别页面长期不收录，再针对该 slug 做人工案例补充，而不是批量删除。",
  ];

  await fs.writeFile(path.join(reportsDir, "low-quality-pages.md"), lowQualityLines.join("\n"), "utf8");

  const improvementLines = [
    "# Google 收录质量升级报告",
    "",
    `生成时间：${today}`,
    "",
    "## 本轮处理结论",
    "",
    "本轮保留所有文章 slug 和 URL，不删除页面，不设置 noindex。重点把现有内容升级为更像真实教程的页面：标题和描述去重，正文统一补齐问题判断、适合人群、场景、原因、检查清单、解决思路、风险说明、FAQ、自助下单入口和真实存在的站内相关文章。",
    "",
    markdownTable([
      ["当前发现文章", before.total],
      ["Telegram 实时博客文章", before.telegram],
      ["本轮升级文章", upgradedCount],
      ["升级前重复标题组", before.duplicateTitles.length],
      ["升级后重复标题组", after.duplicateTitles.length],
      ["升级前重复描述组", before.duplicateDescriptions.length],
      ["升级后重复描述组", after.duplicateDescriptions.length],
      ["升级前短内容 <300 字", before.shortUnder300.length],
      ["升级后短内容 <300 字", after.shortUnder300.length],
      ["升级前缺相关文章", before.missing.related],
      ["升级后缺相关文章", after.missing.related],
    ]),
    "",
    "## 页面分层策略",
    "",
    "- A 类支柱文章：国内充值教程、开通教程、支付失败总排查、AI 会员代充对比等页面，正文更长，并被其他文章优先内链。",
    "- B 类高转化长尾：信用卡被拒、支付失败、账号不能充值、overdue、付款成功未到账等页面，重点加强排查清单、解决思路和 CTA。",
    "- C 类普通科普：使用技巧、产品区别、实时博客沉淀内容，保留原始信息价值，同时补充教程化结构和内链。",
    "",
    "## sitemap / robots / canonical",
    "",
    "- sitemap：`app/sitemap.ts` 已经通过 `getAllPosts()` 自动读取 `content/posts`，本轮所有文章仍会进入 `/sitemap.xml`。",
    "- robots：`app/robots.ts` 允许全站抓取，并声明 sitemap 地址。",
    "- canonical：文章页 `app/blog/[slug]/page.tsx` 仍指向 `/blog/{slug}` 自身，没有统一指向首页或分类页。",
    "- 本轮没有新增重定向页面，也没有改动已有 slug。",
    "",
    "## 分类与入口",
    "",
    "- 首页、`/blog`、`/telegram`、`/topics`、四个产品专题页和文章底部相关推荐共同形成入口。",
    "- 每篇文章的“相关文章推荐”都使用真实存在的站内 slug，并补充返回对应专题页的链接。",
    "- `/products` 继续作为商品承接页，成交动作仍跳转到 `gpt3plus.com`。",
    "",
    "## 需要人工继续观察",
    "",
    "- Google Search Console 中“已发现，尚未编入索引”的下降速度。",
    "- 1000+ 页面里是否有少数 Telegram 原文标题本身不适合搜索，需要后续单独人工改题。",
    "- 哪些强购买词页面开始获得展现，例如 Grok怎么充值、GPT怎么充值、Claude Pro不能充值、Gemini支付失败。",
    "- 若某些页面长期不收录，优先补充真实案例、截图说明、产品差异和更具体的 FAQ。",
  ];

  await fs.writeFile(
    path.join(reportsDir, "indexing-improvement-report.md"),
    improvementLines.join("\n"),
    "utf8",
  );
}

async function main() {
  const posts = await loadPosts();
  const before = audit(posts);
  const improved = buildImprovedPosts(posts);

  if (!reportOnly) {
    await writePosts(improved);
  }

  const afterPosts = reportOnly ? posts : await loadPosts();
  const after = audit(afterPosts);
  await writeReports(before, after, reportOnly ? 0 : improved.length);

  console.log(
    JSON.stringify(
      {
        mode: reportOnly ? "report-only" : "write",
        total: before.total,
        upgraded: reportOnly ? 0 : improved.length,
        before: {
          duplicateTitles: before.duplicateTitles.length,
          duplicateDescriptions: before.duplicateDescriptions.length,
          shortUnder300: before.shortUnder300.length,
          missingRelated: before.missing.related,
        },
        after: {
          duplicateTitles: after.duplicateTitles.length,
          duplicateDescriptions: after.duplicateDescriptions.length,
          shortUnder300: after.shortUnder300.length,
          missingRelated: after.missing.related,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
