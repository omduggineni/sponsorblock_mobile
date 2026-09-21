// DOM/URL helpers for reading YouTube's mobile player state.

export function getVideoIDFromURL(href: string): string | null {
    try {
        const url = new URL(href);
        if (url.searchParams.has('v')) return url.searchParams.get('v');
        const shortsMatch = url.pathname.match(/\/shorts\/([\w-]{11})/);
        if (shortsMatch) return shortsMatch[1];
        const liveMatch = url.pathname.match(/\/live\/([\w-]{11})/);
        if (liveMatch) return liveMatch[1];
        return null;
    } catch (e) {
        return null;
    }
}

export function getPlayer(): HTMLElement | null {
    return document.getElementById('movie_player');
}

export function getVideo(): HTMLVideoElement | null {
    const player = getPlayer();
    return (player && player.querySelector('video')) || document.querySelector('video');
}

export function isAdShowing(): boolean {
    const player = getPlayer();
    return !!player && player.classList.contains('ad-showing');
}

export function playerContainer(): HTMLElement {
    return getPlayer() || document.body;
}

// YouTube's own control layers (scrims, gradients) live inside #movie_player
// and get re-created on every autohide/show cycle, so anything we append as
// a *descendant* of the player can end up behind them or have its taps
// swallowed. Instead we anchor fixed-position elements to the player's
// on-screen rect but append them to <body>, which keeps them in their own
// top-level stacking context above the player no matter what YouTube does
// internally.
export function getPlayerRect(): DOMRect | { top: number; left: number; right: number; width: number; height: number } {
    const player = getPlayer();
    if (player) {
        const rect = player.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) return rect;
    }
    return { top: 0, left: 0, right: window.innerWidth, width: window.innerWidth, height: Math.round(window.innerWidth * 9 / 16) };
}

export function findProgressBarHost(): Element | null {
    const hosts = document.querySelectorAll('yt-progress-bar.ytPlayerProgressBarHost');
    if (!hosts.length) return null;
    for (const el of hosts) {
        if (el.classList.contains('watch-page-progress-bar')) return el;
    }
    return hosts[0];
}
