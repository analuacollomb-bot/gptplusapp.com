import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

type Category = "ChatGPT" | "Claude" | "Gemini" | "Grok";

type ExistingPost = {
  title: string;
  slug: string;
  category: string;
};

type CandidateTopic = {
  title: string;
  slug: string;
  category: Category;
  productId: string;
  productUrl: string;
  issue: Issue;
};

type Issue = {
  label: string;
  slug: string;
  intent: "登录" | "支付" | "会员选择" | "功能使用" | "账号安全" | "取消订阅" | "额度限制" | "国内使用";
  directAnswer: string;
  cause: string;
  steps: [string, string, string];
  mistakes: string[];
  caseNote: string;
};

const rootDir = process.cwd();
const postsDir = path.join(rootDir, "content/posts");
const defaultCount = 10;
const maxSimilarity = 0.7;

const args = new Map(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith("--"))
    .map((arg) => {
      const [key, ...rest] = arg.slice(2).split("=");
      return [key, rest.join("=") || "true"];
    }),
);

const count = Number(args.get("count") ?? process.env.DAILY_ARTICLE_COUNT ?? defaultCount);
const date = args.get("date") ?? getShanghaiDate();

const products: Record<Category, { id: string; url: string; feature: string; account: string }> = {
  ChatGPT: {
    id: "chatgpt-56",
    url: "https://gpt3plus.com/cat/19",
    feature: "通用问答、写作、代码、文件分析和日常办公",
    account: "ChatGPT 账号、Plus / Pro 状态、邮箱和登录环境",
  },
  Claude: {
    id: "claude-33",
    url: "https://gpt3plus.com/",
    feature: "长文、代码阅读、研究总结和高质量写作",
    account: "Claude 账号、Pro / Max 状态、Organization ID 和网络环境",
  },
  Gemini: {
    id: "gemini-36",
    url: "https://gpt3plus.com/",
    feature: "Google 生态、多模态、文档协作和搜索增强",
    account: "Google 账号地区、付款资料、手机号、家庭组和多账号登录状态",
  },
  Grok: {
    id: "grok-25",
    url: "https://gpt3plus.com/",
    feature: "X 生态、实时内容、图片视频生成和热点分析",
    account: "X 账号状态、Grok / SuperGrok 权益、邮箱和地区环境",
  },
};

const issues: Issue[] = [
  {
    label: "付款失败怎么办",
    slug: "payment-failed",
    intent: "支付",
    directAnswer: "先别连续重试，先检查账号状态、支付方式、地区环境和商品规则，再决定是否继续操作。",
    cause:
      "付款失败通常不是单纯银行卡问题。卡片地区、账单资料、平台风控、浏览器缓存、账号历史订阅和网络环境都会影响结果。连续提交付款可能让账号和支付方式进入更敏感状态。",
    steps: [
      "先确认账号能正常登录，查看当前会员状态、历史订阅和是否有欠费。",
      "换浏览器或清理缓存后重新进入付款页，不要短时间内连续多次提交。",
      "如果仍然失败，保留下单邮箱、支付截图和页面提示，再联系对应客服核对。",
    ],
    mistakes: ["只看银行卡余额，不看账单地址和平台提示。", "付款失败后连续换卡硬试。", "没看商品说明就直接下单。"],
    caseNote:
      "有用户信用卡连续失败后又换虚拟卡继续试，结果账号订阅页变得更敏感。后来先停一天，固定网络环境，再核对商品说明，处理过程反而更顺。",
  },
  {
    label: "登录失败怎么办",
    slug: "login-failed",
    intent: "登录",
    directAnswer: "先固定网络和设备，再检查邮箱、验证码、账号安全提示，不要反复乱输密码。",
    cause:
      "登录失败常见原因包括邮箱验证码收不到、网络地区变化、设备缓存异常、账号安全验证和平台临时风控。很多用户把登录失败误认为账号坏了，实际只是环境和验证没有处理好。",
    steps: [
      "固定一个稳定网络环境，避免频繁切换 IP、地区和设备。",
      "检查邮箱是否能正常收验证码，必要时查看垃圾箱和拦截规则。",
      "记录页面提示和截图，再判断是账号问题、网络问题还是平台临时限制。",
    ],
    mistakes: ["短时间内频繁尝试登录。", "用不同设备和节点来回切换。", "收不到验证码就马上判定账号失效。"],
    caseNote:
      "实际客服里常见一种情况：用户换了三四个节点登录，越试越难进。固定常用环境、等安全验证冷却后，反而能正常进入。",
  },
  {
    label: "值得买吗",
    slug: "worth-buying",
    intent: "会员选择",
    directAnswer: "如果只是偶尔体验，不建议急着买；如果每天高频使用，会员才更容易体现价值。",
    cause:
      "会员是否值得买，核心看使用频率和任务强度。写作、代码、文件处理、研究、办公自动化这类高频场景更容易回本；偶尔聊天、尝鲜或只问简单问题，免费版或普通账号通常已经够用。",
    steps: [
      "先列出每天真实会用到的任务，不要按别人推荐盲买。",
      "判断任务是否需要更高额度、更稳定模型或高级功能。",
      "再对照商品说明，看自己适合自助充值、人工处理还是暂时不买。",
    ],
    mistakes: ["看到别人说好就直接买。", "买最高版本但每天只问几句。", "把会员当成自动赚钱工具。"],
    caseNote:
      "有自媒体用户每天要写提纲、改标题、扩展素材，会员价值很明显；也有用户买完只问天气和翻译，两天后就觉得浪费。",
  },
  {
    label: "和免费版区别是什么",
    slug: "free-vs-paid",
    intent: "会员选择",
    directAnswer: "付费版主要差在额度、模型能力、稳定性和高级功能，不是所有人都必须升级。",
    cause:
      "免费版适合轻度体验，付费版更适合持续工作。区别通常体现在使用次数、模型能力、文件处理、多模态能力、响应稳定性和功能入口。不同平台的免费与付费边界会变化，要以页面实际显示为准。",
    steps: [
      "先用免费版跑一周真实任务，记录遇到的限制。",
      "只在限制影响工作效率时考虑付费会员。",
      "升级前看清商品对应的是账号、会员、代充还是成品号。",
    ],
    mistakes: ["以为付费后所有限制都会消失。", "没搞清商品类型就下单。", "把不同平台的会员规则混在一起比较。"],
    caseNote:
      "不少用户真正需要的不是更贵版本，而是会用提示词和文件流程。先把免费版用到瓶颈，再升级，判断会更准。",
  },
  {
    label: "提示 Something Went Wrong 怎么办",
    slug: "something-went-wrong",
    intent: "功能使用",
    directAnswer: "先刷新、换浏览器、清缓存，再检查网络和账号状态；不要马上重复付款或重置账号。",
    cause:
      "这类提示通常比较泛，可能来自页面缓存、接口波动、网络不稳定、账号验证或平台临时异常。它不一定代表账号被封，也不一定代表会员失效。",
    steps: [
      "先刷新页面或退出重新登录，确认是不是临时显示异常。",
      "换浏览器、关闭插件、清理缓存后再试一次。",
      "如果仍然出现，记录具体时间、截图和操作路径，再做进一步排查。",
    ],
    mistakes: ["看到英文错误就立刻重买会员。", "不截图，后续无法定位。", "同时在多个设备反复操作。"],
    caseNote:
      "有用户在浏览器插件冲突时一直报错，换无痕窗口后恢复正常。问题不在账号，而在本地浏览器环境。",
  },
  {
    label: "账号会封吗",
    slug: "account-ban-risk",
    intent: "账号安全",
    directAnswer: "任何平台账号都有风控可能，关键是网络稳定、合规使用、别频繁切换环境。",
    cause:
      "账号风控和封号通常与平台规则、注册来源、登录环境、IP 变化、异常行为、批量特征和支付记录有关。没有任何教程或服务能承诺绝对不封。",
    steps: [
      "使用前固定常用网络和设备，不要一天内频繁切换地区。",
      "避免违规内容、批量操作和异常共享。",
      "购买前看清商品是质保方案还是不质保方案。",
    ],
    mistakes: ["把质保理解成无条件包封号。", "使用不稳定网络还要求长期无风险。", "账号异常后继续高频操作。"],
    caseNote:
      "Claude 类账号里，封号常与网络变化有关。很多售后争议不是充值动作，而是用户后续登录环境过于跳跃。",
  },
  {
    label: "如何取消订阅",
    slug: "cancel-subscription",
    intent: "取消订阅",
    directAnswer: "进入对应平台的订阅或账单页面取消自动续费，取消前先确认当前周期和账号状态。",
    cause:
      "取消订阅不是删除账号。很多用户混淆取消自动续费、退款、会员到期和账号注销。不同平台入口不同，但核心都在订阅、账单或账户设置里。",
    steps: [
      "登录目标账号，进入设置、账户或订阅页面。",
      "确认当前会员周期、续费时间和是否存在欠款。",
      "取消自动续费后保存页面截图，后续以账号内显示为准。",
    ],
    mistakes: ["以为卸载 App 就等于取消订阅。", "取消后马上要求会员立刻消失。", "没保存截图导致后续无法核对。"],
    caseNote:
      "常见情况是用户在 App 里找不到订阅入口，实际订阅绑定在网页端或应用商店账户里。先确认支付路径，才能找到正确取消入口。",
  },
  {
    label: "提示 Usage Limit 怎么办",
    slug: "usage-limit",
    intent: "额度限制",
    directAnswer: "Usage Limit 多数是额度限制，先等待刷新周期，不要误以为账号坏了。",
    cause:
      "Usage Limit 通常表示当前模型、功能或会员等级的额度用完。额度会按平台规则重置，不同版本、模型和功能的限制不同，官方也可能动态调整。",
    steps: [
      "先确认提示出现在哪个模型或功能里。",
      "等待额度重置，或切换到可用模型继续处理轻任务。",
      "如果经常碰到限制，再考虑是否需要更高版本会员。",
    ],
    mistakes: ["把额度限制当成封号。", "为了绕限制频繁切账号。", "只看别人额度，不看自己账号内实际显示。"],
    caseNote:
      "重度写作和代码用户更容易碰到额度限制。与其临时抱怨，不如根据一周使用量判断是否升级更高版本。",
  },
  {
    label: "国内如何使用",
    slug: "domestic-use",
    intent: "国内使用",
    directAnswer: "国内使用重点不是某一个按钮，而是账号、网络、邮箱和支付路径都要稳定。",
    cause:
      "国内用户常见问题集中在访问环境、邮箱验证、支付失败、账号地区、App 下载和平台风控。不同工具规则不同，不能用一个平台经验套所有平台。",
    steps: [
      "先确认账号可以稳定登录，邮箱能正常收验证码。",
      "固定常用网络和设备，减少频繁切换带来的风控。",
      "下单前看商品说明，确认适用账号、质保和售后边界。",
    ],
    mistakes: ["只问能不能用，不看自己账号状态。", "把网络工具、账号、会员问题混在一起。", "不看商品说明就下单。"],
    caseNote:
      "很多售后不是产品本身问题，而是邮箱填错、账号状态不符或用户网络变化太大。先把基础条件稳定，后面会少很多麻烦。",
  },
  {
    label: "文件上传失败怎么办",
    slug: "file-upload-failed",
    intent: "功能使用",
    directAnswer: "先看文件格式、大小、网络和会员权限，再判断是不是平台临时异常。",
    cause:
      "文件上传失败可能来自文件过大、格式不支持、浏览器权限、网络中断、模型限制或会员功能不可用。不要只凭一次失败就判断账号有问题。",
    steps: [
      "换一个小文件测试，确认是不是文件本身问题。",
      "检查浏览器权限、网络稳定性和当前模型是否支持上传。",
      "如果多个文件都失败，再截图记录提示并等待平台恢复或联系客服。",
    ],
    mistakes: ["直接上传超大文件。", "不知道不同模型功能入口不同。", "用手机端和网页端结果不同就误判会员失效。"],
    caseNote:
      "有用户上传失败是因为文件名含特殊符号和体积过大，压缩后换网页端就正常了，不需要重新开会员。",
  },
  {
    label: "适合写代码吗",
    slug: "coding-use",
    intent: "功能使用",
    directAnswer: "适合，但要给清楚需求、报错和项目结构，不能只丢一句“帮我写个网站”。",
    cause:
      "AI 写代码的效果取决于需求清晰度。框架、页面、数据、接口、部署环境和报错信息越明确，输出越能落地。只给一句模糊需求，结果通常也会很虚。",
    steps: [
      "先写清楚项目目标、技术栈、页面和功能范围。",
      "遇到报错时提供完整错误信息和相关文件路径。",
      "每次只让 AI 改一个明确问题，改完就本地验证。",
    ],
    mistakes: ["一次性要求生成完整商业系统。", "不测试代码，只看界面截图。", "报错只说跑不起来，不给日志。"],
    caseNote:
      "真实项目里，AI 最适合做页面、脚本、接口和排错协助。能不能上线，取决于你是否愿意一步步验证。",
  },
];

const titleSubjects: Record<Category, string[]> = {
  ChatGPT: ["ChatGPT Plus", "ChatGPT Pro", "ChatGPT 账号", "ChatGPT App", "ChatGPT 记忆功能", "ChatGPT 文件上传"],
  Claude: ["Claude Pro", "Claude Max", "Claude Code", "Claude 账号", "Claude 长文生成", "Claude Usage Limit"],
  Gemini: ["Gemini Advanced", "Gemini Pro", "Google AI 会员", "Gemini 账号", "Gemini App", "Gemini 多模态"],
  Grok: ["Grok", "SuperGrok", "Grok Heavy", "Grok 账号", "Grok 图片生成", "Grok 视频生成"],
};

async function main() {
  await fs.mkdir(postsDir, { recursive: true });
  const existing = await loadExistingPosts();
  const candidates = buildCandidates();
  const selected: CandidateTopic[] = [];

  for (const candidate of candidates) {
    if (selected.length >= count) {
      break;
    }

    const titleTooSimilar = existing.some((post) => similarity(candidate.title, post.title) >= maxSimilarity);
    const selectedTooSimilar = selected.some((post) => similarity(candidate.title, post.title) >= maxSimilarity);
    const slugExists = existing.some((post) => post.slug === candidate.slug) || selected.some((post) => post.slug === candidate.slug);

    if (titleTooSimilar || selectedTooSimilar || slugExists) {
      continue;
    }

    selected.push(candidate);
  }

  if (selected.length < count) {
    throw new Error(`候选题不足：需要 ${count} 篇，只找到 ${selected.length} 篇。请扩充 titleSubjects 或 issues。`);
  }

  const created: string[] = [];
  for (const topic of selected) {
    const filePath = path.join(postsDir, `${topic.slug}.md`);
    const related = pickRelated(existing, topic.category, topic.slug);
    const body = renderArticle(topic, related);
    await fs.writeFile(filePath, body, "utf8");
    created.push(`${topic.title} -> content/posts/${topic.slug}.md`);
    existing.push({ title: topic.title, slug: topic.slug, category: topic.category });
  }

  console.log(JSON.stringify({ date, count: created.length, created }, null, 2));
}

async function loadExistingPosts(): Promise<ExistingPost[]> {
  const files = await fs.readdir(postsDir).catch(() => []);
  const posts: ExistingPost[] = [];

  for (const file of files) {
    if (!file.endsWith(".md") && !file.endsWith(".mdx")) {
      continue;
    }

    const raw = await fs.readFile(path.join(postsDir, file), "utf8");
    const parsed = matter(raw);
    const title = String(parsed.data.title ?? "").trim();
    const slug = String(parsed.data.slug ?? file.replace(/\.(md|mdx)$/i, "")).trim();
    const category = String(parsed.data.category ?? "").trim();

    if (title && slug) {
      posts.push({ title, slug, category });
    }
  }

  return posts;
}

function buildCandidates() {
  const candidates: CandidateTopic[] = [];
  const dayNumber = Number(date.replaceAll("-", ""));
  const categories: Category[] = ["ChatGPT", "Claude", "Gemini", "Grok"];

  for (const category of categories) {
    for (const subject of titleSubjects[category]) {
      for (const issue of issues) {
        if (!isCompatibleTopic(subject, issue)) {
          continue;
        }

        const title = `${subject}${issue.label}`;
        const slug = `daily-${date}-${slugify(`${subject}-${issue.slug}`)}`;
        candidates.push({
          title,
          slug,
          category,
          productId: products[category].id,
          productUrl: products[category].url,
          issue,
        });
      }
    }
  }

  return candidates.sort((a, b) => {
    const scoreA = stableScore(`${date}-${a.category}-${a.title}`, dayNumber);
    const scoreB = stableScore(`${date}-${b.category}-${b.title}`, dayNumber);
    return scoreA - scoreB;
  });
}

function isCompatibleTopic(subject: string, issue: Issue) {
  const isFeature = /文件上传|记忆功能|图片生成|视频生成|多模态/.test(subject);
  const isApp = /App/.test(subject);
  const isAccount = /账号/.test(subject);
  const isCode = /Code/.test(subject);
  const isCoreProduct = !isFeature && !isApp && !isAccount && !/Usage Limit/.test(subject);

  if (issue.slug === "worth-buying") {
    return isCoreProduct;
  }

  if (issue.slug === "free-vs-paid") {
    return isCoreProduct;
  }

  if (issue.slug === "payment-failed") {
    return isCoreProduct || isAccount;
  }

  if (issue.slug === "login-failed") {
    return isCoreProduct || isAccount || isApp;
  }

  if (issue.slug === "account-ban-risk") {
    return isCoreProduct || isAccount;
  }

  if (issue.slug === "cancel-subscription") {
    return isCoreProduct;
  }

  if (issue.slug === "usage-limit") {
    return isCoreProduct || /Usage Limit/.test(subject);
  }

  if (issue.slug === "domestic-use") {
    return isCoreProduct || isAccount || isApp;
  }

  if (issue.slug === "file-upload-failed") {
    return isCoreProduct || /文件上传|多模态/.test(subject);
  }

  if (issue.slug === "coding-use") {
    return isCode || /ChatGPT Plus|ChatGPT Pro|Claude Pro|Claude Max/.test(subject);
  }

  if (issue.slug === "something-went-wrong") {
    return isCoreProduct || isFeature || isApp;
  }

  return !isFeature || issue.intent === "功能使用";
}

function renderArticle(topic: CandidateTopic, related: ExistingPost[]) {
  const profile = products[topic.category];
  const keywords = [
    topic.title,
    `${topic.category}教程`,
    `${topic.category}帮助中心`,
    "AI工具使用问题",
  ];
  const description = `${topic.title}：直接回答原因、解决方法、常见误区和实际经验，帮助国内用户先判断账号、网络、支付和会员规则。`;
  const relatedLines =
    related.length > 0
      ? related.map((post) => `- [${post.title}](/blog/${post.slug})`).join("\n")
      : `- [${topic.category} 专题页](/${topic.category.toLowerCase()})`;

  return `---\ntitle: \"${escapeYaml(topic.title)}\"\ndescription: \"${escapeYaml(description)}\"\ncategory: \"${topic.category}\"\nslug: \"${topic.slug}\"\ndate: \"${date}\"\nupdatedAt: \"${date}\"\nkeywords: ${JSON.stringify(keywords)}\nproductId: \"${topic.productId}\"\nproductUrl: \"${topic.productUrl}\"\n---\n\n# ${topic.title}\n\n## 一句话答案\n\n${topic.issue.directAnswer}\n\n---\n\n## 问题原因\n\n${topic.issue.cause}\n\n对 ${topic.category} 来说，还要特别看 ${profile.account}。很多用户以为问题出在单个按钮或单次操作，实际是账号、网络、会员权限和平台策略共同作用。${topic.category} 适合处理 ${profile.feature}，但前提是基础账号状态正常，且你理解当前会员能做什么、不能做什么。\n\n如果你是国内用户，判断顺序建议固定下来：先看账号能不能正常登录，再看当前会员或订阅状态，再看网络是否稳定，最后才判断是否需要购买或续费。顺序错了，就容易把一个小问题拖成售后问题。\n\n---\n\n## 解决方法\n\n步骤1：${topic.issue.steps[0]}\n\n步骤2：${topic.issue.steps[1]}\n\n步骤3：${topic.issue.steps[2]}\n\n处理时不要急着追求最快路径。AI 工具的问题往往不是“点哪里”这么简单，而是要先把账号状态、设备环境、网络、邮箱、支付和商品说明放在一起看。能自己解决就自己处理，不能判断时再找客服核对，沟通效率会高很多。\n\n---\n\n## 常见误区\n\n${topic.issue.mistakes.map((item) => `- ${item}`).join("\n")}\n- 不保存截图、不记录订单信息，后续排查时只能凭印象描述。\n- 把别人的成功经验直接套到自己的账号上，没有看自己的状态和限制。\n\n---\n\n## 实际经验分享\n\n${topic.issue.caseNote}\n\n我更建议把这类问题当成“排查题”，不要当成“运气题”。同样是 ${topic.title.replace(/[？?]$/u, "")}，新号、老号、成品号、自己账号、App 端和网页端的处理路径都可能不一样。先定位问题层级，再决定下一步，通常比反复试更稳。\n\n---\n\n## 相关问题\n\n${relatedLines}\n\n---\n\n## 关于陈鹏AI服务\n\n陈鹏AI服务专注于ChatGPT、Claude、Gemini、Grok等AI工具教程与帮助内容。\n\n本文仅用于知识分享与问题解答。\n`;
}

function pickRelated(posts: ExistingPost[], category: Category, currentSlug: string) {
  return posts
    .filter((post) => post.category === category && post.slug !== currentSlug)
    .sort((a, b) => a.title.length - b.title.length)
    .slice(0, 4);
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 92);
}

function normalizeTitle(input: string) {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .replace(/plus/g, "+")
    .trim();
}

function similarity(a: string, b: string) {
  const left = normalizeTitle(a);
  const right = normalizeTitle(b);
  if (!left || !right) {
    return 0;
  }
  if (left === right) {
    return 1;
  }
  const distance = levenshtein(left, right);
  return 1 - distance / Math.max(left.length, right.length);
}

function levenshtein(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

function stableScore(input: string, salt: number) {
  let score = salt;
  for (const char of input) {
    score = (score * 33 + char.charCodeAt(0)) >>> 0;
  }
  return score;
}

function getShanghaiDate() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

function escapeYaml(input: string) {
  return input.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
