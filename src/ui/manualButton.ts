import { Config } from '../config';
import { categoryLabel, h } from '../dom';
import { safeSeekTarget } from '../playback';
import { markViewed } from '../sponsorblock-api';
import { PlaybackState } from '../state';
import type { Segment } from '../types';
import { getPlayerRect, getVideo } from '../youtube';

export function removeManualButton(): void {
    if (PlaybackState.manualBtnEl) {
        PlaybackState.manualBtnEl.remove();
        PlaybackState.manualBtnEl = null;
        PlaybackState.manualBtnUUID = null;
    }
}

export function showManualButton(segment: Segment, chainEnd: number): void {
    if (PlaybackState.manualBtnUUID === segment.uuid) return;
    removeManualButton();

    const btn = h('button', {
        class: 'sbm-manual-btn',
        onclick: () => {
            const video = getVideo();
            if (video) {
                const from = video.currentTime;
                const target = safeSeekTarget(chainEnd, video);
                video.currentTime = target;
                Config.addStats(target - from);
                markViewed(segment.uuid, PlaybackState.videoID);
            }
            PlaybackState.shownManualUUIDs.add(segment.uuid);
            removeManualButton();
        },
    }, [document.createTextNode(`Skip ${categoryLabel(segment.category)} ▶`)]);

    const rect = getPlayerRect();
    btn.style.left = (rect.left + rect.width - 12) + 'px';
    btn.style.top = (rect.top + rect.height * 0.72) + 'px';
    btn.style.transform = 'translateX(-100%)';
    document.body.appendChild(btn);
    PlaybackState.manualBtnEl = btn;
    PlaybackState.manualBtnUUID = segment.uuid;
}
