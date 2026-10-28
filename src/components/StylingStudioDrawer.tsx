import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Palette, 
  Sparkles, 
  X, 
  Sliders, 
  Layers, 
  Download, 
  Eye, 
  RotateCcw, 
  Film, 
  FileCode, 
  Type, 
  ChevronDown,
  ChevronUp,
  Bookmark,
  BookmarkPlus,
  Save,
  Upload,
  Trash2,
  Edit2,
  Check,
  Copy,
  ArrowLeftRight,
  Plus,
  Search,
  FolderHeart,
  Pipette,
  Sun,
  Shuffle
} from 'lucide-react';
import { ColorWheelPicker } from './ColorWheelPicker';
import { 
  GRADIENT_PALETTES, 
  GradientPalette, 
  GradientMode, 
  TargetStreamField,
  applyGradientsToSubtitles, 
  removeAllGradientsFromSubtitles,
  generateFormattedSRT,
  generateASS,
  generateSSA,
  generateWebVTT,
  generateCleanSRT
} from '../utils/subtitleFormatter';
import { SubtitleItem } from '../utils/srtParser';
import { cn } from '../utils/cn';

export interface GradientStop {
  id: string;
  color: string;
  offset: number; // 0 - 100%
}

export interface ActiveStylingConfig {
  paletteId: string;
  gradientMode: GradientMode;
  targetStreams: TargetStreamField; // 'all' | 'both' | 'translated' | 'original' | 'google'
  customColors?: string[];
  gradientDirection?: '135deg' | '90deg' | '45deg' | '180deg';
  animation?: 'none' | 'karaoke-fade' | 'pulse-glow' | 'wave-bounce' | 'neon-flicker' | 'typewriter' | 'cinema-zoom' | 'audio-ripple' | 'shimmer';
  textOutline?: 'none' | 'subtle' | 'medium' | 'bold' | 'ultra' | 'neon' | 'double' | 'emboss';
  outlineWidth?: number;
  customOutlineColor?: string;
  outlineOpacity?: number;
  strokeIndependent?: boolean;
  strokeXWidth?: number;
  strokeYWidth?: number;
  borderStyle?: 1 | 3;
  textShadow?: 'none' | 'soft' | 'hard' | 'cinematic' | 'neon-glow' | 'backlight' | 'retro-drop' | 'extrusion-3d' | 'cyberpunk-glitch' | 'fiery-blaze';
  customShadowColor?: string;
  shadowDepth?: number;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;
  glowActive?: boolean;
  glowBlur?: number;
  glowColor?: string;
  glowOpacity?: number;
  edgeBlurMode?: 'gaussian' | 'simple';
  edgeBlurStrength?: number;
  highlightActive?: boolean;
  highlightColor?: string;
  highlightOpacity?: number;
  highlightMode?: 'accent' | 'karaoke' | 'specular';
  backdropBox?: 'none' | 'subtle-box' | 'heavy-tint' | 'frost-blur' | 'tinted-palette' | 'cinema-black' | 'glowing-border' | 'comic-bubble' | 'accent-bar';
  backdropPadding?: 'minimal' | 'compact' | 'standard' | 'spacious';
  backdropRadius?: 'none' | 'rounded' | 'smooth' | 'pill';
  backdropOpacity?: number;
  backdropBlur?: number;
  customBackdropColor?: string;
  fontWeight?: '300' | '400' | '500' | '600' | '700' | '800' | '900';
  letterSpacing?: '-1.5px' | '-1px' | '0px' | '1px' | '2px' | '3px' | '4px';
  lineHeight?: '1.3' | '1.6' | '2.0' | '2.4' | '2.8';
  textAlign?: 'auto' | 'left' | 'center' | 'right' | 'justify';
  transformCase?: 'none' | 'uppercase' | 'capitalize' | 'lowercase';
  boldEmphasis?: boolean;
  italicize?: boolean;
  underline?: boolean;
  isLivePreviewActive?: boolean;
}

export const DEFAULT_STYLING_CONFIG: ActiveStylingConfig = {
  paletteId: 'sunset',
  gradientMode: 'block-shift',
  targetStreams: 'all',
  gradientDirection: '135deg',
  animation: 'none',
  textOutline: 'none',
  outlineWidth: 0,
  customOutlineColor: '#000000',
  outlineOpacity: 1,
  strokeIndependent: false,
  strokeXWidth: 0,
  strokeYWidth: 0,
  borderStyle: 1,
  textShadow: 'none',
  customShadowColor: '#000000',
  shadowDepth: 0,
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  shadowOpacity: 0.85,
  glowActive: false,
  glowBlur: 0,
  glowColor: '#00F5D4',
  glowOpacity: 0.85,
  edgeBlurMode: 'gaussian',
  edgeBlurStrength: 0,
  highlightActive: false,
  highlightColor: '#FFD700',
  highlightOpacity: 1,
  highlightMode: 'accent',
  backdropBox: 'none',
  backdropPadding: 'compact',
  backdropRadius: 'rounded',
  backdropOpacity: 0.65,
  backdropBlur: 0,
  customBackdropColor: '#000000',
  fontWeight: '500',
  letterSpacing: '0px',
  lineHeight: '2.0',
  textAlign: 'auto',
  transformCase: 'none',
  boldEmphasis: false,
  italicize: false,
  underline: false,
  isLivePreviewActive: true
};

export interface StylingPreset {
  id: string;
  name: string;
  config: ActiveStylingConfig;
  urduFont: string;
  englishFont: string;
  fontSize: number;
  isCustom?: boolean;
}

export const BUILT_IN_PRESETS: StylingPreset[] = [
  {
    id: 'sunset-cinema',
    name: 'Sunset Radiance',
    urduFont: "'Noto Nastaliq Urdu', 'Gulzar', serif",
    englishFont: "'Plus Jakarta Sans', sans-serif",
    fontSize: 24,
    config: {
      ...DEFAULT_STYLING_CONFIG,
      paletteId: 'sunset',
      gradientMode: 'block-shift',
      targetStreams: 'all'
    }
  },
  {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    urduFont: "'Noto Sans Arabic', 'Noto Nastaliq Urdu', sans-serif",
    englishFont: "'JetBrains Mono', monospace",
    fontSize: 26,
    config: {
      ...DEFAULT_STYLING_CONFIG,
      paletteId: 'cyber-neon',
      gradientMode: 'word-gradient',
      targetStreams: 'all'
    }
  },
  {
    id: 'golden-amber',
    name: 'Golden Amber',
    urduFont: "'Noto Nastaliq Urdu', 'Gulzar', serif",
    englishFont: "'Cinzel', serif",
    fontSize: 26,
    config: {
      ...DEFAULT_STYLING_CONFIG,
      paletteId: 'golden-amber',
      gradientMode: 'block-shift',
      targetStreams: 'all'
    }
  }
];

// Curated solid subtitle colors
export interface SolidColorPreset {
  name: string;
  hex: string;
  desc: string;
}

export const SOLID_SUBTITLE_COLORS: SolidColorPreset[] = [
  { name: 'Cinema Yellow', hex: '#FFE600', desc: 'Standard high-contrast movie yellow' },
  { name: 'Pure White', hex: '#FFFFFF', desc: 'Crisp classic cinema subtitle white' },
  { name: 'Electric Cyan', hex: '#00F5D4', desc: 'Cyberpunk & punchy modern teal' },
  { name: 'Amber Gold', hex: '#F59E0B', desc: 'Warm prestige golden luster' },
  { name: 'Neon Emerald', hex: '#10B981', desc: 'Vibrant documentary & nature mint' },
  { name: 'Hot Pink / Magenta', hex: '#F43F5E', desc: 'Vibrant music video & anime flare' },
  { name: 'Pastel Lilac', hex: '#C084FC', desc: 'Soft aesthetic modern lavender' },
  { name: 'Sky Marine', hex: '#38BDF8', desc: 'Clean bright celestial blue' },
  { name: 'Blaze Tangerine', hex: '#F97316', desc: 'Energetic action & warmth' },
  { name: 'Crimson Ruby', hex: '#EF4444', desc: 'Dramatic intense red' },
  { name: 'Broadcast Lime', hex: '#84CC16', desc: 'Punchy eye-catching lime' },
  { name: 'Silver Platinum', hex: '#E4E4E7', desc: 'Subtle metallic cinema grey' }
];

// 12 Gradient Progression Modes
export const GRADIENT_PROGRESSION_MODES: {
  id: GradientMode;
  label: string;
  desc: string;
  tag: string;
}[] = [
  { 
    id: 'block-shift', 
    label: 'Continuous Block Shift', 
    desc: 'Each subtitle shifts colors smoothly across timeline.',
    tag: 'Timeline'
  },
  { 
    id: 'word-gradient', 
    label: 'Word-by-Word Transition', 
    desc: 'Words in each line smoothly transition across colors.',
    tag: 'Linear'
  },
  { 
    id: 'alternating-speakers', 
    label: 'Alternating Speakers', 
    desc: 'Alternates dialogue colors between speakers/lines.',
    tag: 'Dialogue'
  },
  { 
    id: 'ping-pong', 
    label: 'Ping-Pong Reversal', 
    desc: 'Oscillates forward then backward through colors.',
    tag: 'Dynamic'
  },
  { 
    id: 'first-last-accent', 
    label: 'Anchor Accent Ends', 
    desc: 'First & last words accented with vibrant ends of palette.',
    tag: 'Anchors'
  },
  { 
    id: 'center-out', 
    label: 'Center-Out Flare', 
    desc: 'Center climax word radiates outward to edge stops.',
    tag: 'Radial'
  },
  { 
    id: 'odd-even-words', 
    label: 'Odd/Even Word Stride', 
    desc: 'Even words get Color A, odd words get Color B.',
    tag: 'Rhythm'
  },
  { 
    id: 'random-scatter', 
    label: 'Chromatic Scatter', 
    desc: 'Deterministic multi-color scatter across each phrase.',
    tag: 'Creative'
  },
  { 
    id: 'rainbow-cycle', 
    label: 'Spectral Loop', 
    desc: 'Full palette looped across words continuously.',
    tag: 'Spectrum'
  },
  { 
    id: 'tri-color-split', 
    label: 'Tri-Color Narrative Split', 
    desc: 'Divides line into Opening, Body & Climax thirds.',
    tag: 'Story'
  },
  { 
    id: 'syllable-karaoke', 
    label: 'Karaoke Step Wave', 
    desc: 'High-contrast vibrant jump highlight on key terms.',
    tag: 'Karaoke'
  },
  { 
    id: 'gradient-glow', 
    label: 'Radiant Accent Glow', 
    desc: 'Rich chromatic lead tone with radiant accentuation.',
    tag: 'Accent'
  }
];

// Persistent User-Saveable Gradient Library Interface
export interface SavedGradientPalette {
  id: string;
  name: string;
  description?: string;
  colors: string[];
  gradientMode?: GradientMode;
  createdAt: number;
  tags?: string[];
}

const GRADIENT_LIBRARY_STORAGE_KEY = 'urdu_subtitles_gradient_library_v1';

export const STARTER_LIBRARY_PALETTES: SavedGradientPalette[] = [
  {
    id: 'starter-1',
    name: 'Imperial Saffron & Ruby',
    description: 'Golden saffron transitioning into warm ruby for high-end drama',
    colors: ['#FBBF24', '#F59E0B', '#EF4444'],
    gradientMode: 'word-gradient',
    createdAt: 1718000000000,
    tags: ['Prestige', 'Warm']
  },
  {
    id: 'starter-2',
    name: 'Synthwave Nightfall',
    description: 'Electric cyan to deep synth violet and hot fuchsia',
    colors: ['#00F5D4', '#7928CA', '#FF007A'],
    gradientMode: 'word-gradient',
    createdAt: 1718010000000,
    tags: ['Sci-Fi', 'Vibrant']
  },
  {
    id: 'starter-3',
    name: 'Viral Gold Punch',
    description: 'High-contrast bright yellow with punchy tangerine highlight',
    colors: ['#FFF200', '#FFA000', '#FF5500'],
    gradientMode: 'syllable-karaoke',
    createdAt: 1718020000000,
    tags: ['Social', 'High Contrast']
  },
  {
    id: 'starter-4',
    name: 'Diamond Ice & Oceanic Blue',
    description: 'Frosty white to arctic cyan and deep maritime navy',
    colors: ['#FFFFFF', '#67E8F9', '#0284C7'],
    gradientMode: 'center-out',
    createdAt: 1718030000000,
    tags: ['Cool', 'Clean']
  }
];

interface StylingStudioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  subtitles: SubtitleItem[];
  onApply: (styledSubtitles: SubtitleItem[]) => void;
  urduFont: string;
  onUpdateUrduFont?: (font: string) => void;
  originalFont?: string;
  onUpdateOriginalFont?: (font: string) => void;
  translatedFontSize: number;
  onUpdateTranslatedFontSize?: (size: number) => void;
  originalFontSize?: number;
  onUpdateOriginalFontSize?: (size: number) => void;
  fileName: string;
  activeStylingConfig?: ActiveStylingConfig;
  onUpdateActiveStyling?: (config: ActiveStylingConfig) => void;
  onAddLog: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  onAddNotification: (msg: string, type: 'success' | 'error') => void;
}

export const StylingStudioDrawer: React.FC<StylingStudioDrawerProps> = ({
  isOpen,
  onClose,
  subtitles,
  onApply,
  urduFont,
  onUpdateUrduFont,
  originalFont = 'sans-serif',
  onUpdateOriginalFont,
  translatedFontSize: initialTranslatedFontSize,
  onUpdateTranslatedFontSize,
  originalFontSize: initialOriginalFontSize = 14,
  onUpdateOriginalFontSize,
  fileName,
  activeStylingConfig,
  onUpdateActiveStyling,
  onAddLog,
  onAddNotification
}) => {
  // Navigation tabs: 'gradients' | 'custom-builder' | 'solid-colors' | 'library'
  const [activeTab, setActiveTab] = useState<'gradients' | 'custom-builder' | 'solid-colors' | 'library'>('gradients');

  // Isolated local draft configuration (changes stay on preview screen until applied)
  const [draftConfig, setDraftConfig] = useState<ActiveStylingConfig>(activeStylingConfig || DEFAULT_STYLING_CONFIG);

  // Video backdrop simulation for in-drawer preview
  const [videoBackdrop, setVideoBackdrop] = useState<'cinema-dark' | 'city-night' | 'sunset' | 'cyber' | 'studio-light'>('cinema-dark');

  // Stream preview visibility toggles in drawer
  const [previewStreams, setPreviewStreams] = useState({
    original: true,
    ai: true,
    google: true
  });

  // Local fonts & sizing for studio preview
  const [activeUrduFont, setActiveUrduFont] = useState(urduFont);
  const [activeEnglishFont, setActiveEnglishFont] = useState(originalFont);
  const [previewFontSize, setPreviewFontSize] = useState(initialTranslatedFontSize || 24);

  // Multi-step gradient stops state for interactive palette builder
  const [gradientStops, setGradientStops] = useState<GradientStop[]>(() => {
    const initialColors = activeStylingConfig?.customColors || GRADIENT_PALETTES[0].colors;
    return initialColors.map((color, idx) => ({
      id: `stop-${idx}`,
      color,
      offset: Math.round((idx / Math.max(1, initialColors.length - 1)) * 100)
    }));
  });
  const [activeStopId, setActiveStopId] = useState<string>(gradientStops[0]?.id || 'stop-0');

  // Solid Color Custom Picker
  const [customSolidColor, setCustomSolidColor] = useState('#FFE600');

  // Export menu dropdown open/close state in footer
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // User-Saveable Gradient Library State
  const [savedPalettes, setSavedPalettes] = useState<SavedGradientPalette[]>(() => {
    try {
      const stored = localStorage.getItem(GRADIENT_LIBRARY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Could not load gradient library from localStorage", e);
    }
    return STARTER_LIBRARY_PALETTES;
  });

  const [librarySearch, setLibrarySearch] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [savePaletteName, setSavePaletteName] = useState('');
  const [savePaletteDesc, setSavePaletteDesc] = useState('');
  const [editingPaletteId, setEditingPaletteId] = useState<string | null>(null);
  const [editingPaletteName, setEditingPaletteName] = useState('');

  const importFileInputRef = useRef<HTMLInputElement | null>(null);

  // Persist library to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(GRADIENT_LIBRARY_STORAGE_KEY, JSON.stringify(savedPalettes));
    } catch (e) {
      console.warn("Failed saving gradient library to localStorage", e);
    }
  }, [savedPalettes]);

  // Synchronize isolated draft state when drawer opens from current project styling
  useEffect(() => {
    if (isOpen) {
      if (activeStylingConfig) {
        setDraftConfig({ ...activeStylingConfig });
        if (activeStylingConfig.customColors && activeStylingConfig.customColors.length > 0) {
          const syncedStops = activeStylingConfig.customColors.map((color, idx) => ({
            id: `stop-${idx}`,
            color,
            offset: Math.round((idx / Math.max(1, activeStylingConfig.customColors!.length - 1)) * 100)
          }));
          setGradientStops(syncedStops);
          setActiveStopId(syncedStops[0]?.id || 'stop-0');
        }
      }
      setActiveUrduFont(urduFont);
      setActiveEnglishFont(originalFont);
      setPreviewFontSize(initialTranslatedFontSize || 24);
      setIsExportMenuOpen(false);
    }
  }, [isOpen, activeStylingConfig, urduFont, originalFont, initialTranslatedFontSize]);

  // Alias draftConfig to config
  const config = draftConfig;

  // Local draft updater: strictly isolated to the studio preview screen
  const updateConfig = (patch: Partial<ActiveStylingConfig>) => {
    setDraftConfig(prev => ({ ...prev, ...patch }));
  };

  const selectedPalette = GRADIENT_PALETTES.find(p => p.id === config.paletteId) || GRADIENT_PALETTES[0];

  // Active color stops sorted by offset for gradient CSS
  const sortedStops = useMemo(() => {
    return [...gradientStops].sort((a, b) => a.offset - b.offset);
  }, [gradientStops]);

  // The active stop object being edited
  const activeStop = useMemo(() => {
    return gradientStops.find(s => s.id === activeStopId) || gradientStops[0] || { id: 'stop-0', color: '#FF5500', offset: 0 };
  }, [gradientStops, activeStopId]);

  // CSS linear-gradient string for track and preview
  const trackGradientCss = useMemo(() => {
    if (sortedStops.length === 0) return '#FF5500';
    return `linear-gradient(to right, ${sortedStops.map(s => `${s.color} ${s.offset}%`).join(', ')})`;
  }, [sortedStops]);

  // Dynamic preview sample items
  const sampleItems: SubtitleItem[] = subtitles.slice(0, 2).length > 0 
    ? subtitles.slice(0, 2) 
    : [
        { 
          index: 1, 
          startTime: '00:00:01,000', 
          endTime: '00:00:04,500', 
          text: 'Every cinematic journey begins with an unspoken truth.', 
          translatedText: 'ہر عظیم فلمی سفر ایک ان کہی سچائی سے شروع ہوتا ہے۔',
          googleTranslateText: 'ہر عظیم سنیما کا سفر ایک ناگفتہ بہ حقیقت سے شروع ہوتا ہے۔'
        },
        { 
          index: 2, 
          startTime: '00:00:05,000', 
          endTime: '00:00:09,200', 
          text: 'Colors harmonize between the silence and spoken words.', 
          translatedText: 'خاموشی اور الفاظ کے درمیان رنگ ہم آہنگ ہو جاتے ہیں۔',
          googleTranslateText: 'خاموشی اور بولے جانے والے الفاظ کے درمیان رنگ ہم آہنگ ہوتے ہیں۔'
        }
      ];

  const styledSampleItems = useMemo(() => {
    return applyGradientsToSubtitles(
      sampleItems, 
      config.paletteId, 
      config.gradientMode, 
      config.targetStreams,
      {
        customColors: config.customColors,
        boldEmphasis: config.boldEmphasis,
        italicize: config.italicize,
        uppercaseOriginal: config.transformCase === 'uppercase'
      }
    );
  }, [sampleItems, config]);

  const handleApplyToSubtitles = () => {
    if (subtitles.length === 0) {
      onAddNotification("No subtitles loaded in project", "error");
      return;
    }

    const styled = applyGradientsToSubtitles(
      subtitles, 
      config.paletteId, 
      config.gradientMode, 
      config.targetStreams,
      {
        customColors: config.customColors,
        boldEmphasis: config.boldEmphasis,
        italicize: config.italicize,
        uppercaseOriginal: config.transformCase === 'uppercase'
      }
    );

    onApply(styled);
    if (onUpdateActiveStyling) onUpdateActiveStyling(draftConfig);
    if (onUpdateUrduFont) onUpdateUrduFont(activeUrduFont);
    if (onUpdateOriginalFont) onUpdateOriginalFont(activeEnglishFont);
    if (onUpdateTranslatedFontSize) onUpdateTranslatedFontSize(previewFontSize);

    onAddLog(`Applied "${config.customColors ? 'Custom Multi-Step Palette' : selectedPalette.name}" (${draftConfig.gradientMode}) gradient styles across ${draftConfig.targetStreams} streams to ${subtitles.length} subtitles.`, 'success');
    onAddNotification(`Gradient styling applied successfully! Subtitles updated.`, 'success');
    onClose();
  };

  const handleClearAllFormatting = () => {
    if (subtitles.length === 0) return;
    const clean = removeAllGradientsFromSubtitles(subtitles);
    onApply(clean);
    if (onUpdateActiveStyling) onUpdateActiveStyling(DEFAULT_STYLING_CONFIG);
    setDraftConfig(DEFAULT_STYLING_CONFIG);
    onAddLog(`Cleared all formatting tags and restored plain subtitles.`, 'info');
    onAddNotification("Cleared all formatting and styles from subtitles", "success");
    onClose();
  };

  // Direct export
  const handleDirectDownload = (format: 'srt' | 'ssa' | 'ass' | 'vtt' | 'clean' | 'json') => {
    if (subtitles.length === 0) {
      onAddNotification("No subtitles to export", "error");
      return;
    }

    const itemsToExport = applyGradientsToSubtitles(
      subtitles, 
      config.paletteId, 
      config.gradientMode, 
      config.targetStreams,
      {
        customColors: config.customColors,
        boldEmphasis: config.boldEmphasis,
        italicize: config.italicize,
        uppercaseOriginal: config.transformCase === 'uppercase'
      }
    );

    const baseName = (fileName || 'subtitles').replace(/\.[^/.]+$/, '').replace(/[^a-z0-9_-]/gi, '_');
    const timestamp = Date.now();
    let content = '';
    let mimeType = 'text/plain;charset=utf-8';
    let fileExt = 'srt';

    if (format === 'srt') {
      content = generateFormattedSRT(itemsToExport, config.targetStreams === 'original' ? 'original' : 'ai');
      mimeType = 'text/srt;charset=utf-8';
      fileExt = 'formatted.srt';
    } else if (format === 'ass') {
      content = generateASS(itemsToExport, {
        fontFamily: activeUrduFont,
        fontSize: previewFontSize || 38,
        title: baseName,
        type: config.targetStreams === 'original' ? 'original' : 'ai',
        palette: selectedPalette,
        stylingConfig: config
      });
      mimeType = 'text/x-ssa;charset=utf-8';
      fileExt = 'ass';
    } else if (format === 'ssa') {
      content = generateSSA(itemsToExport, {
        fontFamily: activeUrduFont,
        fontSize: previewFontSize || 38,
        title: baseName,
        type: config.targetStreams === 'original' ? 'original' : 'ai',
        palette: selectedPalette,
        stylingConfig: config
      });
      mimeType = 'text/x-ssa;charset=utf-8';
      fileExt = 'ssa';
    } else if (format === 'vtt') {
      content = generateWebVTT(itemsToExport, config.targetStreams === 'original' ? 'original' : 'ai');
      mimeType = 'text/vtt;charset=utf-8';
      fileExt = 'vtt';
    } else if (format === 'clean') {
      content = generateCleanSRT(itemsToExport, config.targetStreams === 'original' ? 'original' : 'ai');
      mimeType = 'text/srt;charset=utf-8';
      fileExt = 'clean.srt';
    } else if (format === 'json') {
      content = JSON.stringify(itemsToExport, null, 2);
      mimeType = 'application/json;charset=utf-8';
      fileExt = 'styled.json';
    }

    const blob = new Blob(['\uFEFF' + content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}_${format}_${timestamp}.${fileExt}`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 20000);

    onAddNotification(`Downloaded stylized .${fileExt}`, "success");
    onAddLog(`Saved stylized subtitles as .${fileExt}: ${a.download}`, 'success');
  };

  // Helper to commit stops changes to draft config
  const commitStops = (newStops: GradientStop[]) => {
    setGradientStops(newStops);
    const sorted = [...newStops].sort((a, b) => a.offset - b.offset);
    updateConfig({ customColors: sorted.map(s => s.color) });
  };

  // Interactive Track Click: add stop at exact percentage position
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const offset = Math.round(Math.max(0, Math.min(100, (clickX / rect.width) * 100)));

    const newStop: GradientStop = {
      id: `stop-${Date.now()}`,
      color: activeStop ? activeStop.color : '#00F5D4',
      offset
    };

    const updated = [...gradientStops, newStop];
    commitStops(updated);
    setActiveStopId(newStop.id);
    onAddNotification(`Added stop at ${offset}%`, 'success');
  };

  // Update active stop's color
  const handleUpdateActiveStopColor = (colorHex: string) => {
    const updated = gradientStops.map(s => {
      if (s.id === activeStop.id) {
        return { ...s, color: colorHex };
      }
      return s;
    });
    commitStops(updated);
  };

  // Update active stop's percentage offset
  const handleUpdateActiveStopOffset = (offset: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(offset)));
    const updated = gradientStops.map(s => {
      if (s.id === activeStop.id) {
        return { ...s, offset: clamped };
      }
      return s;
    });
    commitStops(updated);
  };

  // Delete active stop
  const handleDeleteActiveStop = () => {
    if (gradientStops.length <= 2) {
      onAddNotification("A gradient palette requires at least 2 color stops", "error");
      return;
    }
    const updated = gradientStops.filter(s => s.id !== activeStop.id);
    commitStops(updated);
    setActiveStopId(updated[0]?.id || 'stop-0');
    onAddNotification("Removed color stop", "success");
  };

  // Duplicate active stop
  const handleDuplicateActiveStop = () => {
    const newOffset = Math.min(100, activeStop.offset + 10);
    const newStop: GradientStop = {
      id: `stop-${Date.now()}`,
      color: activeStop.color,
      offset: newOffset
    };
    const updated = [...gradientStops, newStop];
    commitStops(updated);
    setActiveStopId(newStop.id);
    onAddNotification("Duplicated color stop", "success");
  };

  // Distribute stops evenly along 0% - 100%
  const handleDistributeStopsEvenly = () => {
    const sorted = [...gradientStops].sort((a, b) => a.offset - b.offset);
    const count = sorted.length;
    if (count <= 1) return;
    const updated = sorted.map((s, idx) => ({
      ...s,
      offset: Math.round((idx / (count - 1)) * 100)
    }));
    commitStops(updated);
    onAddNotification("Distributed color stops evenly", "success");
  };

  // Reverse stops order
  const handleReversePalette = () => {
    const reversed = gradientStops.map(s => ({
      ...s,
      offset: 100 - s.offset
    })).sort((a, b) => a.offset - b.offset);
    commitStops(reversed);
    onAddNotification("Reversed gradient progression", "success");
  };

  // Quick Multi-Step Presets (2, 3, 4, 5 steps)
  const handleApplyStepPreset = (stepCount: 2 | 3 | 4 | 5) => {
    let presetColors: string[] = [];
    if (stepCount === 2) {
      presetColors = ['#FFE259', '#FFA751'];
    } else if (stepCount === 3) {
      presetColors = ['#00F5D4', '#7928CA', '#FF007A'];
    } else if (stepCount === 4) {
      presetColors = ['#38BDF8', '#818CF8', '#C084FC', '#F43F5E'];
    } else {
      presetColors = ['#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#8B5CF6'];
    }

    const newStops: GradientStop[] = presetColors.map((color, idx) => ({
      id: `stop-${Date.now()}-${idx}`,
      color,
      offset: Math.round((idx / (stepCount - 1)) * 100)
    }));

    commitStops(newStops);
    setActiveStopId(newStops[0].id);
    onAddNotification(`Applied ${stepCount}-Step Gradient Preset`, "success");
  };

  // Solid Color Handlers
  const handleSelectSolidColor = (hex: string) => {
    setCustomSolidColor(hex);
    updateConfig({
      paletteId: 'solid-custom',
      customColors: [hex],
      gradientMode: 'block-shift'
    });
    onAddNotification(`Selected solid color ${hex}`, "success");
  };

  // Gradient Library Handlers
  const handleOpenSaveModal = () => {
    setSavePaletteName(config.customColors ? 'Custom Multi-Step Gradient' : selectedPalette.name);
    setSavePaletteDesc(`A ${gradientStops.length}-step gradient with ${config.gradientMode} progression`);
    setIsSaveModalOpen(true);
  };

  const handleSaveToLibrary = () => {
    if (!savePaletteName.trim()) {
      onAddNotification("Please provide a palette name", "error");
      return;
    }

    const colorsToSave = sortedStops.map(s => s.color);
    const newSaved: SavedGradientPalette = {
      id: `palette-${Date.now()}`,
      name: savePaletteName.trim(),
      description: savePaletteDesc.trim() || undefined,
      colors: colorsToSave,
      gradientMode: config.gradientMode,
      createdAt: Date.now(),
      tags: [config.gradientMode, `${colorsToSave.length} Steps`]
    };

    setSavedPalettes(prev => [newSaved, ...prev]);
    setIsSaveModalOpen(false);
    onAddNotification(`Saved "${newSaved.name}" to your Gradient Library!`, "success");
    onAddLog(`Saved palette "${newSaved.name}" (${colorsToSave.join(', ')}) to persistent Gradient Library.`, 'success');
  };

  const handleLoadSavedPalette = (p: SavedGradientPalette) => {
    const newStops: GradientStop[] = p.colors.map((color, idx) => ({
      id: `stop-${Date.now()}-${idx}`,
      color,
      offset: Math.round((idx / Math.max(1, p.colors.length - 1)) * 100)
    }));
    commitStops(newStops);
    updateConfig({
      paletteId: p.id,
      customColors: [...p.colors],
      gradientMode: p.gradientMode || config.gradientMode
    });
    setActiveStopId(newStops[0]?.id || 'stop-0');
    onAddNotification(`Loaded "${p.name}" into active styling preview`, "success");
  };

  const handleApplySavedPaletteDirectly = (p: SavedGradientPalette) => {
    if (subtitles.length === 0) {
      onAddNotification("No subtitles loaded in project", "error");
      return;
    }

    const styled = applyGradientsToSubtitles(
      subtitles, 
      p.id, 
      p.gradientMode || config.gradientMode, 
      config.targetStreams,
      {
        customColors: p.colors,
        boldEmphasis: config.boldEmphasis,
        italicize: config.italicize,
        uppercaseOriginal: config.transformCase === 'uppercase'
      }
    );

    onApply(styled);
    if (onUpdateActiveStyling) {
      onUpdateActiveStyling({
        ...config,
        paletteId: p.id,
        customColors: [...p.colors],
        gradientMode: p.gradientMode || config.gradientMode
      });
    }

    onAddLog(`Applied saved library palette "${p.name}" (${p.colors.length} colors) to ${subtitles.length} subtitles.`, 'success');
    onAddNotification(`Applied "${p.name}" to project subtitles!`, "success");
    onClose();
  };

  const handleDeleteSavedPalette = (id: string, name: string) => {
    setSavedPalettes(prev => prev.filter(p => p.id !== id));
    onAddNotification(`Removed "${name}" from library`, "success");
  };

  const handleSaveRename = (id: string) => {
    if (!editingPaletteName.trim()) return;
    setSavedPalettes(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, name: editingPaletteName.trim() };
      }
      return p;
    }));
    setEditingPaletteId(null);
    setEditingPaletteName('');
    onAddNotification("Palette renamed", "success");
  };

  // Export Library JSON
  const handleExportLibraryJson = () => {
    const jsonStr = JSON.stringify(savedPalettes, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitle_gradient_library_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 10000);
    onAddNotification("Exported Gradient Library as JSON file", "success");
    onAddLog(`Exported ${savedPalettes.length} gradient palettes to JSON backup file.`, 'info');
  };

  // Import Library JSON
  const handleImportLibraryJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(item => item && item.name && Array.isArray(item.colors) && item.colors.length > 0);
          if (valid.length === 0) {
            onAddNotification("No valid palettes found in JSON file", "error");
            return;
          }
          setSavedPalettes(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newItems = valid.map((v, i) => ({
              ...v,
              id: existingIds.has(v.id) ? `imported-${Date.now()}-${i}` : (v.id || `imported-${Date.now()}-${i}`),
              createdAt: v.createdAt || Date.now()
            }));
            return [...newItems, ...prev];
          });
          onAddNotification(`Imported ${valid.length} palettes into your library!`, "success");
          onAddLog(`Imported ${valid.length} gradient palettes from ${file.name}.`, 'success');
        } else {
          onAddNotification("Invalid library file format", "error");
        }
      } catch (err) {
        onAddNotification("Failed to parse JSON file", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Restore starter favorites
  const handleRestoreStarterFavorites = () => {
    setSavedPalettes(STARTER_LIBRARY_PALETTES);
    onAddNotification("Reset library to starter presets", "success");
  };

  // Filtered library
  const filteredPalettes = useMemo(() => {
    if (!librarySearch.trim()) return savedPalettes;
    const query = librarySearch.toLowerCase();
    return savedPalettes.filter(p => 
      p.name.toLowerCase().includes(query) || 
      (p.description && p.description.toLowerCase().includes(query)) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(query)))
    );
  }, [savedPalettes, librarySearch]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-2xs transition-opacity duration-300"
        />
      )}

      {/* Slide-over Drawer from Right Edge */}
      <div 
        className={cn(
          "fixed top-0 bottom-0 right-0 z-[130] w-full max-w-xl sm:max-w-2xl lg:max-w-3xl bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out text-xs",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 text-white shadow-xs shrink-0">
              <Palette size={18} />
            </div>
            <div>
              <h2 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base flex items-center gap-2">
                <span>Subtitle Styling Studio</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono border border-emerald-500/20">
                  Gradients & Colors
                </span>
              </h2>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                12 Gradient Modes • Multi-Step Picker • Doubled Wheels • Saved Library
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyToSubtitles}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles size={12} />
              <span>Apply to Subtitles</span>
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* IN-DRAWER LIVE CINEMA PREVIEW SCREEN */}
        <div className="p-3.5 bg-black border-b border-zinc-800 text-white space-y-2 shrink-0">
          <div className="flex items-center justify-between text-zinc-400 text-[10px]">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
                <Eye size={12} className="text-emerald-400" />
                <span>Live Studio Preview</span>
              </span>
              <span className="text-[8.5px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {config.customColors ? 'Custom Multi-Step Palette' : selectedPalette.name} ({config.gradientMode})
              </span>
            </div>

            {/* Video Backdrop Switcher */}
            <div className="flex items-center gap-2 text-[8.5px] font-bold">
              {/* Stream Visibility Checklist */}
              <div className="hidden sm:flex items-center gap-1.5 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={previewStreams.original} 
                    onChange={e => setPreviewStreams(prev => ({ ...prev, original: e.target.checked }))}
                    className="accent-amber-500 rounded w-2.5 h-2.5" 
                  />
                  <span className="text-zinc-300">Orig</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={previewStreams.ai} 
                    onChange={e => setPreviewStreams(prev => ({ ...prev, ai: e.target.checked }))}
                    className="accent-emerald-500 rounded w-2.5 h-2.5" 
                  />
                  <span className="text-zinc-300">AI</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={previewStreams.google} 
                    onChange={e => setPreviewStreams(prev => ({ ...prev, google: e.target.checked }))}
                    className="accent-blue-500 rounded w-2.5 h-2.5" 
                  />
                  <span className="text-zinc-300">Google</span>
                </label>
              </div>

              <span>Backdrop:</span>
              {(['cinema-dark', 'city-night', 'sunset', 'cyber', 'studio-light'] as const).map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setVideoBackdrop(b)}
                  className={cn(
                    "px-1.5 py-0.5 rounded uppercase transition-colors cursor-pointer",
                    videoBackdrop === b ? "bg-white/20 text-white" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {b.split('-')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Screen simulator */}
          <div className={cn(
            "p-4 rounded-xl border border-zinc-800 flex flex-col items-center justify-center min-h-[110px] text-center gap-2 relative overflow-hidden transition-all duration-300 shadow-inner",
            videoBackdrop === 'cinema-dark' ? "bg-gradient-to-b from-zinc-950 via-zinc-900 to-black" :
            videoBackdrop === 'city-night' ? "bg-gradient-to-b from-blue-950 via-slate-900 to-zinc-950" :
            videoBackdrop === 'sunset' ? "bg-gradient-to-b from-amber-950/60 via-rose-950/40 to-black" :
            videoBackdrop === 'cyber' ? "bg-gradient-to-b from-fuchsia-950/60 via-purple-950/40 to-black" :
            "bg-gradient-to-b from-zinc-300 via-zinc-200 to-zinc-400 text-zinc-900"
          )}>
            {styledSampleItems.slice(0, 1).map((sample) => (
              <div key={sample.index} className="space-y-2 w-full flex flex-col items-center">
                {/* AI Translated Preview */}
                {previewStreams.ai && sample.translatedText && (
                  <div 
                    className="leading-relaxed transition-all drop-shadow-md"
                    style={{ 
                      fontFamily: activeUrduFont,
                      fontSize: `${previewFontSize}px`
                    }}
                    dir="rtl"
                    dangerouslySetInnerHTML={{ __html: sample.translatedText }}
                  />
                )}
                {/* Original Source Preview */}
                {previewStreams.original && sample.text && (
                  <div 
                    className="opacity-95 font-sans transition-all drop-shadow-sm"
                    style={{ 
                      fontFamily: activeEnglishFont,
                      fontSize: `${Math.max(12, Math.round(previewFontSize * 0.65))}px`
                    }}
                    dangerouslySetInnerHTML={{ __html: sample.text }}
                  />
                )}
                {/* Google Preview */}
                {previewStreams.google && sample.googleTranslateText && (
                  <div 
                    className="opacity-85 italic font-urdu transition-all text-xs drop-shadow-sm"
                    style={{ 
                      fontFamily: activeUrduFont,
                      fontSize: `${Math.max(11, Math.round(previewFontSize * 0.6))}px`
                    }}
                    dir="rtl"
                    dangerouslySetInnerHTML={{ __html: sample.googleTranslateText }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* TARGET STREAMS BAR */}
        <div className="px-4 py-2 bg-zinc-100/90 dark:bg-zinc-850/90 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
            <Layers size={13} className="text-emerald-500 shrink-0" />
            <label className="text-[10px] font-bold uppercase tracking-wider">
              Target Subtitle Streams:
            </label>
          </div>
          <div className="relative flex-1 max-w-xs">
            <select
              value={config.targetStreams}
              onChange={e => updateConfig({ targetStreams: e.target.value as TargetStreamField })}
              className="w-full py-1.5 px-3 pr-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold shadow-2xs focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none"
            >
              <option value="all">All 3 Streams (Original + AI + Google)</option>
              <option value="both">Both (Original + AI Urdu)</option>
              <option value="translated">AI Translated (Urdu Only)</option>
              <option value="original">Original (Source Language Only)</option>
              <option value="google">Google Translate Only</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center px-4 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shrink-0 gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('gradients')}
            className={cn(
              "py-2.5 px-3 font-bold text-xs flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer shrink-0",
              activeTab === 'gradients'
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            )}
          >
            <Sliders size={13} />
            <span>Gradients & Modes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom-builder')}
            className={cn(
              "py-2.5 px-3 font-bold text-xs flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer shrink-0",
              activeTab === 'custom-builder'
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            )}
          >
            <Pipette size={13} />
            <span>Multi-Step Palette Picker</span>
            {config.customColors && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('solid-colors')}
            className={cn(
              "py-2.5 px-3 font-bold text-xs flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer shrink-0",
              activeTab === 'solid-colors'
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            )}
          >
            <Sun size={13} />
            <span>Solid Colors</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={cn(
              "py-2.5 px-3 font-bold text-xs flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer shrink-0 ml-auto",
              activeTab === 'library'
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            )}
          >
            <Bookmark size={13} className="text-indigo-500" />
            <span>Gradient Library</span>
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono text-[9px]">
              {savedPalettes.length}
            </span>
          </button>
        </div>

        {/* Scrollable Studio Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* TAB 1: GRADIENTS & 12 MODES */}
          {activeTab === 'gradients' && (
            <div className="space-y-4">
              {/* 12 Gradient Progression Modes Grid */}
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Sliders size={13} className="text-indigo-500" />
                    <span>Gradient Progression Modes ({GRADIENT_PROGRESSION_MODES.length} Modes)</span>
                  </label>
                  <span className="text-[9px] text-zinc-400 font-mono">Select timeline algorithm</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {GRADIENT_PROGRESSION_MODES.map(m => {
                    const isSelected = config.gradientMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => updateConfig({ gradientMode: m.id })}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 group",
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 shadow-2xs ring-1 ring-emerald-500/30"
                            : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-[10.5px] truncate">{m.label}</span>
                          <span className={cn(
                            "text-[8px] font-mono px-1.5 py-0.2 rounded-full",
                            isSelected 
                              ? "bg-emerald-500 text-white" 
                              : "bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                          )}>
                            {m.tag}
                          </span>
                        </div>
                        <span className="text-[8.5px] text-zinc-500 dark:text-zinc-400 leading-tight">
                          {m.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 20 Designer Color Palettes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Palette size={13} className="text-rose-500" />
                    <span>Designer Curated Palettes</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('custom-builder')}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline text-[9.5px] font-bold cursor-pointer"
                    >
                      + Open Multi-Step Picker
                    </button>
                    <span className="text-zinc-400 font-mono text-[9px]">{GRADIENT_PALETTES.length} Presets</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {GRADIENT_PALETTES.map(palette => {
                    const isSelected = !config.customColors && config.paletteId === palette.id;
                    return (
                      <button
                        key={palette.id}
                        type="button"
                        onClick={() => {
                          updateConfig({ 
                            paletteId: palette.id,
                            customColors: undefined 
                          });
                          const syncd = palette.colors.map((c, i) => ({
                            id: `stop-${i}`,
                            color: c,
                            offset: Math.round((i / Math.max(1, palette.colors.length - 1)) * 100)
                          }));
                          setGradientStops(syncd);
                          setActiveStopId(syncd[0]?.id || 'stop-0');
                        }}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer shadow-2xs group",
                          isSelected
                            ? "border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/30"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 bg-white dark:bg-zinc-850"
                        )}
                      >
                        <div 
                          className="h-3.5 w-full rounded-md shadow-2xs group-hover:scale-[1.02] transition-transform"
                          style={{ background: palette.previewCss }}
                        />
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-zinc-100 text-[10px] truncate">
                            {palette.name}
                          </div>
                          <div className="text-[8px] text-zinc-400 dark:text-zinc-500 truncate">
                            {palette.colors.length} stops • {palette.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Save Current Palette Action */}
              <div className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BookmarkPlus size={16} className="text-indigo-500" />
                  <div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                      Save Active Gradient to Library
                    </div>
                    <div className="text-[9.5px] text-zinc-500 dark:text-zinc-400">
                      Store this color palette in your persistent library to reuse across any subtitle projects.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOpenSaveModal}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <Bookmark size={12} />
                  <span>Save to Library</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: MULTI-STEP GRADIENT PALETTE PICKER */}
          {activeTab === 'custom-builder' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-850 space-y-4 shadow-xs">
                {/* Header & Quick Actions */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <Pipette size={15} className="text-emerald-500" />
                    <div>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wider block">
                        Multi-Step Gradient Palette Picker
                      </span>
                      <span className="text-[9px] text-zinc-400">
                        Click track to add color stops • Drag or slide position • Full wheel control
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleDistributeStopsEvenly}
                      className="px-2 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 text-[10px] font-bold cursor-pointer transition-colors"
                      title="Space all stops equally from 0% to 100%"
                    >
                      Even Spacing
                    </button>
                    <button
                      type="button"
                      onClick={handleReversePalette}
                      className="px-2 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Reverse color stop order"
                    >
                      <ArrowLeftRight size={10} />
                      <span>Reverse</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateConfig({ customColors: undefined });
                        const syncd = selectedPalette.colors.map((c, i) => ({
                          id: `stop-${i}`,
                          color: c,
                          offset: Math.round((i / Math.max(1, selectedPalette.colors.length - 1)) * 100)
                        }));
                        setGradientStops(syncd);
                        setActiveStopId(syncd[0]?.id || 'stop-0');
                      }}
                      className="px-2 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 text-[10px] font-bold cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Quick Step Presets (2, 3, 4, 5 steps) */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-wider mr-1">
                    Quick Steps:
                  </span>
                  {[
                    { label: '2-Step Duo', count: 2 as const },
                    { label: '3-Step Triad', count: 3 as const },
                    { label: '4-Step Quad', count: 4 as const },
                    { label: '5-Step Spectrum', count: 5 as const }
                  ].map(p => (
                    <button
                      key={p.count}
                      type="button"
                      onClick={() => handleApplyStepPreset(p.count)}
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[9.5px] font-bold border transition-colors cursor-pointer",
                        gradientStops.length === p.count
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* INTERACTIVE MULTI-STEP GRADIENT TRACK */}
                <div className="space-y-1.5 pt-1">
                  <div className="relative pt-2 pb-8 select-none">
                    {/* Visual Gradient Track with Click-to-Add Stop */}
                    <div 
                      onClick={handleTrackClick}
                      className="h-9 w-full rounded-xl cursor-crosshair border border-zinc-300 dark:border-zinc-700 shadow-inner relative overflow-hidden transition-all"
                      style={{ background: trackGradientCss }}
                      title="Click anywhere on the track to add a color stop"
                    />

                    {/* Interactive Stop Pin Handles */}
                    {sortedStops.map(stop => {
                      const isSelected = stop.id === activeStop.id;
                      return (
                        <div
                          key={stop.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveStopId(stop.id);
                          }}
                          className={cn(
                            "absolute -bottom-1 -translate-x-1/2 flex flex-col items-center cursor-pointer transition-transform group z-10",
                            isSelected ? "scale-125 z-20" : "hover:scale-110 opacity-85"
                          )}
                          style={{ left: `${stop.offset}%` }}
                        >
                          {/* Pin Pointer arrow */}
                          <div 
                            className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[6px]"
                            style={{ 
                              borderBottomColor: isSelected ? '#10B981' : '#71717A' 
                            }}
                          />
                          {/* Circular Stop Swatch Pin */}
                          <div 
                            className={cn(
                              "w-5 h-5 rounded-full border-2 shadow-md flex items-center justify-center transition-all",
                              isSelected 
                                ? "border-emerald-500 ring-2 ring-emerald-400/50" 
                                : "border-white dark:border-zinc-900 group-hover:border-zinc-400"
                            )}
                            style={{ backgroundColor: stop.color }}
                          >
                            {isSelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                            )}
                          </div>
                          {/* Percent label */}
                          <span className={cn(
                            "text-[8px] font-mono mt-0.5 px-1 rounded",
                            isSelected ? "bg-emerald-500 text-white font-bold" : "text-zinc-400"
                          )}>
                            {stop.offset}%
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-zinc-400 font-mono px-1">
                    <span>0% (Start)</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {gradientStops.length} Active Steps
                    </span>
                    <span>100% (End)</span>
                  </div>
                </div>

                {/* Selected Stop Controller: Offset Slider & Precision Tuner */}
                <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-5 h-5 rounded-lg border border-black/20 shadow-xs shrink-0" 
                        style={{ backgroundColor: activeStop.color }} 
                      />
                      <span className="font-bold text-[11px] text-zinc-900 dark:text-zinc-100">
                        Selected Stop: <span className="font-mono text-emerald-600 dark:text-emerald-400">{activeStop.color}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleDuplicateActiveStop}
                        className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 text-[10px] font-bold cursor-pointer"
                        title="Duplicate this stop"
                      >
                        Duplicate
                      </button>
                      {gradientStops.length > 2 && (
                        <button
                          type="button"
                          onClick={handleDeleteActiveStop}
                          className="px-2 py-1 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-[10px] font-bold cursor-pointer"
                          title="Remove stop"
                        >
                          Remove Stop
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Offset Range Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                      <span>Timeline Position</span>
                      <span className="font-mono text-zinc-800 dark:text-zinc-200">{activeStop.offset}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={activeStop.offset}
                      onChange={e => handleUpdateActiveStopOffset(Number(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald-500 bg-zinc-200 dark:bg-zinc-700"
                    />
                  </div>
                </div>

                {/* DOUBLED-SIZE COLOR WHEEL FOR SELECTED STOP */}
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-750 flex flex-col items-center justify-center gap-3">
                  <div className="w-full flex items-center justify-between">
                    <span className="font-bold text-[10.5px] uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Pipette size={12} className="text-emerald-500" />
                      <span>Doubled Precision Color Wheel</span>
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400">
                      288px Full-Resolution Canvas
                    </span>
                  </div>

                  {/* ColorWheelPicker rendered inline with doubled dimensions */}
                  <div className="flex justify-center w-full py-1">
                    <ColorWheelPicker
                      color={activeStop.color}
                      onChange={c => handleUpdateActiveStopColor(c)}
                      label={`Stop (${activeStop.offset}%) Color Wheel`}
                      showAlpha={false}
                      size="double"
                      inline={true}
                    />
                  </div>

                  {/* Direction & Save to Library bar */}
                  <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-750">
                    {/* Gradient Direction Angle */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Angle:</span>
                      <div className="flex items-center gap-1">
                        {(['45deg', '90deg', '135deg', '180deg'] as const).map(angle => (
                          <button
                            key={angle}
                            type="button"
                            onClick={() => updateConfig({ gradientDirection: angle })}
                            className={cn(
                              "px-2 py-1 rounded-md text-[9.5px] font-mono font-bold cursor-pointer transition-colors",
                              (config.gradientDirection || '135deg') === angle
                                ? "bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900"
                                : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300"
                            )}
                          >
                            {angle}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenSaveModal}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Bookmark size={13} />
                      <span>Save Multi-Step Gradient to Library</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SOLID COLORS TAB */}
          {activeTab === 'solid-colors' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-850 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Sun size={13} className="text-amber-500" />
                      <span>Curated Subtitle Solid Colors</span>
                    </h3>
                    <p className="text-[9.5px] text-zinc-500 dark:text-zinc-400">
                      High-visibility cinema standard solid colors without gradient blending
                    </p>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-400">
                    {SOLID_SUBTITLE_COLORS.length} Presets
                  </span>
                </div>

                {/* Solid Color Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {SOLID_SUBTITLE_COLORS.map(c => {
                    const isSelected = config.customColors?.length === 1 && config.customColors[0].toUpperCase() === c.hex.toUpperCase();
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => handleSelectSolidColor(c.hex)}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer shadow-2xs group",
                          isSelected
                            ? "border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/30"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 bg-white dark:bg-zinc-800"
                        )}
                      >
                        <div 
                          className="w-7 h-7 rounded-lg border border-black/15 shadow-xs shrink-0 group-hover:scale-105 transition-transform"
                          style={{ backgroundColor: c.hex }}
                        />
                        <div className="overflow-hidden">
                          <div className="font-bold text-zinc-900 dark:text-zinc-100 text-[10px] truncate">
                            {c.name}
                          </div>
                          <div className="font-mono text-[8.5px] text-zinc-400 truncate">
                            {c.hex}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Solid Color Wheel Picker (Doubled in Size) */}
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-850 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Pipette size={13} className="text-emerald-500" />
                    <span>Custom Solid Color Wheel (Doubled Resolution)</span>
                  </h4>
                  <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {customSolidColor}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center gap-4">
                  <ColorWheelPicker
                    color={customSolidColor}
                    onChange={c => {
                      setCustomSolidColor(c);
                      updateConfig({
                        paletteId: 'solid-custom',
                        customColors: [c],
                        gradientMode: 'block-shift'
                      });
                    }}
                    label="Solid Color Wheel"
                    showAlpha={false}
                    size="double"
                    inline={true}
                  />

                  <div className="space-y-2 w-full">
                    <div className="p-3 rounded-lg bg-black text-white flex items-center justify-center font-bold text-sm shadow-inner" style={{ color: customSolidColor }}>
                      Sample Subtitle in {customSolidColor}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectSolidColor(customSolidColor)}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer text-center"
                      >
                        Apply Solid Color to Preview
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenSaveModal}
                        className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Bookmark size={12} />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: USER-SAVEABLE GRADIENT LIBRARY */}
          {activeTab === 'library' && (
            <div className="space-y-4">
              {/* Library Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    type="text"
                    value={librarySearch}
                    onChange={e => setLibrarySearch(e.target.value)}
                    placeholder="Search saved palettes by name or tags..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 shadow-2xs"
                  />
                  {librarySearch && (
                    <button
                      type="button"
                      onClick={() => setLibrarySearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-[11px]"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Library Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenSaveModal}
                    className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Save Current</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportLibraryJson}
                    className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs transition-colors cursor-pointer"
                    title="Export Library to JSON backup"
                  >
                    <Download size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => importFileInputRef.current?.click()}
                    className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs transition-colors cursor-pointer"
                    title="Import Library from JSON file"
                  >
                    <Upload size={14} />
                  </button>
                  <input
                    ref={importFileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportLibraryJson}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Saved Palettes List */}
              {filteredPalettes.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 flex items-center justify-center mx-auto">
                    <FolderHeart size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">
                      No saved palettes found
                    </h4>
                    <p className="text-zinc-500 text-xs max-w-sm mx-auto mt-0.5">
                      Save custom-built gradients so you can reuse them in future subtitle translations and exports.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleRestoreStarterFavorites}
                      className="px-3 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 font-bold text-xs cursor-pointer"
                    >
                      Load Starter Palettes
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenSaveModal}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer"
                    >
                      Save Active Gradient
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredPalettes.map(palette => {
                    const isEditing = editingPaletteId === palette.id;
                    return (
                      <div
                        key={palette.id}
                        className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 shadow-2xs space-y-2.5 transition-all hover:border-indigo-400 dark:hover:border-indigo-500 group"
                      >
                        {/* Header with Title and Menu */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={editingPaletteName}
                                  onChange={e => setEditingPaletteName(e.target.value)}
                                  className="w-full px-2 py-0.5 rounded border border-indigo-400 bg-white dark:bg-zinc-800 text-xs font-bold"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveRename(palette.id)}
                                  className="p-1 rounded bg-emerald-600 text-white"
                                >
                                  <Check size={11} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs truncate">
                                  {palette.name}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPaletteId(palette.id);
                                    setEditingPaletteName(palette.name);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-opacity"
                                  title="Rename palette"
                                >
                                  <Edit2 size={10} />
                                </button>
                              </div>
                            )}

                            {palette.description && (
                              <p className="text-[9.5px] text-zinc-500 dark:text-zinc-400 truncate">
                                {palette.description}
                              </p>
                            )}
                          </div>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteSavedPalette(palette.id, palette.name)}
                            className="text-zinc-400 hover:text-rose-500 p-1 rounded transition-colors cursor-pointer"
                            title="Delete saved palette"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        {/* Multi-color gradient strip preview */}
                        <div 
                          className="h-6 w-full rounded-lg shadow-2xs border border-zinc-200/50 dark:border-zinc-700/50"
                          style={{
                            background: `linear-gradient(90deg, ${palette.colors.join(', ')})`
                          }}
                        />

                        {/* Color swatches & metadata pills */}
                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <div className="flex items-center gap-1 overflow-x-auto max-w-[65%]">
                            {palette.colors.map((c, i) => (
                              <span 
                                key={i}
                                className="w-4 h-4 rounded-full border border-black/15 shrink-0 shadow-2xs"
                                style={{ backgroundColor: c }}
                                title={c}
                              />
                            ))}
                          </div>

                          <div className="flex items-center gap-1 text-[8.5px] font-mono text-zinc-400 shrink-0">
                            <span>{palette.colors.length} Colors</span>
                            {palette.gradientMode && (
                              <span className="px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-750 text-zinc-600 dark:text-zinc-300">
                                {palette.gradientMode}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                          <button
                            type="button"
                            onClick={() => handleLoadSavedPalette(palette)}
                            className="flex-1 py-1 px-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-[10px] transition-colors cursor-pointer text-center"
                          >
                            Load to Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplySavedPaletteDirectly(palette)}
                            className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <Sparkles size={10} />
                            <span>Apply</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* DRAWER FOOTER WITH EXPORT MENU DROPDOWN */}
        <div className="relative p-3.5 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/95 dark:bg-zinc-850/95 flex items-center justify-between shrink-0">
          {/* Left Actions: Clear Formatting & Export Subtitles Menu */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearAllFormatting}
              className="flex items-center gap-1 px-2.5 py-1.5 text-zinc-500 hover:text-red-600 text-xs font-bold transition-colors cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Clear</span>
            </button>

            {/* EXPORT OPTIONS DROPDOWN BUTTON */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                <Download size={13} className="text-emerald-500" />
                <span>Export Options</span>
                <ChevronUp size={12} className={cn("text-zinc-400 transition-transform", !isExportMenuOpen && "rotate-180")} />
              </button>

              {/* Upward Popover Menu */}
              {isExportMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-[140]" 
                    onClick={() => setIsExportMenuOpen(false)} 
                  />
                  <div className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-2 z-[150] space-y-1">
                    <div className="px-2.5 py-1.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-500">
                        Export Formats ({subtitles.length} segments)
                      </span>
                      <span className="text-[9px] font-mono text-emerald-500 font-bold">Video Ready</span>
                    </div>

                    {/* Formatted SRT */}
                    <button
                      type="button"
                      onClick={() => { handleDirectDownload('srt'); setIsExportMenuOpen(false); }}
                      className="w-full p-2 rounded-xl text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2.5 transition-colors group cursor-pointer"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                        <Download size={13} />
                      </div>
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">Formatted SRT</div>
                        <div className="text-[9px] text-zinc-400">VLC & PotPlayer &lt;font color&gt; tags</div>
                      </div>
                    </button>

                    {/* Advanced ASS */}
                    <button
                      type="button"
                      onClick={() => { handleDirectDownload('ass'); setIsExportMenuOpen(false); }}
                      className="w-full p-2 rounded-xl text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-2.5 transition-colors group cursor-pointer"
                    >
                      <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                        <Sparkles size={13} />
                      </div>
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">Advanced ASS</div>
                        <div className="text-[9px] text-zinc-400">SubStation Alpha v4+ with color tags</div>
                      </div>
                    </button>

                    {/* SSA v4 */}
                    <button
                      type="button"
                      onClick={() => { handleDirectDownload('ssa'); setIsExportMenuOpen(false); }}
                      className="w-full p-2 rounded-xl text-left hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center gap-2.5 transition-colors group cursor-pointer"
                    >
                      <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                        <Film size={13} />
                      </div>
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">SSA v4</div>
                        <div className="text-[9px] text-zinc-400">Standard SubStation Alpha v4</div>
                      </div>
                    </button>

                    {/* WebVTT */}
                    <button
                      type="button"
                      onClick={() => { handleDirectDownload('vtt'); setIsExportMenuOpen(false); }}
                      className="w-full p-2 rounded-xl text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-2.5 transition-colors group cursor-pointer"
                    >
                      <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                        <FileCode size={13} />
                      </div>
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">WebVTT (.vtt)</div>
                        <div className="text-[9px] text-zinc-400">HTML5 Web & Mobile Video Players</div>
                      </div>
                    </button>

                    {/* Styled JSON */}
                    <button
                      type="button"
                      onClick={() => { handleDirectDownload('json'); setIsExportMenuOpen(false); }}
                      className="w-full p-2 rounded-xl text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2.5 transition-colors group cursor-pointer"
                    >
                      <div className="p-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 group-hover:scale-105 transition-transform">
                        <Download size={13} />
                      </div>
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">Styled JSON</div>
                        <div className="text-[9px] text-zinc-400">Full programmatic styled dataset</div>
                      </div>
                    </button>

                    {/* Clean Plain SRT */}
                    <button
                      type="button"
                      onClick={() => { handleDirectDownload('clean'); setIsExportMenuOpen(false); }}
                      className="w-full p-2 rounded-xl text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2.5 transition-colors group cursor-pointer"
                    >
                      <div className="p-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 group-hover:scale-105 transition-transform">
                        <Type size={13} />
                      </div>
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">Clean Plain SRT</div>
                        <div className="text-[9px] text-zinc-400">Stripped of all formatting tags</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Actions: Close & Apply */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleApplyToSubtitles}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Sparkles size={13} />
              <span>Apply to Subtitles</span>
            </button>
          </div>
        </div>
      </div>

      {/* SAVE TO GRADIENT LIBRARY MODAL */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500 text-white">
                  <BookmarkPlus size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    Save to Gradient Library
                  </h3>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Store palette permanently to use across projects
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X size={16} />
              </button>
            </div>

            {/* Gradient Strip Preview */}
            <div className="space-y-1">
              <div 
                className="h-8 w-full rounded-xl shadow-inner border border-zinc-200 dark:border-zinc-700"
                style={{ 
                  background: `linear-gradient(90deg, ${sortedStops.map(s => s.color).join(', ')})`
                }}
              />
              <div className="flex items-center gap-1 flex-wrap">
                {sortedStops.map((s, i) => (
                  <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    {s.color} ({s.offset}%)
                  </span>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Palette Name:
                </label>
                <input
                  type="text"
                  value={savePaletteName}
                  onChange={e => setSavePaletteName(e.target.value)}
                  placeholder="e.g. Neon Cyber Gold"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Optional Description:
                </label>
                <input
                  type="text"
                  value={savePaletteDesc}
                  onChange={e => setSavePaletteDesc(e.target.value)}
                  placeholder="e.g. Best for high contrast dark videos and Urdu nastaliq"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveToLibrary}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Save size={12} />
                <span>Save to Library</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
