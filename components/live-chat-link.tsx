"use client";

import type { ReactNode } from "react";

export const OPEN_LIVE_CHAT_EVENT = "chenpeng:open-live-chat";

export function LiveChatLink({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href="/contact#online-chat"
      className={className}
      onClick={(event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        // The provider only handles this when the existing widget can open.
        // Otherwise the link leads to the contact page and backup details.
        if (!window.dispatchEvent(new Event(OPEN_LIVE_CHAT_EVENT, { cancelable: true }))) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </a>
  );
}
