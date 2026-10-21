"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { Headphones } from "lucide-react";
import { LiveChatLink, OPEN_LIVE_CHAT_EVENT } from "@/components/live-chat-link";

const widgetOrigin = "https://kf-test.gptplusapp.com";
const widgetFrameSelector = 'iframe[title="在线客服"][src^="https://kf-test.gptplusapp.com/widget/index.html?siteKey=site_b380909894065bc7af86c05a&"]';

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
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
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

  useEffect(() => {
    const syncChatWindow = (event: MessageEvent) => {
      const frame = document.querySelector<HTMLIFrameElement>(widgetFrameSelector);
      if (!frame || event.origin !== widgetOrigin || event.source !== frame.contentWindow) return;
      const payload: unknown = event.data;
      if (!payload || typeof payload !== "object" || !("type" in payload)) return;
      if (payload.type !== "support:resize" || !("open" in payload) || typeof payload.open !== "boolean") return;

      // Keep the SDK's iframe and conversation alive, showing it only while open.
      frame.dataset.chenpengChatOpen = String(payload.open);
      setChatOpen(payload.open);
      if (payload.open) setUnreadCount(0);
    };
    window.addEventListener("message", syncChatWindow);
    return () => window.removeEventListener("message", syncChatWindow);
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
              setChatOpen(false);
            }),
            widget.on("support:unread", (data) => {
              if (!data || typeof data !== "object" || !("count" in data)) return;
              const count = Number(data.count);
              setUnreadCount(Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0);
            }),
          ] : [];
          if (!widget) setUnavailable(true);
        }}
        onError={() => {
          ready.current = false;
          setUnavailable(true);
        }}
      />
      {!chatOpen && (
        <LiveChatLink
          className="fixed bottom-5 right-4 z-[65] inline-flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full outline-offset-4 transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-[#d7ad5f] sm:right-6"
          ariaLabel={unavailable
            ? "陈鹏AI服务客服中心暂未连接，查看备用联系方式"
            : `打开陈鹏AI服务客服中心${unreadCount ? `，${unreadCount}条未读消息` : ""}`}
        >
          <span className="rounded-full border border-[#d8c39b] bg-[#fffaf0]/95 px-4 py-2.5 text-xs font-black text-[#3a2817] shadow-xl shadow-[#2b2118]/15 backdrop-blur-sm sm:text-sm">
            陈鹏AI服务客服中心
            {unavailable && <span className="mt-0.5 block text-[11px] font-semibold text-[#8a6b41]">暂未连接 · 查看联系方式</span>}
          </span>
          <span className="relative inline-flex size-16 shrink-0 items-center justify-center rounded-full border border-[#d7ad5f]/70 bg-[linear-gradient(135deg,#1a120c,#6b451a_52%,#d7ad5f)] text-[#fff7e6] shadow-2xl shadow-[#9a6a2f]/35 transition hover:brightness-110">
            <Headphones className="size-7" aria-hidden="true" />
            {unreadCount > 0 && (
              <span aria-hidden="true" className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#fffaf0] bg-[#b53d2f] px-1 text-[10px] font-bold leading-none text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </span>
        </LiveChatLink>
      )}
    </>
  );
}
