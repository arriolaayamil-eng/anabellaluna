/**
 * Design Tokens — Unified visual system based on DashboardEjecutivo.
 * Import { useDesignTokens } in any page to get consistent classes.
 *
 * Usage:
 *   const { isDark, pageClass, cardClass, sectionTitle, kpiCard, actionBtn, ... } = useDesignTokens();
 */

import { useStateContext } from '../contexts/ContextProvider';

export function useDesignTokens() {
  const { currentMode, currentColor } = useStateContext();
  const isDark = currentMode === 'Dark';

  // ── Page container ──
  const pageClass = `min-h-screen px-6 lg:px-8 pt-4 pb-6 ${isDark ? 'bg-main-dark-bg' : 'bg-gray-50'}`;

  // ── Card ──
  const cardClass = `rounded-2xl p-6 border transition-shadow ${isDark ? 'bg-secondary-dark-bg border-gray-700/50 hover:border-indigo-500/30' : 'bg-white border-gray-100 shadow-md hover:shadow-lg'}`;

  // ── Small card (for mini-metrics) ──
  const cardSmall = `rounded-2xl p-4 border transition-all ${isDark ? 'bg-secondary-dark-bg border-gray-700/50 hover:border-indigo-500/30' : 'bg-white border-gray-100 shadow-md hover:shadow-lg'}`;

  // ── Chart color palette ──
  const chartColors = {
    primary: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899',
    cyan: '#06b6d4',
    text: isDark ? '#e5e7eb' : '#374151',
    subtext: isDark ? '#9ca3af' : '#6b7280',
    grid: isDark ? '#374151' : '#e5e7eb',
  };

  // ── Typography classes ──
  const text = {
    heading: `text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`,
    subheading: `text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`,
    value: `text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`,
    valueLg: `text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`,
    label: `text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`,
    muted: `text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`,
    body: `text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`,
  };

  // ── Action button presets ──
  const actionBtn = {
    primary: 'flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all shadow-sm hover:shadow-md',
    secondary: `flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-all ${isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`,
    danger: 'flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium bg-red-500 hover:bg-red-600 transition-all',
  };

  // ── Badge / Trend chip ──
  const trendBadge = (positive = true) =>
    `inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${positive ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30' : 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30'}`;

  // ── Status badge ──
  const statusBadge = (variant = 'default') => {
    const map = {
      success: `text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/30`,
      warning: `text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-900/30`,
      danger: `text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-900/30`,
      info: `text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30`,
      purple: `text-purple-700 bg-purple-50 dark:text-purple-300 dark:bg-purple-900/30`,
      default: `text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-700`,
    };
    return `px-2.5 py-0.5 rounded-full text-xs font-medium ${map[variant] || map.default}`;
  };

  // ── List row (for activity feed, agent rows, etc.) ──
  const listRow = `p-3 rounded-xl ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`;

  // ── Form input ──
  const inputClass = `w-full px-4 py-2.5 rounded-xl border text-sm transition-colors ${isDark ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500 focus:border-indigo-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500'} focus:outline-none focus:ring-2 focus:ring-indigo-500/20`;

  // ── Select ──
  const selectClass = inputClass;

  // ── Modal overlay & container ──
  const modalOverlay = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
  const modalContainer = (maxWidth = 'max-w-3xl') =>
    `${isDark ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl ${maxWidth} w-full max-h-[90vh] overflow-hidden flex flex-col`;

  // ── Modal header (gradient) ──
  const modalHeader = (gradientFrom, gradientTo) =>
    `sticky top-0 bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white p-6 rounded-t-2xl flex justify-between items-center`;

  // ── Tooltip for charts ──
  const chartTooltipTheme = isDark ? 'dark' : 'light';

  // ── Common chart axis label style ──
  const axisLabelStyle = { colors: chartColors.subtext, fontSize: '11px' };

  return {
    isDark,
    currentColor,
    currentMode,
    pageClass,
    cardClass,
    cardSmall,
    chartColors,
    text,
    actionBtn,
    trendBadge,
    statusBadge,
    listRow,
    inputClass,
    selectClass,
    modalOverlay,
    modalContainer,
    modalHeader,
    chartTooltipTheme,
    axisLabelStyle,
  };
}
