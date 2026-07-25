'use client';
import { create } from 'zustand';
import type { AppState, PriceItem, AiConfig, LangCode, CurrencyCode, BulletItem, QuoteRow, SectionState, QuoteState } from './types';
import { DEFAULT_PRICES } from './defaultPrices';
import { SECTION_DEFS } from './i18n';

const LS_STATE = 'sfp_state_v2';
const LS_PRICE = 'sfp_prices_v2';
const LS_AI = 'sfp_ai_cfg';
const LS_UI_LANG = 'sfp_ui_lang';

function defaultSections(): Record<string, SectionState> {
  const s: Record<string, SectionState> = {};
  SECTION_DEFS.forEach(d => {
    s[d.id] = { inc: true, title: d.en, items: [] };
  });
  return s;
}

function defaultQuote(): QuoteState {
  return {
    inc: true,
    title: 'Commercial Proposal',
    rows: [],
    gd: 0,
    vat: false,
    prodIntro: false,
    note: '',
    term: '1y',
    y2Uplift: 8,
    twoYrDisc: 6,
  };
}

function defaultApp(): AppState {
  return {
    client: '',
    contact: '',
    contacts: [''],
    mdate: '',
    owner: '',
    lang: 'en',
    currency: '£',
    notes: '',
    secs: defaultSections(),
    quote: defaultQuote(),
  };
}

interface Store {
  app: AppState;
  priceList: PriceItem[];
  aiConfig: AiConfig;
  uiLang: LangCode;
  statusMsg: string;

  // setters
  setApp: (patch: Partial<AppState>) => void;
  setSection: (id: string, patch: Partial<SectionState>) => void;
  setSectionItems: (id: string, items: BulletItem[]) => void;
  setQuote: (patch: Partial<QuoteState>) => void;
  setQuoteRows: (rows: QuoteRow[]) => void;
  addQuoteRow: (row?: Partial<QuoteRow>) => void;
  updateQuoteRow: (index: number, patch: Partial<QuoteRow>) => void;
  removeQuoteRow: (index: number) => void;
  setContacts: (contacts: string[]) => void;
  setPriceList: (list: PriceItem[]) => void;
  setAiConfig: (cfg: Partial<AiConfig>) => void;
  setUiLang: (lang: LangCode) => void;
  setStatus: (msg: string, ms?: number) => void;

  // persistence
  saveState: () => void;
  loadState: () => void;
  resetAll: () => void;
}

const defaultAiConfig = (): AiConfig => ({
  provider: 'openai',
  endpoint: '',
  key: '',
  model: '',
  keyHeader: 'Authorization',
  keyPrefix: 'Bearer ',
});

let statusTimer: ReturnType<typeof setTimeout> | null = null;

export const useStore = create<Store>((set, get) => ({
  app: defaultApp(),
  priceList: DEFAULT_PRICES,
  aiConfig: defaultAiConfig(),
  uiLang: 'en',
  statusMsg: '',

  setApp: (patch) => set(s => ({ app: { ...s.app, ...patch } })),

  setSection: (id, patch) =>
    set(s => ({
      app: { ...s.app, secs: { ...s.app.secs, [id]: { ...s.app.secs[id], ...patch } } },
    })),

  setSectionItems: (id, items) =>
    set(s => ({
      app: { ...s.app, secs: { ...s.app.secs, [id]: { ...s.app.secs[id], items } } },
    })),

  setQuote: (patch) =>
    set(s => ({ app: { ...s.app, quote: { ...s.app.quote, ...patch } } })),

  setQuoteRows: (rows) =>
    set(s => ({ app: { ...s.app, quote: { ...s.app.quote, rows } } })),

  addQuoteRow: (partial) => {
    const row: QuoteRow = {
      name: '', qty: 1, price: 0, disc: 0, guide: '',
      parts: null, flat: false, p2y1: '', p2: '', up: '',
      p2y1manual: false, y2manual: false, floor: 0,
      ...partial,
    };
    set(s => ({
      app: { ...s.app, quote: { ...s.app.quote, rows: [...s.app.quote.rows, row] } },
    }));
  },

  updateQuoteRow: (index, patch) =>
    set(s => {
      const rows = [...s.app.quote.rows];
      rows[index] = { ...rows[index], ...patch };
      return { app: { ...s.app, quote: { ...s.app.quote, rows } } };
    }),

  removeQuoteRow: (index) =>
    set(s => {
      const rows = s.app.quote.rows.filter((_, i) => i !== index);
      return { app: { ...s.app, quote: { ...s.app.quote, rows } } };
    }),

  setContacts: (contacts) => set(s => ({ app: { ...s.app, contacts } })),

  setPriceList: (list) => {
    set({ priceList: list });
    try { localStorage.setItem(LS_PRICE, JSON.stringify(list)); } catch {}
  },

  setAiConfig: (cfg) => {
    set(s => {
      const next = { ...s.aiConfig, ...cfg };
      try { localStorage.setItem(LS_AI, JSON.stringify(next)); } catch {}
      return { aiConfig: next };
    });
  },

  setUiLang: (lang) => {
    set(s => ({ uiLang: lang, app: { ...s.app, lang } }));
    try { localStorage.setItem(LS_UI_LANG, lang); } catch {}
  },

  setStatus: (msg, ms = 2500) => {
    set({ statusMsg: msg });
    if (statusTimer) clearTimeout(statusTimer);
    statusTimer = setTimeout(() => set({ statusMsg: '' }), ms);
  },

  saveState: () => {
    try {
      localStorage.setItem(LS_STATE, JSON.stringify(get().app));
      get().setStatus('Auto-saved');
    } catch {}
  },

  loadState: () => {
    try {
      const raw = localStorage.getItem(LS_STATE);
      if (raw) {
        const parsed: AppState = JSON.parse(raw);
        // Merge to ensure all section keys exist
        const secs = defaultSections();
        if (parsed.secs) {
          Object.keys(parsed.secs).forEach(k => { if (secs[k]) secs[k] = parsed.secs[k]; });
        }
        set({ app: { ...defaultApp(), ...parsed, secs } });
      }
    } catch {}

    try {
      const prices = localStorage.getItem(LS_PRICE);
      if (prices) set({ priceList: JSON.parse(prices) });
    } catch {}

    try {
      const ai = localStorage.getItem(LS_AI);
      if (ai) set({ aiConfig: { ...defaultAiConfig(), ...JSON.parse(ai) } });
    } catch {}

    try {
      const lang = localStorage.getItem(LS_UI_LANG) as LangCode;
      if (lang) set({ uiLang: lang });
    } catch {}
  },

  resetAll: () => {
    try { localStorage.removeItem(LS_STATE); } catch {}
    set({ app: defaultApp() });
  },
}));
