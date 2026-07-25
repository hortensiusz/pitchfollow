import type { QuoteRow, QuoteState, CurrencyCode } from './types';

export interface CalcResult {
  sub: number;
  afterDisc: number;
  vat: number;
  total: number;
  sub2: number;
  afterDisc2: number;
  vat2: number;
  total2: number;
  grand2y: number;
  twoYear: boolean;
}

export function calcQuote(quote: QuoteState): CalcResult {
  const twoYear = quote.term !== '1y';
  let sub = 0, sub2 = 0;
  quote.rows.forEach(r => {
    const line = (r.flat ? r.price : r.qty * r.price) * (1 - r.disc / 100);
    sub += line;
    const p2 = typeof r.p2 === 'number' ? r.p2 : 0;
    sub2 += (r.flat ? p2 : r.qty * p2) * (1 - r.disc / 100);
  });
  const gd = quote.gd;
  const afterDisc = sub * (1 - gd / 100);
  const vat = quote.vat ? afterDisc * 0.2 : 0;
  const total = afterDisc + vat;
  const afterDisc2 = sub2 * (1 - gd / 100);
  const vat2 = quote.vat ? afterDisc2 * 0.2 : 0;
  const total2 = afterDisc2 + vat2;
  return { sub, afterDisc, vat, total, sub2, afterDisc2, vat2, total2, grand2y: total + total2, twoYear };
}

export function formatMoney(n: number, currency: CurrencyCode): string {
  return currency + Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function rowOneNet(r: QuoteRow): number {
  const base = r.flat ? r.price : r.qty * r.price;
  return base * (1 - r.disc / 100);
}

export function calcP1Default(r: QuoteRow, twoYrDisc: number): number | '' {
  const base = r.flat ? r.price : r.qty * r.price;
  const net = base * (1 - r.disc / 100);
  if (!net) return '';
  let line = net * (1 - twoYrDisc / 100);
  if (r.floor > 0 && line < r.floor) line = r.floor;
  const unit = r.flat ? line : line / Math.max(1, r.qty);
  return Math.round(unit * 100) / 100;
}

export function calcP2Default(p1: number, uplift: number): number | '' {
  if (!p1) return '';
  return Math.round(p1 * (1 + uplift / 100) * 100) / 100;
}
