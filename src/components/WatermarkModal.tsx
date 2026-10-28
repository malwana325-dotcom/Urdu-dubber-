import React, { useState } from 'react';
import { Stamp, X, Check, Sparkles, Clock, FileText, Globe } from 'lucide-react';
import { SubtitleItem } from '../utils/srtParser';
import { cn } from '../utils/cn';

interface WatermarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtitles: SubtitleItem[];
  onApplyWatermark: (updatedSubtitles: SubtitleItem[]) => void;
  onAddLog: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

const WATERMARK_PRESETS = [
  {
    label: 'Standard Channel / Translator Credit',
    source: 'Subtitles & Translation by AI Studio Pro • All Rights Reserved',
    urdu: 'ترجمہ و سب ٹائٹلز: اے آئی اسٹوڈیو پرو • جملہ حقوق محفوظ ہیں'
  },
  {
    label: 'Bilingual Credits',
    source: 'Official Urdu Subtitles • Powered by AI Translation Engine',
    urdu: 'آفیشل اردو سب ٹائٹلز • اے آئی ٹرانسلیشن انجن'
  },
  {
    label: 'Minimalist Watermark',
    source: '[Subtitled by AI Studio]',
    urdu: '[اے آئی اسٹوڈیو کا ترجمہ]'
  }
];

export const WatermarkModal: React.FC<WatermarkModalProps> = ({
  isOpen,
  onClose,
  subtitles,
  onApplyWatermark,
  onAddLog
}) => {
  const firstBlock = subtitles.length > 0 ? subtitles[0] : null;

  const [sourceWatermark, setSourceWatermark] = useState(
    firstBlock?.text || 'Subtitles & Translation by AI Studio Pro'
  );
  const [urduWatermark, setUrduWatermark] = useState(
    firstBlock?.translatedText || 'ترجمہ و سب ٹائٹلز: اے آئی اسٹوڈیو پرو'
  );
  const [googleWatermark, setGoogleWatermark] = useState(
    firstBlock?.googleTranslateText || 'ترجمہ: گوگل ٹرانسلیٹ'
  );

  const [actionType, setActionType] = useState<'update_first' | 'insert_new'>('update_first');

  if (!isOpen) return null;

  const handleApply = () => {
    if (subtitles.length === 0) {
      // Create first block
      const newSub: SubtitleItem = {
        index: 1,
        startTime: '00:00:00,000',
        endTime: '00:00:03,500',
        text: sourceWatermark.trim(),
        translatedText: urduWatermark.trim(),
        googleTranslateText: googleWatermark.trim()
      };
      onApplyWatermark([newSub]);
      onAddLog('Created first block with watermark credits.', 'success');
      onClose();
      return;
    }

    if (actionType === 'update_first') {
      const updated = subtitles.map((s, idx) => {
        if (idx === 0) {
          return {
            ...s,
            text: sourceWatermark.trim(),
            translatedText: urduWatermark.trim(),
            googleTranslateText: googleWatermark.trim()
          };
        }
        return s;
      });
      onApplyWatermark(updated);
      onAddLog('Updated Row 1 with watermark credits.', 'success');
    } else {
      // Insert as new block 1 at beginning and re-index
      const newBlock: SubtitleItem = {
        index: 1,
        startTime: '00:00:00,000',
        endTime: '00:00:03,000',
        text: sourceWatermark.trim(),
        translatedText: urduWatermark.trim(),
        googleTranslateText: googleWatermark.trim()
      };
      const shifted = subtitles.map((s, idx) => ({
        ...s,
        index: idx + 2
      }));
      onApplyWatermark([newBlock, ...shifted]);
      onAddLog('Inserted new Watermark block #1 at start of subtitles.', 'success');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[125] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col text-xs">
        
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
              <Stamp size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
                Row 1 Watermark & Credits
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                Add or customize watermark branding & translation credits on subtitle block #1
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Presets */}
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block mb-2">
              Quick Watermark Presets
            </label>
            <div className="grid grid-cols-1 gap-2">
              {WATERMARK_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSourceWatermark(preset.source);
                    setUrduWatermark(preset.urdu);
                    setGoogleWatermark(preset.urdu);
                  }}
                  className="text-left p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700/80 hover:border-amber-400 dark:hover:border-amber-600 bg-zinc-50/60 dark:bg-zinc-800/40 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[10.5px] font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-amber-700 dark:group-hover:text-amber-300">
                    <span>{preset.label}</span>
                    <Sparkles size={12} className="text-amber-500 opacity-60 group-hover:opacity-100" />
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                    {preset.source}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Choice */}
          {subtitles.length > 0 && (
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-between gap-3">
              <span className="text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300">Target Action:</span>
              <div className="inline-flex rounded-xl bg-zinc-200/80 dark:bg-zinc-700/60 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setActionType('update_first')}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                    actionType === 'update_first'
                      ? "bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-300 shadow-2xs"
                      : "text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  Update Existing Row 1
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('insert_new')}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                    actionType === 'insert_new'
                      ? "bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-300 shadow-2xs"
                      : "text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  Insert New Block 1 at Beginning
                </button>
              </div>
            </div>
          )}

          {/* Text Inputs */}
          <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            {/* Source English */}
            <div className="space-y-1">
              <label className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <FileText size={12} className="text-zinc-400" />
                <span>Original (Source) Watermark Text</span>
              </label>
              <input
                type="text"
                value={sourceWatermark}
                onChange={e => setSourceWatermark(e.target.value)}
                placeholder="e.g. Subtitles by YourChannel"
                className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-zinc-100 font-medium"
              />
            </div>

            {/* AI Urdu */}
            <div className="space-y-1">
              <label className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Globe size={12} className="text-emerald-500" />
                <span>AI Urdu Watermark Text</span>
              </label>
              <input
                type="text"
                value={urduWatermark}
                onChange={e => setUrduWatermark(e.target.value)}
                placeholder="مثلاً: ترجمہ و سب ٹائٹلز: اے آئی اسٹوڈیو"
                className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-zinc-100 font-urdu text-right"
                dir="rtl"
              />
            </div>

            {/* Google Translation */}
            <div className="space-y-1">
              <label className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Globe size={12} className="text-blue-500" />
                <span>Google Translation Watermark Text (Optional)</span>
              </label>
              <input
                type="text"
                value={googleWatermark}
                onChange={e => setGoogleWatermark(e.target.value)}
                placeholder="مثلاً: ترجمہ: گوگل"
                className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-zinc-100 font-urdu text-right"
                dir="rtl"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/40 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Check size={14} />
            <span>Apply Watermark to Row 1</span>
          </button>
        </div>

      </div>
    </div>
  );
};
