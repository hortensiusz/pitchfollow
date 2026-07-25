'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { calcPricing, defaultChecks, defaultDepN, deriveScen, SCEN_LABELS } from '@/lib/fy27calc';
import type { FirmRecord, FirmEntry, CalcChecks, CalcRow } from '@/lib/fy27calc';
import { ensureFy27Data, getRateCard, getFirms, searchFirms } from '@/lib/fy27data';
import { Card } from './ui/Card';

function fmt(n: number): string {
  return '£' + n.toLocaleString('en-GB');
}

export default function CalcSection() {
  const { addQuoteRow, saveState } = useStore();

  const [loaded, setLoaded] = useState(false);
  const [firmQ, setFirmQ] = useState('');
  const [suggestions, setSuggestions] = useState<FirmRecord[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [selectedFirm, setSelectedFirm] = useState<FirmRecord | null>(null);
  const [entryIdx, setEntryIdx] = useState(0);
  const [checks, setChecks] = useState<CalcChecks>({ plat: false, ins: false, mp: false, an: false, ov: false });
  const [mode, setMode] = useState<'ci' | 'cmi'>('cmi');
  const [depN, setDepN] = useState(1);
  const [manualPrices, setManualPrices] = useState<Record<string, number>>({});
  const [bundleName, setBundleName] = useState('');
  const [open, setOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const sugRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureFy27Data(() => setLoaded(true));
  }, []);

  // Search
  const doSearch = useCallback((q: string) => {
    const hits = searchFirms(q);
    setSuggestions(hits);
    setShowSug(q.length >= 2);
  }, []);

  const selectFirm = useCallback((f: FirmRecord) => {
    setSelectedFirm(f);
    setFirmQ(f.n);
    setShowSug(false);
    setEntryIdx(0);
    const en = f.e[0] as FirmEntry;
    setChecks(defaultChecks(en));
    setDepN(defaultDepN(en));
    setManualPrices({});
    setOpen(true);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sugRef.current && !sugRef.current.contains(e.target as Node) && e.target !== inputRef.current) {
        setShowSug(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const en: FirmEntry | null = selectedFirm?.e[entryIdx] ?? null;
  const _rc = getRateCard();
  const rows: CalcRow[] = en && _rc ? calcPricing(en, _rc, checks, mode, depN) : [];

  // When entry changes, reset checks & dep
  const handleEntryChange = (idx: number) => {
    setEntryIdx(idx);
    if (selectedFirm) {
      const newEn = selectedFirm.e[idx];
      setChecks(defaultChecks(newEn));
      setDepN(defaultDepN(newEn));
      setManualPrices({});
    }
  };

  // When mode or depN changes, clear manual insight price
  const handleModeChange = (m: 'ci' | 'cmi') => {
    setMode(m);
    setManualPrices(p => { const c = { ...p }; delete c['ins']; return c; });
  };

  const handleDepChange = (n: number) => {
    setDepN(n);
    setManualPrices(p => { const c = { ...p }; delete c['ins']; return c; });
  };

  const resolvePrice = (r: CalcRow): number => manualPrices[r.id] ?? r.pitch;

  const writeItemised = () => {
    rows.forEach(r => {
      if (!checks[r.id]) return;
      const price = resolvePrice(r);
      if (!price) return;
      addQuoteRow({
        name: r.cname,
        qty: r.isFlat ? Math.max(1, depN) : 1,
        price,
        disc: 0,
        guide: en?.[0] ?? '',
        parts: null,
        flat: r.isFlat,
        p2y1: '',
        p2: '',
        up: '',
        p2y1manual: false,
        y2manual: false,
        floor: r.rep,
      });
    });
    saveState();
  };

  const writeBundle = () => {
    const sel = rows.filter(r => checks[r.id]);
    if (!sel.length) return;
    const total = sel.reduce((s, r) => s + resolvePrice(r), 0);
    const nm = bundleName.trim() || 'Chambers Partnership Package';
    addQuoteRow({
      name: nm,
      qty: 1,
      price: total,
      disc: 0,
      guide: en?.[0] ?? '',
      parts: sel.map(r => r.cname),
      flat: false,
      p2y1: '',
      p2: '',
      up: '',
      p2y1manual: false,
      y2manual: false,
      floor: sel.reduce((s, r) => s + (r.rep || 0), 0),
    });
    saveState();
  };

  const scenK = checks ? deriveScen(checks) : 0;
  const isRenewal = !!(en?.[11]);

  return (
    <Card>
      <details open={open} onToggle={e => setOpen((e.target as HTMLDetailsElement).open)}>
        <summary className="cursor-pointer font-semibold text-[#1e3a5f] text-sm select-none">
          FY27 Rate Card Calculator
        </summary>
        <div className="mt-3 space-y-3">

          {/* Firm search */}
          <div className="relative">
            <label className="field-label">Firm name</label>
            <input
              ref={inputRef}
              type="text"
              className="field-input"
              value={firmQ}
              placeholder={loaded ? 'Type at least 2 characters…' : 'Loading firm data…'}
              disabled={!loaded}
              onChange={e => {
                setFirmQ(e.target.value);
                setSelectedFirm(null);
                doSearch(e.target.value);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && suggestions.length) selectFirm(suggestions[0]);
              }}
            />
            {showSug && (
              <div
                ref={sugRef}
                className="absolute z-40 left-0 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto text-sm"
              >
                {suggestions.length === 0 ? (
                  <div className="px-3 py-2 text-gray-400">No firm found</div>
                ) : suggestions.map((f, i) => (
                  <div
                    key={i}
                    className="px-3 py-1.5 cursor-pointer hover:bg-blue-50 text-gray-800"
                    onClick={() => selectFirm(f)}
                  >
                    {f.n}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Guide selector */}
          {selectedFirm && (
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="field-label">Guide / region</label>
                <select
                  className="field-input w-auto"
                  value={entryIdx}
                  onChange={e => handleEntryChange(+e.target.value)}
                >
                  {selectedFirm.e.map((entry: FirmEntry, i: number) => (
                    <option key={i} value={i}>{entry[0]}</option>
                  ))}
                </select>
              </div>
              {en && (
                <div className="text-xs text-gray-500 pb-1">
                  {en[2]}{en[3] ? ` · ${en[3]}` : ''} · Seg: {en[1]}
                  {en[11] ? <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-medium">Renewal</span>
                    : <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">New Biz</span>}
                  {en[11] && <span className="ml-1 text-gray-400">· {SCEN_LABELS[scenK]}</span>}
                </div>
              )}
            </div>
          )}

          {/* Insight controls */}
          {selectedFirm && en && (
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="field-label">Insight type</label>
                <select className="field-input w-auto" value={mode} onChange={e => handleModeChange(e.target.value as 'ci' | 'cmi')}>
                  <option value="cmi">CMI</option>
                  <option value="ci">CI</option>
                </select>
              </div>
              <div>
                <label className="field-label">Departments</label>
                <input
                  type="number" min={1} step={1}
                  className="field-input w-20"
                  value={depN}
                  onChange={e => handleDepChange(Math.max(1, +e.target.value || 1))}
                />
              </div>
            </div>
          )}

          {/* Pricing rows */}
          {rows.length > 0 && (
            <div className="space-y-2 mt-1">
              {rows.map(r => {
                const price = resolvePrice(r);
                const belowFloor = price < r.lo - 0.5;
                return (
                  <div key={r.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                    <input
                      type="checkbox"
                      checked={!!checks[r.id]}
                      onChange={e => setChecks(c => ({ ...c, [r.id]: e.target.checked }))}
                      className="mt-1 accent-[#1e3a5f] w-4 h-4 flex-none"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-[#1e3a5f]">{r.n}</div>
                      <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5">
                        <span><span className="text-gray-400">Max</span> {fmt(r.hi)}</span>
                        <span><span className="text-gray-400">Pitch</span> {fmt(r.pitch)}</span>
                        <span><span className="text-gray-400">REP floor</span> {fmt(r.rep)}</span>
                        <span><span className="text-gray-400">MGR floor</span> {fmt(r.lo)}</span>
                        {r.extra && <span className="text-gray-400">{r.extra}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <label className="text-xs text-gray-400">Final price</label>
                      <input
                        type="number" min={0} step={50}
                        disabled={!checks[r.id]}
                        className={`field-input w-28 text-sm text-right ${belowFloor ? 'border-red-400' : ''}`}
                        value={manualPrices[r.id] ?? r.pitch}
                        onChange={e => setManualPrices(p => ({ ...p, [r.id]: +e.target.value || 0 }))}
                      />
                      {belowFloor && <span className="text-red-500 text-xs">Below MGR floor</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedFirm && en && rows.length === 0 && (
            <p className="text-sm text-gray-400">No pricing data available for this entry.</p>
          )}

          {/* Bundle rules (collapsed) */}
          {_rc && _rc.bundleRules && _rc.bundleRules.length > 0 && (
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer hover:text-gray-700 select-none">Bundle rules reference</summary>
              <div className="mt-1 space-y-1 pl-2 border-l-2 border-gray-100 max-h-40 overflow-y-auto">
                {_rc.bundleRules.map((br, i) => (
                  <div key={i}>
                    <strong>{br.region}</strong> · {br.scenario} · {br.bundle} · {br.product}:
                    {' '}Pitch {br.pitch}; REP {br.repDisc}
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Write-to-quote actions */}
          {rows.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center border-t border-gray-100 pt-3 mt-1">
              <span className="text-xs text-gray-400 flex-1">Floors shown here are internal — not exported to PPT.</span>
              <input
                type="text"
                className="field-input text-sm w-56"
                placeholder="Bundle name (optional)"
                value={bundleName}
                onChange={e => setBundleName(e.target.value)}
              />
              <button onClick={writeBundle} className="btn-ghost text-sm">Write as bundle</button>
              <button onClick={writeItemised} className="btn-primary text-sm">Write itemised</button>
            </div>
          )}
        </div>
      </details>
    </Card>
  );
}
