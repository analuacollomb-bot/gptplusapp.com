import type { Metadata } from "next";
import {
  ArrowUpRight,
  BookOpen,
  MessageCircle,
  Radio,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ArticleCard } from "@/components/article-card";
import { ButtonLink } from "@/components/button-link";
import { SectionHeading } from "@/components/section-heading";
import { siteContent } from "@/content/site";
import { getTelegramPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "陈鹏AI服务实时博客",
  description:
    "陈鹏AI服务 Telegram 公开频道内容整理，围绕 ChatGPT、Claude、Gemini、Grok 等 AI 会员充值、账号检查、支付失败和使用技巧进行长期更新。",
  alternates: {
    canonical: "/telegram",
  },
};

const blogSignals = [
  {
    title: "频道原文沉淀",
    description:
      "把公开频道里的实时提醒、商品说明、账号问题和使用经验整理成可检索文章，方便用户回看。",
    icon: MessageCircle,
  },
  {
    title: "搜索词友好",
    description:
      "在保留原文气质的基础上补充标题、关键词、风险说明和下单前检查，让搜索用户更快看懂重点。",
    icon: Sparkles,
  },
  {
    title: "不拼低价",
    description:
      "陈鹏AI服务主打稳定靠谱和规则透明，重点帮用户判断账号状态、平台规则和售后边界。",
    icon: ShieldCheck,
  },
];

export default function TelegramPage() {
  const posts = getTelegramPosts();

  return (
    <>
      <section className="compass-field relative overflow-hidden px-4 py-16 text-[#fff7e6] sm:px-6 lg:px-8">
        <div className="compass-mark" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#d7ad5f]/35 bg-[#fffaf0]/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#f0d89a]">
              <Radio aria-hidden="true" className="size-4" />
              Telegram Live Notes
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
              陈鹏AI服务实时博客
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[#ead9b8]">
              这里整理陈鹏AI服务公开频道里的实时内容：AI
              会员开通提醒、账号状态判断、支付失败排查、商品规则变化和使用技巧。频道内容偏即时，网站文章负责沉淀，方便用户通过关键词找到答案。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="#live-posts" icon={BookOpen} variant="dark">
                查看实时博客
              </ButtonLink>
              <ButtonLink
                external
                href={siteContent.telegramUrl}
                icon={ArrowUpRight}
                variant="dark"
              >
                关注 TG 频道
              </ButtonLink>
            </div>
          </div>

          <div className="rounded-2xl border border-[#d7ad5f]/35 bg-[#fffaf0]/10 p-5 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="rounded-xl border border-[#d7ad5f]/25 bg-[#17110c]/70 p-5">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#f0d89a]">
                Live Index
              </p>
              <h2 className="mt-3 text-2xl font-black text-[#fff7e6]">
                频道内容进入网站索引
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#ead9b8]">
                每条公开频道笔记都会整理成独立文章，保留原文重点，并补充“适合谁、检查清单、风险说明、FAQ、自助下单入口”。
              </p>
              <div className="mt-5 grid gap-3">
                {blogSignals.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      className="rounded-xl border border-[#d7ad5f]/20 bg-[#fffaf0]/8 p-4"
                      key={item.title}
                    >
                      <div className="flex items-center gap-2 text-sm font-black text-[#fff7e6]">
                        <Icon aria-hidden="true" className="size-4 text-[#f0d89a]" />
                        {item.title}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#d8c39b]">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {blogSignals.map((item) => {
            const Icon = item.icon;
            return (
              <article className="gold-card rounded-2xl p-6" key={item.title}>
                <Icon aria-hidden="true" className="size-6 text-[#9a6a2f]" />
                <h2 className="mt-4 text-xl font-black text-[#17110c]">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#6e6257]">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="live-posts" className="bg-[#fff5dc] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Chenpeng AI Service"
            title="实时博客文章"
            description="这些文章来自公开频道内容整理，适合搜索充值问题、账号疑难、支付失败和 AI 工具使用技巧的用户。"
          />

          {posts.length > 0 ? (
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <ArticleCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-[#d8c39b] bg-[#fffaf0] p-8 text-center">
              <p className="text-lg font-black text-[#17110c]">
                频道内容正在导入
              </p>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#6e6257]">
                当公开频道内容导入后，这里会自动展示“陈鹏AI服务实时博客”文章。你也可以先关注频道，查看最新提醒和服务说明。
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <ButtonLink
                  external
                  href={siteContent.telegramUrl}
                  icon={ArrowUpRight}
                  variant="secondary"
                >
                  关注 TG 频道
                </ButtonLink>
                <ButtonLink href="/blog" icon={BookOpen}>
                  查看教程库
                </ButtonLink>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-2xl border border-[#d7ad5f]/35 bg-[#17110c] p-8 text-[#fff7e6] shadow-xl shadow-[#2b2118]/15 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#f0d89a]">
                Follow Channel
              </p>
              <h2 className="mt-3 text-3xl font-black">
                想看最新提醒，可以先关注 TG 频道
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#d8c39b]">
                网站负责沉淀长期可搜索内容，频道负责发布更即时的商品说明、服务提醒和 AI 工具使用笔记。下单前仍建议回到商品页阅读最新规则。
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink
                external
                href={siteContent.telegramUrl}
                icon={ArrowUpRight}
                variant="dark"
              >
                关注 TG 频道
              </ButtonLink>
              <ButtonLink
                external
                href={siteConfig.productUrl}
                icon={ArrowUpRight}
                variant="dark"
              >
                自助下单
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
