import { CATEGORIES } from './constants';
import { Config, initConfig } from './config';
import { reportError } from './errorReporting';
import { fetchSegments } from './sponsorblock-api';
import { injectStyles } from './styles';
import { PlaybackState } from './state';
import { pollNavigation, tick } from './playback';
import { createFabRow } from './ui/fab';
import { openSettings } from './ui/settingsPanel';
import { renderSubmitSheet } from './ui/submissionSheet';
import { getVideoIDFromURL } from './youtube';

async function main(): Promise<void> {
    if (window.__sbMobileLoaded) return;
    window.__sbMobileLoaded = true;

    // Only run in the top-level document; YouTube embeds ad/auth iframes
    // that match our @match patterns but have nothing for us to do.
    // window.frameElement (a DOM property, null outside any <iframe>)
    // rather than a window.top identity comparison: some userscript
    // managers run scripts with @grant in an isolated JS world where
    // `window` is not the same object the page itself sees, which can
    // make identity checks like `window.top !== window` behave
    // unpredictably. frameElement doesn't depend on that identity.
    if (window.frameElement) return;

    // Different userscript managers (and versions of them) implement GM_*
    // APIs slightly differently, in ways this project can't fully test
    // against. None of these steps should ever be able to stop the script
    // from booting, so each is isolated: a failure in one is logged and
    // skipped rather than aborting everything after it.
    try {
        await initConfig();
    } catch (e) {
        reportError('initConfig', e);
    }

    try {
        injectStyles();
    } catch (e) {
        reportError('injectStyles', e);
    }

    try {
        if (typeof GM_registerMenuCommand === 'function') {
            GM_registerMenuCommand('SponsorBlock Settings', openSettings);
            GM_registerMenuCommand('Submit a segment', renderSubmitSheet);
        }
    } catch (e) {
        reportError('GM_registerMenuCommand', e);
    }

    boot();

    // Expose a couple of internals for automated testing (Playwright) only;
    // harmless in normal use since it's namespaced and read-only in practice.
    window.__sbMobileDebug = { Config, PlaybackState, CATEGORIES, getVideoIDFromURL, fetchSegments };
}

function boot(): void {
    if (!document.body) {
        window.requestAnimationFrame(boot);
        return;
    }
    try {
        createFabRow();
        window.requestAnimationFrame(tick);
        setInterval(pollNavigation, 500);
        pollNavigation();
    } catch (e) {
        reportError('boot', e);
    }
}

main().catch((e) => reportError('main', e));
