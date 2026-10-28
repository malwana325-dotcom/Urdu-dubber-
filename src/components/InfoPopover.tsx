import React, { useState, useRef, useEffect } from 'react';
import { Info, X } from 'lucide-react';
import { cn } from '../utils/cn';

interface InfoPopoverProps {
  title: string;
  description: string;
  details?: string[];
  shortcut?: string;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

export const InfoPopover: React.FC<InfoPopoverProps> = ({
  title,
  description,
  details,
  shortcut,
  className,
  align = 'center'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={popoverRef} className={cn("relative inline-flex items-center", className)}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 rounded-full text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
        title={`View info: ${title}`}
      >
        <Info size={13} className="shrink-0" />
      </button>

      {isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "absolute bottom-full mb-2 z-[90] w-64 p-3 bg-white dark:bg-zinc-850 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl text-left text-xs animate-in fade-in zoom-in-95 duration-150",
            align === 'left' ? "left-0" : align === 'right' ? "right-0" : "left-1/2 -translate-x-1/2"
          )}
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100 dark:border-zinc-800 mb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[11px] text-zinc-900 dark:text-zinc-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{title}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5"
            >
              <X size={11} />
            </button>
          </div>

          <p className="text-[10px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {description}
          </p>

          {details && details.length > 0 && (
            <ul className="mt-2 space-y-1 pt-1.5 border-t border-zinc-100 dark:border-zinc-800 text-[9px] text-zinc-500 dark:text-zinc-400 list-disc list-inside">
              {details.map((d, i) => (
                <li key={i} className="leading-tight">{d}</li>
              ))}
            </ul>
          )}

          {shortcut && (
            <div className="mt-2 pt-1 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <span className="font-mono text-[8.5px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                {shortcut}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
