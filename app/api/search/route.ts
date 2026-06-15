import { opSearch } from '@/lib/api';
import { parseSearchArgs, json } from '@/lib/http';

export async function GET(req: Request) {
  const args = parseSearchArgs(new URL(req.url).searchParams);
  return json(await opSearch(args));
}
