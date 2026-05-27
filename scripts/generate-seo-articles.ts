import fs from "node:fs/promises";
import path from "node:path";
import { products, type Product, type ProductCategory } from "../content/products";

type ArticleType =
  | "充值教程"
  | "支付失败"
  | "区别科普"
  | "账号风控"
  | "下单检查"
  | "使用教程";

type TopicSeed = {
  title: string;
  slug: string;
  category: ProductCategory;
  keywords: string[];
  searchIntent: string;
  articleType: ArticleType;
};

type ArticleTopic = TopicSeed & {
  productId: string;
  ctaProductUrl: string;
};

const rootDir = process.cwd();
const postsDir = path.join(rootDir, "content/posts");
const topicsPath = path.join(rootDir, "content/articleTopics.ts");
const today = new Date().toISOString().slice(0, 10);
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
  updatedAt: today,
};

const seeds: TopicSeed[] = [
  ...makeSeeds("ChatGPT", [
    ["ChatGPT Plus 国内充值教程", "chatgpt-plus-guonei-chongzhi", "ChatGPT Plus充值"],
    ["ChatGPT Plus 支付失败怎么办", "chatgpt-plus-zhifu-shibai", "ChatGPT Plus支付失败"],
    ["ChatGPT Plus 和 Pro 有什么区别", "chatgpt-plus-pro-qubie", "ChatGPT Plus Pro区别"],
    ["ChatGPT Pro 国内开通前注意事项", "chatgpt-pro-guonei-kaitong-zhuyi", "ChatGPT Pro开通"],
    ["ChatGPT 账号充值前怎么检查状态", "chatgpt-zhanghao-zhuangtai-jiancha", "ChatGPT账号状态"],
    ["ChatGPT Plus overdue 欠款怎么处理", "chatgpt-plus-overdue-qianfei", "ChatGPT overdue"],
    ["ChatGPT Plus 虚拟卡失败后还能怎么开通", "chatgpt-plus-xunika-shibai", "ChatGPT虚拟卡失败"],
    ["ChatGPT Plus 需要提供密码吗", "chatgpt-plus-xuyao-mima-ma", "ChatGPT Plus密码"],
    ["ChatGPT Plus 自动发货商品怎么理解", "chatgpt-plus-zidong-fahuo-shuoming", "ChatGPT自动发货"],
    ["ChatGPT Plus 人工代充和自助充值怎么选", "chatgpt-plus-rengong-zizhu-duibi", "ChatGPT代充自助充值"],
    ["ChatGPT Plus 续费前需要注意什么", "chatgpt-plus-xufei-zhuyi", "ChatGPT Plus续费"],
    ["ChatGPT Plus 新号和老号都能充值吗", "chatgpt-plus-xinhao-laohao", "ChatGPT新号老号"],
    ["ChatGPT Plus 登录邮箱填错怎么办", "chatgpt-plus-youxiang-tiancuo", "ChatGPT邮箱填错"],
    ["ChatGPT Plus 充值后没有生效怎么办", "chatgpt-plus-chongzhi-weishengxiao", "ChatGPT充值未生效"],
    ["ChatGPT Plus 风控风险有哪些", "chatgpt-plus-fengkong-risk", "ChatGPT风控"],
    ["ChatGPT Plus Gmail 登录账号充值注意事项", "chatgpt-plus-gmail-zhanghao", "ChatGPT Gmail充值"],
    ["ChatGPT Plus Apple ID 登录账号充值说明", "chatgpt-plus-apple-id", "ChatGPT Apple ID"],
    ["ChatGPT Plus 成品号和充值自己号区别", "chatgpt-plus-chengpinhao-zijihao", "ChatGPT成品号"],
    ["ChatGPT Pro 20X 适合哪些用户", "chatgpt-pro-20x-shihe", "ChatGPT Pro 20X"],
    ["ChatGPT Codex 验证相关问题说明", "chatgpt-codex-yanzheng", "ChatGPT Codex验证"],
    ["ChatGPT Plus 下单前必读清单", "chatgpt-plus-xiadan-qingdan", "ChatGPT下单清单"],
    ["ChatGPT Plus 账号共享为什么有风险", "chatgpt-plus-gongxiang-risk", "ChatGPT账号共享"],
    ["ChatGPT Plus 国内用户常见误区", "chatgpt-plus-guonei-wuqu", "ChatGPT国内误区"],
    ["ChatGPT Plus 支付环境和 IP 环境说明", "chatgpt-plus-ip-huanjing", "ChatGPT IP环境"],
    ["ChatGPT Plus 自助下单后如何查看教程", "chatgpt-plus-xiadan-hou-jiaocheng", "ChatGPT下单教程"],
  ]),
  ...makeSeeds("Claude", [
    ["Claude Pro 充值前注意事项", "claude-pro-chongzhi-zhuyi", "Claude Pro充值"],
    ["Claude Pro 组织 ID 是什么", "claude-pro-organization-id", "Claude组织ID"],
    ["Claude Pro 和 Max 有什么区别", "claude-pro-max-qubie", "Claude Pro Max区别"],
    ["Claude 当前是 Pro 还能下单吗", "claude-pro-yijing-kaitong-xiadan", "Claude Pro下单"],
    ["Claude Max 充值前需要确认什么", "claude-max-chongzhi-qian-jiancha", "Claude Max充值"],
    ["Claude Free 账号状态怎么判断", "claude-free-zhanghao-zhuangtai", "Claude Free账号"],
    ["Claude overdue 欠款怎么处理", "claude-overdue-qianfei-chuli", "Claude overdue"],
    ["Claude 支付失败常见原因", "claude-zhifu-shibai-yuanyin", "Claude支付失败"],
    ["Claude 登录环境异常会影响充值吗", "claude-denglu-huanjing-fengkong", "Claude登录环境"],
    ["Claude Pro 国内用户开通教程", "claude-pro-guonei-kaitong", "Claude Pro国内开通"],
    ["Claude Pro 充值需要密码吗", "claude-pro-xuyao-mima-ma", "Claude Pro密码"],
    ["Claude 账号被限制还能开会员吗", "claude-zhanghao-xianzhi-huiyuan", "Claude账号限制"],
    ["Claude API 和 Claude Pro 是一回事吗", "claude-api-pro-qubie", "Claude API Pro区别"],
    ["Claude 工作区和组织信息怎么区分", "claude-workspace-organization", "Claude工作区"],
    ["Claude Pro 下单邮箱怎么填写", "claude-pro-youxiang-tianxie", "Claude下单邮箱"],
    ["Claude Pro 充值后没有生效怎么办", "claude-pro-weishengxiao", "Claude充值未生效"],
    ["Claude Pro 虚拟卡失败后怎么办", "claude-pro-xunika-shibai", "Claude虚拟卡失败"],
    ["Claude Pro 账号风控风险说明", "claude-pro-fengkong-risk", "Claude风控"],
    ["Claude Max 适合哪些用户", "claude-max-shihe-yonghu", "Claude Max适合谁"],
    ["Claude Pro 写作用户开通建议", "claude-pro-xiezuo-yonghu", "Claude写作"],
    ["Claude Pro 代码用户开通建议", "claude-pro-daima-yonghu", "Claude代码"],
    ["Claude Pro 长文档用户开通建议", "claude-pro-changwendang", "Claude长文档"],
    ["Claude 充值商品说明怎么看", "claude-chongzhi-shangpin-shuoming", "Claude商品说明"],
    ["Claude 下单前必读清单", "claude-xiadan-qian-qingdan", "Claude下单清单"],
    ["Claude 售后沟通需要提供什么", "claude-shouhou-goutong-cailiao", "Claude售后"],
  ]),
  ...makeSeeds("Gemini", [
    ["Gemini Pro 国内使用教程", "gemini-pro-guonei-shiyong", "Gemini Pro国内使用"],
    ["Gemini Advanced 开通注意事项", "gemini-advanced-kaitong-zhuyi", "Gemini Advanced开通"],
    ["Gemini Pro 支付失败怎么办", "gemini-pro-zhifu-shibai", "Gemini支付失败"],
    ["Gemini Google 账号地区怎么影响开通", "gemini-google-diqu-yingxiang", "Gemini账号地区"],
    ["Gemini 多账号登录容易踩哪些坑", "gemini-duozhanghao-denglu", "Gemini多账号"],
    ["Gemini Pro 和 Advanced 有什么区别", "gemini-pro-advanced-qubie", "Gemini Pro Advanced区别"],
    ["Gemini 付款资料异常怎么判断", "gemini-fukuan-ziliao-yichang", "Google付款资料"],
    ["Gemini 家庭组和年龄限制说明", "gemini-jiatingzu-nianling", "Gemini家庭组"],
    ["Gemini 工作邮箱适合开会员吗", "gemini-workspace-youxiang", "Gemini工作邮箱"],
    ["Gemini Pro 下单前检查清单", "gemini-pro-xiadan-qingdan", "Gemini下单清单"],
    ["Gemini 会员开通后找不到入口怎么办", "gemini-huiyuan-rukou", "Gemini入口"],
    ["Gemini Pro 国内访问环境说明", "gemini-pro-fangwen-huanjing", "Gemini访问环境"],
    ["Gemini 充值需要注意哪些风险", "gemini-chongzhi-risk", "Gemini风控"],
    ["Gemini Google 生态用户开通建议", "gemini-google-shengtai-jianyi", "Gemini Google生态"],
    ["Gemini 自助下单后如何核对账号", "gemini-zizhu-xiadan-hedui", "Gemini自助下单"],
  ]),
  ...makeSeeds("Grok", [
    ["Grok 会员开通教程", "grok-huiyuan-kaitong", "Grok会员开通"],
    ["Grok 和 SuperGrok 有什么区别", "grok-supergrok-qubie", "Grok SuperGrok区别"],
    ["Grok 国内开通前需要准备什么", "grok-guonei-kaitong-zhunbei", "Grok国内开通"],
    ["Grok X 账号状态怎么检查", "grok-x-zhanghao-zhuangtai", "Grok X账号"],
    ["Grok 支付失败常见原因", "grok-zhifu-shibai", "Grok支付失败"],
    ["SuperGrok 适合哪些用户", "supergrok-shihe-yonghu", "SuperGrok适合谁"],
    ["Grok 会员和 X Premium 有什么关系", "grok-x-premium-guanxi", "Grok X Premium"],
    ["Grok 账号地区和 IP 环境说明", "grok-diqu-ip-huanjing", "Grok IP环境"],
    ["Grok 开通后找不到入口怎么办", "grok-kaitong-rukou", "Grok入口"],
    ["Grok 下单邮箱和 X 账号怎么填", "grok-youxiang-x-zhanghao", "Grok下单邮箱"],
    ["Grok 账号受限还能下单吗", "grok-zhanghao-xianshi-xiadan", "Grok账号受限"],
    ["Grok 自助下单前必读清单", "grok-zizhu-xiadan-qingdan", "Grok自助下单"],
    ["Grok 充值后可能遇到哪些风控", "grok-chongzhi-fengkong", "Grok风控"],
    ["Grok 新手用户开通建议", "grok-xinshou-kaitong-jianyi", "Grok新手"],
    ["Grok 售后沟通需要哪些截图", "grok-shouhou-jietu", "Grok售后截图"],
  ]),
  ...makeSeeds("YouTube", [
    ["YouTube Premium 国内开通说明", "youtube-premium-guonei-kaitong", "YouTube Premium开通"],
    ["YouTube Premium 会员下单前注意事项", "youtube-premium-xiadan-zhuyi", "YouTube会员注意事项"],
    ["YouTube Premium 家庭组和地区问题说明", "youtube-premium-jiatingzu-diqu", "YouTube地区"],
    ["YouTube Premium 支付失败怎么办", "youtube-premium-zhifu-shibai", "YouTube支付失败"],
  ]),
  ...makeSeeds("Spotify", [
    ["Spotify 会员使用说明", "spotify-huiyuan-shiyong", "Spotify会员"],
    ["Spotify Premium 国内开通注意事项", "spotify-premium-guonei-kaitong", "Spotify Premium开通"],
    ["Spotify 账号地区和会员规则说明", "spotify-zhanghao-diqu-guize", "Spotify地区"],
  ]),
  ...makeSeeds("X Premium", [
    ["X Premium 国内开通教程", "x-premium-guonei-kaitong", "X Premium开通"],
    ["X Premium 和 Grok 会员关系说明", "x-premium-grok-guanxi", "X Premium Grok"],
    ["X Premium 支付失败和账号状态检查", "x-premium-zhifu-zhanghao-jiancha", "X Premium支付失败"],
  ]),
  ...makeSeeds("Midjourney", [
    ["Midjourney 会员开通前注意事项", "midjourney-huiyuan-kaitong-zhuyi", "Midjourney会员"],
    ["Midjourney 国内支付失败怎么办", "midjourney-zhifu-shibai", "Midjourney支付失败"],
    ["Midjourney 账号和订阅规则说明", "midjourney-zhanghao-dingyue-guize", "Midjourney订阅"],
  ]),
  ...makeSeeds("Poe", [
    ["Poe 会员开通说明", "poe-huiyuan-kaitong-shuoming", "Poe会员"],
    ["Poe 国内使用和订阅注意事项", "poe-guonei-shiyong-dingyue", "Poe订阅"],
  ]),
  ...makeSeeds("Perplexity", [
    ["Perplexity Pro 国内开通教程", "perplexity-pro-guonei-kaitong", "Perplexity Pro开通"],
    ["Perplexity Pro 代充和成品号怎么选", "perplexity-pro-daichong-chengpinhao", "Perplexity代充"],
    ["Perplexity Pro AI 搜索用户开通建议", "perplexity-pro-ai-sousuo-jianyi", "Perplexity AI搜索"],
  ]),
  ...makeSeeds("Other", [
    ["AI 会员自助下单前通用检查清单", "ai-huiyuan-zizhu-xiadan-qingdan", "AI会员自助下单"],
    ["AI 工具充值失败时如何判断原因", "ai-gongju-chongzhi-shibai-panduan", "AI工具充值失败"],
    ["虚拟产品下单前为什么必须看说明", "xuni-chanpin-xiadan-kan-shuoming", "虚拟产品说明"],
    ["AI 会员售后沟通需要准备哪些材料", "ai-huiyuan-shouhou-cailiao", "AI会员售后"],
    ["如何根据使用场景选择 AI 会员", "ruhe-xuanze-ai-huiyuan", "选择AI会员"],
  ]),
];

function makeSeeds(
  category: ProductCategory,
  items: Array<[string, string, string]>,
): TopicSeed[] {
  return items.map(([title, slug, keyword]) => ({
    title,
    slug,
    category,
    keywords: [keyword, `${category}充值`, `${category}开通`, "AI会员充值"],
    searchIntent: getIntent(title),
    articleType: getType(title),
  }));
}

function getIntent(title: string) {
  if (title.includes("失败") || title.includes("怎么办")) return "排查问题";
  if (title.includes("区别") || title.includes("关系")) return "比较选择";
  if (title.includes("检查") || title.includes("清单")) return "下单前确认";
  if (title.includes("注意") || title.includes("风险")) return "风险判断";
  return "开通教程";
}

function getType(title: string): ArticleType {
  if (title.includes("失败")) return "支付失败";
  if (title.includes("区别") || title.includes("关系")) return "区别科普";
  if (title.includes("风控") || title.includes("风险")) return "账号风控";
  if (title.includes("检查") || title.includes("清单") || title.includes("注意")) return "下单检查";
  if (title.includes("使用")) return "使用教程";
  return "充值教程";
}

function scoreProduct(product: Product, seed: TopicSeed) {
  const text = `${product.title} ${product.description} ${product.keywords.join(" ")}`.toLowerCase();
  const title = seed.title.toLowerCase();
  let score = 0;

  for (const keyword of seed.keywords) {
    const compactKeyword = keyword.toLowerCase().replace(/\s+/g, "");
    if (text.includes(compactKeyword)) score += 3;
  }

  const signals = [
    "plus",
    "pro",
    "max",
    "advanced",
    "supergrok",
    "codex",
    "premium",
    "组织",
    "organization",
    "成品号",
    "普通账号",
  ];

  for (const signal of signals) {
    if (title.includes(signal) && text.includes(signal)) score += 6;
  }

  if ((title.includes("plus") || title.includes("pro")) && /没有会员|普通账号/.test(text)) {
    score -= 8;
  }
  if (title.includes("成品号") && /普通账号|成品号|独享账号/.test(text)) {
    score += 8;
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
      index % Math.min(3, matched.length)
    ];
  }
  const other = products.filter((product) => product.category === "Other");
  return other[index % Math.max(1, other.length)] || fallbackProduct;
}

function buildTopics(): ArticleTopic[] {
  return seeds.slice(0, 100).map((seed, index) => {
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

function productPhrase(product: Product) {
  if (product.id === fallbackProduct.id) {
    return "自助下单总入口";
  }
  return `${product.platform} 相关商品页`;
}

function buildArticle(topic: ArticleTopic, product: Product) {
  const platform = topic.category === "Other" ? "AI 工具" : topic.category;
  const productText = productPhrase(product);
  const typeAdvice = getTypeAdvice(topic.articleType, platform);
  const checklist = [
    `确认当前 ${platform} 账号能正常登录，并能看到基础设置或订阅页面`,
    "确认账号是否存在欠款、取消中订阅、历史扣款失败或安全验证",
    "确认商品说明适用的账号状态，不要把 Free、Pro、Max、成品号混在一起",
    "确认下单邮箱、登录邮箱、订单邮箱是否一致，避免售后无法核对",
    "确认自己能接受平台风控和规则变化带来的不确定性",
    "确认已经阅读商品页的处理时效、售后边界和补充材料要求",
  ];
  const scenes = [
    `用户搜索「${topic.keywords[0]}」时，通常不是只想知道价格，而是想判断自己的账号能不能处理、哪一步容易失败、下单后要准备什么。`,
    `${platform} 的会员规则经常和账号地区、支付方式、历史订阅、登录环境有关。单看别人成功案例，很容易忽略自己账号的特殊状态。`,
    `如果你已经连续尝试多次支付或多次切换环境，建议先停下来核对原因。反复尝试不一定提高成功率，反而可能让账号行为更敏感。`,
  ];
  const risk = [
    "充值和开通结果会受到平台规则、账号状态、地区环境、支付通道和安全验证影响。",
    "教程能帮助你减少明显误判，但不能替代平台自己的审核，也不能承诺后续完全不遇到验证或限制。",
    "虚拟产品售后通常围绕商品说明执行。下单前读清适用范围，比下单后再解释更省时间。",
  ];
  const faq = [
    ["这类商品适合所有账号吗？", "不一定。不同商品支持的账号状态不同，尤其是已有会员、欠款、受限或多账号登录场景，需要先看商品说明。"],
    ["下单前最重要的检查是什么？", "先确认账号能正常登录、没有明显欠款或安全限制，再确认商品页要求的邮箱、ID、截图等信息。"],
    ["如果找不到对应商品怎么办？", "可以先进入自助下单总入口查看分类，或联系页面客服说明目标产品和账号状态。"],
  ];

  return `---
title: "${topic.title}"
description: "${topic.title}，从账号状态、支付失败、平台风控、下单前检查和自助下单说明几个角度，帮助用户先判断再购买。"
category: "${topic.category}"
slug: "${topic.slug}"
date: "${today}"
keywords: ${yamlArray(topic.keywords)}
productId: "${topic.productId}"
productUrl: "${topic.ctaProductUrl}"
---

## 本文适合谁

这篇文章适合正在搜索「${topic.keywords[0]}」的用户。你可能已经有账号，也可能刚准备第一次开通会员；你关心的不只是能不能买，更关心账号状态是否适合、支付失败是否会反复出现、售后边界是否清楚。我的建议是先把规则看明白，再决定是否下单。

如果你准备通过${productText}处理，也建议先读完本文。商品页负责写具体规则，本文负责把下单前的判断逻辑讲清楚：哪些信息要核对，哪些场景要先暂停，哪些风险不能被任何服务完全消除。

## 常见问题场景

${scenes.join("\n\n")}

还有一种常见误区是把不同产品的经验混用。ChatGPT、Claude、Gemini、Grok、YouTube、Spotify、X Premium 等服务的账号体系并不相同。你要看的不是“别人是否成功”，而是“我的账号是否符合当前商品说明”。

## 下单前检查清单

${checklist.map((item) => `- ${item}`).join("\n")}

检查清单不是形式主义。很多售后问题最后都回到这些细节：邮箱填错、已有订阅未取消、overdue 欠款没处理、账号本身需要验证、商品只支持指定状态。

## 方法判断与操作建议

${typeAdvice}

如果你有稳定的官方支付条件，可以优先考虑官方订阅；如果你熟悉虚拟卡、账单地址和长期续费成本，也可以自己研究。第三方自助充值更适合已经看过说明、账号状态清楚、能接受售后边界，并希望节省操作成本的人。

## 风险说明

${risk.join("\n\n")}

我不建议相信脱离平台规则的保证。更专业的判断是：先降低明显风险，比如填对邮箱、处理欠款、稳定登录环境、确认商品适用范围；再接受无法完全控制的部分，比如平台临时风控、地区策略变化和后续验证。

## 自助下单引导

如果你已经看完教程，并确认账号状态、商品规则和风险说明，可以前往陈鹏AI服务自助下单。不同产品规则不同，请先阅读商品页说明，再决定是否购买。

[前往自助下单](${topic.ctaProductUrl})

下单后如果遇到问题，建议一次性准备下单邮箱、订单号、支付截图、账号页面提示截图。客服需要看到具体提示，才能判断是账号状态、商品规则、平台延迟还是填写信息的问题。

## FAQ

${faq
  .map(([question, answer]) => `### ${question}\n\n${answer}`)
  .join("\n\n")}
`;
}

function getTypeAdvice(articleType: ArticleType, platform: string) {
  const advice: Record<ArticleType, string> = {
    充值教程: `处理 ${platform} 会员开通时，先确认入口、邮箱、订阅状态和商品规则，再决定用官方支付、虚拟卡还是自助充值。不要把下单当成第一步，判断账号状态才是第一步。`,
    支付失败: `遇到支付失败时，先不要连续重复付款。更稳的做法是把卡片、账单地址、账号地区、欠款状态和登录环境逐项排查，再决定是否换方式处理。`,
    区别科普: `做区别判断时，不要只看名称和价格。要看额度、入口、账号要求、续费方式、售后边界，以及它是否真的匹配你的日常使用场景。`,
    账号风控: `涉及账号风控时，重点不是寻找所谓无风险办法，而是降低明显风险：稳定登录环境、处理安全验证、不要频繁切换设备，并确认商品适用范围。`,
    下单检查: `下单检查的核心是把“能不能处理”放在“要不要付款”之前。账号状态、邮箱、欠款、当前会员等级和商品要求都要先核对。`,
    使用教程: `使用教程的重点是把开通后的入口、账号切换、权益识别和常见异常讲清楚。不要只看是否开通，还要确认自己能稳定找到并使用对应功能。`,
  };

  return advice[articleType];
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
    `export type ArticleTopic = {\n  title: string;\n  slug: string;\n  category: string;\n  productId: string;\n  keywords: string[];\n  searchIntent: string;\n  articleType: string;\n  ctaProductUrl: string;\n};\n\nexport const articleTopics: ArticleTopic[] = ${JSON.stringify(
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
