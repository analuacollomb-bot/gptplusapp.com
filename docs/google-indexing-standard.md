# GPT Plus App Google 收录执行标准

目标不是口嗨“我觉得网站不错”，而是让 Google 先认识本站的主题：AI 会员充值教程、支付失败排查、账号状态检查、平台风控说明、ChatGPT / Claude / Gemini / Grok 使用技巧。

## 第一优先级

1. 在 Google Search Console 添加 `gptplusapp.com` 域名资源。
2. 使用 DNS 验证域名所有权。
3. 提交站点地图：

```text
https://gptplusapp.com/sitemap.xml
```

4. 手动请求索引这些页面：

```text
https://gptplusapp.com/
https://gptplusapp.com/topics
https://gptplusapp.com/topics/grok-zenme-chongzhi
https://gptplusapp.com/topics/gpt-zenme-chongzhi
https://gptplusapp.com/topics/chatgpt-plus-chongzhi
https://gptplusapp.com/topics/claude-pro-chongzhi
https://gptplusapp.com/topics/gemini-pro-chongzhi
https://gptplusapp.com/blog/grok-zenme-chongzhi
https://gptplusapp.com/blog/chatgpt-plus-guonei-chongzhi
https://gptplusapp.com/blog/claude-pro-chongzhi-zhuyi
https://gptplusapp.com/blog/gemini-pro-guonei-shiyong
```

## 每天内容节奏

先铺量，再筛选，最后精修。

- 每天新增或重写 20-50 篇问题型教程。
- 优先写购买意图词：怎么充值、怎么开通、支付失败、下单前注意、账号状态、风控、欠款、邮箱填错。
- 其次写使用技巧：入口在哪、会员状态怎么看、怎么确认权益、常见功能怎么用。
- 不追求每篇都像长篇论文，但每篇必须能回答一个真实问题。

## 单篇文章最低结构

每篇文章必须有：

- 本文适合谁
- 常见问题场景
- 下单前检查清单
- 解决思路
- 风险说明
- 自助下单引导
- FAQ

不要写空话，不要写夸张承诺，不要只堆关键词。

## 站内结构标准

当前站点分三层：

- 第一层：首页、四个产品页、关键词专题页 `/topics`
- 第二层：强搜索词专题页 `/topics/[slug]`
- 第三层：具体问题文章 `/blog/[slug]`

每篇文章要链接到：

- 对应产品页
- 相关专题页
- 商品入口 `/products`
- 自助下单页 `https://gpt3plus.com/`

## Google Search Console 看什么

每天看：

- 页面是否被发现
- sitemap 是否读取成功
- 哪些页面已编入索引
- 哪些页面是“已抓取，尚未编入索引”
- 搜索查询里是否开始出现 Grok、ChatGPT Plus、Claude Pro、Gemini 等关键词

如果大量页面未收录，先优化内链和标题，不要只继续堆文章。

## 版本发布标准

每次改完内容：

```bash
git add .
git commit -m "Expand seo content and indexing hubs"
git push
```

Vercel 自动部署成功后，再到 Search Console 重新提交 sitemap 或请求索引核心页面。
