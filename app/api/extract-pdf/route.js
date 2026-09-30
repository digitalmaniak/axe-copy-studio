import Anthropic from '@anthropic-ai/sdk';
import { PROVIDERS, resolveProvider } from '@/lib/llm';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ─── Messaging-matrix PDF → plain text ───────────────────────────────────────
// PDFs are binary, so the file is handed to the model (reads scanned PDFs too) and
// the extracted text is then used exactly like a pasted matrix.
// Body: { base64 }  — uses Claude when configured, otherwise GPT.
// ─────────────────────────────────────────────────────────────────────────────
const INSTRUCTION = 'This is a marketing messaging matrix. Extract its full contents as clean plain text / simple markdown. Preserve the structure — product or segment rows, message pillars, proof points, differentiators, approved phrasing, and column headers. Do NOT summarize, add commentary, or omit anything. Output only the extracted content.';

export async function POST(req) {
  try {
    const { base64 } = await req.json();
    if (!base64) return Response.json({ success: false, error: 'Missing file data' }, { status: 400 });

    const provider = resolveProvider(null);
    if (!provider) return Response.json({ success: false, error: 'No AI provider configured' }, { status: 500 });

    let text = '';
    if (provider === 'claude') {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const msg = await client.messages.create({
        model: PROVIDERS.claude.model,
        max_tokens: 4000,
        messages: [{ role: 'user', content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
          { type: 'text', text: INSTRUCTION },
        ] }],
      });
      text = (msg.content || []).map((b) => b.text || '').join('');
    } else {
      const res = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: PROVIDERS.gpt.model,
          max_output_tokens: 12000,
          input: [{ role: 'user', content: [
            { type: 'input_file', filename: 'messaging-matrix.pdf', file_data: `data:application/pdf;base64,${base64}` },
            { type: 'input_text', text: INSTRUCTION },
          ] }],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message || 'OpenAI request failed');
      text = data.output_text || (data.output || []).flatMap((o) => o.content || []).filter((c) => c.type === 'output_text').map((c) => c.text).join('');
    }
    return Response.json({ success: true, text: text.trim() });
  } catch (err) {
    console.error('[/api/extract-pdf]', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
