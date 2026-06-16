# ai-orders-agent

Agent-facing service for the **AI Court Orders** dataset — one Vercel project that
exposes the same queries three ways:

- **MCP** (`/api/mcp`) — add as a custom connector in Claude Desktop / claude.ai, or any MCP client.
- **OpenAPI** (`/openapi.json`) — import into a ChatGPT GPT (Actions) or any function-calling LLM.
- **REST/JSON** (`/api/*`) — call directly from code or the browser.

It is **read-only** and **stateless**: it live-fetches the dataset the
[AI-orders-explorer](https://github.com/legalrealist/AI-orders-explorer) repo
publishes (that repo owns the data pipeline, the human web explorer, and the
Claude-Code skill — this one is purely the agent surface) and caches it in memory.

## Data source

Set `ORDERS_DATA_BASE` to where the dataset (`explorer_data.json` and
`bar_opinions.json`) is published. Defaults to the live published copy at
`https://legalhack.io/data` (943 records). See `.env.example`.

## Endpoints

| | |
|---|---|
| `GET /api/search?q=&<filters>&limit=&full=&count=` | full-text search + filters |
| `GET /api/list?<filters>` | filter without a text query |
| `GET /api/record/{id}` · `GET /api/pdf/{id}` | one record · its PDF/links |
| `GET /api/facets?field=&limit=&all=` | distinct values + counts |
| `GET /api/stats` · `GET /api/bar?state=` | summary · state-bar opinions |
| `GET /api/mcp` · `GET /openapi.json` | MCP endpoint · OpenAPI spec |

**Filters** (search/list): `judge` (title-insensitive), `court` (alias-aware: `sdny`/`S.D.N.Y.`/full name),
`state`, `type`, `consequence`, `ai_type`, `applies_to` (multi-value), `source`, `jurisdiction`,
`tag`, `date_from`, `date_to`, `has_pdf`, `has_link`.

## Run / deploy

```bash
npm install
npm run dev        # http://localhost:3000  (try /api/stats, /openapi.json, /api/mcp)
npm test           # query-logic parity tests
vercel deploy      # or push to a Vercel-connected GitHub repo
```

### Connect it

- **Claude** (Desktop or claude.ai): add a custom connector pointing at `https://<your-deploy>/api/mcp`.
- **ChatGPT**: create a GPT → Actions → import `https://<your-deploy>/openapi.json`.
- **Other LLMs / code**: call the REST endpoints, or use the OpenAPI spec for function-calling.

Query behavior (court aliasing, title-insensitive judge match, multi-value
`applies_to`, facet placeholder handling) mirrors the explorer's `orders` CLI.
