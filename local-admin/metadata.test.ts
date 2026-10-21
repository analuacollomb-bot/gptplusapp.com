import test from "node:test";
import assert from "node:assert/strict";
import { completeMetadata, detectCategory, normalizeSlug, relatedCandidates } from "./metadata";

test("body-only Chinese writing receives valid metadata and the explicit real product link", () => {
  const body = "🇨🇳 **国内开 ChatGPT Plus，最难的是付款！**\n\n想开 GPT 会员，却卡在支付环节？\n\n自助下单：https://gpt3plus.com/item/56";
  const result = completeMetadata({ content: body });
  assert.equal(result.category, "ChatGPT");
  assert.match(result.title, /国内开 ChatGPT Plus/);
  assert.ok(result.description.length > 0);
  assert.match(result.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.equal(result.productId, "chatgpt-56");
  assert.equal(result.productUrl, "https://gpt3plus.com/item/56");
  assert.match(result.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(result.keywords.length > 0);
});

test("pasted punctuation no longer blocks a new article, and original body stays untouched", () => {
  const content = "## ChatGPT 支付问题\n\n原始正文";
  assert.equal(completeMetadata({ fields: { title: "ChatGPT", slug: "chatgpt-guide。" }, content }).slug, "chatgpt-guide");
  assert.equal(normalizeSlug(" ＣＨＡＴＧＰＴ Guide. "), "chatgpt-guide");
  assert.equal(content, "## ChatGPT 支付问题\n\n原始正文");
});

test("explicit edits take precedence over suggestions, and existing URLs stay fixed", () => {
  const existing = completeMetadata({ fields: { title: "旧文", slug: "stable-guide", category: "Claude", description: "自写摘要", productId: "legacy-product", productUrl: "https://example.com/custom" }, content: "旧正文" });
  const result = completeMetadata({ fields: existing, content: "ChatGPT 新正文", manualFields: ["category", "productId", "productUrl"] }, {
    existing, organize: true, suggestion: { category: "ChatGPT", slug: "changed-url", title: "改标题", description: "改摘要", productId: "chatgpt-56" },
  });
  assert.equal(result.slug, existing.slug);
  assert.equal(result.category, "Claude");
  assert.equal(result.title, "旧文");
  assert.equal(result.description, "自写摘要");
  assert.equal(result.productId, "legacy-product");
  assert.equal(result.productUrl, "https://example.com/custom");
});

test("classifies the article focus and suggests only existing related article URLs", () => {
  assert.equal(detectCategory("Claude Pro 付款失败", "附带提及ChatGPT"), "Claude");
  assert.equal(detectCategory("SuperGrok 开通教程", "正文"), "Grok");
  const posts = [{ slug: "claude-payment", title: "Claude支付失败", category: "Claude" }, { slug: "grok-guide", title: "Grok充值", category: "Grok" }];
  assert.deepEqual(relatedCandidates("Claude付款失败", "正文", "Claude", posts), [posts[0]]);
});

test("automatic unpublished metadata follows the new topic, and manual category remains authoritative", () => {
  const initial = completeMetadata({ content: "ChatGPT Plus充值步骤" });
  const input = { fields: { ...initial, title: "Claude Pro升级Max前的注意事项" }, content: "Claude Pro升级Max前的注意事项", manualFields: [] };
  const result = completeMetadata(input, { organize: true });
  assert.equal(result.category, "Claude");
  assert.notEqual(result.slug, initial.slug);
  assert.notEqual(result.description, initial.description);
  const manual = completeMetadata({ ...input, manualFields: ["category"], fields: { ...initial, category: "AI教程" } }, { organize: true });
  assert.equal(manual.category, "AI教程");
});

test("ambiguous product plans use the general entry and explicit custom URLs stay intact", () => {
  const ambiguous = completeMetadata({ fields: { title: "ChatGPT Pro充值" }, content: "选购前先阅读商品说明。" });
  assert.equal(ambiguous.productUrl, "https://gpt3plus.com/");
  const custom = completeMetadata({ fields: { title: "ChatGPT Plus教程", productUrl: "https://example.com/custom" }, content: "正文" });
  assert.equal(custom.productUrl, "https://example.com/custom");
  const neutral = completeMetadata({ content: "Claude Pro 升级前注意事项\n\n先核对订阅状态。" });
  assert.equal(neutral.productUrl, "https://gpt3plus.com/");
});
