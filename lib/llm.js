// ─── Unified LLM layer ───────────────────────────────────────────────────────
// Claude (Sonnet 5.5) is the default. GPT is offered as a toggle.
// A provider is only available if its API key is configured — if only one key is
// set, that one is used. Model ids are centralized here so they're easy to swap.
// ─────────────────────────────────────────────────────────────────────────────
import Anthropic from '@anthropic-ai/sdk';

export const PROVIDERS = {
  claude: { label: 'Claude', model: 'claude-sonnet-5-5', displayModel: 'claude-sonnet-5.5', envKey: 'ANTHROPIC_API_KEY' },
  gpt: { label: 'GPT', model: 'gpt-5.4', displayModel: 'gpt-5.4', envKey: 'OPENAI_API_KEY' },
};

// Sonnet 5.5 rejects temperature/top_p/top_k and runs adaptive thinking unless told
// otherwise. Copy generation is short-form JSON, so skip up-front thinking (lowest
// setting) and use medium effort for speed. Spread into every Claude request.
export const CLAUDE_REQUEST_DEFAULTS = {
  thinking: { type: 'between_tools' },
  output_config: { effort: 'medium' },
};

export function availableProviders() {
  return Object.entries(PROVIDERS)
    .filter(([, p]) => !!process.env[p.envKey])
    .map(([id, p]) => ({ id, label: p.label, model: p.model, displayModel: p.displayModel || p.model }));
}

export function resolveProvider(requested) {
  const ids = availableProviders().map((p) => p.id);
  if (requested && ids.includes(requested)) return requested;
  if (ids.includes('claude')) return 'claude';
  return ids[0] || null;
}

// Org-level (non-workspace) API keys must name a workspace on every request.
// Set ANTHROPIC_WORKSPACE_ID in Vercel to send the anthropic-workspace-id header;
// leave it unset when the key is already scoped to a workspace.
export function anthropicOptions() {
  const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID?.trim();
  return {
    apiKey: process.env.ANTHROPIC_API_KEY,
    ...(workspaceId ? { defaultHeaders: { 'anthropic-workspace-id': workspaceId } } : {}),
  };
}

let anthropicClient = null;
function anthropic() {
  if (!anthropicClient) anthropicClient = new Anthropic(anthropicOptions());
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

  // `temperature` is accepted for call-site compatibility but not sent: Sonnet 5.5
  // returns a 400 for sampling params. Variety comes from the prompts + similarity retries.
  const msg = await anthropic().messages.create({
    model: PROVIDERS.claude.model,
    max_tokens: maxTokens,
    ...CLAUDE_REQUEST_DEFAULTS,
    system,
    messages: [{ role: 'user', content: user }],
  });
  // Read text blocks only (a reply can include thinking blocks).
  return (msg.content || []).filter((b) => b.type === 'text').map((b) => b.text || '').join('').trim();
}

/** Pull the first JSON object out of a model reply (tolerates ``` fences / preamble). */
export function parseJSON(raw) {
  const cleaned = String(raw || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON found in model response');
  return JSON.parse(match[0]);
}
