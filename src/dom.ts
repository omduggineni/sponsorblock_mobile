import { CATEGORY_MAP } from './constants';
import { withErrorReporting } from './errorReporting';

export function h(tag: string, attrs?: Record<string, any>, children?: Array<Node | string | null | undefined | false>): HTMLElement {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k.startsWith('on') && typeof v === 'function') {
            el.addEventListener(k.slice(2), withErrorReporting(`<${tag}> ${k}`, v));
        } else el.setAttribute(k, v);
    }
    for (const child of children || []) {
        if (child) el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    }
    return el;
}

export function formatTime(seconds: number): string {
    seconds = Math.max(0, Math.round(seconds));
    const h_ = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const mm = h_ > 0 ? String(m).padStart(2, '0') : String(m);
    const ss = String(s).padStart(2, '0');
    return h_ > 0 ? `${h_}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function categoryLabel(key: string): string {
    const c = CATEGORY_MAP.get(key);
    return c ? c.name : key;
}
