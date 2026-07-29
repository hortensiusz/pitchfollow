// Server-side PPTX generator that builds decks FROM the real Chambers template
// (chambers-template-2026.pptx) using pptx-automizer. Runs only in the Node.js
// runtime (Vercel serverless / next dev). Do NOT import from client components.
import path from 'path';
import os from 'os';
import { Automizer, ModifyTextHelper, modify } from 'pptx-automizer';
import type { AppState, PriceItem } from './types';
import { SECTION_DEFS, QUOTE_TITLES, sectionLabel, pptLabel, type PptKey } from './i18n';
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

const CJK_RE = /[㐀-鿿぀-ヿ＀-￯]/;

/** Rough rendered height (inches) of a bulleted list at a given size, so we can
 *  shrink/split before text overflows the slide. CJK glyphs counted as wider. */
function estBulletHeight(items: string[], w: number, fontSize: number, marginPt: number): number {
  const lineH = (fontSize * 1.32) / 72;
  const gap = marginPt / 72;
  let h = 0;
  for (const t of items) {
    const glyphW = ((CJK_RE.test(t) ? 1.0 : 0.52) * fontSize) / 72;
    const cpl = Math.max(6, Math.floor((w - 0.3) / glyphW)); // -0.3 for bullet indent
    const lines = Math.max(1, Math.ceil((t.length || 1) / cpl));
    h += lines * lineH + gap;
  }
  return h;
}

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
  const L = (k: PptKey) => pptLabel(k, lang);
  const client = app.client || 'Client';
  const contacts = app.contacts.filter(Boolean);
  const cur = app.currency;
  const quote = app.quote;

  const setTitle = (slide: any, text: string) =>
    slide.modifyElement('Text Placeholder 4', [ModifyTextHelper.setText(text)]);

  // ── Cover ────────────────────────────────────────────────────────────────
  pres.addSlide('tpl', SLIDE.cover, (slide: any) => {
    slide.modifyElement('Text Placeholder 2', [ModifyTextHelper.setText(client)]);
    slide.modifyElement('Text Placeholder 3', [ModifyTextHelper.setText(L('coverSubtitle'))]);
    // Replace the template's details placeholder (label / value pairs)
    const pairs: Array<[string, string]> = [];
    if (contacts.length) pairs.push([L('presentationTo'), contacts.join(', ')]);
    if (app.owner) pairs.push([L('preparedBy'), app.owner]);
    if (app.mdate) pairs.push([L('dateLabel'), ukDate(app.mdate)]);
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
  // measure with generous leading. Font shrinks (and lists split across
  // slides) so text always stays inside AREA, never over the heading/footer.
  const addBodySlide = (title: string, items: string[], baseFont = 17, baseMargin = 20) => {
    let fontSize = baseFont;
    let marginPt = baseMargin;
    while (fontSize > 11 && estBulletHeight(items, AREA.w, fontSize, marginPt) > AREA.h) {
      fontSize -= 1;
      marginPt = Math.max(8, Math.round(marginPt * 0.88));
    }
    const lineSpacing = fontSize >= 14 ? 1.3 : 1.2;
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
            paraSpaceAfter: marginPt, lineSpacingMultiple: lineSpacing,
            fit: 'shrink', // backstop: PowerPoint shrinks if the estimate is off
          },
        );
      }, 'bullets');
    });
  };

  const addSection = (title: string, items: string[]) => {
    if (!items.length) return;
    // Pack bullets onto slides so each fits at the 12pt floor; split if longer.
    const chunks: string[][] = [];
    let cur: string[] = [];
    for (const it of items) {
      if (cur.length && (cur.length >= 7 || estBulletHeight([...cur, it], AREA.w, 12, 10) > AREA.h)) {
        chunks.push(cur);
        cur = [it];
      } else {
        cur.push(it);
      }
    }
    if (cur.length) chunks.push(cur);
    chunks.forEach((chunk, i) => {
      const suffix = chunks.length > 1 ? ` (${i + 1})` : '';
      addBodySlide(title + suffix, chunk);
    });
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
            const y1Saving = Math.max(0, y1Total - two1);

            const cardW = 5.75, gap = 0.5, cardY = 1.62, cardH = 4.78;
            const x1 = 0.69, x2 = x1 + cardW + gap;

            // Size rows AND choose the footer style so items never overlap the
            // footer. rowHAt() includes cell padding so the estimate matches
            // what PowerPoint/LibreOffice actually render.
            const itemsTop = cardY + 0.9;
            const guideCount = groups.filter((g) => g.guide).length;
            const rowCount = 1 + guideCount + rows.length; // year-header + guides + products
            const rowHAt = (f: number) => (f * 1.32) / 72 + 0.09;
            const fitsFont = (f: number, footerH: number) => rowHAt(f) * rowCount <= cardH - 0.9 - footerH - 0.08;
            // Prefer the rich footer (per-year totals + note); if there are too
            // many rows, drop to a compact footer to free vertical space.
            let richFooter = true;
            let itemFont = 10;
            while (itemFont > 8 && !fitsFont(itemFont, 1.5)) itemFont--;
            if (!fitsFont(itemFont, 1.5)) {
              richFooter = false;
              itemFont = 10;
              while (itemFont > 7 && !fitsFont(itemFont, 0.85)) itemFont--;
            }
            const labelFont = Math.max(7, itemFont - 1.5);
            const rowH = rowHAt(itemFont);
            const c1FooterH = richFooter ? 1.02 : 0.62;
            const c2FooterH = richFooter ? 1.5 : 0.9;

            // Grouped line-item rows for a card. `cols` = one entry per price
            // column (a year label + its price accessor). A year-header row is
            // emitted on top so each column's year is clear.
            const buildRows = (cols: Array<{ label: string; price: (r: QuoteRow) => number }>) => {
              const nCol = cols.length + 1;
              const out: any[][] = [];
              out.push([
                { text: '', options: { fontFace: FONT, fontSize: labelFont } },
                ...cols.map((c) => ({ text: c.label, options: { color: MUTED, bold: true, align: 'right', fontSize: labelFont, charSpacing: 1, fontFace: FONT, valign: 'bottom' } })),
              ]);
              for (const g of groups) {
                if (g.guide) {
                  out.push([{
                    text: g.guide.toUpperCase(),
                    options: {
                      colspan: nCol, color: BRONZE, bold: true, fontSize: labelFont, charSpacing: 2,
                      align: 'left', valign: 'middle', fontFace: FONT, fill: { color: CARD_BG },
                      border: [{ type: 'none' }, { type: 'none' }, { type: 'solid', color: BRONZE, pt: 0.5 }, { type: 'none' }],
                    },
                  }]);
                }
                for (const r of g.rows) {
                  out.push([
                    { text: cleanName(r), options: { color: NAVY, fontFace: FONT, align: 'left', fontSize: itemFont, valign: 'middle' } },
                    ...cols.map((c) => ({ text: money(c.price(r)), options: { color: NAVY, fontFace: FONT, align: 'right', fontSize: itemFont, bold: true, valign: 'middle' } })),
                  ]);
                }
              }
              return out;
            };

            const drawCard = (x: number, o: {
              optLabel: string; termLabel: string; headFill: string; border: string; borderW: number;
              recommended?: boolean; itemRows: any[][]; colW: number[]; footer: () => void;
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
                p.addText(L('recommended'), { x: x + cardW - 2.0, y: cardY + 0.19, w: 1.72, h: 0.3, fontSize: 8, bold: true, color: NAVY, fill: { color: GOLD }, align: 'center', valign: 'middle', fontFace: FONT });
              }
              p.addTable(o.itemRows, {
                x: x + 0.3, y: itemsTop, w: cardW - 0.6, colW: o.colW,
                rowH, valign: 'middle', border: { type: 'solid', color: 'EEEBE3', pt: 0.5 }, autoPage: false,
              });
              o.footer();
            };

            // Card 1 — 1-Year (restrained, secondary)
            drawCard(x1, {
              optLabel: `${L('optionWord')} 1`, termLabel: L('oneYearContract'), headFill: '7A8794', border: BORDER, borderW: 1,
              itemRows: buildRows([{ label: String(y1), price: rowOneNet }]),
              colW: [cardW - 0.6 - 1.6, 1.6],
              footer: () => {
                const fy = cardY + cardH - c1FooterH;
                p.addShape('rect', { x: x1 + 0.3, y: fy, w: cardW - 0.6, h: 0.012, fill: { color: BORDER }, line: { width: 0 } });
                p.addText(`${y1} ${L('totalWord')}`, { x: x1 + 0.3, y: fy + 0.12, w: 2.8, h: 0.4, fontSize: 11, color: MUTED, fontFace: FONT, valign: 'middle' });
                p.addText(money(y1Total), { x: x1 + cardW - 3.0, y: fy + 0.12, w: 2.7, h: 0.4, fontSize: 17, bold: true, color: NAVY, align: 'right', fontFace: FONT, valign: 'middle' });
                if (richFooter) {
                  p.addText(L('renewsNote'), { x: x1 + 0.3, y: fy + 0.58, w: cardW - 0.6, h: 0.28, fontSize: 9, italic: true, color: GRAY, fontFace: FONT });
                }
              },
            });

            // Card 2 — 2-Year (recommended, emphasised). Per-product Year 1 / Year 2
            // pricing is shown in the two columns; footer carries the totals.
            drawCard(x2, {
              optLabel: `${L('optionWord')} 2`, termLabel: L('twoYearContract'), headFill: NAVY, border: BRONZE, borderW: 2.25, recommended: true,
              itemRows: buildRows([{ label: String(y1), price: rowY1in2Net }, { label: String(y2), price: rowY2Net }]),
              colW: [cardW - 0.6 - 2.7, 1.35, 1.35],
              footer: () => {
                const fy = cardY + cardH - c2FooterH;
                p.addShape('rect', { x: x2 + 0.3, y: fy, w: cardW - 0.6, h: 0.012, fill: { color: BRONZE }, line: { width: 0 } });
                // Per-year totals shown separately — no combined 2-year sum.
                const totLbl = (yr: number) => `${yr} ${L('totalWord')}`;
                let yy = fy + 0.12;
                if (richFooter) {
                  // Two stacked, emphasised year totals
                  p.addText(totLbl(y1), { x: x2 + 0.3, y: yy, w: 2.6, h: 0.34, fontSize: 11, color: MUTED, fontFace: FONT, valign: 'middle' });
                  p.addText(money(two1), { x: x2 + cardW - 3.0, y: yy, w: 2.7, h: 0.34, fontSize: 15, bold: true, color: NAVY, align: 'right', fontFace: FONT, valign: 'middle' });
                  yy += 0.36;
                  p.addText(totLbl(y2), { x: x2 + 0.3, y: yy, w: 2.6, h: 0.34, fontSize: 11, color: MUTED, fontFace: FONT, valign: 'middle' });
                  p.addText(money(two2), { x: x2 + cardW - 3.0, y: yy, w: 2.7, h: 0.34, fontSize: 15, bold: true, color: NAVY, align: 'right', fontFace: FONT, valign: 'middle' });
                  yy += 0.42;
                } else {
                  // Compact: both year totals on one line
                  p.addText(
                    [
                      { text: `${totLbl(y1)}  `, options: { fontSize: 10, color: MUTED } },
                      { text: `${money(two1)}`, options: { fontSize: 12, bold: true, color: NAVY } },
                      { text: `      ${totLbl(y2)}  `, options: { fontSize: 10, color: MUTED } },
                      { text: `${money(two2)}`, options: { fontSize: 12, bold: true, color: NAVY } },
                    ],
                    { x: x2 + 0.3, y: yy, w: cardW - 0.6, h: 0.34, fontFace: FONT, valign: 'middle' },
                  );
                  yy += 0.38;
                }
                if (y1Saving > 0) {
                  p.addText(L('savingNote').replace('{amt}', money(y1Saving)), { x: x2 + 0.3, y: yy, w: cardW - 0.6, h: 0.3, fontSize: 9.5, bold: true, color: GREEN, fontFace: FONT, valign: 'middle' });
                }
              },
            });

            const caption = y1Saving > 0
              ? L('caption').replace('{amt}', money(y1Saving))
              : L('captionNoSave');
            p.addText(caption, { x: 0.69, y: cardY + cardH + 0.14, w: cardW * 2 + gap, h: 0.4, fontSize: 10.5, italic: true, color: MUTED, align: 'center', fontFace: FONT });
            return;
          }

          // ── Single-term table (1y or 2y), grouped by guide. Row height and
          // font shrink so header + rows + total always fit above the footer.
          const guideCount = groups.filter((g) => g.guide).length;
          const rowsTotal = 1 + guideCount + rows.length + 1; // head + guides + products + total
          const topLimit = 1.6;
          const bottomLimit = 6.75 - (quote.note.trim() ? 0.45 : 0.1);
          const availH = bottomLimit - topLimit;
          const rowH = Math.max(0.2, Math.min(0.44, availH / rowsTotal));
          const cellFont = rowH >= 0.4 ? 12.5 : rowH >= 0.34 ? 11.5 : rowH >= 0.28 ? 10.5 : rowH >= 0.23 ? 9.5 : 8.5;
          const guideFont = Math.max(8, cellFont - 2);

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
              colspan: ncols, color: BRONZE, bold: true, fontSize: guideFont, charSpacing: 2,
              align: 'left', valign: 'middle', fontFace: FONT, fill: { color: GHEAD },
              border: [{ type: 'none' }, { type: 'none' }, { type: 'solid', color: BRONZE, pt: 0.5 }, { type: 'none' }],
            },
          }];

          let head: any[]; const body: any[][] = []; let colW: number[];
          if (term === '1y') {
            head = [th(L('thProduct')), th(L('thQty'), 'center'), th(L('thPrice'), 'right')];
            for (const g of groups) {
              if (g.guide) body.push(guideRow(g.guide));
              for (const r of g.rows) body.push([td(cleanName(r)), td(r.flat ? '—' : String(r.qty), 'center'), td(money(rowOneNet(r)), 'right')]);
            }
            body.push([td(L('thTotal'), 'left', true), td('', 'center'), td(money(result.total), 'right', true)]);
            colW = [8.7, 1.3, 2.2];
          } else {
            head = [th(L('thProduct')), th(String(y1), 'right'), th(String(y2), 'right')];
            for (const g of groups) {
              if (g.guide) body.push(guideRow(g.guide));
              for (const r of g.rows) body.push([td(cleanName(r)), td(money(rowY1in2Net(r)), 'right'), td(money(rowY2Net(r)), 'right')]);
            }
            body.push([td(L('thTotal'), 'left', true), td(money(gdVat(sumRows(rowY1in2Net))), 'right', true), td(money(result.total2), 'right', true)]);
            colW = [7.2, 2.5, 2.5];
          }

          const tableH = (body.length + 1) * rowH;
          const startY = topLimit + Math.max(0, (availH - tableH) / 2);
          p.addTable([head, ...body], {
            x: 0.55, y: startY, w: 12.2, colW, fontSize: cellFont, valign: 'middle',
            border: { type: 'solid', color: BORDER, pt: 0.75 }, rowH, autoPage: false,
          });

          if (quote.note.trim()) {
            p.addText(quote.note, {
              x: 0.55, y: Math.min(6.7, startY + tableH + 0.15), w: 12.2, h: 0.32, fontSize: 9.5, italic: true, color: GRAY, fontFace: FONT,
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
      L('backTitle'),
      L('backVisit'),
      app.owner ? `${L('contactWord')} ${app.owner}` : `${L('contactWord')} enquiries@chambers.com`,
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
