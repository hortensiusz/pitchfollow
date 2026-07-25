'use client';
import { useEffect, useState, useRef } from 'react';

interface Firm { n: string }

interface Props {
  value: string;
  onChange: (name: string) => void;
  placeholder?: string;
  className?: string;
}

export default function FirmSearchInput({ value, onChange, placeholder, className }: Props) {
  const [firms, setFirms] = useState<Firm[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [sugs, setSugs] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('[FirmSearch] fetching /data/firm-rates.json');
    fetch('/data/firm-rates.json')
      .then(r => r.json())
      .then((d: { firms: Firm[] }) => {
        console.log('[FirmSearch] loaded', d.firms.length, 'firms');
        setFirms(d.firms);
        setLoading(false);
      })
      .catch(e => {
        console.error('[FirmSearch] FAILED', e);
        setLoading(false);
      });
  }, []);

  const search = (q: string) => {
    if (!firms || q.length < 2) { setSugs([]); setOpen(false); return; }
    const lq = q.toLowerCase();
    const hits: string[] = [];
    for (const f of firms) {
      if (f.n.toLowerCase().includes(lq)) { hits.push(f.n); if (hits.length >= 12) break; }
    }
    console.log('[FirmSearch] query:', q, '→ hits:', hits.length);
    setSugs(hits);
    setOpen(hits.length > 0);
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={ref}
        type="text"
        value={value}
        placeholder={loading ? 'Loading firms…' : placeholder}
        className={className}
        autoComplete="off"
        onChange={e => { onChange(e.target.value); search(e.target.value); }}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />

      {/* Visible load status — helps debugging */}
      <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2, height: 14 }}>
        {loading && '⏳ Loading firm list…'}
        {!loading && firms && `✓ ${firms.length.toLocaleString()} firms ready`}
        {!loading && !firms && '⚠ Firm data failed to load'}
      </div>

      {/* Dropdown — inline styles to bypass any Tailwind/CSS interference */}
      {open && sugs.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#fff',
          border: '1px solid #d1d5db',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          maxHeight: 240,
          overflowY: 'auto',
          zIndex: 99999,
          marginTop: 2,
        }}>
          {sugs.map((n, i) => (
            <div
              key={i}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 14, color: '#1f2937', borderBottom: '1px solid #f9fafb' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              onMouseDown={e => { e.preventDefault(); onChange(n); setOpen(false); setSugs([]); }}
            >
              {n}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
