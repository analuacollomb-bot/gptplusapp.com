import type { Metadata } from "next";
import { GptBillingTool } from "@/components/gpt-billing-tool";
import { isLiveBillingQueryEnabled } from "@/lib/gpt-billing-availability";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ChatGPT 订阅查询",
  description: "了解如何在 ChatGPT 官方设置中核对订阅，并在浏览器内解析已有账单 JSON。在线实时查询暂不可用。",
  alternates: { canonical: "/tools/gpt-billing" },
  openGraph: {
    title: "ChatGPT 订阅查询 | GPT Plus App",
    description: "核对 ChatGPT 订阅，解析已有账单 JSON。在线实时查询暂不可用。",
    url: "/tools/gpt-billing",
  },
  referrer: "no-referrer",
};

export default function GptBillingPage() {
  return <GptBillingTool liveQueryEnabled={isLiveBillingQueryEnabled()} />;
}
