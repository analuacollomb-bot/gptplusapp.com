import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LifeBuoy,
  ShieldAlert,
  ShoppingBag,
} from "lucide-react";
import { ArticleCard } from "@/components/article-card";
import { ButtonLink } from "@/components/button-link";
import { getProductById, getRelatedProducts } from "@/content/products";
import {
  formatDate,
  getAllPosts,
  getHeadingId,
  getPostBySlug,
  getRelatedPosts,
} from "@/lib/posts";
import {
  categories,
  fullFaqs,
  getCategoryByName,
  preOrderChecklist,
  siteConfig,
} from "@/lib/site";

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

function nodeToText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(nodeToText).join("");
  }
  return "";
}

const markdownComponents: Components = {
  a: ({ href, children }) => {
    const isExternal = href?.startsWith("http");
    return (
      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noreferrer" : undefined}
      >
        {children}
      </a>
    );
  },
  h2: ({ children }) => {
    const text = nodeToText(children);
    return <h2 id={getHeadingId(text)}>{children}</h2>;
  },
  h3: ({ children }) => {
    const text = nodeToText(children);
    return <h3 id={getHeadingId(text)}>{children}</h3>;
  },
};

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}`,
      publishedTime: post.date,
      authors: [siteConfig.chineseBrand],
      tags: post.keywords,
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const category = getCategoryByName(post.category);
  const relatedPosts = getRelatedPosts(post, 3);
  const product = getProductById(post.productId);
  const ctaProductUrl = product?.orderUrl ?? post.productUrl;
  const relatedProducts = getRelatedProducts(post.category, 3).filter(
    (item) => item.id !== product?.id,
  );
  const pageFaqs = fullFaqs.slice(0, 5);

  return (
    <>
      <section className="compass-field relative overflow-hidden px-4 py-14 text-[#fff7e6] sm:px-6 lg:px-8">
        <div className="compass-mark" />
        <div className="relative mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[#ead9b8]">
            <Link
              className="rounded-lg border border-[#f0d89a]/25 bg-[#fffaf0]/10 px-3 py-1.5 text-[#f0d89a]"
              href={category?.path ?? "/blog"}
            >
              {post.category}
            </Link>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" className="size-4" />
              {formatDate(post.date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 aria-hidden="true" className="size-4" />
              {post.readingTime}
            </span>
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
            {post.title}
          </h1>
          <p className="mt-5 max-w-4xl text-lg leading-9 text-[#ead9b8]">
            {post.description}
          </p>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[280px_minmax(0,1fr)_320px] lg:items-start">
          <aside className="hidden space-y-5 lg:sticky lg:top-28 lg:block">
            <div className="gold-card rounded-2xl p-5">
              <h2 className="flex items-center gap-2 text-base font-black text-[#17110c]">
                <BookOpen aria-hidden="true" className="size-5 text-[#9a6a2f]" />
                文章目录
              </h2>
              <nav className="mt-4 space-y-2">
                {post.headings.slice(0, 10).map((heading) => (
                  <a
                    className={`block rounded-lg px-3 py-2 text-sm font-semibold leading-6 text-[#6e6257] transition hover:bg-[#fff5dc] hover:text-[#17110c] ${
                      heading.depth === 3 ? "pl-6" : ""
                    }`}
                    href={`#${heading.id}`}
                    key={heading.id}
                  >
                    {heading.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <article className="gold-card min-w-0 rounded-2xl p-5 sm:p-8 lg:p-10">
            <div className="mb-8 rounded-2xl border border-[#ead9b8] bg-[#fff5dc] p-5">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#9a6a2f]">
                军师提示
              </p>
              <p className="mt-3 text-sm leading-7 text-[#5c5147]">
                本文适合下单前核对账号状态、了解风险边界和比较不同开通方式。商品规则可能变化，请以自助下单页说明为准。
              </p>
            </div>
            {post.headings.length > 0 ? (
              <details className="mb-8 rounded-2xl border border-[#ead9b8] bg-[#fffaf0] p-5 lg:hidden">
                <summary className="cursor-pointer list-none font-black text-[#17110c]">
                  文章目录
                </summary>
                <nav className="mt-4 space-y-2">
                  {post.headings.slice(0, 10).map((heading) => (
                    <a
                      className={`block rounded-lg px-3 py-2 text-sm font-semibold leading-6 text-[#6e6257] ${
                        heading.depth === 3 ? "pl-6" : ""
                      }`}
                      href={`#${heading.id}`}
                      key={heading.id}
                    >
                      {heading.text}
                    </a>
                  ))}
                </nav>
              </details>
            ) : null}
            <div className="article-prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {post.content}
              </ReactMarkdown>
            </div>
          </article>

          <aside className="space-y-5 lg:sticky lg:top-28">
            <div className="gold-card rounded-2xl p-5">
              <h2 className="flex items-center gap-2 text-base font-black text-[#17110c]">
                <ShieldAlert aria-hidden="true" className="size-5 text-[#9a6a2f]" />
                风险透明
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#6e6257]">
                不做脱离平台规则的保证。充值结果与账号状态、平台规则、登录环境和风控策略有关。
              </p>
            </div>
            {product ? (
              <div className="gold-card rounded-2xl p-5">
                <h2 className="flex items-center gap-2 text-base font-black text-[#17110c]">
                  <ShoppingBag aria-hidden="true" className="size-5 text-[#9a6a2f]" />
                  相关商品
                </h2>
                <p className="mt-3 line-clamp-2 text-sm font-black leading-6 text-[#17110c]">
                  {product.title}
                </p>
                <p className="mt-2 line-clamp-3 text-sm leading-7 text-[#6e6257]">
                  {product.description || "公开商品入口已收录，请下单前阅读商品页说明。"}
                </p>
                <ButtonLink
                  external
                  href={ctaProductUrl}
                  icon={ArrowUpRight}
                  variant="secondary"
                  className="mt-4 w-full"
                >
                  查看商品说明
                </ButtonLink>
              </div>
            ) : null}
            <div className="gold-card rounded-2xl p-5">
              <h2 className="flex items-center gap-2 text-base font-black text-[#17110c]">
                <BookOpen aria-hidden="true" className="size-5 text-[#9a6a2f]" />
                分类导航
              </h2>
              <div className="mt-4 grid gap-2">
                {categories.map((item) => (
                  <Link
                    className="rounded-lg border border-[#ead9b8] bg-[#fff5dc] px-3 py-2 text-sm font-bold text-[#5f5042] hover:border-[#c99f55]"
                    href={item.path}
                    key={item.slug}
                  >
                    {item.title}
                  </Link>
                ))}
                <Link
                  className="rounded-lg border border-[#ead9b8] bg-[#fff5dc] px-3 py-2 text-sm font-bold text-[#5f5042] hover:border-[#c99f55]"
                  href="/products"
                >
                  商品入口
                </Link>
              </div>
            </div>
            <div className="compass-field rounded-2xl p-5 text-[#fff7e6]">
              <div className="flex items-center gap-3">
                <span className="relative size-14 overflow-hidden rounded-xl border border-[#d7ad5f]/50">
                  <Image
                    src={siteConfig.avatar}
                    alt="陈鹏AI服务头像"
                    fill
                    sizes="56px"
                    className="object-cover"
                    unoptimized
                  />
                </span>
                <div>
                  <p className="font-black">{siteConfig.chineseBrand}</p>
                  <p className="text-xs font-semibold text-[#f0d89a]">
                    先看说明，再下单
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-2">
                <ButtonLink
                  external
                  href={ctaProductUrl}
                  icon={ShoppingBag}
                  variant="dark"
                >
                  查看对应商品
                </ButtonLink>
                <ButtonLink
                  external
                  href={siteConfig.productUrl}
                  icon={ArrowUpRight}
                  variant="dark"
                >
                  前往自助下单
                </ButtonLink>
                <ButtonLink href="/contact" icon={LifeBuoy} variant="dark">
                  联系客服
                </ButtonLink>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-[#fff5dc] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_0.95fr]">
          <div className="gold-card rounded-2xl p-6">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#9a6a2f]">
              Before Order
            </p>
            <h2 className="mt-3 text-2xl font-black text-[#17110c]">
              下单前请确认
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {preOrderChecklist.map((item) => (
                <div
                  className="flex items-start gap-3 rounded-xl border border-[#ead9b8] bg-[#fffaf0] p-4 text-sm font-semibold leading-6 text-[#4b4036]"
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

          <div className="compass-field rounded-2xl p-6 text-[#fff7e6]">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#f0d89a]">
              CTA
            </p>
            <h2 className="mt-3 text-2xl font-black">看完教程后再决定</h2>
            <p className="mt-4 text-sm leading-7 text-[#ead9b8]">
              如果你已经看完教程，并确认账号状态、商品规则和风险说明，可以前往陈鹏AI服务自助下单。不同产品规则不同，请先阅读商品页说明，再决定是否购买。
            </p>
            {product ? (
              <div className="mt-5 rounded-xl border border-[#f0d89a]/20 bg-[#fffaf0]/10 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#f0d89a]">
                  推荐查看
                </p>
                <p className="mt-2 line-clamp-2 text-sm font-bold text-[#fff5dc]">
                  {product.title}
                </p>
              </div>
            ) : null}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <ButtonLink
                external
                href={ctaProductUrl}
                icon={ShoppingBag}
                variant="dark"
              >
                前往自助下单
              </ButtonLink>
              <ButtonLink href="/contact" icon={LifeBuoy} variant="dark">
                联系客服
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#9a6a2f]">
                Related
              </p>
              <h2 className="mt-3 text-2xl font-black text-[#17110c]">
                相关文章推荐
              </h2>
            </div>
            <ButtonLink href="/blog" icon={BookOpen} variant="secondary">
              返回教程列表
            </ButtonLink>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {relatedPosts.map((related) => (
              <ArticleCard key={related.slug} post={related} />
            ))}
          </div>
          {relatedProducts.length > 0 ? (
            <div className="mt-10 rounded-2xl border border-[#d8c39b] bg-[#fffaf0] p-5">
              <h3 className="text-lg font-black text-[#17110c]">相关商品入口</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {relatedProducts.map((item) => (
                  <a
                    className="rounded-xl border border-[#ead9b8] bg-[#fff5dc] p-4 text-sm font-bold leading-6 text-[#4b4036] transition hover:border-[#c99f55]"
                    href={item.orderUrl}
                    key={item.id}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span className="block text-xs text-[#9a6a2f]">{item.category}</span>
                    <span className="mt-1 line-clamp-2 block">{item.title}</span>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#9a6a2f]">
            FAQ
          </p>
          <h2 className="mt-3 text-2xl font-black text-[#17110c]">
            下单前常见问题
          </h2>
          <div className="mt-8 divide-y divide-[#ead9b8] rounded-2xl border border-[#d8c39b] bg-[#fffaf0]">
            {pageFaqs.map((faq) => (
              <details className="group p-5" key={faq.question}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-black text-[#17110c]">
                  {faq.question}
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
    </>
  );
}
