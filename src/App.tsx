/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { 
  Upload, 
  FileText, 
  Search, 
  Languages, 
  Download, 
  Trash2, 
  Menu, 
  X, 
  ChevronRight, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Settings,
  MessageSquare,
  Terminal,
  GripHorizontal,
  Save,
  RotateCcw,
  BarChart3,
  SearchCode,
  Type as TypeIcon,
  Activity,
  Check,
  Moon,
  Sun,
  Minimize2,
  Maximize2,
  Palette,
  Sparkles,
  Copy,
  FileCode,
  ArrowLeft,
  Sliders,
  Undo,
  Redo,
  Lock,
  Unlock,
  Clock,
  Replace,
  Wand2,
  Columns,
  Filter,
  CheckSquare,
  Square,
  Eye,
  Scissors,
  Edit3,
  Plus,
  Smartphone,
  Share2,
  Youtube,
  Music,
  ShieldCheck,
  FoldHorizontal,
  Shield,
  Film,
  Clapperboard,
  Play,
  ChevronDown,
  Info,
  Cpu,
  Globe,
  FolderPlus,
  Undo2,
  Redo2,
  RefreshCw,
  Stamp,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  parseUniversalCaptions,
  parseSRT, 
  stringifySRT, 
  SubtitleItem,
  calculateDurationAndCPS,
  shiftSubtitleTimings,
  timeStringToMs,
  msToTimeString
} from './utils/srtParser';
import { 
  executeFindAndReplace, 
  executeCleanup, 
  mergeConsecutiveSubtitles,
  splitSubtitle,
  insertSubtitle,
  deleteSubtitle,
  batchDeleteSubtitles,
  createOriginalTimingMap,
  resetSubtitleTimings,
  OriginalTimingMap
} from './utils/subtitleOperations';
import { GeminiService, TranslationResult, translateTextGoogle, translateBatchGoogle } from './services/gemini';
import { GeminiQuotaDashboard } from './components/GeminiQuotaDashboard';
import { SubtitleStylizerModal } from './components/SubtitleStylizerModal';
import { TranslationSettingsModal } from './components/TranslationSettingsModal';
import { FindReplaceModal } from './components/FindReplaceModal';
import { TimeShiftModal } from './components/TimeShiftModal';
import { GapTimingModal } from './components/GapTimingModal';
import { TextCleanupModal } from './components/TextCleanupModal';
import { WatermarkModal } from './components/WatermarkModal';
import { SubtitleEditorModal } from './components/SubtitleEditorModal';
import { AiCinemaDrawer } from './components/AiCinemaDrawer';
import { StylingStudioDrawer, ActiveStylingConfig, DEFAULT_STYLING_CONFIG } from './components/StylingStudioDrawer';
import { SubtitlePreviewSpaceModal } from './components/SubtitlePreviewSpaceModal';
import { GoogleTranslateSettingsModal } from './components/GoogleTranslateSettingsModal';
import { AiConfigModal } from './components/AiConfigModal';
import { UnifiedDownloadModal } from './components/UnifiedDownloadModal';
import { ThemeSelector, AppTheme } from './components/ThemeSelector';
import { InfoPopover } from './components/InfoPopover';
import { 
  TranslationSettings, 
  DEFAULT_TRANSLATION_SETTINGS, 
  SCRIPT_MODES, 
  TARGET_LANGUAGES, 
  TONE_REGISTERS,
  HONORIFIC_OPTIONS,
  ScriptMode, 
  ToneRegister 
} from './services/translationSettings';
import { 
  hasFormatting, 
  stripFormatting,
  formatSubtitlePreview,
  applyGradientsToSubtitles,
  renderStylizedSubtitleHtml,
  computeSubtitleCssStyles,
  generateFormattedSRT, 
  generateASS, 
  generateSSA,
  generateWebVTT, 
  generateCleanSRT,
  generateYouTubeSBV,
  generateLRC,
  generateAndroidPhoneTranscript,
  generateJSONCaptions,
  GRADIENT_PALETTES 
} from './utils/subtitleFormatter';
import { useProgressiveRenderList } from './utils/performance';
import { quotaManager, FeasibilityReport } from './services/quota';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { dbService } from './services/db';
import { SubtitleRowEditableCell } from './components/SubtitleRowEditableCell';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

import { 
  URDU_FONT_OPTIONS, 
  ENGLISH_FONT_OPTIONS,
  FontOption,
  CustomFontItem,
  getLocalFontsFromStorage,
  saveLocalFontsToStorage,
  registerUploadedFont
} from './constants/fonts';
export { URDU_FONT_OPTIONS, ENGLISH_FONT_OPTIONS };

export const DEMO_SAMPLE_SUBTITLES: SubtitleItem[] = [
  {
    index: 1,
    startTime: '00:00:01,200',
    endTime: '00:00:04,500',
    text: 'Every great cinematic journey begins with an unspoken truth.',
    translatedText: 'ہر عظیم فلمی سفر ایک ان کہی سچائی سے شروع ہوتا ہے۔',
    googleTranslateText: 'ہر عظیم سنیما کا سفر ایک ناگفتہ بہ حقیقت سے شروع ہوتا ہے۔'
  },
  {
    index: 2,
    startTime: '00:00:05,100',
    endTime: '00:00:08,900',
    text: 'Listen closely to the echoes between the words.',
    translatedText: 'الفاظ کے درمیان گونجتی خاموشی کو غور سے سنیں۔',
    googleTranslateText: 'الفاظ کے درمیان گونج کو قریب سے سنیں۔'
  },
  {
    index: 3,
    startTime: '00:00:09,400',
    endTime: '00:00:13,600',
    text: 'When night falls across the valley, memories start to speak.',
    translatedText: 'جب وادی پر رات اترتی ہے، تو یادیں بولنے لگتی ہیں۔',
    googleTranslateText: 'جب وادی میں رات آتی ہے تو یادیں بولنے لگتی ہیں۔'
  },
  {
    index: 4,
    startTime: '00:00:14,200',
    endTime: '00:00:18,700',
    text: 'We are not just translating subtitles; we are preserving the human soul.',
    translatedText: 'ہم صرف مکالمے ترجمہ نہیں کر رہے، بلکہ انسانی جذبات کو محفوظ کر رہے ہیں۔',
    googleTranslateText: 'ہم صرف ذیلی عنوانات کا ترجمہ نہیں کر رہے ہیں، ہم انسانی روح کو محفوظ کر رہے ہیں۔'
  }
];

const SubtitleRow = memo(({ 
  item, 
  onOpenEditor,
  onTranslateGoogle,
  isSelected = false,
  onToggleSelect,
  visibleColumns = { time: true, original: true, ai: true, google: true },
  originalFont = ENGLISH_FONT_OPTIONS[0].value,
  originalFontSize = 14,
  urduFont = URDU_FONT_OPTIONS[0].value,
  translatedFontSize = 22,
  googleFont = URDU_FONT_OPTIONS[0].value,
  googleFontSize = 14,
  isGlobalFontActive = false,
  globalFont = URDU_FONT_OPTIONS[0].value,
  globalFontSize = 20,
  activeStylingConfig,
  isStylingPreviewActive = true,
  isReadOnly = true,
  onEditOriginal,
  onEditTranslated,
  onEditGoogle,
  onOpenWatermark
}: { 
  item: SubtitleItem; 
  onOpenEditor: (index: number) => void;
  onTranslateGoogle?: (index: number) => Promise<void> | void;
  isSelected?: boolean;
  onToggleSelect?: (index: number) => void;
  visibleColumns?: { time: boolean; original: boolean; ai: boolean; google: boolean };
  originalFont?: string;
  originalFontSize?: number;
  urduFont?: string;
  translatedFontSize?: number;
  googleFont?: string;
  googleFontSize?: number;
  isGlobalFontActive?: boolean;
  globalFont?: string;
  globalFontSize?: number;
  activeStylingConfig?: ActiveStylingConfig;
  isStylingPreviewActive?: boolean;
  isReadOnly?: boolean;
  onEditOriginal?: (index: number, text: string) => void;
  onEditTranslated?: (index: number, text: string) => void;
  onEditGoogle?: (index: number, text: string) => void;
  onOpenWatermark?: () => void;
}) => {
  const [isTranslatingRow, setIsTranslatingRow] = useState(false);
  const [copied, setCopied] = useState(false);

  const localText = item.translatedText || '';

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!localText) return;
    const clean = localText.replace(/<[^>]+>/g, '');
    navigator.clipboard.writeText(clean);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isStylized = useMemo(() => hasFormatting(localText), [localText]);

  // Determine which streams should receive styling based on activeStylingConfig.targetStreams
  const shouldStyleOriginal = Boolean(
    isStylingPreviewActive && 
    activeStylingConfig &&
    (activeStylingConfig.targetStreams === 'all' || 
     activeStylingConfig.targetStreams === 'both' || 
     activeStylingConfig.targetStreams === 'original')
  );

  const shouldStyleAi = Boolean(
    isStylingPreviewActive && 
    activeStylingConfig &&
    (activeStylingConfig.targetStreams === 'all' || 
     activeStylingConfig.targetStreams === 'both' || 
     activeStylingConfig.targetStreams === 'translated')
  );

  const shouldStyleGoogle = Boolean(
    isStylingPreviewActive && 
    activeStylingConfig &&
    (activeStylingConfig.targetStreams === 'all' || 
     activeStylingConfig.targetStreams === 'google')
  );

  const hasOriginalFormatting = useMemo(() => hasFormatting(item.text || ''), [item.text]);
  const hasAiFormatting = isStylized;
  const hasGoogleFormatting = useMemo(() => hasFormatting(item.googleTranslateText || ''), [item.googleTranslateText]);

  // Computed CSS Styles (Outlines, Shadows, Glows, Backdrop Box, Typography, Animations)
  const originalCss = useMemo(() => {
    if (!shouldStyleOriginal && !hasOriginalFormatting) return { style: {}, className: '' };
    return computeSubtitleCssStyles({
      textOutline: activeStylingConfig?.textOutline,
      customOutlineColor: activeStylingConfig?.customOutlineColor,
      outlineOpacity: activeStylingConfig?.outlineOpacity,
      textShadow: activeStylingConfig?.textShadow,
      customShadowColor: activeStylingConfig?.customShadowColor,
      shadowBlur: activeStylingConfig?.shadowBlur,
      shadowOffsetX: activeStylingConfig?.shadowOffsetX,
      shadowOffsetY: activeStylingConfig?.shadowOffsetY,
      backdropBox: activeStylingConfig?.backdropBox,
      backdropPadding: activeStylingConfig?.backdropPadding,
      backdropRadius: activeStylingConfig?.backdropRadius,
      backdropOpacity: activeStylingConfig?.backdropOpacity,
      backdropBlur: activeStylingConfig?.backdropBlur,
      fontWeight: activeStylingConfig?.fontWeight,
      letterSpacing: activeStylingConfig?.letterSpacing,
      lineHeight: activeStylingConfig?.lineHeight,
      textAlign: activeStylingConfig?.textAlign,
      transformCase: activeStylingConfig?.transformCase,
      boldEmphasis: activeStylingConfig?.boldEmphasis,
      italicize: activeStylingConfig?.italicize,
      animation: activeStylingConfig?.animation,
      activePaletteColors: activeStylingConfig?.customColors || GRADIENT_PALETTES.find(p => p.id === activeStylingConfig?.paletteId)?.colors
    });
  }, [shouldStyleOriginal, hasOriginalFormatting, activeStylingConfig]);

  const aiCss = useMemo(() => {
    if (!shouldStyleAi && !hasAiFormatting) return { style: {}, className: '' };
    return computeSubtitleCssStyles({
      textOutline: activeStylingConfig?.textOutline,
      customOutlineColor: activeStylingConfig?.customOutlineColor,
      outlineOpacity: activeStylingConfig?.outlineOpacity,
      textShadow: activeStylingConfig?.textShadow,
      customShadowColor: activeStylingConfig?.customShadowColor,
      shadowBlur: activeStylingConfig?.shadowBlur,
      shadowOffsetX: activeStylingConfig?.shadowOffsetX,
      shadowOffsetY: activeStylingConfig?.shadowOffsetY,
      backdropBox: activeStylingConfig?.backdropBox,
      backdropPadding: activeStylingConfig?.backdropPadding,
      backdropRadius: activeStylingConfig?.backdropRadius,
      backdropOpacity: activeStylingConfig?.backdropOpacity,
      backdropBlur: activeStylingConfig?.backdropBlur,
      fontWeight: activeStylingConfig?.fontWeight,
      letterSpacing: activeStylingConfig?.letterSpacing,
      lineHeight: activeStylingConfig?.lineHeight,
      textAlign: activeStylingConfig?.textAlign,
      boldEmphasis: activeStylingConfig?.boldEmphasis,
      italicize: activeStylingConfig?.italicize,
      animation: activeStylingConfig?.animation,
      activePaletteColors: activeStylingConfig?.customColors || GRADIENT_PALETTES.find(p => p.id === activeStylingConfig?.paletteId)?.colors
    });
  }, [shouldStyleAi, hasAiFormatting, activeStylingConfig]);

  const googleCss = useMemo(() => {
    if (!shouldStyleGoogle && !hasGoogleFormatting) return { style: {}, className: '' };
    return computeSubtitleCssStyles({
      textOutline: activeStylingConfig?.textOutline,
      customOutlineColor: activeStylingConfig?.customOutlineColor,
      outlineOpacity: activeStylingConfig?.outlineOpacity,
      textShadow: activeStylingConfig?.textShadow,
      customShadowColor: activeStylingConfig?.customShadowColor,
      shadowBlur: activeStylingConfig?.shadowBlur,
      shadowOffsetX: activeStylingConfig?.shadowOffsetX,
      shadowOffsetY: activeStylingConfig?.shadowOffsetY,
      backdropBox: activeStylingConfig?.backdropBox,
      backdropPadding: activeStylingConfig?.backdropPadding,
      backdropRadius: activeStylingConfig?.backdropRadius,
      backdropOpacity: activeStylingConfig?.backdropOpacity,
      backdropBlur: activeStylingConfig?.backdropBlur,
      fontWeight: activeStylingConfig?.fontWeight,
      letterSpacing: activeStylingConfig?.letterSpacing,
      lineHeight: activeStylingConfig?.lineHeight,
      animation: activeStylingConfig?.animation,
      activePaletteColors: activeStylingConfig?.customColors || GRADIENT_PALETTES.find(p => p.id === activeStylingConfig?.paletteId)?.colors
    });
  }, [shouldStyleGoogle, hasGoogleFormatting, activeStylingConfig]);

  // Rendered Display HTML with tags and gradient colors
  const originalDisplayHtml = useMemo(() => {
    if (hasOriginalFormatting) return item.text;
    if (shouldStyleOriginal && item.text && activeStylingConfig) {
      return renderStylizedSubtitleHtml(
        item.text,
        (item.index || 1) - 1,
        activeStylingConfig.paletteId,
        activeStylingConfig.gradientMode,
        {
          customColors: activeStylingConfig.customColors,
          boldEmphasis: activeStylingConfig.boldEmphasis,
          italicize: activeStylingConfig.italicize,
          transformCase: activeStylingConfig.transformCase
        }
      );
    }
    return null;
  }, [item.text, item.index, hasOriginalFormatting, shouldStyleOriginal, activeStylingConfig]);

  const aiDisplayHtml = useMemo(() => {
    if (hasAiFormatting) return localText;
    if (shouldStyleAi && localText && activeStylingConfig) {
      return renderStylizedSubtitleHtml(
        localText,
        (item.index || 1) - 1,
        activeStylingConfig.paletteId,
        activeStylingConfig.gradientMode,
        {
          customColors: activeStylingConfig.customColors,
          boldEmphasis: activeStylingConfig.boldEmphasis,
          italicize: activeStylingConfig.italicize
        }
      );
    }
    return null;
  }, [localText, item.index, hasAiFormatting, shouldStyleAi, activeStylingConfig]);

  const googleDisplayHtml = useMemo(() => {
    if (!item.googleTranslateText) return null;
    if (hasGoogleFormatting) return item.googleTranslateText;
    if (shouldStyleGoogle && activeStylingConfig) {
      return renderStylizedSubtitleHtml(
        item.googleTranslateText,
        (item.index || 1) - 1,
        activeStylingConfig.paletteId,
        activeStylingConfig.gradientMode,
        {
          customColors: activeStylingConfig.customColors,
          boldEmphasis: activeStylingConfig.boldEmphasis,
          italicize: activeStylingConfig.italicize
        }
      );
    }
    return null;
  }, [item.googleTranslateText, item.index, hasGoogleFormatting, shouldStyleGoogle, activeStylingConfig]);

  const isRomanOrLatin = useMemo(() => {
    if (!localText) return false;
    const clean = localText.replace(/<[^>]+>/g, '');
    const latinCount = (clean.match(/[a-zA-Z]/g) || []).length;
    const urduCount = (clean.match(/[\u0600-\u06FF\u0750-\u077F]/g) || []).length;
    return latinCount > urduCount;
  }, [localText]);

  const isBilingual = useMemo(() => {
    return localText.includes('\n') && /[a-zA-Z]/.test(localText) && /[\u0600-\u06FF]/.test(localText);
  }, [localText]);

  const isGoogleRomanOrLatin = useMemo(() => {
    if (!item.googleTranslateText) return false;
    const latinCount = (item.googleTranslateText.match(/[a-zA-Z]/g) || []).length;
    const urduCount = (item.googleTranslateText.match(/[\u0600-\u06FF\u0750-\u077F]/g) || []).length;
    return latinCount > urduCount;
  }, [item.googleTranslateText]);

  const timingInfo = useMemo(() => {
    return calculateDurationAndCPS(item.translatedText || item.text, item.startTime, item.endTime);
  }, [item.translatedText, item.text, item.startTime, item.endTime]);

  const hasSoundCues = useMemo(() => {
    return /\[[^\]]+\]|\([^\)]+\)/.test(item.text);
  }, [item.text]);

  const handleTranslateRow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onTranslateGoogle) return;
    setIsTranslatingRow(true);
    try {
      await onTranslateGoogle(item.index);
    } finally {
      setIsTranslatingRow(false);
    }
  };

  // Active Typography Styles per column
  const effectiveOriginalFont = isGlobalFontActive ? globalFont : originalFont;
  const effectiveOriginalSize = isGlobalFontActive ? globalFontSize : originalFontSize;

  const effectiveAiFont = isGlobalFontActive ? globalFont : (isRomanOrLatin ? 'inherit' : urduFont);
  const effectiveAiSize = isGlobalFontActive ? globalFontSize : translatedFontSize;

  const effectiveGoogleFont = isGlobalFontActive ? globalFont : (isGoogleRomanOrLatin ? 'inherit' : googleFont);
  const effectiveGoogleSize = isGlobalFontActive ? Math.round(globalFontSize * 0.9) : googleFontSize;

  return (
    <tr 
      onDoubleClick={() => onOpenEditor(item.index)}
      className={cn(
        "group transition-colors border-b border-zinc-200/60 dark:border-zinc-700/40 cursor-default",
        item.index === 1 && "border-l-4 border-l-amber-500 dark:border-l-amber-400 bg-amber-500/[0.03]",
        isSelected 
          ? "bg-emerald-500/10 dark:bg-emerald-500/15" 
          : "hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20"
      )}
      title={item.index === 1 ? "Block #1 (Watermark & Credits). Double-click to edit in studio" : "Double-click to open dedicated Subtitle Editor Studio"}
    >
      {/* Checkbox and Index */}
      <td className="p-3 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 align-top w-14 text-center">
        <div className="flex flex-col items-center gap-1.5">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect?.(item.index)}
            className="accent-emerald-600 rounded cursor-pointer w-3.5 h-3.5"
            title={`Select row #${item.index}`}
          />
          <span className="font-bold">{item.index}</span>

          {/* Watermark badge on first row / block */}
          {item.index === 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenWatermark?.();
              }}
              className="mt-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 dark:bg-amber-500/25 dark:hover:bg-amber-500/35 text-amber-700 dark:text-amber-300 border border-amber-500/35 font-extrabold text-[8px] uppercase tracking-wider flex items-center gap-1 shadow-2xs transition-all cursor-pointer select-none"
              title="Block #1 Watermark / Credits. Click to customize watermark"
            >
              <Stamp size={8.5} className="text-amber-600 dark:text-amber-400" />
              <span>Watermark</span>
            </button>
          )}

          {item.styleColor && (
            <span 
              className="w-2.5 h-2.5 rounded-full shadow-xs ring-1 ring-black/10 dark:ring-white/10" 
              style={{ backgroundColor: item.styleColor }} 
              title={`Gradient Color: ${item.styleColor}`}
            />
          )}
        </div>
      </td>

      {/* Timing Column */}
      {visibleColumns.time && (
        <td className="p-3 text-[9px] font-mono text-zinc-500 dark:text-zinc-400 leading-tight align-top w-36 shrink-0">
          <div className="font-medium text-zinc-700 dark:text-zinc-300">{item.startTime}</div>
          <div className="text-zinc-300 dark:text-zinc-600">↓</div>
          <div className="font-medium text-zinc-700 dark:text-zinc-300">{item.endTime}</div>
          
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              {timingInfo.durationSec}s
            </span>
            <span className={cn(
              "text-[8px] font-bold px-1.5 py-0.5 rounded font-mono",
              timingInfo.cps > 25 
                ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800"
                : timingInfo.cps > 18
                ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
            )} title={timingInfo.cps > 25 ? "Warning: High CPS (>25) may be too fast for viewers" : "Characters per second"}>
              {timingInfo.cps} cps
            </span>
          </div>
        </td>
      )}

      {/* Original Language Column */}
      {visibleColumns.original && (
        <td 
          className="p-3 leading-relaxed font-medium text-zinc-800 dark:text-zinc-200 transition-all duration-150 align-top max-w-xs md:max-w-md" 
          style={{ 
            fontSize: `${effectiveOriginalSize}px`,
            fontFamily: effectiveOriginalFont
          }}
        >
          <SubtitleRowEditableCell
            value={item.text || ''}
            isReadOnly={isReadOnly}
            onCommit={(newText) => onEditOriginal?.(item.index, newText)}
            fontFamily={effectiveOriginalFont}
            fontSize={effectiveOriginalSize}
            className={originalCss.className}
            style={originalCss.style}
            displayHtml={originalDisplayHtml}
            placeholder="Edit source dialogue..."
            emptyLabel="No source text"
          />
          <div className="mt-1 flex items-center gap-2 text-[9px] text-zinc-400 dark:text-zinc-500 font-sans">
            <span>{(item.text || '').length} chars</span>
            {hasSoundCues && (
              <span className="text-[8px] px-1 py-0.2 rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-mono font-bold">
                Audio Cue
              </span>
            )}
            {(hasOriginalFormatting || shouldStyleOriginal) && (
              <span className="text-[8px] px-1 py-0.2 rounded bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold font-mono">
                Stylized
              </span>
            )}
          </div>
        </td>
      )}

      {/* AI Translated Language Column (Direct In-Place Editable when unlocked, halted background re-rendering) */}
      {visibleColumns.ai && (
        <td className="p-3 align-top min-w-[240px]">
          <div className="py-0.5 group/cell relative">
            <SubtitleRowEditableCell
              value={item.translatedText || ''}
              isReadOnly={isReadOnly}
              onCommit={(newText) => onEditTranslated?.(item.index, newText)}
              fontFamily={effectiveAiFont}
              fontSize={effectiveAiSize}
              dir={isRomanOrLatin ? "ltr" : isBilingual ? "auto" : "rtl"}
              className={cn(
                isRomanOrLatin ? "text-left font-sans" : "text-right font-urdu",
                aiCss.className
              )}
              style={aiCss.style}
              displayHtml={aiDisplayHtml}
              placeholder="اردو ترجمہ / Roman Urdu..."
              emptyLabel="No translation yet"
            />

            <div className="flex items-center justify-between gap-2 mt-1.5 text-[8.5px] font-mono text-zinc-400 dark:text-zinc-500">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span>{localText.replace(/<[^>]+>/g, '').length} chars</span>
                {isRomanOrLatin && <span className="text-blue-600 dark:text-blue-400 font-bold">Roman Urdu</span>}
                {(isStylized || shouldStyleAi) && <span className="text-emerald-600 dark:text-emerald-400 font-bold">Stylized</span>}
              </div>

              {localText && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="opacity-0 group-hover/cell:opacity-100 transition-opacity flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 text-[8px] font-bold cursor-pointer"
                  title="Copy translation"
                >
                  {copied ? <Check size={9} className="text-emerald-500" /> : <Copy size={9} />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              )}
            </div>
          </div>
        </td>
      )}

      {/* Google Translation Column */}
      {visibleColumns.google && (
        <td className="p-3 align-top min-w-[180px] max-w-xs">
          <div className="space-y-1.5">
            {item.googleTranslateText && item.googleTranslateText !== 'Translation Error' ? (
              <div className="p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/50">
                <div 
                  className={cn(
                    "text-zinc-700 dark:text-zinc-300 italic leading-[2.2] transition-all duration-150 p-1 select-text break-words whitespace-pre-line",
                    isGoogleRomanOrLatin ? "text-left font-sans" : "text-right font-urdu",
                    googleCss.className
                  )} 
                  dir={isGoogleRomanOrLatin ? "ltr" : "rtl"} 
                  style={{ 
                    fontSize: `${effectiveGoogleSize}px`,
                    fontFamily: effectiveGoogleFont,
                    ...googleCss.style
                  }}
                  dangerouslySetInnerHTML={googleDisplayHtml ? { __html: googleDisplayHtml } : undefined}
                >
                  {!googleDisplayHtml ? item.googleTranslateText : undefined}
                </div>
                {(hasGoogleFormatting || shouldStyleGoogle) && (
                  <div className="mt-1 flex items-center gap-1 text-[8px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                    <span>Stylized Machine</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-2 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700/60 bg-zinc-50/40 dark:bg-zinc-800/20 gap-1 text-center">
                <span className="text-zinc-400 dark:text-zinc-500 text-[9.5px]">No comparison</span>
                {onTranslateGoogle && (
                  <button
                    type="button"
                    onClick={handleTranslateRow}
                    disabled={isTranslatingRow}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 text-[9px] font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isTranslatingRow ? <Loader2 size={10} className="animate-spin text-blue-500" /> : <Languages size={10} className="text-blue-500" />}
                    <span>Translate Line</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </td>
      )}

      {/* Dedicated Action Trigger: Opens expanded modal studio focused on this row */}
      <td className="p-3 align-top w-20 text-center">
        <button
          type="button"
          onClick={() => onOpenEditor(item.index)}
          className="flex items-center justify-center gap-1 w-full px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-emerald-100 active:bg-emerald-200 dark:bg-zinc-800 dark:hover:bg-emerald-950/80 text-zinc-700 hover:text-emerald-800 dark:text-zinc-300 dark:hover:text-emerald-300 font-bold text-[10px] uppercase tracking-wider transition-all border border-zinc-200 dark:border-zinc-700 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-2xs group-hover:border-emerald-400/50 cursor-pointer"
          title={`Open focused Subtitle Editor Studio for line #${item.index}`}
        >
          <Edit3 size={11} className="text-emerald-600 dark:text-emerald-400" />
          <span>Edit</span>
        </button>
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  // Ultra-strict Selective Component Updating:
  // If row item, selection, styles, fonts, and column visibility are identical, SKIP rerender!
  if (prevProps.isReadOnly !== nextProps.isReadOnly) return false;
  if (prevProps.isSelected !== nextProps.isSelected) return false;
  if (prevProps.isStylingPreviewActive !== nextProps.isStylingPreviewActive) return false;
  if (prevProps.activeStylingConfig !== nextProps.activeStylingConfig) return false;
  if (prevProps.isGlobalFontActive !== nextProps.isGlobalFontActive) return false;
  if (prevProps.globalFont !== nextProps.globalFont || prevProps.globalFontSize !== nextProps.globalFontSize) return false;
  if (prevProps.originalFont !== nextProps.originalFont || prevProps.originalFontSize !== nextProps.originalFontSize) return false;
  if (prevProps.urduFont !== nextProps.urduFont || prevProps.translatedFontSize !== nextProps.translatedFontSize) return false;
  if (prevProps.googleFont !== nextProps.googleFont || prevProps.googleFontSize !== nextProps.googleFontSize) return false;

  if (prevProps.visibleColumns !== nextProps.visibleColumns) {
    if (
      prevProps.visibleColumns?.time !== nextProps.visibleColumns?.time ||
      prevProps.visibleColumns?.original !== nextProps.visibleColumns?.original ||
      prevProps.visibleColumns?.ai !== nextProps.visibleColumns?.ai ||
      prevProps.visibleColumns?.google !== nextProps.visibleColumns?.google
    ) {
      return false;
    }
  }

  const p = prevProps.item;
  const n = nextProps.item;
  if (p === n) return true;
  return (
    p.index === n.index &&
    p.text === n.text &&
    p.translatedText === n.translatedText &&
    p.googleTranslateText === n.googleTranslateText &&
    p.startTime === n.startTime &&
    p.endTime === n.endTime &&
    p.styleColor === n.styleColor
  );
});

SubtitleRow.displayName = 'SubtitleRow';

// Resizable Container Component with robust non-scrolling touch handler and prominent standalone touch target
const ResizableBox = ({ 
  children, 
  initialHeight = 400, 
  minHeight = 200, 
  maxHeight = 1200,
  title,
  icon: Icon,
  actions,
  isFullScreen = false,
  onFullScreenToggle
}: { 
  children: React.ReactNode; 
  initialHeight?: number; 
  minHeight?: number; 
  maxHeight?: number;
  title: string;
  icon: any;
  actions?: React.ReactNode;
  isFullScreen?: boolean;
  onFullScreenToggle?: () => void;
}) => {
  const [height, setHeight] = useState(initialHeight);
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isResizing = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(initialHeight);

  const isProjectControls = title.toLowerCase().includes('project control');

  const toggleCollapse = useCallback(() => {
    if (isProjectControls) return;
    setIsCollapsed(prev => !prev);
  }, [isProjectControls]);

  const startResizing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // If touch event, prevent mobile browser from taking over as a page scroll
    if ('touches' in e) {
      if (e.cancelable) {
        e.preventDefault();
      }
      e.stopPropagation();
      startYRef.current = e.touches[0].clientY;
    } else {
      startYRef.current = e.clientY;
    }

    const container = document.getElementById(`resizable-${title}`);
    if (container) {
      startHeightRef.current = container.getBoundingClientRect().height;
    } else {
      startHeightRef.current = height;
    }

    isResizing.current = true;
    setIsDragging(true);

    // Prevent background page scrolling while resizing cards on touch devices
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.touchAction = 'none';
  }, [height, title]);

  const stopResizing = useCallback(() => {
    if (!isResizing.current) return;
    isResizing.current = false;
    setIsDragging(false);

    // Restore background scrolling
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
    document.documentElement.style.overflow = '';
    document.documentElement.style.touchAction = '';
  }, []);

  const resize = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isResizing.current) return;

    // Prevent background page scrolling & touch conflicts while resizing
    if (e.cancelable) {
      e.preventDefault();
      e.stopPropagation();
    }

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - startYRef.current;
    const newHeight = Math.min(maxHeight, Math.max(minHeight, startHeightRef.current + deltaY));
    setHeight(newHeight);
  }, [minHeight, maxHeight]);

  useEffect(() => {
    // Note: { passive: false } is mandatory to permit e.preventDefault() on mobile touchmove
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    window.addEventListener('touchmove', resize, { passive: false });
    window.addEventListener('touchend', stopResizing);
    window.addEventListener('touchcancel', stopResizing);

    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      window.removeEventListener('touchmove', resize);
      window.removeEventListener('touchend', stopResizing);
      window.removeEventListener('touchcancel', stopResizing);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.touchAction = '';
    };
  }, [resize, stopResizing]);

  const handleResetHeight = useCallback(() => {
    setHeight(initialHeight);
  }, [initialHeight]);

  return (
    <div 
      id={`resizable-${title}`}
      className={cn(
        "bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 shadow-xs flex flex-col relative",
        !isDragging && "transition-[height,border-color,box-shadow] duration-200",
        isFullScreen ? "fixed inset-0 z-[100] h-screen w-screen rounded-none" : ""
      )}
      style={{ height: isFullScreen ? '100vh' : isCollapsed ? 'auto' : `${height}px` }}
    >
      {/* Workspace / Box Header */}
      <div 
        className="p-3 md:p-3.5 border-b border-zinc-200 dark:border-zinc-700/60 bg-zinc-50 dark:bg-zinc-800/90 relative z-30 shrink-0"
      >
        <div className="flex flex-col gap-2.5 w-full">
          <div className="flex items-center justify-between gap-2 shrink-0 w-full">
            <div 
              onClick={toggleCollapse}
              className={cn(
                "flex items-center gap-2 select-none",
                !isProjectControls && "cursor-pointer group/title hover:opacity-85 transition-opacity"
              )}
              title={!isProjectControls ? (isCollapsed ? "Click box name to expand" : "Click box name to collapse") : undefined}
            >
              <Icon size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 whitespace-nowrap group-hover/title:text-emerald-600 dark:group-hover/title:text-emerald-400 transition-colors">
                {title}
              </span>
              {!isProjectControls && (
                <ChevronDown 
                  size={13} 
                  className={cn(
                    "text-zinc-400 group-hover/title:text-emerald-500 transition-transform duration-200",
                    isCollapsed && "-rotate-90"
                  )} 
                />
              )}
            </div>
            {onFullScreenToggle && (
              <button 
                onClick={onFullScreenToggle}
                className="p-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-all text-zinc-600 dark:text-zinc-300 cursor-pointer"
                title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
              >
                {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-wrap relative z-40 w-full">
            {actions}
          </div>
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-auto relative z-10">
          {children}
        </div>
      )}
      
      {!isFullScreen && !isCollapsed && (
        <div 
          className="border-t border-zinc-200/90 dark:border-zinc-700/80 bg-zinc-50/95 dark:bg-zinc-800/95 py-1 px-3 flex items-center justify-center shrink-0 select-none"
          style={{ touchAction: 'none' }}
        >
          {/* Reduced to 1/3 size: compact, elegant drag-to-resize handle */}
          <div 
            role="separator"
            aria-orientation="horizontal"
            tabIndex={0}
            onMouseDown={startResizing}
            onTouchStart={startResizing}
            onDoubleClick={handleResetHeight}
            className={cn(
              "group h-4 min-h-[16px] w-24 sm:w-28 rounded-full flex items-center justify-center gap-1.5 cursor-row-resize touch-none select-none transition-all px-2 py-0",
              isDragging 
                ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500/40 border border-emerald-500 scale-[1.01]" 
                : "bg-white dark:bg-zinc-700/90 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-zinc-500 dark:text-zinc-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-zinc-300/80 dark:border-zinc-600 shadow-2xs hover:shadow-xs hover:border-emerald-400"
            )}
            title="Drag to resize box height (Double-click to reset)"
          >
            <GripHorizontal size={11} className={cn("transition-transform shrink-0", isDragging ? "text-white scale-110" : "text-zinc-400 dark:text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400")} />
            <span className={cn(
              "text-[7.5px] font-bold uppercase tracking-wider select-none pointer-events-none truncate",
              isDragging ? "text-white" : "text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300"
            )}>
              {isDragging ? `${Math.round(height)}px` : "Resize"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);
  const [context, setContext] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isGeneratingContext, setIsGeneratingContext] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isGoogleTranslatingAll, setIsGoogleTranslatingAll] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<{ id: string, message: string, type: 'success' | 'error' }[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [detectedFormat, setDetectedFormat] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isGeminiConnected, setIsGeminiConnected] = useState(false);
  const [geminiConnectStatus, setGeminiConnectStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle');
  const [googleConnectStatus, setGoogleConnectStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle');
  const [analyzeStatus, setAnalyzeStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [googleApiKey, setGoogleApiKey] = useState<string>('');
  
  // Performance Settings - balanced concurrency to prevent 429 rate limits & browser hangs
  const [geminiBatchSize, setGeminiBatchSize] = useState<number>(10);
  const [googleBatchSize, setGoogleBatchSize] = useState<number>(20);
  const [geminiWorkers, setGeminiWorkers] = useState<number>(2); // 2 workers optimal for Gemini 15 RPM
  const [googleWorkers, setGoogleWorkers] = useState<number>(5);
  const [geminiDelay, setGeminiDelay] = useState<number>(1200);

  const [translationSpeed, setTranslationSpeed] = useState<number>(0); // items per second

  const [sessionId, setSessionId] = useState<string>('');
  
  // Display & Typography Settings
  const [translatedFontSize, setTranslatedFontSize] = useState<number>(22);
  const [originalFontSize, setOriginalFontSize] = useState<number>(14);
  const [googleFontSize, setGoogleFontSize] = useState<number>(14);
  const [urduFont, setUrduFont] = useState<string>(URDU_FONT_OPTIONS[0].value);
  const [originalFont, setOriginalFont] = useState<string>(ENGLISH_FONT_OPTIONS[0].value);
  const [googleFont, setGoogleFont] = useState<string>(URDU_FONT_OPTIONS[0].value);
  const [isGlobalFontActive, setIsGlobalFontActive] = useState<boolean>(false);
  const [globalFont, setGlobalFont] = useState<string>(URDU_FONT_OPTIONS[0].value);
  const [globalFontSize, setGlobalFontSize] = useState<number>(20);
  const [fontTarget, setFontTarget] = useState<'global' | 'original' | 'ai' | 'google'>('global');
  const [fontsActiveTab, setFontsActiveTab] = useState<'english' | 'urdu' | 'local'>('urdu');
  const [localFonts, setLocalFonts] = useState<CustomFontItem[]>(() => getLocalFontsFromStorage());
  const [customFontInputName, setCustomFontInputName] = useState<string>('');
  const [isUploadingFont, setIsUploadingFont] = useState<boolean>(false);

  const [isTextResizeOpen, setIsTextResizeOpen] = useState(false);
  const [isFontsOpen, setIsFontsOpen] = useState(false);
  const [textResizeAlign, setTextResizeAlign] = useState<'left' | 'right'>('left');
  const [fontsAlign, setFontsAlign] = useState<'left' | 'right'>('left');
  const [textResizePopoverStyle, setTextResizePopoverStyle] = useState<React.CSSProperties | null>(null);
  const [fontsPopoverStyle, setFontsPopoverStyle] = useState<React.CSSProperties | null>(null);
  const [previewDisplayMode, setPreviewDisplayMode] = useState<'rendered' | 'plain'>('rendered');

  // Draft memory states: settings remain in draft until explicitly applied
  const [draftOriginalFontSize, setDraftOriginalFontSize] = useState<number>(14);
  const [draftTranslatedFontSize, setDraftTranslatedFontSize] = useState<number>(22);
  const [draftGoogleFontSize, setDraftGoogleFontSize] = useState<number>(14);
  const [draftGlobalFontSize, setDraftGlobalFontSize] = useState<number>(20);

  const [draftOriginalFont, setDraftOriginalFont] = useState<string>(ENGLISH_FONT_OPTIONS[0].value);
  const [draftUrduFont, setDraftUrduFont] = useState<string>(URDU_FONT_OPTIONS[0].value);
  const [draftGoogleFont, setDraftGoogleFont] = useState<string>(URDU_FONT_OPTIONS[0].value);
  const [draftGlobalFont, setDraftGlobalFont] = useState<string>(URDU_FONT_OPTIONS[0].value);
  const [draftIsGlobalFontActive, setDraftIsGlobalFontActive] = useState<boolean>(false);
  const [draftFontTarget, setDraftFontTarget] = useState<'global' | 'original' | 'ai' | 'google'>('global');

  const [isStylizerOpen, setIsStylizerOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [translationSettings, setTranslationSettings] = useState<TranslationSettings>(DEFAULT_TRANSLATION_SETTINGS);
  const [isTranslationSettingsModalOpen, setIsTranslationSettingsModalOpen] = useState(false);
  
  // Active Styling Studio Configuration & Live Workspace Preview Toggle
  const [activeStylingConfig, setActiveStylingConfig] = useState<ActiveStylingConfig>(DEFAULT_STYLING_CONFIG);
  const [isWorkspaceStylingPreview, setIsWorkspaceStylingPreview] = useState<boolean>(true);

  // Stable references for high-speed memoized rendering
  const subtitlesRef = useRef(subtitles);
  subtitlesRef.current = subtitles;
  const translationSettingsRef = useRef(translationSettings);
  translationSettingsRef.current = translationSettings;

  // Studio Drawers & Dedicated Modals
  const [isAiCinemaOpen, setIsAiCinemaOpen] = useState(false);
  const [isStylingDrawerOpen, setIsStylingDrawerOpen] = useState(false);
  const [isPreviewSpaceOpen, setIsPreviewSpaceOpen] = useState(false);
  const [isGoogleSettingsOpen, setIsGoogleSettingsOpen] = useState(false);
  const [isAiConfigOpen, setIsAiConfigOpen] = useState(false);
  const [isUnifiedDownloadOpen, setIsUnifiedDownloadOpen] = useState(false);
  const textResizeRef = useRef<HTMLDivElement>(null);
  const fontsRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const workspaceToolsRef = useRef<HTMLDivElement>(null);
  const [isWorkspaceToolsOpen, setIsWorkspaceToolsOpen] = useState(false);
  const [isWatermarkModalOpen, setIsWatermarkModalOpen] = useState(false);

  // Subtitle Editing Modes & Controls: Main page dashboard is read-only
  const [isReadOnly, setIsReadOnly] = useState<boolean>(true);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isConfirmingBatchDeleteWorkspace, setIsConfirmingBatchDeleteWorkspace] = useState(false);

  useEffect(() => {
    if (isConfirmingBatchDeleteWorkspace) {
      const timer = setTimeout(() => setIsConfirmingBatchDeleteWorkspace(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmingBatchDeleteWorkspace]);

  // Dedicated Expanded Subtitle Editor Studio Modal
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editorFocusIndex, setEditorFocusIndex] = useState<number | undefined>(undefined);
  // Column display selection for Dedicated Editor Studio (default: all checked)
  const [studioColumnsToDisplay, setStudioColumnsToDisplay] = useState({
    original: true,
    ai: true,
    google: true,
    time: true
  });

  const handleOpenEditor = useCallback((index?: number) => {
    setEditorFocusIndex(index);
    setIsEditorModalOpen(true);
  }, []);

  // Undo / Redo History Stack (up to 50 snapshots)
  const [history, setHistory] = useState<SubtitleItem[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isHistoryNavigating = useRef(false);

  // Column Visibility Toggles
  const [visibleColumns, setVisibleColumns] = useState({
    time: true,
    original: true,
    ai: true,
    google: true
  });
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);

  // Advanced Subtitle Editing Modals
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [isTimeShiftOpen, setIsTimeShiftOpen] = useState(false);
  const [isGapTimingOpen, setIsGapTimingOpen] = useState(false);
  const [isTextCleanupOpen, setIsTextCleanupOpen] = useState(false);
  const [originalTimingMap, setOriginalTimingMap] = useState<OriginalTimingMap>({});

  // Adaptive Worker Scaling & Rate Limits
  const [adaptiveScalingEnabled, setAdaptiveScalingEnabled] = useState(true);
  const [activeAdaptiveInfo, setActiveAdaptiveInfo] = useState<{
    workers: number;
    delay: number;
    throttled: boolean;
    reason?: string;
  }>({ workers: 2, delay: 1200, throttled: false });

  // Pagination for high-speed rendering (prevents DOM layout recalculation lag)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50); // 25, 50, 100, 0 for all
  const [searchInput, setSearchInput] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      const stored = localStorage.getItem('applet_theme');
      if (stored && ['classic', 'cinematic', 'cyber', 'neon', 'sapphire', 'amber'].includes(stored)) {
        return stored as AppTheme;
      }
    } catch {}
    return 'cinematic';
  });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  const addNotification = useCallback((message: string, type: 'success' | 'error') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 2000);
  }, []);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }, ...prev].slice(0, 50));

    if (type === 'success' || type === 'error') {
      addNotification(message, type);
    }
  }, [addNotification]);

  const applyFontSelection = useCallback((name: string, value: string) => {
    if (fontTarget === 'global') {
      setIsGlobalFontActive(true);
      setGlobalFont(value);
      setOriginalFont(value);
      setUrduFont(value);
      setGoogleFont(value);
      addLog(`Applied global font "${name}" to all subtitle streams.`, 'success');
      addNotification(`Global font applied: ${name}`, 'success');
    } else if (fontTarget === 'original') {
      setIsGlobalFontActive(false);
      setOriginalFont(value);
      addLog(`Applied font "${name}" to Original subtitles.`, 'info');
      addNotification(`Original stream font: ${name}`, 'success');
    } else if (fontTarget === 'ai') {
      setIsGlobalFontActive(false);
      setUrduFont(value);
      addLog(`Applied font "${name}" to AI Translation subtitles.`, 'info');
      addNotification(`AI Translation font: ${name}`, 'success');
    } else if (fontTarget === 'google') {
      setIsGlobalFontActive(false);
      setGoogleFont(value);
      addLog(`Applied font "${name}" to Google Translation subtitles.`, 'info');
      addNotification(`Google stream font: ${name}`, 'success');
    }
  }, [fontTarget, addLog, addNotification]);

  const applyFontSelectionDraft = useCallback((name: string, value: string) => {
    if (draftFontTarget === 'global') {
      setDraftIsGlobalFontActive(true);
      setDraftGlobalFont(value);
      setDraftOriginalFont(value);
      setDraftUrduFont(value);
      setDraftGoogleFont(value);
    } else if (draftFontTarget === 'original') {
      setDraftIsGlobalFontActive(false);
      setDraftOriginalFont(value);
    } else if (draftFontTarget === 'ai') {
      setDraftIsGlobalFontActive(false);
      setDraftUrduFont(value);
    } else if (draftFontTarget === 'google') {
      setDraftIsGlobalFontActive(false);
      setDraftGoogleFont(value);
    }
  }, [draftFontTarget]);

  const calculatePopoverPlacement = useCallback((triggerEl: HTMLElement | null, preferredWidth: number): React.CSSProperties => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const width = Math.min(preferredWidth, Math.max(300, viewportWidth - 24));

    if (!triggerEl) {
      return {
        position: 'fixed',
        top: '100px',
        left: `${Math.max(12, Math.round((viewportWidth - width) / 2))}px`,
        width: `${Math.round(width)}px`,
        maxHeight: `${Math.round(Math.min(viewportHeight - 120, viewportHeight * 0.85))}px`,
      };
    }

    const rect = triggerEl.getBoundingClientRect();
    const buttonCenterX = rect.left + rect.width / 2;
    let left = buttonCenterX - width / 2;

    // Strict boundary clamping with 12px margin from viewport edges
    if (left + width > viewportWidth - 12) {
      left = viewportWidth - width - 12;
    }
    if (left < 12) {
      left = 12;
    }

    // Default: position below the button
    let top = rect.bottom + 8;
    let maxHeight = Math.min(viewportHeight - top - 16, viewportHeight * 0.85);

    // If bottom space is cramped (<300px) and there is ample space above the trigger button:
    if (maxHeight < 300 && rect.top > 320) {
      const topAbove = Math.max(12, rect.top - Math.min(580, rect.top - 20) - 8);
      top = topAbove;
      maxHeight = rect.top - topAbove - 8;
    }

    return {
      position: 'fixed',
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
      width: `${Math.round(width)}px`,
      maxHeight: `${Math.max(260, Math.round(maxHeight))}px`,
    };
  }, []);

  const handleToggleTextResize = useCallback(() => {
    if (!isTextResizeOpen) {
      if (textResizeRef.current) {
        const rect = textResizeRef.current.getBoundingClientRect();
        const shouldAlignRight = (rect.left + 500 > window.innerWidth - 20) || (rect.left > window.innerWidth / 2);
        setTextResizeAlign(shouldAlignRight ? 'right' : 'left');
        setTextResizePopoverStyle(calculatePopoverPlacement(textResizeRef.current, 520));
      }
      setDraftOriginalFontSize(originalFontSize);
      setDraftTranslatedFontSize(translatedFontSize);
      setDraftGoogleFontSize(googleFontSize);
      setDraftGlobalFontSize(globalFontSize);
      setIsTextResizeOpen(true);
      setIsFontsOpen(false);
      setIsColumnMenuOpen(false);
    } else {
      setIsTextResizeOpen(false);
    }
  }, [isTextResizeOpen, originalFontSize, translatedFontSize, googleFontSize, globalFontSize, calculatePopoverPlacement]);

  const handleApplyTextResize = useCallback(() => {
    setOriginalFontSize(draftOriginalFontSize);
    setTranslatedFontSize(draftTranslatedFontSize);
    setGoogleFontSize(draftGoogleFontSize);
    setGlobalFontSize(draftGlobalFontSize);
    setIsTextResizeOpen(false);
    addLog(`Applied text sizing: Source (${draftOriginalFontSize}px), AI (${draftTranslatedFontSize}px), Google (${draftGoogleFontSize}px).`, 'success');
    addNotification('Workspace text sizes applied', 'success');
  }, [draftOriginalFontSize, draftTranslatedFontSize, draftGoogleFontSize, draftGlobalFontSize, addLog, addNotification]);

  const handleCancelTextResize = useCallback(() => {
    setDraftOriginalFontSize(originalFontSize);
    setDraftTranslatedFontSize(translatedFontSize);
    setDraftGoogleFontSize(googleFontSize);
    setDraftGlobalFontSize(globalFontSize);
    setIsTextResizeOpen(false);
  }, [originalFontSize, translatedFontSize, googleFontSize, globalFontSize]);

  const handleToggleFonts = useCallback(() => {
    if (!isFontsOpen) {
      if (fontsRef.current) {
        const rect = fontsRef.current.getBoundingClientRect();
        const shouldAlignRight = (rect.left + 540 > window.innerWidth - 20) || (rect.left > window.innerWidth / 2);
        setFontsAlign(shouldAlignRight ? 'right' : 'left');
        setFontsPopoverStyle(calculatePopoverPlacement(fontsRef.current, 620));
      }
      setDraftOriginalFont(originalFont);
      setDraftUrduFont(urduFont);
      setDraftGoogleFont(googleFont);
      setDraftGlobalFont(globalFont);
      setDraftIsGlobalFontActive(isGlobalFontActive);
      setDraftFontTarget(fontTarget);
      setIsFontsOpen(true);
      setIsTextResizeOpen(false);
      setIsColumnMenuOpen(false);
    } else {
      setIsFontsOpen(false);
    }
  }, [isFontsOpen, originalFont, urduFont, googleFont, globalFont, isGlobalFontActive, fontTarget, calculatePopoverPlacement]);

  const handleApplyFonts = useCallback(() => {
    setIsGlobalFontActive(draftIsGlobalFontActive);
    setGlobalFont(draftGlobalFont);
    setOriginalFont(draftOriginalFont);
    setUrduFont(draftUrduFont);
    setGoogleFont(draftGoogleFont);
    setFontTarget(draftFontTarget);
    setIsFontsOpen(false);
    addLog('Applied typography changes across subtitle streams.', 'success');
    addNotification('Workspace fonts applied', 'success');
  }, [draftIsGlobalFontActive, draftGlobalFont, draftOriginalFont, draftUrduFont, draftGoogleFont, draftFontTarget, addLog, addNotification]);

  const handleCancelFonts = useCallback(() => {
    setDraftOriginalFont(originalFont);
    setDraftUrduFont(urduFont);
    setDraftGoogleFont(googleFont);
    setDraftGlobalFont(globalFont);
    setDraftIsGlobalFontActive(isGlobalFontActive);
    setDraftFontTarget(fontTarget);
    setIsFontsOpen(false);
  }, [originalFont, urduFont, googleFont, globalFont, isGlobalFontActive, fontTarget]);

  const handleUploadFontFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingFont(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const fontName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_\-\s]/g, ' ').trim() || 'CustomUploadedFont';
      const fontValue = await registerUploadedFont(fontName, arrayBuffer);
      const newFont: CustomFontItem = {
        id: `uploaded-${Date.now()}`,
        name: `${fontName} (Uploaded)`,
        value: fontValue,
        isUploaded: true
      };
      const updated = [newFont, ...localFonts];
      setLocalFonts(updated);
      saveLocalFontsToStorage(updated);
      if (isFontsOpen) {
        applyFontSelectionDraft(newFont.name, newFont.value);
      } else {
        applyFontSelection(newFont.name, newFont.value);
      }
      addLog(`Uploaded and loaded custom font: "${newFont.name}".`, 'success');
      addNotification(`Font loaded: ${newFont.name}`, 'success');
    } catch (err: any) {
      addLog(`Failed to load custom font file: ${err?.message || err}`, 'error');
      addNotification('Failed to load font file', 'error');
    } finally {
      setIsUploadingFont(false);
      if (e.target) e.target.value = '';
    }
  }, [localFonts, isFontsOpen, applyFontSelectionDraft, applyFontSelection, addLog, addNotification]);

  const handleAddNamedFont = useCallback(() => {
    if (!customFontInputName.trim()) {
      addNotification('Please enter a font family name', 'error');
      return;
    }
    const cleanName = customFontInputName.trim();
    const fontValue = `'${cleanName}', -apple-system, BlinkMacSystemFont, sans-serif`;
    const newFont: CustomFontItem = {
      id: `named-${Date.now()}`,
      name: cleanName,
      value: fontValue
    };
    const updated = [newFont, ...localFonts];
    setLocalFonts(updated);
    saveLocalFontsToStorage(updated);
    if (isFontsOpen) {
      applyFontSelectionDraft(cleanName, fontValue);
    } else {
      applyFontSelection(cleanName, fontValue);
    }
    setCustomFontInputName('');
    addLog(`Added custom/system font: "${cleanName}".`, 'success');
    addNotification(`Added font: ${cleanName}`, 'success');
  }, [customFontInputName, localFonts, isFontsOpen, applyFontSelectionDraft, applyFontSelection, addLog, addNotification]);

  const handleDeleteLocalFont = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = localFonts.filter(f => f.id !== id);
    setLocalFonts(updated);
    saveLocalFontsToStorage(updated);
    addNotification('Custom font removed', 'success');
  }, [localFonts, addNotification]);

  const loadSampleSubtitles = useCallback(() => {
    setSubtitles(DEMO_SAMPLE_SUBTITLES);
    setHistory([DEMO_SAMPLE_SUBTITLES]);
    setHistoryIndex(0);
    setOriginalTimingMap(createOriginalTimingMap(DEMO_SAMPLE_SUBTITLES));
    setFileName('cinematic_demo_subtitles.srt');
    setDetectedFormat('Demo Subtitles (.srt)');
    // Ensure all 3 text columns are visible
    setVisibleColumns(prev => ({ ...prev, original: true, ai: true, google: true }));
    addLog('Loaded 4 cinematic demo subtitle segments with Original, AI Urdu, and Google translation streams.', 'success');
    addNotification('Loaded demo subtitle project', 'success');
  }, [addLog, addNotification]);

  const geminiRef = useRef<GeminiService | null>(null);
  const stopGeminiRef = useRef(false);
  const stopGoogleRef = useRef(false);
  const geminiAbortControllerRef = useRef<AbortController | null>(null);
  const googleAbortControllerRef = useRef<AbortController | null>(null);

  // Persistence: Load
  useEffect(() => {
    const loadData = async () => {
      try {
        const saved = await dbService.loadState();
        if (saved) {
          if (saved.subtitles) {
            setSubtitles(saved.subtitles);
            setHistory([saved.subtitles]);
            setHistoryIndex(0);
            setOriginalTimingMap(createOriginalTimingMap(saved.subtitles));
          }
          if (saved.context) setContext(saved.context);
          if (saved.customPrompt) setCustomPrompt(saved.customPrompt);
          if (saved.logs) setLogs(saved.logs);
          if (saved.fileName) setFileName(saved.fileName);
          if (saved.selectedModel) setSelectedModel(saved.selectedModel);
          if (saved.customApiKey) setCustomApiKey(saved.customApiKey);
          if (saved.googleApiKey) setGoogleApiKey(saved.googleApiKey);
          if (saved.geminiBatchSize) setGeminiBatchSize(saved.geminiBatchSize);
          if (saved.googleBatchSize) setGoogleBatchSize(saved.googleBatchSize);
          if (saved.geminiWorkers) setGeminiWorkers(saved.geminiWorkers);
          if (saved.googleWorkers) setGoogleWorkers(saved.googleWorkers);
          if (saved.geminiDelay) setGeminiDelay(saved.geminiDelay);
          if (saved.translatedFontSize) setTranslatedFontSize(saved.translatedFontSize);
          if (saved.originalFontSize) setOriginalFontSize(saved.originalFontSize);
          if (saved.urduFont) setUrduFont(saved.urduFont);
          if (saved.originalFont) setOriginalFont(saved.originalFont);
          if ((saved as any).googleFontSize) setGoogleFontSize((saved as any).googleFontSize);
          if ((saved as any).googleFont) setGoogleFont((saved as any).googleFont);
          if ((saved as any).isGlobalFontActive !== undefined) setIsGlobalFontActive((saved as any).isGlobalFontActive);
          if ((saved as any).globalFont) setGlobalFont((saved as any).globalFont);
          if ((saved as any).globalFontSize) setGlobalFontSize((saved as any).globalFontSize);
          if ((saved as any).theme) {
            const savedTh = (saved as any).theme;
            if (savedTh === 'light') setTheme('classic');
            else if (savedTh === 'dark') setTheme('cinematic');
            else setTheme(savedTh as AppTheme);
          }
          if ((saved as any).activeStylingConfig) {
            setActiveStylingConfig(prev => ({ ...prev, ...(saved as any).activeStylingConfig }));
          }
          if ((saved as any).isWorkspaceStylingPreview !== undefined) {
            setIsWorkspaceStylingPreview(Boolean((saved as any).isWorkspaceStylingPreview));
          }
          if ((saved as any).isReadOnly !== undefined) {
            setIsReadOnly(Boolean((saved as any).isReadOnly));
          }
          if ((saved as any).studioColumnsToDisplay) {
            setStudioColumnsToDisplay(prev => ({ ...prev, ...(saved as any).studioColumnsToDisplay }));
          }
          if ((saved as any).fontTarget) {
            setFontTarget((saved as any).fontTarget);
          }
          if ((saved as any).fontsActiveTab) {
            setFontsActiveTab((saved as any).fontsActiveTab);
          }
          if ((saved as any).pageSize !== undefined) {
            setPageSize((saved as any).pageSize);
          }
          if (saved.visibleColumns) {
            setVisibleColumns({
              time: saved.visibleColumns.time !== undefined ? saved.visibleColumns.time : true,
              original: saved.visibleColumns.original !== undefined ? saved.visibleColumns.original : true,
              ai: saved.visibleColumns.ai !== undefined ? saved.visibleColumns.ai : true,
              google: saved.visibleColumns.google !== undefined ? saved.visibleColumns.google : true,
            });
          }
          if (saved.targetLanguage || saved.scriptMode || saved.translationSettings) {
            setTranslationSettings({
              ...DEFAULT_TRANSLATION_SETTINGS,
              ...(saved.translationSettings || {}),
              targetLanguage: saved.targetLanguage || saved.translationSettings?.targetLanguage || 'ur',
              sourceLanguage: saved.sourceLanguage || saved.translationSettings?.sourceLanguage || 'auto',
              scriptMode: (saved.scriptMode || saved.translationSettings?.scriptMode || 'urdu-script') as any,
              toneRegister: (saved.toneRegister || saved.translationSettings?.toneRegister || 'aam-bolchal') as any,
              honorificRegister: (saved.honorificRegister || saved.translationSettings?.honorificRegister || 'contextual') as any,
              loanWordMode: (saved.loanWordMode || saved.translationSettings?.loanWordMode || 'natural-blend') as any,
              idiomMode: (saved.idiomMode || saved.translationSettings?.idiomMode || 'cultural-adaptation') as any,
              lineBreakMode: (saved.lineBreakMode || saved.translationSettings?.lineBreakMode || 'smart-two-line') as any,
              contentFilter: (saved.contentFilter || saved.translationSettings?.contentFilter || 'faithful') as any,
              audioCueMode: (saved.audioCueMode || saved.translationSettings?.audioCueMode || 'translate') as any,
              numberFormatMode: (saved.numberFormatMode || saved.translationSettings?.numberFormatMode || 'western') as any,
              punctuationMode: (saved.punctuationMode || saved.translationSettings?.punctuationMode || 'urdu-punctuation') as any,
            });
          }
          if (saved.sessionId) {
            setSessionId(saved.sessionId);
          } else {
            setSessionId(`GCS-${Math.random().toString(36).substring(2, 15).toUpperCase()}`);
          }
          addLog("Data loaded from IndexedDB.", "success");
        } else {
          setSessionId(`GCS-${Math.random().toString(36).substring(2, 15).toUpperCase()}`);
        }
      } catch (e) {
        console.error("Failed to load state", e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, [addLog]);

  // Persistence: Save (Debounced)
  useEffect(() => {
    if (!isLoaded) return;
    
    setSaveStatus('saving');
    const timeoutId = setTimeout(async () => {
      const state = { 
        subtitles, 
        context, 
        customPrompt, 
        logs, 
        fileName, 
        selectedModel, 
        customApiKey, 
        googleApiKey,
        geminiBatchSize,
        googleBatchSize,
        geminiWorkers,
        googleWorkers,
        geminiDelay,
        sessionId,
        translatedFontSize,
        originalFontSize,
        googleFontSize,
        urduFont,
        originalFont,
        googleFont,
        isGlobalFontActive,
        globalFont,
        globalFontSize,
        translationSettings,
        visibleColumns,
        theme,
        activeStylingConfig,
        isWorkspaceStylingPreview,
        isReadOnly,
        studioColumnsToDisplay,
        fontTarget,
        fontsActiveTab,
        pageSize,
        targetLanguage: translationSettings.targetLanguage,
        scriptMode: translationSettings.scriptMode,
        toneRegister: translationSettings.toneRegister,
        lineBreakMode: translationSettings.lineBreakMode,
        contentFilter: translationSettings.contentFilter,
        audioCueMode: translationSettings.audioCueMode
      };
      try {
        await dbService.saveState(state);
        setSaveStatus('saved');
      } catch (e) {
        console.error("Failed to save state", e);
        setSaveStatus('saved');
      }
    }, 1000); // Save after 1 second of inactivity

    return () => clearTimeout(timeoutId);
  }, [
    isLoaded, 
    subtitles, 
    context, 
    customPrompt, 
    logs, 
    fileName, 
    selectedModel, 
    customApiKey, 
    googleApiKey, 
    geminiBatchSize, 
    googleBatchSize, 
    geminiWorkers, 
    googleWorkers, 
    geminiDelay, 
    translationSettings,
    translatedFontSize,
    originalFontSize,
    googleFontSize,
    urduFont,
    originalFont,
    googleFont,
    isGlobalFontActive,
    globalFont,
    globalFontSize,
    visibleColumns,
    theme,
    activeStylingConfig,
    isWorkspaceStylingPreview,
    isReadOnly,
    studioColumnsToDisplay,
    fontTarget,
    fontsActiveTab,
    pageSize
  ]);

  const connectGemini = async () => {
    if (geminiConnectStatus === 'loading') return;
    setGeminiConnectStatus('loading');
    try {
      const apiKey = (customApiKey?.trim()) || (process.env.GEMINI_API_KEY as string);
      if (!apiKey) {
        setError("Gemini API Key missing. Please provide your Gemini API key in Settings.");
        setGeminiConnectStatus('failed');
        return false;
      }
      geminiRef.current = new GeminiService(apiKey, selectedModel);
      setIsGeminiConnected(true);
      setGeminiConnectStatus('success');
      addLog(`Gemini Connected: ${selectedModel}`, "success");
      setError(null);
      setTimeout(() => setGeminiConnectStatus('idle'), 3000);
      return true;
    } catch (e: any) {
      const is403 = /403|PERMISSION_DENIED|unregistered/i.test(e?.message || '');
      const errMsg = is403 
        ? "403 Forbidden: API key invalid or lacks model permissions. Please check your API key in Settings."
        : `Failed to connect to Gemini: ${e?.message || 'Unknown error'}`;
      setError(errMsg);
      setIsGeminiConnected(false);
      setGeminiConnectStatus('failed');
      setTimeout(() => setGeminiConnectStatus('idle'), 3000);
      return false;
    }
  };

  const ensureGeminiConnected = async () => {
    if (geminiRef.current && isGeminiConnected) return true;
    return await connectGemini();
  };

  const updateGeminiConfig = () => {
    if (!geminiRef.current) {
      connectGemini();
      return;
    }
    try {
      geminiRef.current.updateConfig(customApiKey || (process.env.GEMINI_API_KEY as string), selectedModel);
      addLog(`Gemini config updated: ${selectedModel}`, "success");
      setError(null);
    } catch (e) {
      setError("Failed to update Gemini configuration.");
    }
  };

  const updateGoogleConfig = () => {
    setGoogleConnectStatus('loading');
    if (googleApiKey) {
      addLog("Google Cloud Translate API Key activated.", "success");
      setGoogleConnectStatus('success');
    } else {
      addLog("Google Cloud Translate API Key cleared.", "warning");
      setGoogleConnectStatus('idle');
    }
    setTimeout(() => setGoogleConnectStatus('idle'), 3000);
  };

  const stats = useMemo(() => {
    const total = subtitles.length;
    const translated = subtitles.filter(s => s.translatedText).length;
    const google = subtitles.filter(s => s.googleTranslateText).length;
    const progress = total > 0 ? Math.round((translated / total) * 100) : 0;
    const googleProgress = total > 0 ? Math.round((google / total) * 100) : 0;
    return { total, translated, google, progress, googleProgress };
  }, [subtitles]);

  // Centralized subtitle state updater that records Undo/Redo history
  const updateSubtitles = useCallback((newSubsOrUpdater: SubtitleItem[] | ((prev: SubtitleItem[]) => SubtitleItem[])) => {
    setSubtitles(prev => {
      const nextSubs = typeof newSubsOrUpdater === 'function' ? newSubsOrUpdater(prev) : newSubsOrUpdater;
      if (!isHistoryNavigating.current) {
        setHistory(h => {
          const nextH = h.slice(0, historyIndex + 1);
          if (nextH.length > 50) nextH.shift();
          return [...nextH, nextSubs];
        });
        setHistoryIndex(prevIdx => Math.min(prevIdx + 1, 50));
      }
      return nextSubs;
    });
  }, [historyIndex]);

  // Undo / Redo Handlers
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isHistoryNavigating.current = true;
      const targetState = history[historyIndex - 1];
      setSubtitles(targetState);
      setHistoryIndex(historyIndex - 1);
      addNotification("Undo applied", "success");
      setTimeout(() => { isHistoryNavigating.current = false; }, 50);
    }
  }, [historyIndex, history, addNotification]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isHistoryNavigating.current = true;
      const targetState = history[historyIndex + 1];
      setSubtitles(targetState);
      setHistoryIndex(historyIndex + 1);
      addNotification("Redo applied", "success");
      setTimeout(() => { isHistoryNavigating.current = false; }, 50);
    }
  }, [historyIndex, history, addNotification]);

  // Synchronize baseline original timing map whenever subtitles are loaded or imported
  useEffect(() => {
    if (subtitles.length > 0 && Object.keys(originalTimingMap).length === 0) {
      setOriginalTimingMap(createOriginalTimingMap(subtitles));
    }
  }, [subtitles, originalTimingMap]);

  // Reset Subtitle Timestamps back to original baseline at any time
  const handleResetTimingsToOriginal = useCallback(() => {
    if (Object.keys(originalTimingMap).length === 0) {
      addNotification("No previous timing changes to reset.", "success");
      return;
    }
    const { updatedSubtitles, resetCount } = resetSubtitleTimings(subtitles, originalTimingMap);
    if (resetCount === 0) {
      addNotification("All subtitles are already at original baseline timestamps.", "success");
      return;
    }
    updateSubtitles(updatedSubtitles);
    addNotification(`Restored ${resetCount} subtitle timestamps back to original baseline!`, "success");
    addLog(`Reset ${resetCount} subtitle blocks back to original timestamps.`, "success");
  }, [originalTimingMap, subtitles, updateSubtitles, addNotification, addLog]);

  // Search filtering & pagination
  const filteredSubtitles = useMemo(() => {
    if (!searchTerm) return subtitles;
    const lowSearch = searchTerm.toLowerCase();
    return subtitles.filter(s => 
      s.text.toLowerCase().includes(lowSearch) || 
      (s.translatedText && s.translatedText.toLowerCase().includes(lowSearch)) ||
      (s.googleTranslateText && s.googleTranslateText.toLowerCase().includes(lowSearch))
    );
  }, [subtitles, searchTerm]);

  const totalPages = useMemo(() => {
    if (pageSize === 0) return 1;
    return Math.max(1, Math.ceil(filteredSubtitles.length / pageSize));
  }, [filteredSubtitles.length, pageSize]);

  const paginatedSubtitles = useMemo(() => {
    if (pageSize === 0) return filteredSubtitles;
    const start = (currentPage - 1) * pageSize;
    return filteredSubtitles.slice(start, start + pageSize);
  }, [filteredSubtitles, currentPage, pageSize]);

  // Progressive Viewport Rendering for Translation Workspace
  const progressiveWorkspaceSubtitles = useProgressiveRenderList(paginatedSubtitles, 15, 25);

  // Ensure current page is valid when list changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Selection & Bulk Action Handlers
  const toggleSelectRow = useCallback((index: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIndices.size === filteredSubtitles.length && filteredSubtitles.length > 0) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(filteredSubtitles.map(s => s.index)));
    }
  }, [filteredSubtitles, selectedIndices.size]);

  const selectUntranslated = useCallback(() => {
    const untranslated = filteredSubtitles.filter(s => !s.translatedText || s.translatedText === 'Translation Error');
    if (untranslated.length === 0) {
      addNotification("All visible subtitles are already translated!", "success");
      return;
    }
    setSelectedIndices(new Set(untranslated.map(s => s.index)));
    addNotification(`Selected ${untranslated.length} untranslated subtitle(s)`, "success");
  }, [filteredSubtitles, addNotification]);

  const retrySelectedAI = async () => {
    if (selectedIndices.size === 0) return;
    if (isReadOnly) {
      addNotification("Editing is locked in Read-Only mode", "error");
      return;
    }
    if (!(await ensureGeminiConnected())) return;
    
    const targetItems = subtitles.filter(s => selectedIndices.has(s.index));
    addLog(`Retrying AI translation for ${targetItems.length} selected subtitle(s)...`, "info");
    
    try {
      setIsTranslating(true);
      const results = await geminiRef.current!.translateBatch(
        targetItems.map(item => ({ index: item.index, text: stripFormatting(item.text) })),
        context,
        customPrompt,
        undefined,
        translationSettings
      );
      
      if (results && results.length > 0) {
        const resultMap = new Map(results.map(r => [r.index, r.translatedText]));
        updateSubtitles(prev => prev.map(s => resultMap.has(s.index) ? { ...s, translatedText: resultMap.get(s.index) } : s));
        addLog(`Successfully re-translated ${results.length} subtitle(s).`, "success");
        addNotification(`Re-translated ${results.length} selected subtitle(s)`, "success");
      }
    } catch (err: any) {
      addLog(`Retry failed: ${err.message}`, "error");
      addNotification(`Retry failed: ${err.message}`, "error");
    } finally {
      setIsTranslating(false);
    }
  };

  const retrySelectedGoogle = async () => {
    if (selectedIndices.size === 0) return;
    const targetItems = subtitles.filter(s => selectedIndices.has(s.index));
    addLog(`Translating ${targetItems.length} selected subtitle(s) with Google/Machine...`, "info");
    
    try {
      setIsGoogleTranslatingAll(true);
      const results = await translateBatchGoogle(
        targetItems.map(item => ({ index: item.index, text: stripFormatting(item.text) })),
        googleApiKey,
        undefined,
        geminiRef.current || undefined,
        translationSettings
      );
      
      if (results && results.length > 0) {
        const resultMap = new Map(results.map(r => [r.index, r.googleTranslateText]));
        updateSubtitles(prev => prev.map(s => resultMap.has(s.index) ? { ...s, googleTranslateText: resultMap.get(s.index) } : s));
        addLog(`Google translated ${results.length} selected subtitle(s).`, "success");
        addNotification(`Google translated ${results.length} subtitle(s)`, "success");
      }
    } catch (err: any) {
      addLog(`Google retry failed: ${err.message}`, "error");
    } finally {
      setIsGoogleTranslatingAll(false);
    }
  };

  const retrySelectedBoth = async () => {
    if (selectedIndices.size === 0) return;
    if (isReadOnly) {
      addNotification("Editing is locked in Read-Only mode", "error");
      return;
    }
    addLog(`Retrying both AI and Google translations for ${selectedIndices.size} selected subtitle(s)...`, "info");
    await Promise.all([retrySelectedAI(), retrySelectedGoogle()]);
  };

  const clearSelectedTranslations = useCallback(() => {
    if (selectedIndices.size === 0) return;
    if (isReadOnly) {
      addNotification("Editing is locked in Read-Only mode", "error");
      return;
    }
    updateSubtitles(prev => prev.map(s => selectedIndices.has(s.index) ? { ...s, translatedText: '' } : s));
    addNotification(`Cleared AI translation on ${selectedIndices.size} subtitle(s) (timestamps & block numbers preserved)`, "success");
    addLog(`Cleared AI translation stream on ${selectedIndices.size} segment(s). Timestamps preserved.`, "info");
  }, [selectedIndices, isReadOnly, updateSubtitles, addNotification, addLog]);

  const clearSelectedGoogleTranslations = useCallback(() => {
    if (selectedIndices.size === 0) return;
    if (isReadOnly) {
      addNotification("Editing is locked in Read-Only mode", "error");
      return;
    }
    updateSubtitles(prev => prev.map(s => selectedIndices.has(s.index) ? { ...s, googleTranslateText: '' } : s));
    addNotification(`Cleared Google translation on ${selectedIndices.size} subtitle(s) (timestamps & block numbers preserved)`, "success");
    addLog(`Cleared Google translation stream on ${selectedIndices.size} segment(s). Timestamps preserved.`, "info");
  }, [selectedIndices, isReadOnly, updateSubtitles, addNotification, addLog]);

  const clearSelectedBothTranslations = useCallback(() => {
    if (selectedIndices.size === 0) return;
    if (isReadOnly) {
      addNotification("Editing is locked in Read-Only mode", "error");
      return;
    }
    updateSubtitles(prev => prev.map(s => selectedIndices.has(s.index) ? { ...s, translatedText: '', googleTranslateText: '' } : s));
    addNotification(`Cleared translation streams on ${selectedIndices.size} subtitle(s) (timestamps & block numbers preserved)`, "success");
    addLog(`Cleared both translation streams on ${selectedIndices.size} segment(s). Timestamps preserved.`, "info");
  }, [selectedIndices, isReadOnly, updateSubtitles, addNotification, addLog]);

  const clearSelectedOriginalStream = useCallback(() => {
    if (selectedIndices.size === 0) return;
    if (isReadOnly) {
      addNotification("Editing is locked in Read-Only mode", "error");
      return;
    }
    updateSubtitles(prev => prev.map(s => selectedIndices.has(s.index) ? { ...s, text: '' } : s));
    addNotification(`Cleared original text stream on ${selectedIndices.size} subtitle(s) (timestamps & block numbers preserved)`, "success");
    addLog(`Cleared original dialogue stream on ${selectedIndices.size} segment(s). Timestamps preserved.`, "info");
  }, [selectedIndices, isReadOnly, updateSubtitles, addNotification, addLog]);

  const processSubtitleFile = async (selectedFile: File) => {
    setFileName(selectedFile.name);
    addLog(`File selected: ${selectedFile.name}`, "info");
    
    // Auto-connect on upload
    await ensureGeminiConnected();
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const { items, detectedFormat: detectedFmt } = parseUniversalCaptions(content, selectedFile.name);
      if (items.length === 0) {
        addLog(`Could not parse subtitles from ${selectedFile.name}. File might be empty or invalid.`, "error");
        addNotification(`Failed to parse ${selectedFile.name}`, "error");
        return;
      }
      setSubtitles(items);
      setHistory([items]);
      setHistoryIndex(0);
      setOriginalTimingMap(createOriginalTimingMap(items));
      setSelectedIndices(new Set());
      setDetectedFormat(detectedFmt);
      addLog(`Successfully loaded ${items.length} entries from ${detectedFmt}.`, "success");
      addNotification(`Loaded ${items.length} segments (${detectedFmt})`, "success");
    };
    reader.readAsText(selectedFile);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processSubtitleFile(selectedFile);
    }
  };

  const analyzeSubtitles = async () => {
    if (!(await ensureGeminiConnected())) {
      addLog("Please connect Gemini first.", "warning");
      return;
    }
    if (subtitles.length === 0) {
      addLog("No subtitles to analyze.", "warning");
      return;
    }
    setIsGeneratingContext(true);
    setAnalyzeStatus('loading');
    addLog("Analyzing subtitles for cultural context...", "info");
    try {
      // Use a sample of subtitles for context generation
      const sample = subtitles.slice(0, 100).map(s => s.text).join('\n');
      const generatedContext = await geminiRef.current.generateContext(sample);
      setContext(generatedContext);
      addLog("Context analysis complete.", "success");
      setAnalyzeStatus('success');
      setTimeout(() => setAnalyzeStatus('idle'), 3000);
    } catch (err: any) {
      addLog(`Analysis failed: ${err.message}`, "error");
      setAnalyzeStatus('failed');
      setTimeout(() => setAnalyzeStatus('idle'), 3000);
    } finally {
      setIsGeneratingContext(false);
    }
  };

  const startTranslation = async () => {
    if (!(await ensureGeminiConnected())) {
      addLog("Please connect Gemini first.", "warning");
      return;
    }
    if (isTranslating) return;

    // Pre-execution Feasibility Check
    const feasibility = quotaManager.analyzeFeasibility(
      subtitles, 
      geminiBatchSize, 
      Boolean(context && context.length > 50)
    );
    if (!feasibility.isFeasible && feasibility.status === 'insufficient') {
      const proceed = confirm(
        `⚠️ Pre-Execution Feasibility Alert:\n\nFile requires ~${feasibility.estimatedRequests} API requests, but only ${feasibility.remainingDailyRequests} requests remain in today's quota.\n\nDo you want to proceed anyway?`
      );
      if (!proceed) {
        addLog("Translation cancelled by user due to quota feasibility check.", "warning");
        return;
      }
    }

    // Enforce context analysis
    if (!context || context.length < 50) {
      addLog("Context analysis required before translation. Analyzing now...", "warning");
      await analyzeSubtitles();
      // If analysis failed or returned empty, stop
      if (!context || context.length < 50) {
        addLog("Context analysis failed. Please provide context manually or try again.", "error");
        return;
      }
    }

    setIsTranslating(true);
    stopGeminiRef.current = false;
    geminiAbortControllerRef.current = new AbortController();
    const abortSignal = geminiAbortControllerRef.current.signal;
    addLog("Starting Gemini translation...", "info");

    const itemsToTranslate = subtitles.filter(s => !s.translatedText);
    if (itemsToTranslate.length === 0) {
      addLog("All items are already translated.", "success");
      setIsTranslating(false);
      return;
    }

    // Parallel Gemini Engine
    const workerCount = geminiWorkers;
    const queue = [...itemsToTranslate];
    const BATCH_SIZE = geminiBatchSize;

    const initialWorkerStates: Record<string, any> = {};
    for (let i = 0; i < workerCount; i++) {
      initialWorkerStates[`gemini-worker-${i}`] = { id: i, status: 'idle' };
    }
    setWorkerStates(prev => ({ ...prev, ...initialWorkerStates }));

    const startTime = Date.now();
    let totalCompleted = 0;

    const workers = Array(workerCount).fill(null).map(async (_, i) => {
      const workerId = `gemini-worker-${i}`;
      setWorkerStates(prev => ({ ...prev, [workerId]: { ...prev[workerId], status: 'working' } }));

      while (queue.length > 0 && !stopGeminiRef.current && !abortSignal.aborted) {
        // Adaptive Worker Scaling: check dynamically before starting next batch
        let effectiveDelay = geminiDelay;
        if (adaptiveScalingEnabled) {
          const adaptive = quotaManager.getAdaptiveScaling(geminiWorkers, geminiDelay);
          setActiveAdaptiveInfo({
            workers: adaptive.recommendedWorkers,
            delay: adaptive.recommendedDelay,
            throttled: adaptive.isThrottling,
            reason: adaptive.reason
          });
          effectiveDelay = adaptive.recommendedDelay;

          // If adaptive throttling recommends reducing concurrency, pause higher-index workers
          if (adaptive.isThrottling && i >= adaptive.recommendedWorkers) {
            setWorkerStates(prev => ({ ...prev, [workerId]: { ...prev[workerId], status: 'idle', currentItem: undefined } }));
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }
        }

        const batch: any[] = [];
        for (let j = 0; j < BATCH_SIZE && queue.length > 0; j++) {
          const item = queue.shift();
          if (item) batch.push(item);
        }
        if (batch.length === 0) break;

        setWorkerStates(prev => ({ ...prev, [workerId]: { ...prev[workerId], currentItem: batch[0].index, status: 'working' } }));

        try {
          addLog(`Worker ${i} translating batch starting at #${batch[0].index}...`, "info");
          const results = await geminiRef.current!.translateBatch(
            batch.map(b => ({ index: b.index, text: stripFormatting(b.text) })), 
            context, 
            customPrompt,
            abortSignal,
            translationSettings
          );
          
          if (stopGeminiRef.current || abortSignal.aborted) break;

          if (!results || results.length === 0) {
            addLog(`Worker ${i} received empty results for batch. Retrying...`, "warning");
            queue.push(...batch);
            continue;
          }

          totalCompleted += results.length;
          const elapsed = (Date.now() - startTime) / 1000;
          if (elapsed > 0) {
            setTranslationSpeed(Number((totalCompleted / elapsed).toFixed(1)));
          }

          // Force immediate state update for visibility
          setSubtitles(prev => {
            const next = [...prev];
            results.forEach(res => {
              const idx = next.findIndex(s => s.index === res.index);
              if (idx !== -1) {
                next[idx] = { ...next[idx], translatedText: res.translatedText };
              }
            });
            return next;
          });

          addLog(`Worker ${i} completed ${results.length} items. UI Updated.`, "success");

          if (queue.length > 0 && !stopGeminiRef.current && !abortSignal.aborted) {
            await new Promise(r => setTimeout(r, effectiveDelay));
          }
        } catch (err: any) {
          // If aborted by user, exit immediately without delay
          if (err?.name === 'AbortError' || stopGeminiRef.current || abortSignal.aborted) {
            break;
          }

          // HARD LIMIT AUTO-HALT on 429 Too Many Requests or Quota Limit
          const isRateLimit = err?.isRateLimit || /429|RESOURCE_EXHAUSTED|quota|rate limit|Too Many Requests|exceeded your current quota/i.test(err?.message || '');
          if (isRateLimit) {
            stopGeminiRef.current = true;
            if (geminiAbortControllerRef.current) {
              geminiAbortControllerRef.current.abort();
              geminiAbortControllerRef.current = null;
            }
            queue.length = 0; // Empty queue immediately
            setIsTranslating(false);
            setTranslationSpeed(0);
            setWorkerStates(prev => {
              const next = { ...prev };
              Object.keys(next).forEach(k => {
                if (k.startsWith('gemini-worker')) next[k] = { ...next[k], status: 'completed', currentItem: undefined };
              });
              return next;
            });
            setError("HARD LIMIT AUTO-HALT: API returned 429 Too Many Requests or Quota Limit Exceeded. All active workers halted immediately to protect your API key.");
            addLog("⚠️ HARD LIMIT AUTO-HALT: 429 / Quota Limit Exceeded. Translation stopped instantly.", "error");
            break;
          }

          addLog(`Worker ${i} error: ${err.message}`, "error");
          if (!stopGeminiRef.current && !abortSignal.aborted) {
            // Put back in queue for retry
            queue.push(...batch);
            await new Promise(r => setTimeout(r, 4000));
          }
        }
      }
      setWorkerStates(prev => ({ ...prev, [workerId]: { ...prev[workerId], status: 'completed', currentItem: undefined } }));
    });

    await Promise.all(workers);
    setIsTranslating(false);
    setTranslationSpeed(0);
    geminiAbortControllerRef.current = null;
    if (!stopGeminiRef.current && !abortSignal.aborted) addLog("Translation complete.", "success");
  };

  const stopTranslation = () => {
    stopGeminiRef.current = true;
    if (geminiAbortControllerRef.current) {
      geminiAbortControllerRef.current.abort();
      geminiAbortControllerRef.current = null;
    }
    setIsTranslating(false);
    setTranslationSpeed(0);
    setWorkerStates(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        if (k.startsWith('gemini-worker')) next[k] = { ...next[k], status: 'idle', currentItem: undefined };
      });
      return next;
    });
    addLog("Gemini translation halted immediately.", "warning");
  };

  const translateAllGoogle = async () => {
    if (isGoogleTranslatingAll) return;
    setIsGoogleTranslatingAll(true);
    stopGoogleRef.current = false;
    googleAbortControllerRef.current = new AbortController();
    const abortSignal = googleAbortControllerRef.current.signal;
    addLog("Starting Parallel Google Translate Engine...", "info");

    const itemsToTranslate = subtitles.filter(s => !s.googleTranslateText);
    if (itemsToTranslate.length === 0) {
      addLog("All items already have Google translations.", "success");
      setIsGoogleTranslatingAll(false);
      return;
    }

    // Parallel Engine Config: High-speed concurrency
    const totalBlocks = subtitles.length;
    const workerCount = googleWorkers;
    const BATCH_SIZE = googleBatchSize;
    
    addLog(`Turbo Engine initialized with ${workerCount} parallel workers (Batch Size: ${BATCH_SIZE}).`, "info");

    const queue = [...itemsToTranslate];
    let completedInBatch: typeof subtitles = [];
    const BATCH_UPDATE_INTERVAL = 1000; // Update UI every 1 second

    const initialWorkerStates: Record<string, any> = {};
    for (let i = 0; i < workerCount; i++) {
      initialWorkerStates[`google-worker-${i}`] = { id: i, status: 'idle' };
    }
    setWorkerStates(prev => ({ ...prev, ...initialWorkerStates }));

    const startTime = Date.now();
    let totalCompleted = 0;

    const updateUI = () => {
      if (completedInBatch.length === 0) return;
      const updates = [...completedInBatch];
      totalCompleted += updates.length;
      completedInBatch = [];
      
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed > 0) {
        setTranslationSpeed(Number((totalCompleted / elapsed).toFixed(1)));
      }

      setSubtitles(prev => {
        const next = [...prev];
        updates.forEach(update => {
          const idx = next.findIndex(s => s.index === update.index);
          if (idx !== -1) next[idx].googleTranslateText = update.googleTranslateText;
        });
        return next;
      });
    };

    const uiInterval = setInterval(updateUI, BATCH_UPDATE_INTERVAL);

    let warned403 = false;
    const workers = Array(workerCount).fill(null).map(async (_, i) => {
      const workerId = `google-worker-${i}`;
      setWorkerStates(prev => ({ ...prev, [workerId]: { ...prev[workerId], status: 'working' } }));

      while (queue.length > 0 && !stopGoogleRef.current && !abortSignal.aborted) {
        const batch: any[] = [];
        for (let j = 0; j < BATCH_SIZE && queue.length > 0; j++) {
          const item = queue.shift();
          if (item) batch.push(item);
        }

        if (batch.length === 0) break;

        setWorkerStates(prev => ({ 
          ...prev, 
          [workerId]: { 
            ...prev[workerId], 
            currentItem: batch[0].index,
            status: 'working'
          } 
        }));

        try {
          const results = await translateBatchGoogle(
            batch, 
            googleApiKey, 
            abortSignal, 
            geminiRef.current || undefined,
            translationSettings
          );
          if (stopGoogleRef.current || abortSignal.aborted) break;

          const has403 = results.some(r => r.error403);
          if (has403 && !warned403) {
            warned403 = true;
            addLog("⚠️ Google API returned 403 Forbidden. Switched seamlessly to Gemini Machine Translation Engine.", "warning");
          }

          completedInBatch.push(...results.map((r, idx) => ({ 
            ...batch[idx], 
            googleTranslateText: r.googleTranslateText 
          })));
        } catch (err: any) {
          if (err?.name === 'AbortError' || stopGoogleRef.current || abortSignal.aborted) {
            break;
          }
          console.error("Machine translation error:", err);
          if (geminiRef.current) {
            try {
              const fallback = await geminiRef.current.translateBatchNeutral(batch, undefined, abortSignal, translationSettings);
              completedInBatch.push(...fallback.map((r, idx) => ({ ...batch[idx], googleTranslateText: r.googleTranslateText })));
              continue;
            } catch (fbErr) {
              console.error("Fallback failed", fbErr);
            }
          }
          completedInBatch.push(...batch.map(item => ({ ...item, googleTranslateText: "Translation unavailable" })));
        }
      }
      setWorkerStates(prev => ({ ...prev, [workerId]: { ...prev[workerId], status: 'completed', currentItem: undefined } }));
    });

    await Promise.all(workers);
    clearInterval(uiInterval);
    updateUI(); // Final update

    setIsGoogleTranslatingAll(false);
    setTranslationSpeed(0);
    googleAbortControllerRef.current = null;
    if (!stopGoogleRef.current) {
      addLog("Parallel Google translation complete.", "success");
    } else {
      addLog("Parallel engine stopped immediately.", "warning");
    }
  };

  const translateSingleRowGoogle = useCallback(async (index: number) => {
    const item = subtitlesRef.current.find(s => s.index === index);
    if (!item) return;

    try {
      addLog(`Translating line #${index} with machine translator...`, "info");
      let translated = '';
      try {
        translated = await translateTextGoogle(item.text, googleApiKey, undefined, translationSettingsRef.current);
      } catch (err: any) {
        if (geminiRef.current) {
          translated = await geminiRef.current.getNeutralTranslation(item.text, undefined, translationSettingsRef.current);
          addLog(`Line #${index} translated with Gemini machine translator fallback.`, "info");
        } else {
          throw err;
        }
      }

      if (translated && translated !== "Translation Error") {
        setSubtitles(prev => prev.map(s => s.index === index ? { ...s, googleTranslateText: translated } : s));
        addLog(`Line #${index} machine comparison ready.`, "success");
      }
    } catch (e: any) {
      addLog(`Could not translate line #${index}: ${e.message}`, "error");
    }
  }, [googleApiKey, addLog]);

  const applyGoogleToAI = (index: number) => {
    if (isReadOnly) {
      addNotification("Editing is locked in Read-Only mode", "error");
      return;
    }
    const item = subtitles.find(s => s.index === index);
    if (!item || !item.googleTranslateText) return;
    updateSubtitles(prev => prev.map(s => s.index === index ? { ...s, translatedText: item.googleTranslateText } : s));
    addLog(`Transferred Google translation to AI Urdu editor for segment #${index}.`, "info");
  };

  const copyAllGoogleToEmptyAI = () => {
    if (isReadOnly) {
      addNotification("Editing is locked in Read-Only mode", "error");
      return;
    }
    let count = 0;
    updateSubtitles(prev => prev.map(s => {
      if (!s.translatedText && s.googleTranslateText && s.googleTranslateText !== 'Translation Error') {
        count++;
        return { ...s, translatedText: s.googleTranslateText };
      }
      return s;
    }));
    if (count > 0) {
      addLog(`Populated ${count} untranslated segments with Google translations.`, "success");
      addNotification(`Populated ${count} empty AI fields with Google translations`, "success");
    } else {
      addLog("All segments already have Urdu translations or no Google translations available.", "warning");
    }
  };

  const downloadFormattedSubtitles = (
    format: 'srt-formatted' | 'ass' | 'ssa' | 'vtt' | 'srt-clean' | 'sbv' | 'lrc' | 'txt' | 'json' | 'copy',
    type: 'ai' | 'google' | 'original' = 'ai'
  ) => {
    if (subtitles.length === 0) {
      addLog("Download failed: No subtitles to export.", "error");
      addNotification("No subtitles to export", "error");
      return;
    }

    try {
      const baseName = (fileName || 'subtitles').replace(/\.[^/.]+$/, '').replace(/[^a-z0-9_-]/gi, '_');
      let content = '';
      let mimeType = 'text/plain;charset=utf-8';
      let fileExt = 'srt';

      // One-tap Clipboard Copy for Android messaging / WhatsApp
      if (format === 'copy') {
        content = generateAndroidPhoneTranscript(subtitles, type, false);
        navigator.clipboard.writeText(content);
        addNotification("Subtitles copied to clipboard for Android / WhatsApp!", "success");
        addLog("Copied dialogue transcript to clipboard for mobile sharing.", "success");
        setIsExportMenuOpen(false);
        return;
      }

      if (format === 'srt-formatted') {
        content = generateFormattedSRT(subtitles, type);
        mimeType = 'text/srt;charset=utf-8';
        fileExt = `${type}_formatted.srt`;
      } else if (format === 'ass') {
        content = generateASS(subtitles, {
          fontFamily: urduFont,
          fontSize: translatedFontSize || 38,
          title: baseName,
          type,
          palette: GRADIENT_PALETTES.find(p => p.id === activeStylingConfig?.paletteId),
          stylingConfig: activeStylingConfig
        });
        mimeType = 'text/x-ssa;charset=utf-8';
        fileExt = `${type}_android_vlc.ass`;
      } else if (format === 'ssa') {
        content = generateSSA(subtitles, {
          fontFamily: urduFont,
          fontSize: translatedFontSize || 38,
          title: baseName,
          type,
          palette: GRADIENT_PALETTES.find(p => p.id === activeStylingConfig?.paletteId),
          stylingConfig: activeStylingConfig
        });
        mimeType = 'text/x-ssa;charset=utf-8';
        fileExt = `${type}_v4.ssa`;
      } else if (format === 'vtt') {
        content = generateWebVTT(subtitles, type);
        mimeType = 'text/vtt;charset=utf-8';
        fileExt = `${type}_web_android.vtt`;
      } else if (format === 'sbv') {
        content = generateYouTubeSBV(subtitles, type);
        mimeType = 'text/plain;charset=utf-8';
        fileExt = `${type}_youtube.sbv`;
      } else if (format === 'lrc') {
        content = generateLRC(subtitles, type);
        mimeType = 'text/plain;charset=utf-8';
        fileExt = `${type}_mobile_lyrics.lrc`;
      } else if (format === 'txt') {
        content = generateAndroidPhoneTranscript(subtitles, type, true);
        mimeType = 'text/plain;charset=utf-8';
        fileExt = `${type}_android_phone.txt`;
      } else if (format === 'json') {
        content = generateJSONCaptions(subtitles, type);
        mimeType = 'application/json;charset=utf-8';
        fileExt = `${type}_timed_text.json`;
      } else {
        content = generateCleanSRT(subtitles, type);
        mimeType = 'text/srt;charset=utf-8';
        fileExt = `${type}_clean.srt`;
      }

      if (!content || content.trim().length === 0) {
        addLog("Download failed: Generated file was empty.", "error");
        return;
      }

      const blob = new Blob(['\ufeff' + content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${baseName}_${fileExt}`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 30000);

      addLog(`Saved ${format.toUpperCase()} subtitles: ${a.download}`, "success");
      addNotification(`Downloaded ${format.toUpperCase()} format`, "success");
      setIsExportMenuOpen(false);
    } catch (err: any) {
      console.error("Export failed:", err);
      addLog(`Export failed: ${err.message}`, "error");
    }
  };

  const stopGoogleTranslate = () => {
    stopGoogleRef.current = true;
    if (googleAbortControllerRef.current) {
      googleAbortControllerRef.current.abort();
      googleAbortControllerRef.current = null;
    }
    setIsGoogleTranslatingAll(false);
    setTranslationSpeed(0);
    setWorkerStates(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        if (k.startsWith('google-worker')) next[k] = { ...next[k], status: 'idle', currentItem: undefined };
      });
      return next;
    });
    addLog("Google translation halted immediately.", "warning");
  };

  const downloadSRT = (type: 'ai' | 'google' = 'ai') => {
    const subsToDownload = subtitles.map(s => ({
      ...s,
      translatedText: type === 'ai' ? s.translatedText : s.googleTranslateText
    }));
    const content = stringifySRT(subsToDownload);
    if (!content || content.trim().length === 0) {
      addLog("Download failed: No content to export.", "error");
      return;
    }
    
    try {
      // Use a unique timestamp to force the browser to treat this as a new download
      const timestamp = Date.now();
      const safeFileName = (fileName || 'subtitles.srt').replace(/[^a-z0-9.]/gi, '_');
      const finalFileName = `${type}_${timestamp}_${safeFileName}`;

      // Use Blob with explicit UTF-8 BOM for better compatibility with some editors
      const blob = new Blob(['\ufeff' + content], { type: 'text/srt;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = finalFileName;
      
      // Add to DOM, click, and leave it for a bit
      document.body.appendChild(a);
      a.click();
      
      // Longer timeout before cleanup to ensure iframe doesn't kill the process
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
        URL.revokeObjectURL(url);
      }, 30000); // 30 seconds is safe
      
      addLog(`${type === 'ai' ? 'AI' : 'Google'} SRT download started: ${finalFileName}`, "success");
    } catch (err: any) {
      console.error("Download failed:", err);
      addLog(`Download failed: ${err.message}`, "error");
    }
  };

  const resetProject = async () => {
    // Clears stored project state and resets styling & configurations to defaults
    try {
      await dbService.clearState();
      setSubtitles([]);
      setHistory([]);
      setHistoryIndex(-1);
      setContext('');
      setFileName('');
      setDetectedFormat('');
      setLogs([]);
      setError(null);
      setSelectedIndices(new Set());
      setActiveStylingConfig(DEFAULT_STYLING_CONFIG);
      setIsWorkspaceStylingPreview(true);
      setIsReadOnly(true);
      setStudioColumnsToDisplay({ original: true, ai: true, google: true, time: true });
      setVisibleColumns({ time: true, original: true, ai: true, google: true });
      setSessionId(`GCS-${Math.random().toString(36).substring(2, 15).toUpperCase()}`);
      setSaveStatus('saved');
      addLog("Project discarded and reset to fresh state.", "warning");
      addNotification("Project discarded and memory reset", "success");
    } catch (e) {
      console.error("Failed to clear state", e);
      addLog("Failed to discard project.", "error");
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog("Logs cleared.", "info");
  };

  const restoreDefaultPrompt = () => {
    setCustomPrompt('Translate naturally for a family drama setting.');
    addLog("Default prompt restored.", "info");
  };

  const restoreCache = async () => {
    try {
      const saved = await dbService.loadState();
      if (saved) {
        setSubtitles(saved.subtitles || []);
        if (saved.subtitles) {
          setHistory([saved.subtitles]);
          setHistoryIndex(0);
        }
        setContext(saved.context || '');
        setCustomPrompt(saved.customPrompt || '');
        setLogs(saved.logs || []);
        setFileName(saved.fileName || '');
        if (saved.selectedModel) setSelectedModel(saved.selectedModel);
        if (saved.customApiKey) setCustomApiKey(saved.customApiKey);
        if (saved.googleApiKey) setGoogleApiKey(saved.googleApiKey);
        if ((saved as any).theme) {
          const savedTh = (saved as any).theme;
          if (savedTh === 'light') setTheme('classic');
          else if (savedTh === 'dark') setTheme('cinematic');
          else setTheme(savedTh as AppTheme);
        }
        if ((saved as any).activeStylingConfig) setActiveStylingConfig((saved as any).activeStylingConfig);
        if ((saved as any).isWorkspaceStylingPreview !== undefined) setIsWorkspaceStylingPreview(Boolean((saved as any).isWorkspaceStylingPreview));
        if ((saved as any).isReadOnly !== undefined) setIsReadOnly(Boolean((saved as any).isReadOnly));
        if ((saved as any).studioColumnsToDisplay) setStudioColumnsToDisplay((saved as any).studioColumnsToDisplay);
        if (saved.visibleColumns) setVisibleColumns(saved.visibleColumns);
        addLog("Project and styling cache restored manually.", "success");
        addNotification("Project memory restored", "success");
      } else {
        addLog("No cache found.", "warning");
      }
    } catch (e) {
      addLog("Failed to restore cache.", "error");
    }
  };

  const refreshDownloadSession = () => {
    // This function simulates a "refresh" for the browser's download manager
    // by clearing temporary states and potentially updating the session ID
    const newId = `GCS-${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
    setSessionId(newId);
    
    // Clear any existing object URLs if we were tracking them (we aren't explicitly, but good practice)
    addLog("Download session refreshed. Browser download state reset.", "success");
  };

  const projectStats = useMemo(() => {
    const totalChars = subtitles.reduce((acc, s) => acc + s.text.length, 0);
    const totalUrduChars = subtitles.reduce((acc, s) => acc + (s.translatedText?.length || 0), 0);
    const totalIndexes = subtitles.length;
    const estimatedTokens = Math.ceil(totalChars / 4); // Rough estimation
    return { totalChars, totalUrduChars, totalIndexes, estimatedTokens };
  }, [subtitles]);

  // Live 3-Streams Preview Sample Texts for Header (Cleaned, Formatted & Tag-Free)
  const previewSource = useMemo(() => {
    const item = subtitles.find(s => s.text && stripFormatting(s.text).trim().length > 0);
    return formatSubtitlePreview(item?.text, 'Cinematic Dialogue & Narrative Flow');
  }, [subtitles]);

  const previewAi = useMemo(() => {
    const item = subtitles.find(s => s.translatedText && stripFormatting(s.translatedText).trim().length > 0);
    return formatSubtitlePreview(item?.translatedText, 'ہر بات میں ایک گہرا احساس چھپا ہے');
  }, [subtitles]);

  const previewGoogle = useMemo(() => {
    const item = subtitles.find(s => s.googleTranslateText && stripFormatting(s.googleTranslateText).trim().length > 0);
    return formatSubtitlePreview(item?.googleTranslateText, 'یہ ایک معیاری اور درست ترجمہ ہے');
  }, [subtitles]);

  const sampleSourceText = previewSource.plain;
  const sampleAiText = previewAi.plain;
  const sampleGoogleText = previewGoogle.plain;

  const [isWorkerMonitorOpen, setIsWorkerMonitorOpen] = useState(false);
  const [workerStates, setWorkerStates] = useState<Record<string, { id: number, status: 'idle' | 'working' | 'completed', currentItem?: number }>>({});

  // Debounce search input to avoid searching on every single keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Click outside & Escape key to auto-close Text Resize, Fonts, and Export dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (textResizeRef.current && !textResizeRef.current.contains(target)) {
        setIsTextResizeOpen(false);
      }
      if (fontsRef.current && !fontsRef.current.contains(target)) {
        setIsFontsOpen(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(target)) {
        setIsExportMenuOpen(false);
      }
      if (columnMenuRef.current && !columnMenuRef.current.contains(target)) {
        setIsColumnMenuOpen(false);
      }
      if (workspaceToolsRef.current && !workspaceToolsRef.current.contains(target)) {
        setIsWorkspaceToolsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsTextResizeOpen(false);
        setIsFontsOpen(false);
        setIsExportMenuOpen(false);
        setIsColumnMenuOpen(false);
        setIsWorkspaceToolsOpen(false);
      }

      // Global Undo/Redo Shortcuts (when not editing an input or textarea)
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isEditingInput = targetTag === 'input' || targetTag === 'textarea';

      if (!isEditingInput) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        } else if (
          ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
          ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && e.shiftKey)
        ) {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleUndo, handleRedo]);

  const handleManualEdit = useCallback((index: number, newText: string) => {
    if (isReadOnly) return;
    updateSubtitles(prev => prev.map(s => s.index === index ? { ...s, translatedText: newText } : s));
  }, [isReadOnly, updateSubtitles]);

  const handleManualEditOriginal = useCallback((index: number, newText: string) => {
    if (isReadOnly) return;
    updateSubtitles(prev => prev.map(s => s.index === index ? { ...s, text: newText } : s));
  }, [isReadOnly, updateSubtitles]);

  const handleManualEditGoogle = useCallback((index: number, newText: string) => {
    if (isReadOnly) return;
    updateSubtitles(prev => prev.map(s => s.index === index ? { ...s, googleTranslateText: newText } : s));
  }, [isReadOnly, updateSubtitles]);

  const handleInsertSubtitle = useCallback((afterIndex?: number) => {
    if (isReadOnly) {
      addNotification("Editing is locked in Read-Only mode", "error");
      return;
    }
    updateSubtitles(prev => insertSubtitle(prev, afterIndex));
    addNotification("Inserted new subtitle line", "success");
    addLog(`Inserted new subtitle segment after #${afterIndex || 'end'}.`, "info");
  }, [isReadOnly, updateSubtitles, addNotification, addLog]);

  const handleSplitSubtitle = useCallback((index: number) => {
    if (isReadOnly) {
      addNotification("Editing is locked in Read-Only mode", "error");
      return;
    }
    updateSubtitles(prev => splitSubtitle(prev, index));
    addNotification(`Split segment #${index} into two`, "success");
    addLog(`Split subtitle segment #${index} into two segments.`, "info");
  }, [isReadOnly, updateSubtitles, addNotification, addLog]);

  const handleDeleteSubtitle = useCallback((index: number) => {
    if (isReadOnly) {
      addNotification("Editing is locked in Read-Only mode", "error");
      return;
    }
    updateSubtitles(prev => deleteSubtitle(prev, index));
    addNotification(`Deleted segment #${index}`, "success");
    addLog(`Deleted subtitle segment #${index}.`, "info");
  }, [isReadOnly, updateSubtitles, addNotification, addLog]);

  const deleteSelectedSubtitles = useCallback(() => {
    if (selectedIndices.size === 0) return;
    if (isReadOnly) {
      addNotification("Editing is locked in Read-Only mode", "error");
      return;
    }
    const count = selectedIndices.size;
    updateSubtitles(prev => batchDeleteSubtitles(prev, selectedIndices));
    setSelectedIndices(new Set());
    addNotification(`Deleted ${count} selected subtitle(s)`, "success");
    addLog(`Batch deleted ${count} subtitle segments.`, "info");
  }, [selectedIndices, isReadOnly, updateSubtitles, addNotification, addLog]);

  // Sync theme to root html element for Tailwind v4 custom dark variant & multi-theme data attribute
  useEffect(() => {
    const root = document.documentElement;
    const isDark = theme !== 'classic';
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.setAttribute('data-app-theme', theme);
    try {
      localStorage.setItem('applet_theme', theme);
    } catch {}
  }, [theme]);

  return (
    <div 
      className={cn(
        "min-h-screen font-sans flex flex-col transition-colors duration-300 theme-root",
        theme === 'classic' ? "bg-zinc-100 text-zinc-900" : "bg-zinc-900 text-zinc-100 dark"
      )}
      style={{
        '--translated-font-size': `${isGlobalFontActive ? globalFontSize : translatedFontSize}px`,
        '--original-font-size': `${isGlobalFontActive ? globalFontSize : originalFontSize}px`,
        '--google-font-size': `${isGlobalFontActive ? Math.round(globalFontSize * 0.9) : googleFontSize}px`,
        '--urdu-font': isGlobalFontActive ? globalFont : urduFont,
        '--original-font': isGlobalFontActive ? globalFont : originalFont,
        '--google-font': isGlobalFontActive ? globalFont : googleFont
      } as React.CSSProperties}
    >
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div 
            key={n.id}
            initial={{ opacity: 0, x: 20, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "fixed top-6 right-6 z-[200] p-3.5 rounded-2xl shadow-xl border flex items-center gap-3 min-w-[260px]",
              n.type === 'success' 
                ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-950/20" 
                : "bg-red-600 text-white border-red-500 shadow-red-950/20"
            )}
          >
            {n.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <p className="text-xs font-bold leading-snug">{n.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700/60 px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-emerald-100">
            <Languages size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">Urdu Localizer <span className="text-emerald-600 font-medium text-sm">v2.2</span></h1>
            {fileName && <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono truncate max-w-[200px]">{fileName}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Studio Drawer Action Buttons */}
          <div className="hidden lg:flex items-center gap-2">
            {/* AI Cinema Studio Drawer Button */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setIsAiCinemaOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 hover:from-purple-500/20 hover:to-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all text-xs font-bold cursor-pointer shadow-2xs"
                title="AI Cinema Studio: Plot breakdowns, storyline insights, and reviews in Urdu & English"
              >
                <Clapperboard size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span>AI Cinema Studio</span>
              </button>
              <InfoPopover
                title="AI Cinema Studio"
                description="Movie database intelligence workspace that collects movie/series info, breaks down plots, generates simplified storylines, and writes reviews in Urdu & English."
                details={[
                  "Can be pulled out from the left screen edge",
                  "Preset prompts for instant analysis",
                  "Export or apply insights directly to subtitle context"
                ]}
              />
            </div>

            {/* Styling Studio Drawer Button */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setIsStylingDrawerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-rose-500/10 hover:from-amber-500/20 hover:to-rose-500/20 text-amber-800 dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-800 transition-all text-xs font-bold cursor-pointer shadow-2xs"
                title="Gradient Studio: Apply color gradient palettes and download stylized subtitles"
              >
                <Palette size={14} className="text-amber-600 dark:text-amber-400" />
                <span>Styling Studio</span>
              </button>
              <InfoPopover
                title="Styling Studio"
                description="Full-screen stylizer drawer to apply color gradients, karaoke/glow animations, Urdu/English typography, and custom presets with simultaneous live preview."
                details={[
                  "Can be pulled out from the right screen edge",
                  "Applies to AI, Google, or Original streams",
                  "Download in SRT, SSA, ASS, and WebVTT formats"
                ]}
              />
            </div>

            {/* Preview Space Button */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setIsPreviewSpaceOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-xl border border-blue-200 dark:border-blue-800 transition-all text-xs font-bold cursor-pointer shadow-2xs"
                title="Preview Space: Live playback and preview for all formatted subtitle streams"
              >
                <Play size={13} className="text-blue-600 dark:text-blue-400" />
                <span>Preview Space</span>
              </button>
              <InfoPopover
                title="Preview Space"
                description="Dedicated cinema playback and simulation suite to preview and play saved changes in all formatted subtitle streams in real-time."
                details={[
                  "Interactive player with speed and timeline scrubber",
                  "Cinema, Timeline, and Raw Code preview modes",
                  "Instant export of any tested stream"
                ]}
              />
            </div>

            {/* Edit Studio Button */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => handleOpenEditor()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-all text-xs font-bold cursor-pointer shadow-2xs"
                title="Edit Studio: Edit original, AI, or Google translations with column checkboxes, swaps, and save/undo"
              >
                <Edit3 size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>Edit Studio</span>
              </button>
              <InfoPopover
                title="Edit Studio"
                description="Comprehensive editing studio with separate spaces for original subtitles, AI, and Google translations. Column visibility checkboxes, direct text editing, swapping, and Save All / Undo All."
              />
            </div>
          </div>

          {/* Settings and Configurations Drawer Button */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setIsTranslationSettingsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-all text-xs font-bold shadow-2xs cursor-pointer group"
              title="Settings & Configurations: Configure Target Language, Script Mode, Tone, and Formatting"
            >
              <Sliders size={14} className="text-emerald-600 dark:text-emerald-400 group-hover:rotate-45 transition-transform" />
              <span className="hidden sm:inline">Settings:</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-200/70 dark:bg-emerald-900/60 text-[10px] font-mono font-bold text-emerald-900 dark:text-emerald-200">
                {TARGET_LANGUAGES.find(l => l.code === translationSettings.targetLanguage)?.name || 'Urdu'} • {SCRIPT_MODES.find(s => s.id === translationSettings.scriptMode)?.badge || 'اردو'}
              </span>
            </button>
            <InfoPopover
              title="Settings & Configurations"
              description="Configure target language, script type (Nastaliq, Roman Urdu, Naskh), honorifics, tone registers, line breaking rules, and cultural filters."
            />
          </div>

          {/* Multi-Theme Selector (Classic, Cinematic, Cyber, Neon, Sapphire, Amber) */}
          <ThemeSelector 
            currentTheme={theme} 
            onThemeChange={setTheme} 
          />
          
          {/* Project Memory & Auto-Save Indicator */}
          <div 
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[10px] font-medium"
            title={saveStatus === 'saving' ? "Saving ongoing project state and stylings..." : "All changes, styles, themes, and settings are remembered and preserved until discarded."}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full transition-colors", saveStatus === 'saving' ? "bg-amber-500 animate-ping" : "bg-emerald-500")} />
            <span className="text-zinc-600 dark:text-zinc-300 select-none">
              {saveStatus === 'saving' ? "Saving..." : "Project Saved"}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-full border border-emerald-200 dark:border-emerald-800/60">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", isGeminiConnected ? "bg-emerald-500" : "bg-red-500")} />
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              {isGeminiConnected ? 'Gemini Active' : 'Gemini Offline'}
            </span>
          </div>
          <button 
            onClick={() => setIsMenuOpen(true)} 
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 rounded-lg transition-colors text-zinc-600 dark:text-zinc-300 cursor-pointer"
            title="Open Studios & Settings Menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Sidebar/Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: 300 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 300 }} 
            className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-zinc-800 shadow-2xl z-[60] p-8 border-l border-zinc-200 dark:border-zinc-700/60 flex flex-col overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Studios & Settings</h2>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 rounded-full text-zinc-500 dark:text-zinc-400 cursor-pointer"><X size={20} /></button>
            </div>

            {/* Studio Spaces Launchers */}
            <div className="space-y-2 mb-6 shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">Dedicated Studios</p>
              
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsAiCinemaOpen(true);
                }}
                className="w-full p-2.5 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 hover:from-purple-500/20 hover:to-indigo-500/20 border border-indigo-200 dark:border-indigo-800 rounded-xl text-left flex items-center gap-2.5 transition-all cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-2xs group-hover:scale-105 transition-transform">
                  <Clapperboard size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">AI Cinema Studio</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Movie breakdowns & Urdu/English stories</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsStylingDrawerOpen(true);
                }}
                className="w-full p-2.5 bg-gradient-to-r from-rose-500/10 to-amber-500/10 hover:from-rose-500/20 hover:to-amber-500/20 border border-amber-200 dark:border-amber-800 rounded-xl text-left flex items-center gap-2.5 transition-all cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-rose-600 text-white shadow-2xs group-hover:scale-105 transition-transform">
                  <Palette size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Styling Studio</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Gradients, animations & stylized exports</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsPreviewSpaceOpen(true);
                }}
                className="w-full p-2.5 bg-blue-50/70 hover:bg-blue-100/70 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-xl text-left flex items-center gap-2.5 transition-all cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-blue-600 text-white shadow-2xs group-hover:scale-105 transition-transform">
                  <Play size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Preview Space</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Live playback simulation across all streams</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  handleOpenEditor();
                }}
                className="w-full p-2.5 bg-emerald-50/70 hover:bg-emerald-100/70 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-left flex items-center gap-2.5 transition-all cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-2xs group-hover:scale-105 transition-transform">
                  <Edit3 size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Edit Studio</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Column checkboxes, original editing & swaps</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsTranslationSettingsModalOpen(true);
                }}
                className="w-full p-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-left flex items-center gap-2.5 shadow-xs transition-all cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-white/20 text-white shadow-2xs">
                  <Sliders size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white">Settings & Configurations</p>
                  <p className="text-[10px] text-emerald-100 truncate">Language, Nastaliq, Roman Urdu & rules</p>
                </div>
              </button>
            </div>
            <div className="space-y-6 flex-1">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40">AI Model Selection</label>
                </div>
                <select 
                  value={selectedModel} 
                  onChange={(e) => {
                    const newModel = e.target.value;
                    setSelectedModel(newModel);
                    if (geminiRef.current) {
                      geminiRef.current.updateConfig((customApiKey?.trim()) || (process.env.GEMINI_API_KEY as string), newModel);
                      addLog(`Model switched to: ${newModel}`, "info");
                    }
                  }}
                  className="w-full p-2.5 bg-black/5 dark:bg-white/5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all mb-4 dark:text-white"
                >
                  <option value="gemini-3.8-flash">Gemini 3 Flash (Fast & Free Tier Recommended)</option>
                  <option value="gemini-flash-latest">Gemini Flash Latest</option>
                  <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Ultra Low Latency)</option>
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Requires Paid Project Tier)</option>
                </select>

                <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40 mb-2 block">Gemini API Key</label>
                <div className="flex gap-2 mb-4">
                  <input 
                    type="password"
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="Enter Gemini Key..."
                    className="flex-1 p-2.5 bg-black/5 dark:bg-white/5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all dark:text-white"
                  />
                  <button 
                    onClick={connectGemini}
                    className={`px-4 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                      geminiConnectStatus === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 
                      geminiConnectStatus === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' :
                      geminiConnectStatus === 'loading' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' :
                      isGeminiConnected ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {geminiConnectStatus === 'loading' && <Loader2 size={12} className="animate-spin" />}
                    {geminiConnectStatus === 'success' ? 'Connected!' : 
                     geminiConnectStatus === 'failed' ? 'Failed' : 
                     geminiConnectStatus === 'loading' ? 'Connecting...' :
                     isGeminiConnected ? 'Connected' : 'Connect'}
                  </button>
                </div>

                <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40 mb-2 block">Google Cloud API Key</label>
                <div className="flex gap-2 mb-4">
                  <input 
                    type="password"
                    value={googleApiKey}
                    onChange={(e) => setGoogleApiKey(e.target.value)}
                    placeholder="Enter Google Key..."
                    className="flex-1 p-2.5 bg-black/5 dark:bg-white/5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all dark:text-white"
                  />
                  <button 
                    onClick={updateGoogleConfig}
                    className={`px-4 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                      googleConnectStatus === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 
                      googleConnectStatus === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' :
                      googleConnectStatus === 'loading' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' :
                      googleApiKey ? 'bg-blue-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {googleConnectStatus === 'loading' && <Loader2 size={12} className="animate-spin" />}
                    {googleConnectStatus === 'success' ? 'Activated!' : 
                     googleConnectStatus === 'failed' ? 'Failed' : 
                     googleConnectStatus === 'loading' ? 'Activating...' :
                     googleApiKey ? 'Activated' : 'Activate'}
                  </button>
                </div>

                <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40">Performance Tuning</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-black/30 dark:text-white/30 block mb-1">Gemini Workers</label>
                      <input 
                        type="number" 
                        value={geminiWorkers} 
                        onChange={e => setGeminiWorkers(Number(e.target.value))}
                        className="w-full p-2 bg-black/5 dark:bg-white/5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                        min="1" max="20"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-black/30 dark:text-white/30 block mb-1">Gemini Batch</label>
                      <input 
                        type="number" 
                        value={geminiBatchSize} 
                        onChange={e => setGeminiBatchSize(Number(e.target.value))}
                        className="w-full p-2 bg-black/5 dark:bg-white/5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                        min="1" max="50"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-black/30 dark:text-white/30 block mb-1">Gemini Delay (ms)</label>
                      <input 
                        type="number" 
                        value={geminiDelay} 
                        onChange={e => setGeminiDelay(Number(e.target.value))}
                        className="w-full p-2 bg-black/5 dark:bg-white/5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                        min="0" max="10000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-black/30 dark:text-white/30 block mb-1">Google Workers</label>
                      <input 
                        type="number" 
                        value={googleWorkers} 
                        onChange={e => setGoogleWorkers(Number(e.target.value))}
                        className="w-full p-2 bg-black/5 dark:bg-white/5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                        min="1" max="100"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-black/30 dark:text-white/30 block mb-1">Google Batch</label>
                      <input 
                        type="number" 
                        value={googleBatchSize} 
                        onChange={e => setGoogleBatchSize(Number(e.target.value))}
                        className="w-full p-2 bg-black/5 dark:bg-white/5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                        min="1" max="100"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mb-4">
                  <button 
                    onClick={restoreCache}
                    className="flex-1 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={14} /> Restore Cache
                  </button>
                  <button 
                    onClick={refreshDownloadSession}
                    className="flex-1 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={14} /> Refresh Session
                  </button>
                </div>
              </div>
              
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-700/60 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-300">Project Stats</span>
                  </div>
                  <span className="text-[8px] font-mono text-zinc-400 dark:text-zinc-500">{sessionId}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700/60">
                    <p className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Original Chars</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{projectStats.totalChars.toLocaleString()}</p>
                  </div>
                  <div className="text-center p-2 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700/60">
                    <p className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Urdu Chars</p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{projectStats.totalUrduChars.toLocaleString()}</p>
                  </div>
                  <div className="text-center p-2 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700/60">
                    <p className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Total Indexes</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{projectStats.totalIndexes.toLocaleString()}</p>
                  </div>
                  <div className="text-center p-2 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700/60">
                    <p className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Est. Tokens</p>
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{projectStats.estimatedTokens.toLocaleString()}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700/60">
                  <p className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase mb-1">Google Cloud Cache ID</p>
                  <p className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 break-all">{sessionId}</p>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">Using Gemini 3.1 Pro with Web Search. Rate limit: 14 RPM.</p>
              </div>
            </div>
            <button onClick={resetProject} className="w-full py-3 flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-sm border border-red-100 mt-4">
              <Trash2 size={16} /> Discard Data
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto w-full">
        
        {/* Left Column: Controls & Context */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 shadow-sm">
              <AlertCircle size={18} />
              <p className="text-xs font-bold">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded-full"><X size={14} /></button>
            </motion.div>
          )}
          
          {/* Upload & Stats */}
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Project Controls</h3>
              <BarChart3 size={16} className="text-zinc-400 dark:text-zinc-500" />
            </div>
            
            <div className="relative">
              {fileName ? (
                <div className="border-2 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 transition-all">
                  <div className="flex items-center gap-2">
                    <FileText size={28} className="text-emerald-500" />
                    {detectedFormat && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-mono text-[9px] font-bold border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                        {detectedFormat}
                      </span>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[220px]" title={fileName}>{fileName}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-tight mt-0.5">{stats.total} subtitle segments loaded</p>
                  </div>
                  <button 
                    onClick={resetProject}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-red-200 dark:border-red-900/50 cursor-pointer"
                  >
                    <Trash2 size={12} /> Discard Project
                  </button>
                </div>
              ) : (
                <label 
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      processSubtitleFile(file);
                    }
                  }}
                  className="block cursor-pointer group"
                >
                  <input 
                    type="file" 
                    accept=".srt,.vtt,.ass,.ssa,.sbv,.lrc,.json,.txt,text/vtt,text/plain,application/json" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                  <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-5 text-center group-hover:border-emerald-500 group-hover:bg-emerald-50/30 dark:group-hover:bg-emerald-950/20 transition-all">
                    <Upload size={24} className="mx-auto mb-2 text-zinc-400 dark:text-zinc-500 group-hover:text-emerald-500" />
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1">Upload Subtitles & Online Captions</span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mb-2">Drop file or click to browse (Android & Online compatible)</span>
                    <div className="flex flex-wrap items-center justify-center gap-1 max-w-[280px] mx-auto">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[8.5px] font-mono font-bold text-zinc-600 dark:text-zinc-400">SRT</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 text-[8.5px] font-mono font-bold text-emerald-700 dark:text-emerald-300">VTT (Web)</span>
                      <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/70 text-[8.5px] font-mono font-bold text-indigo-700 dark:text-indigo-300">ASS (Android)</span>
                      <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/70 text-[8.5px] font-mono font-bold text-red-700 dark:text-red-300">SBV (YouTube)</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-[8.5px] font-mono font-bold text-amber-700 dark:text-amber-300">LRC (Lyrics)</span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/70 text-[8.5px] font-mono font-bold text-purple-700 dark:text-purple-300">JSON</span>
                      <span className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950/70 text-[8.5px] font-mono font-bold text-sky-700 dark:text-sky-300">TXT</span>
                    </div>
                  </div>
                </label>
              )}
              {!fileName && (
                <button
                  type="button"
                  onClick={loadSampleSubtitles}
                  className="w-full mt-2.5 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Load Cinematic Demo Subtitles</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1">Translated</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.translated}<span className="text-xs text-zinc-400 dark:text-zinc-500 ml-1">/ {stats.total}</span></p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1">Google Comp</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.google}<span className="text-xs text-zinc-400 dark:text-zinc-500 ml-1">/ {stats.total}</span></p>
              </div>
            </div>

            {/* Active Translation Profile Card */}
            <div className="p-3 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-indigo-500/10 border border-emerald-500/25 dark:border-emerald-500/20 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0 shadow-2xs">
                  <Sliders size={14} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {TARGET_LANGUAGES.find(l => l.code === translationSettings.targetLanguage)?.name || 'Urdu'}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                      {SCRIPT_MODES.find(s => s.id === translationSettings.scriptMode)?.badge || 'اردو'}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                    {TONE_REGISTERS.find(t => t.id === translationSettings.toneRegister)?.label} • {HONORIFIC_OPTIONS.find(h => h.id === translationSettings.honorificRegister)?.label}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTranslationSettingsModalOpen(true)}
                className="px-2.5 py-1.5 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-emerald-700 dark:text-emerald-400 rounded-lg text-[10px] font-bold border border-emerald-300 dark:border-emerald-800 shadow-2xs shrink-0 cursor-pointer transition-all"
              >
                Configure
              </button>
            </div>

            {/* Unified Configuration Fast-Bar */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5 p-1 bg-zinc-100/80 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
                <button
                  type="button"
                  onClick={() => setIsAiConfigOpen(true)}
                  className="flex-1 py-1.5 px-2 bg-white dark:bg-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-600 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer truncate"
                  title="Configure AI model, key, workers, batch, and throttle delay"
                >
                  <Cpu size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="truncate">AI Config</span>
                </button>
                <InfoPopover
                  title="AI Configuration"
                  description="Unified settings for Gemini AI models, authentication keys, parallel worker concurrency, batch sizing, and delay throttling."
                  details={[
                    `Current Model: ${selectedModel}`,
                    `Workers: ${geminiWorkers} threads, Batch: ${geminiBatchSize}`,
                    "Live connection test and latency verification"
                  ]}
                  align="left"
                />
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-zinc-100/80 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
                <button
                  type="button"
                  onClick={() => setIsGoogleSettingsOpen(true)}
                  className="flex-1 py-1.5 px-2 bg-white dark:bg-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-600 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer truncate"
                  title="Configure Google Translate source language, key, workers, and batch"
                >
                  <Languages size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate">Google Config</span>
                </button>
                <InfoPopover
                  title="Google Translate Settings"
                  description="Unified configuration for Google Translate: source language auto-detection, Urdu and English translation parameters, optional API key, and concurrency tuning."
                  details={[
                    "Auto-detect source language to Urdu & English",
                    `Workers: ${googleWorkers}, Batch: ${googleBatchSize}`,
                    "Custom Cloud Translation key support"
                  ]}
                  align="right"
                />
              </div>
            </div>

            <div className="space-y-2">
              {/* AI Translation Button */}
              <div className="flex items-center gap-1.5">
                <div className="flex-1 flex gap-2">
                  <button 
                    onClick={startTranslation} 
                    disabled={isTranslating || subtitles.length === 0} 
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    title="Translate all subtitles using Google Gemini AI"
                  >
                    {isTranslating ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
                    <span>{isTranslating ? `AI: ${translationSpeed} i/s` : stats.translated > 0 ? 'Resume AI Translation' : 'AI Translation'}</span>
                  </button>
                  {isTranslating && (
                    <button 
                      onClick={stopTranslation}
                      className="px-4 bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 rounded-xl font-bold border border-red-200 dark:border-red-800 hover:bg-red-100 transition-all cursor-pointer"
                      title="Stop AI translation immediately"
                    >
                      Stop
                    </button>
                  )}
                </div>
                <InfoPopover
                  title="AI Translation Button"
                  description="Translates the entire subtitle timeline with Google Gemini. Delivers idiomatic Urdu, cultural nuances, proper honorifics, and preserves line breaks."
                  details={[
                    "Selected model: " + selectedModel,
                    "Multi-worker parallel streaming",
                    "Resume anytime without losing completed rows"
                  ]}
                  shortcut="Shift + Enter"
                  align="right"
                />
              </div>

              {/* Google Translate Button */}
              <div className="flex items-center gap-1.5">
                <div className="flex-1 flex gap-2">
                  <button 
                    onClick={translateAllGoogle} 
                    disabled={isGoogleTranslatingAll || subtitles.length === 0} 
                    className="flex-1 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold text-xs border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 relative overflow-hidden cursor-pointer"
                    title="Machine translate all subtitles using Google Translate"
                  >
                    {isGoogleTranslatingAll ? <Loader2 size={14} className="animate-spin" /> : <Languages size={14} />}
                    <span>{isGoogleTranslatingAll ? `Google: ${translationSpeed} i/s` : 'Google Translate'}</span>
                  </button>
                  {isGoogleTranslatingAll && (
                    <button 
                      onClick={stopGoogleTranslate}
                      className="px-3 bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 rounded-xl font-bold text-[10px] border border-red-200 dark:border-red-800 hover:bg-red-100 transition-all cursor-pointer"
                      title="Stop Google translate immediately"
                    >
                      Stop
                    </button>
                  )}
                </div>
                <InfoPopover
                  title="Google Translate Button"
                  description="Fast machine translation engine for all subtitle rows. Auto-detects input language and converts to Urdu or English for rapid draft generation."
                  details={[
                    "High-speed batch translation",
                    "Populates Google Comparison column",
                    "Easily copy or swap with AI in Edit Studio"
                  ]}
                  align="right"
                />
              </div>

              {/* Unified Download Button */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setIsUnifiedDownloadOpen(true)}
                  disabled={subtitles.length === 0}
                  className="flex-1 py-2.5 bg-zinc-900 hover:bg-black text-white dark:bg-zinc-700 dark:hover:bg-zinc-600 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                  title="Unified download menu: Formatted SRT, Plain SRT, ASS, SSA, WebVTT, YouTube, LRC, TXT, JSON"
                >
                  <Download size={14} className="text-emerald-400" />
                  <span>Download Subtitles (All Formats)</span>
                </button>
                <InfoPopover
                  title="Unified Download Button"
                  description="Unified export studio providing all industry formats in one place: Formatted SRT, Plain Clean SRT, Advanced SubStation Alpha (.ass), SubStation Alpha (.ssa), WebVTT (.vtt), YouTube SBV, Mobile Lyrics (.lrc), Android Text (.txt), JSON, and WhatsApp clipboard copy."
                  details={[
                    "Select stream: AI Urdu, Google, or Original",
                    "Full SSA v4 & ASS v4+ formatting support",
                    "Clean plain text or formatted styles"
                  ]}
                  align="right"
                />
              </div>

              {/* Styling Studio Drawer Button */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsStylingDrawerOpen(true)}
                  disabled={subtitles.length === 0}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-indigo-500/15 border border-amber-300 dark:border-amber-700/60 hover:from-amber-500/25 hover:to-indigo-500/25 text-amber-800 dark:text-amber-200 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer disabled:opacity-50"
                  title="Open Gradient Studio: Color gradients and designer palettes"
                >
                  <Palette size={14} className="text-amber-500" />
                  <span>Gradient Studio (Colors & Palettes)</span>
                </button>
                <InfoPopover
                  title="Styling Studio"
                  description="Design beautiful color gradients, karaoke glow animations, typography for English & Urdu, and export stylized subtitles in all formats."
                  details={[
                    "Live simultaneous preview playback",
                    "Built-in cinema & neon presets",
                    "Save and load custom presets"
                  ]}
                  align="right"
                />
              </div>
            </div>
          </div>

          {/* Gemini Usage Quota & Rate Analytics Dashboard */}
          <GeminiQuotaDashboard 
            isTranslating={isTranslating}
            subtitlesCount={subtitles.length}
            untranslatedCount={subtitles.filter(s => !s.translatedText).length}
            geminiBatchSize={geminiBatchSize}
            geminiWorkers={geminiWorkers}
            geminiDelay={geminiDelay}
            hasContext={Boolean(context && context.length > 50)}
            adaptiveScalingEnabled={adaptiveScalingEnabled}
            onToggleAdaptiveScaling={setAdaptiveScalingEnabled}
            activeAdaptiveInfo={activeAdaptiveInfo}
            onUpdateWorkers={setGeminiWorkers}
            onUpdateBatchSize={setGeminiBatchSize}
          />

          {/* Worker Monitor Panel */}
          <AnimatePresence>
            {isWorkerMonitorOpen && (isTranslating || isGoogleTranslatingAll) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 shadow-lg space-y-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-300">Parallel Worker Monitor</span>
                  </div>
                  <button onClick={() => setIsWorkerMonitorOpen(false)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full text-zinc-400"><X size={14} /></button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                  {Object.entries(workerStates).map(([key, state]) => (
                    <div key={key} className="p-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-700/60 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase truncate">{key.split('-').pop()}</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${state.status === 'working' ? 'bg-emerald-500 animate-pulse' : state.status === 'completed' ? 'bg-zinc-300 dark:bg-zinc-600' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
                      </div>
                      {state.currentItem && (
                        <span className="text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300">#{state.currentItem}</span>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Context Editor */}
          <ResizableBox 
            title="Cultural Context" 
            icon={Search} 
            initialHeight={300} 
            minHeight={150}
            actions={
              <button 
                onClick={analyzeSubtitles}
                disabled={isGeneratingContext || !isGeminiConnected || subtitles.length === 0}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 ${
                  analyzeStatus === 'success' ? 'bg-emerald-100 text-emerald-700' :
                  analyzeStatus === 'failed' ? 'bg-red-100 text-red-700' :
                  analyzeStatus === 'loading' ? 'bg-indigo-100 text-indigo-700' :
                  'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                {analyzeStatus === 'loading' ? <Loader2 size={10} className="animate-spin" /> : 
                 analyzeStatus === 'success' ? <Check size={10} /> :
                 analyzeStatus === 'failed' ? <AlertCircle size={10} /> :
                 <SearchCode size={10} />}
                {analyzeStatus === 'loading' ? 'Analyzing...' :
                 analyzeStatus === 'success' ? 'Analyzed!' :
                 analyzeStatus === 'failed' ? 'Failed' :
                 'Analyze Subtitles'}
              </button>
            }
          >
            <textarea 
              value={context} 
              onChange={(e) => setContext(e.target.value)} 
              className="w-full h-full p-6 text-sm leading-relaxed focus:outline-none resize-none bg-transparent font-medium dark:text-white/80"
              placeholder="AI context will appear here..."
            />
          </ResizableBox>

          {/* Custom Prompt Editor */}
          <ResizableBox 
            title="Custom AI Instructions" 
            icon={MessageSquare} 
            initialHeight={200} 
            minHeight={100}
            actions={
              <button onClick={restoreDefaultPrompt} className="text-[9px] font-bold text-emerald-600 hover:underline flex items-center gap-1">
                <RotateCcw size={10} /> Restore Default
              </button>
            }
          >
            <textarea 
              value={customPrompt} 
              onChange={(e) => setCustomPrompt(e.target.value)} 
              className="w-full h-full p-6 text-sm leading-relaxed focus:outline-none resize-none bg-transparent font-medium dark:text-white/80"
              placeholder="Add custom instructions for the AI (e.g. 'Use formal language', 'Keep it funny')..."
            />
          </ResizableBox>
        </div>

        {/* Right Column: Workspace & Logs */}
        <div className="lg:col-span-8 space-y-6 flex flex-col min-h-0">
          
          {/* Workspace */}
          <ResizableBox 
            title="Translation Workspace" 
            icon={Languages} 
            initialHeight={850} 
            minHeight={500} 
            maxHeight={2000}
            isFullScreen={isFullScreen}
            onFullScreenToggle={() => setIsFullScreen(!isFullScreen)}
            actions={
              <div className="flex flex-wrap items-center gap-2 w-full min-w-0">
                {/* Search input with debounced typing */}
                <div className="relative shrink-0">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
                  <input 
                    value={searchInput} 
                    onChange={e => setSearchInput(e.target.value)} 
                    placeholder="Search dialogue..." 
                    className="pl-7 pr-6 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500 w-28 sm:w-36 md:w-44 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  />
                  {searchInput && (
                    <button 
                      onClick={() => setSearchInput('')} 
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      title="Clear search"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Lock / Unlock Direct In-Place Editing Toggle Switch */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !isReadOnly;
                    setIsReadOnly(next);
                    addNotification(next ? "Workspace locked (Read-Only mode)" : "Workspace unlocked: Direct editing enabled", "success");
                    addLog(next ? "Locked workspace to Read-Only mode." : "Unlocked direct in-place editing in translation workspace.", "info");
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer shadow-2xs shrink-0 select-none",
                    isReadOnly
                      ? "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-emerald-500/20"
                  )}
                  title={isReadOnly ? "Editing is locked. Click to unlock direct in-place subtitle editing" : "Editing is unlocked! Click cells to edit. Click to lock read-only mode"}
                >
                  {isReadOnly ? (
                    <>
                      <Lock size={12} className="text-zinc-500 dark:text-zinc-400" />
                      <span>Locked (Read-Only)</span>
                    </>
                  ) : (
                    <>
                      <Unlock size={12} className="text-white animate-pulse" />
                      <span>Editing Unlocked</span>
                    </>
                  )}
                  {/* Visual Toggle Pill Indicator */}
                  <span className={cn(
                    "w-6 h-3.5 rounded-full flex items-center p-0.5 transition-colors ml-0.5",
                    isReadOnly ? "bg-zinc-300 dark:bg-zinc-600 justify-start" : "bg-white/30 justify-end"
                  )}>
                    <span className="w-2.5 h-2.5 rounded-full bg-white shadow-2xs" />
                  </span>
                </button>

                {/* Clustered Editing Toolbar */}
                <div className="flex items-center gap-1 bg-zinc-100/70 dark:bg-zinc-800/60 p-0.5 rounded-xl border border-zinc-200/70 dark:border-zinc-700/60 shadow-2xs shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditor()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10.5px] font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs transition-all cursor-pointer shrink-0"
                    title="Launch dedicated Subtitle Editor Studio for comprehensive editing, splits, and syncing"
                  >
                    <Edit3 size={13} />
                    <span>Edit Subtitles</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFindReplaceOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer shadow-2xs"
                    title="Find and replace text across original or translated subtitles"
                  >
                    <Replace size={12} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Find / Replace</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsTextCleanupOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer shadow-2xs"
                    title="Clean dialogue, fix Urdu punctuation, strip sound cues & tags"
                  >
                    <Wand2 size={12} className="text-purple-500" />
                    <span>Cleanup</span>
                  </button>
                </div>

                {/* Clustered Timing & Synchronization Toolbar */}
                <div className="flex items-center gap-1 bg-zinc-100/70 dark:bg-zinc-800/60 p-0.5 rounded-xl border border-zinc-200/70 dark:border-zinc-700/60 shadow-2xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsTimeShiftOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer shadow-2xs"
                    title="Batch shift subtitle start and end timestamps (forward/backward sync)"
                  >
                    <Clock size={12} className="text-blue-500" />
                    <span>Time Shift</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsGapTimingOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer shadow-2xs"
                    title="Remove time gaps or adjust gap range between consecutive blocks (start times protected)"
                  >
                    <FoldHorizontal size={12} className="text-cyan-500" />
                    <span>Gap Timing</span>
                  </button>
                </div>

                {/* Selection Controls */}
                <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-0.5 shrink-0 shadow-2xs">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    disabled={filteredSubtitles.length === 0}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors cursor-pointer"
                    title={selectedIndices.size === filteredSubtitles.length && filteredSubtitles.length > 0 ? "Deselect all" : "Select all visible subtitles"}
                  >
                    {selectedIndices.size === filteredSubtitles.length && filteredSubtitles.length > 0 ? (
                      <CheckSquare size={12} className="text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Square size={12} className="text-zinc-400" />
                    )}
                    <span>{selectedIndices.size === filteredSubtitles.length && filteredSubtitles.length > 0 ? "All Selected" : "Select All"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={selectUntranslated}
                    disabled={filteredSubtitles.length === 0}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors cursor-pointer"
                    title="Select all segments without AI translations"
                  >
                    <Filter size={11} className="text-indigo-500" />
                    <span>Untranslated ({stats.total - stats.translated})</span>
                  </button>
                </div>

                {/* Selected Action Bar (Appears when 1+ subtitles are selected, wraps within viewport) */}
                {selectedIndices.size > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 bg-emerald-50/95 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800/90 rounded-xl p-1.5 max-w-full shadow-xs animate-in fade-in duration-150">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono text-[9.5px] font-bold shrink-0">
                      {selectedIndices.size} selected
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenEditor()}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[9.5px] font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0"
                      title="Edit selected subtitles in dedicated Studio"
                    >
                      <Edit3 size={11} />
                      <span>Edit in Studio</span>
                    </button>

                    <button
                      type="button"
                      onClick={retrySelectedAI}
                      disabled={isTranslating}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-600/90 hover:bg-emerald-700 text-white text-[9.5px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                      title="Retry AI translation for selected subtitles"
                    >
                      {isTranslating ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                      <span>Retry AI</span>
                    </button>

                    <button
                      type="button"
                      onClick={retrySelectedGoogle}
                      disabled={isGoogleTranslatingAll}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[9.5px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                      title="Translate selected subtitles with Google Machine translation"
                    >
                      {isGoogleTranslatingAll ? <Loader2 size={11} className="animate-spin" /> : <Languages size={11} />}
                      <span>Retry Google</span>
                    </button>

                    <button
                      type="button"
                      onClick={retrySelectedBoth}
                      disabled={isTranslating || isGoogleTranslatingAll}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[9.5px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                      title="Retry both AI and Google translations for selected subtitles"
                    >
                      {(isTranslating || isGoogleTranslatingAll) ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                      <span>Retry Both</span>
                    </button>

                    {/* Stream-Specific Clear / Delete Options (Preserves Timestamps & Block Numbers) */}
                    <button
                      type="button"
                      onClick={clearSelectedTranslations}
                      className="px-2 py-1 text-[9.5px] font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-amber-300/60 dark:border-amber-800/60 rounded transition-colors cursor-pointer shrink-0"
                      title="Clear AI translation stream for selected subtitles (keeps timestamps & block # intact)"
                    >
                      Clear AI Stream
                    </button>

                    <button
                      type="button"
                      onClick={clearSelectedGoogleTranslations}
                      className="px-2 py-1 text-[9.5px] font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-300/60 dark:border-blue-800/60 rounded transition-colors cursor-pointer shrink-0"
                      title="Clear Google translation stream for selected subtitles (keeps timestamps & block # intact)"
                    >
                      Clear Google Stream
                    </button>

                    <button
                      type="button"
                      onClick={clearSelectedBothTranslations}
                      className="px-2 py-1 text-[9.5px] font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-purple-300/60 dark:border-purple-800/60 rounded transition-colors cursor-pointer shrink-0"
                      title="Clear all translations for selected subtitles (keeps original text, timestamps & block # intact)"
                    >
                      Clear Both
                    </button>

                    {/* Full Segment/Block Deletion (Removes Entire Subtitle Segment - 2-step click confirmation without window.confirm) */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isConfirmingBatchDeleteWorkspace) {
                          deleteSelectedSubtitles();
                          setIsConfirmingBatchDeleteWorkspace(false);
                        } else {
                          setIsConfirmingBatchDeleteWorkspace(true);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 text-[9.5px] font-bold rounded transition-all cursor-pointer shrink-0 shadow-2xs",
                        isConfirmingBatchDeleteWorkspace
                          ? "bg-red-600 hover:bg-red-700 text-white border border-red-700 animate-pulse"
                          : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60"
                      )}
                      title={isConfirmingBatchDeleteWorkspace ? "Click again to confirm deletion" : "Delete entire subtitle block(s) including timestamps and sequence #"}
                    >
                      <Trash2 size={11} />
                      <span>{isConfirmingBatchDeleteWorkspace ? `Confirm Delete (${selectedIndices.size})?` : "Delete Block / Row"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedIndices(new Set());
                        setIsConfirmingBatchDeleteWorkspace(false);
                      }}
                      className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded cursor-pointer shrink-0"
                      title="Clear selection"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* COMMON CONTROLS (Visible in both Read-Only & Edit Mode) */}
                {/* Columns Visibility Menu */}
                <div ref={columnMenuRef} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => { setIsColumnMenuOpen(prev => !prev); setIsTextResizeOpen(false); setIsFontsOpen(false); }}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border cursor-pointer shadow-2xs",
                      isColumnMenuOpen
                        ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-600 dark:text-emerald-300"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    )}
                    title="Show or hide table columns in workspace"
                  >
                    <Columns size={12} className="text-zinc-500" />
                    <span>Columns</span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/5 dark:bg-white/10 font-bold">
                      {[visibleColumns.original, visibleColumns.ai, visibleColumns.google].filter(Boolean).length}/3
                    </span>
                  </button>

                  {isColumnMenuOpen && (
                    <div className="absolute top-full right-0 sm:right-auto sm:left-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl p-3.5 z-[70] space-y-2.5">
                      <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100 dark:border-zinc-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Workspace Columns</span>
                        <button type="button" onClick={() => setIsColumnMenuOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 cursor-pointer">
                          <X size={13} />
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={visibleColumns.time}
                            onChange={e => setVisibleColumns(prev => ({ ...prev, time: e.target.checked }))}
                            className="accent-emerald-600 rounded cursor-pointer w-3.5 h-3.5"
                          />
                          <span>Time & CPS Rate</span>
                        </label>
                        <label className={cn(
                          "flex items-center gap-2 p-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors",
                          visibleColumns.original ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200" : "hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                        )}>
                          <input
                            type="checkbox"
                            checked={visibleColumns.original}
                            onChange={e => setVisibleColumns(prev => ({ ...prev, original: e.target.checked }))}
                            className="accent-emerald-600 rounded cursor-pointer w-3.5 h-3.5"
                          />
                          <span>Original Language (Source)</span>
                        </label>
                        <label className={cn(
                          "flex items-center gap-2 p-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors",
                          visibleColumns.ai ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200" : "hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                        )}>
                          <input
                            type="checkbox"
                            checked={visibleColumns.ai}
                            onChange={e => setVisibleColumns(prev => ({ ...prev, ai: e.target.checked }))}
                            className="accent-emerald-600 rounded cursor-pointer w-3.5 h-3.5"
                          />
                          <span>AI Translated Language</span>
                        </label>
                        <label className={cn(
                          "flex items-center gap-2 p-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors",
                          visibleColumns.google ? "bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200" : "hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                        )}>
                          <input
                            type="checkbox"
                            checked={visibleColumns.google}
                            onChange={e => setVisibleColumns(prev => ({ ...prev, google: e.target.checked }))}
                            className="accent-blue-600 rounded cursor-pointer w-3.5 h-3.5"
                          />
                          <span>Google Translation</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Translation Language & Script Settings Button */}
                <button
                  type="button"
                  onClick={() => setIsTranslationSettingsModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 transition-colors cursor-pointer shrink-0 shadow-2xs"
                  title="Configure Target Language, Script & Bilingual Mode, Tone, and Formatting"
                >
                  <Sliders size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">Settings:</span>
                  <span className="font-mono text-[9px] bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold">
                    {SCRIPT_MODES.find(s => s.id === translationSettings.scriptMode)?.badge || 'اردو'}
                  </span>
                </button>

                {/* Text Resize Button & Menu */}
                <div ref={textResizeRef} className="relative shrink-0 text-resize-menu-container">
                  <button 
                    type="button"
                    onClick={handleToggleTextResize}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border cursor-pointer shadow-2xs",
                      isTextResizeOpen 
                        ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-600 dark:text-emerald-300" 
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    )}
                    title="Adjust text scale for original and translated subtitle streams"
                  >
                    <TypeIcon size={13} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="hidden sm:inline">Text Resize</span>
                    <span className="sm:hidden">Resize</span>
                  </button>
                  
                  {isTextResizeOpen && (() => {
                    const isTextResizeDirty = 
                      draftOriginalFontSize !== originalFontSize ||
                      draftTranslatedFontSize !== translatedFontSize ||
                      draftGoogleFontSize !== googleFontSize ||
                      draftGlobalFontSize !== globalFontSize;

                    const activeEffectiveOriginalFont = isGlobalFontActive ? globalFont : originalFont;
                    const activeEffectiveAiFont = isGlobalFontActive ? globalFont : urduFont;
                    const activeEffectiveGoogleFont = isGlobalFontActive ? globalFont : googleFont;

                    return (
                      <div 
                        style={textResizePopoverStyle || undefined}
                        className={cn(
                          "fixed bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl p-4 z-[80] flex flex-col overflow-hidden",
                          !textResizePopoverStyle && "top-20 left-4 right-4 sm:left-auto sm:right-auto sm:w-[520px] max-w-[calc(100vw-24px)] max-h-[82vh]"
                        )}
                      >
                        {/* Header (Sticky / Shrink-0) */}
                        <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                          <div className="flex items-center gap-2">
                            <TypeIcon size={16} className="text-emerald-600 dark:text-emerald-400" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                              Text Resize & Sizing
                            </span>
                            {isTextResizeDirty ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                Draft (Unapplied)
                              </span>
                            ) : (
                              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                                In Sync
                              </span>
                            )}
                          </div>
                          <button 
                            type="button" 
                            onClick={handleCancelTextResize} 
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Close (Discard Unapplied Draft)"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        {/* Fixed 3-Streams Preview Header (Sticky / Shrink-0) */}
                        <div className="my-3 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 shrink-0 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Eye size={12} className="text-emerald-600 dark:text-emerald-400" />
                              <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                                Live 3-Streams Preview (Source, AI, Google)
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setPreviewDisplayMode(m => m === 'rendered' ? 'plain' : 'rendered')}
                                className="text-[8.5px] px-1.5 py-0.5 rounded font-mono font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer shadow-2xs"
                                title="Toggle between rendered formatting and plain stripped text"
                              >
                                {previewDisplayMode === 'rendered' ? 'Rendered' : 'Plain Text'}
                              </button>
                              <span className="text-[8.5px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                Draft Scale
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {/* 1. Source / Original Stream */}
                            <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between overflow-hidden min-h-[58px]">
                              <div className="flex items-center justify-between text-[8.5px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                                <span>1. Source</span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{draftOriginalFontSize}px</span>
                              </div>
                              <div 
                                className="text-zinc-800 dark:text-zinc-200 truncate leading-tight select-text"
                                style={{ 
                                  fontFamily: activeEffectiveOriginalFont, 
                                  fontSize: `${draftOriginalFontSize}px` 
                                }}
                                title={previewSource.plain}
                              >
                                {previewDisplayMode === 'rendered' && previewSource.hasHtmlFormatting ? (
                                  <span dangerouslySetInnerHTML={{ __html: previewSource.html }} />
                                ) : (
                                  previewSource.plain
                                )}
                              </div>
                            </div>

                            {/* 2. AI Translation Stream */}
                            <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between overflow-hidden min-h-[58px]">
                              <div className="flex items-center justify-between text-[8.5px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                                <span>2. AI (Urdu)</span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{draftTranslatedFontSize}px</span>
                              </div>
                              <div 
                                className="text-zinc-900 dark:text-zinc-100 font-urdu text-right truncate leading-tight select-text"
                                style={{ 
                                  fontFamily: activeEffectiveAiFont, 
                                  fontSize: `${draftTranslatedFontSize}px` 
                                }}
                                dir="rtl"
                                title={previewAi.plain}
                              >
                                {previewDisplayMode === 'rendered' && previewAi.hasHtmlFormatting ? (
                                  <span dangerouslySetInnerHTML={{ __html: previewAi.html }} />
                                ) : (
                                  previewAi.plain
                                )}
                              </div>
                            </div>

                            {/* 3. Google Translation Stream */}
                            <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between overflow-hidden min-h-[58px]">
                              <div className="flex items-center justify-between text-[8.5px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                                <span>3. Google</span>
                                <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{draftGoogleFontSize}px</span>
                              </div>
                              <div 
                                className="text-zinc-900 dark:text-zinc-100 font-urdu text-right truncate leading-tight select-text"
                                style={{ 
                                  fontFamily: activeEffectiveGoogleFont, 
                                  fontSize: `${draftGoogleFontSize}px` 
                                }}
                                dir="rtl"
                                title={previewGoogle.plain}
                              >
                                {previewDisplayMode === 'rendered' && previewGoogle.hasHtmlFormatting ? (
                                  <span dangerouslySetInnerHTML={{ __html: previewGoogle.html }} />
                                ) : (
                                  previewGoogle.plain
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Scrollable Adjustments Body */}
                        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 min-h-0">
                          {/* Column Visibility Checkboxes */}
                          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                Workspace Columns Rendered
                              </span>
                              <span className="text-[8.5px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                                {[visibleColumns.original && 'Original', visibleColumns.ai && 'AI', visibleColumns.google && 'Google'].filter(Boolean).length}/3 Active
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                              <label className={cn(
                                "flex items-center gap-2 p-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors select-none",
                                visibleColumns.original 
                                  ? "bg-emerald-50/80 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-200" 
                                  : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300"
                              )}>
                                <input
                                  type="checkbox"
                                  checked={visibleColumns.original}
                                  onChange={e => setVisibleColumns(prev => ({ ...prev, original: e.target.checked }))}
                                  className="accent-emerald-600 rounded w-3.5 h-3.5 cursor-pointer"
                                />
                                <span className="truncate">Source</span>
                              </label>

                              <label className={cn(
                                "flex items-center gap-2 p-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors select-none",
                                visibleColumns.ai 
                                  ? "bg-emerald-50/80 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-200" 
                                  : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300"
                              )}>
                                <input
                                  type="checkbox"
                                  checked={visibleColumns.ai}
                                  onChange={e => setVisibleColumns(prev => ({ ...prev, ai: e.target.checked }))}
                                  className="accent-emerald-600 rounded w-3.5 h-3.5 cursor-pointer"
                                />
                                <span className="truncate">AI Translation</span>
                              </label>

                              <label className={cn(
                                "flex items-center gap-2 p-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors select-none",
                                visibleColumns.google 
                                  ? "bg-blue-50/80 border-blue-300 text-blue-900 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-200" 
                                  : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300"
                              )}>
                                <input
                                  type="checkbox"
                                  checked={visibleColumns.google}
                                  onChange={e => setVisibleColumns(prev => ({ ...prev, google: e.target.checked }))}
                                  className="accent-blue-600 rounded w-3.5 h-3.5 cursor-pointer"
                                />
                                <span className="truncate">Google Translation</span>
                              </label>
                            </div>
                          </div>

                          {/* Stream Sizing Sliders (Updating Draft Memory) */}
                          <div className="space-y-3">
                            {/* Global Sync Scale Slider */}
                            <div className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-1.5">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5">
                                  <Globe size={13} className="text-indigo-600 dark:text-indigo-400" />
                                  <label className="text-[10px] font-bold text-indigo-900 dark:text-indigo-200">Global Synchronized Scale (All Streams)</label>
                                </div>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-700">{draftGlobalFontSize}px</span>
                              </div>
                              <input 
                                type="range" min="12" max="44" step="1"
                                value={draftGlobalFontSize} 
                                onChange={e => {
                                  const val = Number(e.target.value);
                                  setDraftGlobalFontSize(val);
                                  setDraftOriginalFontSize(Math.max(10, Math.round(val * 0.75)));
                                  setDraftTranslatedFontSize(val);
                                  setDraftGoogleFontSize(Math.max(10, Math.round(val * 0.75)));
                                }}
                                className="w-full accent-indigo-600 cursor-pointer"
                              />
                            </div>

                            {/* Source Stream Slider */}
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                                  <span>1. Source / Original Stream Size</span>
                                  {visibleColumns.original && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Visible in workspace" />}
                                </label>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-emerald-700 dark:text-emerald-300 font-bold">{draftOriginalFontSize}px</span>
                              </div>
                              <input 
                                type="range" min="10" max="42" step="1"
                                value={draftOriginalFontSize} 
                                onChange={e => setDraftOriginalFontSize(Number(e.target.value))}
                                className="w-full accent-emerald-500 cursor-pointer"
                              />
                            </div>

                            {/* AI Translation Stream Slider */}
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                                  <span>2. AI Translation Stream Size</span>
                                  {visibleColumns.ai && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Visible in workspace" />}
                                </label>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 font-bold">{draftTranslatedFontSize}px</span>
                              </div>
                              <input 
                                type="range" min="12" max="52" step="1"
                                value={draftTranslatedFontSize} 
                                onChange={e => setDraftTranslatedFontSize(Number(e.target.value))}
                                className="w-full accent-emerald-500 cursor-pointer"
                              />
                            </div>

                            {/* Google Translation Stream Slider */}
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                                  <span>3. Google Translation Stream Size</span>
                                  {visibleColumns.google && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Visible in workspace" />}
                                </label>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-bold">{draftGoogleFontSize}px</span>
                              </div>
                              <input 
                                type="range" min="10" max="42" step="1"
                                value={draftGoogleFontSize} 
                                onChange={e => setDraftGoogleFontSize(Number(e.target.value))}
                                className="w-full accent-blue-500 cursor-pointer"
                              />
                            </div>
                          </div>

                          {/* Quick Presets */}
                          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Presets:</span>
                            <div className="flex items-center gap-1 flex-wrap">
                              <button
                                type="button"
                                onClick={() => { setDraftOriginalFontSize(12); setDraftTranslatedFontSize(18); setDraftGoogleFontSize(13); setDraftGlobalFontSize(18); }}
                                className="px-2 py-0.5 text-[9.5px] font-bold rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                              >
                                Compact
                              </button>
                              <button
                                type="button"
                                onClick={() => { setDraftOriginalFontSize(14); setDraftTranslatedFontSize(22); setDraftGoogleFontSize(15); setDraftGlobalFontSize(22); }}
                                className="px-2 py-0.5 text-[9.5px] font-bold rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                              >
                                Standard
                              </button>
                              <button
                                type="button"
                                onClick={() => { setDraftOriginalFontSize(17); setDraftTranslatedFontSize(28); setDraftGoogleFontSize(18); setDraftGlobalFontSize(28); }}
                                className="px-2 py-0.5 text-[9.5px] font-bold rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                              >
                                Cinema
                              </button>
                              <button
                                type="button"
                                onClick={() => { setDraftOriginalFontSize(20); setDraftTranslatedFontSize(34); setDraftGoogleFontSize(21); setDraftGlobalFontSize(34); }}
                                className="px-2 py-0.5 text-[9.5px] font-bold rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                              >
                                Large
                              </button>
                              <button
                                type="button"
                                onClick={() => { setDraftOriginalFontSize(24); setDraftTranslatedFontSize(40); setDraftGoogleFontSize(24); setDraftGlobalFontSize(40); }}
                                className="px-2 py-0.5 text-[9.5px] font-bold rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                              >
                                Ultra
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Sticky Action Footer: Reset Draft, Cancel, Apply */}
                        <div className="pt-3 mt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setDraftOriginalFontSize(originalFontSize);
                              setDraftTranslatedFontSize(translatedFontSize);
                              setDraftGoogleFontSize(googleFontSize);
                              setDraftGlobalFontSize(globalFontSize);
                            }}
                            disabled={!isTextResizeDirty}
                            className="px-2.5 py-1.5 text-[10px] font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                          >
                            Reset Draft
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleCancelTextResize}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleApplyTextResize}
                              className={cn(
                                "px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs",
                                isTextResizeDirty
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                                  : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-300 dark:hover:bg-zinc-700"
                              )}
                            >
                              <Check size={13} />
                              <span>Apply to Workspace</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Fonts Button & Menu */}
                <div ref={fontsRef} className="relative shrink-0 fonts-menu-container">
                  <button 
                    type="button"
                    onClick={handleToggleFonts}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border cursor-pointer shadow-2xs",
                      isFontsOpen 
                        ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-600 dark:text-emerald-300" 
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    )}
                    title="Select font family for original and translated subtitle streams"
                  >
                    <Languages size={13} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Fonts</span>
                  </button>
                  
                  {isFontsOpen && (() => {
                    const isFontsDirty = 
                      draftOriginalFont !== originalFont ||
                      draftUrduFont !== urduFont ||
                      draftGoogleFont !== googleFont ||
                      draftGlobalFont !== globalFont ||
                      draftIsGlobalFontActive !== isGlobalFontActive ||
                      draftFontTarget !== fontTarget;

                    const effectiveDraftOriginalFont = draftIsGlobalFontActive ? draftGlobalFont : draftOriginalFont;
                    const effectiveDraftAiFont = draftIsGlobalFontActive ? draftGlobalFont : draftUrduFont;
                    const effectiveDraftGoogleFont = draftIsGlobalFontActive ? draftGlobalFont : draftGoogleFont;

                    const getFontLabel = (val: string) => {
                      const urdu = URDU_FONT_OPTIONS.find(f => f.value === val);
                      if (urdu) return urdu.name;
                      const eng = ENGLISH_FONT_OPTIONS.find(f => f.value === val);
                      if (eng) return eng.name;
                      const loc = localFonts.find(f => f.value === val);
                      if (loc) return loc.name;
                      return val.split(',')[0].replace(/['"]/g, '').trim() || 'Custom';
                    };

                    const isFontActive = (val: string) => {
                      if (draftFontTarget === 'global') {
                        return draftIsGlobalFontActive && draftGlobalFont === val;
                      }
                      if (draftFontTarget === 'original') return draftOriginalFont === val;
                      if (draftFontTarget === 'ai') return draftUrduFont === val;
                      if (draftFontTarget === 'google') return draftGoogleFont === val;
                      return false;
                    };

                    return (
                      <div 
                        style={fontsPopoverStyle || undefined}
                        className={cn(
                          "fixed bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl p-4 z-[80] flex flex-col overflow-hidden",
                          !fontsPopoverStyle && "top-20 left-4 right-4 sm:left-auto sm:right-auto sm:w-[620px] max-w-[calc(100vw-24px)] max-h-[85vh]"
                        )}
                      >
                        {/* Header (Sticky / Shrink-0) */}
                        <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                          <div className="flex items-center gap-2">
                            <Languages size={16} className="text-emerald-600 dark:text-emerald-400" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                              Workspace Typography & Fonts
                            </span>
                            {isFontsDirty ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                Draft (Unapplied)
                              </span>
                            ) : (
                              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                                In Sync
                              </span>
                            )}
                          </div>
                          <button 
                            type="button" 
                            onClick={handleCancelFonts} 
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Close (Discard Unapplied Draft)"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        {/* Fixed 3-Streams Preview Header (Sticky / Shrink-0) */}
                        <div className="my-3 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 shrink-0 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Eye size={12} className="text-emerald-600 dark:text-emerald-400" />
                              <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                                Live 3-Streams Preview (Source, AI, Google)
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setPreviewDisplayMode(m => m === 'rendered' ? 'plain' : 'rendered')}
                                className="text-[8.5px] px-1.5 py-0.5 rounded font-mono font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer shadow-2xs"
                                title="Toggle between rendered formatting and plain stripped text"
                              >
                                {previewDisplayMode === 'rendered' ? 'Rendered' : 'Plain Text'}
                              </button>
                              <span className="text-[8.5px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                Draft Fonts
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {/* 1. Source / Original Stream */}
                            <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between overflow-hidden min-h-[62px]">
                              <div className="flex items-center justify-between text-[8.5px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                                <span>1. Source</span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[90px]" title={getFontLabel(effectiveDraftOriginalFont)}>
                                  {getFontLabel(effectiveDraftOriginalFont)}
                                </span>
                              </div>
                              <div 
                                className="text-zinc-800 dark:text-zinc-200 truncate leading-tight select-text"
                                style={{ 
                                  fontFamily: effectiveDraftOriginalFont, 
                                  fontSize: `${originalFontSize}px` 
                                }}
                                title={previewSource.plain}
                              >
                                {previewDisplayMode === 'rendered' && previewSource.hasHtmlFormatting ? (
                                  <span dangerouslySetInnerHTML={{ __html: previewSource.html }} />
                                ) : (
                                  previewSource.plain
                                )}
                              </div>
                            </div>

                            {/* 2. AI Translation Stream */}
                            <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between overflow-hidden min-h-[62px]">
                              <div className="flex items-center justify-between text-[8.5px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                                <span>2. AI (Urdu)</span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[90px]" title={getFontLabel(effectiveDraftAiFont)}>
                                  {getFontLabel(effectiveDraftAiFont)}
                                </span>
                              </div>
                              <div 
                                className="text-zinc-900 dark:text-zinc-100 font-urdu text-right truncate leading-tight select-text"
                                style={{ 
                                  fontFamily: effectiveDraftAiFont, 
                                  fontSize: `${translatedFontSize}px` 
                                }}
                                dir="rtl"
                                title={previewAi.plain}
                              >
                                {previewDisplayMode === 'rendered' && previewAi.hasHtmlFormatting ? (
                                  <span dangerouslySetInnerHTML={{ __html: previewAi.html }} />
                                ) : (
                                  previewAi.plain
                                )}
                              </div>
                            </div>

                            {/* 3. Google Translation Stream */}
                            <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between overflow-hidden min-h-[62px]">
                              <div className="flex items-center justify-between text-[8.5px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                                <span>3. Google</span>
                                <span className="font-mono text-blue-600 dark:text-blue-400 font-bold truncate max-w-[90px]" title={getFontLabel(effectiveDraftGoogleFont)}>
                                  {getFontLabel(effectiveDraftGoogleFont)}
                                </span>
                              </div>
                              <div 
                                className="text-zinc-900 dark:text-zinc-100 font-urdu text-right truncate leading-tight select-text"
                                style={{ 
                                  fontFamily: effectiveDraftGoogleFont, 
                                  fontSize: `${googleFontSize}px` 
                                }}
                                dir="rtl"
                                title={previewGoogle.plain}
                              >
                                {previewDisplayMode === 'rendered' && previewGoogle.hasHtmlFormatting ? (
                                  <span dangerouslySetInnerHTML={{ __html: previewGoogle.html }} />
                                ) : (
                                  previewGoogle.plain
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Scrollable Adjustments Body */}
                        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 min-h-0">
                          {/* Column Visibility Checkboxes */}
                          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                Workspace Columns Rendered
                              </span>
                              <span className="text-[8.5px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                                {[visibleColumns.original && 'Original', visibleColumns.ai && 'AI', visibleColumns.google && 'Google'].filter(Boolean).length}/3 Active
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                              <label className={cn(
                                "flex items-center gap-2 p-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors select-none",
                                visibleColumns.original 
                                  ? "bg-emerald-50/80 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-200" 
                                  : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300"
                              )}>
                                <input
                                  type="checkbox"
                                  checked={visibleColumns.original}
                                  onChange={e => setVisibleColumns(prev => ({ ...prev, original: e.target.checked }))}
                                  className="accent-emerald-600 rounded w-3.5 h-3.5 cursor-pointer"
                                />
                                <span className="truncate">Source</span>
                              </label>

                              <label className={cn(
                                "flex items-center gap-2 p-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors select-none",
                                visibleColumns.ai 
                                  ? "bg-emerald-50/80 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-200" 
                                  : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300"
                              )}>
                                <input
                                  type="checkbox"
                                  checked={visibleColumns.ai}
                                  onChange={e => setVisibleColumns(prev => ({ ...prev, ai: e.target.checked }))}
                                  className="accent-emerald-600 rounded w-3.5 h-3.5 cursor-pointer"
                                />
                                <span className="truncate">AI Translation</span>
                              </label>

                              <label className={cn(
                                "flex items-center gap-2 p-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors select-none",
                                visibleColumns.google 
                                  ? "bg-blue-50/80 border-blue-300 text-blue-900 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-200" 
                                  : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300"
                              )}>
                                <input
                                  type="checkbox"
                                  checked={visibleColumns.google}
                                  onChange={e => setVisibleColumns(prev => ({ ...prev, google: e.target.checked }))}
                                  className="accent-blue-600 rounded w-3.5 h-3.5 cursor-pointer"
                                />
                                <span className="truncate">Google Translation</span>
                              </label>
                            </div>
                          </div>

                          {/* Target Subtitle Stream Selector */}
                          <div className="space-y-1.5">
                            <label className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                              Apply Selected Font To:
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                              <button
                                type="button"
                                onClick={() => setDraftFontTarget('global')}
                                className={cn(
                                  "px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer",
                                  draftFontTarget === 'global'
                                    ? "bg-indigo-600 text-white shadow-xs"
                                    : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                                )}
                              >
                                <Globe size={11} />
                                <span>Global (All)</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDraftFontTarget('original')}
                                className={cn(
                                  "px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer",
                                  draftFontTarget === 'original'
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                                )}
                              >
                                <span>Source</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDraftFontTarget('ai')}
                                className={cn(
                                  "px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer",
                                  draftFontTarget === 'ai'
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                                )}
                              >
                                <span>AI Urdu</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDraftFontTarget('google')}
                                className={cn(
                                  "px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer",
                                  draftFontTarget === 'google'
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                                )}
                              >
                                <span>Google</span>
                              </button>
                            </div>
                            {draftFontTarget === 'global' && draftIsGlobalFontActive && (
                              <div className="flex items-center justify-between p-1.5 px-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg border border-indigo-200 dark:border-indigo-800 text-[10px] text-indigo-700 dark:text-indigo-300 font-medium">
                                <span>🌐 Global font active across all streams</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDraftIsGlobalFontActive(false);
                                  }}
                                  className="text-[9px] underline font-bold hover:text-indigo-900 dark:hover:text-indigo-100 cursor-pointer"
                                >
                                  Use Individual Fonts
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Typography Tabs: English, Urdu, My Local Fonts */}
                          <div>
                            <div className="flex border-b border-zinc-200 dark:border-zinc-700 mb-2.5">
                              <button
                                type="button"
                                onClick={() => setFontsActiveTab('urdu')}
                                className={cn(
                                  "flex-1 pb-2 text-[11px] font-bold transition-colors border-b-2 text-center cursor-pointer",
                                  fontsActiveTab === 'urdu'
                                    ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                                )}
                              >
                                اردو Urdu Fonts ({URDU_FONT_OPTIONS.length})
                              </button>
                              <button
                                type="button"
                                onClick={() => setFontsActiveTab('english')}
                                className={cn(
                                  "flex-1 pb-2 text-[11px] font-bold transition-colors border-b-2 text-center cursor-pointer",
                                  fontsActiveTab === 'english'
                                    ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                                )}
                              >
                                English Fonts ({ENGLISH_FONT_OPTIONS.length})
                              </button>
                              <button
                                type="button"
                                onClick={() => setFontsActiveTab('local')}
                                className={cn(
                                  "flex-1 pb-2 text-[11px] font-bold transition-colors border-b-2 text-center cursor-pointer",
                                  fontsActiveTab === 'local'
                                    ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                                )}
                              >
                                My Local Fonts ({localFonts.length})
                              </button>
                            </div>

                            {/* Tab 1: Urdu Fonts */}
                            {fontsActiveTab === 'urdu' && (
                              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                                {URDU_FONT_OPTIONS.map((f) => {
                                  const isActive = isFontActive(f.value);
                                  return (
                                    <button
                                      key={f.name}
                                      type="button"
                                      onClick={() => applyFontSelectionDraft(f.name, f.value)}
                                      className={cn(
                                        "w-full text-left p-2.5 rounded-xl border transition-all flex flex-col gap-1 cursor-pointer",
                                        isActive
                                          ? "bg-emerald-50/90 border-emerald-400 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-600 dark:text-emerald-200 shadow-2xs"
                                          : "bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/60 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                                      )}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold">{f.name}</span>
                                        {isActive && <Check size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />}
                                      </div>
                                      <div 
                                        className="text-right text-base text-zinc-900 dark:text-zinc-100 font-urdu py-0.5"
                                        style={{ fontFamily: f.value }}
                                        dir="rtl"
                                      >
                                        {f.previewText || 'ہر بات میں ایک گہرا احساس چھپا ہے'}
                                      </div>
                                      {f.description && (
                                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500">{f.description}</span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Tab 2: English Fonts */}
                            {fontsActiveTab === 'english' && (
                              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                                {ENGLISH_FONT_OPTIONS.map((f) => {
                                  const isActive = isFontActive(f.value);
                                  return (
                                    <button
                                      key={f.name}
                                      type="button"
                                      onClick={() => applyFontSelectionDraft(f.name, f.value)}
                                      className={cn(
                                        "w-full text-left p-2.5 rounded-xl border transition-all flex flex-col gap-1 cursor-pointer",
                                        isActive
                                          ? "bg-emerald-50/90 border-emerald-400 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-600 dark:text-emerald-200 shadow-2xs"
                                          : "bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/60 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                                      )}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold">{f.name}</span>
                                        {isActive && <Check size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />}
                                      </div>
                                      <div 
                                        className="text-left text-sm text-zinc-900 dark:text-zinc-100 py-0.5"
                                        style={{ fontFamily: f.value }}
                                      >
                                        {f.previewText || 'Cinematic Dialogue & Narrative Flow'}
                                      </div>
                                      {f.description && (
                                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500">{f.description}</span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Tab 3: My Local Fonts */}
                            {fontsActiveTab === 'local' && (
                              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                                {/* Add Custom / Upload Font Controls */}
                                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2">
                                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                                    Add Custom Font for Source & Subtitles
                                  </span>
                                  
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      placeholder="System Font Name (e.g. Arial, SF Pro, Nafees)"
                                      value={customFontInputName}
                                      onChange={e => setCustomFontInputName(e.target.value)}
                                      onKeyDown={e => { if (e.key === 'Enter') handleAddNamedFont(); }}
                                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    />
                                    <button
                                      type="button"
                                      onClick={handleAddNamedFont}
                                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 cursor-pointer transition-colors shadow-2xs"
                                    >
                                      + Add
                                    </button>
                                  </div>

                                  {/* Upload Font File Button */}
                                  <label className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg border border-dashed border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 hover:bg-emerald-100/60 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs cursor-pointer transition-colors">
                                    <Upload size={12} className={isUploadingFont ? "animate-bounce" : ""} />
                                    <span>{isUploadingFont ? "Loading Font..." : "Upload Font File (.ttf, .otf, .woff, .woff2)"}</span>
                                    <input
                                      type="file"
                                      accept=".ttf,.otf,.woff,.woff2,font/*"
                                      onChange={handleUploadFontFile}
                                      className="hidden"
                                      disabled={isUploadingFont}
                                    />
                                  </label>
                                </div>

                                {/* Saved Local Fonts List */}
                                <div className="space-y-1.5">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block">
                                    Saved Local Fonts ({localFonts.length})
                                  </span>
                                  {localFonts.length === 0 ? (
                                    <div className="text-center py-4 text-zinc-400 text-xs italic">
                                      No local fonts added yet. Type a system font name or upload a .ttf/.otf file above.
                                    </div>
                                  ) : (
                                    localFonts.map((f) => {
                                      const isActive = isFontActive(f.value);
                                      return (
                                        <div
                                          key={f.id}
                                          onClick={() => applyFontSelectionDraft(f.name, f.value)}
                                          className={cn(
                                            "w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer group",
                                            isActive
                                              ? "bg-emerald-50/90 border-emerald-400 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-600 dark:text-emerald-200 shadow-2xs"
                                              : "bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/60 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                                          )}
                                        >
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-[11px] font-bold truncate">{f.name}</span>
                                              {f.isUploaded && (
                                                <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                                  Uploaded
                                                </span>
                                              )}
                                            </div>
                                            <div 
                                              className="text-xs text-zinc-700 dark:text-zinc-300 truncate mt-0.5"
                                              style={{ fontFamily: f.value }}
                                            >
                                              The quick brown fox jumps over the lazy dog • ہر بات میں احساس
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-1 shrink-0">
                                            {isActive && <Check size={14} className="text-emerald-600 dark:text-emerald-400" />}
                                            <button
                                              type="button"
                                              onClick={(e) => handleDeleteLocalFont(f.id, e)}
                                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-red-500 hover:text-red-700 transition-opacity"
                                              title="Remove custom font"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Sticky Action Footer: Reset Draft, Cancel, Apply */}
                        <div className="pt-3 mt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setDraftOriginalFont(originalFont);
                              setDraftUrduFont(urduFont);
                              setDraftGoogleFont(googleFont);
                              setDraftGlobalFont(globalFont);
                              setDraftIsGlobalFontActive(isGlobalFontActive);
                              setDraftFontTarget(fontTarget);
                            }}
                            disabled={!isFontsDirty}
                            className="px-2.5 py-1.5 text-[10px] font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                          >
                            Reset Draft
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleCancelFonts}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleApplyFonts}
                              className={cn(
                                "px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs",
                                isFontsDirty
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                                  : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-300 dark:hover:bg-zinc-700"
                              )}
                            >
                              <Check size={13} />
                              <span>Apply to Workspace</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Reset, Undo, Redo & Workspace Tools Dropdown Menu */}
                <div ref={workspaceToolsRef} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsWorkspaceToolsOpen(prev => !prev);
                      setIsTextResizeOpen(false);
                      setIsFontsOpen(false);
                      setIsColumnMenuOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer shadow-2xs shrink-0",
                      isWorkspaceToolsOpen
                        ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-600 dark:text-emerald-300"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    )}
                    title="Undo, Redo, Reset Baseline & Workspace Tools"
                  >
                    <History size={12} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Tools</span>
                    <ChevronDown size={11} className={cn("transition-transform", isWorkspaceToolsOpen && "rotate-180")} />
                  </button>

                  {isWorkspaceToolsOpen && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl p-2.5 z-[90] space-y-1.5 animate-in fade-in duration-150">
                      <div className="px-2 py-1 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                          Workspace Tools & History
                        </span>
                        <span className="text-[9px] font-mono text-zinc-400">
                          Step {Math.max(0, historyIndex)} of {Math.max(0, history.length - 1)}
                        </span>
                      </div>

                      {/* Undo / Redo Row */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            handleUndo();
                            setIsWorkspaceToolsOpen(false);
                          }}
                          disabled={historyIndex <= 0}
                          className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 text-[10.5px] font-bold transition-colors cursor-pointer"
                          title="Undo last change (Ctrl+Z)"
                        >
                          <Undo2 size={12} className="text-amber-600 dark:text-amber-400" />
                          <span>Undo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            handleRedo();
                            setIsWorkspaceToolsOpen(false);
                          }}
                          disabled={historyIndex >= history.length - 1}
                          className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 text-[10.5px] font-bold transition-colors cursor-pointer"
                          title="Redo change (Ctrl+Y)"
                        >
                          <Redo2 size={12} className="text-emerald-600 dark:text-emerald-400" />
                          <span>Redo</span>
                        </button>
                      </div>

                      <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />

                      {/* Watermark in Row 1 Action */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsWatermarkModalOpen(true);
                          setIsWorkspaceToolsOpen(false);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-800 dark:hover:text-amber-300 transition-colors cursor-pointer text-left"
                      >
                        <Stamp size={13} className="text-amber-500 shrink-0" />
                        <div>
                          <div className="font-bold">Add / Edit Watermark in Row 1</div>
                          <div className="text-[9.5px] text-zinc-400 dark:text-zinc-500 font-normal">Translator credits & channel branding</div>
                        </div>
                      </button>

                      {/* Reset Timings to Baseline */}
                      <button
                        type="button"
                        onClick={() => {
                          handleResetTimingsToOriginal();
                          setIsWorkspaceToolsOpen(false);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-left"
                      >
                        <Clock size={13} className="text-blue-500 shrink-0" />
                        <div>
                          <div className="font-bold">Reset Timings to Original</div>
                          <div className="text-[9.5px] text-zinc-400 dark:text-zinc-500 font-normal">Revert timestamps to initial file values</div>
                        </div>
                      </button>

                      {/* Reset All to Initial Baseline */}
                      <button
                        type="button"
                        onClick={() => {
                          if (history.length > 0) {
                            setSubtitles(history[0]);
                            setHistory([history[0]]);
                            setHistoryIndex(0);
                            addNotification("Reset all subtitles back to original initial baseline!", "success");
                            addLog("Reset all subtitle dialogue, translations, and timings to initial state.", "warning");
                          }
                          setIsWorkspaceToolsOpen(false);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
                      >
                        <RotateCcw size={13} className="shrink-0" />
                        <div>
                          <div className="font-bold">Reset All to Initial Baseline</div>
                          <div className="text-[9.5px] text-zinc-400 dark:text-zinc-500 font-normal">Discard all session edits & translations</div>
                        </div>
                      </button>

                      <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />

                      {/* Force Refresh Table View */}
                      <button
                        type="button"
                        onClick={() => {
                          setSubtitles([...subtitles]);
                          addNotification("Table view refreshed.", "success");
                          setIsWorkspaceToolsOpen(false);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-left"
                      >
                        <RefreshCw size={12} className="shrink-0" />
                        <span>Force Refresh Table View</span>
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Progress bars */}
                <div className="flex items-center gap-3 px-2 py-1 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shrink-0 shadow-2xs">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[7.5px] font-bold text-emerald-600 uppercase">AI Urdu</span>
                      <span className="text-[8px] font-mono font-bold text-emerald-600">{stats.progress}%</span>
                    </div>
                    <div className="h-1.5 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-300 rounded-full" 
                        style={{ width: `${stats.progress}%` }} 
                      />
                    </div>
                  </div>
                  <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[7.5px] font-bold text-blue-600 uppercase">Google</span>
                      <span className="text-[8px] font-mono font-bold text-blue-600">{stats.googleProgress}%</span>
                    </div>
                    <div className="h-1.5 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300 rounded-full" 
                        style={{ width: `${stats.googleProgress}%` }} 
                      />
                    </div>
                  </div>
                </div>

                {(isTranslating || isGoogleTranslatingAll) && (
                  <button 
                    onClick={() => setIsWorkerMonitorOpen(!isWorkerMonitorOpen)}
                    className="p-1.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 rounded-lg transition-all shrink-0 animate-pulse border border-emerald-300 dark:border-emerald-700"
                    title="Worker Monitor"
                  >
                    <Activity size={13} />
                  </button>
                )}
              </div>
            }
          >
            <div className="flex flex-col h-full">
              {/* Alert if all 3 text columns are hidden */}
              {!visibleColumns.original && !visibleColumns.ai && !visibleColumns.google && (
                <div className="p-2.5 px-4 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className="text-amber-600 shrink-0" />
                    <span>All subtitle text columns are currently hidden. Select at least one column to display text.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVisibleColumns(prev => ({ ...prev, original: true, ai: true, google: true }))}
                    className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold cursor-pointer"
                  >
                    Show All Columns
                  </button>
                </div>
              )}

              {/* Workspace Stylized Subtitles Live Preview Bar */}
              {isWorkspaceStylingPreview && (
                <div className="p-2.5 px-4 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-indigo-500/10 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      <Sparkles size={13} />
                    </div>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 text-[11px]">
                      Styling Studio Applied Styles:
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[9.5px] font-bold text-emerald-700 dark:text-emerald-300">
                      {GRADIENT_PALETTES.find(p => p.id === activeStylingConfig.paletteId)?.name || 'Custom'} • {activeStylingConfig.gradientMode}
                    </span>
                    <span className="text-[9.5px] text-zinc-500 dark:text-zinc-400">
                      Active on: <strong className="text-zinc-700 dark:text-zinc-300 uppercase">{activeStylingConfig.targetStreams === 'all' ? 'All 3 Streams (Original + AI + Google)' : activeStylingConfig.targetStreams}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsWorkspaceStylingPreview(prev => !prev)}
                      className={cn(
                        "px-2 py-1 rounded-lg text-[9.5px] font-bold flex items-center gap-1 transition-colors border cursor-pointer",
                        isWorkspaceStylingPreview
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                      )}
                    >
                      <Eye size={11} />
                      <span>{isWorkspaceStylingPreview ? "Preview: Active" : "Preview: Paused"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsStylingDrawerOpen(true)}
                      className="px-2 py-1 rounded-lg text-[9.5px] font-bold bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Sliders size={11} className="text-indigo-500" />
                      <span>Open Styling Studio</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const styled = applyGradientsToSubtitles(
                          subtitles,
                          activeStylingConfig.paletteId,
                          activeStylingConfig.gradientMode,
                          activeStylingConfig.targetStreams,
                          {
                            customColors: activeStylingConfig.customColors,
                            boldEmphasis: activeStylingConfig.boldEmphasis,
                            italicize: activeStylingConfig.italicize,
                            uppercaseOriginal: activeStylingConfig.transformCase === 'uppercase'
                          }
                        );
                        setSubtitles(styled);
                        addNotification("Bake & applied all styles to subtitle project!", "success");
                      }}
                      className="px-2 py-1 rounded-lg text-[9.5px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs flex items-center gap-1 cursor-pointer"
                      title="Bake active styles permanently into subtitle project"
                    >
                      <Check size={11} />
                      <span>Bake All Styles</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-auto flex-1 relative max-h-full">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead className="sticky top-0 bg-zinc-50/95 dark:bg-zinc-900/95 backdrop-blur-md z-20 shadow-xs">
                    <tr className="border-b border-zinc-200 dark:border-zinc-700/80 text-zinc-500 dark:text-zinc-400">
                      <th className="p-3 text-[9px] font-bold uppercase tracking-widest w-14 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <input 
                            type="checkbox"
                            checked={filteredSubtitles.length > 0 && selectedIndices.size === filteredSubtitles.length}
                            onChange={toggleSelectAll}
                            className="accent-emerald-600 rounded cursor-pointer w-3.5 h-3.5"
                            title={selectedIndices.size > 0 ? "Deselect all" : "Select all visible"}
                          />
                          <span>#</span>
                        </div>
                      </th>
                      {visibleColumns.time && (
                        <th className="p-3 text-[9px] font-bold uppercase tracking-widest w-36">
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="checkbox"
                              checked={studioColumnsToDisplay.time}
                              onChange={(e) => setStudioColumnsToDisplay(prev => ({ ...prev, time: e.target.checked }))}
                              className="accent-emerald-600 rounded cursor-pointer w-3.5 h-3.5"
                              title="Display Time column in Dedicated Editor Studio (checked = visible)"
                            />
                            <span>Time</span>
                          </div>
                        </th>
                      )}
                      {visibleColumns.original && (
                        <th className="p-3 text-[9px] font-bold uppercase tracking-widest min-w-[200px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-zinc-700 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400" title="Display Original column in Dedicated Editor Studio (checked = visible)">
                              <input 
                                type="checkbox"
                                checked={studioColumnsToDisplay.original}
                                onChange={(e) => setStudioColumnsToDisplay(prev => ({ ...prev, original: e.target.checked }))}
                                className="accent-emerald-600 rounded cursor-pointer w-3.5 h-3.5"
                              />
                              <span>Original Language</span>
                            </label>
                            <span className="text-[8px] font-normal px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
                              {translationSettings.sourceLanguage === 'auto' ? 'Source' : translationSettings.sourceLanguage.toUpperCase()}
                            </span>
                            {(activeStylingConfig.targetStreams === 'all' || activeStylingConfig.targetStreams === 'both' || activeStylingConfig.targetStreams === 'original') && isWorkspaceStylingPreview && (
                              <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-mono">
                                Stylized
                              </span>
                            )}
                          </div>
                        </th>
                      )}
                      {visibleColumns.ai && (
                        <th className="p-3 text-[9px] font-bold uppercase tracking-widest min-w-[220px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-zinc-700 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400" title="Display AI Translated column in Dedicated Editor Studio (checked = visible)">
                              <input 
                                type="checkbox"
                                checked={studioColumnsToDisplay.ai}
                                onChange={(e) => setStudioColumnsToDisplay(prev => ({ ...prev, ai: e.target.checked }))}
                                className="accent-emerald-600 rounded cursor-pointer w-3.5 h-3.5"
                              />
                              <span>AI Translated Language</span>
                            </label>
                            <span className="text-[8px] font-normal px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                              {TARGET_LANGUAGES.find(l => l.code === translationSettings.targetLanguage)?.name || 'Urdu'} • {SCRIPT_MODES.find(s => s.id === translationSettings.scriptMode)?.badge || 'اردو'}
                            </span>
                            {(activeStylingConfig.targetStreams === 'all' || activeStylingConfig.targetStreams === 'both' || activeStylingConfig.targetStreams === 'translated') && isWorkspaceStylingPreview && (
                              <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono">
                                Stylized
                              </span>
                            )}
                          </div>
                        </th>
                      )}
                      {visibleColumns.google && (
                        <th className="p-3 text-[9px] font-bold uppercase tracking-widest min-w-[180px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-zinc-700 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400" title="Display Google Translation column in Dedicated Editor Studio (checked = visible)">
                              <input 
                                type="checkbox"
                                checked={studioColumnsToDisplay.google}
                                onChange={(e) => setStudioColumnsToDisplay(prev => ({ ...prev, google: e.target.checked }))}
                                className="accent-emerald-600 rounded cursor-pointer w-3.5 h-3.5"
                              />
                              <span>Google Translation</span>
                            </label>
                            <span className="text-[8px] font-normal px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                              Machine
                            </span>
                            {(activeStylingConfig.targetStreams === 'all' || activeStylingConfig.targetStreams === 'google') && isWorkspaceStylingPreview && (
                              <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-mono">
                                Stylized
                              </span>
                            )}
                          </div>
                        </th>
                      )}
                      <th className="p-3 text-[9px] font-bold uppercase tracking-widest w-20 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-700/40">
                    {filteredSubtitles.length === 0 && (
                      <tr>
                        <td 
                          colSpan={1 + (visibleColumns.time ? 1 : 0) + (visibleColumns.original ? 1 : 0) + (visibleColumns.ai ? 1 : 0) + (visibleColumns.google ? 1 : 0) + 1} 
                          className="p-12 text-center"
                        >
                          <div className="flex flex-col items-center gap-3 max-w-md mx-auto text-zinc-400 dark:text-zinc-500">
                            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <FileText size={36} className="stroke-[1.5]" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">No Subtitle Entries Loaded</p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Upload your caption file or load cinematic sample subtitles to test fonts, sizing, and translations immediately.</p>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                type="button"
                                onClick={loadSampleSubtitles}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                              >
                                <Sparkles size={13} />
                                <span>Load Sample Subtitles</span>
                              </button>
                              <label className="px-3.5 py-1.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer">
                                <Upload size={13} />
                                <span>Upload File</span>
                                <input type="file" accept=".srt,.vtt,.ass,.ssa,.sbv,.lrc,.json,.txt" onChange={handleFileUpload} className="hidden" />
                              </label>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    {progressiveWorkspaceSubtitles.map((item) => (
                      <SubtitleRow 
                        key={item.index} 
                        item={item} 
                        onOpenEditor={handleOpenEditor}
                        onTranslateGoogle={translateSingleRowGoogle}
                        isSelected={selectedIndices.has(item.index)}
                        onToggleSelect={toggleSelectRow}
                        visibleColumns={visibleColumns}
                        originalFont={originalFont}
                        originalFontSize={originalFontSize}
                        urduFont={urduFont}
                        translatedFontSize={translatedFontSize}
                        googleFont={googleFont}
                        googleFontSize={googleFontSize}
                        isGlobalFontActive={isGlobalFontActive}
                        globalFont={globalFont}
                        globalFontSize={globalFontSize}
                        activeStylingConfig={activeStylingConfig}
                        isStylingPreviewActive={isWorkspaceStylingPreview}
                        isReadOnly={isReadOnly}
                        onEditOriginal={handleManualEditOriginal}
                        onEditTranslated={handleManualEdit}
                        onEditGoogle={handleManualEditGoogle}
                        onOpenWatermark={() => setIsWatermarkModalOpen(true)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar for instant 60fps rendering without DOM layout recalculation lag */}
              {filteredSubtitles.length > 0 && (
                <div className="p-2.5 px-4 border-t border-zinc-200 dark:border-zinc-700/60 bg-zinc-50 dark:bg-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0 select-none">
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                    Showing <span className="font-bold text-zinc-800 dark:text-zinc-200">{pageSize === 0 ? 1 : (currentPage - 1) * pageSize + 1}</span> to <span className="font-bold text-zinc-800 dark:text-zinc-200">{pageSize === 0 ? filteredSubtitles.length : Math.min(currentPage * pageSize, filteredSubtitles.length)}</span> of <span className="font-bold text-zinc-800 dark:text-zinc-200">{filteredSubtitles.length}</span> segments
                    {searchTerm && <span className="ml-1 text-emerald-600 dark:text-emerald-400">(filtered)</span>}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Rows per page selector */}
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                      <span>Per page:</span>
                      {[25, 50, 100, 0].map(size => (
                        <button
                          key={size}
                          onClick={() => { setPageSize(size); setCurrentPage(1); }}
                          className={cn(
                            "px-2 py-0.5 rounded font-mono font-bold transition-colors",
                            pageSize === size 
                              ? "bg-emerald-600 text-white" 
                              : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300"
                          )}
                        >
                          {size === 0 ? "All" : size}
                        </button>
                      ))}
                    </div>

                    {/* Pagination buttons */}
                    {pageSize > 0 && totalPages > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-2.5 py-1 rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-700 dark:text-zinc-200 font-bold text-[10px]"
                        >
                          Prev
                        </button>
                        <span className="text-[10px] font-mono px-2 text-zinc-600 dark:text-zinc-300 font-bold">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="px-2.5 py-1 rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-700 dark:text-zinc-200 font-bold text-[10px]"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ResizableBox>

          {/* Logs */}
          <ResizableBox 
            title="System Logs" 
            icon={Terminal} 
            initialHeight={200} 
            minHeight={150}
            actions={
              <button onClick={clearLogs} className="p-1.5 hover:bg-black/5 rounded-md text-black/40 hover:text-black/60 transition-colors">
                <Trash2 size={12} />
              </button>
            }
          >
            <div className="p-4 font-mono text-[10px] space-y-1 dark:text-white/60">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-3 border-b border-black/[0.01] dark:border-white/[0.01] pb-1">
                  <span className="text-black/20 dark:text-white/20">[{log.timestamp}]</span>
                  <span className={cn(
                    "font-bold uppercase tracking-tighter w-14 shrink-0",
                    log.type === 'success' && "text-emerald-600 dark:text-emerald-400",
                    log.type === 'error' && "text-red-500 dark:text-red-400",
                    log.type === 'warning' && "text-amber-500 dark:text-amber-400",
                    log.type === 'info' && "text-blue-500 dark:text-blue-400"
                  )}>{log.type}</span>
                  <span>{log.message}</span>
                </div>
              ))}
            </div>
          </ResizableBox>
        </div>
      </main>

      {/* Translation Settings Modal */}
      <TranslationSettingsModal
        isOpen={isTranslationSettingsModalOpen}
        onClose={() => setIsTranslationSettingsModalOpen(false)}
        settings={translationSettings}
        onSave={(newSettings) => setTranslationSettings(newSettings)}
        urduFont={urduFont}
        onUpdateUrduFont={setUrduFont}
        originalFont={originalFont}
        onUpdateOriginalFont={setOriginalFont}
        onAddLog={addLog}
      />

      {/* Subtitle Stylizer & Gradient Modal */}
      <SubtitleStylizerModal
        isOpen={isStylizerOpen}
        onClose={() => setIsStylizerOpen(false)}
        subtitles={subtitles}
        onApply={(styledSubs) => setSubtitles(styledSubs)}
        urduFont={urduFont}
        translatedFontSize={translatedFontSize}
        fileName={fileName}
        onAddLog={addLog}
      />

      {/* Find and Replace Modal */}
      <FindReplaceModal
        isOpen={isFindReplaceOpen}
        onClose={() => setIsFindReplaceOpen(false)}
        subtitles={subtitles}
        selectedCount={selectedIndices.size}
        selectedIndices={selectedIndices}
        onApply={(updated, count) => {
          updateSubtitles(updated);
          addNotification(`Replaced ${count} occurrence(s)`, 'success');
        }}
        onAddLog={addLog}
      />

      {/* Batch Time Shift Modal */}
      <TimeShiftModal
        isOpen={isTimeShiftOpen}
        onClose={() => setIsTimeShiftOpen(false)}
        subtitles={subtitles}
        selectedCount={selectedIndices.size}
        selectedIndices={selectedIndices}
        onApply={(updated, shiftMs) => {
          updateSubtitles(updated);
          addNotification(`Shifted timestamps by ${shiftMs > 0 ? '+' : ''}${shiftMs}ms`, 'success');
        }}
        onAddLog={addLog}
      />

      {/* Time Gap Management & Snapping Modal */}
      <GapTimingModal
        isOpen={isGapTimingOpen}
        onClose={() => setIsGapTimingOpen(false)}
        subtitles={subtitles}
        selectedCount={selectedIndices.size}
        selectedIndices={selectedIndices}
        originalTimingMap={originalTimingMap}
        onApply={(updated, summary) => {
          updateSubtitles(updated);
        }}
        onResetToOriginal={handleResetTimingsToOriginal}
        onAddLog={addLog}
        onAddNotification={addNotification}
      />

      {/* Text Cleanup and Fixes Modal */}
      <TextCleanupModal
        isOpen={isTextCleanupOpen}
        onClose={() => setIsTextCleanupOpen(false)}
        subtitles={subtitles}
        selectedCount={selectedIndices.size}
        selectedIndices={selectedIndices}
        onApply={(updated) => {
          updateSubtitles(updated);
          addNotification('Text cleanup applied successfully', 'success');
        }}
        onAddLog={addLog}
      />

      {/* Watermark Modal */}
      <WatermarkModal
        isOpen={isWatermarkModalOpen}
        onClose={() => setIsWatermarkModalOpen(false)}
        subtitles={subtitles}
        onApplyWatermark={(updated) => {
          updateSubtitles(updated);
          addNotification("Watermark updated on first block!", "success");
        }}
        onAddLog={addLog}
      />

      {/* Dedicated Expanded Subtitle Editor Studio Modal */}
      <SubtitleEditorModal
        isOpen={isEditorModalOpen}
        onClose={() => {
          setIsEditorModalOpen(false);
          setEditorFocusIndex(undefined);
        }}
        subtitles={subtitles}
        onUpdateSubtitles={updateSubtitles}
        initialFocusIndex={editorFocusIndex}
        fileName={fileName}
        detectedFormat={detectedFormat}
        urduFont={urduFont}
        originalFont={originalFont}
        googleFont={googleFont}
        isGlobalFontActive={isGlobalFontActive}
        globalFont={globalFont}
        globalFontSize={globalFontSize}
        translatedFontSize={translatedFontSize}
        originalFontSize={originalFontSize}
        googleFontSize={googleFontSize}
        translationSettings={translationSettings}
        onOpenTranslationSettings={() => setIsTranslationSettingsModalOpen(true)}
        onOpenStylizer={() => setIsStylingDrawerOpen(true)}
        onOpenStylingStudio={() => setIsStylingDrawerOpen(true)}
        activeStylingConfig={activeStylingConfig}
        isStylingPreviewActive={isWorkspaceStylingPreview}
        onTranslateGoogle={translateSingleRowGoogle}
        onApplyGoogleToAI={applyGoogleToAI}
        onRetrySelectedAI={retrySelectedAI}
        onRetrySelectedGoogle={retrySelectedGoogle}
        onRetrySelectedBoth={retrySelectedBoth}
        onClearSelectedTranslations={clearSelectedTranslations}
        onOpenFindReplace={() => setIsFindReplaceOpen(true)}
        onOpenTimeShift={() => setIsTimeShiftOpen(true)}
        onOpenGapTiming={() => setIsGapTimingOpen(true)}
        onOpenTextCleanup={() => setIsTextCleanupOpen(true)}
        onCopyAllGoogleToEmptyAI={copyAllGoogleToEmptyAI}
        isTranslating={isTranslating}
        isGoogleTranslatingAll={isGoogleTranslatingAll}
        onAddNotification={addNotification}
        onAddLog={addLog}
        onLoadSampleSubtitles={loadSampleSubtitles}
        onFileUpload={handleFileUpload}
        editorColumns={studioColumnsToDisplay}
        onUpdateEditorColumns={setStudioColumnsToDisplay}
      />

      {/* Screen Edge Pull Drawers: Left Edge for AI Cinema, Right Edge for Styling Studio */}
      <button 
        type="button"
        onClick={() => setIsAiCinemaOpen(true)} 
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-gradient-to-b from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3.5 px-1.5 rounded-r-xl shadow-xl flex flex-col items-center gap-1.5 hover:pl-2.5 transition-all cursor-pointer group border-y border-r border-indigo-400/30"
        title="Pull out AI Cinema Studio (Left Edge)"
      >
        <Clapperboard size={15} className="group-hover:scale-110 transition-transform" />
        <span className="text-[9px] font-bold uppercase tracking-widest [writing-mode:vertical-rl] rotate-180 select-none">
          AI Cinema
        </span>
      </button>

      <button 
        type="button"
        onClick={() => setIsStylingDrawerOpen(true)} 
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-gradient-to-b from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white py-3.5 px-1.5 rounded-l-xl shadow-xl flex flex-col items-center gap-1.5 hover:pr-2.5 transition-all cursor-pointer group border-y border-l border-rose-400/30"
        title="Pull out Gradient Studio (Right Edge)"
      >
        <Palette size={15} className="group-hover:rotate-12 transition-transform" />
        <span className="text-[9px] font-bold uppercase tracking-widest [writing-mode:vertical-rl] select-none">
          Styling Studio
        </span>
      </button>

      {/* AI Cinema Workspace Drawer (Pull from Left Edge) */}
      <AiCinemaDrawer
        isOpen={isAiCinemaOpen}
        onClose={() => setIsAiCinemaOpen(false)}
        geminiService={geminiRef.current}
        isGeminiConnected={isGeminiConnected}
        onApplyContext={(contextText) => {
          setContext(contextText);
          addNotification("Applied AI Cinema context to subtitle workspace", "success");
        }}
        onAddLog={addLog}
        onAddNotification={addNotification}
      />

      {/* Styling Studio Drawer (Pull from Right Edge) */}
      <StylingStudioDrawer
        isOpen={isStylingDrawerOpen}
        onClose={() => setIsStylingDrawerOpen(false)}
        subtitles={subtitles}
        onApply={(styledSubtitles) => {
          setSubtitles(styledSubtitles);
          setIsWorkspaceStylingPreview(true);
          addNotification("Applied stylized subtitle configuration to Translation Workspace", "success");
        }}
        urduFont={urduFont}
        onUpdateUrduFont={setUrduFont}
        originalFont={originalFont}
        onUpdateOriginalFont={setOriginalFont}
        translatedFontSize={translatedFontSize}
        onUpdateTranslatedFontSize={setTranslatedFontSize}
        originalFontSize={originalFontSize}
        onUpdateOriginalFontSize={setOriginalFontSize}
        fileName={fileName}
        activeStylingConfig={activeStylingConfig}
        onUpdateActiveStyling={(newConfig) => {
          setActiveStylingConfig(newConfig);
          setIsWorkspaceStylingPreview(true);
        }}
        onAddLog={addLog}
        onAddNotification={addNotification}
      />

      {/* Interactive Subtitle Playback & Preview Space */}
      <SubtitlePreviewSpaceModal
        isOpen={isPreviewSpaceOpen}
        onClose={() => setIsPreviewSpaceOpen(false)}
        subtitles={subtitles}
        urduFont={urduFont}
        translatedFontSize={translatedFontSize}
        fileName={fileName}
        activeStylingConfig={activeStylingConfig}
      />

      {/* Unified Google Translate Settings Modal */}
      <GoogleTranslateSettingsModal
        isOpen={isGoogleSettingsOpen}
        onClose={() => setIsGoogleSettingsOpen(false)}
        googleApiKey={googleApiKey}
        onUpdateGoogleApiKey={setGoogleApiKey}
        translationSettings={translationSettings}
        onUpdateTranslationSettings={setTranslationSettings}
        googleWorkers={googleWorkers}
        onUpdateGoogleWorkers={setGoogleWorkers}
        googleBatchSize={googleBatchSize}
        onUpdateGoogleBatchSize={setGoogleBatchSize}
        onTestConnection={updateGoogleConfig}
        testStatus={googleConnectStatus}
        onAddLog={addLog}
        onAddNotification={addNotification}
      />

      {/* Unified AI Configuration Modal */}
      <AiConfigModal
        isOpen={isAiConfigOpen}
        onClose={() => setIsAiConfigOpen(false)}
        selectedModel={selectedModel}
        onUpdateModel={setSelectedModel}
        customApiKey={customApiKey}
        onUpdateApiKey={setCustomApiKey}
        onConnectGemini={connectGemini}
        connectStatus={geminiConnectStatus}
        isGeminiConnected={isGeminiConnected}
        geminiWorkers={geminiWorkers}
        onUpdateWorkers={setGeminiWorkers}
        geminiBatchSize={geminiBatchSize}
        onUpdateBatchSize={setGeminiBatchSize}
        geminiDelay={geminiDelay}
        onUpdateDelay={setGeminiDelay}
        adaptiveScalingEnabled={adaptiveScalingEnabled}
        onToggleAdaptiveScaling={setAdaptiveScalingEnabled}
        onAddLog={addLog}
        onAddNotification={addNotification}
      />

      {/* Unified Download Modal (All Formats & Streams) */}
      <UnifiedDownloadModal
        isOpen={isUnifiedDownloadOpen}
        onClose={() => setIsUnifiedDownloadOpen(false)}
        subtitles={subtitles}
        onDownloadFormatted={downloadFormattedSubtitles}
        fileName={fileName}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${theme === 'classic' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: ${theme === 'classic' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'}; }
      `}} />
    </div>
  );
}
