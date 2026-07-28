export async function aiComplete(sys: string, user: string): Promise<string> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sys, user }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.text ?? '';
}

export function isAiConfigured(): boolean {
  return true;
}

// Strip Markdown so AI output pastes cleanly into email/CRM as plain text:
// removes #, **, *, `code`, fences and --- rules; turns list markers into "•".
export function tidyText(raw: string): string {
  const lines = raw.replace(/\r\n/g, '\n').split('\n')
    .filter(l => !/^\s*([-*_]\s*){3,}$/.test(l))          // drop horizontal rules
    .map(l => l
      .replace(/^\s{0,3}#{1,6}\s+/, '')                    // heading markers → plain
      .replace(/^(\s*)[*+-]\s+/, '$1• '));                 // list bullets → •
  let out = lines.join('\n');
  out = out.replace(/```[a-z]*\n?/gi, '');                 // code fences
  out = out.replace(/`([^`]+)`/g, '$1');                   // inline code
  out = out.replace(/(\*\*|__)([\s\S]*?)\1/g, '$2');       // **bold** / __bold__
  out = out.replace(/\*([^*\n]+)\*/g, '$1');               // *italic*
  out = out.replace(/\*\*/g, '');                          // stray markers
  out = out.replace(/\n{3,}/g, '\n\n').trim();             // collapse blank lines
  return out;
}

// Robustly parse JSON from AI output.
// Handles: code fences, literal control chars in strings, trailing commas, surrounding prose.
export function parseAiJson(raw: string): unknown {
  // Strip code fences
  let s = raw.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '');

  // Extract the outermost balanced { } or [ ] block (brace-counting, not greedy regex)
  s = _extractBalanced(s);

  // Escape literal control chars inside string values
  s = _fixControlChars(s);

  // Remove trailing commas before } or ] — common AI mistake
  s = s.replace(/,(\s*[}\]])/g, '$1');

  try {
    return JSON.parse(s);
  } catch (e) {
    throw new Error(`AI JSON parse failed: ${(e as Error).message} | preview: ${raw.slice(0, 200)}`);
  }
}

function _extractBalanced(s: string): string {
  const oi = s.indexOf('{'), ai = s.indexOf('[');
  if (oi === -1 && ai === -1) return s;
  let start: number, open: string, close: string;
  if (oi === -1 || (ai !== -1 && ai < oi)) { start = ai; open = '['; close = ']'; }
  else { start = oi; open = '{'; close = '}'; }
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (!inStr) {
      if (c === open) depth++;
      else if (c === close && --depth === 0) return s.slice(start, i + 1);
    }
  }
  return s.slice(start);
}

function _fixControlChars(s: string): string {
  let r = '', inStr = false, esc = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (esc) { r += c; esc = false; continue; }
    if (c === '\\') { r += c; esc = true; continue; }
    if (c === '"') { inStr = !inStr; r += c; continue; }
    if (inStr && c === '\n') { r += '\\n'; continue; }
    if (inStr && c === '\r') { r += '\\r'; continue; }
    if (inStr && c === '\t') { r += '\\t'; continue; }
    r += c;
  }
  return r;
}
