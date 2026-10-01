// ─── Usage tracking ──────────────────────────────────────────────────────────
// One row per generation → Supabase project "axe-platform", schema copy_studio.
// Writes go through the write-only RPC public.copy_studio_log_generation, so the
// key can add rows but never read them. Never throws; waits at most 2s; skipped
// entirely when SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY aren't set.
// ─────────────────────────────────────────────────────────────────────────────
import { PROVIDERS } from '@/lib/llm';

const EVENT_TYPES = ['generate', 'regenerate_all', 'new_option'];

/**
 * @param {object} e
 * @param {object} e.tracking  client hints: { trigger, sessionId, matrixSource }
 * @param {string} e.brief, e.tone, e.messagingMatrix, e.provider, e.error
 * @param {string[]} e.assetIds
 * @param {number} e.n, e.optionsReturned, e.priorCount, e.latencyMs
 * @param {boolean} e.success
 */
export async function logGeneration(e) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return;

  const t = e.tracking && typeof e.tracking === 'object' ? e.tracking : {};
  const brief = String(e.brief || '').trim();
  const matrix = String(e.messagingMatrix || '').trim();
  const source = matrix ? String(t.matrixSource || 'pasted').toLowerCase().slice(0, 20) : null;

  const p = {
    event_type: EVENT_TYPES.includes(t.trigger) ? t.trigger : 'generate',
    session_id: typeof t.sessionId === 'string' ? t.sessionId.slice(0, 100) : null,
    app_version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
    copy_types: e.assetIds || [],
    tones: e.tone ? [e.tone] : [],
    options_requested: e.n ?? null,
    options_returned: e.optionsReturned ?? 0,
    brief_chars: brief.length,
    brief_words: brief ? brief.split(/\s+/).length : 0,
    has_attachment: !!matrix,
    attachment_count: matrix ? 1 : 0,
    attachment_types: source ? [source] : [], // pdf | txt | csv | pasted …
    model: PROVIDERS[e.provider]?.model || null,
    latency_ms: e.latencyMs ?? null,
    success: !!e.success,
    error_message: e.error ? String(e.error).slice(0, 1000) : null,
    extra: {
      provider: e.provider || null,
      matrix_chars: matrix.length,
      prior_options: e.priorCount || 0,
      env: process.env.VERCEL_ENV || 'local', // production | preview | local
    },
  };

  try {
    const res = await fetch(`${url}/rest/v1/rpc/copy_studio_log_generation`, {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p }),
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) console.error('[tracking] insert failed:', res.status, await res.text().catch(() => ''));
  } catch (err) {
    console.error('[tracking] insert failed:', err.message);
  }
}
