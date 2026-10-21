# GPT Plus App

GPT Plus App 是面向中文用户的 AI 会员充值教程知识库 + 自助下单引导站。站点由陈鹏AI服务长期维护，覆盖 ChatGPT、Claude、Gemini、Grok、YouTube、Spotify、X Premium、Midjourney、Poe、Perplexity 等产品的开通说明、支付失败排查、账号状态检查和风险提示。

原网站没有公开的数据库后台或登录后台，内容通过 TypeScript 配置和 Markdown/MDX 文件维护。现已增加仅在本机运行的文章后台，方便编辑文案、保存草稿和发布到本地项目。

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
data/telegram-posts.json   Telegram 公开频道导入备份
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
ChatGPT / Claude / Gemini / Grok / YouTube / Spotify / X Premium / Midjourney / Poe / Perplexity / 陈鹏AI服务 / Other
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

## 如何导入 Telegram 公开频道内容

实时博客专栏地址：

```text
/telegram
```

默认导入频道：

```text
https://t.me/netfix666
```

运行：

```bash
npm run import:telegram
```

脚本会只读取 `https://t.me/s/netfix666` 公开预览页，不登录、不抓后台、不抓订单、不绕过验证码或反爬限制。导入后会生成：

```text
content/posts/telegram-netfix666-*.md
data/telegram-posts.json
```

每篇文章会尽量保留频道原文要点，并补充 SEO 标题、关键词、适合谁、下单前检查清单、风险说明、FAQ 和自助下单入口。

如果当前网络无法访问 Telegram，可以先把公开频道页面导出为 HTML，放到：

```text
data/netfix666.html
```

再运行：

```bash
npm run import:telegram -- --source=data/netfix666.html
```

如果你是频道主，也可以用 Telegram Desktop 导出频道 `result.json`，再运行：

```bash
npm run import:telegram -- --source=data/result.json
```

也可以限制导入数量：

```bash
npm run import:telegram -- --limit=50
```

如果 Telegram Desktop 里有多个导出文件夹，可以直接把整个导出父目录传给脚本，脚本会递归读取所有 `messages*.html` 和 `result.json`，并按文章 slug 去重：

```bash
npm run import:telegram -- --source="/Users/cp/Downloads/Telegram Desktop" --limit=1000
```

## 站长维护页

本地或线上访问：

```text
/admin-content-guide
```

这是静态说明页，不是后台，不支持线上保存，仅用于提醒站长如何维护首页文案、FAQ、商品、文章、爬虫和部署流程。

## 在线客服系统

网站已预留 Tawk.to 在线客服接入。接入后，用户点击网页右下角客服按钮即可直接聊天，员工可以用 Tawk.to 电脑后台或手机 App 登录接待、回复和接收通知。

Vercel 环境变量：

```text
NEXT_PUBLIC_TAWK_PROPERTY_ID=
NEXT_PUBLIC_TAWK_WIDGET_ID=
```

获取方式：

1. 注册并登录 `https://www.tawk.to/`。
2. 新建 Property，网站地址填 `https://www.gptplusapp.com/`。
3. 在 Tawk.to 后台找到 Widget Code，通常格式类似：

```html
https://embed.tawk.to/PROPERTY_ID/WIDGET_ID
```

4. 把 `PROPERTY_ID` 填到 `NEXT_PUBLIC_TAWK_PROPERTY_ID`。
5. 把 `WIDGET_ID` 填到 `NEXT_PUBLIC_TAWK_WIDGET_ID`。
6. 在 Vercel 项目 `Settings` → `Environment Variables` 添加上面两个变量，重新部署。

员工接待方式：

- 电脑端登录 Tawk.to Dashboard。
- 手机安装 Tawk.to App，用员工账号登录。
- 站长在 Tawk.to 后台邀请员工账号，不建议多人共用一个密码。

备用联系方式集中在 `content/site.ts`：

```text
wechatId: "dcpluspro"
serviceHours: "早10点 - 晚24点"
```

## 检查 sitemap.xml 和 robots.txt

本地启动后访问：

```text
http://localhost:3000/sitemap.xml
http://localhost:3000/robots.txt
```

部署后访问：

```text
https://www.gptplusapp.com/sitemap.xml
https://www.gptplusapp.com/robots.txt
```

`sitemap.xml` 会包含首页、产品专题页、商品页、教程列表、文章页、评价页、FAQ、关于和联系页面。

## Google 收录执行标准

站长执行文档：

```text
docs/google-indexing-standard.md
```

上线后优先到 Google Search Console 添加 `gptplusapp.com` 域名资源，验证 DNS，提交：

```text
https://www.gptplusapp.com/sitemap.xml
```

再手动请求索引首页、`/topics`、`/telegram`、四个产品页、强搜索词专题页、几篇核心文章和最新导入的实时博客文章。

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
scripts/generate-daily-problem-posts.ts 每日 10 篇真实问题解答脚本
scripts/daily-content-publish.sh 每日生成、验证、提交和推送脚本
public/brand/avatar.png  陈鹏AI服务品牌头像
```

## 每日 10 篇问题解答

每日内容脚本会扫描 `content/posts` 里已有标题，标题相似度超过 70% 会自动跳过并换题，避免重复页面。

手动生成当天 10 篇：

```bash
npm run generate:daily-content
```

如果当前环境没有 `npm`，或需要一次性完成生成、验证、提交和推送：

```bash
./scripts/daily-content-publish.sh
```

指定日期或数量：

```bash
npm run generate:daily-content -- --date=2026-06-22 --count=10
```

发布脚本支持指定日期和数量：

```bash
DAILY_ARTICLE_DATE=2026-06-24 DAILY_ARTICLE_COUNT=10 ./scripts/daily-content-publish.sh
```

文章结构固定为：

```text
# 标题
## 一句话答案
## 问题原因
## 解决方法
## 常见误区
## 实际经验分享
## 相关问题
## 关于陈鹏AI服务
```

新增文章会自动进入 `/blog/[slug]`，`sitemap.xml` 和 `rss.xml` 会在构建时自动更新。

## 本机文章后台

在 Finder 打开此项目文件夹，双击根目录的 **启动文章后台.command**，会打开终端并自动打开浏览器。也可以在项目目录运行：

```bash
npm run admin
```

没有 `npm` 命令时，直接运行：

```bash
bash scripts/local-admin.sh
```

启动器会查找已有的 Node.js 并使用项目已安装的依赖，不会安装依赖。默认地址为文章后台 `http://127.0.0.1:4318/`，网站预览 `http://127.0.0.1:3000/`。后台和预览只监听本机地址，无需额外账号密码。请保持启动终端窗口打开；按 **Ctrl+C** 停止本次启动的服务。重复启动时会核验并复用本项目的服务，不会关闭其他程序。

日常操作：

1. 打开后台，搜索已有文章并编辑，或新建文章。
2. 直接写入或粘贴正文；标题可以留空。点击 **Codex 帮我整理**，通过本机已登录 ChatGPT 的 Codex 自动整理分类、摘要、网址、关键词、商品关联及现有站内教程建议，正文不会被自动改写。
3. 查看整理结果；需要时点击“插入相关教程”添加内链。技术字段收在“高级设置”中，手动填写的设置会优先保留。也可以选择“快速自动配置”，不调用模型；直接发布时同样会自动补齐设置。
4. 点击保存草稿，内容保存在本项目的 `.local-admin/drafts`，此时不会进入网站文章列表。浏览器还会临时保留未保存输入，刷新后可继续编辑；重要文案仍建议保存草稿。
5. 点击保存并发布到本地，文章写入 `content/posts`；修改已有文章前会自动备份到 `.local-admin/backups`。通过网站预览检查排版和链接。

Codex 整理使用当前支持的 `gpt-6.1-sol`，只返回元数据建议，不会直接修改或发布文章。调用失败时会明确标示使用本地规则补齐，仍可保存；不确定的商品保留总入口，已有文章的网址保持不变。无需另填 OpenAI API Key。

**发布到本地只保存项目文件，不会自动上线，不会提交或推送 Git，也不会触发部署。** 草稿和备份是本机文件，请妥善保留项目目录。网站上线仍需单独执行后续发布流程。

端口被其他程序占用时，启动器会提示并停止。需要换端口或不自动打开浏览器，可以运行：

```bash
ADMIN_PORT=4319 SITE_PREVIEW_PORT=3001 ADMIN_NO_OPEN=1 bash scripts/local-admin.sh
```

如需指定 Node.js 路径，可设置 `NODE_BIN=/完整路径/node` 后运行同一命令。

## ChatGPT 订阅查询工具

导航“商品”和“教程”之间的 **订阅查询** 进入 `/tools/gpt-billing`，桌面、手机和页脚均有入口。

- **快速查询**：输入用户本人的 ChatGPT Access Token 或完整 Session JSON，读取当前账号套餐及接口实际返回的权益信息。
- **深度查询**：在账号查询基础上，补充所选账号的订阅账期、到期时间、自动续费和欠费状态；字段未返回时保持“未知”，部分查询失败会明确提示。
- **本地解析**：只在浏览器读取已有账单 JSON，不联网，也不把 Token 声明当成已经核实的订阅信息。

实时查询只使用本站 `POST /api/tools/gpt-billing` 接口。服务端只允许对 `chatgpt.com` 的账号检查及订阅查询路径执行 GET，不接收任意上游地址，不会取消订阅、付款或改动账号。个人 ChatGPT 账单与 API Platform 账单不是同一服务，无需填写 OpenAI API Key。

这里使用 ChatGPT 网页端查询接口，**不是保证长期兼容的公开账单 API**。访问环境、账号权限或上游变动都可能导致拒绝请求；遇到这种情况会报出可理解的错误，不回退到不明代理或参考站。真实账号的最终结果应以 ChatGPT 设置中的账单页面为准。未提供真实凭证时，仅能验证解析和模拟上游响应，不能声称已完成真实账号联调。

实时查询的网络传输会优先使用 `HTTPS_PROXY` / `https_proxy`，并遵守 `NO_PROXY` / `no_proxy`。本地 macOS 未设置这些环境变量时，会读取电脑已经启用的 HTTPS 系统代理，仅用于当前账单查询请求；不会修改系统设置、环境变量或进程的全局代理。代理传输需要 Node.js 24.5+ 或 22.21+；当前桌面启动器使用的 Node.js 24.19.0 支持此能力。没有代理配置的部署环境继续直接请求 ChatGPT。连通性失败、凭证不被接受和上游拒绝访问会分别处理；能够建立连接仍不代表某个账号一定能返回账单。

隐私实现：凭证仅在用户主动查询后，经本站服务器发往 ChatGPT，不写入文件、数据库、日志或浏览器存储，不放在 URL 中；返回值仅包含白名单订阅字段，不回传 Token 或原始响应。输入和结果可一键清空；查询页面不加载 Google Translate、Tawk 或 Analytics，配合专属 CSP 限制外部脚本及连接。进入及离开该工具采用整页导航，避免其他页面已加载的脚本留在同一文档中。查询接口设置不缓存、请求/响应大小限制、超时、来源检查和进程内限流；后者在多实例部署下不构成全局限流。

仅凭 AccountID 不能实时获取他人的账单。参考站的此模式依赖其自有历史记录，本项目不接入或复制该账号库。Session 的 `expires` 和 JWT 的 `exp` 仅为登录凭证有效期，绝不显示为会员到期时间。

本地运行 `npm run admin` 后可访问 `http://127.0.0.1:3000/tools/gpt-billing`。定向验证：

```bash
node --import tsx --test lib/gpt-billing.test.ts lib/gpt-billing-server.test.ts lib/gpt-billing-network.test.ts
npx tsc --noEmit
```
