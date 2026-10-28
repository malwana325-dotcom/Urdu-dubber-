import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  X, 
  Check, 
  Search, 
  Plus, 
  Scissors, 
  Trash2, 
  Languages, 
  Clock, 
  Wand2, 
  Replace, 
  RotateCcw, 
  Copy, 
  CheckSquare, 
  Square, 
  Filter, 
  FileText, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2,
  ArrowLeftRight,
  Columns,
  Save,
  Undo2,
  Sparkles,
  Info,
  Type as TypeIcon,
  Globe,
  Sliders,
  AlertCircle,
  Upload,
  Edit3,
  FoldHorizontal
} from 'lucide-react';
import { SubtitleItem, calculateDurationAndCPS } from '../utils/srtParser';
import { 
  insertSubtitle, 
  splitSubtitle, 
  deleteSubtitle, 
  batchDeleteSubtitles 
} from '../utils/subtitleOperations';
import { 
  stripFormatting
} from '../utils/subtitleFormatter';
import { StudioSubtitleRow } from './StudioSubtitleRow';
import { useProgressiveRenderList } from '../utils/performance';
import { ActiveStylingConfig } from './StylingStudioDrawer';
import { cn } from '../utils/cn';
import { 
  URDU_FONT_OPTIONS, 
  ENGLISH_FONT_OPTIONS,
  FontOption,
  CustomFontItem,
  getLocalFontsFromStorage,
  saveLocalFontsToStorage,
  registerUploadedFont
} from '../constants/fonts';
import { 
  TranslationSettings,
  SCRIPT_MODES,
  TARGET_LANGUAGES
} from '../services/translationSettings';

interface SubtitleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtitles: SubtitleItem[];
  onUpdateSubtitles: (updater: (prev: SubtitleItem[]) => SubtitleItem[]) => void;
  initialFocusIndex?: number;
  fileName: string;
  detectedFormat?: string;
  urduFont: string;
  originalFont?: string;
  googleFont?: string;
  isGlobalFontActive?: boolean;
  globalFont?: string;
  globalFontSize?: number;
  translatedFontSize: number;
  originalFontSize: number;
  googleFontSize?: number;
  translationSettings?: TranslationSettings;
  onOpenTranslationSettings?: () => void;
  onOpenStylizer?: () => void;
  onTranslateGoogle?: (index: number) => Promise<void> | void;
  onApplyGoogleToAI?: (index: number) => void;
  onRetrySelectedAI?: () => Promise<void>;
  onRetrySelectedGoogle?: () => Promise<void>;
  onRetrySelectedBoth?: () => Promise<void> | void;
  onClearSelectedTranslations?: () => void;
  onOpenFindReplace?: () => void;
  onOpenTimeShift?: () => void;
  onOpenGapTiming?: () => void;
  onOpenTextCleanup?: () => void;
  onCopyAllGoogleToEmptyAI?: () => void;
  isTranslating?: boolean;
  isGoogleTranslatingAll?: boolean;
  activeStylingConfig?: ActiveStylingConfig;
  isStylingPreviewActive?: boolean;
  onOpenStylingStudio?: () => void;
  onAddNotification: (msg: string, type: 'success' | 'error') => void;
  onAddLog: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  onLoadSampleSubtitles?: () => void;
  onFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  editorColumns?: { original: boolean; ai: boolean; google: boolean; time: boolean };
  onUpdateEditorColumns?: React.Dispatch<React.SetStateAction<{ original: boolean; ai: boolean; google: boolean; time: boolean }>>;
}

export const SubtitleEditorModal: React.FC<SubtitleEditorModalProps> = ({
  isOpen,
  onClose,
  subtitles: initialProjectSubtitles,
  onUpdateSubtitles,
  initialFocusIndex,
  fileName,
  detectedFormat = 'SRT',
  urduFont: parentUrduFont,
  originalFont: parentOriginalFont = ENGLISH_FONT_OPTIONS[0].value,
  googleFont: parentGoogleFont = URDU_FONT_OPTIONS[0].value,
  isGlobalFontActive: parentIsGlobalFontActive = false,
  globalFont: parentGlobalFont = URDU_FONT_OPTIONS[0].value,
  globalFontSize: parentGlobalFontSize = 20,
  translatedFontSize: parentTranslatedFontSize,
  originalFontSize: parentOriginalFontSize,
  googleFontSize: parentGoogleFontSize = 14,
  translationSettings,
  onOpenTranslationSettings,
  onOpenStylizer,
  onOpenStylingStudio,
  activeStylingConfig,
  isStylingPreviewActive = true,
  onTranslateGoogle,
  onApplyGoogleToAI,
  onRetrySelectedAI,
  onRetrySelectedGoogle,
  onRetrySelectedBoth,
  onClearSelectedTranslations,
  onOpenFindReplace,
  onOpenTimeShift,
  onOpenGapTiming,
  onOpenTextCleanup,
  onCopyAllGoogleToEmptyAI,
  isTranslating = false,
  isGoogleTranslatingAll = false,
  onAddNotification,
  onAddLog,
  onLoadSampleSubtitles,
  onFileUpload,
  editorColumns,
  onUpdateEditorColumns
}) => {
  // Local state for draft editing inside the edit studio
  const [localSubtitles, setLocalSubtitles] = useState<SubtitleItem[]>([]);
  const [originalSnapshot, setOriginalSnapshot] = useState<SubtitleItem[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(null);

  // Column Visibility Checkboxes
  const [studioColumns, setStudioColumns] = useState({
    index: true,
    timing: true,
    original: true,
    ai: true,
    google: true,
    swaps: true
  });
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

  // Typography & Sizing state in the Editor Studio
  const [studioOriginalFontSize, setStudioOriginalFontSize] = useState<number>(parentOriginalFontSize || 14);
  const [studioTranslatedFontSize, setStudioTranslatedFontSize] = useState<number>(parentTranslatedFontSize || 22);
  const [studioGoogleFontSize, setStudioGoogleFontSize] = useState<number>(parentGoogleFontSize || 14);
  const [studioGlobalFontSize, setStudioGlobalFontSize] = useState<number>(parentGlobalFontSize || 20);
  
  const [studioIsGlobalFontActive, setStudioIsGlobalFontActive] = useState<boolean>(parentIsGlobalFontActive);
  const [studioGlobalFont, setStudioGlobalFont] = useState<string>(parentGlobalFont || URDU_FONT_OPTIONS[0].value);
  const [studioUrduFont, setStudioUrduFont] = useState<string>(parentUrduFont || URDU_FONT_OPTIONS[0].value);
  const [studioOriginalFont, setStudioOriginalFont] = useState<string>(parentOriginalFont || ENGLISH_FONT_OPTIONS[0].value);
  const [studioGoogleFont, setStudioGoogleFont] = useState<string>(parentGoogleFont || URDU_FONT_OPTIONS[0].value);

  const [studioFontTarget, setStudioFontTarget] = useState<'global' | 'original' | 'ai' | 'google'>('global');
  const [studioFontsActiveTab, setStudioFontsActiveTab] = useState<'urdu' | 'english' | 'local'>('urdu');
  const [studioLocalFonts, setStudioLocalFonts] = useState<CustomFontItem[]>(() => getLocalFontsFromStorage());
  const [studioCustomFontInputName, setStudioCustomFontInputName] = useState<string>('');
  const [studioIsUploadingFont, setStudioIsUploadingFont] = useState<boolean>(false);

  const [isTextResizeOpen, setIsTextResizeOpen] = useState(false);
  const [isFontsOpen, setIsFontsOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);

  const [modalSearch, setModalSearch] = useState('');
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isConfirmingBatchDelete, setIsConfirmingBatchDelete] = useState(false);

  useEffect(() => {
    if (isConfirmingBatchDelete) {
      const timer = setTimeout(() => setIsConfirmingBatchDelete(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmingBatchDelete]);

  const handleRetryBoth = useCallback(async () => {
    if (onRetrySelectedBoth) {
      await onRetrySelectedBoth();
    } else {
      if (onRetrySelectedAI) await onRetrySelectedAI();
      if (onRetrySelectedGoogle) await onRetrySelectedGoogle();
    }
  }, [onRetrySelectedBoth, onRetrySelectedAI, onRetrySelectedGoogle]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());
  const columnDropdownRef = useRef<HTMLDivElement>(null);
  const textResizeRef = useRef<HTMLDivElement>(null);
  const fontsRef = useRef<HTMLDivElement>(null);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);

  // Initialize local draft state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Show only plain text in editable fields (strip raw codes/tags from loaded subtitles)
      const cleanDraftSubtitles = initialProjectSubtitles.map(s => ({
        ...s,
        text: stripFormatting(s.text || ''),
        translatedText: s.translatedText ? stripFormatting(s.translatedText) : undefined,
        googleTranslateText: s.googleTranslateText ? stripFormatting(s.googleTranslateText) : undefined
      }));
      setLocalSubtitles(cleanDraftSubtitles);
      setOriginalSnapshot(cleanDraftSubtitles);
      setHasUnsavedChanges(false);
      setStudioOriginalFontSize(parentOriginalFontSize || 14);
      setStudioTranslatedFontSize(parentTranslatedFontSize || 22);
      setStudioGoogleFontSize(parentGoogleFontSize || 14);
      setStudioGlobalFontSize(parentGlobalFontSize || 20);
      setStudioIsGlobalFontActive(parentIsGlobalFontActive);
      setStudioGlobalFont(parentGlobalFont || URDU_FONT_OPTIONS[0].value);
      setStudioUrduFont(parentUrduFont || URDU_FONT_OPTIONS[0].value);
      setStudioOriginalFont(parentOriginalFont || ENGLISH_FONT_OPTIONS[0].value);
      setStudioGoogleFont(parentGoogleFont || URDU_FONT_OPTIONS[0].value);

      // Sync column visibility with checkboxes from translation workspace header
      if (editorColumns) {
        setStudioColumns(prev => ({
          ...prev,
          original: editorColumns.original !== false,
          ai: editorColumns.ai !== false,
          google: editorColumns.google !== false,
          timing: editorColumns.time !== false
        }));
      }
    }
  }, [
    isOpen, 
    initialProjectSubtitles, 
    editorColumns,
    parentOriginalFontSize, 
    parentTranslatedFontSize, 
    parentGoogleFontSize, 
    parentGlobalFontSize,
    parentIsGlobalFontActive,
    parentGlobalFont,
    parentUrduFont,
    parentOriginalFont,
    parentGoogleFont
  ]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(target)) {
        setIsColumnDropdownOpen(false);
      }
      if (textResizeRef.current && !textResizeRef.current.contains(target)) {
        setIsTextResizeOpen(false);
      }
      if (fontsRef.current && !fontsRef.current.contains(target)) {
        setIsFontsOpen(false);
      }
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(target)) {
        setIsToolsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Stats for local editing progress
  const studioStats = useMemo(() => {
    const total = localSubtitles.length;
    const translated = localSubtitles.filter(s => s.translatedText && s.translatedText.trim().length > 0).length;
    const google = localSubtitles.filter(s => s.googleTranslateText && s.googleTranslateText.trim().length > 0).length;
    const progress = total > 0 ? Math.round((translated / total) * 100) : 0;
    const googleProgress = total > 0 ? Math.round((google / total) * 100) : 0;
    return {
      total,
      translated,
      google,
      untranslated: total - translated,
      progress,
      googleProgress
    };
  }, [localSubtitles]);

  // Filter subtitles based on search term
  const filteredSubtitles = useMemo(() => {
    if (!modalSearch.trim()) return localSubtitles;
    const q = modalSearch.toLowerCase();
    return localSubtitles.filter(s => 
      s.text.toLowerCase().includes(q) ||
      (s.translatedText && s.translatedText.toLowerCase().includes(q)) ||
      (s.googleTranslateText && s.googleTranslateText.toLowerCase().includes(q))
    );
  }, [localSubtitles, modalSearch]);

  const totalPages = useMemo(() => {
    if (pageSize === 0) return 1;
    return Math.max(1, Math.ceil(filteredSubtitles.length / pageSize));
  }, [filteredSubtitles.length, pageSize]);

  const paginatedSubtitles = useMemo(() => {
    if (pageSize === 0) return filteredSubtitles;
    const start = (currentPage - 1) * pageSize;
    return filteredSubtitles.slice(start, start + pageSize);
  }, [filteredSubtitles, currentPage, pageSize]);

  // Progressive Viewport Rendering for Subtitle Editor Studio
  const progressiveStudioSubtitles = useProgressiveRenderList(
    paginatedSubtitles,
    15,
    25,
    initialFocusIndex ? paginatedSubtitles.findIndex(s => s.index === initialFocusIndex) : undefined
  );

  const setRowRef = useCallback((index: number, el: HTMLTableRowElement | null) => {
    if (el) rowRefs.current.set(index, el);
    else rowRefs.current.delete(index);
  }, []);

  // Jump to focus index on open if provided
  useEffect(() => {
    if (isOpen && initialFocusIndex) {
      if (pageSize > 0) {
        const itemIdx = filteredSubtitles.findIndex(s => s.index === initialFocusIndex);
        if (itemIdx !== -1) {
          const targetPage = Math.floor(itemIdx / pageSize) + 1;
          setCurrentPage(targetPage);
        }
      }
      setTimeout(() => {
        const rowEl = rowRefs.current.get(initialFocusIndex);
        if (rowEl) {
          rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          rowEl.classList.add('ring-2', 'ring-emerald-500');
          setTimeout(() => {
            rowEl?.classList.remove('ring-2', 'ring-emerald-500');
          }, 2000);
        }
      }, 300);
    }
  }, [isOpen, initialFocusIndex, filteredSubtitles, pageSize]);

  // In-studio editing handlers
  const handleEditOriginal = useCallback((index: number, newText: string) => {
    setLocalSubtitles(prev => prev.map(s => s.index === index ? { ...s, text: newText } : s));
    setHasUnsavedChanges(true);
  }, []);

  const handleEditTranslated = useCallback((index: number, newText: string) => {
    setLocalSubtitles(prev => prev.map(s => s.index === index ? { ...s, translatedText: newText } : s));
    setHasUnsavedChanges(true);
  }, []);

  const handleEditGoogle = useCallback((index: number, newText: string) => {
    setLocalSubtitles(prev => prev.map(s => s.index === index ? { ...s, googleTranslateText: newText } : s));
    setHasUnsavedChanges(true);
  }, []);

  // Text Swapping Handlers
  const handleSwapAiGoogle = useCallback((index: number) => {
    setLocalSubtitles(prev => prev.map(s => {
      if (s.index === index) {
        return {
          ...s,
          translatedText: stripFormatting(s.googleTranslateText || ''),
          googleTranslateText: stripFormatting(s.translatedText || '')
        };
      }
      return s;
    }));
    setHasUnsavedChanges(true);
    onAddNotification(`Swapped AI ⇄ Google for #${index}`, "success");
  }, [onAddNotification]);

  const handleSwapOriginalAi = useCallback((index: number) => {
    setLocalSubtitles(prev => prev.map(s => {
      if (s.index === index) {
        return {
          ...s,
          text: stripFormatting(s.translatedText || ''),
          translatedText: stripFormatting(s.text || '')
        };
      }
      return s;
    }));
    setHasUnsavedChanges(true);
    onAddNotification(`Swapped Original ⇄ AI for #${index}`, "success");
  }, [onAddNotification]);

  const handleCopyGoogleToAi = useCallback((index: number) => {
    setLocalSubtitles(prev => prev.map(s => {
      if (s.index === index) {
        return { ...s, translatedText: stripFormatting(s.googleTranslateText || '') };
      }
      return s;
    }));
    setHasUnsavedChanges(true);
    onAddNotification(`Copied Google → AI for #${index}`, "success");
  }, [onAddNotification]);

  // Bulk Swap Actions
  const handleBulkSwapAiGoogle = useCallback(() => {
    setLocalSubtitles(prev => prev.map(s => {
      if (selectedIndices.size > 0 && !selectedIndices.has(s.index)) return s;
      return {
        ...s,
        translatedText: s.googleTranslateText || '',
        googleTranslateText: s.translatedText || ''
      };
    }));
    setHasUnsavedChanges(true);
    onAddNotification("Swapped AI ⇄ Google across subtitles", "success");
  }, [selectedIndices, onAddNotification]);

  const handleBulkCopyGoogleToAi = useCallback(() => {
    setLocalSubtitles(prev => prev.map(s => {
      if (selectedIndices.size > 0 && !selectedIndices.has(s.index)) return s;
      return { ...s, translatedText: s.googleTranslateText || s.translatedText };
    }));
    setHasUnsavedChanges(true);
    onAddNotification("Copied Google translations to AI fields", "success");
  }, [selectedIndices, onAddNotification]);

  // Clear Selected Translations
  const handleClearSelectedTranslations = useCallback(() => {
    if (selectedIndices.size === 0) return;
    setLocalSubtitles(prev => prev.map(s => {
      if (selectedIndices.has(s.index)) {
        return { ...s, translatedText: '' };
      }
      return s;
    }));
    setHasUnsavedChanges(true);
    onAddNotification(`Cleared AI translation on ${selectedIndices.size} subtitle(s) (timestamps & block numbers preserved)`, "success");
  }, [selectedIndices, onAddNotification]);

  const handleClearSelectedGoogleTranslations = useCallback(() => {
    if (selectedIndices.size === 0) return;
    setLocalSubtitles(prev => prev.map(s => {
      if (selectedIndices.has(s.index)) {
        return { ...s, googleTranslateText: '' };
      }
      return s;
    }));
    setHasUnsavedChanges(true);
    onAddNotification(`Cleared Google translation on ${selectedIndices.size} subtitle(s) (timestamps & block numbers preserved)`, "success");
  }, [selectedIndices, onAddNotification]);

  const handleClearSelectedBothTranslations = useCallback(() => {
    if (selectedIndices.size === 0) return;
    setLocalSubtitles(prev => prev.map(s => {
      if (selectedIndices.has(s.index)) {
        return { ...s, translatedText: '', googleTranslateText: '' };
      }
      return s;
    }));
    setHasUnsavedChanges(true);
    onAddNotification(`Cleared both translation streams on ${selectedIndices.size} subtitle(s) (timestamps & block numbers preserved)`, "success");
  }, [selectedIndices, onAddNotification]);

  // Clear All Formatting in editing workspace
  const handleClearAllFormatting = useCallback(() => {
    setLocalSubtitles(prev => prev.map(s => {
      if (selectedIndices.size > 0 && !selectedIndices.has(s.index)) return s;
      return {
        ...s,
        text: stripFormatting(s.text),
        translatedText: s.translatedText ? stripFormatting(s.translatedText) : undefined,
        googleTranslateText: s.googleTranslateText ? stripFormatting(s.googleTranslateText) : undefined,
        styleColor: undefined
      };
    }));
    setHasUnsavedChanges(true);
    onAddNotification("Cleared all formatting tags & styles from workspace", "success");
    onAddLog("Cleaned tags and restored plain text in editing workspace.", "info");
  }, [selectedIndices, onAddNotification, onAddLog]);

  // Save All Changes Button
  const handleSaveAllChanges = useCallback(() => {
    onUpdateSubtitles(() => localSubtitles);
    setOriginalSnapshot(localSubtitles);
    setHasUnsavedChanges(false);
    const now = new Date().toLocaleTimeString();
    setLastSavedTimestamp(now);
    onAddNotification("All changes saved to project successfully!", "success");
    onAddLog(`Saved all subtitle edits (${localSubtitles.length} segments).`, "success");
  }, [localSubtitles, onUpdateSubtitles, onAddNotification, onAddLog]);

  // Undo All Changes Button
  const handleUndoAllChanges = useCallback(() => {
    setLocalSubtitles(originalSnapshot);
    setHasUnsavedChanges(false);
    onAddNotification("Reverted all unsaved changes to initial state", "success");
    onAddLog("Reverted all edits made in this editing session.", "warning");
  }, [originalSnapshot, onAddNotification, onAddLog]);

  // Row operations
  const handleInsertAfter = useCallback((index?: number) => {
    const updated = insertSubtitle(localSubtitles, index);
    setLocalSubtitles(updated);
    setHasUnsavedChanges(true);
    onAddNotification("Inserted new subtitle segment", "success");
  }, [localSubtitles, onAddNotification]);

  const handleSplitRow = useCallback((index: number) => {
    const updated = splitSubtitle(localSubtitles, index);
    setLocalSubtitles(updated);
    setHasUnsavedChanges(true);
    onAddNotification(`Split segment #${index} in half`, "success");
  }, [localSubtitles, onAddNotification]);

  const handleDeleteRow = useCallback((index: number) => {
    const updated = deleteSubtitle(localSubtitles, index);
    setLocalSubtitles(updated);
    setHasUnsavedChanges(true);
    setSelectedIndices(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    onAddNotification(`Deleted segment #${index}`, "success");
  }, [localSubtitles, onAddNotification]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedIndices.size === 0) return;
    const count = selectedIndices.size;
    const updated = batchDeleteSubtitles(localSubtitles, selectedIndices);
    setLocalSubtitles(updated);
    setSelectedIndices(new Set());
    setHasUnsavedChanges(true);
    onAddNotification(`Deleted ${count} subtitle segment(s)`, "success");
  }, [localSubtitles, selectedIndices, onAddNotification]);

  // Selection handlers
  const toggleSelectRow = useCallback((index: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIndices.size === filteredSubtitles.length && filteredSubtitles.length > 0) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(filteredSubtitles.map(s => s.index)));
    }
  }, [filteredSubtitles, selectedIndices.size]);

  const selectUntranslated = useCallback(() => {
    const untranslated = filteredSubtitles.filter(s => !s.translatedText || s.translatedText.trim().length === 0);
    setSelectedIndices(new Set(untranslated.map(s => s.index)));
    onAddNotification(`Selected ${untranslated.length} untranslated subtitle(s)`, "success");
  }, [filteredSubtitles, onAddNotification]);

  // Font Selection Handler in Studio
  const applyStudioFontSelection = useCallback((name: string, value: string) => {
    if (studioFontTarget === 'global') {
      setStudioIsGlobalFontActive(true);
      setStudioGlobalFont(value);
      setStudioOriginalFont(value);
      setStudioUrduFont(value);
      setStudioGoogleFont(value);
      onAddNotification(`Applied global font: ${name}`, 'success');
      onAddLog(`Studio applied global font "${name}" to all streams.`, 'info');
    } else if (studioFontTarget === 'original') {
      setStudioIsGlobalFontActive(false);
      setStudioOriginalFont(value);
      onAddNotification(`Original stream font: ${name}`, 'success');
    } else if (studioFontTarget === 'ai') {
      setStudioIsGlobalFontActive(false);
      setStudioUrduFont(value);
      onAddNotification(`AI Urdu stream font: ${name}`, 'success');
    } else if (studioFontTarget === 'google') {
      setStudioIsGlobalFontActive(false);
      setStudioGoogleFont(value);
      onAddNotification(`Google stream font: ${name}`, 'success');
    }
  }, [studioFontTarget, onAddNotification, onAddLog]);

  // Font Upload Handler in Studio
  const handleStudioUploadFontFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStudioIsUploadingFont(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const fontName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_\-\s]/g, ' ').trim() || 'CustomFont';
      const fontValue = await registerUploadedFont(fontName, arrayBuffer);
      const newFont: CustomFontItem = {
        id: `studio-upload-${Date.now()}`,
        name: `${fontName} (Uploaded)`,
        value: fontValue,
        isUploaded: true
      };
      const updated = [newFont, ...studioLocalFonts];
      setStudioLocalFonts(updated);
      saveLocalFontsToStorage(updated);
      applyStudioFontSelection(newFont.name, newFont.value);
      onAddNotification(`Font file loaded: ${newFont.name}`, 'success');
    } catch (err: any) {
      onAddNotification('Failed to load font file', 'error');
    } finally {
      setStudioIsUploadingFont(false);
      if (e.target) e.target.value = '';
    }
  }, [studioLocalFonts, applyStudioFontSelection, onAddNotification]);

  const handleStudioAddNamedFont = useCallback(() => {
    if (!studioCustomFontInputName.trim()) {
      onAddNotification('Please enter a font family name', 'error');
      return;
    }
    const cleanName = studioCustomFontInputName.trim();
    const fontValue = `'${cleanName}', -apple-system, BlinkMacSystemFont, sans-serif`;
    const newFont: CustomFontItem = {
      id: `named-${Date.now()}`,
      name: cleanName,
      value: fontValue
    };
    const updated = [newFont, ...studioLocalFonts];
    setStudioLocalFonts(updated);
    saveLocalFontsToStorage(updated);
    applyStudioFontSelection(cleanName, fontValue);
    setStudioCustomFontInputName('');
    onAddNotification(`Added font: ${cleanName}`, 'success');
  }, [studioCustomFontInputName, studioLocalFonts, applyStudioFontSelection, onAddNotification]);

  const handleStudioDeleteLocalFont = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = studioLocalFonts.filter(f => f.id !== id);
    setStudioLocalFonts(updated);
    saveLocalFontsToStorage(updated);
    onAddNotification('Custom font removed', 'success');
  }, [studioLocalFonts, onAddNotification]);

  // Copy row translation
  const handleCopyRowText = (text: string, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text) return;
    const clean = text.replace(/<[^>]+>/g, '');
    navigator.clipboard.writeText(clean);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  // Close handler with auto-save check
  const handleDoneReturn = () => {
    if (hasUnsavedChanges) {
      handleSaveAllChanges();
    }
    onClose();
  };

  // Active Effective Typography
  const effectiveOriginalFont = studioIsGlobalFontActive ? studioGlobalFont : studioOriginalFont;
  const effectiveOriginalSize = studioIsGlobalFontActive ? studioGlobalFontSize : studioOriginalFontSize;
  const effectiveAiFont = studioIsGlobalFontActive ? studioGlobalFont : studioUrduFont;
  const effectiveAiSize = studioIsGlobalFontActive ? studioGlobalFontSize : studioTranslatedFontSize;
  const effectiveGoogleFont = studioIsGlobalFontActive ? studioGlobalFont : studioGoogleFont;
  const effectiveGoogleSize = studioIsGlobalFontActive ? Math.round(studioGlobalFontSize * 0.9) : studioGoogleFontSize;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[105] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className={cn(
          "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-xs transition-all duration-300 w-full",
          isFullScreen ? "fixed inset-0 h-screen w-screen rounded-none z-[110]" : "max-w-7xl h-[95vh]"
        )}
      >
        {/* Studio Top Navigation Bar with Rich Project Status */}
        <div className="p-3 sm:p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/95 dark:bg-zinc-900/95 flex flex-col gap-2.5 shrink-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Title & Metadata Pills */}
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
                <Languages size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
                    Dedicated Subtitle Editor Studio
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-mono text-[9px] font-bold border border-emerald-300 dark:border-emerald-800">
                    {localSubtitles.length} segments
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[9px] border border-zinc-200 dark:border-zinc-700 truncate max-w-[140px]" title={fileName}>
                    {fileName || 'subtitles.srt'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-mono text-[9px] font-bold border border-purple-200 dark:border-purple-800">
                    {detectedFormat}
                  </span>
                  {hasUnsavedChanges ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[9px] font-bold animate-pulse border border-amber-300 dark:border-amber-800">
                      Unsaved Edits
                    </span>
                  ) : lastSavedTimestamp ? (
                    <span className="text-[9.5px] font-mono text-zinc-400">
                      Saved at {lastSavedTimestamp}
                    </span>
                  ) : null}
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-sm sm:max-w-lg mt-0.5">
                  Full translation workspace integrated inside editor • Text resizing, fonts, column toggles, swap actions & tools
                </p>
              </div>
            </div>

            {/* Top Right Actions & Progress */}
            <div className="flex items-center gap-2 flex-wrap ml-auto">
              {/* Progress Bars for AI Urdu & Google */}
              <div className="hidden lg:flex items-center gap-3 px-2 py-1 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shrink-0 shadow-2xs">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[7.5px] font-bold text-emerald-600 uppercase">AI Urdu</span>
                    <span className="text-[8px] font-mono font-bold text-emerald-600">{studioStats.progress}%</span>
                  </div>
                  <div className="h-1.5 w-14 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300 rounded-full" 
                      style={{ width: `${studioStats.progress}%` }} 
                    />
                  </div>
                </div>
                <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[7.5px] font-bold text-blue-600 uppercase">Google</span>
                    <span className="text-[8px] font-mono font-bold text-blue-600">{studioStats.googleProgress}%</span>
                  </div>
                  <div className="h-1.5 w-14 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300 rounded-full" 
                      style={{ width: `${studioStats.googleProgress}%` }} 
                    />
                  </div>
                </div>
              </div>

              {/* Undo All Changes Button */}
              <button
                type="button"
                onClick={handleUndoAllChanges}
                disabled={!hasUnsavedChanges}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 font-bold transition-all disabled:opacity-40 cursor-pointer shadow-2xs"
                title="Undo all edits made during this session"
              >
                <Undo2 size={13} />
                <span className="hidden sm:inline">Undo All</span>
              </button>

              {/* Save All Changes Button */}
              <button
                type="button"
                onClick={handleSaveAllChanges}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all shadow-xs cursor-pointer",
                  hasUnsavedChanges
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse"
                    : "bg-emerald-600/90 hover:bg-emerald-700 text-white"
                )}
                title="Save all changes to the project"
              >
                <Save size={13} />
                <span>Save Changes</span>
              </button>

              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl transition-all cursor-pointer"
                title={isFullScreen ? "Exit Fullscreen" : "Fullscreen Studio"}
              >
                {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>

              {/* Done & Return */}
              <button
                type="button"
                onClick={handleDoneReturn}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 hover:bg-black text-white dark:bg-zinc-700 dark:hover:bg-zinc-600 rounded-xl font-bold transition-all shadow-xs cursor-pointer"
                title="Finish editing and return to main dashboard"
              >
                <Check size={14} />
                <span>Done</span>
              </button>
            </div>
          </div>

          {/* SECONDARY TOOLBAR: Translation Workspace Controls in Editor Studio */}
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-zinc-200/60 dark:border-zinc-800/60 max-w-full">
            {/* Search Dialogue Input */}
            <div className="relative shrink-0">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
              <input
                value={modalSearch}
                onChange={e => {
                  setModalSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search dialogue..."
                className="pl-7 pr-6 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500 w-32 sm:w-44 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
              />
              {modalSearch && (
                <button
                  type="button"
                  onClick={() => setModalSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Quick Selection Helpers */}
            <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-0.5 shrink-0 shadow-2xs">
              <button
                type="button"
                onClick={toggleSelectAll}
                disabled={filteredSubtitles.length === 0}
                className="px-2 py-1 rounded text-[10px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors cursor-pointer"
                title="Select all visible segments"
              >
                {selectedIndices.size === filteredSubtitles.length && filteredSubtitles.length > 0 ? "Deselect" : "All"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedIndices(new Set());
                  setIsConfirmingBatchDelete(false);
                }}
                disabled={selectedIndices.size === 0}
                className="px-2 py-1 rounded text-[10px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors cursor-pointer"
                title="Clear selection"
              >
                None
              </button>
              <button
                type="button"
                onClick={selectUntranslated}
                disabled={filteredSubtitles.length === 0}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors cursor-pointer"
                title="Select all segments without AI translations"
              >
                <Filter size={11} className="text-indigo-500" />
                <span>Untranslated ({studioStats.untranslated})</span>
              </button>
            </div>

            {/* Selected Action Bar (Appears when 1+ subtitles are selected, wraps within viewport) */}
            {selectedIndices.size > 0 && (
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 bg-emerald-50/95 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800/90 rounded-xl p-1.5 max-w-full shadow-xs animate-in fade-in duration-150">
                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono text-[9.5px] font-bold shrink-0">
                  {selectedIndices.size} selected
                </span>

                {onRetrySelectedAI && (
                  <button
                    type="button"
                    onClick={onRetrySelectedAI}
                    disabled={isTranslating}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[9.5px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                    title="Retry AI translation for selected subtitles"
                  >
                    {isTranslating ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                    <span>Retry AI</span>
                  </button>
                )}

                {onRetrySelectedGoogle && (
                  <button
                    type="button"
                    onClick={onRetrySelectedGoogle}
                    disabled={isGoogleTranslatingAll}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[9.5px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                    title="Translate selected subtitles with Google Machine translation"
                  >
                    {isGoogleTranslatingAll ? <Loader2 size={11} className="animate-spin" /> : <Languages size={11} />}
                    <span>Retry Google</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleRetryBoth}
                  disabled={isTranslating || isGoogleTranslatingAll}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[9.5px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  title="Retry both AI and Google translations for selected subtitles"
                >
                  {(isTranslating || isGoogleTranslatingAll) ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                  <span>Retry Both</span>
                </button>

                <button
                  type="button"
                  onClick={handleBulkSwapAiGoogle}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[9.5px] font-bold transition-colors cursor-pointer shrink-0"
                  title="Swap AI ⇄ Google for selected"
                >
                  <ArrowLeftRight size={11} className="text-blue-500" />
                  <span>Swap AI ⇄ G</span>
                </button>

                <button
                  type="button"
                  onClick={handleBulkCopyGoogleToAi}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[9.5px] font-bold transition-colors cursor-pointer shrink-0"
                  title="Copy Google to AI for selected"
                >
                  <Copy size={11} className="text-emerald-500" />
                  <span>G → AI</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearSelectedTranslations}
                  className="px-2 py-1 text-[9.5px] font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-amber-300/60 dark:border-amber-800/60 rounded transition-colors cursor-pointer shrink-0"
                  title="Clear AI translation stream for selected subtitles (keeps timestamps & block # intact)"
                >
                  Clear AI
                </button>

                <button
                  type="button"
                  onClick={handleClearSelectedGoogleTranslations}
                  className="px-2 py-1 text-[9.5px] font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-300/60 dark:border-blue-800/60 rounded transition-colors cursor-pointer shrink-0"
                  title="Clear Google translation stream for selected subtitles (keeps timestamps & block # intact)"
                >
                  Clear Google
                </button>

                <button
                  type="button"
                  onClick={handleClearSelectedBothTranslations}
                  className="px-2 py-1 text-[9.5px] font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-purple-300/60 dark:border-purple-800/60 rounded transition-colors cursor-pointer shrink-0"
                  title="Clear both translation streams for selected subtitles (keeps timestamps & block # intact)"
                >
                  Clear Both
                </button>

                {/* Full Segment/Block Deletion (Removes Entire Subtitle Segment - 2-step click confirmation without window.confirm) */}
                <button
                  type="button"
                  onClick={() => {
                    if (isConfirmingBatchDelete) {
                      handleDeleteSelected();
                      setIsConfirmingBatchDelete(false);
                    } else {
                      setIsConfirmingBatchDelete(true);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 text-[9.5px] font-bold rounded transition-all cursor-pointer shrink-0 shadow-2xs",
                    isConfirmingBatchDelete
                      ? "bg-red-600 hover:bg-red-700 text-white border border-red-700 animate-pulse"
                      : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60"
                  )}
                  title={isConfirmingBatchDelete ? "Click again to confirm deletion" : "Delete entire subtitle block(s) including timestamps and sequence #"}
                >
                  <Trash2 size={11} />
                  <span>{isConfirmingBatchDelete ? `Confirm Delete (${selectedIndices.size})?` : "Delete Block"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedIndices(new Set());
                    setIsConfirmingBatchDelete(false);
                  }}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded cursor-pointer shrink-0"
                  title="Clear selection"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Columns Visibility Menu */}
            <div ref={columnDropdownRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsColumnDropdownOpen(prev => !prev);
                  setIsTextResizeOpen(false);
                  setIsFontsOpen(false);
                  setIsToolsDropdownOpen(false);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border cursor-pointer shadow-2xs",
                  isColumnDropdownOpen
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-600 dark:text-emerald-300"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                )}
                title="Select and show/hide columns in the editor studio"
              >
                <Columns size={12} className="text-zinc-500" />
                <span>Columns</span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/5 dark:bg-white/10 font-bold">
                  {[studioColumns.original, studioColumns.ai, studioColumns.google].filter(Boolean).length}/3
                </span>
              </button>

              {isColumnDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl p-3.5 z-[90] space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      Editor Studio Columns
                    </span>
                    <button type="button" onClick={() => setIsColumnDropdownOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5">
                      <X size={13} />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={studioColumns.timing}
                        onChange={e => setStudioColumns(prev => ({ ...prev, timing: e.target.checked }))}
                        className="accent-emerald-600 rounded cursor-pointer w-3.5 h-3.5"
                      />
                      <span>Timestamp & CPS Rate</span>
                    </label>
                    <label className={cn(
                      "flex items-center gap-2 p-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors",
                      studioColumns.original ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200" : "hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                    )}>
                      <input
                        type="checkbox"
                        checked={studioColumns.original}
                        onChange={e => setStudioColumns(prev => ({ ...prev, original: e.target.checked }))}
                        className="accent-emerald-600 rounded cursor-pointer w-3.5 h-3.5"
                      />
                      <span>Original Language (Source)</span>
                    </label>
                    <label className={cn(
                      "flex items-center gap-2 p-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors",
                      studioColumns.ai ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200" : "hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                    )}>
                      <input
                        type="checkbox"
                        checked={studioColumns.ai}
                        onChange={e => setStudioColumns(prev => ({ ...prev, ai: e.target.checked }))}
                        className="accent-emerald-600 rounded cursor-pointer w-3.5 h-3.5"
                      />
                      <span>AI Translated Language</span>
                    </label>
                    <label className={cn(
                      "flex items-center gap-2 p-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors",
                      studioColumns.google ? "bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200" : "hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                    )}>
                      <input
                        type="checkbox"
                        checked={studioColumns.google}
                        onChange={e => setStudioColumns(prev => ({ ...prev, google: e.target.checked }))}
                        className="accent-blue-600 rounded cursor-pointer w-3.5 h-3.5"
                      />
                      <span>Google Translation</span>
                    </label>
                    <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={studioColumns.swaps}
                        onChange={e => setStudioColumns(prev => ({ ...prev, swaps: e.target.checked }))}
                        className="accent-emerald-600 rounded cursor-pointer w-3.5 h-3.5"
                      />
                      <span>Row Actions & Swaps</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Translation Language & Script Settings Button */}
            {onOpenTranslationSettings && (
              <button
                type="button"
                onClick={onOpenTranslationSettings}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 transition-colors cursor-pointer shrink-0 shadow-2xs"
                title="Configure Target Language, Script & Bilingual Mode, Tone, and Formatting"
              >
                <Sliders size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Settings:</span>
                <span className="font-mono text-[9px] bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold">
                  {translationSettings?.scriptMode ? SCRIPT_MODES.find(s => s.id === translationSettings.scriptMode)?.badge || 'اردو' : 'اردو'}
                </span>
              </button>
            )}

            {/* Text Resize Button & Menu */}
            <div ref={textResizeRef} className="relative shrink-0 text-resize-menu-container">
              <button 
                type="button"
                onClick={() => { 
                  setIsTextResizeOpen(prev => !prev); 
                  setIsFontsOpen(false); 
                  setIsColumnDropdownOpen(false);
                  setIsToolsDropdownOpen(false);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border cursor-pointer shadow-2xs",
                  isTextResizeOpen 
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-600 dark:text-emerald-300" 
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                )}
                title="Adjust text scale for original and translated subtitle streams"
              >
                <TypeIcon size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Text Resize</span>
                <span className="sm:hidden">Resize</span>
              </button>
              
              {isTextResizeOpen && (
                <div 
                  className="absolute top-full left-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl p-4 z-[90] space-y-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <TypeIcon size={15} className="text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                        Editor Studio Text Resize
                      </span>
                    </div>
                    <button type="button" onClick={() => setIsTextResizeOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 cursor-pointer">
                      <X size={14} />
                    </button>
                  </div>

                  {/* Column Visibility Checkboxes */}
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Studio Columns Rendered
                      </span>
                      <span className="text-[8.5px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                        {[studioColumns.original && 'Original', studioColumns.ai && 'AI', studioColumns.google && 'Google'].filter(Boolean).length}/3 Active
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                      <label className={cn(
                        "flex items-center gap-2 p-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors select-none",
                        studioColumns.original 
                          ? "bg-emerald-50/80 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-200" 
                          : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300"
                      )}>
                        <input
                          type="checkbox"
                          checked={studioColumns.original}
                          onChange={e => setStudioColumns(prev => ({ ...prev, original: e.target.checked }))}
                          className="accent-emerald-600 rounded w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="truncate">Original</span>
                      </label>

                      <label className={cn(
                        "flex items-center gap-2 p-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors select-none",
                        studioColumns.ai 
                          ? "bg-emerald-50/80 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-200" 
                          : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300"
                      )}>
                        <input
                          type="checkbox"
                          checked={studioColumns.ai}
                          onChange={e => setStudioColumns(prev => ({ ...prev, ai: e.target.checked }))}
                          className="accent-emerald-600 rounded w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="truncate">AI Translation</span>
                      </label>

                      <label className={cn(
                        "flex items-center gap-2 p-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors select-none",
                        studioColumns.google 
                          ? "bg-blue-50/80 border-blue-300 text-blue-900 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-200" 
                          : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300"
                      )}>
                        <input
                          type="checkbox"
                          checked={studioColumns.google}
                          onChange={e => setStudioColumns(prev => ({ ...prev, google: e.target.checked }))}
                          className="accent-blue-600 rounded w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="truncate">Google Translation</span>
                      </label>
                    </div>
                  </div>

                  {/* Stream Sizing Sliders */}
                  <div className="space-y-3">
                    {/* Global Sync Scale Slider */}
                    <div className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <Globe size={13} className="text-indigo-600 dark:text-indigo-400" />
                          <label className="text-[10px] font-bold text-indigo-900 dark:text-indigo-200">Global Synchronized Scale</label>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-700">
                          {studioGlobalFontSize}px
                        </span>
                      </div>
                      <input 
                        type="range" min="12" max="44" step="1"
                        value={studioGlobalFontSize} 
                        onChange={e => {
                          const val = Number(e.target.value);
                          setStudioGlobalFontSize(val);
                          setStudioOriginalFontSize(Math.max(10, Math.round(val * 0.75)));
                          setStudioTranslatedFontSize(val);
                          setStudioGoogleFontSize(Math.max(10, Math.round(val * 0.75)));
                        }}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    {/* Original Subtitle Stream Slider */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                          <span>Original Stream Size</span>
                          {studioColumns.original && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Visible" />}
                        </label>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-emerald-700 dark:text-emerald-300 font-bold">
                          {studioOriginalFontSize}px
                        </span>
                      </div>
                      <input 
                        type="range" min="10" max="42" step="1"
                        value={studioOriginalFontSize} 
                        onChange={e => setStudioOriginalFontSize(Number(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    {/* AI Translation Stream Slider */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                          <span>AI Translation Stream Size</span>
                          {studioColumns.ai && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Visible" />}
                        </label>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 font-bold">
                          {studioTranslatedFontSize}px
                        </span>
                      </div>
                      <input 
                        type="range" min="12" max="52" step="1"
                        value={studioTranslatedFontSize} 
                        onChange={e => setStudioTranslatedFontSize(Number(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    {/* Google Translation Stream Slider */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                          <span>Google Translation Stream Size</span>
                          {studioColumns.google && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Visible" />}
                        </label>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-bold">
                          {studioGoogleFontSize}px
                        </span>
                      </div>
                      <input 
                        type="range" min="10" max="42" step="1"
                        value={studioGoogleFontSize} 
                        onChange={e => setStudioGoogleFontSize(Number(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Quick Presets */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Presets:</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => { setStudioOriginalFontSize(12); setStudioTranslatedFontSize(18); setStudioGoogleFontSize(13); setStudioGlobalFontSize(18); }}
                        className="px-2 py-0.5 text-[9.5px] font-bold rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                      >
                        Compact
                      </button>
                      <button
                        type="button"
                        onClick={() => { setStudioOriginalFontSize(14); setStudioTranslatedFontSize(22); setStudioGoogleFontSize(15); setStudioGlobalFontSize(22); }}
                        className="px-2 py-0.5 text-[9.5px] font-bold rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                      >
                        Standard
                      </button>
                      <button
                        type="button"
                        onClick={() => { setStudioOriginalFontSize(17); setStudioTranslatedFontSize(28); setStudioGoogleFontSize(18); setStudioGlobalFontSize(28); }}
                        className="px-2 py-0.5 text-[9.5px] font-bold rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                      >
                        Cinema
                      </button>
                      <button
                        type="button"
                        onClick={() => { setStudioOriginalFontSize(20); setStudioTranslatedFontSize(34); setStudioGoogleFontSize(21); setStudioGlobalFontSize(34); }}
                        className="px-2 py-0.5 text-[9.5px] font-bold rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                      >
                        Large
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Fonts Button & Menu */}
            <div ref={fontsRef} className="relative shrink-0 fonts-menu-container">
              <button 
                type="button"
                onClick={() => { 
                  setIsFontsOpen(prev => !prev); 
                  setIsTextResizeOpen(false); 
                  setIsColumnDropdownOpen(false);
                  setIsToolsDropdownOpen(false);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border cursor-pointer shadow-2xs",
                  isFontsOpen 
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-600 dark:text-emerald-300" 
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                )}
                title="Select font family for original and translated subtitle streams in studio"
              >
                <Languages size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>Fonts</span>
              </button>
              
              {isFontsOpen && (
                <div 
                  className="absolute top-full left-0 mt-2 w-[340px] sm:w-[440px] max-w-[calc(100vw-1.5rem)] bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl p-3 sm:p-4 z-[90] space-y-3.5 max-h-[85vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Languages size={16} className="text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                        Editor Studio Typography & Fonts
                      </span>
                    </div>
                    <button type="button" onClick={() => setIsFontsOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 cursor-pointer">
                      <X size={14} />
                    </button>
                  </div>

                  {/* Column Visibility Checkboxes */}
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Studio Columns Rendered
                      </span>
                      <span className="text-[8.5px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                        {[studioColumns.original && 'Original', studioColumns.ai && 'AI', studioColumns.google && 'Google'].filter(Boolean).length}/3 Active
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                      <label className={cn(
                        "flex items-center gap-2 p-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors select-none",
                        studioColumns.original 
                          ? "bg-emerald-50/80 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-200" 
                          : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300"
                      )}>
                        <input
                          type="checkbox"
                          checked={studioColumns.original}
                          onChange={e => setStudioColumns(prev => ({ ...prev, original: e.target.checked }))}
                          className="accent-emerald-600 rounded w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="truncate">Original</span>
                      </label>

                      <label className={cn(
                        "flex items-center gap-2 p-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors select-none",
                        studioColumns.ai 
                          ? "bg-emerald-50/80 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-200" 
                          : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300"
                      )}>
                        <input
                          type="checkbox"
                          checked={studioColumns.ai}
                          onChange={e => setStudioColumns(prev => ({ ...prev, ai: e.target.checked }))}
                          className="accent-emerald-600 rounded w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="truncate">AI Translation</span>
                      </label>

                      <label className={cn(
                        "flex items-center gap-2 p-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors select-none",
                        studioColumns.google 
                          ? "bg-blue-50/80 border-blue-300 text-blue-900 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-200" 
                          : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300"
                      )}>
                        <input
                          type="checkbox"
                          checked={studioColumns.google}
                          onChange={e => setStudioColumns(prev => ({ ...prev, google: e.target.checked }))}
                          className="accent-blue-600 rounded w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="truncate">Google Translation</span>
                      </label>
                    </div>
                  </div>

                  {/* Target Subtitle Stream Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                      Apply Selected Font To:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setStudioFontTarget('global')}
                        className={cn(
                          "px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer",
                          studioFontTarget === 'global'
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                        )}
                      >
                        <Globe size={11} />
                        <span>Global (All)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudioFontTarget('original')}
                        className={cn(
                          "px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer",
                          studioFontTarget === 'original'
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                        )}
                      >
                        <span>Original</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudioFontTarget('ai')}
                        className={cn(
                          "px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer",
                          studioFontTarget === 'ai'
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                        )}
                      >
                        <span>AI Urdu</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudioFontTarget('google')}
                        className={cn(
                          "px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer",
                          studioFontTarget === 'google'
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                        )}
                      >
                        <span>Google</span>
                      </button>
                    </div>
                    {studioFontTarget === 'global' && studioIsGlobalFontActive && (
                      <div className="flex items-center justify-between p-1.5 px-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg border border-indigo-200 dark:border-indigo-800 text-[10px] text-indigo-700 dark:text-indigo-300 font-medium">
                        <span>🌐 Global font active across all streams</span>
                        <button
                          type="button"
                          onClick={() => {
                            setStudioIsGlobalFontActive(false);
                            onAddNotification('Disabled global font mode; streams now use their individual fonts.', 'success');
                          }}
                          className="text-[9px] underline font-bold hover:text-indigo-900 dark:hover:text-indigo-100 cursor-pointer"
                        >
                          Use Individual Fonts
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Typography Tabs: English, Urdu, My Local Fonts */}
                  <div>
                    <div className="flex border-b border-zinc-200 dark:border-zinc-700 mb-2.5">
                      <button
                        type="button"
                        onClick={() => setStudioFontsActiveTab('urdu')}
                        className={cn(
                          "flex-1 pb-2 text-[11px] font-bold transition-colors border-b-2 text-center cursor-pointer",
                          studioFontsActiveTab === 'urdu'
                            ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                            : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                        )}
                      >
                        اردو Urdu Fonts ({URDU_FONT_OPTIONS.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudioFontsActiveTab('english')}
                        className={cn(
                          "flex-1 pb-2 text-[11px] font-bold transition-colors border-b-2 text-center cursor-pointer",
                          studioFontsActiveTab === 'english'
                            ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                            : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                        )}
                      >
                        English Fonts ({ENGLISH_FONT_OPTIONS.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudioFontsActiveTab('local')}
                        className={cn(
                          "flex-1 pb-2 text-[11px] font-bold transition-colors border-b-2 text-center cursor-pointer",
                          studioFontsActiveTab === 'local'
                            ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                            : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                        )}
                      >
                        My Local Fonts ({studioLocalFonts.length})
                      </button>
                    </div>

                    {/* Tab 1: Urdu Fonts */}
                    {studioFontsActiveTab === 'urdu' && (
                      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                        {URDU_FONT_OPTIONS.map((f) => {
                          const isActive = studioFontTarget === 'global' ? (studioIsGlobalFontActive && studioGlobalFont === f.value) : (
                            (studioFontTarget === 'original' && studioOriginalFont === f.value) ||
                            (studioFontTarget === 'ai' && studioUrduFont === f.value) ||
                            (studioFontTarget === 'google' && studioGoogleFont === f.value)
                          );
                          return (
                            <button
                              key={f.name}
                              type="button"
                              onClick={() => applyStudioFontSelection(f.name, f.value)}
                              className={cn(
                                "w-full text-left p-2.5 rounded-xl border transition-all flex flex-col gap-1 cursor-pointer",
                                isActive
                                  ? "bg-emerald-50/90 border-emerald-400 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-600 dark:text-emerald-200 shadow-2xs"
                                  : "bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/60 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold">{f.name}</span>
                                {isActive && <Check size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />}
                              </div>
                              <div 
                                className="text-right text-base text-zinc-900 dark:text-zinc-100 font-urdu py-0.5"
                                style={{ fontFamily: f.value }}
                                dir="rtl"
                              >
                                {f.previewText || 'ہر بات میں ایک گہرا احساس چھپا ہے'}
                              </div>
                              {f.description && (
                                <span className="text-[9px] text-zinc-400 dark:text-zinc-500">{f.description}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Tab 2: English Fonts */}
                    {studioFontsActiveTab === 'english' && (
                      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                        {ENGLISH_FONT_OPTIONS.map((f) => {
                          const isActive = studioFontTarget === 'global' ? (studioIsGlobalFontActive && studioGlobalFont === f.value) : (
                            (studioFontTarget === 'original' && studioOriginalFont === f.value) ||
                            (studioFontTarget === 'ai' && studioUrduFont === f.value) ||
                            (studioFontTarget === 'google' && studioGoogleFont === f.value)
                          );
                          return (
                            <button
                              key={f.name}
                              type="button"
                              onClick={() => applyStudioFontSelection(f.name, f.value)}
                              className={cn(
                                "w-full text-left p-2.5 rounded-xl border transition-all flex flex-col gap-1 cursor-pointer",
                                isActive
                                  ? "bg-emerald-50/90 border-emerald-400 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-600 dark:text-emerald-200 shadow-2xs"
                                  : "bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/60 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold">{f.name}</span>
                                {isActive && <Check size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />}
                              </div>
                              <div 
                                className="text-left text-sm text-zinc-900 dark:text-zinc-100 py-0.5"
                                style={{ fontFamily: f.value }}
                              >
                                {f.previewText || 'Cinematic Dialogue & Narrative Flow'}
                              </div>
                              {f.description && (
                                <span className="text-[9px] text-zinc-400 dark:text-zinc-500">{f.description}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Tab 3: My Local Fonts */}
                    {studioFontsActiveTab === 'local' && (
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2">
                          <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                            Add Custom Font for Source & Subtitles
                          </span>
                          
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              placeholder="System Font Name (e.g. Arial, SF Pro, Nafees)"
                              value={studioCustomFontInputName}
                              onChange={e => setStudioCustomFontInputName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleStudioAddNamedFont(); }}
                              className="flex-1 px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                            />
                            <button
                              type="button"
                              onClick={handleStudioAddNamedFont}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 cursor-pointer transition-colors shadow-2xs"
                            >
                              + Add
                            </button>
                          </div>

                          <label className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg border border-dashed border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 hover:bg-emerald-100/60 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs cursor-pointer transition-colors">
                            <Upload size={12} className={studioIsUploadingFont ? "animate-bounce" : ""} />
                            <span>{studioIsUploadingFont ? "Loading Font..." : "Upload Font File (.ttf, .otf, .woff, .woff2)"}</span>
                            <input
                              type="file"
                              accept=".ttf,.otf,.woff,.woff2,font/*"
                              onChange={handleStudioUploadFontFile}
                              className="hidden"
                              disabled={studioIsUploadingFont}
                            />
                          </label>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block">
                            Saved Local Fonts ({studioLocalFonts.length})
                          </span>
                          {studioLocalFonts.length === 0 ? (
                            <div className="text-center py-4 text-zinc-400 text-xs italic">
                              No local fonts added yet. Type a system font name or upload a .ttf/.otf file above.
                            </div>
                          ) : (
                            studioLocalFonts.map((f) => {
                              const isActive = studioFontTarget === 'global' ? (studioIsGlobalFontActive && studioGlobalFont === f.value) : (
                                (studioFontTarget === 'original' && studioOriginalFont === f.value) ||
                                (studioFontTarget === 'ai' && studioUrduFont === f.value) ||
                                (studioFontTarget === 'google' && studioGoogleFont === f.value)
                              );
                              return (
                                <div
                                  key={f.id}
                                  onClick={() => applyStudioFontSelection(f.name, f.value)}
                                  className={cn(
                                    "w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer group",
                                    isActive
                                      ? "bg-emerald-50/90 border-emerald-400 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-600 dark:text-emerald-200 shadow-2xs"
                                      : "bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/60 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                                  )}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[11px] font-bold truncate">{f.name}</span>
                                      {f.isUploaded && (
                                        <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                          Uploaded
                                        </span>
                                      )}
                                    </div>
                                    <div 
                                      className="text-xs text-zinc-700 dark:text-zinc-300 truncate mt-0.5"
                                      style={{ fontFamily: f.value }}
                                    >
                                      The quick brown fox jumps over the lazy dog • ہر بات میں احساس
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {isActive && <Check size={14} className="text-emerald-600 dark:text-emerald-400" />}
                                    <button
                                      type="button"
                                      onClick={(e) => handleStudioDeleteLocalFont(f.id, e)}
                                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-red-500 hover:text-red-700 transition-opacity"
                                      title="Remove custom font"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Gradients & Styles Button */}
            {onOpenStylizer && (
              <button
                type="button"
                onClick={onOpenStylizer}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 hover:from-amber-500/20 hover:to-indigo-500/20 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-200 transition-all cursor-pointer shrink-0 shadow-2xs"
                title="Apply multi-color gradients across subtitle blocks"
              >
                <Sparkles size={13} className="text-amber-500" />
                <span>Gradients & Styles</span>
              </button>
            )}

            {/* Gap Timing Direct Action Button */}
            {onOpenGapTiming && (
              <button
                type="button"
                onClick={onOpenGapTiming}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-2xs"
                title="Remove time gaps or adjust gap range between consecutive subtitle blocks"
              >
                <FoldHorizontal size={12} className="text-cyan-500" />
                <span>Gap Timing</span>
              </button>
            )}

            {/* Subtitle Tools Dropdown (Find & Replace, Time Shift, Gap Timing, Text Cleanup, Clear Formatting) */}
            <div ref={toolsDropdownRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsToolsDropdownOpen(prev => !prev);
                  setIsColumnDropdownOpen(false);
                  setIsTextResizeOpen(false);
                  setIsFontsOpen(false);
                }}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border cursor-pointer shadow-2xs",
                  isToolsDropdownOpen
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-600 dark:text-indigo-300"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                )}
                title="Advanced subtitle tools"
              >
                <Wand2 size={12} className="text-indigo-500" />
                <span>Tools</span>
              </button>

              {isToolsDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-2xl p-2 z-[90] space-y-1">
                  {onOpenFindReplace && (
                    <button
                      type="button"
                      onClick={() => { setIsToolsDropdownOpen(false); onOpenFindReplace(); }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      <Replace size={13} className="text-blue-500" />
                      <span>Find & Replace...</span>
                    </button>
                  )}
                  {onOpenTimeShift && (
                    <button
                      type="button"
                      onClick={() => { setIsToolsDropdownOpen(false); onOpenTimeShift(); }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      <Clock size={13} className="text-amber-500" />
                      <span>Time Shift (+/- ms)...</span>
                    </button>
                  )}
                  {onOpenGapTiming && (
                    <button
                      type="button"
                      onClick={() => { setIsToolsDropdownOpen(false); onOpenGapTiming(); }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      <FoldHorizontal size={13} className="text-cyan-500" />
                      <span>Gap Timing & Snapping...</span>
                    </button>
                  )}
                  {onOpenTextCleanup && (
                    <button
                      type="button"
                      onClick={() => { setIsToolsDropdownOpen(false); onOpenTextCleanup(); }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      <Sparkles size={13} className="text-emerald-500" />
                      <span>Text Cleanup & Fixes...</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setIsToolsDropdownOpen(false); handleClearAllFormatting(); }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  >
                    <Trash2 size={13} className="text-rose-500" />
                    <span>Clear All Formatting</span>
                  </button>
                  {onCopyAllGoogleToEmptyAI && (
                    <button
                      type="button"
                      onClick={() => { setIsToolsDropdownOpen(false); onCopyAllGoogleToEmptyAI(); }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-[11px] font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                    >
                      <Copy size={13} className="text-blue-500" />
                      <span>Google → Empty AI</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Add Segment */}
            <button
              type="button"
              onClick={() => handleInsertAfter()}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 transition-colors cursor-pointer shadow-2xs"
              title="Add a new subtitle segment at bottom"
            >
              <Plus size={12} className="text-emerald-600 dark:text-emerald-400" />
              <span>Add Segment</span>
            </button>
          </div>
        </div>

        {/* Warning if all 3 text columns are hidden */}
        {!studioColumns.original && !studioColumns.ai && !studioColumns.google && (
          <div className="p-2.5 px-4 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-amber-600 shrink-0" />
              <span>All subtitle text columns are currently hidden. Select at least one column to display dialogue.</span>
            </div>
            <button
              type="button"
              onClick={() => setStudioColumns(prev => ({ ...prev, original: true, ai: true, google: true }))}
              className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold cursor-pointer"
            >
              Show All Columns
            </button>
          </div>
        )}

        {/* Scrollable Subtitles Table */}
        <div className="flex-1 overflow-auto p-2 sm:p-4">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800/95 backdrop-blur-sm z-10 shadow-xs border-b border-zinc-200 dark:border-zinc-700">
              <tr className="text-zinc-500 dark:text-zinc-400 text-[9px] font-bold uppercase tracking-widest">
                {studioColumns.index && (
                  <th className="p-2.5 w-12 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <input 
                        type="checkbox"
                        checked={filteredSubtitles.length > 0 && selectedIndices.size === filteredSubtitles.length}
                        onChange={toggleSelectAll}
                        className="accent-emerald-600 rounded cursor-pointer w-3.5 h-3.5"
                        title={selectedIndices.size > 0 ? "Deselect all" : "Select all visible"}
                      />
                      <span>#</span>
                    </div>
                  </th>
                )}
                {studioColumns.timing && <th className="p-2.5 w-36">Time & CPS Rate</th>}
                {studioColumns.original && (
                  <th className="p-2.5 min-w-[200px]">
                    <div className="flex items-center gap-1.5">
                      <span>Original Language (Source)</span>
                      <span className="text-[8px] font-normal px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
                        {translationSettings?.sourceLanguage === 'auto' ? 'Source' : (translationSettings?.sourceLanguage || 'EN').toUpperCase()}
                      </span>
                    </div>
                  </th>
                )}
                {studioColumns.ai && (
                  <th className="p-2.5 min-w-[220px]">
                    <div className="flex items-center gap-1.5">
                      <span>AI Translated Language</span>
                      <span className="text-[8px] font-normal px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                        {TARGET_LANGUAGES.find(l => l.code === translationSettings?.targetLanguage)?.name || 'Urdu'} • {SCRIPT_MODES.find(s => s.id === translationSettings?.scriptMode)?.badge || 'اردو'}
                      </span>
                    </div>
                  </th>
                )}
                {studioColumns.google && (
                  <th className="p-2.5 min-w-[180px]">
                    <div className="flex items-center gap-1.5">
                      <span>Google Translation</span>
                      <span className="text-[8px] font-normal px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
                        Machine
                      </span>
                    </div>
                  </th>
                )}
                {studioColumns.swaps && <th className="p-2.5 w-24 text-center">Swap / Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-700/40">
              {filteredSubtitles.length === 0 && (
                <tr>
                  <td 
                    colSpan={
                      (studioColumns.index ? 1 : 0) +
                      (studioColumns.timing ? 1 : 0) +
                      (studioColumns.original ? 1 : 0) +
                      (studioColumns.ai ? 1 : 0) +
                      (studioColumns.google ? 1 : 0) +
                      (studioColumns.swaps ? 1 : 0)
                    } 
                    className="p-16 text-center text-zinc-400"
                  >
                    <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
                      <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <FileText size={36} className="stroke-[1.5]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
                          {localSubtitles.length === 0 ? "No Subtitle Entries Loaded" : "No Subtitles Match Search"}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          {localSubtitles.length === 0 
                            ? "Load cinematic sample subtitles or upload your file to start editing immediately." 
                            : "Try clearing your search query to see all dialogue segments."}
                        </p>
                      </div>
                      {localSubtitles.length === 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          {onLoadSampleSubtitles && (
                            <button
                              type="button"
                              onClick={onLoadSampleSubtitles}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                            >
                              <Sparkles size={13} />
                              <span>Load Sample Subtitles</span>
                            </button>
                          )}
                          {onFileUpload && (
                            <label className="px-3.5 py-1.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer">
                              <Upload size={13} />
                              <span>Upload File</span>
                              <input type="file" accept=".srt,.vtt,.ass,.ssa,.sbv,.lrc,.json,.txt" onChange={onFileUpload} className="hidden" />
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              {progressiveStudioSubtitles.map((item) => (
                <StudioSubtitleRow
                  key={item.index}
                  item={item}
                  isSelected={selectedIndices.has(item.index)}
                  studioColumns={studioColumns}
                  effectiveOriginalFont={effectiveOriginalFont}
                  effectiveOriginalSize={effectiveOriginalSize}
                  effectiveAiFont={effectiveAiFont}
                  effectiveAiSize={effectiveAiSize}
                  effectiveGoogleFont={effectiveGoogleFont}
                  effectiveGoogleSize={effectiveGoogleSize}
                  isCopied={copiedIndex === item.index}
                  onToggleSelect={toggleSelectRow}
                  onEditOriginal={handleEditOriginal}
                  onEditTranslated={handleEditTranslated}
                  onEditGoogle={handleEditGoogle}
                  onSwapOriginalAi={handleSwapOriginalAi}
                  onSwapAiGoogle={handleSwapAiGoogle}
                  onCopyGoogleToAi={handleCopyGoogleToAi}
                  onCopyRowText={handleCopyRowText}
                  onTranslateGoogle={onTranslateGoogle}
                  onInsertAfter={handleInsertAfter}
                  onSplitRow={handleSplitRow}
                  onDeleteRow={handleDeleteRow}
                  setRowRef={setRowRef}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Pagination & Footer */}
        <div className="p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0 select-none">
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
            Showing <span className="font-bold text-zinc-800 dark:text-zinc-200">{pageSize === 0 ? 1 : (currentPage - 1) * pageSize + 1}</span> to <span className="font-bold text-zinc-800 dark:text-zinc-200">{pageSize === 0 ? filteredSubtitles.length : Math.min(currentPage * pageSize, filteredSubtitles.length)}</span> of <span className="font-bold text-zinc-800 dark:text-zinc-200">{filteredSubtitles.length}</span> segments
            {modalSearch && <span className="ml-1 text-emerald-600 dark:text-emerald-400 font-bold">(filtered)</span>}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Rows Per Page */}
            <div className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
              <span>Per page:</span>
              {[25, 50, 100, 0].map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => { setPageSize(size); setCurrentPage(1); }}
                  className={cn(
                    "px-2 py-0.5 rounded font-mono font-bold transition-colors cursor-pointer",
                    pageSize === size 
                      ? "bg-emerald-600 text-white" 
                      : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300"
                  )}
                >
                  {size === 0 ? "All" : size}
                </button>
              ))}
            </div>

            {/* Pagination Controls */}
            {pageSize > 0 && totalPages > 1 && (
              <div className="flex items-center gap-1.5 ml-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={13} />
                </button>
                <span className="font-mono text-[10px] font-bold text-zinc-700 dark:text-zinc-300 px-1">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleDoneReturn}
              className="ml-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Done & Return
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
