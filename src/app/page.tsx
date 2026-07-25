'use client';
import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { t, SECTION_DEFS } from '@/lib/i18n';
import { aiComplete, isAiConfigured } from '@/lib/aiService';

import AppHeader from '@/components/AppHeader';
import BasicInfoSection from '@/components/BasicInfoSection';
import MeetingNotesSection from '@/components/MeetingNotesSection';
import ContentSection from '@/components/ContentSection';
import QuoteSection from '@/components/QuoteSection';
import AiSettingsDialog from '@/components/dialogs/AiSettingsDialog';
import PriceListDialog from '@/components/dialogs/PriceListDialog';
import OutputPanel from '@/components/dialogs/OutputPanel';
import MatchResult from '@/components/dialogs/MatchResult';
import type { PriceItem } from '@/lib/types';

type PanelKind = 'summary' | 'email' | null;
interface MatchHit { p: PriceItem; hits: string[] }

export default function Home() {
  const store = useStore();
  const { app, setSectionItems, setSection, setContacts, priceList, aiConfig, uiLang, setStatus, saveState, loadState, resetAll } = store;
  const T = useCallback((k: Parameters<typeof t>[0]) => t(k, uiLang), [uiLang]);

  const [showAi, setShowAi] = useState(false);
  const [showPrices, setShowPrices] = useState(false);
  const [panel, setPanel] = useState<PanelKind>(null);
  const [panelTitle, setPanelTitle] = useState('');
  const [panelHint, setPanelHint] = useState('');
  const [panelContent, setPanelContent] = useState<string | [string, string, string]>('');
  const [matchHits, setMatchHits] = useState<MatchHit[]>([]);
  const [showMatch, setShowMatch] = useState(false);

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

  const genSections = async () => {
    if (!isAiConfigured(aiConfig)) { alert(T('alertNoAi')); return; }
    if (!app.notes.trim()) { alert(T('alertNoNotes')); return; }
    const hasContent = SECTION_DEFS.some(d => app.secs[d.id]?.items.length);
    if (hasContent && !confirm(T('confirmOverwrite'))) return;
    setStatus(T('btnGenerating'), 60000);
    const OUT: Record<string, string> = { en: 'English', zh: '简体中文', zhTW: '繁體中文', fr: 'French (français)', de: 'German (Deutsch)', ptBR: 'Brazilian Portuguese (português do Brasil)' };
    const outLang = OUT[app.lang] || 'English';
    const sys = `You are a Chambers (legal intelligence firm) sales advisor writing bullet points for a client-facing follow-up PPT. Write in a professional, client-centric tone. Generate 2-5 points per section. Output ONLY valid JSON, no code fences. All points must be in ${outLang}.`;
    const user = `Meeting notes:\n${app.notes}\n\nGenerate client-facing follow-up points as JSON:\n{"recap":[],"needs":[],"solution":[],"next":[]}\nrecap=meeting recap; needs=client requirements; solution=proposed solution; next=next steps`;
    try {
      const raw = (await aiComplete(sys, user, aiConfig)).trim().replace(/^```(json)?\s*/i, '').replace(/```\s*$/, '');
      const m = raw.match(/\{[\s\S]*\}/);
      const d = JSON.parse(m ? m[0] : raw);
      let filled = 0;
      SECTION_DEFS.forEach(def => {
        const arr = d[def.id];
        if (Array.isArray(arr) && arr.length) {
          setSectionItems(def.id, arr.map((v: string) => ({ t: String(v), c: true })));
          setSection(def.id, { inc: true });
          filled++;
        }
      });
      saveState();
      setStatus(T('genSecDone').replace('{n}', String(filled)));
    } catch (err: any) { alert(T('genFail') + err.message); setStatus(''); }
  };

  const matchProducts = () => {
    const text = app.notes;
    if (!text.trim()) { setMatchHits([]); setShowMatch(false); return; }
    const results: MatchHit[] = [];
    priceList.forEach(p => {
      const kws = (p.kw || '').split(/[,，、;；]+/).map(k => k.trim()).filter(Boolean);
      const hits = kws.filter(k => text.toLowerCase().includes(k.toLowerCase()));
      if (hits.length) results.push({ p, hits });
    });
    results.sort((a, b) => b.hits.length - a.hits.length);
    setMatchHits(results);
    setShowMatch(true);
    if (!results.length) alert(T('matchNoHit'));
  };

  const extractContacts = async () => {
    if (!isAiConfigured(aiConfig)) { alert(T('alertNoAi')); return; }
    if (!app.notes.trim()) { alert(T('alertNoNotes')); return; }
    setStatus('Extracting contacts…', 60000);
    const sys = 'Identify client-side attendee names from a sales meeting transcript. Only client names (not Chambers staff). Output ONLY a JSON string array, nothing else.';
    const user = `Meeting notes:\n${app.notes}\n\nOutput client contact names, e.g. ["Jane Smith","John Doe"]. Output [] if none found.`;
    try {
      const raw = (await aiComplete(sys, user, aiConfig)).trim().replace(/^```(json)?\s*/i, '').replace(/```\s*$/, '');
      const m = raw.match(/\[[\s\S]*\]/);
      const arr: string[] = JSON.parse(m ? m[0] : raw);
      if (Array.isArray(arr) && arr.filter(Boolean).length) {
        const existing = new Set(app.contacts.filter(Boolean));
        const merged = [...app.contacts.filter(Boolean)];
        arr.forEach(n => { n = String(n).trim(); if (n && !existing.has(n)) { merged.push(n); existing.add(n); } });
        setContacts(merged.length ? merged : ['']);
        saveState();
        setStatus(T('contactsExtracted'));
      } else setStatus(T('contactsNone'));
    } catch (err: any) { alert(T('genFail') + err.message); setStatus(''); }
  };

  const genSummary = async () => {
    const ctx = collectContext();
    const notes = app.notes.trim();
    const sys = 'You are a Chambers sales team assistant writing a concise internal follow-up record in UK English. Base only on the provided material. Distinguish confirmed/pending/risk. Format for CRM archiving. Never fabricate quotes, facts, or contact details.';
    const user = `Write an internal follow-up summary.\nStructure: 1) Overview (2-3 sentences) 2) Client needs & concerns 3) Our proposed solution & quote highlights 4) Next actions (owners & deadlines; mark TBC if unknown) 5) Risks & notes.\n\n=== Structured data ===\n${ctx}\n\n=== Meeting notes ===\n${notes || '(not provided)'}`;
    setPanelTitle(T('sumTitleGen'));
    setPanel('summary');
    if (!isAiConfigured(aiConfig)) {
      setPanelHint(T('sumHintManual'));
      setPanelContent(`[System]\n${sys}\n\n[User]\n${user}`);
      return;
    }
    setPanelHint(T('sumHintCalling')); setPanelContent('');
    try {
      const out = await aiComplete(sys, user, aiConfig);
      setPanelHint(T('sumHintDone')); setPanelContent(out.trim());
    } catch (err: any) {
      setPanelHint(T('sumHintFail') + err.message);
      setPanelContent(`[System]\n${sys}\n\n[User]\n${user}`);
    }
  };

  const genEmail = async () => {
    const ctx = collectContext(); const notes = app.notes.trim();
    const OUT: Record<string, string> = { en: 'English', zh: '简体中文', zhTW: '繁體中文', fr: 'French (français)', de: 'German (Deutsch)', ptBR: 'Brazilian Portuguese (português do Brasil)' };
    const outLang = OUT[app.lang] || 'English';
    const sys = `You are a Chambers (legal intelligence firm) sales advisor writing a post-meeting client follow-up email. Generate THREE distinct versions:\n=== Version 1 — Short, sharp & sweet ===\n=== Version 2 — Conversational ===\n=== Version 3 — Professional & structured ===\nAll three in ${outLang}. Each must include: Subject:, greeting, thanks, recap, solution/quote highlights, next steps, sign-off. Base only on provided material. Never fabricate facts or prices. Output only the three versions with the === headers above.`;
    const user = `=== Structured data ===\n${ctx}\n\n=== Meeting notes ===\n${notes || '(not provided)'}`;
    setPanelTitle(T('emailTitle')); setPanel('email');
    if (!isAiConfigured(aiConfig)) {
      setPanelHint(T('sumHintManual'));
      setPanelContent([`[System]\n${sys}\n\n[User]\n${user}`, '', '']);
      return;
    }
    setPanelHint(T('sumHintCalling')); setPanelContent(['', '', '']);
    try {
      const out = await aiComplete(sys, user, aiConfig);
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
      setPanelHint(T('emailHintDone')); setPanelContent(vs);
    } catch (err: any) {
      setPanelHint(T('sumHintFail') + err.message);
      setPanelContent([`[System]\n${sys}\n\n[User]\n${user}`, '', '']);
    }
  };

  const exportPPT = async () => {
    setStatus('Generating PPTX…', 30000);
    try {
      const { exportPPTX } = await import('@/lib/pptxService');
      await exportPPTX(app, priceList);
      setStatus(T('flashPptDownloaded'));
    } catch (err: any) { alert('PPTX export failed: ' + err.message); setStatus(''); }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <AppHeader onSummary={genSummary} onEmail={genEmail} onPrices={() => setShowPrices(true)} onAiCfg={() => setShowAi(true)} />

      <main className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-5 pb-24">
        <BasicInfoSection onExtractContacts={extractContacts} />
        <MeetingNotesSection onGenSections={genSections} onMatchProducts={matchProducts} />
        {showMatch && matchHits.length > 0 && (
          <MatchResult results={matchHits} onClose={() => setShowMatch(false)} />
        )}
        {SECTION_DEFS.map(def => <ContentSection key={def.id} def={def} />)}
        <QuoteSection />
        {panel && (
          <OutputPanel kind={panel} title={panelTitle} hint={panelHint}
            content={panelContent as string | [string, string, string]}
            onClose={() => setPanel(null)} />
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-center gap-4 shadow-lg z-40">
        <button
          onClick={() => { if (confirm(T('confirmReset'))) resetAll(); }}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >{T('btnReset')}</button>
        <button onClick={exportPPT} className="btn-primary text-sm px-8">{T('btnExport')}</button>
      </div>

      <AiSettingsDialog open={showAi} onClose={() => setShowAi(false)} />
      <PriceListDialog open={showPrices} onClose={() => setShowPrices(false)} />
    </div>
  );
}
