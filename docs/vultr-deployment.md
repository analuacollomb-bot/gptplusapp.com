# gptplusapp.com 自托管部署

本说明记录现有项目在用户 Vultr 服务器上的部署、更新和回滚方法，保留文章、页面地址、商品链接和客服入口。

## 2026-11-16 Gemini 图文文章发布

- 当前 release 更新为 `/opt/gptplusapp/releases/20261116-641a6ef-gemini`，源码提交 `641a6ef2631f0f565943d8c8409bcec6809d9430`。
- 新增 `/blog/gemini-pro-ultra-monthly-account-guide`：Gemini Pro / Ultra 一个月独享成品号介绍，含规格对比、五步上手说明、售后信息、站内链接及原创 AI 风景配图。封面为 1440 × 810 WebP，约 180 KB，保存在 `public/images/articles/gemini-pro-ultra/`。
- 原有 1,527 篇文章未改动；当前共 1,528 篇，运行包逐文件 SHA-256 核对通过。Linux 构建、TypeScript、候选进程及正式进程检查通过；正式 HTTPS 的文章、图片、首页、Gemini 分类、文章列表、站点地图、RSS 与四项静态资源均返回 200。Chrome 已打开正式文章并显示配图。
- 保留上次 release，先在回环端口 `3069` 验证，再原子切换 `current` 并仅重启 `gptplusapp.service`。候选服务已停止；Nginx、DNS、证书、原商城及支付服务未作调整。运行包保留上一版本静态资源，供已打开旧页面的访客继续加载。
- 当前商品记录没有准确对应的 Pro / Ultra 20X 一个月商品，文章链接至 `https://gpt3plus.com/`，未凭旧商品标题硬配链接或补写价格。生产实时订阅查询继续关闭，工具页面隔离检查通过。

## 2026-11-15 正式切换记录

- 用户已手动调整 NameSilo 解析：根域 A 为 `207.148.94.8`，`www` CNAME 为 `gptplusapp.com`。DNSOWL 三台权威服务器及公共解析器已验证。
- 当前 release 为 `/opt/gptplusapp/releases/20261114-82f08e9-vps1`；原内容版本为 `82f08e902dc5f3ce5c3ca6362fb872d10c68d723`，迁移代码提交为 `7d911c6516be18444c4ea1b59f0e9fd47fc70c9b`。Linux 构建生成 1,575 个页面；1,527 篇文章逐文件 SHA-256 校验通过，站点地图文章 URL 数为 1,527。
- `gptplusapp.service` 已启用开机启动，仅监听 `127.0.0.1:3068`；宝塔现有 Nginx 转发本站流量。HTTP 和根域 HTTPS 均 308 到 `https://www.gptplusapp.com`，保留路径与查询参数。
- Let’s Encrypt 正式证书已签发，覆盖根域与 `www`，本次证书到期时间为 `2027-02-13 01:11:14 UTC`。专用续期 timer 已启用，带 Nginx 检查及 reload hook 的续期 dry-run 已通过。
- 外网直连检查：首页、文章列表、抽查文章、联系页、商品页、订阅查询页、站点地图、RSS、robots、头像与页面静态资源返回 HTTPS 200。首页、联系页与文章仍含原耳机入口和客服脚本；订阅查询页保持独立 CSP、不缓存、无客服脚本，生产实时查询继续关闭。
- 原商城 `https://gpt3plus.com` 返回 200，原数据库、PHP 和支付进程仍在运行；未进行真实付款或发送客服测试消息。
- 切换后部分公共递归 DNS 仍缓存旧 Vercel 记录，导致本机 `7890` 代理返回旧平台 402；权威记录已全部正确，用户同时确认手机访问正常。不能只凭一台递归解析器的新结果判断所有访问路径已生效。
- 已为这台 Mac 的 ClashX Pro 当前配置增加根域和 `www` 的两项 hosts 映射（`207.148.94.8`）及两条精确域名 DIRECT 规则；其他配置逐字节对比未改变，原件在本机私有目录备份，未纳入 Git。修复后同一代理路径访问首页、联系页返回 nginx 200，Chrome 已实际显示首页，HTTPS 校验正常。若以后更换服务器 IP，需同步更新或移除这四项本机覆盖；它们不改变公共 DNS 或其他访客的网络设置。

服务器的 `/opt/gptplusapp/DEPLOYMENT.json` 保存当前 release、源码校验值和验收记录。Nginx 切换前备份在 `/opt/gptplusapp/backups/20261114/`。后续发布仍应重新验收，不能只依据本次记录判断新版本已经上线。

## 目标环境与边界

- 服务器：`207.148.94.8`，Debian 12，2 vCPU、4 GB 内存。
- 复用现有宝塔 Nginx。已确认该环境没有 Docker 和 Node.js；本方案使用独立 Node.js 安装，不另装 Nginx 或 Docker。
- Node.js 固定为 `24.22.3`，安装在 `/opt/gptplusapp/runtime/`，不覆盖系统可执行文件或其他项目的运行时。
- 本站进程使用独立用户 `gptplusapp`，只监听 `127.0.0.1:3068`。在写入前再次确认该端口、目录、服务名和域名 vhost 没有被现有服务占用。
- 域名由 NameSilo / DNSOWL 管理，DNS 切换是独立步骤。不要更改名称服务器、邮件记录或其他子域名。
- 不复制密码、SSH 私钥、真实 `.env`、`.local-admin` 草稿与备份、Codex 登录资料或本机 `node_modules`。本机文章管理后台不部署到公网。
- 不运行文章生成脚本、每日发布脚本或商品爬虫。迁移使用现有文章和商品数据。

## 目录结构

```text
/opt/gptplusapp/
  runtime/
    node-v24.22.3-linux-x64/
    current -> node-v24.22.3-linux-x64
  build-cache/
  releases/
    <release-id>/
      source/                  本次源码和 Linux 构建目录
      app/                     standalone 运行目录
        server.js
        node_modules/
        .next/
        public/
        content/posts/
  current -> releases/<release-id>/app
```

部署模板：

- `deploy/vultr/gptplusapp.service`：单独的 systemd 服务。
- `deploy/vultr/nginx.conf.example`：专属站点的最终 HTTPS 配置。
- `deploy/vultr/gptplusapp-certbot.service` / `.timer`：仅续期本站证书，每天检查两次。
- `deploy/vultr/reload-nginx.sh`：续期成功后先检查配置，再平滑 reload 现有 Nginx。

`source` 和 `app` 分开，避免构建中的文件影响正在服务的版本。每次创建新 release，验证成功后再切换 `current`，保留上一 release 便于回滚。

## 准备运行时和源码

1. 只读检查已有监听端口、systemd 服务、磁盘、可用内存、Nginx 二进制路径及其 vhost include 目录。不要停止既有站点、容器或数据库。
2. 若用户或目录已存在，先确认归属；不要覆盖未知同名资源。为新站点建立 `gptplusapp` 系统用户，使用不允许交互登录的 shell，单独创建上述目录。
3. 先以 `uname -m` 确认架构。对于 x86-64，从 Node.js 官方发布目录下载 `node-v24.22.3-linux-x64.tar.xz` 及对应 `SHASUMS256.txt`，核对校验值后解压至 `/opt/gptplusapp/runtime/`。`runtime/current` 指向该版本。运行时文件保持 root 所有、普通用户只读。
4. 源码包应来自清晰可追溯的项目版本。将本次部署所需改动纳入选定提交后，可用 `git archive` 导出该提交；不要用包含密钥和未审核文件的整个工作目录打包。若存在未提交改动，先明确其是否属于本次部署，不能悄悄遗漏或发布。
5. 将源码解压到新 release 的 `source/`，把该 release 及 `build-cache/` 交给 `gptplusapp` 用户。不要迁入 Mac 的 `node_modules`、开发 `.next` 或 `.local-admin`。

`NEXT_PUBLIC_SELF_HOSTED=1` 在构建时关闭 Vercel 专用统计请求；`GPTPLUSAPP_BUILD_CPUS=1` 限制共享 VPS 的构建工作进程。不要在生产开启实时订阅查询。

Node.js 官方下载目录：`https://nodejs.org/dist/v24.22.3/`。

## 非 root 构建和打包

`next.config.ts` 应启用 `output: "standalone"`。在新 release 的 `source/` 中执行，命令中的路径对应上面的部署目录：

```sh
runuser -u gptplusapp -- env \
  PATH=/opt/gptplusapp/runtime/current/bin:/usr/bin:/bin \
  CI=1 NODE_ENV=production \
  npm_config_cache=/opt/gptplusapp/build-cache \
  npm ci --include=dev

runuser -u gptplusapp -- env \
  PATH=/opt/gptplusapp/runtime/current/bin:/usr/bin:/bin \
  CI=1 NODE_ENV=production \
  NEXT_PUBLIC_SELF_HOSTED=1 GPTPLUSAPP_BUILD_CPUS=1 \
  NODE_OPTIONS=--max-old-space-size=2048 NEXT_TELEMETRY_DISABLED=1 \
  npm_config_cache=/opt/gptplusapp/build-cache \
  npm run build
```

以上命令必须在该 release 的 `source/` 目录运行。构建期间检查服务器剩余内存，避免对其他网站造成压力；不要修改全局 swap、内核参数或其他服务的资源配置。构建失败时保留当前线上 release，不切换链接。

构建后把 `.next/standalone/` 的内容放入同一 release 的 `app/`，并复制以下目录：

| 源码中的目录 | 运行目录中的位置 | 原因 |
| --- | --- | --- |
| `.next/standalone/` 的内容 | `app/` | `server.js` 与运行依赖 |
| `.next/static/` 的内容 | `app/.next/static/` | CSS、JS 和构建静态资源，standalone 默认不复制 |
| `public/` 的内容 | `app/public/` | 头像等公开资源，standalone 默认不复制 |
| `content/posts/` 的内容 | `app/content/posts/` | 文章库通过 `process.cwd()` 下的目录读取 |

先建立对应目标目录，再复制目录内容，避免生成 `public/public` 等嵌套目录。创建 `app/.next/cache/` 并确保 `gptplusapp` 可写；运行文件保持普通用户可读，不应全局可写。不要把 `source/.next/cache`、`source/.next/dev` 复制到运行包。

应用没有必需的模型 API Key 或数据库连接配置。保持 `NODE_ENV=production`；不要为了开启某个功能切到开发模式。当前 `lib/gpt-billing-availability.ts` 明确在生产关闭实时查询，迁移不改变这一行为。

## 启动、验证和切换

1. 用独立空闲临时端口启动候选 `app/server.js`，指定 `NODE_ENV=production`、`HOSTNAME=127.0.0.1`，从服务器本机验证，不暴露临时端口。
2. 检查首页、`/blog`、一篇最新文章、一篇历史文章、`/products`、`/contact`、`/sitemap.xml`、`/rss.xml`、`/robots.txt`、`/brand/avatar.png` 及页面实际引用的 CSS / JS。
3. 核对文章数量及 URL 未减少，canonical、站点地图和 RSS 仍指向 `https://www.gptplusapp.com`，商品与自助下单链接保持原地址。
4. 检查 `/tools/gpt-billing` 不加载客服和其他第三方组件，响应保留 `frame-src 'none'`、`no-store`；生产 API 对空的合成请求应返回 `LIVE_QUERY_UNAVAILABLE`，不能用真实访客 Token 测试。
5. 把模板服务安装到 `/etc/systemd/system/gptplusapp.service` 前，确认 `current` 已指向完成验证的 `app/`，且 `.next` 存在、用户权限正确。通过 `systemd-analyze verify` 检查服务文件，再加载、启动并设置开机启动。
6. 用 `systemctl status gptplusapp`、`journalctl -u gptplusapp` 和本机 `curl http://127.0.0.1:3068/` 验证。仅操作这个新服务，不重启服务器或其他应用。

服务为本站设置 1 GB 内存上限、768 MB Node.js 堆及 128 个任务上限，不修改其他服务的资源。

模板的 `ProtectSystem=strict` 仅应用于本服务；只为当前 release 的 `.next` 开放运行期写入，供 Next.js 缓存和按需页面使用。不要启用会破坏 V8 JIT 的 `MemoryDenyWriteExecute`。

## Nginx、DNS 和 HTTPS

### 先建立 HTTP 验证入口

先通过现有 Nginx 的配置检查输出确认真实 vhost include 位置，备份相关配置。不要直接覆盖全局 `nginx.conf`，也不要安装第二个监听 80 / 443 的服务。

首次证书还不存在时，不要直接加载最终 HTTPS 模板，否则 Nginx 会因找不到证书而检查失败。可以先给本站增加以下临时 HTTP vhost：

```nginx
server {
    listen 80;
    server_name gptplusapp.com www.gptplusapp.com;

    location ^~ /.well-known/acme-challenge/ {
        root /www/wwwroot/gptplusapp.com;
        default_type text/plain;
        try_files $uri =404;
    }

    location / {
        proxy_pass http://127.0.0.1:3068;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_cache off;
    }
}
```

建立 `/www/wwwroot/gptplusapp.com/.well-known/acme-challenge/`。使用现有宝塔 Nginx 二进制执行 `-t`，成功后 reload，不做 stop / restart。可用以下方式在切换 DNS 之前验证 HTTP 站点与 Host 路由：

```sh
curl --resolve www.gptplusapp.com:80:207.148.94.8 \
  http://www.gptplusapp.com/
```

### 切换 DNS 并签发证书

1. 保存 NameSilo / DNSOWL 中现有记录，核实权威名称服务器和 TTL。
2. 只调整根域和 `www` 的网站记录，使其解析到 `207.148.94.8`。添加 A 记录前处理与之冲突的旧 CNAME；若仍有指向旧平台的 AAAA，应一并处理，避免一部分访客继续走旧入口。IPv6 未单独验证前，不为新服务添加 AAAA。
3. 保留所有 MX、TXT、验证记录及其他子域名，特别是现有客服域 `kf-test.gptplusapp.com`。不要更改名称服务器。
4. 用权威 DNS 和公共解析器验证根域与 `www` 的结果，并确认 HTTP ACME 路径可从外部访问。
5. 本次使用隔离的 `/opt/gptplusapp/acme-venv/`，基于服务器系统 Python 创建虚拟环境，安装 PyPI 官方 `certbot==5.10.0`。没有安装系统软件包或修改宝塔既有证书任务。申请同时包含两个域名的证书，证书名固定为 `gptplusapp.com`：

```sh
/opt/gptplusapp/acme-venv/bin/certbot certonly --webroot \
  --webroot-path /www/wwwroot/gptplusapp.com \
  --cert-name gptplusapp.com \
  -d gptplusapp.com -d www.gptplusapp.com
```

首次签发时按客户端提示确认联系邮箱和服务条款；不要在源码中保存私人邮箱或密钥。HTTP-01 签发需要 DNS 已到达本服务器；如果有可用的 DNS-01 授权，可先完成 DNS 验证签发，再切网站流量，缩短 HTTPS 切换窗口。

6. 确认证书和私钥位于 `/etc/letsencrypt/live/gptplusapp.com/`，且证书覆盖根域与 `www`。只有证书存在后才将本站 vhost 替换为 `deploy/vultr/nginx.conf.example` 的最终 HTTPS 配置。
7. 再次 Nginx `-t`，成功后 reload。验证根域 HTTP / HTTPS 均跳转到 `https://www.gptplusapp.com`，路径和查询参数保留。
8. 检查已有证书续期 timer / 定时任务，配置续期成功后对同一 Nginx 执行检查和 reload，避免重复建立 ACME 定时任务；执行客户端的续期 dry-run 验证。

本次专用续期 hook 安装为 `/opt/gptplusapp/bin/reload-nginx`，由 root 所有，应用用户不可修改。专用 timer 固定只处理 `gptplusapp.com` 证书，不接管宝塔已有站点的证书；在首次签发成功后才启用。它在 UTC 03:20 / 15:20 附近随机延迟最多 30 分钟检查，错过执行会在开机后补做。服务使用 `--no-random-sleep-on-renew` 关闭 Certbot 自带的第二层随机等待，避免等待本身超过服务的 5 分钟超时。

后续可只读查看 timer 与日志；需要验证续期时使用：

```sh
systemctl list-timers gptplusapp-certbot.timer --no-pager
journalctl -u gptplusapp-certbot.service --no-pager
/opt/gptplusapp/acme-venv/bin/certbot renew \
  --cert-name gptplusapp.com --dry-run --run-deploy-hooks \
  --no-random-sleep-on-renew --non-interactive \
  --deploy-hook /opt/gptplusapp/bin/reload-nginx
```

最终 Nginx 模板所有应用请求都反代给 Node.js，不为 API 或账单查询增加共享缓存，也不重写应用的 CSP 和 Cache-Control。`/_next/static/` 的浏览器缓存由 Next.js 原有响应头控制。若以后接入 CDN，应另行配置可信代理和真实访客地址，不直接信任任意客户端传来的转发头。

## 外部验收

- 根域和 `www` 的 DNS 指向、TLS 证书、重定向正常，HTTPS 页面实际返回 200。
- 首页、文章列表、抽查文章、商品、站点地图、RSS、图片和静态资源完整。
- 右下角耳机、顶部“联系客服”、联系页按钮仍打开同一个客服中心；关闭后恢复耳机，无重复入口。客服脚本继续从 `https://kf-test.gptplusapp.com/widget/embed.js` 加载，不迁移其 API、知识库或用户会话。
- `/tools/gpt-billing` 仍没有客服脚本，保持专属 CSP 和不缓存策略。不能把更换服务器当作实时账单查询已经可用的证据。
- 原来的下单、订单查询和 Telegram 链接保持不变，不进行测试付款。
- 仅当以上检查通过，才记录“已完成正式域名切换”。DNS 或证书尚未完成时，应明确标注当前可访问范围及剩余步骤。

## 后续更新与回滚

后续文章更新仍在原项目管理：保存并确认需发布的改动，导出新版本，在新 release 内构建和验证，再切换 `current` 并重启本站服务。不要在当前运行目录执行生成脚本或覆盖构建产物。

应用回滚时，将 `current` 原子切回已验证的旧 release 的 `app/`，只重启 `gptplusapp.service`，验证本机和公网。先保留新旧 release，不在故障处理中删除文章或旧版本。

Nginx 配置回滚使用操作前保存的该站点配置，检查通过再 reload。DNS 回滚恢复本次修改的网站记录；但旧 Vercel 团队此前已因额度超限暂停，恢复到旧 DNS 并不代表旧服务可用。DNS 缓存也会让切换与回退存在传播时间，应分别核查权威记录与客户端实际响应。
