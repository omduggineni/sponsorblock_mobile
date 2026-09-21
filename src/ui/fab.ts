import { h } from '../dom';
import { PlaybackState } from '../state';
import { openSettings } from './settingsPanel';
import { renderSubmitSheet } from './submissionSheet';

let fabRow: HTMLElement | null = null;
let fabExpanded = false;

export function updateFabVisibility(): void {
    if (!fabRow) return;
    fabRow.style.display = PlaybackState.videoID && fabExpanded ? 'flex' : 'none';
}

function setFabExpanded(expanded: boolean): void {
    fabExpanded = expanded;
    updateFabVisibility();
}

export function createFabRow(): void {
    const settingsBtn = h('button', { class: 'sbm-fab', text: '⚙', title: 'SponsorBlock settings', onclick: openSettings });
    const submitBtn = h('button', { class: 'sbm-fab', text: '+', title: 'Submit a segment', onclick: renderSubmitSheet });
    fabRow = h('div', { class: 'sbm-fab-row' }, [submitBtn, settingsBtn]);
    document.body.appendChild(fabRow);
    updateFabVisibility();
}

// YouTube's like/dislike/share/save/report row — a horizontally scrollable
// flex row of same-sized icon buttons directly below the video title. We
// dock a matching SponsorBlock icon there instead of always floating our
// own controls on screen; tapping it just toggles the floating row above.
function findActionBarRow(): Element | null {
    return document.querySelector('.slim-video-action-bar-actions');
}

export function ensureActionBarButton(): void {
    const row = findActionBarRow();
    if (!row || row.querySelector(':scope > .sbm-action-bar-btn')) return;

    const btn = h('button', {
        class: 'sbm-action-bar-btn',
        'aria-label': 'SponsorBlock',
        title: 'SponsorBlock',
        text: '⏭',
        onclick: () => setFabExpanded(!fabExpanded),
    });
    row.appendChild(btn);
}
