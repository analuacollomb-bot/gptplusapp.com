import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { organizeWithCodex, type CodexOrganizeInput } from "./codex-assist";

const input: CodexOrganizeInput = {
  title: "付款问题", content: "ChatGPT Plus 付款遇到问题，先确认支付方式。",
  categories: ["ChatGPT", "AI教程"],
  products: [{ id: "chatgpt-plus", title: "ChatGPT Plus", category: "ChatGPT", orderUrl: "https://gpt3plus.com/" }],
  relatedPosts: [{ slug: "payment-guide", title: "付款指南", category: "ChatGPT" }],
};
const suggestion = { title: "付款问题", description: "整理文案中的付款问题。", category: "ChatGPT", slug: "chatgpt-payment",
  keywords: ["ChatGPT Plus", "付款"], productId: "chatgpt-plus", relatedSlugs: ["payment-guide"] };

async function fixture(script: string) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "gptplusapp-codex-test-"));
  const executable = path.join(root, "codex-fixture");
  const record = path.join(root, "record.json");
  const previous = process.env.LOCAL_ADMIN_CODEX_BIN;
  await fs.writeFile(executable, `#!${process.execPath}\nconst fs=require('node:fs');\nconst args=process.argv.slice(2);\nlet input='';\nprocess.stdin.on('data', chunk=>input+=chunk);\nprocess.stdin.on('end', ()=>{\nfs.writeFileSync(${JSON.stringify(record)},JSON.stringify({pid:process.pid,cwd:process.cwd(),args,input}));\n${script}\n});\n`, { mode: 0o700 });
  process.env.LOCAL_ADMIN_CODEX_BIN = executable;
  return { record, cleanup: async () => {
    if (previous === undefined) delete process.env.LOCAL_ADMIN_CODEX_BIN; else process.env.LOCAL_ADMIN_CODEX_BIN = previous;
    await fs.rm(root, { recursive: true, force: true });
  } };
}

const output = (value: unknown) => `fs.writeFileSync(args[args.indexOf('--output-last-message')+1], ${JSON.stringify(JSON.stringify(value))});\nconsole.log(JSON.stringify({type:'item.completed',item:{type:'agent_message'}}));`;

test("Codex receives only whitelisted stdin data in a private temporary cwd, and its files are cleaned", async () => {
  const f = await fixture(output(suggestion));
  try {
    assert.deepEqual(await organizeWithCodex(input), suggestion);
    const record = JSON.parse(await fs.readFile(f.record, "utf8"));
    assert.match(path.basename(record.cwd), /^gptplusapp-codex-organize-/);
    await assert.rejects(fs.stat(record.cwd), { code: "ENOENT" });
    assert.equal(record.args[record.args.indexOf("--model") + 1], "gpt-6.1-sol");
    assert.equal(record.args[record.args.indexOf("--sandbox") + 1], "read-only");
    assert.ok(record.args.includes("--ignore-user-config"));
    assert.ok(record.args.includes("--ignore-rules"));
    assert.ok(record.args.includes("--ephemeral"));
    assert.ok(record.args.includes("shell_tool"));
    assert.ok(record.args.includes("plugins"));
    assert.ok(!record.args.join(" ").includes(input.content));
    assert.deepEqual(JSON.parse(record.input.slice(record.input.indexOf("\n") + 1)).data, input);
  } finally { await f.cleanup(); }
});

test("unlisted product IDs, related slugs, categories, invalid URLs and extra fields are rejected", async () => {
  for (const change of [ { productId: "invented" }, { relatedSlugs: ["invented"] }, { category: "invented" },
    { slug: "https://example.com/" }, { extra: "untrusted" } ]) {
    const f = await fixture(output({ ...suggestion, ...change }));
    try { await assert.rejects(organizeWithCodex(input), /未通过校验/); }
    finally { await f.cleanup(); }
  }
});

test("cancellation stops this job and frees the single-job limit", async () => {
  const f = await fixture("setInterval(()=>{},1000);");
  try {
    const controller = new AbortController();
    const first = organizeWithCodex(input, { signal: controller.signal });
    const firstRejected = assert.rejects(first, /已取消/);
    let record: { pid: number; cwd: string } | null = null;
    for (let attempt = 0; attempt < 100 && !record; attempt++) {
      try { record = JSON.parse(await fs.readFile(f.record, "utf8")); }
      catch { await new Promise(resolve => setTimeout(resolve, 10)); }
    }
    assert.ok(record, "the isolated child must actually start before cancellation");
    await assert.rejects(organizeWithCodex(input), /另一篇文案/);
    controller.abort();
    await firstRejected;
    await assert.rejects(fs.stat(record.cwd), { code: "ENOENT" });
    assert.throws(() => process.kill(record.pid, 0), { code: "ESRCH" });
    await assert.rejects(organizeWithCodex(input, { signal: AbortSignal.abort() }), /已取消/);
  } finally { await f.cleanup(); }
});

test("unexpected tool activity, runtime errors and excessive CLI output stop the metadata job", async () => {
  for (const script of [ "console.log(JSON.stringify({type:'item.started',item:{type:'command_execution'}}));setInterval(()=>{},1000);",
    "console.log(JSON.stringify({type:'item.completed',item:{type:'error',message:'private runtime diagnostic'}}));setInterval(()=>{},1000);",
    "console.log('x'.repeat(150000));setInterval(()=>{},1000);" ]) {
    const f = await fixture(script);
    try { await assert.rejects(organizeWithCodex(input), /已停止/); }
    finally { await f.cleanup(); }
  }
});
