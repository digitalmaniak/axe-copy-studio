// ─── Unified LLM layer ───────────────────────────────────────────────────────
// Claude is the default (same model as AX Platform). GPT is offered as a toggle.
// A provider is only available if its API key is configured — if only one key is
// set, that one is used. Model ids are centralized here so they're easy to swap.
// ─────────────────────────────────────────────────────────────────────────────
import Anthropic from '@anthropic-ai/sdk';

export const PROVIDERS = {
  claude: { label: 'Claude', model: 'claude-opus-4-6', envKey: 'ANTHROPIC_API_KEY' },
  gpt: { label: 'GPT', model: 'gpt-5.4', envKey: 'OPENAI_API_KEY' },
};

export function availableProviders() {
  return Object.entries(PROVIDERS)
    .filter(([, p]) => !!process.env[p.envKey])
    .map(([id, p]) => ({ id, label: p.label, model: p.model }));
}

export function resolveProvider(requested) {
  const ids = availableProviders().map((p) => p.id);
  if (requested && ids.includes(requested)) return requested;
  if (ids.includes('claude')) return 'claude';
  return ids[0] || null;
}

let anthropicClient = null;
function anthropic() {
  if (!anthropicClient) anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return anthropicClient;
}

function openAIText(data) {
  if (typeof data?.output_text === 'string' && data.output_text) return data.output_text;
  return (data?.output || [])
    .flatMap((o) => o.content || [])
    .filter((c) => c.type === 'output_text')
    .map((c) => c.text)
    .join('');
}

/** Send a system + user prompt to the chosen provider and return the text reply. */
export async function callLLM({ provider, system, user, maxTokens = 2000, temperature }) {
  if (provider === 'gpt') {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      // Reasoning models count reasoning tokens against the output budget — leave headroom.
      body: JSON.stringify({ model: PROVIDERS.gpt.model, instructions: system, input: user, max_output_tokens: Math.max(maxTokens * 3, 6000) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error?.message || `OpenAI request failed (${res.status})`);
    return openAIText(data).trim();
  }

  const msg = await anthropic().messages.create({
    model: PROVIDERS.claude.model,
    max_tokens: maxTokens,
    ...(temperature != null ? { temperature } : {}),
    system,
    messages: [{ role: 'user', content: user }],
  });
  return (msg.content || []).map((b) => b.text || '').join('').trim();
}

/** Pull the first JSON object out of a model reply (tolerates ``` fences / preamble). */
export function parseJSON(raw) {
  const cleaned = String(raw || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON found in model response');
  return JSON.parse(match[0]);
}
