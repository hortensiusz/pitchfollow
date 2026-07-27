'use client';
import { useStore } from '@/lib/store';
import { t, LANG_LABELS } from '@/lib/i18n';
import type { LangCode, CurrencyCode } from '@/lib/types';
import { Card } from './ui/Card';
import { useCallback } from 'react';
import FirmSearchInput from './FirmSearchInput';

const LANGS: LangCode[] = ['en', 'zh', 'zhTW', 'fr', 'de', 'ptBR'];
const CURRENCIES: CurrencyCode[] = ['£', '$', '€', '¥'];
const CURRENCY_LABELS: Record<CurrencyCode, string> = { '£': 'GBP £', '$': 'USD $', '€': 'EUR €', '¥': 'CNY ¥' };

interface Props {
  onExtractContacts: () => void;
  extractBusy?: boolean;
}

export default function BasicInfoSection({ onExtractContacts, extractBusy }: Props) {
  const { app, setApp, setContacts, setUiLang, uiLang, saveState } = useStore();
  const T = (k: Parameters<typeof t>[0]) => t(k, uiLang);
  const save = useCallback(() => saveState(), [saveState]);


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
          <FirmSearchInput
            value={app.client}
            onChange={name => { setApp({ client: name }); save(); }}
            placeholder={T('phClient')}
            className="field-input"
          />
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
            onChange={e => { setUiLang(e.target.value as LangCode); save(); }}
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
                    className="text-[var(--muted)] hover:text-red-500 px-2 text-lg"
                  >✕</button>
                )}
              </div>
            ))}
            <div className="flex gap-2 mt-1 items-center">
              <button onClick={addContact} className="btn-ghost text-sm py-1 px-2">
                {T('btnAddContact')}
              </button>
              <button onClick={onExtractContacts} disabled={extractBusy} className="btn-ghost text-sm py-1 px-2 disabled:opacity-50">
                {T('btnExtractContacts')}
              </button>
              {extractBusy && (
                <span className="text-xs text-[var(--accent)] font-medium animate-pulse">{T('btnGenerating')}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
