import { TOAST_DURATION_MS } from '../constants';
import { categoryLabel, h } from '../dom';
import { withErrorReporting } from '../errorReporting';
import { vote } from '../sponsorblock-api';
import { PlaybackState } from '../state';
import type { Segment } from '../types';
import { getPlayerRect, getVideo } from '../youtube';

export function removeToast(): void {
    if (PlaybackState.toastEl) {
        PlaybackState.toastEl.remove();
        PlaybackState.toastEl = null;
    }
    if (PlaybackState.toastTimer) {
        clearTimeout(PlaybackState.toastTimer);
        PlaybackState.toastTimer = null;
    }
}

export function showSkipToast(segments: Segment[], resumeTime: number): void {
    removeToast();

    const single = segments.length === 1;
    const label = single
        ? `Skipped ${categoryLabel(segments[0].category)}`
        : `Skipped ${segments.length} segments`;

    const undoBtn = h('button', {
        text: 'Undo',
        onclick: () => {
            const video = getVideo();
            if (video) video.currentTime = Math.max(0, resumeTime);
            for (const s of segments) PlaybackState.overriddenUUIDs.add(s.uuid);
            removeToast();
        },
    });

    const children: Array<Node | string | null> = [h('span', { text: label }), undoBtn];

    if (single && segments[0].uuid) {
        const seg = segments[0];
        const up = h('button', { class: 'sbm-vote-btn', text: '\u{1F44D}', onclick: () => {
            up.classList.add('sbm-voted');
            vote(seg.uuid, 1);
        } });
        const down = h('button', { class: 'sbm-vote-btn', text: '\u{1F44E}', onclick: () => {
            down.classList.add('sbm-voted');
            vote(seg.uuid, 0);
        } });
        children.push(up, down);
    }

    const toast = h('div', { class: 'sbm-toast' }, children);
    const rect = getPlayerRect();
    toast.style.left = (rect.left + rect.width / 2) + 'px';
    toast.style.top = (rect.top + rect.height * 0.8) + 'px';
    document.body.appendChild(toast);
    PlaybackState.toastEl = toast;
    PlaybackState.toastTimer = setTimeout(withErrorReporting('toast auto-dismiss', removeToast), TOAST_DURATION_MS);
}
