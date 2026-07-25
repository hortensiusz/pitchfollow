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

// Robustly parse JSON from AI output.
// Handles: code fences, literal newlines/tabs inside strings, leading/trailing garbage.
export function parseAiJson(raw: string): unknown {
  // Strip code fences
  let s = raw.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '');

  // Escape literal control chars inside string values (char-by-char scan)
  let clean = '';
  let inStr = false;
  let esc = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (esc) { clean += c; esc = false; continue; }
    if (c === '\\') { clean += c; esc = true; continue; }
    if (c === '"') { inStr = !inStr; clean += c; continue; }
    if (inStr) {
      if (c === '\n') { clean += '\\n'; continue; }
      if (c === '\r') { clean += '\\r'; continue; }
      if (c === '\t') { clean += '\\t'; continue; }
    }
    clean += c;
  }

  // Extract the outermost { } or [ ]
  const mObj = clean.match(/\{[\s\S]*\}/);
  const mArr = clean.match(/\[[\s\S]*\]/);
  const candidate = mObj ? mObj[0] : mArr ? mArr[0] : clean;
  return JSON.parse(candidate);
}
