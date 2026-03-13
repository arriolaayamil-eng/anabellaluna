import React, { useState, useEffect, useCallback } from 'react';
import { FaTrophy, FaMedal, FaSync, FaChartLine, FaHome, FaClipboardList, FaAward, FaUser, FaPlus, FaHistory } from 'react-icons/fa';
import { useStateContext } from '../contexts/ContextProvider';
import { crmService } from '../services/crmService';

const TIER_META = {
  base: { label: 'Sin categoria', color: '#9ca3af', icon: '—', bg: 'from-gray-400 to-gray-500' },
  rookie: { label: 'Rookie', color: '#CD7F32', icon: '🥉', bg: 'from-amber-600 to-amber-800' },
  executive: { label: 'Executive', color: '#C0C0C0', icon: '🥈', bg: 'from-gray-300 to-gray-500' },
  club100: { label: '100% Club', color: '#FFD700', icon: '🥇', bg: 'from-yellow-400 to-amber-600' },
};

const SENIORITY_META = {
  none: { label: 'N/A', color: '#9ca3af' },
  junior: { label: 'Junior', color: '#84CC16' },
  semi_senior: { label: 'Semi-Senior', color: '#22C55E' },
  senior: { label: 'Senior', color: '#15803D' },
};

function pct(value, target) {
  if (!target) return 0;
  return Math.min(100, Math.round((value / target) * 100));
}

function fmtMoney(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
}

const ProgressBar = ({ value, max, color, label, isDark }) => {
  const p = pct(value, max);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{label}</span>
        <span className="font-semibold" style={{ color }}>{value}/{max} ({p}%)</span>
      </div>
      <div className={`w-full h-2.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
        <div className="h-2.5 rounded-full transition-all duration-500" style={{ width: `${p}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};

const TABS = [
  { key: 'dashboard', label: 'Mi Panel', icon: FaChartLine },
  { key: 'leaderboard', label: 'Ranking', icon: FaTrophy },
  { key: 'prelisting', label: 'Pre-Listing', icon: FaClipboardList },
  { key: 'history', label: 'Historial', icon: FaHistory },
];

const Recompensas = () => {
  const { currentColor, currentMode } = useStateContext();
  const isDark = currentMode === 'Dark';
  const now = new Date();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [preListings, setPreListings] = useState([]);
  const [tierHistory, setTierHistory] = useState([]);
  const [badgeHistory, setBadgeHistory] = useState([]);
  const [year] = useState(now.getFullYear());
  const [quarter] = useState(Math.ceil((now.getMonth() + 1) / 3));
  // Pre-listing form
  const [plForm, setPlForm] = useState({ clienteId: '', tipo: 'comprador', fecha: new Date().toISOString().slice(0, 10), observaciones: '' });
  const [plSaving, setPlSaving] = useState(false);
  const [clients, setClients] = useState([]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await crmService.rewards.getDashboard();
      setDash(data);
    } catch (e) { console.error('Dashboard error:', e); } finally { setLoading(false); }
  }, []);

  const loadLeaderboard = useCallback(async () => {
    try {
      const data = await crmService.rewards.getLeaderboard(year, quarter);
      setLeaderboard(Array.isArray(data?.leaderboard) ? data.leaderboard : []);
    } catch (e) { console.error(e); }
  }, [year, quarter]);

  const loadPreListings = useCallback(async () => {
    try {
      const data = await crmService.rewards.getPreListings(50);
      setPreListings(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const [tiers, badges] = await Promise.all([
        crmService.rewards.getTierHistory(),
        crmService.rewards.getBadgeHistory(),
      ]);
      setTierHistory(Array.isArray(tiers) ? tiers : []);
      setBadgeHistory(Array.isArray(badges) ? badges : []);
    } catch (e) { console.error(e); }
  }, []);

  const loadClients = useCallback(async () => {
    try {
      const data = await crmService.clientes.getAll();
      setClients(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useEffect(() => { if (activeTab === 'leaderboard') loadLeaderboard(); }, [activeTab, loadLeaderboard]);
  useEffect(() => { if (activeTab === 'prelisting') { loadPreListings(); loadClients(); } }, [activeTab, loadPreListings, loadClients]);
  useEffect(() => { if (activeTab === 'history') loadHistory(); }, [activeTab, loadHistory]);

  const handleCreatePreListing = async (e) => {
    e.preventDefault();
    if (!plForm.clienteId) return;
    setPlSaving(true);
    try {
      await crmService.rewards.createPreListing(plForm);
      setPlForm({ clienteId: '', tipo: 'comprador', fecha: new Date().toISOString().slice(0, 10), observaciones: '' });
      await loadPreListings();
    } catch (err) { console.error(err); } finally { setPlSaving(false); }
  };

  const cardCls = `rounded-2xl p-6 border ${isDark ? 'bg-secondary-dark-bg border-gray-700/50' : 'bg-white border-gray-100 shadow-sm'}`;
  const textCls = isDark ? 'text-gray-100' : 'text-gray-900';
  const subCls = isDark ? 'text-gray-400' : 'text-gray-500';

  const tierM = TIER_META[dash?.tier?.tier] || TIER_META.base;
  const senM = SENIORITY_META[dash?.loyalty?.seniority] || SENIORITY_META.none;

  return (
    <div className={`min-h-screen px-6 lg:px-8 pt-4 pb-6 ${isDark ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${textCls}`}><FaTrophy className="text-amber-500" /> Mis Recompensas</h2>
          <p className={`text-sm mt-1 ${subCls}`}>Metas, badges, medallas y premios</p>
        </div>
        <button onClick={loadDashboard} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium shadow-sm hover:shadow-md disabled:opacity-50 transition-all" style={{ backgroundColor: currentColor }}>
          <FaSync className={loading ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${active ? 'border-current' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`} style={active ? { color: currentColor, borderColor: currentColor } : {}}>
              <Icon /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ═══ DASHBOARD TAB ═══ */}
      {activeTab === 'dashboard' && (
        loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: currentColor }} /></div>
        ) : dash ? (
          <div className="space-y-6">
            {/* Tier + Pre-Listing hero */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tier card */}
              <div className={`rounded-2xl p-6 bg-gradient-to-br ${tierM.bg} text-white relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top,_white,_transparent_60%)]" />
                <div className="relative">
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Mi Categoria Anual</p>
                  <p className="text-4xl font-extrabold mt-2">{tierM.icon} {tierM.label}</p>
                  <p className="text-sm mt-2 opacity-90">Facturado: {fmtMoney(dash.tier?.totalRevenue)}</p>
                  {dash.tier?.prize && <p className="mt-2 text-sm font-semibold bg-white/20 rounded-lg px-3 py-1 inline-block">Premio: {dash.tier.prize}</p>}
                </div>
              </div>

              {/* Seniority card */}
              <div className={cardCls} style={{ borderLeft: `4px solid ${senM.color}` }}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${subCls}`}>Fidelizacion</p>
                <p className={`text-3xl font-extrabold mt-2 ${textCls}`}>{dash.loyalty?.totalCount || 0}</p>
                <p className={`text-sm mt-1 ${subCls}`}>Clientes cerrados + fidelizados</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: senM.color }}>{senM.label}</span>
                  <span className={`text-xs ${subCls}`}>{dash.loyalty?.closedCount || 0} cerrados / {dash.loyalty?.loyalCount || 0} fidelizados</span>
                </div>
              </div>

              {/* Pre-Listing badge */}
              <div className={cardCls} style={{ borderLeft: `4px solid ${dash.preListing?.active ? '#10b981' : '#ef4444'}` }}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${subCls}`}>Pre-Listing Badge</p>
                <p className={`text-3xl font-extrabold mt-2 ${dash.preListing?.active ? 'text-emerald-500' : 'text-red-400'}`}>
                  {dash.preListing?.active ? 'ACTIVO' : 'INACTIVO'}
                </p>
                <p className={`text-sm mt-1 ${subCls}`}>Entrevistas esta semana: {dash.preListing?.weekCount || 0} / {dash.preListing?.weeklyMin || 5}</p>
                <div className="mt-3">
                  <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct(dash.preListing?.weekCount || 0, dash.preListing?.weeklyMin || 5)}%`, backgroundColor: dash.preListing?.active ? '#10b981' : '#ef4444' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Goals section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Capture Goals */}
              <div className={cardCls}>
                <h3 className={`font-semibold mb-4 flex items-center gap-2 ${textCls}`}><FaHome className="text-blue-500" /> Metas de Captacion</h3>
                <ProgressBar value={dash.captures?.monthly?.count || 0} max={dash.captures?.monthly?.target || 2} color="#3b82f6" label="Mensual" isDark={isDark} />
                <ProgressBar value={dash.captures?.quarterly?.count || 0} max={dash.captures?.quarterly?.target || 6} color="#6366f1" label="Trimestral" isDark={isDark} />
                <ProgressBar value={dash.captures?.annual?.count || 0} max={dash.captures?.annual?.target || 24} color="#8b5cf6" label="Anual" isDark={isDark} />
                <p className={`text-xs mt-2 ${subCls}`}>Propiedades exclusivas >= {dash.config?.captureGoals?.minExclusivityDays || 90} dias</p>
              </div>

              {/* Revenue Goals */}
              <div className={cardCls}>
                <h3 className={`font-semibold mb-4 flex items-center gap-2 ${textCls}`}><FaChartLine className="text-amber-500" /> Metas de Facturacion</h3>
                <ProgressBar value={dash.revenue?.quarterly?.total || 0} max={dash.revenue?.quarterly?.target || 6000} color="#f59e0b" label={`Trimestral (${fmtMoney(dash.revenue?.quarterly?.total)})`} isDark={isDark} />
                <ProgressBar value={dash.revenue?.annual?.total || 0} max={dash.revenue?.annual?.target || 24000} color="#d97706" label={`Anual (${fmtMoney(dash.revenue?.annual?.total)})`} isDark={isDark} />
                <p className={`text-xs mt-2 ${subCls}`}>Comisiones cobradas en operaciones cerradas</p>
              </div>
            </div>

            {/* Awards */}
            {dash.awards?.length > 0 && (
              <div className={cardCls}>
                <h3 className={`font-semibold mb-4 flex items-center gap-2 ${textCls}`}><FaAward className="text-amber-500" /> Mis Premios Trimestrales</h3>
                <div className="space-y-2">
                  {dash.awards.map((aw, i) => (
                    <div key={aw._id || i} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${aw.ranking === 1 ? 'bg-yellow-500' : aw.ranking === 2 ? 'bg-gray-400' : 'bg-gray-300'}`}>{aw.ranking}</div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${textCls}`}>Q{aw.quarter} {aw.year} - Puesto #{aw.ranking}</p>
                        <p className={`text-xs ${subCls}`}>{fmtMoney(aw.totalRevenue)} facturado</p>
                      </div>
                      {aw.prize && <span className="text-xs font-semibold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full">{aw.prize}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tier targets info */}
            <div className={`p-5 ${cardCls}`}>
              <h4 className={`font-semibold text-sm mb-3 ${textCls}`}>Categorias de Vendedor (Anuales)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {['rookie', 'executive', 'club100'].map(t => {
                  const m = TIER_META[t];
                  const cfg = dash.config?.sellerTiers?.[t];
                  return (
                    <div key={t} className={`p-3 rounded-xl border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                      <p className="font-semibold mb-1" style={{ color: m.color }}>{m.icon} {m.label}</p>
                      <p className={subCls}>Min: {fmtMoney(cfg?.minRevenue)} facturado/anual</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <p className={`text-center py-12 ${subCls}`}>No se pudieron cargar los datos</p>
        )
      )}

      {/* ═══ LEADERBOARD TAB ═══ */}
      {activeTab === 'leaderboard' && (
        <div className={cardCls}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${textCls}`}><FaTrophy style={{ color: currentColor }} /> Ranking Q{quarter} {year}</h3>
          {leaderboard.length === 0 ? (
            <p className={`text-center py-8 ${subCls}`}>No hay datos de ranking</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((row, idx) => {
                const ag = row.agente;
                const tm = TIER_META[row.tier?.tier] || TIER_META.base;
                return (
                  <div key={ag._id} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-700' : 'bg-gray-300'}`}>{idx + 1}</div>
                    <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {ag.avatar ? <img src={ag.avatar} alt="" className="w-full h-full object-cover" /> : <FaUser className="text-gray-400 text-sm" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold text-sm truncate ${textCls}`}>{ag.nombre}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: tm.color }}>{tm.icon}</span>
                        {row.preListingActive && <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500 text-white">PL</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${textCls}`}>{fmtMoney(row.quarterlyRevenue)}</p>
                      <p className={`text-xs ${subCls}`}>{row.quarterlyCaptures || 0} capt.</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ PRE-LISTING TAB ═══ */}
      {activeTab === 'prelisting' && (
        <div className="space-y-6">
          {/* Create form */}
          <div className={cardCls}>
            <h3 className={`font-semibold mb-4 flex items-center gap-2 ${textCls}`}><FaPlus className="text-teal-500" /> Registrar Entrevista</h3>
            <form onSubmit={handleCreatePreListing} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${subCls}`}>Cliente</label>
                <select value={plForm.clienteId} onChange={e => setPlForm(p => ({ ...p, clienteId: e.target.value }))} required className={`w-full rounded-lg px-3 py-2 border text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  <option value="">Seleccionar...</option>
                  {clients.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${subCls}`}>Tipo</label>
                <select value={plForm.tipo} onChange={e => setPlForm(p => ({ ...p, tipo: e.target.value }))} className={`w-full rounded-lg px-3 py-2 border text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  <option value="comprador">Comprador</option>
                  <option value="vendedor">Vendedor</option>
                </select>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${subCls}`}>Fecha</label>
                <input type="date" value={plForm.fecha} onChange={e => setPlForm(p => ({ ...p, fecha: e.target.value }))} className={`w-full rounded-lg px-3 py-2 border text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
              </div>
              <div className="flex items-end">
                <button type="submit" disabled={plSaving} className="w-full px-4 py-2 rounded-xl text-white text-sm font-medium shadow-sm hover:shadow-md disabled:opacity-50 transition-all" style={{ backgroundColor: currentColor }}>
                  {plSaving ? 'Guardando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>

          {/* Pre-listing list */}
          <div className={cardCls}>
            <h3 className={`font-semibold mb-4 flex items-center gap-2 ${textCls}`}><FaClipboardList className="text-teal-500" /> Mis Entrevistas</h3>
            {preListings.length === 0 ? (
              <p className={`text-center py-6 ${subCls}`}>No hay entrevistas registradas</p>
            ) : (
              <div className="space-y-2">
                {preListings.map((pl) => (
                  <div key={pl._id} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${pl.tipo === 'comprador' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                      {pl.tipo === 'comprador' ? 'C' : 'V'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${textCls}`}>{pl.clienteId?.nombre || 'Cliente'}</p>
                      <p className={`text-xs ${subCls}`}>{pl.tipo} - {new Date(pl.fecha).toLocaleDateString('es-AR')}</p>
                    </div>
                    {pl.observaciones && <p className={`text-xs max-w-[200px] truncate ${subCls}`}>{pl.observaciones}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ HISTORY TAB ═══ */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Tier history */}
          <div className={cardCls}>
            <h3 className={`font-semibold mb-4 flex items-center gap-2 ${textCls}`}><FaMedal className="text-amber-500" /> Historial de Categorias</h3>
            {tierHistory.length === 0 ? (
              <p className={`text-center py-6 ${subCls}`}>Sin historial de categorias</p>
            ) : (
              <div className="space-y-2">
                {tierHistory.map((th) => {
                  const tm = TIER_META[th.tier] || TIER_META.base;
                  return (
                    <div key={th._id} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                      <span className="text-2xl">{tm.icon}</span>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${textCls}`}>{th.year} - {tm.label} ({th.medal})</p>
                        <p className={`text-xs ${subCls}`}>{fmtMoney(th.totalRevenue)} facturado</p>
                      </div>
                      {th.prize && <span className="text-xs font-semibold text-amber-500">{th.prize}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Badge history */}
          <div className={cardCls}>
            <h3 className={`font-semibold mb-4 flex items-center gap-2 ${textCls}`}><FaAward className="text-teal-500" /> Historial de Badges</h3>
            {badgeHistory.length === 0 ? (
              <p className={`text-center py-6 ${subCls}`}>Sin historial de badges</p>
            ) : (
              <div className="space-y-2">
                {badgeHistory.map((bh) => (
                  <div key={bh._id} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${bh.status === 'active' ? 'bg-emerald-500' : 'bg-red-400'}`}>
                      {bh.status === 'active' ? 'A' : 'I'}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold capitalize ${textCls}`}>{bh.badgeType?.replace('_', ' ')}</p>
                      <p className={`text-xs ${subCls}`}>
                        {bh.status === 'active' ? 'Activo' : bh.status === 'inactive' ? 'Inactivo' : bh.status}
                        {bh.evidence && ` | ${bh.evidence.count}/${bh.evidence.required} entrevistas`}
                      </p>
                    </div>
                    <span className={`text-xs ${subCls}`}>{new Date(bh.createdAt).toLocaleDateString('es-AR')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className={`mt-6 p-5 ${cardCls}`}>
        <h4 className={`font-semibold text-sm mb-3 ${textCls}`}>Como ganar recompensas</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className={`font-medium mb-1 ${textCls}`}>🏠 Captaciones</p>
            <p className={subCls}>Capta propiedades exclusivas >= 90 dias</p>
          </div>
          <div>
            <p className={`font-medium mb-1 ${textCls}`}>💰 Facturacion</p>
            <p className={subCls}>Cobra comisiones para subir de categoria</p>
          </div>
          <div>
            <p className={`font-medium mb-1 ${textCls}`}>📋 Pre-Listing</p>
            <p className={subCls}>5+ entrevistas por semana = badge activo</p>
          </div>
          <div>
            <p className={`font-medium mb-1 ${textCls}`}>🤝 Fidelizacion</p>
            <p className={subCls}>Cierra y fideliza clientes para subir nivel</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recompensas;
