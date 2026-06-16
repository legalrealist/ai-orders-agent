import { describe, it, expect } from 'vitest';
import { search, applyFilters, facet, courtMatch, judgeMatch, appliesMatch, stats, project, LIST_FIELDS } from './orders';

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

describe('CLI parity: --requires, filter-aware facets, summary projection', () => {
  const REQ = [
    { id: 0, court: 'N.D. Cal.', type: 'Standing Order', reqs: { disclose: true } },
    { id: 1, court: 'N.D. Cal.', type: 'Standing Order', reqs: { disclose: false } },
    { id: 2, court: 'S.D.N.Y.', type: 'Judicial Opinion', reqs: { rules: 'FRCP 11' } },
    { id: 3, court: 'D. Mass.', type: 'Standing Order', reqs: {} },
    { id: 4, court: 'D. Mass.', type: 'Standing Order' }, // no reqs key
  ];

  it('requires matches only truthy reqs values', () => {
    expect(applyFilters(REQ, { requires: 'disclose' }).map(r => r.id)).toEqual([0]);
  });
  it('requires treats string values as truthy', () => {
    expect(applyFilters(REQ, { requires: 'rules' }).map(r => r.id)).toEqual([2]);
  });
  it('requires: unknown key matches nothing, missing reqs does not throw', () => {
    expect(applyFilters(REQ, { requires: 'nonexistent' })).toEqual([]);
    expect(applyFilters(REQ, { requires: 'disclose' }).map(r => r.id)).toEqual([0]);
  });
  it('requires composes with other filters', () => {
    expect(applyFilters(REQ, { type: 'Standing Order', requires: 'disclose' }).map(r => r.id)).toEqual([0]);
  });
  it('facets over a filtered subset (filter-aware facets)', () => {
    const sub = applyFilters(REQ, { requires: 'disclose' });
    expect(facet(sub, 'court')).toEqual([{ value: 'N.D. Cal.', count: 1 }]);
  });
  it('summary is in the projection', () => {
    expect(LIST_FIELDS).toContain('summary');
    expect(project(RECS[0]).summary).toBe('used ChatGPT with hallucinated citations');
  });
});
