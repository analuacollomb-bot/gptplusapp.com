import { BillingAccount, BillingResult, isBillingAccountId, mergeBillingAccount, normalizeBillingData, parseBillingCredentials } from "./gpt-billing";
import { billingFetch } from "./gpt-billing-network";

export class BillingQueryError extends Error {
  constructor(public readonly code: string, message: string, public readonly status: number) { super(message); }
}

type QueryOptions = { fetcher?: typeof fetch; signal?: AbortSignal; now?: () => Date };
const checkEndpoint = "https://chatgpt.com/backend-api/accounts/check/v4-2023-04-27";
const maxResponseBytes = 512 * 1024;

export async function readLimitedBody(response: Pick<Response, "body">, limit: number): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) {
        await reader.cancel();
        throw new BillingQueryError("BODY_TOO_LARGE", "数据过大，已停止读取。请只提供必要的 Session 或订阅 JSON。", 413);
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}

async function fetchBilling(url: string, token: string, accountId: string | null, fetcher: typeof fetch, signal: AbortSignal): Promise<unknown> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "User-Agent": "GPTPlusApp-SubscriptionCheck/1.0 (+https://www.gptplusapp.com/tools/gpt-billing)",
  };
  if (accountId) headers["ChatGPT-Account-Id"] = accountId;
  let response: Response;
  try {
    response = await fetcher(url, { method: "GET", headers, cache: "no-store", redirect: "error", signal });
  } catch {
    if (signal.aborted) throw new BillingQueryError("UPSTREAM_TIMEOUT", "查询已取消或超时，请稍后重试，也可使用本地解析。", 504);
    throw new BillingQueryError("UPSTREAM_UNAVAILABLE", "暂时无法连接 ChatGPT 查询接口，请稍后重试或使用本地解析。", 502);
  }
  if (response.status === 401) {
    await response.body?.cancel();
    throw new BillingQueryError("TOKEN_REJECTED", "ChatGPT 未接受这份凭证。请登录对应账号，重新获取完整 Session 或 Access Token。", 401);
  }
  if (response.status === 403) {
    await response.body?.cancel();
    throw new BillingQueryError("UPSTREAM_FORBIDDEN", "ChatGPT 拒绝了本次服务器查询，可能与访问环境或网页接口限制有关。请在 ChatGPT 设置中核对，或使用账单 JSON 本地解析。", 502);
  }
  if (response.status === 429) {
    await response.body?.cancel();
    throw new BillingQueryError("UPSTREAM_RATE_LIMIT", "ChatGPT 查询过于频繁，请稍后再试。", 429);
  }
  if (!response.ok || !response.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    await response.body?.cancel();
    throw new BillingQueryError("UPSTREAM_UNAVAILABLE", "ChatGPT 查询接口暂未返回可用数据，请稍后重试或使用本地解析。", 502);
  }
  let raw: string;
  try { raw = await readLimitedBody(response, maxResponseBytes); }
  catch { throw new BillingQueryError("UPSTREAM_RESPONSE", "ChatGPT 返回的数据无法读取，已停止查询。", 502); }
  try { return JSON.parse(raw); }
  catch { throw new BillingQueryError("UPSTREAM_RESPONSE", "ChatGPT 返回了无法识别的数据，请稍后重试。", 502); }
}

/** Only allowlisted ChatGPT read endpoints. No provider URL or credentials are persisted. */
export async function queryGptBilling(input: string, mode: "quick" | "deep", options: QueryOptions = {}): Promise<BillingResult> {
  let credentials: ReturnType<typeof parseBillingCredentials>;
  try { credentials = parseBillingCredentials(input); }
  catch (error) { throw new BillingQueryError("INVALID_INPUT", error instanceof Error ? error.message : "输入格式不正确。", 400); }
  const signal = AbortSignal.any([AbortSignal.timeout(18_000), ...(options.signal ? [options.signal] : [])]);
  const fetcher = options.fetcher ?? billingFetch;
  let accounts: BillingAccount[] = [];
  let checkError: BillingQueryError | undefined;
  try {
    const payload = await fetchBilling(checkEndpoint, credentials.token, credentials.accountId, fetcher, signal);
    accounts = normalizeBillingData(payload, credentials.accountId);
  } catch (error) {
    if (!(error instanceof BillingQueryError)) throw error;
    if (mode === "quick" || error.status === 401 || error.status === 429 || signal.aborted) throw error;
    checkError = error;
  }
  const warnings: string[] = [];
  let partial = false;
  if (mode === "deep") {
    const selectedId = credentials.accountId ?? accounts.find(account => isBillingAccountId(account.accountId))?.accountId;
    if (selectedId) {
      try {
        const url = `https://chatgpt.com/backend-api/subscriptions?account_id=${encodeURIComponent(selectedId)}`;
        const payload = await fetchBilling(url, credentials.token, selectedId, fetcher, signal);
        const details = normalizeBillingData(payload, selectedId);
        if (details.length) {
          // Only merge the requested workspace, never another account's metadata.
          const current = accounts.findIndex(account => account.accountId === selectedId);
          const sameAccount = details.filter(account => account.accountId === selectedId);
          if (!sameAccount.length) throw new BillingQueryError("ACCOUNT_MISMATCH", "查询结果与目标账号不一致，已停止合并。", 502);
          if (current >= 0) accounts[current] = mergeBillingAccount(accounts[current], sameAccount[0]);
          else accounts.push(...sameAccount);
          if (checkError) { partial = true; warnings.push("已取得该账号的订阅详情，账号列表查询暂不可用。"); }
        } else {
          partial = true;
          warnings.push("订阅详情没有返回可识别字段，以下仅显示已取得的账号信息。");
        }
      } catch (error) {
        if (!accounts.length) throw checkError ?? error;
        partial = true;
        warnings.push(error instanceof BillingQueryError ? error.message : "订阅详情暂不可用，以下仅显示账号查询结果。");
      }
    } else {
      partial = true;
      warnings.push("未取得有效的 AccountID，无法补充账单详情；可尝试粘贴完整 Session JSON。");
    }
  }
  if (!accounts.length) throw checkError ?? new BillingQueryError("NO_BILLING_DATA", "接口没有返回可识别的订阅数据。请在 ChatGPT 设置中核对，或使用本地解析。", 502);
  warnings.push("ChatGPT 网页查询接口可能调整或限制访问。未返回的字段表示未知，请以 ChatGPT 设置中的账单为准。");
  return { source: "live", checkedAt: (options.now?.() ?? new Date()).toISOString(), partial, accounts, warnings };
}
