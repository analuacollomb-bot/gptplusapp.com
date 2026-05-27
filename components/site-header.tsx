import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookOpen, LifeBuoy, ShoppingBag } from "lucide-react";
import { navItems, siteConfig } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#d8c39b]/70 bg-[#fffaf0]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link className="group flex min-w-fit items-center gap-3" href="/">
          <span className="relative size-11 overflow-hidden rounded-xl border border-[#d7ad5f]/50 bg-[#17110c] shadow-sm shadow-[#2b2118]/20">
            <Image
              src={siteConfig.avatar}
              alt="陈鹏AI服务头像"
              fill
              sizes="44px"
              className="object-cover"
              priority
              unoptimized
            />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-black tracking-wide text-[#17110c]">
              {siteConfig.name}
            </span>
            <span className="block text-xs font-semibold text-[#8a6b41]">
              {siteConfig.chineseBrand}
            </span>
          </span>
        </Link>

        <nav
          className="ml-auto hidden items-center gap-1 rounded-xl border border-[#d8c39b] bg-[#fff5dc]/70 p-1 lg:flex"
          aria-label="主导航"
        >
          {navItems.map((item) => (
            <Link
              className="rounded-lg px-3 py-2 text-sm font-bold text-[#5f5042] transition hover:bg-[#fffaf0] hover:text-[#17110c]"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#d8c39b] bg-[#fffaf0] px-3 py-2 text-sm font-bold text-[#3a2817] transition hover:border-[#c99f55] hover:bg-[#fff5dc]"
            href="/contact"
          >
            <LifeBuoy aria-hidden="true" className="size-4 text-[#9a6a2f]" />
            联系客服
          </Link>
          <a
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#8c612b] bg-[linear-gradient(135deg,#1a120c,#3a2817_54%,#9a6a2f)] px-3 py-2 text-sm font-bold text-[#fff7e6] shadow-sm shadow-[#2b2118]/20 transition hover:brightness-110"
            href={siteConfig.productUrl}
            target="_blank"
            rel="noreferrer"
          >
            <ShoppingBag aria-hidden="true" className="size-4" />
            自助下单
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </a>
        </div>

        <a
          className="ml-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#8c612b] bg-[#17110c] px-3 py-2 text-sm font-bold text-[#fff7e6] shadow-sm lg:hidden"
          href={siteConfig.productUrl}
          target="_blank"
          rel="noreferrer"
        >
          <ShoppingBag aria-hidden="true" className="size-4" />
          下单
        </a>
      </div>

      <div className="border-t border-[#d8c39b]/70 bg-[#fffaf0] lg:hidden">
        <nav
          className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2 sm:px-6"
          aria-label="移动端导航"
        >
          <Link
            className="inline-flex min-w-fit items-center gap-1.5 rounded-lg border border-[#d8c39b] bg-[#fff5dc] px-3 py-2 text-xs font-bold text-[#4b3724]"
            href="/blog"
          >
            <BookOpen aria-hidden="true" className="size-3.5" />
            教程
          </Link>
          {navItems
            .filter((item) => item.href !== "/blog")
            .map((item) => (
              <Link
                className="min-w-fit rounded-lg border border-[#d8c39b] bg-[#fffaf0] px-3 py-2 text-xs font-bold text-[#4b3724]"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          <Link
            className="min-w-fit rounded-lg border border-[#d8c39b] bg-[#fffaf0] px-3 py-2 text-xs font-bold text-[#4b3724]"
            href="/contact"
          >
            客服
          </Link>
        </nav>
      </div>
    </header>
  );
}
