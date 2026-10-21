"use client";

import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ConversionWidgets } from "@/components/conversion-widgets";
import { LiveChatProvider } from "@/components/live-chat-provider";

function isCredentialToolPath(pathname: string) {
  return (
    pathname === "/tools/gpt-billing" ||
    pathname.startsWith("/tools/gpt-billing/")
  );
}

export function PrivacyAwareProviders() {
  const pathname = usePathname();

  if (isCredentialToolPath(pathname)) {
    return null;
  }

  return (
    <>
      <LiveChatProvider />
      <ConversionWidgets />
      <Analytics />
    </>
  );
}

export function PrivacyAwareLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  // A fresh document removes previous scripts when entering and the tool's CSP
  // when leaving, while ordinary pages keep Next.js client navigation.
  if (isCredentialToolPath(pathname) || isCredentialToolPath(href)) {
    return (
      <a className={className} href={href}>
        {children}
      </a>
    );
  }

  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}
