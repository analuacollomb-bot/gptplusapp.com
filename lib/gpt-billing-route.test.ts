import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../app/api/tools/gpt-billing/route";

test("unavailable production requests stop before body parsing or an upstream call", async () => {
  const runtimeEnvironment = process.env as Record<string, string | undefined>;
  const previousNodeEnv = process.env.NODE_ENV;
  const previousVercel = process.env.VERCEL;
  const previousFetch = globalThis.fetch;
  let upstreamCalls = 0;
  globalThis.fetch = async () => { upstreamCalls++; throw new Error("Unexpected upstream request"); };
  try {
    for (const environment of [
      { NODE_ENV: "production", VERCEL: undefined },
      { NODE_ENV: "production", VERCEL: "1" },
      { NODE_ENV: "development", VERCEL: "1" },
    ]) {
      runtimeEnvironment.NODE_ENV = environment.NODE_ENV;
      if (environment.VERCEL === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = environment.VERCEL;
      const request = new Request("https://www.gptplusapp.com/api/tools/gpt-billing", {
        method: "POST",
        headers: { Origin: "https://www.gptplusapp.com", "Content-Type": "application/json" },
        // Deliberately invalid JSON: an unavailable route must not parse it.
        body: "synthetic-unread-body",
      });
      const response = await POST(request);
      assert.equal(response.status, 503);
      assert.equal((await response.json()).code, "LIVE_QUERY_UNAVAILABLE");
      assert.equal(request.bodyUsed, false);
      assert.match(response.headers.get("Cache-Control") ?? "", /no-store/);
    }
    assert.equal(upstreamCalls, 0);

    // The original desktop launcher uses next dev, whose validation still runs.
    runtimeEnvironment.NODE_ENV = "development";
    delete process.env.VERCEL;
    const localResponse = await POST(new Request("http://127.0.0.1:3000/api/tools/gpt-billing", {
      method: "POST",
      headers: { Origin: "http://127.0.0.1:3000", "Content-Type": "application/json" },
      body: JSON.stringify({ input: "00000000-0000-0000-0000-000000000000", mode: "quick" }),
    }));
    assert.equal(localResponse.status, 400);
    assert.equal((await localResponse.json()).code, "INVALID_INPUT");
    assert.equal(upstreamCalls, 0);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousNodeEnv === undefined) delete runtimeEnvironment.NODE_ENV;
    else runtimeEnvironment.NODE_ENV = previousNodeEnv;
    if (previousVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previousVercel;
  }
});
