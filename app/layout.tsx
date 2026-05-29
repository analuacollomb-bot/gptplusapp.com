import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ConversionWidgets } from "@/components/conversion-widgets";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "GPT Plus App | AI会员充值与使用教程知识库",
    template: "%s | GPT Plus App",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "AI会员充值",
    "ChatGPT Plus充值",
    "Claude Pro充值",
    "Gemini Pro充值",
    "Grok会员开通",
    "国内AI工具使用教程",
    "陈鹏AI服务",
  ],
  authors: [{ name: siteConfig.chineseBrand }],
  creator: siteConfig.chineseBrand,
  publisher: siteConfig.name,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: "GPT Plus App | AI会员充值与使用教程知识库",
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "GPT Plus App | AI会员充值与使用教程知识库",
    description: siteConfig.description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#17110c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body>
        <SiteHeader />
        <main className="min-h-screen">{children}</main>
        <SiteFooter />
        <ConversionWidgets />
      </body>
    </html>
  );
}
