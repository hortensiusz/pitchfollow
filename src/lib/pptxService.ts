import type { AppState, PriceItem, LangCode } from './types';
import { SECTION_DEFS, QUOTE_TITLES, sectionLabel } from './i18n';
import { calcQuote, formatMoney, rowOneNet, calcP1Default, calcP2Default } from './quoteCalc';

const NAVY = '1E3A5F';
const WHITE = 'FFFFFF';
const GRAY = '9FB0C4';
const TEXT = '22303F';
const FONT = 'Calibri';

function addTitleShape(slide: any, text: string) {
  slide.addShape('rect', { x: 0, y: 0, w: 13.33, h: 1.2, fill: { color: NAVY } });
  slide.addText(text, {
    x: 0.5, y: 0, w: 12.33, h: 1.2,
    fontSize: 28, bold: true, color: WHITE, fontFace: FONT, valign: 'middle',
  });
}

export async function exportPPTX(app: AppState, priceList: PriceItem[]) {
  // PptxGenJS is a CommonJS module; import dynamically on the client
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.defineLayout({ name: 'WIDE', width: 13.33, height: 7.5 });
  pptx.layout = 'WIDE';

  const lang = app.lang;
  const client = app.client || 'Client';
  const contacts = app.contacts.filter(Boolean).join(', ');
  const date = app.mdate || '';
  const owner = app.owner || '';
  const cur = app.currency;
  const quote = app.quote;

  // ── Cover slide ──────────────────────────────────────────────
  const cover = pptx.addSlide();
  cover.background = { color: NAVY };
  cover.addText('Chambers & Partners', {
    x: 0.8, y: 0.9, w: 11.7, h: 0.5,
    fontSize: 14, color: GRAY, fontFace: FONT, align: 'center', charSpacing: 2,
  });
  cover.addText(client, {
    x: 0.8, y: 1.7, w: 11.7, h: 1.2,
    fontSize: 38, bold: true, color: WHITE, fontFace: FONT, align: 'center',
  });
  cover.addText('Follow-Up Meeting', {
    x: 0.8, y: 3.0, w: 11.7, h: 0.7,
    fontSize: 24, color: '#C9A227', fontFace: FONT, align: 'center',
  });
  const meta: string[] = [];
  if (contacts) meta.push(contacts);
  if (date) meta.push(date);
  if (owner) meta.push(owner);
  if (meta.length) {
    cover.addText(meta.join('  ·  '), {
      x: 0.8, y: 3.9, w: 11.7, h: 0.5,
      fontSize: 14, color: GRAY, fontFace: FONT, align: 'center',
    });
  }
  cover.addText('STRICTLY CONFIDENTIAL', {
    x: 0.8, y: 6.95, w: 11.7, h: 0.3,
    fontSize: 9, color: GRAY, fontFace: FONT, align: 'center', charSpacing: 2,
  });

  // ── Content sections ─────────────────────────────────────────
  const bulletOpts = {
    x: 0.9, y: 1.7, w: 11.5, h: 4.9,
    fontSize: 18, color: TEXT, fontFace: FONT, valign: 'middle' as const,
    lineSpacingMultiple: 1.2,
  };
  const mkBullets = (arr: string[]) => arr.map(text => ({
    text,
    options: { bullet: { code: '2022', indent: 18 }, breakLine: true, paraSpaceAfter: 14 },
  }));

  const addSectionSlide = (defId: string, title: string, items: string[]) => {
    if (!items.length) return;
    const slide = pptx.addSlide();
    slide.background = { color: WHITE };
    addTitleShape(slide, title);
    slide.addText(mkBullets(items), bulletOpts);
  };

  // recap, needs, solution (before quote)
  SECTION_DEFS.filter(d => d.id !== 'next').forEach(def => {
    const sec = app.secs[def.id];
    if (!sec?.inc) return;
    const items = sec.items.filter(it => it.c && it.t.trim()).map(it => it.t.trim());
    addSectionSlide(def.id, sec.title || sectionLabel(def, lang), items);
  });

  // ── Product intro slides ──────────────────────────────────────
  if (quote.prodIntro && quote.inc) {
    const nameSet = new Set<string>();
    quote.rows.forEach(r => {
      if (r.name) nameSet.add(r.name);
      (r.parts || []).forEach(x => nameSet.add(x));
    });
    nameSet.forEach(nm => {
      const p = priceList.find(x => x.name === nm);
      if (!p?.desc?.trim()) return;
      const slide = pptx.addSlide();
      slide.background = { color: WHITE };
      addTitleShape(slide, nm);
      const pts = p.desc.split(/\n+/).map(s => s.trim()).filter(Boolean);
      slide.addText(mkBullets(pts), bulletOpts);
    });
  }

  // ── Quote slide ───────────────────────────────────────────────
  if (quote.inc) {
    const rows = quote.rows.filter(r => r.name);
    if (rows.length) {
      const result = calcQuote(quote);
      const money = (n: number) => formatMoney(n, cur);
      const baseYear = app.mdate ? new Date(app.mdate + 'T00:00:00').getFullYear() : new Date().getFullYear();
      const y1y = baseYear, y2y = baseYear + 1;

      const slide = pptx.addSlide();
      slide.background = { color: WHITE };
      addTitleShape(slide, quote.title || QUOTE_TITLES[lang] || 'Commercial Proposal');

      const term = quote.term;
      const cards: string[] = [];
      if (term === '1y' || term === 'both') cards.push('1');
      if (term === '2y' || term === 'both') cards.push('2');

      const cardY = 1.55, cardH = 5.15, gap = 0.5, mX = 0.9;
      const totalW = 13.33 - 2 * mX;
      const cardW = cards.length === 1 ? Math.min(8.6, totalW) : (totalW - gap) / 2;
      const startX = cards.length === 1 ? (13.33 - cardW) / 2 : mX;

      // Helper: compute per-row Y2 net — mirrors QuoteSection / calcQuote logic
      const rowY2Net = (r: typeof rows[0]): number => {
        if (r.y2manual && typeof r.p2 === 'number') {
          return (r.flat ? r.p2 : r.qty * r.p2) * (1 - r.disc / 100);
        }
        const p1u = calcP1Default(r, quote.twoYrDisc);
        if (typeof p1u !== 'number') return 0;
        const eff = typeof r.up === 'number' ? r.up : quote.y2Uplift;
        const p2u = calcP2Default(p1u, eff);
        return typeof p2u === 'number' ? (r.flat ? p2u : r.qty * p2u) : 0;
      };

      // Helper: compute per-row Y1-in-2yr net
      const rowY1in2Net = (r: typeof rows[0]): number => {
        if (r.p2y1manual && typeof r.p2y1 === 'number') {
          return (r.flat ? r.p2y1 : r.qty * r.p2y1) * (1 - r.disc / 100);
        }
        const p1u = calcP1Default(r, quote.twoYrDisc);
        return typeof p1u === 'number' ? (r.flat ? p1u : r.qty * p1u) : rowOneNet(r);
      };

      cards.forEach((tm, ti) => {
        const cx = startX + ti * (cardW + gap);

        // Totals footer height: 1-yr = 1 line, 2-yr = 3 lines
        const footH = tm === '1' ? 0.55 : 1.0;
        const contentH = cardH - 0.72 - 0.25 - footH - 0.2; // header + top-pad + footer + bottom-pad

        slide.addShape('roundRect', { x: cx, y: cardY, w: cardW, h: cardH, rectRadius: 0.08, fill: { color: 'F7F9FC' }, line: { color: 'DFE4EA', width: 1 } });
        slide.addShape('rect', { x: cx, y: cardY, w: cardW, h: 0.72, fill: { color: NAVY } });
        const optLabel = `Option ${ti + 1}: ${tm === '1' ? '1-year' : '2-year contract'}`;
        slide.addText(optLabel, { x: cx + 0.3, y: cardY, w: cardW - 0.6, h: 0.72, fontSize: 16, bold: true, color: WHITE, fontFace: FONT, valign: 'middle' });

        // Line items
        const runs: any[] = [];
        rows.forEach((r, ri) => {
          const displayName = r.name.replace(/\s*[\(（][^)）]*[\)）]/g, '').trim() + (r.flat ? ` — ${r.qty} depts` : '');
          runs.push({ text: displayName, options: { bold: true, fontSize: 13, color: NAVY, breakLine: true, paraSpaceBefore: ri ? 10 : 0, paraSpaceAfter: 2, fontFace: FONT } });
          if (tm === '1') {
            runs.push({ text: `   ${money(rowOneNet(r))}`, options: { fontSize: 12.5, color: TEXT, breakLine: true, fontFace: FONT } });
          } else {
            runs.push({ text: `   ${y1y}: ${money(rowY1in2Net(r))}`, options: { fontSize: 12.5, color: TEXT, breakLine: true, fontFace: FONT } });
            runs.push({ text: `   ${y2y}: ${money(rowY2Net(r))}`, options: { fontSize: 12.5, color: TEXT, breakLine: true, fontFace: FONT } });
          }
        });
        slide.addText(runs, { x: cx + 0.35, y: cardY + 0.85, w: cardW - 0.7, h: contentH, fontSize: 13, fontFace: FONT, valign: 'top' });

        // Totals footer
        const footY = cardY + cardH - footH - 0.1;
        slide.addShape('line', { x: cx + 0.2, y: footY, w: cardW - 0.4, h: 0, line: { color: 'DFE4EA', width: 0.75 } });

        if (tm === '1') {
          const totalLabel = `Total: ${money(result.total)}`;
          slide.addText(totalLabel, { x: cx + 0.3, y: footY + 0.07, w: cardW - 0.6, h: 0.42, fontSize: 14, bold: true, color: NAVY, fontFace: FONT, align: 'right', valign: 'middle' });
        } else {
          const footRuns = [
            { text: `${y1y} total: ${money(result.total)}`, options: { fontSize: 12, color: TEXT, breakLine: true, fontFace: FONT } },
            { text: `${y2y} total: ${money(result.total2)}`, options: { fontSize: 12, color: TEXT, breakLine: true, fontFace: FONT } },
            { text: `2-year total: ${money(result.grand2y)}`, options: { fontSize: 14, bold: true, color: NAVY, breakLine: false, fontFace: FONT } },
          ];
          slide.addText(footRuns, { x: cx + 0.3, y: footY + 0.07, w: cardW - 0.6, h: footH - 0.1, fontSize: 12, fontFace: FONT, align: 'right', valign: 'top' });
        }
      });

      if (quote.note.trim()) {
        slide.addText(quote.note, { x: 0.9, y: 6.9, w: 11.5, h: 0.5, fontSize: 11, italic: true, color: GRAY, fontFace: FONT, valign: 'top' });
      }
    }
  }

  // ── Next steps ────────────────────────────────────────────────
  const nextDef = SECTION_DEFS.find(d => d.id === 'next')!;
  const nextSec = app.secs['next'];
  if (nextSec?.inc) {
    const items = nextSec.items.filter(it => it.c && it.t.trim()).map(it => it.t.trim());
    if (items.length) addSectionSlide('next', nextSec.title || sectionLabel(nextDef, lang), items);
  }

  // ── Closing slide ─────────────────────────────────────────────
  const end = pptx.addSlide();
  end.background = { color: NAVY };
  end.addText('Thank you', {
    x: 0.8, y: 3.0, w: 11.7, h: 1,
    fontSize: 36, bold: true, color: WHITE, fontFace: FONT, align: 'center',
  });
  if (owner) {
    end.addText(owner, { x: 0.8, y: 4.2, w: 11.7, h: 0.5, fontSize: 15, color: GRAY, fontFace: FONT, align: 'center' });
  }
  end.addText('STRICTLY CONFIDENTIAL', {
    x: 0.8, y: 6.95, w: 11.7, h: 0.3,
    fontSize: 9, color: GRAY, fontFace: FONT, align: 'center', charSpacing: 2,
  });

  const safe = (s: string) => s.replace(/[\\/:*?"<>|]/g, '');
  const fname = (client !== 'Client' ? safe(client) + '-' : '') +
    'Follow-up-' + (app.mdate || new Date().toISOString().slice(0, 10)) + '.pptx';
  await pptx.writeFile({ fileName: fname });
}
