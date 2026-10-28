import React, { useState, useMemo } from 'react';
import { 
  Languages, 
  BookOpen, 
  Sparkles, 
  X, 
  Check, 
  Sliders, 
  Shield, 
  Volume2, 
  Split, 
  Type, 
  Search,
  Hash,
  Smile,
  Globe,
  Quote,
  Flame,
  Award
} from 'lucide-react';
import { 
  TranslationSettings, 
  TARGET_LANGUAGES, 
  SCRIPT_MODES, 
  TONE_REGISTERS, 
  HONORIFIC_OPTIONS,
  LOAN_WORD_OPTIONS,
  IDIOM_OPTIONS,
  LINE_BREAK_MODES, 
  CONTENT_FILTERS,
  AUDIO_CUE_OPTIONS,
  NUMBER_FORMAT_OPTIONS,
  PUNCTUATION_OPTIONS,
  ScriptMode,
  ToneRegister,
  HonorificRegister,
  LoanWordMode,
  IdiomMode,
  LineBreakMode,
  ContentFilter,
  AudioCueMode,
  NumberFormatMode,
  PunctuationMode
} from '../services/translationSettings';
import { URDU_FONT_OPTIONS, ENGLISH_FONT_OPTIONS } from '../constants/fonts';
import { cn } from '../utils/cn';

interface TranslationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TranslationSettings;
  onSave: (newSettings: TranslationSettings) => void;
  urduFont: string;
  onUpdateUrduFont: (font: string) => void;
  originalFont: string;
  onUpdateOriginalFont: (font: string) => void;
  onAddLog: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

const SOURCE_LANGUAGES = [
  { code: 'auto', name: 'Auto-Detect', nativeName: 'Auto' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'tr', name: 'Turkish (Dizi/Drama)', nativeName: 'Türkçe' },
  { code: 'ko', name: 'Korean (K-Drama)', nativeName: '한국어' },
  { code: 'hi', name: 'Hindi (Bollywood)', nativeName: 'हिन्दी' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'ja', name: 'Japanese (Anime)', nativeName: '日本語' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fa', name: 'Persian (Farsi)', nativeName: 'فارسی' }
];

export const TranslationSettingsModal: React.FC<TranslationSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  urduFont,
  onUpdateUrduFont,
  originalFont,
  onUpdateOriginalFont,
  onAddLog
}) => {
  const [localSettings, setLocalSettings] = useState<TranslationSettings>({ ...settings });
  const [activeTab, setActiveTab] = useState<'script' | 'language' | 'tone' | 'cultural' | 'formatting' | 'moderation' | 'fonts'>('script');
  const [langSearch, setLangSearch] = useState('');

  // Filter languages by search query
  const filteredLanguages = useMemo(() => {
    if (!langSearch.trim()) return TARGET_LANGUAGES;
    const q = langSearch.toLowerCase();
    return TARGET_LANGUAGES.filter(l => 
      l.name.toLowerCase().includes(q) || 
      l.nativeName.toLowerCase().includes(q) || 
      l.code.toLowerCase().includes(q) ||
      (l.region && l.region.toLowerCase().includes(q))
    );
  }, [langSearch]);

  if (!isOpen) return null;

  const currentScriptObj = SCRIPT_MODES.find(s => s.id === localSettings.scriptMode) || SCRIPT_MODES[0];
  const currentLangObj = TARGET_LANGUAGES.find(l => l.code === localSettings.targetLanguage) || TARGET_LANGUAGES[0];
  const currentToneObj = TONE_REGISTERS.find(t => t.id === localSettings.toneRegister) || TONE_REGISTERS[0];
  const currentHonorificObj = HONORIFIC_OPTIONS.find(h => h.id === localSettings.honorificRegister) || HONORIFIC_OPTIONS[0];

  const handleApply = () => {
    onSave(localSettings);
    onAddLog(`Translation settings updated: ${currentLangObj.name} • ${currentScriptObj.label} • ${currentToneObj.label}.`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 text-white shadow-md">
              <Sliders size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Translation Engine Studio
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                  {currentScriptObj.badge}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold border border-blue-300 dark:border-blue-800">
                  {currentLangObj.name}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Configure languages, bilingual dual-streams, Roman Urdu, authentic honorifics, tone, and line formatting.
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-2 bg-zinc-100/80 dark:bg-zinc-800/70 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto shrink-0">
          {[
            { id: 'script' as const, label: 'Script & Bilingual', icon: Type },
            { id: 'language' as const, label: 'Target & Source Lang', icon: Languages },
            { id: 'tone' as const, label: 'Tone & Register', icon: BookOpen },
            { id: 'cultural' as const, label: 'Honorifics & Vocabulary', icon: Award },
            { id: 'formatting' as const, label: 'Line Layout & Numbers', icon: Split },
            { id: 'moderation' as const, label: 'Moderation & Audio Cues', icon: Shield },
            { id: 'fonts' as const, label: 'Fonts & Typography', icon: Type }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                  isActive
                    ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs border border-zinc-200 dark:border-zinc-700"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-800/50"
                )}
              >
                <Icon size={14} className={isActive ? "text-emerald-500" : "text-zinc-400"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">

          {/* TAB 1: SCRIPT & BILINGUAL MODES */}
          {activeTab === 'script' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  Output Script & Bilingual Dual-Stream Modes
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                  Choose pure Nastaliq Urdu script, phonetic Roman Urdu, or dual-language subtitle streams (e.g. English dialogue with Urdu translation stacked).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {SCRIPT_MODES.map((mode) => {
                  const isSelected = localSettings.scriptMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setLocalSettings(prev => ({ ...prev, scriptMode: mode.id }))}
                      className={cn(
                        "p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 relative cursor-pointer group",
                        isSelected
                          ? "border-emerald-500 ring-2 ring-emerald-500/25 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-900/40"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">{mode.label}</span>
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                              {mode.badge}
                            </span>
                          </div>
                          <div className="text-[11px] font-urdu text-emerald-700 dark:text-emerald-400 mt-1 font-bold" dir="rtl">
                            {mode.urduLabel}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                        {mode.description}
                      </p>

                      {/* Live Code/Sample Preview Box */}
                      <div className="p-2.5 rounded-lg bg-zinc-900 text-zinc-200 font-mono text-[10px] space-y-1">
                        <div className="text-[8.5px] uppercase tracking-wider text-zinc-400">Sample Subtitle Render:</div>
                        <div className="whitespace-pre-line text-emerald-400 font-sans leading-relaxed">
                          {mode.sample}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: TARGET & SOURCE LANGUAGES */}
          {activeTab === 'language' && (
            <div className="space-y-6">
              
              {/* Source Language */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-0.5">Source Video Language</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                      Specify the audio/original subtitle language or let Gemini automatically detect it.
                    </p>
                  </div>
                  <Globe size={16} className="text-zinc-400" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {SOURCE_LANGUAGES.map((sl) => {
                    const isSelected = (localSettings.sourceLanguage || 'auto') === sl.code;
                    return (
                      <button
                        key={sl.code}
                        type="button"
                        onClick={() => setLocalSettings(prev => ({ ...prev, sourceLanguage: sl.code }))}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 cursor-pointer",
                          isSelected
                            ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-900/40"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">{sl.name}</span>
                          {isSelected && <Check size={12} className="text-emerald-500" />}
                        </div>
                        <span className="text-[10px] text-zinc-400">{sl.nativeName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Languages */}
              <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-0.5">Target Translation Language</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                      Urdu is the flagship specialty, but over 24 South Asian, Middle Eastern, and global languages are fully supported.
                    </p>
                  </div>

                  {/* Search filter */}
                  <div className="relative min-w-[220px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input 
                      type="text"
                      value={langSearch}
                      onChange={(e) => setLangSearch(e.target.value)}
                      placeholder="Search languages..."
                      className="w-full pl-8 pr-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {filteredLanguages.map((lang) => {
                    const isSelected = localSettings.targetLanguage === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setLocalSettings(prev => ({ ...prev, targetLanguage: lang.code }))}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer relative",
                          isSelected
                            ? "border-emerald-500 ring-2 ring-emerald-500/25 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-900/40"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">{lang.name}</span>
                          {isSelected && <Check size={14} className="text-emerald-500" />}
                        </div>
                        <div className="text-sm font-medium text-emerald-700 dark:text-emerald-400" dir={lang.direction}>
                          {lang.nativeName}
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-zinc-400">
                          <span>{lang.region || 'Standard'}</span>
                          <span className="font-mono uppercase">{lang.direction.toUpperCase()}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: TONE & REGISTER */}
          {activeTab === 'tone' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">Dialogue Tone & Cultural Register</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                  Tailor the vocabulary and dramatic style to match your genre—from street conversation to high poetic literature.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TONE_REGISTERS.map((tone) => {
                  const isSelected = localSettings.toneRegister === tone.id;
                  return (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => setLocalSettings(prev => ({ ...prev, toneRegister: tone.id }))}
                      className={cn(
                        "p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer",
                        isSelected
                          ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs"
                          : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">{tone.label}</span>
                          </div>
                          <span className="text-xs font-urdu font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block" dir="rtl">
                            {tone.urduLabel}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                        {tone.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: CULTURAL, HONORIFICS & VOCABULARY */}
          {activeTab === 'cultural' && (
            <div className="space-y-6">

              {/* Honorifics & Pronoun Formality */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    Honorifics & Pronoun Address (Aap / Tum / Tu)
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                    Controls whether characters address each other with respectful "Aap" (آپ), peer "Tum" (تم), or intense "Tu" (تو).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {HONORIFIC_OPTIONS.map((hon) => {
                    const isSelected = localSettings.honorificRegister === hon.id;
                    return (
                      <button
                        key={hon.id}
                        type="button"
                        onClick={() => setLocalSettings(prev => ({ ...prev, honorificRegister: hon.id }))}
                        className={cn(
                          "p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer",
                          isSelected
                            ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-900/40"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">{hon.label}</span>
                          <span className="text-xs font-urdu font-bold text-emerald-600 dark:text-emerald-400">{hon.urduLabel}</span>
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 text-[10.5px] leading-relaxed">{hon.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Loan Words & Code-Switching */}
              <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    Modern English Words & Code-Switching
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                    How modern tech and daily terms like "hospital", "phone", "car", "police", "office" are translated.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {LOAN_WORD_OPTIONS.map((lw) => {
                    const isSelected = localSettings.loanWordMode === lw.id;
                    return (
                      <button
                        key={lw.id}
                        type="button"
                        onClick={() => setLocalSettings(prev => ({ ...prev, loanWordMode: lw.id }))}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer",
                          isSelected
                            ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-900/40"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">{lw.label}</span>
                          {isSelected && <Check size={14} className="text-emerald-500" />}
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 text-[10px] leading-relaxed">{lw.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Idiom Handling */}
              <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    Idiomatic Adaptation (محاوراتی بمقابلہ لفظی)
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                    Choose whether foreign idioms are culturally converted to native Urdu proverbs.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {IDIOM_OPTIONS.map((idm) => {
                    const isSelected = localSettings.idiomMode === idm.id;
                    return (
                      <button
                        key={idm.id}
                        type="button"
                        onClick={() => setLocalSettings(prev => ({ ...prev, idiomMode: idm.id }))}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer",
                          isSelected
                            ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-900/40"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">{idm.label}</span>
                          {isSelected && <Check size={14} className="text-emerald-500" />}
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 text-[10px] leading-relaxed">{idm.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: FORMATTING, NUMBERS & PUNCTUATION */}
          {activeTab === 'formatting' && (
            <div className="space-y-6">
              
              {/* Line breaks */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">Subtitle Line Layout & Screen Fit</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                    Controls characters per second (CPS) and automatic 2-line splitting for television, mobile, and web viewing.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {LINE_BREAK_MODES.map((mode) => {
                    const isSelected = localSettings.lineBreakMode === mode.id;
                    return (
                      <label
                        key={mode.id}
                        className={cn(
                          "flex items-start justify-between gap-3 p-3.5 rounded-xl border transition-all cursor-pointer",
                          isSelected
                            ? "border-emerald-500/70 bg-emerald-50/30 dark:bg-emerald-950/20 ring-1 ring-emerald-500/20"
                            : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="lineBreakMode"
                            checked={isSelected}
                            onChange={() => setLocalSettings(prev => ({ ...prev, lineBreakMode: mode.id }))}
                            className="mt-1 accent-emerald-600"
                          />
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">{mode.label}</span>
                            <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">{mode.description}</p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Number Formatting */}
              <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">Numerals & Digit Style</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                    Choose whether numbers are written in Western digits (1, 2, 3), Eastern Urdu digits (۱، ۲، ۳), or spelled out in words.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {NUMBER_FORMAT_OPTIONS.map((nf) => {
                    const isSelected = localSettings.numberFormatMode === nf.id;
                    return (
                      <button
                        key={nf.id}
                        type="button"
                        onClick={() => setLocalSettings(prev => ({ ...prev, numberFormatMode: nf.id }))}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer",
                          isSelected
                            ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-900/40"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">{nf.label}</span>
                          {isSelected && <Check size={14} className="text-emerald-500" />}
                        </div>
                        <span className="text-[10px] text-zinc-400 font-urdu">{nf.sample}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Punctuation */}
              <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">Punctuation Style</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                    Urdu inverted comma (،), question mark (؟), and full stop (۔) vs standard Western punctuation.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {PUNCTUATION_OPTIONS.map((po) => {
                    const isSelected = localSettings.punctuationMode === po.id;
                    return (
                      <button
                        key={po.id}
                        type="button"
                        onClick={() => setLocalSettings(prev => ({ ...prev, punctuationMode: po.id }))}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer",
                          isSelected
                            ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-900/40"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">{po.label}</span>
                          {isSelected && <Check size={14} className="text-emerald-500" />}
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 text-[10px] leading-relaxed">{po.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: MODERATION & AUDIO CUES */}
          {activeTab === 'moderation' && (
            <div className="space-y-6">
              
              {/* Content Moderation */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">Profanity & Content Moderation</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                    Choose whether to retain unfiltered emotional intensity or soften language for general family audiences.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {CONTENT_FILTERS.map((filter) => {
                    const isSelected = localSettings.contentFilter === filter.id;
                    return (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setLocalSettings(prev => ({ ...prev, contentFilter: filter.id }))}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer",
                          isSelected
                            ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-900/40"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">{filter.label}</span>
                          {isSelected && <Check size={14} className="text-emerald-500" />}
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 text-[10px] leading-relaxed">{filter.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Audio Cues Handling */}
              <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">Bracketed Audio Cues & Sound Effects</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                    How sound descriptions like [music playing], (screams), [applause] are handled in the translation.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {AUDIO_CUE_OPTIONS.map((cue) => {
                    const isSelected = localSettings.audioCueMode === cue.id;
                    return (
                      <button
                        key={cue.id}
                        type="button"
                        onClick={() => setLocalSettings(prev => ({ ...prev, audioCueMode: cue.id }))}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer",
                          isSelected
                            ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-900/40"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">{cue.title}</span>
                          {isSelected && <Check size={14} className="text-emerald-500" />}
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 text-[10px] leading-relaxed">{cue.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 7: FONTS & TYPOGRAPHY */}
          {activeTab === 'fonts' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Translation Stream Font (Urdu)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {URDU_FONT_OPTIONS.map((font) => (
                    <button
                      key={font.name}
                      onClick={() => onUpdateUrduFont(font.value)}
                      className={cn(
                        "p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all",
                        urduFont === font.value
                          ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                      )}
                    >
                      <span className="text-xs font-bold" style={{ fontFamily: font.value }}>{font.name}</span>
                      {urduFont === font.value && <Check size={14} className="text-emerald-500" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Original Stream Font (English)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {ENGLISH_FONT_OPTIONS.map((font) => (
                    <button
                      key={font.name}
                      onClick={() => onUpdateOriginalFont(font.value)}
                      className={cn(
                        "p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all",
                        originalFont === font.value
                          ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                      )}
                    >
                      <span className="text-xs font-bold" style={{ fontFamily: font.value }}>{font.name}</span>
                      {originalFont === font.value && <Check size={14} className="text-emerald-500" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span className="text-[10px] text-zinc-400">Active Profile:</span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {currentLangObj.name} • {currentScriptObj.label} • {currentToneObj.label} ({currentHonorificObj.label})
            </span>
          </div>

          <div className="flex items-center gap-2">
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
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <Check size={14} />
              <span>Apply Settings</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
