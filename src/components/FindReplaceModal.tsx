import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Search, 
  Replace, 
  X, 
  Check, 
  ArrowRight, 
  RotateCcw, 
  Undo2, 
  Redo2, 
  Eye, 
  AlertCircle,
  Sparkles,
  ChevronRight,
  SlidersHorizontal,
  ChevronDown,
  Layers
} from 'lucide-react';
import { SubtitleItem } from '../utils/srtParser';
import { executeFindAndReplace, FindReplaceOptions } from '../utils/subtitleOperations';
import { cn } from '../utils/cn';

interface FindReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtitles: SubtitleItem[];
  selectedCount: number;
  selectedIndices: Set<number>;
  onApply: (updated: SubtitleItem[], count: number) => void;
  onAddLog: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

interface MatchOccurrence {
  subIndex: number;
  startTime: string;
  endTime: string;
  field: 'ai' | 'original' | 'google';
  fieldLabel: string;
  currentText: string;
  previewReplacedText: string;
  matchCount: number;
}

export const FindReplaceModal: React.FC<FindReplaceModalProps> = ({
  isOpen,
  onClose,
  subtitles,
  selectedCount,
  selectedIndices,
  onApply,
  onAddLog
}) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [matchWholeWord, setMatchWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [targetField, setTargetField] = useState<'all' | 'ai' | 'original' | 'google'>('ai');
  const [applyToSelectedOnly, setApplyToSelectedOnly] = useState(false);
  const [previewFilter, setPreviewFilter] = useState<'all' | 'ai' | 'original' | 'google'>('all');

  // Internal Session Subtitles & Multi-Level Undo / Redo / Reset Stack
  const [sessionSubtitles, setSessionSubtitles] = useState<SubtitleItem[]>(subtitles);
  const [history, setHistory] = useState<SubtitleItem[][]>([subtitles]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [totalReplacementsMade, setTotalReplacementsMade] = useState(0);

  // Sync initial baseline whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setSessionSubtitles(subtitles);
      setHistory([subtitles]);
      setHistoryIndex(0);
      setTotalReplacementsMade(0);
    }
  }, [isOpen, subtitles]);

  // Safe Regex Builder
  const { regex, regexError } = useMemo(() => {
    if (!findText) return { regex: null, regexError: null };
    let flags = 'g';
    if (!matchCase) flags += 'i';

    try {
      if (useRegex) {
        return { regex: new RegExp(findText, flags), regexError: null };
      }
      let escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (matchWholeWord) {
        escaped = `\\b${escaped}\\b`;
      }
      return { regex: new RegExp(escaped, flags), regexError: null };
    } catch (err: any) {
      return { regex: null, regexError: err.message || 'Invalid Regular Expression' };
    }
  }, [findText, matchCase, matchWholeWord, useRegex]);

  // Compute Live Matching Blocks and Occurrences
  const occurrences = useMemo<MatchOccurrence[]>(() => {
    if (!regex || !findText) return [];

    const list: MatchOccurrence[] = [];
    const checkAi = targetField === 'all' || targetField === 'ai';
    const checkOriginal = targetField === 'all' || targetField === 'original';
    const checkGoogle = targetField === 'all' || targetField === 'google';

    for (const sub of sessionSubtitles) {
      if (applyToSelectedOnly && selectedCount > 0 && !selectedIndices.has(sub.index)) {
        continue;
      }

      // Check Original
      if (checkOriginal && sub.text) {
        const matches = sub.text.match(regex);
        if (matches && matches.length > 0) {
          list.push({
            subIndex: sub.index,
            startTime: sub.startTime,
            endTime: sub.endTime,
            field: 'original',
            fieldLabel: 'Source (Original)',
            currentText: sub.text,
            previewReplacedText: sub.text.replace(regex, replaceText),
            matchCount: matches.length
          });
        }
      }

      // Check AI
      if (checkAi && sub.translatedText) {
        const matches = sub.translatedText.match(regex);
        if (matches && matches.length > 0) {
          list.push({
            subIndex: sub.index,
            startTime: sub.startTime,
            endTime: sub.endTime,
            field: 'ai',
            fieldLabel: 'AI Translated',
            currentText: sub.translatedText,
            previewReplacedText: sub.translatedText.replace(regex, replaceText),
            matchCount: matches.length
          });
        }
      }

      // Check Google
      if (checkGoogle && sub.googleTranslateText) {
        const matches = sub.googleTranslateText.match(regex);
        if (matches && matches.length > 0) {
          list.push({
            subIndex: sub.index,
            startTime: sub.startTime,
            endTime: sub.endTime,
            field: 'google',
            fieldLabel: 'Google Translation',
            currentText: sub.googleTranslateText,
            previewReplacedText: sub.googleTranslateText.replace(regex, replaceText),
            matchCount: matches.length
          });
        }
      }
    }

    return list;
  }, [regex, findText, replaceText, sessionSubtitles, targetField, applyToSelectedOnly, selectedCount, selectedIndices]);

  const totalMatchCount = useMemo(() => {
    return occurrences.reduce((acc, curr) => acc + curr.matchCount, 0);
  }, [occurrences]);

  const uniqueBlocksCount = useMemo(() => {
    return new Set(occurrences.map(o => o.subIndex)).size;
  }, [occurrences]);

  // Highlight Text Helper function: breaks string by regex and applies <mark>
  const renderHighlighted = useCallback((text: string, isReplacement = false) => {
    if (!regex || !text) return text;
    try {
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      // create a non-global or global regex clone
      const clone = new RegExp(regex.source, regex.flags);
      let match: RegExpExecArray | null;

      while ((match = clone.exec(text)) !== null) {
        if (match.index > lastIndex) {
          parts.push(text.slice(lastIndex, match.index));
        }
        parts.push(
          <mark
            key={`${match.index}-${lastIndex}`}
            className={cn(
              "font-bold rounded px-1 py-0.2 shadow-2xs inline-block",
              isReplacement
                ? "bg-emerald-300 dark:bg-emerald-500/40 text-emerald-950 dark:text-emerald-100 border border-emerald-400 dark:border-emerald-600"
                : "bg-amber-300 dark:bg-amber-400/40 text-amber-950 dark:text-amber-100 border border-amber-400 dark:border-amber-600 animate-pulse"
            )}
          >
            {match[0]}
          </mark>
        );
        lastIndex = clone.lastIndex;
        if (!regex.global) break;
      }

      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
      }
      return parts.length > 0 ? parts : text;
    } catch {
      return text;
    }
  }, [regex]);

  // Push new state to history
  const pushState = (newSubtitles: SubtitleItem[], countAdded: number) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(newSubtitles);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setSessionSubtitles(newSubtitles);
    setTotalReplacementsMade(prev => prev + countAdded);
  };

  // Undo Handler
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setSessionSubtitles(history[prevIndex]);
      onAddLog("Find & Replace: Undo step applied.", "info");
    }
  };

  // Redo Handler
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setSessionSubtitles(history[nextIndex]);
      onAddLog("Find & Replace: Redo step applied.", "info");
    }
  };

  // Reset Handler (Reverts all changes back to initial state before modal opened)
  const handleReset = () => {
    setSessionSubtitles(subtitles);
    setHistory([subtitles]);
    setHistoryIndex(0);
    setTotalReplacementsMade(0);
    onAddLog("Find & Replace: Reset all modifications back to original baseline.", "warning");
  };

  // Replace Single Occurrence (First occurrence in list)
  const handleReplaceNext = () => {
    if (!regex || occurrences.length === 0) return;
    const target = occurrences[0];

    const nextSubtitles = sessionSubtitles.map(s => {
      if (s.index !== target.subIndex) return s;
      const copy = { ...s };
      if (target.field === 'ai' && copy.translatedText) {
        // Replace single instance
        const singleRegex = new RegExp(regex.source, regex.flags.replace('g', ''));
        copy.translatedText = copy.translatedText.replace(singleRegex, replaceText);
      } else if (target.field === 'original' && copy.text) {
        const singleRegex = new RegExp(regex.source, regex.flags.replace('g', ''));
        copy.text = copy.text.replace(singleRegex, replaceText);
      } else if (target.field === 'google' && copy.googleTranslateText) {
        const singleRegex = new RegExp(regex.source, regex.flags.replace('g', ''));
        copy.googleTranslateText = copy.googleTranslateText.replace(singleRegex, replaceText);
      }
      return copy;
    });

    pushState(nextSubtitles, 1);
    onAddLog(`Find & Replace: Replaced match in block #${target.subIndex}.`, "success");
  };

  // Replace Single Specific Block
  const handleReplaceSingleBlock = (subIndex: number, field: 'ai' | 'original' | 'google') => {
    if (!regex) return;
    let countInBlock = 0;
    const nextSubtitles = sessionSubtitles.map(s => {
      if (s.index !== subIndex) return s;
      const copy = { ...s };
      if (field === 'ai' && copy.translatedText) {
        const matches = copy.translatedText.match(regex);
        if (matches) countInBlock += matches.length;
        copy.translatedText = copy.translatedText.replace(regex, replaceText);
      } else if (field === 'original' && copy.text) {
        const matches = copy.text.match(regex);
        if (matches) countInBlock += matches.length;
        copy.text = copy.text.replace(regex, replaceText);
      } else if (field === 'google' && copy.googleTranslateText) {
        const matches = copy.googleTranslateText.match(regex);
        if (matches) countInBlock += matches.length;
        copy.googleTranslateText = copy.googleTranslateText.replace(regex, replaceText);
      }
      return copy;
    });

    if (countInBlock > 0) {
      pushState(nextSubtitles, countInBlock);
      onAddLog(`Replaced ${countInBlock} occurrence(s) in block #${subIndex}.`, "success");
    }
  };

  // Replace All
  const handleReplaceAll = () => {
    if (!findText.trim()) return;

    const options: FindReplaceOptions = {
      findText,
      replaceText,
      matchCase,
      matchWholeWord,
      useRegex,
      targetField: targetField === 'all' ? 'all' : targetField,
      selectedIndices: (applyToSelectedOnly && selectedCount > 0) ? selectedIndices : undefined
    };

    const { updatedSubtitles, replaceCount } = executeFindAndReplace(sessionSubtitles, options);
    if (replaceCount > 0) {
      pushState(updatedSubtitles, replaceCount);
      onAddLog(`Find & Replace replaced ${replaceCount} occurrence(s) across subtitle blocks.`, 'success');
    }
  };

  // Commit changes to main application state and close
  const handleApplyAndClose = () => {
    onApply(sessionSubtitles, totalReplacementsMade);
    onClose();
  };

  if (!isOpen) return null;

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const isModifiedFromInitial = historyIndex > 0 || totalReplacementsMade > 0;

  const filteredOccurrences = occurrences.filter(o => {
    if (previewFilter === 'all') return true;
    return o.field === previewFilter;
  });

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col text-xs">
        
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <Replace size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
                  Find & Replace Studio
                </h3>
                {findText && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-tight border",
                    totalMatchCount > 0
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                  )}>
                    {totalMatchCount} {totalMatchCount === 1 ? 'match' : 'matches'} in {uniqueBlocksCount} {uniqueBlocksCount === 1 ? 'block' : 'blocks'}
                  </span>
                )}
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                Interactive live match preview, highlight search terms, regex support & instant undo/redo/reset
              </p>
            </div>
          </div>

          {/* Header Action Tools: Undo, Redo, Reset, Close */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleUndo}
              disabled={!canUndo}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 font-bold transition-all cursor-pointer shadow-2xs"
              title="Undo last replace step (Ctrl+Z)"
            >
              <Undo2 size={13} className="text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Undo</span>
              {canUndo && <span className="text-[9px] font-mono text-zinc-400">({historyIndex})</span>}
            </button>

            <button
              type="button"
              onClick={handleRedo}
              disabled={!canRedo}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 font-bold transition-all cursor-pointer shadow-2xs"
              title="Redo replacement step (Ctrl+Y)"
            >
              <Redo2 size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Redo</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={!isModifiedFromInitial}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 disabled:opacity-30 font-bold transition-all cursor-pointer shadow-2xs"
              title="Reset all replacements made in this session back to initial baseline"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Reset Baseline</span>
            </button>

            <button 
              onClick={onClose} 
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 ml-1 transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Container with Search Inputs + Live Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* Inputs Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Find Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Search size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Find Text</span>
                </label>
                {findText && (
                  <button 
                    onClick={() => setFindText('')}
                    className="text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={findText}
                  onChange={e => setFindText(e.target.value)}
                  placeholder="Enter word, phrase, or pattern to find..."
                  className="w-full pl-3.5 pr-8 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 font-medium placeholder:text-zinc-400 shadow-2xs"
                  autoFocus
                />
                {regexError && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-rose-500 dark:text-rose-400">
                    <AlertCircle size={11} />
                    <span>{regexError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Replace Input */}
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Replace size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>Replace With</span>
              </label>
              <input
                type="text"
                value={replaceText}
                onChange={e => setReplaceText(e.target.value)}
                placeholder="Enter replacement dialogue or translation..."
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 font-medium placeholder:text-zinc-400 shadow-2xs"
              />
            </div>
          </div>

          {/* Target Columns & Search Options */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              
              {/* Target Stream Selector */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 shrink-0">
                  Target Column:
                </span>
                <div className="inline-flex rounded-xl bg-zinc-200/80 dark:bg-zinc-700/60 p-1 gap-1">
                  {[
                    { id: 'all' as const, label: 'All Columns' },
                    { id: 'ai' as const, label: 'AI Urdu' },
                    { id: 'original' as const, label: 'Source (Original)' },
                    { id: 'google' as const, label: 'Google' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTargetField(t.id)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer",
                        targetField === t.id
                          ? "bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-300 shadow-2xs border border-zinc-200 dark:border-zinc-700"
                          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Match Options */}
              <div className="flex items-center gap-3.5 flex-wrap">
                <label className="flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300 font-medium select-none">
                  <input
                    type="checkbox"
                    checked={matchCase}
                    onChange={e => setMatchCase(e.target.checked)}
                    className="accent-emerald-600 rounded cursor-pointer w-3.5 h-3.5"
                  />
                  <span>Match case (Aa)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300 font-medium select-none">
                  <input
                    type="checkbox"
                    checked={matchWholeWord}
                    onChange={e => setMatchWholeWord(e.target.checked)}
                    className="accent-emerald-600 rounded cursor-pointer w-3.5 h-3.5"
                  />
                  <span>Whole words (\b)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300 font-medium select-none">
                  <input
                    type="checkbox"
                    checked={useRegex}
                    onChange={e => setUseRegex(e.target.checked)}
                    className="accent-emerald-600 rounded cursor-pointer w-3.5 h-3.5"
                  />
                  <span>Regex (.*)</span>
                </label>
              </div>
            </div>

            {selectedCount > 0 && (
              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-blue-700 dark:text-blue-300 font-bold select-none">
                  <input
                    type="checkbox"
                    checked={applyToSelectedOnly}
                    onChange={e => setApplyToSelectedOnly(e.target.checked)}
                    className="accent-blue-600 rounded cursor-pointer w-3.5 h-3.5"
                  />
                  <span>Apply only to {selectedCount} selected subtitle block(s)</span>
                </label>
                <span className="text-[10px] font-mono text-zinc-400">
                  {selectedIndices.size} blocks selected in table
                </span>
              </div>
            )}
          </div>

          {/* Live Preview & Highlight Panel */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-200/80 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Eye size={14} className="text-emerald-600 dark:text-emerald-400" />
                <h4 className="font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[11px]">
                  Live Preview & Search Highlights
                </h4>
                {totalMatchCount > 0 && (
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                    ({occurrences.length} instances across {uniqueBlocksCount} blocks)
                  </span>
                )}
              </div>

              {/* Preview Filter Pill */}
              {occurrences.length > 0 && (
                <div className="flex items-center gap-1 text-[10px]">
                  <span className="text-zinc-400 mr-1 hidden sm:inline">Filter Preview:</span>
                  {(['all', 'ai', 'original', 'google'] as const).map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setPreviewFilter(f)}
                      className={cn(
                        "px-2 py-0.5 rounded-md font-bold uppercase tracking-wider transition-colors cursor-pointer",
                        previewFilter === f
                          ? "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900"
                          : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Preview Results Cards */}
            {!findText ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 space-y-2">
                <Search size={28} className="mx-auto text-zinc-300 dark:text-zinc-700" />
                <p className="font-semibold text-zinc-500 dark:text-zinc-400">
                  Type any search text above to inspect live matching dialogue blocks
                </p>
                <p className="text-[11px] text-zinc-400">
                  Matches will be highlighted dynamically with instant replacement previews
                </p>
              </div>
            ) : filteredOccurrences.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 space-y-2">
                <AlertCircle size={28} className="mx-auto text-amber-500/70" />
                <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                  No matching occurrences found for "{findText}"
                </p>
                <p className="text-[11px] text-zinc-400">
                  Try adjusting the Target Column, Match case, or Whole words filters
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {filteredOccurrences.map((occ, i) => (
                  <div 
                    key={`${occ.subIndex}-${occ.field}-${i}`}
                    className="p-3.5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/90 dark:border-zinc-700/70 hover:border-emerald-300 dark:hover:border-emerald-700/60 transition-all shadow-2xs space-y-2"
                  >
                    {/* Item Card Header */}
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200">
                          #{occ.subIndex}
                        </span>
                        <span className="font-mono text-zinc-400">{occ.startTime} → {occ.endTime}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px]",
                          occ.field === 'ai'
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : occ.field === 'original'
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        )}>
                          {occ.fieldLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                          {occ.matchCount} {occ.matchCount === 1 ? 'match' : 'matches'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleReplaceSingleBlock(occ.subIndex, occ.field)}
                          className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9.5px] cursor-pointer shadow-2xs transition-colors"
                          title={`Replace all matches in block #${occ.subIndex}`}
                        >
                          Replace in #{occ.subIndex}
                        </button>
                      </div>
                    </div>

                    {/* Before & After Comparison */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {/* Before (Highlighted matches in yellow) */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 flex flex-col justify-between">
                        <div className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1 flex items-center justify-between">
                          <span>Current Text (Searched Words Highlighted):</span>
                          <span className="text-amber-500 font-bold">Before</span>
                        </div>
                        <div 
                          className={cn(
                            "text-zinc-900 dark:text-zinc-100 leading-relaxed text-[11.5px]",
                            occ.field === 'ai' || occ.field === 'google' ? "font-urdu text-right" : ""
                          )}
                          dir={occ.field === 'ai' || occ.field === 'google' ? 'rtl' : 'ltr'}
                        >
                          {renderHighlighted(occ.currentText, false)}
                        </div>
                      </div>

                      {/* After (Highlighted replacement in green) */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 flex flex-col justify-between">
                        <div className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1 flex items-center justify-between">
                          <span>Preview with Replacement Applied:</span>
                          <span className="font-bold">After</span>
                        </div>
                        <div 
                          className={cn(
                            "text-zinc-900 dark:text-zinc-100 leading-relaxed text-[11.5px]",
                            occ.field === 'ai' || occ.field === 'google' ? "font-urdu text-right" : ""
                          )}
                          dir={occ.field === 'ai' || occ.field === 'google' ? 'rtl' : 'ltr'}
                        >
                          {renderHighlighted(occ.previewReplacedText, true)}
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

        {/* Footer with Operational Action Buttons */}
        <div className="p-4 sm:px-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
              Session Replacements: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{totalReplacementsMade}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleReplaceNext}
              disabled={!findText || occurrences.length === 0}
              className="px-4 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-40 text-zinc-800 dark:text-zinc-200 font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Replace single next match"
            >
              <ArrowRight size={13} />
              <span>Replace Next</span>
            </button>

            <button
              type="button"
              onClick={handleReplaceAll}
              disabled={!findText || totalMatchCount === 0}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              title={`Replace all ${totalMatchCount} occurrences in current scope`}
            >
              <Replace size={14} />
              <span>Replace All ({totalMatchCount})</span>
            </button>

            <button
              type="button"
              onClick={handleApplyAndClose}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              title="Apply all modifications to project and close modal"
            >
              <Check size={14} />
              <span>Done & Apply</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
