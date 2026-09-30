// ─── Prompt builders ─────────────────────────────────────────────────────────
// System prompt = LG brand knowledge (Doc 1) + general copy rules + the specs and
// approved examples of ONLY the assets being written (Doc 2).
// ─────────────────────────────────────────────────────────────────────────────

const GENERAL_RULES = `GENERAL COPY RULES (apply to every asset):
- The asset specs below are authoritative. Character limits are HARD maximums — count every character, including spaces and punctuation, and stay under. If an asset spec ever conflicts with a generic rule in the brand knowledge, the asset spec wins.
- Write only the fields listed for each asset. Use an empty string for an optional field you choose to leave out.
- Use the brief's real numbers, products, dates and offer terms. When a figure isn't given, use the placeholders "XX%" or "$XX". Never invent prices, dates, gift-card values, or terms that aren't in the brief.
- Never start a headline with "Discover", "Introducing", "Welcome to", or "Get ready for".
- Open body copy on the experience or benefit, not a flat product name. Weave in one or two concrete proof points from the brief, then the offer; compress qualifiers inline ("on select models", "Terms may apply.").
- Eyebrows are short and UPPERCASE.
- Within one option, keep ONE creative angle consistent across every asset, but adapt each asset to its role and space: heroes tell the fullest story, cards and tiles are offer-forward and punchy, mini cards carry the offer in one tight line.
- The approved examples show LG's real cadence and structure — match their spirit, never copy them.`;

const TONES = {
  Premium: 'refined, confident, elevated but warm',
  Punchy: 'short, energetic, rhythmic — lead with the payoff',
  Seasonal: 'tie the message to the moment or season naturally',
  Bold: 'high-confidence, big claims backed by proof',
  Urgent: 'time-sensitive and action-driving, never cheap or shouty',
};
export const TONE_NAMES = Object.keys(TONES);

export function assetSpec(a) {
  const meta = [
    a.placement && `Placement: ${a.placement}`,
    a.dimensions && `Dimensions: ${a.dimensions}`,
    a.channels && `Channels: ${a.channels}`,
    a.cta && `CTA: ${a.cta}`,
  ].filter(Boolean).join(' · ');
  const fields = a.fields
    .map((f) => `- ${f.key} (${f.label}): ${f.max ? `max ${f.max} characters` : 'no fixed limit'}${f.notes ? ` — ${f.notes}` : ''}`)
    .join('\n');
  const guidelines = a.guidelines.length ? `Guidelines:\n${a.guidelines.map((g) => `- ${g}`).join('\n')}` : '';
  const examples = a.examples.length
    ? `Approved examples:\n${a.examples.map((e) => `- ${Object.entries(e.values).map(([k, v]) => `${k}: ${v}`).join(' | ')}`).join('\n')}`
    : '';
  return [`### ${a.name}  (id: ${a.id})`, meta, `Fields:\n${fields}`, guidelines, examples].filter(Boolean).join('\n');
}

export function buildSystemPrompt({ brand, assets }) {
  return `You are an expert LG copywriter on the HSAD Creative Services team, writing on-brand copy for LG.com, partner stores, and social placements.
${brand ? `\nThe following LG brand knowledge is your foundation — follow its voice, vocabulary, guardrails and category nuance in everything you write:\n\n${brand}\n\n---\n` : ''}
${GENERAL_RULES}

ASSET SPECS (write exactly these fields, within these limits):

${assets.map(assetSpec).join('\n\n')}`;
}

function matrixBlock(matrix, cap = 8000) {
  const m = typeof matrix === 'string' ? matrix.trim() : '';
  return m
    ? `\n\nMESSAGING MATRIX (authoritative strategic input — prioritize its pillars, proof points, differentiators and approved language; pull specific claims and numbers from it where relevant):\n${m.slice(0, cap)}`
    : '';
}

function toneLine(tone) {
  return tone && TONES[tone] ? `${tone} — ${TONES[tone]}` : 'Confident and on-brand';
}

/** Summarize prior options so a regeneration can steer away from them. */
export function describeOptions(options = []) {
  return options
    .filter(Boolean)
    .map((o, i) => {
      const heads = Object.values(o.assets || {})
        .map((f) => f?.headline || f?.body || '')
        .filter(Boolean)
        .slice(0, 3)
        .join(' / ');
      return `  ${i + 1}. Angle: ${o.angle || '—'} | ${heads}`;
    })
    .join('\n');
}

export function buildGenerateUser({ brief, tone, matrix, n, assets, prior = [], boost = false }) {
  const schemaAssets = assets
    .map((a) => `      "${a.id}": { ${a.fields.map((f) => `"${f.key}": "…"`).join(', ')} }`)
    .join(',\n');
  const priorText = describeOptions(prior);
  const divergence = priorText
    ? `\n\nREGENERATE — the copywriter wants genuinely DIFFERENT routes, not rephrasings. Do NOT reuse the angle, hook, lead benefit, headline structure or phrasing of any of these previous options:\n${priorText}`
    : '';
  const multi = n > 1
    ? `\n\nWrite ${n} DISTINCT options. Each option is a different creative route — a different angle, primary hook (benefit vs offer vs brand vs wordplay), lead benefit, and headline structure — that a copywriter would present side by side. Not rewordings of one idea.`
    : '';
  const push = boost ? '\n\nYour previous attempt was still too similar (to another option or an earlier one) — change the underlying concept, not just the words.' : '';

  return `BRIEF:
${String(brief).trim()}

TONE: ${toneLine(tone)}${matrixBlock(matrix)}${divergence}${multi}${push}

Write copy for these assets: ${assets.map((a) => a.name).join(', ')}.

Return ONLY valid JSON, no preamble. "options" must contain exactly ${n} object(s), and every option must include every asset below with every listed field:

{
  "options": [
    {
      "angle": "<3–8 word summary of this option's creative angle>",
      "assets": {
${schemaAssets}
      }
    }
  ]
}`;
}

export function buildRepairUser(violations) {
  const list = violations
    .map((v, i) => `${i}. [${v.assetName} → ${v.label}] max ${v.max} characters (currently ${v.value.length}): "${v.value}"`)
    .join('\n');
  return `These fields exceed their HARD character limits. Rewrite each one so it fits within its limit while keeping the meaning, voice, and every offer detail (numbers, placeholders, terms). Shorter is fine; don't pad.

${list}

Return ONLY valid JSON: { "fixes": [ { "i": <number>, "value": "<rewritten text>" } ] }`;
}

export function buildFieldUser({ brief, tone, matrix, asset, field, current }) {
  const others = asset.fields
    .filter((f) => f.key !== field.key && current?.[f.key])
    .map((f) => `${f.label}: ${current[f.key]}`)
    .join('\n');
  return `BRIEF:
${String(brief || '').trim() || '(see the other fields for context)'}

TONE: ${toneLine(tone)}${matrixBlock(matrix, 6000)}

Asset: ${asset.name}. The other fields are already written — stay consistent with their angle and tone:
${others || '(none)'}

Rewrite ONLY the "${field.label}" field (${field.max ? `max ${field.max} characters` : 'no fixed limit'}${field.notes ? ` — ${field.notes}` : ''}).
Current value: "${current?.[field.key] || ''}"
Make it meaningfully different — vary the hook or phrasing.

Return ONLY valid JSON: { "value": "<new text>" }`;
}
