'use client';
import React from 'react';
import { useStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import type { QuoteRow, QuoteState } from '@/lib/types';
import type { CalcResult } from '@/lib/quoteCalc';
import { Card } from './ui/Card';
import { calcQuote, formatMoney, rowOneNet, calcP1Default, calcP2Default } from '@/lib/quoteCalc';

export default function QuoteSection() {
  const { app, setQuote, addQuoteRow, updateQuoteRow, removeQuoteRow, priceList, uiLang, saveState } = useStore();
  const T = (k: Parameters<typeof t>[0]) => t(k, uiLang);
  const q = app.quote;
  const twoYear = q.term !== '1y';
  const result = calcQuote(q);
  const cur = app.currency;
  const money = (n: number) => formatMoney(n, cur);

  const updateRow = (i: number, patch: Partial<QuoteRow>) => {
    updateQuoteRow(i, patch);
    saveState();
  };

  const handleNameChange = (i: number, name: string) => {
    const found = priceList.find(p => p.name === name);
    const patch: Partial<QuoteRow> = { name };
    if (found && (!q.rows[i].price || q.rows[i].price === 0)) {
      patch.price = found.price;
    }
    updateRow(i, patch);
  };

  const termOptions = [
    { value: '1y', label: T('term1y') },
    { value: '2y', label: T('term2y') },
    { value: 'both', label: T('termBoth') },
  ];

  return (
    <Card>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <label className="flex items-center gap-1.5 cursor-pointer select-none text-sm text-gray-500">
          <input
            type="checkbox"
            checked={q.inc}
            onChange={e => { setQuote({ inc: e.target.checked }); saveState(); }}
            className="accent-[#1e3a5f] w-4 h-4"
          />
          <span>{T('lblWriteToPpt')}</span>
        </label>
        <input
          type="text"
          className="flex-1 font-semibold text-[#1e3a5f] text-base bg-transparent border-b border-transparent hover:border-gray-200 focus:border-[#1e3a5f] outline-none"
          value={q.title}
          onChange={e => { setQuote({ title: e.target.value }); saveState(); }}
        />
      </div>

      {/* Term options */}
      <div className="flex flex-wrap gap-3 mb-4 text-sm">
        <div>
          <label className="field-label">{T('lblQuoteTerm')}</label>
          <select
            className="field-input w-auto"
            value={q.term}
            onChange={e => { setQuote({ term: e.target.value as '1y' | '2y' | 'both' }); saveState(); }}
          >
            {termOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {twoYear && (
          <>
            <div>
              <label className="field-label">{T('lblTwoYrDisc')}</label>
              <input type="number" className="field-input w-20" value={q.twoYrDisc}
                onChange={e => { setQuote({ twoYrDisc: +e.target.value }); saveState(); }} />
            </div>
            <div>
              <label className="field-label">{T('lblY2Uplift')}</label>
              <input type="number" className="field-input w-20" value={q.y2Uplift}
                onChange={e => { setQuote({ y2Uplift: +e.target.value }); saveState(); }} />
            </div>
          </>
        )}
      </div>

      {/* Quote table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-400 text-left">
              <th className="py-2 px-2 font-medium w-[28%]">{T('thItem')}</th>
              <th className="py-2 px-2 font-medium w-[7%]">{T('thQty')}</th>
              <th className="py-2 px-2 font-medium w-[12%]">{T('thPrice')}</th>
              <th className="py-2 px-2 font-medium w-[9%]">{T('thDisc')}</th>
              <th className="py-2 px-2 font-medium text-right w-[12%]">{T('thSub')}</th>
              {twoYear && <>
                <th className="py-2 px-2 font-medium w-[12%]">{T('thY2a')}</th>
                <th className="py-2 px-2 font-medium w-[9%]">{T('thY2up')}</th>
                <th className="py-2 px-2 font-medium w-[12%]">{T('thY2b')}</th>
              </>}
              <th className="py-2 px-2 w-[5%]"></th>
            </tr>
          </thead>
          <tbody>
            {q.rows.map((r, i) => {
              const sub = rowOneNet(r);
              const p1val = typeof r.p2y1 === 'number' ? r.p2y1 : (calcP1Default(r, q.twoYrDisc) as number | '');
              // Fix 5: use per-row uplift if set, otherwise global
              const effectiveUplift = typeof r.up === 'number' ? r.up : q.y2Uplift;
              // Fix 5: only use stored p2 when manually edited; otherwise always recalculate from uplift
              const p2val = (r.y2manual && typeof r.p2 === 'number')
                ? r.p2
                : (typeof p1val === 'number' ? calcP2Default(p1val, effectiveUplift) : '');
              const p2below = twoYear && typeof p2val === 'number' && typeof p1val === 'number' && p2val < p1val;

              return (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-1 px-2">
                    <input
                      type="text"
                      list="price-list"
                      className="field-input text-sm"
                      value={r.name}
                      placeholder={T('phRowName')}
                      onChange={e => handleNameChange(i, e.target.value)}
                    />
                    {/* Fix 3: show guide */}
                    {r.guide && <div className="text-xs text-gray-400 mt-0.5">Guide: {r.guide}</div>}
                    {r.parts && r.parts.length > 0 && (
                      <div className="text-xs text-gray-400 mt-0.5">Bundle: {r.parts.join(' / ')}</div>
                    )}
                    {/* Fix 4: show dept count for flat-priced (Insight) rows */}
                    {r.flat && <div className="text-xs text-gray-400 mt-0.5">Flat total · {r.qty} dept{r.qty !== 1 ? 's' : ''}</div>}
                  </td>
                  <td className="py-1 px-2">
                    <input type="number" className="field-input w-full text-sm" min={0} step={1} value={r.qty}
                      onChange={e => updateRow(i, { qty: +e.target.value })} />
                    {r.flat && <div className="text-xs text-gray-400 mt-0.5">depts</div>}
                  </td>
                  <td className="py-1 px-2">
                    <input type="number" className="field-input w-full text-sm" min={0} step={0.01} value={r.price}
                      onChange={e => updateRow(i, { price: +e.target.value })} />
                    {r.floor > 0 && (
                      <div className="text-xs text-gray-400 mt-0.5">Floor: {money(r.floor)}</div>
                    )}
                  </td>
                  <td className="py-1 px-2">
                    <input type="number" className="field-input w-full text-sm" min={0} max={100} step={0.5} value={r.disc}
                      onChange={e => updateRow(i, { disc: +e.target.value })} />
                  </td>
                  <td className="py-1 px-2 text-right font-medium text-[#1e3a5f]">
                    {r.name || r.qty ? money(sub) : '—'}
                  </td>
                  {twoYear && <>
                    <td className="py-1 px-2">
                      <input type="number" className="field-input w-full text-sm" min={0} step={0.01}
                        value={r.p2y1manual && typeof r.p2y1 === 'number' ? r.p2y1 : (typeof p1val === 'number' ? p1val : '')}
                        onChange={e => updateRow(i, { p2y1: +e.target.value, p2y1manual: true })}
                        placeholder={typeof p1val === 'number' ? String(p1val) : ''}
                      />
                    </td>
                    <td className="py-1 px-2">
                      <input type="number" className="field-input w-full text-sm" min={0} step={0.5}
                        value={r.up !== '' ? r.up : ''}
                        placeholder={String(q.y2Uplift)}
                        onChange={e => updateRow(i, { up: e.target.value !== '' ? +e.target.value : '', y2manual: false })}
                      />
                    </td>
                    <td className="py-1 px-2">
                      <input type="number" className={`field-input w-full text-sm ${p2below ? 'border-red-400' : ''}`}
                        min={0} step={0.01}
                        value={typeof p2val === 'number' ? p2val : ''}
                        onChange={e => updateRow(i, { p2: +e.target.value, y2manual: true })}
                        placeholder={typeof p2val === 'number' ? String(p2val) : ''}
                      />
                      {p2below && <div className="text-red-500 text-xs mt-0.5">{T('warnBelowY1')}</div>}
                    </td>
                  </>}
                  <td className="py-1 px-2">
                    <button onClick={() => { removeQuoteRow(i); saveState(); }}
                      className="text-gray-300 hover:text-red-500 text-lg px-1">✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <datalist id="price-list">
        {priceList.map(p => <option key={p.name} value={p.name} />)}
      </datalist>

      <button onClick={() => { addQuoteRow(); saveState(); }}
        className="w-full border border-dashed border-gray-300 rounded-md py-1.5 text-sm text-gray-500 hover:bg-gray-50 mt-2">
        {T('btnAddQuote')}
      </button>

      {/* Options row */}
      <div className="flex flex-wrap gap-4 mt-3 text-sm items-center">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">{T('lblGlobalDisc')}</span>
          <input type="number" className="field-input w-20" value={q.gd} min={0} max={100} step={0.5}
            onChange={e => { setQuote({ gd: +e.target.value }); saveState(); }} />
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={q.vat}
            onChange={e => { setQuote({ vat: e.target.checked }); saveState(); }}
            className="accent-[#1e3a5f] w-4 h-4" />
          <span className="text-gray-600">{T('lblVat')}</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={q.prodIntro}
            onChange={e => { setQuote({ prodIntro: e.target.checked }); saveState(); }}
            className="accent-[#1e3a5f] w-4 h-4" />
          <span className="text-gray-600">{T('lblProdIntro')}</span>
        </label>
      </div>

      {/* Side-by-side option cards (shown when term = both) */}
      {q.term === 'both' && q.rows.some(r => r.name) && (
        <BothOptionsCards q={q} result={result} money={money} />
      )}

      {/* Totals (stacked summary — hidden when both-cards are shown) */}
      {(q.term as string) !== 'both' && q.rows.some(r => r.name) && (
        <div className="mt-3 flex flex-col items-end gap-0.5 text-sm">

          {/* 1-year option (shown for term=1y and term=both) */}
          {(q.term === '1y' || q.term === 'both') && (
            <TotalsBlock
              heading={q.term === 'both' ? '1-YEAR OPTION' : undefined}
              totalLabel="Year 1 total:"
              sub={result.sub} gd={q.gd} afterDisc={result.afterDisc}
              vat={result.vat} total={result.total} vatOn={q.vat} money={money}
            />
          )}

          {/* 2-year contract (shown for term=2y and term=both) */}
          {twoYear && (
            <div className="mt-3 flex flex-col items-end gap-0.5">
              {q.term === 'both' && (
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1 min-w-[280px] text-right">
                  2-YEAR CONTRACT
                </div>
              )}
              <TotalsBlock
                totalLabel="Year 1 total:"
                sub={result.sub} gd={q.gd} afterDisc={result.afterDisc}
                vat={result.vat} total={result.total} vatOn={q.vat} money={money}
              />
              <TotalsBlock
                totalLabel="Year 2 total:"
                sub={result.sub2} gd={q.gd} afterDisc={result.afterDisc2}
                vat={result.vat2} total={result.total2} vatOn={q.vat} money={money}
              />
              <div className="flex gap-6 min-w-[280px] justify-between border-t-2 border-[#1e3a5f] pt-2 mt-1">
                <span className="font-semibold">2-year total:</span>
                <strong className="text-[#1e3a5f] text-base">{money(result.grand2y)}</strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quote note */}
      <div className="mt-3">
        <label className="field-label">{T('lblQuoteNote')}</label>
        <textarea
          className="field-input text-sm min-h-[50px]"
          value={q.note}
          placeholder={T('phQuoteNote')}
          onChange={e => { setQuote({ note: e.target.value }); saveState(); }}
        />
      </div>
    </Card>
  );
}

interface TotalsBlockProps {
  heading?: string;
  totalLabel: string;
  sub: number;
  gd: number;
  afterDisc: number;
  vat: number;
  total: number;
  vatOn: boolean;
  money: (n: number) => string;
}

function TotalsBlock({ heading, totalLabel, sub, gd, afterDisc, vat, total, vatOn, money }: TotalsBlockProps) {
  const Row = ({ l, v, indent }: { l: string; v: string; indent?: boolean }) => (
    <div className={`flex gap-6 min-w-[280px] justify-between ${indent ? 'text-gray-400' : ''}`}>
      <span className="text-gray-500">{l}</span>
      <span>{v}</span>
    </div>
  );
  return (
    <div className="mt-1 flex flex-col gap-0.5">
      {heading && <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">{heading}</div>}
      <Row l="Subtotal:" v={money(sub)} />
      {gd > 0 && <Row l={`Global discount (${gd}%):`} v={`−${money(sub - afterDisc)}`} indent />}
      {gd > 0 && <Row l="After discount:" v={money(afterDisc)} />}
      {vatOn && <Row l="VAT (20%):" v={`+${money(vat)}`} indent />}
      <div className="flex gap-6 min-w-[280px] justify-between border-t border-gray-300 pt-1 mt-0.5">
        <span className="font-semibold">{totalLabel}</span>
        <strong className="text-[#1e3a5f]">{money(total)}</strong>
      </div>
    </div>
  );
}

// Side-by-side option cards for term='both'
function BothOptionsCards({ q, result, money }: { q: QuoteState; result: CalcResult; money: (n: number) => string }) {
  const rows = q.rows.filter(r => r.name);
  const baseYear = new Date().getFullYear();

  const rowY1Net = (r: QuoteRow) => rowOneNet(r);
  const rowY1in2Net = (r: QuoteRow): number => {
    if (r.p2y1manual && typeof r.p2y1 === 'number') return (r.flat ? r.p2y1 : r.qty * r.p2y1) * (1 - r.disc / 100);
    const p1u = calcP1Default(r, q.twoYrDisc);
    return typeof p1u === 'number' ? (r.flat ? p1u : r.qty * p1u) : rowOneNet(r);
  };
  const rowY2Net = (r: QuoteRow): number => {
    if (r.y2manual && typeof r.p2 === 'number') return (r.flat ? r.p2 : r.qty * r.p2) * (1 - r.disc / 100);
    const p1u = calcP1Default(r, q.twoYrDisc);
    if (typeof p1u !== 'number') return 0;
    const eff = typeof r.up === 'number' ? r.up : q.y2Uplift;
    const p2u = calcP2Default(p1u, eff);
    return typeof p2u === 'number' ? (r.flat ? p2u : r.qty * p2u) : 0;
  };

  const CardBox = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="flex-1 min-w-0 rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-[#1e3a5f] text-white text-sm font-semibold px-4 py-2.5">{title}</div>
      <div className="p-4 text-sm space-y-2">{children}</div>
    </div>
  );

  return (
    <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
      {/* Option 1: 1-year */}
      <CardBox title="Option 1 — 1-year">
        <div className="space-y-1.5">
          {rows.map((r, i) => (
            <div key={i} className="flex justify-between gap-3">
              <span className="text-gray-700 truncate">{r.name}{r.flat ? ` (${r.qty} depts)` : ''}</span>
              <span className="text-[#1e3a5f] font-medium whitespace-nowrap">{money(rowY1Net(r))}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 pt-2 mt-2 space-y-0.5">
          {q.gd > 0 && <div className="flex justify-between text-gray-400 text-xs"><span>Discount ({q.gd}%)</span><span>−{money(result.sub - result.afterDisc)}</span></div>}
          {q.vat && <div className="flex justify-between text-gray-400 text-xs"><span>VAT (20%)</span><span>+{money(result.vat)}</span></div>}
          <div className="flex justify-between font-bold text-[#1e3a5f] pt-1">
            <span>Total</span><span>{money(result.total)}</span>
          </div>
        </div>
      </CardBox>

      {/* Option 2: 2-year */}
      <CardBox title="Option 2 — 2-year contract">
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i}>
              <div className="text-gray-700 font-medium truncate">{r.name}{r.flat ? ` (${r.qty} depts)` : ''}</div>
              <div className="flex justify-between text-gray-500 text-xs pl-2">
                <span>{baseYear}</span><span>{money(rowY1in2Net(r))}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-xs pl-2">
                <span>{baseYear + 1}</span><span>{money(rowY2Net(r))}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 pt-2 mt-2 space-y-0.5">
          {q.gd > 0 && <div className="flex justify-between text-gray-400 text-xs"><span>Discount ({q.gd}%)</span><span>−{money((result.sub + result.sub2) - (result.afterDisc + result.afterDisc2))}</span></div>}
          {q.vat && <div className="flex justify-between text-gray-400 text-xs"><span>VAT (20%)</span><span>+{money(result.vat + result.vat2)}</span></div>}
          <div className="flex justify-between text-gray-500 text-xs"><span>Year 1 total</span><span>{money(result.total)}</span></div>
          <div className="flex justify-between text-gray-500 text-xs"><span>Year 2 total</span><span>{money(result.total2)}</span></div>
          <div className="flex justify-between font-bold text-[#1e3a5f] pt-1">
            <span>2-year total</span><span>{money(result.grand2y)}</span>
          </div>
        </div>
      </CardBox>
    </div>
  );
}
