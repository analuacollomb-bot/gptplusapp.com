import test from "node:test";
import assert from "node:assert/strict";
import {
  billingInputLimit, detectBillingInput, isBillingAccountId, mergeBillingAccount,
  normalizeBillingData, parseBillingCredentials, parseLocalBilling,
} from "./gpt-billing";

const accountId = "12345678-1234-1234-1234-123456789abc";
const secondId = "abcdef12-abcd-abcd-abcd-abcdef123456";
const jwt = (claims: unknown) => `${Buffer.from('{"alg":"none","typ":"JWT"}').toString("base64url")}.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.synthetic_signature`;

test("Session and Bearer input retain a complete long token and detect its account", () => {
  const token = jwt({ padding: "x".repeat(6000), "https://api.openai.com/auth": { chatgpt_account_id: accountId } });
  assert.equal(detectBillingInput(` Bearer ${token} `), "token");
  assert.deepEqual(parseBillingCredentials(` Bearer ${token} `), { token, accountId });
  for (const session of [
    { accessToken: token, account: { id: secondId } },
    { access_token: token, account_id: secondId },
    { session: { accessToken: token }, account: { id: secondId } },
  ]) {
    const input = JSON.stringify(session);
    assert.equal(detectBillingInput(input), "session");
    assert.deepEqual(parseBillingCredentials(input), { token, accountId: secondId });
  }
});

test("a standalone standard UUID is recognized and cannot authorize a real-time lookup", () => {
  assert.equal(isBillingAccountId(accountId), true);
  assert.equal(isBillingAccountId(accountId.toUpperCase()), true);
  assert.equal(isBillingAccountId("12345678-1234-1234-123456789abc"), false);
  assert.equal(detectBillingInput(accountId), "account-id");
  assert.throws(() => parseBillingCredentials(accountId), /仅凭 AccountID/);
});

test("empty, malformed and API-key-like inputs fail without being interpreted as subscriptions", () => {
  for (const input of ["", "not-a-token", "sk-synthetic-no-key", "Bearer ", '{"accessToken":', "a.b", "a.b.c.extra"]) {
    assert.throws(() => parseBillingCredentials(input));
  }
  assert.equal(detectBillingInput(""), "empty");
  assert.equal(detectBillingInput('{"user":{"name":"somebody"}}'), "unknown");
});

test("unsigned, expired and malformed JWT claims never become verified billing dates", () => {
  for (const claims of [
    { exp: 1, plan_type: "plus", active_until: 1 },
    { exp: 9_999_999_999, "https://api.openai.com/auth": { chatgpt_plan_type: "pro", chatgpt_account_id: accountId } },
  ]) {
    const token = jwt(claims);
    assert.equal(parseBillingCredentials(token).token, token);
    assert.throws(() => parseLocalBilling(JSON.stringify({ accessToken: token, expires: "2099-01-01T00:00:00Z" })), /登录有效期/);
    assert.throws(() => parseLocalBilling(token), /仅 Token/);
  }
  assert.deepEqual(parseBillingCredentials("a.invalid_base64.signature"), { token: "a.invalid_base64.signature", accountId: null });
  assert.deepEqual(normalizeBillingData({ exp: 9_999_999_999, expires: "2099-01-01T00:00:00Z" }), []);
});

test("missing booleans remain unknown while explicit false is preserved", () => {
  const [unknown] = normalizeBillingData({ plan_type: "plus" });
  assert.equal(unknown.active, null);
  assert.equal(unknown.willRenew, null);
  assert.equal(unknown.isDelinquent, null);
  const [off] = normalizeBillingData({ plan_type: "plus", is_active: false, will_renew: false, is_delinquent: false });
  assert.equal(off.active, false);
  assert.equal(off.willRenew, false);
  assert.equal(off.isDelinquent, false);
  const [untrusted] = normalizeBillingData({ plan_type: "plus", is_active: "true", will_renew: 0, is_delinquent: {} });
  assert.equal(untrusted.active, null);
  assert.equal(untrusted.willRenew, null);
  assert.equal(untrusted.isDelinquent, null);
});

test("a free account is retained without inventing a paid subscription or renewal date", () => {
  const [free] = normalizeBillingData({ account: { account_id: accountId, plan_type: "free" }, entitlement: { has_active_subscription: false } });
  assert.equal(free.plan, "free");
  assert.equal(free.active, false);
  assert.equal(free.expiresAt, null);
  assert.equal(free.willRenew, null);
  assert.deepEqual(normalizeBillingData({ accounts: {} }), []);
  assert.deepEqual(normalizeBillingData({ user: { email: "synthetic@example.invalid" } }), []);
});

test("account-check envelopes preserve separate workspaces and their billing evidence", () => {
  const accounts = normalizeBillingData({ accounts: {
    one: { account: { account_id: accountId, name: "Personal", plan_type: "plus" }, entitlement: { has_active_subscription: true } },
    two: { account: { account_id: secondId, name: "Workspace", plan_type: "team" }, entitlement: { has_active_subscription: false } },
  } });
  assert.equal(accounts.length, 2);
  assert.deepEqual(accounts.map(item => [item.accountId, item.name, item.plan, item.active]), [[accountId, "Personal", "plus", true], [secondId, "Workspace", "team", false]]);
});

test("array and nested subscription forms normalize consistently", () => {
  const subscription = { account_id: accountId, subscription_plan: "plus", is_active: true, expires_at: "2026-12-21T10:00:00Z", will_renew: false };
  const expected = normalizeBillingData(subscription);
  assert.deepEqual(normalizeBillingData([subscription]), expected);
  assert.deepEqual(normalizeBillingData({ subscriptions: [subscription] }), expected);
  assert.deepEqual(normalizeBillingData({ account_id: accountId, subscription: { plan_type: "plus", is_active: true, expires_at: "2026-12-21T10:00:00Z", will_renew: false } }), expected);
});

test("subscription history selects the current active period regardless of response order", () => {
  const current = { account_id: accountId, subscription_plan: "plus", is_active: true, expires_at: "2026-12-21T00:00:00Z", will_renew: false };
  const olderActive = { account_id: accountId, subscription_plan: "pro", is_active: true, expires_at: "2025-01-01T00:00:00Z", will_renew: true };
  const expired = { account_id: accountId, subscription_plan: "pro", is_active: false, expires_at: "2024-01-01T00:00:00Z", will_renew: true };
  const expected = normalizeBillingData(current);
  for (const rows of [[current, olderActive, expired], [expired, olderActive, current]]) {
    assert.deepEqual(normalizeBillingData({ subscriptions: rows }), expected);
    assert.deepEqual(normalizeBillingData(rows), expected);
  }
});

test("current subscription unknown fields are not filled using an unrelated historical billing period", () => {
  const current = { account_id: accountId, subscription_plan: "plus", is_active: true };
  const historical = { account_id: accountId, subscription_plan: "pro", is_active: false, expires_at: "2025-01-01T00:00:00Z", started_at: "2024-12-01T00:00:00Z", will_renew: true, platform: "iOS", billing_period: "monthly" };
  for (const rows of [[current, historical], [historical, current]]) {
    const [selected] = normalizeBillingData({ subscriptions: rows });
    assert.equal(selected.plan, "plus");
    assert.equal(selected.active, true);
    assert.equal(selected.expiresAt, null);
    assert.equal(selected.startsAt, null);
    assert.equal(selected.willRenew, null);
    assert.equal(selected.platform, null);
    assert.equal(selected.billingPeriod, null);
  }
});

test("accounts arrays and the reference tool's entitlement/product identifiers are preserved", () => {
  assert.equal(normalizeBillingData({ accounts: [{ account_id: accountId, plan_type: "plus" }] }).length, 1);
  assert.equal(normalizeBillingData({ entitlements: [{ name: "ChatGPT Plus" }] })[0]?.plan, "ChatGPT Plus");
  assert.equal(normalizeBillingData({ entitlements: [{ product_identifier: "chatgpt_plus" }] })[0]?.plan, "chatgpt_plus");
  assert.equal(normalizeBillingData({ subscriptions: [{ product_id: "chatgpt_plus" }] })[0]?.plan, "chatgpt_plus");
});

test("account-map keys identify workspaces without assigning every workspace the token's account", () => {
  const accounts = normalizeBillingData({ accounts: {
    [accountId]: { account: { name: "Personal", plan_type: "plus" } },
    [secondId]: { account: { name: "Workspace", plan_type: "team" } },
  } }, accountId);
  assert.deepEqual(accounts.map(item => [item.accountId, item.plan]), [[accountId, "plus"], [secondId, "team"]]);
  const ambiguous = normalizeBillingData({ accounts: [
    { account_id: accountId, plan_type: "plus" }, { plan_type: "team" },
  ] }, accountId);
  assert.deepEqual(ambiguous.map(item => item.accountId), [accountId, null]);
});

test("unobserved generic envelopes are refused instead of recursively trusting arbitrary JWT-like claims", () => {
  assert.deepEqual(normalizeBillingData({ data: { plan_type: "plus" } }), []);
  assert.deepEqual(normalizeBillingData({ result: { subscription_plan: "pro" } }), []);
  assert.deepEqual(normalizeBillingData({ claims: { plan_type: "plus", exp: 9_999_999_999 } }), []);
});

test("subscription dates use actual billing timestamps with explicit timezone handling", () => {
  const [seconds] = normalizeBillingData({ plan_type: "plus", expires_at: 1_800_000_000 });
  const [millis] = normalizeBillingData({ plan_type: "plus", expires_at: 1_800_000_000_000 });
  assert.equal(seconds.expiresAt, "2027-01-15T08:00:00.000Z");
  assert.equal(millis.expiresAt, seconds.expiresAt);
  assert.equal(normalizeBillingData({ plan_type: "plus", expires_at: "2026-10-21T18:00:00+08:00" })[0].expiresAt, "2026-10-21T10:00:00.000Z");
  assert.equal(normalizeBillingData({ plan_type: "plus", expires_at: "2026-10-21" })[0].expiresAt, "2026-10-21T00:00:00.000Z");
  for (const date of ["not-a-date", "2026-10-21T18:00:00", -100, Number.NaN, Number.POSITIVE_INFINITY, 9e18]) {
    assert.equal(normalizeBillingData({ plan_type: "plus", expires_at: date })[0].expiresAt, null);
  }
});

test("invalid calendar dates do not silently roll into another month", () => {
  assert.equal(normalizeBillingData({ plan_type: "plus", expires_at: "2026-02-30" })[0].expiresAt, null);
});

test("untrusted metadata is bounded and extra credential fields cannot pass through", () => {
  const token = jwt({ marker: "never-return-this-credential" });
  const payload = JSON.parse(JSON.stringify({
    plan_type: "plus", account_id: "https://attacker.invalid/", account_name: "x".repeat(5000),
    accessToken: token, Authorization: `Bearer ${token}`, cookie: "private-cookie", user: { email: "private@example.invalid" },
    __proto__: { polluted: true },
  }));
  const [account] = normalizeBillingData(payload);
  assert.equal(account.accountId, null);
  assert.equal(account.name?.length, 200);
  const serialized = JSON.stringify(account);
  for (const secret of [token, "private-cookie", "private@example.invalid", "accessToken", "Authorization"]) assert.ok(!serialized.includes(secret));
  assert.deepEqual(Object.keys(account).sort(), ["accountId", "name", "plan", "active", "expiresAt", "willRenew", "status", "isDelinquent", "startsAt", "billingPeriod", "platform"].sort());
  assert.equal(normalizeBillingData(Array.from({ length: 100 }, () => ({ plan_type: "plus" }))).length, 30);
  assert.deepEqual(normalizeBillingData(null), []);
  assert.deepEqual(normalizeBillingData("malicious"), []);
});

test("local parse labels evidence as unverified and never reads a token's subscription claims", () => {
  const result = parseLocalBilling('{"subscriptions":[{"subscription_plan":"plus","will_renew":false}]}');
  assert.equal(result.source, "local");
  assert.match(result.warnings.join(" "), /没有联网验证/);
  assert.equal(result.accounts[0].willRenew, false);
  assert.equal(result.accounts[0].expiresAt, null);
  assert.throws(() => parseLocalBilling("x".repeat(billingInputLimit + 1)), /64 KB/);
  assert.throws(() => parseBillingCredentials("x".repeat(billingInputLimit + 1)), /64 KB/);
});

test("merge keeps known evidence when new fields are absent, including explicit false", () => {
  const current = normalizeBillingData({ account_id: accountId, plan_type: "plus", is_active: true, will_renew: true })[0];
  const details = normalizeBillingData({ account_id: accountId, status: "cancelled", will_renew: false })[0];
  const result = mergeBillingAccount(current, details);
  assert.equal(result.plan, "plus");
  assert.equal(result.active, true);
  assert.equal(result.willRenew, false);
  assert.equal(result.status, "cancelled");
  assert.equal(current.willRenew, true);
});
