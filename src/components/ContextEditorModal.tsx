import React, { useState } from 'react';
import { X, Check, Search, MessageSquare, RotateCcw } from 'lucide-react';

interface ContextEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  value: string;
  onSave: (val: string) => void;
  placeholder?: string;
  icon?: 'context' | 'prompt';
  onRestoreDefault?: () => void;
}

export const ContextEditorModal: React.FC<ContextEditorModalProps> = ({
  isOpen,
  onClose,
  title,
  value,
  onSave,
  placeholder,
  icon = 'context',
  onRestoreDefault
}) => {
  const [localVal, setLocalVal] = useState(value);

  // Sync with prop when opened
  React.useEffect(() => {
    if (isOpen) {
      setLocalVal(value);
    }
  }, [isOpen, value]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localVal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col text-xs">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              {icon === 'prompt' ? <MessageSquare size={16} /> : <Search size={16} />}
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{title}</h3>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Focused editor window for fine-tuning AI guidance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onRestoreDefault && (
              <button
                type="button"
                onClick={() => {
                  onRestoreDefault();
                  setLocalVal('Translate naturally for a family drama setting.');
                }}
                className="px-2.5 py-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={11} />
                <span>Restore Default</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Textarea */}
        <div className="p-4">
          <textarea
            value={localVal}
            onChange={(e) => setLocalVal(e.target.value)}
            rows={10}
            className="w-full p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-y text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-850 leading-relaxed text-sm font-sans"
            placeholder={placeholder}
            autoFocus
          />
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/50 flex items-center justify-between">
          <span className="text-[10px] text-zinc-400 font-mono">
            {localVal.length} characters
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={13} />
              <span>Apply Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
