// Ambient declarations for the userscript-manager GM_* / GM.* APIs this
// script uses (declared via @grant in the userscript metadata block).
// They're plain globals at runtime, not imports — every module that
// references them relies on these declarations for type-checking only.
//
// Two calling conventions exist in the wild and this script supports both:
// legacy underscore-named globals (GM_getValue, ...) used by Tampermonkey /
// Violentmonkey, which may return a value directly or a Promise depending
// on the manager; and the modern dot-namespaced `GM` object (GM.getValue,
// ...), always Promise-based, which is the *only* form some managers
// (quoid/userscripts, Greasemonkey 4+) implement at all. Every call site
// `await`s the result either way, which works transparently regardless of
// whether the callee actually returned a Promise or a plain value.

declare function GM_getValue<T = unknown>(key: string, defaultValue?: T): T | Promise<T>;
declare function GM_setValue(key: string, value: unknown): void | Promise<void>;
declare function GM_deleteValue(key: string): void | Promise<void>;
declare function GM_registerMenuCommand(name: string, onClick: () => void): number | string;

declare const GM:
    | {
          getValue?: <T = unknown>(key: string, defaultValue?: T) => Promise<T>;
          setValue?: (key: string, value: unknown) => Promise<void>;
          deleteValue?: (key: string) => Promise<void>;
      }
    | undefined;

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
