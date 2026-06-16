import { describe, it, expect } from 'vitest';
import { decideLimit } from './ratelimit';

describe('decideLimit', () => {
  it('allows when all checks pass', () => {
    const d = decideLimit({ burstOk: true, dailyOk: true, globalOk: true });
    expect(d).toEqual({ ok: true, status: 200, retryAfter: 0 });
  });

  it('returns 429 when the per-IP burst bucket is empty', () => {
    const d = decideLimit({ burstOk: false, dailyOk: true, globalOk: true, retryAfter: 30 });
    expect(d.ok).toBe(false);
    expect(d.status).toBe(429);
    expect(d.retryAfter).toBe(30);
  });

  it('returns 429 when the per-IP daily cap is hit', () => {
    const d = decideLimit({ burstOk: true, dailyOk: false, globalOk: true });
    expect(d.status).toBe(429);
  });

  it('returns 503 when the global kill-switch trips, taking precedence over per-IP limits', () => {
    const d = decideLimit({ burstOk: false, dailyOk: false, globalOk: false, retryAfter: 120 });
    expect(d.ok).toBe(false);
    expect(d.status).toBe(503);
    expect(d.retryAfter).toBe(120);
  });

  it('floors retryAfter at 1 second', () => {
    const d = decideLimit({ burstOk: false, dailyOk: true, globalOk: true, retryAfter: 0 });
    expect(d.retryAfter).toBe(1);
  });
});
