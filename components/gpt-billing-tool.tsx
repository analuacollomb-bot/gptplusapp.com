"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  ExternalLink,
  Eye,
  EyeOff,
  FileJson2,
  Fingerprint,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  WifiOff,
  Zap,
} from "lucide-react";
import {
  billingInputLimit,
  detectBillingInput,
  parseLocalBilling,
  type BillingAccount,
  type BillingInputKind,
  type BillingResult,
} from "@/lib/gpt-billing";
import styles from "./gpt-billing.module.css";

type Mode = "quick" | "deep" | "local";
const modes = [
  { id: "quick" as const, title: "快速查询", icon: Zap, description: "获取账号套餐与订阅状态。" },
  { id: "deep" as const, title: "深度查询", icon: Search, description: "进一步尝试读取本期结束时间、续费等账单信息。" },
  { id: "local" as const, title: "本地解析", icon: WifiOff, description: "在当前浏览器解析已有账单 JSON，不发起查询请求。" },
];

const kindLabels: Record<BillingInputKind, string> = {
  empty: "等待输入",
  token: "已识别 Access Token",
  session: "已识别 Session JSON",
  "account-id": "已识别 AccountID",
  "billing-data": "已识别账单 JSON",
  unknown: "尚未识别格式",
};

const sampleInput = JSON.stringify({
  account: { account_id: "00000000-0000-0000-0000-000000000000", name: "合成示例账号" },
  entitlement: { subscription_plan: "chatgptplusplan", has_active_subscription: true },
  subscription: {
    active_start: "2026-10-01T08:00:00Z",
    active_until: "2026-11-01T08:00:00Z",
    will_renew: false,
    billing_period: "monthly",
    purchase_origin_platform: "web",
    status: "active",
    is_delinquent: false,
  },
}, null, 2);

function dateLabel(value: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return "未返回";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(value));
}

function planLabel(value: string | null) {
  if (!value) return "套餐未返回";
  const aliases: Record<string, string> = {
    free: "ChatGPT Free", chatgptfreeplan: "ChatGPT Free",
    plus: "ChatGPT Plus", chatgptplusplan: "ChatGPT Plus",
    pro: "ChatGPT Pro", chatgptproplan: "ChatGPT Pro",
    business: "ChatGPT Business", chatgptteamplan: "ChatGPT Business",
    team: "ChatGPT Business", enterprise: "ChatGPT Enterprise",
    edu: "ChatGPT Edu", go: "ChatGPT Go", chatgptgoplan: "ChatGPT Go",
  };
  return aliases[value.toLowerCase()] ?? value;
}

function periodLabel(value: string | null) {
  const aliases: Record<string, string> = { month: "月付", monthly: "月付", year: "年付", yearly: "年付", annual: "年付" };
  return value ? aliases[value.toLowerCase()] ?? value : "未返回";
}

function AccountResult({ account, local }: { account: BillingAccount; local: boolean }) {
  return (
    <article className={styles.account}>
      <div className={styles.accountHeading}>
        <div>
          <span className={styles.eyebrow}>{local ? "账单中的套餐" : "当前套餐"}</span>
          <h3>{planLabel(account.plan)}</h3>
          {account.name && <p className={styles.accountName}>{account.name}</p>}
        </div>
        <span className={`${styles.status} ${account.active === true ? styles.statusActive : ""}`}>
          <span />{account.active === true ? "订阅有效" : account.active === false ? "无有效订阅" : "状态未返回"}
        </span>
      </div>
      <div className={styles.expiry}>
        <div><Clock3 size={17} aria-hidden="true" /><span>本期结束 / 到期时间</span></div>
        <strong>{dateLabel(account.expiresAt)}</strong>
        <small>{account.expiresAt ? local ? "北京时间 · 来自粘贴内容，未经实时验证" : "北京时间 · 以上游返回时间为准" : local ? "输入未包含该字段，不能据此判断订阅已到期。" : "接口未提供该字段，不能据此判断订阅已到期。"}</small>
      </div>
      <dl className={styles.details}>
        <div><dt>自动续费</dt><dd>{account.willRenew === null ? "未返回" : account.willRenew ? "开启" : "关闭"}</dd></div>
        <div><dt>付费周期</dt><dd>{periodLabel(account.billingPeriod)}</dd></div>
        <div><dt>购买平台</dt><dd>{account.platform ?? "未返回"}</dd></div>
        <div><dt>账单状态</dt><dd>{account.status ?? "未返回"}</dd></div>
        <div><dt>欠费状态</dt><dd>{account.isDelinquent === null ? "未返回" : account.isDelinquent ? "存在欠费" : "无欠费"}</dd></div>
        <div><dt>开始时间<span>（北京时间）</span></dt><dd>{dateLabel(account.startsAt)}</dd></div>
        <div className={styles.accountId}><dt>AccountID</dt><dd>{account.accountId ?? "未返回"}</dd></div>
      </dl>
    </article>
  );
}

export function GptBillingTool({ liveQueryEnabled = false }: { liveQueryEnabled?: boolean } = {}) {
  const [requestedMode, setMode] = useState<Mode>(liveQueryEnabled ? "quick" : "local");
  const mode = liveQueryEnabled ? requestedMode : "local";
  const availableModes = liveQueryEnabled ? modes : modes.filter(item => item.id === "local");
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<BillingResult | null>(null);
  const [error, setError] = useState("");
  const [example, setExample] = useState(false);
  const requestRef = useRef<AbortController | null>(null);
  const generationRef = useRef(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const kind = detectBillingInput(input);
  const selectedMode = modes.find(item => item.id === mode)!;

  useEffect(() => () => {
    generationRef.current += 1;
    requestRef.current?.abort();
  }, []);

  function stopRequest() {
    generationRef.current += 1;
    requestRef.current?.abort();
    requestRef.current = null;
    setPending(false);
  }

  function changeMode(next: Mode) {
    stopRequest();
    setMode(liveQueryEnabled ? next : "local");
    setResult(null);
    setError("");
    setExample(false);
    setConsent(false);
  }

  function clear() {
    stopRequest();
    setInput("");
    setResult(null);
    setError("");
    setExample(false);
    setConsent(false);
    setRevealed(false);
    inputRef.current?.focus();
  }

  function useExample() {
    stopRequest();
    setMode("local");
    setConsent(false);
    setInput(sampleInput);
    setRevealed(true);
    setExample(true);
    setError("");
    setResult(parseLocalBilling(sampleInput));
  }

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? availableModes.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + availableModes.length) % availableModes.length;
    changeMode(availableModes[next].id);
    tabRefs.current[next]?.focus();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestRef.current || pending) return;
    setError("");
    setResult(null);
    if (!input.trim()) { setError(mode === "local" ? "请先粘贴账单 JSON。" : "请先粘贴 Access Token 或完整 Session JSON。"); return; }
    if (mode === "local") {
      if (!liveQueryEnabled && (kind === "token" || kind === "session" || kind === "account-id")) {
        setError("当前仅支持已有账单 JSON。登录凭证不能在本地解析出会员到期时间，请在 ChatGPT 设置中查看订阅。");
        return;
      }
      try { setResult(parseLocalBilling(input)); }
      catch (caught) { setError(!liveQueryEnabled ? "这份内容没有可解析的订阅账单字段。请使用已有账单 JSON；缺失的订阅信息请在 ChatGPT 设置中查看。" : caught instanceof Error ? caught.message : "无法解析这份账单 JSON。"); }
      return;
    }
    if (!liveQueryEnabled) { setError("在线实时查询暂不可用，请在 ChatGPT 设置中查看订阅。"); return; }
    if (kind === "account-id") { setError("仅凭 AccountID 无法查询。请使用这个账号的 Access Token 或完整 Session JSON。"); return; }
    if (kind !== "token" && kind !== "session") { setError("请粘贴 Access Token 或完整 Session JSON；已有账单 JSON 请使用「本地解析」。"); return; }
    if (!consent) { setError("请先阅读并勾选本次查询的凭证使用说明。"); return; }
    const controller = new AbortController();
    requestRef.current = controller;
    const generation = ++generationRef.current;
    let timedOut = false;
    setPending(true);
    const timeout = window.setTimeout(() => { timedOut = true; controller.abort(); }, 28_000);
    try {
      const response = await fetch("/api/tools/gpt-billing", {
        method: "POST", cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, mode }), signal: controller.signal,
      });
      const payload = await response.json() as { success: boolean; result?: BillingResult; message?: string };
      if (generation !== generationRef.current) return;
      if (!response.ok || !payload.success || !payload.result) throw new Error(payload.message || "暂时无法完成查询，请稍后重试。");
      setExample(false);
      setResult(payload.result);
    } catch (caught) {
      if (generation !== generationRef.current) return;
      if (controller.signal.aborted) setError(timedOut ? "查询等待超时。ChatGPT 可能暂时无法连接，请稍后重试。" : "本次查询已取消。");
      else setError(caught instanceof Error && !(caught instanceof TypeError) ? caught.message : "查询服务暂时无法连接，请稍后重试。");
    } finally {
      window.clearTimeout(timeout);
      if (generation === generationRef.current) { requestRef.current = null; setPending(false); }
    }
  }

  return (
    <div className={`${styles.page} notranslate`} translate="no">
      <div className={styles.container}>
        <header className={styles.hero}>
          <div>
            <div className={styles.badge}><Fingerprint size={15} aria-hidden="true" />{liveQueryEnabled ? "账号工具 · 即查即走" : "账号工具 · 账单解析"}</div>
            <h1>ChatGPT <span>订阅查询</span></h1>
            {liveQueryEnabled ? <p>套餐、订阅状态、到期时间，一次看清。<br className={styles.mobileBreak} />支持 Token 与 Session JSON 自动识别。</p> : <p>当前仅支持已有账单 JSON 的浏览器内解析。<br className={styles.mobileBreak} />实际订阅状态请在 ChatGPT 设置中查看。</p>}
          </div>
          <a className={styles.officialLink} href="https://chatgpt.com" target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">打开 ChatGPT<ExternalLink size={14} aria-hidden="true" /></a>
        </header>

        {!liveQueryEnabled && <div className={styles.availability} role="status"><CircleAlert size={20} aria-hidden="true" /><div><h2>在线实时查询暂不可用</h2><p>本页不会查询你的账号，也不需要登录凭证。你可以解析已有账单 JSON，或打开 ChatGPT，在设置中查看订阅。</p></div></div>}

        <div className={styles.workspace}>
          <section className={styles.queryCard} aria-labelledby="query-heading">
            <div className={styles.cardHeading}><div className={styles.headingIcon}>{liveQueryEnabled ? <KeyRound size={20} aria-hidden="true" /> : <FileJson2 size={20} aria-hidden="true" />}</div><div><h2 id="query-heading">{liveQueryEnabled ? "输入账号凭证" : "解析已有账单"}</h2><p>{liveQueryEnabled ? "仅在你点击查询后发送请求" : "在浏览器内整理，不发送查询请求"}</p></div></div>
            <div className={`${styles.tabs} ${liveQueryEnabled ? "" : styles.singleTab}`} role="tablist" aria-label="查询方式">
              {availableModes.map((item, index) => <button key={item.id} ref={element => { tabRefs.current[index] = element; }} type="button" role="tab" aria-selected={mode === item.id} aria-controls="billing-query-panel" id={`billing-tab-${item.id}`} tabIndex={mode === item.id ? 0 : -1} className={mode === item.id ? styles.selectedTab : ""} onClick={() => changeMode(item.id)} onKeyDown={event => moveTab(event, index)}><item.icon size={16} aria-hidden="true" />{item.title}</button>)}
            </div>
            <form onSubmit={submit} autoComplete="off" id="billing-query-panel" role="tabpanel" aria-labelledby={`billing-tab-${mode}`}>
              <p className={styles.modeDescription}>{selectedMode.description}</p>
              <div className={styles.inputLabel}><label htmlFor="billing-input">{mode === "local" ? "账单 JSON" : "Access Token / Session JSON"}</label><span className={(liveQueryEnabled && (kind === "token" || kind === "session")) || kind === "billing-data" ? styles.recognized : ""}>{!liveQueryEnabled && (kind === "token" || kind === "session" || kind === "account-id") ? "请改用账单 JSON" : kindLabels[kind]}</span></div>
              <div className={styles.inputWrap}>
                <textarea ref={inputRef} id="billing-input" name="billing-credential" className={`${styles.input} ${revealed ? "" : styles.masked}`} rows={7} value={input} onChange={event => { setInput(event.target.value); setResult(null); setError(""); setExample(false); }} readOnly={pending} autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} maxLength={billingInputLimit} aria-describedby="billing-input-help billing-privacy" placeholder={mode === "local" ? '粘贴已有的订阅账单 JSON，例如包含 subscription 或 entitlement 字段的内容…' : '在这里粘贴完整 Access Token，或 { "accessToken": "…" } 格式的 Session JSON…'} data-1p-ignore="true" data-lpignore="true" />
                <div className={styles.inputToolbar}><span><LockKeyhole size={12} aria-hidden="true" />仅停留在本页，不保存输入</span><button type="button" onClick={() => setRevealed(value => !value)} aria-label={revealed ? "隐藏输入内容" : "显示输入内容"}>{revealed ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}{revealed ? "隐藏" : "显示"}</button></div>
              </div>
              <p id="billing-input-help" className={styles.inputHelp}>{mode === "local" ? liveQueryEnabled ? "需要含订阅字段的账单 JSON。Session 的登录有效期与 Token 的 exp 不代表会员到期时间。" : "仅整理已有账单中的订阅字段，不会查询账号，也不会补全缺失信息。请勿粘贴登录凭证。" : "无需密码、Cookie 或 API Key。单独的 AccountID 无法查询。"}</p>
              <div id="billing-privacy" className={styles.privacy}><ShieldCheck size={18} aria-hidden="true" /><p>{mode === "local" ? <>本地解析在浏览器内完成，<strong>输入不会发送到服务器</strong>。解析内容未经实时验证。</> : <>实时查询会将凭证经<strong>本站服务器发送至 chatgpt.com</strong>，仅在请求期间使用，请确认你信任本站。</>}</p></div>
              {mode !== "local" && <label className={styles.consent}><input type="checkbox" checked={consent} disabled={pending} onChange={event => setConsent(event.target.checked)} /><span>我了解并同意本次查询将凭证发送至本站服务器及 ChatGPT。</span></label>}
              {error && <p className={styles.error} role="alert"><CircleAlert size={17} aria-hidden="true" /><span>{error}</span></p>}
              <div className={styles.actions}><button className={styles.submit} type="submit" disabled={pending || !input.trim() || (mode !== "local" && !consent)}>{pending ? <LoaderCircle size={18} className={styles.spin} aria-hidden="true" /> : mode === "local" ? <FileJson2 size={18} aria-hidden="true" /> : <Search size={18} aria-hidden="true" />}{pending ? "正在查询，请稍候…" : mode === "local" ? "解析账单 JSON" : "查询订阅信息"}{!pending && <ArrowRight size={17} aria-hidden="true" />}</button><button type="button" className={styles.clear} onClick={clear} disabled={!input && !result && !pending}><Trash2 size={16} aria-hidden="true" />清空</button></div>
              <div className={styles.bottomLinks}><a href="#billing-guide">{liveQueryEnabled ? "不知道如何获取？" : "如何查看真实订阅？"}<ArrowDown size={12} aria-hidden="true" /></a><button type="button" onClick={useExample}>查看合成示例<Sparkles size={12} aria-hidden="true" /></button></div>
            </form>
          </section>

          <section className={styles.resultCard} aria-labelledby="result-heading" aria-busy={pending} aria-live="polite">
            <div className={styles.resultHeading}><div><span className={styles.eyebrow}>{liveQueryEnabled ? "SUBSCRIPTION OVERVIEW" : "BILLING JSON OVERVIEW"}</span><h2 id="result-heading">{liveQueryEnabled ? "订阅概览" : "账单解析结果"}</h2></div>{result && <span className={styles.source}>{example ? "合成示例" : result.source === "live" ? "实时查询" : "本地解析"}</span>}</div>
            {pending ? <div className={styles.empty}><div className={styles.resultIllustration}><LoaderCircle size={32} className={styles.spin} aria-hidden="true" /></div><h3>正在读取订阅信息</h3><p>正在连接 ChatGPT 网页查询接口。<br />你可以随时点击「清空」中断。</p></div> : result ? <div className={styles.resultBody}>
              <p className={styles.resultNotice}>{example ? <><Sparkles size={15} aria-hidden="true" />以下是合成示例，不属于任何真实账号。</> : result.source === "local" ? <><WifiOff size={15} aria-hidden="true" />输入内容解析 · 未经实时验证</> : <><Check size={15} aria-hidden="true" />来自本次 ChatGPT 网页接口返回</>}</p>
              {result.accounts.map((account, index) => <AccountResult key={`${account.accountId ?? "account"}-${index}`} account={account} local={result.source === "local"} />)}
              {result.warnings.length > 0 && <div className={styles.warnings}>{result.warnings.map((warning, index) => <p key={index}><CircleAlert size={14} aria-hidden="true" /><span>{warning}</span></p>)}</div>}
              <p className={styles.checkedAt}>{result.source === "local" ? "解析" : "查询"}时间：{dateLabel(result.checkedAt)}（北京时间）</p>
            </div> : <div className={styles.empty}><div className={styles.resultIllustration}><FileJson2 size={34} strokeWidth={1.4} aria-hidden="true" /><span><Check size={12} aria-hidden="true" /></span></div><h3>{liveQueryEnabled ? "你的订阅信息，会显示在这里" : "已有账单的解析结果，会显示在这里"}</h3>{liveQueryEnabled ? <p>输入凭证，选择查询方式，<br />查看套餐和接口可提供的订阅信息。</p> : <p>粘贴含订阅字段的账单 JSON，<br />仅展示输入中已有的内容，未经实时验证。</p>}<div className={styles.emptyFields}><span>{liveQueryEnabled ? "当前套餐" : "账单套餐"}</span><span>订阅状态</span><span>到期时间</span><span>自动续费</span></div><button type="button" className={styles.exampleLink} onClick={useExample}>先看看合成示例<ArrowRight size={14} aria-hidden="true" /></button></div>}
            <p className={styles.resultFootnote}><CircleAlert size={14} aria-hidden="true" />{liveQueryEnabled ? "部分账号或购买渠道不会返回完整账单字段，请以 ChatGPT 账号内的订阅页面为准。" : "本地解析不验证账单真伪或时效。缺失字段显示「未返回」，实际订阅以 ChatGPT 设置中的信息为准。"}</p>
          </section>
        </div>

        <section className={styles.guide} id="billing-guide" aria-labelledby="guide-heading">
          <div className={styles.guideHeader}><div><span className={styles.eyebrow}>GET STARTED</span><h2 id="guide-heading">{liveQueryEnabled ? "三步，查看你的订阅" : "在官方页面核实你的订阅"}</h2></div><p>{liveQueryEnabled ? "请在自己的设备上操作，并只查询你有权访问的账号。" : "没有账单 JSON，也可以直接在 ChatGPT 中查看。"}</p></div>
          {liveQueryEnabled ? <ol className={styles.steps}>
            <li><span className={styles.stepNumber}>01</span><h3>登录 ChatGPT</h3><p>在同一浏览器登录你要查询的账号，确认已经进入 ChatGPT。</p><a href="https://chatgpt.com" target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">前往 ChatGPT<ExternalLink size={13} aria-hidden="true" /></a></li>
            <li><span className={styles.stepNumber}>02</span><h3>获取 Session 信息</h3><p>打开 Session 页面，复制完整 JSON，或只复制其中的 accessToken 值。</p><a href="https://chatgpt.com/api/auth/session" target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">打开 Session 页面<ExternalLink size={13} aria-hidden="true" /></a></li>
            <li><span className={styles.stepNumber}>03</span><h3>粘贴后点击查询</h3><p>回到本页粘贴，阅读凭证使用说明后查询。完成后可点击「清空」。</p><span className={styles.stepNote}><ShieldCheck size={13} aria-hidden="true" />把 Token 视作登录凭证，避免分享</span></li>
          </ol> : <ol className={styles.steps}>
            <li><span className={styles.stepNumber}>01</span><h3>打开 ChatGPT</h3><p>在自己的设备上登录需要查看订阅的账号。</p><a href="https://chatgpt.com" target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">前往 ChatGPT<ExternalLink size={13} aria-hidden="true" /></a></li>
            <li><span className={styles.stepNumber}>02</span><h3>在设置中查看订阅</h3><p>进入 ChatGPT 设置，查看账号内的订阅信息。实际套餐、续费与到期状态以官方页面为准。</p><span className={styles.stepNote}><ShieldCheck size={13} aria-hidden="true" />无需向本站提供登录凭证</span></li>
            <li><span className={styles.stepNumber}>03</span><h3>已有账单，可以本地解析</h3><p>如果已经有包含订阅字段的账单 JSON，可在本页整理查看。没有这类文件时，直接在官方页面核实即可。</p><button type="button" className={styles.exampleLink} onClick={useExample}>查看合成示例<Sparkles size={12} aria-hidden="true" /></button></li>
          </ol>}
        </section>

        <section className={styles.faq} aria-labelledby="faq-heading"><h2 id="faq-heading">你可能想知道</h2><div>
          {liveQueryEnabled ? <>
            <details><summary>快速查询与深度查询有什么区别？<ChevronDown size={16} aria-hidden="true" /></summary><p>快速查询读取账号套餐与订阅状态；深度查询会尝试补充账单和续费字段。ChatGPT 网页查询接口可能调整或拒绝请求，并非所有账号都能返回到期时间。</p></details>
            <details><summary>为什么到期时间显示「未返回」？<ChevronDown size={16} aria-hidden="true" /></summary><p>账号权限、购买渠道和接口返回内容可能不同。「未返回」表示没有拿到该字段，不表示订阅已过期。请到 ChatGPT 设置中的订阅页面核实；登录 Session 的 expires 和 Token 的 exp 不是会员到期时间。</p></details>
            <details><summary>只有 AccountID，可以查询吗？<ChevronDown size={16} aria-hidden="true" /></summary><p>不可以。AccountID 只是账号标识，没有访问该账号账单的权限。实时查询需要这个账号的 Access Token 或完整 Session JSON。</p></details>
            <details><summary>本地解析会访问 ChatGPT 吗？<ChevronDown size={16} aria-hidden="true" /></summary><p>不会。本地解析仅整理你粘贴的账单 JSON，不验证内容真伪或时效。只有登录信息而没有订阅字段的 Session JSON，无法在本地得到实时账单。</p></details>
          </> : <>
            <details><summary>在线实时查询为什么不能用？<ChevronDown size={16} aria-hidden="true" /></summary><p>当前在线实时查询暂不可用，本站已关闭该入口。本页仅保留已有账单 JSON 的浏览器内解析，实际订阅请打开 ChatGPT，在设置中核实。</p></details>
            <details><summary>本地解析能查到会员到期时间吗？<ChevronDown size={16} aria-hidden="true" /></summary><p>只有输入的账单包含到期字段时才会显示。缺失字段显示「未返回」，不表示订阅已过期。登录 Session 的有效期和 Token 的 exp 不是会员到期时间，也不能用于本地查询。</p></details>
            <details><summary>没有账单 JSON，应该怎么办？<ChevronDown size={16} aria-hidden="true" /></summary><p>直接打开 ChatGPT，在设置中查看订阅即可，无需在本站输入账号信息。本页的合成示例仅演示账单解析效果，不代表真实账号或查询结果。</p></details>
            <details><summary>本地解析会访问 ChatGPT 或保存输入吗？<ChevronDown size={16} aria-hidden="true" /></summary><p>不会。解析在当前浏览器内完成，不发送查询请求，也不保存输入。结果只反映粘贴内容，未经实时验证；完成后可以点击「清空」。</p></details>
          </>}
        </div></section>
      </div>
    </div>
  );
}
