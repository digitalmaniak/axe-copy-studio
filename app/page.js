'use client';

import { useState, useEffect, useRef } from 'react';
import { TONE_NAMES } from '@/lib/prompts';
import { useTheme } from '@/components/ThemeProvider';

// ─── Icons (Lucide · 24px grid · 1.75 stroke — see AXE Style Guide §05) ─────────
const ic = (children, size = '') => <svg viewBox="0 0 24 24" className={`i ${size}`} aria-hidden="true">{children}</svg>;
const Icon = {
  pen: ic(<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />),
  sparkles: ic(<><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /><path d="M20 3v4" /><path d="M22 5h-4" /><path d="M4 17v2" /><path d="M5 18H3" /></>),
  sparklesLg: ic(<><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /><path d="M20 3v4" /><path d="M22 5h-4" /><path d="M4 17v2" /><path d="M5 18H3" /></>, 'lg'),
  refresh: ic(<><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></>),
  copy: ic(<><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></>, 'sm'),
  download: ic(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /><path d="M12 15V3" /></>, 'sm'),
  upload: ic(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5" /><path d="M12 3v12" /></>, 'sm'),
  doc: ic(<><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></>),
  x: ic(<><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>, 'sm'),
  moon: ic(<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />, 'sm'),
  sun: ic(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></>, 'sm'),
  alert: ic(<><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></>),
  warn: ic(<><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" /></>),
  check: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  spinner: <span className="spin" aria-hidden="true" />,
};

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

  // ── Usage tracking hints (stored server-side by /api/generate → lib/tracking.js) ─
  // Anonymous per-browser id (no personal data) + where the messaging matrix came from.
  const browserId = () => {
    try {
      let id = localStorage.getItem('cs_browser_id');
      if (!id) { id = crypto.randomUUID(); localStorage.setItem('cs_browser_id', id); }
      return id;
    } catch { return null; }
  };
  const matrixSource = () => (!messagingMatrix.trim() ? null : matrixName ? (matrixName.split('.').pop() || 'file').toLowerCase() : 'pasted');

  // ── Generation ─────────────────────────────────────────────────────────────
  const callGenerate = async (body, trigger) => {
    const tracking = { trigger, sessionId: browserId(), matrixSource: matrixSource() };
    const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, tracking }) });
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
      const data = await callGenerate({ brief, tone, assetIds: orderedSelection, variantCount, provider, messagingMatrix, priorOptions: prior }, result ? 'regenerate_all' : 'generate');
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
      const data = await callGenerate({ brief, tone, assetIds: result.assets.map((a) => a.id), variantCount: 1, provider: result.provider, messagingMatrix, priorOptions: [...others, ...priorOptions].slice(0, 6) }, 'new_option');
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
    'HSAD COPY STUDIO — AX ENABLEMENT',
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
      <header className="topbar">
        <div className="max-w-[1280px] h-full mx-auto px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="logo">{Icon.pen}</div>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="text-[17px] font-extrabold tracking-[-0.02em] whitespace-nowrap truncate">HSAD Copy Studio</span>
              <span className="text-xs text-ink-3 whitespace-nowrap truncate">Developed by <b className="font-bold">AX<span className="text-accent-text">E</span></b> Team</span>
            </div>
            <span className="badge b-accent hidden sm:inline-flex ml-1.5">Prototype</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {providers.length > 1 ? (
              <>
                <span className="tag-mono hidden sm:inline">Model</span>
                <div className="seg" role="group" aria-label="Model">
                  {providers.map((p) => (
                    <button key={p.id} type="button" onClick={() => setProvider(p.id)} title={p.displayModel || p.model} aria-pressed={provider === p.id}>{p.label}</button>
                  ))}
                </div>
              </>
            ) : providers[0] ? (
              <span className="spec" title={providers[0].displayModel || providers[0].model}>{providers[0].label}</span>
            ) : null}
            <button type="button" onClick={toggleTheme} aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'} className="btn btn-secondary btn-icon">
              {theme === 'light' ? Icon.moon : Icon.sun}
            </button>
          </div>
        </div>
      </header>

      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 pt-6 pb-12 flex flex-col lg:flex-row gap-4 items-start">

        {/* ── Composer ──────────────────────────────────────────────────────── */}
        <aside className="card w-full lg:w-[420px] lg:flex-shrink-0 lg:sticky lg:top-[80px] lg:max-h-[calc(100vh-96px)] lg:overflow-y-auto p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h1 className="h2">What are we writing?</h1>
            <p className="text-[13px] text-ink-2">Brief in, on-brand LG copy out — sized to every placement.</p>
          </div>

          {setupError && (
            <div className="alert danger">{Icon.alert}<div><b>Couldn&apos;t load copy types</b><p>{setupError}</p></div></div>
          )}
          {!setupError && providers.length === 0 && assetTypes.length > 0 && (
            <div className="alert warning">{Icon.warn}<div><b>No AI provider configured</b><p>Add ANTHROPIC_API_KEY and/or OPENAI_API_KEY in the environment.</p></div></div>
          )}

          {/* Brief + matrix */}
          <div className="flex flex-col gap-2">
            <label htmlFor="brief" className="field-label">Creative brief</label>
            <textarea id="brief" ref={briefRef} value={brief} onChange={(e) => setBrief(e.target.value)} spellCheck
              placeholder="Paste the creative brief — BU, category, products/models, promotion details and dates, audience, priority message, copy direction, legal notes…"
              className="textarea min-h-[150px] overflow-hidden resize-none leading-[1.55]" />

            {!showMatrix && !hasMatrix && (
              <button type="button" onClick={() => setShowMatrix(true)} className="drop w-full flex items-center gap-3 px-3.5 py-3 text-left">
                <span className="text-ink-3">{Icon.doc}</span>
                <span className="flex flex-col">
                  <span className="text-[13px] font-semibold">Attach messaging matrix</span>
                  <span className="text-xs text-ink-3">Optional · pillars, proof points, approved language</span>
                </span>
              </button>
            )}

            {!showMatrix && hasMatrix && (
              <div className="flex items-center justify-between gap-2.5 rounded-md border border-line bg-surface px-3.5 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={matrixLoading ? 'text-accent-text' : 'text-ink-3'}>{matrixLoading ? Icon.spinner : Icon.doc}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-semibold truncate">{matrixName || 'Pasted messaging matrix'}</span>
                    <span className={matrixLoading ? 'text-xs font-medium text-accent-text' : 'text-xs text-ink-3'}>
                      {matrixLoading ? 'Reading the PDF…' : <>Messaging matrix · <span className="mono">{messagingMatrix.length.toLocaleString()}</span> chars</>}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!matrixLoading && <button type="button" onClick={() => setShowMatrix(true)} className="btn btn-ghost btn-sm">Edit</button>}
                  <button type="button" onClick={clearMatrix} aria-label="Remove messaging matrix" className="btn btn-ghost btn-sm btn-icon">{Icon.x}</button>
                </div>
              </div>
            )}

            {showMatrix && (
              <div className="rounded-md border border-line bg-surface-2 p-3 flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="matrix" className="field-label">Messaging matrix</label>
                  <div className="flex items-center gap-1.5">
                    <label className="btn btn-secondary btn-sm">
                      <input type="file" accept=".pdf,.txt,.csv,.tsv,.md,application/pdf,text/plain,text/csv" className="sr-only" onChange={handleMatrixFile} />
                      {Icon.upload} Upload file
                    </label>
                    <button type="button" onClick={() => setShowMatrix(false)} className="btn btn-soft btn-sm">Done</button>
                  </div>
                </div>
                <textarea id="matrix" value={messagingMatrix} onChange={(e) => { setMessagingMatrix(e.target.value); if (matrixName) setMatrixName(''); }} rows={5}
                  placeholder="…or paste your messaging matrix here. Pasting straight from Excel works."
                  className="textarea text-[12.5px]" />
                <span className="hint">PDF, TXT, MD, CSV/TSV. PDFs are read automatically; from Excel, export CSV or paste.</span>
              </div>
            )}
          </div>

          {/* Copy types */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="field-label">Copy types</span>
              <div className="flex items-center gap-3">
                <span className="spec">{assetCount} / {assetTypes.length}</span>
                <button type="button" onClick={() => setSelected(assetTypes.map((a) => a.id))} className="btn-link">Select all</button>
                {assetCount > 0 && <button type="button" onClick={() => setSelected([])} className="btn-link">Clear</button>}
              </div>
            </div>
            {assetTypes.length === 0 && !setupError && <p className="hint">Loading copy types…</p>}
            {Object.entries(groups).map(([group, list]) => (
              <div key={group} className="flex flex-col gap-2">
                <span className="eyebrow mt-1">{group}</span>
                {list.map((a) => {
                  const on = selected.includes(a.id);
                  return (
                    <button key={a.id} type="button" onClick={() => toggleAsset(a.id)} aria-pressed={on} title={a.placement || undefined} className="choice">
                      <span className={`box ${on ? 'on' : ''}`}>{Icon.check}</span>
                      <span className="flex flex-col gap-0.5 min-w-0">
                        <span className="t">{a.name}</span>
                        <span className="spec">{limitsSummary(a)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Tone */}
          <div className="flex flex-col gap-2.5">
            <span className="field-label">Tone</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Tone">
              {TONE_NAMES.map((t) => (
                <button key={t} type="button" onClick={() => setTone(t)} aria-pressed={tone === t} className="chip">{t}</button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="field-label">Options</span>
              <span className="hint">Each a different creative route</span>
            </div>
            <div className="seg" role="group" aria-label="Number of options">
              {[1, 2, 3].map((k) => (
                <button key={k} type="button" onClick={() => setVariantCount(k)} disabled={isGenerating} aria-pressed={variantCount === k} className="w-10">{k}</button>
              ))}
            </div>
          </div>

          {/* Generate / Regenerate all */}
          <div className="flex flex-col gap-2">
            <button type="button" onClick={handleGenerate} disabled={!canGenerate} className="btn btn-primary btn-lg w-full">
              {isGenerating
                ? <>{Icon.spinner} Writing {variantCount > 1 ? plural(variantCount, 'option') : 'copy'}…</>
                : result
                  ? <>{Icon.refresh} Regenerate all</>
                  : <>{Icon.sparkles} Generate {variantCount > 1 ? plural(variantCount, 'option') : 'copy'}{assetCount ? ` · ${plural(assetCount, 'asset')}` : ''}</>}
            </button>
            <span className="hint text-center">
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
        <main ref={resultsRef} className="flex-1 min-w-0 w-full flex flex-col gap-4 scroll-mt-20">
          {error && (
            <div className="alert danger" role="alert">
              {Icon.alert}
              <div className="flex-1 min-w-0"><b>Something went wrong</b><p>{error}</p></div>
              <button type="button" onClick={() => setError(null)} aria-label="Dismiss error" className="btn btn-ghost btn-sm btn-icon -my-1 -mr-1">{Icon.x}</button>
            </div>
          )}

          {!result && !isGenerating && (
            <div className="empty bg-surface min-h-[420px] px-8">
              <div className="ic">{Icon.sparklesLg}</div>
              <h2 className="card-t">Your copy lands here</h2>
              <p className="text-[13px] text-ink-3 max-w-[420px]">Paste a brief, pick the copy types, and generate. Each option is a different creative route, shown side by side for every asset.</p>
            </div>
          )}

          {!result && isGenerating && (
            <div className="card min-h-[420px] p-6 flex flex-col gap-5" aria-live="polite">
              <div className="flex items-center gap-2.5 text-[13px] font-semibold text-accent-text">{Icon.spinner} Writing {variantCount > 1 ? plural(variantCount, 'option') : 'copy'} for {plural(assetCount, 'asset')}…</div>
              <div className={`grid gap-4 ${variantCount >= 3 ? 'md:grid-cols-2 xl:grid-cols-3' : variantCount === 2 ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                {Array.from({ length: variantCount }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-3">
                    <div className="skel h-24 rounded-lg" />
                    <div className="skel h-10 rounded-md" />
                    <div className="skel h-20 rounded-md" />
                    <div className="skel h-10 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {result && (
            <div className={`flex flex-col gap-4 transition-opacity ${isGenerating ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-end justify-between gap-4 flex-wrap">
                <div className="flex flex-col gap-1">
                  <h2 className="h2">{plural(n, 'option')} · {plural(result.assets.length, 'asset')}</h2>
                  <span className="text-[12.5px] text-ink-3">{tone} tone · written by {providerLabel(result.provider)} · click any field to edit</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => copy(allText(), 'all')} className="btn btn-secondary">{Icon.copy} {copied === 'all' ? 'Copied' : 'Copy all'}</button>
                  <button type="button" onClick={exportTxt} className="btn btn-secondary">{Icon.download} Export .txt</button>
                  <button type="button" onClick={() => { setResult(null); setPriorOptions([]); }} className="btn btn-ghost">Clear</button>
                </div>
              </div>

              {/* Option routes */}
              <div className={`grid gap-4 ${cols}`}>
                {result.options.map((o, oi) => (
                  <div key={oi} className={`card p-5 flex flex-col gap-3 transition-opacity ${regenOption === oi ? 'opacity-50' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="tag-mono text-accent-text">Option {String(oi + 1).padStart(2, '0')}</span>
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => copy(optionText(o, oi), `opt-${oi}`)} className="btn btn-secondary btn-sm">{Icon.copy}{copied === `opt-${oi}` ? 'Copied' : 'Copy'}</button>
                        {n > 1 && (
                          <button type="button" onClick={() => handleNewOption(oi)} disabled={regenOption !== null || isGenerating} className="btn btn-ghost btn-sm">
                            {regenOption === oi ? Icon.spinner : Icon.refresh}{regenOption === oi ? 'Writing…' : 'New option'}
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[15px] font-medium leading-snug tracking-[-0.01em]">{o.angle || '—'}</p>
                  </div>
                ))}
              </div>

              {/* One section per asset; options side by side */}
              {result.assets.map((a) => (
                <section key={a.id} className="card p-5 flex flex-col gap-4">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <h3 className="card-t" title={a.placement || undefined}>{a.name}</h3>
                    {assetMeta(a) && <span className="spec">{assetMeta(a)}</span>}
                  </div>
                  <div className={`grid gap-x-6 gap-y-6 ${cols}`}>
                    {result.options.map((o, oi) => {
                      const fields = o.assets[a.id] || {};
                      return (
                        <div key={oi} className={`flex flex-col gap-4 transition-opacity ${regenOption === oi ? 'opacity-50 pointer-events-none' : ''}`}>
                          <div className="flex items-center justify-between border-b border-line pb-2">
                            <span className="eyebrow">{n > 1 ? `Option ${String(oi + 1).padStart(2, '0')}` : 'Copy'}</span>
                            <button type="button" onClick={() => copy(assetText(a, fields), `${oi}-${a.id}`)} className="btn btn-ghost btn-sm -mr-2">
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
                            const weight = f.key === 'headline' ? 'text-[15px] font-semibold tracking-[-0.01em]' : f.key === 'eyebrow' || f.key === 'cta' ? 'font-medium' : '';
                            const state = `${over ? 'is-error' : ''} ${busy ? 'opacity-60' : ''}`;
                            const id = `f-${oi}-${a.id}-${f.key}`;
                            return (
                              <div key={f.key} className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <label htmlFor={id} className="field-label text-ink-2" title={f.notes || undefined}>{f.label}</label>
                                  <div className="flex items-center gap-3">
                                    {f.max && (
                                      <span className={`mono text-[11px] tabular-nums ${over ? 'text-danger font-semibold' : near ? 'text-warning font-medium' : 'text-ink-3'}`}>{len} / {f.max}</span>
                                    )}
                                    <button type="button" onClick={() => handleFieldRegen(oi, a.id, f.key)} disabled={busy} title="Rewrite just this field" className="btn-link">
                                      {busy ? <>{Icon.spinner}<span className="sr-only">Rewriting</span></> : 'Redo'}
                                    </button>
                                  </div>
                                </div>
                                {rows === 1 ? (
                                  <input id={id} value={value} onChange={(e) => handleEdit(oi, a.id, f.key, e.target.value)} disabled={busy} className={`input ${weight} ${state}`} />
                                ) : (
                                  <textarea id={id} value={value} onChange={(e) => handleEdit(oi, a.id, f.key, e.target.value)} disabled={busy} rows={rows} className={`textarea min-h-0 ${weight} ${state}`} />
                                )}
                                {f.max && (
                                  <div className={`meter ${over ? 'over' : near ? 'warn' : ''}`}><i style={{ width: `${pct}%` }} /></div>
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
