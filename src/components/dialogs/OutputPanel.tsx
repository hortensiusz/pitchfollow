'use client';
import { useStore } from '@/lib/store';
import { t } from '@/lib/i18n';

interface Props {
  kind: 'summary' | 'email';
  title: string;
  hint: string;
  content: string | [string, string, string];
  onClose: () => void;
}

export default function OutputPanel({ kind, title, hint, content, onClose }: Props) {
  const { uiLang, setStatus } = useStore();
  const T = (k: Parameters<typeof t>[0]) => t(k, uiLang);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => setStatus(T('flashCopied')),
      () => setStatus('Copy failed')
    );
  };

  const downloadMd = (text: string, label: string) => {
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = label + '.md';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const isSingle = typeof content === 'string';
  const texts = isSingle ? [content] : content;
  const versionLabels = [
    'Version 1 — Short, sharp & sweet',
    'Version 2 — Conversational',
    'Version 3 — Professional & structured',
  ];

  return (
    <div className="bg-white border border-[var(--hairline)] rounded-md p-5">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-[#002B49]">{title}</h3>
          <p className="text-xs text-[var(--muted)] mt-0.5">{hint}</p>
        </div>
        <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--muted)] text-xl px-1">✕</button>
      </div>
      {texts.map((text, i) => (
        <div key={i} className={i > 0 ? 'mt-4' : ''}>
          {!isSingle && (
            <div className="flex justify-between items-center mb-1">
              <b className="text-sm text-[#002B49]">{versionLabels[i]}</b>
              <button onClick={() => copyText(text)} className="btn-ghost text-xs py-0.5 px-2">{T('btnCopy')}</button>
            </div>
          )}
          <textarea
            className="field-input font-mono text-xs min-h-[160px] resize-y"
            value={text}
            readOnly
            onClick={e => (e.target as HTMLTextAreaElement).select()}
          />
        </div>
      ))}
      <div className="flex gap-2 mt-3 flex-wrap">
        {isSingle && (
          <button onClick={() => copyText(texts[0])} className="btn-ghost text-sm">{T('btnCopy')}</button>
        )}
        <button
          onClick={() => downloadMd(texts.join('\n\n'), kind)}
          className="btn-ghost text-sm"
        >{T('btnDownloadMd')}</button>
        <button onClick={onClose} className="btn-ghost text-sm">{T('btnClose')}</button>
      </div>
    </div>
  );
}
