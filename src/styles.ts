const STYLE = `
    .sbm-toast {
        position: fixed;
        transform: translateX(-50%);
        background: rgba(20, 20, 20, 0.92);
        color: #fff;
        border-radius: 999px;
        padding: 8px 8px 8px 16px;
        display: flex;
        align-items: center;
        gap: 6px;
        font: 13px/1.3 Roboto, Arial, sans-serif;
        z-index: 2147483000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.4);
        max-width: 88%;
        pointer-events: auto;
    }
    .sbm-toast button {
        background: rgba(255,255,255,0.14);
        border: none;
        color: #fff;
        border-radius: 999px;
        padding: 7px 12px;
        font: 600 12px/1 Roboto, Arial, sans-serif;
        min-height: 32px;
        white-space: nowrap;
    }
    .sbm-toast .sbm-vote-btn {
        padding: 7px 9px;
        font-size: 15px;
    }
    .sbm-toast .sbm-vote-btn.sbm-voted { background: #2d7d2d; }
    .sbm-manual-btn {
        position: fixed;
        background: rgba(20, 20, 20, 0.88);
        color: #fff;
        border: none;
        border-radius: 999px;
        padding: 10px 16px;
        font: 600 13px/1 Roboto, Arial, sans-serif;
        z-index: 2147483000;
        display: flex;
        align-items: center;
        gap: 6px;
        pointer-events: auto;
    }
    .sbm-poi-chip {
        position: fixed;
        transform: translateX(-50%);
        background: rgba(20,20,20,0.88);
        color: #fff;
        border: none;
        border-radius: 999px;
        padding: 8px 14px;
        font: 600 12px/1 Roboto, Arial, sans-serif;
        z-index: 2147483000;
        pointer-events: auto;
    }
    .sbm-progress-overlay {
        position: absolute;
        left: 0;
        right: 0;
        /* top/height are set inline to match the real (thin) seek bar line;
           the host element itself is a much taller touch target. */
        top: 50%;
        height: 3px;
        transform: translateY(-50%);
        pointer-events: none;
        z-index: 3;
    }
    .sbm-progress-seg {
        position: absolute;
        top: 0;
        bottom: 0;
        opacity: 0.75;
    }
    .sbm-fab-row {
        position: fixed;
        right: 10px;
        bottom: 90px;
        display: none;
        flex-direction: column;
        gap: 10px;
        z-index: 2147483000;
    }
    .sbm-action-bar-btn {
        flex: 0 0 auto;
        width: 48px;
        height: 48px;
        background: transparent;
        border: none;
        border-radius: 50%;
        color: inherit;
        font-size: 21px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .sbm-action-bar-btn:active { background: rgba(128,128,128,0.2); }
    .sbm-fab {
        width: 46px;
        height: 46px;
        border-radius: 50%;
        background: #1a1a1a;
        color: #fff;
        border: 1px solid rgba(255,255,255,0.2);
        font-size: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
    }
    .sbm-overlay-screen {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.6);
        z-index: 2147483600;
        display: flex;
        align-items: flex-end;
        justify-content: center;
    }
    .sbm-sheet {
        background: #181818;
        color: #fff;
        width: 100%;
        max-width: 560px;
        max-height: 86vh;
        overflow-y: auto;
        border-radius: 16px 16px 0 0;
        padding: 16px 16px calc(16px + env(safe-area-inset-bottom, 0px));
        font: 14px/1.4 Roboto, Arial, sans-serif;
        box-sizing: border-box;
    }
    .sbm-sheet h2 {
        font-size: 17px;
        margin: 0 0 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .sbm-sheet h2 button.sbm-close { background: none; border: none; color: #aaa; font-size: 20px; padding: 4px 8px; }
    .sbm-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        gap: 10px;
    }
    .sbm-row-label { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
    .sbm-row-label b { font-size: 14px; }
    .sbm-row-label a { color: #3ea6ff; font-size: 11px; text-decoration: none; }
    .sbm-seg-toggle {
        display: flex;
        border-radius: 999px;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,0.25);
        flex-shrink: 0;
    }
    .sbm-seg-toggle button {
        background: transparent;
        color: #ccc;
        border: none;
        padding: 7px 10px;
        font: 600 11px/1 Roboto, Arial, sans-serif;
        min-width: 44px;
    }
    .sbm-seg-toggle button.active { background: #3ea6ff; color: #06233a; }
    .sbm-switch { position: relative; width: 42px; height: 24px; flex-shrink: 0; }
    .sbm-switch input { opacity: 0; width: 100%; height: 100%; margin: 0; position: absolute; z-index: 1; }
    .sbm-switch .track { position: absolute; inset: 0; background: #555; border-radius: 999px; transition: background 0.15s; }
    .sbm-switch .thumb { position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform 0.15s; }
    .sbm-switch input:checked ~ .track { background: #3ea6ff; }
    .sbm-switch input:checked ~ .thumb { transform: translateX(18px); }
    .sbm-sheet input[type=text] {
        width: 100%;
        box-sizing: border-box;
        background: #0f0f0f;
        border: 1px solid rgba(255,255,255,0.2);
        color: #fff;
        border-radius: 8px;
        padding: 9px 10px;
        font-size: 13px;
        margin-top: 6px;
    }
    .sbm-btn-primary {
        background: #3ea6ff;
        color: #06233a;
        border: none;
        border-radius: 999px;
        padding: 11px 18px;
        font: 700 13px/1 Roboto, Arial, sans-serif;
        width: 100%;
        margin-top: 14px;
    }
    .sbm-btn-secondary {
        background: rgba(255,255,255,0.1);
        color: #fff;
        border: none;
        border-radius: 999px;
        padding: 10px 14px;
        font: 600 12px/1 Roboto, Arial, sans-serif;
    }
    .sbm-stats { display: flex; gap: 16px; padding: 10px 0; }
    .sbm-stats div { flex: 1; text-align: center; background: rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 6px; }
    .sbm-stats b { display: block; font-size: 18px; }
    .sbm-stats span { font-size: 11px; color: #aaa; }
    .sbm-pending-item { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .sbm-pending-item select { flex: 1; background: #0f0f0f; color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 6px; }
    .sbm-pending-item .sbm-time { font-variant-numeric: tabular-nums; font-size: 12px; color: #ccc; min-width: 92px; }
    .sbm-pending-item button.sbm-del { background: none; border: none; color: #ff6b6b; font-size: 18px; }
    .sbm-mark-row { display: flex; gap: 8px; margin-top: 10px; }
    .sbm-mark-row button { flex: 1; }
    .sbm-toggle-strip { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
    .sbm-toggle-chip { border: 1px solid rgba(255,255,255,0.25); background: transparent; color: #ddd; border-radius: 999px; padding: 6px 10px; font-size: 11px; }
    .sbm-toggle-chip.active { color: #06233a; border-color: transparent; }
    `;

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
