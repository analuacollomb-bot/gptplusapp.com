# GPT Plus App

GPT Plus App 是面向中文用户的 AI 会员充值教程知识库 + 自助下单引导站。站点由陈鹏AI服务长期维护，覆盖 ChatGPT、Claude、Gemini、Grok、YouTube、Spotify、X Premium、Midjourney、Poe、Perplexity 等产品的开通说明、支付失败排查、账号状态检查和风险提示。

第一版不做数据库后台、不做登录后台，内容通过 TypeScript 配置和 Markdown/MDX 文件维护，适合当天部署到 Vercel。

## 本地运行

```bash
npm install
npm run dev
```

默认访问：

```text
http://localhost:3000
```

生产构建检查：

```bash
npm run build
npm run start
```

代码检查：

```bash
npm run lint
```

## 内容配置系统

常用内容入口：

```text
content/site.ts            首页文案、导航、FAQ、CTA、页脚、风险提示
content/products.ts        手动商品数据与商品类型定义
content/products.generated.ts  爬虫生成的公开商品数据
content/articleTopics.ts   批量 SEO 文章主题
content/seo.ts             强搜索词专题页配置
content/posts/*.md         Markdown/MDX 教程文章
docs/google-indexing-standard.md  Google 收录执行标准
```

以后要改首页标题、按钮、FAQ、导航、页脚文案，优先修改 `content/site.ts`。

## 如何新增文章

在 `content/posts` 新增一个 `.md` 或 `.mdx` 文件即可。建议文件名与 `slug` 一致：

```text
content/posts/chatgpt-plus-guonei-chongzhi.md
```

文章会自动进入：

- `/blog`
- `/blog/[slug]`
- 对应专题页：`/chatgpt`、`/claude`、`/gemini`、`/grok`
- `/sitemap.xml`

## 文章格式

每篇文章必须包含：

```md
---
title: "ChatGPT Plus 国内充值教程"
description: "系统说明 ChatGPT Plus 国内开通方式、支付失败原因、充值前检查事项和常见风险。"
category: "ChatGPT"
slug: "chatgpt-plus-guonei-chongzhi"
date: "2026-05-27"
keywords: ["ChatGPT Plus充值", "ChatGPT Plus国内开通", "ChatGPT Plus支付失败"]
productId: "chatgpt-56"
productUrl: "https://gpt3plus.com/item/56"
---

## 本文适合谁

正文内容...
```

`category` 支持：

```text
ChatGPT / Claude / Gemini / Grok / YouTube / Spotify / X Premium / Midjourney / Poe / Perplexity / Other
```

文章页会根据 `productId` 自动显示相关商品卡片和自助下单按钮。

## 如何修改商品链接

优先修改：

```text
content/products.ts
```

如果商品来自公开抓取结果，重新运行：

```bash
npm run scrape:products
```

脚本会生成：

```text
data/products.json
content/products.generated.ts
data/products.skipped.json
```

`orderUrl` 就是前端“自助下单”按钮跳转的商品页。

## 商品抓取说明

脚本位置：

```text
scripts/scrape-products.ts
```

运行：

```bash
npm run scrape:products
```

抓取原则：

- 只访问 `https://gpt3plus.com/` 公开可访问页面和公开商品接口。
- 不访问后台、订单、用户、支付、隐私数据。
- 不绕过登录、验证码或反爬限制。
- 无法访问或无法识别的页面会写入 `data/products.skipped.json`，后续可手动补充。
- 商品介绍只作为事实参考，教程文章必须重新组织和原创写作。

## 如何批量生成 SEO 文章

脚本位置：

```text
scripts/generate-seo-articles.ts
```

运行：

```bash
npm run generate:articles
```

脚本会：

- 生成 `content/articleTopics.ts`
- 重写 `content/posts` 下的 Markdown 文章
- 自动写入 `productId` 和 `productUrl`
- 根据商品数据匹配对应自助下单入口

当前第二版策略是围绕 ChatGPT、Claude、Gemini、Grok 各生成 100 篇问题型教程，总计 400 篇。后续可以在脚本里继续扩充 `patterns` 和 `profiles`。

生成后建议人工抽查标题、正文、商品按钮和风险表述，不要出现脱离平台规则的夸大承诺。

## 站长维护页

本地或线上访问：

```text
/admin-content-guide
```

这是静态说明页，不是后台，不支持线上保存，仅用于提醒站长如何维护首页文案、FAQ、商品、文章、爬虫和部署流程。

## 检查 sitemap.xml 和 robots.txt

本地启动后访问：

```text
http://localhost:3000/sitemap.xml
http://localhost:3000/robots.txt
```

部署后访问：

```text
https://gptplusapp.com/sitemap.xml
https://gptplusapp.com/robots.txt
```

`sitemap.xml` 会包含首页、产品专题页、商品页、教程列表、文章页、评价页、FAQ、关于和联系页面。

## Google 收录执行标准

站长执行文档：

```text
docs/google-indexing-standard.md
```

上线后优先到 Google Search Console 添加 `gptplusapp.com` 域名资源，验证 DNS，提交：

```text
https://gptplusapp.com/sitemap.xml
```

再手动请求索引首页、`/topics`、四个产品页、强搜索词专题页和几篇核心文章。

## 部署到 Vercel

1. 将项目推送到 GitHub。
2. 登录 Vercel，选择 `Add New Project`。
3. 导入 GitHub 仓库。
4. Framework Preset 选择 `Next.js`。
5. Build Command 使用：

```bash
npm run build
```

6. Output Directory 保持默认。
7. 点击 Deploy。

## 绑定 gptplusapp.com

在 Vercel 项目中进入 `Settings` → `Domains`，添加：

```text
gptplusapp.com
www.gptplusapp.com
```

常见 DNS 配置：

```text
A      @      76.76.21.21
CNAME  www    cname.vercel-dns.com
```

等待 Vercel 显示验证通过，并确认 HTTPS 自动签发成功。

## GitHub 推送

当前目标仓库：

```text
https://github.com/analuacollomb-bot/gptplusapp.com.git
```

如果已有 remote origin，切换到新地址：

```bash
git remote -v
git remote set-url origin https://github.com/analuacollomb-bot/gptplusapp.com.git
```

提交并推送：

```bash
git add .
git commit -m "Add content system products and seo articles"
git branch -M main
git push -u origin main
```

如果还没有 remote：

```bash
git remote add origin https://github.com/analuacollomb-bot/gptplusapp.com.git
git push -u origin main
```

## 主要目录

```text
app/                    Next.js App Router 页面
app/products             商品承接页
app/admin-content-guide  站长内容维护说明页
app/topics               强搜索词专题页
components/              导航、页脚、按钮、文章卡片、专题页组件
content/site.ts          全站基础文案配置
content/seo.ts           SEO 关键词专题配置
content/products.ts      商品类型与手动商品配置
content/posts/           Markdown/MDX 文章目录
scripts/scrape-products.ts       公开商品抓取脚本
scripts/generate-seo-articles.ts 批量文章生成脚本
public/brand/avatar.png  陈鹏AI服务品牌头像
```
