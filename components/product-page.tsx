import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  CircleHelp,
  MessageCircle,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  WalletCards,
} from "lucide-react";
import { ArticleCard } from "@/components/article-card";
import { ButtonLink } from "@/components/button-link";
import { ComparisonTable } from "@/components/comparison-table";
import { CtaBand } from "@/components/cta-band";
import { SectionHeading } from "@/components/section-heading";
import { getProductsByCategory } from "@/content/products";
import { getPostsByCategory } from "@/lib/posts";
import {
  failureReasons,
  getCategoryBySlug,
  preOrderChecklist,
  processSteps,
  siteConfig,
  type CategorySlug,
} from "@/lib/site";

const productHero = {
  chatgpt: {
    label: "陈鹏AI服务 · ChatGPT 会员",
    title: "ChatGPT Plus 稳定代充",
    accent: "稳定靠谱",
    subtitle:
      "不用自己折腾外卡和复杂订阅流程。先确认账号状态，再按商品说明自助下单，适合需要 Plus / Pro 能力、又想减少支付失败折腾的用户。",
    primary: "立即充值",
    secondary: "查询订单",
    reassurance: "稳定代充 / 正规渠道 / 支持续费 / 售后协助",
  },
  claude: {
    label: "陈鹏AI服务 · Claude 会员",
    title: "Claude Pro / Max 稳定代充",
    accent: "先验账号",
    subtitle:
      "Claude 对账号状态、组织信息和风控环境更敏感。先看清 Free / Pro / Max、overdue 和 Organization ID，再决定是否下单。",
    primary: "立即开通",
    secondary: "查询订单",
    reassurance: "状态先查 / 规则清楚 / 支持续费 / 售后协助",
  },
  gemini: {
    label: "陈鹏AI服务 · Gemini 会员",
    title: "Gemini Pro 稳定开通",
    accent: "Google生态",
    subtitle:
      "适合需要 Google 生态、文档协作、多模态和 Gemini Advanced 能力的用户。下单前重点确认 Google 账号、地区和付款资料状态。",
    primary: "立即开通",
    secondary: "查询订单",
    reassurance: "账号核对 / 地区提醒 / 支持续费 / 售后协助",
  },
  grok: {
    label: "陈鹏AI服务 · Grok 会员",
    title: "Grok / SuperGrok 稳定代充",
    accent: "X生态入口",
    subtitle:
      "适合经常使用 X、关注实时内容和想体验 xAI 模型的用户。下单前先确认 X 账号状态、邮箱和商品对应权益。",
    primary: "立即开通",
    secondary: "查询订单",
    reassurance: "X账号核对 / 权益说明 / 支持续费 / 售后协助",
  },
} satisfies Record<
  CategorySlug,
  {
    label: string;
    title: string;
    accent: string;
    subtitle: string;
    primary: string;
    secondary: string;
    reassurance: string;
  }
>;

export function getProductMetadata(slug: CategorySlug): Metadata {
  const category = getCategoryBySlug(slug);

  if (!category) {
    return {};
  }

  return {
    title: `${category.title}充值教程与下单前检查`,
    description: category.description,
    alternates: {
      canonical: category.path,
    },
    keywords: [
      `${category.name}充值`,
      `${category.title}开通`,
      `${category.name}支付失败`,
      "AI会员充值",
      "国内AI工具使用教程",
    ],
  };
}

export function ProductPage({ slug }: { slug: CategorySlug }) {
  const category = getCategoryBySlug(slug);

  if (!category) {
    return null;
  }

  const posts = getPostsByCategory(category.slug);
  const relatedProducts = getProductsByCategory(category.name, 4);
  const Icon = category.icon;
  const hero = productHero[slug];
  const featuredPosts = posts.slice(0, slug === "chatgpt" ? 10 : 6);
  const proofCards = [
    { title: "正规渠道", description: "不拼低价，先看商品说明和适用账号。", icon: BadgeCheck },
    { title: "长期稳定", description: "服务长期维护，开通与续费路径清楚。", icon: ShieldCheck },
    { title: "支持续费", description: "适合长期使用 AI 会员的用户。", icon: WalletCards },
    { title: "客服协助", description: `${siteConfig.wechatId}，${siteConfig.serviceHours}。`, icon: MessageCircle },
  ];

  return (
    <>
      <section className="compass-field relative min-h-[calc(100vh-76px)] overflow-hidden px-4 py-14 text-[#fff7e6] sm:px-6 sm:py-18 lg:px-8">
        <div className="compass-mark" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#fbf6ea] to-transparent" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_0.72fr] lg:items-center">
          <div className="motion-rise">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#f0d89a]/30 bg-[#fffaf0]/10 px-4 py-2 text-sm font-black text-[#f0d89a] backdrop-blur">
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              <span>{hero.label}</span>
            </div>
            <h1 className="mt-7 max-w-4xl text-5xl font-black tracking-tight sm:text-7xl lg:text-8xl">
              <span className="block">{hero.title}</span>
              <span className="hero-gold-text mt-2 block">{hero.accent}</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base font-semibold leading-8 text-[#ead9b8] sm:text-xl">
              {hero.subtitle}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink
                external
                href={siteConfig.productUrl}
                icon={Sparkles}
                variant="dark"
                className="min-h-14 rounded-2xl px-7 text-base font-black"
              >
                {hero.primary}
                <ArrowRight aria-hidden="true" className="size-5" />
              </ButtonLink>
              <ButtonLink
                external
                href={siteConfig.orderQueryUrl}
                icon={Search}
                variant="ghost"
                className="min-h-14 rounded-2xl border-[#f0d89a]/45 bg-transparent px-7 text-base font-black text-[#f0d89a] hover:bg-[#fffaf0]/10"
              >
                {hero.secondary}
              </ButtonLink>
            </div>

            <div className="mt-9 grid max-w-3xl gap-3 sm:grid-cols-3">
              {["不拼低价", "正规渠道", "支持长期续费"].map((item) => (
                <div
                  className="rounded-2xl border border-[#f0d89a]/20 bg-[#fffaf0]/9 px-4 py-3 text-sm font-black text-[#fff5dc] backdrop-blur"
                  key={item}
                >
                  <CheckCircle2 aria-hidden="true" className="mr-2 inline size-4 text-[#f0d89a]" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="motion-rise motion-delay-1">
            <div className="gold-card-dark relative overflow-hidden rounded-[2rem] p-6 backdrop-blur">
              <div className="absolute right-6 top-6 rounded-full border border-[#f0d89a]/20 bg-[#fffaf0]/8 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#f0d89a]">
                Premium
              </div>
              <div className="flex items-center gap-4">
                <span className="relative size-20 overflow-hidden rounded-3xl border border-[#d7ad5f]/50 bg-[#17110c] shadow-2xl shadow-black/30">
                  <Image
                    src={siteConfig.avatar}
                    alt="陈鹏AI服务头像"
                    fill
                    sizes="80px"
                    className="object-cover"
                    priority
                    unoptimized
                  />
                </span>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-[#f0d89a]">
                    {siteConfig.chineseBrand}
                  </p>
                  <h2 className="mt-2 text-3xl font-black">稳定靠谱</h2>
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-[#f0d89a]/18 bg-[#fffaf0]/8 p-5">
                <p className="flex items-center gap-2 text-base font-black text-[#fff5dc]">
                  <Star aria-hidden="true" className="size-5 text-[#f0d89a]" />
                  {hero.reassurance}
                </p>
                <p className="mt-4 text-sm leading-7 text-[#ead9b8]">
                  下单前先看商品说明，确认账号状态、邮箱、售后边界和风险提示。虚拟产品不做夸大承诺，但把流程和规则讲清楚。
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {proofCards.map((item) => {
                  const CardIcon = item.icon;
                  return (
                    <div
                      className="rounded-2xl border border-[#f0d89a]/18 bg-[#fffaf0]/8 p-4"
                      key={item.title}
                    >
                      <CardIcon aria-hidden="true" className="size-5 text-[#f0d89a]" />
                      <h3 className="mt-3 text-base font-black">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#ead9b8]">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <SectionHeading
            eyebrow="Who"
            title={`${category.name} 适合谁？`}
            description="先判断自己是不是目标用户，再决定要不要下单。"
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {category.suitableFor.map((item) => (
              <div className="gold-card rounded-2xl p-5" key={item}>
                <CheckCircle2 aria-hidden="true" className="size-5 text-[#9a6a2f]" />
                <p className="mt-4 text-sm font-bold leading-7 text-[#4b4036]">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fff5dc] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Risk"
            title="为什么会开通失败？"
            description="把失败原因前置，比盲目付款更省时间。"
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {failureReasons.map((reason) => {
              const ReasonIcon = reason.icon;
              return (
                <div className="gold-card rounded-2xl p-5" key={reason.title}>
                  <ReasonIcon aria-hidden="true" className="size-5 text-[#9a6a2f]" />
                  <h3 className="mt-4 font-black text-[#17110c]">{reason.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#6e6257]">
                    {reason.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading
            eyebrow="Checklist"
            title="下单前清单"
            description="购买前先看清商品说明、客服时间、邮箱填写、支付回调和售后边界。"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {preOrderChecklist.map((item) => (
              <div
                className="flex items-start gap-3 rounded-xl border border-[#d8c39b] bg-[#fffaf0] p-4 text-sm font-semibold leading-6 text-[#4b4036] shadow-sm"
                key={item}
              >
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-[#9a6a2f]"
                />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fff5dc] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Process"
            title="三步使用流程"
            description="从教程判断到自助下单，每一步都围绕减少误判和售后沟通成本。"
          />
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {processSteps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <div className="gold-card rounded-2xl p-6" key={step.title}>
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-black text-[#d7ad5f]">
                      0{index + 1}
                    </span>
                    <StepIcon aria-hidden="true" className="size-6 text-[#9a6a2f]" />
                  </div>
                  <h3 className="mt-6 text-xl font-black text-[#17110c]">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#6e6257]">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Compare"
            title="充值方式对比"
            description="不把任何方式说成万能方案，重点看账号状态、时间成本和风险承受能力。"
          />
          <ComparisonTable />
        </div>
      </section>

      <section id="articles" className="bg-[#fff5dc] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Articles"
            title={`${category.name} 高频问题`}
            description="围绕怎么充值、支付失败、账号风控和续费问题，给搜索用户一个清楚答案。"
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featuredPosts.map((post) => (
              <ArticleCard key={post.slug} post={post} />
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <ButtonLink href="/blog" icon={BookOpen} variant="secondary">
              查看更多教程
            </ButtonLink>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Order"
              title={`${category.name} 自助下单入口`}
              description="本站不处理支付，点击后跳转到 gpt3plus.com。购买前请先看清商品说明。"
            />
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {relatedProducts.map((product) => (
                <article className="gold-card flex flex-col rounded-2xl p-5" key={product.id}>
                  <span className="w-fit rounded-lg border border-[#d8c39b] bg-[#fff5dc] px-2.5 py-1 text-xs font-black text-[#6b451a]">
                    {product.category}
                  </span>
                  <h3 className="mt-4 line-clamp-2 text-lg font-black leading-snug text-[#17110c]">
                    {product.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#6e6257]">
                    {product.description || "公开商品入口已收录，下单前请先阅读商品页说明。"}
                  </p>
                  <div className="mt-auto grid gap-2 pt-5">
                    <ButtonLink
                      external
                      href={product.orderUrl}
                      icon={ShoppingBag}
                      variant="primary"
                    >
                      查看商品并自助下单
                    </ButtonLink>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            eyebrow="FAQ"
            title={`${category.name} 常见问题`}
            description="购买前先把高频疑问说清楚，比下单后再解释更稳。"
          />
          <div className="mt-8 divide-y divide-[#ead9b8] rounded-2xl border border-[#d8c39b] bg-[#fffaf0]">
            {category.faq.map((faq) => (
              <details className="group p-5" key={faq.question}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-black text-[#17110c]">
                  <span className="inline-flex items-center gap-2">
                    <CircleHelp aria-hidden="true" className="size-4 text-[#9a6a2f]" />
                    {faq.question}
                  </span>
                  <span className="text-[#9a6a2f] transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-7 text-[#6e6257]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
