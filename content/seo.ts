import type { ProductCategory } from "@/content/products";

export type SeoKeywordPage = {
  slug: string;
  title: string;
  description: string;
  category: ProductCategory;
  primaryKeyword: string;
  keywords: string[];
  searchIntent: "购买前判断" | "支付失败排查" | "账号状态检查" | "产品区别科普" | "使用技巧";
  heroSummary: string;
  userQuestions: string[];
  checks: string[];
  internalLinks: Array<{ label: string; href: string }>;
};

const productLinks = {
  ChatGPT: "/chatgpt",
  Claude: "/claude",
  Gemini: "/gemini",
  Grok: "/grok",
};

function buildKeywordPage(
  category: keyof typeof productLinks,
  slug: string,
  primaryKeyword: string,
  intent: SeoKeywordPage["searchIntent"],
  extras: string[],
): SeoKeywordPage {
  const productName = category === "ChatGPT" ? "ChatGPT / GPT" : category;
  const topicTitle = `${primaryKeyword}：下单前判断与教程说明`;

  return {
    slug,
    title: topicTitle,
    description: `${primaryKeyword}相关问题整理：适合谁、常见失败原因、账号状态检查、风险边界和陈鹏AI服务自助下单前注意事项。`,
    category,
    primaryKeyword,
    keywords: [
      primaryKeyword,
      `${productName}充值`,
      `${productName}会员开通`,
      `${productName}支付失败`,
      `${productName}国内使用教程`,
      ...extras,
    ],
    searchIntent: intent,
    heroSummary: `这页专门承接「${primaryKeyword}」这类强搜索意图。用户不是来闲逛的，而是已经遇到付款、账号、地区、风控或会员选择问题，需要一个能把规则讲清楚、把下单前检查列明白的地方。`,
    userQuestions: [
      `${primaryKeyword}到底应该先看教程还是直接下单？`,
      `${productName}账号当前状态是否适合处理？`,
      `官方支付失败后，是否还能换其他方式？`,
      `需要准备邮箱、账号截图、Organization ID 或订单信息吗？`,
      `充值后遇到平台验证或风控应该如何判断？`,
    ],
    checks: [
      "账号能正常登录，并能看到基础设置或订阅入口",
      "当前会员状态、欠款、续费、取消订阅状态已经确认",
      "下单邮箱、登录邮箱、订单邮箱没有填错",
      "已经阅读商品页说明，理解适用范围和售后边界",
      "能接受平台规则变化、地区策略和账号风控带来的不确定性",
    ],
    internalLinks: [
      { label: `${category} 专题页`, href: productLinks[category] },
      { label: "全部教程", href: "/blog" },
      { label: "商品入口", href: "/products" },
      { label: "联系客服", href: "/contact" },
    ],
  };
}

export const seoKeywordPages: SeoKeywordPage[] = [
  buildKeywordPage("ChatGPT", "gpt-zenme-chongzhi", "GPT怎么充值", "购买前判断", [
    "GPT充值教程",
    "GPT Plus充值",
  ]),
  buildKeywordPage("ChatGPT", "chatgpt-plus-zenme-chong", "ChatGPT Plus怎么充", "购买前判断", [
    "Plus怎么充",
    "ChatGPT Plus国内充值",
  ]),
  buildKeywordPage("ChatGPT", "chatgpt-plus-chongzhi", "ChatGPT Plus充值", "购买前判断", [
    "ChatGPT Plus自助充值",
    "ChatGPT Plus代充",
  ]),
  buildKeywordPage("ChatGPT", "chatgpt-pro-chongzhi", "ChatGPT Pro充值", "产品区别科普", [
    "ChatGPT Pro开通",
    "ChatGPT Pro适合谁",
  ]),
  buildKeywordPage("ChatGPT", "chatgpt-zhifu-shibai", "ChatGPT支付失败", "支付失败排查", [
    "ChatGPT银行卡失败",
    "ChatGPT虚拟卡失败",
  ]),
  buildKeywordPage("ChatGPT", "chatgpt-zhanghao-fengkong", "ChatGPT账号风控", "账号状态检查", [
    "ChatGPT账号异常",
    "ChatGPT账号限制",
  ]),

  buildKeywordPage("Claude", "claude-pro-chongzhi", "Claude Pro充值", "购买前判断", [
    "Claude Pro国内开通",
    "Claude Pro下单前注意",
  ]),
  buildKeywordPage("Claude", "claude-max-chongzhi", "Claude Max充值", "产品区别科普", [
    "Claude Max适合谁",
    "Claude Pro Max区别",
  ]),
  buildKeywordPage("Claude", "claude-organization-id", "Claude组织ID", "账号状态检查", [
    "Claude Organization ID",
    "Claude组织信息",
  ]),
  buildKeywordPage("Claude", "claude-overdue", "Claude overdue欠款", "账号状态检查", [
    "Claude欠款",
    "Claude付款失败",
  ]),
  buildKeywordPage("Claude", "claude-zhifu-shibai", "Claude支付失败", "支付失败排查", [
    "Claude虚拟卡失败",
    "Claude订阅失败",
  ]),
  buildKeywordPage("Claude", "claude-pro-max-qubie", "Claude Pro和Max区别", "产品区别科普", [
    "Claude Pro Max怎么选",
    "Claude会员区别",
  ]),

  buildKeywordPage("Gemini", "gemini-pro-chongzhi", "Gemini Pro充值", "购买前判断", [
    "Gemini Pro国内开通",
    "Gemini会员充值",
  ]),
  buildKeywordPage("Gemini", "gemini-advanced-kaitong", "Gemini Advanced开通", "购买前判断", [
    "Gemini Advanced国内",
    "Google AI会员",
  ]),
  buildKeywordPage("Gemini", "gemini-google-zhanghao-diqu", "Gemini账号地区", "账号状态检查", [
    "Google账号地区",
    "Gemini支付地区",
  ]),
  buildKeywordPage("Gemini", "gemini-zhifu-shibai", "Gemini支付失败", "支付失败排查", [
    "Gemini付款资料",
    "Google付款失败",
  ]),
  buildKeywordPage("Gemini", "gemini-guonei-shiyong", "Gemini国内使用", "使用技巧", [
    "Gemini使用教程",
    "Gemini国内注意事项",
  ]),

  buildKeywordPage("Grok", "grok-zenme-chongzhi", "Grok怎么充值", "购买前判断", [
    "Grok会员充值",
    "Grok国内开通",
  ]),
  buildKeywordPage("Grok", "grok-huiyuan-kaitong", "Grok会员开通", "购买前判断", [
    "Grok开通教程",
    "Grok自助下单",
  ]),
  buildKeywordPage("Grok", "supergrok-chongzhi", "SuperGrok充值", "产品区别科普", [
    "SuperGrok开通",
    "Grok SuperGrok区别",
  ]),
  buildKeywordPage("Grok", "grok-x-premium-guanxi", "Grok和X Premium关系", "产品区别科普", [
    "X Premium Grok",
    "Grok会员权益",
  ]),
  buildKeywordPage("Grok", "grok-zhifu-shibai", "Grok支付失败", "支付失败排查", [
    "Grok付款失败",
    "Grok开通失败",
  ]),
  buildKeywordPage("Grok", "grok-x-zhanghao-zhuangtai", "Grok X账号状态", "账号状态检查", [
    "X账号受限",
    "Grok账号检查",
  ]),
];

export function getSeoKeywordPage(slug: string) {
  return seoKeywordPages.find((page) => page.slug === slug);
}
