import { NextRequest, NextResponse } from 'next/server';
import type { AppState, PriceItem } from '@/lib/types';
import { buildTemplatePptx } from '@/lib/pptxTemplate';

// pptx-automizer uses fs + zip — must run in the Node.js runtime, not Edge.
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { app, priceList } = (await req.json()) as { app: AppState; priceList: PriceItem[] };
    if (!app) return NextResponse.json({ error: 'Missing app state' }, { status: 400 });

    const buf = await buildTemplatePptx(app, priceList ?? []);

    const safe = (s: string) => s.replace(/[\\/:*?"<>|]/g, '');
    const client = app.client && app.client !== 'Client' ? safe(app.client) + '-' : '';
    const fname = `${client}Follow-up-${app.mdate || new Date().toISOString().slice(0, 10)}.pptx`;
    // Content-Disposition must be Latin-1: strip non-ASCII for the plain
    // filename and carry the full (possibly non-Latin) name via RFC 5987.
    const asciiName = (fname.replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'Follow-up') .replace(/(\.pptx)?$/, '.pptx');
    const disposition = `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fname)}`;

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': disposition,
        'Content-Length': String(buf.length),
      },
    });
  } catch (err: any) {
    console.error('PPTX generation failed:', err);
    return NextResponse.json({ error: err?.message ?? 'PPTX generation failed' }, { status: 500 });
  }
}
