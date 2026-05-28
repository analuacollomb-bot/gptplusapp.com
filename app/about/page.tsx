import Image from "next/image";
import type { Metadata } from "next";
import { CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { categories, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "关于我们",
  description:
    "GPT Plus App 由陈鹏AI服务长期维护，专注AI会员服务，覆盖 ChatGPT、Grok、Gemini、Claude 稳定代充、开通教程、续费说明和风险提示。",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <>
      <section className="compass-field relative overflow-hidden px-4 py-16 text-[#fff7e6] sm:px-6 lg:px-8">
        <div className="compass-mark" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#f0d89a]">
              About
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              关于 GPT Plus App
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[#ead9b8]">
              GPT Plus App 是 AI 会员充值教程与使用说明知识库，由{siteConfig.chineseBrand}长期维护。{siteConfig.serviceIntro}。我们把复杂的开通流程、支付问题和账号规则讲清楚，让用户在下单前有更稳定的判断。
            </p>
          </div>
          <div className="gold-card-dark rounded-3xl p-6">
            <div className="flex items-center gap-4">
              <span className="relative size-24 overflow-hidden rounded-2xl border border-[#d7ad5f]/50">
                <Image
                  src={siteConfig.avatar}
                  alt="陈鹏AI服务头像"
                  fill
                  sizes="96px"
                  className="object-cover"
                  priority
                  unoptimized
                />
              </span>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#f0d89a]">
                  {siteConfig.chineseBrand}
                </p>
                <p className="mt-2 text-2xl font-black">陈鹏AI服务</p>
                <p className="mt-2 text-sm leading-6 text-[#ead9b8]">
                  {siteConfig.serviceIntro}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-[#17110c]">
              我们长期整理什么内容？
            </h2>
            <p className="mt-5 text-base leading-8 text-[#6e6257]">
              主要帮助用户理解 ChatGPT、Grok、Gemini、Claude 等工具的稳定代充、正规渠道说明、续费注意事项、开通方式、支付失败原因、账号规则、风控提醒和自助下单前检查事项。本站不是普通发卡模板站，而是面向搜索流量和长期服务的中文教程知识库。
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {categories.map((category) => (
                <div className="gold-card rounded-2xl p-4" key={category.slug}>
                  <p className="text-sm font-black text-[#17110c]">{category.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[#6e6257]">
                    {category.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                title: "风险透明",
                description:
                  "不写脱离平台规则的夸大承诺。我们会把平台规则、账号状态和售后边界讲清楚。",
                icon: ShieldAlert,
              },
              {
                title: "教程优先",
                description:
                  "先让用户理解流程和坑点，再引导到自助下单站查看商品说明，避免盲目购买。",
                icon: Sparkles,
              },
              {
                title: "长期维护",
                description:
                  "后续会持续增加教程文章，并预留扩展 Supabase 后台、批量内容管理和订单指引的结构。",
                icon: CheckCircle2,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div className="gold-card rounded-2xl p-6" key={item.title}>
                  <Icon aria-hidden="true" className="size-6 text-[#9a6a2f]" />
                  <h3 className="mt-4 text-xl font-black text-[#17110c]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#6e6257]">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#fff5dc] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 rounded-2xl border border-[#d8c39b] bg-[#fffaf0] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-[#17110c]">查看商品说明后再下单</h2>
            <p className="mt-2 text-sm leading-7 text-[#6e6257]">
              成交和订单处理统一跳转到 {siteConfig.productUrl}，本站负责教程、科普和风险说明。
            </p>
          </div>
          <ButtonLink external href={siteConfig.productUrl} variant="primary">
            前往自助下单
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
