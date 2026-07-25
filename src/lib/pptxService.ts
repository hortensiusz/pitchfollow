import type { AppState, PriceItem, LangCode } from './types';
import { SECTION_DEFS, QUOTE_TITLES, sectionLabel } from './i18n';
import { calcQuote, formatMoney, rowOneNet, calcP1Default, calcP2Default } from './quoteCalc';

// ─── Chambers brand palette ───────────────────────────────────────────────────
const C = {
  navy:    '002B49',
  blue:    '006CE0',
  beige:   'EDEBE6',
  bronze:  'B68A52',
  gray:    '8E8E89',
  white:   'FFFFFF',
  green:   '4A9462',
  gold:    'CFC570',
  text:    '002B49',   // all body text = dark navy
};

const FONT = 'Avenir Next LT Pro';
const FONT_MED = 'Avenir Next LT Pro Medium';

// ─── Brand assets (served from /public/data/brand/) ──────────────────────────
// Resolved at call-time so the base URL is available in the browser
function brandUrl(file: string) {
  return `/data/brand/${file}`;
}

// ─── Template-accurate dimensions (from chambers-template-2026.pptx layout 7) ─
// All in inches; slide is 13.33 × 7.5"
const DIM = {
  // Top ribbon bar
  ribbonX:  0.37,
  ribbonY:  0.00,
  ribbonW:  12.60,
  ribbonH:  0.13,
  // Heading line
  headX:    0.37,
  headY:    0.22,
  headW:    11.81,
  headH:    0.50,
  // Heading underline
  ruleX:    0.37,
  ruleY:    0.73,
  ruleW:    12.60,
  ruleH:    0.02,
  // Roundel (top-right)
  roundelX: 12.38,
  roundelY: 0.22,
  roundelW: 0.60,
  roundelH: 0.48,
  // Content area
  contentX:  0.55,
  contentY:  0.82,
  contentW:  12.23,
  contentH:  5.95,
  // Footer baseline
  footerY:   7.00,
  slideW:   13.33,
  slideH:    7.50,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Attach the standard body-slide chrome (ribbon, heading, underline, roundel, footer). */
function addBodyChrome(slide: any, heading: string, pageNum: number) {
  // Top blue ribbon bar
  slide.addShape('rect', {
    x: DIM.ribbonX, y: DIM.ribbonY, w: DIM.ribbonW, h: DIM.ribbonH,
    fill: { color: C.navy }, line: { color: C.navy, width: 0 },
  });

  // Heading text
  slide.addText(heading.toUpperCase(), {
    x: DIM.headX, y: DIM.headY, w: DIM.headW, h: DIM.headH,
    fontSize: 18, bold: true, color: C.navy, fontFace: FONT,
    valign: 'middle',
  });

  // Heading underline rule (bronze)
  slide.addShape('rect', {
    x: DIM.ruleX, y: DIM.ruleY, w: DIM.ruleW, h: DIM.ruleH,
    fill: { color: C.bronze }, line: { color: C.bronze, width: 0 },
  });

  // Chambers roundel (top-right)
  slide.addImage({
    path: brandUrl('roundel.png'),
    x: DIM.roundelX, y: DIM.roundelY, w: DIM.roundelW, h: DIM.roundelH,
  });

  // Footer
  slide.addText('CHAMBERS.COM', {
    x: 0.37, y: DIM.footerY, w: 2.20, h: 0.18,
    fontSize: 7.5, color: C.gray, fontFace: FONT, valign: 'middle',
  });
  slide.addText('© CHAMBERS AND PARTNERS 2026', {
    x: 4.50, y: DIM.footerY, w: 4.33, h: 0.18,
    fontSize: 7.5, color: C.gray, fontFace: FONT, align: 'center', valign: 'middle',
  });
  slide.addText('STRICTLY CONFIDENTIAL', {
    x: 9.90, y: DIM.footerY, w: 2.80, h: 0.18,
    fontSize: 7.5, color: C.gray, fontFace: FONT, align: 'right', valign: 'middle',
  });
  slide.addText(String(pageNum), {
    x: 12.90, y: DIM.footerY, w: 0.43, h: 0.18,
    fontSize: 7.5, color: C.gray, fontFace: FONT, align: 'right', valign: 'middle',
  });
}

/** Render bullet-point content as horizontal bands on a body slide. */
function addBulletBands(slide: any, items: string[]) {
  const bandH = Math.min(0.72, (DIM.contentH) / Math.max(items.length, 1));
  const ruleH = 0.018;
  let y = DIM.contentY;

  items.forEach((text, i) => {
    // Bronze rule between items (not before first)
    if (i > 0) {
      slide.addShape('rect', {
        x: DIM.contentX, y: y, w: DIM.contentW, h: ruleH,
        fill: { color: C.bronze }, line: { color: C.bronze, width: 0 },
      });
      y += ruleH + 0.06;
    }

    slide.addText(text, {
      x: DIM.contentX, y, w: DIM.contentW, h: bandH - ruleH - 0.06,
      fontSize: 15, color: C.navy, fontFace: FONT,
      valign: 'middle', wrap: true,
    });
    y += bandH;
  });
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function exportPPTX(app: AppState, priceList: PriceItem[]) {
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'WIDE', width: DIM.slideW, height: DIM.slideH });
  pptx.layout = 'WIDE';

  const lang = app.lang;
  const client = app.client || 'Client';
  const contacts = app.contacts.filter(Boolean).join(', ');
  const date = app.mdate || '';
  const owner = app.owner || '';
  const cur = app.currency;
  const quote = app.quote;

  let page = 1;

  // ── Cover slide (dark navy, template slide 7 style) ────────────────────────
  {
    const slide = pptx.addSlide();
    slide.background = { color: C.navy };

    // Left edge vertical bronze accent bar
    slide.addShape('rect', {
      x: 0, y: 0, w: 0.20, h: DIM.slideH,
      fill: { color: C.bronze }, line: { color: C.bronze, width: 0 },
    });

    // Chambers logo (white version) top-left
    slide.addImage({
      path: brandUrl('logo-white.png'),
      x: 0.55, y: 0.40, w: 2.40, h: 0.60,
    });

    // Top ribbon line (bright blue)
    slide.addShape('rect', {
      x: 0.20, y: 0.00, w: DIM.slideW - 0.20, h: 0.10,
      fill: { color: C.blue }, line: { color: C.blue, width: 0 },
    });

    // Divider line
    slide.addShape('rect', {
      x: 0.55, y: 1.30, w: 12.40, h: 0.025,
      fill: { color: C.bronze }, line: { color: C.bronze, width: 0 },
    });

    // Client name
    slide.addText(client, {
      x: 0.55, y: 1.50, w: 12.20, h: 1.60,
      fontSize: 42, bold: true, color: C.white, fontFace: FONT,
      valign: 'middle', wrap: true,
    });

    // Presentation subtitle
    slide.addText('Follow-Up Meeting', {
      x: 0.55, y: 3.20, w: 12.20, h: 0.65,
      fontSize: 24, color: C.gold, fontFace: FONT,
    });

    // Details block (contacts / date / owner)
    const details: string[] = [];
    if (contacts) details.push(contacts);
    if (date) details.push(date);
    if (owner) details.push(owner);

    if (details.length) {
      slide.addText(details.join('   ·   '), {
        x: 0.55, y: 4.00, w: 12.20, h: 0.50,
        fontSize: 14, color: C.beige, fontFace: FONT,
      });
    }

    // Bottom footer
    slide.addShape('rect', {
      x: 0.20, y: DIM.slideH - 0.25, w: DIM.slideW - 0.20, h: 0.25,
      fill: { color: '001E33' }, line: { color: '001E33', width: 0 },
    });
    slide.addText('STRICTLY CONFIDENTIAL', {
      x: 0.55, y: DIM.slideH - 0.23, w: 12.20, h: 0.20,
      fontSize: 8, color: C.gray, fontFace: FONT, align: 'center',
    });
  }

  // ── Content sections ───────────────────────────────────────────────────────
  const addSection = (defId: string, title: string, items: string[]) => {
    if (!items.length) return;

    // Divider slide (beige, template slide 10 style)
    {
      const div = pptx.addSlide();
      div.background = { color: C.beige };
      div.addShape('rect', {
        x: 0, y: 0, w: DIM.slideW, h: 0.12,
        fill: { color: C.navy }, line: { color: C.navy, width: 0 },
      });
      div.addShape('rect', {
        x: 0, y: 0.12, w: DIM.slideW, h: 0.07,
        fill: { color: C.bronze }, line: { color: C.bronze, width: 0 },
      });
      div.addText(title, {
        x: 0.70, y: 4.20, w: 11.50, h: 2.50,
        fontSize: 40, bold: true, color: C.navy, fontFace: FONT,
        valign: 'bottom',
      });
      div.addImage({
        path: brandUrl('roundel.png'),
        x: 12.38, y: 0.25, w: 0.60, h: 0.48,
      });
      page++;
    }

    // Body slide(s) — split into groups of 5 items if long
    const chunks: string[][] = [];
    for (let i = 0; i < items.length; i += 5) chunks.push(items.slice(i, i + 5));
    chunks.forEach(chunk => {
      const body = pptx.addSlide();
      body.background = { color: C.white };
      addBodyChrome(body, title, page++);
      addBulletBands(body, chunk);
    });
  };

  // recap, needs, solution (before quote)
  SECTION_DEFS.filter(d => d.id !== 'next').forEach(def => {
    const sec = app.secs[def.id];
    if (!sec?.inc) return;
    const items = sec.items.filter(it => it.c && it.t.trim()).map(it => it.t.trim());
    addSection(def.id, sec.title || sectionLabel(def, lang), items);
  });

  // ── Product intro slides ───────────────────────────────────────────────────
  if (quote.prodIntro && quote.inc) {
    const nameSet = new Set<string>();
    quote.rows.forEach(r => {
      if (r.name) nameSet.add(r.name);
      (r.parts || []).forEach(x => nameSet.add(x));
    });
    nameSet.forEach(nm => {
      const p = priceList.find(x => x.name === nm);
      if (!p?.desc?.trim()) return;
      const pts = p.desc.split(/\n+/).map(s => s.trim()).filter(Boolean);
      const slide = pptx.addSlide();
      slide.background = { color: C.white };
      addBodyChrome(slide, nm, page++);
      addBulletBands(slide, pts);
    });
  }

  // ── Quote slide ────────────────────────────────────────────────────────────
  if (quote.inc) {
    const rows = quote.rows.filter(r => r.name);
    if (rows.length) {
      const result = calcQuote(quote);
      const money = (n: number) => formatMoney(n, cur);
      const baseYear = app.mdate
        ? new Date(app.mdate + 'T00:00:00').getFullYear()
        : new Date().getFullYear();
      const y1y = baseYear, y2y = baseYear + 1;
      const term = quote.term;

      const rowY2Net = (r: typeof rows[0]): number => {
        if (r.y2manual && typeof r.p2 === 'number')
          return (r.flat ? r.p2 : r.qty * r.p2) * (1 - r.disc / 100);
        const p1u = calcP1Default(r, quote.twoYrDisc);
        if (typeof p1u !== 'number') return 0;
        const eff = typeof r.up === 'number' ? r.up : quote.y2Uplift;
        const p2u = calcP2Default(p1u, eff);
        return typeof p2u === 'number' ? (r.flat ? p2u : r.qty * p2u) : 0;
      };

      const rowY1in2Net = (r: typeof rows[0]): number => {
        if (r.p2y1manual && typeof r.p2y1 === 'number')
          return (r.flat ? r.p2y1 : r.qty * r.p2y1) * (1 - r.disc / 100);
        const p1u = calcP1Default(r, quote.twoYrDisc);
        return typeof p1u === 'number' ? (r.flat ? p1u : r.qty * p1u) : rowOneNet(r);
      };

      // Determine which cards to show
      const cards: Array<'1y' | '2y'> = [];
      if (term === '1y' || term === 'both') cards.push('1y');
      if (term === '2y' || term === 'both') cards.push('2y');

      const quoteSlide = pptx.addSlide();
      quoteSlide.background = { color: C.white };
      addBodyChrome(quoteSlide, quote.title || QUOTE_TITLES[lang] || 'Commercial Proposal', page++);

      const mX = 0.55;
      const cardGap = 0.35;
      const availW = DIM.slideW - mX * 2;
      const cardW = cards.length === 1 ? Math.min(7.0, availW) : (availW - cardGap) / 2;
      const startX = cards.length === 1 ? (DIM.slideW - cardW) / 2 : mX;
      const cardY = DIM.contentY;
      const cardH = 5.50;

      cards.forEach((tm, ti) => {
        const cx = startX + ti * (cardW + cardGap);
        const headerH = 0.60;
        const footH = tm === '1y' ? 0.55 : 1.05;
        const bodyH = cardH - headerH - footH - 0.15;

        // Card background
        quoteSlide.addShape('roundRect', {
          x: cx, y: cardY, w: cardW, h: cardH,
          rectRadius: 0.06,
          fill: { color: 'F5F7FA' },
          line: { color: 'DDE1E7', width: 1 },
        });

        // Card header (dark navy)
        quoteSlide.addShape('roundRect', {
          x: cx, y: cardY, w: cardW, h: headerH,
          rectRadius: 0.06,
          fill: { color: C.navy },
          line: { color: C.navy, width: 0 },
        });
        // Cover bottom corners of header
        quoteSlide.addShape('rect', {
          x: cx, y: cardY + headerH - 0.10, w: cardW, h: 0.10,
          fill: { color: C.navy }, line: { color: C.navy, width: 0 },
        });

        const optLabel = `Option ${ti + 1} — ${tm === '1y' ? '1-year' : '2-year contract'}`;
        quoteSlide.addText(optLabel, {
          x: cx + 0.25, y: cardY, w: cardW - 0.5, h: headerH,
          fontSize: 14, bold: true, color: C.white, fontFace: FONT, valign: 'middle',
        });

        // Line items
        const runs: any[] = [];
        rows.forEach((r, ri) => {
          const displayName = r.name.replace(/\s*[\(（][^)）]*[\)）]/g, '').trim()
            + (r.flat ? ` (${r.qty} depts)` : '');
          runs.push({
            text: displayName,
            options: {
              bold: true, fontSize: 12, color: C.navy, breakLine: true,
              paraSpaceBefore: ri ? 10 : 0, paraSpaceAfter: 2, fontFace: FONT,
            },
          });
          if (tm === '1y') {
            runs.push({
              text: `   ${money(rowOneNet(r))}`,
              options: { fontSize: 11.5, color: C.navy, breakLine: true, fontFace: FONT },
            });
          } else {
            runs.push({
              text: `   ${y1y}: ${money(rowY1in2Net(r))}`,
              options: { fontSize: 11.5, color: '3A4A5C', breakLine: true, fontFace: FONT },
            });
            runs.push({
              text: `   ${y2y}: ${money(rowY2Net(r))}`,
              options: { fontSize: 11.5, color: '3A4A5C', breakLine: true, fontFace: FONT },
            });
          }
        });

        quoteSlide.addText(runs, {
          x: cx + 0.25, y: cardY + headerH + 0.12,
          w: cardW - 0.5, h: bodyH,
          fontSize: 12, fontFace: FONT, valign: 'top',
        });

        // Footer separator
        const footY = cardY + cardH - footH - 0.05;
        quoteSlide.addShape('rect', {
          x: cx + 0.15, y: footY, w: cardW - 0.30, h: 0.012,
          fill: { color: C.bronze }, line: { color: C.bronze, width: 0 },
        });

        if (tm === '1y') {
          quoteSlide.addText(`Total: ${money(result.total)}`, {
            x: cx + 0.25, y: footY + 0.08, w: cardW - 0.5, h: 0.42,
            fontSize: 15, bold: true, color: C.navy, fontFace: FONT,
            align: 'right', valign: 'middle',
          });
        } else {
          const footRuns = [
            { text: `${y1y} total: ${money(result.total)}`, options: { fontSize: 11, color: '3A4A5C', breakLine: true, fontFace: FONT } },
            { text: `${y2y} total: ${money(result.total2)}`, options: { fontSize: 11, color: '3A4A5C', breakLine: true, fontFace: FONT } },
            { text: `2-year total: ${money(result.grand2y)}`, options: { fontSize: 14, bold: true, color: C.navy, breakLine: false, fontFace: FONT } },
          ];
          quoteSlide.addText(footRuns, {
            x: cx + 0.25, y: footY + 0.08, w: cardW - 0.5, h: footH - 0.12,
            fontSize: 11, fontFace: FONT, align: 'right', valign: 'top',
          });
        }
      });

      if (quote.note.trim()) {
        quoteSlide.addText(quote.note, {
          x: mX, y: 6.85, w: DIM.slideW - mX * 2, h: 0.28,
          fontSize: 10, italic: true, color: C.gray, fontFace: FONT, valign: 'middle',
        });
      }
    }
  }

  // ── Next steps ─────────────────────────────────────────────────────────────
  const nextDef = SECTION_DEFS.find(d => d.id === 'next')!;
  const nextSec = app.secs['next'];
  if (nextSec?.inc) {
    const items = nextSec.items.filter(it => it.c && it.t.trim()).map(it => it.t.trim());
    if (items.length) addSection('next', nextSec.title || sectionLabel(nextDef, lang), items);
  }

  // ── Back cover (template slide 12 style — beige) ───────────────────────────
  {
    const end = pptx.addSlide();
    end.background = { color: C.beige };

    // Top bars (navy + bronze)
    end.addShape('rect', {
      x: 0, y: 0, w: DIM.slideW, h: 0.12,
      fill: { color: C.navy }, line: { color: C.navy, width: 0 },
    });
    end.addShape('rect', {
      x: 0, y: 0.12, w: DIM.slideW, h: 0.07,
      fill: { color: C.bronze }, line: { color: C.bronze, width: 0 },
    });

    // Blue logo on beige background
    end.addImage({
      path: brandUrl('logo-blue.png'),
      x: 0.70, y: 1.20, w: 3.10, h: 0.80,
    });

    // Divider
    end.addShape('rect', {
      x: 0.70, y: 2.30, w: 8.00, h: 0.025,
      fill: { color: C.navy }, line: { color: C.navy, width: 0 },
    });

    // Contact lines
    end.addText('For more information and FAQs', {
      x: 0.70, y: 2.50, w: 8.00, h: 0.45,
      fontSize: 14, color: C.navy, fontFace: FONT,
    });
    end.addText('Please visit   chambers.com/faqs', {
      x: 0.70, y: 2.95, w: 8.00, h: 0.45,
      fontSize: 14, color: C.navy, fontFace: FONT,
    });
    end.addText('enquiries@chambers.com', {
      x: 0.70, y: 3.45, w: 8.00, h: 0.45,
      fontSize: 14, color: C.blue, fontFace: FONT,
    });

    if (owner) {
      end.addText(owner, {
        x: 0.70, y: 4.40, w: 8.00, h: 0.45,
        fontSize: 13, color: C.navy, fontFace: FONT, bold: true,
      });
    }

    // Bottom footer
    end.addText('STRICTLY CONFIDENTIAL', {
      x: 0.55, y: DIM.slideH - 0.26, w: DIM.slideW - 1.10, h: 0.20,
      fontSize: 8, color: C.gray, fontFace: FONT, align: 'center',
    });

    end.addImage({
      path: brandUrl('roundel.png'),
      x: 12.38, y: 0.25, w: 0.60, h: 0.48,
    });
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  const safe = (s: string) => s.replace(/[\\/:*?"<>|]/g, '');
  const fname = (client !== 'Client' ? safe(client) + '-' : '') +
    'Follow-up-' + (app.mdate || new Date().toISOString().slice(0, 10)) + '.pptx';
  await pptx.writeFile({ fileName: fname });
}
