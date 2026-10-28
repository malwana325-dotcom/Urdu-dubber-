import { SubtitleItem, msToTimeString, timeStringToMs } from './srtParser';

export interface FindReplaceOptions {
  findText: string;
  replaceText: string;
  matchCase: boolean;
  matchWholeWord: boolean;
  useRegex?: boolean;
  targetField: 'ai' | 'original' | 'google' | 'both' | 'all';
  selectedIndices?: Set<number>;
}

export interface CleanupOptions {
  fixUrduPunctuation?: boolean;
  trimSpaces?: boolean;
  stripTags?: boolean;
  removeSoundCues?: boolean;
  normalizeNewlines?: boolean;
  selectedIndices?: Set<number>;
}

/**
 * Executes Find & Replace across subtitle text
 */
export function executeFindAndReplace(
  subtitles: SubtitleItem[],
  options: FindReplaceOptions
): { updatedSubtitles: SubtitleItem[]; replaceCount: number } {
  const { findText, replaceText, matchCase, matchWholeWord, useRegex, targetField, selectedIndices } = options;
  if (!findText) return { updatedSubtitles: subtitles, replaceCount: 0 };

  let flags = 'g';
  if (!matchCase) flags += 'i';

  let regex: RegExp;
  try {
    if (useRegex) {
      regex = new RegExp(findText, flags);
    } else {
      let escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (matchWholeWord) {
        escaped = `\\b${escaped}\\b`;
      }
      regex = new RegExp(escaped, flags);
    }
  } catch {
    // Fallback if regex is invalid
    return { updatedSubtitles: subtitles, replaceCount: 0 };
  }

  let replaceCount = 0;

  const checkAi = targetField === 'ai' || targetField === 'both' || targetField === 'all';
  const checkOriginal = targetField === 'original' || targetField === 'both' || targetField === 'all';
  const checkGoogle = targetField === 'google' || targetField === 'all';

  const updatedSubtitles = subtitles.map(sub => {
    if (selectedIndices && selectedIndices.size > 0 && !selectedIndices.has(sub.index)) {
      return sub;
    }

    let newSub = { ...sub };
    if (checkAi && newSub.translatedText) {
      const matches = newSub.translatedText.match(regex);
      if (matches) {
        replaceCount += matches.length;
        newSub.translatedText = newSub.translatedText.replace(regex, replaceText);
      }
    }

    if (checkOriginal && newSub.text) {
      const matches = newSub.text.match(regex);
      if (matches) {
        replaceCount += matches.length;
        newSub.text = newSub.text.replace(regex, replaceText);
      }
    }

    if (checkGoogle && newSub.googleTranslateText) {
      const matches = newSub.googleTranslateText.match(regex);
      if (matches) {
        replaceCount += matches.length;
        newSub.googleTranslateText = newSub.googleTranslateText.replace(regex, replaceText);
      }
    }

    return newSub;
  });

  return { updatedSubtitles, replaceCount };
}

/**
 * Batch cleans up subtitles (Urdu punctuation, whitespace trimming, tag stripping, sound cue removal)
 */
export function executeCleanup(
  subtitles: SubtitleItem[],
  options: CleanupOptions
): SubtitleItem[] {
  const { fixUrduPunctuation, trimSpaces, stripTags, removeSoundCues, normalizeNewlines, selectedIndices } = options;

  return subtitles.map(sub => {
    if (selectedIndices && selectedIndices.size > 0 && !selectedIndices.has(sub.index)) {
      return sub;
    }

    let translated = sub.translatedText || '';
    let original = sub.text || '';

    // 1. Fix Urdu Punctuation on translated text
    if (fixUrduPunctuation && translated) {
      // Replace western full stop '.' with Urdu full stop '۔' when not inside a number or URL
      translated = translated.replace(/(?<=[^\d\.\s])\.(?=\s|$)/g, '۔');
      // Replace western comma ',' with Urdu inverted comma '،'
      translated = translated.replace(/,(?=\s|$)/g, '،');
      // Replace western question mark '?' with Urdu reversed question mark '؟'
      translated = translated.replace(/\?/g, '؟');
    }

    // 2. Strip HTML/font styling tags
    if (stripTags) {
      if (translated) translated = translated.replace(/<[^>]+>/g, '');
      if (original) original = original.replace(/<[^>]+>/g, '');
    }

    // 3. Remove sound cues in brackets like [music], (sighs), [applause]
    if (removeSoundCues) {
      if (translated) translated = translated.replace(/\[[^\]]+\]|\([^\)]+\)/g, '').trim();
      if (original) original = original.replace(/\[[^\]]+\]|\([^\)]+\)/g, '').trim();
    }

    // 4. Normalize newlines (limit to at most 1 empty line)
    if (normalizeNewlines) {
      if (translated) translated = translated.replace(/\n{3,}/g, '\n\n').trim();
      if (original) original = original.replace(/\n{3,}/g, '\n\n').trim();
    }

    // 5. Trim whitespace and collapse duplicate spaces
    if (trimSpaces) {
      if (translated) translated = translated.replace(/[ \t]+/g, ' ').trim();
      if (original) original = original.replace(/[ \t]+/g, ' ').trim();
    }

    return {
      ...sub,
      translatedText: translated,
      text: original,
      styleColor: stripTags ? undefined : sub.styleColor
    };
  });
}

/**
 * Merges two consecutive subtitle rows
 */
export function mergeConsecutiveSubtitles(
  subtitles: SubtitleItem[],
  firstIndex: number
): SubtitleItem[] {
  const firstPos = subtitles.findIndex(s => s.index === firstIndex);
  if (firstPos === -1 || firstPos >= subtitles.length - 1) return subtitles;

  const first = subtitles[firstPos];
  const second = subtitles[firstPos + 1];

  const mergedText = `${first.text}\n${second.text}`;
  const mergedTranslated = first.translatedText && second.translatedText
    ? `${first.translatedText}\n${second.translatedText}`
    : (first.translatedText || second.translatedText || '');

  const mergedGoogle = first.googleTranslateText && second.googleTranslateText
    ? `${first.googleTranslateText}\n${second.googleTranslateText}`
    : (first.googleTranslateText || second.googleTranslateText || '');

  const mergedItem: SubtitleItem = {
    index: first.index,
    startTime: first.startTime,
    endTime: second.endTime,
    text: mergedText,
    translatedText: mergedTranslated || undefined,
    googleTranslateText: mergedGoogle || undefined,
    styleColor: first.styleColor || second.styleColor
  };

  const newSubtitles = [
    ...subtitles.slice(0, firstPos),
    mergedItem,
    ...subtitles.slice(firstPos + 2)
  ];

  // Re-index remaining subtitles
  return newSubtitles.map((sub, i) => ({ ...sub, index: i + 1 }));
}

/**
 * Splits a subtitle into two parts at the midpoint or newline
 */
export function splitSubtitle(
  subtitles: SubtitleItem[],
  indexToSplit: number
): SubtitleItem[] {
  const pos = subtitles.findIndex(s => s.index === indexToSplit);
  if (pos === -1) return subtitles;

  const item = subtitles[pos];
  const startMs = timeStringToMs(item.startTime);
  const endMs = timeStringToMs(item.endTime);
  const midMs = Math.round((startMs + endMs) / 2);

  // Split text by newline if available, or by words
  const splitTextHalves = (txt: string) => {
    if (!txt) return ['', ''];
    if (txt.includes('\n')) {
      const lines = txt.split('\n');
      const mid = Math.ceil(lines.length / 2);
      return [lines.slice(0, mid).join('\n'), lines.slice(mid).join('\n')];
    }
    const words = txt.split(' ');
    if (words.length <= 1) return [txt, txt];
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
  };

  const [orig1, orig2] = splitTextHalves(item.text);
  const [trans1, trans2] = splitTextHalves(item.translatedText || '');
  const [goog1, goog2] = splitTextHalves(item.googleTranslateText || '');

  const part1: SubtitleItem = {
    index: item.index,
    startTime: item.startTime,
    endTime: msToTimeString(midMs),
    text: orig1,
    translatedText: trans1 || undefined,
    googleTranslateText: goog1 || undefined,
    styleColor: item.styleColor
  };

  const part2: SubtitleItem = {
    index: item.index + 1,
    startTime: msToTimeString(midMs + 50),
    endTime: item.endTime,
    text: orig2,
    translatedText: trans2 || undefined,
    googleTranslateText: goog2 || undefined,
    styleColor: item.styleColor
  };

  const newSubtitles = [
    ...subtitles.slice(0, pos),
    part1,
    part2,
    ...subtitles.slice(pos + 1)
  ];

  return newSubtitles.map((sub, i) => ({ ...sub, index: i + 1 }));
}

/**
 * Inserts a new subtitle segment after the specified index or at the end
 */
export function insertSubtitle(
  subtitles: SubtitleItem[],
  afterIndex?: number,
  defaultText: string = 'New subtitle dialogue...'
): SubtitleItem[] {
  if (subtitles.length === 0) {
    return [{
      index: 1,
      startTime: '00:00:01,000',
      endTime: '00:00:04,000',
      text: defaultText,
      translatedText: ''
    }];
  }

  const pos = afterIndex !== undefined ? subtitles.findIndex(s => s.index === afterIndex) : subtitles.length - 1;
  const insertPos = pos !== -1 ? pos : subtitles.length - 1;
  const prevItem = subtitles[insertPos];

  const prevEndMs = timeStringToMs(prevItem.endTime);
  const newStartMs = prevEndMs + 200;
  const newEndMs = newStartMs + 3000;

  const newItem: SubtitleItem = {
    index: insertPos + 2,
    startTime: msToTimeString(newStartMs),
    endTime: msToTimeString(newEndMs),
    text: defaultText,
    translatedText: ''
  };

  const newSubtitles = [
    ...subtitles.slice(0, insertPos + 1),
    newItem,
    ...subtitles.slice(insertPos + 1)
  ];

  return newSubtitles.map((sub, i) => ({ ...sub, index: i + 1 }));
}

/**
 * Deletes a single subtitle segment and re-indexes
 */
export function deleteSubtitle(
  subtitles: SubtitleItem[],
  indexToDelete: number
): SubtitleItem[] {
  const filtered = subtitles.filter(s => s.index !== indexToDelete);
  return filtered.map((sub, i) => ({ ...sub, index: i + 1 }));
}

/**
 * Deletes multiple selected subtitle segments
 */
export function batchDeleteSubtitles(
  subtitles: SubtitleItem[],
  indicesToDelete: Set<number>
): SubtitleItem[] {
  const filtered = subtitles.filter(s => !indicesToDelete.has(s.index));
  return filtered.map((sub, i) => ({ ...sub, index: i + 1 }));
}

export interface SubtitleGapInfo {
  index: number;
  nextIndex: number;
  text: string;
  nextText: string;
  startTime: string;
  endTime: string;
  nextStartTime: string;
  gapMs: number;
  isOverlap: boolean;
  isSeamless: boolean;
}

export interface GapAdjustmentOptions {
  mode: 'exact' | 'increase' | 'decrease';
  targetGapMs: number; // e.g. 0 for seamless, 80 for 2 frames, etc.
  deltaMs?: number; // for increase or decrease mode
  maxGapThresholdMs?: number; // 0 = unlimited / all gaps. e.g. 2000 means only affect gaps <= 2000ms
  minDurationMs?: number; // minimum subtitle duration to protect (default 250ms)
  selectedIndices?: Set<number>;
  targetIndex?: number; // if adjusting single pair
}

export type OriginalTimingMap = Record<number, { startTime: string; endTime: string }>;

/**
 * Calculates time gaps between all consecutive subtitle blocks
 */
export function calculateSubtitleGaps(subtitles: SubtitleItem[]): SubtitleGapInfo[] {
  const gaps: SubtitleGapInfo[] = [];
  if (subtitles.length < 2) return gaps;

  for (let i = 0; i < subtitles.length - 1; i++) {
    const current = subtitles[i];
    const next = subtitles[i + 1];
    const currentEndMs = timeStringToMs(current.endTime);
    const nextStartMs = timeStringToMs(next.startTime);
    const gapMs = nextStartMs - currentEndMs;

    gaps.push({
      index: current.index,
      nextIndex: next.index,
      text: current.text || current.translatedText || '',
      nextText: next.text || next.translatedText || '',
      startTime: current.startTime,
      endTime: current.endTime,
      nextStartTime: next.startTime,
      gapMs,
      isOverlap: gapMs < 0,
      isSeamless: gapMs === 0,
    });
  }

  return gaps;
}

/**
 * Adjusts ending timestamps of subtitle blocks to remove gaps or set a known gap range.
 * Note: Starting timestamps are strictly untouched!
 */
export function adjustSubtitleGaps(
  subtitles: SubtitleItem[],
  options: GapAdjustmentOptions
): { updatedSubtitles: SubtitleItem[]; adjustedCount: number; affectedIndices: number[] } {
  const {
    mode,
    targetGapMs,
    deltaMs = 0,
    maxGapThresholdMs = 0,
    minDurationMs = 250,
    selectedIndices,
    targetIndex,
  } = options;

  let adjustedCount = 0;
  const affectedIndices: number[] = [];
  const updatedSubtitles = [...subtitles];

  for (let i = 0; i < updatedSubtitles.length - 1; i++) {
    const current = updatedSubtitles[i];
    const next = updatedSubtitles[i + 1];

    // Single target index filtering
    if (targetIndex !== undefined && current.index !== targetIndex) {
      continue;
    }

    // Selected subtitles filtering
    if (selectedIndices && selectedIndices.size > 0 && !selectedIndices.has(current.index)) {
      continue;
    }

    const currentStartMs = timeStringToMs(current.startTime);
    const currentEndMs = timeStringToMs(current.endTime);
    const nextStartMs = timeStringToMs(next.startTime);
    const currentGapMs = nextStartMs - currentEndMs;

    // Threshold check: if maxGapThresholdMs > 0, skip gaps that are wider than the threshold
    if (maxGapThresholdMs > 0 && currentGapMs > maxGapThresholdMs) {
      continue;
    }

    let newEndMs = currentEndMs;

    if (mode === 'exact') {
      // Direct target gap: E_i = S_{i+1} - targetGapMs
      newEndMs = nextStartMs - targetGapMs;
    } else if (mode === 'increase') {
      // Increase gap by reducing end time (or keeping gap larger)
      // Gap increases by deltaMs: newGap = currentGap + deltaMs => newEndMs = nextStartMs - (currentGapMs + deltaMs) = currentEndMs - deltaMs
      newEndMs = currentEndMs - Math.abs(deltaMs);
    } else if (mode === 'decrease') {
      // Decrease gap by extending end time towards next start time
      // newEndMs = Math.min(nextStartMs, currentEndMs + Math.abs(deltaMs));
      newEndMs = Math.min(nextStartMs - targetGapMs, currentEndMs + Math.abs(deltaMs));
    }

    // Protection: Ending timestamp must never be before currentStartMs + minDurationMs
    if (newEndMs < currentStartMs + minDurationMs) {
      newEndMs = Math.max(currentEndMs, currentStartMs + minDurationMs);
    }

    // Protection: Ending timestamp should not overlap beyond next block's start time (unless gap is 0)
    if (newEndMs > nextStartMs) {
      newEndMs = nextStartMs;
    }

    if (newEndMs !== currentEndMs) {
      updatedSubtitles[i] = {
        ...current,
        // Start timestamp is NEVER changed!
        endTime: msToTimeString(newEndMs),
      };
      adjustedCount++;
      affectedIndices.push(current.index);
    }
  }

  return { updatedSubtitles, adjustedCount, affectedIndices };
}

/**
 * Creates a baseline snapshot of subtitle timestamps
 */
export function createOriginalTimingMap(subtitles: SubtitleItem[]): OriginalTimingMap {
  const map: OriginalTimingMap = {};
  subtitles.forEach(s => {
    map[s.index] = {
      startTime: s.startTime,
      endTime: s.endTime,
    };
  });
  return map;
}

/**
 * Restores original timestamps from a timing map at any time
 */
export function resetSubtitleTimings(
  subtitles: SubtitleItem[],
  originalTimings: OriginalTimingMap,
  selectedIndices?: Set<number>
): { updatedSubtitles: SubtitleItem[]; resetCount: number } {
  let resetCount = 0;
  const updatedSubtitles = subtitles.map(sub => {
    if (selectedIndices && selectedIndices.size > 0 && !selectedIndices.has(sub.index)) {
      return sub;
    }
    const orig = originalTimings[sub.index];
    if (orig && (orig.startTime !== sub.startTime || orig.endTime !== sub.endTime)) {
      resetCount++;
      return {
        ...sub,
        startTime: orig.startTime,
        endTime: orig.endTime,
      };
    }
    return sub;
  });

  return { updatedSubtitles, resetCount };
}
