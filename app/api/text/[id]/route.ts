import { opText } from '@/lib/api';
import { json } from '@/lib/http';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const max = Number(new URL(req.url).searchParams.get('max')) || undefined;
  const rec = await opText(id, max);
  return json(rec, (rec as any).error ? 404 : 200);
}
