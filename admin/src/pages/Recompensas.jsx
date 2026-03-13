import React, { useState, useEffect, useCallback } from 'react';
import { FaTrophy, FaMedal, FaSync, FaUser, FaChevronDown, FaChevronUp, FaCog, FaChartLine, FaHome, FaHandshake, FaClipboardList, FaAward } from 'react-icons/fa';
import { useStateContext } from '../contexts/ContextProvider';
import { crmService } from '../services/crmService';

const TIER_META = {
  base: { label: 'Sin categoria', color: '#9ca3af', icon: '—' },
  rookie: { label: 'Rookie', color: '#CD7F32', icon: '🥉' },
  executive: { label: 'Executive', color: '#C0C0C0', icon: '🥈' },
  club100: { label: '100% Club', color: '#FFD700', icon: '🥇' },
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

// ── Progress bar component ──
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

// ── Tabs ──
const TABS = [
  { key: 'leaderboard', label: 'Ranking', icon: FaTrophy },
  { key: 'awards', label: 'Premios Trimestrales', icon: FaAward },
  { key: 'config', label: 'Configuracion', icon: FaCog },
];

const Recompensas = () => {
  const { currentColor, currentMode } = useStateContext();
  const isDark = currentMode === 'Dark';
  const now = new Date();
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [year, setYear] = useState(now.getFullYear());
  const [quarter, setQuarter] = useState(Math.ceil((now.getMonth() + 1) / 3));
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [awards, setAwards] = useState([]);
  const [config, setConfig] = useState(null);
  const [expandedAgent, setExpandedAgent] = useState(null);
  const [agentDash, setAgentDash] = useState({});
  const [recalculating, setRecalculating] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // ── Load leaderboard ──
  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await crmService.rewards.getLeaderboard(year, quarter);
      setLeaderboard(Array.isArray(data?.leaderboard) ? data.leaderboard : []);
    } catch (e) {
      console.error('Error loading leaderboard:', e);
    } finally {
      setLoading(false);
    }
  }, [year, quarter]);

  const loadAwards = useCallback(async () => {
    try {
      const data = await crmService.rewards.getQuarterlyAwards(year, quarter);
      setAwards(Array.isArray(data?.awards) ? data.awards : []);
    } catch (e) { console.error(e); }
  }, [year, quarter]);

  const loadConfig = useCallback(async () => {
    try {
      const data = await crmService.rewards.getConfig();
      setConfig(data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadLeaderboard(); loadAwards(); }, [loadLeaderboard, loadAwards]);
  useEffect(() => { if (activeTab === 'config') loadConfig(); }, [activeTab, loadConfig]);

  // ── Agent detail ──
  const toggleAgent = async (id) => {
    if (expandedAgent === id) { setExpandedAgent(null); return; }
    setExpandedAgent(id);
    if (!agentDash[id]) {
      try {
        const d = await crmService.rewards.getAgentDashboard(id);
        setAgentDash(prev => ({ ...prev, [id]: d }));
      } catch (e) { console.error(e); }
    }
  };

  // ── Recalculate ──
  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await crmService.rewards.recalculate({ year, quarter });
      await loadLeaderboard();
      await loadAwards();
    } catch (e) { console.error(e); } finally { setRecalculating(false); }
  };

  // ── Save config ──
  const handleSaveConfig = async () => {
    if (!config) return;
    setSavingConfig(true);
    try {
      const { captureGoals, revenueGoals, clientLoyalty, preListing, sellerTiers } = config;
      await crmService.rewards.updateConfig({ captureGoals, revenueGoals, clientLoyalty, preListing, sellerTiers });
      await loadConfig();
    } catch (e) { console.error(e); } finally { setSavingConfig(false); }
  };

  const cardCls = `rounded-2xl p-6 border ${isDark ? 'bg-secondary-dark-bg border-gray-700/50' : 'bg-white border-gray-100 shadow-sm'}`;
  const textCls = isDark ? 'text-gray-100' : 'text-gray-900';
  const subCls = isDark ? 'text-gray-400' : 'text-gray-500';

  // ── RENDER ──
  return (
    <div className={`min-h-screen px-6 lg:px-8 pt-4 pb-6 ${isDark ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${textCls}`}>
            <FaTrophy className="text-amber-500" /> Recompensas V2
          </h2>
          <p className={`text-sm mt-1 ${subCls}`}>Sistema de metas, badges, medallas y premios</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={year} onChange={e => setYear(+e.target.value)} className={`rounded-lg px-3 py-2 text-sm border ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={quarter} onChange={e => setQuarter(+e.target.value)} className={`rounded-lg px-3 py-2 text-sm border ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
            {[1, 2, 3, 4].map(q => <option key={q} value={q}>Q{q}</option>)}
          </select>
          <button onClick={handleRecalculate} disabled={recalculating} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium shadow-sm hover:shadow-md disabled:opacity-50 transition-all" style={{ backgroundColor: currentColor }}>
            <FaSync className={recalculating ? 'animate-spin' : ''} /> {recalculating ? 'Calculando...' : 'Recalcular'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${active ? 'border-current' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`} style={active ? { color: currentColor, borderColor: currentColor } : {}}>
              <Icon /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ═══ LEADERBOARD TAB ═══ */}
      {activeTab === 'leaderboard' && (
        <div>
          {/* KPI summary row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Agentes', value: leaderboard.length, icon: FaUser, color: '#6366f1' },
              { label: 'Con Pre-Listing', value: leaderboard.filter(a => a.preListingActive).length, icon: FaClipboardList, color: '#10b981' },
              { label: 'Facturacion Q' + quarter, value: fmtMoney(leaderboard.reduce((s, a) => s + (a.quarterlyRevenue || 0), 0)), icon: FaChartLine, color: '#f59e0b' },
              { label: 'Captaciones Q' + quarter, value: leaderboard.reduce((s, a) => s + (a.quarterlyCaptures || 0), 0), icon: FaHome, color: '#3b82f6' },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <div key={i} className={cardCls} style={{ borderLeft: `4px solid ${kpi.color}` }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <Icon style={{ color: kpi.color }} />
                    </div>
                    <span className={`text-xs font-semibold uppercase tracking-wide ${subCls}`}>{kpi.label}</span>
                  </div>
                  <p className={`text-2xl font-bold ${textCls}`}>{kpi.value}</p>
                </div>
              );
            })}
          </div>

          {/* Ranking list */}
          <div className={cardCls}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${textCls}`}>
              <FaTrophy style={{ color: currentColor }} /> Ranking Q{quarter} {year}
            </h3>

            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: currentColor }} /></div>
            ) : leaderboard.length === 0 ? (
              <p className={`text-center py-12 ${subCls}`}>No hay datos de agentes</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((row, idx) => {
                  const ag = row.agente;
                  const tierM = TIER_META[row.tier?.tier] || TIER_META.base;
                  const senM = SENIORITY_META[row.loyalty?.seniority] || SENIORITY_META.none;
                  const isOpen = expandedAgent === ag._id;
                  const dash = agentDash[ag._id];

                  return (
                    <div key={ag._id} className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors" onClick={() => toggleAgent(ag._id)}>
                        {/* Position */}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-700' : 'bg-gray-300'}`}>{idx + 1}</div>
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {ag.avatar ? <img src={ag.avatar} alt="" className="w-full h-full object-cover" /> : <FaUser className="text-gray-400" />}
                        </div>
                        {/* Name + badges */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-semibold truncate ${textCls}`}>{ag.nombre}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: tierM.color }}>{tierM.icon} {tierM.label}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: senM.color }}>{senM.label}</span>
                            {row.preListingActive && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500 text-white">Pre-Listing</span>}
                          </div>
                        </div>
                        {/* Revenue */}
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm font-bold ${textCls}`}>{fmtMoney(row.quarterlyRevenue)}</p>
                          <p className={`text-xs ${subCls}`}>Q{quarter}</p>
                        </div>
                        <div className="text-right flex-shrink-0 hidden md:block">
                          <p className={`text-sm font-bold ${textCls}`}>{fmtMoney(row.annualRevenue)}</p>
                          <p className={`text-xs ${subCls}`}>Anual</p>
                        </div>
                        <div className="text-right flex-shrink-0 hidden md:block">
                          <p className={`text-sm font-bold ${textCls}`}>{row.quarterlyCaptures || 0}</p>
                          <p className={`text-xs ${subCls}`}>Captaciones</p>
                        </div>
                        <div className={subCls}>{isOpen ? <FaChevronUp /> : <FaChevronDown />}</div>
                      </div>

                      {/* ── Expanded agent detail ── */}
                      {isOpen && dash && (
                        <div className={`border-t p-5 ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Capture goals */}
                            <div>
                              <h5 className={`font-semibold text-sm mb-3 flex items-center gap-2 ${textCls}`}><FaHome className="text-blue-500" /> Metas de Captacion</h5>
                              <ProgressBar value={dash.captures?.monthly?.count || 0} max={dash.captures?.monthly?.target || 2} color="#3b82f6" label="Mensual" isDark={isDark} />
                              <ProgressBar value={dash.captures?.quarterly?.count || 0} max={dash.captures?.quarterly?.target || 6} color="#6366f1" label="Trimestral" isDark={isDark} />
                              <ProgressBar value={dash.captures?.annual?.count || 0} max={dash.captures?.annual?.target || 24} color="#8b5cf6" label="Anual" isDark={isDark} />
                            </div>
                            {/* Revenue goals */}
                            <div>
                              <h5 className={`font-semibold text-sm mb-3 flex items-center gap-2 ${textCls}`}><FaChartLine className="text-amber-500" /> Metas de Facturacion</h5>
                              <ProgressBar value={dash.revenue?.quarterly?.total || 0} max={dash.revenue?.quarterly?.target || 6000} color="#f59e0b" label={`Trimestral (${fmtMoney(dash.revenue?.quarterly?.total)})`} isDark={isDark} />
                              <ProgressBar value={dash.revenue?.annual?.total || 0} max={dash.revenue?.annual?.target || 24000} color="#d97706" label={`Anual (${fmtMoney(dash.revenue?.annual?.total)})`} isDark={isDark} />
                            </div>
                            {/* Loyalty + Tier */}
                            <div>
                              <h5 className={`font-semibold text-sm mb-3 flex items-center gap-2 ${textCls}`}><FaHandshake className="text-emerald-500" /> Fidelizacion & Tier</h5>
                              <div className={`text-sm mb-2 ${subCls}`}>Clientes cerrados: <span className="font-bold">{dash.loyalty?.closedCount || 0}</span></div>
                              <div className={`text-sm mb-2 ${subCls}`}>Clientes fidelizados: <span className="font-bold">{dash.loyalty?.loyalCount || 0}</span></div>
                              <div className={`text-sm mb-2 ${subCls}`}>Seniority: <span className="font-bold capitalize">{dash.loyalty?.seniority?.replace('_', ' ') || 'N/A'}</span></div>
                              <div className={`text-sm mb-2 ${subCls}`}>Tier anual: <span className="font-bold">{(TIER_META[dash.tier?.tier] || TIER_META.base).icon} {(TIER_META[dash.tier?.tier] || TIER_META.base).label}</span></div>
                              <div className={`text-sm ${subCls}`}>Facturado anual: <span className="font-bold">{fmtMoney(dash.tier?.totalRevenue)}</span></div>
                              {dash.tier?.prize && <div className="mt-2 text-sm font-semibold text-amber-500">Premio: {dash.tier.prize}</div>}
                            </div>
                          </div>
                          {/* Pre-listing */}
                          <div className="mt-5 pt-4 border-t dark:border-gray-600">
                            <h5 className={`font-semibold text-sm mb-2 flex items-center gap-2 ${textCls}`}><FaClipboardList className="text-teal-500" /> Pre-Listing Badge</h5>
                            <div className={`text-sm ${subCls}`}>
                              Estado: <span className={`font-bold ${dash.preListing?.active ? 'text-emerald-500' : 'text-red-400'}`}>{dash.preListing?.active ? 'ACTIVO' : 'INACTIVO'}</span>
                              {' | '}Entrevistas esta semana: <span className="font-bold">{dash.preListing?.weekCount || 0}</span> / {dash.preListing?.weeklyMin || 5}
                            </div>
                          </div>
                        </div>
                      )}
                      {isOpen && !dash && (
                        <div className="p-4 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: currentColor }} /></div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ QUARTERLY AWARDS TAB ═══ */}
      {activeTab === 'awards' && (
        <div className={cardCls}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${textCls}`}><FaAward className="text-amber-500" /> Premios Q{quarter} {year}</h3>
          {awards.length === 0 ? (
            <p className={`text-center py-8 ${subCls}`}>No hay premios calculados para este trimestre. Presiona "Recalcular".</p>
          ) : (
            <div className="space-y-3">
              {awards.map((aw, i) => {
                const agName = aw.agenteId?.nombre || aw.nombre || 'Agente';
                return (
                  <div key={aw._id || i} className={`flex items-center gap-4 p-4 rounded-xl ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : 'bg-gray-300'}`}>{aw.ranking}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${textCls}`}>{agName}</p>
                      <p className={`text-sm ${subCls}`}>Facturado: {fmtMoney(aw.totalRevenue)} | Operaciones: {aw.operacionIds?.length || 0}</p>
                    </div>
                    {aw.prize && <span className="text-sm font-semibold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full">{aw.prize}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ CONFIG TAB ═══ */}
      {activeTab === 'config' && config && (
        <div className="space-y-6">
          {/* Capture Goals Config */}
          <div className={cardCls}>
            <h3 className={`font-semibold mb-4 ${textCls}`}>Metas de Captacion</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'monthlyTarget', label: 'Meta Mensual' },
                { key: 'quarterlyTarget', label: 'Meta Trimestral' },
                { key: 'annualTarget', label: 'Meta Anual' },
                { key: 'minExclusivityDays', label: 'Dias min. exclusividad' },
              ].map(f => (
                <div key={f.key}>
                  <label className={`block text-xs font-medium mb-1 ${subCls}`}>{f.label}</label>
                  <input type="number" value={config.captureGoals?.[f.key] ?? ''} onChange={e => setConfig(prev => ({ ...prev, captureGoals: { ...prev.captureGoals, [f.key]: +e.target.value } }))} className={`w-full rounded-lg px-3 py-2 border text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Goals Config */}
          <div className={cardCls}>
            <h3 className={`font-semibold mb-4 ${textCls}`}>Metas de Facturacion</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${subCls}`}>Meta Anual (USD)</label>
                <input type="number" value={config.revenueGoals?.annualTarget ?? ''} onChange={e => setConfig(prev => ({ ...prev, revenueGoals: { ...prev.revenueGoals, annualTarget: +e.target.value } }))} className={`w-full rounded-lg px-3 py-2 border text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${subCls}`}>Meta Trimestral (USD)</label>
                <input type="number" value={config.revenueGoals?.quarterlyTarget ?? ''} onChange={e => setConfig(prev => ({ ...prev, revenueGoals: { ...prev.revenueGoals, quarterlyTarget: +e.target.value } }))} className={`w-full rounded-lg px-3 py-2 border text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${subCls}`}>Premio 1er lugar</label>
                <input type="text" value={config.revenueGoals?.quarterlyPrizes?.first ?? ''} onChange={e => setConfig(prev => ({ ...prev, revenueGoals: { ...prev.revenueGoals, quarterlyPrizes: { ...prev.revenueGoals?.quarterlyPrizes, first: e.target.value } } }))} className={`w-full rounded-lg px-3 py-2 border text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${subCls}`}>Premio 2do lugar</label>
                <input type="text" value={config.revenueGoals?.quarterlyPrizes?.second ?? ''} onChange={e => setConfig(prev => ({ ...prev, revenueGoals: { ...prev.revenueGoals, quarterlyPrizes: { ...prev.revenueGoals?.quarterlyPrizes, second: e.target.value } } }))} className={`w-full rounded-lg px-3 py-2 border text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
              </div>
            </div>
          </div>

          {/* Seller Tiers Config */}
          <div className={cardCls}>
            <h3 className={`font-semibold mb-4 ${textCls}`}>Categorias de Vendedor (Tiers Anuales)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['rookie', 'executive', 'club100'].map(t => (
                <div key={t} className={`p-4 rounded-xl border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                  <p className="font-semibold mb-2 capitalize" style={{ color: TIER_META[t].color }}>{TIER_META[t].icon} {TIER_META[t].label}</p>
                  <label className={`block text-xs mb-1 ${subCls}`}>Facturacion minima (USD)</label>
                  <input type="number" value={config.sellerTiers?.[t]?.minRevenue ?? ''} onChange={e => setConfig(prev => ({ ...prev, sellerTiers: { ...prev.sellerTiers, [t]: { ...prev.sellerTiers?.[t], minRevenue: +e.target.value } } }))} className={`w-full rounded-lg px-3 py-2 border text-sm mb-2 ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                  {t === 'club100' && (
                    <>
                      <label className={`block text-xs mb-1 ${subCls}`}>Premio</label>
                      <input type="text" value={config.sellerTiers?.club100?.prize ?? ''} onChange={e => setConfig(prev => ({ ...prev, sellerTiers: { ...prev.sellerTiers, club100: { ...prev.sellerTiers?.club100, prize: e.target.value } } }))} className={`w-full rounded-lg px-3 py-2 border text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Client Loyalty Config */}
          <div className={cardCls}>
            <h3 className={`font-semibold mb-4 ${textCls}`}>Fidelizacion de Clientes</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { key: 'juniorMin', label: 'Min Junior' },
                { key: 'semiSeniorMin', label: 'Min Semi-Senior' },
                { key: 'seniorMin', label: 'Min Senior' },
              ].map(f => (
                <div key={f.key}>
                  <label className={`block text-xs font-medium mb-1 ${subCls}`}>{f.label}</label>
                  <input type="number" value={config.clientLoyalty?.[f.key] ?? ''} onChange={e => setConfig(prev => ({ ...prev, clientLoyalty: { ...prev.clientLoyalty, [f.key]: +e.target.value } }))} className={`w-full rounded-lg px-3 py-2 border text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Pre-Listing Config */}
          <div className={cardCls}>
            <h3 className={`font-semibold mb-4 ${textCls}`}>Pre-Listing Badge</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${subCls}`}>Minimo semanal</label>
                <input type="number" value={config.preListing?.weeklyMinimum ?? ''} onChange={e => setConfig(prev => ({ ...prev, preListing: { ...prev.preListing, weeklyMinimum: +e.target.value } }))} className={`w-full rounded-lg px-3 py-2 border text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${subCls}`}>Premio por badge</label>
                <input type="text" value={config.preListing?.badgeReward ?? ''} onChange={e => setConfig(prev => ({ ...prev, preListing: { ...prev.preListing, badgeReward: e.target.value } }))} className={`w-full rounded-lg px-3 py-2 border text-sm ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button onClick={handleSaveConfig} disabled={savingConfig} className="px-6 py-2.5 rounded-xl text-white font-medium shadow-sm hover:shadow-md disabled:opacity-50 transition-all" style={{ backgroundColor: currentColor }}>
              {savingConfig ? 'Guardando...' : 'Guardar Configuracion'}
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className={`mt-6 p-5 ${cardCls}`}>
        <h4 className={`font-semibold text-sm mb-3 ${textCls}`}>Leyenda del Sistema</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className={`font-medium mb-1 ${textCls}`}>🏠 Captaciones</p>
            <p className={subCls}>Propiedades exclusivas >= 90 dias</p>
          </div>
          <div>
            <p className={`font-medium mb-1 ${textCls}`}>💰 Facturacion</p>
            <p className={subCls}>Comisiones cobradas por trimestre/anual</p>
          </div>
          <div>
            <p className={`font-medium mb-1 ${textCls}`}>🥇🥈🥉 Tiers Anuales</p>
            <p className={subCls}>Rookie / Executive / 100% Club</p>
          </div>
          <div>
            <p className={`font-medium mb-1 ${textCls}`}>📋 Pre-Listing</p>
            <p className={subCls}>5+ entrevistas/semana = badge activo</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recompensas;
