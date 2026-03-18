import React from 'react';

/* ═══════════════════ SVG Icon base ═══════════════════ */
const SFIcon = ({ children, size = 20, className = '', viewBox = '0 0 24 24', ...rest }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox={viewBox}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...rest}
  >{children}
  </svg>
);

export const IFolder = (p) => <SFIcon {...p}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></SFIcon>;
export const IImage = (p) => <SFIcon {...p}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></SFIcon>;
export const IUpload = (p) => <SFIcon {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></SFIcon>;
export const ITrash = (p) => <SFIcon {...p}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></SFIcon>;
export const IDownload = (p) => <SFIcon {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></SFIcon>;
export const ICheck = (p) => <SFIcon {...p}><polyline points="20 6 9 17 4 12" /></SFIcon>;
export const IChevron = (p) => <SFIcon size={16} {...p}><polyline points="9 18 15 12 9 6" /></SFIcon>;
export const IChevronLeft = (p) => <SFIcon size={16} {...p}><polyline points="15 18 9 12 15 6" /></SFIcon>;
export const ISearch = (p) => <SFIcon {...p}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></SFIcon>;
export const IDroplet = (p) => <SFIcon {...p}><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" /></SFIcon>;
export const IRotate = (p) => <SFIcon {...p}><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></SFIcon>;
export const IZoom = (p) => <SFIcon {...p}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></SFIcon>;
export const IGrid = (p) => <SFIcon {...p}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></SFIcon>;
export const ISave = (p) => <SFIcon {...p}><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></SFIcon>;
export const IHistory = (p) => <SFIcon {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></SFIcon>;
export const ILayers = (p) => <SFIcon {...p}><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></SFIcon>;
export const ICrop = (p) => <SFIcon {...p}><path d="M6 2v14a2 2 0 002 2h14" /><path d="M18 22V8a2 2 0 00-2-2H2" /></SFIcon>;

/* ═══════════════════ Theme palettes ═══════════════════ */
export const THEME = {
  light: {
    bg: '#F2F2F7',
    card: '#FFFFFF',
    cardAlt: '#F9FAFB',
    border: 'rgba(60,60,67,0.12)',
    text: '#000000',
    text2: '#3C3C43',
    text3: '#8E8E93',
    accent: '#007AFF',
    success: '#34C759',
    danger: '#FF3B30',
    hover: '#E5E5EA',
  },
  dark: {
    bg: '#202124',
    card: '#292A2D',
    cardAlt: '#333336',
    border: 'rgba(255,255,255,0.08)',
    text: '#E8EAED',
    text2: '#BDC1C6',
    text3: '#9AA0A6',
    accent: '#0A84FF',
    success: '#30D158',
    danger: '#FF453A',
    hover: '#3A3A3C',
  },
};

/* ═══════════════════ Crop aspect-ratio presets ═══════════════════ */
export const CROP_PRESETS = [
  { id: 'free', label: 'Libre', ratio: null },
  { id: '16:9', label: '16:9 — Slider principal', ratio: 16 / 9 },
  { id: '4:3', label: '4:3 — Tarjetas grilla', ratio: 4 / 3 },
  { id: '3:2', label: '3:2 — Listado', ratio: 3 / 2 },
  { id: '1:1', label: '1:1 — Cuadrado', ratio: 1 },
  { id: '9:16', label: '9:16 — Vertical / Stories', ratio: 9 / 16 },
];

/* ═══════════════════ Position presets ═══════════════════ */
export const PRESETS = [
  { id: 'bottom-right', label: 'Inferior Derecha', getPos: (iw, ih, ww, wh, m) => ({ left: iw - ww - m, top: ih - wh - m }) },
  { id: 'bottom-left', label: 'Inferior Izquierda', getPos: (iw, ih, ww, wh, m) => ({ left: m, top: ih - wh - m }) },
  { id: 'top-right', label: 'Superior Derecha', getPos: (iw, ih, ww, wh, m) => ({ left: iw - ww - m, top: m }) },
  { id: 'top-left', label: 'Superior Izquierda', getPos: (iw, ih, ww, wh, m) => ({ left: m, top: m }) },
  { id: 'center', label: 'Centrada', getPos: (iw, ih, ww, wh) => ({ left: (iw - ww) / 2, top: (ih - wh) / 2 }) },
  { id: 'diagonal', label: 'Diagonal', getPos: (iw, ih, ww, wh) => ({ left: (iw - ww) / 2, top: (ih - wh) / 2, angle: -30 }) },
  { id: 'pattern', label: 'Patrón Repetido', getPos: () => ({ mode: 'pattern' }) },
  { id: 'custom', label: 'Personalizado', getPos: () => ({}) },
];
