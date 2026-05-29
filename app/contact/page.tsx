import Image from "next/image";
import type { Metadata } from "next";
import {
  FileImage,
  MailCheck,
  MessageCircle,
  ReceiptText,
  ShoppingBag,
} from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { siteContent } from "@/content/site";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "联系客服",
  description:
    "联系陈鹏AI服务前请先阅读商品说明。售后问题请准备下单邮箱、订单号、支付截图和问题截图，以便快速核对。",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  const supportItems = [
    { title: "下单邮箱", description: "用于核对订单归属和发货信息。", icon: MailCheck },
    { title: "订单号", description: "在订单查询或支付完成页面中查看。", icon: ReceiptText },
    { title: "支付截图", description: "包含支付时间、金额和订单信息的截图。", icon: FileImage },
    { title: "问题截图", description: "展示报错、账号状态或页面提示，便于判断原因。", icon: MessageCircle },
  ];

  return (
    <>
      <section className="compass-field relative overflow-hidden px-4 py-16 text-[#fff7e6] sm:px-6 lg:px-8">
        <div className="compass-mark" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#f0d89a]">
              Contact
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              联系{siteConfig.chineseBrand}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[#ead9b8]">
              {siteContent.contactText}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
                  在线客服
                </p>
                <p className="mt-2 text-2xl font-black">网页聊天接入中</p>
                <p className="mt-2 text-sm leading-6 text-[#ead9b8]">
                  接入后用户可直接在网页咨询，员工用客服后台或手机 App 接待。
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-[#f0d89a]/20 bg-[#fffaf0]/8 p-4">
              <p className="text-sm font-black text-[#f0d89a]">
                备用联系方式
              </p>
              <p className="mt-2 text-sm leading-7 text-[#ead9b8]">
                陈鹏个人微信号：{siteContent.wechatId}
                <br />
                商务合作、售前咨询、售后问题，添加时请备注来意。
                <br />
                服务时间：{siteContent.serviceHours}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-[#17110c]">
              售后沟通请准备这些信息
            </h2>
            <p className="mt-5 text-base leading-8 text-[#6e6257]">
              信息越完整，客服越容易判断是账号状态、支付问题、商品规则还是平台风控导致。请不要只发一句“不能用”，那样很难定位。
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {supportItems.map((item) => {
              const Icon = item.icon;
              return (
                <div className="gold-card rounded-2xl p-5" key={item.title}>
                  <Icon aria-hidden="true" className="size-5 text-[#9a6a2f]" />
                  <h3 className="mt-4 font-black text-[#17110c]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#6e6257]">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#fff5dc] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-2xl border border-[#d8c39b] bg-[#fffaf0] p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#17110c]">客服入口在哪里？</h2>
          <p className="mt-3 text-sm leading-8 text-[#6e6257]">
            接入在线客服系统后，用户点击右下角客服按钮即可直接发消息。员工可以使用客服后台或手机 App 登录接待。当前备用方式为添加陈鹏个人微信号 {siteContent.wechatId}，请备注来意。下单和订单处理仍统一跳转到成交主站/发卡网 {siteConfig.productUrl}。
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <ButtonLink
              external
              href={siteConfig.productUrl}
              icon={ShoppingBag}
              variant="primary"
            >
              打开自助下单站
            </ButtonLink>
            <ButtonLink href="/contact" icon={MessageCircle} variant="secondary">
              查看客服说明
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
