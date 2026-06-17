// MCP server (Streamable HTTP) — add this URL as a custom connector in Claude
// Desktop / claude.ai, or any MCP client. Every CLI command is exposed as a
// tool. Tool definitions are shared with the chat route via lib/tools.ts so the
// two agent surfaces never drift.
import { createMcpHandler } from 'mcp-handler';
import { TOOL_SPECS } from '@/lib/tools';

const json = (v: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(v, null, 2) }] });

const handler = createMcpHandler((server) => {
  for (const spec of TOOL_SPECS) {
    server.tool(spec.name, spec.description, spec.inputShape, async (a: any) => json(await spec.run(a)));
  }
}, {}, { basePath: '/api' });

export { handler as GET, handler as POST };
