# context/ — the editable brain of AX Copy Studio

Two markdown docs drive every generation. They're read at request time, so edits apply on the
next generation — no code change, no redeploy.

| Doc | Job | Owner |
|-----|-----|-------|
| `01_brand-knowledge.md` | LG voice, tone, vocabulary, guardrails, gold-standard copy examples | Creative Director / Copy lead |
| `02_asset-types.md` | Every copy asset the tool writes: fields, character limits, placement, guidelines, examples | Copy lead (+ any team adding assets) |

**Rules of thumb**
- Change *how LG sounds* → edit Doc 1.
- Add or change *an asset* (new copy type, new limit, better examples) → edit Doc 2 (format is
  documented at the top of that file). New assets appear in the picker automatically.
- If Doc 1 and an asset's spec ever disagree on format or length, the asset spec in Doc 2 wins.
