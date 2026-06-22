// Shared operations used by both the REST routes and the MCP tools, so the two
// surfaces behave identically.
import { loadOrders, loadBar } from './data';
import * as q from './orders';

export interface SearchArgs extends q.Filters {
  query?: string; limit?: number; full?: boolean; count?: boolean;
}

export async function opSearch(a: SearchArgs) {
  const recs = q.applyFilters(q.search(await loadOrders(), a.query), a);
  if (a.count) return { count: recs.length };
  const sliced = recs.slice(0, a.limit ?? 50);
  return a.full ? sliced : sliced.map(q.project);
}

export async function opGet(id: string | number) {
  const rec = (await loadOrders()).find((r) => String(r.id) === String(id));
  if (!rec) return { error: `no record with id ${id}` };
  return rec;
}

export async function opPdf(id: string | number) {
  const rec = (await loadOrders()).find((r) => String(r.id) === String(id));
  if (!rec) return { error: `no record with id ${id}` };
  return {
    id: rec.id, pdf: rec.pdf ?? '', text_url: textUrl(rec.pdf ?? ''),
    link: rec.link ?? '', original_link: rec.original_link ?? '',
  };
}

const textUrl = (pdf: string) => (pdf ? pdf.replace(/\.pdf$/, '.txt') : '');

// Full document text (light markdown) of the self-hosted order/opinion, for
// LLM reading. Derived from the self-hosted PDF (<key>.pdf -> <key>.txt).
export async function opText(id: string | number, max?: number) {
  const rec = (await loadOrders()).find((r) => String(r.id) === String(id));
  if (!rec) return { error: `no record with id ${id}` };
  const url = textUrl(rec.pdf ?? '');
  if (!url) return { id: rec.id, name: rec.name ?? '', text: '', note: 'no self-hosted document for this record' };
  let res: Response;
  try {
    res = await fetch(url, { headers: { 'User-Agent': 'ai-orders-agent' }, signal: AbortSignal.timeout(15_000) });
  } catch {
    return { id: rec.id, text_url: url, error: 'document text fetch timed out' };
  }
  if (!res.ok) return { id: rec.id, text_url: url, error: `document text not available (${res.status})` };
  const full = await res.text();
  const text = max && full.length > max ? full.slice(0, max) : full;
  return {
    id: rec.id, name: rec.name ?? '', text_url: url,
    chars: text.length, total_chars: full.length, truncated: text.length < full.length, text,
  };
}

export async function opFacets(field: string, limit?: number, all = false, filters: q.Filters = {}) {
  return q.facet(q.applyFilters(await loadOrders(), filters), field, limit, all);
}

export async function opStats() {
  return q.stats(await loadOrders());
}

export async function opBar(state?: string) {
  const items: any[] = (await loadBar()).items ?? [];
  if (!state) return items;
  const s = state.toLowerCase();
  return items.filter((b) =>
    String(b.name ?? '').toLowerCase().includes(s) ||
    String(b.abbreviation ?? '').toLowerCase() === s);
}
