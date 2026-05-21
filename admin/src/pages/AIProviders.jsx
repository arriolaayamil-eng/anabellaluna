import React, { useState, useEffect } from 'react';
import { useStateContext } from '../contexts/ContextProvider';
import aiService from '../services/aiService';
import { toast } from 'react-toastify';

const MODELS_OPENAI    = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
const MODELS_ANTHROPIC = ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-haiku-20240307'];
const MODELS_GEMINI    = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro', 'gemini-2.0-flash-lite'];

const AIProviders = () => {
  const { currentMode } = useStateContext();
  const isDark = currentMode === 'Dark';

  const [config,   setConfig]   = useState(null);
  const [form,     setForm]     = useState({});
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [metaForm, setMetaForm] = useState({ accessToken: '', adAccountId: '', appId: '' });
  const [metaInfo, setMetaInfo] = useState(null);
  const [usage,    setUsage]    = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      aiService.getProviders(),
      aiService.getMetaAdsConfig(),
      aiService.getUsageStats(30),
    ]).then(([cfg, meta, usageData]) => {
      setConfig(cfg);
      setForm({
        defaultProvider:  cfg.defaultProvider,
        fallbackProvider: cfg.fallbackProvider,
        openai_enabled:   cfg.openai?.enabled  || false,
        openai_model:     cfg.openai?.model    || 'gpt-4o',
        openai_maxTokens: cfg.openai?.maxTokens || 4096,
        openai_apiKey:    '',
        anthropic_enabled:   cfg.anthropic?.enabled  || false,
        anthropic_model:     cfg.anthropic?.model    || 'claude-3-5-sonnet-20241022',
        anthropic_maxTokens: cfg.anthropic?.maxTokens || 4096,
        anthropic_apiKey:    '',
        gemini_enabled:   cfg.gemini?.enabled  !== false,
        gemini_model:     cfg.gemini?.model    || 'gemini-1.5-flash',
        gemini_maxTokens: cfg.gemini?.maxTokens || 4096,
        gemini_apiKey:    '',
      });
      setMetaInfo(meta);
      setUsage(usageData);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        defaultProvider:  form.defaultProvider,
        fallbackProvider: form.fallbackProvider,
        openai: {
          enabled:    form.openai_enabled,
          model:      form.openai_model,
          maxTokens:  form.openai_maxTokens,
          ...(form.openai_apiKey ? { apiKey: form.openai_apiKey } : {}),
        },
        anthropic: {
          enabled:    form.anthropic_enabled,
          model:      form.anthropic_model,
          maxTokens:  form.anthropic_maxTokens,
          ...(form.anthropic_apiKey ? { apiKey: form.anthropic_apiKey } : {}),
        },
        gemini: {
          enabled:    form.gemini_enabled,
          model:      form.gemini_model,
          maxTokens:  form.gemini_maxTokens,
          ...(form.gemini_apiKey ? { apiKey: form.gemini_apiKey } : {}),
        },
      };
      await aiService.updateProviders(payload);
      toast.success('Configuración AI guardada');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMeta = async () => {
    setSaving(true);
    try {
      await aiService.updateMetaAdsConfig(metaForm);
      toast.success('Credenciales Meta Ads guardadas');
      const updated = await aiService.getMetaAdsConfig();
      setMetaInfo(updated);
      setMetaForm({ accessToken: '', adAccountId: '', appId: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const pStyle = {
    padding:    '24px 28px',
    background: isDark ? '#0f172a' : '#f8fafc',
    minHeight:  '100vh',
    color:      isDark ? '#e2e8f0' : '#1e293b',
  };

  const cardStyle = {
    background:   isDark ? '#1e293b' : '#fff',
    border:       isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #e2e8f0',
    borderRadius: 12,
    padding:      '20px 24px',
    marginBottom: 20,
  };

  const labelStyle = {
    display:      'block',
    fontSize:     12,
    fontWeight:   700,
    color:        isDark ? '#94a3b8' : '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
  };

  const inputStyle = {
    width:        '100%',
    padding:      '8px 12px',
    borderRadius: 8,
    border:       `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0'}`,
    background:   isDark ? '#0f172a' : '#f8fafc',
    color:        isDark ? '#e2e8f0' : '#1e293b',
    fontSize:     13,
    boxSizing:    'border-box',
    marginBottom: 12,
  };

  const toggleStyle = (enabled) => ({
    display:        'inline-flex',
    alignItems:     'center',
    gap:            8,
    cursor:         'pointer',
    padding:        '6px 12px',
    borderRadius:   8,
    background:     enabled ? (isDark ? 'rgba(79,70,229,0.2)' : 'rgba(79,70,229,0.08)') : (isDark ? '#1e293b' : '#f1f5f9'),
    border:         `1px solid ${enabled ? '#4F46E5' : (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0')}`,
    color:          enabled ? '#4F46E5' : (isDark ? '#64748b' : '#94a3b8'),
    fontWeight:     600,
    fontSize:       13,
    marginBottom:   12,
    userSelect:     'none',
  });

  if (loading) {
    return <div style={{ ...pStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando configuración...</div>;
  }

  return (
    <div style={pStyle}>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: isDark ? '#f1f5f9' : '#0f172a' }}>
        Configuración AI Providers
      </div>
      <div style={{ fontSize: 13, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 28 }}>
        Configurá los proveedores de AI y las credenciales de Meta Ads.
      </div>

      {/* OpenAI */}
      <div style={cardStyle}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🟢 OpenAI</div>

        <div style={toggleStyle(form.openai_enabled)} onClick={() => setForm((f) => ({ ...f, openai_enabled: !f.openai_enabled }))}>
          {form.openai_enabled ? '✓ Habilitado' : '○ Deshabilitado'}
        </div>

        <label style={labelStyle}>API Key</label>
        <input type="password" style={inputStyle} placeholder={config?.openai?.hasKey ? '••••••••••••••••' : 'sk-...'} value={form.openai_apiKey} onChange={(e) => setForm((f) => ({ ...f, openai_apiKey: e.target.value }))} />

        <label style={labelStyle}>Modelo</label>
        <select style={inputStyle} value={form.openai_model} onChange={(e) => setForm((f) => ({ ...f, openai_model: e.target.value }))}>
          {MODELS_OPENAI.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        <label style={labelStyle}>Max Tokens</label>
        <input type="number" style={inputStyle} value={form.openai_maxTokens} onChange={(e) => setForm((f) => ({ ...f, openai_maxTokens: parseInt(e.target.value, 10) }))} min={256} max={16384} />

        {config?.openai?.stats && (
          <div style={{ fontSize: 12, color: isDark ? '#64748b' : '#94a3b8', marginTop: 4 }}>
            Estado: <span style={{ color: config.openai.stats.healthStatus === 'healthy' ? '#22c55e' : '#ef4444' }}>
              {config.openai.stats.healthStatus}
            </span>
            {' '}· Requests: {config.openai.stats.totalRequests || 0}
            {' '}· Errores: {config.openai.stats.totalErrors || 0}
          </div>
        )}
      </div>

      {/* Anthropic */}
      <div style={cardStyle}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🟣 Anthropic</div>

        <div style={toggleStyle(form.anthropic_enabled)} onClick={() => setForm((f) => ({ ...f, anthropic_enabled: !f.anthropic_enabled }))}>
          {form.anthropic_enabled ? '✓ Habilitado' : '○ Deshabilitado'}
        </div>

        <label style={labelStyle}>API Key</label>
        <input type="password" style={inputStyle} placeholder={config?.anthropic?.hasKey ? '••••••••••••••••' : 'sk-ant-...'} value={form.anthropic_apiKey} onChange={(e) => setForm((f) => ({ ...f, anthropic_apiKey: e.target.value }))} />

        <label style={labelStyle}>Modelo</label>
        <select style={inputStyle} value={form.anthropic_model} onChange={(e) => setForm((f) => ({ ...f, anthropic_model: e.target.value }))}>
          {MODELS_ANTHROPIC.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        <label style={labelStyle}>Max Tokens</label>
        <input type="number" style={inputStyle} value={form.anthropic_maxTokens} onChange={(e) => setForm((f) => ({ ...f, anthropic_maxTokens: parseInt(e.target.value, 10) }))} min={256} max={16384} />
      </div>

      {/* Gemini */}
      <div style={{ ...cardStyle, borderLeft: '3px solid #1a73e8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>🔵 Google Gemini</span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#dcfce7', color: '#16a34a' }}>FREE TIER</span>
        </div>
        <div style={{ fontSize: 12, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 12 }}>
          Gemini 1.5 Flash es <b>gratuito</b> (15 req/min · 1M tokens/día). Ideal para empezar sin costo.
          Obtené tu API key en <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color: '#1a73e8' }}>aistudio.google.com/apikey</a>
        </div>

        <div style={toggleStyle(form.gemini_enabled)} onClick={() => setForm((f) => ({ ...f, gemini_enabled: !f.gemini_enabled }))}>
          {form.gemini_enabled ? '✓ Habilitado' : '○ Deshabilitado'}
        </div>

        <label style={labelStyle}>API Key</label>
        <input type="password" style={inputStyle} placeholder={config?.gemini?.hasKey ? '••••••••••••••••' : 'AIza...'} value={form.gemini_apiKey} onChange={(e) => setForm((f) => ({ ...f, gemini_apiKey: e.target.value }))} />

        <label style={labelStyle}>Modelo</label>
        <select style={inputStyle} value={form.gemini_model} onChange={(e) => setForm((f) => ({ ...f, gemini_model: e.target.value }))}>
          {MODELS_GEMINI.map((m) => (
            <option key={m} value={m}>{m}{m.includes('flash') && !m.includes('pro') ? ' (gratis)' : ''}</option>
          ))}
        </select>

        <label style={labelStyle}>Max Tokens</label>
        <input type="number" style={inputStyle} value={form.gemini_maxTokens} onChange={(e) => setForm((f) => ({ ...f, gemini_maxTokens: parseInt(e.target.value, 10) }))} min={256} max={8192} />
      </div>

      {/* Provider defaults */}
      <div style={cardStyle}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>⚙️ Configuración general</div>
        <label style={labelStyle}>Provider por defecto</label>
        <select style={inputStyle} value={form.defaultProvider} onChange={(e) => setForm((f) => ({ ...f, defaultProvider: e.target.value }))}>
          <option value="gemini">Gemini (gratuito)</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
        </select>
        <label style={labelStyle}>Provider fallback (si el primero falla)</label>
        <select style={inputStyle} value={form.fallbackProvider} onChange={(e) => setForm((f) => ({ ...f, fallbackProvider: e.target.value }))}>
          <option value="gemini">Gemini (gratuito)</option>
          <option value="anthropic">Anthropic</option>
          <option value="openai">OpenAI</option>
        </select>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{ padding: '10px 28px', borderRadius: 9, border: 'none', background: '#4F46E5', color: '#fff', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, marginBottom: 28 }}
      >
        {saving ? 'Guardando...' : 'Guardar configuración AI'}
      </button>

      {/* Meta Ads */}
      <div style={cardStyle}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>📘 Meta Ads</div>
        <div style={{ fontSize: 13, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 16 }}>
          {metaInfo?.configured ? '✅ Credenciales configuradas. Ad Account: ' + metaInfo.adAccountId : '❌ No configurado'}
        </div>
        <label style={labelStyle}>Access Token</label>
        <input type="password" style={inputStyle} placeholder="EAAxxxxxxxx..." value={metaForm.accessToken} onChange={(e) => setMetaForm((f) => ({ ...f, accessToken: e.target.value }))} />
        <label style={labelStyle}>Ad Account ID</label>
        <input type="text" style={inputStyle} placeholder="act_123456789" value={metaForm.adAccountId} onChange={(e) => setMetaForm((f) => ({ ...f, adAccountId: e.target.value }))} />
        <label style={labelStyle}>App ID (opcional)</label>
        <input type="text" style={inputStyle} placeholder="123456789" value={metaForm.appId} onChange={(e) => setMetaForm((f) => ({ ...f, appId: e.target.value }))} />
        <button
          onClick={handleSaveMeta}
          disabled={saving || !metaForm.accessToken || !metaForm.adAccountId}
          style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#1877F2', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
        >
          Guardar Meta Ads
        </button>
      </div>

      {/* Usage Stats */}
      {usage && usage.providers && usage.providers.length > 0 && (
        <div style={cardStyle}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📊 Uso (últimos 30 días)</div>
          {usage.providers.map((p) => (
            <div key={p._id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1f5f9' }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{p._id}</div>
              <div style={{ display: 'flex', gap: 20, fontSize: 13, color: isDark ? '#94a3b8' : '#64748b' }}>
                <span>Requests: <b>{p.totalRequests}</b></span>
                <span>Tokens: <b>{p.totalTokens?.toLocaleString('es-AR')}</b></span>
                <span>Costo: <b>${(p.totalCost || 0).toFixed(4)} USD</b></span>
                <span>Errores: <b>{p.failureCount || 0}</b></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIProviders;
