import React, { useState } from 'react';
import { 
  Palette, 
  Sparkles, 
  X, 
  Check, 
  Trash2, 
  Sliders, 
  Layers, 
  Download, 
  Eye, 
  Info,
  Type,
  FileCode,
  ShieldAlert
} from 'lucide-react';
import { 
  GRADIENT_PALETTES, 
  GradientPalette, 
  GradientMode, 
  applyGradientsToSubtitles, 
  removeAllGradientsFromSubtitles,
  generateFormattedSRT,
  generateASS,
  generateWebVTT,
  generateCleanSRT,
  hasFormatting
} from '../utils/subtitleFormatter';
import { SubtitleItem } from '../utils/srtParser';
import { cn } from '../utils/cn';

interface SubtitleStylizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtitles: SubtitleItem[];
  onApply: (styledSubtitles: SubtitleItem[]) => void;
  urduFont: string;
  translatedFontSize: number;
  fileName: string;
  onAddLog: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const SubtitleStylizerModal: React.FC<SubtitleStylizerModalProps> = ({
  isOpen,
  onClose,
  subtitles,
  onApply,
  urduFont,
  translatedFontSize,
  fileName,
  onAddLog
}) => {
  const [selectedPaletteId, setSelectedPaletteId] = useState<string>('sunset');
  const [gradientMode, setGradientMode] = useState<GradientMode>('block-shift');
  const [targetField, setTargetField] = useState<'translated' | 'original' | 'both'>('translated');
  const [exportFormat, setExportFormat] = useState<'srt-formatted' | 'ass' | 'vtt' | 'srt-clean'>('srt-formatted');
  const [previewTab, setPreviewTab] = useState<'visual' | 'code'>('visual');

  if (!isOpen) return null;

  const selectedPalette = GRADIENT_PALETTES.find(p => p.id === selectedPaletteId) || GRADIENT_PALETTES[0];

  // Generate live sample preview
  const sampleItems: SubtitleItem[] = subtitles.slice(0, 4).length > 0 
    ? subtitles.slice(0, 4) 
    : [
        { index: 1, startTime: '00:00:01,000', endTime: '00:00:04,000', text: 'Welcome to this cinematic universe', translatedText: 'اس سنیما کی دنیا میں خوش آمدید' },
        { index: 2, startTime: '00:00:04,500', endTime: '00:00:08,200', text: 'Every dialogue carries deep emotional weight', translatedText: 'ہر بات میں ایک گہرا احساس چھپا ہے' },
        { index: 3, startTime: '00:00:08,500', endTime: '00:00:12,000', text: 'Notice how the colors shift dynamically', translatedText: 'دیکھیں کہ کس طرح رنگ خود بخود تبدیل ہو رہے ہیں' }
      ];

  const styledSampleItems = applyGradientsToSubtitles(sampleItems, selectedPaletteId, gradientMode, targetField);

  // Check how many items currently have formatting
  const formattedCount = subtitles.filter(s => hasFormatting(s.translatedText || '') || hasFormatting(s.text)).length;

  const handleApplyToAll = () => {
    if (subtitles.length === 0) return;
    const styled = applyGradientsToSubtitles(subtitles, selectedPaletteId, gradientMode, targetField);
    onApply(styled);
    onAddLog(`Applied "${selectedPalette.name}" (${gradientMode}) gradient styles to ${subtitles.length} subtitles.`, 'success');
    onClose();
  };

  const handleClearAll = () => {
    if (subtitles.length === 0) return;
    const clean = removeAllGradientsFromSubtitles(subtitles);
    onApply(clean);
    onAddLog(`Removed all color formatting and restored clean plain subtitles.`, 'info');
    onClose();
  };

  const handleDirectDownload = (format: 'srt-formatted' | 'ass' | 'vtt' | 'srt-clean') => {
    if (subtitles.length === 0) return;

    // Apply currently selected styling if subtitles don't have formatting yet
    let itemsToExport = subtitles;
    if (format !== 'srt-clean' && formattedCount === 0) {
      itemsToExport = applyGradientsToSubtitles(subtitles, selectedPaletteId, gradientMode, targetField);
      onApply(itemsToExport);
    }

    const baseName = (fileName || 'subtitles').replace(/\.[^/.]+$/, '').replace(/[^a-z0-9_-]/gi, '_');
    const timestamp = Date.now();
    let content = '';
    let mimeType = 'text/plain;charset=utf-8';
    let fileExt = 'srt';

    if (format === 'srt-formatted') {
      content = generateFormattedSRT(itemsToExport, 'ai');
      mimeType = 'text/srt;charset=utf-8';
      fileExt = 'srt';
    } else if (format === 'ass') {
      content = generateASS(itemsToExport, {
        fontFamily: urduFont,
        fontSize: translatedFontSize || 38,
        title: baseName,
        palette: selectedPalette
      });
      mimeType = 'text/x-ssa;charset=utf-8';
      fileExt = 'ass';
    } else if (format === 'vtt') {
      content = generateWebVTT(itemsToExport, 'ai');
      mimeType = 'text/vtt;charset=utf-8';
      fileExt = 'vtt';
    } else {
      content = generateCleanSRT(itemsToExport, 'ai');
      mimeType = 'text/srt;charset=utf-8';
      fileExt = 'clean.srt';
    }

    const blob = new Blob(['\ufeff' + content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${baseName}_${format}_${timestamp}.${fileExt}`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      if (document.body.contains(a)) document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 20000);

    onAddLog(`Saved stylized subtitles as .${fileExt}: ${a.download}`, 'success');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 text-white shadow-md">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Automatic Color Gradients & Subtitle Stylizer
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                  SRT + ASS + VTT
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Apply vibrant multi-color gradients across subtitle blocks and save formatted subtitles without losing styling.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Section 1: Palette Selection */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Palette size={14} className="text-amber-500" />
                1. Select Designer Gradient Palette
              </label>
              <span className="text-zinc-400 font-mono text-[10px]">{GRADIENT_PALETTES.length} Presets Available</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {GRADIENT_PALETTES.map((palette) => {
                const isSelected = selectedPaletteId === palette.id;
                return (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => setSelectedPaletteId(palette.id)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 relative overflow-hidden group cursor-pointer",
                      isSelected
                        ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-sm"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-900/40"
                    )}
                  >
                    <div 
                      className="h-3.5 w-full rounded-md shadow-inner transition-transform group-hover:scale-105"
                      style={{ background: palette.previewCss }}
                    />
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate text-[11px]">{palette.name}</div>
                      <div className="text-[9px] text-zinc-500 dark:text-zinc-400 line-clamp-1">{palette.description}</div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Mode & Target */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Gradient Mode */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/20 space-y-2">
              <label className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Sliders size={13} className="text-indigo-500" />
                2. Gradient Progression Mode
              </label>
              
              <div className="space-y-1.5">
                {[
                  {
                    id: 'block-shift' as GradientMode,
                    title: 'Block-by-Block Continuous Shift',
                    desc: 'Each subtitle block shifts color along the timeline gradient. (Most cinematic)'
                  },
                  {
                    id: 'word-gradient' as GradientMode,
                    title: 'Smooth Word-by-Word Gradient',
                    desc: 'Words within each dialogue block transition seamlessly across colors.'
                  },
                  {
                    id: 'alternating-speakers' as GradientMode,
                    title: 'Alternating Speaker Palette',
                    desc: 'Alternates contrasting palette tones between consecutive dialogue segments.'
                  },
                  {
                    id: 'ping-pong' as GradientMode,
                    title: 'Ping-Pong Reversal',
                    desc: 'Oscillates forward then backward through colors across timeline.'
                  },
                  {
                    id: 'first-last-accent' as GradientMode,
                    title: 'Anchor Accent Ends',
                    desc: 'First and last words accented with vibrant ends of palette.'
                  },
                  {
                    id: 'center-out' as GradientMode,
                    title: 'Center-Out Flare',
                    desc: 'Center climax word radiates outward to edge stops.'
                  },
                  {
                    id: 'odd-even-words' as GradientMode,
                    title: 'Odd/Even Word Stride',
                    desc: 'Alternates color on every other word in each phrase.'
                  },
                  {
                    id: 'random-scatter' as GradientMode,
                    title: 'Chromatic Scatter',
                    desc: 'Deterministic multi-color scatter across each phrase.'
                  },
                  {
                    id: 'rainbow-cycle' as GradientMode,
                    title: 'Spectral Loop',
                    desc: 'Full palette looped continuously across all words.'
                  },
                  {
                    id: 'tri-color-split' as GradientMode,
                    title: 'Tri-Color Narrative Split',
                    desc: 'Divides line into Opening, Body & Climax thirds.'
                  },
                  {
                    id: 'syllable-karaoke' as GradientMode,
                    title: 'Karaoke Step Wave',
                    desc: 'High-contrast vibrant jump highlight on key terms.'
                  },
                  {
                    id: 'gradient-glow' as GradientMode,
                    title: 'Radiant Accent Glow',
                    desc: 'Rich chromatic lead tone with radiant accentuation.'
                  }
                ].map((m) => (
                  <label
                    key={m.id}
                    className={cn(
                      "flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors",
                      gradientMode === m.id
                        ? "border-emerald-500/60 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 font-medium"
                        : "border-zinc-200/70 dark:border-zinc-800 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300"
                    )}
                  >
                    <input
                      type="radio"
                      name="gradientMode"
                      checked={gradientMode === m.id}
                      onChange={() => setGradientMode(m.id)}
                      className="mt-0.5 accent-emerald-600"
                    />
                    <div>
                      <div className="font-bold text-[11px]">{m.title}</div>
                      <div className="text-[9.5px] text-zinc-500 dark:text-zinc-400">{m.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Target Field */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/20 space-y-2">
              <label className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Layers size={13} className="text-emerald-500" />
                3. Target Subtitle Stream
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'translated' as const, label: 'Urdu (Translated)' },
                  { id: 'original' as const, label: 'English (Original)' },
                  { id: 'both' as const, label: 'Both Streams' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTargetField(t.id)}
                    className={cn(
                      "p-2.5 rounded-lg border text-center font-bold text-[11px] transition-colors cursor-pointer",
                      targetField === t.id
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Status Info Card */}
              <div className="mt-3 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[10.5px]">
                  <Info size={13} className="text-blue-500 shrink-0" />
                  <span>How players render stylized subtitles:</span>
                </div>
                <p className="text-[10px] leading-relaxed">
                  <strong>Formatted SRT</strong> uses universal <code className="text-emerald-600 dark:text-emerald-400 font-mono text-[9px]">&lt;font color="#HEX"&gt;</code> tags supported by VLC, PotPlayer, MPV, YouTube, and Premiere.
                </p>
                <p className="text-[10px] leading-relaxed">
                  <strong>ASS (.ass)</strong> embeds custom typography (<span className="font-semibold">{urduFont.split(',')[0].replace(/['"]/g, '')}</span>), drop shadows, and exact RGB color overrides.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Live Video Subtitle Preview */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-black text-white space-y-3">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 text-zinc-300">
                <Eye size={13} className="text-emerald-400" />
                Live Video Screen Preview (Simulated Player)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewTab('visual')}
                  className={cn("px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer", previewTab === 'visual' ? "bg-white/20 text-white" : "text-zinc-400 hover:text-white")}
                >
                  Visual
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('code')}
                  className={cn("px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer", previewTab === 'code' ? "bg-white/20 text-white" : "text-zinc-400 hover:text-white")}
                >
                  SRT Code
                </button>
              </div>
            </div>

            {previewTab === 'visual' ? (
              <div className="p-6 bg-gradient-to-b from-zinc-950/80 to-zinc-900 border border-zinc-800 rounded-lg flex flex-col items-center justify-center min-h-[140px] text-center gap-3">
                {styledSampleItems.map((sample, idx) => (
                  <div key={sample.index} className="space-y-1">
                    <div 
                      className="leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]"
                      style={{ 
                        fontFamily: urduFont,
                        fontSize: `${Math.max(translatedFontSize, 24)}px`
                      }}
                      dir="rtl"
                      dangerouslySetInnerHTML={{ __html: sample.translatedText || '' }}
                    />
                    <div className="text-[11px] font-sans text-zinc-400 opacity-70">
                      {sample.text}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <pre className="p-3 bg-zinc-950 font-mono text-[10px] text-emerald-400 overflow-x-auto rounded border border-zinc-800 max-h-36">
                {generateFormattedSRT(styledSampleItems, 'ai')}
              </pre>
            )}
          </div>

          {/* Section 4: One-Click Formatted Downloads */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-[10px] text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Download size={13} className="text-emerald-500" />
                Direct Save Formatted Subtitles (No Loss of Formation)
              </span>
              <span className="text-[10px] text-zinc-400">{subtitles.length} Subtitles in Project</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleDirectDownload('srt-formatted')}
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex flex-col items-center justify-center gap-1 transition-all shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Download size={13} />
                  <span>Formatted SRT</span>
                </div>
                <span className="text-[8.5px] opacity-80 font-normal">Colors & HTML preserved</span>
              </button>

              <button
                type="button"
                onClick={() => handleDirectDownload('ass')}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex flex-col items-center justify-center gap-1 transition-all shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles size={13} />
                  <span>Advanced ASS</span>
                </div>
                <span className="text-[8.5px] opacity-80 font-normal">Urdu font, shadow & outline</span>
              </button>

              <button
                type="button"
                onClick={() => handleDirectDownload('vtt')}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex flex-col items-center justify-center gap-1 transition-all shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <FileCode size={13} />
                  <span>WebVTT (.vtt)</span>
                </div>
                <span className="text-[8.5px] opacity-80 font-normal">Web & HTML5 ready</span>
              </button>

              <button
                type="button"
                onClick={() => handleDirectDownload('srt-clean')}
                className="p-2.5 rounded-xl bg-zinc-700 hover:bg-zinc-800 text-white font-bold text-[11px] flex flex-col items-center justify-center gap-1 transition-all shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Type size={13} />
                  <span>Clean SRT</span>
                </div>
                <span className="text-[8.5px] opacity-80 font-normal">Raw plain text (no tags)</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex items-center justify-between shrink-0">
          <div>
            {formattedCount > 0 ? (
              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60 font-bold transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Remove All Styling ({formattedCount} stylized)</span>
              </button>
            ) : (
              <span className="text-zinc-400 text-[10px]">No styles currently active on subtitles.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyToAll}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Apply Gradients to All Subtitles</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
