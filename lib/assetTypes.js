// ─── Asset-type registry (parsed from context/02_asset-types.md) ─────────────
// The copy team owns the asset definitions in markdown. This parser turns each
// `## <name>` section that has an `ID:` line and a `Fields:` table into:
//   { id, name, group, aka, placement, dimensions, channels, cta,
//     fields: [{ key, label, max, notes }], guidelines: [..], examples: [{ title, values }] }
// Read at request time (fs), so doc edits apply on the next request.
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'fs';
import path from 'path';

const DOC_PATH = path.join(process.cwd(), 'context', '02_asset-types.md');

// Example labels that map onto a field key when they don't match a field label exactly.
const LABEL_ALIASES = {
  subcopy: 'body', 'body copy': 'body', body: 'body', copy: 'body', subtext: 'body',
  headline: 'headline', eyebrow: 'eyebrow', cta: 'cta',
};

function stripFences(text) {
  const out = [];
  let inFence = false;
  for (const line of text.split('\n')) {
    if (line.trim().startsWith('```')) { inFence = !inFence; continue; }
    if (!inFence) out.push(line);
  }
  return out;
}

function parseBlock({ name, lines }) {
  const meta = {};
  const fields = [];
  const guidelines = [];
  const examples = [];
  let section = 'meta';
  let inTable = false;
  let current = null;

  for (const raw of lines) {
    const l = raw.trim();
    const sub = l.match(/^###\s+(.+)$/);
    if (sub) {
      const s = sub[1].toLowerCase();
      section = s.startsWith('guideline') ? 'guidelines' : s.startsWith('example') ? 'examples' : 'other';
      inTable = false;
      continue;
    }

    if (section === 'meta') {
      if (/^fields:\s*$/i.test(l)) { inTable = true; continue; }
      if (inTable && l.startsWith('|')) {
        const cells = l.split('|').slice(1, -1).map((c) => c.trim());
        const first = (cells[0] || '').replace(/:/g, '');
        if (cells.length < 2 || /^-+$/.test(first) || first.toLowerCase() === 'key') continue;
        const [key, label, max, notes] = cells;
        fields.push({
          key: key.toLowerCase(),
          label: label || key,
          max: parseInt(max, 10) || null,
          notes: notes || '',
        });
        continue;
      }
      if (inTable && l && !l.startsWith('|')) inTable = false;
      const m = l.match(/^([A-Za-z ]+):\s*(.+)$/);
      if (m) meta[m[1].trim().toLowerCase()] = m[2].trim();
    } else if (section === 'guidelines') {
      if (l.startsWith('- ')) guidelines.push(l.slice(2).trim());
    } else if (section === 'examples') {
      const title = l.match(/^\*\*(.+?)\*\*\s*$/);
      if (title) { current = { title: title[1], values: {} }; examples.push(current); continue; }
      const kv = l.match(/^([A-Za-z ]+):\s*(.+)$/);
      if (kv && current) {
        const label = kv[1].trim().toLowerCase();
        const field = fields.find((f) => f.key === label || f.label.toLowerCase() === label);
        const key = field ? field.key : LABEL_ALIASES[label];
        if (key) current.values[key] = kv[2].trim();
      }
    }
  }

  const id = (meta.id || '').toLowerCase();
  if (!/^[a-z0-9-]+$/.test(id) || fields.length === 0) return null;

  return {
    id,
    name,
    group: meta.group || 'Other',
    aka: meta['also known as'] || '',
    placement: meta.placement || '',
    dimensions: meta.dimensions || '',
    channels: meta.channels || '',
    cta: meta.cta || '',
    fields,
    guidelines,
    examples: examples.filter((e) => Object.keys(e.values).length > 0),
  };
}

export function parseAssetTypes() {
  let text = '';
  try { text = fs.readFileSync(DOC_PATH, 'utf-8'); } catch { return []; }

  const blocks = [];
  let cur = null;
  for (const line of stripFences(text)) {
    const h = line.match(/^##\s+(.+?)\s*$/); // `###` won't match: needs whitespace right after `##`
    if (h) { if (cur) blocks.push(cur); cur = { name: h[1], lines: [] }; continue; }
    if (cur) cur.lines.push(line);
  }
  if (cur) blocks.push(cur);

  const seen = new Set();
  return blocks.map(parseBlock).filter((a) => a && !seen.has(a.id) && seen.add(a.id));
}

export function getAssetTypes(ids) {
  const all = parseAssetTypes();
  return ids.map((id) => all.find((a) => a.id === id)).filter(Boolean);
}
