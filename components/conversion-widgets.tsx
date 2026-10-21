"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bookmark,
  Check,
  ShoppingBag,
  X,
} from "lucide-react";
import { siteContent } from "@/content/site";

const favoriteStorageKey = "gptplusapp-favorite-dismissed";

export function ConversionWidgets() {
  const pathname = usePathname();
  const [showFavorite, setShowFavorite] = useState(false);
  const [copied, setCopied] = useState<"url" | null>(null);
  const orderUrl = pathname?.startsWith("/chatgpt")
    ? "https://gpt3plus.com/cat/19"
    : siteContent.primaryCtaUrl;

  useEffect(() => {
    const dismissed = window.localStorage.getItem(favoriteStorageKey);
    if (!dismissed) {
      const timer = window.setTimeout(() => setShowFavorite(true), 1200);
      return () => window.clearTimeout(timer);
    }
  }, []);

  function dismissFavorite() {
    window.localStorage.setItem(favoriteStorageKey, "1");
    setShowFavorite(false);
  }

  async function copyText(value: string, type: "url") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  }

  return (
    <>
      {showFavorite ? (
        <div className="fixed right-4 top-24 z-[70] w-[calc(100vw-2rem)] max-w-sm rounded-[1.75rem] border border-[#d8c39b] bg-[#fffaf0]/95 p-5 text-[#17110c] shadow-2xl shadow-[#2b2118]/15 backdrop-blur-xl sm:right-6">
          <button
            aria-label="关闭收藏提示"
            className="absolute right-4 top-4 rounded-full p-2 text-[#6e6257] transition hover:bg-[#fff5dc] hover:text-[#17110c]"
            onClick={dismissFavorite}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
          <div className="flex items-start gap-4 pr-8">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-[#d8c39b] bg-[#fff5dc] text-[#9a6a2f]">
              <Bookmark aria-hidden="true" className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-black">收藏我们</h2>
              <p className="mt-3 text-sm font-semibold leading-7 text-[#6e6257]">
                收藏 GPT Plus App，下次查看 ChatGPT、Grok、Gemini、Claude
                充值教程和订单入口更方便。
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-[#8c612b] bg-[linear-gradient(135deg,#1a120c,#3a2817_54%,#9a6a2f)] px-4 py-2 text-sm font-black text-[#fff7e6] shadow-lg shadow-[#9a6a2f]/20 transition hover:brightness-110"
              onClick={() => copyText(window.location.href, "url")}
              type="button"
            >
              {copied === "url" ? <Check aria-hidden="true" className="size-4" /> : <Bookmark aria-hidden="true" className="size-4" />}
              {copied === "url" ? "网址已复制" : "立即收藏"}
            </button>
            <button
              className="min-h-12 rounded-2xl px-4 py-2 text-sm font-black text-[#5f5042] transition hover:bg-[#fff5dc]"
              onClick={dismissFavorite}
              type="button"
            >
              稍后再说
            </button>
          </div>
          <p className="mt-3 text-xs font-semibold leading-6 text-[#8a6b41]">
            也可以按 Ctrl+D 或 ⌘D 收藏本站。
          </p>
        </div>
      ) : null}

      <div className="fixed bottom-[100px] right-4 z-[65] flex flex-col items-end gap-3 sm:right-6">
        <a
          className="hidden items-center gap-3 rounded-full border border-[#d8c39b] bg-[linear-gradient(135deg,#d7ad5f,#9a6a2f)] px-5 py-3 text-sm font-black text-[#fff7e6] shadow-2xl shadow-[#9a6a2f]/25 transition hover:-translate-y-0.5 hover:brightness-110 sm:inline-flex"
          href={orderUrl}
          target="_blank"
          rel="noreferrer"
        >
          <ShoppingBag aria-hidden="true" className="size-5" />
          升级入口
          <span className="text-xs uppercase tracking-[0.22em]">Premium</span>
        </a>
      </div>
    </>
  );
}
