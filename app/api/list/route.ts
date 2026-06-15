import { opSearch } from '@/lib/api';
import { parseSearchArgs, json } from '@/lib/http';

export async function GET(req: Request) {
  const args = parseSearchArgs(new URL(req.url).searchParams);
  args.query = undefined; // list = filter without a text query
  return json(await opSearch(args));
}
