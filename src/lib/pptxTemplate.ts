// Server-side PPTX generator that builds decks FROM the real Chambers template
// (chambers-template-2026.pptx) using pptx-automizer. Runs only in the Node.js
// runtime (Vercel serverless / next dev). Do NOT import from client components.
import path from 'path';
import os from 'os';
import { Automizer, ModifyTextHelper, modify } from 'pptx-automizer';
import type { AppState, PriceItem } from './types';
import { SECTION_DEFS, QUOTE_TITLES, sectionLabel } from './i18n';
import { calcQuote, formatMoney, rowOneNet, calcP1Default, calcP2Default } from './quoteCalc';

const TEMPLATE = 'chambers-template-2026.pptx';
const FONT = 'Avenir Next LT Pro';
const NAVY = '002B49';
const GRAY = '8E8E89';
const BORDER = 'DDE1E7';

// Template slide roles (verified against chambers-template-2026.pptx)
const SLIDE = {
  cover: 7,   // dark navy cover  — Text Placeholder 2/3/4
  body: 8,    // blank body slide — Text Placeholder 4 (title only)
  back: 12,   // beige back cover — Text Placeholder 2 (contact block)
};

// Content area on a body slide (13.33 x 7.5"), below the heading, above footer
const AREA = { x: 0.55, y: 1.55, w: 12.2, h: 5.0 };

type QuoteRow = AppState['quote']['rows'][number];

/** Format an ISO date (YYYY-MM-DD) as UK long form, e.g. "26 July 2026". */
function ukDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${+m[3]} ${months[+m[2] - 1]} ${m[1]}`;
}

/** Build the follow-up deck and return it as a Node Buffer. */
export async function buildTemplatePptx(app: AppState, priceList: PriceItem[]): Promise<Buffer> {
  const automizer = new Automizer({
    templateDir: path.join(process.cwd(), 'templates'),
    outputDir: os.tmpdir(),
    removeExistingSlides: true,
    autoImportSlideMasters: true,
    cleanup: true,
    compression: 5,
    verbosity: 0,
  });

  const pres = automizer.loadRoot(TEMPLATE).load(TEMPLATE, 'tpl');

  const lang = app.lang;
  const client = app.client || 'Client';
  const contacts = app.contacts.filter(Boolean);
  const cur = app.currency;
  const quote = app.quote;

  const setTitle = (slide: any, text: string) =>
    slide.modifyElement('Text Placeholder 4', [ModifyTextHelper.setText(text)]);

  // ── Cover ────────────────────────────────────────────────────────────────
  pres.addSlide('tpl', SLIDE.cover, (slide: any) => {
    slide.modifyElement('Text Placeholder 2', [ModifyTextHelper.setText(client)]);
    slide.modifyElement('Text Placeholder 3', [ModifyTextHelper.setText('Follow-Up Meeting')]);
    // Replace the template's details placeholder (label / value pairs)
    const pairs: Array<[string, string]> = [];
    if (contacts.length) pairs.push(['A presentation to:', contacts.join(', ')]);
    if (app.owner) pairs.push(['Prepared by:', app.owner]);
    if (app.mdate) pairs.push(['Date:', ukDate(app.mdate)]);
    if (pairs.length) {
      slide.modifyElement('Text Placeholder 4', [
        modify.setMultiText(
          pairs.flatMap(([label, value]) => [
            { paragraph: { level: 0 }, textRuns: [{ text: label, style: { color: { type: 'srgbClr', value: 'CFC570' } } }] },
            { paragraph: { level: 0 }, textRuns: [{ text: value, style: { color: { type: 'srgbClr', value: 'FFFFFF' } } }] },
          ]),
        ),
      ]);
    }
  });

  // ── Section (divider + chunked body slides) ──────────────────────────────
  const addSection = (title: string, items: string[]) => {
    if (!items.length) return;
    // Divider
    pres.addSlide('tpl', SLIDE.body, (slide: any) => setTitle(slide, title));
    // Body slides, ~6 bullets each
    for (let i = 0; i < items.length; i += 6) {
      const chunk = items.slice(i, i + 6);
      pres.addSlide('tpl', SLIDE.body, (slide: any) => {
        setTitle(slide, title);
        slide.generate((p: any) => {
          p.addText(
            chunk.map((t) => ({ text: t, options: { bullet: { code: '2022' }, breakLine: true } })),
            { ...AREA, fontSize: 16, color: NAVY, fontFace: FONT, valign: 'top', paraSpaceAfter: 10, lineSpacingMultiple: 1.1 },
          );
        }, 'bullets');
      });
    }
  };

  // recap / needs / solution
  for (const def of SECTION_DEFS.filter((d) => d.id !== 'next')) {
    const sec = app.secs[def.id];
    if (!sec?.inc) continue;
    const items = sec.items.filter((it) => it.c && it.t.trim()).map((it) => it.t.trim());
    addSection(sec.title || sectionLabel(def, lang), items);
  }

  // ── Product intros ───────────────────────────────────────────────────────
  if (quote.prodIntro && quote.inc) {
    const names = new Set<string>();
    quote.rows.forEach((r) => { if (r.name) names.add(r.name); (r.parts || []).forEach((x) => names.add(x)); });
    for (const nm of names) {
      const p = priceList.find((x) => x.name === nm);
      if (!p?.desc?.trim()) continue;
      const pts = p.desc.split(/\n+/).map((s) => s.trim()).filter(Boolean);
      pres.addSlide('tpl', SLIDE.body, (slide: any) => {
        setTitle(slide, nm);
        slide.generate((pg: any) => {
          pg.addText(
            pts.map((t) => ({ text: t, options: { bullet: { code: '2022' }, breakLine: true } })),
            { ...AREA, fontSize: 15, color: NAVY, fontFace: FONT, valign: 'top', paraSpaceAfter: 8, lineSpacingMultiple: 1.1 },
          );
        }, 'prodBullets');
      });
    }
  }

  // ── Quote ────────────────────────────────────────────────────────────────
  if (quote.inc) {
    const rows = quote.rows.filter((r) => r.name);
    if (rows.length) {
      const result = calcQuote(quote);
      const money = (n: number) => formatMoney(n, cur);
      const baseYear = app.mdate ? new Date(app.mdate + 'T00:00:00').getFullYear() : new Date().getFullYear();
      const y1 = baseYear, y2 = baseYear + 1;
      const term = quote.term;

      const rowY1in2Net = (r: QuoteRow): number => {
        if (r.p2y1manual && typeof r.p2y1 === 'number') return (r.flat ? r.p2y1 : r.qty * r.p2y1) * (1 - r.disc / 100);
        const p1u = calcP1Default(r, quote.twoYrDisc);
        return typeof p1u === 'number' ? (r.flat ? p1u : r.qty * p1u) : rowOneNet(r);
      };
      const rowY2Net = (r: QuoteRow): number => {
        if (r.y2manual && typeof r.p2 === 'number') return (r.flat ? r.p2 : r.qty * r.p2) * (1 - r.disc / 100);
        const p1u = calcP1Default(r, quote.twoYrDisc);
        if (typeof p1u !== 'number') return 0;
        const eff = typeof r.up === 'number' ? r.up : quote.y2Uplift;
        const p2u = calcP2Default(p1u, eff);
        return typeof p2u === 'number' ? (r.flat ? p2u : r.qty * p2u) : 0;
      };

      const cleanName = (r: QuoteRow) =>
        r.name.replace(/\s*[(（][^)）]*[)）]/g, '').trim() + (r.flat ? ` (${r.qty} depts)` : '');

      pres.addSlide('tpl', SLIDE.body, (slide: any) => {
        setTitle(slide, quote.title || QUOTE_TITLES[lang] || 'Commercial Proposal');
        slide.generate((p: any) => {
          const th = (t: string, align: any = 'left') => ({
            text: t, options: { bold: true, color: 'FFFFFF', fill: { color: NAVY }, align, fontFace: FONT },
          });
          const td = (t: string, align: any = 'left', bold = false) => ({
            text: t, options: { color: NAVY, align, bold, fontFace: FONT },
          });

          let head: any[]; let body: any[][]; let colW: number[];
          if (term === '1y') {
            head = [th('Product'), th('Qty', 'center'), th('Price', 'right')];
            body = rows.map((r) => [td(cleanName(r)), td(r.flat ? '—' : String(r.qty), 'center'), td(money(rowOneNet(r)), 'right')]);
            body.push([td('Total', 'left', true), td('', 'center'), td(money(result.total), 'right', true)]);
            colW = [8.7, 1.3, 2.2];
          } else if (term === '2y') {
            head = [th('Product'), th(String(y1), 'right'), th(String(y2), 'right')];
            body = rows.map((r) => [td(cleanName(r)), td(money(rowY1in2Net(r)), 'right'), td(money(rowY2Net(r)), 'right')]);
            body.push([td('Total', 'left', true), td(money(result.total), 'right', true), td(money(result.total2), 'right', true)]);
            colW = [7.2, 2.5, 2.5];
          } else {
            head = [th('Product'), th('1-Year', 'right'), th(`${y1} (2yr)`, 'right'), th(`${y2} (2yr)`, 'right')];
            body = rows.map((r) => [td(cleanName(r)), td(money(rowOneNet(r)), 'right'), td(money(rowY1in2Net(r)), 'right'), td(money(rowY2Net(r)), 'right')]);
            body.push([td('Total', 'left', true), td(money(result.total), 'right', true), td(money(result.total), 'right', true), td(money(result.total2), 'right', true)]);
            colW = [5.4, 2.27, 2.27, 2.26];
          }

          p.addTable([head, ...body], {
            x: 0.55, y: 1.55, w: 12.2, colW, fontSize: 12.5, valign: 'middle',
            border: { type: 'solid', color: BORDER, pt: 1 }, rowH: 0.42, autoPage: false,
          });

          if (quote.note.trim()) {
            p.addText(quote.note, {
              x: 0.55, y: 6.55, w: 12.2, h: 0.35, fontSize: 10, italic: true, color: GRAY, fontFace: FONT,
            });
          }
        }, 'quoteTable');
      });
    }
  }

  // ── Next steps ───────────────────────────────────────────────────────────
  const nextDef = SECTION_DEFS.find((d) => d.id === 'next')!;
  const nextSec = app.secs['next'];
  if (nextSec?.inc) {
    const items = nextSec.items.filter((it) => it.c && it.t.trim()).map((it) => it.t.trim());
    addSection(nextSec.title || sectionLabel(nextDef, lang), items);
  }

  // ── Back cover ───────────────────────────────────────────────────────────
  pres.addSlide('tpl', SLIDE.back, (slide: any) => {
    const lines = [
      'For more information and FAQs.',
      'Please visit chambers.com/faqs',
      app.owner ? `Contact: ${app.owner}` : 'Contact: enquiries@chambers.com',
    ];
    slide.modifyElement('Text Placeholder 2', [
      modify.setMultiText(
        lines.map((t) => ({ paragraph: { level: 0 }, textRuns: [{ text: t }] })),
      ),
    ]);
  });

  const zip = await pres.getJSZip();
  const buf: Buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  return buf;
}
