// FY27 per-firm pricing calculator — ported from pitchfollow.html v48

export interface RateCard {
  insightLadder: Array<{ dep: number; ci: number; cmi: number; ciRep: number; cmiRep: number; ciMan: number; cmiMan: number; ciVol: number; cmiVol: number }>;
  insightVolCurve: { ci: Record<string, number>; cmi: Record<string, number> };
  marketPulse: Record<string, number>;
  countryBands: Record<string, { band: string; nbRepDisc: number; nbManDisc: number }>;
  overview: {
    fullRate: { Country: Record<string, number>; PracticeArea: Record<string, number> };
    bandDiscountPct: Record<string, number>;
  };
  usaStateUplift: Record<string, number>;
  bundleRules: Array<{ region: string; scenario: string; bundle: string; product: string; pitch: string; max: string; repDisc: string }>;
}

export interface FirmRecord {
  p: string;
  n: string;
  e: FirmEntry[];
}

// e-column indices: [0]=guide,[1]=seg,[2]=country,[3]=state,[4-5]=unused,[6]=idep,[7]=nb,[8]=inf,[9]=an,[10]=iren,[11]=ren,[12]=fy26
export type FirmEntry = [string, string, string, string | null, number, number, number, number, number, number, number, RenewArr | null, number | null];
type RenewArr = [number, ...number[]]; // [max, p0,r0,m0, p1,r1,m1, ...]

export interface CalcChecks {
  plat: boolean;
  ins: boolean;
  mp: boolean;
  an: boolean;
  ov: boolean;
}

export interface CalcRow {
  id: 'plat' | 'ins' | 'mp' | 'an' | 'ov';
  n: string;
  cname: string;
  pitch: number;
  rep: number;
  lo: number;
  hi: number;
  extra: string;
  isFlat: boolean;
  fy26: number | null;
}

const GUIDE_MAP: Record<string, string> = {
  'ASIA-PACIFIC': 'ASIA', 'GREATER CHINA REGION': 'ASIA', 'UK': 'UK', 'UK BAR': 'UK BAR',
  'USA': 'USA', 'EUROPE': 'EUROPE', 'FRANCE': 'FRANCE', 'GERMANY': 'GERMANY',
  'GLOBAL': 'GLOBAL', 'LATAM': 'LATAM', 'CANADA': 'CANADA', 'HNW': 'HNW',
  'BRAZIL': 'BRAZIL', 'FINTECH': 'FINTECH', 'LITIGATION': 'LITIGATION', 'ALSP': 'ALSP',
};

export const SCEN_LABELS = [
  'PLATFORM ONLY', 'PLATFORM & INSIGHT', 'PLATFORM & MP',
  'PLATFORM/INSIGHT/MP', 'PLATFORM & ANALYTICS', 'PLATFORM/INSIGHT/ANALYTICS',
];

export function r100(x: number): number {
  return Math.round(x / 100) * 100;
}

export function ovGuide(g: string): string | null {
  return GUIDE_MAP[g] ?? null;
}

export function deriveScen(c: { an: boolean; ins: boolean; mp: boolean }): number {
  if (c.an && c.ins) return 5;
  if (c.an) return 4;
  if (c.ins && c.mp) return 3;
  if (c.mp) return 2;
  if (c.ins) return 1;
  return 0;
}

const DEFAULT_BAND = { band: 'Band C', nbRepDisc: 0.25, nbManDisc: 0.30 };

export function calcPricing(
  en: FirmEntry,
  rc: RateCard,
  checks: CalcChecks,
  mode: 'ci' | 'cmi',
  depN: number,
): CalcRow[] {
  const [guide, seg, country, state, , , idep, nb, inf, an, iren, ren, fy26] = en;
  const band = rc.countryBands[country] ?? DEFAULT_BAND;
  const k = deriveScen(checks);
  const rows: CalcRow[] = [];

  // Platform
  if (ren) {
    const pitch = ren[1 + 3 * k] as number;
    const rep = ren[2 + 3 * k] as number;
    const man = ren[3 + 3 * k] as number;
    const max = ren[0] as number;
    if (pitch) {
      rows.push({ id: 'plat', n: 'Profile Platform (renewal)', cname: 'Profile Platform (annual)', pitch, rep, lo: man, hi: max, extra: '', isFlat: false, fy26: fy26 ?? null });
    }
  } else if (nb > 0) {
    const up = state && rc.usaStateUplift[state] ? rc.usaStateUplift[state] : 0;
    const pitch = r100(nb * (1 + up));
    rows.push({
      id: 'plat', n: 'Profile Platform (new)', cname: 'Profile Platform (annual)',
      pitch, rep: Math.round(pitch * (1 - band.nbRepDisc)),
      lo: Math.round(pitch * (1 - band.nbManDisc)), hi: Math.round(pitch * 1.2),
      extra: band.band, isFlat: false, fy26: fy26 ?? null,
    });
  }

  // Insight
  const safeDepN = Math.max(1, depN);
  if (iren > 0 && idep > 0 && safeDepN === idep) {
    rows.push({
      id: 'ins', n: `Insight (renewal · ${idep} dep)`, cname: mode === 'cmi' ? 'Chambers Insight - CMI Report' : 'Chambers Insight - CI Report',
      pitch: iren, rep: iren, lo: iren, hi: Math.round(iren * 1.2), extra: '', isFlat: true, fy26: null,
    });
  } else {
    let pitch: number | null = null;
    const curve = rc.insightVolCurve[mode];
    if (inf > 0 && curve?.[String(safeDepN)]) {
      pitch = r100(curve[String(safeDepN)] * 1.05 * inf * 1.04 * 1.05);
    }
    if (pitch == null) {
      const L = rc.insightLadder[Math.min(safeDepN, 51) - 1];
      pitch = L ? (L[mode] as number) : null;
    }
    if (pitch != null) {
      const approxTag = iren > 0 && safeDepN !== idep ? ' ~approx' : '';
      rows.push({
        id: 'ins', n: `Insight ${mode.toUpperCase()} (${safeDepN} dep)`,
        cname: mode === 'cmi' ? 'Chambers Insight - CMI Report' : 'Chambers Insight - CI Report',
        pitch, rep: r100(pitch * 0.9), lo: r100(pitch * 0.85), hi: r100(pitch * 1.2),
        extra: approxTag, isFlat: true, fy26: null,
      });
    }
  }

  // Market Pulse
  const mpPrice = rc.marketPulse[seg];
  if (mpPrice) {
    rows.push({
      id: 'mp', n: `Market Pulse (${seg})`, cname: 'Market Pulse (annual)',
      pitch: mpPrice, rep: Math.round(mpPrice * rc.marketPulse.minPct),
      lo: Math.round(mpPrice * rc.marketPulse.minPct), hi: Math.round(mpPrice * rc.marketPulse.maxPct),
      extra: '', isFlat: false, fy26: null,
    });
  }

  // Analytics
  if (an > 0) {
    rows.push({ id: 'an', n: 'Practice Analytics', cname: 'Practice Analytics', pitch: an, rep: an, lo: an, hi: an, extra: '', isFlat: false, fy26: null });
  }

  // In-Depth Overview
  const og = ovGuide(guide);
  if (og) {
    const pa = rc.overview.fullRate.PracticeArea[og];
    const full = rc.overview.fullRate.Country[og];
    const pct = rc.overview.bandDiscountPct[band.band] ?? 0.2;
    if (pa) {
      const pitch = Math.round(pa * (1 - pct));
      let extra = `${band.band} −${Math.round(pct * 100)}%`;
      if (full) extra += `  |  Country: £${Math.round(full * (1 - pct)).toLocaleString()}`;
      rows.push({ id: 'ov', n: `In-Depth Overview (${og})`, cname: 'In-Depth Overview (annual)', pitch, rep: pitch, lo: pitch, hi: Math.round(pa), extra, isFlat: false, fy26: null });
    }
  }

  return rows;
}

export function defaultChecks(en: FirmEntry): CalcChecks {
  const [, , , , , , , nb, , , iren, ren] = en;
  return {
    plat: !!(ren || nb > 0),
    ins: iren > 0,
    mp: false,
    an: false,
    ov: false,
  };
}

export function defaultDepN(en: FirmEntry): number {
  const idep = en[6];
  return idep > 0 ? idep : 1;
}
