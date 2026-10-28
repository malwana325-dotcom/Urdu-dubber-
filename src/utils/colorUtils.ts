/**
 * Cinema Color Studio & Harmony Engine
 * Provides advanced color manipulation, color space conversion (HEX, RGB, HSL, ASS),
 * color theory harmonies (monochromatic, complementary, analogous, triadic, etc.),
 * WCAG contrast ratio calculations, and multi-stop gradient builders.
 */

export interface RgbColor {
  r: number; // 0 - 255
  g: number; // 0 - 255
  b: number; // 0 - 255
}

export interface HslColor {
  h: number; // 0 - 360
  s: number; // 0 - 100
  l: number; // 0 - 100
}

export interface GradientStop {
  id: string;
  color: string;
  offset: number; // 0 - 100 %
}

export type HarmonyType = 
  | 'complementary' 
  | 'analogous' 
  | 'triadic' 
  | 'split-complementary' 
  | 'tetradic' 
  | 'monochromatic';

export interface HarmonicPalette {
  name: string;
  type: HarmonyType;
  baseColor: string;
  colors: string[];
  recommendedRoles: {
    textColor: string;
    outlineColor: string;
    shadowColor: string;
    accentColor: string;
  };
}

/**
 * Normalizes any hex string into standard uppercase 6-char hex "#RRGGBB"
 */
export function normalizeHex(hex: string, fallback: string = '#FFFFFF'): string {
  if (!hex) return fallback;
  let clean = hex.trim().replace(/^#/, '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(clean)) {
    return fallback;
  }
  return '#' + clean.toUpperCase();
}

/**
 * Converts HEX to RGB
 */
export function hexToRgb(hex: string): RgbColor {
  const norm = normalizeHex(hex);
  const r = parseInt(norm.substring(1, 3), 16);
  const g = parseInt(norm.substring(3, 5), 16);
  const b = parseInt(norm.substring(5, 7), 16);
  return { r, g, b };
}

/**
 * Converts RGB to HEX
 */
export function rgbToHex({ r, g, b }: RgbColor): string {
  const clampR = Math.max(0, Math.min(255, Math.round(r)));
  const clampG = Math.max(0, Math.min(255, Math.round(g)));
  const clampB = Math.max(0, Math.min(255, Math.round(b)));
  const rHex = clampR.toString(16).padStart(2, '0');
  const gHex = clampG.toString(16).padStart(2, '0');
  const bHex = clampB.toString(16).padStart(2, '0');
  return `#${rHex}${gHex}${bHex}`.toUpperCase();
}

/**
 * Converts RGB to HSL
 */
export function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Converts HSL to RGB
 */
export function hslToRgb({ h, s, l }: HslColor): RgbColor {
  const hNorm = ((h % 360) + 360) % 360 / 360;
  const sNorm = Math.max(0, Math.min(100, s)) / 100;
  const lNorm = Math.max(0, Math.min(100, l)) / 100;

  if (sNorm === 0) {
    const gray = Math.round(lNorm * 255);
    return { r: gray, g: gray, b: gray };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tNorm = t;
    if (tNorm < 0) tNorm += 1;
    if (tNorm > 1) tNorm -= 1;
    if (tNorm < 1 / 6) return p + (q - p) * 6 * tNorm;
    if (tNorm < 1 / 2) return q;
    if (tNorm < 2 / 3) return p + (q - p) * (2 / 3 - tNorm) * 6;
    return p;
  };

  const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
  const p = 2 * lNorm - q;

  const r = Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, hNorm) * 255);
  const b = Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255);

  return { r, g, b };
}

/**
 * Converts HEX directly to HSL
 */
export function hexToHsl(hex: string): HslColor {
  return rgbToHsl(hexToRgb(hex));
}

/**
 * Converts HSL directly to HEX
 */
export function hslToHex(hsl: HslColor): string {
  return rgbToHex(hslToRgb(hsl));
}

/**
 * Computes WCAG relative luminance (0 to 1)
 */
export function getRelativeLuminance(rgb: RgbColor): number {
  const transform = (val: number) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = transform(rgb.r);
  const g = transform(rgb.g);
  const b = transform(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Computes contrast ratio between two hex colors (1 to 21)
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(hexToRgb(hex1));
  const lum2 = getRelativeLuminance(hexToRgb(hex2));
  const brighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (brighter + 0.05) / (darker + 0.05);
}

/**
 * Generates harmonic color sets based on classical color theory
 */
export function generateHarmonies(baseHex: string, type: HarmonyType): string[] {
  const hsl = hexToHsl(baseHex);
  const wrap = (val: number) => ((val % 360) + 360) % 360;

  switch (type) {
    case 'complementary': {
      const compHue = wrap(hsl.h + 180);
      return [
        baseHex,
        hslToHex({ h: compHue, s: hsl.s, l: hsl.l }),
        hslToHex({ h: hsl.h, s: Math.max(20, hsl.s - 25), l: Math.min(95, hsl.l + 25) }),
        hslToHex({ h: compHue, s: Math.min(100, hsl.s + 15), l: Math.max(15, hsl.l - 25) })
      ];
    }
    case 'analogous': {
      return [
        hslToHex({ h: wrap(hsl.h - 30), s: hsl.s, l: hsl.l }),
        baseHex,
        hslToHex({ h: wrap(hsl.h + 30), s: hsl.s, l: hsl.l }),
        hslToHex({ h: wrap(hsl.h + 60), s: Math.max(30, hsl.s - 15), l: Math.min(90, hsl.l + 15) })
      ];
    }
    case 'triadic': {
      return [
        baseHex,
        hslToHex({ h: wrap(hsl.h + 120), s: hsl.s, l: hsl.l }),
        hslToHex({ h: wrap(hsl.h + 240), s: hsl.s, l: hsl.l }),
        hslToHex({ h: hsl.h, s: Math.max(15, hsl.s - 30), l: 92 })
      ];
    }
    case 'split-complementary': {
      return [
        baseHex,
        hslToHex({ h: wrap(hsl.h + 150), s: hsl.s, l: hsl.l }),
        hslToHex({ h: wrap(hsl.h + 210), s: hsl.s, l: hsl.l }),
        hslToHex({ h: wrap(hsl.h + 180), s: Math.min(100, hsl.s + 10), l: Math.max(15, hsl.l - 20) })
      ];
    }
    case 'tetradic': {
      return [
        baseHex,
        hslToHex({ h: wrap(hsl.h + 90), s: hsl.s, l: hsl.l }),
        hslToHex({ h: wrap(hsl.h + 180), s: hsl.s, l: hsl.l }),
        hslToHex({ h: wrap(hsl.h + 270), s: hsl.s, l: hsl.l })
      ];
    }
    case 'monochromatic': {
      return [
        hslToHex({ h: hsl.h, s: hsl.s, l: Math.min(96, Math.max(88, hsl.l + 35)) }),
        hslToHex({ h: hsl.h, s: hsl.s, l: Math.min(80, Math.max(65, hsl.l + 15)) }),
        baseHex,
        hslToHex({ h: hsl.h, s: Math.min(100, hsl.s + 10), l: Math.max(18, hsl.l - 28) }),
        hslToHex({ h: hsl.h, s: Math.min(100, hsl.s + 20), l: Math.max(8, hsl.l - 42) })
      ];
    }
    default:
      return [baseHex];
  }
}

/**
 * Intelligent Subtitle Role Assignment
 * Optimizes colors for Primary Text, Outline/Stroke, Shadow/Depth, and Secondary Accent
 * to guarantee broadcast legibility and high visual contrast.
 */
export function calculateOptimalSubtitleRoles(colors: string[]): {
  textColor: string;
  outlineColor: string;
  shadowColor: string;
  accentColor: string;
} {
  if (!colors || colors.length === 0) {
    return {
      textColor: '#FFFFFF',
      outlineColor: '#000000',
      shadowColor: '#000000',
      accentColor: '#FFD700'
    };
  }

  // Rank colors by luminance
  const sorted = [...colors].sort((a, b) => {
    return getRelativeLuminance(hexToRgb(b)) - getRelativeLuminance(hexToRgb(a));
  });

  const brightest = sorted[0];
  const darkest = sorted[sorted.length - 1];

  // If brightest is high luminance (> 0.45), use it for text and darkest for outline
  const brightLum = getRelativeLuminance(hexToRgb(brightest));

  let textColor = brightest;
  let outlineColor = darkest;
  let shadowColor = '#000000';
  let accentColor = sorted[Math.floor(sorted.length / 2)] || brightest;

  if (brightLum < 0.25) {
    // All colors are dark, invert so text is brightened
    const hsl = hexToHsl(brightest);
    textColor = hslToHex({ h: hsl.h, s: Math.min(40, hsl.s), l: 96 });
    outlineColor = darkest;
    accentColor = brightest;
  } else {
    // Text is bright; outline must have at least 4.5:1 contrast against text
    if (getContrastRatio(textColor, outlineColor) < 3.5) {
      outlineColor = '#000000';
    }
  }

  // Pick complementary or dark tint for shadow
  const outlineHsl = hexToHsl(outlineColor);
  shadowColor = hslToHex({ h: outlineHsl.h, s: Math.min(100, outlineHsl.s + 15), l: Math.max(4, outlineHsl.l - 10) });

  return {
    textColor,
    outlineColor,
    shadowColor,
    accentColor
  };
}

/**
 * Curated thematic subtitle presets inspired by world cinema, CapCut, and Urdu calligraphy
 */
export const CINEMA_THEMATIC_PALETTES = [
  {
    name: 'Urdu Royal Manuscript (Nastaliq Gold)',
    theme: 'urdu',
    base: '#F59E0B',
    colors: ['#FFFBEB', '#F59E0B', '#B45309', '#78350F', '#064E3B']
  },
  {
    name: 'CapCut Viral Reels Pop',
    theme: 'viral',
    base: '#FFF000',
    colors: ['#FFFFFF', '#FFF000', '#F97316', '#09090B', '#EF4444']
  },
  {
    name: 'Cinema Blockbuster (Teal & Orange)',
    theme: 'cinema',
    base: '#06B6D4',
    colors: ['#FFFFFF', '#F97316', '#06B6D4', '#083344', '#020617']
  },
  {
    name: 'Neon Cyberpunk Aura',
    theme: 'neon',
    base: '#EC4899',
    colors: ['#FFFFFF', '#F43F5E', '#A855F7', '#06B6D4', '#0F172A']
  },
  {
    name: 'Emerald Aurora (Classical Elegance)',
    theme: 'emerald',
    base: '#10B981',
    colors: ['#ECFDF5', '#34D399', '#059669', '#064E3B', '#022C22']
  },
  {
    name: 'Nordic Midnight Ice (Clean Film)',
    theme: 'minimal',
    base: '#38BDF8',
    colors: ['#F8FAFC', '#E2E8F0', '#38BDF8', '#1E293B', '#020617']
  },
  {
    name: 'Imperial Crimson Ruby',
    theme: 'crimson',
    base: '#E11D48',
    colors: ['#FFF1F2', '#FB7185', '#E11D48', '#881337', '#1C060B']
  },
  {
    name: 'Golden Hour Sunset Glow',
    theme: 'sunset',
    base: '#F97316',
    colors: ['#FEF3C7', '#FDE047', '#FB923C', '#EA580C', '#431407']
  }
];

/**
 * Standard Cinema / Broadcast Quick Swatches
 */
export const BROADCAST_SWATCHES = [
  // Primary Whites & High Contrast
  { label: 'Pure White', color: '#FFFFFF' },
  { label: 'Studio Cream', color: '#FFFBEB' },
  { label: 'Platinum Ivory', color: '#F1F5F9' },
  { label: 'Silver Mist', color: '#CBD5E1' },
  // High-Impact Subtitle Golds & Yellows
  { label: 'CapCut Acid Yellow', color: '#FFF000' },
  { label: 'Cinema Goldenrod', color: '#FFD700' },
  { label: 'Warm Amber Gold', color: '#F59E0B' },
  { label: 'Sunset Tangerine', color: '#F97316' },
  // Calligraphic & Jewel Tones
  { label: 'Royal Nastaliq Emerald', color: '#10B981' },
  { label: 'Persian Turquoise', color: '#06B6D4' },
  { label: 'Electric Blue', color: '#3B82F6' },
  { label: 'Vibrant Magenta', color: '#EC4899' },
  { label: 'Imperial Ruby', color: '#EF4444' },
  { label: 'Mystic Amethyst', color: '#8B5CF6' },
  // Deep Contrasting Outlines & Shadows
  { label: 'Pitch Black', color: '#000000' },
  { label: 'Cinema Charcoal', color: '#18181B' },
  { label: 'Midnight Navy', color: '#0F172A' },
  { label: 'Dark Spruce', color: '#064E3B' },
  { label: 'Deep Blood Red', color: '#450A0A' },
  { label: 'Dark Chocolate', color: '#381E0F' }
];

/**
 * Converts a list of gradient stops into a CSS linear gradient
 */
export function buildLinearGradientCss(stops: GradientStop[], angle: number = 135): string {
  if (!stops || stops.length === 0) return '#FFFFFF';
  if (stops.length === 1) return stops[0].color;
  const sorted = [...stops].sort((a, b) => a.offset - b.offset);
  const stopsCss = sorted.map(s => `${s.color} ${Math.round(s.offset)}%`).join(', ');
  return `linear-gradient(${angle}deg, ${stopsCss})`;
}
