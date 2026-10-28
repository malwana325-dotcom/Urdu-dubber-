import React, { useState } from 'react';
import { 
  Download, 
  X, 
  FileText, 
  Sparkles, 
  Film, 
  FileCode, 
  Youtube, 
  Music, 
  Smartphone, 
  Share2, 
  Layers, 
  Check, 
  Copy,
  Info
} from 'lucide-react';
import { SubtitleItem } from '../utils/srtParser';
import { cn } from '../utils/cn';

interface UnifiedDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtitles: SubtitleItem[];
  onDownloadFormatted: (
    format: 'srt-formatted' | 'ass' | 'ssa' | 'vtt' | 'srt-clean' | 'sbv' | 'lrc' | 'txt' | 'json' | 'copy',
    type: 'ai' | 'google' | 'original'
  ) => void;
  fileName: string;
}

export const UnifiedDownloadModal: React.FC<UnifiedDownloadModalProps> = ({
  isOpen,
  onClose,
  subtitles,
  onDownloadFormatted,
  fileName
}) => {
  const [selectedStream, setSelectedStream] = useState<'ai' | 'google' | 'original'>('ai');

  if (!isOpen) return null;

  const handleDownload = (format: 'srt-formatted' | 'ass' | 'ssa' | 'vtt' | 'srt-clean' | 'sbv' | 'lrc' | 'txt' | 'json' | 'copy') => {
    onDownloadFormatted(format, selectedStream);
    onClose();
  };

  const DOWNLOAD_OPTIONS = [
    {
      format: 'srt-formatted' as const,
      name: 'Formatted SRT (.srt)',
      badge: 'VLC / MX Player',
      desc: 'Standard subtitle file preserving all <font color> gradient tags & styling',
      icon: Download,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
    },
    {
      format: 'ass' as const,
      name: 'Advanced SubStation Alpha (.ass)',
      badge: 'MX Player & VLC Pro',
      desc: 'Outlines, strokes, drop shadows, glows, and backdrop scrims formatted for mobile MX Player & VLC',
      icon: Sparkles,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800'
    },
    {
      format: 'ssa' as const,
      name: 'SubStation Alpha (.ssa)',
      badge: 'MX Player & Classic v4',
      desc: 'Standard SubStation Alpha v4.00 format compatible with all classic players & Android decoders',
      icon: Film,
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800'
    },
    {
      format: 'vtt' as const,
      name: 'WebVTT (.vtt)',
      badge: 'HTML5 Web & Mobile',
      desc: 'Universal web video captions standard with CSS cue styling',
      icon: FileCode,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
    },
    {
      format: 'srt-clean' as const,
      name: 'Clean Plain SRT (.srt)',
      badge: 'Pure Text (No Tags)',
      desc: 'Raw subtitle text with all HTML, formatting, and font tags completely stripped',
      icon: FileText,
      color: 'text-zinc-500 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
    },
    {
      format: 'sbv' as const,
      name: 'YouTube Captions (.sbv)',
      badge: 'YouTube Creator Studio',
      desc: 'Direct upload format for YouTube Studio caption manager',
      icon: Youtube,
      color: 'text-red-500 bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800'
    },
    {
      format: 'lrc' as const,
      name: 'Mobile Lyrics (.lrc)',
      badge: 'Android & Music Players',
      desc: 'Synchronized line-by-line timed lyrics for mobile audio & podcast players',
      icon: Music,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
    },
    {
      format: 'txt' as const,
      name: 'Android Clean Transcript (.txt)',
      badge: 'Mobile Notes & Offline',
      desc: 'Clean dialogue text format optimized for Android reading & documentation',
      icon: Smartphone,
      color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800'
    },
    {
      format: 'json' as const,
      name: 'JSON Timed Text (.json)',
      badge: 'Developer API',
      desc: 'Structured JSON captions format with parsed millisecond times and lines',
      icon: FileCode,
      color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-800'
    },
    {
      format: 'copy' as const,
      name: 'One-Tap WhatsApp Copy',
      badge: 'Instant Clipboard',
      desc: 'Copies formatted dialogue directly to clipboard for fast WhatsApp/chat sharing',
      icon: Share2,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
    }
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden text-xs flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-850/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <Download size={18} />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Unified Subtitle Download Hub
              </h2>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Export stylized or clean subtitles in all supported media, web & streaming formats
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Stream Selector Strip */}
        <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-850/40 flex items-center justify-between gap-3 flex-wrap shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[10px] uppercase text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <Layers size={12} className="text-emerald-500" />
              <span>Select Stream to Export:</span>
            </span>
            <div className="flex gap-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-0.5 rounded-lg shadow-2xs">
              {[
                { id: 'ai' as const, label: 'AI Translated (Urdu)' },
                { id: 'google' as const, label: 'Google Translated' },
                { id: 'original' as const, label: 'Original Subtitles' }
              ].map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedStream(st.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer",
                    selectedStream === st.id ? "bg-emerald-600 text-white shadow-2xs" : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  )}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <span className="font-mono text-[10px] text-zinc-400">
            {subtitles.length} total segments
          </span>
        </div>

        {/* Format Options Grid */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DOWNLOAD_OPTIONS.map(opt => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.format}
                  type="button"
                  onClick={() => handleDownload(opt.format)}
                  className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-400 dark:hover:border-emerald-600 bg-white dark:bg-zinc-850 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all text-left flex items-start gap-3 cursor-pointer group shadow-2xs"
                >
                  <div className={cn("p-2 rounded-xl shrink-0 mt-0.5 border", opt.color)}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-[11px] text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 truncate">
                        {opt.name}
                      </span>
                      <span className="text-[8.5px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shrink-0">
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-[9.5px] text-zinc-500 dark:text-zinc-400 leading-tight mt-1 line-clamp-2">
                      {opt.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-850/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
            <Info size={12} className="text-emerald-500" />
            <span>Files download with UTF-8 BOM encoding for perfect player font rendering</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 rounded-xl font-bold transition-colors cursor-pointer text-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
