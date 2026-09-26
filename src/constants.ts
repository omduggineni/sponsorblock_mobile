import type { CategoryDef } from './types';

export const DEFAULT_SERVER = 'https://sponsor.ajay.app';
export const USER_AGENT = 'github/omduggineni/sponsorblock_mobile';
export const STORAGE_PREFIX = 'sbm_';
export const SKIP_EPSILON = 0.15; // seconds of slack when deciding "are we inside this segment"
export const TOAST_DURATION_MS = 4000;
export const POI_CHIP_LEAD_IN_SECONDS = 20; // how early the highlight chip appears before its timestamp

// Categories we support, in the order they're shown in the settings panel.
// action: "skip" (auto-skip), "notify" (show a manual skip button), "off"
export const CATEGORIES: CategoryDef[] = [
    { key: 'sponsor', name: 'Sponsor', color: '#00d400', supportsMute: true, default: 'skip' },
    { key: 'selfpromo', name: 'Unpaid/Self Promotion', color: '#ffff00', supportsMute: true, default: 'skip' },
    { key: 'interaction', name: 'Interaction Reminder', color: '#cc00ff', supportsMute: true, default: 'skip' },
    { key: 'intro', name: 'Intermission/Intro', color: '#00ffff', supportsMute: true, default: 'skip' },
    { key: 'outro', name: 'Endcards/Credits', color: '#0202ed', supportsMute: true, default: 'skip' },
    { key: 'preview', name: 'Preview/Recap', color: '#008fd6', supportsMute: true, default: 'off' },
    { key: 'hook', name: 'Hook/Greeting', color: '#395699', supportsMute: true, default: 'off' },
    { key: 'filler', name: 'Tangents/Jokes', color: '#7300ff', supportsMute: true, default: 'off' },
    { key: 'music_offtopic', name: 'Non-Music Section', color: '#ff9900', supportsMute: false, default: 'off' },
    { key: 'poi_highlight', name: 'Highlight', color: '#ff1684', supportsMute: false, default: 'notify', isPoi: true },
];
export const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.key, c]));
export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);
