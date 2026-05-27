import type { Metadata } from "next";
import { ArticleCard } from "@/components/article-card";
import { ButtonLink } from "@/components/button-link";
import { SectionHeading } from "@/components/section-heading";
import { getAllPosts } from "@/lib/posts";
import { categories, siteConfig } from "@/lib/site";
import { BookOpen, ShoppingBag } from "lucide-react";

export const metadata: Metadata = {
  title: "AI会员充值教程列表",
  description:
    "查看 ChatGPT、Claude、Gemini、Grok 的会员充值教程、支付失败说明、账号风控提醒和自助下单前检查事项。",
  alternates: {
    canonical: "/blog",
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <>
      <section className="compass-field relative overflow-hidden px-4 py-16 text-[#fff7e6] sm:px-6 lg:px-8">
        <div className="compass-mark" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#f0d89a]">
            Tutorials
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            AI 会员充值与使用教程
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#ead9b8]">
            这里收录 GPT Plus App 的全部 Markdown/MDX 教程文章。每篇文章都围绕下单前判断、账号状态、风险边界和自助下单说明展开。
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="#articles" icon={BookOpen} variant="dark">
              浏览文章
            </ButtonLink>
            <ButtonLink
              external
              href={siteConfig.productUrl}
              icon={ShoppingBag}
              variant="dark"
            >
              自助下单
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-4">
          {categories.map((category) => (
            <a
              className="gold-card rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-[#c99f55] hover:shadow-lg"
              href={category.path}
              key={category.slug}
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9a6a2f]">
                {category.eyebrow}
              </p>
              <h2 className="mt-2 text-lg font-black text-[#17110c]">
                {category.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#6e6257]">
                {category.summary}
              </p>
            </a>
          ))}
        </div>
      </section>

      <section id="articles" className="bg-[#fff5dc] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="All Guides"
            title="全部教程文章"
            description="文章按发布时间排序，覆盖充值前准备、方式对比、风险说明、下单检查和常见售后问题。"
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <ArticleCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
