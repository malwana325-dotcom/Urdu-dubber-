import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Maximize2, 
  Minimize2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  FileCode, 
  Film, 
  Clock, 
  Sparkles,
  Download,
  Eye,
  Check,
  Copy
} from 'lucide-react';
import { SubtitleItem, timeStringToMs, msToTimeString } from '../utils/srtParser';
import { 
  generateFormattedSRT, 
  generateASS, 
  generateSSA, 
  generateWebVTT, 
  generateCleanSRT, 
  generateYouTubeSBV, 
  generateLRC, 
  generateJSONCaptions,
  hasFormatting 
} from '../utils/subtitleFormatter';
import { cn } from '../utils/cn';

interface SubtitlePreviewSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtitles: SubtitleItem[];
  urduFont: string;
  translatedFontSize: number;
  fileName: string;
  activeStylingConfig?: any;
}

export const SubtitlePreviewSpaceModal: React.FC<SubtitlePreviewSpaceModalProps> = ({
  isOpen,
  onClose,
  subtitles,
  urduFont,
  translatedFontSize,
  fileName,
  activeStylingConfig
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [selectedStream, setSelectedStream] = useState<'ai' | 'google' | 'original' | 'dual'>('ai');
  const [viewMode, setViewMode] = useState<'player' | 'tape' | 'code'>('player');
  const [codeFormat, setCodeFormat] = useState<'srt' | 'ass' | 'ssa' | 'vtt' | 'sbv' | 'lrc' | 'json'>('srt');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  // Calculate total duration from last subtitle
  const totalDurationMs = useMemo(() => {
    if (subtitles.length === 0) return 60000;
    const lastItem = subtitles[subtitles.length - 1];
    return Math.max(timeStringToMs(lastItem.endTime) + 2000, 10000);
  }, [subtitles]);

  // Current active subtitle based on currentTimeMs
  const activeSubtitle = useMemo(() => {
    if (subtitles.length === 0) return null;
    return subtitles.find(s => {
      const start = timeStringToMs(s.startTime);
      const end = timeStringToMs(s.endTime);
      return currentTimeMs >= start && currentTimeMs <= end;
    }) || null;
  }, [subtitles, currentTimeMs]);

  // Playback Loop
  useEffect(() => {
    if (!isPlaying) {
      lastTimestampRef.current = null;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const step = (now: number) => {
      if (lastTimestampRef.current !== null) {
        const delta = (now - lastTimestampRef.current) * playbackSpeed;
        setCurrentTimeMs(prev => {
          const next = prev + delta;
          if (next >= totalDurationMs) {
            setIsPlaying(false);
            return totalDurationMs;
          }
          return next;
        });
      }
      lastTimestampRef.current = now;
      animationFrameRef.current = requestAnimationFrame(step);
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, playbackSpeed, totalDurationMs]);

  const togglePlay = useCallback(() => {
    if (currentTimeMs >= totalDurationMs) {
      setCurrentTimeMs(0);
    }
    setIsPlaying(prev => !prev);
  }, [currentTimeMs, totalDurationMs]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMs = Number(e.target.value);
    setCurrentTimeMs(newMs);
  };

  const handleSkip = (seconds: number) => {
    setCurrentTimeMs(prev => Math.min(totalDurationMs, Math.max(0, prev + seconds * 1000)));
  };

  const jumpToSubtitle = (item: SubtitleItem) => {
    setCurrentTimeMs(timeStringToMs(item.startTime));
  };

  const handleJumpNext = () => {
    const next = subtitles.find(s => timeStringToMs(s.startTime) > currentTimeMs);
    if (next) setCurrentTimeMs(timeStringToMs(next.startTime));
  };

  const handleJumpPrev = () => {
    const prevItems = subtitles.filter(s => timeStringToMs(s.startTime) < currentTimeMs - 500);
    if (prevItems.length > 0) {
      const prev = prevItems[prevItems.length - 1];
      setCurrentTimeMs(timeStringToMs(prev.startTime));
    } else {
      setCurrentTimeMs(0);
    }
  };

  // Raw format code generation
  const generatedCode = useMemo(() => {
    if (!isOpen || viewMode !== 'code') return '';
    switch (codeFormat) {
      case 'srt': return generateFormattedSRT(subtitles, selectedStream === 'dual' ? 'ai' : selectedStream);
      case 'ass': return generateASS(subtitles, { fontFamily: urduFont, fontSize: 44, type: selectedStream === 'dual' ? 'ai' : selectedStream, stylingConfig: activeStylingConfig });
      case 'ssa': return generateSSA(subtitles, { fontFamily: urduFont, fontSize: 38, type: selectedStream === 'dual' ? 'ai' : selectedStream, stylingConfig: activeStylingConfig });
      case 'vtt': return generateWebVTT(subtitles, selectedStream === 'dual' ? 'ai' : selectedStream);
      case 'sbv': return generateYouTubeSBV(subtitles, selectedStream === 'dual' ? 'ai' : selectedStream);
      case 'lrc': return generateLRC(subtitles, selectedStream === 'dual' ? 'ai' : selectedStream);
      case 'json': return generateJSONCaptions(subtitles, selectedStream === 'dual' ? 'ai' : selectedStream);
      default: return '';
    }
  }, [isOpen, viewMode, codeFormat, subtitles, selectedStream, urduFont, activeStylingConfig]);

  const handleCopyCode = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className={cn(
          "bg-zinc-900 border border-zinc-800 text-white rounded-3xl shadow-2xl flex flex-col overflow-hidden text-xs w-full transition-all duration-300",
          isFullScreen ? "fixed inset-0 h-screen w-screen rounded-none z-[120]" : "max-w-6xl h-[92vh]"
        )}
      >
        {/* Top Header */}
        <div className="p-3.5 sm:p-4 border-b border-zinc-800 bg-zinc-950/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 text-white shadow-xs">
              <Film size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm sm:text-base text-zinc-100">
                  Subtitle Preview Space & Playback Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-mono text-[9px] font-bold border border-emerald-800">
                  All Formats Supported
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Play and preview real-time styled subtitle streams across video simulation, timeline tape, and code
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-zinc-800 border border-zinc-700/80 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('player')}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer",
                  viewMode === 'player' ? "bg-emerald-600 text-white shadow-xs" : "text-zinc-400 hover:text-white"
                )}
              >
                <Eye size={12} />
                <span>Player</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('tape')}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer",
                  viewMode === 'tape' ? "bg-emerald-600 text-white shadow-xs" : "text-zinc-400 hover:text-white"
                )}
              >
                <Clock size={12} />
                <span>Timeline</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('code')}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer",
                  viewMode === 'code' ? "bg-emerald-600 text-white shadow-xs" : "text-zinc-400 hover:text-white"
                )}
              >
                <FileCode size={12} />
                <span>Format Code</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all cursor-pointer"
              title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullScreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all cursor-pointer"
              title="Close Preview Space"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Stream & Config Strip */}
        <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/90 flex items-center justify-between gap-3 flex-wrap shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Layers size={12} className="text-emerald-400" />
              <span>Preview Stream:</span>
            </span>
            <div className="flex gap-1 bg-zinc-850 p-0.5 rounded-lg border border-zinc-800">
              {[
                { id: 'ai' as const, label: 'Urdu AI' },
                { id: 'google' as const, label: 'Google Machine' },
                { id: 'original' as const, label: 'Original English' },
                { id: 'dual' as const, label: 'Dual Bilingual' }
              ].map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedStream(s.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer",
                    selectedStream === s.id ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-white"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {viewMode === 'code' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Format:</span>
              <div className="flex gap-1">
                {(['srt', 'ass', 'ssa', 'vtt', 'sbv', 'lrc', 'json'] as const).map(fmt => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setCodeFormat(fmt)}
                    className={cn(
                      "px-2 py-0.5 rounded text-[9.5px] uppercase font-mono font-bold transition-colors cursor-pointer",
                      codeFormat === fmt ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"
                    )}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {viewMode === 'player' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-radial from-zinc-900 via-zinc-950 to-black relative">
              {/* Cinematic Simulated Video Screen */}
              <div className="w-full max-w-4xl aspect-video bg-zinc-950 border border-zinc-800/80 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col justify-end p-8">
                {/* Visualizer / Subtle Cinema Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 pointer-events-none" />
                <div className="absolute top-4 left-4 flex items-center gap-2 text-[10px] font-mono text-zinc-500 bg-black/60 px-2.5 py-1 rounded-full border border-white/5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>PREVIEW TIME: {msToTimeString(currentTimeMs)}</span>
                  {activeSubtitle && <span>• #{activeSubtitle.index}</span>}
                </div>

                {/* Subtitle Rendering Area */}
                <div className="relative z-10 w-full text-center space-y-2 mb-4">
                  {activeSubtitle ? (
                    <div className="space-y-2 animate-in fade-in duration-150">
                      {/* Urdu / Target Stream */}
                      {(selectedStream === 'ai' || selectedStream === 'dual') && (
                        <div 
                          className="font-urdu leading-relaxed drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)]"
                          style={{ 
                            fontFamily: urduFont,
                            fontSize: `${Math.max(translatedFontSize, 26)}px`
                          }}
                          dir="rtl"
                          dangerouslySetInnerHTML={{ 
                            __html: hasFormatting(activeSubtitle.translatedText || '') 
                              ? (activeSubtitle.translatedText || '') 
                              : `<font color="${activeSubtitle.styleColor || '#FFE066'}">${activeSubtitle.translatedText || activeSubtitle.text}</font>` 
                          }}
                        />
                      )}

                      {selectedStream === 'google' && (
                        <div 
                          className="font-urdu leading-relaxed drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)]"
                          style={{ 
                            fontFamily: urduFont,
                            fontSize: `${Math.max(translatedFontSize, 24)}px`
                          }}
                          dir="rtl"
                        >
                          {activeSubtitle.googleTranslateText || activeSubtitle.text}
                        </div>
                      )}

                      {/* Original English Stream */}
                      {(selectedStream === 'original' || selectedStream === 'dual') && (
                        <div 
                          className="font-sans text-sm md:text-base text-zinc-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] max-w-2xl mx-auto"
                          dangerouslySetInnerHTML={hasFormatting(activeSubtitle.text) ? { __html: activeSubtitle.text } : undefined}
                        >
                          {!hasFormatting(activeSubtitle.text) ? activeSubtitle.text : undefined}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-zinc-600 text-xs italic">
                      [Silence • No subtitle at {msToTimeString(currentTimeMs).slice(0, 8)}]
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'tape' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {subtitles.map((sub) => {
                const start = timeStringToMs(sub.startTime);
                const end = timeStringToMs(sub.endTime);
                const isCurrent = currentTimeMs >= start && currentTimeMs <= end;

                return (
                  <div
                    key={sub.index}
                    onClick={() => jumpToSubtitle(sub)}
                    className={cn(
                      "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4",
                      isCurrent
                        ? "bg-emerald-950/60 border-emerald-500 shadow-md ring-1 ring-emerald-500/40"
                        : "bg-zinc-850/60 border-zinc-800 hover:bg-zinc-800 text-zinc-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-zinc-500 text-[10px] w-8">#{sub.index}</span>
                      <div className="font-mono text-[10px] text-zinc-400">
                        {sub.startTime} → {sub.endTime}
                      </div>
                    </div>

                    <div className="flex-1 text-right font-urdu text-sm" dir="rtl">
                      {selectedStream === 'google' 
                        ? (sub.googleTranslateText || sub.text)
                        : (sub.translatedText || sub.text)}
                    </div>

                    <div className="text-left font-sans text-xs text-zinc-400 max-w-xs truncate">
                      {sub.text}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === 'code' && (
            <div className="flex-1 overflow-hidden flex flex-col p-4">
              <div className="flex items-center justify-between pb-2">
                <span className="font-mono text-[10px] text-zinc-400">
                  EXPORT PREVIEW: .{codeFormat.toUpperCase()} ({subtitles.length} entries)
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                </button>
              </div>
              <pre className="flex-1 overflow-auto p-4 bg-zinc-950 rounded-xl border border-zinc-800 font-mono text-[10.5px] text-emerald-400 select-text">
                {generatedCode}
              </pre>
            </div>
          )}
        </div>

        {/* Playback Controls Toolbar */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex flex-col gap-3 shrink-0">
          {/* Timeline Scrubber */}
          <div className="flex items-center gap-3 w-full">
            <span className="font-mono text-[10px] text-zinc-400 w-16 text-right">
              {msToTimeString(currentTimeMs).slice(3, 11)}
            </span>
            <input
              type="range"
              min="0"
              max={totalDurationMs}
              value={currentTimeMs}
              onChange={handleSeek}
              className="flex-1 accent-emerald-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
            />
            <span className="font-mono text-[10px] text-zinc-400 w-16">
              {msToTimeString(totalDurationMs).slice(3, 11)}
            </span>
          </div>

          {/* Controls buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSkip(-5)}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-mono text-[10px] font-bold cursor-pointer"
                title="Rewind 5s"
              >
                -5s
              </button>
              <button
                type="button"
                onClick={handleJumpPrev}
                className="p-1.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                title="Previous Subtitle"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-md cursor-pointer"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                type="button"
                onClick={handleJumpNext}
                className="p-1.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                title="Next Subtitle"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleSkip(5)}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-mono text-[10px] font-bold cursor-pointer"
                title="Forward 5s"
              >
                +5s
              </button>

              <button
                type="button"
                onClick={() => setCurrentTimeMs(0)}
                className="p-1.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer ml-1"
                title="Reset to 0"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {/* Speed Selector */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-zinc-500 font-bold mr-1">Speed:</span>
              {[0.5, 1, 1.5, 2].map(speed => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => setPlaybackSpeed(speed)}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer",
                    playbackSpeed === speed ? "bg-emerald-600 text-white" : "bg-zinc-850 text-zinc-400 hover:text-white"
                  )}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
