import { describe, it, expect } from 'vitest';
import { search, applyFilters, facet, courtMatch, judgeMatch, appliesMatch, stats } from './orders';

const RECS = [
  { id: 0, name: 'D. Mass. – Judge Leo T. Sorokin', judge: 'Judge Leo T. Sorokin', court: 'S.D.N.Y.', state: 'New York', date: '2026-05-12', type: 'Judicial Opinion', consequence: 'sanctions_attorney', applies_to: 'Attorneys,Pro Se Litigants', summary: 'used ChatGPT with hallucinated citations', pdf: 'x', applicableTo: ['Generative AI Usage'] },
  { id: 1, name: 'Standing Order', judge: '', court: 'U.S. District Court, Southern District of New York', state: 'New York', date: '2025-01-15', type: 'Standing Order', consequence: null, applies_to: 'Any Parties', summary: 'disclosure required', pdf: '', applicableTo: [] },
  { id: 2, name: 'Doe v. Roe', judge: 'Chief Judge Nina Y. Wang', court: 'N.D. Cal.', state: 'California', date: '2026-02-01', type: 'Judicial Opinion', consequence: 'warning', applies_to: 'Pro Se Litigants', summary: 'pro se warned', pdf: '', applicableTo: ['Generative AI Usage'] },
];

describe('query parity with the CLI', () => {
  it('search AND-matches tokens', () => {
    expect(search(RECS, 'chatgpt hallucinated').map(r => r.id)).toEqual([0]);
  });
  it('court alias unifies both SDNY spellings', () => {
    expect(applyFilters(RECS, { court: 'sdny' }).map(r => r.id)).toEqual([0, 1]);
    expect(courtMatch('U.S. District Court, Southern District of New York', 'S.D.N.Y.')).toBe(true);
    expect(courtMatch('N.D. Cal.', 'S.D.N.Y.')).toBe(false);
    // a district alias must not leak into specialized courts
    expect(courtMatch('Bankr. S.D.N.Y.', 'sdny')).toBe(false);
    expect(courtMatch('2d Cir.', 'sdny')).toBe(false);
    expect(courtMatch('Bankr. S.D.N.Y.', 'bankr')).toBe(true);
  });
  it('judge match is title-insensitive', () => {
    expect(judgeMatch('Chief Judge Nina Y. Wang', 'Wang')).toBe(true);
    expect(judgeMatch('', 'Wang')).toBe(false);
  });
  it('applies_to matches multi-value', () => {
    expect(appliesMatch('Attorneys,Pro Se Litigants', 'Attorneys')).toBe(true);
    expect(applyFilters(RECS, { applies_to: 'Attorneys' }).map(r => r.id)).toEqual([0]);
  });
  it('facets drop placeholders + empties', () => {
    const f = facet([{ judge: 'All Judges' }, { judge: 'Judge X' }, { judge: 'Judge X' }, { judge: '' }], 'judge');
    expect(f).toEqual([{ value: 'Judge X', count: 2 }]);
  });
  it('date filter + count', () => {
    expect(applyFilters(RECS, { date_from: '2026-01-01' }).map(r => r.id)).toEqual([0, 2]);
  });
  it('stats', () => {
    const s = stats(RECS);
    expect(s.total).toBe(3);
    expect(s.with_pdf).toBe(1);
    expect(s.date_range).toEqual(['2025-01-15', '2026-05-12']);
  });
});
