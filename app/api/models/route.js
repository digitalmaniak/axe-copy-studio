import { availableProviders, resolveProvider } from '@/lib/llm';

export const dynamic = 'force-dynamic';

// Which AI providers have keys configured (only those are offered in the UI).
export async function GET() {
  return Response.json({ success: true, providers: availableProviders(), defaultProvider: resolveProvider(null) });
}
