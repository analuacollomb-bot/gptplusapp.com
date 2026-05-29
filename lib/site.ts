import {
  BookOpen,
  Bot,
  BrainCircuit,
  CheckCircle2,
  CircleHelp,
  Compass,
  CreditCard,
  FileCheck2,
  Gem,
  Globe2,
  Landmark,
  LifeBuoy,
  LockKeyhole,
  MessageCircle,
  ScrollText,
  ShieldAlert,
  Sparkles,
  UserCheck,
  WalletCards,
  Zap,
} from "lucide-react";
import { siteContent } from "@/content/site";

export const siteConfig = {
  name: siteContent.siteName,
  chineseBrand: siteContent.brandName,
  domain: siteContent.domain,
  url: siteContent.baseUrl,
  productUrl: siteContent.primaryCtaUrl,
  telegramUrl: siteContent.telegramUrl,
  wechatId: siteContent.wechatId,
  serviceHours: siteContent.serviceHours,
  orderQueryUrl: siteContent.orderQueryUrl,
  avatar: siteContent.avatar,
  serviceIntro: siteContent.serviceIntro,
  slogan: siteContent.slogan,
  description: siteContent.heroSubtitle,
};

export const navItems = siteContent.navigation;

export type CategorySlug = "chatgpt" | "claude" | "gemini" | "grok";

export const categories = [
  {
    slug: "chatgpt",
    path: "/chatgpt",
    name: "ChatGPT",
    title: "ChatGPT Plus / Pro",
    topicTitle: "ChatGPT 会员教程",
    eyebrow: "OpenAI 会员订阅",
    description:
      "围绕 ChatGPT Plus、Pro 的国内开通方式、支付失败原因、订阅状态检查、账号风控和下单前准备进行整理。",
    summary:
      "适合需要稳定使用 GPT-4o、深度研究、文件分析、语音与高级模型能力的用户。下单前重点确认账号状态、欠款、登录环境和商品规则。",
    oneLine: "从 Plus / Pro 区别、支付失败、账号风控到自助下单前检查。",
    suitableFor: [
      "需要通用问答、写作、代码、文件处理和办公提效的用户",
      "已经有 ChatGPT 账号，但官方信用卡订阅失败的用户",
      "想先判断 Plus / Pro 是否适合自己，再决定是否下单的用户",
    ],
    commonIssues: [
      "银行卡或虚拟卡无法通过订阅扣款",
      "账号曾经开通过 Plus，当前状态不清楚",
      "overdue 欠款或历史账单导致新的订阅动作受阻",
      "登录环境变化后触发安全验证或平台风控",
    ],
    beforeOrder:
      "重点看账号是否能正常登录、当前是否为 Free 或符合商品要求、是否有未结清欠款，以及是否已经阅读商品说明。",
    faq: [
      {
        question: "Plus 和 Pro 怎么选？",
        answer:
          "大多数普通用户先看 Plus 是否满足需求；Pro 更适合高频、重度和明确需要更高额度的用户。不要只按热度选择，先看自己的使用频率和预算。",
      },
      {
        question: "支付失败后能马上换方式继续试吗？",
        answer:
          "不建议连续反复尝试。先确认卡片、账单、账号状态和登录环境，避免把问题从支付失败扩大成账号风控。",
      },
    ],
    icon: Bot,
  },
  {
    slug: "claude",
    path: "/claude",
    name: "Claude",
    title: "Claude Pro / Max",
    topicTitle: "Claude 会员教程",
    eyebrow: "Anthropic 会员订阅",
    description:
      "整理 Claude Pro、Max 开通前的注意事项、组织 ID、账号环境、地区限制和常见风控问题。",
    summary:
      "适合重度写作、代码阅读、长文档处理和偏好 Claude 风格输出的用户。Claude 的账号状态和组织信息需要格外核对。",
    oneLine: "讲清 Pro / Max、Free 状态、overdue 欠款和 Organization ID。",
    suitableFor: [
      "需要长文档分析、写作润色、代码阅读和研究整理的用户",
      "准备开 Claude Pro / Max，但不确定账号状态是否适合的用户",
      "看到商品要求 Organization ID，却不知道如何判断的用户",
    ],
    commonIssues: [
      "当前已经是 Pro / Max，却按 Free 新开商品下单",
      "历史订阅扣款失败形成 overdue 欠款",
      "混淆 Claude 网页会员、API、组织和工作区",
      "Organization ID 填成邮箱、昵称或订单号",
    ],
    beforeOrder:
      "Claude 页面重点核对 Free / Pro / Max 状态、overdue 欠款、Organization ID，以及商品是否支持当前账号。",
    faq: [
      {
        question: "当前是 Pro / Max 还能下单吗？",
        answer:
          "不一定。很多商品只适合指定账号状态。当前已经是 Pro / Max 时，先看商品说明，无法判断再联系客服确认。",
      },
      {
        question: "Organization ID 是密码吗？",
        answer:
          "不是。它是组织或工作区相关识别信息，不是密码、验证码，也不是订单号。不要把敏感验证码当作组织信息提交。",
      },
    ],
    icon: BrainCircuit,
  },
  {
    slug: "gemini",
    path: "/gemini",
    name: "Gemini",
    title: "Gemini Pro / Advanced",
    topicTitle: "Gemini 会员教程",
    eyebrow: "Google AI 服务",
    description:
      "说明 Gemini Pro / Advanced 国内使用前的账号、地区、支付、Google 生态联动和常见异常场景。",
    summary:
      "适合需要 Google 生态、文档协作、搜索增强和多模态能力的用户。重点关注 Google 账号地区、付款资料和访问环境。",
    oneLine: "围绕 Google 账号地区、付款资料、生态入口和国内使用注意事项。",
    suitableFor: [
      "需要 Google 生态、文档协作、搜索增强和多模态能力的用户",
      "浏览器里登录多个 Google 账号，容易看错会员状态的用户",
      "担心地区、付款资料、家庭组或账号安全影响开通的用户",
    ],
    commonIssues: [
      "下单邮箱和实际登录的 Google 账号不是同一个",
      "付款资料地区混乱或历史账单状态不清楚",
      "工作/学校账号受管理员策略限制",
      "家庭组、年龄或地区设置影响服务可用性",
    ],
    beforeOrder:
      "先确认目标 Google 邮箱、账号地区、付款资料和当前订阅状态，不要在多账号登录环境下误判。",
    faq: [
      {
        question: "Gemini Pro / Advanced 适合谁？",
        answer:
          "更适合依赖 Google 生态、文档、搜索和多模态场景的用户。如果主要需求是通用聊天或写作，也可以和 ChatGPT、Claude 对比后再选。",
      },
      {
        question: "Google 账号地区会影响开通吗？",
        answer:
          "通常会。地区、付款资料、家庭组和账号安全状态都可能影响订阅与使用体验。",
      },
    ],
    icon: Gem,
  },
  {
    slug: "grok",
    path: "/grok",
    name: "Grok",
    title: "Grok / SuperGrok",
    topicTitle: "Grok 会员教程",
    eyebrow: "xAI / X 生态",
    description:
      "讲清 Grok 与 SuperGrok 的开通路径、账号要求、X 账号状态、支付异常和下单前风险提示。",
    summary:
      "适合经常使用 X、关注实时内容和希望体验 xAI 模型的用户。下单前需要确认 X 账号状态、邮箱和商品说明。",
    oneLine: "重点判断 X 账号状态、Grok / SuperGrok 区别和开通前准备。",
    suitableFor: [
      "经常使用 X，关注实时内容和 xAI 模型体验的用户",
      "想区分 Grok、SuperGrok 与 X 生态订阅关系的用户",
      "X 账号曾出现验证、限制或订阅状态不清楚的用户",
    ],
    commonIssues: [
      "X 账号本身存在安全限制或异常活动提示",
      "混淆 Grok、SuperGrok 和 X Premium 相关权益",
      "只提交昵称，未按商品说明提交账号信息",
      "地区、IP、设备环境变化后触发额外验证",
    ],
    beforeOrder:
      "先确认 X 账号能正常登录、邮箱可用、没有明显限制，再看商品对应的是 Grok、SuperGrok 还是其他生态权益。",
    faq: [
      {
        question: "Grok 和 SuperGrok 是一回事吗？",
        answer:
          "不是所有场景都能简单等同。不同商品可能对应不同入口和权益，购买前要看清商品说明。",
      },
      {
        question: "X 账号受限还能开通吗？",
        answer:
          "不建议直接下单。账号受限属于基础状态问题，充值不一定能解决，应先确认账号能正常登录和使用。",
      },
    ],
    icon: Zap,
  },
] as const;

export const trustTags = siteContent.heroTags;

export const coverageStats = [
  { label: "覆盖产品", value: "4 大 AI 工具", description: "ChatGPT / Claude / Gemini / Grok" },
  { label: "教程分类", value: "充值 / 支付 / 风控 / 账号", description: "围绕下单前最关键的问题整理" },
  { label: "下单方式", value: "自助下单", description: "跳转成交主站查看商品说明" },
  { label: "服务支持", value: "人工客服协助", description: "售前确认与售后排查更清楚" },
];

export const failureReasons = [
  {
    title: "海外支付限制",
    description:
      "部分平台对银行卡发行地区、账单地址、3D 验证和订阅扣款规则要求较高，国内常见卡片可能无法通过。",
    icon: CreditCard,
  },
  {
    title: "地区/IP 环境",
    description:
      "账号地区、登录环境和支付环境不一致时，平台可能要求重新验证，甚至临时限制订阅或支付。",
    icon: Globe2,
  },
  {
    title: "账号状态异常",
    description:
      "频繁切换设备、长时间未登录、异常登录提醒、历史退款或安全验证未完成，都可能影响会员开通。",
    icon: LockKeyhole,
  },
  {
    title: "自动续费欠款",
    description:
      "如果原订阅扣款失败形成 overdue 欠款，需要先处理账单问题，再判断是否适合继续下单。",
    icon: WalletCards,
  },
  {
    title: "平台风控策略",
    description:
      "AI 平台会动态调整风控策略，充值前只能降低风险，不能承诺完全规避平台审核。",
    icon: ShieldAlert,
  },
  {
    title: "不同产品规则不同",
    description:
      "ChatGPT、Claude、Gemini、Grok 的账号体系和售后规则并不相同，不能用同一套经验直接套用。",
    icon: FileCheck2,
  },
];

export const comparisonRows = [
  {
    method: "官方信用卡订阅",
    difficulty: "中等偏高",
    cost: "通常接近官方价格",
    risk: "取决于卡片、地区与账号状态",
    audience: "有可用海外卡、熟悉账单地址和订阅管理的用户",
    notes: "需要自行处理扣款失败、续费、退款和地区验证问题。",
  },
  {
    method: "虚拟卡",
    difficulty: "较高",
    cost: "除订阅费外可能有开卡、充值、汇率等成本",
    risk: "卡段、余额、账单地址和平台风控都会影响结果",
    audience: "愿意研究支付流程、能接受试错成本的用户",
    notes: "不建议只看单次价格，需考虑长期续费和卡片可用性。",
  },
  {
    method: "礼品卡",
    difficulty: "中等",
    cost: "受来源、汇率和库存影响",
    risk: "不同平台支持情况不同，且可能存在地区限制",
    audience: "目标产品明确支持礼品卡或兑换码的用户",
    notes: "购买前要确认礼品卡地区、适用范围和是否支持目标会员。",
  },
  {
    method: "第三方自助充值",
    difficulty: "较低",
    cost: "通常包含服务成本",
    risk: "仍受账号状态、平台规则和商品说明影响",
    audience: "不想折腾复杂支付流程，希望按说明自助下单的用户",
    notes: "适合先读清楚商品规则、售后边界和账号要求后再决定购买。",
  },
];

export const preOrderChecklist = [
  "✅嗨客户朋友你好！注意：网站首次访问较慢，多刷新1下即可打开…（挂🪜翻墙更快，能买~）",
  "✅下单前请先阅读商品说明（每件商品已写清使用方式/注意事项/常见问题），看完再下单更省时间。",
  "✅本网站提供的账号仅限学习与研究使用，严禁任何违规行为。",
  "✅所有账号渠道开通，支持长期使用与续费。",
  "✅微信客服：dcpluspro（商务合作或售前售后咨询，添加请备注来意；早10点，晚24点）",
  "✅如果遇到未付款，刷新网页就行，这是支付回调问题，还无法联系我们的客服！",
  "✅提醒仿冒网站，仿冒客服，保护您的资金安全！",
  "✅【其他说明】本店靠谱经营，优质售后，上线已超过1年。购买前看清楚商品描述，不看商品描述导致的问题一概不售后！虚拟产品售出不支持退款",
  "✅请填写正确的下单邮箱，否则无法查询订单、无法收到商品，请注意！⚠",
];

export const processSteps = [
  {
    title: "查看教程与商品说明",
    description: "先看清产品差异、账号要求、处理方式和售后边界，不急着付款。",
    icon: ScrollText,
  },
  {
    title: "确认账号状态与风险说明",
    description: "核对 Free / Pro / Max、overdue、登录验证、地区环境和商品适用范围。",
    icon: UserCheck,
  },
  {
    title: "前往发卡网自助下单",
    description: "确认符合规则后再跳转自助下单，并按订单页教程提交必要信息。",
    icon: Landmark,
  },
];

export const scenarioCards = [
  {
    title: "第一次开通 AI 会员的新手",
    description:
      "最常见的问题不是不会付款，而是不知道账号状态、商品规则和售后边界该怎么看。",
  },
  {
    title: "经常支付失败的用户",
    description:
      "需要先判断是卡片、账单地址、地区、overdue 还是平台风控，不建议连续硬试。",
  },
  {
    title: "需要 Claude 写作/代码的用户",
    description:
      "重点确认 Claude Pro / Max、Free 状态、Organization ID 和历史订阅状态。",
  },
  {
    title: "需要 Grok/X 生态的用户",
    description:
      "需要先看 X 账号是否稳定，分清 Grok、SuperGrok 和相关生态权益。",
  },
  {
    title: "需要 Gemini/Google 生态的用户",
    description:
      "Google 账号地区、付款资料、家庭组和多账号登录都可能影响判断。",
  },
];

export const homeFaqs = siteContent.faqList.slice(0, 4);

export const fullFaqs = siteContent.faqList;

export const footerColumns = [
  {
    title: "产品专题",
    links: categories.map((category) => ({
      label: category.title,
      href: category.path,
    })),
  },
  {
    title: "知识库",
    links: [
      { label: "关键词专题", href: "/topics" },
      { label: "实时博客", href: "/telegram" },
      { label: "全部教程", href: "/blog" },
      { label: "商品入口", href: "/products" },
      { label: "用户反馈", href: "/reviews" },
      { label: "常见问题", href: "/faq" },
      { label: "关于我们", href: "/about" },
      { label: "联系客服", href: "/contact" },
      { label: "站长维护说明", href: "/admin-content-guide" },
    ],
  },
  {
    title: "服务入口",
    links: [
      { label: "自助下单入口", href: siteConfig.productUrl, external: true },
      { label: "Telegram 频道", href: siteConfig.telegramUrl, external: true },
      { label: "陈鹏AI服务", href: siteConfig.productUrl, external: true },
    ],
  },
];

export const iconMap = {
  BookOpen,
  CheckCircle2,
  CircleHelp,
  Compass,
  LifeBuoy,
  MessageCircle,
  Sparkles,
};

export function getCategoryBySlug(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export function getCategoryByName(name: string) {
  return categories.find(
    (category) => category.name.toLowerCase() === name.toLowerCase(),
  );
}
