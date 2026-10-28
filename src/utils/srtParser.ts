/**
 * Universal Subtitle & Caption Parser and Formatter
 * Supports:
 * - SubRip (.srt)
 * - WebVTT (.vtt)
 * - YouTube SBV (.sbv)
 * - Advanced SubStation Alpha (.ass / .ssa)
 * - Mobile Lyric / Karaoke (.lrc)
 * - JSON Timed Text (.json)
 * - Plain Transcript / Text (.txt)
 */

export interface SubtitleItem {
  index: number;
  startTime: string; // HH:MM:SS,mmm
  endTime: string;   // HH:MM:SS,mmm
  text: string;
  translatedText?: string;
  googleTranslateText?: string;
  styleColor?: string;
}

/**
 * Standardizes any time string (HH:MM:SS.mmm, M:SS.mmm, HH:MM:SS,mmm, etc.) to HH:MM:SS,mmm
 */
export function normalizeTimestamp(timeStr: string): string {
  if (!timeStr) return '00:00:00,000';
  const clean = timeStr.trim().replace('.', ',');
  const parts = clean.split(':');

  if (parts.length === 2) {
    // MM:SS,mmm -> 00:MM:SS,mmm
    const mm = parts[0].padStart(2, '0');
    const [ss, ms = '000'] = parts[1].split(',');
    return `00:${mm}:${ss.padStart(2, '0')},${ms.padEnd(3, '0').slice(0, 3)}`;
  }

  if (parts.length === 3) {
    const hh = parts[0].padStart(2, '0');
    const mm = parts[1].padStart(2, '0');
    const [ss, ms = '000'] = parts[2].split(',');
    return `${hh}:${mm}:${ss.padStart(2, '0')},${ms.padEnd(3, '0').slice(0, 3)}`;
  }

  return '00:00:00,000';
}

/**
 * Converts a subtitle timestamp (HH:MM:SS,mmm or HH:MM:SS.mmm) to total milliseconds
 */
export function timeStringToMs(timeStr: string): number {
  if (!timeStr) return 0;
  const normalized = timeStr.trim().replace('.', ',');
  const parts = normalized.split(':');
  if (parts.length < 2) return 0;

  let hours = 0;
  let minutes = 0;
  let secParts: string[] = [];

  if (parts.length === 2) {
    minutes = parseInt(parts[0], 10) || 0;
    secParts = parts[1].split(',');
  } else {
    hours = parseInt(parts[0], 10) || 0;
    minutes = parseInt(parts[1], 10) || 0;
    secParts = parts[2].split(',');
  }

  const seconds = parseInt(secParts[0], 10) || 0;
  const milliseconds = parseInt((secParts[1] || '0').padEnd(3, '0').slice(0, 3), 10) || 0;

  return (hours * 3600000) + (minutes * 60000) + (seconds * 1000) + milliseconds;
}

/**
 * Converts milliseconds to an SRT-compliant timestamp format (HH:MM:SS,mmm)
 */
export function msToTimeString(ms: number): string {
  const safeMs = Math.max(0, Math.floor(ms));
  const hours = Math.floor(safeMs / 3600000);
  const remainingAfterHours = safeMs % 3600000;
  const minutes = Math.floor(remainingAfterHours / 60000);
  const remainingAfterMinutes = remainingAfterHours % 60000;
  const seconds = Math.floor(remainingAfterMinutes / 1000);
  const milliseconds = remainingAfterMinutes % 1000;

  const pad = (n: number, width: number = 2) => String(n).padStart(width, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${String(milliseconds).padStart(3, '0')}`;
}

/**
 * Parses SubRip (.srt) format
 */
export function parseSRT(data: string): SubtitleItem[] {
  const items: SubtitleItem[] = [];
  const normalized = data.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.trim().split(/\n\s*\n/);

  let fallbackIndex = 1;
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;

    let timeLineIdx = -1;
    let timeMatch: RegExpMatchArray | null = null;

    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const match = lines[i].match(/(\d{1,2}:\d{2}:\d{2}[,\.]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,\.]\d{1,3})/);
      if (match) {
        timeLineIdx = i;
        timeMatch = match;
        break;
      }
    }

    if (timeMatch && timeLineIdx !== -1) {
      let index = fallbackIndex;
      if (timeLineIdx > 0) {
        const parsedIdx = parseInt(lines[0].trim(), 10);
        if (!isNaN(parsedIdx)) index = parsedIdx;
      }

      const startTime = normalizeTimestamp(timeMatch[1]);
      const endTime = normalizeTimestamp(timeMatch[2]);
      const text = lines.slice(timeLineIdx + 1).join('\n').trim();

      if (text) {
        items.push({
          index,
          startTime,
          endTime,
          text,
        });
        fallbackIndex = index + 1;
      }
    }
  }

  return items;
}

/**
 * Parses WebVTT (.vtt) format with support for cue identifiers, settings, and variable timestamps
 */
export function parseVTT(data: string): SubtitleItem[] {
  const items: SubtitleItem[] = [];
  const normalized = data.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');

  let i = 0;
  let autoIndex = 1;

  // Skip WEBVTT header and any leading metadata / styles
  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.includes('-->')) break;
    i++;
  }

  while (i < lines.length) {
    let line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }

    let cueIndex = autoIndex;
    let timeLine = '';

    if (line.includes('-->')) {
      timeLine = line;
    } else {
      // Line might be cue ID
      const possibleIndex = parseInt(line, 10);
      if (!isNaN(possibleIndex)) {
        cueIndex = possibleIndex;
      }
      i++;
      if (i < lines.length && lines[i].includes('-->')) {
        timeLine = lines[i].trim();
      } else {
        continue;
      }
    }

    // Match WebVTT timestamps: 00:00:01.000 --> 00:00:04.000 (with optional cue settings like align:start)
    const timeMatch = timeLine.match(/((?:\d{1,2}:)?\d{2}:\d{2}[,\.]\d{1,3})\s*-->\s*((?:\d{1,2}:)?\d{2}:\d{2}[,\.]\d{1,3})/);
    if (timeMatch) {
      const startTime = normalizeTimestamp(timeMatch[1]);
      const endTime = normalizeTimestamp(timeMatch[2]);
      i++;

      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== '') {
        // Strip WebVTT voice tags like <v Speaker> or <c.color> if needed, but preserve standard tags
        const cleanText = lines[i].replace(/<v [^>]+>/g, '').trim();
        textLines.push(cleanText);
        i++;
      }

      const text = textLines.join('\n').trim();
      if (text) {
        items.push({
          index: cueIndex,
          startTime,
          endTime,
          text,
        });
        autoIndex++;
      }
    } else {
      i++;
    }
  }

  return items;
}

/**
 * Parses YouTube SBV format (.sbv):
 * 0:00:01.000,0:00:04.000
 * Subtitle text
 */
export function parseSBV(data: string): SubtitleItem[] {
  const items: SubtitleItem[] = [];
  const normalized = data.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.trim().split(/\n\s*\n/);

  let index = 1;
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length >= 2) {
      const timeMatch = lines[0].match(/((?:\d{1,2}:)?\d{2}:\d{2}[,\.]\d{1,3})\s*,\s*((?:\d{1,2}:)?\d{2}:\d{2}[,\.]\d{1,3})/);
      if (timeMatch) {
        const startTime = normalizeTimestamp(timeMatch[1]);
        const endTime = normalizeTimestamp(timeMatch[2]);
        const text = lines.slice(1).join('\n').trim();

        if (text) {
          items.push({
            index: index++,
            startTime,
            endTime,
            text
          });
        }
      }
    }
  }

  return items;
}

/**
 * Parses Advanced SubStation Alpha (.ass / .ssa) format
 */
export function parseASS(data: string): SubtitleItem[] {
  const items: SubtitleItem[] = [];
  const lines = data.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  let inEvents = false;
  let formatHeaders: string[] = [];
  let index = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('[Events]')) {
      inEvents = true;
      continue;
    }
    if (trimmed.startsWith('[') && inEvents) {
      inEvents = false;
      continue;
    }

    if (inEvents) {
      if (trimmed.startsWith('Format:')) {
        formatHeaders = trimmed.substring(7).split(',').map(s => s.trim().toLowerCase());
      } else if (trimmed.startsWith('Dialogue:')) {
        const content = trimmed.substring(9).trim();
        // ASS format has comma-separated fields, the last field is Text which can contain commas
        const parts: string[] = [];
        let cur = '';
        let count = 0;
        const maxParts = formatHeaders.length > 0 ? formatHeaders.length : 10;

        for (let c = 0; c < content.length; c++) {
          if (content[c] === ',' && count < maxParts - 1) {
            parts.push(cur.trim());
            cur = '';
            count++;
          } else {
            cur += content[c];
          }
        }
        parts.push(cur.trim());

        const startIdx = formatHeaders.indexOf('start') !== -1 ? formatHeaders.indexOf('start') : 1;
        const endIdx = formatHeaders.indexOf('end') !== -1 ? formatHeaders.indexOf('end') : 2;
        const textIdx = formatHeaders.indexOf('text') !== -1 ? formatHeaders.indexOf('text') : parts.length - 1;

        const rawStart = parts[startIdx];
        const rawEnd = parts[endIdx];
        const rawText = parts[textIdx];

        if (rawStart && rawEnd && rawText) {
          const startTime = normalizeTimestamp(rawStart);
          const endTime = normalizeTimestamp(rawEnd);
          // Clean ASS overrides like {\an8} or {\c&H...&}
          const cleanText = rawText
            .replace(/\{[^}]+\}/g, '')
            .replace(/\\N/g, '\n')
            .replace(/\\n/g, '\n')
            .trim();

          if (cleanText) {
            items.push({
              index: index++,
              startTime,
              endTime,
              text: cleanText
            });
          }
        }
      }
    }
  }

  return items;
}

/**
 * Parses Mobile Lyrics / Karaoke (.lrc) format:
 * [00:12.34]Lyric line
 */
export function parseLRC(data: string): SubtitleItem[] {
  const items: SubtitleItem[] = [];
  const lines = data.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const tempLrc: { timeMs: number; text: string }[] = [];

  for (const line of lines) {
    const match = line.match(/\[(\d{1,2}):(\d{2})[,\.](\d{2,3})\](.*)/);
    if (match) {
      const minutes = parseInt(match[1], 10) || 0;
      const seconds = parseInt(match[2], 10) || 0;
      const ms = parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) || 0;
      const timeMs = (minutes * 60000) + (seconds * 1000) + ms;
      const text = match[4].trim();
      if (text) {
        tempLrc.push({ timeMs, text });
      }
    }
  }

  tempLrc.sort((a, b) => a.timeMs - b.timeMs);

  for (let i = 0; i < tempLrc.length; i++) {
    const current = tempLrc[i];
    const next = tempLrc[i + 1];
    const startMs = current.timeMs;
    // Default duration is until next line, or 3.5s if last
    const endMs = next ? Math.min(next.timeMs, startMs + 8000) : startMs + 3500;

    items.push({
      index: i + 1,
      startTime: msToTimeString(startMs),
      endTime: msToTimeString(endMs),
      text: current.text
    });
  }

  return items;
}

/**
 * Parses JSON Timed Text array
 */
export function parseJSON(data: string): SubtitleItem[] {
  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item, idx) => ({
      index: item.index || idx + 1,
      startTime: normalizeTimestamp(item.startTime || item.start || '00:00:00,000'),
      endTime: normalizeTimestamp(item.endTime || item.end || '00:00:03,000'),
      text: String(item.text || item.content || item.dialogue || '').trim(),
      translatedText: item.translatedText ? String(item.translatedText).trim() : undefined,
      googleTranslateText: item.googleTranslateText ? String(item.googleTranslateText).trim() : undefined,
      styleColor: item.styleColor
    })).filter(s => Boolean(s.text));
  } catch {
    return [];
  }
}

/**
 * Parses plain transcript or text files with optional timestamps
 */
export function parsePlainText(data: string): SubtitleItem[] {
  const items: SubtitleItem[] = [];
  const lines = data.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').map(l => l.trim()).filter(Boolean);

  let currentMs = 1000;
  let index = 1;

  for (const line of lines) {
    // Check if line starts with timestamp like [00:01:23] or 00:01:23
    const match = line.match(/^\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*(.*)$/);
    if (match) {
      const timeMs = timeStringToMs(match[1]);
      const text = match[2].trim();
      if (text) {
        items.push({
          index: index++,
          startTime: msToTimeString(timeMs),
          endTime: msToTimeString(timeMs + 3000),
          text
        });
        currentMs = timeMs + 3200;
        continue;
      }
    }

    // Otherwise sequence sequentially
    const duration = Math.min(6000, Math.max(2000, line.length * 75));
    items.push({
      index: index++,
      startTime: msToTimeString(currentMs),
      endTime: msToTimeString(currentMs + duration),
      text: line
    });
    currentMs += duration + 200;
  }

  return items;
}

/**
 * Universal Subtitle Parser: auto-detects format (VTT, SRT, SBV, ASS, LRC, JSON, TXT)
 */
export function parseUniversalCaptions(
  data: string, 
  fileName?: string
): { items: SubtitleItem[]; detectedFormat: string } {
  if (!data || !data.trim()) return { items: [], detectedFormat: 'empty' };

  const ext = fileName ? fileName.split('.').pop()?.toLowerCase() : '';
  const trimmed = data.trim();

  // 1. Explicit file extension or WebVTT header
  if (ext === 'vtt' || trimmed.startsWith('WEBVTT')) {
    const items = parseVTT(data);
    if (items.length > 0) return { items, detectedFormat: 'WebVTT (.vtt)' };
  }

  // 2. ASS / SSA
  if (ext === 'ass' || ext === 'ssa' || trimmed.includes('[Events]') || trimmed.includes('[V4+ Styles]')) {
    const items = parseASS(data);
    if (items.length > 0) return { items, detectedFormat: 'Advanced SubStation Alpha (.ass)' };
  }

  // 3. YouTube SBV
  if (ext === 'sbv' || /^\d{1,2}:\d{2}:\d{2}\.\d{3},\d{1,2}:\d{2}:\d{2}\.\d{3}/m.test(trimmed)) {
    const items = parseSBV(data);
    if (items.length > 0) return { items, detectedFormat: 'YouTube Subtitles (.sbv)' };
  }

  // 4. Mobile Lyrics (.lrc)
  if (ext === 'lrc' || /^\[\d{1,2}:\d{2}[,\.]\d{2,3}\]/m.test(trimmed)) {
    const items = parseLRC(data);
    if (items.length > 0) return { items, detectedFormat: 'Mobile Lyric (.lrc)' };
  }

  // 5. JSON
  if (ext === 'json' || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    const items = parseJSON(data);
    if (items.length > 0) return { items, detectedFormat: 'JSON Captions (.json)' };
  }

  // 6. SubRip (.srt) - check for standard arrow
  if (trimmed.includes('-->')) {
    const srtItems = parseSRT(data);
    if (srtItems.length > 0) return { items: srtItems, detectedFormat: 'SubRip (.srt)' };
  }

  // 7. Fallback to plain transcript text
  const plainItems = parsePlainText(data);
  return { items: plainItems, detectedFormat: 'Plain Transcript (.txt)' };
}

export function stringifySRT(items: SubtitleItem[], useTranslation: boolean = true): string {
  return items.map(item => {
    const text = useTranslation ? (item.translatedText || item.text) : item.text;
    return `${item.index}\n${item.startTime} --> ${item.endTime}\n${text}\n`;
  }).join('\n');
}

/**
 * Calculates duration in seconds and characters-per-second (CPS) for readability checks
 */
export function calculateDurationAndCPS(text: string, startTime: string, endTime: string): { durationSec: number; cps: number } {
  const startMs = timeStringToMs(startTime);
  const endMs = timeStringToMs(endTime);
  const durationSec = Math.max(0.1, (endMs - startMs) / 1000);
  const cleanText = text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const cps = Math.round(cleanText.length / durationSec);
  return { durationSec: Number(durationSec.toFixed(2)), cps };
}

/**
 * Batch shifts subtitle start and end times by a positive or negative millisecond offset
 */
export function shiftSubtitleTimings(
  items: SubtitleItem[], 
  shiftMs: number, 
  indices?: Set<number>
): SubtitleItem[] {
  return items.map(item => {
    if (indices && indices.size > 0 && !indices.has(item.index)) {
      return item;
    }
    const currentStart = timeStringToMs(item.startTime);
    const currentEnd = timeStringToMs(item.endTime);

    const newStart = Math.max(0, currentStart + shiftMs);
    const newEnd = Math.max(newStart + 100, currentEnd + shiftMs);

    return {
      ...item,
      startTime: msToTimeString(newStart),
      endTime: msToTimeString(newEnd)
    };
  });
}
