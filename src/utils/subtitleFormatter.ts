/**
 * Subtitle Formatter, Stylizer & Gradient Engine
 * Supports:
 * - Designer color gradient palettes
 * - Block-by-block and word-by-word gradient styling
 * - Formatted SRT export with <font color="..."> and HTML tags
 * - Advanced SubStation Alpha (.ass) export with full typography, outline, shadow & ASS color codes
 * - WebVTT (.vtt) export with cue styling
 * - Clean SRT export (tag stripper)
 */

import { SubtitleItem } from './srtParser';

export interface GradientPalette {
  id: string;
  name: string;
  description: string;
  colors: string[]; // Hex codes e.g. ['#FF7E5F', '#FEB47B']
  previewCss: string; // CSS linear-gradient for UI buttons
}

export const GRADIENT_PALETTES: GradientPalette[] = [
  {
    id: 'sunset',
    name: 'Sunset Radiance',
    description: 'Warm coral, tangerine & golden sunset glow',
    colors: ['#FF6B6B', '#FFA07A', '#FFD166'],
    previewCss: 'linear-gradient(135deg, #FF6B6B, #FFA07A, #FFD166)'
  },
  {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    description: 'Electric cyan to vivid neon violet',
    colors: ['#00F2FE', '#4FACFE', '#D946EF'],
    previewCss: 'linear-gradient(135deg, #00F2FE, #4FACFE, #D946EF)'
  },
  {
    id: 'golden-amber',
    name: 'Golden Amber',
    description: 'Royal gold & honey amber brilliance',
    colors: ['#FFE066', '#F59E0B', '#D97706'],
    previewCss: 'linear-gradient(135deg, #FFE066, #F59E0B, #D97706)'
  },
  {
    id: 'emerald-aurora',
    name: 'Emerald Aurora',
    description: 'Mint emerald to arctic cyan shine',
    colors: ['#34D399', '#10B981', '#06B6D4'],
    previewCss: 'linear-gradient(135deg, #34D399, #10B981, #06B6D4)'
  },
  {
    id: 'neon-violet',
    name: 'Neon Synthwave',
    description: 'Hot magenta to deep cosmic violet',
    colors: ['#F43F5E', '#A855F7', '#6366F1'],
    previewCss: 'linear-gradient(135deg, #F43F5E, #A855F7, #6366F1)'
  },
  {
    id: 'fire-ruby',
    name: 'Fire Ruby',
    description: 'Blazing red to intense orange flare',
    colors: ['#EF4444', '#F97316', '#FB923C'],
    previewCss: 'linear-gradient(135deg, #EF4444, #F97316, #FB923C)'
  },
  {
    id: 'ocean-cyan',
    name: 'Ocean Depths',
    description: 'Crystal aqua to deep maritime blue',
    colors: ['#38BDF8', '#0284C7', '#1E40AF'],
    previewCss: 'linear-gradient(135deg, #38BDF8, #0284C7, #1E40AF)'
  },
  {
    id: 'pastel-rose',
    name: 'Pastel Rose',
    description: 'Soft pastel blossom & lilac whisper',
    colors: ['#F472B6', '#FB7185', '#FED7AA'],
    previewCss: 'linear-gradient(135deg, #F472B6, #FB7185, #FED7AA)'
  },
  {
    id: 'rainbow-spectrum',
    name: 'Rainbow Cycle',
    description: 'Dynamic alternating spectrum across blocks',
    colors: ['#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#8B5CF6', '#EC4899'],
    previewCss: 'linear-gradient(135deg, #EF4444, #F59E0B, #10B981, #06B6D4, #8B5CF6)'
  },
  {
    id: 'classic-white-gold',
    name: 'Cinema Ivory',
    description: 'Crisp cinematic white with subtle champagne warmth',
    colors: ['#FFFFFF', '#FFFBEB', '#FEF3C7'],
    previewCss: 'linear-gradient(135deg, #FFFFFF, #FFFBEB, #FEF3C7)'
  },
  {
    id: 'hollywood-gold',
    name: 'Hollywood Gold',
    description: 'Luxe 24k gold, champagne brilliance & warm amber luster',
    colors: ['#FFDF00', '#D4AF37', '#F59E0B', '#FDE68A'],
    previewCss: 'linear-gradient(135deg, #FFDF00, #D4AF37, #F59E0B, #FDE68A)'
  },
  {
    id: 'blade-runner',
    name: 'Blade Runner 2049',
    description: 'Electric teal, neon amber & dystopian synth pink',
    colors: ['#00F5D4', '#F15BB5', '#FEE440'],
    previewCss: 'linear-gradient(135deg, #00F5D4, #F15BB5, #FEE440)'
  },
  {
    id: 'matrix-code',
    name: 'Matrix Cyber Green',
    description: 'Phosphor green, neon lime & digital emerald glitch',
    colors: ['#00FF66', '#39FF14', '#10B981'],
    previewCss: 'linear-gradient(135deg, #00FF66, #39FF14, #10B981)'
  },
  {
    id: 'crimson-noir',
    name: 'Crimson Noir',
    description: 'Blood ruby, intense scarlet & deep dramatic passion',
    colors: ['#FF1E56', '#E11D48', '#BE123C'],
    previewCss: 'linear-gradient(135deg, #FF1E56, #E11D48, #BE123C)'
  },
  {
    id: 'vaporwave',
    name: '80s Vaporwave',
    description: 'Cotton candy cyan, vibrant bubblegum pink & soft lilac',
    colors: ['#05FFA1', '#B967FF', '#FF71CE'],
    previewCss: 'linear-gradient(135deg, #05FFA1, #B967FF, #FF71CE)'
  },
  {
    id: 'deep-space',
    name: 'Cosmic Nebula',
    description: 'Deep starlight violet, nebula purple & celestial cyan',
    colors: ['#818CF8', '#C084FC', '#38BDF8'],
    previewCss: 'linear-gradient(135deg, #818CF8, #C084FC, #38BDF8)'
  },
  {
    id: 'arctic-ice',
    name: 'Glacial Ice',
    description: 'Diamond white frost, arctic cyan & frozen crystal shine',
    colors: ['#F0FDFA', '#67E8F9', '#38BDF8'],
    previewCss: 'linear-gradient(135deg, #F0FDFA, #67E8F9, #38BDF8)'
  },
  {
    id: 'royal-amethyst',
    name: 'Royal Amethyst',
    description: 'Imperial purple velvet, luminous mauve & jewel radiance',
    colors: ['#C084FC', '#9333EA', '#6B21A8'],
    previewCss: 'linear-gradient(135deg, #C084FC, #9333EA, #6B21A8)'
  },
  {
    id: 'desert-dune',
    name: 'Desert Mirage',
    description: 'Warm sahara gold, sunbaked terracotta & burnt amber',
    colors: ['#FBBF24', '#F97316', '#EA580C'],
    previewCss: 'linear-gradient(135deg, #FBBF24, #F97316, #EA580C)'
  },
  {
    id: 'monochrome-cinema',
    name: 'Noir Film Platinum',
    description: 'High-contrast monochrome silver, zinc mist & pure platinum',
    colors: ['#FFFFFF', '#E4E4E7', '#A1A1AA'],
    previewCss: 'linear-gradient(135deg, #FFFFFF, #E4E4E7, #A1A1AA)'
  }
];

export type GradientMode = 
  | 'block-shift' 
  | 'word-gradient' 
  | 'alternating-speakers' 
  | 'syllable-karaoke' 
  | 'gradient-glow'
  | 'ping-pong'
  | 'first-last-accent'
  | 'center-out'
  | 'odd-even-words'
  | 'random-scatter'
  | 'rainbow-cycle'
  | 'tri-color-split';

export type TargetStreamField = 'all' | 'both' | 'translated' | 'original' | 'google';

/**
 * Strips HTML and font tags from text
 */
export function stripFormatting(text: string): string {
  if (!text) return '';
  return text
    .replace(/<font[^>]*>/gi, '')
    .replace(/<\/font>/gi, '')
    .replace(/<[^>]+>/gi, '')
    .replace(/\{[^}]+\}/g, '') // strip ASS tags
    .replace(/\\N/gi, ' ')     // replace ASS newline \N
    .replace(/\\h/gi, ' ')     // replace ASS hard space \h
    .trim();
}

/**
 * Checks if text contains formatting tags
 */
export function hasFormatting(text: string): boolean {
  if (!text) return false;
  return /<font[^>]*>|<b\b|<i\b|<u\b|\{\\/i.test(text);
}

export interface FormattedPreviewResult {
  html: string;
  plain: string;
  hasHtmlFormatting: boolean;
}

/**
 * Cleans and prepares subtitle text for UI previews (e.g., live 3-stream preview headers in Fonts and Resize menus):
 * - Strips raw ASS/SSA override codes ({\an8}, {\pos(..)}, {\fad(..)}, etc.)
 * - Replaces \N and \h with clean spaces
 * - Sanitizes HTML formatting so rich colors/styling render cleanly via dangerouslySetInnerHTML
 * - Provides clean plain text stripped of all tags and codes
 * - Falls back to a human-readable default if the input is empty or contains only markup codes
 */
export function formatSubtitlePreview(rawText?: string, fallback: string = ''): FormattedPreviewResult {
  if (!rawText || !rawText.trim()) {
    return { html: fallback, plain: fallback, hasHtmlFormatting: false };
  }

  // 1. Remove ASS tags and newline tokens
  const withoutAss = rawText
    .replace(/\{[^}]+\}/g, '')
    .replace(/\\N/gi, ' ')
    .replace(/\\h/gi, ' ')
    .replace(/[\r\n]+/g, ' ')
    .trim();

  // 2. Extract plain text
  const plainText = stripFormatting(withoutAss).trim();
  if (!plainText) {
    return { html: fallback, plain: fallback, hasHtmlFormatting: false };
  }

  // 3. Detect if text has HTML tags (<font>, <b>, <i>, <u>, <span>, etc.)
  const hasHtml = /<\/?(font|b|i|u|strong|em|span|color)[^>]*>/i.test(withoutAss);

  if (hasHtml) {
    // Strip any dangerous/disallowed tags and attributes
    const sanitizedHtml = withoutAss
      .replace(/<\/?(script|iframe|object|embed|form|input|button|style|meta|link)[^>]*>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '');

    return {
      html: sanitizedHtml,
      plain: plainText,
      hasHtmlFormatting: true
    };
  }

  return {
    html: plainText,
    plain: plainText,
    hasHtmlFormatting: false
  };
}

/**
/**
 * Converts opacity (0 to 1, where 1 is opaque) to ASS alpha hex (where 00 is opaque, FF is invisible)
 */
export function opacityToAssAlpha(opacity: number = 1): string {
  const clamped = Math.max(0, Math.min(1, opacity));
  const val = Math.round((1 - clamped) * 255);
  return val.toString(16).padStart(2, '0').toUpperCase();
}

/**
 * Converts Hex (#RRGGBB) to rgba(r, g, b, a) CSS string
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  if (hex.startsWith('rgba')) return hex;
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length < 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Converts Hex (#RRGGBB or rgba) to ASS [V4+ Styles] color format (&HAABBGGRR - 8 hex digits, no trailing &)
 * This is the exact format required by libass, MX Player, VLC and Aegisub in style headers.
 */
export function hexToAssStyleColor(hex: string, alpha: string = '00'): string {
  if (!hex) return `&H${alpha}FFFFFF`;
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.startsWith('rgba')) {
    const match = cleanHex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
      const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
      const b = parseInt(match[3], 10).toString(16).padStart(2, '0');
      const a = match[4] !== undefined ? opacityToAssAlpha(parseFloat(match[4])) : alpha;
      return `&H${a}${b}${g}${r}`.toUpperCase();
    }
  }
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length === 8) {
    const r = cleanHex.substring(0, 2);
    const g = cleanHex.substring(2, 4);
    const b = cleanHex.substring(4, 6);
    const cssAlphaHex = cleanHex.substring(6, 8);
    const cssAlphaVal = parseInt(cssAlphaHex, 16) || 255;
    const assAlpha = Math.max(0, Math.min(255, 255 - cssAlphaVal)).toString(16).padStart(2, '0').toUpperCase();
    return `&H${assAlpha}${b}${g}${r}`.toUpperCase();
  }
  if (cleanHex.length !== 6) return `&H${alpha}FFFFFF`;
  const r = cleanHex.substring(0, 2);
  const g = cleanHex.substring(2, 4);
  const b = cleanHex.substring(4, 6);
  return `&H${alpha}${b}${g}${r}`.toUpperCase();
}

/**
 * Converts Hex (#RRGGBB) to ASS inline override tag color (&HBBGGRR& - 6 hex digits, with trailing &)
 * Used in {\c&HBBGGRR&}, {\1c&HBBGGRR&}, {\2c&HBBGGRR&}, {\3c&HBBGGRR&}, {\4c&HBBGGRR&}.
 */
export function hexToAssInlineColor(hex: string): string {
  if (!hex) return '&HFFFFFF&';
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.startsWith('rgba')) {
    const match = cleanHex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
      const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
      const b = parseInt(match[3], 10).toString(16).padStart(2, '0');
      return `&H${b}${g}${r}&`.toUpperCase();
    }
  }
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length >= 6) {
    const r = cleanHex.substring(0, 2);
    const g = cleanHex.substring(2, 4);
    const b = cleanHex.substring(4, 6);
    return `&H${b}${g}${r}&`.toUpperCase();
  }
  return '&HFFFFFF&';
}

/**
 * Legacy wrapper: converts Hex (#RRGGBB) to ASS color (&H00BBGGRR&)
 */
export function hexToAssColor(hex: string, alpha: string = '00'): string {
  const styleCol = hexToAssStyleColor(hex, alpha);
  return `${styleCol}&`;
}

/**
 * Interpolates between two hex colors by factor (0 to 1)
 */
export function interpolateColor(color1: string, color2: string, factor: number): string {
  const c1 = color1.replace('#', '');
  const c2 = color2.replace('#', '');
  
  const r1 = parseInt(c1.substring(0, 2), 16);
  const g1 = parseInt(c1.substring(2, 4), 16);
  const b1 = parseInt(c1.substring(4, 6), 16);

  const r2 = parseInt(c2.substring(0, 2), 16);
  const g2 = parseInt(c2.substring(2, 4), 16);
  const b2 = parseInt(c2.substring(4, 6), 16);

  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));

  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generates an array of N interpolated colors from a multi-color palette
 */
export function getPaletteGradientArray(palette: string[], steps: number): string[] {
  if (steps <= 1) return [palette[0]];
  if (palette.length === 1) return Array(steps).fill(palette[0]);

  const result: string[] = [];
  const segments = palette.length - 1;

  for (let i = 0; i < steps; i++) {
    const overallProgress = i / (steps - 1);
    const segmentIndex = Math.min(Math.floor(overallProgress * segments), segments - 1);
    const segmentProgress = (overallProgress * segments) - segmentIndex;
    
    const c1 = palette[segmentIndex];
    const c2 = palette[segmentIndex + 1];
    result.push(interpolateColor(c1, c2, segmentProgress));
  }

  return result;
}

/**
 * Applies color gradients to subtitle items
 */
export function applyGradientsToSubtitles(
  items: SubtitleItem[],
  paletteId: string,
  mode: GradientMode,
  targetField: TargetStreamField = 'all',
  options?: {
    customColors?: string[];
    boldEmphasis?: boolean;
    italicize?: boolean;
    uppercaseOriginal?: boolean;
  }
): SubtitleItem[] {
  const palette = GRADIENT_PALETTES.find(p => p.id === paletteId) || GRADIENT_PALETTES[0];
  const colors = options?.customColors && options.customColors.length > 0 ? options.customColors : palette.colors;
  const total = items.length;

  // Pre-calculate block colors for 'block-shift' and 'alternating-speakers'
  const blockColors = getPaletteGradientArray(colors, Math.max(total, 2));

  const shouldStyleOriginal = targetField === 'all' || targetField === 'both' || targetField === 'original';
  const shouldStyleTranslated = targetField === 'all' || targetField === 'both' || targetField === 'translated';
  const shouldStyleGoogle = targetField === 'all' || targetField === 'google';

  const wrapText = (text: string, color: string) => {
    let t = text;
    if (options?.uppercaseOriginal) {
      t = t.toUpperCase();
    }
    if (options?.boldEmphasis) {
      t = `<b>${t}</b>`;
    }
    if (options?.italicize) {
      t = `<i>${t}</i>`;
    }
    return `<font color="${color}">${t}</font>`;
  };

  const styleTextString = (raw: string, color: string, itemIdx: number) => {
    if (!raw) return '';
    if (mode === 'block-shift') {
      return wrapText(raw, color);
    } else if (mode === 'ping-pong') {
      const len = colors.length;
      let pingColor = colors[0];
      if (len > 1) {
        const cycle = 2 * (len - 1);
        const step = itemIdx % cycle;
        const colIdx = step < len ? step : cycle - step;
        pingColor = colors[colIdx];
      }
      return wrapText(raw, pingColor);
    } else if (mode === 'alternating-speakers') {
      const altColor = colors[itemIdx % colors.length];
      return wrapText(raw, altColor);
    } else if (mode === 'gradient-glow') {
      const glowColor = colors[0];
      return wrapText(raw, glowColor);
    } else if (mode === 'first-last-accent') {
      const words = raw.split(/\s+/).filter(Boolean);
      if (words.length <= 1) return wrapText(raw, colors[0]);
      const cFirst = colors[0];
      const cLast = colors[colors.length - 1];
      const cMid = colors[Math.floor(colors.length / 2)] || colors[0];
      return words.map((w, wIdx) => {
        let c = cMid;
        if (wIdx === 0) c = cFirst;
        else if (wIdx === words.length - 1) c = cLast;
        let wc = w;
        if (options?.boldEmphasis) wc = `<b>${wc}</b>`;
        if (options?.italicize) wc = `<i>${wc}</i>`;
        return `<font color="${c}">${wc}</font>`;
      }).join(' ');
    } else if (mode === 'center-out') {
      const words = raw.split(/\s+/).filter(Boolean);
      if (words.length <= 1) return wrapText(raw, colors[colors.length - 1]);
      const mid = Math.floor(words.length / 2);
      const maxDist = Math.max(mid, 1);
      return words.map((w, wIdx) => {
        const dist = Math.abs(wIdx - mid);
        const factor = 1 - (dist / maxDist);
        const c = interpolateColor(colors[0], colors[colors.length - 1], Math.max(0, Math.min(1, factor)));
        let wc = w;
        if (options?.boldEmphasis) wc = `<b>${wc}</b>`;
        if (options?.italicize) wc = `<i>${wc}</i>`;
        return `<font color="${c}">${wc}</font>`;
      }).join(' ');
    } else if (mode === 'odd-even-words') {
      const words = raw.split(/\s+/).filter(Boolean);
      if (words.length <= 1) return wrapText(raw, colors[0]);
      const cOdd = colors[1] || colors[colors.length - 1];
      return words.map((w, wIdx) => {
        const c = wIdx % 2 === 0 ? colors[0] : cOdd;
        let wc = w;
        if (options?.boldEmphasis) wc = `<b>${wc}</b>`;
        if (options?.italicize) wc = `<i>${wc}</i>`;
        return `<font color="${c}">${wc}</font>`;
      }).join(' ');
    } else if (mode === 'random-scatter') {
      const words = raw.split(/\s+/).filter(Boolean);
      if (words.length === 0) return '';
      return words.map((w, wIdx) => {
        const hash = Math.abs(Math.sin((itemIdx + 1) * 997 + (wIdx + 1) * 37));
        const cIdx = Math.floor(hash * colors.length) % colors.length;
        let wc = w;
        if (options?.boldEmphasis) wc = `<b>${wc}</b>`;
        if (options?.italicize) wc = `<i>${wc}</i>`;
        return `<font color="${colors[cIdx]}">${wc}</font>`;
      }).join(' ');
    } else if (mode === 'rainbow-cycle') {
      const words = raw.split(/\s+/).filter(Boolean);
      if (words.length === 0) return '';
      return words.map((w, wIdx) => {
        const c = colors[wIdx % colors.length];
        let wc = w;
        if (options?.boldEmphasis) wc = `<b>${wc}</b>`;
        if (options?.italicize) wc = `<i>${wc}</i>`;
        return `<font color="${c}">${wc}</font>`;
      }).join(' ');
    } else if (mode === 'tri-color-split') {
      const words = raw.split(/\s+/).filter(Boolean);
      if (words.length <= 2) return wrapText(raw, colors[0]);
      const third = Math.max(1, Math.floor(words.length / 3));
      const c1 = colors[0];
      const c2 = colors[Math.floor(colors.length / 2)] || colors[0];
      const c3 = colors[colors.length - 1];
      return words.map((w, wIdx) => {
        let c = c1;
        if (wIdx >= 2 * third) c = c3;
        else if (wIdx >= third) c = c2;
        let wc = w;
        if (options?.boldEmphasis) wc = `<b>${wc}</b>`;
        if (options?.italicize) wc = `<i>${wc}</i>`;
        return `<font color="${c}">${wc}</font>`;
      }).join(' ');
    } else if (mode === 'syllable-karaoke') {
      const words = raw.split(/\s+/).filter(Boolean);
      if (words.length <= 1) return wrapText(raw, color);
      const activeIdx = Math.floor((itemIdx % words.length));
      return words.map((w, wIdx) => {
        const c = wIdx === activeIdx ? colors[colors.length - 1] : colors[0];
        let wordContent = w;
        if (options?.boldEmphasis) wordContent = `<b>${wordContent}</b>`;
        return `<font color="${c}">${wordContent}</font>`;
      }).join(' ');
    } else if (mode === 'word-gradient') {
      const words = raw.split(/\s+/).filter(Boolean);
      if (words.length === 0) return '';
      const wordColors = getPaletteGradientArray(colors, Math.max(words.length, 2));
      return words.map((w, wIdx) => {
        let wordContent = w;
        if (options?.boldEmphasis) wordContent = `<b>${wordContent}</b>`;
        if (options?.italicize) wordContent = `<i>${wordContent}</i>`;
        return `<font color="${wordColors[wIdx % wordColors.length]}">${wordContent}</font>`;
      }).join(' ');
    }
    return wrapText(raw, color);
  };

  return items.map((item, index) => {
    let rawOriginal = stripFormatting(item.text || '');
    if (options?.uppercaseOriginal) {
      rawOriginal = rawOriginal.toUpperCase();
    }
    const rawTranslated = stripFormatting(item.translatedText || '');
    const rawGoogle = stripFormatting(item.googleTranslateText || '');

    const currentBlockColor = blockColors[index % blockColors.length];

    let styledOriginal = shouldStyleOriginal && rawOriginal 
      ? styleTextString(rawOriginal, currentBlockColor, index) 
      : (options?.uppercaseOriginal ? rawOriginal : item.text);

    let styledTranslated = shouldStyleTranslated && rawTranslated 
      ? styleTextString(rawTranslated, currentBlockColor, index) 
      : item.translatedText;

    let styledGoogle = shouldStyleGoogle && rawGoogle 
      ? styleTextString(rawGoogle, currentBlockColor, index) 
      : item.googleTranslateText;

    return {
      ...item,
      text: styledOriginal || item.text,
      translatedText: styledTranslated || item.translatedText,
      googleTranslateText: styledGoogle || item.googleTranslateText,
      styleColor: currentBlockColor
    };
  });
}

/**
 * Renders a single text string with active styling tags for live preview or formatting
 */
export function renderStylizedSubtitleHtml(
  rawText: string,
  itemIndex: number,
  paletteId: string,
  mode: GradientMode,
  options?: {
    customColors?: string[];
    boldEmphasis?: boolean;
    italicize?: boolean;
    uppercaseOriginal?: boolean;
    transformCase?: 'none' | 'uppercase' | 'capitalize' | 'lowercase';
  }
): string {
  if (!rawText) return '';
  // If text already has font tags, return as is
  if (hasFormatting(rawText)) {
    return rawText;
  }

  const clean = stripFormatting(rawText);
  let processedText = clean;
  if (options?.uppercaseOriginal || options?.transformCase === 'uppercase') {
    processedText = processedText.toUpperCase();
  } else if (options?.transformCase === 'lowercase') {
    processedText = processedText.toLowerCase();
  }

  const palette = GRADIENT_PALETTES.find(p => p.id === paletteId) || GRADIENT_PALETTES[0];
  const colors = options?.customColors && options.customColors.length > 0 ? options.customColors : palette.colors;
  const currentBlockColor = colors[itemIndex % colors.length];

  const wrapWord = (t: string, col: string) => {
    let inner = t;
    if (options?.boldEmphasis) inner = `<b>${inner}</b>`;
    if (options?.italicize) inner = `<i>${inner}</i>`;
    return `<font color="${col}">${inner}</font>`;
  };

  if (mode === 'block-shift') {
    return wrapWord(processedText, currentBlockColor);
  } else if (mode === 'ping-pong') {
    const len = colors.length;
    let pingColor = colors[0];
    if (len > 1) {
      const cycle = 2 * (len - 1);
      const step = itemIndex % cycle;
      const colIdx = step < len ? step : cycle - step;
      pingColor = colors[colIdx];
    }
    return wrapWord(processedText, pingColor);
  } else if (mode === 'alternating-speakers') {
    const altColor = colors[itemIndex % colors.length];
    return wrapWord(processedText, altColor);
  } else if (mode === 'gradient-glow') {
    return wrapWord(processedText, colors[0]);
  } else if (mode === 'first-last-accent') {
    const words = processedText.split(/\s+/).filter(Boolean);
    if (words.length <= 1) return wrapWord(processedText, colors[0]);
    const cFirst = colors[0];
    const cLast = colors[colors.length - 1];
    const cMid = colors[Math.floor(colors.length / 2)] || colors[0];
    return words.map((w, wIdx) => {
      let c = cMid;
      if (wIdx === 0) c = cFirst;
      else if (wIdx === words.length - 1) c = cLast;
      return wrapWord(w, c);
    }).join(' ');
  } else if (mode === 'center-out') {
    const words = processedText.split(/\s+/).filter(Boolean);
    if (words.length <= 1) return wrapWord(processedText, colors[colors.length - 1]);
    const mid = Math.floor(words.length / 2);
    const maxDist = Math.max(mid, 1);
    return words.map((w, wIdx) => {
      const dist = Math.abs(wIdx - mid);
      const factor = 1 - (dist / maxDist);
      const c = interpolateColor(colors[0], colors[colors.length - 1], Math.max(0, Math.min(1, factor)));
      return wrapWord(w, c);
    }).join(' ');
  } else if (mode === 'odd-even-words') {
    const words = processedText.split(/\s+/).filter(Boolean);
    if (words.length <= 1) return wrapWord(processedText, colors[0]);
    const cOdd = colors[1] || colors[colors.length - 1];
    return words.map((w, wIdx) => {
      const c = wIdx % 2 === 0 ? colors[0] : cOdd;
      return wrapWord(w, c);
    }).join(' ');
  } else if (mode === 'random-scatter') {
    const words = processedText.split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';
    return words.map((w, wIdx) => {
      const hash = Math.abs(Math.sin((itemIndex + 1) * 997 + (wIdx + 1) * 37));
      const cIdx = Math.floor(hash * colors.length) % colors.length;
      return wrapWord(w, colors[cIdx]);
    }).join(' ');
  } else if (mode === 'rainbow-cycle') {
    const words = processedText.split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';
    return words.map((w, wIdx) => {
      return wrapWord(w, colors[wIdx % colors.length]);
    }).join(' ');
  } else if (mode === 'tri-color-split') {
    const words = processedText.split(/\s+/).filter(Boolean);
    if (words.length <= 2) return wrapWord(processedText, colors[0]);
    const third = Math.max(1, Math.floor(words.length / 3));
    const c1 = colors[0];
    const c2 = colors[Math.floor(colors.length / 2)] || colors[0];
    const c3 = colors[colors.length - 1];
    return words.map((w, wIdx) => {
      let c = c1;
      if (wIdx >= 2 * third) c = c3;
      else if (wIdx >= third) c = c2;
      return wrapWord(w, c);
    }).join(' ');
  } else if (mode === 'syllable-karaoke') {
    const words = processedText.split(/\s+/).filter(Boolean);
    if (words.length <= 1) return wrapWord(processedText, currentBlockColor);
    const activeIdx = Math.floor(itemIndex % words.length);
    return words.map((w, wIdx) => {
      const c = wIdx === activeIdx ? colors[colors.length - 1] : colors[0];
      return wrapWord(w, c);
    }).join(' ');
  } else if (mode === 'word-gradient') {
    const words = processedText.split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';
    const wordColors = getPaletteGradientArray(colors, Math.max(words.length, 2));
    return words.map((w, wIdx) => {
      return wrapWord(w, wordColors[wIdx % wordColors.length]);
    }).join(' ');
  }

  return wrapWord(processedText, currentBlockColor);
}

export interface SubtitleCssStyleOptions {
  textOutline?: 'none' | 'subtle' | 'medium' | 'bold' | 'ultra' | 'neon' | 'double' | 'emboss';
  customOutlineColor?: string;
  outlineOpacity?: number;
  outlineBlur?: number;
  // SSA / ASS Native Parameters
  outlineWidth?: number; // ASS \bord (0 - 10px)
  strokeIndependent?: boolean;
  strokeXWidth?: number; // ASS \xbord (0 - 10px)
  strokeYWidth?: number; // ASS \ybord (0 - 10px)
  borderStyle?: 1 | 3; // ASS BorderStyle: 1 = outline + shadow, 3 = opaque box
  textShadow?: 'none' | 'soft' | 'hard' | 'cinematic' | 'neon-glow' | 'backlight' | 'retro-drop' | 'extrusion-3d' | 'cyberpunk-glitch' | 'fiery-blaze';
  customShadowColor?: string;
  shadowBlur?: number;
  shadowDepth?: number; // ASS \shad
  shadowOffsetX?: number; // ASS \xshad
  shadowOffsetY?: number; // ASS \yshad
  shadowOpacity?: number; // ASS \4a
  glowActive?: boolean;
  glowBlur?: number; // ASS \blur with \3c
  glowColor?: string;
  glowOpacity?: number;
  edgeBlurMode?: 'gaussian' | 'simple'; // ASS \blur vs \be
  edgeBlurStrength?: number; // ASS \blur / \be
  highlightActive?: boolean;
  highlightColor?: string; // ASS SecondaryColour / \2c
  highlightOpacity?: number; // ASS \2a
  highlightMode?: 'accent' | 'karaoke' | 'specular';
  backdropBox?: 'none' | 'subtle-box' | 'heavy-tint' | 'frost-blur' | 'tinted-palette' | 'cinema-black' | 'glowing-border' | 'comic-bubble' | 'accent-bar';
  backdropPadding?: 'minimal' | 'compact' | 'standard' | 'spacious';
  backdropRadius?: 'none' | 'rounded' | 'smooth' | 'pill';
  backdropOpacity?: number;
  backdropBlur?: number;
  fontWeight?: string;
  letterSpacing?: string;
  lineHeight?: string;
  textAlign?: string;
  transformCase?: 'none' | 'uppercase' | 'capitalize' | 'lowercase';
  boldEmphasis?: boolean;
  italicize?: boolean;
  underline?: boolean;
  animation?: string;
  activePaletteColors?: string[];
}

/**
 * Computes exact CSS style object and CSS class name for rendering subtitles across workspace columns
 */
export function computeSubtitleCssStyles(config: SubtitleCssStyleOptions): {
  style: React.CSSProperties;
  className: string;
} {
  const styles: React.CSSProperties = {};
  const classes: string[] = [];

  // 1. Text Outline / Stroke (SSA/ASS \bord, \xbord, \ybord, \3c, \3a)
  const outlineCol = config.customOutlineColor || '#000000';
  const outlineRgba = hexToRgba(outlineCol, config.outlineOpacity ?? 1);

  if (config.strokeIndependent && (config.strokeXWidth !== undefined || config.strokeYWidth !== undefined)) {
    const xW = config.strokeXWidth ?? 2;
    const yW = config.strokeYWidth ?? 2;
    const strokeShadows: string[] = [];
    if (xW > 0) strokeShadows.push(`-${xW}px 0 0 ${outlineRgba}`, `${xW}px 0 0 ${outlineRgba}`);
    if (yW > 0) strokeShadows.push(`0 -${yW}px 0 ${outlineRgba}`, `0 ${yW}px 0 ${outlineRgba}`);
    if (xW > 0 && yW > 0) {
      strokeShadows.push(
        `-${xW}px -${yW}px 0 ${outlineRgba}`,
        `${xW}px -${yW}px 0 ${outlineRgba}`,
        `-${xW}px ${yW}px 0 ${outlineRgba}`,
        `${xW}px ${yW}px 0 ${outlineRgba}`
      );
    }
    if (strokeShadows.length > 0) {
      styles.textShadow = strokeShadows.join(', ');
    }
  } else if (config.outlineWidth !== undefined && config.outlineWidth > 0) {
    styles.WebkitTextStroke = `${config.outlineWidth}px ${outlineRgba}`;
  } else if (config.textOutline && config.textOutline !== 'none') {
    let strokeWidth = '1px';
    if (config.textOutline === 'subtle') strokeWidth = '1px';
    else if (config.textOutline === 'medium') strokeWidth = '2px';
    else if (config.textOutline === 'bold') strokeWidth = '3px';
    else if (config.textOutline === 'ultra') strokeWidth = '4.5px';
    else if (config.textOutline === 'neon') strokeWidth = '1.5px';
    else if (config.textOutline === 'double') strokeWidth = '2px';
    else if (config.textOutline === 'emboss') strokeWidth = '1.5px';

    styles.WebkitTextStroke = `${strokeWidth} ${outlineRgba}`;
  }

  // 2. Text Shadow (SSA/ASS \shad, \xshad, \yshad, \4c, \4a) & Glows (\blur with \3c)
  const shadowCol = hexToRgba(config.customShadowColor || '#000000', config.shadowOpacity ?? 0.85);
  const sBlur = config.shadowBlur ?? 4;
  const sOffX = config.shadowOffsetX ?? 0;
  const sOffY = config.shadowOffsetY ?? config.shadowDepth ?? 2;

  const shadowLayers: string[] = [];

  if (config.textShadow && config.textShadow !== 'none') {
    switch (config.textShadow) {
      case 'soft':
        shadowLayers.push(`${sOffX}px ${sOffY}px ${sBlur}px ${shadowCol}`);
        break;
      case 'hard':
        shadowLayers.push(`${sOffX + 2}px ${sOffY + 2}px 0px ${shadowCol}`);
        break;
      case 'cinematic':
        shadowLayers.push(`0 2px 4px ${shadowCol}`, `0 4px 10px rgba(0,0,0,0.9)`);
        break;
      case 'neon-glow':
        shadowLayers.push(`0 0 6px ${shadowCol}`, `0 0 16px ${shadowCol}`, `0 0 28px ${shadowCol}`);
        break;
      case 'backlight':
        shadowLayers.push(`0 0 10px rgba(255,255,255,0.45)`, `0 3px 8px ${shadowCol}`);
        break;
      case 'retro-drop':
        shadowLayers.push(`3px 3px 0px ${shadowCol}`, `5px 5px 0px rgba(0,0,0,0.4)`);
        break;
      case 'extrusion-3d':
        shadowLayers.push(`1px 1px 0 #000`, `2px 2px 0 #000`, `3px 3px 0 #000`, `4px 4px 5px ${shadowCol}`);
        break;
      case 'cyberpunk-glitch':
        shadowLayers.push(`-2px 0 #00F5D4`, `2px 0 #F15BB5`, `0 2px 5px ${shadowCol}`);
        break;
      case 'fiery-blaze':
        shadowLayers.push(`0 -2px 5px #FFD166`, `0 -4px 9px #F97316`, `0 -8px 14px #EF4444`);
        break;
    }
  } else if ((config.shadowDepth !== undefined && config.shadowDepth > 0) || sOffX !== 0 || sOffY !== 0) {
    shadowLayers.push(`${sOffX}px ${sOffY}px ${sBlur}px ${shadowCol}`);
  }

  // 4: Dedicated Glows (SSA/ASS \blur with outline)
  if (config.glowActive && (config.glowBlur ?? 0) > 0) {
    const glowCol = hexToRgba(config.glowColor || '#00F5D4', config.glowOpacity ?? 0.85);
    const gB = config.glowBlur!;
    shadowLayers.push(`0 0 ${gB * 1.5}px ${glowCol}`, `0 0 ${gB * 3.5}px ${glowCol}`);
  }

  if (shadowLayers.length > 0) {
    if (styles.textShadow) {
      styles.textShadow = `${styles.textShadow}, ${shadowLayers.join(', ')}`;
    } else {
      styles.textShadow = shadowLayers.join(', ');
    }
  }

  // 5: Edge Blur (SSA/ASS \blur / \be)
  if (config.edgeBlurStrength && config.edgeBlurStrength > 0) {
    const blurPx = Math.min(3, config.edgeBlurStrength * 0.35).toFixed(1);
    styles.filter = `blur(${blurPx}px)`;
  }

  // 6: Highlights (SSA/ASS SecondaryColour / \2c / \2a)
  if (config.highlightActive && config.highlightColor) {
    const hCol = hexToRgba(config.highlightColor, config.highlightOpacity ?? 1);
    if (config.highlightMode === 'karaoke') {
      styles.color = hCol;
    } else if (config.highlightMode === 'specular') {
      styles.borderTop = `1.5px solid ${hCol}`;
    }
  }

  // 3. Backdrop Box
  const accentColor = config.activePaletteColors?.[0] || '#10B981';
  const bOpacity = config.backdropOpacity ?? 0.65;
  const bBlur = config.backdropBlur ?? 8;

  if (config.backdropBox && config.backdropBox !== 'none') {
    // Padding
    let pad = '4px 10px';
    if (config.backdropPadding === 'minimal') pad = '2px 6px';
    else if (config.backdropPadding === 'compact') pad = '4px 8px';
    else if (config.backdropPadding === 'standard') pad = '6px 12px';
    else if (config.backdropPadding === 'spacious') pad = '8px 16px';
    styles.padding = pad;

    // Radius
    let rad = '8px';
    if (config.backdropRadius === 'none') rad = '0px';
    else if (config.backdropRadius === 'rounded') rad = '6px';
    else if (config.backdropRadius === 'smooth') rad = '12px';
    else if (config.backdropRadius === 'pill') rad = '9999px';
    styles.borderRadius = rad;

    styles.display = 'inline-block';

    switch (config.backdropBox) {
      case 'subtle-box':
        styles.backgroundColor = `rgba(0, 0, 0, ${bOpacity})`;
        break;
      case 'heavy-tint':
        styles.backgroundColor = `rgba(0, 0, 0, 0.88)`;
        break;
      case 'frost-blur':
        styles.backgroundColor = `rgba(18, 18, 24, ${bOpacity})`;
        styles.backdropFilter = `blur(${bBlur}px)`;
        styles.WebkitBackdropFilter = `blur(${bBlur}px)`;
        styles.border = '1px solid rgba(255,255,255,0.12)';
        break;
      case 'tinted-palette':
        styles.backgroundColor = `${accentColor}26`; // 15% opacity hex
        styles.border = `1px solid ${accentColor}55`;
        break;
      case 'cinema-black':
        styles.backgroundColor = '#000000';
        break;
      case 'glowing-border':
        styles.backgroundColor = `rgba(10, 10, 15, ${bOpacity})`;
        styles.border = `1.5px solid ${accentColor}`;
        styles.boxShadow = `0 0 10px ${accentColor}55`;
        break;
      case 'comic-bubble':
        styles.backgroundColor = `rgba(20, 20, 25, 0.94)`;
        styles.border = '2px solid #FFFFFF';
        styles.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
        break;
      case 'accent-bar':
        styles.backgroundColor = `rgba(0, 0, 0, ${bOpacity})`;
        styles.borderLeft = `3.5px solid ${accentColor}`;
        break;
    }
  }

  // 4. Typography
  if (config.fontWeight) styles.fontWeight = config.fontWeight;
  if (config.letterSpacing) styles.letterSpacing = config.letterSpacing;
  if (config.lineHeight) styles.lineHeight = config.lineHeight;
  if (config.textAlign && config.textAlign !== 'auto') {
    styles.textAlign = config.textAlign as any;
  }
  if (config.transformCase && config.transformCase !== 'none') {
    styles.textTransform = config.transformCase;
  }
  if (config.boldEmphasis) styles.fontWeight = '700';
  if (config.italicize) styles.fontStyle = 'italic';

  // 5. Animations
  if (config.animation && config.animation !== 'none') {
    if (config.animation === 'pulse-glow') classes.push('anim-pulse-glow');
    else if (config.animation === 'neon-flicker') classes.push('anim-neon-flicker');
    else if (config.animation === 'wave-bounce') classes.push('anim-wave-bounce');
    else if (config.animation === 'karaoke-fade') classes.push('anim-karaoke-fade');
    else if (config.animation === 'cinema-zoom') classes.push('anim-cinema-zoom');
    else if (config.animation === 'audio-ripple') classes.push('anim-audio-ripple');
    else if (config.animation === 'shimmer') classes.push('anim-shimmer');
  }

  return {
    style: styles,
    className: classes.join(' ')
  };
}

/**
 * Removes all formatting from subtitles
 */
export function removeAllGradientsFromSubtitles(items: SubtitleItem[]): SubtitleItem[] {
  return items.map(item => ({
    ...item,
    text: stripFormatting(item.text),
    translatedText: item.translatedText ? stripFormatting(item.translatedText) : undefined,
    googleTranslateText: item.googleTranslateText ? stripFormatting(item.googleTranslateText) : undefined,
    styleColor: undefined
  }));
}

/**
 * Generates formatted SRT content preserving all <font color="..."> and HTML tags
 */
export function generateFormattedSRT(
  items: SubtitleItem[], 
  type: 'ai' | 'google' | 'original' = 'ai'
): string {
  return items.map(item => {
    let content = '';
    if (type === 'ai') {
      content = item.translatedText || item.text;
    } else if (type === 'google') {
      content = item.googleTranslateText || item.text;
    } else {
      content = item.text;
    }

    return `${item.index}\n${item.startTime} --> ${item.endTime}\n${content.trim()}\n`;
  }).join('\n');
}

/**
 * Generates clean plain SRT content with all HTML/Font tags stripped
 */
export function generateCleanSRT(
  items: SubtitleItem[], 
  type: 'ai' | 'google' | 'original' = 'ai'
): string {
  return items.map(item => {
    let content = '';
    if (type === 'ai') {
      content = stripFormatting(item.translatedText || item.text);
    } else if (type === 'google') {
      content = stripFormatting(item.googleTranslateText || item.text);
    } else {
      content = stripFormatting(item.text);
    }

    return `${item.index}\n${item.startTime} --> ${item.endTime}\n${content.trim()}\n`;
  }).join('\n');
}

/**
 * Converts SRT timestamp (00:01:23,456) to ASS timestamp (0:01:23.45)
 */
function srtTimeToAssTime(srtTime: string): string {
  if (!srtTime) return '0:00:00.00';
  const parts = srtTime.trim().split(',');
  const hms = parts[0].split(':');
  const ms = parts[1] || '000';
  
  const h = parseInt(hms[0] || '0', 10);
  const m = hms[1] || '00';
  const s = hms[2] || '00';
  const cs = ms.substring(0, 2); // Centiseconds (2 digits)

  return `${h}:${m}:${s}.${cs}`;
}

/**
 * Converts text with HTML <font color="#..."> tags into standard ASS tags {\c&HBBGGRR&}
 * and strips any stray non-ASS HTML tags (like <span>, <div>, <p>) that break mobile video players.
 */
export function htmlToAssTags(text: string, defaultColorInline: string = '&HFFFFFF&'): string {
  if (!text) return '';
  
  // Replace line breaks with ASS \N
  let result = text.replace(/<br\s*\/?>/gi, '\\N');
  result = result.replace(/\r?\n/g, '\\N');

  // Replace <b>, <i>, <u>
  result = result.replace(/<b>/gi, '{\\b1}').replace(/<\/b>/gi, '{\\b0}');
  result = result.replace(/<i>/gi, '{\\i1}').replace(/<\/i>/gi, '{\\i0}');
  result = result.replace(/<u>/gi, '{\\u1}').replace(/<\/u>/gi, '{\\u0}');

  // Replace <font color="#RRGGBB"> with {\c&HBBGGRR&} (6 hex digits, with trailing &)
  result = result.replace(/<font\s+color=["']?#?([0-9a-fA-F]{6})["']?>/gi, (_, hex) => {
    return `{\\c${hexToAssInlineColor(hex)}}`;
  });

  // Replace </font> with default color restoration
  result = result.replace(/<\/font>/gi, `{\\c${defaultColorInline}}`);

  // Strip any leftover HTML tags (like <span>, <div>, <p>) that break libass / MX Player parsers
  result = result.replace(/<\/?(span|div|p|small|strong|em|body|html|font)[^>]*>/gi, '');

  return result;
}

/**
 * Generates an Advanced SubStation Alpha (.ass) file
 * Gold standard for stylized video subtitles with exact typography, outlines, shadows & gradients
 * Fully compliant with MX Player, VLC, PotPlayer, MPV and Aegisub.
 */
export function generateASS(
  items: SubtitleItem[],
  options: {
    fontFamily?: string;
    fontSize?: number;
    title?: string;
    type?: 'ai' | 'google' | 'original';
    palette?: GradientPalette;
    stylingConfig?: any;
  } = {}
): string {
  const {
    fontFamily = 'Noto Nastaliq Urdu',
    fontSize = 42,
    title = 'Urdu Localized Subtitles',
    type = 'ai',
    palette,
    stylingConfig
  } = options;

  // Extract clean primary font name
  const primaryFont = fontFamily.split(',')[0].replace(/['"]/g, '').trim() || 'Noto Nastaliq Urdu';
  
  // 1. Primary Text Color
  const defaultHex = stylingConfig?.customColors?.[0] || palette?.colors[0] || '#FFFFFF';
  const primaryStyleCol = hexToAssStyleColor(defaultHex, '00');
  const primaryInlineCol = hexToAssInlineColor(defaultHex);

  // 2. Secondary / Highlight Color (\2c)
  const secondaryHex = stylingConfig?.highlightColor || palette?.colors[1] || '#FFD700';
  const secondaryAlpha = opacityToAssAlpha(stylingConfig?.highlightOpacity ?? 1);
  const secondaryStyleCol = hexToAssStyleColor(secondaryHex, secondaryAlpha);
  const secondaryInlineCol = hexToAssInlineColor(secondaryHex);

  // 3. Outline & Stroke Color (\3c)
  const outlineHex = stylingConfig?.customOutlineColor || '#000000';
  const outlineAlpha = opacityToAssAlpha(stylingConfig?.outlineOpacity ?? 1);
  const outlineStyleCol = hexToAssStyleColor(outlineHex, outlineAlpha);
  const outlineInlineCol = hexToAssInlineColor(outlineHex);

  // 4. Backdrop vs Shadow Handling (CRITICAL FOR MX PLAYER & LIBASS)
  const isBackdropActive = Boolean(stylingConfig?.backdropBox && stylingConfig.backdropBox !== 'none');
  let borderStyleVal = 1;
  let backStyleCol = '&H80000000';
  let backInlineCol = '&H000000&';
  let outlineVal = stylingConfig?.outlineWidth ?? 2.5;
  let shadowVal = stylingConfig?.shadowDepth ?? stylingConfig?.shadowOffsetY ?? 2;

  if (isBackdropActive) {
    // SSA/ASS BorderStyle 3 = Opaque Box Scrim
    borderStyleVal = 3;
    // In BorderStyle 3, Outline is the box padding (typically 4-6px)
    outlineVal = stylingConfig?.outlineWidth ? Math.max(3, stylingConfig.outlineWidth * 1.5) : 5;
    shadowVal = 0; // Flat box container

    // Determine Box Background Color & Opacity
    if (stylingConfig?.backdropBox === 'cinema-black') {
      backStyleCol = '&H00000000'; // 100% solid black
      backInlineCol = '&H000000&';
    } else if (stylingConfig?.backdropBox === 'heavy-tint') {
      backStyleCol = '&H1E000000'; // 88% dark
      backInlineCol = '&H000000&';
    } else if (stylingConfig?.backdropBox === 'tinted-palette') {
      const tintHex = stylingConfig.customColors?.[0] || palette?.colors[0] || '#10B981';
      backStyleCol = hexToAssStyleColor(tintHex, '33');
      backInlineCol = hexToAssInlineColor(tintHex);
    } else {
      // subtle-box, frost-blur, etc. with custom tint support
      const customHex = stylingConfig?.customBackdropColor || '#000000';
      const boxOpacity = stylingConfig?.backdropOpacity ?? 0.70;
      const boxAlpha = opacityToAssAlpha(boxOpacity);
      backStyleCol = hexToAssStyleColor(customHex, boxAlpha);
      backInlineCol = hexToAssInlineColor(customHex);
    }
  } else {
    // BorderStyle 1 = Outline with Drop Shadow
    borderStyleVal = stylingConfig?.borderStyle ?? 1;
    const shadowHex = stylingConfig?.customShadowColor || '#000000';
    const shadowAlpha = opacityToAssAlpha(stylingConfig?.shadowOpacity ?? 0.85);
    backStyleCol = hexToAssStyleColor(shadowHex, shadowAlpha);
    backInlineCol = hexToAssInlineColor(shadowHex);
  }

  // If Glow is active without explicit outline, ensure outline is at least 3px so blur blooms
  if (stylingConfig?.glowActive && (!stylingConfig.outlineWidth || stylingConfig.outlineWidth < 2)) {
    outlineVal = 3;
  }

  // Flags for Bold, Italic, Underline
  const boldFlag = stylingConfig?.boldEmphasis ? -1 : 0;
  const italicFlag = stylingConfig?.italicize ? -1 : 0;
  const underlineFlag = stylingConfig?.underline ? -1 : 0;
  const marginVVal = stylingConfig?.marginV ?? 52;

  // Use reference 1280x720 canvas - universally supported across mobile MX Player and desktop players
  const header = `[Script Info]
; Script generated by AI Urdu Subtitle Studio
; Fully Formatted & MX Player Compatible Subtitle Stream
Title: ${title}
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: 1280
PlayResY: 720

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${primaryFont},${fontSize},${primaryStyleCol},${secondaryStyleCol},${outlineStyleCol},${backStyleCol},${boldFlag},${italicFlag},${underlineFlag},0,100,100,0,0,${borderStyleVal},${outlineVal},${shadowVal},2,30,30,${marginVVal},1
Style: UrduGold,${primaryFont},${fontSize},&H0026A6FF,${secondaryStyleCol},${outlineStyleCol},${backStyleCol},${boldFlag},${italicFlag},${underlineFlag},0,100,100,0,0,${borderStyleVal},${outlineVal},${shadowVal},2,30,30,${marginVVal},1
Style: UrduCyan,${primaryFont},${fontSize},&H00FEF200,${secondaryStyleCol},${outlineStyleCol},${backStyleCol},${boldFlag},${italicFlag},${underlineFlag},0,100,100,0,0,${borderStyleVal},${outlineVal},${shadowVal},2,30,30,${marginVVal},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events = items.map(item => {
    let rawText = '';
    if (type === 'ai') rawText = item.translatedText || item.text;
    else if (type === 'google') rawText = item.googleTranslateText || item.text;
    else rawText = item.text;

    const start = srtTimeToAssTime(item.startTime);
    const end = srtTimeToAssTime(item.endTime);
    
    // Convert formatted HTML safely into ASS tags
    let styledAssText = htmlToAssTags(rawText, primaryInlineCol);
    
    // Build single unified override block at the beginning of dialogue
    // Explicitly defining borders, shadows, and alphas ensures MX Player, VLC & libass
    // render every effect accurately even under hardware decoding modes.
    const overrideTags: string[] = [];

    // Exact font and size lock: guarantees MX Player and libass render the exact intended
    // font size (e.g. 38px) rather than falling back to MX Player's default 14px user setting
    overrideTags.push(`\\fn${primaryFont}`);
    overrideTags.push(`\\fs${fontSize}`);

    // 1. Text fill color
    if (item.styleColor && !rawText.includes('<font')) {
      overrideTags.push(`\\c${hexToAssInlineColor(item.styleColor)}`);
    }

    // 2. Backdrop Scrim vs Outline & Drop Shadow
    if (isBackdropActive) {
      // ASS BorderStyle 3 (Opaque bounding box)
      overrideTags.push(`\\bord${outlineVal}\\shad0\\4c${backInlineCol}\\4a&H${opacityToAssAlpha(stylingConfig?.backdropOpacity ?? 0.8)}&`);
    } else {
      // Border / Stroke Width
      if (stylingConfig?.strokeIndependent) {
        const xBord = stylingConfig.strokeXWidth ?? outlineVal;
        const yBord = stylingConfig.strokeYWidth ?? outlineVal;
        overrideTags.push(`\\xbord${xBord}\\ybord${yBord}`);
      } else if (outlineVal > 0) {
        overrideTags.push(`\\bord${outlineVal}`);
      }

      // Outline color & alpha (\3c, \3a)
      overrideTags.push(`\\3c${outlineInlineCol}\\3a&H${outlineAlpha}&`);

      // Shadow depth & offsets (\shad, \xshad, \yshad, \4c, \4a)
      if (shadowVal > 0 || stylingConfig?.shadowOffsetX !== undefined || stylingConfig?.shadowOffsetY !== undefined) {
        if (stylingConfig?.shadowOffsetX !== undefined || stylingConfig?.shadowOffsetY !== undefined) {
          overrideTags.push(`\\xshad${stylingConfig.shadowOffsetX ?? 0}\\yshad${stylingConfig.shadowOffsetY ?? shadowVal}`);
        } else {
          overrideTags.push(`\\shad${shadowVal}`);
        }
        const sHex = stylingConfig?.customShadowColor || '#000000';
        const sAlpha = opacityToAssAlpha(stylingConfig?.shadowOpacity ?? 0.85);
        overrideTags.push(`\\4c${hexToAssInlineColor(sHex)}\\4a&H${sAlpha}&`);
      }
    }

    // 3. Glow Bloom (ASS \\blur bloom on border \\3c)
    // Keep blur tight and crisp (max 1.5, or 1.0 in backdrop mode) to prevent messy pixelated downsampling in mobile libass
    if (stylingConfig?.glowActive && (stylingConfig.glowBlur ?? 0) > 0) {
      const gColor = hexToAssInlineColor(stylingConfig.glowColor || outlineHex);
      const gAlpha = opacityToAssAlpha(stylingConfig.glowOpacity ?? 0.85);
      const safeGlowBlur = Math.min(Number(stylingConfig.glowBlur) || 1, isBackdropActive ? 1.0 : 1.5);
      overrideTags.push(`\\blur${safeGlowBlur}\\3c${gColor}\\3a&H${gAlpha}&`);
    } else if (stylingConfig?.edgeBlurStrength && stylingConfig.edgeBlurStrength > 0) {
      // 4. Edge Blur (\be or \blur)
      const safeBlur = Math.min(Number(stylingConfig.edgeBlurStrength) || 1, 1.2);
      if (stylingConfig.edgeBlurMode === 'simple') {
        overrideTags.push(`\\be${Math.min(safeBlur, 1)}`);
      } else {
        overrideTags.push(`\\blur${safeBlur}`);
      }
    }

    // 5. Secondary Highlights
    if (stylingConfig?.highlightActive) {
      if (stylingConfig.highlightMode === 'karaoke') {
        overrideTags.push(`\\2c${secondaryInlineCol}\\2a&H${secondaryAlpha}&`);
      } else {
        // Accent sheen: apply highlight to text primary fill
        overrideTags.push(`\\1c${secondaryInlineCol}\\1a&H${secondaryAlpha}&`);
      }
    }

    // Prefix override block and merge adjacent braces {...}{...} into a single clean block
    let dialogueContent = styledAssText;
    if (overrideTags.length > 0) {
      dialogueContent = `{${overrideTags.join('')}}${dialogueContent}`;
    }
    dialogueContent = dialogueContent.replace(/\}\{/g, '');

    return `Dialogue: 0,${start},${end},Default,,0,0,0,,${dialogueContent}`;
  }).join('\n');

  return header + events + '\n';
}

/**
 * Generates WebVTT (.vtt) format with styling support
 */
export function generateWebVTT(
  items: SubtitleItem[], 
  type: 'ai' | 'google' | 'original' = 'ai'
): string {
  const header = `WEBVTT - Stylized Subtitles
Kind: captions
Language: ur

STYLE
::cue {
  font-family: 'Noto Nastaliq Urdu', 'Gulzar', 'Jameel Noori Nastaliq', serif;
  font-size: 1.25rem;
  line-height: 2.2;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9);
  background-color: transparent;
}

`;

  const cues = items.map(item => {
    let content = '';
    if (type === 'ai') content = item.translatedText || item.text;
    else if (type === 'google') content = item.googleTranslateText || item.text;
    else content = item.text;

    // WebVTT uses . instead of , in timestamps
    const start = item.startTime.replace(',', '.');
    const end = item.endTime.replace(',', '.');

    // Convert <font color="#HEX"> to <c.color> or keep compatible HTML
    return `${item.index}\n${start} --> ${end}\n${content.trim()}\n`;
  }).join('\n');

  return header + cues;
}

/**
 * Generates YouTube Subtitle format (.sbv):
 * 0:00:01.000,0:00:04.000
 * Subtitle text
 */
export function generateYouTubeSBV(
  items: SubtitleItem[],
  type: 'ai' | 'google' | 'original' = 'ai'
): string {
  return items.map(item => {
    let content = '';
    if (type === 'ai') content = item.translatedText || item.text;
    else if (type === 'google') content = item.googleTranslateText || item.text;
    else content = item.text;

    const start = item.startTime.replace(',', '.');
    const end = item.endTime.replace(',', '.');
    const cleanContent = stripFormatting(content);

    return `${start},${end}\n${cleanContent}\n`;
  }).join('\n');
}

/**
 * Generates Mobile Lyrics / Karaoke (.lrc) format for Android music and podcast apps:
 * [00:01.00]Dialogue line
 */
export function generateLRC(
  items: SubtitleItem[],
  type: 'ai' | 'google' | 'original' = 'ai'
): string {
  const header = `[ti:Localized Subtitle Track]\n[by:AI Urdu Studio]\n[re:Android Mobile Lyric Player]\n\n`;
  const lines = items.map(item => {
    let content = '';
    if (type === 'ai') content = item.translatedText || item.text;
    else if (type === 'google') content = item.googleTranslateText || item.text;
    else content = item.text;

    // Convert HH:MM:SS,mmm to [MM:SS.xx]
    const clean = item.startTime.replace('.', ',');
    const parts = clean.split(':');
    let mm = 0;
    let ss = 0;
    let ms = 0;

    if (parts.length === 3) {
      mm = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
      const [sPart, msPart = '0'] = parts[2].split(',');
      ss = parseInt(sPart, 10) || 0;
      ms = parseInt(msPart.padEnd(2, '0').slice(0, 2), 10) || 0;
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    const lrcTime = `[${pad(mm)}:${pad(ss)}.${pad(ms)}]`;
    const cleanContent = stripFormatting(content).replace(/\n/g, ' ');

    return `${lrcTime}${cleanContent}`;
  }).join('\n');

  return header + lines;
}

/**
 * Generates an Android Mobile Clean Transcript (.txt)
 * Optimized for reading, WhatsApp sharing, and mobile notes
 */
export function generateAndroidPhoneTranscript(
  items: SubtitleItem[],
  type: 'ai' | 'google' | 'original' = 'ai',
  withTimestamps: boolean = true
): string {
  return items.map(item => {
    let content = '';
    if (type === 'ai') content = item.translatedText || item.text;
    else if (type === 'google') content = item.googleTranslateText || item.text;
    else content = item.text;

    const clean = stripFormatting(content);
    if (withTimestamps) {
      return `[${item.startTime.slice(0, 8)}] #${item.index}\n${clean}\n`;
    }
    return `${clean}\n`;
  }).join('\n');
}

/**
 * Generates JSON Timed Text Captions (.json)
 */
export function generateJSONCaptions(
  items: SubtitleItem[],
  type: 'ai' | 'google' | 'original' = 'ai'
): string {
  const exportItems = items.map(item => {
    let text = '';
    if (type === 'ai') text = item.translatedText || item.text;
    else if (type === 'google') text = item.googleTranslateText || item.text;
    else text = item.text;

    return {
      index: item.index,
      startTime: item.startTime,
      endTime: item.endTime,
      text: stripFormatting(text),
      originalText: item.text,
      translatedText: item.translatedText ? stripFormatting(item.translatedText) : undefined,
      googleTranslateText: item.googleTranslateText ? stripFormatting(item.googleTranslateText) : undefined,
      styleColor: item.styleColor
    };
  });

  return JSON.stringify(exportItems, null, 2);
}

/**
 * Generates standard SubStation Alpha (.ssa) v4 file
 */
export function generateSSA(
  items: SubtitleItem[],
  options: {
    fontFamily?: string;
    fontSize?: number;
    title?: string;
    type?: 'ai' | 'google' | 'original';
    palette?: GradientPalette;
    stylingConfig?: any;
  } = {}
): string {
  const {
    fontFamily = 'Noto Nastaliq Urdu',
    fontSize = 38,
    title = 'Urdu Localized Subtitles',
    type = 'ai',
    palette,
    stylingConfig
  } = options;

  const primaryFont = fontFamily.split(',')[0].replace(/['"]/g, '').trim() || 'Noto Nastaliq Urdu';
  const defaultHex = stylingConfig?.customColors?.[0] || palette?.colors[0] || '#FFFFFF';
  const defaultSsaColor = hexToAssStyleColor(defaultHex, '00');
  const secondaryHex = stylingConfig?.highlightColor || palette?.colors[1] || '#000000';
  const secondarySsaColor = hexToAssStyleColor(secondaryHex, '00');
  const outlineHex = stylingConfig?.customOutlineColor || '#000000';
  const outlineSsaColor = hexToAssStyleColor(outlineHex, '00');
  const shadowHex = stylingConfig?.customShadowColor || '#000000';
  const shadowSsaColor = hexToAssStyleColor(shadowHex, '00');

  const isBackdrop = Boolean(stylingConfig?.backdropBox && stylingConfig.backdropBox !== 'none');
  const borderStyleVal = isBackdrop ? 3 : (stylingConfig?.borderStyle ?? 1);
  const outlineVal = isBackdrop ? Math.max(3, (stylingConfig?.outlineWidth ?? 2) * 1.5) : (stylingConfig?.outlineWidth ?? 2);
  const shadowVal = isBackdrop ? 0 : (stylingConfig?.shadowDepth ?? stylingConfig?.shadowOffsetY ?? 2);

  const boldVal = stylingConfig?.boldEmphasis ? -1 : 0;
  const italicVal = stylingConfig?.italicize ? -1 : 0;
  const marginVVal = stylingConfig?.marginV ?? 52;

  const header = `[Script Info]
; Script generated by AI Urdu Subtitle Studio
; Standard SubStation Alpha v4.00 Compatible
Title: ${title}
ScriptType: v4.00
Collisions: Normal
PlayResX: 1280
PlayResY: 720

[V4 Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, TertiaryColour, BackColour, Bold, Italic, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, AlphaLevel, Encoding
Style: Default,${primaryFont},${fontSize},${defaultSsaColor},${secondarySsaColor},${outlineSsaColor},${shadowSsaColor},${boldVal},${italicVal},${borderStyleVal},${outlineVal},${shadowVal},2,30,30,${marginVVal},0,1

[Events]
Format: Marked, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events = items.map(item => {
    let rawText = '';
    if (type === 'ai') rawText = item.translatedText || item.text;
    else if (type === 'google') rawText = item.googleTranslateText || item.text;
    else rawText = item.text;

    const start = srtTimeToAssTime(item.startTime);
    const end = srtTimeToAssTime(item.endTime);
    let styledText = htmlToAssTags(rawText, hexToAssInlineColor(defaultHex));
    styledText = `{\\fs${fontSize}}${styledText}`;
    if (item.styleColor && !rawText.includes('<font')) {
      styledText = `{\\c${hexToAssInlineColor(item.styleColor)}}${styledText}`;
    }
    // Clean up any ASS-only tags that SSA v4 does not support
    styledText = styledText.replace(/\\[x|y]?(bord|shad)[0-9.]+/gi, '');
    styledText = styledText.replace(/\\(blur|be)[0-9.]+/gi, '');
    styledText = styledText.replace(/\\(3c|4c)&H[0-9a-fA-F]+&/gi, '');
    styledText = styledText.replace(/\{\}/g, '');
    styledText = styledText.replace(/\}\{/g, '');

    return `Dialogue: Marked=0,${start},${end},Default,,0000,0000,0000,,${styledText}`;
  }).join('\n');

  return header + events + '\n';
}

