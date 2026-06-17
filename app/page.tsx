export default function Home() {
  return (
    <main>
      <h1>AI Court Orders API</h1>
      <p>
        Query 900+ U.S. court orders &amp; opinions on AI use in legal filings —
        judges sanctioning hallucinated citations, AI standing orders, disclosure
        rules, and state-bar AI ethics opinions.
      </p>

      <p style={{ margin: '20px 0' }}>
        <a
          href="/chat"
          style={{
            display: 'inline-block', padding: '10px 20px', fontSize: 16, fontWeight: 600,
            background: '#06c', color: '#fff', borderRadius: 6, textDecoration: 'none',
          }}
        >
          💬 Chat with the dataset →
        </a>{' '}
        <span style={{ color: '#666' }}>Ask in plain English — no setup.</span>
      </p>

      <h2>Connect your own assistant</h2>
      <p>The same data, queryable from your own LLM client:</p>
      <ul>
        <li>
          <strong>Claude</strong> (Desktop or claude.ai) — add a custom connector pointing at{' '}
          <code>/api/mcp</code> (MCP).
        </li>
        <li>
          <strong>ChatGPT</strong> — create a GPT → Actions → import <code>/openapi.json</code>.
        </li>
        <li>
          <strong>Any LLM / code</strong> — call the REST endpoints, or use the OpenAPI spec for
          function-calling.
        </li>
      </ul>

      <h2>REST</h2>
      <ul>
        <li><code>/api/search?q=hallucinated&amp;consequence=sanctions_attorney</code></li>
        <li><code>/api/list?court=sdny&amp;consequence=sanctions_attorney&amp;count=1</code></li>
        <li><code>/api/record/&#123;id&#125;</code> · <code>/api/pdf/&#123;id&#125;</code></li>
        <li><code>/api/facets?field=judge&amp;limit=20</code> · <code>/api/stats</code> · <code>/api/bar?state=California</code></li>
      </ul>
    </main>
  );
}
