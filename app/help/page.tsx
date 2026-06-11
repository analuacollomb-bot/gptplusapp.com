import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeHelp,
  CheckCircle2,
  CircleHelp,
  LifeBuoy,
  Mail,
  Search,
  ShieldCheck,
  ShoppingBag,
  Tags,
} from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { helpCategories, helpFaqs } from "@/content/help";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "帮助中心常见问题：ChatGPT Claude Grok Gemini 充值售后说明",
  description:
    "陈鹏AI服务帮助中心，整理 ChatGPT Plus、Claude Pro/Max、Grok/SuperGrok、Gemini 充值卡密、下单邮箱、质保、发货、网络环境和售后常见问题。",
  alternates: {
    canonical: "/help",
  },
  keywords: [
    "AI会员充值帮助中心",
    "ChatGPT Plus充值常见问题",
    "Claude Pro质保",
    "Grok充值ID",
    "Gemini账号手机号",
    "陈鹏AI服务售后",
  ],
};

const categoryDescriptions: Record<(typeof helpCategories)[number], string> = {
  下单与交付: "邮箱、卡密、付款回调、自动发货和订单查询。",
  ChatGPT: "ChatGPT Plus / Pro 充值方式、质保、App 下载和价格差异。",
  Claude: "Claude Pro / Max 账号、质保、封号、网络环境和会员区别。",
  Grok: "Grok / SuperGrok 自助充值 ID、到账显示和图片视频额度。",
  Gemini: "Gemini / Google 账号绑定、手机号和账号状态问题。",
  网络与安全: "网络工具、App 安装包、安全下载和账号环境提醒。",
  价格与售后: "价格差异、长期服务、售后边界和下单前判断。",
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: helpFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: [...faq.answer, ...(faq.checklist?.length ? [`需要准备：${faq.checklist.join("、")}。`] : [])].join(
        "\n",
      ),
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
      name: "帮助中心",
      item: `${siteConfig.url}/help`,
    },
  ],
};

export default function HelpPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema).replace(/</g, "\\u003c"),
        }}
      />

      <section className="compass-field relative overflow-hidden px-4 py-16 text-[#fff7e6] sm:px-6 lg:px-8">
        <div className="compass-mark" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_0.55fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f0d89a]/30 bg-[#fffaf0]/10 px-4 py-2 text-sm font-black text-[#f0d89a] backdrop-blur">
              <BadgeHelp aria-hidden="true" className="size-4" />
              陈鹏AI服务 · 帮助中心
            </div>
            <h1 className="mt-7 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
              AI会员充值常见问题与售后说明
            </h1>
            <p className="mt-6 max-w-3xl text-base font-semibold leading-8 text-[#ead9b8] sm:text-lg">
              这里整理真实客服高频问题：ChatGPT Plus 怎么充值、Claude Max 被封怎么处理、Grok 自助充值 ID 怎么找、卡密多久兑换、付款成功但没发货怎么办。先看清规则，再决定是否下单。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="#faq-list" icon={Search} variant="dark">
                查看常见问题
                <ArrowRight aria-hidden="true" className="size-4" />
              </ButtonLink>
              <ButtonLink
                external
                href={siteConfig.productUrl}
                icon={ShoppingBag}
                variant="ghost"
                className="border-[#f0d89a]/45 text-[#f0d89a] hover:bg-[#fffaf0]/10"
              >
                前往自助下单
              </ButtonLink>
            </div>
          </div>

          <div className="gold-card-dark rounded-[2rem] p-6">
            <ShieldCheck aria-hidden="true" className="size-7 text-[#f0d89a]" />
            <h2 className="mt-5 text-2xl font-black">下单前先看三件事</h2>
            <div className="mt-5 grid gap-3">
              {[
                "商品详情写的是自助充值、人工代充，还是成品号。",
                "质保方案、不质保方案、封号和掉订阅分别怎么处理。",
                "下单邮箱、订单号、支付截图是否能正常提供。",
              ].map((item) => (
                <p
                  className="flex items-start gap-3 rounded-2xl border border-[#f0d89a]/18 bg-[#fffaf0]/8 p-4 text-sm font-bold leading-7 text-[#ead9b8]"
                  key={item}
                >
                  <CheckCircle2 aria-hidden="true" className="mt-1 size-4 shrink-0 text-[#f0d89a]" />
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fff5dc] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap gap-3">
            {helpCategories.map((category) => (
              <a
                className="rounded-full border border-[#d8c39b] bg-[#fffaf0] px-4 py-2 text-sm font-black text-[#4b3724] transition hover:border-[#c99f55] hover:bg-white"
                href={`#${category}`}
                key={category}
              >
                {category}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="faq-list" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.36fr_1fr]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="gold-card rounded-2xl p-6">
              <CircleHelp aria-hidden="true" className="size-6 text-[#9a6a2f]" />
              <h2 className="mt-4 text-2xl font-black text-[#17110c]">问题分类</h2>
              <p className="mt-3 text-sm leading-7 text-[#6e6257]">
                这些问答适合售前判断和售后排查。不同商品规则不同，最终以商品详情页说明为准。
              </p>
              <div className="mt-5 grid gap-2">
                {helpCategories.map((category) => (
                  <a
                    className="rounded-xl border border-[#ead9b8] bg-[#fffaf0] px-4 py-3 text-sm font-black text-[#4b3724] transition hover:border-[#c99f55] hover:bg-white"
                    href={`#${category}`}
                    key={category}
                  >
                    {category}
                  </a>
                ))}
              </div>
            </div>
          </aside>

          <div className="grid gap-12">
            {helpCategories.map((category) => {
              const items = helpFaqs.filter((faq) => faq.category === category);

              return (
                <section id={category} key={category} className="scroll-mt-28">
                  <div className="mb-6">
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-[#9a6a2f]">
                      Help Center
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-[#17110c]">{category}</h2>
                    <p className="mt-3 text-sm leading-7 text-[#6e6257]">
                      {categoryDescriptions[category]}
                    </p>
                  </div>

                  <div className="grid gap-4">
                    {items.map((faq, index) => (
                      <details
                        className="group rounded-2xl border border-[#d8c39b] bg-[#fffaf0] p-5 shadow-sm"
                        key={faq.id}
                        open={index === 0}
                      >
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                          <span>
                            <span className="text-xs font-black uppercase tracking-[0.14em] text-[#9a6a2f]">
                              {String(helpFaqs.findIndex((item) => item.id === faq.id) + 1).padStart(2, "0")}
                            </span>
                            <h3 className="mt-2 text-xl font-black leading-snug text-[#17110c]">
                              {faq.question}
                            </h3>
                          </span>
                          <span className="mt-2 grid size-8 shrink-0 place-items-center rounded-xl border border-[#d8c39b] text-[#9a6a2f] transition group-open:rotate-45">
                            +
                          </span>
                        </summary>

                        <div className="mt-5 space-y-4 border-t border-[#ead9b8] pt-5">
                          {faq.answer.map((paragraph) => (
                            <p className="text-sm font-semibold leading-8 text-[#5f5042]" key={paragraph}>
                              {paragraph}
                            </p>
                          ))}

                          {faq.checklist?.length ? (
                            <div className="rounded-2xl border border-[#ead9b8] bg-[#fff5dc] p-4">
                              <p className="flex items-center gap-2 text-sm font-black text-[#17110c]">
                                <Mail aria-hidden="true" className="size-4 text-[#9a6a2f]" />
                                联系客服时建议准备
                              </p>
                              <ul className="mt-3 grid gap-2">
                                {faq.checklist.map((item) => (
                                  <li
                                    className="flex items-start gap-2 text-sm font-semibold leading-6 text-[#6e6257]"
                                    key={item}
                                  >
                                    <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#9a6a2f]" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}

                          <div className="flex flex-wrap gap-2">
                            {faq.keywords.map((keyword) => (
                              <span
                                className="inline-flex items-center gap-1 rounded-full border border-[#ead9b8] bg-white px-3 py-1 text-xs font-bold text-[#6b451a]"
                                key={keyword}
                              >
                                <Tags aria-hidden="true" className="size-3" />
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#fff5dc] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 rounded-2xl border border-[#d8c39b] bg-[#fffaf0] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#9a6a2f]">
              Chenpeng AI Service
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#17110c]">看完帮助中心，再决定是否下单</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#6e6257]">
              自助下单前请先阅读商品详情，确认适用账号、质保范围、交付方式和售后边界。售后沟通请准备下单邮箱、订单号、支付截图和问题截图。
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink external href={siteConfig.productUrl} icon={ShoppingBag} variant="primary">
              自助下单
            </ButtonLink>
            <ButtonLink href="/contact" icon={LifeBuoy} variant="secondary">
              联系客服
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
