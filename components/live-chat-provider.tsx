"use client";

import Script from "next/script";

declare global {
  interface Window {
    Tawk_API?: {
      maximize?: () => void;
      hideWidget?: () => void;
      onLoad?: () => void;
    };
    Tawk_LoadStart?: Date;
  }
}

export function LiveChatProvider() {
  const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID;
  const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID;

  if (!propertyId || !widgetId) {
    return null;
  }

  return (
    <Script
      id="tawk-to-live-chat"
      src={`https://embed.tawk.to/${propertyId}/${widgetId}`}
      strategy="lazyOnload"
      onReady={() => {
        window.Tawk_API = window.Tawk_API || {};
        window.Tawk_LoadStart = window.Tawk_LoadStart || new Date();
      }}
    />
  );
}
