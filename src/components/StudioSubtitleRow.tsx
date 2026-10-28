import React, { memo } from 'react';
import { 
  ArrowLeftRight, 
  Copy, 
  Check, 
  Languages, 
  Plus, 
  Scissors, 
  Trash2 
} from 'lucide-react';
import { SubtitleItem, calculateDurationAndCPS } from '../utils/srtParser';
import { cn } from '../utils/cn';

export interface StudioSubtitleRowProps {
  item: SubtitleItem;
  isSelected: boolean;
  studioColumns: {
    index: boolean;
    timing: boolean;
    original: boolean;
    ai: boolean;
    google: boolean;
    swaps: boolean;
  };
  effectiveOriginalFont: string;
  effectiveOriginalSize: number;
  effectiveAiFont: string;
  effectiveAiSize: number;
  effectiveGoogleFont: string;
  effectiveGoogleSize: number;
  isCopied: boolean;
  onToggleSelect: (index: number) => void;
  onEditOriginal: (index: number, newText: string) => void;
  onEditTranslated: (index: number, newText: string) => void;
  onEditGoogle: (index: number, newText: string) => void;
  onSwapOriginalAi: (index: number) => void;
  onSwapAiGoogle: (index: number) => void;
  onCopyGoogleToAi: (index: number) => void;
  onCopyRowText: (text: string, index: number, e: React.MouseEvent) => void;
  onTranslateGoogle?: (index: number) => Promise<void> | void;
  onInsertAfter: (index: number) => void;
  onSplitRow: (index: number) => void;
  onDeleteRow: (index: number) => void;
  setRowRef: (index: number, el: HTMLTableRowElement | null) => void;
}

export const StudioSubtitleRow = memo(({
  item,
  isSelected,
  studioColumns,
  effectiveOriginalFont,
  effectiveOriginalSize,
  effectiveAiFont,
  effectiveAiSize,
  effectiveGoogleFont,
  effectiveGoogleSize,
  isCopied,
  onToggleSelect,
  onEditOriginal,
  onEditTranslated,
  onEditGoogle,
  onSwapOriginalAi,
  onSwapAiGoogle,
  onCopyGoogleToAi,
  onCopyRowText,
  onTranslateGoogle,
  onInsertAfter,
  onSplitRow,
  onDeleteRow,
  setRowRef
}: StudioSubtitleRowProps) => {
  const timingInfo = calculateDurationAndCPS(item.translatedText || item.text, item.startTime, item.endTime);
  const hasSoundCues = /\[[^\]]+\]|\([^\)]+\)/.test(item.text);
  const isRomanOrLatin = (item.translatedText || '').replace(/<[^>]+>/g, '').match(/[a-zA-Z]/g)?.length || 0;
  const urduCount = (item.translatedText || '').replace(/<[^>]+>/g, '').match(/[\u0600-\u06FF\u0750-\u077F]/g)?.length || 0;
  const isRomanUrdu = isRomanOrLatin > urduCount;

  return (
    <tr 
      ref={el => setRowRef(item.index, el)}
      className={cn(
        "transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/50",
        isSelected ? "bg-emerald-500/10 dark:bg-emerald-500/15" : ""
      )}
    >
      {/* Index & Checkbox Column */}
      {studioColumns.index && (
        <td className="p-2.5 align-top text-center w-12">
          <div className="flex flex-col items-center gap-1.5">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(item.index)}
              className="accent-emerald-600 rounded cursor-pointer w-3.5 h-3.5"
            />
            <span className="font-mono text-[10px] font-bold text-zinc-400">{item.index}</span>
            {item.styleColor && (
              <span 
                className="w-2.5 h-2.5 rounded-full shadow-2xs" 
                style={{ backgroundColor: item.styleColor }} 
                title={`Color: ${item.styleColor}`}
              />
            )}
          </div>
        </td>
      )}

      {/* Timing & CPS Column */}
      {studioColumns.timing && (
        <td className="p-2.5 align-top font-mono text-[9px] text-zinc-600 dark:text-zinc-400 w-36 shrink-0">
          <div className="font-semibold text-zinc-800 dark:text-zinc-200">{item.startTime}</div>
          <div className="text-zinc-300 dark:text-zinc-600 my-0.5">↓</div>
          <div className="font-semibold text-zinc-800 dark:text-zinc-200">{item.endTime}</div>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-bold">
              {timingInfo.durationSec}s
            </span>
            <span className={cn(
              "px-1.5 py-0.5 rounded font-bold",
              timingInfo.cps > 25 
                ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300" 
                : timingInfo.cps > 18
                ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
            )} title={timingInfo.cps > 25 ? "High CPS warning" : "Characters per second"}>
              {timingInfo.cps} cps
            </span>
          </div>
        </td>
      )}

      {/* Original Subtitles Column (FULLY EDITABLE) */}
      {studioColumns.original && (
        <td className="p-2.5 align-top">
          <div className="space-y-1.5">
            <textarea
              value={item.text}
              onChange={e => onEditOriginal(item.index, e.target.value)}
              placeholder="Edit original subtitle text..."
              rows={2}
              className="w-full leading-relaxed border rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-y text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-2xs transition-all"
              style={{ 
                fontSize: `${effectiveOriginalSize}px`,
                fontFamily: effectiveOriginalFont
              }}
            />
            <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
              <div className="flex items-center gap-1.5">
                <span>{item.text.length} chars</span>
                {hasSoundCues && (
                  <span className="text-[8px] px-1 py-0.2 rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-mono font-bold">
                    Audio Cue
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onSwapOriginalAi(item.index)}
                className="text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
                title="Swap with AI translated text"
              >
                <ArrowLeftRight size={10} />
                <span>Swap with AI</span>
              </button>
            </div>
          </div>
        </td>
      )}

      {/* AI Translation Column (FULLY EDITABLE) */}
      {studioColumns.ai && (
        <td className="p-2.5 align-top">
          <div className="space-y-1.5">
            <textarea
              value={item.translatedText || ''}
              onChange={e => onEditTranslated(item.index, e.target.value)}
              placeholder="اردو ترجمہ / Roman Urdu..."
              rows={2}
              className={cn(
                "w-full leading-[2.2] border rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-y text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-2xs transition-all",
                isRomanUrdu ? "text-left font-sans" : "font-urdu text-right"
              )}
              style={{
                fontFamily: isRomanUrdu ? 'inherit' : effectiveAiFont,
                fontSize: `${effectiveAiSize}px`
              }}
              dir={isRomanUrdu ? "ltr" : "rtl"}
            />
            <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
              <div className="flex items-center gap-1.5">
                <span>{(item.translatedText || '').length} chars</span>
                {isRomanUrdu && <span className="text-blue-600 dark:text-blue-400 font-bold">Roman Urdu</span>}
              </div>
              <div className="flex items-center gap-2">
                {item.translatedText && (
                  <button
                    type="button"
                    onClick={(e) => onCopyRowText(item.translatedText || '', item.index, e)}
                    className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
                    title="Copy translated text"
                  >
                    {isCopied ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                    <span>{isCopied ? "Copied" : "Copy"}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSwapAiGoogle(item.index)}
                  className="text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
                  title="Swap with Google translation"
                >
                  <ArrowLeftRight size={10} />
                  <span>Swap AI ⇄ Google</span>
                </button>
              </div>
            </div>
          </div>
        </td>
      )}

      {/* Google Translation Column (FULLY EDITABLE) */}
      {studioColumns.google && (
        <td className="p-2.5 align-top">
          <div className="space-y-1.5">
            {item.googleTranslateText ? (
              <textarea
                value={item.googleTranslateText || ''}
                onChange={e => onEditGoogle(item.index, e.target.value)}
                placeholder="Google translation..."
                rows={2}
                className="w-full font-urdu text-right leading-[2.1] border rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y text-zinc-800 dark:text-zinc-200 bg-zinc-50/70 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-2xs transition-all"
                style={{
                  fontFamily: effectiveGoogleFont,
                  fontSize: `${effectiveGoogleSize}px`
                }}
                dir="rtl"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 gap-1.5 text-center">
                <span className="text-zinc-400 text-[10px]">No Google translation yet</span>
                {onTranslateGoogle && (
                  <button
                    type="button"
                    onClick={() => onTranslateGoogle(item.index)}
                    className="px-2.5 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:text-blue-600 rounded-md text-[9.5px] font-bold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Languages size={10} className="text-blue-500" />
                    <span>Translate Line</span>
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
              <span>{(item.googleTranslateText || '').length} chars</span>
              {item.googleTranslateText && (
                <button
                  type="button"
                  onClick={() => onCopyGoogleToAi(item.index)}
                  className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  title="Copy this Google text into the AI translated field"
                >
                  <Copy size={10} />
                  <span>Use in AI</span>
                </button>
              )}
            </div>
          </div>
        </td>
      )}

      {/* Swap / Row Actions Column */}
      {studioColumns.swaps && (
        <td className="p-2.5 align-top w-24 text-center">
          <div className="flex flex-col gap-1 items-center">
            <button
              type="button"
              onClick={() => onSwapAiGoogle(item.index)}
              className="w-full px-2 py-1 bg-zinc-100 hover:bg-blue-100 dark:bg-zinc-800 dark:hover:bg-blue-950 text-zinc-700 dark:text-zinc-300 hover:text-blue-700 rounded text-[9.5px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              title="Swap AI ⇄ Google"
            >
              <ArrowLeftRight size={10} />
              <span>AI ⇄ G</span>
            </button>

            <button
              type="button"
              onClick={() => onInsertAfter(item.index)}
              className="w-full px-2 py-1 bg-zinc-100 hover:bg-emerald-100 dark:bg-zinc-800 dark:hover:bg-emerald-950 text-zinc-600 dark:text-zinc-300 hover:text-emerald-700 rounded text-[9.5px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              title="Insert subtitle below"
            >
              <Plus size={10} />
              <span>Add</span>
            </button>

            <button
              type="button"
              onClick={() => onSplitRow(item.index)}
              className="w-full px-2 py-1 bg-zinc-100 hover:bg-indigo-100 dark:bg-zinc-800 dark:hover:bg-indigo-950 text-zinc-600 dark:text-zinc-300 hover:text-indigo-700 rounded text-[9.5px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              title="Split line in half"
            >
              <Scissors size={10} />
              <span>Split</span>
            </button>

            <button
              type="button"
              onClick={() => onDeleteRow(item.index)}
              className="w-full px-2 py-1 bg-zinc-100 hover:bg-red-100 dark:bg-zinc-800 dark:hover:bg-red-950 text-zinc-400 hover:text-red-600 rounded text-[9.5px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              title="Delete segment"
            >
              <Trash2 size={10} />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}, (prev, next) => {
  if (prev.isSelected !== next.isSelected) return false;
  if (prev.isCopied !== next.isCopied) return false;
  if (
    prev.studioColumns.index !== next.studioColumns.index ||
    prev.studioColumns.timing !== next.studioColumns.timing ||
    prev.studioColumns.original !== next.studioColumns.original ||
    prev.studioColumns.ai !== next.studioColumns.ai ||
    prev.studioColumns.google !== next.studioColumns.google ||
    prev.studioColumns.swaps !== next.studioColumns.swaps
  ) return false;
  if (
    prev.effectiveOriginalFont !== next.effectiveOriginalFont ||
    prev.effectiveOriginalSize !== next.effectiveOriginalSize ||
    prev.effectiveAiFont !== next.effectiveAiFont ||
    prev.effectiveAiSize !== next.effectiveAiSize ||
    prev.effectiveGoogleFont !== next.effectiveGoogleFont ||
    prev.effectiveGoogleSize !== next.effectiveGoogleSize
  ) return false;

  const p = prev.item;
  const n = next.item;
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
