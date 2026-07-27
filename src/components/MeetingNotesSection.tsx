'use client';
import { useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { Card } from './ui/Card';

interface Props {
  onGenSections: () => void;
  genBusy?: boolean;
}

export default function MeetingNotesSection({ onGenSections, genBusy }: Props) {
  const { app, setApp, uiLang, saveState } = useStore();
  const T = (k: Parameters<typeof t>[0]) => t(k, uiLang);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleFile = async (f: File) => {
    setUploading(true);
    try {
      const ext = f.name.toLowerCase();
      let text = '';
      if (ext.endsWith('.docx')) {
        // load mammoth from CDN
        if (!(window as any).mammoth) {
          await new Promise<void>((res, rej) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
            s.onload = () => res(); s.onerror = () => rej(new Error('mammoth load failed'));
            document.head.appendChild(s);
          });
        }
        const r = await (window as any).mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() });
        text = r.value;
      } else if (ext.endsWith('.pdf')) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        await new Promise(r => { script.onload = r; document.head.appendChild(script); });
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const pdf = await pdfjsLib.getDocument({ data: await f.arrayBuffer() }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const pg = await pdf.getPage(i);
          const tc = await pg.getTextContent();
          text += (tc.items as any[]).map((x: any) => x.str).join(' ') + '\n';
        }
      } else {
        text = await f.text();
      }
      text = text.replace(/\r\n/g, '\n').trim();
      if (!text) { alert(T('uploadFail') + 'No text extracted.'); return; }
      const cur = app.notes.trim();
      setApp({ notes: cur ? cur + '\n\n' + text : text });
      setOpen(true);
      saveState();
    } catch (err: any) {
      alert(T('uploadFail') + err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Card>
      <details open={open} onToggle={e => setOpen((e.target as HTMLDetailsElement).open)}>
        <summary className="cursor-pointer font-semibold text-[#002B49] text-sm select-none">
          {T('sumNotes')}
        </summary>
        <div className="mt-3">
          <textarea
            className="field-input min-h-[140px] resize-y font-mono text-sm"
            value={app.notes}
            placeholder={T('phNotes')}
            onChange={e => { setApp({ notes: e.target.value }); saveState(); }}
          />
          <div className="flex flex-wrap gap-2 mt-2 items-center">
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".txt,.md,.markdown,.vtt,.srt,.csv,.log,.rtf,.docx,.pdf"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn-ghost text-sm"
            >
              {uploading ? T('uploadParsing') : T('uploadNotes')}
            </button>
            <button onClick={onGenSections} disabled={genBusy} className="btn-primary text-sm disabled:opacity-50">
              {T('btnGenSec')}
            </button>
            {genBusy
              ? <span className="text-xs text-[var(--accent)] font-medium animate-pulse">{T('btnGenerating')}</span>
              : <span className="text-xs text-[var(--muted)]">{T('hintNotes')}</span>}
          </div>
        </div>
      </details>
    </Card>
  );
}
