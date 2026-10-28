import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { quotaManager } from "./quota";
import { 
  TranslationSettings, 
  DEFAULT_TRANSLATION_SETTINGS, 
  buildTranslationSystemInstruction,
  TARGET_LANGUAGES 
} from "./translationSettings";
import { stripFormatting } from "../utils/subtitleFormatter";

const PRIMARY_MODEL = "gemini-3.8-flash";
const FALLBACK_MODEL = "gemini-flash-latest";

export interface TranslationResult {
  index: number;
  translatedText: string;
}

export class GeminiService {
  private ai: GoogleGenAI;
  private primaryModel: string = PRIMARY_MODEL;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    this.ai = new GoogleGenAI({ apiKey: key });
    if (model) this.primaryModel = model;
  }

  updateConfig(apiKey: string, model: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.primaryModel = model;
  }

  private async raceWithAbort<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
    if (!signal) return promise;
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");

    let listener: (() => void) | undefined;
    const abortPromise = new Promise<never>((_, reject) => {
      listener = () => reject(new DOMException("Aborted", "AbortError"));
      signal.addEventListener('abort', listener, { once: true });
    });

    try {
      return await Promise.race([promise, abortPromise]);
    } finally {
      if (listener) signal.removeEventListener('abort', listener);
    }
  }

  /**
   * Robust wrapper for API calls with immediate abort support and fast 429/403 error escalation.
   */
  private async callWithRetry(
    fn: (model: string) => Promise<any>,
    retries = 2,
    delay = 1500,
    signal?: AbortSignal
  ): Promise<any> {
    let lastError: any;
    let currentModel = this.primaryModel;

    for (let i = 0; i < retries; i++) {
      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      try {
        return await fn(currentModel);
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini API attempt ${i + 1} with model ${currentModel} failed:`, err?.message);
        
        // Immediate check for abort
        if (signal?.aborted || err?.name === 'AbortError') {
          throw new DOMException("Aborted", "AbortError");
        }

        // Check for rate limiting / quota errors
        const isRateLimit = /429|RESOURCE_EXHAUSTED|quota|rate limit|Too Many Requests|exceeded your current quota/i.test(err?.message || '');

        // Hard Limit Auto-Halt: escalate 429 immediately without retry delay
        if (isRateLimit) {
          err.isRateLimit = true;
          err.isQuotaExceeded = true;
          throw err;
        }

        // Check for 403 / Model permission / Model not found error:
        // Automatically switch to standard Flash model
        const isModelAccessError = /403|PERMISSION_DENIED|not found|500|unsupported|unregistered callers/i.test(err?.message || '');
        if (isModelAccessError && currentModel !== FALLBACK_MODEL) {
          console.warn(`Access error on ${currentModel}. Auto-falling back to ${FALLBACK_MODEL}`);
          currentModel = FALLBACK_MODEL;
        }

        if (i < retries - 1) {
          const backoff = delay * Math.pow(1.5, i);
          await new Promise<void>((resolve, reject) => {
            if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
            const t = setTimeout(resolve, backoff);
            signal?.addEventListener('abort', () => {
              clearTimeout(t);
              reject(new DOMException("Aborted", "AbortError"));
            }, { once: true });
          });
        }
      }
    }

    // If 403 persists, provide clear guidance
    if (/403|PERMISSION_DENIED/i.test(lastError?.message || '')) {
      throw new Error(`403 Forbidden: API key lacks permission or model requires paid tier. Please check your Gemini API key in Settings or switch to Gemini 3 Flash.`);
    }

    throw new Error(`Gemini API failed after ${retries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Generates context for the subtitles using web search and the content itself.
   * Includes character analysis, genders, tones, and cultural optimization.
   */
  async generateContext(subtitles: string, signal?: AbortSignal): Promise<string> {
    return this.callWithRetry(async (model) => {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

      const prompt = `
        Perform a deep context analysis of the following subtitles for Urdu translation.
        Use Google Search if names, titles, or specific events are mentioned to get accurate background.
        
        Your analysis MUST include:
        1. CHARACTERS: List main characters, their roles, and CRITICAL: their GENDERS (Urdu grammar depends heavily on gender).
        2. TONES & SCENARIOS: Identify if scenes are emotional, action-packed, aggressive, romantic, or comedic.
        3. HUMOR & SARCASM: Specifically identify instances of humor or sarcasm.
        4. CULTURAL OPTIMIZATION: Suggest how to adapt humor/sarcasm for target Urdu-speaking audiences (Pakistan/India) while maintaining the original soul.
        5. RELATIONSHIPS: How characters address each other (formal vs informal).
        
        Subtitles Sample:
        ${subtitles.slice(0, 8000)}
      `;

      let response: GenerateContentResponse;

      // Try with Google Search tool first; if 403 or unavailable, gracefully fall back to direct context
      try {
        const genPromise = this.ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });
        response = await this.raceWithAbort(genPromise, signal);
      } catch (searchErr: any) {
        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
        console.warn("Search grounding returned error/403, falling back to direct context generation:", searchErr?.message);
        const fallbackGen = this.ai.models.generateContent({
          model: model,
          contents: prompt,
        });
        response = await this.raceWithAbort(fallbackGen, signal);
      }

      // Track quota tokens
      const usage = response.usageMetadata;
      const tokens = usage?.totalTokenCount || Math.round(prompt.length / 3.8 + (response.text?.length || 0) / 2);
      quotaManager.recordRequest(tokens);

      return response.text || "No context generated.";
    }, 2, 2000, signal);
  }

  /**
   * AI Cinema: Explains movie/series, breakdowns plot, provides simple story, generates reviews in Urdu and English.
   */
  async generateCinemaInsights(
    title: string,
    action: 'story' | 'plot' | 'review' | 'characters' | 'ending' | 'context' | 'all' = 'all',
    language: 'ur' | 'en' | 'bilingual' = 'ur',
    signal?: AbortSignal
  ): Promise<string> {
    return this.callWithRetry(async (model) => {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

      const langInstructions = language === 'ur'
        ? "Respond in rich, natural, culturally resonant Urdu (اردو) using beautiful Nastaliq phrasing, with English character/actor names in parentheses where appropriate."
        : language === 'en'
        ? "Respond in fluent, articulate, engaging English with vivid storytelling and cinematic insight."
        : "Provide a Bilingual response: For every major section, provide both English and Urdu (اردو) breakdown.";

      let actionPrompt = "";
      if (action === 'story') {
        actionPrompt = "Focus on providing a simple, easy to understand story explanation (آسان کہانی اور خلاصہ) that anyone can grasp immediately, capturing the core emotional heart of the film/series.";
      } else if (action === 'plot') {
        actionPrompt = "Provide an in-depth, scene-by-scene / act-by-act plot breakdown (تفصیلی پلاٹ اور منظر بہ منظر وضاحت) covering Act 1 Setup, Act 2 Conflict & Escalation, Act 3 Climax, and Resolution.";
      } else if (action === 'review') {
        actionPrompt = "Generate a comprehensive cinematic review & critical analysis (جامع تنقیدی جائزہ اور ریٹنگز) covering direction, cinematography, performances, pacing, emotional impact, strengths, weaknesses, and a final rating out of 10.";
      } else if (action === 'characters') {
        actionPrompt = "Analyze all major characters, their psychology, motivations, relationships, and moral transformations throughout the narrative (کرداروں کا نفسیاتی تجزیہ اور تعلقات).";
      } else if (action === 'ending') {
        actionPrompt = "Explain the ending in full detail, resolving ambiguous plot points, explaining symbolic themes, hidden metaphors, and Easter eggs (اختتام کی تفصیلی تشریح اور پوشیدہ نکات).";
      } else if (action === 'context') {
        actionPrompt = "Provide a high-value Cultural & Dialogue Subtitle Context Aid (مکالمات اور ترجمہ کے لیے سیاق و سباق) explaining slang, period terminology, character gender nuances, and tone hints for subtitle localization.";
      } else {
        actionPrompt = "Provide a complete comprehensive cinema package: 1. Overview & Simple Story, 2. In-depth Plot Breakdown, 3. Character Arcs, 4. Critical Review & Rating (out of 10), 5. Ending Explanation, and 6. Subtitle Localization Notes.";
      }

      const prompt = `You are an elite cinema scholar, film critic, and master storyteller with deep knowledge of global cinema and TV series.
Movie / Series Query: "${title}"
Goal: ${actionPrompt}
Language Requirement: ${langInstructions}

Use Google Search grounding to retrieve accurate release year, cast, director, awards, and verified plot points.
Structure your response with clear, elegant markdown headers, bullet points, and highlight quotes.`;

      let response: GenerateContentResponse;
      try {
        const genPromise = this.ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });
        response = await this.raceWithAbort(genPromise, signal);
      } catch (searchErr: any) {
        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
        const fallbackGen = this.ai.models.generateContent({
          model,
          contents: prompt,
        });
        response = await this.raceWithAbort(fallbackGen, signal);
      }

      return response.text || "No cinema insight generated.";
    }, 2, 2000, signal);
  }

  /**
   * Translates a batch of subtitle texts based on translation settings.
   */
  async translateBatch(
    items: { index: number; text: string }[],
    context: string,
    customPrompt: string,
    signal?: AbortSignal,
    settings?: TranslationSettings
  ): Promise<TranslationResult[]> {
    return this.callWithRetry(async (model) => {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

      // Strip formatting data or gradient codes before translation so the AI receives readable plain text
      const cleanItems = items.map(item => ({
        index: item.index,
        text: stripFormatting(item.text)
      }));

      const systemInstruction = buildTranslationSystemInstruction(
        settings || DEFAULT_TRANSLATION_SETTINGS,
        context,
        customPrompt
      );

      const genPromise = this.ai.models.generateContent({
        model: model,
        contents: JSON.stringify(cleanItems),
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                index: { type: Type.INTEGER },
                translatedText: { type: Type.STRING },
              },
              required: ["index", "translatedText"],
            },
          },
        },
      });

      let response: GenerateContentResponse;
      if (signal) {
        let abortListener: (() => void) | undefined;
        const abortPromise = new Promise<never>((_, reject) => {
          if (signal.aborted) return reject(new DOMException("Aborted", "AbortError"));
          abortListener = () => reject(new DOMException("Aborted", "AbortError"));
          signal.addEventListener('abort', abortListener, { once: true });
        });
        try {
          response = await Promise.race([genPromise, abortPromise]);
        } finally {
          if (abortListener) signal.removeEventListener('abort', abortListener);
        }
      } else {
        response = await genPromise;
      }

      // Track quota tokens
      const usage = response.usageMetadata;
      const tokens = usage?.totalTokenCount || Math.round(JSON.stringify(items).length / 3.8 + (response.text?.length || 0) / 2);
      quotaManager.recordRequest(tokens);

      try {
        const text = response.text || "[]";
        // Clean up text in case model wraps it in markdown code blocks
        const cleanedText = text.replace(/```json\n?|```/g, "").trim();
        const parsed = JSON.parse(cleanedText);
        
        if (Array.isArray(parsed)) {
          return parsed.map(item => ({
            index: Number(item.index),
            translatedText: String(item.translatedText || "")
          }));
        }
        
        // If it's not an array, try to find an array inside it
        if (typeof parsed === 'object' && parsed !== null) {
          const possibleArray = Object.values(parsed).find(v => Array.isArray(v));
          if (possibleArray) {
             return (possibleArray as any[]).map(item => ({
              index: Number(item.index),
              translatedText: String(item.translatedText || "")
            }));
          }
        }
        
        throw new Error("Response is not a valid translation array");
      } catch (e) {
        console.error("Failed to parse Gemini response", e);
        // Fallback: try to extract JSON from text if it's wrapped in markdown
        const match = response.text?.match(/\[[\s\S]*\]/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          return parsed.map((item: any) => ({
            index: Number(item.index),
            translatedText: String(item.translatedText || "")
          }));
        }
        throw new Error("Invalid JSON response from model: " + response.text?.slice(0, 100));
      }
    }, 2, 1500, signal);
  }

  /**
   * Provides a "neutral" translation for comparison (simulating Google Translate style).
   */
  async getNeutralTranslation(text: string, signal?: AbortSignal, settings?: TranslationSettings): Promise<string> {
    const cleanText = stripFormatting(text);
    return this.callWithRetry(async (model) => {
      let promptInstruction = `Translate the following text to Urdu literally and neutrally, like a standard machine translation: "${cleanText}"`;
      
      const langObj = TARGET_LANGUAGES.find(l => l.code === settings?.targetLanguage);
      const langName = langObj ? langObj.name : 'Urdu';

      if (settings?.scriptMode === 'roman-urdu') {
        promptInstruction = `Translate the following dialogue into standard phonetic Roman Urdu (Latin English alphabet, e.g. "Aap yahan kya kar rahe hain?"). Output ONLY the Roman Urdu translation without quotes: "${cleanText}"`;
      } else if (settings?.scriptMode === 'bilingual-en-ur') {
        promptInstruction = `Provide a bilingual subtitle (Line 1: Original English, Line 2: Literal Urdu script translation). Output exactly those 2 lines separated by a newline: "${cleanText}"`;
      } else if (settings?.scriptMode === 'bilingual-en-roman') {
        promptInstruction = `Provide a bilingual subtitle (Line 1: Original English, Line 2: Phonetic Roman Urdu). Output exactly those 2 lines separated by a newline: "${cleanText}"`;
      } else if (settings?.scriptMode === 'bilingual-ur-roman') {
        promptInstruction = `Provide a bilingual subtitle (Line 1: Authentic Urdu script translation, Line 2: Phonetic Roman Urdu pronunciation). Output exactly those 2 lines separated by a newline: "${cleanText}"`;
      } else if (settings?.scriptMode === 'bilingual-ur-en') {
        promptInstruction = `Provide a bilingual subtitle (Line 1: Authentic Urdu script translation, Line 2: Original English dialogue). Output exactly those 2 lines separated by a newline: "${cleanText}"`;
      } else if (settings?.scriptMode === 'bilingual-side-by-side') {
        promptInstruction = `Provide a single-line inline bilingual subtitle: "${cleanText} (Urdu translation)". Output on 1 line: "${cleanText}"`;
      } else if (settings?.targetLanguage && settings.targetLanguage !== 'ur' && settings.targetLanguage !== 'ur-roman') {
        promptInstruction = `Translate the following text to ${langName} literally and neutrally: "${cleanText}"`;
      }

      const genPromise = this.ai.models.generateContent({
        model: FALLBACK_MODEL, // Always use flash for neutral comparison for speed
        contents: promptInstruction,
      });

      let response: GenerateContentResponse;
      if (signal) {
        let abortListener: (() => void) | undefined;
        const abortPromise = new Promise<never>((_, reject) => {
          if (signal.aborted) return reject(new DOMException("Aborted", "AbortError"));
          abortListener = () => reject(new DOMException("Aborted", "AbortError"));
          signal.addEventListener('abort', abortListener, { once: true });
        });
        try {
          response = await Promise.race([genPromise, abortPromise]);
        } finally {
          if (abortListener) signal.removeEventListener('abort', abortListener);
        }
      } else {
        response = await genPromise;
      }

      return response.text?.trim() || "";
    }, 2, 1500, signal);
  }

  /**
   * Translates a batch neutrally (Gemini Flash fast machine translation without 403 blocks).
   */
  async translateBatchNeutral(
    items: { index: number; text: string }[],
    googleApiKey?: string,
    signal?: AbortSignal,
    settings?: TranslationSettings
  ): Promise<{ index: number; googleTranslateText: string }[]> {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    // Direct Gemini Flash neutral translation
    const results = await Promise.all(
      items.map(async (item) => ({
        index: item.index,
        googleTranslateText: await this.getNeutralTranslation(item.text, signal, settings),
      }))
    );
    return results;
  }
}

/**
 * High-speed batched Google / Machine Translation with abort signal support and automatic Gemini neutral fallback
 */
export async function translateBatchGoogle(
  items: { index: number; text: string }[],
  apiKey?: string,
  signal?: AbortSignal,
  geminiFallback?: GeminiService,
  settings?: TranslationSettings
): Promise<{ index: number; googleTranslateText: string; isFallback?: boolean; error403?: boolean }[]> {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  // Strip formatting/gradient codes before sending to Google Translate
  const cleanItems = items.map(item => ({
    index: item.index,
    text: stripFormatting(item.text)
  }));

  let got403 = false;
  const sourceCode = (settings?.sourceLanguage && settings.sourceLanguage !== 'auto') ? settings.sourceLanguage : 'auto';
  const targetCode = settings?.targetLanguage === 'ur-roman' ? 'ur' : (settings?.targetLanguage || 'ur');

  if (apiKey) {
    // Official API supports batching via multiple 'q' parameters
    try {
      const params = new URLSearchParams();
      params.append('key', apiKey);
      if (sourceCode !== 'auto') params.append('source', sourceCode);
      params.append('target', targetCode);
      params.append('format', 'text');
      cleanItems.forEach(item => params.append('q', item.text));

      const response = await fetch(`https://translation.googleapis.com/language/translate/v2`, {
        method: 'POST',
        body: params,
        signal: signal || AbortSignal.timeout(10000)
      });

      if (response.status === 403) {
        got403 = true;
        console.warn("Google Cloud API returned 403 Forbidden. Using fallback translator.");
      } else {
        const data = await response.json();
        if (data.data?.translations) {
          return cleanItems.map((item, i) => ({
            index: item.index,
            googleTranslateText: data.data.translations[i].translatedText
          }));
        }
        if (data.error?.code === 403 || /forbidden|permission|key/i.test(data.error?.message || '')) {
          got403 = true;
        }
      }
    } catch (e: any) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      if (e?.status === 403 || /403/i.test(e?.message || '')) got403 = true;
      console.error("Batched Google Cloud API failed:", e);
    }
  }

  // Free Google Translate endpoint (gtx)
  if (!got403) {
    try {
      const separator = " [|] ";
      const combinedText = cleanItems.map(item => item.text).join(separator);
      const translatedCombined = await translateTextGoogle(combinedText, undefined, signal, settings);
      
      if (translatedCombined && translatedCombined !== "Translation Error" && !translatedCombined.startsWith("403")) {
        const parts = translatedCombined.split(/ \s*\[\s*\|\s*\]\s* /);
        if (parts.length === cleanItems.length) {
          return cleanItems.map((item, i) => ({
            index: item.index,
            googleTranslateText: parts[i].trim()
          }));
        }
      }
    } catch (e: any) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      if (e?.status === 403 || /403/i.test(e?.message || '')) got403 = true;
    }

    // Try parallel individual requests
    try {
      const results = await Promise.all(
        cleanItems.map(async (item) => ({
          index: item.index,
          googleTranslateText: await translateTextGoogle(item.text, apiKey, signal, settings),
        }))
      );

      const hasValid = results.some(r => r.googleTranslateText && r.googleTranslateText !== "Translation Error");
      if (hasValid) {
        return results;
      }
    } catch (e: any) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      if (e?.status === 403 || /403/i.test(e?.message || '')) got403 = true;
    }
  }

  // Seamless Fallback: Gemini Neutral Machine Translation (Guarantees no 403 block and instantaneous response)
  if (geminiFallback) {
    try {
      const fallbackResults = await geminiFallback.translateBatchNeutral(cleanItems, undefined, signal, settings);
      return fallbackResults.map(r => ({
        index: r.index,
        googleTranslateText: r.googleTranslateText,
        isFallback: true,
        error403: got403
      }));
    } catch (fbErr) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      console.error("Gemini neutral fallback failed:", fbErr);
    }
  }

  // Last resort: return error markers
  return cleanItems.map(item => ({
    index: item.index,
    googleTranslateText: got403 ? "Google 403 (Check API Key)" : "Translation Error",
    error403: got403
  }));
}

/**
 * Standalone Google Translate implementation with abort signal support.
 */
export async function translateTextGoogle(
  text: string, 
  apiKey?: string, 
  signal?: AbortSignal,
  settings?: TranslationSettings
): Promise<string> {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  // Strip formatting/gradient codes before sending to Google Translate
  const cleanText = stripFormatting(text);

  const sourceCode = (settings?.sourceLanguage && settings.sourceLanguage !== 'auto') ? settings.sourceLanguage : 'auto';
  const targetCode = settings?.targetLanguage === 'ur-roman' ? 'ur' : (settings?.targetLanguage || 'ur');

  // 1. Try Google Cloud Translation API if key is provided
  if (apiKey) {
    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: signal || AbortSignal.timeout(10000),
          body: JSON.stringify({
            q: cleanText,
            source: sourceCode !== 'auto' ? sourceCode : undefined,
            target: targetCode,
            format: "text",
          }),
        }
      );
      if (response.status === 403) {
        throw new Error("403 Forbidden: Google Cloud Translation API key invalid or lacks permissions.");
      }
      const data = await response.json();
      if (data.data?.translations?.[0]?.translatedText) {
        return data.data.translations[0].translatedText;
      }
      if (data.error) {
        if (data.error.code === 403) throw new Error("403 Forbidden: " + data.error.message);
        console.error("Google Cloud API Error:", data.error.message);
      }
    } catch (e) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      console.error("Google Cloud Translate API failed:", e);
      throw e;
    }
  }
  
  // 2. Fallback to Built-in/Free Google Translate API
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sourceCode)}&tl=${encodeURIComponent(targetCode)}&dt=t&q=${encodeURIComponent(cleanText)}`;
    const response = await fetch(url, { signal: signal || AbortSignal.timeout(9000) });
    if (response.status === 403) throw new Error("403 Forbidden on public endpoint");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0].map((x: any) => x[0]).join("");
    }
  } catch (e) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    console.error("Built-in Google Translate failed:", e);
    throw e;
  }

  return "Translation Error";
}

