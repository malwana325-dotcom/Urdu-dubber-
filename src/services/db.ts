
export interface AppState {
  subtitles: any[];
  context: string;
  customPrompt: string;
  logs: any[];
  fileName: string;
  selectedModel: string;
  customApiKey: string;
  googleApiKey: string;
  geminiBatchSize: number;
  googleBatchSize: number;
  geminiWorkers: number;
  googleWorkers: number;
  geminiDelay: number;
  sessionId?: string;
  translatedFontSize?: number;
  originalFontSize?: number;
  urduFont?: string;
  originalFont?: string;
  translationSettings?: any;
  targetLanguage?: string;
  sourceLanguage?: string;
  scriptMode?: string;
  toneRegister?: string;
  honorificRegister?: string;
  loanWordMode?: string;
  idiomMode?: string;
  lineBreakMode?: string;
  contentFilter?: string;
  audioCueMode?: string;
  numberFormatMode?: string;
  punctuationMode?: string;
  visibleColumns?: any;
  theme?: string;
  activeStylingConfig?: any;
  isWorkspaceStylingPreview?: boolean;
  isReadOnly?: boolean;
  studioColumnsToDisplay?: {
    original: boolean;
    ai: boolean;
    google: boolean;
    time: boolean;
  };
  googleFontSize?: number;
  googleFont?: string;
  isGlobalFontActive?: boolean;
  globalFont?: string;
  globalFontSize?: number;
  fontTarget?: 'global' | 'original' | 'ai' | 'google';
  fontsActiveTab?: 'english' | 'urdu' | 'local';
  pageSize?: number;
}

const DB_NAME = 'UrduLocalizerDB';
const STORE_NAME = 'app_state';
const DB_VERSION = 1;

export class IndexedDBService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  async saveState(state: AppState): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(state, 'current_state');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async loadState(): Promise<AppState | null> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get('current_state');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async clearState(): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete('current_state');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const dbService = new IndexedDBService();
