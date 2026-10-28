import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Check, 
  Key, 
  Sliders, 
  Cpu, 
  Loader2, 
  Zap, 
  ShieldCheck, 
  RotateCcw,
  Info
} from 'lucide-react';
import { cn } from '../utils/cn';

interface AiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onUpdateModel: (model: string) => void;
  customApiKey: string;
  onUpdateApiKey: (key: string) => void;
  onConnectGemini: () => Promise<boolean | void>;
  connectStatus: 'idle' | 'loading' | 'success' | 'failed';
  isGeminiConnected: boolean;
  geminiWorkers: number;
  onUpdateWorkers: (workers: number) => void;
  geminiBatchSize: number;
  onUpdateBatchSize: (batchSize: number) => void;
  geminiDelay: number;
  onUpdateDelay: (delay: number) => void;
  adaptiveScalingEnabled: boolean;
  onToggleAdaptiveScaling: (enabled: boolean) => void;
  onAddLog: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  onAddNotification: (msg: string, type: 'success' | 'error') => void;
}

const GEMINI_MODELS = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3 Flash (Fastest & Free Tier Recommended)',
    desc: 'Flagship text/translation model, high throughput, zero 403 blocks.'
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    desc: 'Always points to the latest stable Flash release.'
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    desc: 'Cost-optimized, ultra-low latency model for rapid batch translation.'
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro (Advanced Reasoning - Paid Key Required)',
    desc: 'Maximum depth reasoning and subtle idiom localization.'
  }
];

export const AiConfigModal: React.FC<AiConfigModalProps> = ({
  isOpen,
  onClose,
  selectedModel,
  onUpdateModel,
  customApiKey,
  onUpdateApiKey,
  onConnectGemini,
  connectStatus,
  isGeminiConnected,
  geminiWorkers,
  onUpdateWorkers,
  geminiBatchSize,
  onUpdateBatchSize,
  geminiDelay,
  onUpdateDelay,
  adaptiveScalingEnabled,
  onToggleAdaptiveScaling,
  onAddLog,
  onAddNotification
}) => {
  const [modelInput, setModelInput] = useState(selectedModel);
  const [keyInput, setKeyInput] = useState(customApiKey);
  const [workersInput, setWorkersInput] = useState(geminiWorkers);
  const [batchInput, setBatchInput] = useState(geminiBatchSize);
  const [delayInput, setDelayInput] = useState(geminiDelay);
  const [adaptiveInput, setAdaptiveInput] = useState(adaptiveScalingEnabled);

  if (!isOpen) return null;

  const handleSave = async () => {
    onUpdateModel(modelInput);
    onUpdateApiKey(keyInput.trim());
    onUpdateWorkers(workersInput);
    onUpdateBatchSize(batchInput);
    onUpdateDelay(delayInput);
    onToggleAdaptiveScaling(adaptiveInput);

    onAddLog(`Updated AI Configuration: Model=${modelInput}, Workers=${workersInput}, Batch=${batchInput}.`, 'success');
    onAddNotification("AI Configuration saved!", 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-xs flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-850/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Cpu size={18} />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Unified AI Configuration
              </h2>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Gemini model selection, API credentials, worker concurrency, and adaptive rate limits
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
          
          {/* Model Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Sparkles size={13} className="text-indigo-600" />
              <span>Gemini Foundation Model</span>
            </label>
            <div className="space-y-1.5">
              {GEMINI_MODELS.map(m => (
                <label
                  key={m.id}
                  className={cn(
                    "flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors",
                    modelInput === m.id
                      ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 font-medium"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  )}
                >
                  <input
                    type="radio"
                    name="modelSelection"
                    checked={modelInput === m.id}
                    onChange={() => setModelInput(m.id)}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <div>
                    <div className="font-bold text-[11px]">{m.name}</div>
                    <div className="text-[9.5px] text-zinc-500 dark:text-zinc-400">{m.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Gemini API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Key size={13} className="text-amber-500" />
                <span>Gemini API Key</span>
              </label>
              <span className={cn(
                "text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                isGeminiConnected 
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", isGeminiConnected ? "bg-emerald-500 animate-pulse" : "bg-zinc-400")} />
                {isGeminiConnected ? "Connected" : "Disconnected"}
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="password"
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                placeholder="Enter Gemini API key (or uses platform key)..."
                className="flex-1 p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={onConnectGemini}
                className={cn(
                  "px-3.5 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1",
                  connectStatus === 'success' ? "bg-emerald-600 text-white" :
                  connectStatus === 'failed' ? "bg-red-600 text-white" :
                  "bg-indigo-600 hover:bg-indigo-700 text-white"
                )}
              >
                {connectStatus === 'loading' && <Loader2 size={12} className="animate-spin" />}
                {connectStatus === 'success' ? 'Connected' : connectStatus === 'failed' ? 'Failed' : 'Connect'}
              </button>
            </div>
          </div>

          {/* Performance & Concurrency Parameters */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <span className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Sliders size={13} className="text-emerald-500" />
              <span>Parallel Processing & Rate Governors</span>
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
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <span className="text-[8.5px] text-zinc-400 block mt-0.5">2-3 recommended for free tier</span>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                  Batch Chunk Size ({batchInput} lines)
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={batchInput}
                  onChange={e => setBatchInput(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <span className="text-[8.5px] text-zinc-400 block mt-0.5">Subtitles translated per request</span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-750 flex items-center justify-between">
              <div>
                <span className="font-bold text-zinc-800 dark:text-zinc-200 text-[10.5px] block">Adaptive Auto-Throttling</span>
                <span className="text-[9px] text-zinc-500 dark:text-zinc-400">Dynamically reduces workers if 429 quota approaches</span>
              </div>
              <input
                type="checkbox"
                checked={adaptiveInput}
                onChange={e => setAdaptiveInput(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
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
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-xs cursor-pointer"
          >
            Save Configuration
          </button>
        </div>

      </div>
    </div>
  );
};
