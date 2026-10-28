import React, { useState, useEffect } from 'react';
import { 
  Gauge, 
  Zap, 
  Activity, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Flame, 
  CheckCircle2, 
  RefreshCw, 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  Database,
  Info
} from 'lucide-react';
import { quotaManager, QUOTA_TIERS, QuotaTier, FeasibilityReport } from '../services/quota';

interface GeminiQuotaDashboardProps {
  isTranslating: boolean;
  subtitlesCount: number;
  untranslatedCount: number;
  geminiBatchSize: number;
  geminiWorkers: number;
  geminiDelay: number;
  hasContext: boolean;
  onUpdateWorkers?: (workers: number) => void;
  onUpdateBatchSize?: (batch: number) => void;
  adaptiveScalingEnabled: boolean;
  onToggleAdaptiveScaling: (enabled: boolean) => void;
  activeAdaptiveInfo?: {
    workers: number;
    delay: number;
    throttled: boolean;
    reason?: string;
  };
}

export const GeminiQuotaDashboard: React.FC<GeminiQuotaDashboardProps> = ({
  isTranslating,
  subtitlesCount,
  untranslatedCount,
  geminiBatchSize,
  geminiWorkers,
  geminiDelay,
  hasContext,
  onUpdateWorkers,
  onUpdateBatchSize,
  adaptiveScalingEnabled,
  onToggleAdaptiveScaling,
  activeAdaptiveInfo
}) => {
  const [stats, setStats] = useState(quotaManager.getUsageStats());
  const [selectedTierId, setSelectedTierId] = useState<string>(stats.tier.id);
  const [customRPM, setCustomRPM] = useState<number>(stats.tier.rpmLimit);
  const [customRPD, setCustomRPD] = useState<number>(stats.tier.rpdLimit);
  const [showDetails, setShowDetails] = useState<boolean>(true);
  const [showTierConfig, setShowTierConfig] = useState<boolean>(false);
  const [feasibility, setFeasibility] = useState<FeasibilityReport | null>(null);

  // Poll stats and recalculate feasibility every 1.5 seconds or on state changes
  useEffect(() => {
    const update = () => {
      const currentStats = quotaManager.getUsageStats();
      setStats(currentStats);

      // Re-run feasibility analysis
      if (subtitlesCount > 0) {
        const dummySubs = Array(untranslatedCount).fill({ text: 'Sample subtitle dialogue text' });
        const report = quotaManager.analyzeFeasibility(dummySubs, geminiBatchSize, hasContext);
        setFeasibility(report);
      } else {
        setFeasibility(null);
      }
    };

    update();
    const interval = setInterval(update, 1500);
    return () => clearInterval(interval);
  }, [subtitlesCount, untranslatedCount, geminiBatchSize, hasContext]);

  const handleTierChange = (tierId: 'free' | 'payg' | 'custom') => {
    setSelectedTierId(tierId);
    if (tierId === 'custom') {
      const customTier: QuotaTier = {
        id: 'custom',
        name: 'Custom Tier',
        rpmLimit: customRPM,
        rpdLimit: customRPD,
        tpmLimit: 1000000,
      };
      quotaManager.setTier(customTier);
      setStats(quotaManager.getUsageStats());
    } else {
      quotaManager.setTier(QUOTA_TIERS[tierId]);
      setStats(quotaManager.getUsageStats());
    }
  };

  const handleSaveCustomTier = () => {
    const customTier: QuotaTier = {
      id: 'custom',
      name: 'Custom Tier',
      rpmLimit: Math.max(1, customRPM),
      rpdLimit: Math.max(10, customRPD),
      tpmLimit: 1000000,
    };
    quotaManager.setTier(customTier);
    setStats(quotaManager.getUsageStats());
    setShowTierConfig(false);
  };

  // Safe ETA calculation
  const etaFormatted = React.useMemo(() => {
    if (!isTranslating || untranslatedCount === 0) return null;
    const activeRPM = stats.activeRPM;
    if (activeRPM > 0) {
      const remainingBatches = Math.ceil(untranslatedCount / geminiBatchSize);
      const minutesRemaining = remainingBatches / activeRPM;
      const totalSec = Math.round(minutesRemaining * 60);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    }
    return 'Calculating...';
  }, [isTranslating, untranslatedCount, geminiBatchSize, stats.activeRPM]);

  // Color code for daily quota usage
  const quotaColorClass = stats.percentUsedDaily >= 85 
    ? 'text-red-500' 
    : stats.percentUsedDaily >= 60 
    ? 'text-amber-500' 
    : 'text-emerald-500';

  const progressBgClass = stats.percentUsedDaily >= 85 
    ? 'bg-red-500' 
    : stats.percentUsedDaily >= 60 
    ? 'bg-amber-500' 
    : 'bg-emerald-500';

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 shadow-xs overflow-hidden transition-all">
      {/* Header bar */}
      <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-between bg-zinc-50/60 dark:bg-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
            <Gauge size={15} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              Gemini Quota & Rate Analytics
              {isTranslating && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 animate-pulse">
                  LIVE
                </span>
              )}
            </h4>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              {stats.tier.name} · Limit: {stats.tier.rpmLimit} RPM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowTierConfig(!showTierConfig)}
            className="p-1.5 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 rounded-lg text-zinc-500 dark:text-zinc-400 transition-colors text-[10px] font-bold flex items-center gap-1"
            title="Configure Quota Tier"
          >
            <Sliders size={13} />
            <span className="hidden sm:inline">Tier</span>
          </button>
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="p-1.5 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 rounded-lg text-zinc-500 dark:text-zinc-400 transition-colors"
            title={showDetails ? "Collapse Analytics" : "Expand Analytics"}
          >
            {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Tier Switcher Dropdown / Drawer */}
      {showTierConfig && (
        <div className="p-3 bg-zinc-100/70 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-700/60 space-y-2.5 text-xs animate-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
              API Quota Tier
            </span>
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">
              Resets in: {stats.resetCountdown}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleTierChange('free')}
              className={`p-2 rounded-xl text-left border transition-all ${
                selectedTierId === 'free'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs'
                  : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <div className="text-[10px] uppercase font-bold">Free Tier</div>
              <div className="text-[9px] opacity-75">15 RPM / 1.5k RPD</div>
            </button>

            <button
              type="button"
              onClick={() => handleTierChange('payg')}
              className={`p-2 rounded-xl text-left border transition-all ${
                selectedTierId === 'payg'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-800 dark:text-indigo-300 font-bold shadow-xs'
                  : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <div className="text-[10px] uppercase font-bold">Pay-As-You-Go</div>
              <div className="text-[9px] opacity-75">360 RPM / 10k RPD</div>
            </button>

            <button
              type="button"
              onClick={() => handleTierChange('custom')}
              className={`p-2 rounded-xl text-left border transition-all ${
                selectedTierId === 'custom'
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-800 dark:text-amber-300 font-bold shadow-xs'
                  : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <div className="text-[10px] uppercase font-bold">Custom</div>
              <div className="text-[9px] opacity-75">{customRPM} RPM / {customRPD} RPD</div>
            </button>
          </div>

          {selectedTierId === 'custom' && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[9px] font-bold uppercase text-zinc-500 block mb-0.5">RPM Limit</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={customRPM}
                  onChange={e => setCustomRPM(Number(e.target.value))}
                  className="w-full p-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase text-zinc-500 block mb-0.5">Daily RPD Limit</label>
                <input
                  type="number"
                  min="10"
                  max="100000"
                  value={customRPD}
                  onChange={e => setCustomRPD(Number(e.target.value))}
                  className="w-full p-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono"
                />
              </div>
              <div className="col-span-2 flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveCustomTier}
                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold uppercase"
                >
                  Save Custom Limits
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Metric Cards */}
      <div className="p-4 space-y-4">
        {/* Real-time Rate Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Active RPM */}
          <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60">
            <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
              <span>Active Rate</span>
              <Activity size={11} className={stats.activeRPM > 0 ? "text-emerald-500 animate-pulse" : "text-zinc-400"} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-base font-extrabold font-mono ${stats.activeRPM >= stats.tier.rpmLimit * 0.8 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                {stats.activeRPM}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">/ {stats.tier.rpmLimit} RPM</span>
            </div>
            <div className="mt-1 text-[8.5px] text-zinc-500 dark:text-zinc-400 font-medium truncate">
              {stats.activeRPM >= stats.tier.rpmLimit * 0.8 ? '⚠️ High Load' : stats.activeRPM > 0 ? '✓ Healthy Pace' : 'Idle'}
            </div>
          </div>

          {/* Active TPM */}
          <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60">
            <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
              <span>Tokens / Min</span>
              <Flame size={11} className={stats.activeTPM > 0 ? "text-blue-500" : "text-zinc-400"} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold font-mono text-zinc-900 dark:text-zinc-100">
                {stats.activeTPM.toLocaleString()}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">TPM</span>
            </div>
            <div className="mt-1 text-[8.5px] text-zinc-500 dark:text-zinc-400 font-medium">
              Live consumption
            </div>
          </div>

          {/* Daily Quota Used */}
          <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60">
            <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
              <span>Daily Quota</span>
              <Database size={11} className={quotaColorClass} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-base font-extrabold font-mono ${quotaColorClass}`}>
                {stats.requestsToday}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">/ {stats.tier.rpdLimit}</span>
            </div>
            <div className="mt-1 text-[8.5px] text-zinc-500 dark:text-zinc-400 font-medium">
              {stats.remainingDailyRequests} left today
            </div>
          </div>

          {/* Estimated Completion ETA */}
          <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60">
            <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
              <span>Time Left</span>
              <Clock size={11} className="text-indigo-500" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold font-mono text-indigo-600 dark:text-indigo-400 truncate">
                {etaFormatted || (feasibility ? `~${Math.ceil(feasibility.estimatedDurationSec / 60)}m` : '--')}
              </span>
            </div>
            <div className="mt-1 text-[8.5px] text-zinc-500 dark:text-zinc-400 font-medium">
              {isTranslating ? 'Active ETA' : 'Estimated for file'}
            </div>
          </div>
        </div>

        {/* Daily Quota Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1.5">
            <span className="flex items-center gap-1.5">
              <span>Daily API Quota Consumed</span>
              <span className={`font-mono font-bold ${quotaColorClass}`}>({stats.percentUsedDaily}%)</span>
            </span>
            <span className="text-[9px] text-zinc-400 font-mono">
              Resets in: {stats.resetCountdown}
            </span>
          </div>
          <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-700/60 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${progressBgClass}`}
              style={{ width: `${Math.max(2, Math.min(100, stats.percentUsedDaily))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[9px] text-zinc-400 dark:text-zinc-500 mt-1">
            <span>Tokens Today: {stats.tokensToday.toLocaleString()}</span>
            <button
              type="button"
              onClick={() => {
                quotaManager.resetTodayUsage();
                setStats(quotaManager.getUsageStats());
              }}
              className="hover:text-zinc-600 dark:hover:text-zinc-300 flex items-center gap-0.5 text-[8.5px]"
              title="Reset tracked counter for today"
            >
              <RefreshCw size={9} /> Reset Counter
            </button>
          </div>
        </div>

        {/* Adaptive Scaling Live Status */}
        <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-700/60 bg-zinc-50/70 dark:bg-zinc-900/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${adaptiveScalingEnabled ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-700'}`}>
              <Zap size={14} className={adaptiveScalingEnabled ? "fill-amber-500/30" : ""} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Adaptive Worker Scaling
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                  adaptiveScalingEnabled 
                    ? activeAdaptiveInfo?.throttled 
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                }`}>
                  {adaptiveScalingEnabled ? (activeAdaptiveInfo?.throttled ? 'Throttled for Safety' : 'Active Safe') : 'Disabled'}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                {adaptiveScalingEnabled
                  ? activeAdaptiveInfo?.throttled
                    ? activeAdaptiveInfo.reason || 'Auto-throttled concurrency to prevent 429 rate limit errors.'
                    : `Dynamic concurrency running at safe rate (${activeAdaptiveInfo?.workers || geminiWorkers} workers, ${activeAdaptiveInfo?.delay || geminiDelay}ms delay).`
                  : 'Fixed concurrency. May risk 429 if API limit is exceeded.'}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input 
              type="checkbox" 
              checked={adaptiveScalingEnabled} 
              onChange={e => onToggleAdaptiveScaling(e.target.checked)} 
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
          </label>
        </div>

        {/* Pre-Execution Feasibility Assessment Card */}
        {feasibility && showDetails && (
          <div className={`p-3.5 rounded-xl border transition-all ${
            feasibility.status === 'insufficient'
              ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/60 text-red-900 dark:text-red-200'
              : feasibility.status === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
              : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
          }`}>
            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded-md shrink-0 mt-0.5">
                {feasibility.status === 'insufficient' ? (
                  <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
                ) : feasibility.status === 'warning' ? (
                  <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
                ) : (
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Pre-Execution Feasibility: {feasibility.status === 'insufficient' ? 'Quota Exceeded' : feasibility.status === 'warning' ? 'High Quota Load' : 'Verified Sufficient'}
                  </span>
                  <span className="text-[10px] font-mono font-bold">
                    {feasibility.itemsToTranslate} to translate
                  </span>
                </div>
                <p className="text-[11px] font-medium leading-relaxed mt-0.5">
                  {feasibility.message}
                </p>
                
                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-black/5 dark:border-white/10 text-[9.5px]">
                  <div>
                    <span className="text-black/50 dark:text-white/50 block">Required Requests</span>
                    <span className="font-bold font-mono">~{feasibility.estimatedRequests} API calls</span>
                  </div>
                  <div>
                    <span className="text-black/50 dark:text-white/50 block">Est. Tokens</span>
                    <span className="font-bold font-mono">~{feasibility.estimatedTokens.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-black/50 dark:text-white/50 block">Est. Time</span>
                    <span className="font-bold font-mono">~{Math.ceil(feasibility.estimatedDurationSec / 60)} min</span>
                  </div>
                </div>

                <div className="mt-2 text-[9px] opacity-80 italic">
                  💡 {feasibility.recommendation}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
