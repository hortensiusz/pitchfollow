import type { AiConfig } from './types';

export async function aiComplete(sys: string, user: string, cfg: AiConfig): Promise<string> {
  if (cfg.provider === 'anthropic') {
    const url = cfg.endpoint || 'https://api.anthropic.com/v1/messages';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': cfg.key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: cfg.model || 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: sys,
        messages: [{ role: 'user', content: user }],
      }),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + (await res.text()).slice(0, 300));
    const data = await res.json();
    return (data.content?.[0]?.text) ?? JSON.stringify(data);
  }

  // OpenAI-compatible
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const hn = cfg.keyHeader || 'Authorization';
  if (cfg.key) headers[hn] = (cfg.keyPrefix ?? 'Bearer ') + cfg.key;
  const res = await fetch(cfg.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: cfg.model || undefined,
      temperature: 0.3,
      max_tokens: 4000,
      messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
    }),
  });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + (await res.text()).slice(0, 300));
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? data.output_text ?? JSON.stringify(data);
}

export function isAiConfigured(cfg: AiConfig): boolean {
  if (cfg.provider === 'anthropic') return !!cfg.key;
  return !!cfg.endpoint;
}
