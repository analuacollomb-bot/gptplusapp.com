import type { Metadata } from "next";
import { LifeBuoy, MessageCircle, ShoppingBag, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { SectionHeading } from "@/components/section-heading";
import { scenarioCards, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "用户反馈与下单前真实问题",
  description:
    "整理 AI 会员充值用户最常见的下单前疑虑和反馈场景，包括账号状态、支付失败、风控风险、教程获取和联系客服。",
  alternates: {
    canonical: "/reviews",
  },
};

export default function ReviewsPage() {
  const doubts = [
    "要不要给密码？",
    "为什么有些账号不能充？",
    "风控风险谁承担？",
    "失败如何处理？",
    "下单后怎么看教程？",
  ];

  const contactFirst = [
    "当前账号已经是 Pro / Max，想继续购买同类商品",
    "账号出现 overdue、payment failed、billing issue 等提示",
    "Claude 商品要求 Organization ID，但你不确定怎么找",
    "X 或 Google 账号存在安全验证、限制或管理员控制",
    "下单邮箱、登录邮箱、订单邮箱不是同一个",
  ];

  return (
    <>
      <section className="compass-field relative overflow-hidden px-4 py-16 text-[#fff7e6] sm:px-6 lg:px-8">
        <div className="compass-mark" />
        <div className="relative mx-auto max-w-5xl">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#f0d89a]">
            Reviews & Scenarios
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            用户最关心的不是价格，而是流程是否清楚、风险是否透明
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#ead9b8]">
            这里不写虚假刷好评，只整理用户在下单前最常见的真实问题：账号状态怎么查、支付失败怎么判断、风控风险怎么理解、下单后教程从哪里看。
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Feedback Scenes"
            title="反馈场景卡片"
            description="这些场景更像售前问诊记录，帮助你判断自己属于哪一类。"
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {scenarioCards.map((scenario) => (
              <div className="gold-card rounded-2xl p-5" key={scenario.title}>
                <Sparkles aria-hidden="true" className="size-5 text-[#9a6a2f]" />
                <h2 className="mt-4 font-black text-[#17110c]">
                  {scenario.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#6e6257]">
                  {scenario.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fff5dc] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading
            eyebrow="Concerns"
            title="常见疑虑"
            description="如果这些问题你还没弄清楚，建议先看 FAQ 或联系客服确认。"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {doubts.map((doubt) => (
              <div
                className="flex items-center gap-3 rounded-xl border border-[#d8c39b] bg-[#fffaf0] p-4 font-bold text-[#4b4036]"
                key={doubt}
              >
                <MessageCircle aria-hidden="true" className="size-5 text-[#9a6a2f]" />
                {doubt}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SectionHeading
              eyebrow="Contact First"
              title="哪些情况建议先联系客服？"
              description="不是所有账号都适合直接下单。状态不明时，先问清楚比事后排查更省时间。"
            />
            <div className="mt-8 space-y-3">
              {contactFirst.map((item) => (
                <div
                  className="rounded-xl border border-[#d8c39b] bg-[#fffaf0] p-4 text-sm font-semibold leading-7 text-[#4b4036]"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="compass-field rounded-3xl p-6 text-[#fff7e6]">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#f0d89a]">
              CTA
            </p>
            <h2 className="mt-3 text-3xl font-black">先看说明，再自助下单</h2>
            <p className="mt-4 text-sm leading-8 text-[#ead9b8]">
              你可以先阅读对应教程和商品说明，确认账号状态、风险规则与售后边界后，再通过{siteConfig.chineseBrand}自助下单。
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <ButtonLink
                external
                href={siteConfig.productUrl}
                icon={ShoppingBag}
                variant="dark"
              >
                自助下单
              </ButtonLink>
              <ButtonLink href="/contact" icon={LifeBuoy} variant="dark">
                联系客服
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
