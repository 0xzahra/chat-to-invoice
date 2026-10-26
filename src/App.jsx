import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SAMPLES } from './sample.js';
import { DICT, UI_LANGS, countInvoices } from './i18n.js';
const L = createContext({ t: DICT.en, lang: 'en' });
const useT = () => useContext(L).t;

const api = async (url, body) => {
  const r = await fetch(url, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Request failed'); return j;
};
const fmt = (v, c = 'USD') => { try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(v || 0); } catch { return `${c} ${Number(v || 0).toFixed(2)}`; } };
const SELLER = 'Luma Threads Studio';

function Logo() {
  return <div className="flex items-center gap-2.5">
    <div className="relative h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-400 via-violet-500 to-cyan-400 shadow-[0_0_24px_-4px_rgba(129,140,248,.8)]">
      <svg viewBox="0 0 24 24" className="keep-white absolute inset-0 m-auto h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 7h10M5 12h14M5 17h7" /></svg>
    </div>
    <span className="text-[15px] font-semibold tracking-tight text-white">Chat-to-Invoice</span>
  </div>;
}
const Badge = ({ mode }) => { const t = useT(); return mode === 'sandbox'
  ? <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">● {t.sandboxLive}</span>
  : <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">● {t.demoMode}</span>; };

function LangPicker({ lang, setLang }) {
  const [open, setOpen] = useState(false); const [q, setQ] = useState(''); const ref = React.useRef(null);
  useEffect(() => { const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); }; const k = (e) => e.key === 'Escape' && setOpen(false);
    addEventListener('mousedown', h); addEventListener('keydown', k); return () => { removeEventListener('mousedown', h); removeEventListener('keydown', k); }; }, []);
  const items = Object.entries(UI_LANGS).filter(([c, [n, e]]) => `${c} ${n} ${e}`.toLowerCase().includes(q.trim().toLowerCase()));
  const pick = (c) => { setLang(c); setOpen(false); setQ(''); };
  return <div ref={ref} className="relative">
    <button data-test="ui-lang" aria-haspopup="listbox" aria-expanded={open} className="btn-ghost !h-9 !gap-1.5 !px-2.5 !text-xs" onClick={() => setOpen((o) => !o)}>
      <svg viewBox="0 0 24 24" className="h-4 w-4 opacity-70" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" /></svg>
      <span className="hidden sm:inline">{UI_LANGS[lang][0]}</span><span className="sm:hidden uppercase">{lang}</span>
      <svg viewBox="0 0 24 24" className={`h-3 w-3 opacity-50 transition ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
    </button>
    {open && <div className="card lang-pop absolute end-0 top-11 z-50 w-64 overflow-hidden !bg-[#0d0f16]/95 p-1.5 animate-rise [animation-duration:.25s]" role="listbox">
      <input autoFocus data-test="lang-search" className="input mb-1.5 !py-1.5 !text-xs" placeholder="Search · Nema · Ara · Rechercher…" value={q} onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && items[0] && pick(items[0][0])} />
      <div className="max-h-72 overflow-y-auto">
        {items.map(([c, [n, e]]) => <button key={c} data-lang={c} role="option" aria-selected={c === lang} onClick={() => pick(c)}
          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-start text-sm transition ${c === lang ? 'bg-indigo-500/15 text-white' : 'text-zinc-300 hover:bg-white/[0.06]'}`}>
          <span dir="auto">{n}</span><span className="flex items-center gap-2 text-[11px] text-zinc-500">{e !== n && e}{c === lang && <span className="text-indigo-300">✓</span>}</span></button>)}
        {!items.length && <div className="px-2.5 py-3 text-xs text-zinc-500">—</div>}
      </div>
    </div>}
  </div>;
}

function Nav({ page, go, cfg, lang, setLang, theme, setTheme }) {
  const t = useT();
  return <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#07080c]/70 backdrop-blur-xl">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
      <button onClick={() => go('home')}><Logo /></button>
      <nav className="flex items-center gap-2 sm:gap-3">
        {cfg && <span className="hidden md:inline"><Badge mode={cfg.paypalMode} /></span>}
        <LangPicker lang={lang} setLang={setLang} />
        <button data-test="theme" aria-label={t.theme} title={t.theme} className="btn-ghost !h-9 !w-9 !p-0" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
            : <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>}</button>
        {page === 'home' ? <button className="btn-primary !py-2" onClick={() => go('app')} data-test="open-app">{t.openApp}</button>
          : <button className="btn-ghost !py-2" onClick={() => go('home')}>{t.home}</button>}
      </nav>
    </div>
  </header>;
}

function Bg() {
  return <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div className="hero-glow absolute left-1/2 top-[-20%] h-[700px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,.22),transparent)]" />
    <div className="absolute right-[-10%] top-[30%] h-[500px] w-[600px] rounded-full bg-[radial-gradient(closest-side,rgba(34,211,238,.10),transparent)]" />
    <div className="bg-grid absolute inset-0 bg-[linear-gradient(rgba(127,127,160,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(127,127,160,.06)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
  </div>;
}

function Landing({ go, cfg }) {
  const t = useT();
  const steps = [['01', t.s1t, t.s1d], ['02', t.s2t, t.s2d], ['03', t.s3t, t.s3d]];
  return <main>
    <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
      <div className="animate-rise">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" /> {t.pill}
        </div>
        <h1 className="text-[44px] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-[68px]"><span className="grad-text">{t.h1a}<br />{t.h1b}</span></h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">{t.sub}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <button className="btn-primary !px-5 !py-3" onClick={() => go('app')}>{t.cta1}</button>
          <a className="btn-ghost !px-5 !py-3" href="#how" onClick={(e) => { e.preventDefault(); document.getElementById('how').scrollIntoView({ behavior: 'smooth' }); }}>{t.cta2}</a>
        </div>
        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-zinc-500">
          <span><b className="font-semibold text-zinc-200">~10s</b> {t.stat1}</span><span><b className="font-semibold text-zinc-200">12</b> {t.stat2}</span><span><b className="font-semibold text-zinc-200">PayPal</b> {t.stat3}</span>
        </div>
      </div>
      <HeroVisual />
    </section>
    <section id="how" className="mx-auto max-w-7xl px-5 pb-28">
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map(([n, t, d], i) => <div key={n} className="card group p-6 transition duration-300 hover:-translate-y-1 hover:border-indigo-400/30" style={{ animation: `rise .6s ${0.15 * i + 0.3}s both` }}>
          <div className="mb-8 font-mono text-xs text-indigo-300/80">{n}</div>
          <h3 className="text-lg font-semibold tracking-tight text-white">{t}</h3><p className="mt-2 text-sm leading-relaxed text-zinc-400">{d}</p>
        </div>)}
      </div>
      <p className="mt-10 text-center text-xs text-zinc-600">{t.engine}: {cfg?.ai || '…'} · PayPal: {cfg?.paypalMode === 'sandbox' ? 'Sandbox' : 'Demo mode'} · MIT licensed</p>
    </section>
  </main>;
}

function HeroVisual() {
  const t = useT();
  return <div className="relative animate-rise [animation-delay:.15s]">
    <div className="card relative ml-auto max-w-md p-4 animate-float">
      <div className="mb-3 flex items-center gap-2 border-b border-white/5 pb-3"><div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600" /><div><div className="text-sm font-medium text-white">Amara Okafor</div><div className="text-[11px] text-zinc-500">WhatsApp · online</div></div></div>
      {['2 x Linen wrap dress (M) at $45 each', '1 Silk headscarf - $18', 'Send it to amara.okafor@example.com 🙏'].map((m, i) =>
        <div key={i} className="mb-2 w-fit max-w-[85%] rounded-2xl rounded-tl-sm bg-white/[0.06] px-3 py-2 text-[13px] text-zinc-200">{m}</div>)}
    </div>
    <div className="card relative -mt-6 mr-auto max-w-sm border-indigo-400/20 p-5 shadow-[0_30px_80px_-20px_rgba(99,102,241,.45)] [animation-delay:1.5s] animate-float lg:-ml-4">
      <div className="flex items-center justify-between"><span className="label">Invoice #1001</span><span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-300">{t.paid}</span></div>
      <div className="mt-4 space-y-2 text-sm">{[['Linen wrap dress × 2', '$90.00'], ['Silk headscarf × 1', '$18.00'], ['Shipping', '$12.00']].map(([a, b]) => <div key={a} className="flex justify-between text-zinc-400"><span>{a}</span><span className="tabular-nums text-zinc-200">{b}</span></div>)}</div>
      <div className="mt-4 flex justify-between border-t border-white/5 pt-3 font-semibold text-white"><span>{t.total}</span><span className="tabular-nums">$120.00</span></div>
      <div className="mt-4 h-9 rounded-lg bg-[#ffc439] text-center text-sm font-bold leading-9 text-[#003087]">{t.pay}</div>
    </div>
  </div>;
}

const STATUS = { DRAFT: 'text-zinc-300 bg-white/5 border-white/10', SENT: 'text-indigo-200 bg-indigo-400/10 border-indigo-400/30', PAID: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/30', UNPAID: 'text-amber-300 bg-amber-400/10 border-amber-400/30' };
const Pill = ({ s }) => { const t = useT(); return <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS[s?.includes('PAID') && s !== 'UNPAID' ? 'PAID' : s] || STATUS.UNPAID}`}>{t[s] || s}</span>; };
function Stepper({ s }) {
  const order = ['DRAFT', 'SENT', 'PAID']; const idx = s?.endsWith('PAID') && s !== 'UNPAID' ? 2 : s === 'DRAFT' ? 0 : 1;
  return <div className="flex items-center gap-1.5">{order.map((o, i) => <React.Fragment key={o}>
    <div className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${i <= idx ? (idx === 2 ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-indigo-400 shadow-[0_0_8px_#818cf8]') : 'bg-white/15'}`} />
    {i < 2 && <div className={`h-px w-6 transition-all duration-500 ${i < idx ? (idx === 2 ? 'bg-emerald-400/60' : 'bg-indigo-400/60') : 'bg-white/10'}`} />}</React.Fragment>)}</div>;
}

function Dashboard({ cfg }) {
  const t = useT(); const { lang } = useContext(L);
  const [chat, setChat] = useState('');
  const [inv, setInv] = useState(null);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [list, setList] = useState([]);
  const [sel, setSel] = useState(null);
  const run = async (k, fn) => { setBusy(k); setErr(''); try { return await fn(); } catch (e) { setErr(e.message); } finally { setBusy(''); } };
  const extract = () => run('extract', async () => { await new Promise((r) => setTimeout(r, 700)); setInv(await api('/api/extract', { chat })); });
  const upd = (k, v) => setInv((x) => ({ ...x, [k]: v }));
  const updItem = (i, k, v) => setInv((x) => ({ ...x, items: x.items.map((it, j) => (j === i ? { ...it, [k]: v } : it)) }));
  const sub = useMemo(() => (inv?.items || []).reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0), [inv]);
  const total = sub + Number(inv?.shipping || 0) - Number(inv?.discount || 0);
  const create = () => run('create', async () => {
    const d = { ...inv, seller: SELLER, items: inv.items.map((i) => ({ ...i, quantity: Number(i.quantity), unit_price: Number(i.unit_price) })) };
    const c = await api('/api/invoices', d); const row = { ...c, buyer: inv.buyer_name, currency: inv.currency };
    setList((l) => [row, ...l]); setSel(row.id);
    await new Promise((r) => setTimeout(r, 900));
    const s = await api(`/api/invoices/${c.id}/send`, {}); setList((l) => l.map((x) => (x.id === c.id ? { ...x, ...s } : x)));
  });
  const refresh = (id, action) => run(id + action, async () => {
    const s = action ? await api(`/api/invoices/${id}/${action}`, {}) : await api(`/api/invoices/${id}`);
    setList((l) => l.map((x) => (x.id === id ? { ...x, ...s } : x)));
  });
  const current = list.find((x) => x.id === sel);

  return <main className="mx-auto max-w-7xl px-5 pb-24 pt-8">
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4 animate-rise">
      <div><div className="label">{t.workspace} · {SELLER}</div><h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">{t.title}</h1></div>
      <div className="flex flex-wrap gap-2 text-[11px]"><span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-zinc-400">{t.ai}: {cfg?.ai}</span>{cfg && <Badge mode={cfg.paypalMode} />}</div>
    </div>
    {err && <div className="mb-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{err}</div>}
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="card flex flex-col p-5 animate-rise [animation-delay:.05s]">
        <div className="mb-3 flex items-center justify-between"><div><div className="text-sm font-semibold text-white">{t.p1t}</div><div className="text-xs text-zinc-500">{t.p1s}</div></div>
          <button className="btn-ghost !px-3 !py-1.5 !text-xs" onClick={() => setChat(SAMPLES[lang] || SAMPLES.en)} data-test="sample">{t.loadSample}</button></div>
        <textarea data-test="chat" className="input min-h-[300px] flex-1 resize-none font-mono !text-[12.5px] leading-relaxed" value={chat} onChange={(e) => setChat(e.target.value)} placeholder={'[24/10/26, 14:05] Buyer: 2 x Linen dress at $45 each…'} />
        <button data-test="extract" className="btn-primary mt-4 w-full !py-3" disabled={!chat.trim() || busy === 'extract'} onClick={extract}>
          {busy === 'extract' ? <><Spinner /> {t.extracting}</> : <>{t.extract}</>}</button>
      </section>

      <section className="card relative overflow-hidden p-5 animate-rise [animation-delay:.1s]">
        <div className="mb-4 flex items-center justify-between"><div><div className="text-sm font-semibold text-white">{t.p2t}</div><div className="text-xs text-zinc-500">{t.p2s}</div></div>
          {inv && <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] text-cyan-200">{t.via} {inv.engine}</span>}</div>
        {busy === 'extract' ? <Skeleton /> : !inv ? <Empty /> : <div className="animate-rise space-y-4" data-test="preview">
          <div className="grid gap-3 sm:grid-cols-[1fr_1.3fr_90px]">
            <Field l={t.bName}><input className="input" value={inv.buyer_name} onChange={(e) => upd('buyer_name', e.target.value)} /></Field>
            <Field l={t.bEmail}><input className="input" data-test="email" value={inv.buyer_email} onChange={(e) => upd('buyer_email', e.target.value)} /></Field>
            <Field l={t.currency}><input className="input uppercase" value={inv.currency} onChange={(e) => upd('currency', e.target.value.toUpperCase())} /></Field>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/[0.06]">
            <div className="grid grid-cols-[1fr_64px_96px_88px_28px] gap-2 bg-white/[0.03] px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500"><span>{t.item}</span><span>{t.qty}</span><span>{t.unit}</span><span className="text-end">{t.amount}</span><span /></div>
            {inv.items.map((it, i) => <div key={i} className="grid grid-cols-[1fr_64px_96px_88px_28px] items-center gap-2 border-t border-white/[0.05] px-3 py-2 animate-rise" style={{ animationDelay: `${i * 0.08}s` }}>
              <div><input className="input !border-transparent !bg-transparent !px-1 !py-1 font-medium" value={it.name} onChange={(e) => updItem(i, 'name', e.target.value)} />{it.description && <div className="px-1 text-[11px] text-zinc-500">{it.description}</div>}</div>
              <input className="input !px-2 !py-1.5 tabular-nums" data-test={`qty-${i}`} type="number" min="1" value={it.quantity} onChange={(e) => updItem(i, 'quantity', e.target.value)} />
              <input className="input !px-2 !py-1.5 tabular-nums" type="number" step="0.01" value={it.unit_price} onChange={(e) => updItem(i, 'unit_price', e.target.value)} />
              <span className="text-end text-sm tabular-nums text-zinc-200">{fmt(it.quantity * it.unit_price, inv.currency)}</span>
              <button className="text-zinc-600 transition hover:text-rose-300" onClick={() => setInv((x) => ({ ...x, items: x.items.filter((_, j) => j !== i) }))}>✕</button>
            </div>)}
            <button className="w-full border-t border-white/[0.05] px-3 py-2 text-start text-xs text-zinc-500 transition hover:bg-white/[0.02] hover:text-indigo-300" onClick={() => setInv((x) => ({ ...x, items: [...x.items, { name: 'New item', quantity: 1, unit_price: 0 }] }))}>{t.addLine}</button>
          </div>
          <div className="ms-auto max-w-xs space-y-1.5 text-sm">
            <Row a={t.subtotal} b={fmt(sub, inv.currency)} />
            <div className="flex items-center justify-between text-zinc-400"><span>{t.shipping}</span><input className="input !w-24 !px-2 !py-1 text-right tabular-nums" type="number" value={inv.shipping} onChange={(e) => upd('shipping', e.target.value)} /></div>
            <div className="flex justify-between border-t border-white/[0.06] pt-2 text-base font-semibold text-white"><span>{t.total}</span><span className="tabular-nums" data-test="total">{fmt(total, inv.currency)}</span></div>
          </div>
          <button data-test="create" className="btn-primary w-full !py-3" disabled={busy === 'create' || !inv.items.length || !inv.buyer_email} onClick={create}>
            {busy === 'create' ? <><Spinner /> {t.creating}</> : <>{t.create} · {fmt(total, inv.currency)}</>}</button>
        </div>}
      </section>
    </div>

    <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="card p-5 animate-rise [animation-delay:.15s]">
        <div className="mb-4 flex items-center justify-between"><div className="text-sm font-semibold text-white">{t.p3t}</div><span className="text-xs text-zinc-500">{countInvoices(lang, list.length)}</span></div>
        {!list.length ? <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-zinc-500">{t.p3e}</div> :
          <div className="space-y-2" data-test="invoices">{list.map((x) => <div key={x.id} onClick={() => setSel(x.id)} className={`flash cursor-pointer rounded-xl border p-4 transition ${sel === x.id ? 'border-indigo-400/40 bg-indigo-400/[0.05]' : 'border-white/[0.06] hover:border-white/15'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><div className="flex items-center gap-2"><span className="font-medium text-white">{x.buyer}</span><span key={x.status} className="animate-rise" data-test="status"><Pill s={x.status} /></span></div>
                <div className="mt-1 font-mono text-[11px] text-zinc-500">#{x.number} · {x.id}</div></div>
              <div className="text-end"><div className="font-semibold tabular-nums text-white">{fmt(x.total?.value, x.total?.currency_code)}</div><div className="mt-1.5"><Stepper s={x.status} /></div></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn-ghost !px-2.5 !py-1 !text-xs" onClick={(e) => { e.stopPropagation(); refresh(x.id); }}>{t.refresh}</button>
              {!x.status?.endsWith('PAID') && <button data-test="simulate" className="btn-ghost !px-2.5 !py-1 !text-xs" onClick={(e) => { e.stopPropagation(); refresh(x.id, 'simulate-paid'); }}>{cfg?.paypalMode === 'sandbox' ? t.record : t.simulate}</button>}
              {x.link && <a className="btn-ghost !px-2.5 !py-1 !text-xs" href={x.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>{t.payerLink}</a>}
            </div>
          </div>)}</div>}
      </div>
      <Reminder inv={current} cfg={cfg} />
    </section>
  </main>;
}

function Reminder({ inv, cfg }) {
  const t = useT(); const ui = useContext(L).lang; const [lang, setLang] = useState(ui);
  useEffect(() => setLang(ui), [ui]); const [tone, setTone] = useState('gentle'); const [msg, setMsg] = useState(''); const [copied, setCopied] = useState(false); const [busy, setBusy] = useState(false);
  const draft = async () => { if (!inv) return; setBusy(true); const r = await api('/api/reminder', { buyer: inv.buyer?.split(' ')[0], amount: fmt(inv.total?.value, inv.total?.currency_code), seller: SELLER, link: inv.link, lang, tone }); setMsg(r.message); setBusy(false); };
  useEffect(() => { if (inv) draft(); }, [inv?.id, lang, tone]);
  return <div className="card p-5 animate-rise [animation-delay:.2s]">
    <div className="mb-4"><div className="text-sm font-semibold text-white">{t.p4t}</div><div className="text-xs text-zinc-500">{t.p4s}</div></div>
    {!inv ? <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-zinc-500">{t.p4e}</div> : <>
      <div className="flex flex-wrap gap-2">
        <select data-test="lang" className="input !w-auto" value={lang} onChange={(e) => setLang(e.target.value)}>{Object.entries(cfg?.langs || {}).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <div className="flex rounded-lg border border-white/[0.08] bg-black/30 p-0.5">{['gentle', 'firm'].map((k) => <button key={k} data-test={`tone-${k}`} onClick={() => setTone(k)} className={`rounded-md px-3 py-1.5 text-xs transition ${tone === k ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>{t[k]}</button>)}</div>
      </div>
      <div className="mt-4 rounded-2xl rounded-tr-sm bg-gradient-to-br from-emerald-600/25 to-emerald-700/10 p-4 text-sm leading-relaxed text-zinc-100 ring-1 ring-emerald-400/20" dir={lang === 'ar' ? 'rtl' : 'ltr'} data-test="reminder">
        {busy ? <span className="text-zinc-400">{t.drafting}</span> : <span key={msg} className="animate-rise block">{msg}</span>}
      </div>
      <div className="mt-3 flex gap-2">
        <button className="btn-ghost !py-2 !text-xs" onClick={() => { navigator.clipboard?.writeText(msg); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? t.copied : t.copy}</button>
        <a className="btn-ghost !py-2 !text-xs" href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer">{t.openWa}</a>
      </div></>}
  </div>;
}

const Field = ({ l, children }) => <label className="block space-y-1.5"><span className="label">{l}</span>{children}</label>;
const Row = ({ a, b }) => <div className="flex justify-between text-zinc-400"><span>{a}</span><span className="tabular-nums text-zinc-200">{b}</span></div>;
const Spinner = () => <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>;
const Skeleton = () => <div className="space-y-3">{[60, 100, 100, 100, 40].map((w, i) => <div key={i} className="h-10 rounded-lg bg-[linear-gradient(90deg,rgba(255,255,255,.03),rgba(255,255,255,.08),rgba(255,255,255,.03))] bg-[length:200%_100%] animate-shimmer" style={{ width: `${w}%` }} />)}</div>;
const Empty = () => { const t = useT(); return <div className="flex h-[340px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 text-center"><div className="mb-3 text-3xl opacity-60">✦</div><div className="text-sm text-zinc-400">{t.emptyA}</div><div className="mt-1 text-xs text-zinc-600">{t.emptyB}</div></div>; };

export default function App() {
  const [page, setPage] = useState(location.hash === '#/app' ? 'app' : 'home');
  const [cfg, setCfg] = useState(null);
  const [lang, setLang] = useState(() => localStorage.getItem('c2i-lang') || (Object.keys(UI_LANGS).find((l) => navigator.language?.startsWith(l)) ?? 'en'));
  const [theme, setTheme] = useState(() => localStorage.getItem('c2i-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
  useEffect(() => { const h = document.documentElement; h.classList.toggle('light', theme === 'light'); h.classList.add('theme-anim'); localStorage.setItem('c2i-theme', theme); }, [theme]);
  useEffect(() => { const h = document.documentElement; h.lang = lang; h.dir = lang === 'ar' ? 'rtl' : 'ltr'; localStorage.setItem('c2i-lang', lang); }, [lang]);
  useEffect(() => { api('/api/config').then(setCfg).catch(() => {}); const h = () => setPage(location.hash === '#/app' ? 'app' : 'home'); addEventListener('hashchange', h); return () => removeEventListener('hashchange', h); }, []);
  const go = (p) => { location.hash = p === 'app' ? '#/app' : ''; setPage(p); scrollTo({ top: 0 }); };
  return <L.Provider value={{ t: DICT[lang], lang }}><Bg /><Nav page={page} go={go} cfg={cfg} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} />{page === 'app' ? <Dashboard key="d" cfg={cfg} /> : <Landing go={go} cfg={cfg} />}
    <footer className="border-t border-white/[0.05] py-8 text-center text-xs text-zinc-600">{DICT[lang].footer}</footer></L.Provider>;
}
