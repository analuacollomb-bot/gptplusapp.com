import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Filter, ShoppingBag } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { SectionHeading } from "@/components/section-heading";
import {
  productCategories,
  products,
  type Product,
  type ProductCategory,
} from "@/content/products";
import { categories, siteConfig } from "@/lib/site";

type ProductsPageProps = {
  searchParams?: Promise<{ category?: string }>;
};

export const metadata: Metadata = {
  title: "AI会员商品说明与自助下单入口",
  description:
    "按 ChatGPT、Claude、Gemini、Grok、YouTube、Spotify、X Premium 等分类查看陈鹏AI服务公开商品说明，先确认规则，再前往 gpt3plus.com 自助下单。",
  alternates: {
    canonical: "/products",
  },
  keywords: [
    "AI会员商品",
    "ChatGPT Plus自助下单",
    "Claude Pro自助下单",
    "Gemini Pro自助下单",
    "Grok会员自助下单",
    "陈鹏AI服务",
  ],
};

const coreCategoryPaths = new Map<string, string>(
  categories.map((category) => [category.name, category.path]),
);

function getProductCategoryCount(category: ProductCategory) {
  return products.filter((product) => product.category === category).length;
}

function getDisplayProducts(category?: string) {
  if (category && (productCategories as readonly string[]).includes(category)) {
    return products.filter((product) => product.category === category);
  }
  return products;
}

function ProductCard({ product }: { product: Product }) {
  const tutorialHref = coreCategoryPaths.get(product.category) ?? "/blog";
  const notice = product.notices[0] ?? "下单前先阅读商品说明，确认适用账号和售后边界。";

  return (
    <article className="gold-card flex h-full flex-col rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-[#c99f55] hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-lg border border-[#d8c39b] bg-[#fff5dc] px-2.5 py-1 text-xs font-black text-[#6b451a]">
          {product.category}
        </span>
        {product.price ? (
          <span className="rounded-lg bg-[#17110c] px-2.5 py-1 text-xs font-black text-[#fff7e6]">
            {product.price}
          </span>
        ) : null}
      </div>

      <h2 className="mt-4 line-clamp-2 text-lg font-black leading-snug text-[#17110c]">
        {product.title}
      </h2>
      <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#6e6257]">
        {product.description || "公开商品页已收录，建议点击自助下单前先阅读商品说明。"}
      </p>

      <div className="mt-5 rounded-xl border border-[#ead9b8] bg-[#fff5dc] p-4">
        <p className="flex items-center gap-2 text-sm font-black text-[#17110c]">
          <CheckCircle2 aria-hidden="true" className="size-4 text-[#9a6a2f]" />
          下单前注意
        </p>
        <p className="mt-2 text-sm leading-6 text-[#6e6257]">{notice}</p>
      </div>

      <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2">
        <ButtonLink href={tutorialHref} icon={BookOpen} variant="secondary">
          查看教程
        </ButtonLink>
        <ButtonLink external href={product.orderUrl} icon={ShoppingBag} variant="primary">
          自助下单
        </ButtonLink>
      </div>
    </article>
  );
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = searchParams ? await searchParams : {};
  const activeCategory = (productCategories as readonly string[]).includes(
    params.category ?? "",
  )
    ? params.category
    : undefined;
  const displayProducts = getDisplayProducts(activeCategory);

  return (
    <>
      <section className="compass-field relative overflow-hidden px-4 py-16 text-[#fff7e6] sm:px-6 lg:px-8">
        <div className="compass-mark" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#f0d89a]">
            Products
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            公开商品说明与自助下单入口
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#ead9b8]">
            这里不是站内商城，不做支付和订单处理。所有商品只做教程承接与规则提示，最终成交统一跳转到陈鹏AI服务发卡网。下单前请先看清商品说明、账号状态要求、风险边界和售后规则。
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/blog" icon={BookOpen} variant="dark">
              先看教程
            </ButtonLink>
            <ButtonLink
              external
              href={siteConfig.productUrl}
              icon={ShoppingBag}
              variant="dark"
            >
              进入发卡网总入口
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="gold-card rounded-2xl p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-[#9a6a2f]">
                  <Filter aria-hidden="true" className="size-4" />
                  分类筛选
                </p>
                <p className="mt-2 text-sm leading-7 text-[#6e6257]">
                  已收录 {products.length} 个公开商品入口。无法自动识别的页面会保留在抓取记录中，后续可手动补充。
                </p>
              </div>
              <Link
                className={`inline-flex min-h-10 items-center justify-center rounded-lg border px-3 py-2 text-sm font-black ${
                  activeCategory
                    ? "border-[#d8c39b] bg-[#fffaf0] text-[#4b4036]"
                    : "border-[#8c612b] bg-[#17110c] text-[#fff7e6]"
                }`}
                href="/products"
              >
                全部商品
              </Link>
            </div>
            <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              {productCategories.map((category) => (
                <Link
                  className={`inline-flex min-w-fit items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black transition ${
                    activeCategory === category
                      ? "border-[#8c612b] bg-[#17110c] text-[#fff7e6]"
                      : "border-[#d8c39b] bg-[#fffaf0] text-[#4b4036] hover:border-[#c99f55]"
                  }`}
                  href={`/products?category=${encodeURIComponent(category)}`}
                  key={category}
                >
                  {category}
                  <span className="rounded-md bg-[#fff5dc] px-1.5 py-0.5 text-[11px] text-[#7b4f1c]">
                    {getProductCategoryCount(category)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fff5dc] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Order With Context"
              title={activeCategory ? `${activeCategory} 商品入口` : "全部商品入口"}
              description="每张卡片只做规则提示与跳转，不在本站收款。真正下单前，请以 gpt3plus.com 商品页当前说明为准。"
            />
            <ButtonLink href="/admin-content-guide" icon={ArrowRight} variant="secondary">
              内容维护说明
            </ButtonLink>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {displayProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
