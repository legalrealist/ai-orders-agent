import { opFacets } from '@/lib/api';
import { parseSearchArgs, json } from '@/lib/http';

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const field = sp.get('field');
  if (!field) return json({ error: 'field is required' }, 400);
  const limit = sp.has('limit') ? Number(sp.get('limit')) : undefined;
  const all = sp.has('all');
  return json(await opFacets(field, limit, all, parseSearchArgs(sp)));
}
