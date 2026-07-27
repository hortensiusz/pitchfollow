'use client';
import { useStore } from '@/lib/store';
import { t, LANG_LABELS } from '@/lib/i18n';
import type { LangCode } from '@/lib/types';

const LANGS: LangCode[] = ['en', 'zh', 'zhTW', 'fr', 'de', 'ptBR'];

export default function AppHeader() {
  const { uiLang, setUiLang, statusMsg } = useStore();
  const T = (k: Parameters<typeof t>[0]) => t(k, uiLang);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--hairline)] bg-[var(--ground)]/85 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[13px] font-semibold tracking-[0.18em] uppercase text-[#002B49] whitespace-nowrap">
            Chambers
          </span>
          <span className="w-px h-4 bg-[var(--hairline-strong)]" />
          <span className="text-[12.5px] text-[var(--muted)] truncate">
            {T('appTitle')}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {statusMsg && (
            <span className="hidden md:inline text-[11px] text-[var(--accent)] whitespace-nowrap">
              {statusMsg}
            </span>
          )}
          <select
            value={uiLang}
            onChange={e => setUiLang(e.target.value as LangCode)}
            aria-label={T('uiLangTitle')}
            className="text-[12px] text-[#002B49] bg-transparent rounded px-1.5 py-1 border border-transparent hover:border-[var(--hairline-strong)] outline-none cursor-pointer transition-colors"
          >
            {LANGS.map(l => <option key={l} value={l}>{LANG_LABELS[l]}</option>)}
          </select>
        </div>
      </div>
    </header>
  );
}
