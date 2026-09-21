import { h } from '../dom';
import { PlaybackState } from '../state';
import type { Segment } from '../types';
import { getPlayerRect, getVideo } from '../youtube';

export function removePoiChip(): void {
    if (PlaybackState.poiChipEl) {
        PlaybackState.poiChipEl.remove();
        PlaybackState.poiChipEl = null;
    }
}

export function showPoiChip(segment: Segment): void {
    if (PlaybackState.poiChipEl) return;
    const chip = h('button', {
        class: 'sbm-poi-chip',
        text: `★ Jump to highlight`,
        onclick: () => {
            const video = getVideo();
            if (video) video.currentTime = segment.start;
            removePoiChip();
            PlaybackState.poiShown = true;
        },
    });
    const rect = getPlayerRect();
    chip.style.left = (rect.left + rect.width / 2) + 'px';
    chip.style.top = (rect.top + 14) + 'px';
    document.body.appendChild(chip);
    PlaybackState.poiChipEl = chip;
}
