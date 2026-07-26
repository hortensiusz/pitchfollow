'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { calcPricing, defaultChecks, defaultDepN, deriveScen, SCEN_LABELS } from '@/lib/fy27calc';
import type { FirmRecord, FirmEntry, CalcChecks, CalcRow } from '@/lib/fy27calc';
import { ensureFy27Data, getRateCard, searchFirms } from '@/lib/fy27data';
import { Card } from './ui/Card';

function fmt(n: number): string {
  return '£' + n.toLocaleString('en-GB');
}

// Maps a scenario index k back to the CalcChecks flags it implies
function scenToChecks(k: number, current: CalcChecks): CalcChecks {
  // Always keep plat true when selecting a scenario; preserve ov
  const base: CalcChecks = { plat: true, ins: false, mp: false, an: false, ov: current.ov };
  if (k === 0) return base;
  if (k === 1) return { ...base, ins: true };
  if (k === 2) return { ...base, mp: true };
  if (k === 3) return { ...base, ins: true, mp: true };
  if (k === 4) return { ...base, an: true };
  if (k === 5) return { ...base, ins: true, an: true };
  return base;
}

export default function CalcSection() {
  const { app, setApp, addQuoteRow, saveState } = useStore();
  const quote = app.quote;
  const twoYrDisc = quote.twoYrDisc;
  const y2Uplift = quote.y2Uplift;
  const showBoth = quote.term === 'both';

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
  const [manual2yr, setManual2yr] = useState<Record<string, { y1?: number; y2?: number; up?: number }>>({});
  const [pkgDisc, setPkgDisc] = useState(0);
  const [bundleName, setBundleName] = useState('');
  const [open, setOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const sugRef = useRef<HTMLDivElement>(null);
  // Track last client name we synced FROM app.client to avoid feedback loops
  const syncedNameRef = useRef('');
  // Track previous scenK so we can clear the manual Platform price override when it changes
  const prevScenKRef = useRef<number>(-1);

  useEffect(() => {
    ensureFy27Data(() => setLoaded(true));
  }, []);

  // Sync app.client → calc firm when BasicInfoSection changes the client
  useEffect(() => {
    if (!loaded || !app.client) return;
    if (app.client === syncedNameRef.current) return;
    syncedNameRef.current = app.client;
    setFirmQ(app.client);
    const hits = searchFirms(app.client);
    const match = hits.find(f => f.n.toLowerCase() === app.client.toLowerCase()) ?? (hits.length === 1 ? hits[0] : null);
    if (match) {
      setSelectedFirm(match);
      setShowSug(false);
      setEntryIdx(0);
      const en0 = match.e[0] as FirmEntry;
      const initChecks = defaultChecks(en0);
      setChecks(initChecks);
      prevScenKRef.current = deriveScen(initChecks);
      setDepN(defaultDepN(en0));
      setManualPrices({});
      setManual2yr({});
      setOpen(true);
    }
  }, [app.client, loaded]);

  const doSearch = useCallback((q: string) => {
    const hits = searchFirms(q);
    setSuggestions(hits);
    setShowSug(q.length >= 2);
  }, []);

  const selectFirm = useCallback((f: FirmRecord) => {
    syncedNameRef.current = f.n;
    setApp({ client: f.n });
    setSelectedFirm(f);
    setFirmQ(f.n);
    setShowSug(false);
    setEntryIdx(0);
    const en = f.e[0] as FirmEntry;
    const initChecks = defaultChecks(en);
    setChecks(initChecks);
    prevScenKRef.current = deriveScen(initChecks);
    setDepN(defaultDepN(en));
    setManualPrices({});
    setManual2yr({});
    setPkgDisc(0);
    setOpen(true);
  }, [setApp]);

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

  const scenK = checks ? deriveScen(checks) : 0;
  const isRenewal = !!(en && en[11]);

  // Clear manual Platform price override when the bundle scenario (k) changes
  if (scenK !== prevScenKRef.current && prevScenKRef.current !== -1) {
    prevScenKRef.current = scenK;
    setManualPrices(p => {
      if ('plat' in p) {
        const c = { ...p };
        delete c['plat'];
        return c;
      }
      return p;
    });
  } else if (prevScenKRef.current === -1 && en) {
    prevScenKRef.current = scenK;
  }

  // Compute standalone Platform Only price for bundle saving display
  const standaloneRow: CalcRow | null = (() => {
    if (!en || !_rc || !isRenewal || scenK === 0) return null;
    const standaloneChecks: CalcChecks = { plat: true, ins: false, mp: false, an: false, ov: false };
    const standaloneRows = calcPricing(en, _rc, standaloneChecks, mode, depN);
    return standaloneRows.find(r => r.id === 'plat') ?? null;
  })();

  // Whether the current scenario is a bundle actually DEFINED for this firm's
  // region in the rate card RULES. null = region has no bundle rules (unknown).
  const bundleDefinedForRegion: boolean | null = (() => {
    if (!en || !_rc?.bundleRules || scenK === 0) return null;
    const guide = en[0];
    const regionRules = _rc.bundleRules.filter(b => b.region === guide);
    if (regionRules.length === 0) return null; // guide not one of the bundled regions
    const name = SCEN_LABELS[scenK];
    return regionRules.some(b => b.bundle === name);
  })();

  // For "no saving" combos, find the best adjacent bundle that DOES save
  const bestUpgradeHint: { label: string; saving: number } | null = (() => {
    if (!en || !_rc || !isRenewal || scenK === 0 || !standaloneRow) return null;
    const standalonePitch = standaloneRow.pitch;
    const currentPitch = en[11]![1 + 3 * scenK] as number;
    if (standalonePitch - currentPitch > 0) return null; // already has saving
    // Check all other scenarios for a better Platform price
    let best: { label: string; saving: number } | null = null;
    for (let k2 = 1; k2 <= 5; k2++) {
      if (k2 === scenK) continue;
      const p = en[11]![1 + 3 * k2] as number;
      if (!p) continue;
      const s = standalonePitch - p;
      if (s > 0 && (!best || s > best.saving)) {
        best = { label: SCEN_LABELS[k2], saving: s };
      }
    }
    return best;
  })();

  const handleEntryChange = (idx: number) => {
    setEntryIdx(idx);
    if (selectedFirm) {
      const newEn = selectedFirm.e[idx];
      const newChecks = defaultChecks(newEn);
      setChecks(newChecks);
      prevScenKRef.current = deriveScen(newChecks);
      setDepN(defaultDepN(newEn));
      setManualPrices({});
      setManual2yr({});
    }
  };

  const handleModeChange = (m: 'ci' | 'cmi') => {
    setMode(m);
    setManualPrices(p => { const c = { ...p }; delete c['ins']; return c; });
    setManual2yr(p => { const c = { ...p }; delete c['ins']; return c; });
  };

  const handleDepChange = (n: number) => {
    setDepN(n);
    setManualPrices(p => { const c = { ...p }; delete c['ins']; return c; });
    setManual2yr(p => { const c = { ...p }; delete c['ins']; return c; });
  };

  const handleScenChange = (k: number) => {
    setChecks(c => scenToChecks(k, c));
  };

  const resolvePrice = (r: CalcRow): number => manualPrices[r.id] ?? r.pitch;

  // 2yr price helpers — unit prices, same basis as calcP1Default in quoteCalc
  const calcY1in2yr = (r: CalcRow): number =>
    Math.round(Math.max(r.pitch * (1 - twoYrDisc / 100), r.rep) * 100) / 100;

  const resolveY1in2yr = (r: CalcRow): number =>
    manual2yr[r.id]?.y1 ?? calcY1in2yr(r);

  const resolveUplift = (r: CalcRow): number =>
    manual2yr[r.id]?.up ?? y2Uplift;

  const calcY2price = (r: CalcRow): number =>
    Math.round(resolveY1in2yr(r) * (1 + resolveUplift(r) / 100) * 100) / 100;

  const resolveY2 = (r: CalcRow): number =>
    manual2yr[r.id]?.y2 ?? calcY2price(r);

  const writeItemised = () => {
    rows.forEach(r => {
      if (!checks[r.id]) return;
      const price = resolvePrice(r);
      if (!price) return;
      const m2 = showBoth ? manual2yr[r.id] : undefined;
      const hasY1Override = m2?.y1 !== undefined;
      const hasY2Override = m2?.y2 !== undefined;
      const hasUpOverride = m2?.up !== undefined;
      addQuoteRow({
        name: r.cname,
        qty: r.isFlat ? Math.max(1, depN) : 1,
        price,
        disc: pkgDisc,
        guide: en?.[0] ?? '',
        parts: null,
        flat: r.isFlat,
        p2y1: hasY1Override ? (m2!.y1 as number) : '',
        p2: hasY2Override ? (m2!.y2 as number) : '',
        up: hasUpOverride ? (m2!.up as number) : '',
        p2y1manual: hasY1Override,
        y2manual: hasY2Override,
        floor: r.rep,
      });
    });
    saveState();
  };

  const writeBundle = () => {
    const sel = rows.filter(r => checks[r.id]);
    if (!sel.length) return;
    const total1yr = sel.reduce((s, r) => s + resolvePrice(r), 0);
    const nm = bundleName.trim() || 'Chambers Partnership Package';
    const floorTotal = sel.reduce((s, r) => s + (r.rep || 0), 0);
    if (showBoth) {
      const totalY1in2yr = Math.round(sel.reduce((s, r) => s + resolveY1in2yr(r), 0) * 100) / 100;
      const totalY2 = Math.round(sel.reduce((s, r) => s + resolveY2(r), 0) * 100) / 100;
      addQuoteRow({
        name: nm, qty: 1, price: total1yr,
        disc: pkgDisc, guide: en?.[0] ?? '',
        parts: sel.map(r => r.cname),
        flat: false,
        p2y1: totalY1in2yr, p2: totalY2, up: '',
        p2y1manual: true, y2manual: true,
        floor: floorTotal,
      });
    } else {
      addQuoteRow({
        name: nm, qty: 1, price: total1yr,
        disc: pkgDisc, guide: en?.[0] ?? '',
        parts: sel.map(r => r.cname),
        flat: false, p2y1: '', p2: '', up: '',
        p2y1manual: false, y2manual: false,
        floor: floorTotal,
      });
    }
    saveState();
  };

  // Helper: render FY26 actual price vs FY27 pitch
  const renderFy26 = (r: CalcRow, pitchOverride?: number) => {
    if (!r.fy26) return null;
    const pitch = pitchOverride ?? r.pitch;
    const pct = ((pitch - r.fy26) / r.fy26) * 100;
    const sign = pct >= 0 ? '+' : '';
    const color = pct > 0 ? 'text-amber-600' : 'text-emerald-600';
    return (
      <div className={`mt-0.5 text-xs font-medium ${color}`}>
        FY26: {fmt(r.fy26)} → <span className="font-semibold">{sign}{pct.toFixed(1)}%</span>
      </div>
    );
  };

  // Helper: render bundle saving line for a Platform row
  const renderBundleSaving = (r: CalcRow) => {
    if (r.id !== 'plat' || !isRenewal || scenK === 0 || !standaloneRow) return null;
    const currentPitch = resolvePrice(r);
    const standalonePitch = standaloneRow.pitch;
    const saving = standalonePitch - currentPitch;
    const region = en?.[0] ?? '';

    // Real, priced-in bundle discount
    if (saving > 0) {
      return (
        <div className="mt-1 text-xs text-emerald-600 font-medium">
          {SCEN_LABELS[scenK]} bundle · saving {fmt(saving)} vs standalone ({fmt(standalonePitch)})
        </div>
      );
    }

    // Region explicitly does NOT define this bundle (e.g. Platform & MP in Greater China)
    if (bundleDefinedForRegion === false) {
      return (
        <div className="mt-1 text-xs text-amber-600 font-medium">
          {region} has no “{SCEN_LABELS[scenK]}” bundle — priced as standalone
          {bestUpgradeHint && (
            <>
              {' '}· add <span className="font-semibold">{bestUpgradeHint.label}</span> to save {fmt(bestUpgradeHint.saving)}
            </>
          )}
        </div>
      );
    }

    // Recognised bundle scenario but no Platform price reduction for this firm
    return (
      <div className="mt-1 text-xs text-sky-700 font-medium">
        {SCEN_LABELS[scenK]} bundle · no Platform uplift discount
        {bestUpgradeHint && (
          <span className="text-amber-600">
            {' '}· add <span className="font-semibold">{bestUpgradeHint.label}</span> to save {fmt(bestUpgradeHint.saving)}
          </span>
        )}
      </div>
    );
  };

  return (
    <Card>
      <details open={open} onToggle={e => setOpen((e.target as HTMLDetailsElement).open)}>
        <summary className="cursor-pointer font-semibold text-[#002B49] text-sm select-none">
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
                className="absolute z-40 left-0 right-0 top-full mt-0.5 bg-white border border-[var(--hairline)] rounded-md max-h-52 overflow-y-auto text-sm"
              >
                {suggestions.length === 0 ? (
                  <div className="px-3 py-2 text-[var(--muted)]">No firm found</div>
                ) : suggestions.map((f, i) => (
                  <div
                    key={i}
                    className="px-3 py-1.5 cursor-pointer hover:bg-[var(--beige)]/50 text-[#002B49]"
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
                <div className="text-xs text-[var(--muted)] pb-1">
                  {en[2]}{en[3] ? ` · ${en[3]}` : ''} · Seg: {en[1]}
                  {en[11]
                    ? <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-medium">Renewal</span>
                    : <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">New Biz</span>}
                </div>
              )}
            </div>
          )}

          {/* Pitch scenario selector (renewal) or new-business badge */}
          {selectedFirm && en && (
            <div className="flex flex-wrap gap-3 items-end">
              {isRenewal ? (
                <div>
                  <label className="field-label">Pitch scenario</label>
                  <select
                    className="field-input w-auto"
                    value={scenK}
                    onChange={e => handleScenChange(+e.target.value)}
                  >
                    {SCEN_LABELS.map((label, i) => (
                      <option key={i} value={i}>{label}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="pb-1">
                  <span className="px-2 py-1 bg-[var(--beige)] text-[var(--muted)] rounded text-xs font-medium border border-[var(--hairline)]">
                    New business pricing
                  </span>
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

          {/* Single-column pricing rows (1yr or 2yr only) */}
          {rows.length > 0 && !showBoth && (
            <div className="space-y-2 mt-1">
              {rows.map(r => {
                const price = resolvePrice(r);
                const belowFloor = price < r.lo - 0.5;
                return (
                  <div key={r.id} className="flex items-start gap-2 p-2.5 rounded-md bg-[#FAF9F6] border border-[var(--hairline)]">
                    <input
                      type="checkbox"
                      checked={!!checks[r.id]}
                      onChange={e => setChecks(c => ({ ...c, [r.id]: e.target.checked }))}
                      className="mt-1 accent-[#002B49] w-4 h-4 flex-none"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-[#002B49]">{r.n}</div>
                      <div className="text-xs text-[var(--muted)] mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5">
                        <span><span className="text-[var(--muted)]">Max</span> {fmt(r.hi)}</span>
                        <span><span className="text-[var(--muted)]">Pitch</span> {fmt(r.pitch)}</span>
                        <span><span className="text-[var(--muted)]">REP floor</span> {fmt(r.rep)}</span>
                        <span><span className="text-[var(--muted)]">MGR floor</span> {fmt(r.lo)}</span>
                        {r.extra && <span className="text-[var(--muted)]">{r.extra}</span>}
                      </div>
                      {renderFy26(r, resolvePrice(r))}
                      {renderBundleSaving(r)}
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <label className="text-xs text-[var(--muted)]">Final price</label>
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

          {/* Dual-column pricing (term='both') */}
          {rows.length > 0 && showBoth && (
            <div className="mt-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

                {/* Option 1: 1-Year */}
                <div>
                  <div className="text-xs font-semibold text-[#002B49] px-1 pb-1.5 mb-2 border-b border-[#002B49]/20 flex justify-between items-center">
                    <span>Option 1 — 1-Year</span>
                    <span className="font-normal text-[var(--muted)]">Pitch price</span>
                  </div>
                  <div className="space-y-2">
                    {rows.map(r => {
                      const price = resolvePrice(r);
                      const belowFloor = price < r.lo - 0.5;
                      return (
                        <div key={r.id} className="flex items-start gap-2 p-2.5 rounded-md bg-[#FAF9F6] border border-[var(--hairline)]">
                          <input
                            type="checkbox"
                            checked={!!checks[r.id]}
                            onChange={e => setChecks(c => ({ ...c, [r.id]: e.target.checked }))}
                            className="mt-1 accent-[#002B49] w-4 h-4 flex-none"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-[#002B49]">{r.n}</div>
                            <div className="text-xs text-[var(--muted)] mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                              <span><span className="text-[var(--muted)]">Max</span> {fmt(r.hi)}</span>
                              <span><span className="text-[var(--muted)]">Pitch</span> {fmt(r.pitch)}</span>
                              <span><span className="text-[var(--muted)]">REP</span> {fmt(r.rep)}</span>
                              <span><span className="text-[var(--muted)]">MGR</span> {fmt(r.lo)}</span>
                            </div>
                            {renderFy26(r, resolvePrice(r))}
                            {renderBundleSaving(r)}
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            <label className="text-xs text-[var(--muted)]">1yr price</label>
                            <input
                              type="number" min={0} step={50}
                              disabled={!checks[r.id]}
                              className={`field-input w-24 text-sm text-right ${belowFloor ? 'border-red-400' : ''}`}
                              value={manualPrices[r.id] ?? r.pitch}
                              onChange={e => setManualPrices(p => ({ ...p, [r.id]: +e.target.value || 0 }))}
                            />
                            {belowFloor && <span className="text-red-500 text-xs">Below MGR</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 px-1 text-right text-xs text-[#002B49] font-medium">
                    Selected total: {fmt(rows.filter(r => checks[r.id]).reduce((s, r) => s + resolvePrice(r), 0))}
                  </div>
                </div>

                {/* Option 2: 2-Year */}
                <div>
                  <div className="text-xs font-semibold text-emerald-700 px-1 pb-1.5 mb-2 border-b border-emerald-200 flex justify-between items-center">
                    <span>Option 2 — 2-Year Contract</span>
                    <span className="font-normal text-[var(--muted)]">Y1 −{twoYrDisc}% · Y2 default +{y2Uplift}%</span>
                  </div>
                  <div className="space-y-2">
                    {rows.map(r => {
                      const y1 = manual2yr[r.id]?.y1 ?? calcY1in2yr(r);
                      const upVal = manual2yr[r.id]?.up ?? y2Uplift;
                      const y2 = manual2yr[r.id]?.y2 ?? calcY2price(r);
                      const y1BelowFloor = y1 < r.lo - 0.5;
                      const isChecked = !!checks[r.id];
                      return (
                        <div key={r.id} className={`p-2.5 rounded-md border transition-opacity ${isChecked ? 'bg-[#EEF3EE]/40 border-emerald-100' : 'bg-[#FAF9F6] border-[var(--hairline)] opacity-50'}`}>
                          <div className="font-medium text-sm text-emerald-800 mb-1.5">{r.n}</div>
                          <div className="flex gap-2">
                            <div className="flex flex-col gap-0.5 flex-1">
                              <label className="text-xs text-[var(--muted)]">Y1 price</label>
                              <input
                                type="number" min={0} step={50}
                                disabled={!isChecked}
                                className={`field-input w-full text-sm text-right ${y1BelowFloor ? 'border-red-400' : ''}`}
                                value={y1}
                                onChange={e => {
                                  const val = +e.target.value || 0;
                                  setManual2yr(p => ({ ...p, [r.id]: { ...p[r.id], y1: val, y2: undefined } }));
                                }}
                              />
                              {y1BelowFloor && <span className="text-red-500 text-xs">Below MGR</span>}
                            </div>
                            <div className="flex flex-col gap-0.5" style={{ width: '4.5rem' }}>
                              <label className="text-xs text-[var(--muted)]">Uplift %</label>
                              <input
                                type="number" min={0} step={0.5}
                                disabled={!isChecked}
                                className="field-input w-full text-sm text-right"
                                value={upVal}
                                onChange={e => {
                                  const val = +e.target.value || 0;
                                  setManual2yr(p => ({ ...p, [r.id]: { ...p[r.id], up: val, y2: undefined } }));
                                }}
                              />
                            </div>
                            <div className="flex flex-col gap-0.5 flex-1">
                              <label className="text-xs text-[var(--muted)]">Y2 price</label>
                              <input
                                type="number" min={0} step={50}
                                disabled={!isChecked}
                                className="field-input w-full text-sm text-right"
                                value={y2}
                                onChange={e => {
                                  const val = +e.target.value || 0;
                                  setManual2yr(p => ({ ...p, [r.id]: { ...p[r.id], y2: val } }));
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 px-1 text-right text-xs text-emerald-700 font-medium space-y-0.5">
                    <div>Y1 total: {fmt(rows.filter(r => checks[r.id]).reduce((s, r) => s + resolveY1in2yr(r), 0))}</div>
                    <div>Y2 total: {fmt(rows.filter(r => checks[r.id]).reduce((s, r) => s + resolveY2(r), 0))}</div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {selectedFirm && en && rows.length === 0 && (
            <p className="text-sm text-[var(--muted)]">No pricing data available for this entry.</p>
          )}

          {/* Bundle rules (collapsed) */}
          {_rc && _rc.bundleRules && _rc.bundleRules.length > 0 && (
            <details className="text-xs text-[var(--muted)]">
              <summary className="cursor-pointer hover:text-[#3A4A57] select-none">Bundle rules reference</summary>
              <div className="mt-1 space-y-1 pl-2 border-l-2 border-[var(--hairline)] max-h-40 overflow-y-auto">
                {_rc.bundleRules.map((br, i) => (
                  <div key={i}>
                    <strong>{br.region}</strong> · {br.scenario} · {br.bundle} · {br.product}:
                    {' '}Pitch {br.pitch}; REP {br.repDisc}
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Package discount + totals summary */}
          {rows.length > 0 && (() => {
            const selRows = rows.filter(r => checks[r.id]);
            const gross1yr = selRows.reduce((s, r) => s + resolvePrice(r), 0);
            const net1yr = Math.round(gross1yr * (1 - pkgDisc / 100));
            const checkedCount = selRows.length;
            return checkedCount > 0 ? (
              <div className="rounded-md bg-[#FAF9F6] border border-[var(--hairline)] px-3 py-2.5 space-y-2">
                <div className="flex flex-wrap gap-3 items-center">
                  <span className="text-xs font-medium text-[var(--muted)] flex-1">
                    {checkedCount} product{checkedCount > 1 ? 's' : ''} selected
                  </span>
                  {checkedCount > 1 && (
                    <label className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                      Package discount
                      <input
                        type="number" min={0} max={100} step={0.5}
                        className="field-input w-16 text-sm text-right"
                        value={pkgDisc}
                        onChange={e => setPkgDisc(Math.max(0, Math.min(100, +e.target.value || 0)))}
                      />
                      <span>%</span>
                    </label>
                  )}
                </div>
                {!showBoth && (
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--muted)]">1yr gross: {fmt(gross1yr)}</span>
                    {pkgDisc > 0 && <span className="font-semibold text-[#002B49]">After discount: {fmt(net1yr)}</span>}
                  </div>
                )}
                {showBoth && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-[var(--muted)]">1yr gross: {fmt(gross1yr)}</div>
                      {pkgDisc > 0 && <div className="font-semibold text-[#002B49]">After discount: {fmt(net1yr)}</div>}
                    </div>
                    <div>
                      <div className="text-[var(--muted)]">2yr Y1: {fmt(selRows.reduce((s, r) => s + resolveY1in2yr(r), 0))}</div>
                      <div className="text-[var(--muted)]">2yr Y2: {fmt(selRows.reduce((s, r) => s + resolveY2(r), 0))}</div>
                      {pkgDisc > 0 && <div className="font-semibold text-emerald-700">Y1 after disc: {fmt(Math.round(selRows.reduce((s, r) => s + resolveY1in2yr(r), 0) * (1 - pkgDisc / 100)))}</div>}
                    </div>
                  </div>
                )}
              </div>
            ) : null;
          })()}

          {/* Write-to-quote actions */}
          {rows.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center border-t border-[var(--hairline)] pt-3 mt-1">
              <span className="text-xs text-[var(--muted)] flex-1">Floors shown here are internal — not exported to PPT.</span>
              <input
                type="text"
                className="field-input text-sm w-56"
                placeholder="Bundle name (optional)"
                value={bundleName}
                onChange={e => setBundleName(e.target.value)}
              />
              <button onClick={writeBundle} className="btn-ghost text-sm">
                {showBoth ? 'Write bundle (both)' : 'Write as bundle'}
              </button>
              <button onClick={writeItemised} className="btn-primary text-sm">
                {showBoth ? 'Write itemised (both)' : 'Write itemised'}
              </button>
            </div>
          )}
        </div>
      </details>
    </Card>
  );
}
