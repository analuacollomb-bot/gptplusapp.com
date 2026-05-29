import type { Metadata } from "next";
import {
  BookOpen,
  FileText,
  Globe2,
  MessageCircle,
  PackageCheck,
  Settings2,
  ShieldAlert,
} from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { SectionHeading } from "@/components/section-heading";

export const metadata: Metadata = {
  title: "站长内容维护说明",
  description:
    "GPT Plus App 静态内容维护指南：修改首页文案、FAQ、商品链接、Markdown 文章、商品抓取与 Vercel 部署。",
  alternates: {
    canonical: "/admin-content-guide",
  },
  robots: {
    index: false,
    follow: false,
  },
};

const guideCards = [
  {
    title: "修改首页文字与 FAQ",
    icon: Settings2,
    file: "content/site.ts",
    description:
      "站点名称、品牌语、Hero 标题、副标题、按钮、FAQ、导航、页脚和风险提示都集中在这里。修改后重新构建即可生效。",
  },
  {
    title: "新增或修改教程文章",
    icon: FileText,
    file: "content/posts/*.md",
    description:
      "每篇文章一个 Markdown/MDX 文件。frontmatter 里必须包含 title、description、category、slug、date、keywords、productId、productUrl。",
  },
  {
    title: "维护商品链接",
    icon: PackageCheck,
    file: "content/products.ts",
    description:
      "可以手动维护商品数据，也可以先运行公开商品抓取脚本生成 products.generated.ts。文章页会根据 productId 自动显示相关商品按钮。",
  },
  {
    title: "批量文章主题",
    icon: BookOpen,
    file: "content/articleTopics.ts",
    description:
      "运行批量生成脚本后会输出文章主题列表。当前策略是先围绕 ChatGPT / Claude / Gemini / Grok 各铺 100 篇问题型教程，再按收录和搜索词表现精修。",
  },
  {
    title: "关键词专题页",
    icon: BookOpen,
    file: "content/seo.ts",
    description:
      "管理 GPT怎么充值、Grok怎么充值、Claude Pro充值、Gemini Pro充值 等强搜索词专题页，专题页负责承接购买意图并向文章和商品入口导流。",
  },
  {
    title: "实时博客导入",
    icon: MessageCircle,
    file: "scripts/import-telegram-posts.ts",
    description:
      "把陈鹏AI服务公开 Telegram 频道内容整理成 /telegram 专栏文章。脚本只读取公开预览页，也支持导入本地 HTML 备份。",
  },
  {
    title: "在线客服系统",
    icon: MessageCircle,
    file: "NEXT_PUBLIC_TAWK_PROPERTY_ID / NEXT_PUBLIC_TAWK_WIDGET_ID",
    description:
      "接入 Tawk.to 后，访客点击右下角客服按钮即可网页聊天，员工用电脑后台或手机 App 登录接待。备用微信号在 content/site.ts 维护。",
  },
  {
    title: "站点地图与收录",
    icon: Globe2,
    file: "app/sitemap.ts / app/robots.ts",
    description:
      "新增页面或文章后重新构建，sitemap.xml 会自动包含首页、专题页、商品页、文章页和 FAQ 等公开页面。",
  },
  {
    title: "上线前风险检查",
    icon: ShieldAlert,
    file: "README.md",
    description:
      "不要写夸大承诺。所有成交引导都应保持克制：先看说明、确认账号状态、理解风险边界，再决定是否下单。",
  },
];

const commands = [
  ["本地运行", "npm run dev"],
  ["抓取公开商品", "npm run scrape:products"],
  ["导入 TG 公开频道", "npm run import:telegram"],
  ["配置在线客服", "Vercel 环境变量：NEXT_PUBLIC_TAWK_PROPERTY_ID / NEXT_PUBLIC_TAWK_WIDGET_ID"],
  ["生成文章", "npm run generate:articles"],
  ["生产构建", "npm run build"],
  ["查看 sitemap", "http://localhost:3000/sitemap.xml"],
  ["查看 robots", "http://localhost:3000/robots.txt"],
  ["收录执行标准", "docs/google-indexing-standard.md"],
];

export default function AdminContentGuidePage() {
  return (
    <>
      <section className="compass-field relative overflow-hidden px-4 py-16 text-[#fff7e6] sm:px-6 lg:px-8">
        <div className="compass-mark" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#f0d89a]">
            Owner Guide
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            站长内容维护说明
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#ead9b8]">
            这是一个静态维护指南，不是公开后台，也不提供线上保存能力。第一版以快速上线和可持续更新为目标：改文案、改商品、改文章都走文件系统，部署到 Vercel 后重新发布即可。
          </p>
          <div className="mt-8 rounded-2xl border border-[#f0d89a]/25 bg-[#fffaf0]/10 p-5 text-sm font-semibold leading-7 text-[#fff5dc] backdrop-blur">
            仅供站长维护参考。请不要把后台、订单、用户隐私或支付数据放进本站；成交与订单查询统一回到 gpt3plus.com。
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Content System"
            title="你以后主要改这几类文件"
            description="当前没有数据库后台，所有内容都以 TypeScript 配置和 Markdown 文章形式管理，方便今天上线，也方便后续迁移到 Supabase。"
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {guideCards.map((card) => {
              const Icon = card.icon;
              return (
                <article className="gold-card rounded-2xl p-5" key={card.title}>
                  <Icon aria-hidden="true" className="size-5 text-[#9a6a2f]" />
                  <h2 className="mt-4 text-lg font-black text-[#17110c]">
                    {card.title}
                  </h2>
                  <p className="mt-2 rounded-lg border border-[#ead9b8] bg-[#fff5dc] px-3 py-2 font-mono text-xs font-semibold text-[#6b451a]">
                    {card.file}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-[#6e6257]">
                    {card.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#fff5dc] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <SectionHeading
            eyebrow="Workflow"
            title="上线后的内容更新流程"
            description="先在本地修改内容并检查页面，再推送 GitHub，Vercel 会自动部署。文章越多，越要坚持原创、可读和风险透明。"
          />
          <div className="gold-card rounded-2xl p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {commands.map(([label, command]) => (
                <div
                  className="rounded-xl border border-[#ead9b8] bg-[#fffaf0] p-4"
                  key={label}
                >
                  <p className="text-sm font-black text-[#17110c]">{label}</p>
                  <p className="mt-2 break-all font-mono text-xs font-semibold text-[#7b4f1c]">
                    {command}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/products" icon={PackageCheck} variant="secondary">
                查看商品页
              </ButtonLink>
              <ButtonLink href="/blog" icon={BookOpen} variant="primary">
                查看教程列表
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
