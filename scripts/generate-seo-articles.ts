import fs from "node:fs/promises";
import path from "node:path";
import { products, type Product, type ProductCategory } from "../content/products";

type CoreCategory = "ChatGPT" | "Claude" | "Gemini" | "Grok";

type ArticleType =
  | "充值教程"
  | "支付失败"
  | "区别科普"
  | "账号风控"
  | "下单检查"
  | "使用技巧";

type TopicSeed = {
  title: string;
  slug: string;
  category: CoreCategory;
  keywords: string[];
  searchIntent: string;
  articleType: ArticleType;
  scenario: string;
};

type ArticleTopic = TopicSeed & {
  productId: string;
  ctaProductUrl: string;
};

type CategoryProfile = {
  category: CoreCategory;
  slugPrefix: string;
  productName: string;
  subjects: Array<{ label: string; slug: string; keyword: string }>;
  special: Array<[string, string, string, ArticleType, string]>;
  strengths: string[];
  accountFocus: string[];
};

type Pattern = {
  label: string;
  slug: string;
  keyword: string;
  articleType: ArticleType;
  intent: string;
};

const rootDir = process.cwd();
const postsDir = path.join(rootDir, "content/posts");
const topicsPath = path.join(rootDir, "content/articleTopics.ts");
const publishDate = "2026-05-28";

const fallbackProduct: Product = {
  id: "general-ai-membership",
  title: "AI 会员自助下单总入口",
  category: "Other",
  platform: "GPT Plus App",
  description: "进入陈鹏AI服务自助下单站，先阅读商品说明，再确认是否购买。",
  originalUrl: "https://gpt3plus.com/",
  orderUrl: "https://gpt3plus.com/",
  keywords: ["AI会员充值", "自助下单"],
  tags: ["总入口"],
  notices: ["先阅读商品说明"],
  suitableFor: ["需要先浏览商品分类的用户"],
  riskNotes: ["虚拟产品受账号状态和平台规则影响"],
  updatedAt: publishDate,
};

const profiles: CategoryProfile[] = [
  {
    category: "ChatGPT",
    slugPrefix: "chatgpt",
    productName: "ChatGPT",
    subjects: [
      { label: "ChatGPT Plus", slug: "chatgpt-plus", keyword: "ChatGPT Plus" },
      { label: "GPT Plus", slug: "gpt-plus", keyword: "GPT Plus" },
      { label: "ChatGPT Pro", slug: "chatgpt-pro", keyword: "ChatGPT Pro" },
      { label: "ChatGPT 账号", slug: "chatgpt-zhanghao", keyword: "ChatGPT账号" },
      { label: "GPT 会员", slug: "gpt-huiyuan", keyword: "GPT会员" },
    ],
    strengths: ["通用问答", "写作办公", "代码辅助", "文件分析", "多模态使用"],
    accountFocus: ["Free / Plus / Pro 状态", "overdue 欠款", "邮箱登录方式", "支付环境", "账号风控"],
    special: [
      ["ChatGPT Plus 国内充值教程", "chatgpt-plus-guonei-chongzhi", "ChatGPT Plus充值", "充值教程", "国内用户下单前判断"],
      ["GPT怎么充值比较稳", "gpt-zenme-chongzhi", "GPT怎么充值", "充值教程", "强购买意图"],
      ["Plus怎么充不会反复踩坑", "plus-zenme-chong", "Plus怎么充", "下单检查", "下单前检查"],
      ["ChatGPT Plus和Pro有什么区别", "chatgpt-plus-pro-qubie", "ChatGPT Plus Pro区别", "区别科普", "会员选择"],
      ["ChatGPT Plus支付失败怎么办", "chatgpt-plus-zhifu-shibai", "ChatGPT Plus支付失败", "支付失败", "失败排查"],
      ["ChatGPT账号风控风险有哪些", "chatgpt-zhanghao-fengkong-risk", "ChatGPT账号风控", "账号风控", "账号状态"],
    ],
  },
  {
    category: "Claude",
    slugPrefix: "claude",
    productName: "Claude",
    subjects: [
      { label: "Claude Pro", slug: "claude-pro", keyword: "Claude Pro" },
      { label: "Claude Max", slug: "claude-max", keyword: "Claude Max" },
      { label: "Claude 账号", slug: "claude-zhanghao", keyword: "Claude账号" },
      { label: "Claude 会员", slug: "claude-huiyuan", keyword: "Claude会员" },
      { label: "Claude 组织 ID", slug: "claude-organization-id", keyword: "Claude组织ID" },
    ],
    strengths: ["长文档处理", "写作润色", "代码阅读", "研究总结", "长上下文分析"],
    accountFocus: ["Free / Pro / Max 状态", "Organization ID", "overdue 欠款", "工作区信息", "账号地区"],
    special: [
      ["Claude Pro 充值前注意事项", "claude-pro-chongzhi-zhuyi", "Claude Pro充值", "下单检查", "充值前判断"],
      ["Claude Pro 组织 ID 是什么", "claude-pro-organization-id", "Claude组织ID", "账号风控", "组织信息"],
      ["Claude Pro和Max有什么区别", "claude-pro-max-qubie", "Claude Pro Max区别", "区别科普", "会员选择"],
      ["Claude当前是Pro还能下单吗", "claude-pro-yijing-kaitong-xiadan", "Claude Pro下单", "下单检查", "已有会员"],
      ["Claude overdue欠款怎么处理", "claude-overdue-qianfei-chuli", "Claude overdue", "账号风控", "账单问题"],
      ["Claude支付失败常见原因", "claude-zhifu-shibai-yuanyin", "Claude支付失败", "支付失败", "失败排查"],
    ],
  },
  {
    category: "Gemini",
    slugPrefix: "gemini",
    productName: "Gemini",
    subjects: [
      { label: "Gemini Pro", slug: "gemini-pro", keyword: "Gemini Pro" },
      { label: "Gemini Advanced", slug: "gemini-advanced", keyword: "Gemini Advanced" },
      { label: "Gemini 账号", slug: "gemini-zhanghao", keyword: "Gemini账号" },
      { label: "Google AI 会员", slug: "google-ai-huiyuan", keyword: "Google AI会员" },
      { label: "Gemini 国内使用", slug: "gemini-guonei-shiyong", keyword: "Gemini国内使用" },
    ],
    strengths: ["Google 生态", "多模态处理", "文档协作", "搜索增强", "手机端联动"],
    accountFocus: ["Google 账号地区", "付款资料", "家庭组", "工作邮箱", "多账号登录"],
    special: [
      ["Gemini Pro 国内使用教程", "gemini-pro-guonei-shiyong", "Gemini Pro国内使用", "使用技巧", "国内使用"],
      ["Gemini Advanced开通注意事项", "gemini-advanced-kaitong-zhuyi", "Gemini Advanced开通", "下单检查", "开通前判断"],
      ["Gemini Pro支付失败怎么办", "gemini-pro-zhifu-shibai", "Gemini支付失败", "支付失败", "失败排查"],
      ["Gemini Google账号地区怎么影响开通", "gemini-google-diqu-yingxiang", "Gemini账号地区", "账号风控", "账号地区"],
      ["Gemini多账号登录容易踩哪些坑", "gemini-duozhanghao-denglu", "Gemini多账号", "下单检查", "多账号误判"],
      ["Gemini Pro和Advanced有什么区别", "gemini-pro-advanced-qubie", "Gemini Pro Advanced区别", "区别科普", "会员选择"],
    ],
  },
  {
    category: "Grok",
    slugPrefix: "grok",
    productName: "Grok",
    subjects: [
      { label: "Grok", slug: "grok", keyword: "Grok" },
      { label: "Grok 会员", slug: "grok-huiyuan", keyword: "Grok会员" },
      { label: "SuperGrok", slug: "supergrok", keyword: "SuperGrok" },
      { label: "X Premium", slug: "x-premium", keyword: "X Premium" },
      { label: "X 账号", slug: "x-zhanghao", keyword: "X账号" },
    ],
    strengths: ["X 生态", "实时内容理解", "热点信息", "xAI 模型体验", "社交内容辅助"],
    accountFocus: ["X 账号状态", "Grok / SuperGrok 权益", "地区与 IP", "邮箱和昵称", "账号受限"],
    special: [
      ["Grok会员开通教程", "grok-huiyuan-kaitong", "Grok会员开通", "充值教程", "开通教程"],
      ["Grok怎么充值", "grok-zenme-chongzhi", "Grok怎么充值", "充值教程", "强购买意图"],
      ["Grok和SuperGrok有什么区别", "grok-supergrok-qubie", "Grok SuperGrok区别", "区别科普", "会员选择"],
      ["Grok国内开通前需要准备什么", "grok-guonei-kaitong-zhunbei", "Grok国内开通", "下单检查", "开通前准备"],
      ["Grok X账号状态怎么检查", "grok-x-zhanghao-zhuangtai", "Grok X账号", "账号风控", "账号状态"],
      ["Grok支付失败常见原因", "grok-zhifu-shibai", "Grok支付失败", "支付失败", "失败排查"],
    ],
  },
];

const patterns: Pattern[] = [
  { label: "怎么充值", slug: "zenme-chongzhi", keyword: "怎么充值", articleType: "充值教程", intent: "强购买意图" },
  { label: "国内充值教程", slug: "guonei-chongzhi-jiaocheng", keyword: "国内充值教程", articleType: "充值教程", intent: "教程搜索" },
  { label: "国内开通注意事项", slug: "guonei-kaitong-zhuyi", keyword: "国内开通", articleType: "下单检查", intent: "开通前判断" },
  { label: "支付失败怎么办", slug: "zhifu-shibai-zenmeban", keyword: "支付失败", articleType: "支付失败", intent: "失败排查" },
  { label: "虚拟卡失败怎么办", slug: "xunika-shibai", keyword: "虚拟卡失败", articleType: "支付失败", intent: "失败排查" },
  { label: "银行卡扣款失败原因", slug: "yinhangka-koukuan-shibai", keyword: "银行卡扣款失败", articleType: "支付失败", intent: "失败排查" },
  { label: "账号状态怎么检查", slug: "zhanghao-zhuangtai-jiancha", keyword: "账号状态", articleType: "账号风控", intent: "账号检查" },
  { label: "账号受限还能充值吗", slug: "zhanghao-shouxian-chongzhi", keyword: "账号受限", articleType: "账号风控", intent: "账号检查" },
  { label: "账号风控风险说明", slug: "zhanghao-fengkong-risk", keyword: "账号风控", articleType: "账号风控", intent: "风险判断" },
  { label: "邮箱填错怎么办", slug: "youxiang-tiancuo", keyword: "邮箱填错", articleType: "下单检查", intent: "售后排查" },
  { label: "充值后没生效怎么办", slug: "chongzhi-weishengxiao", keyword: "充值未生效", articleType: "支付失败", intent: "售后排查" },
  { label: "需要提供密码吗", slug: "xuyao-mima-ma", keyword: "需要密码吗", articleType: "下单检查", intent: "安全疑问" },
  { label: "自助下单流程", slug: "zizhu-xiadan-liucheng", keyword: "自助下单", articleType: "充值教程", intent: "流程说明" },
  { label: "人工代充和自助充值怎么选", slug: "rengong-zizhu-duibi", keyword: "代充自助充值", articleType: "区别科普", intent: "方式比较" },
  { label: "官方订阅和第三方自助充值区别", slug: "guanfang-disanfang-qubie", keyword: "官方订阅第三方区别", articleType: "区别科普", intent: "方式比较" },
  { label: "下单前必读清单", slug: "xiadan-qian-qingdan", keyword: "下单清单", articleType: "下单检查", intent: "下单前确认" },
  { label: "续费前需要注意什么", slug: "xufei-qian-zhuyi", keyword: "续费注意", articleType: "下单检查", intent: "续费判断" },
  { label: "新号和老号都能充值吗", slug: "xinhao-laohao-chongzhi", keyword: "新号老号", articleType: "账号风控", intent: "账号检查" },
  { label: "overdue欠款怎么处理", slug: "overdue-qianfei-chuli", keyword: "overdue欠款", articleType: "账号风控", intent: "账单问题" },
  { label: "地区和IP环境影响说明", slug: "diqu-ip-huanjing", keyword: "IP环境", articleType: "账号风控", intent: "环境判断" },
  { label: "开通后如何确认会员状态", slug: "kaitong-hou-queren-zhuangtai", keyword: "会员状态确认", articleType: "使用技巧", intent: "使用确认" },
  { label: "适合哪些用户", slug: "shihe-naxie-yonghu", keyword: "适合谁", articleType: "区别科普", intent: "购买前判断" },
  { label: "和其他AI会员怎么选", slug: "he-qita-ai-huiyuan-zenme-xuan", keyword: "AI会员怎么选", articleType: "区别科普", intent: "产品选择" },
  { label: "常见售后问题整理", slug: "shouhou-wenti-zhengli", keyword: "售后问题", articleType: "使用技巧", intent: "售后排查" },
  { label: "使用技巧和避坑建议", slug: "shiyong-jiqiao-bikeng", keyword: "使用技巧", articleType: "使用技巧", intent: "使用教程" },
];

function makeTopicsForProfile(profile: CategoryProfile, target = 100): TopicSeed[] {
  const topics: TopicSeed[] = profile.special.map(([title, slug, keyword, articleType, scenario]) => ({
    title,
    slug,
    category: profile.category,
    keywords: [keyword, `${profile.productName}充值`, `${profile.productName}开通`, "AI会员充值"],
    searchIntent: scenario,
    articleType,
    scenario,
  }));

  for (const subject of profile.subjects) {
    for (const pattern of patterns) {
      topics.push({
        title: `${subject.label} ${pattern.label}`,
        slug: `${subject.slug}-${pattern.slug}`,
        category: profile.category,
        keywords: [
          `${subject.keyword}${pattern.keyword}`,
          `${profile.productName}充值`,
          `${profile.productName}开通`,
          "AI会员充值",
        ],
        searchIntent: pattern.intent,
        articleType: pattern.articleType,
        scenario: pattern.intent,
      });
    }
  }

  return uniqueTopics(topics).slice(0, target);
}

function uniqueTopics(topics: TopicSeed[]) {
  const seen = new Set<string>();
  return topics.filter((topic) => {
    if (seen.has(topic.slug)) return false;
    seen.add(topic.slug);
    return true;
  });
}

function scoreProduct(product: Product, seed: TopicSeed) {
  const text = `${product.title} ${product.description} ${product.keywords.join(" ")}`.toLowerCase();
  const title = seed.title.toLowerCase();
  let score = 0;

  for (const keyword of seed.keywords) {
    const compactKeyword = keyword.toLowerCase().replace(/\s+/g, "");
    if (text.includes(compactKeyword)) score += 3;
  }

  for (const signal of ["plus", "pro", "max", "advanced", "supergrok", "premium", "组织", "organization"]) {
    if (title.includes(signal) && text.includes(signal)) score += 6;
  }

  if ((title.includes("plus") || title.includes("pro")) && /没有会员|普通账号/.test(text)) {
    score -= 6;
  }
  if (title.includes("支付失败") && /充值|plus|pro|premium|会员/.test(text)) {
    score += 2;
  }
  if (/咨询客服|不单独出售/.test(text)) {
    score -= 3;
  }

  return score;
}

function pickProduct(category: ProductCategory, index: number, seed: TopicSeed) {
  const matched = products.filter((product) => product.category === category);
  if (matched.length > 0) {
    return [...matched].sort((a, b) => scoreProduct(b, seed) - scoreProduct(a, seed))[
      index % Math.min(4, matched.length)
    ];
  }
  return products.find((product) => product.category === "Other") || fallbackProduct;
}

function buildTopics(): ArticleTopic[] {
  const seeds = profiles.flatMap((profile) => makeTopicsForProfile(profile, 100));
  return seeds.map((seed, index) => {
    const product = pickProduct(seed.category, index, seed);
    return {
      ...seed,
      productId: product.id,
      ctaProductUrl: product.orderUrl,
    };
  });
}

function yamlArray(values: string[]) {
  return `[${values.map((value) => JSON.stringify(value)).join(", ")}]`;
}

function getProfile(category: CoreCategory) {
  const profile = profiles.find((item) => item.category === category);
  if (!profile) throw new Error(`Unknown category: ${category}`);
  return profile;
}

function getArticleAdvice(articleType: ArticleType, profile: CategoryProfile) {
  const common = `陈鹏AI服务的处理原则是不拼低价，不靠夸张承诺吸引下单，而是把账号状态、商品规则和售后边界讲清楚。${profile.productName} 相关问题看似都是“充值”，实际经常牵扯到 ${profile.accountFocus.slice(0, 3).join("、")}。`;
  const map: Record<ArticleType, string> = {
    充值教程: `如果你的目标是开通或续费，先确认账号能否正常登录，再看当前会员状态和商品要求。${common}`,
    支付失败: `遇到支付失败时，不要连续换卡硬试。先拆分判断：是支付方式问题、账单资料问题、账号状态问题，还是平台临时风控。${common}`,
    区别科普: `做选择题时不要只看名称和价格。更重要的是额度、适用账号、使用场景、续费方式和售后边界。${common}`,
    账号风控: `账号风控类问题不能靠一句“能不能充”判断。要看登录状态、历史订阅、地区环境、安全验证和平台提示。${common}`,
    下单检查: `下单检查是减少售后问题的核心动作。账号状态越清楚，订单处理和沟通成本越低。${common}`,
    使用技巧: `使用技巧类问题要先确认权益是否已经生效，再看入口、账号切换、浏览器环境和功能限制。${common}`,
  };

  return map[articleType];
}

function buildArticle(topic: ArticleTopic, product: Product) {
  const profile = getProfile(topic.category);
  const strengths = profile.strengths.join("、");
  const accountFocus = profile.accountFocus.join("、");
  const advice = getArticleAdvice(topic.articleType, profile);
  const productHint =
    product.id === fallbackProduct.id ? "自助下单总入口" : `${product.category}相关商品入口`;

  return `---
title: "${topic.title}"
description: "${topic.title}，围绕账号状态、支付失败、下单前检查、风险说明和自助下单流程，帮助用户快速判断怎么处理。"
category: "${topic.category}"
slug: "${topic.slug}"
date: "${publishDate}"
keywords: ${yamlArray(topic.keywords)}
productId: "${topic.productId}"
productUrl: "${topic.ctaProductUrl}"
---

## 本文适合谁

这篇文章适合正在搜索「${topic.keywords[0]}」的用户。你可能已经试过官方支付，也可能只是准备第一次开通会员；真正需要解决的不是一句“能不能充”，而是账号状态是否适合、商品规则是否匹配、失败后应该先排查哪里。

如果你正在对比 ${profile.productName} 相关服务，也可以把本文当作下单前判断清单。${profile.productName} 常见使用场景包括 ${strengths}，但充值或开通之前，更应该先看 ${accountFocus}。

## 常见问题场景

第一类场景是用户只看到“充值”两个字，就直接找入口付款，结果忽略了当前账号是否已有会员、是否存在欠款、邮箱是否填错、登录环境是否稳定。

第二类场景是支付失败后连续尝试。很多平台会把支付方式、地区、账号历史和设备环境一起判断，连续尝试未必能解决问题，还可能让账号进入更敏感的状态。

第三类场景是把别人的成功经验直接套到自己身上。ChatGPT、Claude、Gemini、Grok 的账号体系不同，同一个用户在 A 平台能处理，不代表 B 平台也符合规则。

## 下单前检查清单

- 当前账号是否能正常登录，并能看到订阅或设置入口
- 当前账号是否为商品说明支持的状态，例如 Free、Pro、Max 或指定会员状态
- 是否存在 overdue 欠款、历史扣款失败、取消中订阅或安全验证
- 下单邮箱、登录邮箱、订单邮箱是否一致
- 是否已经阅读商品页说明、处理时效和售后边界
- 是否能接受平台规则变化、地区限制和账号风控带来的不确定性

这些检查不是为了拖慢下单，而是为了减少无效订单。很多售后沟通最后都回到同几个问题：邮箱填错、账号状态不符合、已有订阅没处理、平台要求额外验证。

## 解决思路

${advice}

如果你有稳定的官方支付条件，可以优先使用官方订阅；如果你熟悉虚拟卡、账单地址和长期续费成本，也可以自己研究。第三方自助充值更适合已经读完商品说明、账号状态清楚、希望节省操作时间的人。

## 风险说明

教程能帮助你减少明显误判，但不能替代平台自己的审核。会员开通结果会受到账号状态、地区环境、支付通道、平台策略和后续登录行为影响。

专业的处理方式不是承诺没有风险，而是把风险边界提前讲清楚：哪些账号适合，哪些账号要先处理欠款或验证，哪些情况建议先联系客服确认。

## 自助下单引导

如果你已经看完本文，并确认账号状态、商品规则和风险说明，可以前往陈鹏AI服务自助下单。本篇匹配的是${productHint}，不同产品规则不同，请先阅读商品页说明，再决定是否购买。

[前往自助下单](${topic.ctaProductUrl})

下单后如需售后沟通，请一次性准备下单邮箱、订单号、支付截图和账号页面提示截图。信息越完整，排查越快。

## FAQ

### ${topic.title}可以直接下单吗？

不建议只看标题直接下单。先确认账号状态、商品适用范围、邮箱填写和售后规则，无法判断时先联系客服。

### 支付失败是不是换一张卡就行？

不一定。支付失败可能来自卡片、账单资料、账号状态、地区环境或平台风控，需要先判断原因。

### 陈鹏AI服务适合什么用户？

适合不想反复研究复杂支付流程，希望先看清规则、确认账号状态，再按商品说明自助下单的用户。

### 如果充值后遇到验证怎么办？

先保留页面提示截图，再根据商品页售后说明联系处理。平台验证属于动态规则，不能只靠充值动作完全避免。
`;
}

async function main() {
  const topics = buildTopics();
  await fs.mkdir(postsDir, { recursive: true });

  const existing = await fs.readdir(postsDir);
  await Promise.all(
    existing
      .filter((fileName) => fileName.endsWith(".md") || fileName.endsWith(".mdx"))
      .map((fileName) => fs.unlink(path.join(postsDir, fileName))),
  );

  await fs.writeFile(
    topicsPath,
    `export type ArticleTopic = {\n  title: string;\n  slug: string;\n  category: string;\n  productId: string;\n  keywords: string[];\n  searchIntent: string;\n  articleType: string;\n  scenario: string;\n  ctaProductUrl: string;\n};\n\nexport const articleTopics: ArticleTopic[] = ${JSON.stringify(
      topics,
      null,
      2,
    )};\n`,
    "utf8",
  );

  for (const topic of topics) {
    const product = products.find((item) => item.id === topic.productId) || fallbackProduct;
    await fs.writeFile(
      path.join(postsDir, `${topic.slug}.md`),
      buildArticle(topic, product),
      "utf8",
    );
  }

  console.log(`Generated ${topics.length} article topics.`);
  console.log(`Wrote ${topics.length} markdown articles to content/posts.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
