import { billingInputLimit } from "@/lib/gpt-billing";
import { isLiveBillingQueryEnabled } from "@/lib/gpt-billing-availability";
import { BillingQueryError, queryGptBilling, readLimitedBody } from "@/lib/gpt-billing-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
const headers = { "Cache-Control": "no-store, max-age=0", "Pragma": "no-cache", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };
const attempts = new Map<string, { count: number; resetAt: number }>();

function json(body: unknown, status = 200) { return Response.json(body, { status, headers }); }

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const requestUrl = new URL(request.url);
  const publicHost = request.headers.get("host");
  // Next's development Request.url may use localhost even when the browser uses
  // 127.0.0.1. Match the actual HTTP Host as well, without trusting arbitrary URLs.
  let sameOrigin = !origin || origin === requestUrl.origin;
  if (origin && publicHost) {
    try {
      const incoming = new URL(origin);
      sameOrigin ||= incoming.host === publicHost && incoming.protocol === requestUrl.protocol && ["http:", "https:"].includes(incoming.protocol);
    } catch { sameOrigin = false; }
  }
  if (!sameOrigin || request.headers.get("sec-fetch-site") === "cross-site") {
    return json({ success: false, code: "ORIGIN_REJECTED", message: "请在本站订阅查询页面操作。" }, 403);
  }
  // Old tabs and direct API callers must stop here, before reading credentials
  // or opening an upstream request while production queries are unavailable.
  if (!isLiveBillingQueryEnabled()) {
    return json({ success: false, code: "LIVE_QUERY_UNAVAILABLE", message: "在线实时查询暂不可用。请打开 ChatGPT，在设置中查看订阅，或使用账单 JSON 本地解析。" }, 503);
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json({ success: false, code: "INVALID_BODY", message: "请使用 JSON 格式提交查询。" }, 415);
  }
  // Best-effort per-process throttle; no tokens, bodies or billing results are kept.
  const now = Date.now();
  for (const [key, attempt] of attempts) if (attempt.resetAt <= now) attempts.delete(key);
  const key = (request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local").slice(0, 80);
  const attempt = attempts.get(key) ?? { count: 0, resetAt: now + 60_000 };
  if (attempt.count >= 8 || attempts.size > 2000) return json({ success: false, code: "RATE_LIMIT", message: "查询过于频繁，请一分钟后再试。" }, 429);
  attempt.count++;
  attempts.set(key, attempt);
  try {
    if (Number(request.headers.get("content-length")) > billingInputLimit * 2) throw new BillingQueryError("BODY_TOO_LARGE", "提交内容过长。", 413);
    const text = await readLimitedBody(request, billingInputLimit * 2);
    let data: unknown;
    try { data = JSON.parse(text); }
    catch { throw new BillingQueryError("INVALID_BODY", "JSON 格式不正确，请重新粘贴。", 400); }
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new BillingQueryError("INVALID_BODY", "查询数据格式不正确。", 400);
    const body = data as Record<string, unknown>;
    if (typeof body.input !== "string" || !["quick", "deep"].includes(String(body.mode))) throw new BillingQueryError("INVALID_BODY", "请填写查询内容并选择快速或深度查询。", 400);
    const result = await queryGptBilling(body.input, body.mode as "quick" | "deep", { signal: request.signal });
    return json({ success: true, result });
  } catch (error) {
    if (error instanceof BillingQueryError) return json({ success: false, code: error.code, message: error.message }, error.status);
    // Never log request credentials or upstream errors (which may contain headers).
    return json({ success: false, code: "QUERY_FAILED", message: "查询暂时无法完成，请稍后重试。" }, 502);
  }
}
