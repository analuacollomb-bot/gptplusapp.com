import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, Search } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { seoKeywordPages } from "@/content/seo";

export const metadata: Metadata = {
  title: "AI会员充值关键词专题",
  description:
    "围绕 GPT怎么充值、ChatGPT Plus充值、Claude Pro充值、Gemini Pro充值、Grok怎么充值等强搜索问题建立的教程专题入口。",
  alternates: {
    canonical: "/topics",
  },
};

export default function TopicsPage() {
  return (
    <>
      <section className="compass-field relative overflow-hidden px-4 py-16 text-[#fff7e6] sm:px-6 lg:px-8">
        <div className="compass-mark" />
        <div className="relative mx-auto max-w-7xl">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-[#f0d89a]">
            <Search aria-hidden="true" className="size-4" />
            Search Intent
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            AI 会员充值强搜索词专题
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#ead9b8]">
            这组页面专门回答用户最直接的问题：怎么充、为什么失败、账号能不能处理、下单前要检查什么。先让 Google 看清本站的主题边界，再用文章持续覆盖长尾疑难。
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Keyword Hubs"
            title="核心问题入口"
            description="每个专题页都链接到产品页、教程列表和商品入口，形成清楚的内链骨架。"
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {seoKeywordPages.map((page) => (
              <Link
                className="gold-card group rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-[#c99f55] hover:shadow-lg"
                href={`/topics/${page.slug}`}
                key={page.slug}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-lg border border-[#d8c39b] bg-[#fff5dc] px-2.5 py-1 text-xs font-black text-[#6b451a]">
                    {page.category}
                  </span>
                  <Compass aria-hidden="true" className="size-5 text-[#9a6a2f]" />
                </div>
                <h2 className="mt-4 text-xl font-black text-[#17110c]">
                  {page.primaryKeyword}
                </h2>
                <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#6e6257]">
                  {page.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-black text-[#7b4f1c]">
                  查看专题
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
