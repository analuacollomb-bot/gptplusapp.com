import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import matter from "gray-matter";
import { productCategories } from "../content/products";
import { completeMetadata, relatedCandidates, type MetadataSuggestion, type RelatedPost } from "./metadata";

export class AdminError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export type Fields = {
  title: string;
  description: string;
  category: string;
  slug: string;
  date: string;
  keywords: string[];
  productId: string;
  productUrl: string;
  sourceUrl: string;
};

type Draft = {
  id: string;
  sourceRevision: string | null;
  fields: Fields;
  content: string;
  metadata: Record<string, unknown>;
  savedAt: string;
  manualFields?: string[];
};

export type Article = {
  id: string;
  revision: string;
  sourceRevision: string | null;
  hasDraft: boolean;
  published: boolean;
  fields: Fields;
  content: string;
  fileName: string | null;
  savedAt: string | null;
  previewUrl: string | null;
  manualFields: string[];
};

type SaveInput = {
  id?: string | null;
  revision?: string | null;
  fields?: unknown;
  content?: unknown;
  manualFields?: unknown;
};

const digest = (text: string) => createHash("sha256").update(text).digest("hex");
export const today = () => new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());

function stringValue(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value == null ? "" : String(value);
}

function fieldsFrom(data: Record<string, unknown>): Fields {
  return {
    title: stringValue(data.title), description: stringValue(data.description),
    category: stringValue(data.category), slug: stringValue(data.slug), date: stringValue(data.date),
    keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : stringValue(data.keywords).split(/[,，]/).map(s => s.trim()).filter(Boolean),
    productId: stringValue(data.productId), productUrl: stringValue(data.productUrl), sourceUrl: stringValue(data.sourceUrl),
  };
}

function validatedFields(value: unknown, publish: boolean): Fields {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new AdminError(400, "文章字段格式不正确。");
  const fields = fieldsFrom(value as Record<string, unknown>);
  for (const key of Object.keys(fields) as (keyof Fields)[]) {
    if (key !== "keywords") fields[key] = (fields[key] as string).trim();
  }
  if (!fields.category) fields.category = "ChatGPT";
  if (!(productCategories as string[]).includes(fields.category)) throw new AdminError(400, "请选择现有文章分类。");
  if (fields.title.length > 300 || fields.description.length > 2000 || fields.slug.length > 180 || fields.keywords.join(",").length > 3000) {
    throw new AdminError(400, "标题、摘要、网址标识或关键词过长。");
  }
  if (publish) {
    if (!fields.title || !fields.description || !fields.slug || !fields.date) throw new AdminError(400, "发布前请填写标题、摘要、网址标识和日期。");
    const parsedDate = new Date(`${fields.date}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.date) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== fields.date) {
      throw new AdminError(400, "请输入有效日期，例如 2026-10-21。");
    }
  }
  fields.productId ||= "general-ai-membership";
  fields.productUrl ||= "https://gpt3plus.com/";
  for (const url of [fields.productUrl, fields.sourceUrl].filter(Boolean)) {
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error();
    } catch { throw new AdminError(400, "商品链接和来源链接须为有效的 http 或 https 地址。"); }
  }
  return fields;
}

async function optionalRead(file: string): Promise<string | null> {
  try {
    const info = await fs.lstat(file);
    if (!info.isFile() || info.isSymbolicLink()) throw new AdminError(400, "不支持符号链接或非文章文件。");
    return await fs.readFile(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function atomicWrite(file: string, content: string, mode = 0o600) {
  await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, content, { flag: "wx", mode });
    await fs.rename(temporary, file);
  } finally { await fs.rm(temporary, { force: true }); }
}

async function atomicCreate(file: string, content: string) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, content, { flag: "wx", mode: 0o644 });
    // Link the complete file atomically; unlike rename this refuses to replace
    // an article created by another process while we were preparing the text.
    await fs.link(temporary, file);
  } finally { await fs.rm(temporary, { force: true }); }
}

export class ArticleStore {
  private postsDirectory: string;
  private draftsDirectory: string;
  private backupsDirectory: string;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private root: string, private previewOrigin = "http://127.0.0.1:3000") {
    this.postsDirectory = path.join(root, "content/posts");
    this.draftsDirectory = path.join(root, ".local-admin/drafts");
    this.backupsDirectory = path.join(root, ".local-admin/backups");
  }

  private validId(id: unknown): asserts id is string {
    if (typeof id !== "string" || !id || id.length > 250 || id.startsWith(".") || /[\\/\x00-\x1f]/.test(id) || path.basename(id) !== id ||
      (!/\.mdx?$/.test(id) && !/^new-[a-f0-9-]{36}$/.test(id))) throw new AdminError(400, "文章标识无效。");
  }

  private draftPath(id: string) { return path.join(this.draftsDirectory, `${digest(id)}.json`); }

  private async state(id: string) {
    this.validId(id);
    const source = /\.mdx?$/.test(id) ? await optionalRead(path.join(this.postsDirectory, id)) : null;
    const draftRaw = await optionalRead(this.draftPath(id));
    const draft: Draft | null = draftRaw ? JSON.parse(draftRaw) : null;
    if (draft && draft.id !== id) throw new AdminError(500, "草稿记录不一致，请先保留备份。");
    const parsed = source === null ? null : matter(source);
    const sourceRevision = source === null ? null : digest(source);
    return { source, draft, parsed, sourceRevision, revision: digest(JSON.stringify([source, draftRaw])) };
  }

  async get(id: string): Promise<Article> {
    const state = await this.state(id);
    if (!state.parsed && !state.draft) throw new AdminError(404, "文章不存在，可能已被移动。");
    const fields = state.draft?.fields ?? fieldsFrom(state.parsed!.data);
    return {
      id, revision: state.revision, sourceRevision: state.sourceRevision,
      hasDraft: !!state.draft, published: !!state.parsed, fields,
      content: state.draft?.content ?? state.parsed!.content,
      fileName: state.parsed ? id : null, savedAt: state.draft?.savedAt ?? null,
      manualFields: state.draft?.manualFields ?? (state.draft ? [
        ...(fields.description ? ["description"] : []),
        ...(fields.keywords.length ? ["keywords"] : []),
        ...(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fields.slug) ? ["slug"] : []),
        ...(fields.category && fields.category !== "AI教程" ? ["category"] : []),
        ...(fields.productId && fields.productId !== "general-ai-membership" ? ["productId", "productUrl"] : []),
        ...(fields.sourceUrl ? ["sourceUrl"] : []),
      ] : []),
      previewUrl: state.parsed ? `${this.previewOrigin}/blog/${encodeURIComponent(stringValue(state.parsed.data.slug))}` : null,
    };
  }

  async list(params: URLSearchParams) {
    const postFiles = (await fs.readdir(this.postsDirectory)).filter(file => /\.mdx?$/.test(file));
    let draftFiles: string[] = [];
    try { draftFiles = (await fs.readdir(this.draftsDirectory)).filter(file => file.endsWith(".json")); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    const drafts = new Map<string, Draft>();
    for (const file of draftFiles) {
      const raw = await optionalRead(path.join(this.draftsDirectory, file));
      if (raw) { const draft: Draft = JSON.parse(raw); this.validId(draft.id); drafts.set(draft.id, draft); }
    }
    const items = [];
    for (const id of postFiles) {
      const raw = await optionalRead(path.join(this.postsDirectory, id));
      if (raw === null) continue;
      const data = matter(raw).data;
      const draft = drafts.get(id);
      const fields = draft?.fields ?? fieldsFrom(data);
      items.push({ id, title: fields.title || "未命名草稿", description: fields.description, category: fields.category, slug: fields.slug, date: fields.date, published: true, hasDraft: !!draft, updatedAt: draft?.savedAt ?? stringValue(data.updatedAt ?? data.date) });
      drafts.delete(id);
    }
    for (const draft of drafts.values()) {
      items.push({ id: draft.id, title: draft.fields.title || "未命名草稿", description: draft.fields.description, category: draft.fields.category, slug: draft.fields.slug, date: draft.fields.date, published: false, hasDraft: true, updatedAt: draft.savedAt });
    }
    const counts = { published: items.filter(item => item.published).length, drafts: items.filter(item => item.hasDraft).length };
    const query = (params.get("q") ?? "").trim().toLowerCase();
    const category = params.get("category");
    const status = params.get("status");
    const filtered = items.filter(item => (!query || `${item.title} ${item.description} ${item.slug}`.toLowerCase().includes(query)) &&
      (!category || item.category === category) && (status !== "draft" || item.hasDraft) && (status !== "published" || item.published))
      .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
    const pageSize = Math.max(1, Math.min(100, Number(params.get("pageSize")) || 20));
    const page = Math.max(1, Math.min(Math.ceil(filtered.length / pageSize) || 1, Math.floor(Number(params.get("page")) || 1)));
    return { items: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, page, pageSize, counts };
  }

  async catalog(): Promise<RelatedPost[]> {
    const result: RelatedPost[] = [];
    for (const file of (await fs.readdir(this.postsDirectory)).filter(file => /\.mdx?$/.test(file))) {
      const raw = await optionalRead(path.join(this.postsDirectory, file));
      if (!raw) continue;
      const { data } = matter(raw);
      result.push({ slug: stringValue(data.slug), title: stringValue(data.title), category: stringValue(data.category) });
    }
    return result;
  }

  async organize(input: SaveInput, suggestion?: MetadataSuggestion) {
    if (typeof input.content !== "string" || !input.content.trim()) throw new AdminError(400, "先写入或粘贴正文，再整理文章。");
    if (input.content.length > 1024 * 1024) throw new AdminError(400, "正文过长，请限制在 1 MB 内。");
    const state = input.id ? await this.state(input.id) : null;
    if (input.id && !state?.parsed && !state?.draft) throw new AdminError(404, "文章不存在，请重新打开。");
    const existing = state?.parsed ? fieldsFrom(state.parsed.data) : undefined;
    const fields = completeMetadata({ ...input, content: input.content }, { existing, suggestion, organize: true });
    const catalog = await this.catalog();
    if (!existing) {
      const used = new Set(catalog.map(post => post.slug));
      const base = fields.slug;
      let counter = 2;
      while (used.has(fields.slug)) fields.slug = `${base}-${counter++}`;
    }
    const candidates = relatedCandidates(fields.title, input.content, fields.category, catalog, existing?.slug);
    const related = suggestion?.relatedSlugs === undefined ? candidates : candidates.filter(post => suggestion.relatedSlugs!.includes(post.slug));
    return { fields, relatedPosts: related.slice(0, 3) };
  }

  private mutate<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation);
    this.queue = result.catch(() => undefined);
    return result;
  }

  save(input: SaveInput, publish: boolean): Promise<Article> {
    return this.mutate(async () => {
      const id = input.id ?? `new-${randomUUID()}`;
      this.validId(id);
      const state = await this.state(id);
      if (input.id && !state.source && !state.draft) throw new AdminError(404, "文章已不存在，请刷新列表。");
      if (input.id && input.revision !== state.revision) throw new AdminError(409, "文章已在其他窗口或编辑器中更新。请保留当前文案，重新打开文章后合并修改。");
      if (typeof input.content !== "string" || input.content.length > 1024 * 1024) throw new AdminError(400, "正文须为文字，且不能超过 1 MB。");
      if (publish && !input.content.trim()) throw new AdminError(400, "发布前请填写文章正文。");
      const prepared = publish ? completeMetadata({ ...input, content: input.content }, { existing: state.parsed ? fieldsFrom(state.parsed.data) : undefined }) : input.fields;
      const fields = validatedFields(prepared, publish);
      const metadata = state.draft?.metadata ?? state.parsed?.data ?? {};
      if (!publish) {
        const draft: Draft = { id, fields, content: input.content, metadata,
          sourceRevision: state.draft ? state.draft.sourceRevision : state.sourceRevision, savedAt: new Date().toISOString(),
          manualFields: Array.isArray(input.manualFields) ? input.manualFields.filter((field): field is string => typeof field === "string" && field in fields) : state.draft?.manualFields ?? [],
        };
        await atomicWrite(this.draftPath(id), `${JSON.stringify(draft, null, 2)}\n`);
        return this.get(id);
      }
      if (state.draft && state.draft.sourceRevision !== state.sourceRevision) throw new AdminError(409, "草稿创建后，原文章已被外部修改。请先复制草稿文案，再丢弃旧草稿并重新编辑，避免覆盖新内容。");
      if (state.parsed) {
        if (fields.slug !== stringValue(state.parsed.data.slug)) throw new AdminError(400, "已有文章的网址标识不可更改，以保留原网址。");
      } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fields.slug)) {
        throw new AdminError(400, "新文章网址标识请使用小写英文字母、数字和短横线，例如 chatgpt-guide。");
      }
      // Check all source files, rather than the paginated list, to protect existing URLs.
      for (const file of (await fs.readdir(this.postsDirectory)).filter(file => /\.mdx?$/.test(file) && file !== id)) {
        const raw = await optionalRead(path.join(this.postsDirectory, file));
        if (raw && stringValue(matter(raw).data.slug) === fields.slug) throw new AdminError(409, "这个网址标识已被其他文章使用，请换一个。");
      }
      const fileName = state.source !== null ? id : `${fields.slug}.md`;
      const destination = path.join(this.postsDirectory, fileName);
      if (state.source === null && await optionalRead(destination) !== null) throw new AdminError(409, "同名文章文件已存在，请换一个网址标识。");
      const nextMetadata: Record<string, unknown> = { ...metadata, ...fields, updatedAt: today() };
      if (!fields.sourceUrl) delete nextMetadata.sourceUrl;
      // Pass an object so pasted leading `---` stays in the body, rather than
      // being parsed a second time as frontmatter by gray-matter.stringify.
      const markdown = matter.stringify({ content: input.content }, nextMetadata);
      if (state.source !== null) {
        const backupName = `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}-${fileName}`;
        await atomicWrite(path.join(this.backupsDirectory, backupName), state.source);
        const current = await optionalRead(destination);
        if (current !== state.source) throw new AdminError(409, "原文章刚刚发生变化，已取消覆盖。请重新打开后合并修改。");
        const mode = (await fs.stat(destination)).mode & 0o777;
        await atomicWrite(destination, markdown, mode);
      } else {
        // Exclusive creation also protects against a second process creating this file.
        try { await atomicCreate(destination, markdown); }
        catch (error) {
          if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new AdminError(409, "同名文章文件已存在，发布已取消。");
          throw error;
        }
      }
      await fs.rm(this.draftPath(id), { force: true });
      return this.get(fileName);
    });
  }

  discard(input: { id: string; revision?: string }) {
    return this.mutate(async () => {
      const state = await this.state(input.id);
      if (input.revision !== state.revision) throw new AdminError(409, "草稿已更新，请重新打开后再操作。");
      if (!state.draft) throw new AdminError(404, "没有可丢弃的草稿。");
      // Keep a recovery copy even when a draft is deliberately discarded.
      await atomicWrite(path.join(this.backupsDirectory, `discarded-${Date.now()}-${randomUUID()}.json`), `${JSON.stringify(state.draft, null, 2)}\n`);
      await fs.rm(this.draftPath(input.id));
      return { article: state.source !== null ? await this.get(input.id) : null };
    });
  }
}
