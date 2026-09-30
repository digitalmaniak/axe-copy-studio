import { parseAssetTypes } from '@/lib/assetTypes';

export const dynamic = 'force-dynamic';

// Asset types for the picker, parsed from context/02_asset-types.md at request time.
export async function GET() {
  try {
    return Response.json({ success: true, assetTypes: parseAssetTypes() });
  } catch (err) {
    console.error('[/api/asset-types]', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
