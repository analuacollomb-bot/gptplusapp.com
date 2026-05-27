import Image from "next/image";
import { LifeBuoy, ShoppingBag } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { siteContent } from "@/content/site";
import { siteConfig } from "@/lib/site";

export function CtaBand() {
  return (
    <section className="compass-field relative overflow-hidden px-4 py-16 text-[#fff7e6] sm:px-6 lg:px-8">
      <div className="compass-mark" />
      <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#f0d89a]">
            自助下单
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            {siteContent.ctaTitle}
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#ead9b8]">
            {siteContent.ctaText}
          </p>
        </div>
        <div className="gold-card-dark rounded-2xl p-5">
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
              <p className="text-sm text-[#d8c39b]">先看清规则，再决定是否下单</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ButtonLink
              external
              href={siteConfig.productUrl}
              icon={ShoppingBag}
              variant="dark"
            >
              {siteContent.primaryCtaText}
            </ButtonLink>
            <ButtonLink
              href="/contact"
              icon={LifeBuoy}
              variant="ghost"
              className="border-[#f0d89a]/35 text-[#fff7e6] hover:bg-white/10"
            >
              联系客服
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
