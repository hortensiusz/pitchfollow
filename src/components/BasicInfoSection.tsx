'use client';
import { useStore } from '@/lib/store';
import { t, LANG_LABELS } from '@/lib/i18n';
import type { LangCode, CurrencyCode } from '@/lib/types';
import { Card } from './ui/Card';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ensureFy27Data, searchFirms } from '@/lib/fy27data';

const LANGS: LangCode[] = ['en', 'zh', 'zhTW', 'fr', 'de', 'ptBR'];
const CURRENCIES: CurrencyCode[] = ['£', '$', '€', '¥'];
const CURRENCY_LABELS: Record<CurrencyCode, string> = { '£': 'GBP £', '$': 'USD $', '€': 'EUR €', '¥': 'CNY ¥' };

interface Props {
  onExtractContacts: () => void;
}

export default function BasicInfoSection({ onExtractContacts }: Props) {
  const { app, setApp, setContacts, uiLang, saveState } = useStore();
  const T = (k: Parameters<typeof t>[0]) => t(k, uiLang);
  const save = useCallback(() => saveState(), [saveState]);

  const [clientSugs, setClientSugs] = useState<string[]>([]);
  const [showClientSug, setShowClientSug] = useState(false);
  const [firmsReady, setFirmsReady] = useState(false);
  const clientInputRef = useRef<HTMLInputElement>(null);
  const clientSugRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureFy27Data(() => setFirmsReady(true));
  }, []);

  // Re-run search once firms data loads (user may have already typed)
  useEffect(() => {
    if (firmsReady && app.client.length >= 2) {
      const hits = searchFirms(app.client);
      setClientSugs(hits.map(f => f.n));
      setShowClientSug(hits.length > 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firmsReady]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        clientSugRef.current &&
        !clientSugRef.current.contains(e.target as Node) &&
        e.target !== clientInputRef.current
      ) {
        setShowClientSug(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClientInput = (val: string) => {
    setApp({ client: val });
    save();
    if (!firmsReady) return;
    const hits = searchFirms(val);
    setClientSugs(hits.map(f => f.n));
    setShowClientSug(hits.length > 0);
  };

  const handleContactChange = (i: number, val: string) => {
    const c = [...app.contacts];
    c[i] = val;
    setContacts(c);
    save();
  };

  const addContact = () => {
    setContacts([...app.contacts, '']);
  };

  const removeContact = (i: number) => {
    const c = app.contacts.filter((_, idx) => idx !== i);
    setContacts(c.length ? c : ['']);
    save();
  };

  return (
    <Card>
      <h2 className="section-title">
        {T('secBasic')} <span className="section-flag">{T('flagCover')}</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Client */}
        <div className="relative">
          <label className="field-label">{T('lblClient')}</label>
          <input
            ref={clientInputRef}
            type="text"
            className="field-input"
            value={app.client}
            placeholder={firmsReady ? T('phClient') : T('phClient') + ' …'}
            onChange={e => handleClientInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && clientSugs.length) {
                setApp({ client: clientSugs[0] }); save(); setShowClientSug(false);
              }
              if (e.key === 'Escape') setShowClientSug(false);
            }}
          />
          {showClientSug && (
            <div
              ref={clientSugRef}
              className="absolute z-40 left-0 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto text-sm"
            >
              {clientSugs.map((name, i) => (
                <div
                  key={i}
                  className="px-3 py-1.5 cursor-pointer hover:bg-blue-50 text-gray-800"
                  onMouseDown={e => {
                    e.preventDefault(); // prevent blur before click registers
                    setApp({ client: name }); save(); setShowClientSug(false);
                  }}
                >
                  {name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Meeting date */}
        <div>
          <label className="field-label">{T('lblDate')}</label>
          <input
            type="date"
            className="field-input"
            value={app.mdate}
            onChange={e => { setApp({ mdate: e.target.value }); save(); }}
          />
        </div>

        {/* Our lead */}
        <div>
          <label className="field-label">{T('lblOwner')}</label>
          <input
            type="text"
            className="field-input"
            value={app.owner}
            placeholder={T('phOwner')}
            onChange={e => { setApp({ owner: e.target.value }); save(); }}
          />
        </div>

        {/* PPT language */}
        <div>
          <label className="field-label">{T('lblOutLang')}</label>
          <select
            className="field-input"
            value={app.lang}
            onChange={e => { setApp({ lang: e.target.value as LangCode }); save(); }}
          >
            {LANGS.map(l => <option key={l} value={l}>{LANG_LABELS[l]}</option>)}
          </select>
        </div>

        {/* Currency */}
        <div>
          <label className="field-label">{T('lblCurrency')}</label>
          <select
            className="field-input"
            value={app.currency}
            onChange={e => { setApp({ currency: e.target.value as CurrencyCode }); save(); }}
          >
            {CURRENCIES.map(c => <option key={c} value={c}>{CURRENCY_LABELS[c]}</option>)}
          </select>
        </div>

        {/* Contacts */}
        <div className="md:col-span-2 lg:col-span-1">
          <label className="field-label">{T('lblContact')}</label>
          <div className="flex flex-col gap-1.5">
            {app.contacts.map((c, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  className="field-input flex-1"
                  value={c}
                  placeholder={T('phContact')}
                  onChange={e => handleContactChange(i, e.target.value)}
                />
                {app.contacts.length > 1 && (
                  <button
                    onClick={() => removeContact(i)}
                    className="text-gray-400 hover:text-red-500 px-2 text-lg"
                  >✕</button>
                )}
              </div>
            ))}
            <div className="flex gap-2 mt-1">
              <button onClick={addContact} className="btn-ghost text-sm py-1 px-2">
                {T('btnAddContact')}
              </button>
              <button onClick={onExtractContacts} className="btn-ghost text-sm py-1 px-2">
                {T('btnExtractContacts')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
