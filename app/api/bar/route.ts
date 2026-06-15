import { opBar } from '@/lib/api';
import { json } from '@/lib/http';

export async function GET(req: Request) {
  const state = new URL(req.url).searchParams.get('state') ?? undefined;
  return json(await opBar(state));
}
