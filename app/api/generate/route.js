import { getAssetTypes } from '@/lib/assetTypes';
import { readBrandKnowledge } from '@/lib/knowledge';
import { callLLM, parseJSON, resolveProvider, PROVIDERS } from '@/lib/llm';
import { buildSystemPrompt, buildGenerateUser, buildRepairUser } from '@/lib/prompts';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // multi-asset × up to 3 options, plus optional retry + limit repair

// ─── Generate copy ───────────────────────────────────────────────────────────
// One brief → 1–3 distinct creative options, each covering every selected asset.
// Body: { brief, tone, assetIds[], variantCount, provider, messagingMatrix, priorOptions[] }
// Returns: { options: [{ angle, assets: { [assetId]: { [fieldKey]: text } } }], assets (specs), provider, model }
// ─────────────────────────────────────────────────────────────────────────────

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
const jaccard = (a, b) => {
  const A = new Set(a), B = new Set(b);
  if (!A.size && !B.size) return 0;
  const inter = [...A].filter((x) => B.has(x)).length;
  return inter / new Set([...A, ...B]).size;
};
const signature = (o) => norm([o.angle, ...Object.values(o.assets || {}).map((f) => `${f?.headline || ''} ${f?.body || ''}`)].join(' '));

function normalize(parsed, assets, n) {
  const raw = Array.isArray(parsed?.options) ? parsed.options : [];
  return raw.slice(0, n).map((o) => ({
    angle: String(o?.angle || '').trim(),
    assets: Object.fromEntries(assets.map((a) => [
      a.id,
      Object.fromEntries(a.fields.map((f) => [f.key, String(o?.assets?.[a.id]?.[f.key] ?? '').trim()])),
    ])),
  }));
}

function tooSimilar(options, prior) {
  const sigs = options.map(signature);
  for (let i = 0; i < sigs.length; i++) for (let j = i + 1; j < sigs.length; j++) if (jaccard(sigs[i], sigs[j]) > 0.6) return true;
  const priorSigs = prior.map(signature);
  return sigs.some((s) => priorSigs.some((p) => jaccard(s, p) > 0.55));
}

function findViolations(options, assets) {
  const out = [];
  options.forEach((o, oi) => assets.forEach((a) => a.fields.forEach((f) => {
    const value = o.assets[a.id]?.[f.key] || '';
    if (f.max && value.length > f.max) out.push({ oi, assetId: a.id, key: f.key, assetName: a.name, label: f.label, max: f.max, value });
  })));
  return out;
}

export async function POST(request) {
  try {
    const { brief, tone, assetIds = [], variantCount = 1, provider: requested, messagingMatrix = '', priorOptions = [] } = await request.json();
    if (!brief?.trim()) return Response.json({ success: false, error: 'Paste a brief first.' }, { status: 400 });

    const assets = getAssetTypes(Array.isArray(assetIds) ? assetIds : []);
    if (!assets.length) return Response.json({ success: false, error: 'Select at least one copy type.' }, { status: 400 });

    const provider = resolveProvider(requested);
    if (!provider) return Response.json({ success: false, error: 'No AI provider configured — set ANTHROPIC_API_KEY and/or OPENAI_API_KEY.' }, { status: 500 });

    const n = Math.max(1, Math.min(3, parseInt(variantCount, 10) || 1));
    const prior = Array.isArray(priorOptions) ? priorOptions.filter(Boolean) : [];
    const system = buildSystemPrompt({ brand: readBrandKnowledge(), assets });
    const maxTokens = Math.min(8000, 800 + n * assets.length * 260);
    const varied = n > 1 || prior.length > 0;

    const run = async (boost) => {
      const raw = await callLLM({
        provider, system, maxTokens, temperature: varied ? 1 : 0.7,
        user: buildGenerateUser({ brief, tone, matrix: messagingMatrix, n, assets, prior, boost }),
      });
      return normalize(parseJSON(raw), assets, n);
    };

    let options = await run(false);
    if (!options.length) throw new Error('The model returned no options — try again.');

    // Options (or a regeneration) came back too alike → one harder retry.
    if (varied && tooSimilar(options, prior)) {
      try { const retry = await run(true); if (retry.length) options = retry; }
      catch (e) { console.error('[/api/generate] divergence retry failed:', e.message); }
    }

    // Any field over its hard character limit → one targeted repair pass.
    const violations = findViolations(options, assets);
    if (violations.length) {
      try {
        const raw = await callLLM({ provider, system, maxTokens: 400 + violations.length * 120, temperature: 0.3, user: buildRepairUser(violations) });
        const fixes = parseJSON(raw)?.fixes || [];
        for (const fix of fixes) {
          const v = violations[Number(fix?.i)];
          const value = String(fix?.value || '').trim();
          if (v && value && value.length <= v.max) options[v.oi].assets[v.assetId][v.key] = value;
        }
      } catch (e) { console.error('[/api/generate] limit repair failed:', e.message); }
    }

    return Response.json({ success: true, options, assets, provider, model: PROVIDERS[provider].model });
  } catch (err) {
    console.error('[/api/generate]', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
