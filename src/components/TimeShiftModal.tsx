import React, { useState } from 'react';
import { Clock, Plus, Minus, X, Check, FastForward, Rewind } from 'lucide-react';
import { SubtitleItem, shiftSubtitleTimings } from '../utils/srtParser';
import { cn } from '../utils/cn';

interface TimeShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtitles: SubtitleItem[];
  selectedCount: number;
  selectedIndices: Set<number>;
  onApply: (updated: SubtitleItem[], shiftMs: number) => void;
  onAddLog: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const TimeShiftModal: React.FC<TimeShiftModalProps> = ({
  isOpen,
  onClose,
  subtitles,
  selectedCount,
  selectedIndices,
  onApply,
  onAddLog
}) => {
  const [shiftDirection, setShiftDirection] = useState<'forward' | 'backward'>('forward');
  const [milliseconds, setMilliseconds] = useState<number>(500);
  const [applyToSelectedOnly, setApplyToSelectedOnly] = useState(false);

  if (!isOpen) return null;

  const presets = [100, 250, 500, 1000, 2000, 5000];

  const handleExecute = () => {
    if (milliseconds <= 0) return;
    const finalShift = shiftDirection === 'forward' ? milliseconds : -milliseconds;

    const updated = shiftSubtitleTimings(
      subtitles,
      finalShift,
      (applyToSelectedOnly && selectedCount > 0) ? selectedIndices : undefined
    );

    onApply(updated, finalShift);
    const scopeStr = (applyToSelectedOnly && selectedCount > 0) ? `${selectedCount} selected subtitles` : `all ${subtitles.length} subtitles`;
    onAddLog(`Shifted timings for ${scopeStr} by ${finalShift > 0 ? '+' : ''}${finalShift}ms.`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col text-xs">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Clock size={16} />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Subtitle Timing Sync & Shift</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">Synchronize dialogue timing by advancing or delaying timestamps</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">Shift Direction</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShiftDirection('forward')}
                className={cn(
                  "p-3 rounded-xl border flex items-center justify-center gap-2 font-bold cursor-pointer transition-all",
                  shiftDirection === 'forward'
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 shadow-2xs"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                )}
              >
                <FastForward size={16} className="text-emerald-500" />
                <span>Delay (+ Time / Forward)</span>
              </button>

              <button
                type="button"
                onClick={() => setShiftDirection('backward')}
                className={cn(
                  "p-3 rounded-xl border flex items-center justify-center gap-2 font-bold cursor-pointer transition-all",
                  shiftDirection === 'backward'
                    ? "bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950 dark:text-amber-300 shadow-2xs"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                )}
              >
                <Rewind size={16} className="text-amber-500" />
                <span>Advance (- Time / Earlier)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">Offset in Milliseconds</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="10"
                max="60000"
                step="50"
                value={milliseconds}
                onChange={e => setMilliseconds(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100"
              />
              <span className="font-bold text-zinc-500 text-xs shrink-0">ms ({milliseconds / 1000}s)</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">Quick Presets</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {presets.map(ms => (
                <button
                  key={ms}
                  type="button"
                  onClick={() => setMilliseconds(ms)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg border font-mono text-[10px] font-bold transition-all cursor-pointer",
                    milliseconds === ms
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  )}
                >
                  {ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`}
                </button>
              ))}
            </div>
          </div>

          {selectedCount > 0 && (
            <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60">
              <label className="flex items-center gap-2 cursor-pointer text-blue-800 dark:text-blue-300 font-bold">
                <input
                  type="checkbox"
                  checked={applyToSelectedOnly}
                  onChange={e => setApplyToSelectedOnly(e.target.checked)}
                  className="accent-blue-600 rounded"
                />
                <span>Apply only to {selectedCount} selected subtitle(s)</span>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecute}
            disabled={milliseconds <= 0}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Clock size={14} />
            <span>Apply Shift</span>
          </button>
        </div>

      </div>
    </div>
  );
};
