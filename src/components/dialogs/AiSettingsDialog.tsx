'use client';
import { useStore } from '@/lib/store';
import { t } from '@/lib/i18n';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AiSettingsDialog({ open, onClose }: Props) {
  const { aiConfig, setAiConfig, uiLang, setStatus } = useStore();
  const T = (k: Parameters<typeof t>[0]) => t(k, uiLang);

  if (!open) return null;

  const save = () => {
    setStatus(T('flashAiSaved'));
    onClose();
  };

  const clear = () => {
    setAiConfig({ provider: 'openai', endpoint: '', key: '', model: '', keyHeader: 'Authorization', keyPrefix: 'Bearer ' });
    setStatus(T('flashAiSaved'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="bg-[#1e3a5f] text-white px-5 py-3.5 flex justify-between items-center">
          <span className="font-semibold">{T('dlgAiCfg')}</span>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl">✕</button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          <p className="text-xs text-gray-500 mb-4">{T('aiCfgHint')}</p>

          <div className="flex flex-col gap-3">
            <div>
              <label className="field-label">{T('lblProvider')}</label>
              <select className="field-input" value={aiConfig.provider}
                onChange={e => setAiConfig({ provider: e.target.value as 'openai' | 'anthropic' })}>
                <option value="openai">OpenAI-compatible / Azure OpenAI</option>
                <option value="anthropic">Anthropic Claude</option>
              </select>
            </div>
            {aiConfig.provider === 'openai' && (
              <div>
                <label className="field-label">{T('lblEndpoint')}</label>
                <input type="text" className="field-input"
                  value={aiConfig.endpoint}
                  placeholder="https://your-endpoint/v1/chat/completions"
                  onChange={e => setAiConfig({ endpoint: e.target.value })} />
              </div>
            )}
            <div>
              <label className="field-label">API Key</label>
              <input type="password" className="field-input"
                value={aiConfig.key}
                onChange={e => setAiConfig({ key: e.target.value })} />
            </div>
            <div>
              <label className="field-label">{T('lblModel')}</label>
              <input type="text" className="field-input"
                value={aiConfig.model}
                placeholder={aiConfig.provider === 'anthropic' ? 'claude-sonnet-4-6' : 'gpt-4o'}
                onChange={e => setAiConfig({ model: e.target.value })} />
            </div>
            {aiConfig.provider === 'openai' && (
              <>
                <div>
                  <label className="field-label">{T('lblKeyHeader')}</label>
                  <input type="text" className="field-input"
                    value={aiConfig.keyHeader}
                    onChange={e => setAiConfig({ keyHeader: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">{T('lblKeyPrefix')}</label>
                  <input type="text" className="field-input"
                    value={aiConfig.keyPrefix}
                    onChange={e => setAiConfig({ keyPrefix: e.target.value })} />
                </div>
              </>
            )}
          </div>
        </div>
        <div className="px-5 py-3.5 border-t border-gray-100 flex justify-between">
          <button onClick={clear} className="btn-ghost text-sm text-red-600">{T('btnClear')}</button>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost text-sm">{T('btnCancel')}</button>
            <button onClick={save} className="btn-primary text-sm">{T('btnSave')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
