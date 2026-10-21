import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { Agent, createServer as createHttpsServer, request as httpsRequest } from "node:https";
import type { AgentOptions, RequestOptions } from "node:https";
import { createServer } from "node:http";
import type { ClientRequest, IncomingMessage } from "node:http";
import { Readable } from "node:stream";
import { once } from "node:events";
import { createBillingFetch } from "./gpt-billing-network";

const target = "https://chatgpt.com/backend-api/accounts/check/v4-2023-04-27";
const settings = (host = "127.0.0.1", port = 7890) => `<dictionary> {\n  HTTPSEnable : 1\n  HTTPSProxy : ${host}\n  HTTPSPort : ${port}\n}`;

function harness(configuration: Parameters<typeof createBillingFetch>[0] = {}, response: { status?: number; encoding?: string; stream?: Readable } = {}) {
  const agents: { environment: { https_proxy: string; no_proxy?: string }; destroyed: number }[] = [];
  const calls: { url: string; options: RequestOptions }[] = [];
  let incoming: IncomingMessage | undefined;
  let outgoing: EventEmitter | undefined;
  const request = ((url: URL, options: RequestOptions, listener: (response: IncomingMessage) => void) => {
    calls.push({ url: url.href, options });
    const emitter = new EventEmitter();
    outgoing = emitter;
    const abort = () => emitter.emit("error", new DOMException("Aborted", "AbortError"));
    options.signal?.addEventListener("abort", abort, { once: true });
    Object.assign(emitter, {
      end() {
        queueMicrotask(() => {
          if (options.signal?.aborted) return;
          incoming = Object.assign(response.stream ?? Readable.from([Buffer.from('{"ok":true}')]), {
            statusCode: response.status ?? 200,
            statusMessage: "Synthetic",
            headers: { "content-type": "application/json", ...(response.encoding ? { "content-encoding": response.encoding } : {}) },
            rawHeaders: ["content-type", "application/json"],
          }) as IncomingMessage;
          incoming.once("close", () => options.signal?.removeEventListener("abort", abort));
          listener(incoming);
        });
      },
    });
    return emitter as ClientRequest;
  }) as typeof httpsRequest;
  const fetcher = createBillingFetch({
    environment: () => ({ HTTPS_PROXY: "http://127.0.0.1:7890" }), platform: "linux", nodeVersion: "24.19.0", request,
    createAgent(environment) {
      const record = { environment, destroyed: 0 };
      agents.push(record);
      const agent = new Agent();
      agent.destroy = () => { record.destroyed++; };
      return agent;
    },
    ...configuration,
  });
  return { fetcher, agents, calls, incoming: () => incoming, fail: (error: Error) => outgoing?.emit("error", error) };
}

test("explicit proxy values and lowercase precedence avoid system lookup, preserve NO_PROXY, and are reread per query", async () => {
  const environment: Record<string, string | undefined> = { HTTPS_PROXY: "http://upper.invalid:8080", https_proxy: "http://lower.invalid:8081", NO_PROXY: "upper.invalid", no_proxy: "chatgpt.com" };
  let lookups = 0;
  const subject = harness({ environment: () => environment, platform: "darwin", readSystemProxy: async () => { lookups++; return settings(); } });
  await (await subject.fetcher(target)).text();
  assert.deepEqual(subject.agents[0].environment, { https_proxy: "http://lower.invalid:8081/", no_proxy: "chatgpt.com" });
  environment.https_proxy = "https://changed.invalid:8082";
  await (await subject.fetcher(target)).text();
  assert.equal(subject.agents[1].environment.https_proxy, "https://changed.invalid:8082/");
  assert.equal(lookups, 0);
});

test("macOS system proxy discovery is shared and expires within 30 seconds", async () => {
  let time = 100;
  let lookups = 0;
  const subject = harness({ environment: () => ({}), platform: "darwin", now: () => time, readSystemProxy: async () => { lookups++; return settings("localhost", lookups === 1 ? 7890 : 7891); } });
  const responses = await Promise.all([subject.fetcher(target), subject.fetcher(target)]);
  await Promise.all(responses.map(response => response.text()));
  assert.equal(lookups, 1);
  time += 24_000;
  await (await subject.fetcher(target)).text();
  assert.equal(lookups, 1);
  time += 2000;
  await (await subject.fetcher(target)).text();
  assert.equal(lookups, 2);
  assert.equal(subject.agents[3].environment.https_proxy, "http://localhost:7891/");
});

test("unconfigured, disabled or explicitly empty proxies keep the original fetch path", async () => {
  let fallbackCalls = 0;
  for (const configuration of [
    { environment: () => ({}), platform: "linux" as const },
    { environment: () => ({ HTTPS_PROXY: "" }), platform: "darwin" as const, readSystemProxy: async () => { throw new Error("must not read system"); } },
    { environment: () => ({}), platform: "darwin" as const, readSystemProxy: async () => "HTTPSEnable : 0\nHTTPSProxy : 127.0.0.1\nHTTPSPort : 7890" },
    { environment: () => ({}), platform: "darwin" as const, readSystemProxy: async () => "HTTPSEnable : 1\nHTTPSProxy : user:password@example.invalid\nHTTPSPort : 7890" },
  ]) {
    const subject = harness({ ...configuration, nodeVersion: "20.19.0", fallbackFetch: (async (url, init) => { fallbackCalls++; assert.equal(String(url), target); assert.equal(init?.cache, "no-store"); return Response.json({ direct: true }); }) as typeof fetch });
    assert.deepEqual(await (await subject.fetcher(target, { cache: "no-store" })).json(), { direct: true });
    assert.equal(subject.agents.length, 0);
  }
  assert.equal(fallbackCalls, 4);
});

test("unsafe proxy URLs and unsupported Node versions fail before a request or fallback", async () => {
  for (const proxy of ["socks5://127.0.0.1:7890", "file:///etc/passwd", "javascript:alert(1)", "not-a-url", "http://example.invalid/path", "http://example.invalid/?q=x"]) {
    const subject = harness({ environment: () => ({ HTTPS_PROXY: proxy }) });
    await assert.rejects(subject.fetcher(target), /proxy configuration/);
    assert.equal(subject.agents.length, 0);
    assert.equal(subject.calls.length, 0);
  }
  for (const nodeVersion of ["20.19.0", "22.20.0", "23.11.0", "24.4.0"]) {
    const subject = harness({ nodeVersion });
    await assert.rejects(subject.fetcher(target), /requires Node/);
    assert.equal(subject.agents.length, 0);
  }
  for (const nodeVersion of ["22.21.0", "24.5.0", "25.0.0"]) {
    const subject = harness({ nodeVersion });
    await (await subject.fetcher(target)).text();
    assert.equal(subject.agents.length, 1);
  }
});

test("proxied requests remain HTTPS GET, request identity bytes, and clean agents after reading", async () => {
  const subject = harness();
  const response = await subject.fetcher(target, { headers: { Authorization: "Bearer synthetic-test-value" }, cache: "no-store", redirect: "error" });
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(subject.calls[0].url, target);
  assert.equal(subject.calls[0].options.method, "GET");
  assert.equal((subject.calls[0].options.headers as Record<string, string>)["authorization"], "Bearer synthetic-test-value");
  assert.equal((subject.calls[0].options.headers as Record<string, string>)["accept-encoding"], "identity");
  assert.equal(subject.agents[0].destroyed, 1);
  await assert.rejects(subject.fetcher("http://chatgpt.com/"), /HTTPS read/);
  await assert.rejects(subject.fetcher(target, { method: "POST", body: "ignored" }), /HTTPS read/);
});

test("redirects and unexpected compressed responses never follow or leak an agent", async () => {
  for (const response of [{ status: 302 }, { status: 307 }, { encoding: "gzip" }]) {
    const subject = harness({}, response);
    await assert.rejects(subject.fetcher(target), /redirect or unsupported encoding/);
    assert.equal(subject.calls.length, 1);
    assert.equal(subject.incoming()?.destroyed, true);
    assert.equal(subject.agents[0].destroyed, 1);
  }
});

test("body cancellation and failures release request-specific agents", async () => {
  const stream = new Readable({ read() { /* Deliberately stay open until cancellation. */ } });
  const subject = harness({}, { stream });
  const response = await subject.fetcher(target);
  await response.body?.cancel();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(stream.destroyed, true);
  assert.equal(subject.agents[0].destroyed, 1);
  const failed = harness({}, { stream: new Readable({ read() {} }) });
  const pending = failed.fetcher(target);
  queueMicrotask(() => failed.fail(new Error("synthetic transport failure")));
  await assert.rejects(pending, /synthetic transport failure/);
  assert.equal(failed.agents[0].destroyed, 1);
});

test("aborted requests do not send, and cancellation during lookup is respected", async () => {
  const controller = new AbortController();
  controller.abort();
  const subject = harness();
  await assert.rejects(subject.fetcher(target, { signal: controller.signal }), { name: "AbortError" });
  assert.equal(subject.calls.length, 0);
  const duringLookup = new AbortController();
  const delayed = harness({ environment: () => ({}), platform: "darwin", readSystemProxy: async () => { duringLookup.abort(); return settings(); } });
  await assert.rejects(delayed.fetcher(target, { signal: duringLookup.signal }), { name: "AbortError" });
  assert.equal(delayed.calls.length, 0);
});

test("native agent actually tunnels HTTPS and honors NO_PROXY without global configuration changes", async () => {
  const proxy = createServer();
  let connects = 0;
  let localConnections = 0;
  proxy.on("connect", (request, socket) => {
    connects++;
    assert.match(request.url ?? "", /^127\.0\.0\.1:\d+$/);
    socket.end("HTTP/1.1 502 Synthetic test proxy\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");
  });
  // No certificate is supplied: connection fails locally after the TCP connect.
  // This proves the bypass without trusting a test CA or changing TLS settings.
  const origin = createHttpsServer();
  origin.on("connection", () => { localConnections++; });
  origin.on("tlsClientError", () => {});
  proxy.listen(0, "127.0.0.1");
  origin.listen(0, "127.0.0.1");
  await Promise.all([once(proxy, "listening"), once(origin, "listening")]);
  const proxyAddress = proxy.address();
  const originAddress = origin.address();
  assert.ok(proxyAddress && typeof proxyAddress !== "string");
  assert.ok(originAddress && typeof originAddress !== "string");
  const environment: Record<string, string | undefined> = { HTTPS_PROXY: `http://127.0.0.1:${proxyAddress.port}` };
  const fetcher = createBillingFetch({ environment: () => environment, platform: "linux" });
  const url = `https://127.0.0.1:${originAddress.port}/synthetic`;
  try {
    await assert.rejects(fetcher(url, { signal: AbortSignal.timeout(2000) }));
    assert.equal(connects, 1);
    assert.equal(localConnections, 0);
    environment.NO_PROXY = "127.0.0.1";
    await assert.rejects(fetcher(url, { signal: AbortSignal.timeout(2000) }));
    assert.equal(connects, 1);
    assert.equal(localConnections, 1);
  } finally {
    await Promise.all([new Promise<void>(resolve => proxy.close(() => resolve())), new Promise<void>(resolve => origin.close(() => resolve()))]);
  }
});

test("in-flight cancellation tears down a pending native proxy tunnel", async () => {
  const proxy = createServer();
  proxy.listen(0, "127.0.0.1");
  await once(proxy, "listening");
  const address = proxy.address();
  assert.ok(address && typeof address !== "string");
  let destroyed = 0;
  const fetcher = createBillingFetch({
    environment: () => ({ HTTPS_PROXY: `http://127.0.0.1:${address.port}` }),
    platform: "linux",
    createAgent(proxyEnv) {
      const options: AgentOptions & { proxyEnv: typeof proxyEnv } = { proxyEnv, keepAlive: false };
      const agent = new Agent(options);
      const originalDestroy = agent.destroy.bind(agent);
      agent.destroy = () => { destroyed++; originalDestroy(); };
      return agent;
    },
  });
  const connected = once(proxy, "connect");
  const controller = new AbortController();
  const pending = fetcher(target, { signal: controller.signal });
  const rejected = assert.rejects(pending, { name: "AbortError" });
  const [, socket] = await connected;
  try {
    controller.abort();
    await rejected;
    assert.equal(destroyed, 1);
  } finally {
    socket.destroy();
    await new Promise<void>(resolve => proxy.close(() => resolve()));
  }
});
