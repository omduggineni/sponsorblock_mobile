// Ambient declarations for the Tampermonkey/Greasemonkey GM_* APIs this
// script uses (declared via @grant in the userscript metadata block).
// They're plain globals at runtime, not imports — every module that
// references them relies on these declarations for type-checking only.

declare function GM_getValue<T = unknown>(key: string, defaultValue?: T): T;
declare function GM_setValue(key: string, value: unknown): void;
declare function GM_deleteValue(key: string): void;
declare function GM_addStyle(css: string): HTMLStyleElement;
declare function GM_registerMenuCommand(name: string, onClick: () => void): number | string;

interface GMXhrResponse {
    status: number;
    responseText: string;
}

interface GMXhrDetails {
    method: string;
    url: string;
    headers?: Record<string, string>;
    data?: string;
    onload?: (response: GMXhrResponse) => void;
    onerror?: (response: GMXhrResponse) => void;
    ontimeout?: (response: GMXhrResponse) => void;
}

declare function GM_xmlhttpRequest(details: GMXhrDetails): void;

interface Window {
    msCrypto?: Crypto;
    __sbMobileLoaded?: boolean;
    __sbMobileDebug?: unknown;
}
