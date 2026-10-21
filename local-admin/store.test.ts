import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import matter from "gray-matter";
import { AdminError, ArticleStore, type Fields } from "./store";

const fields: Fields = {
  title: "测试教程", description: "用于隔离测试的摘要", category: "ChatGPT", slug: "existing-guide", date: "2026-10-21",
  keywords: ["测试"], productId: "legacy-product", productUrl: "https://gpt3plus.com/", sourceUrl: "https://t.me/netfix666/1",
};
const original = matter.stringify("\n## 原文\n\n正文\n\n---\n\n分隔线后的正文\n", { ...fields, updatedAt: "2026-08-29", author: "原作者", custom: { preserve: true } });

async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "gptplusapp-admin-test-"));
  await fs.mkdir(path.join(root, "content/posts"), { recursive: true });
  const file = path.join(root, "content/posts/existing-guide.md");
  await fs.writeFile(file, original);
  return { root, file, store: new ArticleStore(root), cleanup: () => fs.rm(root, { recursive: true, force: true }) };
}

test("editing a draft preserves the published bytes, metadata and existing URL", async () => {
  const f = await fixture();
  try {
    const article = await f.store.get("existing-guide.md");
    assert.match(article.content, /分隔线后的正文/);
    const draft = await f.store.save({ ...article, fields: { ...article.fields, title: "修改后的教程" }, content: "## 新正文\n\n修改内容" }, false);
    assert.equal(draft.hasDraft, true);
    assert.equal(await fs.readFile(f.file, "utf8"), original);
    const result = await f.store.save(draft, true);
    assert.equal(result.id, "existing-guide.md");
    assert.equal(result.hasDraft, false);
    assert.equal(result.previewUrl, "http://127.0.0.1:3000/blog/existing-guide");
    const saved = matter(await fs.readFile(f.file, "utf8"));
    assert.equal(saved.data.title, "修改后的教程");
    assert.equal(saved.data.productId, "legacy-product");
    assert.equal(saved.data.sourceUrl, fields.sourceUrl);
    assert.deepEqual(saved.data.custom, { preserve: true });
    assert.equal(saved.data.author, "原作者");
    assert.equal(typeof saved.data.date, "string");
    const backups = await fs.readdir(path.join(f.root, ".local-admin/backups"));
    assert.equal(backups.length, 1);
    assert.equal(await fs.readFile(path.join(f.root, ".local-admin/backups", backups[0]), "utf8"), original);
  } finally { await f.cleanup(); }
});

test("incomplete drafts stay outside posts and can be recovered after discard", async () => {
  const f = await fixture();
  try {
    const draft = await f.store.save({ fields: { ...fields, title: "", description: "", slug: "", date: "" }, content: "" }, false);
    assert.equal(draft.published, false);
    assert.deepEqual(await fs.readdir(path.join(f.root, "content/posts")), ["existing-guide.md"]);
    const list = await f.store.list(new URLSearchParams({ status: "draft" }));
    assert.equal(list.total, 1);
    assert.deepEqual(list.counts, { published: 1, drafts: 1 });
    assert.deepEqual(await f.store.discard(draft), { article: null });
    assert.equal((await f.store.list(new URLSearchParams())).counts.drafts, 0);
    assert.equal((await fs.readdir(path.join(f.root, ".local-admin/backups"))).length, 1);
  } finally { await f.cleanup(); }
});

test("new draft publishing creates a compatible Markdown file and removes its draft", async () => {
  const f = await fixture();
  try {
    const draft = await f.store.save({ fields: { ...fields, slug: "new-guide", category: "AI教程" }, content: "## 新教程\n\n新内容" }, false);
    const published = await f.store.save(draft, true);
    assert.equal(published.id, "new-guide.md");
    assert.equal(published.published, true);
    assert.equal(published.hasDraft, false);
    const saved = matter(await fs.readFile(path.join(f.root, "content/posts/new-guide.md"), "utf8"));
    for (const required of ["title", "description", "category", "slug", "date", "keywords", "productId", "productUrl"]) assert.ok(required in saved.data);
    assert.equal((await f.store.list(new URLSearchParams())).counts.drafts, 0);
  } finally { await f.cleanup(); }
});

test("stale browser revisions cannot overwrite another tab's draft or external edits", async () => {
  const f = await fixture();
  try {
    const before = await f.store.get("existing-guide.md");
    const draft = await f.store.save({ ...before, content: "编辑窗口 A" }, false);
    await assert.rejects(f.store.save({ ...before, content: "编辑窗口 B" }, false), (error: unknown) => error instanceof AdminError && error.status === 409);
    const external = original.replace("正文", "外部编辑后的正文");
    await fs.writeFile(f.file, external);
    await assert.rejects(f.store.save(draft, true), (error: unknown) => error instanceof AdminError && error.status === 409);
    const reloaded = await f.store.get(before.id);
    await assert.rejects(f.store.save(reloaded, true), (error: unknown) => error instanceof AdminError && error.status === 409);
    assert.equal(await fs.readFile(f.file, "utf8"), external);
  } finally { await f.cleanup(); }
});

test("duplicate slugs, traversal, invalid dates and URL changes fail without changing articles", async () => {
  const f = await fixture();
  try {
    const source = await f.store.get("existing-guide.md");
    await assert.rejects(f.store.get("../README.md"), (error: unknown) => error instanceof AdminError && error.status === 400);
    for (const patch of [{ slug: "../../escape" }, { date: "2026-02-30", slug: "new-guide" }, { productUrl: "javascript:alert(1)", slug: "new-guide" }]) {
      await assert.rejects(f.store.save({ fields: { ...fields, ...patch }, content: "正文" }, true), (error: unknown) => error instanceof AdminError && error.status === 400);
    }
    await assert.rejects(f.store.save({ fields, content: "重复网址" }, true), (error: unknown) => error instanceof AdminError && error.status === 409);
    await assert.rejects(f.store.save({ ...source, fields: { ...fields, slug: "changed-url" } }, true), /网址标识不可更改/);
    assert.equal(await fs.readFile(f.file, "utf8"), original);
  } finally { await f.cleanup(); }
});

test("discarding an existing article draft restores the published article", async () => {
  const f = await fixture();
  try {
    const source = await f.store.get("existing-guide.md");
    const draft = await f.store.save({ ...source, content: "待丢弃文案" }, false);
    const { article } = await f.store.discard(draft);
    assert.equal(article?.hasDraft, false);
    assert.equal(article?.content, source.content);
    assert.equal(await fs.readFile(f.file, "utf8"), original);
  } finally { await f.cleanup(); }
});

test("symlinks cannot be used to read or overwrite files outside the article directory", async () => {
  const f = await fixture();
  try {
    const outside = path.join(f.root, "private.md");
    await fs.writeFile(outside, "private");
    await fs.symlink(outside, path.join(f.root, "content/posts/link.md"));
    await assert.rejects(f.store.get("link.md"), (error: unknown) => error instanceof AdminError && error.status === 400);
    assert.equal(await fs.readFile(outside, "utf8"), "private");
  } finally { await f.cleanup(); }
});

test("pasted Markdown beginning with frontmatter-like dividers is preserved as body text", async () => {
  const f = await fixture();
  try {
    const content = "---\ntitle: 正文中的文字\n---\n\n# 粘贴的文章\n\n正文\n\n---\n";
    const article = await f.store.save({ fields: { ...fields, slug: "pasted-guide" }, content }, true);
    assert.equal(article.content, content);
    const saved = matter(await fs.readFile(path.join(f.root, "content/posts/pasted-guide.md"), "utf8"));
    assert.equal(saved.data.title, fields.title);
    assert.equal(saved.content, content);
  } finally { await f.cleanup(); }
});

test("body-only publishing fills all required fields and respects pasted punctuation", async () => {
  const f = await fixture();
  try {
    const content = "## ChatGPT Plus 付款失败怎么办\n\n这里是完整的作者原文。";
    const article = await f.store.save({ fields: { slug: "chatgpt-guide。" }, content }, true);
    assert.equal(article.id, "chatgpt-guide.md");
    assert.equal(article.fields.category, "ChatGPT");
    assert.equal(article.content, `${content}\n`);
    assert.ok(article.fields.title && article.fields.description && article.fields.date);
    assert.equal(await fs.readFile(f.file, "utf8"), original);
  } finally { await f.cleanup(); }
});

test("organizing makes a unique new URL without changing the draft or published article", async () => {
  const f = await fixture();
  try {
    const input = { fields: { title: "ChatGPT 新文案", slug: "existing-guide" }, content: "粘贴的正文" };
    const result = await f.store.organize(input);
    assert.equal(result.fields.slug, "existing-guide-2");
    assert.equal(await fs.readFile(f.file, "utf8"), original);
    assert.deepEqual((await f.store.list(new URLSearchParams())).counts, { published: 1, drafts: 0 });
  } finally { await f.cleanup(); }
});

test("reopened drafts distinguish automatic metadata from manual fields", async () => {
  const f = await fixture();
  try {
    const draft = await f.store.save({ fields: {}, content: "Claude Pro 的使用教程", manualFields: [] }, false);
    assert.deepEqual(draft.manualFields, []);
    const result = await f.store.organize({ ...draft, manualFields: draft.manualFields });
    assert.equal(result.fields.category, "Claude");
    const manualDraft = await f.store.save({ ...draft, fields: { ...draft.fields, category: "AI教程" }, manualFields: ["category"] }, false);
    const manual = await f.store.get(manualDraft.id);
    assert.deepEqual(manual.manualFields, ["category"]);
    assert.equal((await f.store.organize({ ...manual })).fields.category, "AI教程");
  } finally { await f.cleanup(); }
});
