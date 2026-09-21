import { CATEGORIES, DEFAULT_SERVER, STORAGE_PREFIX } from './constants';
import type { CategoryAction, Stats } from './types';

// Different userscript managers implement storage differently:
// Tampermonkey/Violentmonkey grant the legacy underscore-named globals
// (GM_getValue/GM_setValue), which may return a value directly or a
// Promise. Others — quoid/userscripts, Greasemonkey 4+ — only ever grant
// the modern dot-namespaced `GM.getValue`/`GM.setValue`, which are always
// Promise-based. `await`ing the result works either way (awaiting a
// non-Promise value just resolves immediately with it), so both
// conventions are supported through one code path, preferring the modern
// one when both happen to be present.
export const hasGMAsyncStorage = typeof GM !== 'undefined' && !!GM && typeof GM.getValue === 'function' && typeof GM.setValue === 'function';
export const hasGMSyncStorage = typeof GM_getValue === 'function' && typeof GM_setValue === 'function';

export async function storageGet<T>(key: string, fallback: T): Promise<T> {
    try {
        if (hasGMAsyncStorage) {
            const v = await GM!.getValue!<T | undefined>(key, undefined);
            return v === undefined ? fallback : v;
        }
        if (hasGMSyncStorage) {
            const v = await GM_getValue<T | undefined>(key, undefined);
            return v === undefined ? fallback : v;
        }
        const raw = localStorage.getItem(STORAGE_PREFIX + key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
        return fallback;
    }
}

export async function storageSet(key: string, value: unknown): Promise<void> {
    try {
        if (hasGMAsyncStorage) {
            await GM!.setValue!(key, value);
            return;
        }
        if (hasGMSyncStorage) {
            await GM_setValue(key, value);
            return;
        }
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
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
export async function initConfig(): Promise<void> {
    Config.enabled = await storageGet('enabled', true);
    Config.serverAddress = await storageGet('serverAddress', DEFAULT_SERVER);
    Config.categoryActions = Object.assign(defaultCategoryActions(), await storageGet('categoryActions', {}));
    Config.userID = await storageGet<string | null>('userID', null);
    Config.minDuration = await storageGet('minDuration', 0);
    Config.stats = await storageGet('stats', { segmentsSkipped: 0, secondsSaved: 0 });
    Config.showProgressBarSegments = await storageGet('showProgressBarSegments', true);

    if (!Config.userID) {
        Config.userID = generateUserID();
        storageSet('userID', Config.userID);
    }
}
