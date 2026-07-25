export type LangCode = 'en' | 'zh' | 'zhTW' | 'fr' | 'de' | 'ptBR';
export type CurrencyCode = '£' | '$' | '€' | '¥';

export interface SectionDef {
  id: 'recap' | 'needs' | 'solution' | 'next';
  en: string;
  zh: string;
  zhTW: string;
  fr: string;
  de: string;
  ptBR: string;
  ph: string;
}

export interface BulletItem {
  t: string;
  c: boolean;
}

export interface QuoteRow {
  name: string;
  qty: number;
  price: number;
  disc: number;
  guide: string;
  parts: string[] | null;
  flat: boolean;
  p2y1: number | '';
  p2: number | '';
  up: number | '';
  p2y1manual: boolean;
  y2manual: boolean;
  floor: number;
}

export interface SectionState {
  inc: boolean;
  title: string;
  items: BulletItem[];
}

export interface QuoteState {
  inc: boolean;
  title: string;
  rows: QuoteRow[];
  gd: number;
  vat: boolean;
  prodIntro: boolean;
  note: string;
  term: '1y' | '2y' | 'both';
  y2Uplift: number;
  twoYrDisc: number;
}

export interface AppState {
  client: string;
  contact: string;
  contacts: string[];
  mdate: string;
  owner: string;
  lang: LangCode;
  currency: CurrencyCode;
  notes: string;
  secs: Record<string, SectionState>;
  quote: QuoteState;
}

export interface PriceItem {
  name: string;
  unit: string;
  price: number;
  desc: string;
  kw: string;
}

export interface AiConfig {
  provider: 'openai' | 'anthropic';
  endpoint: string;
  key: string;
  model: string;
  keyHeader: string;
  keyPrefix: string;
}
