// ─── Funnel Design Settings ──────────────────────────────────────────────────
// Stored in property.metadata.funnelSettings on the backend.
// Read by the frontend detail pages and the admin live-preview editor.

export type FunnelBgType = 'gradient' | 'color' | 'image' | 'pattern' | 'svg' | 'svgOverlay' | 'none';
export type FunnelTextColor = 'light' | 'dark';
export type FunnelImageStyle = 'float-right' | 'float-left' | 'full-bleed' | 'overlay' | 'hidden';

export type FunnelPatternType =
  | 'dots'
  | 'grid'
  | 'lines'
  | 'crosshatch'
  | 'diagonal'
  | 'waves'
  | 'triangles'
  | 'hexagons'
  | 'circles'
  | 'zigzag';

export interface FunnelPatternConfig {
  type: FunnelPatternType;
  primaryColor: string;   // base/fill color
  patternColor: string;   // SVG pattern element color
  size: number;           // pattern unit size in px
  opacity: number;        // 0–1 opacity of pattern layer
}

export interface FunnelSettings {
  // ── Hero background ──────────────────────────────────────────────────────
  heroBackgroundType?: FunnelBgType;

  /** Used when type === 'color' */
  heroBackgroundColor?: string;

  /** Used when type === 'gradient'. Full CSS gradient string e.g. "linear-gradient(135deg,#1e3a5f,#0f172a)" */
  heroBackgroundGradient?: string;

  /** Used when type === 'image'. URL. Combined with an overlay. */
  heroBackgroundImage?: string;

  /** 0–1. Darkness of the overlay applied on top of a background image. Default 0.55 */
  heroOverlayOpacity?: number;

  /** Used when type === 'pattern' */
  heroBackgroundPattern?: FunnelPatternConfig;

  /** Used when type === 'svg'. Raw SVG markup used as a repeating bg-image. */
  heroBackgroundSvg?: string;

  /**
   * Used when type === 'svgOverlay'.
   * URL of an SVG/PNG with transparency, stacked on top of heroBackgroundGradient or heroBackgroundColor.
   * Transparent areas of the SVG let the base gradient/color show through.
   */
  heroSvgOverlayUrl?: string;

  // ── Text & accent ─────────────────────────────────────────────────────────
  heroTextColor?: FunnelTextColor;   // 'light' | 'dark'
  accentColor?: string;              // CTA button + highlight color

  // ── Property image position inside hero ──────────────────────────────────
  heroImageStyle?: FunnelImageStyle;
}

// Default settings used when a property has no funnelSettings configured
export const DEFAULT_FUNNEL_SETTINGS: FunnelSettings = {
  heroBackgroundType: 'gradient',
  heroBackgroundGradient: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#0f2d50 100%)',
  heroTextColor: 'light',
  heroImageStyle: 'float-right',
  accentColor: '#2563eb',
  heroOverlayOpacity: 0.55,
};
