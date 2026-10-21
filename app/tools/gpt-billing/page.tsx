import type { Metadata } from "next";
import { GptBillingTool } from "@/components/gpt-billing-tool";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ChatGPT 订阅查询",
  description: "查询 ChatGPT 账号套餐、订阅状态和本期结束时间，支持 Access Token、Session JSON 实时查询及账单 JSON 本地解析。",
  alternates: { canonical: "/tools/gpt-billing" },
  openGraph: {
    title: "ChatGPT 订阅查询 | GPT Plus App",
    description: "查看套餐与订阅状态，清楚了解每一项返回结果。",
    url: "/tools/gpt-billing",
  },
  referrer: "no-referrer",
};

export default function GptBillingPage() {
  return <GptBillingTool />;
}
