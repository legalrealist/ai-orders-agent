// Protects the funded LLM key (KTD-5). Three independent limits — per-IP burst,
// per-IP daily cap, and a global daily kill-switch — so no single signal is
// load-bearing. Durable via Upstash Redis (Vercel has no shared memory across
// invocations); falls back to a best-effort in-memory limiter when Upstash env
// is absent, flagging `degraded` so the route can warn. The pure decision logic
// is exported separately so it is unit-testable without Redis.
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const num = (name: string, dflt: number) => Number(process.env[name] ?? dflt);

export const LIMITS = {
  burst: num('RL_BURST', 20), // requests per burst window
  burstWindowMs: num('RL_BURST_WINDOW_MS', 60 * 60 * 1000), // 1h refill
  daily: num('RL_DAILY', 100), // per-IP requests/day
  global: num('RL_GLOBAL', 2000), // total requests/day (kill-switch)
};

export interface LimitDecision {
  ok: boolean;
  status: number; // 200 | 429 | 503
  retryAfter: number; // seconds
  reason?: string;
}

// Pure precedence: a tripped global kill-switch (503) outranks a per-IP limit
// (429). `retryAfter` is the longest applicable reset.
export function decideLimit(input: {
  burstOk: boolean;
  dailyOk: boolean;
  globalOk: boolean;
  retryAfter?: number;
}): LimitDecision {
  const retryAfter = Math.max(1, Math.ceil(input.retryAfter ?? 60));
  if (!input.globalOk) return { ok: false, status: 503, retryAfter, reason: 'service is at its daily capacity, try again later' };
  if (!input.burstOk || !input.dailyOk) return { ok: false, status: 429, retryAfter, reason: 'rate limit exceeded, slow down' };
  return { ok: true, status: 200, retryAfter: 0 };
}

// ---- Upstash-backed path ----
// Accepts both the native Upstash names (UPSTASH_REDIS_REST_*) and the Vercel
// KV / Marketplace integration names (KV_REST_API_*), which point at the same
// Upstash database depending on how it was connected.
let redis: Redis | null | undefined;
function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

let limiters: { burst: Ratelimit; daily: Ratelimit; global: Ratelimit } | null = null;
function getLimiters(r: Redis) {
  if (!limiters) {
    limiters = {
      burst: new Ratelimit({ redis: r, prefix: 'rl:burst', limiter: Ratelimit.tokenBucket(LIMITS.burst, `${LIMITS.burstWindowMs} ms`, LIMITS.burst) }),
      daily: new Ratelimit({ redis: r, prefix: 'rl:daily', limiter: Ratelimit.fixedWindow(LIMITS.daily, '24 h') }),
      global: new Ratelimit({ redis: r, prefix: 'rl:global', limiter: Ratelimit.fixedWindow(LIMITS.global, '24 h') }),
    };
  }
  return limiters;
}

// ---- In-memory fallback (dev only; not durable across serverless instances) ----
const memCounts = new Map<string, { count: number; resetAt: number }>();
function memHit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const e = memCounts.get(key);
  if (!e || e.resetAt <= now) {
    memCounts.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: Math.ceil(windowMs / 1000) };
  }
  e.count += 1;
  return { ok: e.count <= limit, retryAfter: Math.ceil((e.resetAt - now) / 1000) };
}

export interface LimitResult extends LimitDecision {
  degraded: boolean;
}

export async function checkLimits(ip: string, sessionId: string): Promise<LimitResult> {
  const id = ip || '0.0.0.0';
  const r = getRedis();

  if (r) {
    const lim = getLimiters(r);
    const [burst, daily, global] = await Promise.all([
      lim.burst.limit(`${id}:${sessionId || 'anon'}`),
      lim.daily.limit(id),
      lim.global.limit('all'),
    ]);
    const retryAfter = Math.max(burst.reset, daily.reset, global.reset, Date.now() + 1000);
    return {
      ...decideLimit({ burstOk: burst.success, dailyOk: daily.success, globalOk: global.success, retryAfter: (retryAfter - Date.now()) / 1000 }),
      degraded: false,
    };
  }

  const burst = memHit(`burst:${id}`, LIMITS.burst, LIMITS.burstWindowMs);
  const daily = memHit(`daily:${id}`, LIMITS.daily, 24 * 60 * 60 * 1000);
  const global = memHit('global', LIMITS.global, 24 * 60 * 60 * 1000);
  return {
    ...decideLimit({
      burstOk: burst.ok,
      dailyOk: daily.ok,
      globalOk: global.ok,
      retryAfter: Math.max(burst.retryAfter, daily.retryAfter, global.retryAfter),
    }),
    degraded: true,
  };
}
