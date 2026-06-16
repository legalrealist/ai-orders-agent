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
  return { id: rec.id, pdf: rec.pdf ?? '', link: rec.link ?? '', original_link: rec.original_link ?? '' };
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
