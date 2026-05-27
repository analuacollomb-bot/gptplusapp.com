import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ShieldAlert } from "lucide-react";
import { siteContent } from "@/content/site";
import { footerColumns, siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#d8c39b] bg-[#17110c] text-[#fff7e6]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.3fr_2fr] lg:px-8">
        <div>
          <Link className="flex items-center gap-3" href="/">
            <span className="relative size-12 overflow-hidden rounded-xl border border-[#d7ad5f]/60 bg-[#2b2118]">
              <Image
                src={siteConfig.avatar}
                alt="陈鹏AI服务头像"
                fill
                sizes="48px"
                className="object-cover"
                unoptimized
              />
            </span>
            <span>
              <span className="block text-base font-black">{siteConfig.name}</span>
              <span className="block text-sm font-semibold text-[#d7ad5f]">
                {siteConfig.chineseBrand}
              </span>
            </span>
          </Link>
          <p className="mt-5 max-w-md text-sm leading-7 text-[#d8c39b]">
            {siteContent.footerText}
          </p>
          <div className="mt-6 rounded-lg border border-[#d7ad5f]/30 bg-[#fff5dc]/8 p-4 text-sm leading-6 text-[#f0d89a]">
            <div className="mb-2 flex items-center gap-2 font-semibold text-[#fff5dc]">
              <ShieldAlert aria-hidden="true" className="size-4" />
              风险提示
            </div>
            {siteContent.riskNotice}
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h2 className="text-sm font-bold text-[#fff7e6]">{column.title}</h2>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    {"external" in link && link.external ? (
                      <a
                        className="inline-flex items-center gap-1 text-sm text-[#d8c39b] transition hover:text-white"
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {link.label}
                        <ArrowUpRight aria-hidden="true" className="size-3.5" />
                      </a>
                    ) : (
                      <Link
                        className="text-sm text-[#d8c39b] transition hover:text-white"
                        href={link.href}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-[#d7ad5f]/15 px-4 py-5 text-center text-xs leading-6 text-[#aa9273]">
        © 2026 {siteConfig.name}. 由 {siteConfig.chineseBrand} 长期维护。本站不是 OpenAI、Anthropic、Google、xAI 或 X 的官方网站。
      </div>
    </footer>
  );
}
