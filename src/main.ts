import { CATEGORIES } from './constants';
import { Config, hasGM, initConfig } from './config';
import { fetchSegments } from './sponsorblock-api';
import { injectStyles } from './styles';
import { PlaybackState } from './state';
import { pollNavigation, tick } from './playback';
import { createFabRow } from './ui/fab';
import { openSettings } from './ui/settingsPanel';
import { renderSubmitSheet } from './ui/submissionSheet';
import { getVideoIDFromURL } from './youtube';

function main(): void {
    if (window.__sbMobileLoaded) return;
    window.__sbMobileLoaded = true;

    // Only run in the top-level document; YouTube embeds ad/auth iframes
    // that match our @match patterns but have nothing for us to do.
    if (window.top !== window) return;

    initConfig();
    injectStyles();

    if (hasGM && typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand('SponsorBlock Settings', openSettings);
        GM_registerMenuCommand('Submit a segment', renderSubmitSheet);
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
    createFabRow();
    window.requestAnimationFrame(tick);
    setInterval(pollNavigation, 500);
    pollNavigation();
}

main();
