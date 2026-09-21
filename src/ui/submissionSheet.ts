import { CATEGORIES } from '../constants';
import { formatTime, h } from '../dom';
import { loadVideo } from '../playback';
import { segmentCache, submitSegments } from '../sponsorblock-api';
import { PlaybackState } from '../state';
import { getVideo } from '../youtube';

let submitScreen: HTMLElement | null = null;

export function closeSubmit(): void {
    if (submitScreen) {
        submitScreen.remove();
        submitScreen = null;
    }
}

export function renderSubmitSheet(): void {
    const list = h('div', {}, PlaybackState.pendingSubmission.map((seg, idx) => {
        const select = h('select', {
            onchange: (e: Event) => { seg.category = (e.target as HTMLSelectElement).value; },
        }, CATEGORIES.filter((c) => !c.isPoi).map((c) =>
            h('option', Object.assign({ value: c.key, text: c.name }, c.key === seg.category ? { selected: 'selected' } : {}))
        ));

        return h('div', { class: 'sbm-pending-item' }, [
            h('span', { class: 'sbm-time', text: `${formatTime(seg.start)} → ${formatTime(seg.end)}` }),
            select,
            h('button', { class: 'sbm-del', text: '✕', onclick: () => {
                PlaybackState.pendingSubmission.splice(idx, 1);
                renderSubmitSheet();
            } }),
        ]);
    }));

    const video = getVideo();
    const markStart = h('button', { class: 'sbm-btn-secondary', text: 'Mark start → end', onclick: () => {
        if (!video) return;
        PlaybackState.pendingSubmission.push({ start: video.currentTime, end: video.currentTime + 1, category: 'sponsor', actionType: 'skip' });
        renderSubmitSheet();
    } });

    const markHighlight = h('button', { class: 'sbm-btn-secondary', text: 'Mark highlight', onclick: () => {
        if (!video) return;
        PlaybackState.pendingSubmission.push({ start: video.currentTime, end: video.currentTime, category: 'poi_highlight', actionType: 'poi' });
        renderSubmitSheet();
    } });

    const editCurrent = PlaybackState.pendingSubmission[PlaybackState.pendingSubmission.length - 1];
    const setEndBtn = h('button', { class: 'sbm-btn-secondary', text: 'Set end = now', onclick: () => {
        if (!video || !editCurrent) return;
        editCurrent.end = video.currentTime;
        renderSubmitSheet();
    } });

    const submitBtn = h('button', {
        class: 'sbm-btn-primary',
        text: PlaybackState.pendingSubmission.length ? `Submit ${PlaybackState.pendingSubmission.length} segment(s)` : 'Nothing to submit',
        onclick: async () => {
            if (!PlaybackState.pendingSubmission.length || !video) return;
            const valid = PlaybackState.pendingSubmission.filter((s) => s.actionType === 'poi' || s.end > s.start);
            if (!valid.length) return;
            const res = await submitSegments(PlaybackState.videoID, valid, video.duration);
            if (res.status === 200) {
                PlaybackState.pendingSubmission = [];
                segmentCache.delete(PlaybackState.videoID ?? '');
                closeSubmit();
                if (PlaybackState.videoID) loadVideo(PlaybackState.videoID);
            } else {
                alert('Submission failed (server said: ' + res.status + '). Your segments were kept so you can retry.');
            }
        },
    });

    const sheet = h('div', { class: 'sbm-sheet' }, [
        h('h2', {}, [document.createTextNode('Submit a segment'), h('button', { class: 'sbm-close', text: '✕', onclick: closeSubmit })]),
        h('div', { class: 'sbm-mark-row' }, [markStart, markHighlight]),
        editCurrent ? h('div', { class: 'sbm-mark-row' }, [setEndBtn]) : null,
        list,
        submitBtn,
    ]);

    if (submitScreen) {
        submitScreen.querySelector('.sbm-sheet')!.replaceWith(sheet);
    } else {
        submitScreen = h('div', { class: 'sbm-overlay-screen', onclick: (e: Event) => { if (e.target === submitScreen) closeSubmit(); } }, [sheet]);
        document.body.appendChild(submitScreen);
    }
}
