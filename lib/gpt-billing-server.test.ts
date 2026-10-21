import test from "node:test";
import assert from "node:assert/strict";
import { BillingQueryError, queryGptBilling, readLimitedBody } from "./gpt-billing-server";
import { POST } from "../app/api/tools/gpt-billing/route";

const accountId = "12345678-1234-1234-1234-123456789abc";
const secondId = "abcdef12-abcd-abcd-abcd-abcdef123456";
const token = `${Buffer.from('{"alg":"none"}').toString("base64url")}.${Buffer.from(JSON.stringify({ "https://api.openai.com/auth": { chatgpt_account_id: accountId }, exp: 1 })).toString("base64url")}.synthetic_signature`;
const checkUrl = "https://chatgpt.com/backend-api/accounts/check/v4-2023-04-27";
const subscriptionsUrl = `https://chatgpt.com/backend-api/subscriptions?account_id=${accountId}`;
const checkPayload = { accounts: { selected: { account: { account_id: accountId, plan_type: "plus" }, entitlement: { has_active_subscription: true } } } };
const json = (data: unknown, status = 200) => Response.json(data, { status });
const mockFetch = (handler: (url: string, init: RequestInit) => Response | Promise<Response>): typeof fetch => (async (url, init) => handler(String(url), init ?? {})) as typeof fetch;
const errorIs = (code: string, status: number) => (error: unknown) => {
  assert.ok(error instanceof BillingQueryError);
  assert.equal(error.code, code);
  assert.equal(error.status, status);
  assert.ok(!error.message.includes(token));
  return true;
};

test("live queries use only fixed official read endpoints, no cache or redirects, and never return credentials", async () => {
  const calls: string[] = [];
  const fetcher = mockFetch((url, init) => {
    calls.push(url);
    assert.equal(init.method, "GET");
    assert.equal(init.cache, "no-store");
    assert.equal(init.redirect, "error");
    assert.equal(init.body, undefined);
    assert.ok(init.signal instanceof AbortSignal);
    const headers = new Headers(init.headers);
    assert.equal(headers.get("authorization"), `Bearer ${token}`);
    assert.equal(headers.get("chatgpt-account-id"), accountId);
    assert.equal(headers.get("accept"), "application/json");
    assert.equal(headers.get("cookie"), null);
    return url === checkUrl ? json(checkPayload) : json({ account_id: accountId, subscription: { active_until: "2026-12-21T00:00:00Z", will_renew: false }, accessToken: token });
  });
  const result = await queryGptBilling(token, "deep", { fetcher, now: () => new Date("2026-10-21T12:00:00Z") });
  assert.deepEqual(calls, [checkUrl, subscriptionsUrl]);
  assert.equal(result.checkedAt, "2026-10-21T12:00:00.000Z");
  assert.equal(result.source, "live");
  assert.equal(result.partial, false);
  assert.equal(result.accounts[0].expiresAt, "2026-12-21T00:00:00.000Z");
  assert.equal(result.accounts[0].willRenew, false);
  assert.equal(result.accounts[0].plan, "plus");
  assert.ok(!JSON.stringify(result).includes(token));
});

test("invalid input is refused before any network operation", async () => {
  let calls = 0;
  const fetcher = mockFetch(() => { calls++; throw new Error("must not fetch"); });
  for (const input of [accountId, "sk-synthetic-key", "", "https://attacker.invalid/"]) {
    await assert.rejects(queryGptBilling(input, "deep", { fetcher }), errorIs("INVALID_INPUT", 400));
  }
  assert.equal(calls, 0);
});

test("quick lookup treats absent billing fields as unknown and does not use JWT expiry", async () => {
  const result = await queryGptBilling(token, "quick", { fetcher: mockFetch(() => json(checkPayload)) });
  assert.equal(result.accounts[0].active, true);
  assert.equal(result.accounts[0].expiresAt, null);
  assert.equal(result.accounts[0].willRenew, null);
  assert.match(result.warnings.join(" "), /未知/);
});

test("upstream 401, 403, 429, HTML, bad JSON and server errors have safe distinct failures", async () => {
  const cases: [() => Response, string, number][] = [
    [() => json({ error: token }, 401), "TOKEN_REJECTED", 401],
    [() => new Response(`<html>${token}</html>`, { status: 403 }), "UPSTREAM_FORBIDDEN", 502],
    [() => json({ error: token }, 429), "UPSTREAM_RATE_LIMIT", 429],
    [() => new Response(`<html>${token}</html>`, { headers: { "content-type": "text/html" } }), "UPSTREAM_UNAVAILABLE", 502],
    [() => new Response(`not-json-${token}`, { headers: { "content-type": "application/json" } }), "UPSTREAM_RESPONSE", 502],
    [() => json({ error: token }, 503), "UPSTREAM_UNAVAILABLE", 502],
  ];
  for (const [response, code, status] of cases) {
    await assert.rejects(queryGptBilling(token, "quick", { fetcher: mockFetch(response) }), errorIs(code, status));
  }
});

test("network and redirect failures cannot expose thrown credential-bearing errors", async () => {
  for (const message of [`network failed Authorization: Bearer ${token}`, `redirect to https://attacker.invalid/?token=${token}`]) {
    await assert.rejects(queryGptBilling(token, "quick", { fetcher: mockFetch(() => { throw new TypeError(message); }) }), errorIs("UPSTREAM_UNAVAILABLE", 502));
  }
  await assert.rejects(queryGptBilling(token, "quick", { fetcher: mockFetch(() => new Response(null, { status: 302, headers: { location: "https://attacker.invalid/" } })) }), errorIs("UPSTREAM_UNAVAILABLE", 502));
});

test("an aborted query is reported as cancellation/timeout rather than fabricated billing data", async () => {
  const controller = new AbortController();
  controller.abort();
  const fetcher = mockFetch((_url, init) => { assert.equal(init.signal?.aborted, true); throw new Error("aborted"); });
  await assert.rejects(queryGptBilling(token, "quick", { fetcher, signal: controller.signal }), errorIs("UPSTREAM_TIMEOUT", 504));
});

test("deep lookup does not merge another account's subscription metadata", async () => {
  const result = await queryGptBilling(token, "deep", { fetcher: mockFetch(url => url === checkUrl ? json(checkPayload) : json({ account_id: secondId, subscription: { plan_type: "pro", expires_at: "2099-01-01T00:00:00Z" } })) });
  assert.equal(result.partial, true);
  assert.match(result.warnings.join(" "), /不一致/);
  assert.equal(result.accounts.length, 1);
  assert.equal(result.accounts[0].accountId, accountId);
  assert.equal(result.accounts[0].plan, "plus");
  assert.equal(result.accounts[0].expiresAt, null);
});

test("deep account-check failure can fall back to verified detail fields with an explicit partial warning", async () => {
  const result = await queryGptBilling(token, "deep", { fetcher: mockFetch(url => url === checkUrl ? json({}, 503) : json({ account_id: accountId, subscription: { plan_type: "plus", will_renew: false } })) });
  assert.equal(result.partial, true);
  assert.equal(result.accounts[0].willRenew, false);
  assert.match(result.warnings.join(" "), /账号列表查询暂不可用/);
});

test("deep detail failures preserve account evidence while saying details are incomplete", async () => {
  const responses = [() => json({}, 403), () => json({}), () => json({ plan_type: "pro", account_id: secondId })];
  for (const response of responses) {
    const result = await queryGptBilling(token, "deep", { fetcher: mockFetch(url => url === checkUrl ? json(checkPayload) : response()) });
    assert.equal(result.partial, true);
    assert.equal(result.accounts[0].plan, "plus");
    assert.equal(result.accounts[0].willRenew, null);
    assert.equal(result.accounts[0].expiresAt, null);
    assert.ok(result.warnings.length >= 2);
  }
});

test("credential rejection and upstream throttling are never bypassed by deep fallback", async () => {
  for (const [status, code] of [[401, "TOKEN_REJECTED"], [429, "UPSTREAM_RATE_LIMIT"]] as const) {
    let calls = 0;
    await assert.rejects(queryGptBilling(token, "deep", { fetcher: mockFetch(() => { calls++; return json({}, status); }) }), errorIs(code, status));
    assert.equal(calls, 1);
  }
});

test("missing AccountID and no recognizable data are reported honestly", async () => {
  const tokenWithoutAccount = `${Buffer.from("{}").toString("base64url")}.${Buffer.from("{}").toString("base64url")}.signature`;
  const result = await queryGptBilling(tokenWithoutAccount, "deep", { fetcher: mockFetch(() => json({ plan_type: "free" })) });
  assert.equal(result.partial, true);
  assert.equal(result.accounts[0].accountId, null);
  assert.match(result.warnings.join(" "), /未取得有效的 AccountID/);
  await assert.rejects(queryGptBilling(token, "quick", { fetcher: mockFetch(() => json({ accounts: {} })) }), errorIs("NO_BILLING_DATA", 502));
});

test("stream limits count UTF-8 bytes, cancel oversized bodies and reject large upstream JSON", async () => {
  const encoder = new TextEncoder();
  assert.equal(await readLimitedBody(new Response("中文"), 6), "中文");
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array<ArrayBuffer>>({
    start(controller) { controller.enqueue(encoder.encode("中文")); },
    cancel() { cancelled = true; },
  });
  await assert.rejects(readLimitedBody({ body: stream }, 5), errorIs("BODY_TOO_LARGE", 413));
  assert.equal(cancelled, true);
  assert.equal(await readLimitedBody({ body: null }, 1), "");
  await assert.rejects(queryGptBilling(token, "quick", { fetcher: mockFetch(() => json({ payload: "x".repeat(513 * 1024) })) }), errorIs("UPSTREAM_RESPONSE", 502));
});

test("route rejects cross-site, non-JSON, malformed and oversized bodies with no-store responses", async () => {
  const make = (body: string, headers: Record<string, string> = {}) => new Request("https://www.gptplusapp.com/api/tools/gpt-billing", { method: "POST", headers: { "content-type": "application/json", ...headers }, body });
  const cases: [Request, number, string][] = [
    [make("{}", { origin: "https://attacker.invalid" }), 403, "ORIGIN_REJECTED"],
    [make("{}", { "sec-fetch-site": "cross-site" }), 403, "ORIGIN_REJECTED"],
    [make("{}", { "content-type": "text/plain" }), 415, "INVALID_BODY"],
    [make("{", { "x-forwarded-for": "test-invalid-json" }), 400, "INVALID_BODY"],
    [make(JSON.stringify({ input: accountId, mode: "bad" }), { "x-forwarded-for": "test-invalid-mode" }), 400, "INVALID_BODY"],
    [make("{}", { "content-length": String(128 * 1024 + 1), "x-forwarded-for": "test-declared-large" }), 413, "BODY_TOO_LARGE"],
    [make(" ".repeat(128 * 1024 + 1), { "x-forwarded-for": "test-stream-large" }), 413, "BODY_TOO_LARGE"],
  ];
  for (const [request, status, code] of cases) {
    const response = await POST(request);
    assert.equal(response.status, status);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    assert.equal(response.headers.get("referrer-policy"), "no-referrer");
    const body = await response.json();
    assert.equal(body.code, code);
    assert.equal(body.success, false);
    assert.ok(!JSON.stringify(body).includes(token));
  }
});

test("route accepts the browser's same Host through Next localhost rewriting while refusing foreign or null origins", async () => {
  const make = (origin: string, extraHeaders: Record<string, string> = {}) => new Request("http://localhost:3000/api/tools/gpt-billing", {
    method: "POST",
    headers: { "content-type": "application/json", host: "127.0.0.1:3000", origin, "x-forwarded-for": "test-next-rewritten-host", ...extraHeaders },
    // A UUID alone must fail input validation, so no real upstream request occurs.
    body: JSON.stringify({ input: accountId, mode: "quick" }),
  });
  const allowed = await POST(make("http://127.0.0.1:3000"));
  assert.equal(allowed.status, 400);
  assert.equal((await allowed.json()).code, "INVALID_INPUT");
  for (const request of [
    make("https://attacker.invalid"),
    make("null"),
    make("https://127.0.0.1:3000"),
    make("http://127.0.0.1:4000"),
    make("http://127.0.0.1:3000", { "sec-fetch-site": "cross-site" }),
  ]) {
    const denied = await POST(request);
    assert.equal(denied.status, 403);
    assert.equal((await denied.json()).code, "ORIGIN_REJECTED");
  }
});
