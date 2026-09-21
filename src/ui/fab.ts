import { h } from '../dom';
import { PlaybackState } from '../state';
import { openSettings } from './settingsPanel';
import { renderSubmitSheet } from './submissionSheet';

let fabRow: HTMLElement | null = null;

export function updateFabVisibility(): void {
    if (!fabRow) return;
    fabRow.style.display = PlaybackState.videoID ? 'flex' : 'none';
}

export function createFabRow(): void {
    const settingsBtn = h('button', { class: 'sbm-fab', text: '⚙', title: 'SponsorBlock settings', onclick: openSettings });
    const submitBtn = h('button', { class: 'sbm-fab', text: '+', title: 'Submit a segment', onclick: renderSubmitSheet });
    fabRow = h('div', { class: 'sbm-fab-row' }, [submitBtn, settingsBtn]);
    document.body.appendChild(fabRow);
    updateFabVisibility();
}
