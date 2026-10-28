import React, { useState, useMemo } from 'react';
import { 
  X, 
  RotateCcw, 
  Check, 
  SlidersHorizontal, 
  FoldHorizontal, 
  ListFilter, 
  AlertTriangle, 
  Lock, 
  Zap, 
  Info,
  ShieldCheck,
  Search
} from 'lucide-react';
import { SubtitleItem } from '../utils/srtParser';
import { 
  calculateSubtitleGaps, 
  adjustSubtitleGaps, 
  OriginalTimingMap,
  SubtitleGapInfo
} from '../utils/subtitleOperations';
import { cn } from '../utils/cn';

interface GapTimingModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtitles: SubtitleItem[];
  selectedCount: number;
  selectedIndices: Set<number>;
  originalTimingMap: OriginalTimingMap;
  onApply: (updated: SubtitleItem[], summary: string) => void;
  onResetToOriginal: () => void;
  onAddLog: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  onAddNotification: (msg: string, type: 'success' | 'error') => void;
}

type TabType = 'remove' | 'custom' | 'inspector';

export const GapTimingModal: React.FC<GapTimingModalProps> = ({
  isOpen,
  onClose,
  subtitles,
  selectedCount,
  selectedIndices,
  originalTimingMap,
  onApply,
  onResetToOriginal,
  onAddLog,
  onAddNotification
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('remove');
  
  // Tab 1: Remove Gaps (Seamless) state
  const [removeGapPreset, setRemoveGapPreset] = useState<number>(0); // 0ms = seamless, 40ms = 1 frame, 80ms = 2 frames
  const [removeMaxThreshold, setRemoveMaxThreshold] = useState<number>(0); // 0 = unlimited / all gaps, 1000, 2000, 5000
  
  // Tab 2: Custom Gap Range state
  const [customGapMs, setCustomGapMs] = useState<number>(80);
  const [customMode, setCustomMode] = useState<'exact' | 'increase' | 'decrease'>('exact');
  const [customDeltaMs, setCustomDeltaMs] = useState<number>(50);
  const [customMaxThreshold, setCustomMaxThreshold] = useState<number>(0);
  const [minDurationMs, setMinDurationMs] = useState<number>(250);
  
  // Common scope
  const [applyToSelectedOnly, setApplyToSelectedOnly] = useState<boolean>(false);
  
  // Inspector search / filter
  const [inspectorSearch, setInspectorSearch] = useState<string>('');
  const [inspectorFilter, setInspectorFilter] = useState<'all' | 'gapsOnly' | 'overlapsOnly' | 'seamlessOnly'>('all');

  // Gaps analysis for current subtitles
  const gapList = useMemo<SubtitleGapInfo[]>(() => {
    return calculateSubtitleGaps(subtitles);
  }, [subtitles]);

  // General gap statistics
  const stats = useMemo(() => {
    if (gapList.length === 0) {
      return { totalPairs: 0, gapsWithSpace: 0, seamlessCount: 0, overlapCount: 0, avgGapMs: 0 };
    }
    const gapsWithSpace = gapList.filter(g => g.gapMs > 0).length;
    const seamlessCount = gapList.filter(g => g.gapMs === 0).length;
    const overlapCount = gapList.filter(g => g.gapMs < 0).length;
    const totalGapMs = gapList.reduce((acc, g) => acc + Math.max(0, g.gapMs), 0);
    const avgGapMs = gapsWithSpace > 0 ? Math.round(totalGapMs / gapsWithSpace) : 0;
    return {
      totalPairs: gapList.length,
      gapsWithSpace,
      seamlessCount,
      overlapCount,
      avgGapMs
    };
  }, [gapList]);

  // Check how many items differ from original timing map
  const modifiedFromOriginalCount = useMemo(() => {
    let count = 0;
    subtitles.forEach(s => {
      const orig = originalTimingMap[s.index];
      if (orig && (orig.startTime !== s.startTime || orig.endTime !== s.endTime)) {
        count++;
      }
    });
    return count;
  }, [subtitles, originalTimingMap]);

  if (!isOpen) return null;

  const effectiveSelected = applyToSelectedOnly && selectedCount > 0 ? selectedIndices : undefined;
  const scopeLabel = effectiveSelected ? `${selectedCount} selected blocks` : `all ${subtitles.length} blocks`;

  // Handler for Tab 1: Remove Gaps
  const handleExecuteRemoveGaps = () => {
    const { updatedSubtitles, adjustedCount } = adjustSubtitleGaps(subtitles, {
      mode: 'exact',
      targetGapMs: removeGapPreset,
      maxGapThresholdMs: removeMaxThreshold,
      minDurationMs,
      selectedIndices: effectiveSelected
    });

    if (adjustedCount === 0) {
      onAddNotification("No gaps needed adjustment with the current settings.", "success");
      return;
    }

    const gapDesc = removeGapPreset === 0 ? "0ms (seamless)" : `${removeGapPreset}ms`;
    const summary = `Removed gaps for ${adjustedCount} subtitle blocks (set to ${gapDesc}) across ${scopeLabel}.`;
    onApply(updatedSubtitles, summary);
    onAddNotification(`Snapped ${adjustedCount} subtitle endings (${gapDesc})`, "success");
    onAddLog(summary, "success");
  };

  // Handler for Tab 2: Custom Gap Range
  const handleExecuteCustomGap = () => {
    const { updatedSubtitles, adjustedCount } = adjustSubtitleGaps(subtitles, {
      mode: customMode,
      targetGapMs: customGapMs,
      deltaMs: customDeltaMs,
      maxGapThresholdMs: customMaxThreshold,
      minDurationMs,
      selectedIndices: effectiveSelected
    });

    if (adjustedCount === 0) {
      onAddNotification("No subtitle blocks met criteria for gap adjustment.", "success");
      return;
    }

    let modeDesc = `exact gap ${customGapMs}ms`;
    if (customMode === 'increase') modeDesc = `increased gaps by +${customDeltaMs}ms`;
    if (customMode === 'decrease') modeDesc = `decreased gaps by -${customDeltaMs}ms`;

    const summary = `Adjusted time gaps for ${adjustedCount} subtitle blocks (${modeDesc}) across ${scopeLabel}.`;
    onApply(updatedSubtitles, summary);
    onAddNotification(`Adjusted ${adjustedCount} subtitle blocks (${modeDesc})`, "success");
    onAddLog(summary, "success");
  };

  // Handler for single row snap from inspector
  const handleSnapSingle = (targetIndex: number, targetGap: number) => {
    const { updatedSubtitles, adjustedCount } = adjustSubtitleGaps(subtitles, {
      mode: 'exact',
      targetGapMs: targetGap,
      minDurationMs,
      targetIndex
    });

    if (adjustedCount > 0) {
      const summary = `Snapped gap after block #${targetIndex} to ${targetGap}ms.`;
      onApply(updatedSubtitles, summary);
      onAddNotification(`Adjusted gap after block #${targetIndex}`, "success");
      onAddLog(summary, "success");
    }
  };

  // Filtered inspector rows
  const filteredGaps = gapList.filter(g => {
    if (inspectorFilter === 'gapsOnly' && g.gapMs <= 0) return false;
    if (inspectorFilter === 'overlapsOnly' && g.gapMs >= 0) return false;
    if (inspectorFilter === 'seamlessOnly' && g.gapMs !== 0) return false;
    if (inspectorSearch.trim()) {
      const q = inspectorSearch.toLowerCase();
      const matchIdx = g.index.toString().includes(q) || g.nextIndex.toString().includes(q);
      const matchText = g.text.toLowerCase().includes(q) || g.nextText.toLowerCase().includes(q);
      if (!matchIdx && !matchText) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-xs text-zinc-800 dark:text-zinc-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:px-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-sm shrink-0">
              <FoldHorizontal size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                  Time Gap Management & Snapping
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                  Non-destructive Start Times
                </span>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">
                Remove gaps or set uniform spacing by adjusting ending timestamps. Starting timestamps are strictly locked.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Top Reset Button */}
            <button
              type="button"
              onClick={onResetToOriginal}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer shadow-2xs",
                modifiedFromOriginalCount > 0
                  ? "bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 dark:text-amber-200 border-amber-300 dark:border-amber-700"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700 cursor-not-allowed opacity-60"
              )}
              title="Reset all subtitle timestamps back to original baseline at any time"
              disabled={modifiedFromOriginalCount === 0}
            >
              <RotateCcw size={13} className={modifiedFromOriginalCount > 0 ? "text-amber-600 dark:text-amber-400" : ""} />
              <span>Reset to Original</span>
              {modifiedFromOriginalCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded-full text-[9px] font-bold">
                  {modifiedFromOriginalCount}
                </span>
              )}
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

        {/* Tab Navigation Menu */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 bg-zinc-100/60 dark:bg-zinc-950/40">
          <div className="flex items-center gap-2 overflow-x-auto py-2">
            <button
              type="button"
              onClick={() => setActiveTab('remove')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                activeTab === 'remove'
                  ? "bg-white dark:bg-zinc-800 text-cyan-600 dark:text-cyan-400 shadow-xs border border-zinc-200 dark:border-zinc-700"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
              )}
            >
              <FoldHorizontal size={14} />
              <span>Remove Gaps (Seamless / 0ms)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                activeTab === 'custom'
                  ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-zinc-200 dark:border-zinc-700"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
              )}
            >
              <SlidersHorizontal size={14} />
              <span>Set Known Gap Range</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('inspector')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                activeTab === 'inspector'
                  ? "bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-xs border border-zinc-200 dark:border-zinc-700"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
              )}
            >
              <ListFilter size={14} />
              <span>Gap Inspector ({gapList.length} pairs)</span>
            </button>
          </div>

          {/* Quick Metrics Capsule */}
          <div className="hidden md:flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 py-1">
            <span>Gaps: <strong className="text-zinc-700 dark:text-zinc-200">{stats.gapsWithSpace}</strong></span>
            <span>Avg Gap: <strong className="text-cyan-600 dark:text-cyan-400">{stats.avgGapMs}ms</strong></span>
            {stats.overlapCount > 0 && (
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                <AlertTriangle size={11} /> {stats.overlapCount} overlaps
              </span>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">

          {/* Timing Protection Banner */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/60 text-cyan-900 dark:text-cyan-200">
            <Lock size={15} className="text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-[11px] space-y-0.5">
              <span className="font-bold">Dialogue Entry Start Timestamps are 100% Protected:</span>
              <p className="text-cyan-800/80 dark:text-cyan-300/80 leading-relaxed">
                Start times (entry cues) never change, maintaining synchronized voice alignment. Only the end times of previous blocks are extended or shortened to remove or adjust the gap before the next block.
              </p>
            </div>
          </div>

          {/* TAB 1: REMOVE GAPS (SEAMLESS) */}
          {activeTab === 'remove' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Preset gap target */}
              <div>
                <label className="font-bold text-zinc-900 dark:text-zinc-100 block mb-2 text-xs">
                  Target Gap Between Subtitles:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { value: 0, label: '0 ms (Seamless)', desc: 'Completely flush, no black frame' },
                    { value: 40, label: '40 ms (1 Frame)', desc: 'Standard 1-frame cue clearance' },
                    { value: 80, label: '80 ms (2 Frames)', desc: 'Clean transition space' },
                    { value: 120, label: '120 ms (3 Frames)', desc: 'Noticeable dialogue separation' },
                  ].map(preset => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setRemoveGapPreset(preset.value)}
                      className={cn(
                        "p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between",
                        removeGapPreset === preset.value
                          ? "bg-cyan-50/90 dark:bg-cyan-950/60 border-cyan-400 dark:border-cyan-600 text-cyan-900 dark:text-cyan-100 ring-2 ring-cyan-500/20 shadow-xs"
                          : "bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">{preset.label}</span>
                        {removeGapPreset === preset.value && <Check size={14} className="text-cyan-600 dark:text-cyan-400" />}
                      </div>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                        {preset.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Threshold Filter: Avoid stretching across long pauses */}
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                    Maximum Gap Threshold (Scene Pause Protection)
                  </label>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    {removeMaxThreshold === 0 ? "Bridge all gaps regardless of duration" : `Only bridge gaps ≤ ${removeMaxThreshold} ms`}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 0, label: 'All Gaps (No Limit)' },
                    { value: 1000, label: '≤ 1.0s (1,000 ms)' },
                    { value: 2000, label: '≤ 2.0s (2,000 ms)' },
                    { value: 5000, label: '≤ 5.0s (5,000 ms)' },
                  ].map(thresh => (
                    <button
                      key={thresh.value}
                      type="button"
                      onClick={() => setRemoveMaxThreshold(thresh.value)}
                      className={cn(
                        "py-1.5 px-2.5 rounded-lg text-center text-xs font-semibold border transition-all cursor-pointer",
                        removeMaxThreshold === thresh.value
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-xs"
                          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      )}
                    >
                      {thresh.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Info size={12} className="text-zinc-400 shrink-0" />
                  <span>Setting a threshold prevents dialogue blocks from stretching across intentional 10s silent scenes or scene changes.</span>
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <div className="text-zinc-500 text-[11px]">
                  Target: <strong>{removeGapPreset}ms</strong> • Threshold: <strong>{removeMaxThreshold === 0 ? 'All' : `≤${removeMaxThreshold}ms`}</strong> • Scope: <strong>{scopeLabel}</strong>
                </div>
                <button
                  type="button"
                  onClick={handleExecuteRemoveGaps}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-md cursor-pointer transition-all active:scale-[0.98]"
                >
                  <Zap size={14} />
                  <span>Remove Gaps Now ({removeGapPreset === 0 ? 'Seamless' : `${removeGapPreset}ms`})</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SET KNOWN GAP RANGE */}
          {activeTab === 'custom' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Adjustment Mode */}
              <div>
                <label className="font-bold text-zinc-900 dark:text-zinc-100 block mb-2 text-xs">
                  Gap Adjustment Mode:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'exact', title: 'Set Exact Gap', desc: 'Sets every gap to the specified ms value' },
                    { id: 'decrease', title: 'Decrease Gaps', desc: 'Shortens existing gaps towards next block' },
                    { id: 'increase', title: 'Increase Gaps', desc: 'Widens gaps by moving end time earlier' },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setCustomMode(m.id as any)}
                      className={cn(
                        "p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between",
                        customMode === m.id
                          ? "bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 text-indigo-900 dark:text-indigo-100 ring-2 ring-indigo-500/20 shadow-xs"
                          : "bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">{m.title}</span>
                        {customMode === m.id && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
                      </div>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                        {m.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider and Millisecond Controls */}
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-zinc-900 dark:text-zinc-100 text-xs block">
                      {customMode === 'exact' ? 'Target Gap Duration:' : 'Adjustment Step (Delta):'}
                    </label>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {customMode === 'exact'
                        ? `Ending timestamp will be set to: Next_Start - ${customGapMs}ms`
                        : `Ending timestamp will be adjusted by ${customDeltaMs}ms`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={5000}
                      step={10}
                      value={customMode === 'exact' ? customGapMs : customDeltaMs}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                        if (customMode === 'exact') setCustomGapMs(val);
                        else setCustomDeltaMs(val);
                      }}
                      className="w-24 px-2.5 py-1.5 text-center font-mono font-bold text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-zinc-500 font-semibold text-xs">ms</span>
                  </div>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min={0}
                  max={2000}
                  step={10}
                  value={customMode === 'exact' ? customGapMs : customDeltaMs}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (customMode === 'exact') setCustomGapMs(val);
                    else setCustomDeltaMs(val);
                  }}
                  className="w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer"
                />

                {/* Presets and Steppers */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-700/60">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold mr-1">Presets:</span>
                    {[0, 40, 80, 150, 250, 500, 1000].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          if (customMode === 'exact') setCustomGapMs(preset);
                          else setCustomDeltaMs(preset);
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                      >
                        {preset}ms
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold mr-1">Nudge:</span>
                    {[-50, -10, 10, 50].map(delta => (
                      <button
                        key={delta}
                        type="button"
                        onClick={() => {
                          if (customMode === 'exact') setCustomGapMs(prev => Math.max(0, prev + delta));
                          else setCustomDeltaMs(prev => Math.max(0, prev + delta));
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-200/80 dark:bg-zinc-700/80 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 cursor-pointer"
                      >
                        {delta > 0 ? `+${delta}` : delta}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Safety: Minimum subtitle duration */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/80">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">Subtitle Minimum Duration Guard</span>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Protects blocks from being squished shorter than this duration</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={100}
                    max={2000}
                    step={50}
                    value={minDurationMs}
                    onChange={(e) => setMinDurationMs(Math.max(100, parseInt(e.target.value, 10) || 200))}
                    className="w-20 px-2 py-1 text-center font-mono font-bold text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-lg"
                  />
                  <span className="text-zinc-400 text-xs font-mono">ms</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <div className="text-zinc-500 text-[11px]">
                  Mode: <strong className="capitalize">{customMode}</strong> • Gap: <strong>{customMode === 'exact' ? `${customGapMs}ms` : `±${customDeltaMs}ms`}</strong> • Scope: <strong>{scopeLabel}</strong>
                </div>
                <button
                  type="button"
                  onClick={handleExecuteCustomGap}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md cursor-pointer transition-all active:scale-[0.98]"
                >
                  <SlidersHorizontal size={14} />
                  <span>Apply Gap Adjustment</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: GAP INSPECTOR & LIST */}
          {activeTab === 'inspector' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Search and Filters */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search by block # or dialogue text..."
                    value={inspectorSearch}
                    onChange={(e) => setInspectorSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  {[
                    { id: 'all', label: `All (${gapList.length})` },
                    { id: 'gapsOnly', label: `Gaps > 0 (${stats.gapsWithSpace})` },
                    { id: 'seamlessOnly', label: `0ms (${stats.seamlessCount})` },
                    { id: 'overlapsOnly', label: `Overlaps (${stats.overlapCount})` },
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setInspectorFilter(f.id as any)}
                      className={cn(
                        "px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer",
                        inspectorFilter === f.id
                          ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs"
                          : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inspector Table */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xs max-h-[350px] overflow-y-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="sticky top-0 z-10 bg-zinc-100/90 dark:bg-zinc-800/90 backdrop-blur-xs border-b border-zinc-200 dark:border-zinc-700 font-bold text-zinc-600 dark:text-zinc-300">
                    <tr>
                      <th className="py-2 px-3 w-16">Block #</th>
                      <th className="py-2 px-3">Current Range (Start locked)</th>
                      <th className="py-2 px-3 w-32 text-center">Gap to Next</th>
                      <th className="py-2 px-3">Next Block # & Start</th>
                      <th className="py-2 px-3 w-28 text-right">Quick Snap</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {filteredGaps.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-400">
                          No subtitle gap pairs matched your filter.
                        </td>
                      </tr>
                    ) : (
                      filteredGaps.map(g => {
                        const isSelected = selectedIndices.has(g.index);
                        return (
                          <tr
                            key={g.index}
                            className={cn(
                              "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors",
                              isSelected && "bg-indigo-50/40 dark:bg-indigo-950/20"
                            )}
                          >
                            <td className="py-2 px-3 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                              #{g.index}
                            </td>

                            <td className="py-2 px-3">
                              <div className="flex items-center gap-1 font-mono text-[10px]">
                                <span className="flex items-center gap-0.5 text-zinc-500 dark:text-zinc-400">
                                  <Lock size={10} className="text-cyan-500" />
                                  {g.startTime}
                                </span>
                                <span className="text-zinc-300 dark:text-zinc-600">→</span>
                                <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{g.endTime}</span>
                              </div>
                              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[200px] mt-0.5">
                                {g.text || '(empty dialogue)'}
                              </div>
                            </td>

                            <td className="py-2 px-3 text-center">
                              {g.gapMs === 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                  0 ms (Flush)
                                </span>
                              ) : g.gapMs < 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                  {g.gapMs} ms (Overlap)
                                </span>
                              ) : g.gapMs > 2000 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                  +{g.gapMs} ms (Pause)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                                  +{g.gapMs} ms
                                </span>
                              )}
                            </td>

                            <td className="py-2 px-3">
                              <div className="flex items-center gap-1 font-mono text-[10px]">
                                <span className="font-bold text-zinc-700 dark:text-zinc-300">#{g.nextIndex}</span>
                                <span className="text-zinc-400">@</span>
                                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{g.nextStartTime}</span>
                              </div>
                              <div className="text-[10px] text-zinc-400 truncate max-w-[200px] mt-0.5">
                                {g.nextText || ''}
                              </div>
                            </td>

                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSnapSingle(g.index, 0)}
                                  className="px-2 py-1 rounded bg-cyan-50 dark:bg-cyan-950/50 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-[10px] font-bold cursor-pointer"
                                  title="Extend this block's end time flush to next start time (0ms gap)"
                                >
                                  Snap 0ms
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSnapSingle(g.index, 80)}
                                  className="px-1.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-mono font-semibold cursor-pointer"
                                  title="Set gap after this block to 80ms"
                                >
                                  80ms
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SCOPE SELECTION (Applies to all operations) */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/80 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 block text-xs">Operation Scope:</span>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Choose whether gap changes apply to the entire document or checked rows only.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setApplyToSelectedOnly(false)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border",
                  !applyToSelectedOnly
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-xs"
                    : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}
              >
                All Subtitles ({subtitles.length})
              </button>

              <button
                type="button"
                onClick={() => setApplyToSelectedOnly(true)}
                disabled={selectedCount === 0}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                  selectedCount === 0
                    ? "opacity-40 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400"
                    : applyToSelectedOnly
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs cursor-pointer"
                    : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                )}
              >
                Selected Only ({selectedCount})
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/90 flex flex-wrap items-center justify-between gap-3">
          {/* Bottom Reset Button */}
          <button
            type="button"
            onClick={onResetToOriginal}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer",
              modifiedFromOriginalCount > 0
                ? "bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 dark:text-amber-200 border-amber-300 dark:border-amber-700 shadow-2xs"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700 cursor-not-allowed opacity-60"
            )}
            title="Restore all starting and ending timestamps to initial project state"
            disabled={modifiedFromOriginalCount === 0}
          >
            <RotateCcw size={13} />
            <span>Reset to Original State</span>
            {modifiedFromOriginalCount > 0 && (
              <span className="text-[10px] font-mono font-normal">({modifiedFromOriginalCount} modified)</span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
