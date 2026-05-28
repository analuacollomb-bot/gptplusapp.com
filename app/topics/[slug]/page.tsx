import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, CheckCircle2, CircleHelp, Search, ShoppingBag } from "lucide-react";
import { ArticleCard } from "@/components/article-card";
import { ButtonLink } from "@/components/button-link";
import { getRelatedProducts } from "@/content/products";
import { getSeoKeywordPage, seoKeywordPages } from "@/content/seo";
import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

type TopicPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return seoKeywordPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getSeoKeywordPage(slug);

  if (!page) {
    return {};
  }

  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: {
      canonical: `/topics/${page.slug}`,
    },
  };
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { slug } = await params;
  const page = getSeoKeywordPage(slug);

  if (!page) {
    notFound();
  }

  const posts = getAllPosts()
    .filter(
      (post) =>
        post.category === page.category ||
        post.keywords.some((keyword) => page.keywords.includes(keyword)),
    )
    .slice(0, 9);
  const products = getRelatedProducts(page.category, 3);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.userQuestions.slice(0, 4).map((question) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: "先看对应专题教程和商品说明，再结合自己的账号状态判断。无法确认时，不建议直接付款，可以先联系客服说明账号当前状态。",
      },
    })),
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首页", item: siteConfig.url },
      {
        "@type": "ListItem",
        position: 2,
        name: "关键词专题",
        item: `${siteConfig.url}/topics`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: page.primaryKeyword,
        item: `${siteConfig.url}/topics/${page.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <section className="compass-field relative overflow-hidden px-4 py-16 text-[#fff7e6] sm:px-6 lg:px-8">
        <div className="compass-mark" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-[#f0d89a]">
              <Search aria-hidden="true" className="size-4" />
              {page.searchIntent}
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
              {page.primaryKeyword}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[#ead9b8]">
              {page.heroSummary}
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {page.keywords.slice(0, 6).map((keyword) => (
                <span
                  className="rounded-lg border border-[#f0d89a]/20 bg-[#fffaf0]/10 px-3 py-1.5 text-xs font-bold text-[#fff5dc] backdrop-blur"
                  key={keyword}
                >
                  {keyword}
                </span>
              ))}
            </div>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="#answers" icon={BookOpen} variant="dark">
                查看解决方案
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

          <div className="gold-card-dark rounded-2xl p-6">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#f0d89a]">
              用户真实疑问
            </p>
            <div className="mt-5 grid gap-3">
              {page.userQuestions.map((question) => (
                <div
                  className="rounded-xl border border-[#f0d89a]/18 bg-[#fffaf0]/8 p-4 text-sm font-semibold leading-6 text-[#f4ead8]"
                  key={question}
                >
                  {question}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="answers" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#9a6a2f]">
              Decision
            </p>
            <h2 className="mt-3 text-3xl font-black text-[#17110c]">
              先解决判断问题，再考虑下单
            </h2>
            <p className="mt-5 text-base leading-8 text-[#6e6257]">
              {page.primaryKeyword} 不是一个单纯价格问题。真正影响结果的，是账号能否正常登录、当前会员状态是否符合商品要求、有没有欠款、地区和支付环境是否稳定，以及你是否理解售后边界。
            </p>
            <p className="mt-4 text-base leading-8 text-[#6e6257]">
              陈鹏AI服务的定位不是拼低价，而是长期做清楚规则、减少误判、稳定服务。你可以先把下面清单对完，再进入商品页看具体说明。
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {page.checks.map((check) => (
              <div
                className="flex items-start gap-3 rounded-xl border border-[#d8c39b] bg-[#fffaf0] p-4 text-sm font-semibold leading-6 text-[#4b4036] shadow-sm"
                key={check}
              >
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-[#9a6a2f]"
                />
                {check}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fff5dc] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#9a6a2f]">
                Related Guides
              </p>
              <h2 className="mt-3 text-3xl font-black text-[#17110c]">
                相关疑难教程
              </h2>
            </div>
            <ButtonLink href="/blog" icon={ArrowRight} variant="secondary">
              全部教程
            </ButtonLink>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <ArticleCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div className="gold-card rounded-2xl p-6">
            <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-[#9a6a2f]">
              <CircleHelp aria-hidden="true" className="size-4" />
              FAQ
            </p>
            <div className="mt-5 divide-y divide-[#ead9b8]">
              {page.userQuestions.slice(0, 4).map((question) => (
                <details className="group py-4" key={question}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-black text-[#17110c]">
                    {question}
                    <span className="text-[#9a6a2f] transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-[#6e6257]">
                    先看对应专题教程和商品说明，再结合自己的账号状态判断。无法确认时，不建议直接付款，可以先联系客服说明账号当前状态。
                  </p>
                </details>
              ))}
            </div>
          </div>

          <div className="compass-field rounded-2xl p-6 text-[#fff7e6]">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#f0d89a]">
              自助下单入口
            </p>
            <p className="mt-4 text-sm leading-7 text-[#ead9b8]">
              如果你已经看完教程，并确认账号状态、商品规则和风险说明，可以前往陈鹏AI服务自助下单。不同商品规则不同，请以商品页当前说明为准。
            </p>
            <div className="mt-5 grid gap-3">
              {products.map((product) => (
                <a
                  className="rounded-xl border border-[#f0d89a]/18 bg-[#fffaf0]/8 p-4 text-sm font-bold leading-6 text-[#fff5dc] transition hover:bg-[#fffaf0]/12"
                  href={product.orderUrl}
                  key={product.id}
                  rel="noreferrer"
                  target="_blank"
                >
                  {product.title}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fff5dc] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-3">
          {page.internalLinks.map((link) => (
            <Link
              className="rounded-lg border border-[#d8c39b] bg-[#fffaf0] px-4 py-2 text-sm font-black text-[#4b4036] hover:border-[#c99f55]"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
