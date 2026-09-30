// Reads LG brand knowledge (context/01_brand-knowledge.md) at request time so the
// copy team's edits take effect on the next generation without a redeploy.
import fs from 'fs';
import path from 'path';

export function readBrandKnowledge() {
  try {
    return fs.readFileSync(path.join(process.cwd(), 'context', '01_brand-knowledge.md'), 'utf-8').trim();
  } catch {
    return '';
  }
}
