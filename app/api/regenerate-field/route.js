import { getAssetTypes } from '@/lib/assetTypes';
import { readBrandKnowledge } from '@/lib/knowledge';
import { callLLM, parseJSON, resolveProvider } from '@/lib/llm';
import { buildSystemPrompt, buildFieldUser } from '@/lib/prompts';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Rewrite ONE field of one asset, staying consistent with that asset's other fields.
// Body: { brief, tone, assetId, fieldKey, current, provider, messagingMatrix }
export async function POST(request) {
  try {
    const { brief, tone, assetId, fieldKey, current = {}, provider: requested, messagingMatrix = '' } = await request.json();
    const [asset] = getAssetTypes([assetId]);
    const field = asset?.fields.find((f) => f.key === fieldKey);
    if (!asset || !field) return Response.json({ success: false, error: 'Unknown asset or field' }, { status: 400 });

    const provider = resolveProvider(requested);
    if (!provider) return Response.json({ success: false, error: 'No AI provider configured' }, { status: 500 });

    const system = buildSystemPrompt({ brand: readBrandKnowledge(), assets: [asset] });
    const user = buildFieldUser({ brief, tone, matrix: messagingMatrix, asset, field, current });

    let value = String(parseJSON(await callLLM({ provider, system, user, maxTokens: 400, temperature: 1 }))?.value || '').trim();
    if (field.max && value.length > field.max) {
      const retryUser = `${user}\n\nYour last attempt was ${value.length} characters — it MUST be ${field.max} characters or fewer.`;
      const retry = String(parseJSON(await callLLM({ provider, system, user: retryUser, maxTokens: 400, temperature: 0.5 }))?.value || '').trim();
      if (retry) value = retry;
    }
    return Response.json({ success: true, value });
  } catch (err) {
    console.error('[/api/regenerate-field]', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
