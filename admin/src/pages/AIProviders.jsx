import React, { useState, useEffect } from 'react';
import { useStateContext } from '../contexts/ContextProvider';
import aiService from '../services/aiService';
import { toast } from 'react-toastify';

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
        openclaw_baseUrl:   cfg.openclaw?.baseUrl   || 'http://127.0.0.1:18789',
        openclaw_model:     cfg.openclaw?.model     || 'openclaw',
        openclaw_maxTokens: cfg.openclaw?.maxTokens || 4096,
        openclaw_token:     '',
      });
      setMetaInfo(meta);
      setUsage(usageData);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        defaultProvider: 'openclaw',
        openclaw: {
          enabled:   true,
          baseUrl:   form.openclaw_baseUrl,
          model:     form.openclaw_model,
          maxTokens: form.openclaw_maxTokens,
          ...(form.openclaw_token ? { token: form.openclaw_token } : {}),
        },
      };
      await aiService.updateProviders(payload);
      toast.success('Configuración OpenClaw guardada');
      const fresh = await aiService.getProviders();
      setConfig(fresh);
      setForm((f) => ({ ...f, openclaw_token: '' }));
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


  if (loading) {
    return <div style={{ ...pStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando configuración...</div>;
  }

  return (
    <div style={pStyle}>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: isDark ? '#f1f5f9' : '#0f172a' }}>
        Configuración OpenClaw
      </div>
      <div style={{ fontSize: 13, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 28 }}>
        OpenClaw es el gateway AI local del sistema. Configurá la URL y el token de acceso.
      </div>

      {/* OpenClaw */}
      <div style={{ ...cardStyle, borderLeft: '3px solid #e11d48' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>🦞 OpenClaw Gateway</span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#fce7f3', color: '#9d174d' }}>LOCAL / SELF-HOSTED</span>
        </div>
        <div style={{ fontSize: 12, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 16 }}>
          Descargá e instalá OpenClaw en <a href="https://openclaw.ai" target="_blank" rel="noreferrer" style={{ color: '#e11d48' }}>openclaw.ai</a>.
          Expone una API OpenAI-compatible en el puerto configurado (por defecto 18789).
        </div>

        <label style={labelStyle}>URL Base del Gateway</label>
        <input
          type="text"
          style={inputStyle}
          placeholder="http://127.0.0.1:18789"
          value={form.openclaw_baseUrl || ''}
          onChange={(e) => setForm((f) => ({ ...f, openclaw_baseUrl: e.target.value }))}
        />

        <label style={labelStyle}>Token de Autenticación (opcional)</label>
        {config?.openclaw?.tokenSource === 'env' && (
          <div style={{ fontSize: 11, marginBottom: 6, padding: '4px 8px', borderRadius: 6, background: isDark ? 'rgba(234,179,8,0.1)' : '#fefce8', border: '1px solid #ca8a04', color: '#ca8a04' }}>
            ⚠ Usando token de variable de entorno. Guardá uno aquí para tomar precedencia.
          </div>
        )}
        {config?.openclaw?.tokenSource === 'db' && (
          <div style={{ fontSize: 11, marginBottom: 6, padding: '4px 8px', borderRadius: 6, background: isDark ? 'rgba(34,197,94,0.1)' : '#f0fdf4', border: '1px solid #16a34a', color: '#16a34a' }}>
            ✓ Token configurado en base de datos.
          </div>
        )}
        <input
          type="password"
          style={inputStyle}
          placeholder={config?.openclaw?.hasToken ? '••••••••••••••••' : 'Dejar vacío si el gateway no usa autenticación'}
          value={form.openclaw_token || ''}
          onChange={(e) => setForm((f) => ({ ...f, openclaw_token: e.target.value }))}
        />

        <label style={labelStyle}>Nombre del Modelo</label>
        <input
          type="text"
          style={inputStyle}
          placeholder="openclaw"
          value={form.openclaw_model || ''}
          onChange={(e) => setForm((f) => ({ ...f, openclaw_model: e.target.value }))}
        />

        <label style={labelStyle}>Max Tokens</label>
        <input
          type="number"
          style={inputStyle}
          value={form.openclaw_maxTokens || 4096}
          onChange={(e) => setForm((f) => ({ ...f, openclaw_maxTokens: parseInt(e.target.value, 10) }))}
          min={256}
          max={32768}
        />

        {config?.openclaw?.stats && (
          <div style={{ fontSize: 12, color: isDark ? '#64748b' : '#94a3b8', marginTop: 4, padding: '8px 0' }}>
            Estado: <span style={{ fontWeight: 700, color: config.openclaw.stats.healthStatus === 'healthy' ? '#22c55e' : '#ef4444' }}>
              {config.openclaw.stats.healthStatus}
            </span>
            {' '}· Requests: <b>{config.openclaw.stats.totalRequests || 0}</b>
            {' '}· Errores: <b>{config.openclaw.stats.totalErrors || 0}</b>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{ padding: '10px 28px', borderRadius: 9, border: 'none', background: '#e11d48', color: '#fff', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, marginBottom: 28 }}
      >
        {saving ? 'Guardando...' : 'Guardar configuración OpenClaw'}
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
