// Live-fetch the dataset (the explorer repo is the source of truth) with an
// in-memory TTL cache. Set ORDERS_DATA_BASE to where the explorer publishes its
// JSON — e.g. https://legalhack.io/data or the GitHub raw base of the data files.
import type { Record_ } from './orders';

const BASE = process.env.ORDERS_DATA_BASE
  || 'https://raw.githubusercontent.com/legalrealist/AI-orders-explorer/main/charts/data';
const TTL_MS = Number(process.env.ORDERS_CACHE_TTL_MS ?? 10 * 60 * 1000);

type CacheEntry = { at: number; data: any };
const cache = new Map<string, CacheEntry>();

async function fetchJson(name: string): Promise<any> {
  const hit = cache.get(name);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  const res = await fetch(`${BASE}/${name}`, { headers: { 'User-Agent': 'ai-orders-agent' } });
  if (!res.ok) {
    if (hit) return hit.data; // serve stale on upstream failure
    throw new Error(`fetch ${name} failed: ${res.status}`);
  }
  const data = await res.json();
  cache.set(name, { at: Date.now(), data });
  return data;
}

export async function loadOrders(): Promise<Record_[]> {
  return fetchJson('explorer_data.json');
}

export async function loadBar(): Promise<any> {
  return fetchJson('bar_opinions.json');
}
