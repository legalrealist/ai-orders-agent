import { headers } from 'next/headers';
import { opStats } from '@/lib/api';
import CopyField from './CopyField';

const fmt = (n: number) => n.toLocaleString('en-US');

export default async function Home() {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  const base = `${proto}://${host}`;

  let stats: Awaited<ReturnType<typeof opStats>> | null = null;
  try {
    stats = await opStats();
  } catch {
    stats = null;
  }
  const total = stats?.total ?? 929;
  const sanctions = stats?.by_consequence?.sanctions_attorney ?? 297;
  const withText = stats?.with_pdf ?? 608;
  const years = stats?.date_range ? `${stats.date_range[0].slice(0, 4)}–${stats.date_range[1].slice(0, 4)}` : '2023–2026';

  return (
    <main className="wrap">
      <section className="hero">
        <p className="eyebrow rise d1">U.S. courts · AI in legal filings</p>
        <h1 className="rise d2">
          Every order where AI <em>met</em> the bench.
        </h1>
        <p className="lead rise d3">
          A searchable record of {fmt(total)} U.S. court orders and opinions on AI use in legal
          filings — judges sanctioning hallucinated citations, AI standing orders, disclosure rules,
          and state-bar AI ethics opinions. Read the full text of each order, not just a summary.
        </p>
        <div className="cta-row rise d4">
          <a href="/chat" className="btn">Chat with the dataset →</a>
          <a href="https://legalhack.io/explorer/charts/dist/index.html#cat=0" target="_blank" rel="noreferrer" className="btn-ghost">Browse the visual explorer ↗</a>
        </div>
        <p className="hint rise d4" style={{ marginTop: 12 }}>Ask in plain English — no setup, no key. Prefer charts? Explore the dataset visually.</p>

        <div className="stats rise d5">
          <div className="stat"><div className="num">{fmt(total)}</div><div className="lbl">orders &amp; opinions</div></div>
          <div className="stat"><div className="num">{fmt(sanctions)}</div><div className="lbl">attorney sanctions</div></div>
          <div className="stat"><div className="num">{fmt(withText)}</div><div className="lbl">with full text</div></div>
          <div className="stat"><div className="num">{years}</div><div className="lbl">date range</div></div>
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>Connect your own LLM</h2>
          <p>Prefer your own assistant? Point it at the same tools. Pick your client and follow the steps — copy the URL, paste it in, done.</p>
        </div>
        <div className="guides">
          <div className="guide">
            <div className="guide-head">
              <div className="title"><span className="tag">MCP</span><h3>Claude (Desktop &amp; claude.ai)</h3></div>
              <a className="doc" href="https://claude.ai/settings/connectors" target="_blank" rel="noreferrer">Open connector settings</a>
            </div>
            <ol className="steps">
              <li><div className="step-body">Open <strong>Settings → Connectors</strong> (claude.ai or the Claude desktop app), then click <strong>Add custom connector</strong>.</div></li>
              <li><div className="step-body">Paste this MCP server URL and save:<div className="cf"><CopyField value={`${base}/api/mcp`} /></div></div></li>
              <li><div className="step-body">Start a chat and ask, e.g. <em>“Which judges sanctioned attorneys for hallucinated AI citations?”</em> Claude will call the dataset tools automatically.</div></li>
            </ol>
          </div>

          <div className="guide">
            <div className="guide-head">
              <div className="title"><span className="tag">OpenAPI</span><h3>ChatGPT (custom GPT Actions)</h3></div>
              <a className="doc" href="https://chatgpt.com/gpts/editor" target="_blank" rel="noreferrer">Open the GPT editor</a>
            </div>
            <ol className="steps">
              <li><div className="step-body">In the GPT editor, go to <strong>Configure → Actions → Create new action</strong> (requires a paid ChatGPT plan).</div></li>
              <li><div className="step-body">Choose <strong>Import from URL</strong> and paste this OpenAPI spec:<div className="cf"><CopyField value={`${base}/openapi.json`} /></div></div></li>
              <li><div className="step-body">Save. The GPT can now query the dataset — ask it about AI court orders in plain English.</div></li>
            </ol>
          </div>

          <div className="guide">
            <div className="guide-head">
              <div className="title"><span className="tag">REST</span><h3>Any LLM or code</h3></div>
              <a className="doc" href="https://modelcontextprotocol.io" target="_blank" rel="noreferrer">About MCP</a>
            </div>
            <ol className="steps">
              <li><div className="step-body">Hand the OpenAPI spec to your function-calling loop:<div className="cf"><CopyField value={`${base}/openapi.json`} /></div></div></li>
              <li><div className="step-body">Or call the JSON endpoints directly — try it now:<div className="cf"><CopyField value={`curl "${base}/api/search?q=hallucinated&consequence=sanctions_attorney"`} display={`curl "${host}/api/search?q=hallucinated&consequence=sanctions_attorney"`} /></div></div></li>
              <li><div className="step-body">Read a full order with <code className="inline">/api/text/&#123;id&#125;</code>. Full endpoint reference is below.</div></li>
            </ol>
          </div>
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>REST endpoints</h2>
          <p>Read-only JSON. Click any line to copy.</p>
        </div>
        <div className="endpoints">
          <CopyField value={`${base}/api/search?q=hallucinated&consequence=sanctions_attorney`} display="/api/search?q=hallucinated&consequence=sanctions_attorney" />
          <CopyField value={`${base}/api/list?court=sdny&consequence=sanctions_attorney&count=1`} display="/api/list?court=sdny&consequence=sanctions_attorney&count=1" />
          <CopyField value={`${base}/api/record/1`} display="/api/record/{id}" />
          <CopyField value={`${base}/api/text/1`} display="/api/text/{id}  · full order text" />
          <CopyField value={`${base}/api/facets?field=judge&limit=20`} display="/api/facets?field=judge&limit=20" />
          <CopyField value={`${base}/api/stats`} display="/api/stats" />
          <CopyField value={`${base}/api/bar?state=California`} display="/api/bar?state=California" />
        </div>
      </section>

      <div className="foot">
        <span>AI Court Orders · read-only dataset API</span>
        <span><a href="/chat">Chat</a> · <a href="https://legalhack.io/explorer/charts/dist/index.html#cat=0" target="_blank" rel="noreferrer">Explorer</a> · <a href="/openapi.json">OpenAPI</a> · <a href="/api/mcp">MCP</a></span>
      </div>
    </main>
  );
}
