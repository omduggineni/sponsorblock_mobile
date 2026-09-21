import { Config } from '../config';
import { CATEGORY_MAP } from '../constants';
import { h } from '../dom';
import { PlaybackState } from '../state';
import { findProgressBarHost, getVideo } from '../youtube';

export function removeProgressOverlay(): void {
    document.querySelectorAll('.sbm-progress-overlay').forEach((el) => el.remove());
}

// The progress bar's host element is a large touch target (~40+px tall);
// the actual visible line is a ~3px strip roughly centered inside it. Size
// our overlay to match that real line rather than filling the whole host,
// or the colored segments render as tall blocks instead of a thin bar.
function sizeOverlayToTrack(host: Element, overlay: HTMLElement): void {
    const line = host.querySelector('yt-progress-bar-line, .ytProgressBarLineHost');
    if (line) {
        const hostRect = host.getBoundingClientRect();
        const lineRect = line.getBoundingClientRect();
        if (hostRect.height > 0 && lineRect.height > 0) {
            overlay.style.top = (lineRect.top - hostRect.top) + 'px';
            overlay.style.height = lineRect.height + 'px';
            overlay.style.transform = 'none';
            return;
        }
    }
    // Fallback: thin bar vertically centered in the host (CSS default).
    overlay.style.top = '';
    overlay.style.height = '';
    overlay.style.transform = '';
}

export function ensureProgressOverlay(): void {
    if (!Config.showProgressBarSegments) {
        removeProgressOverlay();
        return;
    }
    const video = getVideo();
    const host = findProgressBarHost();
    if (!host || !video || !isFinite(video.duration) || video.duration <= 0) return;

    let overlay = host.querySelector(':scope > .sbm-progress-overlay') as HTMLElement | null;
    if (!overlay) {
        if (getComputedStyle(host).position === 'static') {
            (host as HTMLElement).style.position = 'relative';
        }
        overlay = h('div', { class: 'sbm-progress-overlay' });
        host.appendChild(overlay);
        overlay.dataset.videoId = '';
    }

    sizeOverlayToTrack(host, overlay);

    if (overlay.dataset.videoId === PlaybackState.videoID && overlay.dataset.count === String(PlaybackState.segments.length)) {
        return; // already built for this video
    }

    while (overlay.firstChild) overlay.removeChild(overlay.firstChild);
    const duration = video.duration;
    for (const seg of PlaybackState.segments) {
        const cat = CATEGORY_MAP.get(seg.category);
        const leftPct = Math.max(0, (seg.start / duration) * 100);
        if (seg.actionType === 'poi') {
            // A highlight is a single point in time, not a range — render
            // it as a small marker poking above/below the bar rather than
            // a (near-invisible) sliver the same height as a real segment.
            const marker = h('div', {
                class: 'sbm-progress-poi',
                style: `left:${leftPct}%;background:${cat ? cat.color : '#fff'};`,
            });
            overlay.appendChild(marker);
            continue;
        }
        const widthPct = Math.max(0.3, ((seg.end - seg.start) / duration) * 100);
        const bar = h('div', {
            class: 'sbm-progress-seg',
            style: `left:${leftPct}%;width:${widthPct}%;background:${cat ? cat.color : '#fff'};`,
        });
        overlay.appendChild(bar);
    }
    overlay.dataset.videoId = PlaybackState.videoID ?? '';
    overlay.dataset.count = String(PlaybackState.segments.length);
}
