import { CATEGORIES, DEFAULT_SERVER, STORAGE_PREFIX } from './constants';
import type { CategoryAction, Stats } from './types';

export const hasGM = typeof GM_getValue === 'function' && typeof GM_setValue === 'function';

export function storageGet<T>(key: string, fallback: T): T {
    try {
        if (hasGM) {
            const v = GM_getValue<T | undefined>(key, undefined);
            return v === undefined ? fallback : v;
        }
        const raw = localStorage.getItem(STORAGE_PREFIX + key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
        return fallback;
    }
}

export function storageSet(key: string, value: unknown): void {
    try {
        if (hasGM) {
            GM_setValue(key, value);
        } else {
            localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
        }
    } catch (e) {
        /* ignore quota / privacy-mode errors */
    }
}

function defaultCategoryActions(): Record<string, CategoryAction> {
    const out: Record<string, CategoryAction> = {};
    for (const c of CATEGORIES) out[c.key] = c.default;
    return out;
}

export function generateUserID(): string {
    const bytes = new Uint8Array(20);
    (window.crypto || window.msCrypto as Crypto).getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export interface ConfigShape {
    enabled: boolean;
    serverAddress: string;
    categoryActions: Record<string, CategoryAction>;
    userID: string | null;
    minDuration: number;
    stats: Stats;
    showProgressBarSegments: boolean;
    save(key: string): void;
    setCategoryAction(key: string, action: CategoryAction): void;
    addStats(secondsSaved: number): void;
    resetStats(): void;
}

// Values here are placeholders only. Reading storage is deferred to
// initConfig() (called from main.ts, after the top-level iframe guard) so
// that merely *importing* this module — which every module transitively
// does — can never touch GM/localStorage before that guard has run.
export const Config: ConfigShape = {
    enabled: true,
    serverAddress: DEFAULT_SERVER,
    categoryActions: defaultCategoryActions(),
    userID: null,
    minDuration: 0,
    stats: { segmentsSkipped: 0, secondsSaved: 0 },
    showProgressBarSegments: true,

    save(key: string) {
        storageSet(key, (this as unknown as Record<string, unknown>)[key]);
    },

    setCategoryAction(key: string, action: CategoryAction) {
        this.categoryActions[key] = action;
        storageSet('categoryActions', this.categoryActions);
    },

    addStats(secondsSaved: number) {
        this.stats.segmentsSkipped += 1;
        this.stats.secondsSaved += Math.max(0, secondsSaved);
        storageSet('stats', this.stats);
    },

    resetStats() {
        this.stats = { segmentsSkipped: 0, secondsSaved: 0 };
        storageSet('stats', this.stats);
    },
};

// Loads persisted settings, generating and storing a userID on first run.
// Called explicitly from main.ts, after the top-level guards, so that
// nothing here ever touches storage from inside an iframe.
export function initConfig(): void {
    Config.enabled = storageGet('enabled', true);
    Config.serverAddress = storageGet('serverAddress', DEFAULT_SERVER);
    Config.categoryActions = Object.assign(defaultCategoryActions(), storageGet('categoryActions', {}));
    Config.userID = storageGet<string | null>('userID', null);
    Config.minDuration = storageGet('minDuration', 0);
    Config.stats = storageGet('stats', { segmentsSkipped: 0, secondsSaved: 0 });
    Config.showProgressBarSegments = storageGet('showProgressBarSegments', true);

    if (!Config.userID) {
        Config.userID = generateUserID();
        storageSet('userID', Config.userID);
    }
}
