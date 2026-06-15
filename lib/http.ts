import type { SearchArgs } from './api';

const BOOL = (v: string | null) => v === '1' || v === 'true' || v === '';

export function parseSearchArgs(sp: URLSearchParams): SearchArgs {
  const s = (k: string) => sp.get(k) ?? undefined;
  return {
    query: s('q') ?? s('query'),
    judge: s('judge'), court: s('court'), state: s('state'), type: s('type'),
    consequence: s('consequence'), ai_type: s('ai_type'), applies_to: s('applies_to'),
    source: s('source'), jurisdiction: s('jurisdiction'), tag: s('tag'),
    date_from: s('date_from'), date_to: s('date_to'),
    has_pdf: sp.has('has_pdf') ? BOOL(sp.get('has_pdf')) : undefined,
    has_link: sp.has('has_link') ? BOOL(sp.get('has_link')) : undefined,
    limit: sp.has('limit') ? Number(sp.get('limit')) : undefined,
    full: sp.has('full') ? BOOL(sp.get('full')) : undefined,
    count: sp.has('count') ? BOOL(sp.get('count')) : undefined,
  };
}

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
  });
