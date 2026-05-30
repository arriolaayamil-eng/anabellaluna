// ─── Funnel Background Utilities ─────────────────────────────────────────────
import type { FunnelPatternConfig, FunnelPatternType, FunnelSettings } from './funnelSettings';
import { DEFAULT_FUNNEL_SETTINGS } from './funnelSettings';
import { API_BASE_URL } from '../../../../config/api';

// ── Media URL resolver ───────────────────────────────────────────────────────
// Backend returns relative paths like "/public/media/{id}" — the browser would
// resolve them against the *frontend* origin, not the API server. This helper
// mirrors the logic in ImageWithBasePath but works for plain <img> and CSS urls.
export function resolveMediaUrl(src: string | undefined | null): string {
  if (!src) return '';
  const s = String(src);
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:') || s.startsWith('blob:') || s.startsWith('//')) return s;
  if (s.startsWith('/public/')) return `${API_BASE_URL}${s}`;
  return s;
}

// ── SVG Pattern Generators ────────────────────────────────────────────────────

function enc(s: string) {
  return encodeURIComponent(s);
}

function cssUrl(src: string): string {
  return `url(${JSON.stringify(src)})`;
}

function patternSvgString(type: FunnelPatternType, color: string, size: number, opacity: number): string {
  const c = color || '#ffffff';
  const s = size || 20;
  const o = opacity ?? 0.15;

  const svgs: Record<FunnelPatternType, string> = {
    dots: `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg"><circle cx="${s / 2}" cy="${s / 2}" r="${s / 7}" fill="${c}" opacity="${o}"/></svg>`,
    grid: `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg"><path d="M${s} 0L0 0 0 ${s}" fill="none" stroke="${c}" stroke-width="0.5" opacity="${o}"/></svg>`,
    lines: `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="${s / 2}" x2="${s}" y2="${s / 2}" stroke="${c}" stroke-width="1" opacity="${o}"/></svg>`,
    crosshatch: `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg"><path d="M0 0l${s} ${s}M${s} 0l-${s} ${s}" stroke="${c}" stroke-width="1" opacity="${o}"/></svg>`,
    diagonal: `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="0" x2="${s}" y2="${s}" stroke="${c}" stroke-width="1" opacity="${o}"/></svg>`,
    waves: `<svg width="${s * 2}" height="${s}" xmlns="http://www.w3.org/2000/svg"><path d="M0 ${s / 2} Q${s / 2} 0 ${s} ${s / 2} Q${s * 1.5} ${s} ${s * 2} ${s / 2}" fill="none" stroke="${c}" stroke-width="1.5" opacity="${o}"/></svg>`,
    triangles: `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg"><polygon points="${s / 2},2 ${s - 2},${s - 2} 2,${s - 2}" fill="none" stroke="${c}" stroke-width="1" opacity="${o}"/></svg>`,
    hexagons: `<svg width="${s}" height="${s * 0.866}" xmlns="http://www.w3.org/2000/svg"><polygon points="${s * 0.5},0 ${s},${s * 0.25} ${s},${s * 0.75} ${s * 0.5},${s} 0,${s * 0.75} 0,${s * 0.25}" fill="none" stroke="${c}" stroke-width="1" opacity="${o}"/></svg>`,
    circles: `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg"><circle cx="${s / 2}" cy="${s / 2}" r="${s * 0.35}" fill="none" stroke="${c}" stroke-width="1" opacity="${o}"/></svg>`,
    zigzag: `<svg width="${s * 2}" height="${s}" xmlns="http://www.w3.org/2000/svg"><path d="M0 0l${s / 2} ${s}l${s / 2} -${s}l${s / 2} ${s}l${s / 2} -${s}" fill="none" stroke="${c}" stroke-width="1.5" opacity="${o}"/></svg>`,
  };

  return svgs[type] ?? svgs.dots;
}

export function getPatternCssBackground(cfg: FunnelPatternConfig, baseColor: string): string {
  const svg = patternSvgString(cfg.type, cfg.patternColor, cfg.size, cfg.opacity);
  const dataUrl = cssUrl(`data:image/svg+xml,${enc(svg)}`);
  return `${baseColor || '#0f172a'} ${dataUrl} repeat`;
}

// ── Main hero background builder ──────────────────────────────────────────────

export interface HeroStyle {
  background: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
}

export function buildHeroBackground(fs: FunnelSettings | undefined | null): HeroStyle {
  const settings = { ...DEFAULT_FUNNEL_SETTINGS, ...(fs || {}) };
  const type = settings.heroBackgroundType ?? 'gradient';

  switch (type) {
    case 'color':
      return { background: settings.heroBackgroundColor || DEFAULT_FUNNEL_SETTINGS.heroBackgroundGradient! };

    case 'gradient':
      return { background: settings.heroBackgroundGradient || DEFAULT_FUNNEL_SETTINGS.heroBackgroundGradient! };

    case 'image': {
      const rawImg = settings.heroBackgroundImage || '';
      const img = resolveMediaUrl(rawImg);
      const overlayAlpha = settings.heroOverlayOpacity ?? 0.55;
      const overlay = `rgba(10,20,40,${overlayAlpha})`;
      if (!img) return { background: DEFAULT_FUNNEL_SETTINGS.heroBackgroundGradient! };
      return {
        background: `linear-gradient(${overlay},${overlay}),${cssUrl(img)}`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }

    case 'pattern': {
      const cfg = settings.heroBackgroundPattern;
      if (!cfg) return { background: DEFAULT_FUNNEL_SETTINGS.heroBackgroundGradient! };
      return {
        background: getPatternCssBackground(cfg, cfg.primaryColor),
        backgroundRepeat: 'repeat',
      };
    }

    case 'svg': {
      const raw = settings.heroBackgroundSvg || '';
      if (!raw) return { background: DEFAULT_FUNNEL_SETTINGS.heroBackgroundGradient! };
      const base = settings.heroBackgroundColor || '#0f172a';
      return {
        background: `${base} ${cssUrl(`data:image/svg+xml,${enc(raw)}`)} repeat`,
        backgroundRepeat: 'repeat',
      };
    }

    case 'svgOverlay': {
      const rawSvg = settings.heroSvgOverlayUrl || '';
      const svgUrl = resolveMediaUrl(rawSvg);
      const base = settings.heroBackgroundGradient || DEFAULT_FUNNEL_SETTINGS.heroBackgroundGradient!;
      if (!svgUrl) return { background: base };
      return {
        background: `${cssUrl(svgUrl)} center/cover no-repeat, ${base}`,
      };
    }

    case 'none':
    default:
      return { background: DEFAULT_FUNNEL_SETTINGS.heroBackgroundGradient! };
  }
}

// ── Accent colour for buttons/highlights ──────────────────────────────────────
export function getAccentColor(fs: FunnelSettings | undefined | null): string {
  return fs?.accentColor || DEFAULT_FUNNEL_SETTINGS.accentColor || '#2563eb';
}

// ── Text colour class helper ──────────────────────────────────────────────────
export function heroTextColorClass(fs: FunnelSettings | undefined | null): 'text-white' | 'text-dark' {
  return (fs?.heroTextColor ?? 'light') === 'dark' ? 'text-dark' : 'text-white';
}

// ── Muted text colour inline style ───────────────────────────────────────────
export function heroMutedColor(fs: FunnelSettings | undefined | null): string {
  return (fs?.heroTextColor ?? 'light') === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)';
}

// ── Pattern preview thumbnails (used by admin editor) ─────────────────────────
export const PATTERN_PREVIEWS: Array<{ type: FunnelPatternType; label: string }> = [
  { type: 'dots',       label: 'Puntos'      },
  { type: 'grid',       label: 'Grilla'      },
  { type: 'lines',      label: 'Líneas'      },
  { type: 'crosshatch', label: 'Trama'       },
  { type: 'diagonal',   label: 'Diagonal'    },
  { type: 'waves',      label: 'Ondas'       },
  { type: 'triangles',  label: 'Triángulos'  },
  { type: 'hexagons',   label: 'Hexágonos'   },
  { type: 'circles',    label: 'Círculos'    },
  { type: 'zigzag',     label: 'Zigzag'      },
];

export { patternSvgString };
