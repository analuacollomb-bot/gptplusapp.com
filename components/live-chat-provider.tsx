"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { Headphones } from "lucide-react";
import { OPEN_LIVE_CHAT_EVENT } from "@/components/live-chat-link";

declare global {
  interface Window {
    SupportWidget?: {
      open: () => void;
      close: () => void;
      on: (event: string, handler: (data: unknown) => void) => () => void;
    };
  }
}

export function LiveChatProvider() {
  const [unavailable, setUnavailable] = useState(false);
  const subscriptions = useRef<(() => void)[]>([]);
  const ready = useRef(false);
  const didAutoOpen = useRef(false);

  useEffect(() => () => {
    subscriptions.current.forEach(unsubscribe => unsubscribe());
  }, []);

  useEffect(() => {
    const openChat = (event: Event) => {
      if (!ready.current || !window.SupportWidget) return;
      event.preventDefault();
      window.SupportWidget.open();
    };
    window.addEventListener(OPEN_LIVE_CHAT_EVENT, openChat);
    return () => window.removeEventListener(OPEN_LIVE_CHAT_EVENT, openChat);
  }, []);

  return (
    <>
      <Script
        id="chenpeng-ai-customer-widget"
        src="https://kf-test.gptplusapp.com/widget/embed.js"
        data-site-key="site_b380909894065bc7af86c05a"
        strategy="afterInteractive"
        onReady={() => {
          subscriptions.current.forEach(unsubscribe => unsubscribe());
          const widget = window.SupportWidget;
          subscriptions.current = widget ? [
            widget.on("support:config", () => {
              ready.current = true;
              setUnavailable(false);
              if (!didAutoOpen.current && window.location.pathname === "/contact" && window.location.hash === "#online-chat") {
                didAutoOpen.current = true;
                widget.open();
              }
            }),
            widget.on("support:unavailable", () => {
              ready.current = false;
              setUnavailable(true);
            }),
          ] : [];
          if (!widget) setUnavailable(true);
        }}
        onError={() => {
          ready.current = false;
          setUnavailable(true);
        }}
      />
      {unavailable && (
        <a
          href="/contact"
          className="fixed bottom-[18px] right-[18px] z-[65] inline-flex min-h-14 items-center gap-2 rounded-full border border-[#d7ad5f]/70 bg-[#3a2817] px-5 py-3 text-sm font-bold text-[#fff7e6] shadow-xl"
          aria-label="AI客服暂时无法连接，查看联系方式"
        >
          <Headphones className="size-5" aria-hidden="true" />
          客服暂未连接 · 联系我们
        </a>
      )}
    </>
  );
}
