export type HelpFaq = {
  id: string;
  category: "下单与交付" | "ChatGPT" | "Claude" | "Grok" | "Gemini" | "网络与安全" | "价格与售后";
  question: string;
  answer: string[];
  checklist?: string[];
  keywords: string[];
};

export const helpFaqs: HelpFaq[] = [
  {
    id: "card-key-valid-time",
    category: "下单与交付",
    question: "卡密会员的兑换时间最晚是多久？",
    answer: [
      "所有充值卡密的有效期通常为一周。收到卡密后，建议尽快按邮件里的充值链接和教程完成兑换，不要长期搁置。",
      "如果暂时不需要使用，未使用的卡密可以联系陈鹏AI服务申请退款。客服核实订单状态后，会按商品说明协助处理。",
    ],
    checklist: ["下单邮箱", "订单号"],
    keywords: ["卡密有效期", "会员卡密兑换", "AI会员卡密退款"],
  },
  {
    id: "order-email",
    category: "下单与交付",
    question: "下单时候的邮箱地址是填 GPT 绑定邮箱，还是自己常用邮箱？",
    answer: [
      "下单邮箱请填写自己常用、能够正常接收邮件的邮箱，不需要填写 GPT 绑定邮箱。",
      "系统会把卡密、充值链接和教程发送到你填写的邮箱。收件箱没有看到时，先检查垃圾箱或垃圾邮件文件夹，部分邮箱会误判过滤。",
      "邮箱填写错误会导致收不到卡密和链接。遇到这种情况，请及时联系客服核实。",
    ],
    checklist: ["下单时使用的邮箱", "订单号", "支付截图"],
    keywords: ["GPT下单邮箱", "ChatGPT卡密收不到", "充值链接发送邮箱"],
  },
  {
    id: "network-tool-recommendation",
    category: "网络与安全",
    question: "你的梯子、魔法、网络工具推荐吗？",
    answer: [
      "陈鹏AI服务本身不销售梯子、魔法或网络服务，也不会公开推荐具体工具。",
      "如果你此前在陈鹏AI服务有过订单或使用记录，可以提供下单邮箱或订单号。经核实为老客户后，客服可以结合你的使用场景做有限建议。",
      "新客户暂不提供此类推荐。网络环境涉及个人设备、地区、节点质量和平台规则，需要自行判断并承担使用风险。",
    ],
    checklist: ["下单时使用的邮箱", "订单号"],
    keywords: ["Claude网络环境", "ChatGPT梯子推荐", "AI会员网络工具"],
  },
  {
    id: "claude-max-ban",
    category: "Claude",
    question: "Claude Max 如果被封号怎么办？",
    answer: [
      "先看你购买的商品详情写的是质保方案还是不质保方案。不同方案的售后边界不同，不能混在一起理解。",
      "如果购买的是质保方案，账号被封后可按商品说明里的质保规则处理，例如补发、换号或其他约定方式，具体以商品介绍为准。",
      "如果购买的是不质保方案，被封号通常不在售后保障范围内。Claude 对网络环境和账号行为比较敏感，下单前一定要看清方案类型。",
    ],
    keywords: ["Claude Max封号", "Claude质保方案", "Claude Max售后"],
  },
  {
    id: "not-received-or-grabbed",
    category: "下单与交付",
    question: "下单了没收货，或者页面显示已被抢怎么办？",
    answer: [
      "这类情况通常是网络波动或页面显示异常，不一定代表订单失败。",
      "先检查下单时填写的邮箱，查看是否已经收到货品邮件；同时检查垃圾箱或垃圾邮件文件夹。",
      "如果确认邮箱没有收到，联系客服提供订单信息，工作人员会核实后手动补发。",
    ],
    checklist: ["下单时使用的邮箱", "支付截图", "订单号"],
    keywords: ["下单没收货", "卡密已被抢", "自动发货没收到"],
  },
  {
    id: "chatgpt-plus-recharge",
    category: "ChatGPT",
    question: "GPT 怎么充值？ChatGPT Plus 怎么开通？",
    answer: [
      "ChatGPT Plus 一键秒充商品支持无需账号密码、自助链接加卡密自动发货。下单后系统会发放自助链接、卡密和视频教程。",
      "整个流程由用户自己按教程操作，一般不需要提供账号密码，更适合重视账号隐私的用户。",
      "购买前请先查看商品详情，确认质保范围、操作方式和适用账号。教程及购买入口：https://gpt3plus.com/item/56",
    ],
    checklist: ["确认能正常登录 ChatGPT", "填写正确下单邮箱", "按邮件教程兑换卡密"],
    keywords: ["GPT怎么充值", "ChatGPT Plus一键秒充", "ChatGPT Plus卡密充值"],
  },
  {
    id: "grok-recharge-id",
    category: "Grok",
    question: "Grok 自助充值的 ID 怎么找不到？",
    answer: [
      "Grok 自助充值需要按教程找到对应 ID，不同入口显示位置可能不一样。",
      "请先参考详细图文和视频教程，按步骤查找 ID 后再提交，避免填错导致处理失败。",
      "Grok 自助充值教程：https://flax-tarantula-1b9.notion.site/Supergrok-AI-31dee85fcdb28002bb99eb114a1cdb1f",
    ],
    keywords: ["Grok自助充值ID", "SuperGrok充值教程", "Grok ID在哪里"],
  },
  {
    id: "why-price-higher",
    category: "价格与售后",
    question: "为什么你们卖得比别人贵一些？",
    answer: [
      "陈鹏AI服务不主打低价，主打长期稳定、靠谱经营和售后支持。价格里包含的不只是商品本身，也包含筛选、交付、风控处理和售后沟通成本。",
      "市场上确实有更低价的产品，但低价往往伴随更多不稳定因素。我们不会为了压低价格牺牲品质和售后边界。",
      "如果你只看最低价，我们可能不一定适合你；如果你更重视长期使用、规则清楚和售后有人处理，可以再看对应商品说明后决定。",
    ],
    keywords: ["AI会员为什么贵", "陈鹏AI服务价格", "ChatGPT代充价格"],
  },
  {
    id: "claude-pro-max-difference",
    category: "Claude",
    question: "Claude 普通会员和 Max 5x / 20x 有什么区别？",
    answer: [
      "主要区别在使用额度。版本越高，可用额度通常越多，适合更高强度的写作、代码、长文档和研究场景。",
      "普通 Claude Pro 适合日常使用；Claude Max 5x / 20x 更适合重度用户。具体额度会受到官方规则调整影响，请以 Claude 官方说明和 gpt3plus.com 商品详情为准。",
      "不要只看名字下单，先判断自己的使用强度。普通用户买太高档可能浪费，重度用户买低档可能很快遇到限制。",
    ],
    keywords: ["Claude Pro Max区别", "Claude Max 5x", "Claude Max 20x"],
  },
  {
    id: "grok-completed-not-showing",
    category: "Grok",
    question: "Grok 卡密充值显示完成，但软件里面没显示怎么办？",
    answer: [
      "这种情况一般与网络延迟、App 缓存或状态刷新有关。先刷新页面，或退出后重新登录 App，再等待片刻查看会员状态。",
      "如果仍然没有显示 SuperGrok 会员状态，请联系客服为你核实处理。处理时通常需要提供下单邮箱，方便定位订单。",
    ],
    checklist: ["下单时使用的邮箱"],
    keywords: ["Grok充值完成没显示", "SuperGrok会员没到账", "Grok卡密充值问题"],
  },
  {
    id: "google-phone-86",
    category: "Gemini",
    question: "谷歌账号可以改成 +86 手机号吗？",
    answer: [
      "可以。Gemini 或 Google 邮箱账号一般支持绑定 +86 手机号。",
      "需要注意的是，该手机号最好此前没有绑定过其他 Google 账号。如果号码已经绑定过多个 Google 账号，可能出现无法重复绑定或验证受限的情况。",
      "涉及 Google 账号安全验证时，以页面实际提示为准，不要频繁重复提交验证码。",
    ],
    keywords: ["Google账号绑定+86", "Gemini账号手机号", "谷歌邮箱手机号修改"],
  },
  {
    id: "android-chatgpt-app",
    category: "ChatGPT",
    question: "GPT 安卓能不能下载 App，怎么下载？",
    answer: [
      "安卓设备可以通过 Google Play 下载 ChatGPT App。建议从 Google Play 这类正规应用商店下载，不要随意安装来源不明的安装包。",
      "通常需要手机具备 Google 服务框架、Google Play 服务、Google Play 商店，并使用可正常访问 Google Play 的外区账号。",
      "具体安装谷歌三件套、注册外区账号属于设备环境问题，步骤较细，建议搜索对应教程自行配置。陈鹏AI服务不提供安装包服务。",
    ],
    keywords: ["ChatGPT安卓App下载", "GPT安卓怎么下载", "Google Play ChatGPT"],
  },
  {
    id: "app-apk",
    category: "网络与安全",
    question: "App 安装包可以发一下吗？",
    answer: [
      "不提供各类 AI 软件安装包。第三方安装包可能存在病毒、篡改、隐私泄露或账号安全风险。",
      "建议通过苹果 App Store 或 Google Play 商店自行搜索下载对应 App。官方应用商店下载更安全，也更容易获得后续更新。",
    ],
    keywords: ["ChatGPT安装包", "Claude安装包", "AI App安全下载"],
  },
  {
    id: "claude-pro-recharge-warranty",
    category: "Claude",
    question: "Claude Pro 怎么代充，质保吗？",
    answer: [
      "Claude Pro 下单前必须仔细查看商品详情。Claude 官方风控相对严格，账号状态和网络环境会明显影响使用体验。",
      "商品详情会写明充值方式、质保时间和售后范围。常见规则是质保期内如遇掉订阅，按未使用天数退还差价，具体以商品介绍为准。",
      "封号通常与用户自身网络环境、频繁切换 IP、账号行为等因素有关，很多商品会明确写明封号不在质保范围内。下单后请保持稳定、合规的网络使用环境。",
    ],
    keywords: ["Claude Pro代充", "Claude Pro质保", "Claude Pro掉订阅"],
  },
  {
    id: "paid-qr-expired",
    category: "下单与交付",
    question: "付款成功了，但是显示付款二维码失效怎么办？",
    answer: [
      "付款成功但页面显示二维码失效，通常是网络波动或支付回调延迟导致的显示异常，不一定影响实际支付结果。",
      "不要重复付款。请先联系客服查询订单，客服会根据支付记录和订单信息核实，并在确认后手动发货。",
    ],
    checklist: ["下单时填写的邮箱", "网站用户名", "支付截图"],
    keywords: ["付款二维码失效", "付款成功没发货", "支付回调延迟"],
  },
  {
    id: "gpt-pro-warranty",
    category: "ChatGPT",
    question: "GPT Pro 下单质保包封号吗？怎么质保？",
    answer: [
      "GPT Pro 的质保范围不能一句话概括，必须以具体商品详情为准。不同商品的处理方式、质保时间、适用账号和不售后情况可能不同。",
      "下单前请认真查看商品介绍。如果看完仍有疑问，再联系客服确认，不要按其他商品的规则套用到 GPT Pro。",
      "任何 AI 会员都受平台规则、账号状态、网络环境和风控策略影响，不建议把质保理解成无条件包所有问题。",
    ],
    keywords: ["GPT Pro质保", "ChatGPT Pro封号", "GPT Pro怎么质保"],
  },
  {
    id: "claude-vpn",
    category: "Claude",
    question: "想买 Claude 账号但没有稳定 VPN，怎么办？",
    answer: [
      "Claude 对网络环境和 IP 纯净度要求相对更高。如果没有稳定网络环境，不建议盲目购买高价值账号或 Max 会员。",
      "我们不推荐具体 VPN 或梯子服务，也不销售网络工具。只能给一个判断标准：尽量选择稳定、纯净、不要频繁变化的网络环境。",
      "如果节点频繁变化、地区跳动明显，Claude 账号更容易触发验证或风控。下单前先把网络环境稳定下来，比买完再处理更重要。",
    ],
    keywords: ["Claude VPN要求", "Claude IP纯净度", "Claude账号封号原因"],
  },
  {
    id: "payment-page-cannot-open",
    category: "下单与交付",
    question: "为什么付款页面打不开？",
    answer: [
      "付款页面打不开一般与支付通道波动、网络缓存或浏览器环境有关。可以重新点击支付页面，或更换支付方式后再试。",
      "如果多次尝试仍无法打开，不建议一直重复提交。请联系客服说明情况，客服会协助判断是支付通道问题还是订单页面异常。",
    ],
    keywords: ["付款页面打不开", "支付页面打不开", "发卡网支付失败"],
  },
  {
    id: "grok-image-video-limit",
    category: "Grok",
    question: "Grok 升级 SuperGrok / Heavy 后可以生成多少图片和视频？",
    answer: [
      "图片和视频生成额度由 xAI 官方动态调整，不是固定不变的数字。不同时间、账号状态和官方策略变化都会影响实际额度。",
      "大致理解：SuperGrok 相比免费版有明显提升，支持图片生成和一定量视频生成；SuperGrok Heavy 的额度通常更高，更适合重度使用需求。",
      "实际额度请以账号内显示为准。不要只按别人当天的测试结果判断，因为官方政策和额度限制可能随时调整。",
    ],
    keywords: ["SuperGrok图片额度", "Grok视频生成额度", "SuperGrok Heavy区别"],
  },
  {
    id: "chatgpt-plus-189-239",
    category: "ChatGPT",
    question: "189 和 239 的 GPT Plus 有什么区别？",
    answer: [
      "189 元通常是自助充值方式，下单后系统自动发放链接和卡密，由用户按教程自己完成充值。",
      "239 元通常是人工代充方式，由工作人员协助操作，适合不想自己动手或对流程不熟的用户。",
      "两种方式的服务内容、质保规则和适用场景不同，请以下单页商品详情为准。不要只看价格，先看自己适合自助操作还是需要人工协助。",
    ],
    keywords: ["GPT Plus 189 239区别", "ChatGPT Plus自助充值", "ChatGPT Plus人工代充"],
  },
];

export const helpCategories = [
  "下单与交付",
  "ChatGPT",
  "Claude",
  "Grok",
  "Gemini",
  "网络与安全",
  "价格与售后",
] as const;
