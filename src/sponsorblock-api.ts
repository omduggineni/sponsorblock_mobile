import { Config, hasGM } from './config';
import { CATEGORY_KEYS, USER_AGENT } from './constants';
import type { PendingSegment, RequestResult, Segment } from './types';

export async function sha256Hex(input: string): Promise<string> {
    const data = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

function buildQuery(params?: Record<string, unknown>): string {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(params || {})) {
        if (v === undefined || v === null) continue;
        usp.set(k, typeof v === 'string' ? v : JSON.stringify(v));
    }
    const qs = usp.toString();
    return qs ? '?' + qs : '';
}

interface RequestOptions {
    params?: Record<string, unknown>;
    body?: unknown;
    headers?: Record<string, string>;
}

function request(method: string, path: string, { params, body, headers }: RequestOptions = {}): Promise<RequestResult> {
    const url = Config.serverAddress + path + buildQuery(params);
    const finalHeaders = Object.assign({ 'X-Client-Name': USER_AGENT }, headers || {});

    if (hasGM && typeof GM_xmlhttpRequest === 'function') {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method,
                url,
                headers: body ? Object.assign({ 'Content-Type': 'application/json' }, finalHeaders) : finalHeaders,
                data: body ? JSON.stringify(body) : undefined,
                onload: (res) => resolve({ status: res.status, text: res.responseText }),
                onerror: () => resolve({ status: 0, text: '' }),
                ontimeout: () => resolve({ status: 0, text: '' }),
            });
        });
    }

    const fetchHeaders = body ? Object.assign({ 'Content-Type': 'application/json' }, finalHeaders) : finalHeaders;
    return fetch(url, {
        method,
        headers: fetchHeaders,
        body: body ? JSON.stringify(body) : undefined,
    })
        .then(async (res) => ({ status: res.status, text: await res.text() }))
        .catch(() => ({ status: 0, text: '' }));
}

const segmentCache = new Map<string, { segments: Segment[]; fetchedAt: number }>();
export { segmentCache };
const CACHE_TTL_MS = 3 * 60 * 1000;

function enabledCategoryKeys(): string[] {
    return CATEGORY_KEYS.filter((k) => Config.categoryActions[k] !== 'off');
}

export async function fetchSegments(videoID: string): Promise<Segment[]> {
    const cached = segmentCache.get(videoID);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.segments;
    }

    const categories = enabledCategoryKeys();
    if (categories.length === 0) {
        segmentCache.set(videoID, { segments: [], fetchedAt: Date.now() });
        return [];
    }

    try {
        const hash = (await sha256Hex(videoID)).slice(0, 5);
        const res = await request('GET', '/api/skipSegments/' + hash, {
            params: { categories, actionTypes: ['skip', 'mute', 'poi'] },
        });

        let segments: Segment[] = [];
        if (res.status === 200) {
            const parsed = JSON.parse(res.text);
            const entry = Array.isArray(parsed) ? parsed.find((v) => v.videoID === videoID) : null;
            if (entry && Array.isArray(entry.segments)) {
                segments = entry.segments
                    .map((s: any) => ({
                        uuid: s.UUID,
                        category: s.category,
                        actionType: s.actionType,
                        start: s.segment[0],
                        end: s.segment[1],
                        locked: !!s.locked,
                        votes: s.votes,
                    }))
                    .sort((a: Segment, b: Segment) => a.start - b.start);
            }
        }
        segmentCache.set(videoID, { segments, fetchedAt: Date.now() });
        return segments;
    } catch (e) {
        console.error('[SponsorBlock Mobile] Failed to fetch segments', e);
        return [];
    }
}

export function vote(uuid: string, type: number): Promise<RequestResult> {
    return request('POST', '/api/voteOnSponsorTime', {
        params: { UUID: uuid, userID: Config.userID, type },
    });
}

export function markViewed(uuid: string, videoID: string | null): Promise<RequestResult> {
    return request('POST', '/api/viewedVideoSponsorTime', {
        params: { UUID: uuid, videoID },
    });
}

export function submitSegments(videoID: string | null, segments: PendingSegment[], videoDuration: number): Promise<RequestResult> {
    return request('POST', '/api/skipSegments', {
        body: {
            videoID,
            userID: Config.userID,
            videoDuration,
            userAgent: USER_AGENT,
            segments: segments.map((s) => ({
                segment: [s.start, s.end],
                category: s.category,
                actionType: s.actionType,
            })),
        },
    });
}
