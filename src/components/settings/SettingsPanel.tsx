import { useState, useEffect, useRef } from 'react';
import { useSettingsStore } from '../../stores/settings-store';
import { useAppStore } from '../../stores/app-store';
import { BACKEND_DEFAULTS, type AIProvider } from '../../types';
import { Eye, EyeOff, Wifi } from 'lucide-react';

const providers: { id: AIProvider; label: string }[] = [
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'ollama', label: 'Ollama (本地)' },
];

const DEFAULT_SETTINGS = {
  provider: 'deepseek' as AIProvider,
  apiKey: '',
  endpoint: BACKEND_DEFAULTS.deepseek.endpoint,
  model: BACKEND_DEFAULTS.deepseek.models[0],
  temperature: 0.7,
  maxTokens: 4096,
};

export function SettingsPanel() {
  const { settings, load, save, setProvider } = useSettingsStore();
  const addToast = useAppStore((s) => s.addToast);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true;
      load();
    }
  }, [load]);

  const s = settings || DEFAULT_SETTINGS;

  const handleSave = async () => {
    await save(s);
    addToast('AI 配置已保存', 'success');
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const isAnthropicProtocol = s.provider === 'deepseek' || s.provider === 'anthropic';
      const testUrl = isAnthropicProtocol
        ? `${s.endpoint}/messages`
        : `${s.endpoint}/chat/completions`;
      const testBody = isAnthropicProtocol
        ? {
            model: s.model,
            messages: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
            max_tokens: 5,
            stream: false,
          }
        : {
            model: s.model,
            messages: [{ role: 'user', content: 'Hello' }],
            max_tokens: 5,
            stream: false,
          };
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: isAnthropicProtocol
          ? {
              'Content-Type': 'application/json',
              'x-api-key': s.apiKey,
            }
          : {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${s.apiKey}`,
            },
        body: JSON.stringify(testBody),
      });
      if (response.ok) {
        addToast('连接测试成功', 'success');
      } else {
        const err = await response.text();
        addToast(`连接失败: ${response.status} ${err.slice(0, 100)}`, 'error');
      }
    } catch (err: unknown) {
      addToast(`连接失败: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setTesting(false);
    }
  };

  const updateField = <K extends keyof typeof s>(key: K, value: (typeof s)[K]) => {
    save({ ...s, [key]: value });
  };

  return (
    <div className="p-3 space-y-3 text-sm">
      <h3 className="text-lg font-serif text-amber-glow">⚙️ AI 设置</h3>

      <div>
        <label className="text-xs text-parchment-dark/70 block mb-1">提供商</label>
        <select
          value={s.provider}
          onChange={(e) => setProvider(e.target.value as AIProvider)}
          className="w-full rounded-lg border border-parchment-dark bg-tavern-wood text-parchment px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-glow"
        >
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs text-parchment-dark/70 block mb-1">API Key</label>
        <div className="flex gap-1">
          <input
            type={showKey ? 'text' : 'password'}
            value={s.apiKey}
            onChange={(e) => updateField('apiKey', e.target.value)}
            placeholder="输入 API Key..."
            className="flex-1 rounded-lg border border-parchment-dark bg-tavern-wood text-parchment px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-glow placeholder-parchment-dark/40"
          />
          <button onClick={() => setShowKey(!showKey)} className="px-2 text-parchment-dark hover:text-parchment">
            {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs text-parchment-dark/70 block mb-1">API 端点</label>
        <input
          type="text"
          value={s.endpoint}
          onChange={(e) => updateField('endpoint', e.target.value)}
          className="w-full rounded-lg border border-parchment-dark bg-tavern-wood text-parchment px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-glow"
        />
      </div>

      <div>
        <label className="text-xs text-parchment-dark/70 block mb-1">模型</label>
        <select
          value={s.model}
          onChange={(e) => updateField('model', e.target.value)}
          className="w-full rounded-lg border border-parchment-dark bg-tavern-wood text-parchment px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-glow"
        >
          {(BACKEND_DEFAULTS[s.provider]?.models || []).map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
          <option value={s.model}>{s.model} (自定义)</option>
        </select>
      </div>

      <div>
        <label className="text-xs text-parchment-dark/70 block mb-1">
          Temperature: {s.temperature?.toFixed(1) || '0.7'}
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={s.temperature || 0.7}
          onChange={(e) => updateField('temperature', parseFloat(e.target.value))}
          className="w-full accent-amber-glow"
        />
      </div>

      <div>
        <label className="text-xs text-parchment-dark/70 block mb-1">最大 Token</label>
        <input
          type="number"
          value={s.maxTokens || 4096}
          onChange={(e) => updateField('maxTokens', parseInt(e.target.value) || 4096)}
          min={256}
          max={128000}
          className="w-full rounded-lg border border-parchment-dark bg-tavern-wood text-parchment px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-glow"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={handleTest}
          disabled={testing || !s.apiKey}
          className="flex items-center gap-1 px-3 py-1.5 bg-tavern-wood-light text-parchment rounded-lg hover:bg-tavern-wood transition-colors disabled:opacity-50 text-sm"
        >
          <Wifi size={16} />
          {testing ? '测试中...' : '测试连接'}
        </button>
        <button
          onClick={handleSave}
          className="flex-1 px-3 py-1.5 bg-amber-glow text-white rounded-lg hover:bg-ember transition-colors text-sm"
        >
          保存
        </button>
      </div>

      <p className="text-xs text-parchment-dark/40 text-center pt-2">
        API Key 仅保存在浏览器本地 IndexedDB 中
      </p>
    </div>
  );
}
