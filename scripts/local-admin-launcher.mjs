import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";
import http from "node:http";

const execute = promisify(execFile);
const root = realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
const adminPort = readPort("ADMIN_PORT", 4318);
const previewPort = readPort("SITE_PREVIEW_PORT", 3000);
const adminUrl = `http://127.0.0.1:${adminPort}`;
const previewUrl = `http://127.0.0.1:${previewPort}`;
const lsof = existsSync("/usr/sbin/lsof") ? "/usr/sbin/lsof" : "lsof";
const children = [];
let stopping = false;

function readPort(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < 1024 || value > 65535) {
    console.error(`${name} 须为 1024 至 65535 之间的端口。`);
    process.exit(1);
  }
  return value;
}

async function listeners(port) {
  let output;
  try {
    // 只核验实际访问的 IPv4 回环端点。macOS 允许其他程序的 IPv6
    // 通配符监听与 127.0.0.1 的监听并存，不能将两者混为同一服务。
    ({ stdout: output } = await execute(lsof, ["-nP", "-a", `-iTCP@127.0.0.1:${port}`, "-sTCP:LISTEN", "-Fpn"]));
  } catch (error) {
    if (error.code === 1) return [];
    throw new Error("无法检查端口占用，请确认系统可以运行 lsof 命令。", { cause: error });
  }
  const records = [];
  let pid;
  for (const line of output.split("\n")) {
    if (line.startsWith("p")) pid = Number(line.slice(1));
    if (line.startsWith("n") && pid) records.push({ pid, address: line.slice(1) });
  }
  return records;
}

async function isAvailable(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", error => error.code === "EADDRINUSE" ? resolve(false) : reject(error));
    server.listen(port, "127.0.0.1", () => server.close(() => resolve(true)));
  });
}

async function health() {
  return new Promise(resolve => {
    const request = http.get(`${adminUrl}/api/health`, { timeout: 1000 }, response => {
      let data = "";
      response.setEncoding("utf8");
      response.on("data", chunk => {
        data += chunk;
        if (data.length > 10000) request.destroy();
      });
      response.on("end", () => {
        try { resolve(response.statusCode === 200 ? JSON.parse(data) : null); }
        catch { resolve(null); }
      });
      response.on("error", () => resolve(null));
    });
    request.on("timeout", () => request.destroy());
    request.on("error", () => resolve(null));
  });
}

async function nextProcessForProject(pid) {
  // Next.js 的监听进程可能是 CLI 的子进程，逐级核验工作目录和启动命令。
  for (let level = 0; level < 8 && pid > 1; level++) {
    try {
      const [{ stdout: cwd }, { stdout: details }] = await Promise.all([
        execute(lsof, ["-a", "-p", String(pid), "-d", "cwd", "-Fn"]),
        execute("ps", ["-p", String(pid), "-o", "ppid=", "-o", "command="]),
      ]);
      const processRoot = cwd.split("\n").find(line => line.startsWith("n"))?.slice(1);
      if (!processRoot || realpathSync(processRoot) !== root) return false;
      const match = details.trim().match(/^(\d+)\s+([\s\S]+)$/);
      if (!match) return false;
      if (/(?:^|\s)(?:\S*\/)?next(?:\/dist\/bin\/next)?\s+dev(?:\s|$)/.test(match[2])) return true;
      pid = Number(match[1]);
    } catch { return false; }
  }
  return false;
}

function onlyLoopback(records, port) {
  return records.length > 0 && records.every(item => item.address === `127.0.0.1:${port}`);
}

async function existingService(kind, port) {
  if (await isAvailable(port)) return false;
  const records = await listeners(port);
  if (onlyLoopback(records, port)) {
    if (kind === "admin") {
      const info = await health();
      if (info?.service === "gptplusapp-local-admin" && info.root === root && info.previewPort === previewPort) return true;
    } else {
      const checks = await Promise.all([...new Set(records.map(item => item.pid))].map(nextProcessForProject));
      if (checks.every(Boolean)) return true;
    }
  }
  const variable = kind === "admin" ? "ADMIN_PORT" : "SITE_PREVIEW_PORT";
  throw new Error(`端口 ${port} 已被其他服务占用，无法确认为本项目的${kind === "admin" ? "文章后台" : "本地预览"}。请先手动关闭该服务，或设置 ${variable} 使用其他端口；启动器不会关闭未知进程。`);
}

function start(label, args) {
  const child = spawn(process.execPath, args, {
    cwd: root,
    detached: true,
    stdio: "inherit",
    env: { ...process.env, ADMIN_PORT: String(adminPort), SITE_PREVIEW_PORT: String(previewPort) },
  });
  const record = { child, label, exited: false, error: null };
  children.push(record);
  child.once("error", error => { record.error = error; record.exited = true; });
  child.once("exit", (code, signal) => {
    record.exited = true;
    if (!stopping) {
      console.error(`${label}已停止（${signal ?? `退出码 ${code}`}）。`);
      void stop(code === 0 ? 0 : 1);
    }
  });
  return record;
}

async function waitFor(record, ready) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (record.exited) throw new Error(`${record.label}启动失败，请查看上方日志。`, { cause: record.error });
    if (await ready()) return;
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error(`${record.label}在 30 秒内未启动，请查看上方日志或稍后重试。`);
}

function signalGroup(record, signal) {
  if (!record.child.pid) return;
  try { process.kill(-record.child.pid, signal); }
  catch (error) { if (error.code !== "ESRCH") console.error(`停止${record.label}失败：${error.message}`); }
}

async function stop(code) {
  if (stopping) return;
  stopping = true;
  for (const record of children) signalGroup(record, "SIGTERM");
  const deadline = Date.now() + 5000;
  while (children.some(record => !record.exited) && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  // 进程组包含 Next.js 的子进程，只清理本次启动的服务。
  for (const record of children) signalGroup(record, "SIGKILL");
  process.exit(code);
}

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => {
    console.log("\n正在停止本次启动的本地服务……");
    void stop(0);
  });
}

try {
  if (adminPort === previewPort) throw new Error("文章后台和本地预览需要使用不同端口。");
  // 先核验两处端口，避免发现冲突后留下半套服务。
  const reuseAdmin = await existingService("admin", adminPort);
  const reusePreview = await existingService("preview", previewPort);
  if (reusePreview) console.log(`复用本项目的本地预览：${previewUrl}`);
  else {
    const preview = start("本地预览", ["node_modules/next/dist/bin/next", "dev", "--webpack", "--hostname", "127.0.0.1", "--port", String(previewPort)]);
    await waitFor(preview, async () => onlyLoopback(await listeners(previewPort), previewPort));
  }
  if (reuseAdmin) console.log(`复用本项目的文章后台：${adminUrl}`);
  else {
    const admin = start("文章后台", ["--import", "tsx", "local-admin/server.ts"]);
    await waitFor(admin, async () => {
      const info = await health();
      return info?.service === "gptplusapp-local-admin" && info.root === root && info.previewPort === previewPort;
    });
  }
  console.log(`\n文章后台：${adminUrl}/\n网站预览：${previewUrl}/\n本地发布只修改本项目文件，不会自动上线。`);
  if (process.platform === "darwin" && process.env.ADMIN_NO_OPEN !== "1") {
    try { await execute("open", [`${adminUrl}/`]); }
    catch { console.log("浏览器未能自动打开，请复制上方文章后台地址访问。"); }
  }
  if (children.length) console.log("请保持此窗口打开，按 Ctrl+C 停止本次启动的服务。\n");
  else console.log("服务已在其他窗口运行，请在原启动窗口按 Ctrl+C 停止。\n");
} catch (error) {
  console.error(`\n启动失败：${error.message}`);
  await stop(1);
}
