import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../utils/cn';

interface SubtitleRowEditableCellProps {
  value: string;
  isReadOnly: boolean;
  onCommit: (newValue: string) => void;
  fontFamily: string;
  fontSize: number;
  dir?: 'ltr' | 'rtl' | 'auto';
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  displayHtml?: string | null;
  emptyLabel?: string;
}

/**
 * Localized Editable Cell Component
 * Implements high-performance localized state management:
 * 1. Halts all background / parent rerendering while typing:
 *    Keeps active keystrokes in fast local component memory (`draftValue`).
 * 2. Only commits to global state when exiting (onBlur) or pressing Enter (with Shift+Enter for newline).
 * 3. Shows stylized displayHtml when not actively focused.
 */
export const SubtitleRowEditableCell: React.FC<SubtitleRowEditableCellProps> = ({
  value,
  isReadOnly,
  onCommit,
  fontFamily,
  fontSize,
  dir = 'auto',
  className,
  style,
  placeholder,
  displayHtml,
  emptyLabel
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const isTypingRef = useRef(false);

  // Sync draft value only when not actively editing/typing
  useEffect(() => {
    if (!isTypingRef.current) {
      setDraftValue(value);
    }
  }, [value]);

  const handleBlur = () => {
    isTypingRef.current = false;
    setIsEditing(false);
    if (draftValue !== value) {
      onCommit(draftValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      isTypingRef.current = false;
      setIsEditing(false);
      if (draftValue !== value) {
        onCommit(draftValue);
      }
    } else if (e.key === 'Escape') {
      isTypingRef.current = false;
      setDraftValue(value);
      setIsEditing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    isTypingRef.current = true;
    setDraftValue(e.target.value);
  };

  if (isReadOnly) {
    return (
      <div
        className={cn(
          "w-full leading-[2.3] select-text break-words whitespace-pre-line text-zinc-900 dark:text-zinc-100 transition-all",
          className
        )}
        style={{
          fontSize: `${fontSize}px`,
          fontFamily,
          ...style
        }}
        dir={dir}
        dangerouslySetInnerHTML={displayHtml ? { __html: displayHtml } : undefined}
      >
        {!displayHtml ? (value || <span className="text-zinc-400 dark:text-zinc-600 italic text-xs font-sans">{emptyLabel || 'No text'}</span>) : undefined}
      </div>
    );
  }

  // When editing is unlocked:
  if (isEditing) {
    return (
      <div className="relative w-full">
        <textarea
          autoFocus
          rows={2}
          value={draftValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          dir={dir}
          className={cn(
            "w-full leading-[2.3] p-2 bg-white dark:bg-zinc-900 border-2 border-emerald-500 dark:border-emerald-400 rounded-xl shadow-lg resize-y focus:outline-none text-zinc-900 dark:text-zinc-100 transition-all",
            className
          )}
          style={{
            fontSize: `${fontSize}px`,
            fontFamily,
            minHeight: '64px'
          }}
        />
        <div className="absolute right-2 bottom-2 text-[8px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800 pointer-events-none shadow-2xs">
          Press Enter or click away to save
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      title="Click to edit directly in workspace"
      className={cn(
        "group/editable w-full leading-[2.3] select-text break-words whitespace-pre-line text-zinc-900 dark:text-zinc-100 transition-all cursor-text rounded-lg p-1.5 -m-1.5 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 hover:ring-1 hover:ring-emerald-400/50",
        className
      )}
      style={{
        fontSize: `${fontSize}px`,
        fontFamily,
        ...style
      }}
      dir={dir}
    >
      {displayHtml ? (
        <div dangerouslySetInnerHTML={{ __html: displayHtml }} />
      ) : (
        value || <span className="text-zinc-400 dark:text-zinc-600 italic text-xs font-sans">{emptyLabel || 'Click to enter text...'}</span>
      )}
    </div>
  );
};
