'use client';
import { useStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import type { PriceItem } from '@/lib/types';

interface MatchHit {
  p: PriceItem;
  hits: string[];
}

interface Props {
  results: MatchHit[];
  onClose: () => void;
}

export default function MatchResult({ results, onClose }: Props) {
  const { addQuoteRow, uiLang, saveState } = useStore();
  const T = (k: Parameters<typeof t>[0]) => t(k, uiLang);

  if (results.length === 0) return null;

  return (
    <div className="mt-3">
      {results.map((r, i) => (
        <div key={i} className="flex items-center gap-3 p-2.5 border border-gray-200 rounded-lg mb-2 text-sm bg-gray-50">
          <span className="flex-1">
            <strong>{r.p.name}</strong>
            <span className="text-gray-400 ml-2">{T('matchHitLabel')}{r.hits.join(', ')}</span>
          </span>
          <button
            onClick={() => {
              addQuoteRow({ name: r.p.name, qty: 1, price: r.p.price, disc: 0 });
              saveState();
            }}
            className="btn-ghost text-xs py-1 px-2"
          >{T('btnAddToQuote')}</button>
        </div>
      ))}
      <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 mt-1">
        {T('btnClose')}
      </button>
    </div>
  );
}
