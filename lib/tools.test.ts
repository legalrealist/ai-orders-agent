import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { TOOL_SPECS, capForModel, MAX_TOOL_RECORDS } from './tools';

describe('TOOL_SPECS', () => {
  it('covers every operation with a uniquely-named, described tool', () => {
    const names = TOOL_SPECS.map((s) => s.name).sort();
    expect(names).toEqual(
      ['bar_opinions', 'facets', 'get_order', 'get_pdf', 'list_orders', 'search_orders', 'stats'].sort(),
    );
    expect(new Set(names).size).toBe(names.length);
    for (const s of TOOL_SPECS) {
      expect(s.name.length).toBeGreaterThan(0);
      expect(s.description.length).toBeGreaterThan(0);
      expect(typeof s.run).toBe('function');
    }
  });

  it('accepts valid args and rejects out-of-bounds inputs (bounded-input contract)', () => {
    const search = z.object(TOOL_SPECS.find((s) => s.name === 'search_orders')!.inputShape);
    expect(search.safeParse({ query: 'hallucinated', court: 'sdny', limit: 10 }).success).toBe(true);
    expect(search.safeParse({ limit: 9999 }).success).toBe(false); // above the 50 cap
    expect(search.safeParse({ limit: 0 }).success).toBe(false); // below min
    expect(search.safeParse({ query: 'x'.repeat(500) }).success).toBe(false); // over length cap

    const get = z.object(TOOL_SPECS.find((s) => s.name === 'get_order')!.inputShape);
    expect(get.safeParse({ id: 42 }).success).toBe(true);
    expect(get.safeParse({ id: 'abc' }).success).toBe(true);
    expect(get.safeParse({}).success).toBe(false); // id required
  });
});

describe('capForModel', () => {
  it('caps over-long arrays and reports truncation', () => {
    const big = Array.from({ length: 100 }, (_, i) => ({ id: i }));
    const capped = capForModel(big) as any;
    expect(capped.truncated).toBe(true);
    expect(capped.returned).toBe(MAX_TOOL_RECORDS);
    expect(capped.total).toBe(100);
    expect(capped.items).toHaveLength(MAX_TOOL_RECORDS);
  });

  it('passes small results through unchanged', () => {
    const small = [{ id: 1 }, { id: 2 }];
    expect(capForModel(small)).toBe(small);
    expect(capForModel({ count: 3 })).toEqual({ count: 3 });
  });
});
