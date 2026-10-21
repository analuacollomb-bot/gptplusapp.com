'use strict';

(() => {
  const $ = (id) => document.getElementById(id);
  const fields = ['title', 'description', 'category', 'slug', 'date', 'keywords', 'productId', 'productUrl', 'sourceUrl'];
  const state = { config: null, article: null, baseline: '', dirty: false, busy: false, view: 'list', mode: 'edit', page: 1, total: 0, pageSize: 20, listSequence: 0, previewSequence: 0, manualFields: new Set(), generatedFields: new Set(), organizedFingerprint: '', relatedPosts: [], organizeEngine: '', organizeMessage: '' };
  const recoveryKey = 'gptplusapp-local-admin-editor-v2';
  let searchTimer;
  let previewTimer;

  class ApiError extends Error {
    constructor(message, status) { super(message); this.status = status; }
  }

  async function api(path, options = {}, retryToken = true) {
    const headers = { Accept: 'application/json' };
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      headers['X-Admin-Token'] = state.config?.token || '';
    }
    let response;
    try {
      response = await fetch(path, { ...options, headers, credentials: 'same-origin', cache: 'no-store', body: options.body === undefined ? undefined : JSON.stringify(options.body) });
    } catch {
      throw new ApiError('无法连接本地后台。请确认后台终端仍在运行，再重试；当前输入会保留。', 0);
    }
    let result;
    try { result = await response.json(); } catch { throw new ApiError('后台响应异常，请稍后重试。当前输入会保留。', response.status); }
    if (response.status === 403 && options.body !== undefined && retryToken && path.startsWith('/api/')) {
      state.config = await api('/api/config', {}, false);
      return api(path, options, false);
    }
    if (!response.ok) throw new ApiError(result.error || '操作未完成，请稍后重试。', response.status);
    return result;
  }

  function toast(message, error = false) {
    const el = document.createElement('div');
    el.className = error ? 'toast error' : 'toast';
    el.textContent = message;
    $('toast-region').replaceChildren(el);
    window.setTimeout(() => el.remove(), error ? 7000 : 4500);
  }

  function showEditorError(error) {
    $('editor-error').textContent = error.status === 409
      ? `${error.message} 你的输入仍保留在编辑器中。请先复制正文备份，再返回文章库刷新并重新打开文章，核对后保存。`
      : error.message;
    $('editor-error').hidden = false;
    $('editor-error').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    toast(error.status === 409 ? '文件已有新修改：已保留你的输入，请核对后再保存。' : error.message, true);
  }

  function updateCounts(counts) {
    if (!counts) return;
    $('published-count').textContent = Number(counts.published || 0).toLocaleString('zh-CN');
    $('draft-count').textContent = Number(counts.drafts || 0).toLocaleString('zh-CN');
    $('sidebar-count').textContent = Number(counts.published || 0).toLocaleString('zh-CN');
  }

  function textElement(tag, text, className) {
    const el = document.createElement(tag);
    el.textContent = text;
    if (className) el.className = className;
    return el;
  }

  function renderRows(items) {
    const body = $('article-rows');
    body.replaceChildren();
    if (!items.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 5;
      cell.className = 'empty-state';
      cell.append(textElement('strong', '还没有找到文章'), document.createTextNode('换个关键词，或写下你的第一篇新内容。'));
      row.append(cell);
      body.append(row);
      return;
    }
    for (const item of items) {
      const row = document.createElement('tr');
      row.dataset.id = item.id;
      const titleCell = document.createElement('td');
      const openButton = document.createElement('button');
      openButton.type = 'button';
      openButton.className = 'article-title-button';
      openButton.title = item.title || '未命名草稿';
      openButton.append(textElement('strong', item.title || '未命名草稿'), textElement('small', item.description || '还没有填写摘要，继续打磨这个想法。'));
      openButton.addEventListener('click', () => openArticle(item.id));
      titleCell.append(openButton);
      const categoryCell = document.createElement('td');
      categoryCell.append(textElement('span', item.category || '未分类', 'category-label'));
      const statusCell = document.createElement('td');
      const badges = document.createElement('div');
      badges.className = 'status-badges';
      if (item.published) badges.append(textElement('span', '已发布', 'badge badge-published'));
      if (item.hasDraft || !item.published) badges.append(textElement('span', '草稿', 'badge'));
      statusCell.append(badges);
      const dateCell = textElement('td', item.date || '未设置', 'article-date');
      const actionCell = document.createElement('td');
      const editButton = textElement('button', '编辑', 'row-edit');
      editButton.type = 'button';
      editButton.setAttribute('aria-label', `编辑 ${item.title || '未命名草稿'}`);
      editButton.addEventListener('click', () => openArticle(item.id));
      actionCell.append(editButton);
      row.append(titleCell, categoryCell, statusCell, dateCell, actionCell);
      body.append(row);
    }
  }

  async function loadArticles() {
    const sequence = ++state.listSequence;
    $('article-list').setAttribute('aria-busy', 'true');
    $('article-list').classList.add('is-loading');
    const params = new URLSearchParams({ q: $('search').value.trim(), category: $('category-filter').value, status: $('status-filter').value, page: String(state.page), pageSize: String(state.pageSize) });
    try {
      const result = await api(`/api/articles?${params}`);
      if (sequence !== state.listSequence) return;
      if (result.total > 0 && !result.items.length && state.page > 1) { state.page = 1; return await loadArticles(); }
      state.total = result.total;
      state.page = result.page;
      state.pageSize = result.pageSize;
      renderRows(result.items);
      updateCounts(result.counts);
      $('result-count').textContent = Number(result.total).toLocaleString('zh-CN');
      const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
      $('page-number').textContent = `${result.page} / ${pages}`;
      $('pagination-info').textContent = result.total ? `共 ${Number(result.total).toLocaleString('zh-CN')} 篇 · 第 ${(result.page - 1) * result.pageSize + 1}–${Math.min(result.page * result.pageSize, result.total)} 篇` : '共 0 篇文章';
      $('previous-page').disabled = result.page <= 1;
      $('next-page').disabled = result.page >= pages;
      $('connection-error').hidden = true;
    } catch (error) {
      if (sequence !== state.listSequence) return;
      $('connection-error').textContent = error.message;
      $('connection-error').hidden = false;
      $('pagination-info').textContent = '加载失败，点击“刷新”重试';
    } finally {
      if (sequence === state.listSequence) {
        $('article-list').setAttribute('aria-busy', 'false');
        $('article-list').classList.remove('is-loading');
      }
    }
  }

  function currentPayload() {
    const data = {};
    for (const name of fields) data[name] = $(name).value;
    data.keywords = data.keywords.split(/[,，\n]/).map((item) => item.trim()).filter(Boolean);
    return { fields: data, content: $('content').value };
  }

  function writingFingerprint() {
    return JSON.stringify({ title: $('title').value, content: $('content').value });
  }

  function hasPublishFields() {
    return ['title', 'description', 'category', 'slug', 'date'].every((name) => $(name).value.trim());
  }

  function setEditorLocation(id) {
    const url = new URL(window.location.href);
    url.hash = id ? `edit=${encodeURIComponent(id)}` : '';
    window.history.replaceState(null, '', url);
  }

  function clearRecovery() {
    try { window.sessionStorage.removeItem(recoveryKey); } catch { /* Saving to disk still works without browser storage. */ }
  }

  function persistRecovery() {
    if (state.view !== 'editor') return;
    try {
      window.sessionStorage.setItem(recoveryKey, JSON.stringify({
        payload: currentPayload(), article: state.article, baseline: state.baseline,
        manualFields: Array.from(state.manualFields), generatedFields: Array.from(state.generatedFields),
        organizedFingerprint: state.organizedFingerprint, relatedPosts: state.relatedPosts,
        organizeEngine: state.organizeEngine, organizeMessage: state.organizeMessage,
        advancedOpen: $('advanced-settings').open, savedAt: new Date().toISOString(),
      }));
    } catch {
      if (!state.storageWarning) {
        state.storageWarning = true;
        toast('浏览器暂时无法保留刷新前的输入，请点击“保存草稿”保存到本机。', true);
      }
    }
  }

  function restoreRecovery() {
    let saved;
    try { saved = JSON.parse(window.sessionStorage.getItem(recoveryKey) || 'null'); } catch { return false; }
    if (!saved?.payload?.fields || typeof saved.payload.content !== 'string') return false;
    const restoredFields = {};
    for (const name of fields) {
      const value = saved.payload.fields[name];
      restoredFields[name] = name === 'keywords' ? (Array.isArray(value) ? value.filter((item) => typeof item === 'string') : []) : typeof value === 'string' ? value : '';
    }
    fillArticle({ ...saved.article, fields: restoredFields, content: saved.payload.content });
    state.manualFields = new Set((Array.isArray(saved.manualFields) ? saved.manualFields : []).filter((name) => fields.includes(name)));
    state.generatedFields = new Set((Array.isArray(saved.generatedFields) ? saved.generatedFields : []).filter((name) => fields.includes(name)));
    state.organizedFingerprint = typeof saved.organizedFingerprint === 'string' ? saved.organizedFingerprint : '';
    state.relatedPosts = validRelatedPosts(saved.relatedPosts);
    state.organizeEngine = saved.organizeEngine === 'codex' ? 'codex' : saved.organizeEngine === 'local' ? 'local' : '';
    state.organizeMessage = typeof saved.organizeMessage === 'string' ? saved.organizeMessage : '';
    if (typeof saved.baseline === 'string') state.baseline = saved.baseline;
    $('advanced-settings').open = Boolean(saved.advancedOpen);
    switchView('editor');
    setEditorLocation(state.article?.id || 'new');
    updateDirty();
    $('editor-notice').textContent = '已恢复刷新前尚未保存的文案。你可以继续编辑，再保存草稿或发布到本地。';
    $('editor-notice').hidden = false;
    return true;
  }

  function validRelatedPosts(items) {
    return (Array.isArray(items) ? items : []).filter((item) => item && typeof item.title === 'string' && typeof item.slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)).slice(0, 5);
  }

  function renderOrganizedSummary() {
    const visible = Boolean(state.organizeEngine || state.article?.id || $('category').value || $('slug').value);
    $('organized-summary').hidden = !visible;
    if (!visible) return;
    $('summary-category').textContent = $('category').value || '发布时自动识别';
    $('summary-slug').textContent = $('slug').value ? `/blog/${$('slug').value}` : '发布时自动生成';
    const product = state.config?.products.find((item) => item.id === $('productId').value);
    $('summary-product').textContent = product?.title || ($('productId').value === 'general-ai-membership' ? 'AI 会员自助服务' : $('productId').value ? $('productId').selectedOptions[0]?.textContent || $('productId').value : '发布时自动匹配');
    $('organize-engine').textContent = state.organizeEngine === 'codex' ? 'Codex 整理' : state.organizeEngine === 'local' ? '本地自动配置' : '当前设置';
    const changed = state.organizedFingerprint && state.organizedFingerprint !== writingFingerprint();
    $('organize-message').textContent = changed ? '文案已更新，发布时会补齐所需设置。也可以再次让 Codex 整理。' : state.organizeMessage || '技术设置可以自动补齐，也可以在高级设置中调整。';
    $('related-suggestions').hidden = !state.relatedPosts.length;
    const list = $('related-posts');
    list.replaceChildren();
    for (const post of state.relatedPosts) {
      const li = document.createElement('li');
      const link = textElement('a', post.title);
      link.href = new URL(`/blog/${encodeURIComponent(post.slug)}`, state.config.sitePreviewUrl).href;
      link.target = '_blank';
      link.rel = 'noreferrer';
      li.append(link);
      list.append(li);
    }
    const hasNew = state.relatedPosts.some((post) => !$('content').value.includes(`/blog/${post.slug}`));
    $('insert-related').disabled = state.busy || !hasNew;
    $('insert-related').textContent = hasNew ? '插入相关教程' : '相关教程已在正文中';
  }

  async function organizeArticle(mode = 'codex', duringSave = false) {
    if (!duringSave && (state.busy || state.view !== 'editor')) return;
    const payload = currentPayload();
    try { validateContent(payload); } catch (error) { if (duringSave) throw error; showEditorError(error); return; }
    const changed = state.organizedFingerprint && state.organizedFingerprint !== writingFingerprint();
    if (changed) {
      for (const name of state.generatedFields) {
        if (!state.manualFields.has(name) && name !== 'title' && name !== 'date' && !(name === 'slug' && state.article?.published)) payload.fields[name] = name === 'keywords' ? [] : '';
      }
    }
    $('editor-error').hidden = true;
    state.organizing = true;
    if (!duringSave) setBusy(true);
    updateEditorStatus();
    try {
      const result = await api('/api/organize', { method: 'POST', body: { id: state.article?.id || null, ...payload, mode, manualFields: Array.from(state.manualFields) } });
      const resultFields = result.fields || {};
      for (const name of fields) {
        const current = $(name).value;
        const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(current);
        if (name === 'title' && current.trim()) continue;
        if (name === 'slug' && state.article?.published) continue;
        if (state.manualFields.has(name) && !(name === 'slug' && !validSlug)) continue;
        if (current.trim() && !state.generatedFields.has(name)) {
          if (['description', 'date', 'sourceUrl', 'keywords'].includes(name)) continue;
          if (name === 'slug' && validSlug) continue;
          if (name === 'category' && current !== 'AI教程') continue;
          if (name === 'productId' && current !== 'general-ai-membership') continue;
          if (name === 'productUrl' && !/^https?:\/\/gpt3plus\.com\/?$/.test(current)) continue;
        }
        if (resultFields[name] === undefined || resultFields[name] === null) continue;
        const value = name === 'keywords' ? (Array.isArray(resultFields[name]) ? resultFields[name].join(', ') : String(resultFields[name])) : String(resultFields[name]);
        if (name === 'category' || name === 'productId') ensureSelectValue($(name), value);
        $(name).value = value;
        if (!state.manualFields.has(name)) state.generatedFields.add(name);
      }
      state.organizeEngine = result.engine === 'codex' ? 'codex' : 'local';
      state.organizeMessage = result.message || '文章设置已补齐。确认文案后即可保存或发布到本地。';
      state.relatedPosts = validRelatedPosts(result.relatedPosts);
      state.organizedFingerprint = writingFingerprint();
      updateDirty();
      persistRecovery();
      schedulePreview(0);
      if (!duringSave) toast(result.engine === 'codex' ? 'Codex 已整理好文章设置，正文保持原样。' : '已自动补齐文章设置，正文保持原样。');
      return result;
    } catch (error) {
      if (duringSave) throw error;
      showEditorError(error);
      persistRecovery();
    } finally {
      state.organizing = false;
      if (!duringSave) setBusy(false);
      updateEditorStatus();
      renderOrganizedSummary();
    }
  }

  function insertRelatedPosts() {
    if (state.busy) return;
    const missing = state.relatedPosts.filter((post) => !$('content').value.includes(`/blog/${post.slug}`));
    if (!missing.length) return;
    const links = missing.map((post) => `- [${post.title.replace(/[\[\]\r\n]/g, ' ')}](/blog/${post.slug})`).join('\n');
    $('content').value = `${$('content').value.trimEnd()}\n\n## 相关教程\n\n${links}\n`;
    updateDirty();
    schedulePreview(0);
    toast('相关教程已添加到正文末尾，你可以继续编辑。');
  }

  function updateDirty() {
    state.dirty = JSON.stringify(currentPayload()) !== state.baseline;
    updateEditorStatus();
    $('description-count').textContent = `${$('description').value.length} 字`;
    const count = $('content').value.replace(/\s/g, '').length;
    $('content-count').textContent = `${count.toLocaleString('zh-CN')} 字 · 约 ${Math.max(1, Math.ceil(count / 400))} 分钟`;
    if (state.view === 'editor') {
      if (state.dirty) persistRecovery();
      else clearRecovery();
    }
    renderOrganizedSummary();
  }

  function updateEditorStatus() {
    const article = state.article;
    let text = '新文章 · 尚未保存';
    if (article?.savedAt) {
      const saved = new Date(article.savedAt);
      const when = Number.isNaN(saved.getTime()) ? article.savedAt : saved.toLocaleString('zh-CN', { hour12: false });
      text = `${article.hasDraft ? '草稿已保存' : '本地文章已发布'} · ${when}`;
    } else if (article?.published) text = article.hasDraft ? '正在编辑已发布文章的草稿' : '正在编辑本地已发布文章';
    if (state.dirty) text = `有未保存的修改 · ${article?.hasDraft ? '上次草稿仍保留' : article?.published ? '原文章尚未改动' : '记得保存草稿'}`;
    if (state.busy) text = state.organizing ? '正在整理文章，当前文案已保留，请稍候…' : '正在处理，请稍候…';
    $('editor-status').textContent = text;
    document.title = `${state.dirty ? '● ' : ''}${state.view === 'editor' ? ($('title').value.trim() || '新文章') : '内容工作台'} · GPT Plus App`;
  }

  function canLeave() {
    if (state.busy) { toast('正在处理，请稍候。'); return false; }
    if (!state.dirty) return true;
    const leave = window.confirm('这篇文章还有未保存的修改。确定放弃这些修改并离开吗？');
    if (leave) clearRecovery();
    return leave;
  }

  function switchView(view) {
    state.view = view;
    $('list-view').hidden = view !== 'list';
    $('editor-view').hidden = view !== 'editor';
    $('nav-articles').classList.toggle('active', view === 'list');
    $('nav-new').classList.toggle('active', view === 'editor' && !state.article?.published);
    $('breadcrumb-current').textContent = view === 'list' ? '文章管理' : state.article?.published ? '编辑文章' : '写新文章';
    updateEditorStatus();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function ensureSelectValue(select, value, label) {
    if (value && !Array.from(select.options).some((option) => option.value === value)) select.add(new Option(label || value, value));
  }

  function fillArticle(article) {
    state.article = article;
    state.manualFields = new Set((Array.isArray(article?.manualFields) ? article.manualFields : []).filter((name) => fields.includes(name)));
    state.generatedFields = new Set();
    state.organizedFingerprint = '';
    state.relatedPosts = [];
    state.organizeEngine = '';
    state.organizeMessage = '';
    $('advanced-settings').open = false;
    const data = article?.fields || {};
    ensureSelectValue($('productId'), data.productId, `当前关联 · ${data.productId}`);
    ensureSelectValue($('category'), data.category);
    for (const name of fields) $(name).value = name === 'keywords' ? (Array.isArray(data[name]) ? data[name].join(', ') : data[name] || '') : data[name] || '';
    $('content').value = article?.content || '';
    $('slug').readOnly = Boolean(article?.published);
    $('slug-help').textContent = article?.published ? '已发布文章的链接标识已锁定，确保现有链接继续有效。' : '自动生成可用网址，发布后保持链接不变。';
    $('editor-title').textContent = article?.published ? '让这篇文章，更好一点。' : article?.id ? '继续打磨这个想法。' : '写一篇新文章';
    $('publish-article').innerHTML = article?.published ? '保存并更新本地文章 <span aria-hidden="true">↗</span>' : '保存并发布到本地 <span aria-hidden="true">↗</span>';
    $('editor-error').hidden = true;
    $('discard-draft').hidden = !article?.hasDraft;
    $('view-local-article').hidden = !article?.previewUrl;
    if (article?.previewUrl) {
      try {
        const preview = new URL(article.previewUrl, state.config.sitePreviewUrl);
        if (preview.origin === new URL(state.config.sitePreviewUrl).origin) $('view-local-article').href = preview.href;
        else $('view-local-article').hidden = true;
      } catch { $('view-local-article').hidden = true; }
    }
    const notice = article?.hasDraft
      ? article.published ? '你正在编辑已保存的草稿，原文章保持原样。保存草稿不会改动原文；点击“更新本地文章”才会写入项目。' : '这是独立保存的本地草稿，尚未出现在网站文章列表中。准备好后，再发布到本地。'
      : article?.published ? '本次编辑会先留在编辑器。你可以保存为草稿，确认后再更新本地文章。线上网站需后续部署。' : '';
    $('editor-notice').textContent = notice;
    $('editor-notice').hidden = !notice;
    if (article?.hasDraft && !article.published) {
      state.generatedFields = new Set(fields.filter((name) => !['title', 'date', 'sourceUrl'].includes(name) && !state.manualFields.has(name)));
      state.organizedFingerprint = writingFingerprint();
    }
    state.baseline = JSON.stringify(currentPayload());
    state.dirty = false;
    updateDirty();
    if (state.mode !== 'edit') schedulePreview(0);
  }

  async function openArticle(id) {
    if (!canLeave()) return;
    state.busy = true;
    try {
      const article = await api(`/api/article?${new URLSearchParams({ id })}`);
      clearRecovery();
      fillArticle(article);
      setEditorLocation(article.id);
      switchView('editor');
    } catch (error) { toast(error.message, true); }
    finally { state.busy = false; updateEditorStatus(); }
  }

  function newArticle() {
    if (!state.config || !canLeave()) return;
    state.previewSequence += 1;
    clearRecovery();
    fillArticle({ id: null, revision: null, sourceRevision: null, published: false, hasDraft: false, fields: { date: state.config.today }, content: '' });
    setEditorLocation('new');
    switchView('editor');
    $('title').focus();
  }

  function setBusy(busy) {
    state.busy = busy;
    for (const el of document.querySelectorAll('#article-form input, #article-form textarea, #article-form select, #article-form button, .editor-actions button')) el.disabled = busy;
    updateEditorStatus();
    renderOrganizedSummary();
  }

  function validateContent(payload) {
    if (!payload.content.trim()) { setMode('edit'); $('content').focus(); throw new ApiError('先写下或粘贴文章正文，其余设置可以自动整理。', 400); }
  }

  function validatePublish(payload) {
    validateContent(payload);
    for (const name of ['productUrl', 'sourceUrl']) {
      if (!payload.fields[name].trim()) continue;
      try {
        const url = new URL(payload.fields[name]);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      } catch { $('advanced-settings').open = true; $(name).focus(); throw new ApiError(`请填写有效的${name === 'productUrl' ? '商品' : '来源'}链接，以 https:// 或 http:// 开头。`, 400); }
    }
  }

  async function saveArticle(publish = false) {
    if (state.busy || state.view !== 'editor' || !state.config) return;
    try { if (publish) validateContent(currentPayload()); } catch (error) { showEditorError(error); return; }
    $('editor-error').hidden = true;
    setBusy(true);
    try {
      if (publish && (state.organizedFingerprint !== writingFingerprint() || !hasPublishFields())) await organizeArticle('local', true);
      const payload = currentPayload();
      if (publish) validatePublish(payload);
      const organizedSummary = { relatedPosts: state.relatedPosts, organizeEngine: state.organizeEngine, organizeMessage: state.organizeMessage };
      const article = await api(publish ? '/api/publish' : '/api/draft', { method: 'POST', body: { id: state.article?.id || null, revision: state.article?.revision || null, manualFields: Array.from(state.manualFields), ...payload } });
      clearRecovery();
      fillArticle(article);
      Object.assign(state, organizedSummary);
      if (state.organizeEngine) state.organizedFingerprint = writingFingerprint();
      renderOrganizedSummary();
      setEditorLocation(article.id);
      toast(publish ? '已发布到本地项目。线上网站需后续部署。' : '草稿已保存在本机。');
      loadArticles();
    } catch (error) { showEditorError(error); persistRecovery(); }
    finally { setBusy(false); }
  }

  async function discardDraft() {
    if (state.busy || !state.article?.hasDraft) return;
    const message = state.article.published ? '确定丢弃这份草稿吗？草稿和当前未保存的修改会移除，已发布的原文章会保留。' : '确定丢弃这份未发布草稿吗？草稿和当前未保存的修改会移除，无法撤销。';
    if (!window.confirm(message)) return;
    setBusy(true);
    try {
      const result = await api('/api/draft', { method: 'DELETE', body: { id: state.article.id, revision: state.article.revision } });
      clearRecovery();
      if (result.article) { fillArticle(result.article); setEditorLocation(result.article.id); }
      else { state.dirty = false; state.article = null; setEditorLocation(null); switchView('list'); }
      toast('草稿已丢弃。');
      loadArticles();
    } catch (error) { showEditorError(error); }
    finally { setBusy(false); }
  }

  function setMode(mode) {
    state.mode = mode;
    $('content-workspace').dataset.mode = mode;
    $('content').hidden = mode === 'preview';
    $('markdown-toolbar').hidden = mode === 'preview';
    $('preview-pane').hidden = mode === 'edit';
    for (const button of document.querySelectorAll('[data-mode]')) {
      if (button.tagName !== 'BUTTON') continue;
      const active = button.dataset.mode === mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    }
    if (mode !== 'edit') schedulePreview(0);
  }

  function schedulePreview(delay = 550) {
    window.clearTimeout(previewTimer);
    state.previewSequence += 1;
    if (state.mode === 'edit') return;
    const sequence = state.previewSequence;
    previewTimer = window.setTimeout(async () => {
      try {
        const result = await api('/api/preview', { method: 'POST', body: currentPayload() });
        if (sequence !== state.previewSequence) return;
        $('preview-content').innerHTML = result.html;
        for (const a of $('preview-content').querySelectorAll('a')) { a.target = '_blank'; a.rel = 'noreferrer'; }
      } catch (error) {
        if (sequence !== state.previewSequence) return;
        $('preview-content').replaceChildren(textElement('p', `预览暂不可用：${error.message}`, 'preview-placeholder'));
      }
    }, delay);
  }

  function formatMarkdown(kind) {
    if (state.busy) return;
    const el = $('content');
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = el.value.slice(start, end);
    const hasSelection = end > start;
    const formats = {
      bold: { before: '**', text: '加粗文字', after: '**' },
      italic: { before: '*', text: '斜体文字', after: '*' },
      link: { before: '[', text: '链接文字', after: '](https://example.com)' },
      code: { before: '`', text: '代码', after: '`' },
      heading: { before: (start && el.value[start - 1] !== '\n' ? '\n\n' : '') + '## ', text: '小标题', after: '\n' },
      list: { before: start && el.value[start - 1] !== '\n' ? '\n' : '', text: '列表项目', after: '\n' },
      quote: { before: start && el.value[start - 1] !== '\n' ? '\n' : '', text: '引用文字', after: '\n' },
      table: { before: start && el.value[start - 1] !== '\n' ? '\n\n' : '', text: '| 项目 | 说明 |\n| --- | --- |\n| 内容 | 详细说明 |', after: '\n\n' },
    };
    const format = formats[kind];
    if (!format) return;
    let text = selected || format.text;
    if (kind === 'list' || kind === 'quote') text = text.split('\n').map((line) => `${kind === 'list' ? '- ' : '> '}${line}`).join('\n');
    const replacement = format.before + text + format.after;
    el.setRangeText(replacement, start, end, 'select');
    el.focus();
    if (!hasSelection && kind !== 'table') el.setSelectionRange(start + format.before.length, start + format.before.length + text.length);
    updateDirty();
    schedulePreview();
  }

  function bindEvents() {
    $('new-article').addEventListener('click', newArticle);
    $('nav-new').addEventListener('click', newArticle);
    for (const id of ['back-to-list', 'nav-articles']) $(id).addEventListener('click', () => {
      if (state.view === 'list') return;
      if (!canLeave()) return;
      state.dirty = false;
      state.previewSequence += 1;
      setEditorLocation(null);
      switchView('list');
      loadArticles();
    });
    $('refresh-list').addEventListener('click', () => state.config ? loadArticles() : initialize());
    $('search').addEventListener('input', () => { window.clearTimeout(searchTimer); searchTimer = window.setTimeout(() => { state.page = 1; loadArticles(); }, 300); });
    for (const id of ['category-filter', 'status-filter']) $(id).addEventListener('change', () => { state.page = 1; loadArticles(); });
    $('previous-page').addEventListener('click', () => { if (state.page > 1) { state.page -= 1; loadArticles(); } });
    $('next-page').addEventListener('click', () => { if (state.page * state.pageSize < state.total) { state.page += 1; loadArticles(); } });
    $('article-form').addEventListener('submit', (event) => event.preventDefault());
    const onEdit = (event) => {
      if (fields.includes(event.target.id) && event.target.id !== 'title') {
        if (event.target.value.trim()) state.manualFields.add(event.target.id);
        else state.manualFields.delete(event.target.id);
      }
      updateDirty();
      schedulePreview();
    };
    $('article-form').addEventListener('input', onEdit);
    $('article-form').addEventListener('change', onEdit);
    $('productId').addEventListener('change', () => {
      const product = state.config.products.find((item) => item.id === $('productId').value);
      if (product?.orderUrl) $('productUrl').value = product.orderUrl;
      else if ($('productId').value === 'general-ai-membership') $('productUrl').value = 'https://gpt3plus.com/';
      else if (!$('productId').value) $('productUrl').value = '';
      if ($('productId').value) state.manualFields.add('productUrl');
      else { state.manualFields.delete('productId'); state.manualFields.delete('productUrl'); }
      updateDirty();
    });
    $('organize-article').addEventListener('click', () => organizeArticle('codex'));
    $('organize-local').addEventListener('click', () => organizeArticle('local'));
    $('insert-related').addEventListener('click', insertRelatedPosts);
    $('save-draft').addEventListener('click', () => saveArticle(false));
    $('publish-article').addEventListener('click', () => saveArticle(true));
    $('discard-draft').addEventListener('click', discardDraft);
    for (const button of document.querySelectorAll('button[data-mode]')) button.addEventListener('click', () => setMode(button.dataset.mode));
    for (const button of document.querySelectorAll('[data-format]')) button.addEventListener('click', () => formatMarkdown(button.dataset.format));
    $('content').addEventListener('keydown', (event) => {
      if (state.busy) return;
      if (event.key === 'Tab') { event.preventDefault(); $('content').setRangeText('  ', $('content').selectionStart, $('content').selectionEnd, 'end'); updateDirty(); schedulePreview(); }
      if ((event.metaKey || event.ctrlKey) && ['b', 'i'].includes(event.key.toLowerCase())) { event.preventDefault(); formatMarkdown(event.key.toLowerCase() === 'b' ? 'bold' : 'italic'); }
    });
    document.addEventListener('keydown', (event) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's' && state.view === 'editor') { event.preventDefault(); saveArticle(false); } });
    window.addEventListener('beforeunload', (event) => { if (state.dirty || state.busy) { persistRecovery(); event.preventDefault(); event.returnValue = ''; } });
  }

  async function initialize() {
    $('new-article').disabled = true;
    $('nav-new').disabled = true;
    try {
      state.config = await api('/api/config');
      $('category-filter').replaceChildren(new Option('全部分类', ''));
      $('category').replaceChildren(new Option('自动识别分类', ''));
      for (const category of state.config.categories) { $('category-filter').add(new Option(category, category)); $('category').add(new Option(category, category)); }
      $('productId').replaceChildren(new Option('自动匹配商品', ''), new Option('AI 会员自助服务', 'general-ai-membership'));
      for (const product of state.config.products) {
        if (product.id === 'general-ai-membership') continue;
        $('productId').add(new Option(product.title, product.id));
      }
      $('site-preview-link').href = state.config.sitePreviewUrl;
      updateCounts(state.config.counts);
      $('new-article').disabled = false;
      $('nav-new').disabled = false;
      $('connection-error').hidden = true;
      await loadArticles();
      if (state.view !== 'editor' && !restoreRecovery()) {
        const match = window.location.hash.match(/^#edit=(.+)$/);
        if (match) {
          let id;
          try { id = decodeURIComponent(match[1]); } catch { id = ''; }
          if (id === 'new') newArticle();
          else if (id) await openArticle(id);
        }
      }
    } catch (error) {
      $('connection-error').textContent = `后台初始化失败：${error.message} 点击文章库右上角“刷新”重试。`;
      $('connection-error').hidden = false;
      $('pagination-info').textContent = '尚未连接本地后台';
      $('article-rows').replaceChildren();
      renderRows([]);
      $('article-list').setAttribute('aria-busy', 'false');
    }
  }

  bindEvents();
  initialize();
})();
