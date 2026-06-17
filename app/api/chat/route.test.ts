import { describe, it, expect } from 'vitest';
import { POST } from './route';

// Allowed requests construct a lazy stream (never consumed here, so no network
// call); this lets the rate-limit gate be exercised end-to-end with a dummy key.
process.env.OPENROUTER_API_KEY ||= 'sk-test-dummy';

// These exercise the pre-stream gate (body validation + rate limiting) without
// an API key — the gate must short-circuit before any model call. Uses the
// in-memory limiter fallback (no Upstash env in test).
const post = (body: unknown, headers: Record<string, string> = {}) =>
  POST(new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }));

describe('POST /api/chat gate', () => {
  it('returns 400 for a missing/empty messages array without invoking the model', async () => {
    const res = await post({ messages: [] });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/messages/);
  });

  it('returns 400 for an unparseable body', async () => {
    const res = await post('{ not json');
    expect(res.status).toBe(400);
  });

  it('returns 429 with a Retry-After once the per-IP burst bucket is exhausted', async () => {
    const ip = '203.0.113.7';
    const msg = { messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'hi' }] }] };
    let last: Response | undefined;
    // Burst cap is 20; the 21st request from one IP must be limited. No model
    // is configured, so any request that passed the gate would throw instead of
    // returning 429 — reaching a clean 429 proves the gate fired first.
    for (let i = 0; i < 25; i++) {
      last = await post(msg, { 'x-forwarded-for': ip });
      if (last.status === 429) break;
    }
    expect(last!.status).toBe(429);
    expect(last!.headers.get('Retry-After')).toBeTruthy();
  });
});
