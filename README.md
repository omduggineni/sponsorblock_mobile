# SponsorBlock for YouTube Mobile

A single-file [Tampermonkey](https://www.tampermonkey.net/) userscript that brings SponsorBlock to
`m.youtube.com` (the mobile web player). It talks to the same public, crowdsourced database as the
[official SponsorBlock extension](https://github.com/ajayyy/SponsorBlock) — this is an independent,
community port built for touch screens, not an official SponsorBlock release.

## Install

1. Install Tampermonkey (or any GM-compatible userscript manager) in a mobile browser that supports
   extensions (e.g. Firefox for Android, Kiwi Browser, or desktop Chrome/Firefox for testing).
2. Open [`sponsorblock-mobile.user.js`](./sponsorblock-mobile.user.js) and install it, or create a new
   script in Tampermonkey and paste the contents in.
3. Open `https://m.youtube.com/watch?v=...` and play a video.

`sponsorblock-mobile.user.js` at the repo root is the file to install — a single, plain-JS file with
no dependencies at install time. It's built from the TypeScript sources in `src/`; see
[Development](#development) if you want to change the code.

## Features

- **Auto-skip** sponsor, self-promo, interaction reminders, intros, and outros by default.
- **Manual skip button** for categories you'd rather approve per-segment (preview/recap, hooks,
  highlights by default) — a pill button appears while the segment is active; tap it to jump past.
- **Mute segments** — some categories are submitted as "mute" rather than "skip"; the script mutes
  audio for the segment's duration and restores your previous mute state afterwards.
- **Highlight ("POI") jump** — a "★ Jump to highlight" chip appears before a video's most-replayed
  moment, per SponsorBlock's highlight category.
- **Skip notice with Undo** — every auto-skip shows a toast with an Undo button; tapping it seeks back
  and remembers your choice so that segment won't be skipped again for the rest of that video.
- **Voting** — thumbs up/down on the skip toast for single-segment skips.
- **Segment submission** — a `+` button opens a bottom sheet to mark a segment's start/end (or a single
  highlight point), pick a category, and submit it to the SponsorBlock database.
- **Colored segments on the seek bar** — matches the official extension's category colors.
- **Settings panel** — a `⚙` button opens per-category controls (Off / Manual / Auto-skip), a master
  enable switch, a seek-bar-overlay toggle, a server address override, and running stats (segments
  skipped, time saved).
- Works across YouTube's in-page (SPA) navigation — moving from video to video doesn't require a
  page reload for the script to pick up the new video's segments.

## Scope decisions (what this port deliberately leaves out)

This is a from-scratch reimplementation focused on what matters on a phone, not a line-for-line port
of the desktop extension. Deliberately out of scope:

- **`chapter` and `exclusive_access` categories** — these are DeArrow/paid-video-adjacent features of
  the official extension, not core SponsorBlock skipping.
- **Persisted draft submissions** — segments you've marked but not yet submitted live in memory only
  and are lost if the tab closes. Mobile tabs get closed/reloaded often enough that persisting a
  half-finished submission felt like more surface area than it was worth.
- **DeArrow (title/thumbnail crowdsourcing)** — a separate project/extension upstream; not attempted
  here.

Default category behavior (all changeable in Settings): `sponsor`, `selfpromo`, `interaction`,
`intro`, `outro` auto-skip; `poi_highlight` shows a manual control; `preview`, `hook`, `filler`, and
`music_offtopic` are off by default — they're the most subjective/marginal categories, and a manual
skip button is only useful once you've deliberately turned it on for one, rather than appearing
unprompted on a fresh install.

## How it talks to SponsorBlock

- Segments are fetched via the privacy-preserving hash-prefix endpoint
  (`GET /api/skipSegments/:hashPrefix`, where the prefix is the first 5 hex characters of
  `sha256(videoID)`), so the server never sees the full video ID you're watching.
- Voting and submission use the standard `POST /api/voteOnSponsorTime` and `POST /api/skipSegments`
  endpoints, with a random per-install `userID` generated locally (same model as the official
  extension).
- Default server is `https://sponsor.ajay.app`; changeable in Settings for self-hosted servers.

## Testing notes

This script was developed against real `m.youtube.com` markup and a real (read-only) SponsorBlock
video with known segments, driven via Playwright:

- Segment fetch, auto-skip (including the "segment starts at t=0" race), chained back-to-back skips,
  Undo/override behavior, manual skip buttons, mute segments, the highlight chip, the settings panel,
  the submission sheet, voting, and SPA navigation between videos were all exercised against the live
  site.
- Network **writes** (`/api/skipSegments` POST, `/api/voteOnSponsorTime`, `/api/viewedVideoSponsorTime`)
  were intercepted and mocked during testing so no synthetic data was ever sent to the production
  SponsorBlock database. Segment **reads** were left live.

## Development

The runtime logic lives in TypeScript modules under `src/`, split by concern:

- `constants.ts` / `types.ts` / `gm.d.ts` — category definitions, shared types, ambient `GM_*` declarations
- `config.ts` — settings storage (GM storage or `localStorage`), the `Config` object
- `youtube.ts` — reading the mobile player's DOM (video element, ad state, seek bar, player rect)
- `sponsorblock-api.ts` — talking to the SponsorBlock server (fetch/vote/submit, the hash-prefix lookup)
- `dom.ts` / `styles.ts` — a tiny `h()` element builder and the injected CSS
- `state.ts` / `playback.ts` — per-video playback state and the skip/mute/highlight/navigation logic
- `ui/` — the toast, manual skip button, highlight chip, seek-bar overlay, settings panel, submission
  sheet, and floating action buttons
- `main.ts` — wires everything together; this is the only module allowed to run anything at load time
  (guards, style injection, `GM_registerMenuCommand`, boot), so that merely importing any other module
  is always side-effect-free

`npm run build` (`tsc --noEmit` for type-checking, then an esbuild bundle) compiles all of it back into
the single `sponsorblock-mobile.user.js` at the repo root — the exact same file Tampermonkey installs,
metadata block included. There's no separate `dist/`; the build output *is* the committed, installable
file, so always run `npm run build` and commit the result after editing anything in `src/`.

```sh
npm install
npm run build       # type-checks, then rebuilds sponsorblock-mobile.user.js
npm run typecheck   # type-check only, no build
```

## Credit

Built with the [ajayyy/SponsorBlock](https://github.com/ajayyy/SponsorBlock) source as a reference for
category definitions, colors, and API shapes. All code here is an independent reimplementation.
