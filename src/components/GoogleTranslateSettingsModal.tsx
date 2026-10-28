import React, { useState } from 'react';
import { 
  Languages, 
  X, 
  Check, 
  Settings, 
  Globe, 
  Key, 
  Sliders, 
  Zap, 
  ShieldCheck, 
  Loader2,
  Info
} from 'lucide-react';
import { TranslationSettings, TARGET_LANGUAGES } from '../services/translationSettings';
import { cn } from '../utils/cn';

interface GoogleTranslateSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  googleApiKey: string;
  onUpdateGoogleApiKey: (key: string) => void;
  translationSettings: TranslationSettings;
  onUpdateTranslationSettings: (settings: TranslationSettings) => void;
  googleWorkers: number;
  onUpdateGoogleWorkers: (workers: number) => void;
  googleBatchSize: number;
  onUpdateGoogleBatchSize: (batchSize: number) => void;
  onTestConnection: () => Promise<void> | void;
  testStatus?: 'idle' | 'loading' | 'success' | 'failed';
  onAddLog: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  onAddNotification: (msg: string, type: 'success' | 'error') => void;
}

const SUPPORTED_SOURCE_LANGUAGES = [
  { code: 'auto', name: 'Auto-Detect Language (خودکار شناخت)' },
  { code: 'en', name: 'English (انگریزی)' },
  { code: 'ur', name: 'Urdu (اردو)' },
  { code: 'hi', name: 'Hindi (ہندی)' },
  { code: 'ar', name: 'Arabic (عربی)' },
  { code: 'fa', name: 'Persian / Farsi (فارسی)' },
  { code: 'tr', name: 'Turkish (ترکی)' },
  { code: 'es', name: 'Spanish (ہسپانوی)' },
  { code: 'fr', name: 'French (فرانسیسی)' },
  { code: 'de', name: 'German (جرمن)' },
  { code: 'ja', name: 'Japanese (جاپانی)' },
  { code: 'ko', name: 'Korean (کوریائی)' },
  { code: 'zh', name: 'Chinese (چینی)' }
];

const SUPPORTED_TARGET_LANGUAGES = [
  { code: 'ur', name: 'Urdu Script (اردو رسم الخط)' },
  { code: 'en', name: 'English (انگریزی)' },
  { code: 'ur-roman', name: 'Roman Urdu (Latin English Letters)' },
  { code: 'hi', name: 'Hindi (हिंदी)' },
  { code: 'ar', name: 'Arabic (العربية)' }
];

export const GoogleTranslateSettingsModal: React.FC<GoogleTranslateSettingsModalProps> = ({
  isOpen,
  onClose,
  googleApiKey,
  onUpdateGoogleApiKey,
  translationSettings,
  onUpdateTranslationSettings,
  googleWorkers,
  onUpdateGoogleWorkers,
  googleBatchSize,
  onUpdateGoogleBatchSize,
  onTestConnection,
  testStatus = 'idle',
  onAddLog,
  onAddNotification
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(googleApiKey);
  const [sourceLang, setSourceLang] = useState(translationSettings.sourceLanguage || 'auto');
  const [targetLang, setTargetLang] = useState(translationSettings.targetLanguage || 'ur');
  const [engineMode, setEngineMode] = useState<'free-web' | 'official-cloud' | 'hybrid'>('hybrid');
  const [workersInput, setWorkersInput] = useState(googleWorkers || 5);
  const [batchInput, setBatchInput] = useState(googleBatchSize || 20);
  const [preserveHtmlTags, setPreserveHtmlTags] = useState(true);
  const [formality, setFormality] = useState<'default' | 'formal' | 'informal'>('default');

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateGoogleApiKey(apiKeyInput.trim());
    onUpdateGoogleWorkers(Number(workersInput));
    onUpdateGoogleBatchSize(Number(batchInput));
    onUpdateTranslationSettings({
      ...translationSettings,
      sourceLanguage: sourceLang,
      targetLanguage: targetLang
    });

    onAddLog(`Updated Google Translate Settings: Source=${sourceLang}, Target=${targetLang}, Workers=${workersInput}.`, 'success');
    onAddNotification("Google Translate settings applied!", "success");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-xs flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-850/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Globe size={18} />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Google Translate Configuration
              </h2>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Language detection, English & Urdu translation models, batch concurrency, and API keys
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[78vh]">
          
          {/* Source & Target Language Setup */}
          <div className="p-3.5 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 space-y-3">
            <span className="font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Languages size={13} className="text-blue-600" />
              <span>Language Pair Configuration</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                  Source / Detected Language
                </label>
                <select
                  value={sourceLang}
                  onChange={e => setSourceLang(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {SUPPORTED_SOURCE_LANGUAGES.map(sl => (
                    <option key={sl.code} value={sl.code}>{sl.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                  Target Language (English / Urdu)
                </label>
                <select
                  value={targetLang}
                  onChange={e => setTargetLang(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {SUPPORTED_TARGET_LANGUAGES.map(tl => (
                    <option key={tl.code} value={tl.code}>{tl.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-[9.5px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Supports translating detected audio/dialogue into fluent English or Urdu. Auto-detect works across multi-lingual subtitles.
            </p>
          </div>

          {/* Engine Mode */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Zap size={13} className="text-amber-500" />
              <span>Translation Routing & Fallback</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'hybrid' as const, label: 'Hybrid Auto', desc: 'Fast web with Gemini fallback' },
                { id: 'free-web' as const, label: 'Fast Web API', desc: 'Free high-speed endpoint' },
                { id: 'official-cloud' as const, label: 'Cloud API Key', desc: 'Requires GCP API key' }
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setEngineMode(m.id)}
                  className={cn(
                    "p-2 rounded-xl border text-left transition-colors cursor-pointer flex flex-col gap-0.5",
                    engineMode === m.id
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-zinc-700 dark:text-zinc-300"
                  )}
                >
                  <span className="font-bold text-[10.5px]">{m.label}</span>
                  <span className="text-[8.5px] text-zinc-400 leading-tight">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Google Cloud API Key (Optional) */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Key size={13} className="text-zinc-500" />
              <span>Google Cloud Translation API Key (Optional)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy... (leave blank for free instant translation)"
                className="flex-1 p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={onTestConnection}
                className={cn(
                  "px-3 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1",
                  testStatus === 'success' ? "bg-emerald-600 text-white" :
                  testStatus === 'failed' ? "bg-red-600 text-white" :
                  "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
                )}
              >
                {testStatus === 'loading' && <Loader2 size={12} className="animate-spin" />}
                {testStatus === 'success' ? 'Active' : testStatus === 'failed' ? 'Failed' : 'Verify'}
              </button>
            </div>
          </div>

          {/* Worker Concurrency & Batch Tuning */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <span className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Sliders size={13} className="text-indigo-500" />
              <span>Performance Parameters</span>
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                  Parallel Workers ({workersInput})
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={workersInput}
                  onChange={e => setWorkersInput(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                  Batch Chunk Size ({batchInput} lines)
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={batchInput}
                  onChange={e => setBatchInput(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[10px]">
              <label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preserveHtmlTags}
                  onChange={e => setPreserveHtmlTags(e.target.checked)}
                  className="accent-blue-600 rounded"
                />
                <span>Preserve &lt;font&gt; and styling tags during translation</span>
              </label>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-850/90 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-xs cursor-pointer"
          >
            Save & Apply
          </button>
        </div>

      </div>
    </div>
  );
};
