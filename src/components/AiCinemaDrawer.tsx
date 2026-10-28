import React, { useState } from 'react';
import { 
  Film, 
  Sparkles, 
  X, 
  Search, 
  BookOpen, 
  Star, 
  Users, 
  HelpCircle, 
  Languages, 
  Copy, 
  Check, 
  Download, 
  ArrowRight, 
  Loader2, 
  Clapperboard, 
  Send,
  Info
} from 'lucide-react';
import { GeminiService } from '../services/gemini';
import { cn } from '../utils/cn';

interface AiCinemaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  geminiService: GeminiService | null;
  isGeminiConnected: boolean;
  onApplyContext: (contextText: string) => void;
  onAddLog: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  onAddNotification: (msg: string, type: 'success' | 'error') => void;
}

const PRESET_MOVIES = [
  'Oppenheimer (2023)',
  'Interstellar (2014)',
  'The Legend of Maula Jatt (2022)',
  'Dune: Part Two (2024)',
  'The Dark Knight (2008)',
  'The Godfather (1972)',
  'Breaking Bad (TV Series)',
  'Succession (TV Series)'
];

const PRESET_ACTIONS = [
  {
    id: 'story' as const,
    label: 'Simple & Easy Story',
    labelUrdu: 'آسان کہانی اور خلاصہ',
    icon: BookOpen,
    desc: 'Simple, easy-to-understand storyline breakdown capturing the emotional core.'
  },
  {
    id: 'plot' as const,
    label: 'Deep Plot Breakdown',
    labelUrdu: 'تفصیلی پلاٹ اور سین بہ سین تجزیہ',
    icon: Film,
    desc: 'Act-by-act in-depth narrative progression, setup, turning points, and climax.'
  },
  {
    id: 'review' as const,
    label: 'Movie / Series Review',
    labelUrdu: 'تنقیدی جائزہ اور ریٹنگز',
    icon: Star,
    desc: 'Critical review covering direction, acting, emotional payoff, and rating out of 10.'
  },
  {
    id: 'characters' as const,
    label: 'Character Arcs',
    labelUrdu: 'کرداروں کی نفسیات اور تعلقات',
    icon: Users,
    desc: 'Motivations, psychological depth, and interpersonal relationships.'
  },
  {
    id: 'ending' as const,
    label: 'Ending & Hidden Themes',
    labelUrdu: 'اختتام کی تشریح اور راز',
    icon: HelpCircle,
    desc: 'Resolves ending ambiguity, explains philosophical themes and Easter eggs.'
  },
  {
    id: 'context' as const,
    label: 'Subtitle Localization Aid',
    labelUrdu: 'مکالماتی سیاق و سباق',
    icon: Languages,
    desc: 'Cultural slang, gender nuances, and background hints for subtitle translating.'
  }
];

export const AiCinemaDrawer: React.FC<AiCinemaDrawerProps> = ({
  isOpen,
  onClose,
  geminiService,
  isGeminiConnected,
  onApplyContext,
  onAddLog,
  onAddNotification
}) => {
  const [movieQuery, setMovieQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<'story' | 'plot' | 'review' | 'characters' | 'ending' | 'context' | 'all'>('story');
  const [language, setLanguage] = useState<'ur' | 'en' | 'bilingual'>('ur');
  const [isLoading, setIsLoading] = useState(false);
  const [resultText, setResultText] = useState('');
  const [activeMovieTitle, setActiveMovieTitle] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (overrideQuery?: string, overrideAction?: typeof selectedAction) => {
    const q = (overrideQuery || movieQuery).trim();
    if (!q) {
      onAddNotification("Please enter a movie or TV series title", "error");
      return;
    }

    const action = overrideAction || selectedAction;
    setIsLoading(true);
    setActiveMovieTitle(q);

    try {
      if (geminiService && isGeminiConnected) {
        onAddLog(`AI Cinema analyzing "${q}" (${action}, ${language})...`, "info");
        const insight = await geminiService.generateCinemaInsights(q, action, language);
        setResultText(insight);
        onAddLog(`AI Cinema report generated for "${q}".`, "success");
        onAddNotification(`Generated cinema breakdown for "${q}"`, "success");
      } else {
        // Fallback generator when offline or no API key set
        const dummyUrdu = `## ${q} • خلاصہ اور جائزہ\n\n**کہانی کا بنیادی مقصد:** یہ ایک نہایت اثر انگیز اور دلچسپ سنیما شاہکار ہے جو انسانی جذبات، کشمکش اور ارادے کی طاقت کو اجاگر کرتا ہے۔\n\n### اہم نکات اور کہانی:\n- **آغاز:** کہانی مرکزی کردار کی عام زندگی اور اس پر آنے والے ایک غیر متوقع چیلنج سے شروع ہوتی ہے۔\n- **تنازعہ:** اہم فیصلے جن سے کردار کی زندگی بدل جاتی ہے اور شدید کشمکش پیدا ہوتی ہے۔\n- **عروج (Climax):** تمام کرداروں کا آمنا سامنا اور کہانی کا فیصلہ کن موڑ۔\n\n### مکالمات کا سیاق و سباق:\nاردو ترجمہ کرتے وقت شائستہ اور گہرے جذباتی الفاظ استعمال کریں تاکہ اصل مکالمے کا اثر برقرار رہے۔`;
        const dummyEn = `## ${q} • Cinema Breakdown\n\n**Core Storyline:** A compelling narrative exploring human determination, unexpected conflict, and moral dilemmas.\n\n### Key Narrative Beats:\n- **Setup:** Introduces the protagonist in their world before an inciting incident disrupts normalcy.\n- **Confrontation:** Tension escalates as opposing forces collide.\n- **Climax:** High-stakes confrontation resolving the primary narrative arc.\n\n### Subtitle Translation Insight:\nPreserve the emotional gravitas and colloquial nuances when translating character dialogue.`;
        
        const fallbackText = language === 'ur' ? dummyUrdu : language === 'en' ? dummyEn : `${dummyEn}\n\n---\n\n${dummyUrdu}`;
        setResultText(fallbackText);
        onAddNotification(`Sample cinema breakdown generated for "${q}" (Connect Gemini for full live search)`, "success");
      }
    } catch (err: any) {
      console.error("AI Cinema error:", err);
      onAddLog(`AI Cinema error: ${err.message}`, "error");
      onAddNotification(`Failed to generate cinema insight: ${err.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!resultText) return;
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    onAddNotification("Cinema insight copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyToSubtitleContext = () => {
    if (!resultText) return;
    onApplyContext(resultText);
    onAddLog(`Injected cinema insight for "${activeMovieTitle}" directly into Subtitle Cultural Context.`, "success");
    onAddNotification("Applied as Subtitle Cultural Context!", "success");
  };

  const handleDownloadTxt = () => {
    if (!resultText) return;
    const blob = new Blob(['\ufeff' + resultText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(activeMovieTitle || 'movie_breakdown').replace(/[^a-z0-9]/gi, '_')}_cinema_insight.txt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 10000);
    onAddNotification("Downloaded cinema summary as .txt", "success");
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        />
      )}

      {/* Slide-over Drawer from Left Edge */}
      <div 
        className={cn(
          "fixed top-0 bottom-0 left-0 z-[130] w-full max-w-lg sm:max-w-xl md:max-w-2xl bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out text-xs",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-850/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-600 via-rose-600 to-indigo-600 text-white shadow-xs">
              <Clapperboard size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
                  AI Cinema Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-mono text-[9px] font-bold border border-amber-300 dark:border-amber-800">
                  Left Drawer
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Movie database collector, plot breakdown, easy story & reviews in Urdu and English
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Close AI Cinema"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Search Box */}
          <div className="space-y-2">
            <label className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Search size={13} className="text-amber-500" />
              <span>Search Movie or Series Database</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={movieQuery}
                  onChange={e => setMovieQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                  placeholder="e.g. Oppenheimer, Interstellar, Dune, Maula Jatt, Succession..."
                  className="w-full pl-3 pr-8 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {movieQuery && (
                  <button
                    type="button"
                    onClick={() => setMovieQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={isLoading || !movieQuery.trim()}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>Analyze</span>
              </button>
            </div>
          </div>

          {/* Quick Preset Movie Pills */}
          <div className="space-y-1.5">
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Popular Film Examples (1-Click)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_MOVIES.map(movie => (
                <button
                  key={movie}
                  type="button"
                  onClick={() => {
                    setMovieQuery(movie);
                    handleGenerate(movie);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-zinc-700 dark:text-zinc-300 hover:text-amber-800 dark:hover:text-amber-300 border border-zinc-200 dark:border-zinc-700/60 text-[10px] font-medium transition-colors cursor-pointer"
                >
                  {movie}
                </button>
              ))}
            </div>
          </div>

          {/* Target Language & Action Config */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 block mb-1.5">
                Output Language
              </label>
              <div className="flex gap-1">
                {[
                  { id: 'ur' as const, label: 'اردو (Urdu)' },
                  { id: 'en' as const, label: 'English' },
                  { id: 'bilingual' as const, label: 'Bilingual (Both)' }
                ].map(l => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLanguage(l.id)}
                    className={cn(
                      "flex-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-colors cursor-pointer text-center",
                      language === l.id
                        ? "bg-amber-600 text-white shadow-2xs"
                        : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100"
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 block mb-1.5">
                Fast Action Modes
              </label>
              <select
                value={selectedAction}
                onChange={e => setSelectedAction(e.target.value as any)}
                className="w-full p-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
              >
                {PRESET_ACTIONS.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.label} ({a.labelUrdu})
                  </option>
                ))}
                <option value="all">Complete Full Cinema Dossier</option>
              </select>
            </div>
          </div>

          {/* Preset Action Grid (Fast Prompts) */}
          <div className="space-y-1.5">
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Preset Action Prompts for Fast Execution
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_ACTIONS.map(action => {
                const Icon = action.icon;
                const isSelected = selectedAction === action.id;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => {
                      setSelectedAction(action.id);
                      if (movieQuery.trim()) {
                        handleGenerate(movieQuery, action.id);
                      }
                    }}
                    className={cn(
                      "p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer group",
                      isSelected
                        ? "border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500/30"
                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 hover:border-amber-300 dark:hover:border-amber-700 text-zinc-700 dark:text-zinc-300"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon size={13} className={isSelected ? "text-amber-600 dark:text-amber-400" : "text-zinc-400 group-hover:text-amber-500"} />
                      <span className="font-bold text-[10.5px] truncate">{action.label}</span>
                    </div>
                    <span className="text-[9px] font-urdu text-zinc-500 dark:text-zinc-400 text-right truncate" dir="rtl">
                      {action.labelUrdu}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Area */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Clapperboard size={13} className="text-amber-500" />
                <span>Cinema Intelligence Output</span>
                {activeMovieTitle && <span className="font-mono text-zinc-400 font-normal">({activeMovieTitle})</span>}
              </span>

              {resultText && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold cursor-pointer"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadTxt}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold cursor-pointer"
                    title="Download as Text"
                  >
                    <Download size={11} />
                    <span>Save .txt</span>
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/80 rounded-2xl border border-zinc-200 dark:border-zinc-800 min-h-[220px] max-h-[360px] overflow-y-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-zinc-400">
                  <Loader2 size={24} className="animate-spin text-amber-500" />
                  <p className="text-xs font-bold animate-pulse">Searching movie database & generating breakdown...</p>
                  <p className="text-[10px] text-zinc-500">Analyzing plot, characters, ratings, and cultural nuance</p>
                </div>
              ) : resultText ? (
                <div 
                  className={cn(
                    "leading-relaxed whitespace-pre-wrap select-text text-zinc-800 dark:text-zinc-200 text-xs",
                    language === 'ur' ? "font-urdu text-right leading-[2.3]" : "font-sans"
                  )}
                  dir={language === 'ur' ? "rtl" : "ltr"}
                >
                  {resultText}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-zinc-400 dark:text-zinc-500 text-center">
                  <Film size={28} className="opacity-40" />
                  <p className="font-bold text-xs">No movie analyzed yet</p>
                  <p className="text-[10.5px] max-w-xs text-zinc-400">
                    Type any movie or TV series above, or click one of the preset film pills to generate story breakdowns and reviews!
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-850/90 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-[10.5px] text-zinc-500 dark:text-zinc-400">
            <Info size={13} className="text-amber-500 shrink-0" />
            <span className="hidden sm:inline">Use breakdown as rich context for subtitle accuracy</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyToSubtitleContext}
              disabled={!resultText}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer"
              title="Transfer this story and plot breakdown into Cultural Context"
            >
              <Send size={12} />
              <span>Use as Subtitle Context</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
