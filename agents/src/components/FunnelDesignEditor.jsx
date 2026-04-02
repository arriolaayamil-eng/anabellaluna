import React, { useCallback, useMemo, useRef, useState } from 'react';
import { documentService } from '../services/documentService';
import API_CONFIG from '../config/api';

// ─── Pattern SVG generator (mirrors funnelUtils.ts) ──────────────────────────
function getPatternSvg(type, color, size, opacity) {
  const c = encodeURIComponent(color || '#ffffff');
  const s = size || 20;
  const o = opacity ?? 0.15;
  const svgs = {
    dots:       `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg"><circle cx="${s/2}" cy="${s/2}" r="${s/7}" fill="${decodeURIComponent(c)}" opacity="${o}"/></svg>`,
    grid:       `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg"><path d="M${s} 0L0 0 0 ${s}" fill="none" stroke="${decodeURIComponent(c)}" stroke-width="0.5" opacity="${o}"/></svg>`,
    lines:      `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="${s/2}" x2="${s}" y2="${s/2}" stroke="${decodeURIComponent(c)}" stroke-width="1" opacity="${o}"/></svg>`,
    crosshatch: `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg"><path d="M0 0l${s} ${s}M${s} 0l-${s} ${s}" stroke="${decodeURIComponent(c)}" stroke-width="1" opacity="${o}"/></svg>`,
    diagonal:   `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="0" x2="${s}" y2="${s}" stroke="${decodeURIComponent(c)}" stroke-width="1" opacity="${o}"/></svg>`,
    waves:      `<svg width="${s*2}" height="${s}" xmlns="http://www.w3.org/2000/svg"><path d="M0 ${s/2} Q${s/2} 0 ${s} ${s/2} Q${s*1.5} ${s} ${s*2} ${s/2}" fill="none" stroke="${decodeURIComponent(c)}" stroke-width="1.5" opacity="${o}"/></svg>`,
    triangles:  `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg"><polygon points="${s/2},2 ${s-2},${s-2} 2,${s-2}" fill="none" stroke="${decodeURIComponent(c)}" stroke-width="1" opacity="${o}"/></svg>`,
    hexagons:   `<svg width="${s}" height="${s*0.866}" xmlns="http://www.w3.org/2000/svg"><polygon points="${s*0.5},0 ${s},${s*0.25} ${s},${s*0.75} ${s*0.5},${s} 0,${s*0.75} 0,${s*0.25}" fill="none" stroke="${decodeURIComponent(c)}" stroke-width="1" opacity="${o}"/></svg>`,
    circles:    `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg"><circle cx="${s/2}" cy="${s/2}" r="${s*0.35}" fill="none" stroke="${decodeURIComponent(c)}" stroke-width="1" opacity="${o}"/></svg>`,
    zigzag:     `<svg width="${s*2}" height="${s}" xmlns="http://www.w3.org/2000/svg"><path d="M0 0l${s/2} ${s}l${s/2} -${s}l${s/2} ${s}l${s/2} -${s}" fill="none" stroke="${decodeURIComponent(c)}" stroke-width="1.5" opacity="${o}"/></svg>`,
  };
  return svgs[type] || svgs.dots;
}

const DEFAULT_GRADIENT = 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#0f2d50 100%)';

function buildPreviewBackground(settings) {
  const type = settings?.heroBackgroundType || 'gradient';
  switch (type) {
    case 'color':
      return { background: settings.heroBackgroundColor || DEFAULT_GRADIENT };
    case 'gradient':
      return { background: settings.heroBackgroundGradient || DEFAULT_GRADIENT };
    case 'image': {
      const rawImg = settings.heroBackgroundImage || '';
      const img = rawImg.startsWith('/public/') ? `${API_CONFIG.baseURL}${rawImg}` : rawImg;
      const alpha = settings.heroOverlayOpacity ?? 0.55;
      if (!img) return { background: DEFAULT_GRADIENT };
      return { background: `linear-gradient(rgba(10,20,40,${alpha}),rgba(10,20,40,${alpha})),url(${img}) center/cover no-repeat` };
    }
    case 'pattern': {
      const cfg = settings.heroBackgroundPattern;
      if (!cfg) return { background: DEFAULT_GRADIENT };
      const svg = getPatternSvg(cfg.type, cfg.patternColor || '#ffffff', cfg.size || 20, cfg.opacity ?? 0.15);
      const dataUrl = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
      return { background: `${cfg.primaryColor || '#0f172a'} ${dataUrl} repeat` };
    }
    case 'svg': {
      const raw = settings.heroBackgroundSvg || '';
      const base = settings.heroBackgroundColor || '#0f172a';
      if (!raw) return { background: DEFAULT_GRADIENT };
      return { background: `${base} url("data:image/svg+xml,${encodeURIComponent(raw)}") repeat` };
    }
    case 'svgOverlay': {
      const rawSvg = settings.heroSvgOverlayUrl || '';
      const svgUrl = rawSvg.startsWith('/public/') ? `${API_CONFIG.baseURL}${rawSvg}` : rawSvg;
      const base = settings.heroBackgroundGradient || DEFAULT_GRADIENT;
      if (!svgUrl) return { background: base };
      return { background: `url('${svgUrl}') center/cover no-repeat, ${base}` };
    }
    default:
      return { background: DEFAULT_GRADIENT };
  }
}

const BG_TYPES = [
  { value: 'gradient',   icon: '🌈', label: 'Gradiente' },
  { value: 'color',      icon: '🎨', label: 'Color' },
  { value: 'image',      icon: '🖼',  label: 'Imagen' },
  { value: 'pattern',    icon: '✦',  label: 'Patrón' },
  { value: 'svg',        icon: '</>',  label: 'SVG Patrón' },
  { value: 'svgOverlay', icon: '🎭',  label: 'SVG sobre Fondo' },
];

const PATTERNS = [
  { type: 'dots',       label: 'Puntos' },
  { type: 'grid',       label: 'Grilla' },
  { type: 'lines',      label: 'Líneas' },
  { type: 'crosshatch', label: 'Trama' },
  { type: 'diagonal',   label: 'Diagonal' },
  { type: 'waves',      label: 'Ondas' },
  { type: 'triangles',  label: 'Triángulos' },
  { type: 'hexagons',   label: 'Hexágonos' },
  { type: 'circles',    label: 'Círculos' },
  { type: 'zigzag',     label: 'Zigzag' },
];

const IMAGE_STYLES = [
  { value: 'float-right', icon: '▶', label: 'Derecha' },
  { value: 'float-left',  icon: '◀', label: 'Izquierda' },
  { value: 'hidden',      icon: '✕', label: 'Oculta' },
];

const GRADIENT_PRESETS = [
  { label: 'Marino',     value: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#0f2d50 100%)' },
  { label: 'Medianoche', value: 'linear-gradient(135deg,#0f172a 0%,#312e81 100%)' },
  { label: 'Bosque',     value: 'linear-gradient(135deg,#052e16 0%,#14532d 60%,#166534 100%)' },
  { label: 'Bronce',     value: 'linear-gradient(135deg,#1c1917 0%,#44403c 60%,#57534e 100%)' },
  { label: 'Ciruela',    value: 'linear-gradient(135deg,#1e1b4b 0%,#4c1d95 60%,#6d28d9 100%)' },
  { label: 'Horizonte',  value: 'linear-gradient(180deg,#0c1445 0%,#1e3a5f 100%)' },
  { label: 'Coral',      value: 'linear-gradient(135deg,#450a0a 0%,#991b1b 60%,#b91c1c 100%)' },
  { label: 'Oro',        value: 'linear-gradient(135deg,#1c1001 0%,#78350f 60%,#92400e 100%)' },
];

// ─── PatternPreviewTile ───────────────────────────────────────────────────────
const PatternPreviewTile = React.memo(({ patternType, selected, onSelect, patternColor, primaryColor, size, opacity }) => {
  const bg = useMemo(() => {
    const svg = getPatternSvg(patternType, patternColor || '#ffffff', size || 20, opacity ?? 0.2);
    const dataUrl = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    return `${primaryColor || '#0f172a'} ${dataUrl} repeat`;
  }, [patternType, patternColor, primaryColor, size, opacity]);

  return (
    <button
      type="button"
      onClick={() => onSelect(patternType)}
      title={PATTERNS.find(p => p.type === patternType)?.label}
      style={{
        width: 52, height: 52, borderRadius: 8, border: selected ? '2.5px solid #2563eb' : '1.5px solid #d1d5db',
        background: bg, cursor: 'pointer', outline: 'none', boxShadow: selected ? '0 0 0 3px rgba(37,99,235,0.2)' : 'none',
        transition: 'all 0.15s',
      }}
    />
  );
});

// ─── HeroPreview (live mini rendering) ───────────────────────────────────────
const HeroPreview = React.memo(({ settings, title, coverUrl }) => {
  const bgStyle = useMemo(() => buildPreviewBackground(settings), [settings]);
  const textLight = (settings?.heroTextColor ?? 'light') === 'light';
  const accent = settings?.accentColor || '#2563eb';
  const imgStyle = settings?.heroImageStyle || 'float-right';
  const showImage = imgStyle !== 'hidden' && !!coverUrl;

  return (
    <div
      style={{
        ...bgStyle,
        width: '100%',
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        flexDirection: imgStyle === 'float-left' ? 'row-reverse' : 'row',
      }}
    >
      {/* Text side */}
      <div style={{ flex: 1, paddingRight: showImage ? 12 : 0 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <span style={{ background: accent, color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 9, fontWeight: 700 }}>En Venta</span>
          <span style={{ background: 'rgba(255,255,255,0.15)', color: textLight ? '#fff' : '#111', borderRadius: 4, padding: '2px 8px', fontSize: 9, fontWeight: 600 }}>Casa</span>
        </div>
        <div style={{ fontWeight: 900, fontSize: 17, lineHeight: 1.1, color: textLight ? '#fff' : '#111', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
          {title || 'Título de la propiedad'}
        </div>
        <div style={{ color: textLight ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)', fontSize: 9, marginBottom: 10 }}>📍 Palermo, CABA</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ background: accent, color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: 9, fontWeight: 700, cursor: 'pointer' }}>Agendar visita</span>
          <span style={{ background: '#25d366', color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: 9, fontWeight: 700 }}>WhatsApp</span>
        </div>
      </div>
      {/* Image side */}
      {showImage && (
        <div style={{ width: 130, height: 150, borderRadius: 10, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', flexShrink: 0, transform: 'translateY(16px)' }}>
          <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}
    </div>
  );
});

// ─── Main Editor ─────────────────────────────────────────────────────────────
/**
 * FunnelDesignEditor
 * Props:
 *   value     — current FunnelSettings object
 *   onChange  — (FunnelSettings) => void
 *   previewTitle  — string for preview
 *   previewCoverUrl — image URL for preview
 */
const FunnelDesignEditor = ({ value = {}, onChange, previewTitle = '', previewCoverUrl = '' }) => {
  const settings = value;

  const set = useCallback((patch) => {
    onChange({ ...settings, ...patch });
  }, [settings, onChange]);

  const bgType = settings.heroBackgroundType || 'gradient';
  const pattern = settings.heroBackgroundPattern || { type: 'dots', primaryColor: '#0f172a', patternColor: '#ffffff', size: 20, opacity: 0.15 };

  const setPattern = useCallback((patch) => {
    set({ heroBackgroundPattern: { ...pattern, ...patch } });
  }, [pattern, set]);

  // ── File upload for background image ────────────────────────────────────────
  const imageFileRef = useRef(null);
  const svgFileRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingSvg, setUploadingSvg] = useState(false);

  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const res = await documentService.upload([file], { fields: { categoria: 'funnel-background' } });
      const doc = res?.uploaded?.[0];
      if (doc && doc._id) {
        set({ heroBackgroundImage: `/public/media/${doc._id}` });
      }
    } catch (err) {
      console.error('Error uploading funnel background image:', err);
    } finally {
      setUploadingImage(false);
      if (imageFileRef.current) imageFileRef.current.value = '';
    }
  }, [set]);

  const handleSvgUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingSvg(true);
      const text = await file.text();
      set({ heroBackgroundSvg: text });
    } catch (err) {
      console.error('Error reading SVG file:', err);
    } finally {
      setUploadingSvg(false);
      if (svgFileRef.current) svgFileRef.current.value = '';
    }
  }, [set]);

  // ── SVG Overlay upload (uploads file to document service, stores path) ───────
  const svgOverlayFileRef = useRef(null);
  const [uploadingSvgOverlay, setUploadingSvgOverlay] = useState(false);

  const handleSvgOverlayUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingSvgOverlay(true);
      const res = await documentService.upload([file], { fields: { categoria: 'funnel-svg-overlay' } });
      const doc = res?.uploaded?.[0];
      if (doc && doc._id) {
        set({ heroSvgOverlayUrl: `/public/media/${doc._id}` });
      }
    } catch (err) {
      console.error('Error uploading SVG overlay:', err);
    } finally {
      setUploadingSvgOverlay(false);
      if (svgOverlayFileRef.current) svgOverlayFileRef.current.value = '';
    }
  }, [set]);

  const labelStyle = { fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: 6, display: 'block' };
  const rowStyle = { marginBottom: 16 };

  return (
    <div>
      {/* ── LIVE PREVIEW ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <span style={labelStyle}>Vista previa en tiempo real</span>
        <HeroPreview settings={settings} title={previewTitle} coverUrl={previewCoverUrl} />
        <p style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 6 }}>
          La vista previa refleja exactamente cómo se verá el fondo del funnel en el sitio público.
        </p>
      </div>

      {/* ── BACKGROUND TYPE TABS ──────────────────────────────────────── */}
      <div style={rowStyle}>
        <span style={labelStyle}>Tipo de fondo</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {BG_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => set({ heroBackgroundType: t.value })}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                border: bgType === t.value ? '2px solid #2563eb' : '1.5px solid #d1d5db',
                background: bgType === t.value ? '#eff6ff' : '#fff',
                color: bgType === t.value ? '#1d4ed8' : '#374151',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── GRADIENT SETTINGS ─────────────────────────────────────────── */}
      {bgType === 'gradient' && (
        <div style={rowStyle}>
          <span style={labelStyle}>Gradiente CSS</span>
          <input
            type="text"
            className="form-control form-control-sm"
            value={settings.heroBackgroundGradient || DEFAULT_GRADIENT}
            onChange={(e) => set({ heroBackgroundGradient: e.target.value })}
            placeholder="linear-gradient(135deg,#0f172a,#1e3a5f)"
            style={{ fontFamily: 'monospace', fontSize: '0.8rem', marginBottom: 10 }}
          />
          <span style={{ ...labelStyle, marginBottom: 8 }}>Presets</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {GRADIENT_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => set({ heroBackgroundGradient: p.value })}
                title={p.label}
                style={{
                  width: 40, height: 40, borderRadius: 8, border: settings.heroBackgroundGradient === p.value ? '2.5px solid #2563eb' : '1.5px solid #d1d5db',
                  background: p.value, cursor: 'pointer', outline: 'none',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── SOLID COLOR SETTINGS ──────────────────────────────────────── */}
      {bgType === 'color' && (
        <div style={rowStyle}>
          <span style={labelStyle}>Color de fondo</span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="color"
              value={settings.heroBackgroundColor || '#0f172a'}
              onChange={(e) => set({ heroBackgroundColor: e.target.value })}
              style={{ width: 48, height: 40, borderRadius: 8, border: '1.5px solid #d1d5db', cursor: 'pointer', padding: 2 }}
            />
            <input
              type="text"
              className="form-control form-control-sm"
              value={settings.heroBackgroundColor || '#0f172a'}
              onChange={(e) => set({ heroBackgroundColor: e.target.value })}
              style={{ fontFamily: 'monospace', fontSize: '0.85rem', width: 120 }}
            />
          </div>
        </div>
      )}

      {/* ── IMAGE SETTINGS ────────────────────────────────────────────── */}
      {bgType === 'image' && (
        <div style={rowStyle}>
          <span style={labelStyle}>Imagen de fondo</span>
          {settings.heroBackgroundImage && (
            <div style={{ marginBottom: 10, position: 'relative', display: 'inline-block' }}>
              <img
                src={settings.heroBackgroundImage.startsWith('/public/') ? `${API_CONFIG.baseURL}${settings.heroBackgroundImage}` : settings.heroBackgroundImage}
                alt="Fondo"
                style={{ maxHeight: 100, borderRadius: 8, border: '1.5px solid #d1d5db', display: 'block' }}
              />
              <button
                type="button"
                onClick={() => set({ heroBackgroundImage: '' })}
                style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                title="Eliminar imagen"
              >✕</button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <input
              ref={imageFileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
            <button
              type="button"
              onClick={() => imageFileRef.current?.click()}
              disabled={uploadingImage}
              style={{ padding: '7px 16px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', border: '1.5px solid #d1d5db', background: '#fff', color: '#374151' }}
            >
              {uploadingImage ? '⏳ Subiendo...' : '📁 Subir imagen'}
            </button>
            {settings.heroBackgroundImage && (
              <span style={{ fontSize: '0.72rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                {settings.heroBackgroundImage.split('/').pop()}
              </span>
            )}
          </div>
          <span style={labelStyle}>Oscuridad del overlay (0 = transparente, 1 = negro)</span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="range" min={0} max={1} step={0.05}
              value={settings.heroOverlayOpacity ?? 0.55}
              onChange={(e) => set({ heroOverlayOpacity: Number(e.target.value) })}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '0.85rem', color: '#374151', minWidth: 32, textAlign: 'right' }}>
              {((settings.heroOverlayOpacity ?? 0.55) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}

      {/* ── PATTERN SETTINGS ──────────────────────────────────────────── */}
      {bgType === 'pattern' && (
        <div style={rowStyle}>
          <span style={labelStyle}>Tipo de patrón</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {PATTERNS.map((p) => (
              <PatternPreviewTile
                key={p.type}
                patternType={p.type}
                selected={pattern.type === p.type}
                onSelect={(t) => setPattern({ type: t })}
                patternColor={pattern.patternColor}
                primaryColor={pattern.primaryColor}
                size={pattern.size}
                opacity={pattern.opacity}
              />
            ))}
          </div>
          <div className="row g-2">
            <div className="col-sm-6">
              <span style={labelStyle}>Color base</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={pattern.primaryColor || '#0f172a'} onChange={(e) => setPattern({ primaryColor: e.target.value })}
                  style={{ width: 40, height: 36, borderRadius: 6, border: '1.5px solid #d1d5db', cursor: 'pointer', padding: 2 }} />
                <input type="text" className="form-control form-control-sm" value={pattern.primaryColor || '#0f172a'}
                  onChange={(e) => setPattern({ primaryColor: e.target.value })} style={{ fontFamily: 'monospace', fontSize: '0.8rem' }} />
              </div>
            </div>
            <div className="col-sm-6">
              <span style={labelStyle}>Color patrón</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={pattern.patternColor || '#ffffff'} onChange={(e) => setPattern({ patternColor: e.target.value })}
                  style={{ width: 40, height: 36, borderRadius: 6, border: '1.5px solid #d1d5db', cursor: 'pointer', padding: 2 }} />
                <input type="text" className="form-control form-control-sm" value={pattern.patternColor || '#ffffff'}
                  onChange={(e) => setPattern({ patternColor: e.target.value })} style={{ fontFamily: 'monospace', fontSize: '0.8rem' }} />
              </div>
            </div>
            <div className="col-sm-6">
              <span style={labelStyle}>Tamaño ({pattern.size || 20}px)</span>
              <input type="range" min={8} max={80} step={4} value={pattern.size || 20} onChange={(e) => setPattern({ size: Number(e.target.value) })} style={{ width: '100%' }} />
            </div>
            <div className="col-sm-6">
              <span style={labelStyle}>Opacidad ({Math.round((pattern.opacity ?? 0.15) * 100)}%)</span>
              <input type="range" min={0.03} max={1} step={0.03} value={pattern.opacity ?? 0.15} onChange={(e) => setPattern({ opacity: Number(e.target.value) })} style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      )}

      {/* ── SVG SETTINGS ──────────────────────────────────────────────── */}
      {bgType === 'svg' && (
        <div style={rowStyle}>
          <span style={labelStyle}>SVG personalizado (se repite como patrón de fondo)</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <input
              ref={svgFileRef}
              type="file"
              accept=".svg,image/svg+xml"
              style={{ display: 'none' }}
              onChange={handleSvgUpload}
            />
            <button
              type="button"
              onClick={() => svgFileRef.current?.click()}
              disabled={uploadingSvg}
              style={{ padding: '7px 16px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', border: '1.5px solid #d1d5db', background: '#fff', color: '#374151' }}
            >
              {uploadingSvg ? '⏳ Subiendo...' : '📁 Subir SVG'}
            </button>
            {settings.heroBackgroundSvg && (
              <button
                type="button"
                onClick={() => set({ heroBackgroundSvg: '' })}
                style={{ padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', border: '1.5px solid #fca5a5', background: '#fef2f2', color: '#dc2626' }}
              >
                ✕ Limpiar SVG
              </button>
            )}
          </div>
          <textarea
            className="form-control form-control-sm"
            rows={5}
            value={settings.heroBackgroundSvg || ''}
            onChange={(e) => set({ heroBackgroundSvg: e.target.value })}
            placeholder={`<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">\n  <circle cx="20" cy="20" r="3" fill="white" opacity="0.15"/>\n</svg>`}
            style={{ fontFamily: 'monospace', fontSize: '0.78rem', marginBottom: 10 }}
          />
          <span style={labelStyle}>Color base del fondo</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" value={settings.heroBackgroundColor || '#0f172a'} onChange={(e) => set({ heroBackgroundColor: e.target.value })}
              style={{ width: 40, height: 36, borderRadius: 6, border: '1.5px solid #d1d5db', cursor: 'pointer', padding: 2 }} />
            <input type="text" className="form-control form-control-sm" value={settings.heroBackgroundColor || '#0f172a'}
              onChange={(e) => set({ heroBackgroundColor: e.target.value })} style={{ fontFamily: 'monospace', fontSize: '0.8rem' }} />
          </div>
        </div>
      )}

      {/* ── SVG OVERLAY SETTINGS ──────────────────────────────────────── */}
      {bgType === 'svgOverlay' && (
        <div style={rowStyle}>
          <span style={labelStyle}>SVG/PNG transparente sobre gradiente</span>
          <p style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 10 }}>
            Subí un SVG o PNG con transparencia. Se colocará sobre el gradiente base: donde el archivo sea transparente, se verá el gradiente de fondo.
          </p>
          {settings.heroSvgOverlayUrl && (
            <div style={{ marginBottom: 10, position: 'relative', display: 'inline-block' }}>
              <img
                src={settings.heroSvgOverlayUrl.startsWith('/public/') ? `${API_CONFIG.baseURL}${settings.heroSvgOverlayUrl}` : settings.heroSvgOverlayUrl}
                alt="SVG Overlay"
                style={{ maxHeight: 80, maxWidth: 200, borderRadius: 8, border: '1.5px solid #d1d5db', background: 'repeating-conic-gradient(#e5e7eb 0% 25%, white 0% 50%) 0 0 / 14px 14px', display: 'block' }}
              />
              <button
                type="button"
                onClick={() => set({ heroSvgOverlayUrl: '' })}
                style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >✕</button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
            <input
              ref={svgOverlayFileRef}
              type="file"
              accept=".svg,.png,image/svg+xml,image/png"
              style={{ display: 'none' }}
              onChange={handleSvgOverlayUpload}
            />
            <button
              type="button"
              onClick={() => svgOverlayFileRef.current?.click()}
              disabled={uploadingSvgOverlay}
              style={{ padding: '7px 16px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', border: '1.5px solid #d1d5db', background: '#fff', color: '#374151' }}
            >
              {uploadingSvgOverlay ? '⏳ Subiendo...' : '📁 Subir SVG/PNG transparente'}
            </button>
          </div>
          <span style={labelStyle}>Gradiente base (visible en áreas transparentes)</span>
          <input
            type="text"
            className="form-control form-control-sm"
            value={settings.heroBackgroundGradient || DEFAULT_GRADIENT}
            onChange={(e) => set({ heroBackgroundGradient: e.target.value })}
            placeholder="linear-gradient(135deg,#0f172a,#1e3a5f)"
            style={{ fontFamily: 'monospace', fontSize: '0.8rem', marginBottom: 10 }}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {GRADIENT_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => set({ heroBackgroundGradient: p.value })}
                title={p.label}
                style={{
                  width: 36, height: 36, borderRadius: 8, border: settings.heroBackgroundGradient === p.value ? '2.5px solid #2563eb' : '1.5px solid #d1d5db',
                  background: p.value, cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>
      )}

      <hr style={{ borderColor: '#e5e7eb', margin: '20px 0' }} />

      {/* ── TEXT COLOR ────────────────────────────────────────────────── */}
      <div style={rowStyle}>
        <span style={labelStyle}>Color del texto del hero</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ value: 'light', label: '☀ Claro (blanco)' }, { value: 'dark', label: '🌑 Oscuro (negro)' }].map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => set({ heroTextColor: o.value })}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                border: (settings.heroTextColor || 'light') === o.value ? '2px solid #2563eb' : '1.5px solid #d1d5db',
                background: (settings.heroTextColor || 'light') === o.value ? '#eff6ff' : '#fff',
                color: (settings.heroTextColor || 'light') === o.value ? '#1d4ed8' : '#374151',
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── ACCENT COLOR ──────────────────────────────────────────────── */}
      <div style={rowStyle}>
        <span style={labelStyle}>Color de acento (botones y resaltados)</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="color" value={settings.accentColor || '#2563eb'} onChange={(e) => set({ accentColor: e.target.value })}
            style={{ width: 48, height: 40, borderRadius: 8, border: '1.5px solid #d1d5db', cursor: 'pointer', padding: 2 }} />
          <input type="text" className="form-control form-control-sm" value={settings.accentColor || '#2563eb'}
            onChange={(e) => set({ accentColor: e.target.value })} style={{ fontFamily: 'monospace', fontSize: '0.85rem', width: 120 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            {['#2563eb','#16a34a','#dc2626','#7c3aed','#d97706','#0891b2','#be185d','#111827'].map((c) => (
              <button key={c} type="button" onClick={() => set({ accentColor: c })}
                style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: settings.accentColor === c ? '2.5px solid #111' : '1.5px solid transparent', cursor: 'pointer', padding: 0 }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── IMAGE POSITION ────────────────────────────────────────────── */}
      <div style={rowStyle}>
        <span style={labelStyle}>Posición de la imagen de la propiedad en el hero</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {IMAGE_STYLES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => set({ heroImageStyle: s.value })}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                border: (settings.heroImageStyle || 'float-right') === s.value ? '2px solid #2563eb' : '1.5px solid #d1d5db',
                background: (settings.heroImageStyle || 'float-right') === s.value ? '#eff6ff' : '#fff',
                color: (settings.heroImageStyle || 'float-right') === s.value ? '#1d4ed8' : '#374151',
              }}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FunnelDesignEditor;
