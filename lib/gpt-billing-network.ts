import { execFile } from "node:child_process";
import { Agent, request as httpsRequest } from "node:https";
import type { AgentOptions } from "node:https";
import type { ClientRequest, IncomingMessage } from "node:http";
import { Readable } from "node:stream";

type ProxyEnvironment = { https_proxy: string; no_proxy?: string };
type NetworkOptions = {
  environment?: () => Record<string, string | undefined>;
  platform?: NodeJS.Platform;
  nodeVersion?: string;
  readSystemProxy?: () => Promise<string>;
  now?: () => number;
  fallbackFetch?: typeof fetch;
  request?: typeof httpsRequest;
  createAgent?: (environment: ProxyEnvironment) => Agent;
};

// Node 24.5 / 22.21 added proxyEnv; @types/node 20 does not yet describe it.
function nativeAgent(environment: ProxyEnvironment) {
  const options: AgentOptions & { proxyEnv: ProxyEnvironment } = { keepAlive: false, proxyEnv: environment };
  return new Agent(options);
}

function supportsNativeProxy(version: string) {
  const [major, minor] = version.replace(/^v/, "").split(".").map(Number);
  return major > 24 || major === 24 && minor >= 5 || major === 22 && minor >= 21;
}

function checkedProxy(value: string): string {
  let url: URL;
  try { url = new URL(value); }
  catch { throw new TypeError("Invalid billing proxy configuration."); }
  if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.pathname !== "/" || url.search || url.hash) {
    throw new TypeError("Unsupported billing proxy configuration.");
  }
  return url.href;
}

function systemProxyUrl(settings: string): string | null {
  const setting = (name: string) => settings.match(new RegExp(`^\\s*${name}\\s*:\\s*(\\S+)\\s*$`, "m"))?.[1] ?? "";
  const host = setting("HTTPSProxy");
  const port = Number(setting("HTTPSPort"));
  if (setting("HTTPSEnable") !== "1" || !/^[a-zA-Z0-9.:[\]-]+$/.test(host) || !Number.isInteger(port) || port < 1 || port > 65535) return null;
  const hostname = host.includes(":") && !host.startsWith("[") ? `[${host}]` : host;
  try { return checkedProxy(`http://${hostname}:${port}`); }
  catch { return null; }
}

function readSystemProxy(): Promise<string> {
  return new Promise(resolve => {
    execFile("/usr/sbin/scutil", ["--proxy"], { encoding: "utf8", timeout: 1500, maxBuffer: 32 * 1024 }, (error, stdout) => resolve(error ? "" : stdout));
  });
}

/** Uses a request-specific agent, never the process/global fetch dispatcher. */
export function createBillingFetch(options: NetworkOptions = {}): typeof fetch {
  const environment = options.environment ?? (() => process.env);
  const platform = options.platform ?? process.platform;
  const version = options.nodeVersion ?? process.versions.node;
  const now = options.now ?? Date.now;
  const createAgent = options.createAgent ?? nativeAgent;
  const request = options.request ?? httpsRequest;
  let cachedSystemProxy: { value: string | null; until: number } | undefined;
  let pendingSystemProxy: Promise<string | null> | undefined;

  async function proxyEnvironment(): Promise<ProxyEnvironment | null> {
    // Read explicit environment variables on every query so changes take effect
    // immediately. Lowercase has the same precedence as Node's native agents.
    const current = environment();
    const explicit = current.https_proxy ?? current.HTTPS_PROXY;
    const bypass = current.no_proxy ?? current.NO_PROXY;
    let proxy: string | null;
    if (explicit !== undefined) proxy = explicit.trim() ? checkedProxy(explicit.trim()) : null;
    else if (platform === "darwin") {
      if (cachedSystemProxy && cachedSystemProxy.until > now()) proxy = cachedSystemProxy.value;
      else {
        pendingSystemProxy ??= (options.readSystemProxy ?? readSystemProxy)().then(settings => {
          const value = systemProxyUrl(settings);
          cachedSystemProxy = { value, until: now() + 25_000 };
          return value;
        }).finally(() => { pendingSystemProxy = undefined; });
        proxy = await pendingSystemProxy;
      }
    } else proxy = null;
    return proxy ? { https_proxy: proxy, ...(bypass !== undefined ? { no_proxy: bypass } : {}) } : null;
  }

  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const prepared = new Request(input, init);
    prepared.signal.throwIfAborted();
    const proxy = await proxyEnvironment();
    prepared.signal.throwIfAborted();
    if (!proxy) return (options.fallbackFetch ?? fetch)(input, init);
    if (!supportsNativeProxy(version)) throw new TypeError("Billing proxy requires Node.js 24.5+ or 22.21+.");
    const url = new URL(prepared.url);
    if (url.protocol !== "https:" || !["GET", "HEAD"].includes(prepared.method) || prepared.body) {
      throw new TypeError("Billing transport only supports HTTPS read requests.");
    }
    const headers = new Headers(prepared.headers);
    // IncomingMessage does not transparently decompress as fetch does. Ask for
    // identity and reject unexpected compression rather than parsing bad bytes.
    headers.set("accept-encoding", "identity");
    const agent = createAgent(proxy);
    return new Promise<Response>((resolve, reject) => {
      let cleaned = false;
      let outgoing: ClientRequest | undefined;
      let responseStream: IncomingMessage | undefined;
      const cleanup = () => {
        if (!cleaned) {
          cleaned = true;
          prepared.signal.removeEventListener("abort", onAbort);
          agent.destroy();
        }
      };
      // The native proxy CONNECT handshake can still be waiting before the
      // ClientRequest's own signal handling settles. Reject explicitly as well.
      const onAbort = () => {
        responseStream?.destroy();
        outgoing?.destroy();
        cleanup();
        reject(prepared.signal.reason ?? new DOMException("Aborted", "AbortError"));
      };
      prepared.signal.addEventListener("abort", onAbort, { once: true });
      try {
        outgoing = request(url, { method: prepared.method, headers: Object.fromEntries(headers), agent, signal: prepared.signal }, incoming => {
          responseStream = incoming;
          incoming.once("end", cleanup);
          incoming.once("close", cleanup);
          incoming.once("error", cleanup);
          const status = incoming.statusCode ?? 502;
          const encoding = incoming.headers["content-encoding"]?.toLowerCase();
          if (status >= 300 && status < 400 || encoding && encoding !== "identity") {
            incoming.destroy();
            cleanup();
            reject(new TypeError("Billing upstream returned a redirect or unsupported encoding."));
            return;
          }
          try {
            const responseHeaders = new Headers();
            for (let i = 0; i < incoming.rawHeaders.length; i += 2) responseHeaders.append(incoming.rawHeaders[i], incoming.rawHeaders[i + 1]);
            const empty = prepared.method === "HEAD" || [204, 205].includes(status);
            if (empty) incoming.resume();
            const body = empty ? null : Readable.toWeb(incoming, {
              strategy: { highWaterMark: 64 * 1024, size: chunk => (chunk as Uint8Array).byteLength },
            }) as ReadableStream<Uint8Array<ArrayBuffer>>;
            resolve(new Response(body, { status, statusText: incoming.statusMessage, headers: responseHeaders }));
          } catch (error) {
            incoming.destroy();
            cleanup();
            reject(error);
          }
        });
        outgoing.once("error", error => { cleanup(); reject(error); });
        outgoing.end();
      } catch (error) { cleanup(); reject(error); }
    });
  }) as typeof fetch;
}

export const billingFetch: typeof fetch = createBillingFetch();
