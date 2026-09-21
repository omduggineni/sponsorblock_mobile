import { removeManualButton } from './ui/manualButton';
import { removePoiChip } from './ui/poiChip';
import { removeProgressOverlay } from './ui/progressOverlay';
import { removeToast } from './ui/toast';
import type { PendingSegment, Segment } from './types';

export interface PlaybackStateShape {
    videoID: string | null;
    segments: Segment[];
    overriddenUUIDs: Set<string>; // segments the user chose to un-skip / watch anyway, for this video
    autoSkippedUUIDs: Set<string>; // segments already auto-skipped once this video (don't re-trigger even if the landed time is still nominally "inside" the segment, e.g. an end-of-video safety clamp)
    shownManualUUIDs: Set<string>; // manual-skip buttons already dismissed once (avoid re-popping mid-segment)
    poiShown: boolean;
    poiAutoJumped: boolean;
    activeMuteUUID: string | null;
    wasMutedBeforeSegment: boolean;
    pendingSubmission: PendingSegment[];
    toastEl: HTMLElement | null;
    toastTimer: ReturnType<typeof setTimeout> | null;
    manualBtnEl: HTMLElement | null;
    manualBtnUUID: string | null;
    poiChipEl: HTMLElement | null;
}

export const PlaybackState: PlaybackStateShape = {
    videoID: null,
    segments: [],
    overriddenUUIDs: new Set(),
    autoSkippedUUIDs: new Set(),
    shownManualUUIDs: new Set(),
    poiShown: false,
    poiAutoJumped: false,
    activeMuteUUID: null,
    wasMutedBeforeSegment: false,
    pendingSubmission: [],
    toastEl: null,
    toastTimer: null,
    manualBtnEl: null,
    manualBtnUUID: null,
    poiChipEl: null,
};

export function resetPlaybackState(newVideoID: string | null): void {
    PlaybackState.videoID = newVideoID;
    PlaybackState.segments = [];
    PlaybackState.overriddenUUIDs = new Set();
    PlaybackState.autoSkippedUUIDs = new Set();
    PlaybackState.shownManualUUIDs = new Set();
    PlaybackState.poiShown = false;
    PlaybackState.poiAutoJumped = false;
    PlaybackState.activeMuteUUID = null;
    PlaybackState.wasMutedBeforeSegment = false;
    PlaybackState.pendingSubmission = [];
    removeToast();
    removeManualButton();
    removePoiChip();
    removeProgressOverlay();
}
