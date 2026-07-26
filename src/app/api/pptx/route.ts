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

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${fname}"`,
        'Content-Length': String(buf.length),
      },
    });
  } catch (err: any) {
    console.error('PPTX generation failed:', err);
    return NextResponse.json({ error: err?.message ?? 'PPTX generation failed' }, { status: 500 });
  }
}
