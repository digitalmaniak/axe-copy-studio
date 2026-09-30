# AX Copy Studio (prototype)

A standalone copywriting tool for the LG / HSAD copy team. Same workflow and brand brain as the
AX Platform Copy Studio, but built around **specific copy asset types** (HP Hero, PLP Hero, content
cards, tiles, mini cards…), with room for other teams to add their own.

**Workflow:** paste a brief → (optionally) attach a messaging matrix → pick one or more copy types →
choose tone, number of options (1–3) and model → generate. Results show every asset with the options
side by side; edit inline, redo a single field, replace one option, regenerate all, copy, or export.

## Stack
Next.js 14 (App Router) · Tailwind · Anthropic Claude (default, `claude-opus-4-6`) · OpenAI GPT
(`gpt-5.4`, toggle) · Vercel. No database in v1 — nothing is stored server-side.

## Setup
1. Import this repo into Vercel (Framework: Next.js, default settings).
2. Environment variables (Project → Settings → Environment Variables):
   - `ANTHROPIC_API_KEY` — Claude (default)
   - `OPENAI_API_KEY` — GPT (optional)
   At least one is required. With both, Claude is the default and a Claude/GPT toggle appears.
3. Deploy. Local dev: `npm install && npm run dev` with a `.env.local` (see `.env.example`).

## Where the knowledge lives (edit without code)
| File | What it controls |
|------|------------------|
| `context/01_brand-knowledge.md` | LG voice, tone, vocabulary, guardrails, approved examples (mirrors AX Platform's Doc 1 voice) |
| `context/02_asset-types.md` | Every copy asset: fields, character limits, placement, guidelines, examples |

Both are read at request time. **To add a copy type** (e.g. for the Web / PDP team), copy an asset
block in `02_asset-types.md`, give it a new `ID:` and `Group:`, and commit — it shows up in the picker
on the next deploy with its limits enforced. The format is documented at the top of that file.

## How generation works
- One model call writes N distinct creative options, each covering every selected asset with one
  consistent angle adapted to each placement.
- Guardrails: options that come back too similar (to each other or to earlier ones) trigger one
  harder retry; any field over its hard character limit gets one targeted rewrite. Remaining overages
  show a red counter in the UI.
- Field "Redo" rewrites a single field; "New option" replaces one option; "Regenerate all" produces a
  new set that steers away from what's on screen.

## API
| Route | Purpose |
|-------|---------|
| `GET /api/asset-types` | Parsed asset types for the picker |
| `GET /api/models` | Configured providers + default |
| `POST /api/generate` | `{ brief, tone, assetIds[], variantCount, provider, messagingMatrix, priorOptions[] }` |
| `POST /api/regenerate-field` | `{ brief, tone, assetId, fieldKey, current, provider, messagingMatrix }` |
| `POST /api/extract-pdf` | `{ base64 }` → messaging-matrix text |
