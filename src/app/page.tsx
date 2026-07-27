'use client';
import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { t, SECTION_DEFS } from '@/lib/i18n';
import { aiComplete, parseAiJson } from '@/lib/aiService';

import AppHeader from '@/components/AppHeader';
import BasicInfoSection from '@/components/BasicInfoSection';
import MeetingNotesSection from '@/components/MeetingNotesSection';
import ContentSection from '@/components/ContentSection';
import QuoteSection from '@/components/QuoteSection';
import CalcSection from '@/components/CalcSection';
import OutputPanel from '@/components/dialogs/OutputPanel';

type CommsOut = {
  summary: { hint: string; content: string } | null;
  email: { hint: string; content: [string, string, string] } | null;
};

export default function Home() {
  const store = useStore();
  const { app, setSectionItems, setSection, setContacts, priceList, uiLang, setStatus, saveState, loadState, resetAll } = store;
  const T = useCallback((k: Parameters<typeof t>[0]) => t(k, uiLang), [uiLang]);

  const [step, setStep] = useState(1);
  const [comms, setComms] = useState<CommsOut>({ summary: null, email: null });
  const [genBusy, setGenBusy] = useState(false);
  const [extractBusy, setExtractBusy] = useState(false);

  useEffect(() => { loadState(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const collectContext = useCallback(() => {
    const L: string[] = [];
    L.push('Client: ' + (app.client || '(not set)'));
    L.push('Contact: ' + (app.contacts.filter(Boolean).join(', ') || '(not set)'));
    L.push('Meeting date: ' + (app.mdate || '(not set)'));
    L.push('Our lead: ' + (app.owner || '(not set)'));
    L.push('');
    L.push('=== Section bullet points ===');
    SECTION_DEFS.forEach(d => {
      const sec = app.secs[d.id];
      if (!sec) return;
      const items = sec.items.filter(it => it.c && it.t.trim()).map(it => '- ' + it.t.trim());
      if (items.length) { L.push('# ' + (sec.title || d.en)); items.forEach(x => L.push(x)); }
    });
    const rows = app.quote.rows.filter(r => r.name);
    if (rows.length) {
      L.push(''); L.push('=== Quote ===');
      rows.forEach(r => {
        const y1 = (r.flat ? r.price : r.qty * r.price) * (1 - r.disc / 100);
        L.push(`- ${r.name}${r.guide ? ' (' + r.guide + ')' : ''} | qty ${r.qty} | price ${app.currency}${r.price}${r.disc ? ' | disc ' + r.disc + '%' : ''} | yr1 ${app.currency}${y1.toFixed(2)}`);
      });
    }
    return L.join('\n');
  }, [app]);

  // One-click: generate section bullet points + the client email + the
  // internal summary together. If section content already exists, ask before
  // overwriting it — but the email & summary always refresh (so this doubles
  // as a "refresh comms after pricing" action).
  const genAll = async () => {
    if (!app.notes.trim()) { alert(T('alertNoNotes')); return; }
    const fromStep = step;
    const hasContent = SECTION_DEFS.some(d => app.secs[d.id]?.items.length);
    const regenSections = !hasContent || confirm(T('confirmOverwrite'));

    setGenBusy(true);
    setComms({
      summary: { hint: T('sumHintCalling'), content: '' },
      email: { hint: T('sumHintCalling'), content: ['', '', ''] },
    });

    const OUT: Record<string, string> = { en: 'English', zh: '简体中文', zhTW: '繁體中文', fr: 'French (français)', de: 'German (Deutsch)', ptBR: 'Brazilian Portuguese (português do Brasil)' };
    const outLang = OUT[app.lang] || 'English';
    const ctx = collectContext();
    const notes = app.notes.trim();

    const secSys = `You are writing slide bullet points for a client-facing follow-up presentation from Chambers (a legal intelligence firm). The audience is the client — write directly TO them, as if the slide deck is addressed to their firm.

Rules:
- Address the client as "you" / "your firm" / "your team" — never refer to them in the third person
- Focus on CLIENT VALUE: what they gain, what their challenges are, how Chambers solves them
- Avoid internal sales language ("the client said", "we pitched", "our product")
- Be concise, sharp, and professional — each bullet is a standalone slide point
- Generate 2–5 bullets per section
- Output ONLY valid JSON, no code fences, no explanation
- All text must be in ${outLang}`;
    const secUser = `Meeting notes:\n${notes}\n\nGenerate client-facing slide bullets as JSON:\n{"recap":[],"needs":[],"solution":[],"next":[]}\nrecap = what was discussed (framed for the client's benefit); needs = your firm's key requirements and challenges; solution = how Chambers addresses your needs; next = agreed next steps`;

    const sumSys = 'You are a Chambers sales team assistant writing a concise internal follow-up record in UK English. Base only on the provided material. Distinguish confirmed/pending/risk. Format for CRM archiving. Never fabricate quotes, facts, or contact details.';
    const sumUser = `Write an internal follow-up summary.\nStructure: 1) Overview (2-3 sentences) 2) Client needs & concerns 3) Our proposed solution & quote highlights 4) Next actions (owners & deadlines; mark TBC if unknown) 5) Risks & notes.\n\n=== Structured data ===\n${ctx}\n\n=== Meeting notes ===\n${notes || '(not provided)'}`;

    const emSys = `You are a Chambers (legal intelligence firm) sales advisor writing a post-meeting client follow-up email. Generate THREE distinct versions:\n=== Version 1 — Short, sharp & sweet ===\n=== Version 2 — Conversational ===\n=== Version 3 — Professional & structured ===\nAll three in ${outLang}. Each must include: Subject:, greeting, thanks, recap, solution/quote highlights, next steps, sign-off. Base only on provided material. Never fabricate facts or prices. Output only the three versions with the === headers above.`;
    const emUser = `=== Structured data ===\n${ctx}\n\n=== Meeting notes ===\n${notes || '(not provided)'}`;

    const [secRes, sumRes, emRes] = await Promise.allSettled([
      regenSections ? aiComplete(secSys, secUser) : Promise.resolve(''),
      aiComplete(sumSys, sumUser),
      aiComplete(emSys, emUser),
    ]);

    let filled = 0;
    if (regenSections && secRes.status === 'fulfilled') {
      try {
        const d = parseAiJson(secRes.value) as Record<string, unknown>;
        SECTION_DEFS.forEach(def => {
          const arr = d[def.id];
          if (Array.isArray(arr) && arr.length) {
            setSectionItems(def.id, arr.map((v: string) => ({ t: String(v), c: true })));
            setSection(def.id, { inc: true });
            filled++;
          }
        });
      } catch { /* leave sections untouched on parse failure */ }
    }

    setComms({
      summary: sumRes.status === 'fulfilled'
        ? { hint: T('sumHintDone'), content: sumRes.value.trim() }
        : { hint: T('sumHintFail') + (sumRes.reason?.message ?? ''), content: '' },
      email: emRes.status === 'fulfilled'
        ? { hint: T('emailHintDone'), content: parseEmailVersions(emRes.value) }
        : { hint: T('sumHintFail') + (emRes.reason?.message ?? ''), content: ['', '', ''] },
    });

    saveState();
    setGenBusy(false);
    setStatus(T('genSecDone').replace('{n}', String(filled)));
    if (regenSections && filled && fromStep === 1) setStep(2);
  };

  const extractContacts = async () => {
    if (!app.notes.trim()) { alert(T('alertNoNotes')); return; }
    setExtractBusy(true);
    const sys = 'Identify client-side attendee names from a sales meeting transcript. Only client names (not Chambers staff). Output ONLY a JSON string array, nothing else.';
    const user = `Meeting notes:\n${app.notes}\n\nOutput client contact names, e.g. ["Jane Smith","John Doe"]. Output [] if none found.`;
    try {
      const arr = parseAiJson(await aiComplete(sys, user)) as string[];
      if (Array.isArray(arr) && arr.filter(Boolean).length) {
        const existing = new Set(app.contacts.filter(Boolean));
        const merged = [...app.contacts.filter(Boolean)];
        arr.forEach(n => { n = String(n).trim(); if (n && !existing.has(n)) { merged.push(n); existing.add(n); } });
        setContacts(merged.length ? merged : ['']);
        saveState();
        setStatus(T('contactsExtracted'));
      } else setStatus(T('contactsNone'));
    } catch (err: any) { alert(T('genFail') + err.message); }
    finally { setExtractBusy(false); }
  };

  const parseEmailVersions = (out: string): [string, string, string] => {
    const re = /===\s*Version\s*([1-3])[^\n]*===/gi;
    const idxs: { n: number; end: number; start: number }[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(out)) !== null) idxs.push({ n: +m[1], end: re.lastIndex, start: m.index });
    const vs: [string, string, string] = ['', '', ''];
    if (idxs.length) {
      for (let i = 0; i < idxs.length; i++) {
        const s = idxs[i].end, e = i + 1 < idxs.length ? idxs[i + 1].start : out.length, v = idxs[i].n;
        if (v >= 1 && v <= 3) vs[v - 1] = out.slice(s, e).trim();
      }
    } else vs[0] = out.trim();
    return vs;
  };

  const exportPPT = async () => {
    setStatus(T('btnGenerating'), 60000);
    try {
      const res = await fetch('/api/pptx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app, priceList }),
      });
      if (!res.ok) {
        let msg = `${res.status}`;
        try { msg = (await res.json()).error ?? msg; } catch {}
        throw new Error(msg);
      }
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') || '';
      const m = cd.match(/filename="([^"]+)"/);
      const fname = m ? m[1] : 'Follow-up.pptx';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus(T('flashPptDownloaded'));
    } catch (err: any) { alert('PPTX export failed: ' + err.message); setStatus(''); }
  };

  const STEPS = [
    { n: 1, label: T('navStep1'), sub: T('navStep1Sub') },
    { n: 2, label: T('navStep2'), sub: T('navStep2Sub') },
    { n: 3, label: T('navStep3'), sub: T('navStep3Sub') },
    { n: 4, label: T('navStep4'), sub: T('navStep4Sub') },
  ];
  const hasSections = SECTION_DEFS.some(d => app.secs[d.id]?.items.length);

  return (
    <div className="min-h-screen bg-[var(--ground)]">
      <AppHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-32 flex gap-6 md:gap-10">
        {/* ── Left workflow menu (always visible) ────────────────────── */}
        <nav className="w-44 sm:w-56 shrink-0">
          <div className="sticky top-24 flex flex-col rounded-md border border-[var(--hairline)] bg-[var(--surface)] overflow-hidden">
            {STEPS.map((s, i) => {
              const active = step === s.n;
              return (
                <button
                  key={s.n}
                  onClick={() => setStep(s.n)}
                  className={`group relative text-left flex gap-3 items-start px-4 py-3.5 transition-colors ${i > 0 ? 'border-t border-[var(--hairline)]' : ''} ${active ? 'bg-[var(--beige)]/50' : 'hover:bg-[#FAF9F6]'}`}
                >
                  {active && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#006CE0]" />}
                  <span
                    className={`mt-0.5 w-6 h-6 shrink-0 rounded-full border flex items-center justify-center text-[11px] font-semibold transition-colors ${
                      active
                        ? 'bg-[#002B49] border-[#002B49] text-white'
                        : 'border-[var(--hairline-strong)] text-[var(--muted)] group-hover:border-[#002B49] group-hover:text-[#002B49]'
                    }`}
                  >{s.n}</span>
                  <span className="min-w-0">
                    <span className={`block text-[13px] leading-tight ${active ? 'font-semibold text-[#002B49]' : 'text-[#3A4A57]'}`}>{s.label}</span>
                    <span className="block text-[11px] text-[var(--muted)] mt-0.5">{s.sub}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* ── Right content area ─────────────────────────────────────── */}
        <main className="flex-1 min-w-0 flex flex-col gap-8">
          <div>
            <p className="eyebrow mb-1">{T('stepWord')} {step}</p>
            <h2 className="text-[22px] font-semibold text-[#002B49] tracking-tight">{STEPS[step - 1].label}</h2>
          </div>

          {step === 1 && (
            <>
              <BasicInfoSection onExtractContacts={extractContacts} extractBusy={extractBusy} />
              <MeetingNotesSection onGenSections={genAll} genBusy={genBusy} />
            </>
          )}

          {step === 2 && (
            hasSections
              ? SECTION_DEFS.map(def => <ContentSection key={def.id} def={def} />)
              : (
                <div className="rounded-md border border-dashed border-[var(--hairline-strong)] bg-[var(--surface)] px-6 py-10 text-center">
                  <p className="text-sm text-[var(--muted)] max-w-md mx-auto">{T('step2Empty')}</p>
                  <button onClick={() => setStep(1)} className="btn-ghost text-sm mt-4">← {T('navStep1')}</button>
                </div>
              )
          )}

          {step === 3 && (
            <>
              <CalcSection />
              <QuoteSection />
            </>
          )}

          {step === 4 && (
            <>
              <div className="flex flex-wrap gap-3 items-center">
                <button onClick={genAll} disabled={genBusy} className="btn-primary text-sm disabled:opacity-50">
                  {T('btnGenAll')}
                </button>
                {genBusy
                  ? <span className="text-xs text-[var(--accent)] font-medium animate-pulse">{T('btnGenerating')}</span>
                  : <span className="text-xs text-[var(--muted)]">{T('commsHint')}</span>}
              </div>
              {comms.email && (
                <OutputPanel kind="email" title={T('emailTitle')} hint={comms.email.hint}
                  content={comms.email.content}
                  onClose={() => setComms(c => ({ ...c, email: null }))} />
              )}
              {comms.summary && (
                <OutputPanel kind="summary" title={T('sumTitleGen')} hint={comms.summary.hint}
                  content={comms.summary.content}
                  onClose={() => setComms(c => ({ ...c, summary: null }))} />
              )}
            </>
          )}
        </main>
      </div>

      {/* ── Persistent action bar ──────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--ground)]/90 backdrop-blur-sm border-t border-[var(--hairline)] z-40">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex justify-between items-center gap-4">
          <button
            onClick={() => { if (confirm(T('confirmReset'))) resetAll(); }}
            className="text-[13px] text-[var(--muted)] hover:text-[#a3312a] transition-colors"
          >{T('btnReset')}</button>
          <div className="flex items-center gap-4">
            {step < 4 && (
              <button onClick={() => setStep(step + 1)} className="text-[13px] text-[#002B49] hover:text-[var(--accent)] transition-colors">
                {STEPS[step].label} →
              </button>
            )}
            <button onClick={exportPPT} className="btn-primary px-8">{T('btnExport')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
