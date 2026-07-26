'use client';
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { DEFAULT_PRICES } from '@/lib/defaultPrices';
import type { PriceItem } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function PriceListDialog({ open, onClose }: Props) {
  const { priceList, setPriceList, uiLang, setStatus } = useStore();
  const T = (k: Parameters<typeof t>[0]) => t(k, uiLang);
  const [localList, setLocalList] = useState<PriceItem[]>([]);

  useEffect(() => {
    if (open) setLocalList([...priceList]);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (i: number, patch: Partial<PriceItem>) =>
    setLocalList(l => l.map((p, idx) => idx === i ? { ...p, ...patch } : p));

  const remove = (i: number) => setLocalList(l => l.filter((_, idx) => idx !== i));

  const add = () => setLocalList(l => [...l, { name: '', unit: '', price: 0, desc: '', kw: '' }]);

  const save = () => {
    const saved = localList.filter(p => p.name.trim());
    setPriceList(saved);
    setStatus(T('flashPricesSaved'));
    onClose();
  };

  const restore = () => setLocalList([...DEFAULT_PRICES]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-md shadow-xl w-full max-w-5xl overflow-hidden">
        <div className="bg-[#002B49] text-white px-5 py-3.5 flex justify-between items-center">
          <span className="font-semibold">{T('dlgPrices')}</span>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl">✕</button>
        </div>
        <div className="p-5 max-h-[65vh] overflow-y-auto">
          <p className="text-xs text-[var(--muted)] mb-3">{T('pricesHint')}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--hairline)] text-[var(--muted)] text-left">
                  <th className="py-2 px-2 font-medium w-[22%]">{T('thProdName')}</th>
                  <th className="py-2 px-2 font-medium w-[8%]">{T('thUnit')}</th>
                  <th className="py-2 px-2 font-medium w-[10%]">{T('thPrice2')}</th>
                  <th className="py-2 px-2 font-medium w-[35%]">{T('thDesc')}</th>
                  <th className="py-2 px-2 font-medium w-[20%]">{T('thKw')}</th>
                  <th className="py-2 px-2 w-[5%]"></th>
                </tr>
              </thead>
              <tbody>
                {localList.map((p, i) => (
                  <tr key={i} className="border-b border-[var(--hairline)]">
                    <td className="py-1 px-2">
                      <input type="text" className="field-input text-sm" value={p.name}
                        onChange={e => update(i, { name: e.target.value })} />
                    </td>
                    <td className="py-1 px-2">
                      <input type="text" className="field-input text-sm" value={p.unit}
                        onChange={e => update(i, { unit: e.target.value })} />
                    </td>
                    <td className="py-1 px-2">
                      <input type="number" className="field-input text-sm" value={p.price} min={0} step={0.01}
                        onChange={e => update(i, { price: +e.target.value })} />
                    </td>
                    <td className="py-1 px-2">
                      <textarea className="field-input text-sm min-h-[50px] resize-y" value={p.desc}
                        placeholder={T('phPriceDesc')}
                        onChange={e => update(i, { desc: e.target.value })} />
                    </td>
                    <td className="py-1 px-2">
                      <input type="text" className="field-input text-sm" value={p.kw}
                        placeholder={T('phPriceKw')}
                        onChange={e => update(i, { kw: e.target.value })} />
                    </td>
                    <td className="py-1 px-2">
                      <button onClick={() => remove(i)} className="text-[var(--faint)] hover:text-red-500 text-lg px-1">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={add}
            className="w-full border border-dashed border-[var(--hairline-strong)] rounded-md py-1.5 text-sm text-[var(--muted)] hover:bg-[#FAF9F6] mt-2">
            {T('btnAddProd')}
          </button>
        </div>
        <div className="px-5 py-3.5 border-t border-[var(--hairline)] flex justify-between">
          <button onClick={restore} className="btn-ghost text-sm">{T('btnRestorePrices')}</button>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost text-sm">{T('btnCancel')}</button>
            <button onClick={save} className="btn-primary text-sm">{T('btnSavePrices')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
