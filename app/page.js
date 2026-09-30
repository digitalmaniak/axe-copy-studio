'use client';

import { useState, useEffect, useRef } from 'react';
import { TONE_NAMES } from '@/lib/prompts';

// ─── Icons ───────────────────────────────────────────────────────────────────
const Icon = {
  refresh: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>),
  spinner: (<svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>),
  wand: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>),
  copy: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>),
  download: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>),
  small: (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6A6 6 0 102 9.5M13.5 6V2.5M13.5 6H10" /></svg>),
};

const card = 'bg-white dark:bg-[#141414] border border-[#e4e4e4] dark:border-[#242424] rounded-2xl';
const sectionLabel = 'block text-[11px] font-bold text-[#6b7280] uppercase tracking-widest';
const ghostBtn = 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#6b7280] hover:text-[#c8102e] border border-[#e4e4e4] dark:border-[#2a2a2a] hover:border-[#c8102e]/40 rounded-lg transition-colors disabled:opacity-40';

function limitsSummary(a) {
  return a.fields.map((f) => `${f.label} ${f.max ?? '—'}`).join(' · ');
}

export default function CopyStudio() {
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
    el.style.height = `${Math.max(el.scrollHeight, 160)}px`;
  }, [brief]);

  const groups = assetTypes.reduce((acc, a) => { (acc[a.group] = acc[a.group] || []).push(a); return acc; }, {});
  const toggleAsset = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const orderedSelection = assetTypes.map((a) => a.id).filter((id) => selected.includes(id));
  const canGenerate = brief.trim() && orderedSelection.length > 0 && provider && !isGenerating && !matrixLoading;

  // ── Messaging matrix file ──────────────────────────────────────────────────
  const handleMatrixFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setShowMatrix(true);
    const isPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
    if (isPdf) {
      setMatrixLoading(true); setMatrixName(f.name); setMessagingMatrix('');
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = String(reader.result).split(',')[1];
          const res = await fetch('/api/extract-pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ base64 }) });
          const d = await res.json();
          if (!d.success) throw new Error(d.error || 'Extraction failed');
          setMessagingMatrix(d.text || '');
        } catch (err) { alert(`Couldn't read that PDF: ${err.message}`); setMatrixName(''); }
        finally { setMatrixLoading(false); }
      };
      reader.readAsDataURL(f);
    } else {
      const reader = new FileReader();
      reader.onload = () => { setMessagingMatrix(String(reader.result || '')); setMatrixName(f.name); };
      reader.readAsText(f);
    }
    e.target.value = '';
  };
  const clearMatrix = () => { setMessagingMatrix(''); setMatrixName(''); setMatrixLoading(false); };

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
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
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
  const cols = n >= 3 ? 'md:grid-cols-3' : n === 2 ? 'md:grid-cols-2' : 'grid-cols-1';
  const providerLabel = (id) => providers.find((p) => p.id === id)?.label || id;

  return (
    <main className="min-h-screen">
      <div className="max-w-[1200px] mx-auto px-6 py-14">

        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 bg-[#c8102e] rounded-xl flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.6} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
          </div>
          <span className="text-base font-bold tracking-wide">AXE Copy Studio</span>
          <span className="text-[10px] font-bold text-[#c8102e] border border-[#c8102e] rounded px-2 py-0.5 tracking-wide">Prototype</span>
        </div>

        <h1 className="text-[2.4rem] font-bold leading-tight mb-2">What are we writing today?</h1>
        <p className="text-[#6b7280] text-lg mb-10">Paste the brief, pick the copy assets, and get on-brand LG copy sized to every placement.</p>

        {setupError && <div className="mb-6 p-4 rounded-xl border border-[#c8102e]/30 bg-[#fff5f5] dark:bg-[#1a0808] text-xs font-semibold text-red-500">{setupError}</div>}
        {!setupError && providers.length === 0 && assetTypes.length > 0 && (
          <div className="mb-6 p-4 rounded-xl border border-amber-300 bg-amber-50 dark:bg-[#2a1f06] text-xs font-semibold text-amber-700 dark:text-amber-400">No AI provider configured — add ANTHROPIC_API_KEY and/or OPENAI_API_KEY in the environment.</div>
        )}

        {/* 1 · Brief */}
        <div className="mb-6">
          <label className={`${sectionLabel} mb-2`}>1 · Creative brief</label>
          <textarea ref={briefRef} value={brief} onChange={(e) => setBrief(e.target.value)} spellCheck
            placeholder="Paste the creative brief — BU, category, products/models, promotion details and dates, audience, priority message, copy direction, legal notes…"
            className="w-full min-h-[160px] overflow-hidden bg-white dark:bg-[#141414] border border-[#e4e4e4] dark:border-[#242424] rounded-xl px-4 py-3 text-sm leading-relaxed placeholder-[#9ca3af] focus:outline-none focus:border-[#c8102e]/50 resize-none" />
        </div>

        {/* Messaging matrix (optional) */}
        <div className="mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={() => setShowMatrix((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${(matrixName || messagingMatrix) ? 'border-[#c8102e]/50 text-[#c8102e] bg-[#fff5f5] dark:bg-[#1a0808]' : 'bg-white dark:bg-[#141414] border-[#e4e4e4] dark:border-[#242424] text-[#6b7280] hover:text-[#111111] dark:hover:text-white hover:border-[#b8b8b8]'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
              {(matrixName || messagingMatrix) ? 'Messaging matrix attached' : 'Attach messaging matrix'}
            </button>
            <span className="text-[10px] text-[#9ca3af]">optional · adds depth from pillars, proof points & approved language</span>
            {(matrixName || messagingMatrix) && <button type="button" onClick={clearMatrix} className="text-[10px] font-semibold text-[#9ca3af] hover:text-[#c8102e]">clear</button>}
          </div>
          {showMatrix && (
            <div className={`${card} mt-3 p-4`}>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-3">
                    <label className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${matrixLoading ? 'border-[#e4e4e4] text-[#9ca3af] cursor-wait' : 'border-[#e4e4e4] dark:border-[#242424] text-[#6b7280] hover:text-[#111111] dark:hover:text-white hover:border-[#b8b8b8] cursor-pointer'}`}>
                      <input type="file" accept=".pdf,.txt,.csv,.tsv,.md,application/pdf,text/plain,text/csv" className="hidden" onChange={handleMatrixFile} disabled={matrixLoading} />
                      {Icon.download} Upload file
                    </label>
                    {matrixLoading
                      ? <span className="text-[10px] font-semibold text-[#c8102e]">Extracting PDF…</span>
                      : matrixName && <span className="text-[10px] text-[#9ca3af]">Loaded: <span className="font-semibold text-[#374151] dark:text-[#9ca3af]">{matrixName}</span></span>}
                  </div>
                  <textarea value={messagingMatrix} onChange={(e) => { setMessagingMatrix(e.target.value); if (matrixName) setMatrixName(''); }} rows={5}
                    placeholder="…or paste your messaging matrix here. Pasting straight from Excel works."
                    className="w-full bg-[#f9f9f9] dark:bg-[#0d0d0d] border border-[#e4e4e4] dark:border-[#242424] rounded-lg px-3 py-2.5 text-xs placeholder-[#9ca3af] focus:outline-none focus:border-[#c8102e]/50 resize-y" />
                </div>
                <div className="sm:w-44 flex-shrink-0 sm:border-l sm:border-[#f0f0f0] sm:dark:border-[#1f1f1f] sm:pl-4">
                  <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wide mb-1.5">Accepted</p>
                  <ul className="space-y-1 text-[11px] text-[#6b7280] dark:text-[#9ca3af]">
                    <li>• PDF <span className="text-[#9ca3af]">(.pdf)</span></li>
                    <li>• Text <span className="text-[#9ca3af]">(.txt, .md)</span></li>
                    <li>• CSV / TSV <span className="text-[#9ca3af]">(.csv, .tsv)</span></li>
                    <li>• …or paste it in</li>
                  </ul>
                  <p className="text-[10px] text-[#9ca3af] mt-2 leading-snug">PDFs are read automatically. Excel → export CSV or paste.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2 · Asset types */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <label className={sectionLabel}>2 · Copy types <span className="font-normal normal-case tracking-normal text-[#9ca3af]">— select one or more</span></label>
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="text-[#9ca3af]">{orderedSelection.length} selected</span>
              <button onClick={() => setSelected(assetTypes.map((a) => a.id))} className="text-[#6b7280] hover:text-[#c8102e]">Select all</button>
              <button onClick={() => setSelected([])} className="text-[#6b7280] hover:text-[#c8102e]">Clear</button>
            </div>
          </div>
          {assetTypes.length === 0 && !setupError && <p className="text-xs text-[#9ca3af]">Loading copy types…</p>}
          {Object.entries(groups).map(([group, list]) => (
            <div key={group} className="mb-4">
              <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mb-2">{group}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {list.map((a) => {
                  const on = selected.includes(a.id);
                  return (
                    <button key={a.id} type="button" onClick={() => toggleAsset(a.id)}
                      className={`text-left p-4 rounded-2xl border transition-all ${on ? 'border-[#c8102e]/60 bg-[#fff5f5] dark:bg-[#1a0808]' : 'bg-white dark:bg-[#141414] border-[#e4e4e4] dark:border-[#242424] hover:border-[#c8102e]/30'}`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className={`text-sm font-bold leading-snug ${on ? 'text-[#c8102e]' : ''}`}>{a.name}</span>
                        <span className={`w-4 h-4 mt-0.5 flex-shrink-0 rounded border flex items-center justify-center text-[10px] font-bold ${on ? 'bg-[#c8102e] border-[#c8102e] text-white' : 'border-[#d1d5db] dark:border-[#3a3a3a]'}`}>{on ? '✓' : ''}</span>
                      </div>
                      <p className="text-[11px] text-[#6b7280] dark:text-[#9ca3af] leading-snug">{a.placement}{a.dimensions ? ` · ${a.dimensions}` : ''}</p>
                      <p className="text-[10px] font-mono text-[#9ca3af] mt-1.5">{limitsSummary(a)}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 3 · Settings */}
        <div className={`${card} p-5 mb-6 flex flex-wrap items-start gap-x-10 gap-y-5`}>
          <div>
            <label className={`${sectionLabel} mb-2`}>3 · Tone</label>
            <div className="flex gap-2 flex-wrap">
              {TONE_NAMES.map((t) => (
                <button key={t} onClick={() => setTone(t)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${tone === t ? 'bg-[#c8102e] text-white' : 'bg-[#f9f9f9] dark:bg-[#0d0d0d] border border-[#e4e4e4] dark:border-[#242424] text-[#6b7280] hover:text-[#111111] dark:hover:text-white'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className={`${sectionLabel} mb-2`}>Options</label>
            <select value={variantCount} onChange={(e) => setVariantCount(Number(e.target.value))} disabled={isGenerating}
              className="bg-[#f9f9f9] dark:bg-[#0d0d0d] border border-[#e4e4e4] dark:border-[#242424] rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-[#c8102e]/50">
              <option value={1}>1 option</option>
              <option value={2}>2 options</option>
              <option value={3}>3 options</option>
            </select>
            <p className="text-[10px] text-[#9ca3af] mt-1">each a distinctly different route</p>
          </div>
          <div>
            <label className={`${sectionLabel} mb-2`}>Model</label>
            {providers.length > 1 ? (
              <div className="flex items-center bg-[#f9f9f9] dark:bg-[#0d0d0d] border border-[#e4e4e4] dark:border-[#242424] rounded-lg p-0.5">
                {providers.map((p) => (
                  <button key={p.id} onClick={() => setProvider(p.id)} title={p.model}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${provider === p.id ? 'bg-[#c8102e] text-white' : 'text-[#6b7280] hover:text-[#111111] dark:hover:text-white'}`}>{p.label}</button>
                ))}
              </div>
            ) : (
              <p className="text-xs font-semibold text-[#6b7280] py-1.5">{providers[0] ? providers[0].label : '—'}</p>
            )}
          </div>
        </div>

        {/* Generate / Regenerate all */}
        <button onClick={handleGenerate} disabled={!canGenerate}
          className={`w-full py-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${canGenerate ? 'bg-[#c8102e] text-white hover:bg-[#a80e26] shadow-lg shadow-[#c8102e]/20' : 'bg-white dark:bg-[#141414] text-[#9ca3af] border border-[#e4e4e4] dark:border-[#242424] cursor-not-allowed'}`}>
          {isGenerating
            ? <>{Icon.spinner} Writing {variantCount > 1 ? `${variantCount} options` : 'copy'} for {orderedSelection.length} asset{orderedSelection.length !== 1 ? 's' : ''}…</>
            : result
              ? <>{Icon.refresh} Regenerate all — new, different options</>
              : <>{Icon.wand} Generate {variantCount > 1 ? `${variantCount} options` : 'copy'}{orderedSelection.length ? ` for ${orderedSelection.length} asset${orderedSelection.length !== 1 ? 's' : ''}` : ''}</>}
        </button>
        {!brief.trim() || orderedSelection.length === 0 ? (
          <p className="text-[11px] text-[#9ca3af] mt-2 text-center">{!brief.trim() ? 'Paste a brief' : ''}{!brief.trim() && orderedSelection.length === 0 ? ' and ' : ''}{orderedSelection.length === 0 ? 'select at least one copy type' : ''} to generate.</p>
        ) : isGenerating ? (
          <p className="text-[11px] text-[#9ca3af] mt-2 text-center">Multi-asset sets can take up to a minute.</p>
        ) : null}

        {error && <div className="mt-6 p-4 bg-[#fff5f5] dark:bg-[#1a0808] border border-[#c8102e]/30 rounded-xl text-xs font-semibold text-red-500">Something went wrong: {error}</div>}

        {/* ── Results ─────────────────────────────────────────────────────── */}
        {result && (
          <div ref={resultsRef} className="mt-12 scroll-mt-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div>
                <p className="text-xs font-bold text-[#c8102e] uppercase tracking-widest">{n} option{n !== 1 ? 's' : ''} · {result.assets.length} asset{result.assets.length !== 1 ? 's' : ''}</p>
                <p className="text-[11px] text-[#9ca3af] mt-0.5">{tone} tone · written by {providerLabel(result.provider)} · edit anything inline</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => copy(allText(), 'all')} className={ghostBtn}>{Icon.copy} {copied === 'all' ? 'Copied!' : 'Copy all'}</button>
                <button onClick={exportTxt} className={ghostBtn}>{Icon.download} Export .txt</button>
                <button onClick={() => { setResult(null); setPriorOptions([]); }} className="text-[11px] font-semibold text-[#9ca3af] hover:text-[#c8102e] px-2">Clear</button>
              </div>
            </div>

            {/* Option headers */}
            <div className={`grid gap-4 mb-4 ${cols}`}>
              {result.options.map((o, oi) => (
                <div key={oi} className={`${card} p-4 ${regenOption === oi ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-widest">Option {oi + 1}</span>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => copy(optionText(o, oi), `opt-${oi}`)} className="text-[10px] font-semibold text-[#9ca3af] hover:text-[#c8102e] flex items-center gap-1">{Icon.copy}{copied === `opt-${oi}` ? 'Copied' : 'Copy'}</button>
                      {n > 1 && (
                        <button onClick={() => handleNewOption(oi)} disabled={regenOption !== null || isGenerating}
                          className="text-[10px] font-semibold text-[#9ca3af] hover:text-[#c8102e] flex items-center gap-1 disabled:opacity-40">
                          <span className={regenOption === oi ? 'animate-spin' : ''}>{Icon.small}</span>{regenOption === oi ? 'Writing…' : 'New option'}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] leading-snug">{o.angle || '—'}</p>
                </div>
              ))}
            </div>

            {/* One section per asset; options side by side for comparison */}
            <div className="space-y-5">
              {result.assets.map((a) => (
                <div key={a.id} className={`${card} p-5`}>
                  <div className="mb-4">
                    <p className="text-sm font-bold">{a.name}</p>
                    <p className="text-[11px] text-[#9ca3af]">{[a.placement, a.dimensions, a.cta && `CTA: ${a.cta}`].filter(Boolean).join(' · ')}</p>
                  </div>
                  <div className={`grid gap-4 ${cols}`}>
                    {result.options.map((o, oi) => {
                      const fields = o.assets[a.id] || {};
                      return (
                        <div key={oi} className={`rounded-xl border border-[#f0f0f0] dark:border-[#1f1f1f] p-3 ${regenOption === oi ? 'opacity-50 pointer-events-none' : ''}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">{n > 1 ? `Option ${oi + 1}` : 'Copy'}</span>
                            <button onClick={() => copy(assetText(a, fields), `${oi}-${a.id}`)} className="text-[10px] font-semibold text-[#9ca3af] hover:text-[#c8102e] flex items-center gap-1">{Icon.copy}{copied === `${oi}-${a.id}` ? 'Copied' : 'Copy'}</button>
                          </div>
                          <div className="space-y-3">
                            {a.fields.map((f) => {
                              const lk = `${oi}:${a.id}:${f.key}`;
                              const busy = !!fieldLoading[lk];
                              const value = fields[f.key] || '';
                              const len = value.length;
                              const over = f.max && len > f.max;
                              const near = f.max && len >= f.max * 0.9;
                              const rows = !f.max || f.max > 120 ? 4 : f.max > 45 ? 2 : 1;
                              const inputCls = `w-full bg-[#f9f9f9] dark:bg-[#0d0d0d] border rounded-lg px-2.5 py-2 text-sm leading-relaxed focus:outline-none transition-colors ${busy ? 'border-[#c8102e]/30 opacity-60' : over ? 'border-red-400' : 'border-[#e4e4e4] dark:border-[#242424] focus:border-[#c8102e]/50'}`;
                              return (
                                <div key={f.key}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider" title={f.notes}>{f.label}</span>
                                    <div className="flex items-center gap-2.5">
                                      {f.max && <span className={`text-[10px] font-mono tabular-nums ${over ? 'text-red-500 font-bold' : near ? 'text-amber-500' : 'text-[#c0c0c0] dark:text-[#4b5563]'}`}>{len}/{f.max}</span>}
                                      <button onClick={() => handleFieldRegen(oi, a.id, f.key)} disabled={busy} title="Rewrite just this field"
                                        className={`flex items-center gap-1 text-[10px] font-medium ${busy ? 'text-[#c8102e]' : 'text-[#c0c0c0] dark:text-[#4b5563] hover:text-[#c8102e]'}`}>
                                        <span className={busy ? 'animate-spin' : ''}>{Icon.small}</span>{busy ? '…' : 'Redo'}
                                      </button>
                                    </div>
                                  </div>
                                  {rows === 1 ? (
                                    <input value={value} onChange={(e) => handleEdit(oi, a.id, f.key, e.target.value)} disabled={busy} className={inputCls} />
                                  ) : (
                                    <textarea value={value} onChange={(e) => handleEdit(oi, a.id, f.key, e.target.value)} disabled={busy} rows={rows} className={`${inputCls} resize-y`} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
