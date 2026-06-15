export default function Home() {
  return (
    <main>
      <h1>AI Court Orders API</h1>
      <p>
        Query 900+ U.S. court orders &amp; opinions on AI use in legal filings —
        judges sanctioning hallucinated citations, AI standing orders, disclosure
        rules, and state-bar AI ethics opinions.
      </p>
      <h2>For Claude (and any MCP client)</h2>
      <p>Add this as a custom connector:</p>
      <pre><code>/api/mcp</code></pre>
      <h2>For ChatGPT (Actions) / any LLM</h2>
      <p>Import the OpenAPI spec:</p>
      <pre><code>/openapi.json</code></pre>
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
