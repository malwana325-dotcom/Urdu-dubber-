import React, { useState } from 'react';
import { Wand2, X, Check, FileText, Scissors, ShieldAlert, Sparkles } from 'lucide-react';
import { SubtitleItem } from '../utils/srtParser';
import { executeCleanup, CleanupOptions } from '../utils/subtitleOperations';
import { cn } from '../utils/cn';

interface TextCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtitles: SubtitleItem[];
  selectedCount: number;
  selectedIndices: Set<number>;
  onApply: (updated: SubtitleItem[]) => void;
  onAddLog: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const TextCleanupModal: React.FC<TextCleanupModalProps> = ({
  isOpen,
  onClose,
  subtitles,
  selectedCount,
  selectedIndices,
  onApply,
  onAddLog
}) => {
  const [fixUrduPunctuation, setFixUrduPunctuation] = useState(true);
  const [trimSpaces, setTrimSpaces] = useState(true);
  const [stripTags, setStripTags] = useState(false);
  const [removeSoundCues, setRemoveSoundCues] = useState(false);
  const [normalizeNewlines, setNormalizeNewlines] = useState(true);
  const [applyToSelectedOnly, setApplyToSelectedOnly] = useState(false);

  if (!isOpen) return null;

  const handleExecute = () => {
    const options: CleanupOptions = {
      fixUrduPunctuation,
      trimSpaces,
      stripTags,
      removeSoundCues,
      normalizeNewlines,
      selectedIndices: (applyToSelectedOnly && selectedCount > 0) ? selectedIndices : undefined
    };

    const updated = executeCleanup(subtitles, options);
    onApply(updated);
    onAddLog(`Batch cleanup executed: whitespace trimmed, punctuation normalized, tags handled.`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col text-xs">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
              <Wand2 size={16} />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Subtitle Text Formatting & Cleanup</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">Batch correct punctuation, remove stray whitespace, or strip tags</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3.5">
          <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={fixUrduPunctuation}
              onChange={e => setFixUrduPunctuation(e.target.checked)}
              className="mt-1 accent-purple-600 rounded"
            />
            <div>
              <div className="font-bold text-zinc-900 dark:text-zinc-100">Fix Urdu Punctuation Marks (۔ ، ؟)</div>
              <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">
                Replaces English full stops with Urdu Khatam (۔), commas with inverted commas (،), and questions with Urdu (؟).
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={trimSpaces}
              onChange={e => setTrimSpaces(e.target.checked)}
              className="mt-1 accent-purple-600 rounded"
            />
            <div>
              <div className="font-bold text-zinc-900 dark:text-zinc-100">Trim Extra Spaces & Tabs</div>
              <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">
                Removes leading and trailing whitespace and collapses multiple consecutive spaces into a clean single space.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={normalizeNewlines}
              onChange={e => setNormalizeNewlines(e.target.checked)}
              className="mt-1 accent-purple-600 rounded"
            />
            <div>
              <div className="font-bold text-zinc-900 dark:text-zinc-100">Normalize Line Breaks</div>
              <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">
                Eliminates empty blank lines and normalizes standard 2-line subtitle spacing.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={removeSoundCues}
              onChange={e => setRemoveSoundCues(e.target.checked)}
              className="mt-1 accent-purple-600 rounded"
            />
            <div>
              <div className="font-bold text-zinc-900 dark:text-zinc-100">Remove Bracketed Audio Cues</div>
              <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">
                Strips sound effects like [music playing], (laughter), [screams] so only spoken dialogue remains.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={stripTags}
              onChange={e => setStripTags(e.target.checked)}
              className="mt-1 accent-purple-600 rounded"
            />
            <div>
              <div className="font-bold text-zinc-900 dark:text-zinc-100">Strip Color Tags & HTML Formatting</div>
              <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">
                Removes all <code className="text-purple-600">&lt;font color=...&gt;</code> tags and reverts text to clean, unstyled subtitles.
              </p>
            </div>
          </label>

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
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
          >
            <Wand2 size={14} />
            <span>Clean Up Subtitles</span>
          </button>
        </div>

      </div>
    </div>
  );
};
