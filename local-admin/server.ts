import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { products, productCategories } from "../content/products";
import { AdminError, ArticleStore, today } from "./store";
import { organizeWithCodex } from "./codex-assist";

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "..");
const port = Number(process.env.ADMIN_PORT ?? 4318);
const previewPort = Number(process.env.SITE_PREVIEW_PORT ?? 3000);
if (!Number.isInteger(port) || port < 1024 || port > 65535 || !Number.isInteger(previewPort) || previewPort < 1024 || previewPort > 65535) {
  throw new Error("ADMIN_PORT 和 SITE_PREVIEW_PORT 须为 1024 至 65535 之间的端口。");
}
const previewOrigin = `http://127.0.0.1:${previewPort}`;
const store = new ArticleStore(root, previewOrigin);
const token = randomBytes(32).toString("hex");
const allowedHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
const allowedOrigins = new Set([...allowedHosts].map(host => `http://${host}`));

function json(response: http.ServerResponse, status: number, value: unknown) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
}

async function body(request: http.IncomingMessage): Promise<Record<string, unknown>> {
  if (!request.headers["content-type"]?.startsWith("application/json")) throw new AdminError(415, "请求须使用 JSON 格式。");
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 2 * 1024 * 1024) throw new AdminError(413, "文章内容过大，请限制在 1 MB 内。");
    chunks.push(chunk);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw new AdminError(400, "请求内容不是有效的 JSON 对象。"); }
}

function preview(data: Record<string, unknown>) {
  if (typeof data.content !== "string" || data.content.length > 1024 * 1024) throw new AdminError(400, "预览正文过长或格式不正确。");
  const fields = (data.fields && typeof data.fields === "object" ? data.fields : {}) as Record<string, unknown>;
  return renderToStaticMarkup(createElement("article", { className: "markdown-preview" },
    createElement("p", { className: "preview-category" }, String(fields.category ?? "文章预览")),
    createElement("h1", null, String(fields.title || "未命名文章")),
    createElement("p", { className: "preview-description" }, String(fields.description ?? "")),
    createElement(Markdown, {
      remarkPlugins: [remarkGfm], skipHtml: true,
      components: {
        a: ({ children, href }) => createElement("a", { href, target: "_blank", rel: "noreferrer noopener" }, children),
        img: ({ alt }) => createElement("span", { className: "preview-image-placeholder" }, `图片：${alt || "未填写说明"}`),
      },
    }, data.content),
  ));
}

const server = http.createServer(async (request, response) => {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("X-Robots-Tag", "noindex, nofollow");
  response.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  try {
    if (!allowedHosts.has(request.headers.host ?? "")) throw new AdminError(403, "后台只允许本机访问。");
    const origin = request.headers.origin;
    if (origin && !allowedOrigins.has(origin)) throw new AdminError(403, "不接受其他网站发来的后台请求。");
    if (request.headers["sec-fetch-site"] === "cross-site") throw new AdminError(403, "不接受跨站后台请求。");
    const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
    const method = request.method ?? "GET";
    if (!["GET", "HEAD"].includes(method) && request.headers["x-admin-token"] !== token) throw new AdminError(403, "后台会话已失效，请刷新页面后重试。");
    if (method === "GET" && url.pathname === "/api/health") return json(response, 200, { service: "gptplusapp-local-admin", root, port, previewPort });
    if (method === "GET" && url.pathname === "/api/config") {
      const { counts } = await store.list(new URLSearchParams());
      return json(response, 200, { token, categories: productCategories, products: products.map(({ id, title, category, orderUrl }) => ({ id, title, category, orderUrl })), today: today(), sitePreviewUrl: previewOrigin, counts, siteName: "GPT Plus App" });
    }
    if (method === "GET" && url.pathname === "/api/articles") return json(response, 200, await store.list(url.searchParams));
    if (method === "GET" && url.pathname === "/api/article") return json(response, 200, await store.get(url.searchParams.get("id") ?? ""));
    if (method === "POST" && url.pathname === "/api/organize") {
      const data = await body(request);
      const local = await store.organize(data);
      if (data.mode === "local") return json(response, 200, { ...local, engine: "local", message: "已自动补齐分类、摘要、文章网址和商品链接，正文保持原样。" });
      const controller = new AbortController();
      response.once("close", () => { if (!response.writableEnded) controller.abort(); });
      try {
        const suggestion = await organizeWithCodex({ title: local.fields.title, content: String(data.content), categories: productCategories,
          products: products.map(({ id, title, category, orderUrl }) => ({ id, title, category, orderUrl })),
          relatedPosts: local.relatedPosts,
        }, { signal: controller.signal });
        const organized = await store.organize(data, suggestion);
        return json(response, 200, { ...organized, engine: "codex", message: "Codex 已整理好分类、摘要、文章网址及链接建议。请预览后保存，正文保持原样。" });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Codex 文章整理未完成", error instanceof Error ? error.message : "unknown error");
        return json(response, 200, { ...local, engine: "local", message: "Codex 暂时未能完成，本次已用本机规则补齐发布信息。你仍可保存，也可以稍后重试 Codex 整理。" });
      }
    }
    if (method === "POST" && url.pathname === "/api/draft") return json(response, 200, await store.save(await body(request), false));
    if (method === "POST" && url.pathname === "/api/publish") return json(response, 200, await store.save(await body(request), true));
    if (method === "DELETE" && url.pathname === "/api/draft") {
      const data = await body(request);
      if (typeof data.id !== "string") throw new AdminError(400, "请选择需要丢弃的草稿。");
      return json(response, 200, await store.discard({ id: data.id, revision: typeof data.revision === "string" ? data.revision : undefined }));
    }
    if (method === "POST" && url.pathname === "/api/preview") return json(response, 200, { html: preview(await body(request)) });
    const staticFiles: Record<string, [string, string]> = {
      "/": ["index.html", "text/html; charset=utf-8"],
      "/admin.js": ["admin.js", "text/javascript; charset=utf-8"],
      "/admin.css": ["admin.css", "text/css; charset=utf-8"],
      "/favicon.svg": ["favicon.svg", "image/svg+xml"],
    };
    if (["GET", "HEAD"].includes(method) && staticFiles[url.pathname]) {
      const [file, type] = staticFiles[url.pathname];
      const content = await fs.readFile(path.join(directory, "public", file));
      response.writeHead(200, { "Content-Type": type });
      return response.end(method === "HEAD" ? undefined : content);
    }
    throw new AdminError(404, "未找到这个后台页面或接口。");
  } catch (error) {
    if (error instanceof AdminError) return json(response, error.status, { error: error.message });
    console.error("文章后台请求失败", error);
    return json(response, 500, { error: "保存或读取失败，请保留当前文案并查看启动窗口。" });
  }
});

server.requestTimeout = 30_000;
server.headersTimeout = 10_000;
server.on("error", (error: NodeJS.ErrnoException) => {
  console.error(error.code === "EADDRINUSE" ? `后台端口 ${port} 已被占用，请关闭原后台或更换 ADMIN_PORT。` : error.message);
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () => {
  console.log(`GPT Plus App 本地文章后台：http://127.0.0.1:${port}/`);
  console.log(`文章目录：${path.join(root, "content/posts")}\n仅本机保存，不会自动推送或部署。`);
});
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
