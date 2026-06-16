// Single source of truth for the dataset's agent tools. Both the MCP route
// (app/api/[transport]/route.ts) and the chat route (app/api/chat/route.ts)
// build their tool surfaces from these specs, so the two agent surfaces can
// never drift. Each spec carries a zod input shape (raw object — usable as an
// mcp-handler schema or wrapped in z.object() for the AI SDK) and a `run` that
// calls the matching in-process operation in lib/api.ts.
import { z } from 'zod';
import { opSearch, opGet, opFacets, opStats, opPdf, opBar, type SearchArgs } from './api';

// Shared filter shape, mirrored from the dataset's CLI/MCP surface. Bounded
// where it matters (KTD-6): the model picks values, never raw queries.
export const FILTERS = {
  judge: z.string().max(120).optional().describe('judge (title-insensitive substring, e.g. "Wang")'),
  court: z.string().max(120).optional().describe('court (alias-aware: "sdny" / "S.D.N.Y." / full name)'),
  state: z.string().max(120).optional(),
  type: z.string().max(120).optional().describe('Judicial Opinion | Standing Order | Local Rules | Administrative Order | Practice Direction'),
  consequence: z.string().max(120).optional().describe('sanctions_attorney | sanctions_party | warning'),
  ai_type: z.string().max(120).optional().describe('Gen AI | Any AI'),
  applies_to: z.string().max(120).optional().describe('Attorneys | Pro Se Litigants | Any Parties (matches multi-value)'),
  source: z.string().max(120).optional(),
  jurisdiction: z.string().max(120).optional(),
  tag: z.string().max(120).optional(),
  date_from: z.string().max(40).optional().describe('YYYY-MM-DD'),
  date_to: z.string().max(40).optional().describe('YYYY-MM-DD'),
  has_pdf: z.boolean().optional(),
  has_link: z.boolean().optional(),
  requires: z.string().max(60).optional().describe('only records whose reqs[KEY] is set, e.g. disclose, certify_if_ai, certify_all, verify, prohibited, proprietary'),
} as const;

const LIMIT = z.number().int().min(1).max(50).optional().describe('max records to return (1-50)');
const ID = z.union([z.string().max(60), z.number()]);

export interface ToolSpec {
  name: string;
  description: string;
  inputShape: z.ZodRawShape;
  run: (args: any) => Promise<unknown>;
}

export const TOOL_SPECS: ToolSpec[] = [
  {
    name: 'search_orders',
    description:
      'Full-text search (name/summary/judge/court) over AI court orders, with filters. Returns a compact projection by default; set full=true for whole records, or count=true for just the number of matches.',
    inputShape: { query: z.string().max(200).optional(), limit: LIMIT, full: z.boolean().optional(), count: z.boolean().optional(), ...FILTERS },
    run: (a: SearchArgs) => opSearch(a),
  },
  {
    name: 'list_orders',
    description: 'List/filter AI court orders without a text query (same filters as search_orders).',
    inputShape: { limit: LIMIT, full: z.boolean().optional(), count: z.boolean().optional(), ...FILTERS },
    run: (a: SearchArgs) => opSearch(a),
  },
  {
    name: 'get_order',
    description: 'Fetch one full record by id.',
    inputShape: { id: ID },
    run: (a: { id: string | number }) => opGet(a.id),
  },
  {
    name: 'get_pdf',
    description: 'Self-hosted PDF URL + source links for a record id.',
    inputShape: { id: ID },
    run: (a: { id: string | number }) => opPdf(a.id),
  },
  {
    name: 'facets',
    description:
      'Distinct values + counts for a field (e.g. judge, court, state, type, consequence). Honors all search/list filters, so facets(field=court, consequence=sanctions_attorney) ranks courts by attorney-sanction count. Drops court-wide placeholders unless all=true.',
    inputShape: { field: z.string().max(60), limit: LIMIT, all: z.boolean().optional(), ...FILTERS },
    run: (a: any) => opFacets(a.field, a.limit, a.all, a),
  },
  {
    name: 'stats',
    description: 'Dataset summary counts (totals by type/consequence/source, pdf coverage, date range).',
    inputShape: {},
    run: () => opStats(),
  },
  {
    name: 'bar_opinions',
    description: 'State bar AI ethics opinions; optional state filter.',
    inputShape: { state: z.string().max(120).optional() },
    run: (a: { state?: string }) => opBar(a.state),
  },
];

// Cap a tool result before it re-enters the model (KTD-6): bound array length
// and total serialized size so untrusted dataset content can't blow up cost or
// the injection surface. MCP keeps the raw `run` output; only the chat path caps.
export const MAX_TOOL_RECORDS = 25;
const MAX_TOOL_CHARS = 20_000;

export function capForModel(result: unknown): unknown {
  let value = result;
  if (Array.isArray(value) && value.length > MAX_TOOL_RECORDS) {
    value = { truncated: true, returned: MAX_TOOL_RECORDS, total: value.length, items: value.slice(0, MAX_TOOL_RECORDS) };
  }
  const text = JSON.stringify(value);
  if (text.length > MAX_TOOL_CHARS) {
    return { truncated: true, reason: 'result too large; narrow your filters', preview: text.slice(0, MAX_TOOL_CHARS) };
  }
  return value;
}
