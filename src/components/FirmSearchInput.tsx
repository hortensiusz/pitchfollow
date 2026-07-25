'use client';
import { useEffect, useRef, useState } from 'react';

interface Firm { n: string }

// Module-level singleton — one fetch for the whole page lifetime
let _firms: Firm[] | null = null;
let _loading = false;
const _cbs: Array<() => void> = [];

function loadFirms(onDone: () => void) {
  if (_firms) { onDone(); return; }
  _cbs.push(onDone);
  if (_loading) return;
  _loading = true;
  fetch('/data/firm-rates.json')
    .then(r => r.json())
    .then((d: { firms: Firm[] }) => { _firms = d.firms; })
    .catch(e => console.error('[FirmSearch] load failed:', e))
    .finally(() => {
      const fns = _cbs.splice(0);
      fns.forEach(fn => fn());
    });
}

interface Props {
  value: string;
  onChange: (name: string) => void;
  placeholder?: string;
  className?: string;
}

export default function FirmSearchInput({ value, onChange, placeholder, className }: Props) {
  const [ready, setReady] = useState(false);
  const [sugs, setSugs] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [dropRect, setDropRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (_firms) { setReady(true); return; }
    loadFirms(() => setReady(true));
  }, []);

  const runSearch = (q: string) => {
    if (!_firms || q.length < 2) { setSugs([]); setOpen(false); return; }
    const lq = q.toLowerCase();
    const hits: string[] = [];
    for (const f of _firms) {
      if (f.n.toLowerCase().includes(lq)) {
        hits.push(f.n);
        if (hits.length >= 12) break;
      }
    }
    setSugs(hits);
    if (hits.length > 0 && inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setDropRect({ top: r.bottom + window.scrollY + 2, left: r.left + window.scrollX, width: r.width });
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const select = (name: string) => {
    onChange(name);
    setOpen(false);
    setSugs([]);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder={ready ? placeholder : `${placeholder ?? ''} (loading…)`}
        className={className}
        onChange={e => { onChange(e.target.value); if (ready) runSearch(e.target.value); }}
        onFocus={e => { if (ready && e.target.value.length >= 2) runSearch(e.target.value); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && dropRect && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 9999,
            marginTop: 2,
          }}
          className="bg-white border border-gray-200 rounded-lg shadow-2xl max-h-60 overflow-y-auto text-sm"
          onMouseDown={e => e.preventDefault()}
        >
          {sugs.map((name, i) => (
            <div
              key={i}
              className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-gray-800 border-b border-gray-50 last:border-0"
              onClick={() => select(name)}
            >
              {name}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
