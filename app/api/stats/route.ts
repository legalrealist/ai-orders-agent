import { opStats } from '@/lib/api';
import { json } from '@/lib/http';

export async function GET() {
  return json(await opStats());
}
