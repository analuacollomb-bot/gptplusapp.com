import type { Metadata } from "next";
import { BookOpen, CheckCircle2, CircleHelp, ShoppingBag } from "lucide-react";
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

  return (
    <>
      <section className="compass-field relative overflow-hidden px-4 py-16 text-[#fff7e6] sm:px-6 lg:px-8">
        <div className="compass-mark" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-[#f0d89a]/30 bg-[#fffaf0]/10 px-3 py-2 text-sm font-bold text-[#f0d89a] backdrop-blur">
              <Icon aria-hidden="true" className="size-4" />
              {category.eyebrow}
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
              {category.title}充值教程
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[#ead9b8]">
              {category.description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="#articles" icon={BookOpen} variant="dark">
                查看相关文章
              </ButtonLink>
              <ButtonLink
                external
                href={siteConfig.productUrl}
                icon={ShoppingBag}
                variant="dark"
              >
                前往自助下单
              </ButtonLink>
            </div>
          </div>

          <div className="gold-card-dark rounded-2xl p-6 backdrop-blur">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#f0d89a]">
              开通前判断
            </p>
            <h2 className="mt-3 text-2xl font-black">这页适合先做决策</h2>
            <p className="mt-4 text-sm leading-7 text-[#ead9b8]">
              {category.summary}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {category.commonIssues.slice(0, 4).map((item) => (
                <div
                  className="rounded-xl border border-[#f0d89a]/18 bg-[#fffaf0]/8 p-4 text-sm leading-6 text-[#f4ead8]"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading
            eyebrow="Who Is It For"
            title={`${category.name} 适合谁？`}
            description={category.oneLine}
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
            eyebrow="Failure Reasons"
            title="常见开通失败原因"
            description="先判断失败类型，再决定下一步，不建议在状态不清楚时连续尝试。"
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
            title={`${category.name} 相关文章`}
            description="这些不是凑数量的水文，而是下单前帮助你确认规则和边界的精品样板教程。"
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <ArticleCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Related Products"
              title={`${category.name} 相关商品入口`}
              description="这里展示来自 gpt3plus.com 的公开商品入口。本站不处理支付，点击自助下单后会跳转到发卡网商品页。"
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
