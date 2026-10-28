/**
 * Comprehensive Translation Engine Configuration
 * Supports:
 * - Multi-language targeting (Urdu, Roman Urdu, Hindi, Punjabi Shahmukhi/Gurmukhi, Sindhi, Pashto, Balochi, Saraiki, Kashmiri, Arabic, Persian, Turkish, etc.)
 * - Script Modes: Urdu Script (Nastaliq), Roman Urdu (Latin phonetic), Bilingual (Eng + Urdu, Eng + Roman, Urdu + Roman, Urdu + Eng, Side-by-Side)
 * - Tones & Registers: Aam Bolchal, Adabi / Literary, Filmi / Dramatic, Modern Youth Slang, Neutral, Humorous / Comedy, Devotional / Courteous
 * - Honorifics & Pronoun Formality: Dynamic Contextual, Respectful 'Aap' (آپ), Casual 'Tum' (تم), Street 'Tu' (تو)
 * - Vocabulary & Loan Words: Natural Code-Switching (Hinglish/Urdish), Pure Native Vernacular, Transliterated Technical
 * - Idiom Adaptation: Authentic Cultural Idioms (محاورات) vs Literal Direct
 * - Line Formatting & CPS: Smart 2-Line Split, Single-Line Punchy, Preserve Original
 * - Content Moderation: Raw & Faithful, Family Friendly, Asterisk Masking
 * - Audio Cues: Translate, Preserve, or Strip bracketed sounds
 * - Number & Punctuation Styling: Western vs Eastern Urdu Numerals and Urdu Punctuation marks (۔ ، ؟)
 */

export type ScriptMode = 
  | 'urdu-script' 
  | 'roman-urdu' 
  | 'bilingual-en-ur' 
  | 'bilingual-en-roman' 
  | 'bilingual-ur-roman'
  | 'bilingual-ur-en'
  | 'bilingual-side-by-side';

export type ToneRegister = 
  | 'aam-bolchal' 
  | 'adabi' 
  | 'filmi' 
  | 'youth' 
  | 'neutral'
  | 'humorous'
  | 'devotional';

export type HonorificRegister = 
  | 'contextual'
  | 'respectful-aap'
  | 'informal-tum'
  | 'dramatic-tu';

export type LoanWordMode = 
  | 'natural-blend'
  | 'pure-vernacular'
  | 'transliterated';

export type IdiomMode = 
  | 'cultural-adaptation'
  | 'literal';

export type LineBreakMode = 
  | 'smart-two-line' 
  | 'single-line' 
  | 'preserve';

export type ContentFilter = 
  | 'faithful' 
  | 'family-friendly' 
  | 'asterisk';

export type AudioCueMode = 
  | 'translate' 
  | 'preserve' 
  | 'strip';

export type NumberFormatMode = 
  | 'western'
  | 'eastern-arabic'
  | 'spelled-out';

export type PunctuationMode = 
  | 'urdu-punctuation'
  | 'western-punctuation';

export interface LanguageOption {
  code: string; // ISO / Google lang code
  name: string;
  nativeName: string;
  direction: 'rtl' | 'ltr';
  defaultFont?: string;
  region?: string;
}

export const TARGET_LANGUAGES: LanguageOption[] = [
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', direction: 'rtl', region: 'Pakistan / South Asia' },
  { code: 'ur-roman', name: 'Roman Urdu (Latin)', nativeName: 'Roman Urdu', direction: 'ltr', region: 'Phonetic Latin' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr', region: 'India' },
  { code: 'pa-pk', name: 'Punjabi (Shahmukhi)', nativeName: 'پنجابی', direction: 'rtl', region: 'Punjab, Pakistan' },
  { code: 'pa-in', name: 'Punjabi (Gurmukhi)', nativeName: 'ਪੰਜਾਬੀ', direction: 'ltr', region: 'Punjab, India' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', direction: 'rtl', region: 'Sindh, Pakistan' },
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو', direction: 'rtl', region: 'KPK / Afghanistan' },
  { code: 'bal', name: 'Balochi', nativeName: 'بلوچی', direction: 'rtl', region: 'Balochistan' },
  { code: 'skr', name: 'Saraiki', nativeName: 'سرائیکی', direction: 'rtl', region: 'South Punjab' },
  { code: 'ks', name: 'Kashmiri', nativeName: 'کٲشُر', direction: 'rtl', region: 'Kashmir' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', region: 'Middle East' },
  { code: 'fa', name: 'Persian (Farsi)', nativeName: 'فارسی', direction: 'rtl', region: 'Iran / Central Asia' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', direction: 'ltr', region: 'Turkey' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', direction: 'ltr', region: 'Bangladesh / Bengal' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', region: 'Spain / Latin America' },
  { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', region: 'France / Francophone' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', region: 'Germany / Central Europe' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', direction: 'ltr', region: 'Italy' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr', region: 'Brazil / Portugal' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', direction: 'ltr', region: 'Eastern Europe' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文', direction: 'ltr', region: 'China' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr', region: 'Japan' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', direction: 'ltr', region: 'Korea' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', direction: 'ltr', region: 'Southeast Asia' }
];

export interface ScriptModeOption {
  id: ScriptMode;
  label: string;
  urduLabel: string;
  description: string;
  sample: string;
  badge: string;
}

export const SCRIPT_MODES: ScriptModeOption[] = [
  {
    id: 'urdu-script',
    label: 'Urdu Script Only',
    urduLabel: 'صرف اردو رسم الخط (نستعلیق)',
    description: 'Authentic Nastaliq / Persio-Arabic Urdu script with natural emotional flow and calligraphic elegance.',
    sample: 'آپ یہاں کیا کر رہے ہیں؟ مجھے سچ بتاؤ۔',
    badge: 'اردو'
  },
  {
    id: 'roman-urdu',
    label: 'Roman Urdu (Latin Script)',
    urduLabel: 'رومن اردو (انگریزی حروف)',
    description: 'Phonetic Urdu spelled in the Latin/English alphabet. Standard for social media, Netflix, YouTube & youth.',
    sample: 'Aap yahan kya kar rahe hain? Mujhe sach batao.',
    badge: 'ROMAN'
  },
  {
    id: 'bilingual-en-ur',
    label: 'Bilingual: English + Urdu Script',
    urduLabel: 'دو زبانی: انگریزی اوپر + اردو نیچے',
    description: 'Line 1 displays English source dialogue; Line 2 displays authentic Urdu script translation.',
    sample: 'What are you doing here?\nآپ یہاں کیا کر رہے ہیں؟',
    badge: 'EN + اردو'
  },
  {
    id: 'bilingual-en-roman',
    label: 'Bilingual: English + Roman Urdu',
    urduLabel: 'دو زبانی: انگریزی اوپر + رومن اردو نیچے',
    description: 'Line 1 displays English source dialogue; Line 2 displays phonetic Roman Urdu for fast reading.',
    sample: 'What are you doing here?\nAap yahan kya kar rahe hain?',
    badge: 'EN + ROM'
  },
  {
    id: 'bilingual-ur-roman',
    label: 'Bilingual: Urdu Script + Roman Urdu',
    urduLabel: 'دو زبانی: اردو رسم الخط اوپر + رومن تلفظ نیچے',
    description: 'Line 1 has Nastaliq Urdu script; Line 2 provides Roman Urdu pronunciation for language learners.',
    sample: 'آپ یہاں کیا کر رہے ہیں؟\nAap yahan kya kar rahe hain?',
    badge: 'اردو + ROM'
  },
  {
    id: 'bilingual-ur-en',
    label: 'Bilingual: Urdu Script Top + English Below',
    urduLabel: 'دو زبانی: اردو اوپر + انگریزی نیچے',
    description: 'Line 1 displays primary Urdu script translation; Line 2 retains original English dialogue as reference.',
    sample: 'آپ یہاں کیا کر رہے ہیں؟\nWhat are you doing here?',
    badge: 'اردو + EN'
  },
  {
    id: 'bilingual-side-by-side',
    label: 'Single-Line Inline Bilingual',
    urduLabel: 'ایک ہی سطر میں دو زبانی',
    description: 'Combines English dialogue and Urdu translation compactly inside one line with brackets.',
    sample: 'What are you doing here? (آپ یہاں کیا کر رہے ہیں؟)',
    badge: 'EN (اردو)'
  }
];

export interface ToneOption {
  id: ToneRegister;
  label: string;
  urduLabel: string;
  description: string;
}

export const TONE_REGISTERS: ToneOption[] = [
  {
    id: 'aam-bolchal',
    label: 'Aam Bolchal (Conversational)',
    urduLabel: 'عام بول چال (روزمرہ)',
    description: 'Natural colloquial home and street Urdu. Warm, relatable, realistic, authentic.'
  },
  {
    id: 'adabi',
    label: 'Adabi (Formal / Literary)',
    urduLabel: 'ادبی و شائستہ (سنجیدہ)',
    description: 'Poetic, elevated, refined vocabulary suited for classic period dramas, history & literature.'
  },
  {
    id: 'filmi',
    label: 'Filmi & Dramatic (Cinema)',
    urduLabel: 'ڈرامائی و فلمی (جذباتی)',
    description: 'Punchy cinema dialogue with heightened emotional intensity, tension, and theatrical idioms.'
  },
  {
    id: 'youth',
    label: 'Modern Urban Youth (Slang)',
    urduLabel: 'جدید و نوجوانانہ (سلینگ)',
    description: 'Modern Pakistani urban slang, snappy phrasing, and contemporary casual rhythm.'
  },
  {
    id: 'humorous',
    label: 'Comedy & Witty (مزاحیہ)',
    urduLabel: 'طنز و مزاح اور شگفتگی',
    description: 'Playful comedic delivery, humorous cultural quips, and punchy sarcastic timing.'
  },
  {
    id: 'devotional',
    label: 'Courteous & Respectful (با ادب)',
    urduLabel: 'نہایت با ادب و احترام',
    description: 'High etiquette, courteous respectful phrasing, ideal for religious, formal or senior dialogues.'
  },
  {
    id: 'neutral',
    label: 'Standard / Documentary',
    urduLabel: 'معیاری اور غیر جانبدار',
    description: 'Objective, educational, clear dictionary phrasing for news, documentaries, and factual content.'
  }
];

export interface HonorificOption {
  id: HonorificRegister;
  label: string;
  urduLabel: string;
  description: string;
}

export const HONORIFIC_OPTIONS: HonorificOption[] = [
  {
    id: 'contextual',
    label: 'Smart Contextual (Adaptive)',
    urduLabel: 'سیاق و سباق کے مطابق',
    description: 'Dynamically adapts pronouns (Aap, Tum, Tu) based on speaker age, hierarchy, and relationship.'
  },
  {
    id: 'respectful-aap',
    label: 'Strict Respect: "Aap" (آپ)',
    urduLabel: 'صرف "آپ" کا صیغہ (احترام)',
    description: 'Always addresses characters with highest politeness and deferential verbs (فرمائیے، کیجیے).'
  },
  {
    id: 'informal-tum',
    label: 'Familiar Peer: "Tum" (تم)',
    urduLabel: 'دوستانہ "تم" کا صیغہ',
    description: 'Casual, friendly tone between close friends, colleagues, and age peers (تم کہو، کیا کر رہے ہو).'
  },
  {
    id: 'dramatic-tu',
    label: 'Intense / Raw: "Tu" (تو)',
    urduLabel: 'جذباتی یا بے تکلف "تو"',
    description: 'High-drama confrontational street dialogue or extreme childhood intimacy (تو کیا سمجھتا ہے).'
  }
];

export interface LoanWordOption {
  id: LoanWordMode;
  label: string;
  description: string;
}

export const LOAN_WORD_OPTIONS: LoanWordOption[] = [
  {
    id: 'natural-blend',
    label: 'Natural Code-Switching (Hinglish/Urdish)',
    description: 'Preserves common loanwords (phone, doctor, hospital, police, car, office) as spoken naturally in South Asia.'
  },
  {
    id: 'pure-vernacular',
    label: 'Pure Urdu Vernacular (خالص اردو)',
    description: 'Translates all concepts into pure traditional Urdu vocabulary (شفاخانہ، عدالت، دفتر، گاڑی).'
  },
  {
    id: 'transliterated',
    label: 'Transliterate Foreign Terms (فون، ڈاکٹر)',
    description: 'Writes modern international loanwords phonetically in Urdu script rather than inventing obscure synonyms.'
  }
];

export interface IdiomOption {
  id: IdiomMode;
  label: string;
  description: string;
}

export const IDIOM_OPTIONS: IdiomOption[] = [
  {
    id: 'cultural-adaptation',
    label: 'Cultural Equivalent Idioms (محاوراتی)',
    description: 'Replaces English idioms with native Urdu proverbs (e.g. "piece of cake" -> "بائیں ہاتھ کا کھیل").'
  },
  {
    id: 'literal',
    label: 'Direct Semantic (لفظی ترجمہ)',
    description: 'Keeps direct, literal semantic meaning close to the original source phrasing.'
  }
];

export interface LineBreakOption {
  id: LineBreakMode;
  label: string;
  description: string;
}

export const LINE_BREAK_MODES: LineBreakOption[] = [
  {
    id: 'smart-two-line',
    label: 'Smart 2-Line Screen Balance',
    description: 'Auto-splits long dialogues at natural pauses (max ~38 chars/line) for optimal TV & mobile display.'
  },
  {
    id: 'single-line',
    label: 'Single-Line Punchy',
    description: 'Keeps translations compact and concise on one line whenever possible for fast eye movement.'
  },
  {
    id: 'preserve',
    label: 'Preserve Original Structure',
    description: 'Maintains identical line breaks matching the source English subtitle.'
  }
];

export interface ContentFilterOption {
  id: ContentFilter;
  label: string;
  description: string;
}

export const CONTENT_FILTERS: ContentFilterOption[] = [
  {
    id: 'faithful',
    label: 'Raw & Faithful (No Censorship)',
    description: 'Keeps full emotional intensity, slang, swear words, and raw street drama unaltered.'
  },
  {
    id: 'family-friendly',
    label: 'Family Friendly (Dignified TV)',
    description: 'Substitutes harsh profanities with polite, respectable conversational Urdu equivalents.'
  },
  {
    id: 'asterisk',
    label: 'Asterisk Masking (***)',
    description: 'Masks explicit swear words with asterisks while retaining sentence meaning.'
  }
];

export interface AudioCueOption {
  id: AudioCueMode;
  title: string;
  desc: string;
}

export const AUDIO_CUE_OPTIONS: AudioCueOption[] = [
  { id: 'translate', title: 'Translate Cues', desc: '[music] -> [موسیقی], [sighs] -> [آہ بھری]' },
  { id: 'preserve', title: 'Keep Original English', desc: '[music playing] stays verbatim in English brackets' },
  { id: 'strip', title: 'Strip Sound Effects', desc: 'Remove bracketed sounds completely for dialogue-only' }
];

export interface NumberFormatOption {
  id: NumberFormatMode;
  label: string;
  sample: string;
}

export const NUMBER_FORMAT_OPTIONS: NumberFormatOption[] = [
  { id: 'western', label: 'Western Digits (1, 2, 3)', sample: '10 بج کر 15 منٹ' },
  { id: 'eastern-arabic', label: 'Urdu Digits (۱، ۲، ۳)', sample: '۱۰ بج کر ۱۵ منٹ' },
  { id: 'spelled-out', label: 'Spelled in Words (دس، پندرہ)', sample: 'دس بج کر پندرہ منٹ' }
];

export interface PunctuationOption {
  id: PunctuationMode;
  label: string;
  description: string;
}

export const PUNCTUATION_OPTIONS: PunctuationOption[] = [
  { id: 'urdu-punctuation', label: 'Urdu Native Punctuation (۔ ، ؟)', description: 'Uses proper Urdu full-stop (۔), inverted comma (،), and reversed question mark (؟).' },
  { id: 'western-punctuation', label: 'Western Standard (. , ?)', description: 'Uses standard Western punctuation characters (., ?, !).' }
];

export interface TranslationSettings {
  targetLanguage: string; // default 'ur'
  sourceLanguage: string; // default 'en'
  scriptMode: ScriptMode;
  toneRegister: ToneRegister;
  honorificRegister: HonorificRegister;
  loanWordMode: LoanWordMode;
  idiomMode: IdiomMode;
  lineBreakMode: LineBreakMode;
  contentFilter: ContentFilter;
  audioCueMode: AudioCueMode;
  numberFormatMode: NumberFormatMode;
  punctuationMode: PunctuationMode;
  urduFont: string;
  originalFont: string;
}

export const DEFAULT_TRANSLATION_SETTINGS: TranslationSettings = {
  targetLanguage: 'ur',
  sourceLanguage: 'auto',
  scriptMode: 'urdu-script',
  toneRegister: 'aam-bolchal',
  honorificRegister: 'contextual',
  loanWordMode: 'natural-blend',
  idiomMode: 'cultural-adaptation',
  lineBreakMode: 'smart-two-line',
  contentFilter: 'faithful',
  audioCueMode: 'translate',
  numberFormatMode: 'western',
  punctuationMode: 'urdu-punctuation',
  urduFont: "'Noto Nastaliq Urdu', 'Gulzar', 'Jameel Noori Nastaliq', 'Noto Sans Arabic', 'Urdu Typesetting', serif",
  originalFont: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
};

/**
 * Builds the comprehensive system instruction prompt for Gemini
 */
export function buildTranslationSystemInstruction(
  settings: TranslationSettings = DEFAULT_TRANSLATION_SETTINGS,
  context: string = '',
  customPrompt: string = ''
): string {
  const langObj = TARGET_LANGUAGES.find(l => l.code === settings.targetLanguage) || TARGET_LANGUAGES[0];
  const isUrduVariant = settings.targetLanguage === 'ur' || settings.targetLanguage === 'ur-roman';

  // 1. Script & Bilingual Instruction
  let scriptRule = '';
  switch (settings.scriptMode) {
    case 'roman-urdu':
      scriptRule = `
      SCRIPT REQUIREMENT: ROMAN URDU ONLY.
      - Output strictly in standard phonetic Roman Urdu using the English/Latin alphabet (e.g., "Aap yahan kyun aaye hain?", "Mujhe sach batao").
      - Do NOT use Arabic or Urdu script characters.
      - Ensure intuitive, standard phonetic spelling that South Asian viewers effortlessly read.`;
      break;

    case 'bilingual-en-ur':
      scriptRule = `
      SCRIPT REQUIREMENT: BILINGUAL (ENGLISH + URDU SCRIPT).
      - For every subtitle segment, output exactly TWO stacked lines separated by a newline character (\\n):
        Line 1: Original English dialogue text
        Line 2: Urdu script translation in Nastaliq/Persio-Arabic (اردو ترجمہ)
      - Example format:
        "What are you doing here?\\nآپ یہاں کیا کر رہے ہیں؟"`;
      break;

    case 'bilingual-en-roman':
      scriptRule = `
      SCRIPT REQUIREMENT: BILINGUAL (ENGLISH + ROMAN URDU).
      - For every subtitle segment, output exactly TWO stacked lines separated by a newline character (\\n):
        Line 1: Original English dialogue text
        Line 2: Phonetic Roman Urdu translation in Latin letters
      - Example format:
        "What are you doing here?\\nAap yahan kya kar rahe hain?"`;
      break;

    case 'bilingual-ur-roman':
      scriptRule = `
      SCRIPT REQUIREMENT: BILINGUAL (URDU SCRIPT + ROMAN URDU).
      - For every subtitle segment, output exactly TWO stacked lines separated by a newline character (\\n):
        Line 1: Authentic Urdu script (اردو رسم الخط)
        Line 2: Phonetic Roman Urdu transcription (English alphabet)
      - Example format:
        "آپ یہاں کیا کر رہے ہیں؟\\nAap yahan kya kar rahe hain?"`;
      break;

    case 'bilingual-ur-en':
      scriptRule = `
      SCRIPT REQUIREMENT: BILINGUAL (URDU SCRIPT TOP + ENGLISH BELOW).
      - For every subtitle segment, output exactly TWO stacked lines separated by a newline character (\\n):
        Line 1: Authentic Urdu script translation (اردو رسم الخط)
        Line 2: Original English dialogue text
      - Example format:
        "آپ یہاں کیا کر رہے ہیں؟\\nWhat are you doing here?"`;
      break;

    case 'bilingual-side-by-side':
      scriptRule = `
      SCRIPT REQUIREMENT: INLINE BILINGUAL.
      - Output both languages compactly on one line with brackets: "English Dialogue (اردو ترجمہ)".
      - Example format:
        "What are you doing here? (آپ یہاں کیا کر رہے ہیں؟)"`;
      break;

    case 'urdu-script':
    default:
      if (isUrduVariant) {
        scriptRule = `
        SCRIPT REQUIREMENT: PURE URDU SCRIPT (نستعلیق).
        - Output strictly in authentic Urdu script (Nasta'liq / Persio-Arabic alphabet).
        - Do NOT include Latin/English characters unless it's a globally recognized brand or code name.`;
      } else {
        scriptRule = `
        TARGET LANGUAGE: ${langObj.name} (${langObj.nativeName}).
        - Output strictly in authentic ${langObj.name} script.`;
      }
      break;
  }

  // 2. Tone Instruction
  let toneRule = '';
  switch (settings.toneRegister) {
    case 'adabi':
      toneRule = `TONE: Adabi & Literary. Use formal, poetic, refined vocabulary with dignified grammar suitable for historical dramas, classic cinema, and serious literature.`;
      break;
    case 'filmi':
      toneRule = `TONE: Filmi & Dramatic Cinema. Heighten the emotional resonance, punchiness, and theatrical impact. Use iconic dramatic idioms and expressive phrasing that hits the viewer's heart.`;
      break;
    case 'youth':
      toneRule = `TONE: Modern Urban Youth. Use contemporary Pakistani urban slang, snappy modern phrasing, and casual conversational flow suitable for young audiences and modern web series.`;
      break;
    case 'humorous':
      toneRule = `TONE: Comedy & Witty (طنز و مزاح). Deliver witty, comedic timing, humorous cultural quips, and playful banter without losing context.`;
      break;
    case 'devotional':
      toneRule = `TONE: Courteous & Respectful (با ادب). Use highest etiquette, polite deference, and reverent cultural expressions.`;
      break;
    case 'neutral':
      toneRule = `TONE: Standard Neutral / Documentary. Clear, objective, grammatically precise phrasing without dramatic embellishment or slang.`;
      break;
    case 'aam-bolchal':
    default:
      toneRule = `TONE: Aam Bolchal (Conversational). Capture the authentic "inner sense" and "soul" of natural spoken dialogue as spoken in real Pakistani households and conversations. Warm, relatable, and human.`;
      break;
  }

  // 3. Honorifics Rule
  let honorificRule = '';
  switch (settings.honorificRegister) {
    case 'respectful-aap':
      honorificRule = `HONORIFICS: Form of Address must strictly use "Aap" (آپ), respectful verb inflections (کیجیے، فرمائیے، تشریف رکھیے), and polite courtesy.`;
      break;
    case 'informal-tum':
      honorificRule = `HONORIFICS: Form of Address should use familiar "Tum" (تم), suitable for close friends, colleagues, and peer-to-peer dialogues.`;
      break;
    case 'dramatic-tu':
      honorificRule = `HONORIFICS: Form of Address should use raw/intimate "Tu" (تو) for fiery confrontations, street slang, or intimate childhood bonds.`;
      break;
    case 'contextual':
    default:
      honorificRule = `HONORIFICS: Dynamically choose between "Aap", "Tum", and "Tu" based on character seniority, age difference, and emotional relationship.`;
      break;
  }

  // 4. Loan Words & Code-Switching Rule
  let loanWordRule = '';
  switch (settings.loanWordMode) {
    case 'pure-vernacular':
      loanWordRule = `VOCABULARY: Use pure native vernacular words where possible (e.g. گاڑی instead of car, شفاخانہ instead of hospital, دفتر instead of office).`;
      break;
    case 'transliterated':
      loanWordRule = `VOCABULARY: Transliterate modern English terms phonetically into Urdu script (e.g. فون، ڈاکٹر، کمپیوٹر، پولیس، میٹنگ).`;
      break;
    case 'natural-blend':
    default:
      loanWordRule = `VOCABULARY: Natural Code-Switching. Keep ubiquitous modern loanwords (doctor, hospital, phone, car, police) naturally as South Asians speak them daily.`;
      break;
  }

  // 5. Idiom Rule
  let idiomRule = '';
  switch (settings.idiomMode) {
    case 'literal':
      idiomRule = `IDIOM HANDLING: Translate idioms with direct semantic fidelity rather than replacing with cultural proverbs.`;
      break;
    case 'cultural-adaptation':
    default:
      idiomRule = `IDIOM HANDLING: Culturally Adapt Idioms (محاوراتی ترجمہ). Replace foreign idioms with authentic South Asian / Urdu equivalents that evoke the exact same emotional metaphor (e.g., "piece of cake" -> "بائیں ہاتھ کا کھیل").`;
      break;
  }

  // 6. Line Break & CPS formatting
  let lineBreakRule = '';
  switch (settings.lineBreakMode) {
    case 'smart-two-line':
      lineBreakRule = `LINE FORMATTING: Balance subtitle text so that no single line exceeds ~38 characters. Break at natural grammatical pauses (commas, conjunctions) using \\n for optimal readability on TV/mobile screens.`;
      break;
    case 'single-line':
      lineBreakRule = `LINE FORMATTING: Keep each subtitle concise and punchy on a single line where possible without losing core meaning.`;
      break;
    case 'preserve':
    default:
      lineBreakRule = `LINE FORMATTING: Preserve the general pacing and rhythm of the original subtitle lines.`;
      break;
  }

  // 7. Content moderation
  let contentRule = '';
  switch (settings.contentFilter) {
    case 'family-friendly':
      contentRule = `CONTENT FILTER: Family-Friendly Mode. Substitute harsh profanities, vulgar insults, or explicit sexual slurs with polite, dignified, respectable conversational equivalents (e.g. لعنت, بدتمیز, احمق, بکواس).`;
      break;
    case 'asterisk':
      contentRule = `CONTENT FILTER: Asterisk Masking. Mask explicit profanities with asterisks (e.g., ک***) while preserving sentence context.`;
      break;
    case 'faithful':
    default:
      contentRule = `CONTENT FILTER: Raw & Faithful. Do NOT censor raw emotion, intense drama, or authentic dialogue; preserve the creator's intended intensity.`;
      break;
  }

  // 8. Audio cue handling
  let audioCueRule = '';
  switch (settings.audioCueMode) {
    case 'strip':
      audioCueRule = `AUDIO CUES: Strip out bracketed sound effects like [applause], (sighs), [music playing] so only spoken dialogue remains.`;
      break;
    case 'preserve':
      audioCueRule = `AUDIO CUES: Keep bracketed sound effects unchanged in their original English form (e.g., [sighs]).`;
      break;
    case 'translate':
    default:
      audioCueRule = `AUDIO CUES: Translate bracketed sound effects into localized equivalents (e.g., [music playing] -> [موسیقی], [sighs] -> [آہ بھرتے ہوئے]).`;
      break;
  }

  // 9. Number formatting
  let numberRule = '';
  switch (settings.numberFormatMode) {
    case 'eastern-arabic':
      numberRule = `NUMERALS: Format numbers in traditional Eastern Urdu digits (۰، ۱، ۲، ۳، ۴، ۵، ۶، ۷، ۸، ۹).`;
      break;
    case 'spelled-out':
      numberRule = `NUMERALS: Spell out numbers phonetically in words (e.g., ایک، دو، تین، بیس).`;
      break;
    case 'western':
    default:
      numberRule = `NUMERALS: Retain standard Western digits (1, 2, 3, 2026).`;
      break;
  }

  // 10. Punctuation
  let punctRule = '';
  switch (settings.punctuationMode) {
    case 'western-punctuation':
      punctRule = `PUNCTUATION: Use standard Western punctuation marks (. , ? !).`;
      break;
    case 'urdu-punctuation':
    default:
      if (settings.scriptMode === 'urdu-script' || settings.scriptMode.includes('bilingual')) {
        punctRule = `PUNCTUATION: Use authentic Urdu punctuation for Urdu text (Urdu full stop '۔', Urdu comma '،', Urdu question mark '؟').`;
      }
      break;
  }

  return `
You are a world-class professional subtitle localization expert specializing in ${langObj.name} and cinematic translation.
Your mission is to provide subtitles that feel native, emotionally resonant, and perfectly timed for the screen.

${scriptRule}

${toneRule}

${honorificRule}

${loanWordRule}

${idiomRule}

${lineBreakRule}

${contentRule}

${audioCueRule}

${numberRule}

${punctRule}

STRICT OUTPUT REQUIREMENT:
- Return the output in a strict JSON array of objects with keys "index" and "translatedText".
- Preserve the exact "index" integer matching each input subtitle block.

PROJECT CONTEXT:
${context || 'No specific project context provided. Translate dialogue naturally.'}

USER INSTRUCTIONS:
${customPrompt || 'None'}
`.trim();
}
