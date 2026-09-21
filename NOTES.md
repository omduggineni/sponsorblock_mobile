# Maintainer notes

## Upstream tracking

This port's category list, colors, and SponsorBlock API request/response shapes
(`src/constants.ts`'s `CATEGORIES`, `src/sponsorblock-api.ts`) were last checked against:

- **Repo:** [ajayyy/SponsorBlock](https://github.com/ajayyy/SponsorBlock)
- **Commit:** [`914e2c88d4f80be9bcf3b3299f155c703ee99061`](https://github.com/ajayyy/SponsorBlock/commit/914e2c88d4f80be9bcf3b3299f155c703ee99061)
- **Relative to release tag:** 5 commits past `6.1.7`
- **Date:** 2026-09-13

If upstream has moved since, diff from that commit to see what's changed — categories added/removed,
color or API shape changes are the ones that matter here. Update this note (commit, tag offset, date)
whenever that comparison is redone, whether or not it results in code changes.
