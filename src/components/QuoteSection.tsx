'use client';
import React from 'react';
import { useStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import type { QuoteRow } from '@/lib/types';
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

      {/* Totals */}
      {q.rows.some(r => r.name) && (
        <div className="mt-3 flex flex-col items-end gap-0.5 text-sm">
          {(q.term === '1y' || q.term === 'both') && (
            <TotalsBlock
              label={q.term === 'both' ? 'Year 1 option' : undefined}
              sub={result.sub} gd={q.gd} afterDisc={result.afterDisc}
              vat={result.vat} total={result.total} vatOn={q.vat} money={money}
            />
          )}
          {twoYear && (q.term === '2y' || q.term === 'both') && (
            <TotalsBlock
              label={q.term === 'both' ? 'Year 2 option (contract)' : undefined}
              sub={result.sub2} gd={q.gd} afterDisc={result.afterDisc2}
              vat={result.vat2} total={result.total2} vatOn={q.vat} money={money}
              extraAfter={q.term === 'both' ? (
                <div className="flex gap-6 min-w-[280px] justify-between border-t-2 border-[#1e3a5f] pt-2 mt-1">
                  <span className="font-semibold">2-year total:</span>
                  <strong className="text-[#1e3a5f] text-base">{money(result.grand2y)}</strong>
                </div>
              ) : undefined}
            />
          )}
          {q.term === '2y' && (
            <div className="flex gap-6 min-w-[280px] justify-between border-t-2 border-[#1e3a5f] pt-2 mt-1">
              <span className="font-semibold">2-year total:</span>
              <strong className="text-[#1e3a5f] text-base">{money(result.grand2y)}</strong>
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
  label?: string;
  sub: number;
  gd: number;
  afterDisc: number;
  vat: number;
  total: number;
  vatOn: boolean;
  money: (n: number) => string;
  extraAfter?: React.ReactNode;
}

function TotalsBlock({ label, sub, gd, afterDisc, vat, total, vatOn, money, extraAfter }: TotalsBlockProps) {
  const Row = ({ l, v, bold, indent }: { l: string; v: string; bold?: boolean; indent?: boolean }) => (
    <div className={`flex gap-6 min-w-[280px] justify-between ${indent ? 'text-gray-400' : ''}`}>
      <span className={bold ? 'font-semibold' : 'text-gray-500'}>{l}</span>
      <span className={bold ? 'font-bold text-[#1e3a5f]' : ''}>{v}</span>
    </div>
  );
  return (
    <div className="mt-2 flex flex-col gap-0.5">
      {label && <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">{label}</div>}
      <Row l="Subtotal:" v={money(sub)} />
      {gd > 0 && <Row l={`Global discount (${gd}%):`} v={`−${money(sub - afterDisc)}`} indent />}
      {gd > 0 && <Row l="After discount:" v={money(afterDisc)} />}
      {vatOn && <Row l="VAT (20%):" v={`+${money(vat)}`} indent />}
      <div className="flex gap-6 min-w-[280px] justify-between border-t border-gray-300 pt-1 mt-0.5">
        <span className="font-semibold">{label ? label.split(' ')[0] + ' ' + label.split(' ')[1] + ' total:' : 'Total:'}</span>
        <strong className="text-[#1e3a5f]">{money(total)}</strong>
      </div>
      {extraAfter}
    </div>
  );
}
