import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleHelp,
  Compass,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { ArticleCard } from "@/components/article-card";
import { ButtonLink } from "@/components/button-link";
import { ComparisonTable } from "@/components/comparison-table";
import { CtaBand } from "@/components/cta-band";
import { SectionHeading } from "@/components/section-heading";
import { siteContent } from "@/content/site";
import { seoKeywordPages } from "@/content/seo";
import { getAllPosts } from "@/lib/posts";
import {
  categories,
  coverageStats,
  failureReasons,
  homeFaqs,
  preOrderChecklist,
  processSteps,
  scenarioCards,
  siteConfig,
  trustTags,
} from "@/lib/site";

export default function Home() {
  const posts = getAllPosts().slice(0, 5);

  return (
    <>
      <section className="compass-field relative overflow-hidden px-4 py-16 text-[#fff7e6] sm:px-6 sm:py-20 lg:px-8">
        <div className="compass-mark" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <div className="inline-flex max-w-full items-start gap-2 rounded-xl border border-[#f0d89a]/30 bg-[#fffaf0]/10 px-3 py-2 text-sm font-bold leading-6 text-[#f0d89a] backdrop-blur">
              <Compass aria-hidden="true" className="mt-1 size-4 shrink-0" />
              <span>{siteContent.serviceIntro}</span>
            </div>
            <h1 className="mt-7 text-4xl font-black tracking-tight sm:text-6xl">
              {siteContent.heroTitle}
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-[#ead9b8] sm:text-lg">
              {siteContent.heroSubtitle}
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {trustTags.map((tag) => (
                <span
                  className="rounded-lg border border-[#f0d89a]/20 bg-[#fffaf0]/10 px-3 py-1.5 text-xs font-bold text-[#fff5dc] backdrop-blur"
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/blog" icon={BookOpen} variant="dark">
                {siteContent.secondaryCtaText}
              </ButtonLink>
              <ButtonLink
                external
                href={siteConfig.productUrl}
                icon={ShoppingBag}
                variant="dark"
              >
                {siteContent.primaryCtaText}
              </ButtonLink>
            </div>
          </div>

          <div className="gold-card-dark rounded-3xl p-5 backdrop-blur">
            <div className="flex items-center gap-3 border-b border-[#f0d89a]/15 pb-5">
              <span className="relative size-16 overflow-hidden rounded-2xl border border-[#d7ad5f]/50">
                <Image
                  src={siteConfig.avatar}
                  alt="陈鹏AI服务头像"
                  fill
                  sizes="64px"
                  className="object-cover"
                  priority
                  unoptimized
                />
              </span>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#f0d89a]">
                  {siteConfig.chineseBrand}
                </p>
                <p className="mt-1 text-lg font-black">先判断，再下单</p>
                <p className="mt-2 max-w-md text-sm leading-6 text-[#ead9b8]">
                  {siteConfig.serviceIntro}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <article
                    className="rounded-2xl border border-[#f0d89a]/18 bg-[#fffaf0]/8 p-4"
                    key={category.slug}
                  >
                    <Icon aria-hidden="true" className="size-5 text-[#f0d89a]" />
                    <h2 className="mt-3 text-base font-black">{category.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[#ead9b8]">
                      {category.oneLine}
                    </p>
                    <p className="mt-3 text-xs font-bold text-[#f0d89a]">
                      常见问题：支付 / 账号 / 风控 / 售后
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        className="rounded-lg border border-[#f0d89a]/25 px-3 py-2 text-xs font-bold text-[#fff5dc] hover:bg-white/10"
                        href={category.path}
                      >
                        查看教程
                      </Link>
                      <a
                        className="rounded-lg bg-[#fff5dc] px-3 py-2 text-xs font-black text-[#17110c] hover:bg-white"
                        href={siteConfig.productUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        自助下单
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-4">
          {coverageStats.map((stat) => (
            <div className="gold-card rounded-2xl p-5" key={stat.label}>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#9a6a2f]">
                {stat.label}
              </p>
              <h2 className="mt-3 text-xl font-black text-[#17110c]">{stat.value}</h2>
              <p className="mt-2 text-sm leading-6 text-[#6e6257]">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#fff5dc] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Search Intent"
              title="高频疑难入口"
              description="围绕用户真的会搜索的问题建立专题：怎么充值、支付失败、账号风控、会员区别和下单前检查。"
            />
            <ButtonLink href="/topics" icon={ArrowRight} variant="secondary">
              全部专题
            </ButtonLink>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {seoKeywordPages.slice(0, 8).map((page) => (
              <Link
                className="gold-card rounded-xl p-4 transition hover:-translate-y-0.5 hover:border-[#c99f55]"
                href={`/topics/${page.slug}`}
                key={page.slug}
              >
                <span className="text-xs font-black uppercase tracking-[0.16em] text-[#9a6a2f]">
                  {page.category}
                </span>
                <h2 className="mt-2 text-base font-black text-[#17110c]">
                  {page.primaryKeyword}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#6e6257]">
                  {page.searchIntent}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fff5dc] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <SectionHeading
            eyebrow="Why It Fails"
            title="为什么国内用户开通 AI 会员经常失败？"
            description="多数失败不是单点问题，而是支付、地区、账号状态和平台风控叠加后的结果。下单前先排查，能减少很多无效尝试。"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {failureReasons.map((reason) => {
              const Icon = reason.icon;
              return (
                <div className="gold-card rounded-2xl p-5" key={reason.title}>
                  <Icon aria-hidden="true" className="size-5 text-[#9a6a2f]" />
                  <h3 className="mt-4 font-black text-[#17110c]">
                    {reason.title}
                  </h3>
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
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Product Matrix"
            title="产品服务矩阵"
            description="每个产品都先做决策判断：适合谁、常见问题、下单前注意事项，再进入专题页。"
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <article className="gold-card rounded-2xl p-5" key={category.slug}>
                  <div className="grid size-12 place-items-center rounded-xl border border-[#d7ad5f]/45 bg-[#fff5dc] text-[#9a6a2f]">
                    <Icon aria-hidden="true" className="size-6" />
                  </div>
                  <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-[#9a6a2f]">
                    {category.eyebrow}
                  </p>
                  <h2 className="mt-2 text-xl font-black text-[#17110c]">
                    {category.topicTitle}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[#6e6257]">
                    {category.summary}
                  </p>
                  <div className="mt-5 rounded-xl border border-[#ead9b8] bg-[#fff5dc] p-4">
                    <p className="text-sm font-black text-[#17110c]">下单前注意</p>
                    <p className="mt-2 text-sm leading-6 text-[#6e6257]">
                      {category.beforeOrder}
                    </p>
                  </div>
                  <div className="mt-5 grid gap-2">
                    <ButtonLink href={category.path} icon={BookOpen} variant="secondary">
                      查看专题页
                    </ButtonLink>
                    <ButtonLink
                      external
                      href={siteConfig.productUrl}
                      icon={ShoppingBag}
                      variant="primary"
                    >
                      自助下单
                    </ButtonLink>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#fff5dc] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Process"
            title="三步使用流程"
            description="把“能不能下单”拆成三步判断，少走弯路，也减少售后沟通成本。"
          />
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div className="gold-card rounded-2xl p-6" key={step.title}>
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-black text-[#d7ad5f]">
                      0{index + 1}
                    </span>
                    <Icon aria-hidden="true" className="size-6 text-[#9a6a2f]" />
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
            eyebrow="Method Compare"
            title="充值方式对比"
            description="不同方式没有固定优劣，关键是匹配你的账号状态、支付条件、时间成本和风险承受能力。"
          />
          <ComparisonTable />
        </div>
      </section>

      <section className="bg-[#fff5dc] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionHeading
            eyebrow="Before Order"
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

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Featured Guides"
              title="精品教程：下单前必读"
              description="教程不是价格单的复述，而是围绕真实账号状态、支付失败、风控边界和自助下单前检查，帮你先做判断。"
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <ButtonLink href="/products" icon={ShoppingBag} variant="secondary">
                商品入口
              </ButtonLink>
              <ButtonLink href="/blog" icon={ArrowRight} variant="secondary">
                全部教程
              </ButtonLink>
            </div>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <ArticleCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fff5dc] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Real Scenarios"
            title="用户反馈与常见场景"
            description="不写虚假好评，只整理售前和售后反复出现的真实疑问。"
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {scenarioCards.map((scenario) => (
              <div className="gold-card rounded-2xl p-5" key={scenario.title}>
                <Sparkles aria-hidden="true" className="size-5 text-[#9a6a2f]" />
                <h3 className="mt-4 font-black text-[#17110c]">
                  {scenario.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#6e6257]">
                  {scenario.description}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <ButtonLink href="/reviews" icon={BookOpen} variant="secondary">
              查看反馈场景页
            </ButtonLink>
          </div>
        </div>
      </section>

      <CtaBand />

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading
            eyebrow="FAQ"
            title="常见问题摘要"
            description="这些是售前和售后最容易反复出现的问题。完整说明可以查看 FAQ 页面。"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {homeFaqs.map((faq) => (
              <div className="gold-card rounded-2xl p-5" key={faq.question}>
                <CircleHelp aria-hidden="true" className="size-5 text-[#9a6a2f]" />
                <h3 className="mt-4 font-black text-[#17110c]">{faq.question}</h3>
                <p className="mt-2 text-sm leading-7 text-[#6e6257]">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-8 flex max-w-7xl justify-center">
          <Link
            className="inline-flex items-center gap-2 text-sm font-bold text-[#7b4f1c] hover:underline"
            href="/faq"
          >
            查看完整 FAQ
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        <p className="mx-auto mt-8 max-w-4xl text-center text-sm leading-7 text-[#7b6a59]">
          本站自然覆盖 AI会员充值、ChatGPT Plus充值、Claude Pro充值、Gemini Pro充值、Grok会员开通、国内AI工具使用教程等主题，但不做关键词堆砌，不写夸大承诺。
        </p>
      </section>
    </>
  );
}
