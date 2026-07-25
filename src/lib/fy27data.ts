// Shared singleton for FY27 rate card data — fetched once per page load
import type { RateCard, FirmRecord } from './fy27calc';

let _rc: RateCard | null = null;
let _firms: FirmRecord[] | null = null;
let _loading = false;
let _listeners: Array<() => void> = [];

export function getRateCard(): RateCard | null { return _rc; }
export function getFirms(): FirmRecord[] | null { return _firms; }

export async function ensureFy27Data(onReady: () => void): Promise<void> {
  if (_rc && _firms) { onReady(); return; }
  _listeners.push(onReady);
  if (_loading) return;
  _loading = true;
  try {
    const [rcRes, frRes] = await Promise.all([
      fetch('/data/rate-card-tables.json'),
      fetch('/data/firm-rates.json'),
    ]);
    _rc = (await rcRes.json()) as RateCard;
    const frData = (await frRes.json()) as { firms: FirmRecord[] };
    _firms = frData.firms;
  } catch (e) {
    console.error('FY27 data load failed', e);
  }
  _listeners.forEach(fn => fn());
  _listeners = [];
}

export function searchFirms(query: string, limit = 15): FirmRecord[] {
  if (!_firms || query.length < 2) return [];
  const lq = query.toLowerCase();
  const hits: FirmRecord[] = [];
  for (const f of _firms) {
    if (f.n.toLowerCase().includes(lq)) {
      hits.push(f);
      if (hits.length >= limit) break;
    }
  }
  return hits;
}
