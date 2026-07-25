'use client';
import { useStore } from '@/lib/store';
import { t, LANG_LABELS } from '@/lib/i18n';
import type { LangCode } from '@/lib/types';

const LANGS: LangCode[] = ['en', 'zh', 'zhTW', 'fr', 'de', 'ptBR'];

interface Props {
  onSummary: () => void;
  onEmail: () => void;
  onPrices: () => void;
}

export default function AppHeader({ onSummary, onEmail, onPrices }: Props) {
  const { uiLang, setUiLang, statusMsg } = useStore();
  const T = (k: Parameters<typeof t>[0]) => t(k, uiLang);

  return (
    <header className="bg-[#1e3a5f] text-white px-6 py-4 flex flex-wrap justify-between items-center gap-3">
      <div>
        <h1 className="text-lg font-semibold">{T('appTitle')}</h1>
        <p className="text-xs opacity-75 mt-0.5">{T('appSub')} · v1.0</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={uiLang}
          onChange={e => setUiLang(e.target.value as LangCode)}
          className="bg-white/10 text-white text-sm rounded px-2 py-1 border border-white/20"
        >
          {LANGS.map(l => <option key={l} value={l} className="text-gray-900">{LANG_LABELS[l]}</option>)}
        </select>
        <HeaderBtn onClick={onSummary}>{T('btnSummary')}</HeaderBtn>
        <HeaderBtn onClick={onEmail}>{T('btnFollowupEmail')}</HeaderBtn>
        <HeaderBtn onClick={onPrices}>{T('btnPrices')}</HeaderBtn>
        {statusMsg && (
          <span className="text-xs text-yellow-300 font-medium">{statusMsg}</span>
        )}
      </div>
    </header>
  );
}

function HeaderBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-1.5 rounded transition-colors"
    >
      {children}
    </button>
  );
}
