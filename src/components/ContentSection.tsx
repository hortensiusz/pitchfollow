'use client';
import { useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import type { SectionDef, BulletItem } from '@/lib/types';
import { Card } from './ui/Card';

interface Props {
  def: SectionDef;
}

// Textarea that grows to fit its content — on typing AND when the value is
// set programmatically (e.g. AI-generated points), so nothing is clipped and
// no scrollbar (with its up/down arrows) ever appears.
function AutoTextarea({ value, placeholder, onChange }: {
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };
  useEffect(resize, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className="field-input flex-1 min-h-[38px] resize-none overflow-hidden text-sm leading-relaxed"
    />
  );
}

export default function ContentSection({ def }: Props) {
  const { app, setSection, setSectionItems, uiLang, saveState } = useStore();
  const T = (k: Parameters<typeof t>[0]) => t(k, uiLang);
  const sec = app.secs[def.id] ?? { inc: true, title: def.en, items: [] };

  const updateItem = (i: number, patch: Partial<BulletItem>) => {
    const items = sec.items.map((it, idx) => idx === i ? { ...it, ...patch } : it);
    setSectionItems(def.id, items);
    saveState();
  };

  const addItem = () => {
    setSectionItems(def.id, [...sec.items, { t: '', c: true }]);
    saveState();
  };

  const removeItem = (i: number) => {
    setSectionItems(def.id, sec.items.filter((_, idx) => idx !== i));
    saveState();
  };

  return (
    <Card className={!sec.inc ? 'opacity-70' : ''}>
      <div className="flex items-center gap-3 mb-3">
        <label className="flex items-center gap-1.5 cursor-pointer select-none text-sm text-[var(--muted)]">
          <input
            type="checkbox"
            checked={sec.inc}
            onChange={e => { setSection(def.id, { inc: e.target.checked }); saveState(); }}
            className="accent-[#002B49] w-4 h-4"
          />
          <span>{T('lblWriteToPpt')}</span>
        </label>
        <input
          type="text"
          className="flex-1 font-semibold text-[#002B49] text-base bg-transparent border-b border-transparent hover:border-[var(--hairline)] focus:border-[#002B49] outline-none transition-colors"
          value={sec.title}
          onChange={e => { setSection(def.id, { title: e.target.value }); saveState(); }}
        />
      </div>

      <div className={`flex flex-col gap-2 ${!sec.inc ? 'pointer-events-none' : ''}`}>
        {sec.items.map((item, i) => (
          <div key={i} className="flex gap-2 items-start">
            <input
              type="checkbox"
              checked={item.c}
              title={T('titleItemCk')}
              onChange={e => updateItem(i, { c: e.target.checked })}
              className="accent-[#002B49] w-4 h-4 mt-2.5 flex-none"
            />
            <AutoTextarea
              value={item.t}
              placeholder={def.ph}
              onChange={v => updateItem(i, { t: v })}
            />
            <button
              onClick={() => removeItem(i)}
              className="text-[var(--faint)] hover:text-red-500 text-lg px-1 mt-1.5 flex-none"
            >✕</button>
          </div>
        ))}
        <button
          onClick={addItem}
          className="w-full border border-dashed border-[var(--hairline-strong)] rounded-md py-1.5 text-sm text-[var(--muted)] hover:bg-[#FAF9F6] mt-1"
        >
          {T('btnAddItem')}
        </button>
      </div>
    </Card>
  );
}
