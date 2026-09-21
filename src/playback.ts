import { Config } from './config';
import { POI_CHIP_LEAD_IN_SECONDS, SKIP_EPSILON } from './constants';
import { fetchSegments, markViewed } from './sponsorblock-api';
import { PlaybackState, resetPlaybackState } from './state';
import type { Segment } from './types';
import { showManualButton, removeManualButton } from './ui/manualButton';
import { showPoiChip, removePoiChip } from './ui/poiChip';
import { ensureProgressOverlay } from './ui/progressOverlay';
import { showSkipToast } from './ui/toast';
import { ensureActionBarButton, updateFabVisibility } from './ui/fab';
import { getVideo, getVideoIDFromURL, isAdShowing } from './youtube';

/* ------------------------------------------------------------------ *
 *  Skip chaining: given a list of skip-type segments and a start time,
 *  find the furthest end time reachable through overlapping/adjacent
 *  segments (so back-to-back sponsor+selfpromo skips as one jump).
 * ------------------------------------------------------------------ */

export function chainSkipSegments(sortedSkipSegments: Segment[], index: number): { end: number; involved: Segment[] } {
    const involved = [sortedSkipSegments[index]];
    let end = sortedSkipSegments[index].end;
    for (let i = index + 1; i < sortedSkipSegments.length; i++) {
        const seg = sortedSkipSegments[i];
        if (seg.start > end + 0.5) break;
        // Only fold in segments that are ALSO set to auto-skip. Chaining
        // must never silently skip through a segment the user disabled,
        // chose to watch anyway (Undo), or wants to approve manually
        // (notify) — those still need their own pass through tick().
        if (activeCategoryAction(seg.category) !== 'skip') continue;
        if (PlaybackState.overriddenUUIDs.has(seg.uuid)) continue;
        end = Math.max(end, seg.end);
        involved.push(seg);
    }
    return { end, involved };
}

// Seeking to within a fraction of a second of a video's true duration can
// leave YouTube's mobile player stuck in a "seeking" state forever
// (currentTime updates, but it never resumes playback or fires `ended`,
// so nothing visually happens). A segment that runs to the end of the
// video is effectively "skip to the end" anyway, so land safely short of
// the boundary instead of exactly on it.
const END_OF_VIDEO_SEEK_MARGIN = 0.75;

export function safeSeekTarget(time: number, video: HTMLVideoElement): number {
    if (isFinite(video.duration) && video.duration > 0 && time >= video.duration - END_OF_VIDEO_SEEK_MARGIN) {
        return Math.max(0, video.duration - END_OF_VIDEO_SEEK_MARGIN);
    }
    return time;
}

/* ------------------------------------------------------------------ *
 *  Main per-frame check
 * ------------------------------------------------------------------ */

export function activeCategoryAction(category: string): string {
    return Config.categoryActions[category] || 'off';
}

export function tick(): void {
    window.requestAnimationFrame(tick);

    if (!Config.enabled) return;
    const video = getVideo();
    if (!video || isAdShowing() || video.paused) return;

    const currentVideoID = getVideoIDFromURL(location.href);
    if (currentVideoID !== PlaybackState.videoID) return; // navigation handled by poller

    const t = video.currentTime;

    handleMuteSegments(video, t);
    handleSkipSegments(video, t);
    handlePoi(video, t);
}

export function handleMuteSegments(video: HTMLVideoElement, t: number): void {
    const muteSegs = PlaybackState.segments.filter(
        (s) => s.actionType === 'mute' && activeCategoryAction(s.category) !== 'off' && !PlaybackState.overriddenUUIDs.has(s.uuid)
    );
    const active = muteSegs.find((s) => t >= s.start - SKIP_EPSILON && t < s.end);

    if (active && PlaybackState.activeMuteUUID !== active.uuid) {
        PlaybackState.wasMutedBeforeSegment = video.muted;
        video.muted = true;
        PlaybackState.activeMuteUUID = active.uuid;
    } else if (!active && PlaybackState.activeMuteUUID) {
        video.muted = PlaybackState.wasMutedBeforeSegment;
        PlaybackState.activeMuteUUID = null;
    }
}

export function handleSkipSegments(video: HTMLVideoElement, t: number): void {
    const skipSegs = PlaybackState.segments
        .filter((s) => s.actionType === 'skip')
        .sort((a, b) => a.start - b.start);

    for (let i = 0; i < skipSegs.length; i++) {
        const seg = skipSegs[i];
        const action = activeCategoryAction(seg.category);
        if (action === 'off') continue;
        if (PlaybackState.overriddenUUIDs.has(seg.uuid)) continue;
        if (action === 'skip' && PlaybackState.autoSkippedUUIDs.has(seg.uuid)) continue;
        if (t < seg.start - SKIP_EPSILON || t >= seg.end) continue;

        if (action === 'skip') {
            const { end, involved } = chainSkipSegments(skipSegs, i);
            if (end <= t) continue;
            const from = t;
            const target = safeSeekTarget(end, video);
            video.currentTime = target;
            // Mark every involved segment as handled even though the
            // end-of-video safety clamp can land us back inside its
            // numeric range — otherwise the next tick sees "still inside
            // an un-skipped segment" and re-fires, causing a seek loop.
            for (const s of involved) PlaybackState.autoSkippedUUIDs.add(s.uuid);
            Config.addStats(target - from);
            showSkipToast(involved, from);
            for (const s of involved) markViewed(s.uuid, PlaybackState.videoID);
            return;
        } else if (action === 'notify') {
            if (PlaybackState.shownManualUUIDs.has(seg.uuid)) continue;
            const { end } = chainSkipSegments(skipSegs, i);
            showManualButton(seg, end);
            return;
        }
    }

    // No active segment right now -> hide a stale manual button.
    if (PlaybackState.manualBtnUUID) {
        const stillActive = skipSegs.some(
            (s) => s.uuid === PlaybackState.manualBtnUUID && t >= s.start - SKIP_EPSILON && t < s.end
        );
        if (!stillActive) removeManualButton();
    }
}

export function handlePoi(video: HTMLVideoElement, t: number): void {
    const poi = PlaybackState.segments.find((s) => s.actionType === 'poi');
    if (!poi) return;
    const action = activeCategoryAction(poi.category);
    if (action === 'off') return;

    if (action === 'skip' && !PlaybackState.poiAutoJumped && t < poi.start && t < 3) {
        PlaybackState.poiAutoJumped = true;
        video.currentTime = poi.start;
        return;
    }

    // Only show the chip in a short lead-up window before the highlight,
    // not from the moment the video starts — a highlight 10 minutes in
    // shouldn't nag the viewer for the entire first 10 minutes.
    const leadInStart = Math.max(0, poi.start - POI_CHIP_LEAD_IN_SECONDS);
    if (!PlaybackState.poiShown && !PlaybackState.poiChipEl && t >= leadInStart && t < poi.start - 1) {
        showPoiChip(poi);
    }
    if (PlaybackState.poiChipEl && (t >= poi.start - 1 || t < leadInStart)) {
        removePoiChip();
    }
}

/* ------------------------------------------------------------------ *
 *  Navigation / lifecycle
 * ------------------------------------------------------------------ */

export async function loadVideo(videoID: string): Promise<void> {
    resetPlaybackState(videoID);
    const segments = await fetchSegments(videoID);
    // Only apply if we're still on the same video (fetch can race navigation).
    if (PlaybackState.videoID !== videoID) return;
    PlaybackState.segments = segments;

    // Retro-check: if playback is already inside a segment that just
    // arrived (e.g. a segment starting at 0), act on it immediately
    // instead of waiting for the segment to already be behind us.
    const video = getVideo();
    if (video && !isAdShowing()) {
        handleSkipSegments(video, video.currentTime);
        handleMuteSegments(video, video.currentTime);
    }
    ensureProgressOverlay();
    ensureActionBarButton();
    updateFabVisibility();
}

let lastURL: string | null = null;
let lastVideoElement: HTMLVideoElement | null = null;

export function pollNavigation(): void {
    const href = location.href;
    const videoID = getVideoIDFromURL(href);

    if (href !== lastURL) {
        lastURL = href;
        if (videoID !== PlaybackState.videoID) {
            if (videoID) loadVideo(videoID);
            else resetPlaybackState(null);
        }
    }

    // The player sometimes swaps its <video> element on navigation;
    // make sure our per-video state matches whichever element is live.
    const video = getVideo();
    if (video && video !== lastVideoElement) {
        lastVideoElement = video;
        if (videoID && videoID === PlaybackState.videoID) {
            handleSkipSegments(video, video.currentTime);
        }
    }

    ensureProgressOverlay();
    ensureActionBarButton();
    updateFabVisibility();
}
