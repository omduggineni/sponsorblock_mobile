import { POI_CHIP_AUTO_DISMISS_MS } from '../constants';
import { h } from '../dom';
import { withErrorReporting } from '../errorReporting';
import { PlaybackState } from '../state';
import type { Segment } from '../types';
import { getPlayerRect, getVideo } from '../youtube';

export function removePoiChip(): void {
    if (PlaybackState.poiChipEl) {
        PlaybackState.poiChipEl.remove();
        PlaybackState.poiChipEl = null;
    }
    if (PlaybackState.poiChipTimer) {
        clearTimeout(PlaybackState.poiChipTimer);
        PlaybackState.poiChipTimer = null;
    }
}

// Dismissing (by any means) means "don't ask again for this highlight" —
// distinct from removePoiChip, which just tears down the DOM/timer and is
// also used when the highlight's own timestamp arrives naturally.
function dismissPoiChip(): void {
    PlaybackState.poiShown = true;
    removePoiChip();
}

export function showPoiChip(segment: Segment): void {
    if (PlaybackState.poiChipEl) return;
    const jumpBtn = h('button', {
        text: `★ Jump to highlight`,
        onclick: () => {
            const video = getVideo();
            if (video) video.currentTime = segment.start;
            dismissPoiChip();
        },
    });
    const closeBtn = h('button', {
        class: 'sbm-poi-chip-close',
        text: '×',
        onclick: () => dismissPoiChip(),
    });
    const chip = h('div', { class: 'sbm-poi-chip' }, [jumpBtn, closeBtn]);
    const rect = getPlayerRect();
    chip.style.left = (rect.left + rect.width / 2) + 'px';
    chip.style.top = (rect.top + 14) + 'px';
    document.body.appendChild(chip);
    PlaybackState.poiChipEl = chip;
    PlaybackState.poiChipTimer = setTimeout(withErrorReporting('poi chip auto-dismiss', dismissPoiChip), POI_CHIP_AUTO_DISMISS_MS);
}
