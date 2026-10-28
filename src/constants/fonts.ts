export interface FontOption {
  name: string;
  value: string;
  previewText?: string;
  description?: string;
}

export interface CustomFontItem {
  id: string;
  name: string;
  value: string;
  isUploaded?: boolean;
  dataUrl?: string;
}

export const URDU_FONT_OPTIONS: FontOption[] = [
  { 
    name: 'Noto Nastaliq Urdu (Google Fonts)', 
    value: "'Noto Nastaliq Urdu', 'Gulzar', 'Jameel Noori Nastaliq', 'Noto Sans Arabic', 'Urdu Typesetting', serif",
    previewText: 'نستعلیق انداز نگارش',
    description: 'Classic calligraphic Urdu nastaliq script'
  },
  { 
    name: 'Gulzar Nastaliq (Google Fonts)', 
    value: "'Gulzar', 'Noto Nastaliq Urdu', 'Noto Sans Arabic', serif",
    previewText: 'گلزار خوبصورت قلم',
    description: 'Ornate display nastaliq by Google Fonts'
  },
  { 
    name: 'Jameel Noori Nastaliq (Local/System)', 
    value: "'Jameel Noori Nastaliq', 'Noto Nastaliq Urdu', 'Gulzar', 'Urdu Typesetting', serif",
    previewText: 'جمیل نوری نستعلیق',
    description: 'Standard South Asian newspaper typeface'
  },
  { 
    name: 'Amiri Arabic / Urdu (Classical Naskh)', 
    value: "'Amiri', 'Noto Sans Arabic', serif",
    previewText: 'الخط العربي والنسخ',
    description: 'Elegant high-legibility Naskh type'
  },
  { 
    name: 'Noto Sans Urdu (Modern Clean)', 
    value: "'Noto Sans Arabic', 'Noto Nastaliq Urdu', -apple-system, BlinkMacSystemFont, sans-serif",
    previewText: 'جدید اور صاف خط',
    description: 'Modern geometric sans for UI & subtitles'
  },
  { 
    name: 'Al Qalam Taj Nastaleeq (Calligraphy)', 
    value: "'Al Qalam Taj Nastaleeq', 'Noto Nastaliq Urdu', 'Gulzar', serif",
    previewText: 'القلم تاج نستعلیق خطاطی',
    description: 'Traditional Urdu calligraphy penmanship'
  },
  { 
    name: 'Scheherazade New (Arabic / Riqa Style)', 
    value: "'Scheherazade New', 'Amiri', 'Noto Sans Arabic', serif",
    previewText: 'خط النسخ والرقعه',
    description: 'Vocalized Arabic & classic Quranic calligraphy'
  },
  { 
    name: 'Urdu Typesetting / Traditional', 
    value: "'Urdu Typesetting', 'Arabic Typesetting', 'Noto Nastaliq Urdu', serif",
    previewText: 'روایتی طباعت',
    description: 'Traditional Microsoft Urdu typeface'
  },
  { 
    name: 'System Default Sans', 
    value: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
    previewText: 'نظام کا بنیادی فونٹ',
    description: 'Device native default font family'
  }
];

export const ENGLISH_FONT_OPTIONS: FontOption[] = [
  {
    name: 'Montserrat (CapCut Viral Bold)',
    value: "'Montserrat', -apple-system, sans-serif",
    previewText: 'VIRAL REELS SUBTITLES',
    description: 'Iconic high-impact CapCut & TikTok subtitle typeface'
  },
  {
    name: 'Bebas Neue (CapCut Punchy Display)',
    value: "'Bebas Neue', 'Impact', -apple-system, sans-serif",
    previewText: 'CINEMATIC IMPACT TITLES',
    description: 'Ultra-condensed all-caps punchy video header'
  },
  {
    name: 'Impact (Viral Meme & Hook)',
    value: "'Impact', 'Arial Black', sans-serif",
    previewText: 'STRONG VIDEO HOOK',
    description: 'Heavy blockbuster weight for maximal contrast'
  },
  {
    name: 'Bangers / Comic (Dynamic Pop)',
    value: "'Bangers', 'Komika Axis', cursive, sans-serif",
    previewText: 'DYNAMIC ACTION COMIC',
    description: 'Expressive comic book punch for energetic shorts'
  },
  {
    name: 'Inter (Modern UI Clean)',
    value: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    previewText: 'Modern Cinema Dialogue',
    description: 'Crisp, high-legibility sans-serif'
  },
  {
    name: 'Plus Jakarta Sans (Editorial)',
    value: "'Plus Jakarta Sans', -apple-system, sans-serif",
    previewText: 'Cinematic Subtitle Flow',
    description: 'Balanced contemporary aesthetic'
  },
  {
    name: 'Roboto (Google Standard)',
    value: "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif",
    previewText: 'Streaming Video Captions',
    description: 'Clear geometric grotesk letterforms'
  },
  {
    name: 'JetBrains Mono (Readable Monospace)',
    value: "'JetBrains Mono', 'Courier New', monospace",
    previewText: '00:01:24 [Subtitles]',
    description: 'Fixed-width developer & timing clarity'
  },
  {
    name: 'Playfair Display (High-Contrast Serif)',
    value: "'Playfair Display', 'Times New Roman', serif",
    previewText: 'The Elegance of Cinema',
    description: 'Sophisticated title & theatrical tone'
  },
  {
    name: 'Cinzel (Classical Epic / Mythic)',
    value: "'Cinzel', serif",
    previewText: 'EPIC HISTORICAL DRAMA',
    description: 'Roman inscriptional monument styling'
  },
  {
    name: 'System Default Sans',
    value: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
    previewText: 'Operating System Default',
    description: 'Fastest native system rendering'
  }
];

const LOCAL_FONTS_KEY = 'urdu_localizer_custom_local_fonts_v2';

export function getLocalFontsFromStorage(): CustomFontItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_FONTS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to load local fonts from storage:', err);
  }
  return [
    {
      id: 'default-custom-1',
      name: 'Custom System Font (Segoe UI / SF Pro)',
      value: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif"
    },
    {
      id: 'default-custom-2',
      name: 'Custom Serif Drama (Georgia / Garamond)',
      value: "Georgia, 'Garamond', 'Palatino Linotype', 'Times New Roman', serif"
    }
  ];
}

export function saveLocalFontsToStorage(fonts: CustomFontItem[]): void {
  try {
    localStorage.setItem(LOCAL_FONTS_KEY, JSON.stringify(fonts));
  } catch (err) {
    console.warn('Failed to save local fonts to storage:', err);
  }
}

/**
 * Registers an uploaded font file (TTF/OTF/WOFF/WOFF2) dynamically into the browser
 */
export async function registerUploadedFont(fontName: string, arrayBufferOrBase64: ArrayBuffer | string): Promise<string> {
  const cleanFamily = fontName.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim() || 'CustomUploadedFont';
  try {
    let fontFace: FontFace;
    if (typeof arrayBufferOrBase64 === 'string') {
      fontFace = new FontFace(cleanFamily, `url(${arrayBufferOrBase64})`);
    } else {
      fontFace = new FontFace(cleanFamily, arrayBufferOrBase64);
    }
    await fontFace.load();
    document.fonts.add(fontFace);
    return `'${cleanFamily}', sans-serif`;
  } catch (e) {
    console.error('Error loading font into browser:', e);
    return `'${cleanFamily}', sans-serif`;
  }
}
