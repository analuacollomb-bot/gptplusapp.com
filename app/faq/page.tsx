import type { Metadata } from "next";
import { CircleHelp, LifeBuoy, ShoppingBag } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { fullFaqs, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "常见问题 FAQ",
  description:
    "解答 AI 会员充值前后的常见问题，包括是否需要账号密码、无法充值、overdue 欠款、平台风控、订单查询和联系客服方式。",
  alternates: {
    canonical: "/faq",
  },
};

export default function FaqPage() {
  return (
    <>
      <section className="compass-field relative overflow-hidden px-4 py-16 text-[#fff7e6] sm:px-6 lg:px-8">
        <div className="compass-mark" />
        <div className="relative mx-auto max-w-5xl">
          <div className="grid size-12 place-items-center rounded-xl border border-[#f0d89a]/30 bg-[#fffaf0]/10 text-[#f0d89a]">
            <CircleHelp aria-hidden="true" className="size-6" />
          </div>
          <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-[#f0d89a]">
            FAQ
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            AI 会员充值常见问题
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#ead9b8]">
            这些问题来自真实下单和售后场景，重点解释账号状态、平台风控、虚拟产品说明和订单沟通方式。
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl divide-y divide-[#ead9b8] rounded-2xl border border-[#d8c39b] bg-[#fffaf0] shadow-sm">
          {fullFaqs.map((faq, index) => (
            <details className="group p-5 sm:p-6" key={faq.question} open={index < 2}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-black text-[#17110c]">
                {faq.question}
                <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-[#d8c39b] text-[#9a6a2f] transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 text-sm leading-8 text-[#6e6257]">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-[#fff5dc] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 rounded-2xl border border-[#d8c39b] bg-[#fffaf0] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-[#17110c]">问题还没解决？</h2>
            <p className="mt-2 text-sm leading-7 text-[#6e6257]">
              售前先阅读商品说明；售后请准备下单邮箱、订单号、支付截图和问题截图。
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink
              external
              href={siteConfig.productUrl}
              icon={ShoppingBag}
              variant="primary"
            >
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
