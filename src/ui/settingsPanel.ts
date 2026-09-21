import { Config } from '../config';
import { CATEGORIES, DEFAULT_SERVER } from '../constants';
import { formatTime, h } from '../dom';
import { loadVideo } from '../playback';
import { segmentCache } from '../sponsorblock-api';
import { PlaybackState } from '../state';
import type { CategoryAction } from '../types';
import { ensureProgressOverlay, removeProgressOverlay } from './progressOverlay';

let settingsScreen: HTMLElement | null = null;

export function closeSettings(): void {
    if (settingsScreen) {
        settingsScreen.remove();
        settingsScreen = null;
    }
}

export function openSettings(): void {
    closeSettings();

    const rows = CATEGORIES.map((cat) => {
        const current = Config.categoryActions[cat.key];
        const options: Array<[CategoryAction, string]> = cat.isPoi
            ? [['off', 'Off'], ['notify', 'Show'], ['skip', 'Auto-jump']]
            : [['off', 'Off'], ['notify', 'Manual'], ['skip', 'Auto-skip']];

        const toggle = h('div', { class: 'sbm-seg-toggle' }, options.map(([val, text]) =>
            h('button', {
                text,
                class: val === current ? 'active' : '',
                onclick: (e: Event) => {
                    Config.setCategoryAction(cat.key, val);
                    for (const b of Array.from(toggle.children)) b.classList.remove('active');
                    (e.target as HTMLElement).classList.add('active');
                    segmentCache.delete(PlaybackState.videoID ?? '');
                    if (PlaybackState.videoID) loadVideo(PlaybackState.videoID);
                },
            })
        ));

        return h('div', { class: 'sbm-row' }, [
            h('div', { class: 'sbm-row-label' }, [
                h('b', {}, [
                    cat.name,
                    h('sup', { class: 'sbm-cat-swatch', style: `background:${cat.color};` }),
                ]),
                h('a', {
                    href: `https://wiki.sponsor.ajay.app/w/${encodeURIComponent(cat.name.replace(/ /g, '_'))}`,
                    target: '_blank',
                    rel: 'noopener',
                    text: 'wiki',
                }),
            ]),
            toggle,
        ]);
    });

    const enableSwitch = h('label', { class: 'sbm-switch' }, [
        h('input', Object.assign({ type: 'checkbox', onchange: (e: Event) => {
            Config.enabled = (e.target as HTMLInputElement).checked;
            Config.save('enabled');
        } }, Config.enabled ? { checked: 'checked' } : {})),
        h('span', { class: 'track' }),
        h('span', { class: 'thumb' }),
    ]);

    const progressBarSwitch = h('label', { class: 'sbm-switch' }, [
        h('input', Object.assign({ type: 'checkbox', onchange: (e: Event) => {
            Config.showProgressBarSegments = (e.target as HTMLInputElement).checked;
            Config.save('showProgressBarSegments');
            if (!(e.target as HTMLInputElement).checked) removeProgressOverlay();
            else ensureProgressOverlay();
        } }, Config.showProgressBarSegments ? { checked: 'checked' } : {})),
        h('span', { class: 'track' }),
        h('span', { class: 'thumb' }),
    ]);

    const serverInput = h('input', {
        type: 'text',
        value: Config.serverAddress,
        onchange: (e: Event) => {
            Config.serverAddress = (e.target as HTMLInputElement).value.replace(/\/$/, '') || DEFAULT_SERVER;
            Config.save('serverAddress');
            segmentCache.clear();
        },
    });

    const stats = h('div', { class: 'sbm-stats' }, [
        h('div', {}, [h('b', { text: String(Config.stats.segmentsSkipped) }), h('span', { text: 'segments skipped' })]),
        h('div', {}, [h('b', { text: formatTime(Config.stats.secondsSaved) }), h('span', { text: 'time saved' })]),
    ]);

    const sheet = h('div', { class: 'sbm-sheet' }, [
        h('h2', {}, [
            document.createTextNode('SponsorBlock Settings'),
            h('button', { class: 'sbm-close', text: '✕', onclick: closeSettings }),
        ]),
        h('div', { class: 'sbm-row' }, [h('div', { class: 'sbm-row-label' }, [h('b', { text: 'Enabled' })]), enableSwitch]),
        h('div', { class: 'sbm-row' }, [h('div', { class: 'sbm-row-label' }, [h('b', { text: 'Show segments on seek bar' })]), progressBarSwitch]),
        stats,
        h('button', { class: 'sbm-btn-secondary', text: 'Reset stats', onclick: () => {
            Config.resetStats();
            closeSettings();
            openSettings();
        } }),
        h('div', { class: 'sbm-row-label', style: 'margin-top:20px;' }, [
            h('b', { text: 'Categories' }),
        ]),
        ...rows,
        h('div', { class: 'sbm-row-label', style: 'margin-top:14px;' }, [
            h('b', { text: 'Server address' }),
            serverInput,
        ]),
    ]);

    settingsScreen = h('div', { class: 'sbm-overlay-screen', onclick: (e: Event) => { if (e.target === settingsScreen) closeSettings(); } }, [sheet]);
    document.body.appendChild(settingsScreen);
}
