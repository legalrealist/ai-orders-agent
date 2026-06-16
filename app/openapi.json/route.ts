// OpenAPI 3.1 spec — import this URL into a ChatGPT GPT (Actions) or any
// function-calling LLM. The server URL is derived from the request origin.
import { json } from '@/lib/http';

const FILTER_PARAMS = [
  ['judge', 'Judge (title-insensitive substring, e.g. "Wang")'],
  ['court', 'Court (alias-aware: "sdny" / "S.D.N.Y." / "southern district of new york")'],
  ['state', 'State (full name)'],
  ['type', 'Judicial Opinion | Standing Order | Local Rules | Administrative Order | Practice Direction'],
  ['consequence', 'sanctions_attorney | sanctions_party | warning'],
  ['ai_type', 'Gen AI | Any AI'],
  ['applies_to', 'Attorneys | Pro Se Litigants | Any Parties (matches multi-value records)'],
  ['source', 'rg | rails | both'],
  ['jurisdiction', 'US | Canada | UK | New Zealand'],
  ['tag', 'applicableTo tag substring'],
  ['requires', 'only records whose reqs[KEY] is set, e.g. disclose, certify_if_ai, certify_all, verify, prohibited, proprietary'],
  ['date_from', 'YYYY-MM-DD'],
  ['date_to', 'YYYY-MM-DD'],
].map(([name, description]) => ({ name, in: 'query', schema: { type: 'string' }, description }));

const SEARCH_PARAMS = [
  ...FILTER_PARAMS,
  { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
  { name: 'full', in: 'query', schema: { type: 'boolean' }, description: 'return whole records, not the summary projection' },
  { name: 'count', in: 'query', schema: { type: 'boolean' }, description: 'return only the number of matches' },
  { name: 'has_pdf', in: 'query', schema: { type: 'boolean' } },
  { name: 'has_link', in: 'query', schema: { type: 'boolean' } },
];

export function GET(req: Request) {
  const origin = new URL(req.url).origin;
  return json({
    openapi: '3.1.0',
    info: {
      title: 'AI Court Orders API',
      version: '1.0.0',
      description: 'Query 900+ U.S. court orders & opinions on AI use in legal filings (judges sanctioning hallucinated citations, AI standing orders, etc.).',
    },
    servers: [{ url: origin }],
    paths: {
      '/api/search': {
        get: {
          operationId: 'searchOrders',
          summary: 'Full-text search over name/summary/judge/court with filters.',
          parameters: [{ name: 'q', in: 'query', schema: { type: 'string' }, description: 'text query' }, ...SEARCH_PARAMS],
          responses: { '200': { description: 'matching records (or {count})' } },
        },
      },
      '/api/list': {
        get: { operationId: 'listOrders', summary: 'Filter records without a text query.', parameters: SEARCH_PARAMS, responses: { '200': { description: 'records' } } },
      },
      '/api/record/{id}': {
        get: { operationId: 'getOrder', summary: 'Fetch one full record by id.', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'record' } } },
      },
      '/api/pdf/{id}': {
        get: { operationId: 'getPdf', summary: 'Self-hosted PDF + source links for a record.', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'pdf + links' } } },
      },
      '/api/facets': {
        get: {
          operationId: 'facets', summary: 'Distinct values + counts for a field. Honors all search/list filters (e.g. field=court&consequence=sanctions_attorney ranks courts by attorney-sanction count).',
          parameters: [
            { name: 'field', in: 'query', required: true, schema: { type: 'string' }, description: 'judge | court | state | type | consequence | ai_type' },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'all', in: 'query', schema: { type: 'boolean' }, description: 'include court-wide placeholders' },
            ...FILTER_PARAMS,
            { name: 'has_pdf', in: 'query', schema: { type: 'boolean' } },
            { name: 'has_link', in: 'query', schema: { type: 'boolean' } },
          ],
          responses: { '200': { description: 'value/count pairs' } },
        },
      },
      '/api/stats': { get: { operationId: 'stats', summary: 'Dataset summary counts.', responses: { '200': { description: 'stats' } } } },
      '/api/bar': {
        get: { operationId: 'barOpinions', summary: 'State bar AI ethics opinions.', parameters: [{ name: 'state', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'bar opinions' } } },
      },
    },
  });
}
