'use client';

import { useState, useEffect, useRef } from 'react';
import { TONE_NAMES } from '@/lib/prompts';
import { useTheme } from '@/components/ThemeProvider';

// ─── Icons ───────────────────────────────────────────────────────────────────
const svg = (d, size = 'w-4 h-4', sw = 1.6) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} className={size} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const Icon = {
  pen: svg('M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13L2.25 21.75l.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z', 'w-[18px] h-[18px]', 1.8),
  refresh: svg('M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99', 'w-[18px] h-[18px]', 1.8),
  wand: svg('M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z', 'w-[18px] h-[18px]', 1.8),
  copy: svg('M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184', 'w-[15px] h-[15px]'),
  download: svg('M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3', 'w-[15px] h-[15px]'),
  upload: svg('M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5', 'w-[15px] h-[15px]'),
  doc: svg('M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z', 'w-[18px] h-[18px]'),
  x: svg('M6 18L18 6M6 6l12 12', 'w-4 h-4', 1.8),
  check: svg('M4.5 12.75l6 6 9-13.5', 'w-3 h-3', 3),
  moon: svg('M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z'),
  sun: svg('M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z'),
  spinner: (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  ),
};

// ─── Style tokens ────────────────────────────────────────────────────────────
const card = 'bg-white dark:bg-night-surface border border-line dark:border-night-line rounded-2xl';
const label = 'text-xs font-bold text-ink dark:text-night-ink';
const eyebrow = 'text-[11px] font-bold uppercase tracking-[0.1em] text-faint dark:text-night-faint';
const muted = 'text-muted dark:text-night-muted';
const outlineBtn = 'flex items-center gap-2 px-3.5 py-2 rounded-[10px] border border-line-strong dark:border-night-line-strong bg-white dark:bg-night-surface text-[13px] font-semibold text-ink dark:text-night-ink hover:border-ink/40 dark:hover:border-night-muted transition-colors disabled:opacity-40';
const segWrap = 'flex p-[3px] gap-0.5 rounded-[10px] bg-seg dark:bg-night-seg';
const segBtn = (on) => `rounded-lg text-[13px] transition-all disabled:opacity-40 ${on
  ? 'bg-white dark:bg-night-line-strong text-ink dark:text-night-ink font-bold shadow-[0_1px_2px_rgba(22,22,26,0.12)]'
  : 'text-muted dark:text-night-muted font-semibold hover:text-ink dark:hover:text-night-ink'}`;
const fieldBox = 'w-full rounded-[10px] border px-3 py-2.5 leading-[1.45] bg-subtle dark:bg-night-subtle text-ink dark:text-night-ink placeholder-faint focus:outline-none transition-colors';

function limitsSummary(a) {
  return a.fields.map((f) => `${f.label} ${f.max ?? '—'}`).join(' · ');
}
function assetMeta(a) {
  return a.cta ? `CTA: ${a.cta}` : '';
}

export default function CopyStudio() {
  const { theme, toggle: toggleTheme } = useTheme();

  // Setup data
  const [assetTypes, setAssetTypes] = useState([]);
  const [providers, setProviders] = useState([]);
  const [provider, setProvider] = useState(null);
  const [setupError, setSetupError] = useState(null);

  // Inputs
  const [brief, setBrief] = useState('');
  const [selected, setSelected] = useState([]);
  const [tone, setTone] = useState('Premium');
  const [variantCount, setVariantCount] = useState(1);

  // Messaging matrix
  const [messagingMatrix, setMessagingMatrix] = useState('');
  const [matrixName, setMatrixName] = useState('');
  const [showMatrix, setShowMatrix] = useState(false);
  const [matrixLoading, setMatrixLoading] = useState(false);

  // Results
  const [result, setResult] = useState(null); // { options, assets, provider, model }
  const [priorOptions, setPriorOptions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regenOption, setRegenOption] = useState(null);
  const [fieldLoading, setFieldLoading] = useState({});
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState('');

  const briefRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/asset-types').then((r) => r.json()),
      fetch('/api/models').then((r) => r.json()),
    ]).then(([types, models]) => {
      if (types.success) setAssetTypes(types.assetTypes || []);
      else setSetupError(types.error || 'Could not load copy types');
      if (models.success) { setProviders(models.providers || []); setProvider(models.defaultProvider); }
    }).catch((e) => setSetupError(String(e.message || e)));
  }, []);

  // Auto-grow the brief box
  useEffect(() => {
    const el = briefRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 150)}px`;
  }, [brief]);

  const groups = assetTypes.reduce((acc, a) => { (acc[a.group] = acc[a.group] || []).push(a); return acc; }, {});
  const toggleAsset = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const orderedSelection = assetTypes.map((a) => a.id).filter((id) => selected.includes(id));
  const canGenerate = brief.trim() && orderedSelection.length > 0 && provider && !isGenerating && !matrixLoading;
  const hasMatrix = !!(matrixName || messagingMatrix || matrixLoading);

  // ── Messaging matrix file ──────────────────────────────────────────────────
  const handleMatrixFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const isPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
    if (isPdf) {
      setMatrixLoading(true); setMatrixName(f.name); setMessagingMatrix(''); setShowMatrix(false);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = String(reader.result).split(',')[1];
          const res = await fetch('/api/extract-pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ base64 }) });
          const d = await res.json();
          if (!d.success) throw new Error(d.error || 'Extraction failed');
          setMessagingMatrix(d.text || '');
        } catch (err) { setError(`Couldn't read that PDF: ${err.message}`); setMatrixName(''); }
        finally { setMatrixLoading(false); }
      };
      reader.readAsDataURL(f);
    } else {
      const reader = new FileReader();
      reader.onload = () => { setMessagingMatrix(String(reader.result || '')); setMatrixName(f.name); setShowMatrix(false); };
      reader.readAsText(f);
    }
    e.target.value = '';
  };
  const clearMatrix = () => { setMessagingMatrix(''); setMatrixName(''); setMatrixLoading(false); setShowMatrix(false); };

  // ── Generation ─────────────────────────────────────────────────────────────
  const callGenerate = async (body) => {
    const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({ success: false, error: `Request failed (${res.status})` }));
    if (!data.success) throw new Error(data.error || 'Generation failed');
    return data;
  };

  // First run → fresh set. With results on screen → "Regenerate all": a new set that
  // steers away from the current options (and recent history).
  const handleGenerate = async () => {
    if (!canGenerate) return;
    const prior = result ? [...result.options, ...priorOptions].slice(0, 6) : [];
    setIsGenerating(true); setError(null);
    try {
      const data = await callGenerate({ brief, tone, assetIds: orderedSelection, variantCount, provider, messagingMatrix, priorOptions: prior });
      setResult(data);
      setPriorOptions(prior);
      // Results sit beside the composer on wide screens; on narrow ones, bring them into view.
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
    } catch (err) { setError(err.message); }
    finally { setIsGenerating(false); }
  };

  // Replace a single option with a new one that differs from the options being kept.
  const handleNewOption = async (oi) => {
    if (!result) return;
    setRegenOption(oi); setError(null);
    const others = result.options.filter((_, i) => i !== oi);
    try {
      const data = await callGenerate({ brief, tone, assetIds: result.assets.map((a) => a.id), variantCount: 1, provider: result.provider, messagingMatrix, priorOptions: [...others, ...priorOptions].slice(0, 6) });
      if (data.options?.[0]) setResult((r) => ({ ...r, options: r.options.map((o, i) => (i === oi ? data.options[0] : o)) }));
    } catch (err) { setError(err.message); }
    finally { setRegenOption(null); }
  };

  const handleFieldRegen = async (oi, assetId, key) => {
    const lk = `${oi}:${assetId}:${key}`;
    setFieldLoading((p) => ({ ...p, [lk]: true }));
    try {
      const res = await fetch('/api/regenerate-field', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, tone, assetId, fieldKey: key, current: result.options[oi].assets[assetId], provider: result.provider, messagingMatrix }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Regenerate failed');
      handleEdit(oi, assetId, key, data.value);
    } catch (err) { setError(err.message); }
    finally { setFieldLoading((p) => ({ ...p, [lk]: false })); }
  };

  const handleEdit = (oi, assetId, key, value) => setResult((r) => ({
    ...r,
    options: r.options.map((o, i) => (i === oi ? { ...o, assets: { ...o.assets, [assetId]: { ...o.assets[assetId], [key]: value } } } : o)),
  }));

  // ── Copy / export ──────────────────────────────────────────────────────────
  const assetText = (a, fields = {}) => [a.name, ...a.fields.filter((f) => fields[f.key]).map((f) => `${f.label}: ${fields[f.key]}`)].join('\n');
  const optionText = (o, i) => [`OPTION ${i + 1}${o.angle ? ` — ${o.angle}` : ''}`, '', ...result.assets.map((a) => assetText(a, o.assets[a.id]))].join('\n\n');
  const allText = () => [
    'AXE COPY STUDIO — AX ENABLEMENT',
    `Tone: ${tone} · ${result.options.length} option(s) · ${result.assets.length} asset(s)`,
    '',
    'BRIEF',
    brief.trim(),
    '',
    '='.repeat(48),
    '',
    result.options.map(optionText).join(`\n\n${'='.repeat(48)}\n\n`),
  ].join('\n');

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(''), 1500); });
  };
  const exportTxt = () => {
    const blob = new Blob([allText()], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `axe-copy-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  const n = result?.options?.length || 0;
  const cols = n >= 3 ? 'md:grid-cols-2 xl:grid-cols-3' : n === 2 ? 'md:grid-cols-2' : 'grid-cols-1';
  const providerLabel = (id) => providers.find((p) => p.id === id)?.label || id;
  const assetCount = orderedSelection.length;
  const plural = (k, w) => `${k} ${w}${k !== 1 ? 's' : ''}`;

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white dark:bg-night-surface border-b border-line dark:border-night-line">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-[9px] bg-accent text-white flex items-center justify-center flex-shrink-0">{Icon.pen}</div>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="text-base font-extrabold tracking-[-0.01em] whitespace-nowrap truncate">HSAD Copy Studio</span>
              <span className={`text-xs ${muted} whitespace-nowrap truncate hidden sm:block`}>Developed by AXE Team</span>
            </div>
            <span className="hidden sm:inline-block flex-shrink-0 text-[11px] font-bold text-accent dark:text-accent-light bg-accent-tint dark:bg-accent-tint-dark rounded-full px-2.5 py-[3px]">Prototype</span>
          </div>
          <div className="flex items-center gap-3">
            {providers.length > 1 ? (
              <>
                <span className={`text-xs ${muted} hidden sm:inline`}>Model</span>
                <div className={segWrap} role="group" aria-label="Model">
                  {providers.map((p) => (
                    <button key={p.id} type="button" onClick={() => setProvider(p.id)} title={p.model} aria-pressed={provider === p.id}
                      className={`${segBtn(provider === p.id)} px-3.5 py-1.5`}>{p.label}</button>
                  ))}
                </div>
              </>
            ) : providers[0] ? (
              <span className={`text-xs ${muted}`} title={providers[0].model}>{providers[0].label}</span>
            ) : null}
            <button type="button" onClick={toggleTheme} aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              className="w-9 h-9 rounded-[10px] border border-line dark:border-night-line-strong bg-white dark:bg-night-surface text-muted dark:text-night-muted hover:text-ink dark:hover:text-night-ink flex items-center justify-center">
              {theme === 'light' ? Icon.moon : Icon.sun}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 pt-7 pb-12 flex flex-col lg:flex-row gap-7 items-start">

        {/* ── Composer ──────────────────────────────────────────────────────── */}
        <aside className={`${card} w-full lg:w-[420px] lg:flex-shrink-0 lg:sticky lg:top-[84px] lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto p-6 flex flex-col gap-6`}>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-extrabold tracking-[-0.02em] leading-tight">What are we writing?</h1>
            <p className={`text-[13px] ${muted}`}>Brief in, on-brand LG copy out — sized to every placement.</p>
          </div>

          {setupError && <div className="p-3 rounded-xl border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-xs font-semibold text-red-700 dark:text-red-400">{setupError}</div>}
          {!setupError && providers.length === 0 && assetTypes.length > 0 && (
            <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-xs font-semibold text-amber-800 dark:text-amber-400">No AI provider configured — add ANTHROPIC_API_KEY and/or OPENAI_API_KEY in the environment.</div>
          )}

          {/* Brief + matrix */}
          <div className="flex flex-col gap-2">
            <label htmlFor="brief" className={label}>Creative brief</label>
            <textarea id="brief" ref={briefRef} value={brief} onChange={(e) => setBrief(e.target.value)} spellCheck
              placeholder="Paste the creative brief — BU, category, products/models, promotion details and dates, audience, priority message, copy direction, legal notes…"
              className={`${fieldBox} min-h-[150px] overflow-hidden resize-none text-[13px] leading-[1.55] border-line-strong dark:border-night-line-strong focus:border-accent/60 dark:focus:border-accent-light/60`} />

            {!showMatrix && !hasMatrix && (
              <button type="button" onClick={() => setShowMatrix(true)}
                className="flex items-center gap-3 rounded-[10px] border border-line dark:border-night-line px-3 py-2.5 text-left hover:border-line-strong dark:hover:border-night-line-strong">
                <span className={muted}>{Icon.doc}</span>
                <span className="flex flex-col">
                  <span className="text-[13px] font-semibold">Attach messaging matrix</span>
                  <span className={`text-xs ${muted}`}>Optional · pillars, proof points, approved language</span>
                </span>
              </button>
            )}

            {!showMatrix && hasMatrix && (
              <div className="flex items-center justify-between gap-2.5 rounded-[10px] border border-line dark:border-night-line px-3 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={muted}>{matrixLoading ? Icon.spinner : Icon.doc}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-semibold truncate">{matrixName || 'Pasted messaging matrix'}</span>
                    <span className={`text-xs ${matrixLoading ? 'text-accent dark:text-accent-light font-semibold' : muted}`}>
                      {matrixLoading ? 'Extracting PDF…' : `Messaging matrix · ${messagingMatrix.length.toLocaleString()} chars`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!matrixLoading && <button type="button" onClick={() => setShowMatrix(true)} className={`text-xs font-semibold ${muted} hover:text-ink dark:hover:text-night-ink px-2 py-1.5`}>Edit</button>}
                  <button type="button" onClick={clearMatrix} aria-label="Remove messaging matrix"
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${muted} hover:text-accent dark:hover:text-accent-light`}>{Icon.x}</button>
                </div>
              </div>
            )}

            {showMatrix && (
              <div className="rounded-[10px] border border-line dark:border-night-line p-3 flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="matrix" className={label}>Messaging matrix</label>
                  <div className="flex items-center gap-1">
                    <label className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-line dark:border-night-line-strong ${muted} hover:text-ink dark:hover:text-night-ink cursor-pointer`}>
                      <input type="file" accept=".pdf,.txt,.csv,.tsv,.md,application/pdf,text/plain,text/csv" className="sr-only" onChange={handleMatrixFile} />
                      {Icon.upload} Upload file
                    </label>
                    <button type="button" onClick={() => setShowMatrix(false)} className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-accent dark:text-accent-light hover:bg-accent-tint dark:hover:bg-accent-tint-dark">Done</button>
                  </div>
                </div>
                <textarea id="matrix" value={messagingMatrix} onChange={(e) => { setMessagingMatrix(e.target.value); if (matrixName) setMatrixName(''); }} rows={5}
                  placeholder="…or paste your messaging matrix here. Pasting straight from Excel works."
                  className={`${fieldBox} text-xs border-line dark:border-night-line focus:border-accent/60 dark:focus:border-accent-light/60`} />
                <span className={`text-[11px] ${muted}`}>PDF, TXT, MD, CSV/TSV. PDFs are read automatically; from Excel, export CSV or paste.</span>
              </div>
            )}
          </div>

          {/* Copy types */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className={label}>Copy types</span>
              <div className="flex items-center gap-3 text-xs">
                <span className={muted}>{assetCount} of {assetTypes.length}</span>
                <button type="button" onClick={() => setSelected(assetTypes.map((a) => a.id))} className="font-semibold text-accent dark:text-accent-light hover:underline">Select all</button>
                {assetCount > 0 && <button type="button" onClick={() => setSelected([])} className={`font-semibold ${muted} hover:text-ink dark:hover:text-night-ink`}>Clear</button>}
              </div>
            </div>
            {assetTypes.length === 0 && !setupError && <p className={`text-xs ${muted}`}>Loading copy types…</p>}
            {Object.entries(groups).map(([group, list]) => (
              <div key={group} className="flex flex-col gap-1.5">
                <span className={`${eyebrow} mb-0.5`}>{group}</span>
                {list.map((a) => {
                  const on = selected.includes(a.id);
                  return (
                    <button key={a.id} type="button" onClick={() => toggleAsset(a.id)} aria-pressed={on} title={a.placement || undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] border text-left transition-colors ${on
                        ? 'border-accent dark:border-accent-light/70 bg-accent-tint dark:bg-accent-tint-dark'
                        : 'border-line dark:border-night-line bg-white dark:bg-night-surface hover:border-line-strong dark:hover:border-night-line-strong'}`}>
                      <span className={`w-[18px] h-[18px] flex-shrink-0 rounded-[5px] flex items-center justify-center text-white ${on ? 'bg-accent border border-accent' : 'border-[1.5px] border-[#BDBCB6] dark:border-night-line-strong'}`}>
                        {on && Icon.check}
                      </span>
                      <span className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[13px] font-bold leading-snug">{a.name}</span>
                        <span className={`font-mono text-[11px] ${muted}`}>{limitsSummary(a)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Tone */}
          <div className="flex flex-col gap-2.5">
            <span className={label}>Tone</span>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Tone">
              {TONE_NAMES.map((t) => (
                <button key={t} type="button" onClick={() => setTone(t)} aria-pressed={tone === t}
                  className={`rounded-full px-3.5 py-2 text-[13px] font-semibold border transition-colors ${tone === t
                    ? 'border-ink bg-ink text-white dark:border-night-ink dark:bg-night-ink dark:text-night'
                    : 'border-line-strong dark:border-night-line-strong bg-white dark:bg-night-surface text-[#3A3A42] dark:text-night-muted hover:border-ink/40 dark:hover:border-night-muted'}`}>{t}</button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className={label}>Options</span>
              <span className={`text-xs ${muted}`}>Each a different creative route</span>
            </div>
            <div className={segWrap} role="group" aria-label="Number of options">
              {[1, 2, 3].map((k) => (
                <button key={k} type="button" onClick={() => setVariantCount(k)} disabled={isGenerating} aria-pressed={variantCount === k}
                  className={`${segBtn(variantCount === k)} w-10 h-[34px]`}>{k}</button>
              ))}
            </div>
          </div>

          {/* Generate / Regenerate all */}
          <div className="flex flex-col gap-2">
            <button type="button" onClick={handleGenerate} disabled={!canGenerate}
              className={`w-full rounded-xl py-[15px] px-4 text-[15px] font-bold flex items-center justify-center gap-2.5 transition-colors ${canGenerate
                ? 'bg-accent hover:bg-accent-hover text-white shadow-[0_8px_20px_-8px_rgba(165,0,52,0.55)]'
                : 'bg-seg dark:bg-night-seg text-faint dark:text-night-faint cursor-not-allowed'}`}>
              {isGenerating
                ? <>{Icon.spinner} Writing {variantCount > 1 ? plural(variantCount, 'option') : 'copy'}…</>
                : result
                  ? <>{Icon.refresh} Regenerate all</>
                  : <>{Icon.wand} Generate {variantCount > 1 ? plural(variantCount, 'option') : 'copy'}{assetCount ? ` · ${plural(assetCount, 'asset')}` : ''}</>}
            </button>
            <span className={`text-xs ${muted} text-center`}>
              {!brief.trim() || assetCount === 0
                ? `${!brief.trim() ? 'Paste a brief' : ''}${!brief.trim() && assetCount === 0 ? ' and ' : ''}${assetCount === 0 ? 'select at least one copy type' : ''} to generate.`
                : isGenerating
                  ? 'Multi-asset sets can take up to a minute.'
                  : result
                    ? `Writes ${plural(variantCount, 'new option')} that steer away from what's on screen.`
                    : `${tone} tone · ${providerLabel(provider) || '—'}`}
            </span>
          </div>
        </aside>

        {/* ── Results ───────────────────────────────────────────────────────── */}
        <main ref={resultsRef} className="flex-1 min-w-0 w-full flex flex-col gap-[18px] scroll-mt-24">
          {error && (
            <div className="flex items-start justify-between gap-3 p-4 rounded-xl border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-[13px] font-semibold text-red-700 dark:text-red-400">
              <span>Something went wrong: {error}</span>
              <button type="button" onClick={() => setError(null)} aria-label="Dismiss error" className="flex-shrink-0">{Icon.x}</button>
            </div>
          )}

          {!result && !isGenerating && (
            <div className={`${card} min-h-[420px] flex flex-col items-center justify-center text-center gap-3 px-8 py-16`}>
              <div className="w-12 h-12 rounded-2xl bg-accent-tint dark:bg-accent-tint-dark text-accent dark:text-accent-light flex items-center justify-center">{Icon.wand}</div>
              <h2 className="text-xl font-extrabold tracking-[-0.02em]">Your copy lands here</h2>
              <p className={`text-sm ${muted} max-w-[420px]`}>Paste a brief, pick the copy types, and generate. Each option is a different creative route, shown side by side for every asset.</p>
            </div>
          )}

          {!result && isGenerating && (
            <div className={`${card} min-h-[420px] p-6 flex flex-col gap-5`} aria-live="polite">
              <div className="flex items-center gap-2.5 text-sm font-semibold text-accent dark:text-accent-light">{Icon.spinner} Writing {variantCount > 1 ? plural(variantCount, 'option') : 'copy'} for {plural(assetCount, 'asset')}…</div>
              <div className={`grid gap-4 ${variantCount >= 3 ? 'md:grid-cols-2 xl:grid-cols-3' : variantCount === 2 ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                {Array.from({ length: variantCount }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-3 animate-pulse">
                    <div className="h-24 rounded-xl bg-seg dark:bg-night-seg" />
                    <div className="h-10 rounded-[10px] bg-seg dark:bg-night-seg" />
                    <div className="h-20 rounded-[10px] bg-seg dark:bg-night-seg" />
                    <div className="h-10 rounded-[10px] bg-seg dark:bg-night-seg" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {result && (
            <div className={`flex flex-col gap-[18px] transition-opacity ${isGenerating ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-end justify-between gap-4 flex-wrap">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-[22px] font-extrabold tracking-[-0.02em]">{plural(n, 'option')} · {plural(result.assets.length, 'asset')}</h2>
                  <span className={`text-[13px] ${muted}`}>{tone} tone · written by {providerLabel(result.provider)} · click any field to edit</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => copy(allText(), 'all')} className={outlineBtn}>{Icon.copy} {copied === 'all' ? 'Copied!' : 'Copy all'}</button>
                  <button type="button" onClick={exportTxt} className={outlineBtn}>{Icon.download} Export .txt</button>
                  <button type="button" onClick={() => { setResult(null); setPriorOptions([]); }} className={`px-3 py-2 text-[13px] font-semibold ${muted} hover:text-ink dark:hover:text-night-ink`}>Clear</button>
                </div>
              </div>

              {/* Option routes */}
              <div className={`grid gap-4 ${cols}`}>
                {result.options.map((o, oi) => (
                  <div key={oi} className={`rounded-2xl p-5 flex flex-col gap-2 bg-ink text-white dark:bg-night-subtle dark:border dark:border-night-line-strong transition-opacity ${regenOption === oi ? 'opacity-50' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#BDBDC4]">Option {oi + 1}</span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => copy(optionText(o, oi), `opt-${oi}`)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20">{copied === `opt-${oi}` ? 'Copied' : 'Copy'}</button>
                        {n > 1 && (
                          <button type="button" onClick={() => handleNewOption(oi)} disabled={regenOption !== null || isGenerating}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 disabled:opacity-40 flex items-center gap-1.5">
                            {regenOption === oi && Icon.spinner}{regenOption === oi ? 'Writing…' : 'New option'}
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[15px] leading-snug text-[#E4E4E8]">{o.angle || '—'}</p>
                  </div>
                ))}
              </div>

              {/* One section per asset; options side by side */}
              {result.assets.map((a) => (
                <section key={a.id} className={`${card} px-[22px] py-5 flex flex-col gap-4`}>
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <h3 className="text-base font-extrabold tracking-[-0.01em]" title={a.placement || undefined}>{a.name}</h3>
                    {assetMeta(a) && <span className={`font-mono text-[11px] ${muted}`}>{assetMeta(a)}</span>}
                  </div>
                  <div className={`grid gap-x-6 gap-y-6 ${cols}`}>
                    {result.options.map((o, oi) => {
                      const fields = o.assets[a.id] || {};
                      return (
                        <div key={oi} className={`flex flex-col gap-3.5 transition-opacity ${regenOption === oi ? 'opacity-50 pointer-events-none' : ''}`}>
                          <div className="flex items-center justify-between">
                            <span className={eyebrow}>{n > 1 ? `Option ${oi + 1}` : 'Copy'}</span>
                            <button type="button" onClick={() => copy(assetText(a, fields), `${oi}-${a.id}`)} className={`flex items-center gap-1.5 px-1.5 py-1 text-xs font-semibold ${muted} hover:text-ink dark:hover:text-night-ink`}>
                              {Icon.copy}{copied === `${oi}-${a.id}` ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          {a.fields.map((f) => {
                            const lk = `${oi}:${a.id}:${f.key}`;
                            const busy = !!fieldLoading[lk];
                            const value = fields[f.key] || '';
                            const len = value.length;
                            const over = f.max && len > f.max;
                            const near = f.max && !over && len >= f.max * 0.9;
                            const rows = !f.max || f.max > 120 ? 4 : f.max > 45 ? 2 : 1;
                            const pct = f.max ? Math.min(100, Math.round((len / f.max) * 100)) : 0;
                            const weight = f.key === 'headline' ? 'text-[15px] font-bold' : f.key === 'eyebrow' || f.key === 'cta' ? 'text-[13.5px] font-semibold' : 'text-[13.5px]';
                            const border = busy ? 'border-accent/30 opacity-60' : over ? 'border-red-400 dark:border-red-500/70' : 'border-line dark:border-night-line focus:border-accent/60 dark:focus:border-accent-light/60';
                            const id = `f-${oi}-${a.id}-${f.key}`;
                            return (
                              <div key={f.key} className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <label htmlFor={id} className="text-xs font-bold text-[#3A3A42] dark:text-night-muted" title={f.notes || undefined}>{f.label}</label>
                                  <div className="flex items-center gap-2.5">
                                    {f.max && (
                                      <span className={`font-mono text-[11px] tabular-nums ${over ? 'text-red-600 dark:text-red-400 font-bold' : near ? 'text-amber-700 dark:text-amber-400 font-medium' : muted}`}>{len} / {f.max}</span>
                                    )}
                                    <button type="button" onClick={() => handleFieldRegen(oi, a.id, f.key)} disabled={busy} title="Rewrite just this field"
                                      className="flex items-center gap-1 px-1 py-0.5 text-xs font-semibold text-accent dark:text-accent-light hover:underline disabled:no-underline">
                                      {busy ? <>{Icon.spinner}<span className="sr-only">Rewriting</span></> : 'Redo'}
                                    </button>
                                  </div>
                                </div>
                                {rows === 1 ? (
                                  <input id={id} value={value} onChange={(e) => handleEdit(oi, a.id, f.key, e.target.value)} disabled={busy} className={`${fieldBox} ${weight} ${border}`} />
                                ) : (
                                  <textarea id={id} value={value} onChange={(e) => handleEdit(oi, a.id, f.key, e.target.value)} disabled={busy} rows={rows} className={`${fieldBox} ${weight} ${border} resize-y`} />
                                )}
                                {f.max && (
                                  <div className="h-[3px] rounded-sm bg-[#ECEBE7] dark:bg-night-line overflow-hidden">
                                    <div className={`h-full rounded-sm transition-all ${over ? 'bg-red-500' : near ? 'bg-amber-500' : 'bg-meter dark:bg-night-meter'}`} style={{ width: `${pct}%` }} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
