/** Shared parsing only. Never treat unsigned JWT claims as verified billing data. */
export type BillingAccount = {
  accountId: string | null;
  name: string | null;
  plan: string | null;
  active: boolean | null;
  expiresAt: string | null;
  startsAt: string | null;
  willRenew: boolean | null;
  billingPeriod: string | null;
  platform: string | null;
  status: string | null;
  isDelinquent: boolean | null;
};

export type BillingResult = {
  source: "live" | "local";
  checkedAt: string;
  partial: boolean;
  warnings: string[];
  accounts: BillingAccount[];
};

export type BillingInputKind = "empty" | "token" | "session" | "account-id" | "billing-data" | "unknown";
type RecordValue = Record<string, unknown>;
export const billingInputLimit = 64 * 1024;
const accountIdPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const tokenPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

export function isBillingAccountId(value: unknown): boolean {
  return typeof value === "string" && accountIdPattern.test(value);
}

function record(value: unknown): RecordValue {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
}

function string(...values: unknown[]): string | null {
  const value = values.find(item => typeof item === "string" && item.trim());
  return typeof value === "string" ? value.trim().slice(0, 200) : null;
}

function boolean(...values: unknown[]): boolean | null {
  const value = values.find(item => typeof item === "boolean");
  return typeof value === "boolean" ? value : null;
}

/** Accept actual timestamps, never epoch seconds accidentally interpreted as ms. */
function date(...values: unknown[]): string | null {
  for (const value of values) {
    let time: number;
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      time = value < 10_000_000_000 ? value * 1000 : value;
    } else if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value)) {
      const day = value.slice(0, 10);
      const calendar = new Date(`${day}T00:00:00Z`);
      if (!Number.isFinite(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== day) continue;
      // A missing timezone is ambiguous; don't silently use the server timezone.
      if (value.length > 10 && !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) continue;
      time = Date.parse(value.length === 10 ? `${value}T00:00:00Z` : value);
    } else continue;
    if (Number.isFinite(time) && time >= 0 && time < 8_640_000_000_000_000) return new Date(time).toISOString();
  }
  return null;
}

function parseJson(input: string): unknown {
  try { return JSON.parse(input); } catch { return undefined; }
}

function tokenFrom(value: unknown): string | null {
  const item = record(value);
  const candidates = [item.accessToken, item.access_token, record(item.session).accessToken, record(item.session).access_token];
  const token = candidates.find(value => typeof value === "string" && value.trim());
  return typeof token === "string" ? token.trim() : null;
}

function claimsFrom(token: string): RecordValue {
  if (!tokenPattern.test(token)) return {};
  try {
    const encoded = token.split(".")[1];
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")), char => char.charCodeAt(0));
    return record(JSON.parse(new TextDecoder().decode(bytes)));
  } catch { return {}; }
}

export function detectBillingInput(input: string): BillingInputKind {
  const raw = input.trim();
  if (!raw) return "empty";
  if (isBillingAccountId(raw)) return "account-id";
  if (tokenPattern.test(raw.replace(/^Bearer\s+/i, ""))) return "token";
  const parsed = parseJson(raw);
  if (!parsed || typeof parsed !== "object") return "unknown";
  const root = record(parsed);
  if (tokenFrom(root)) return "session";
  if (Array.isArray(parsed) || root.accounts || root.subscriptions || root.subscription || root.entitlement || root.entitlements || root.plan_type || root.subscription_plan) return "billing-data";
  return "unknown";
}

export function parseBillingCredentials(input: string): { token: string; accountId: string | null } {
  if (typeof input !== "string" || !input.trim()) throw new Error("请粘贴 ChatGPT Access Token 或完整 Session JSON。");
  if (input.length > billingInputLimit || new TextEncoder().encode(input).byteLength > billingInputLimit) throw new Error("输入内容过长，请限制在 64 KB 内。");
  const kind = detectBillingInput(input);
  if (kind === "account-id") throw new Error("仅凭 AccountID 无法实时查询。请粘贴该账号的 Access Token 或完整 Session JSON。");
  const session = kind === "session" ? record(parseJson(input.trim())) : {};
  const rawToken = kind === "session" ? tokenFrom(session) : input.trim().replace(/^Bearer\s+/i, "");
  // tokenFrom is deliberately not used for storage or as trusted subscription evidence.
  const token = rawToken?.trim();
  if (!token || token.length > 32_768 || !tokenPattern.test(token)) throw new Error("没有识别到有效格式的 Access Token。请复制完整 Token 或 Session JSON；无需密码、Cookie 或 API Key。");
  const claims = claimsFrom(token);
  const auth = record(claims["https://api.openai.com/auth"]);
  const candidates = [record(session.account).id, session.account_id, auth.chatgpt_account_id];
  const accountId = candidates.find((value): value is string => isBillingAccountId(value)) ?? null;
  return { token, accountId };
}

function accountFrom(value: unknown, fallbackId?: string | null): BillingAccount | null {
  const root = record(value);
  const account = record(root.account);
  const entitlement = record(root.entitlement);
  const subscription = record(root.subscription);
  const recent = record(root.last_active_subscription);
  const plan = string(entitlement.subscription_plan, subscription.plan_type, subscription.subscription_plan, root.plan_type, root.subscription_plan, account.plan_type, root.plan, root.product_id, root.product_identifier);
  const active = boolean(entitlement.has_active_subscription, subscription.is_active, root.is_active, root.has_active_subscription);
  const expiresAt = date(subscription.active_until, subscription.activeUntil, subscription.expires_at, subscription.expires_date, entitlement.expires_at, root.active_until, root.activeUntil, root.expires_at, root.expires_date);
  const willRenew = boolean(subscription.will_renew, root.will_renew, recent.will_renew);
  const status = string(subscription.status, root.status);
  const isDelinquent = boolean(subscription.is_delinquent, root.is_delinquent);
  if (!plan && active === null && !expiresAt && willRenew === null && !status && isDelinquent === null) return null;
  const id = string(account.account_id, root.account_id, root.accountId, fallbackId);
  return {
    accountId: isBillingAccountId(id) ? id : null,
    name: string(account.name, root.account_name),
    plan, active, expiresAt, willRenew, status, isDelinquent,
    startsAt: date(subscription.active_start, subscription.started_at, root.active_start, root.started_at, root.purchase_date, root.original_purchase_date),
    billingPeriod: string(subscription.billing_period, root.billing_period, root.period_type),
    platform: string(subscription.purchase_origin_platform, root.platform, root.store, recent.purchase_origin_platform),
  };
}

/** Whitelist documented/observed billing fields; never return raw upstream objects. */
export function normalizeBillingData(payload: unknown, fallbackId?: string | null): BillingAccount[] {
  const root = record(payload);
  let values: unknown[];
  let accountKeys: string[] | undefined;
  const accountCollection = Array.isArray(root.accounts) || (root.accounts !== null && typeof root.accounts === "object");
  if (Array.isArray(payload)) values = payload;
  else if (Array.isArray(root.accounts)) values = root.accounts;
  else if (root.accounts && typeof root.accounts === "object") {
    const entries = Object.entries(record(root.accounts));
    values = entries.map(([, value]) => value);
    accountKeys = entries.map(([key]) => key);
  }
  else if (Array.isArray(root.subscriptions)) values = root.subscriptions;
  else if (root.subscription && typeof root.subscription === "object") values = [root];
  else if (Array.isArray(root.entitlements)) values = root.entitlements.map(value => ({ ...record(value), subscription_plan: string(record(value).subscription_plan, record(value).product_identifier, record(value).name) }));
  else values = [root];
  const normalized = values.slice(0, 30).map((item, index) => {
    // An accounts collection contains separate workspaces. A token's workspace
    // ID cannot identify every member and would incorrectly merge unrelated plans.
    const key = accountKeys?.[index];
    const itemFallback = accountCollection ? (isBillingAccountId(key) ? key : null) : string(root.account_id, fallbackId);
    return accountFrom(item, itemFallback);
  }).filter((item): item is BillingAccount => item !== null);
  const result: BillingAccount[] = [];
  const subscriptionCollection = Array.isArray(payload) || Array.isArray(root.subscriptions) || Array.isArray(root.entitlements);
  const subscriptionRank = (account: BillingAccount) => [account.active === true ? 2 : account.active === false ? 0 : 1, Date.parse(account.expiresAt ?? "") || 0, Date.parse(account.startsAt ?? "") || 0];
  for (const account of normalized) {
    const index = account.accountId ? result.findIndex(item => item.accountId === account.accountId) : -1;
    if (index >= 0 && subscriptionCollection) {
      // History rows are distinct billing cycles. Select a current row, rather
      // than filling its missing fields with an unrelated old subscription.
      const incoming = subscriptionRank(account);
      const existing = subscriptionRank(result[index]);
      const differing = incoming.findIndex((value, rank) => value !== existing[rank]);
      if (differing >= 0 && incoming[differing] > existing[differing]) result[index] = account;
    } else if (index >= 0) result[index] = mergeBillingAccount(result[index], account);
    else result.push(account);
  }
  return result;
}

export function mergeBillingAccount(current: BillingAccount, details: BillingAccount): BillingAccount {
  // Null is unknown, not an instruction to erase previously returned evidence.
  return Object.fromEntries(Object.keys(current).map(key => [key, details[key as keyof BillingAccount] ?? current[key as keyof BillingAccount]])) as BillingAccount;
}

export function parseLocalBilling(input: string): BillingResult {
  if (input.length > billingInputLimit || new TextEncoder().encode(input).byteLength > billingInputLimit) throw new Error("输入内容过长，请限制在 64 KB 内。");
  const parsed = parseJson(input.trim());
  if (!parsed || typeof parsed !== "object") throw new Error("本地解析需要订阅查询返回的 JSON。仅 Token 或 AccountID 不包含可验证的实时账单信息。");
  const accounts = normalizeBillingData(parsed);
  if (!accounts.length) throw new Error("这份 JSON 没有订阅字段。Session 的 expires 和 Token 的 exp 只是登录有效期，请使用实时查询或粘贴账单 JSON。");
  return { source: "local", checkedAt: new Date().toISOString(), partial: false, accounts,
    warnings: ["仅解析你提供的内容，没有联网验证；数据可能已过时。登录凭证有效期不代表会员到期时间。"] };
}
