// MCP server (Streamable HTTP) — add this URL as a custom connector in Claude
// Desktop / claude.ai, or any MCP client. Every CLI command is exposed as a tool.
import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import { opSearch, opGet, opFacets, opStats, opPdf, opBar } from '@/lib/api';

const json = (v: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(v, null, 2) }] });

const FILTERS = {
  judge: z.string().optional().describe('judge (title-insensitive substring, e.g. "Wang")'),
  court: z.string().optional().describe('court (alias-aware: "sdny" / "S.D.N.Y." / full name)'),
  state: z.string().optional(),
  type: z.string().optional().describe('Judicial Opinion | Standing Order | Local Rules | Administrative Order | Practice Direction'),
  consequence: z.string().optional().describe('sanctions_attorney | sanctions_party | warning'),
  ai_type: z.string().optional().describe('Gen AI | Any AI'),
  applies_to: z.string().optional().describe('Attorneys | Pro Se Litigants | Any Parties (matches multi-value)'),
  source: z.string().optional(),
  jurisdiction: z.string().optional(),
  tag: z.string().optional(),
  date_from: z.string().optional().describe('YYYY-MM-DD'),
  date_to: z.string().optional().describe('YYYY-MM-DD'),
  has_pdf: z.boolean().optional(),
  has_link: z.boolean().optional(),
};

const handler = createMcpHandler((server) => {
  server.tool(
    'search_orders',
    'Full-text search (name/summary/judge/court) over AI court orders, with filters. Returns a compact projection by default; set full=true for whole records, or count=true for just the number of matches.',
    { query: z.string().optional(), limit: z.number().optional(), full: z.boolean().optional(), count: z.boolean().optional(), ...FILTERS },
    async (a) => json(await opSearch(a)),
  );
  server.tool(
    'list_orders',
    'List/filter AI court orders without a text query (same filters as search_orders).',
    { limit: z.number().optional(), full: z.boolean().optional(), count: z.boolean().optional(), ...FILTERS },
    async (a) => json(await opSearch(a)),
  );
  server.tool('get_order', 'Fetch one full record by id.', { id: z.union([z.string(), z.number()]) },
    async (a) => json(await opGet(a.id)));
  server.tool('get_pdf', 'Self-hosted PDF URL + source links for a record id.', { id: z.union([z.string(), z.number()]) },
    async (a) => json(await opPdf(a.id)));
  server.tool('facets', 'Distinct values + counts for a field (e.g. judge, court, state, type, consequence). Drops court-wide placeholders unless all=true.',
    { field: z.string(), limit: z.number().optional(), all: z.boolean().optional() },
    async (a) => json(await opFacets(a.field, a.limit, a.all)));
  server.tool('stats', 'Dataset summary counts (totals by type/consequence/source, pdf coverage, date range).', {},
    async () => json(await opStats()));
  server.tool('bar_opinions', 'State bar AI ethics opinions; optional state filter.', { state: z.string().optional() },
    async (a) => json(await opBar(a.state)));
}, {}, { basePath: '/api' });

export { handler as GET, handler as POST };
