// Query logic for the AI Court Orders dataset — ported from the explorer's
// orders_cli.py so REST + MCP behave exactly like the CLI (court aliases,
// title-insensitive judge match, multi-value applies_to, facet placeholders).

export type Record_ = Record<string, any>;

export const LIST_FIELDS = [
  'id', 'date', 'state', 'type', 'court', 'judge', 'consequence', 'name', 'pdf', 'link',
];

const EXACT: Record<string, string> = {
  state: 'state', type: 'type', consequence: 'consequence',
  ai_type: 'ai_type', source: 'source', jurisdiction: 'jurisdiction',
};

// Court aliases: the dataset stores some courts two ways; unify abbreviation,
// long-form phrase, and record value to one canonical label.
const COURT_ALIASES_RAW: Record<string, string> = {
  sdny: 'S.D.N.Y.', 'southern district of new york': 'S.D.N.Y.',
  edny: 'E.D.N.Y.', 'eastern district of new york': 'E.D.N.Y.',
  ndny: 'N.D.N.Y.', 'northern district of new york': 'N.D.N.Y.',
  wdny: 'W.D.N.Y.', 'western district of new york': 'W.D.N.Y.',
  cdcal: 'C.D. Cal.', 'central district of california': 'C.D. Cal.',
  ndcal: 'N.D. Cal.', 'northern district of california': 'N.D. Cal.',
  edcal: 'E.D. Cal.', 'eastern district of california': 'E.D. Cal.',
  sdcal: 'S.D. Cal.', 'southern district of california': 'S.D. Cal.',
  ndill: 'N.D. Ill.', 'northern district of illinois': 'N.D. Ill.',
  edtex: 'E.D. Tex.', 'eastern district of texas': 'E.D. Tex.',
  sdtex: 'S.D. Tex.', 'southern district of texas': 'S.D. Tex.',
  ndtex: 'N.D. Tex.', 'northern district of texas': 'N.D. Tex.',
  wdtex: 'W.D. Tex.', 'western district of texas': 'W.D. Tex.',
  edpa: 'E.D. Pa.', 'eastern district of pennsylvania': 'E.D. Pa.',
  sdfl: 'S.D. Fla.', 'southern district of florida': 'S.D. Fla.',
  mdfl: 'M.D. Fla.', 'middle district of florida': 'M.D. Fla.',
  edmi: 'E.D. Mich.', 'eastern district of michigan': 'E.D. Mich.',
  edva: 'E.D. Va.', 'eastern district of virginia': 'E.D. Va.',
  ddc: 'D.D.C.', 'district of columbia': 'District of Columbia',
  dnj: 'D.N.J.', 'district of new jersey': 'D.N.J.',
  dmass: 'D. Mass.', 'district of massachusetts': 'D. Mass.',
  dconn: 'D. Conn.', 'district of connecticut': 'D. Conn.',
  dcolo: 'D. Colo.', 'district of colorado': 'D. Colo.',
  dariz: 'D. Ariz.', 'district of arizona': 'D. Ariz.',
};
const COURT_ALIASES: Record<string, string> = Object.fromEntries(
  Object.entries(COURT_ALIASES_RAW).map(([k, v]) => [k.replace(/[^a-z0-9]+/g, ''), v]),
);

const FACET_PLACEHOLDERS = new Set(['all judges', 'district wide', 'unknown', 'court personnel']);

const norm = (s: any) => String(s ?? '').toLowerCase();
const ncourt = (s: any) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');

function canonCourt(text: any): string {
  const n = ncourt(text);
  if (COURT_ALIASES[n]) return COURT_ALIASES[n];
  const low = String(text ?? '').toLowerCase();
  if (low.includes('bankr') || low.includes('court of appeals') || low.includes('appellate')) return n;
  for (const [k, v] of Object.entries(COURT_ALIASES)) {
    if (k.length >= 12 && n.includes(k)) return v;
  }
  return n;
}

export function courtMatch(court: any, query: any): boolean {
  if (!query) return true;
  if (canonCourt(court) === canonCourt(query)) return true;
  const nq = ncourt(query), nc = ncourt(court);
  if (!nq) return false;
  // A plain district alias ("sdny") must not leak into specialized courts
  // (bankruptcy/appeals) via substring — those are distinct courts.
  const lowC = String(court ?? '').toLowerCase();
  if (COURT_ALIASES[nq] && (lowC.includes('bankr') || lowC.includes('court of appeals') || lowC.includes('appellate'))) {
    return false;
  }
  return nc.includes(nq);
}

function njudge(j: any): string {
  let s = String(j ?? '').toLowerCase();
  let prev = null;
  while (s !== prev) {
    prev = s;
    s = s.replace(/^(chief|senior|presiding|district|acting|magistrate|hon\.?|honorable|justice|judge)\s+/, '').trim();
  }
  return s.replace(/[^a-z0-9]+/g, '');
}

export function judgeMatch(judge: any, query: any): boolean {
  if (!query) return true;
  const nj = njudge(judge), nq = njudge(query);
  return !!nj && !!nq && nj.includes(nq);
}

export function appliesMatch(applies: any, query: any): boolean {
  if (!query) return true;
  const q = String(query).trim().toLowerCase();
  return String(applies ?? '').split(',').some((p) => {
    const pl = p.trim().toLowerCase();
    return pl === q || pl.includes(q);
  });
}

export function search(records: Record_[], query?: string): Record_[] {
  if (!query) return [...records];
  const tokens = norm(query).replace(/\./g, '').split(/\s+/).filter(Boolean);
  return records.filter((r) => {
    const blob = norm([r.name, r.summary, r.judge, r.court].join(' ')).replace(/\./g, '');
    return tokens.every((t) => blob.includes(t));
  });
}

export interface Filters {
  judge?: string; court?: string; state?: string; type?: string; consequence?: string;
  ai_type?: string; applies_to?: string; source?: string; jurisdiction?: string; tag?: string;
  date_from?: string; date_to?: string; has_pdf?: boolean; has_link?: boolean;
}

export function applyFilters(records: Record_[], f: Filters): Record_[] {
  return records.filter((r) => {
    for (const [flag, field] of Object.entries(EXACT)) {
      const v = (f as any)[flag];
      if (v && norm(r[field]) !== norm(v)) return false;
    }
    if (f.court && !courtMatch(r.court, f.court)) return false;
    if (f.judge && !judgeMatch(r.judge, f.judge)) return false;
    if (f.applies_to && !appliesMatch(r.applies_to, f.applies_to)) return false;
    const d = String(r.date ?? '');
    if (f.date_from && d < f.date_from) return false;
    if (f.date_to && d > f.date_to) return false;
    if (f.has_pdf && !r.pdf) return false;
    if (f.has_link && !r.link) return false;
    if (f.tag && !(Array.isArray(r.applicableTo) &&
        r.applicableTo.some((t: string) => norm(t).includes(norm(f.tag))))) return false;
    return true;
  });
}

export function facet(records: Record_[], field: string, limit?: number, includeAll = false) {
  const counts = new Map<string, number>();
  for (const r of records) {
    const v = r[field];
    const vals = Array.isArray(v) ? v : (v ? [v] : []);
    for (const x of vals) {
      if (!includeAll && typeof x === 'string' && FACET_PLACEHOLDERS.has(x.trim().toLowerCase())) continue;
      counts.set(x, (counts.get(x) ?? 0) + 1);
    }
  }
  let items = [...counts.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
  if (limit) items = items.slice(0, limit);
  return items.map(([value, count]) => ({ value, count }));
}

export function stats(records: Record_[]) {
  const by = (f: string) => Object.fromEntries(facet(records, f).map((x) => [x.value, x.count]));
  const dates = records.map((r) => r.date).filter(Boolean).sort();
  return {
    total: records.length,
    by_type: by('type'),
    by_consequence: by('consequence'),
    by_source: by('source'),
    with_pdf: records.filter((r) => r.pdf).length,
    with_link: records.filter((r) => r.link).length,
    date_range: [dates[0] ?? '', dates[dates.length - 1] ?? ''],
  };
}

export const project = (r: Record_) => Object.fromEntries(LIST_FIELDS.map((k) => [k, r[k] ?? (typeof r[k] === 'number' ? r[k] : '')]));
