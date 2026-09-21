import STYLE from './styles.css';

// Deliberately a plain <style> tag rather than GM_addStyle/GM.addStyle:
// injecting CSS needs no special privilege (every userscript manager's
// content script can freely touch the page's own DOM), and GM_addStyle's
// exact name, calling convention, and availability all vary enough across
// managers (see config.ts) that it isn't worth depending on for something
// this simple.
export function injectStyles(): void {
    const root = document.head || document.documentElement;
    if (!root) {
        // @run-at document-start can fire before <html> exists at all.
        window.requestAnimationFrame(injectStyles);
        return;
    }
    const styleEl = document.createElement('style');
    styleEl.textContent = STYLE;
    root.appendChild(styleEl);
}
