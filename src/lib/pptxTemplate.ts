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
const BRONZE = 'B68A52';
const GRAY = '8E8E89';
const MUTED = '6B7683';
const BORDER = 'E4E2DC';

// Template slide roles (verified against chambers-template-2026.pptx)
const SLIDE = {
  cover: 7,   // dark navy cover  — Text Placeholder 2/3/4
  body: 8,    // blank body slide — Text Placeholder 4 (title only)
  back: 12,   // beige back cover — Text Placeholder 2 (contact block)
};

// Editorial content block on a body slide (13.33 x 7.5"): narrow measure,
// generous left margin, vertically centred in the space below the heading.
const AREA = { x: 0.95, y: 1.55, w: 9.6, h: 4.95 };

type QuoteRow = AppState['quote']['rows'][number];

/** Group quote rows by their guide, preserving first-seen order. */
function groupByGuide(rows: QuoteRow[]): Array<{ guide: string; rows: QuoteRow[] }> {
  const map = new Map<string, QuoteRow[]>();
  for (const r of rows) {
    const g = (r.guide || '').trim();
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(r);
  }
  return [...map.entries()].map(([guide, rs]) => ({ guide, rows: rs }));
}

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

  // ── Section body slide — editorial calm: a narrow, vertically-centred
  // measure with generous leading and a bronze marker. No divider slides.
  const addBodySlide = (title: string, items: string[], fontSize = 17, marginPt = 20) => {
    pres.addSlide('tpl', SLIDE.body, (slide: any) => {
      setTitle(slide, title);
      slide.generate((p: any) => {
        p.addText(
          items.map((t) => ({
            text: t,
            options: { bullet: { code: '2022', indent: 22 }, breakLine: true, color: NAVY },
          })),
          {
            x: AREA.x, y: AREA.y, w: AREA.w, h: AREA.h,
            fontSize, color: NAVY, fontFace: FONT, valign: 'middle',
            paraSpaceAfter: marginPt, lineSpacingMultiple: 1.35,
          },
        );
      }, 'bullets');
    });
  };

  const addSection = (title: string, items: string[]) => {
    if (!items.length) return;
    for (let i = 0; i < items.length; i += 6) {
      const chunk = items.slice(i, i + 6);
      const suffix = items.length > 6 ? ` (${Math.floor(i / 6) + 1})` : '';
      addBodySlide(title + suffix, chunk);
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
      const pts = p.desc.split(/\n+/).map((s) => s.trim()).filter(Boolean).slice(0, 6);
      addBodySlide(nm, pts, 16, 16);
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

      const sumRows = (f: (r: QuoteRow) => number) => rows.reduce((a, r) => a + f(r), 0);
      const gdVat = (net: number) => net * (1 - quote.gd / 100) * (quote.vat ? 1.2 : 1);

      pres.addSlide('tpl', SLIDE.body, (slide: any) => {
        setTitle(slide, quote.title || QUOTE_TITLES[lang] || 'Commercial Proposal');
        slide.generate((p: any) => {
          const groups = groupByGuide(rows);
          const GOLD = 'CFC570', GREEN = '2E7D5B', CARD_BG = 'FBFAF7', GHEAD = 'F5F3ED';

          if (term === 'both') {
            // ── Two comparison cards, guiding toward the 2-year contract ────
            const y1Total = gdVat(sumRows(rowOneNet));
            const two1 = gdVat(sumRows(rowY1in2Net));
            const two2 = gdVat(sumRows(rowY2Net));
            const twoTotal = two1 + two2;
            const y1Saving = Math.max(0, y1Total - two1);

            const cardW = 5.75, gap = 0.5, cardY = 1.62, cardH = 4.78;
            const x1 = 0.69, x2 = x1 + cardW + gap;

            // Grouped line-item rows (guide sub-header + products) for a card
            const buildRows = (price: (r: QuoteRow) => number) => {
              const out: any[][] = [];
              for (const g of groups) {
                if (g.guide) {
                  out.push([{
                    text: g.guide.toUpperCase(),
                    options: {
                      colspan: 2, color: BRONZE, bold: true, fontSize: 8.5, charSpacing: 2,
                      align: 'left', valign: 'middle', fontFace: FONT, fill: { color: CARD_BG },
                      border: [{ type: 'none' }, { type: 'none' }, { type: 'solid', color: BRONZE, pt: 0.5 }, { type: 'none' }],
                    },
                  }]);
                }
                for (const r of g.rows) {
                  out.push([
                    { text: cleanName(r), options: { color: NAVY, fontFace: FONT, align: 'left', fontSize: 10.5, valign: 'middle' } },
                    { text: money(price(r)), options: { color: NAVY, fontFace: FONT, align: 'right', fontSize: 10.5, bold: true, valign: 'middle' } },
                  ]);
                }
              }
              return out;
            };

            const drawCard = (x: number, o: {
              optLabel: string; termLabel: string; headFill: string; border: string; borderW: number;
              recommended?: boolean; itemRows: any[][]; footer: () => void;
            }) => {
              p.addShape('roundRect', { x, y: cardY, w: cardW, h: cardH, rectRadius: 0.08, fill: { color: CARD_BG }, line: { color: o.border, width: o.borderW } });
              p.addShape('rect', { x, y: cardY, w: cardW, h: 0.68, fill: { color: o.headFill }, line: { width: 0 } });
              p.addText(
                [
                  { text: o.optLabel + '\n', options: { fontSize: 9.5, bold: true, color: GOLD, charSpacing: 3 } },
                  { text: o.termLabel, options: { fontSize: 15, bold: true, color: 'FFFFFF' } },
                ],
                { x: x + 0.3, y: cardY + 0.0, w: cardW - 0.6, h: 0.68, fontFace: FONT, valign: 'middle', align: 'left' },
              );
              if (o.recommended) {
                p.addText('★ RECOMMENDED', { x: x + cardW - 2.0, y: cardY + 0.19, w: 1.72, h: 0.3, fontSize: 8, bold: true, color: NAVY, fill: { color: GOLD }, align: 'center', valign: 'middle', fontFace: FONT });
              }
              p.addTable(o.itemRows, {
                x: x + 0.3, y: cardY + 0.9, w: cardW - 0.6, colW: [cardW - 0.6 - 1.55, 1.55],
                rowH: 0.32, valign: 'middle', border: { type: 'solid', color: 'EEEBE3', pt: 0.5 },
              });
              o.footer();
            };

            // Card 1 — 1-Year (restrained, secondary)
            drawCard(x1, {
              optLabel: 'OPTION 1', termLabel: '1-Year Contract', headFill: '7A8794', border: BORDER, borderW: 1,
              itemRows: buildRows(rowOneNet),
              footer: () => {
                const fy = cardY + cardH - 1.02;
                p.addShape('rect', { x: x1 + 0.3, y: fy, w: cardW - 0.6, h: 0.012, fill: { color: BORDER }, line: { width: 0 } });
                p.addText('Annual total', { x: x1 + 0.3, y: fy + 0.12, w: 2.8, h: 0.4, fontSize: 11, color: MUTED, fontFace: FONT, valign: 'middle' });
                p.addText(money(y1Total), { x: x1 + cardW - 3.0, y: fy + 0.12, w: 2.7, h: 0.4, fontSize: 17, bold: true, color: NAVY, align: 'right', fontFace: FONT, valign: 'middle' });
                p.addText('Renews at full price with annual uplift', { x: x1 + 0.3, y: fy + 0.58, w: cardW - 0.6, h: 0.28, fontSize: 9, italic: true, color: GRAY, fontFace: FONT });
              },
            });

            // Card 2 — 2-Year (recommended, emphasised)
            drawCard(x2, {
              optLabel: 'OPTION 2', termLabel: '2-Year Contract', headFill: NAVY, border: BRONZE, borderW: 2.25, recommended: true,
              itemRows: buildRows(rowY1in2Net),
              footer: () => {
                const fy = cardY + cardH - 1.5;
                p.addShape('rect', { x: x2 + 0.3, y: fy, w: cardW - 0.6, h: 0.012, fill: { color: BRONZE }, line: { width: 0 } });
                p.addText(
                  [
                    { text: `Year 1 (${y1})  `, options: { fontSize: 10, color: MUTED } },
                    { text: `${money(two1)}`, options: { fontSize: 10, bold: true, color: NAVY } },
                    { text: `      Year 2 (${y2})  `, options: { fontSize: 10, color: MUTED } },
                    { text: `${money(two2)}`, options: { fontSize: 10, bold: true, color: NAVY } },
                  ],
                  { x: x2 + 0.3, y: fy + 0.1, w: cardW - 0.6, h: 0.3, fontFace: FONT, valign: 'middle' },
                );
                p.addText('2-year total', { x: x2 + 0.3, y: fy + 0.44, w: 2.8, h: 0.4, fontSize: 11, color: MUTED, fontFace: FONT, valign: 'middle' });
                p.addText(money(twoTotal), { x: x2 + cardW - 3.0, y: fy + 0.44, w: 2.7, h: 0.4, fontSize: 17, bold: true, color: NAVY, align: 'right', fontFace: FONT, valign: 'middle' });
                if (y1Saving > 0) {
                  p.addText(`Save ${money(y1Saving)} in year one · rate locked for 24 months`, { x: x2 + 0.3, y: fy + 0.92, w: cardW - 0.6, h: 0.3, fontSize: 9.5, bold: true, color: GREEN, fontFace: FONT, valign: 'middle' });
                }
              },
            });

            const caption = y1Saving > 0
              ? `Commit to the 2-year contract to save ${money(y1Saving)} in year one and lock your rate against annual uplifts.`
              : 'The 2-year contract locks your rate for 24 months, protecting against annual uplifts.';
            p.addText(caption, { x: 0.69, y: cardY + cardH + 0.14, w: cardW * 2 + gap, h: 0.4, fontSize: 10.5, italic: true, color: MUTED, align: 'center', fontFace: FONT });
            return;
          }

          // ── Single-term table (1y or 2y), grouped by guide, vertically balanced
          const th = (t: string, align: any = 'left') => ({
            text: t, options: { bold: true, color: 'FFFFFF', fill: { color: NAVY }, align, fontFace: FONT, valign: 'middle' },
          });
          const td = (t: string, align: any = 'left', bold = false) => ({
            text: t, options: { color: NAVY, align, bold, fontFace: FONT, valign: 'middle' },
          });
          const ncols = 3;
          const guideRow = (g: string) => [{
            text: g.toUpperCase(),
            options: {
              colspan: ncols, color: BRONZE, bold: true, fontSize: 9.5, charSpacing: 2,
              align: 'left', valign: 'middle', fontFace: FONT, fill: { color: GHEAD },
              border: [{ type: 'none' }, { type: 'none' }, { type: 'solid', color: BRONZE, pt: 0.5 }, { type: 'none' }],
            },
          }];

          let head: any[]; const body: any[][] = []; let colW: number[];
          if (term === '1y') {
            head = [th('Product'), th('Qty', 'center'), th('Price', 'right')];
            for (const g of groups) {
              if (g.guide) body.push(guideRow(g.guide));
              for (const r of g.rows) body.push([td(cleanName(r)), td(r.flat ? '—' : String(r.qty), 'center'), td(money(rowOneNet(r)), 'right')]);
            }
            body.push([td('Total', 'left', true), td('', 'center'), td(money(result.total), 'right', true)]);
            colW = [8.7, 1.3, 2.2];
          } else {
            head = [th('Product'), th(String(y1), 'right'), th(String(y2), 'right')];
            for (const g of groups) {
              if (g.guide) body.push(guideRow(g.guide));
              for (const r of g.rows) body.push([td(cleanName(r)), td(money(rowY1in2Net(r)), 'right'), td(money(rowY2Net(r)), 'right')]);
            }
            body.push([td('Total', 'left', true), td(money(gdVat(sumRows(rowY1in2Net))), 'right', true), td(money(result.total2), 'right', true)]);
            colW = [7.2, 2.5, 2.5];
          }

          const rowH = 0.44;
          const tableH = (body.length + 1) * rowH;
          const startY = Math.max(1.55, 1.6 + (4.85 - tableH) / 2);
          p.addTable([head, ...body], {
            x: 0.55, y: startY, w: 12.2, colW, fontSize: 12.5, valign: 'middle',
            border: { type: 'solid', color: BORDER, pt: 0.75 }, rowH, autoPage: false,
          });

          if (quote.note.trim()) {
            p.addText(quote.note, {
              x: 0.55, y: Math.min(6.55, startY + tableH + 0.2), w: 12.2, h: 0.35, fontSize: 10, italic: true, color: GRAY, fontFace: FONT,
            });
          }
        }, 'quoteCards');
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
