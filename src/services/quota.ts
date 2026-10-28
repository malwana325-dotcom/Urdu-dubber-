/**
 * Gemini Quota, Rate Limit Analytics, and Adaptive Scaling Manager
 */

export interface QuotaTier {
  id: 'free' | 'payg' | 'custom';
  name: string;
  rpmLimit: number; // Requests per minute
  rpdLimit: number; // Requests per day
  tpmLimit: number; // Tokens per minute
}

export const QUOTA_TIERS: Record<string, QuotaTier> = {
  free: {
    id: 'free',
    name: 'Gemini Free Tier',
    rpmLimit: 15,
    rpdLimit: 1500,
    tpmLimit: 1000000,
  },
  payg: {
    id: 'payg',
    name: 'Pay-As-You-Go (Tier 1)',
    rpmLimit: 360,
    rpdLimit: 10000,
    tpmLimit: 4000000,
  },
  custom: {
    id: 'custom',
    name: 'Custom Tier',
    rpmLimit: 15,
    rpdLimit: 1500,
    tpmLimit: 1000000,
  }
};

export interface QuotaUsageState {
  date: string; // YYYY-MM-DD in UTC
  requestsToday: number;
  tokensToday: number;
  lastRequestTime?: number;
}

export interface RequestRecord {
  timestamp: number;
  tokens: number;
}

export interface FeasibilityReport {
  isFeasible: boolean;
  status: 'passed' | 'warning' | 'insufficient';
  subtitleCount: number;
  itemsToTranslate: number;
  batchSize: number;
  estimatedRequests: number;
  estimatedTokens: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedDurationSec: number;
  remainingDailyRequests: number;
  remainingDailyTokens: number;
  message: string;
  recommendation: string;
}

const STORAGE_KEY = 'urdu_localizer_gemini_quota';
const TIER_STORAGE_KEY = 'urdu_localizer_gemini_tier';

class QuotaManager {
  private tier: QuotaTier = QUOTA_TIERS.free;
  private recentRequests: RequestRecord[] = [];
  private usage: QuotaUsageState;

  constructor() {
    this.usage = this.loadUsage();
    this.tier = this.loadTier();
    // Clean recent requests older than 60s periodically
    if (typeof window !== 'undefined') {
      setInterval(() => this.pruneRecentRequests(), 2000);
    }
  }

  private getTodayUTC(): string {
    return new Date().toISOString().split('T')[0];
  }

  private loadUsage(): QuotaUsageState {
    const today = this.getTodayUTC();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: QuotaUsageState = JSON.parse(raw);
        if (parsed.date === today) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load quota from storage:', e);
    }
    // New day or uninitialized
    const fresh: QuotaUsageState = {
      date: today,
      requestsToday: 0,
      tokensToday: 0,
    };
    this.saveUsage(fresh);
    return fresh;
  }

  private saveUsage(state: QuotaUsageState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to persist quota usage:', e);
    }
  }

  private loadTier(): QuotaTier {
    try {
      const raw = localStorage.getItem(TIER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.rpmLimit && parsed.rpdLimit) {
          return parsed;
        }
      }
    } catch (e) {}
    return QUOTA_TIERS.free;
  }

  setTier(tier: QuotaTier) {
    this.tier = tier;
    try {
      localStorage.setItem(TIER_STORAGE_KEY, JSON.stringify(tier));
    } catch (e) {}
  }

  getTier(): QuotaTier {
    return this.tier;
  }

  private pruneRecentRequests() {
    const now = Date.now();
    this.recentRequests = this.recentRequests.filter(r => now - r.timestamp < 60000);
  }

  /**
   * Records a completed Gemini request with token consumption
   */
  recordRequest(tokens: number = 0) {
    const now = Date.now();
    const today = this.getTodayUTC();

    if (this.usage.date !== today) {
      this.usage = {
        date: today,
        requestsToday: 0,
        tokensToday: 0,
      };
    }

    this.usage.requestsToday += 1;
    this.usage.tokensToday += tokens;
    this.usage.lastRequestTime = now;
    this.saveUsage(this.usage);

    this.recentRequests.push({ timestamp: now, tokens });
    this.pruneRecentRequests();
  }

  /**
   * Resets today's tracked quota (e.g. user refreshed or switched key)
   */
  resetTodayUsage() {
    const today = this.getTodayUTC();
    this.usage = {
      date: today,
      requestsToday: 0,
      tokensToday: 0,
      lastRequestTime: undefined,
    };
    this.recentRequests = [];
    this.saveUsage(this.usage);
  }

  /**
   * Returns current live usage stats
   */
  getUsageStats() {
    this.pruneRecentRequests();
    const now = Date.now();
    const today = this.getTodayUTC();
    if (this.usage.date !== today) {
      this.usage = { date: today, requestsToday: 0, tokensToday: 0 };
    }

    // Active Requests in last 60 seconds
    const activeRPM = this.recentRequests.length;

    // Active Tokens in last 60 seconds
    const activeTPM = this.recentRequests.reduce((sum, r) => sum + r.tokens, 0);

    const remainingDailyRequests = Math.max(0, this.tier.rpdLimit - this.usage.requestsToday);
    const remainingDailyTokens = Math.max(0, this.tier.tpmLimit * 60 - this.usage.tokensToday); // daily token ceiling
    const percentUsedDaily = Math.min(100, Math.round((this.usage.requestsToday / this.tier.rpdLimit) * 100));

    // Calculate time until midnight UTC reset
    const nowUtc = new Date();
    const midnightUtc = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate() + 1, 0, 0, 0));
    const msUntilReset = midnightUtc.getTime() - nowUtc.getTime();
    const hoursUntilReset = Math.floor(msUntilReset / (1000 * 60 * 60));
    const minsUntilReset = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));

    return {
      tier: this.tier,
      activeRPM,
      activeTPM,
      requestsToday: this.usage.requestsToday,
      tokensToday: this.usage.tokensToday,
      remainingDailyRequests,
      remainingDailyTokens,
      percentUsedDaily,
      resetCountdown: `${hoursUntilReset}h ${minsUntilReset}m`,
      lastRequestTime: this.usage.lastRequestTime,
    };
  }

  /**
   * Computes adaptive worker count and delay to stay safely under RPM limits
   */
  getAdaptiveScaling(configuredWorkers: number, defaultDelay: number): {
    recommendedWorkers: number;
    recommendedDelay: number;
    isThrottling: boolean;
    reason?: string;
  } {
    this.pruneRecentRequests();
    const activeRPM = this.recentRequests.length;
    const rpmLimit = this.tier.rpmLimit;

    // Safety threshold: 75% of max RPM (e.g. 11 RPM for 15 limit)
    const warningThreshold = Math.max(1, Math.floor(rpmLimit * 0.75));
    const criticalThreshold = Math.max(2, Math.floor(rpmLimit * 0.90));

    // Dynamic worker limits proportional to current tier RPM limit
    const emergencyWorkers = Math.max(1, Math.floor((rpmLimit / 15) * 1));
    const warningWorkers = Math.max(1, Math.floor((rpmLimit / 15) * 2));

    if (activeRPM >= criticalThreshold) {
      // Emergency throttle: lower workers, higher delay
      return {
        recommendedWorkers: Math.min(configuredWorkers, emergencyWorkers),
        recommendedDelay: Math.max(defaultDelay, 3500),
        isThrottling: true,
        reason: `RPM Near Limit (${activeRPM}/${rpmLimit} RPM) - Throttled to ${emergencyWorkers} worker(s)`,
      };
    }

    if (activeRPM >= warningThreshold) {
      // Moderate throttle: safe worker count, slightly higher delay
      return {
        recommendedWorkers: Math.min(configuredWorkers, warningWorkers),
        recommendedDelay: Math.max(defaultDelay, 2200),
        isThrottling: true,
        reason: `RPM Elevated (${activeRPM}/${rpmLimit} RPM) - Throttled to ${warningWorkers} worker(s)`,
      };
    }

    // Normal safe rate: run configured workers and delay
    return {
      recommendedWorkers: configuredWorkers,
      recommendedDelay: defaultDelay,
      isThrottling: false,
    };
  }

  /**
   * Pre-Execution Feasibility Analysis:
   * Inspects subtitle list and validates if API quota is sufficient to finish the entire file
   */
  analyzeFeasibility(
    subtitles: { text: string; translatedText?: string }[],
    batchSize: number = 10,
    hasContext: boolean = false
  ): FeasibilityReport {
    const stats = this.getUsageStats();
    const unTranslated = subtitles.filter(s => !s.translatedText);
    const count = unTranslated.length;

    if (count === 0) {
      return {
        isFeasible: true,
        status: 'passed',
        subtitleCount: subtitles.length,
        itemsToTranslate: 0,
        batchSize,
        estimatedRequests: 0,
        estimatedTokens: 0,
        estimatedInputTokens: 0,
        estimatedOutputTokens: 0,
        estimatedDurationSec: 0,
        remainingDailyRequests: stats.remainingDailyRequests,
        remainingDailyTokens: stats.remainingDailyTokens,
        message: 'All subtitles are already translated.',
        recommendation: 'No action needed.',
      };
    }

    // Calculate batches required
    const batches = Math.ceil(count / batchSize);
    const contextRequests = hasContext ? 0 : 1;
    const totalRequiredRequests = batches + contextRequests;

    // Token estimation:
    // English text: ~1 token per 3.8 characters
    // Urdu text: ~1 token per 1.8 characters
    // System instruction & prompt JSON structure: ~350 tokens per request
    const totalEnglishChars = unTranslated.reduce((sum, s) => sum + s.text.length, 0);
    const avgCharsPerItem = count > 0 ? totalEnglishChars / count : 30;
    
    // Estimated English tokens in payloads
    const estimatedInputTokens = Math.round((totalEnglishChars / 3.8) + (totalRequiredRequests * 380));
    // Estimated Urdu output tokens (conversational Urdu)
    const estimatedOutputTokens = Math.round((count * avgCharsPerItem * 1.1) / 1.8);
    const totalEstimatedTokens = estimatedInputTokens + estimatedOutputTokens;

    // Estimated duration based on safe RPM (default ~10-12 RPM for free tier)
    const safeRPM = Math.max(4, Math.floor(this.tier.rpmLimit * 0.8));
    const estimatedMinutes = totalRequiredRequests / safeRPM;
    const estimatedDurationSec = Math.round(estimatedMinutes * 60);

    const remainingRequests = stats.remainingDailyRequests;

    // Determine feasibility status
    if (remainingRequests < totalRequiredRequests) {
      return {
        isFeasible: false,
        status: 'insufficient',
        subtitleCount: subtitles.length,
        itemsToTranslate: count,
        batchSize,
        estimatedRequests: totalRequiredRequests,
        estimatedTokens: totalEstimatedTokens,
        estimatedInputTokens,
        estimatedOutputTokens,
        estimatedDurationSec,
        remainingDailyRequests: remainingRequests,
        remainingDailyTokens: stats.remainingDailyTokens,
        message: `Insufficient Daily Quota! File requires ${totalRequiredRequests} API requests, but only ${remainingRequests} requests remain today.`,
        recommendation: 'Switch to Pay-As-You-Go tier, increase batch size, or wait for daily reset.',
      };
    }

    // If using > 80% of remaining requests, give warning
    if (totalRequiredRequests > remainingRequests * 0.8) {
      return {
        isFeasible: true,
        status: 'warning',
        subtitleCount: subtitles.length,
        itemsToTranslate: count,
        batchSize,
        estimatedRequests: totalRequiredRequests,
        estimatedTokens: totalEstimatedTokens,
        estimatedInputTokens,
        estimatedOutputTokens,
        estimatedDurationSec,
        remainingDailyRequests: remainingRequests,
        remainingDailyTokens: stats.remainingDailyTokens,
        message: `High Quota Consumption: This translation will use ${totalRequiredRequests} requests (${Math.round((totalRequiredRequests / remainingRequests) * 100)}% of remaining today).`,
        recommendation: 'Adaptive scaling recommended to prevent 429 limits.',
      };
    }

    return {
      isFeasible: true,
      status: 'passed',
      subtitleCount: subtitles.length,
      itemsToTranslate: count,
      batchSize,
      estimatedRequests: totalRequiredRequests,
      estimatedTokens: totalEstimatedTokens,
      estimatedInputTokens,
      estimatedOutputTokens,
      estimatedDurationSec,
      remainingDailyRequests: remainingRequests,
      remainingDailyTokens: stats.remainingDailyTokens,
      message: `Feasibility Verified: Srt file requires ~${totalRequiredRequests} requests (~${totalEstimatedTokens.toLocaleString()} tokens). Quota is fully sufficient (${remainingRequests} requests available).`,
      recommendation: `Estimated completion time: ~${Math.ceil(estimatedMinutes)} min.`,
    };
  }
}

export const quotaManager = new QuotaManager();
