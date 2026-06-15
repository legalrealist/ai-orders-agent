import { opGet } from '@/lib/api';
import { json } from '@/lib/http';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rec = await opGet(id);
  return json(rec, (rec as any).error ? 404 : 200);
}
