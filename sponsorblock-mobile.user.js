// ==UserScript==
// @name         SponsorBlock for YouTube Mobile
// @namespace    https://github.com/sponsorblock-mobile
// @version      1.0.0
// @description  Skips sponsor segments, self-promo, intros and more on m.youtube.com using the crowdsourced SponsorBlock database. Includes submission, voting, and a settings panel built for touch.
// @author       SponsorBlock Mobile (community port)
// @match        https://m.youtube.com/*
// @match        https://www.youtube.com/*
// @icon         https://sponsor.ajay.app/favicon.ico
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @connect      sponsor.ajay.app
// @run-at       document-start
// ==/UserScript==

"use strict";
(() => {
  // src/constants.ts
  var DEFAULT_SERVER = "https://sponsor.ajay.app";
  var USER_AGENT = "SponsorBlockMobileUserscript/1.0.0";
  var STORAGE_PREFIX = "sbm_";
  var SKIP_EPSILON = 0.15;
  var TOAST_DURATION_MS = 4e3;
  var POI_CHIP_LEAD_IN_SECONDS = 20;
  var CATEGORIES = [
    { key: "sponsor", name: "Sponsor", color: "#00d400", supportsMute: true, default: "skip" },
    { key: "selfpromo", name: "Unpaid/Self Promotion", color: "#ffff00", supportsMute: true, default: "skip" },
    { key: "interaction", name: "Interaction Reminder", color: "#cc00ff", supportsMute: true, default: "skip" },
    { key: "intro", name: "Intermission/Intro", color: "#00ffff", supportsMute: true, default: "skip" },
    { key: "outro", name: "Endcards/Credits", color: "#0202ed", supportsMute: true, default: "skip" },
    { key: "preview", name: "Preview/Recap", color: "#008fd6", supportsMute: true, default: "off" },
    { key: "hook", name: "Hook/Greeting", color: "#395699", supportsMute: true, default: "off" },
    { key: "filler", name: "Tangents/Jokes", color: "#7300ff", supportsMute: true, default: "off" },
    { key: "music_offtopic", name: "Non-Music Section", color: "#ff9900", supportsMute: false, default: "off" },
    { key: "poi_highlight", name: "Highlight", color: "#ff1684", supportsMute: false, default: "notify", isPoi: true }
  ];
  var CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.key, c]));
  var CATEGORY_KEYS = CATEGORIES.map((c) => c.key);

  // src/config.ts
  var hasGM = typeof GM_getValue === "function" && typeof GM_setValue === "function";
  function storageGet(key, fallback) {
    try {
      if (hasGM) {
        const v = GM_getValue(key, void 0);
        return v === void 0 ? fallback : v;
      }
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }
  function storageSet(key, value) {
    try {
      if (hasGM) {
        GM_setValue(key, value);
      } else {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      }
    } catch (e) {
    }
  }
  function defaultCategoryActions() {
    const out = {};
    for (const c of CATEGORIES) out[c.key] = c.default;
    return out;
  }
  function generateUserID() {
    const bytes = new Uint8Array(20);
    (window.crypto || window.msCrypto).getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  var Config = {
    enabled: true,
    serverAddress: DEFAULT_SERVER,
    categoryActions: defaultCategoryActions(),
    userID: null,
    minDuration: 0,
    stats: { segmentsSkipped: 0, secondsSaved: 0 },
    showProgressBarSegments: true,
    save(key) {
      storageSet(key, this[key]);
    },
    setCategoryAction(key, action) {
      this.categoryActions[key] = action;
      storageSet("categoryActions", this.categoryActions);
    },
    addStats(secondsSaved) {
      this.stats.segmentsSkipped += 1;
      this.stats.secondsSaved += Math.max(0, secondsSaved);
      storageSet("stats", this.stats);
    },
    resetStats() {
      this.stats = { segmentsSkipped: 0, secondsSaved: 0 };
      storageSet("stats", this.stats);
    }
  };
  function initConfig() {
    Config.enabled = storageGet("enabled", true);
    Config.serverAddress = storageGet("serverAddress", DEFAULT_SERVER);
    Config.categoryActions = Object.assign(defaultCategoryActions(), storageGet("categoryActions", {}));
    Config.userID = storageGet("userID", null);
    Config.minDuration = storageGet("minDuration", 0);
    Config.stats = storageGet("stats", { segmentsSkipped: 0, secondsSaved: 0 });
    Config.showProgressBarSegments = storageGet("showProgressBarSegments", true);
    if (!Config.userID) {
      Config.userID = generateUserID();
      storageSet("userID", Config.userID);
    }
  }

  // src/sponsorblock-api.ts
  async function sha256Hex(input) {
    const data = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  }
  function buildQuery(params) {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(params || {})) {
      if (v === void 0 || v === null) continue;
      usp.set(k, typeof v === "string" ? v : JSON.stringify(v));
    }
    const qs = usp.toString();
    return qs ? "?" + qs : "";
  }
  function request(method, path, { params, body, headers } = {}) {
    const url = Config.serverAddress + path + buildQuery(params);
    const finalHeaders = Object.assign({ "X-Client-Name": USER_AGENT }, headers || {});
    if (hasGM && typeof GM_xmlhttpRequest === "function") {
      return new Promise((resolve) => {
        GM_xmlhttpRequest({
          method,
          url,
          headers: body ? Object.assign({ "Content-Type": "application/json" }, finalHeaders) : finalHeaders,
          data: body ? JSON.stringify(body) : void 0,
          onload: (res) => resolve({ status: res.status, text: res.responseText }),
          onerror: () => resolve({ status: 0, text: "" }),
          ontimeout: () => resolve({ status: 0, text: "" })
        });
      });
    }
    const fetchHeaders = body ? Object.assign({ "Content-Type": "application/json" }, finalHeaders) : finalHeaders;
    return fetch(url, {
      method,
      headers: fetchHeaders,
      body: body ? JSON.stringify(body) : void 0
    }).then(async (res) => ({ status: res.status, text: await res.text() })).catch(() => ({ status: 0, text: "" }));
  }
  var segmentCache = /* @__PURE__ */ new Map();
  var CACHE_TTL_MS = 3 * 60 * 1e3;
  function enabledCategoryKeys() {
    return CATEGORY_KEYS.filter((k) => Config.categoryActions[k] !== "off");
  }
  async function fetchSegments(videoID) {
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
      const res = await request("GET", "/api/skipSegments/" + hash, {
        params: { categories, actionTypes: ["skip", "mute", "poi"] }
      });
      let segments = [];
      if (res.status === 200) {
        const parsed = JSON.parse(res.text);
        const entry = Array.isArray(parsed) ? parsed.find((v) => v.videoID === videoID) : null;
        if (entry && Array.isArray(entry.segments)) {
          segments = entry.segments.map((s) => ({
            uuid: s.UUID,
            category: s.category,
            actionType: s.actionType,
            start: s.segment[0],
            end: s.segment[1],
            locked: !!s.locked,
            votes: s.votes
          })).sort((a, b) => a.start - b.start);
        }
      }
      segmentCache.set(videoID, { segments, fetchedAt: Date.now() });
      return segments;
    } catch (e) {
      console.error("[SponsorBlock Mobile] Failed to fetch segments", e);
      return [];
    }
  }
  function vote(uuid, type) {
    return request("POST", "/api/voteOnSponsorTime", {
      params: { UUID: uuid, userID: Config.userID, type }
    });
  }
  function markViewed(uuid, videoID) {
    return request("POST", "/api/viewedVideoSponsorTime", {
      params: { UUID: uuid, videoID }
    });
  }
  function submitSegments(videoID, segments, videoDuration) {
    return request("POST", "/api/skipSegments", {
      body: {
        videoID,
        userID: Config.userID,
        videoDuration,
        userAgent: USER_AGENT,
        segments: segments.map((s) => ({
          segment: [s.start, s.end],
          category: s.category,
          actionType: s.actionType
        }))
      }
    });
  }

  // src/styles.ts
  var STYLE = `
    .sbm-toast {
        position: fixed;
        transform: translateX(-50%);
        background: rgba(20, 20, 20, 0.92);
        color: #fff;
        border-radius: 999px;
        padding: 8px 8px 8px 16px;
        display: flex;
        align-items: center;
        gap: 6px;
        font: 13px/1.3 Roboto, Arial, sans-serif;
        z-index: 2147483000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.4);
        max-width: 88%;
        pointer-events: auto;
    }
    .sbm-toast button {
        background: rgba(255,255,255,0.14);
        border: none;
        color: #fff;
        border-radius: 999px;
        padding: 7px 12px;
        font: 600 12px/1 Roboto, Arial, sans-serif;
        min-height: 32px;
        white-space: nowrap;
    }
    .sbm-toast .sbm-vote-btn {
        padding: 7px 9px;
        font-size: 15px;
    }
    .sbm-toast .sbm-vote-btn.sbm-voted { background: #2d7d2d; }
    .sbm-manual-btn {
        position: fixed;
        background: rgba(20, 20, 20, 0.88);
        color: #fff;
        border: none;
        border-radius: 999px;
        padding: 10px 16px;
        font: 600 13px/1 Roboto, Arial, sans-serif;
        z-index: 2147483000;
        display: flex;
        align-items: center;
        gap: 6px;
        pointer-events: auto;
    }
    .sbm-poi-chip {
        position: fixed;
        transform: translateX(-50%);
        background: rgba(20,20,20,0.88);
        color: #fff;
        border: none;
        border-radius: 999px;
        padding: 8px 14px;
        font: 600 12px/1 Roboto, Arial, sans-serif;
        z-index: 2147483000;
        pointer-events: auto;
    }
    .sbm-progress-overlay {
        position: absolute;
        left: 0;
        right: 0;
        /* top/height are set inline to match the real (thin) seek bar line;
           the host element itself is a much taller touch target. */
        top: 50%;
        height: 3px;
        transform: translateY(-50%);
        pointer-events: none;
        z-index: 3;
    }
    .sbm-progress-seg {
        position: absolute;
        top: 0;
        bottom: 0;
        opacity: 0.75;
    }
    .sbm-fab-row {
        position: fixed;
        right: 10px;
        bottom: 90px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 2147483000;
    }
    .sbm-fab {
        width: 46px;
        height: 46px;
        border-radius: 50%;
        background: #1a1a1a;
        color: #fff;
        border: 1px solid rgba(255,255,255,0.2);
        font-size: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
    }
    .sbm-overlay-screen {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.6);
        z-index: 2147483600;
        display: flex;
        align-items: flex-end;
        justify-content: center;
    }
    .sbm-sheet {
        background: #181818;
        color: #fff;
        width: 100%;
        max-width: 560px;
        max-height: 86vh;
        overflow-y: auto;
        border-radius: 16px 16px 0 0;
        padding: 16px 16px calc(16px + env(safe-area-inset-bottom, 0px));
        font: 14px/1.4 Roboto, Arial, sans-serif;
        box-sizing: border-box;
    }
    .sbm-sheet h2 {
        font-size: 17px;
        margin: 0 0 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .sbm-sheet h2 button.sbm-close { background: none; border: none; color: #aaa; font-size: 20px; padding: 4px 8px; }
    .sbm-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        gap: 10px;
    }
    .sbm-row-label { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
    .sbm-row-label b { font-size: 14px; }
    .sbm-row-label a { color: #3ea6ff; font-size: 11px; text-decoration: none; }
    .sbm-seg-toggle {
        display: flex;
        border-radius: 999px;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,0.25);
        flex-shrink: 0;
    }
    .sbm-seg-toggle button {
        background: transparent;
        color: #ccc;
        border: none;
        padding: 7px 10px;
        font: 600 11px/1 Roboto, Arial, sans-serif;
        min-width: 44px;
    }
    .sbm-seg-toggle button.active { background: #3ea6ff; color: #06233a; }
    .sbm-switch { position: relative; width: 42px; height: 24px; flex-shrink: 0; }
    .sbm-switch input { opacity: 0; width: 100%; height: 100%; margin: 0; position: absolute; z-index: 1; }
    .sbm-switch .track { position: absolute; inset: 0; background: #555; border-radius: 999px; transition: background 0.15s; }
    .sbm-switch .thumb { position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform 0.15s; }
    .sbm-switch input:checked ~ .track { background: #3ea6ff; }
    .sbm-switch input:checked ~ .thumb { transform: translateX(18px); }
    .sbm-sheet input[type=text] {
        width: 100%;
        box-sizing: border-box;
        background: #0f0f0f;
        border: 1px solid rgba(255,255,255,0.2);
        color: #fff;
        border-radius: 8px;
        padding: 9px 10px;
        font-size: 13px;
        margin-top: 6px;
    }
    .sbm-btn-primary {
        background: #3ea6ff;
        color: #06233a;
        border: none;
        border-radius: 999px;
        padding: 11px 18px;
        font: 700 13px/1 Roboto, Arial, sans-serif;
        width: 100%;
        margin-top: 14px;
    }
    .sbm-btn-secondary {
        background: rgba(255,255,255,0.1);
        color: #fff;
        border: none;
        border-radius: 999px;
        padding: 10px 14px;
        font: 600 12px/1 Roboto, Arial, sans-serif;
    }
    .sbm-stats { display: flex; gap: 16px; padding: 10px 0; }
    .sbm-stats div { flex: 1; text-align: center; background: rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 6px; }
    .sbm-stats b { display: block; font-size: 18px; }
    .sbm-stats span { font-size: 11px; color: #aaa; }
    .sbm-pending-item { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .sbm-pending-item select { flex: 1; background: #0f0f0f; color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 6px; }
    .sbm-pending-item .sbm-time { font-variant-numeric: tabular-nums; font-size: 12px; color: #ccc; min-width: 92px; }
    .sbm-pending-item button.sbm-del { background: none; border: none; color: #ff6b6b; font-size: 18px; }
    .sbm-mark-row { display: flex; gap: 8px; margin-top: 10px; }
    .sbm-mark-row button { flex: 1; }
    .sbm-toggle-strip { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
    .sbm-toggle-chip { border: 1px solid rgba(255,255,255,0.25); background: transparent; color: #ddd; border-radius: 999px; padding: 6px 10px; font-size: 11px; }
    .sbm-toggle-chip.active { color: #06233a; border-color: transparent; }
    `;
  function injectStyles() {
    if (hasGM && typeof GM_addStyle === "function") {
      GM_addStyle(STYLE);
      return;
    }
    const root = document.head || document.documentElement;
    if (!root) {
      window.requestAnimationFrame(injectStyles);
      return;
    }
    const styleEl = document.createElement("style");
    styleEl.textContent = STYLE;
    root.appendChild(styleEl);
  }

  // src/dom.ts
  function h(tag, attrs, children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    }
    for (const child of children || []) {
      if (child) el.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    }
    return el;
  }
  function formatTime(seconds) {
    seconds = Math.max(0, Math.round(seconds));
    const h_ = Math.floor(seconds / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = seconds % 60;
    const mm = h_ > 0 ? String(m).padStart(2, "0") : String(m);
    const ss = String(s).padStart(2, "0");
    return h_ > 0 ? `${h_}:${mm}:${ss}` : `${mm}:${ss}`;
  }
  function categoryLabel(key) {
    const c = CATEGORY_MAP.get(key);
    return c ? c.name : key;
  }

  // src/youtube.ts
  function getVideoIDFromURL(href) {
    try {
      const url = new URL(href);
      if (url.searchParams.has("v")) return url.searchParams.get("v");
      const shortsMatch = url.pathname.match(/\/shorts\/([\w-]{11})/);
      if (shortsMatch) return shortsMatch[1];
      const liveMatch = url.pathname.match(/\/live\/([\w-]{11})/);
      if (liveMatch) return liveMatch[1];
      return null;
    } catch (e) {
      return null;
    }
  }
  function getPlayer() {
    return document.getElementById("movie_player");
  }
  function getVideo() {
    const player = getPlayer();
    return player && player.querySelector("video") || document.querySelector("video");
  }
  function isAdShowing() {
    const player = getPlayer();
    return !!player && player.classList.contains("ad-showing");
  }
  function getPlayerRect() {
    const player = getPlayer();
    if (player) {
      const rect = player.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return rect;
    }
    return { top: 0, left: 0, right: window.innerWidth, width: window.innerWidth, height: Math.round(window.innerWidth * 9 / 16) };
  }
  function findProgressBarHost() {
    const hosts = document.querySelectorAll("yt-progress-bar.ytPlayerProgressBarHost");
    if (!hosts.length) return null;
    for (const el of hosts) {
      if (el.classList.contains("watch-page-progress-bar")) return el;
    }
    return hosts[0];
  }

  // src/ui/poiChip.ts
  function removePoiChip() {
    if (PlaybackState.poiChipEl) {
      PlaybackState.poiChipEl.remove();
      PlaybackState.poiChipEl = null;
    }
  }
  function showPoiChip(segment) {
    if (PlaybackState.poiChipEl) return;
    const chip = h("button", {
      class: "sbm-poi-chip",
      text: `★ Jump to highlight`,
      onclick: () => {
        const video = getVideo();
        if (video) video.currentTime = segment.start;
        removePoiChip();
        PlaybackState.poiShown = true;
      }
    });
    const rect = getPlayerRect();
    chip.style.left = rect.left + rect.width / 2 + "px";
    chip.style.top = rect.top + 14 + "px";
    document.body.appendChild(chip);
    PlaybackState.poiChipEl = chip;
  }

  // src/ui/progressOverlay.ts
  function removeProgressOverlay() {
    document.querySelectorAll(".sbm-progress-overlay").forEach((el) => el.remove());
  }
  function sizeOverlayToTrack(host, overlay) {
    const line = host.querySelector("yt-progress-bar-line, .ytProgressBarLineHost");
    if (line) {
      const hostRect = host.getBoundingClientRect();
      const lineRect = line.getBoundingClientRect();
      if (hostRect.height > 0 && lineRect.height > 0) {
        overlay.style.top = lineRect.top - hostRect.top + "px";
        overlay.style.height = lineRect.height + "px";
        overlay.style.transform = "none";
        return;
      }
    }
    overlay.style.top = "";
    overlay.style.height = "";
    overlay.style.transform = "";
  }
  function ensureProgressOverlay() {
    if (!Config.showProgressBarSegments) {
      removeProgressOverlay();
      return;
    }
    const video = getVideo();
    const host = findProgressBarHost();
    if (!host || !video || !isFinite(video.duration) || video.duration <= 0) return;
    let overlay = host.querySelector(":scope > .sbm-progress-overlay");
    if (!overlay) {
      if (getComputedStyle(host).position === "static") {
        host.style.position = "relative";
      }
      overlay = h("div", { class: "sbm-progress-overlay" });
      host.appendChild(overlay);
      overlay.dataset.videoId = "";
    }
    sizeOverlayToTrack(host, overlay);
    if (overlay.dataset.videoId === PlaybackState.videoID && overlay.dataset.count === String(PlaybackState.segments.length)) {
      return;
    }
    while (overlay.firstChild) overlay.removeChild(overlay.firstChild);
    const duration = video.duration;
    for (const seg of PlaybackState.segments) {
      if (seg.actionType === "poi") continue;
      const cat = CATEGORY_MAP.get(seg.category);
      const leftPct = Math.max(0, seg.start / duration * 100);
      const widthPct = Math.max(0.3, (seg.end - seg.start) / duration * 100);
      const bar = h("div", {
        class: "sbm-progress-seg",
        style: `left:${leftPct}%;width:${widthPct}%;background:${cat ? cat.color : "#fff"};`
      });
      overlay.appendChild(bar);
    }
    overlay.dataset.videoId = PlaybackState.videoID ?? "";
    overlay.dataset.count = String(PlaybackState.segments.length);
  }

  // src/ui/toast.ts
  function removeToast() {
    if (PlaybackState.toastEl) {
      PlaybackState.toastEl.remove();
      PlaybackState.toastEl = null;
    }
    if (PlaybackState.toastTimer) {
      clearTimeout(PlaybackState.toastTimer);
      PlaybackState.toastTimer = null;
    }
  }
  function showSkipToast(segments, resumeTime) {
    removeToast();
    const single = segments.length === 1;
    const label = single ? `Skipped ${categoryLabel(segments[0].category)}` : `Skipped ${segments.length} segments`;
    const undoBtn = h("button", {
      text: "Undo",
      onclick: () => {
        const video = getVideo();
        if (video) video.currentTime = Math.max(0, resumeTime);
        for (const s of segments) PlaybackState.overriddenUUIDs.add(s.uuid);
        removeToast();
      }
    });
    const children = [h("span", { text: label }), undoBtn];
    if (single && segments[0].uuid) {
      const seg = segments[0];
      const up = h("button", { class: "sbm-vote-btn", text: "👍", onclick: () => {
        up.classList.add("sbm-voted");
        vote(seg.uuid, 1);
      } });
      const down = h("button", { class: "sbm-vote-btn", text: "👎", onclick: () => {
        down.classList.add("sbm-voted");
        vote(seg.uuid, 0);
      } });
      children.push(up, down);
    }
    const toast = h("div", { class: "sbm-toast" }, children);
    const rect = getPlayerRect();
    toast.style.left = rect.left + rect.width / 2 + "px";
    toast.style.top = rect.top + rect.height * 0.8 + "px";
    document.body.appendChild(toast);
    PlaybackState.toastEl = toast;
    PlaybackState.toastTimer = setTimeout(removeToast, TOAST_DURATION_MS);
  }

  // src/ui/settingsPanel.ts
  var settingsScreen = null;
  function closeSettings() {
    if (settingsScreen) {
      settingsScreen.remove();
      settingsScreen = null;
    }
  }
  function openSettings() {
    closeSettings();
    const rows = CATEGORIES.map((cat) => {
      const current = Config.categoryActions[cat.key];
      const options = cat.isPoi ? [["off", "Off"], ["notify", "Show"], ["skip", "Auto-jump"]] : [["off", "Off"], ["notify", "Manual"], ["skip", "Auto-skip"]];
      const toggle = h("div", { class: "sbm-seg-toggle" }, options.map(
        ([val, text]) => h("button", {
          text,
          class: val === current ? "active" : "",
          onclick: (e) => {
            Config.setCategoryAction(cat.key, val);
            for (const b of Array.from(toggle.children)) b.classList.remove("active");
            e.target.classList.add("active");
            segmentCache.delete(PlaybackState.videoID ?? "");
            if (PlaybackState.videoID) loadVideo(PlaybackState.videoID);
          }
        })
      ));
      return h("div", { class: "sbm-row" }, [
        h("div", { class: "sbm-row-label" }, [
          h("b", { text: cat.name }),
          h("a", {
            href: `https://wiki.sponsor.ajay.app/w/${encodeURIComponent(cat.name.replace(/ /g, "_"))}`,
            target: "_blank",
            rel: "noopener",
            text: "wiki"
          })
        ]),
        toggle
      ]);
    });
    const enableSwitch = h("label", { class: "sbm-switch" }, [
      h("input", Object.assign({ type: "checkbox", onchange: (e) => {
        Config.enabled = e.target.checked;
        Config.save("enabled");
      } }, Config.enabled ? { checked: "checked" } : {})),
      h("span", { class: "track" }),
      h("span", { class: "thumb" })
    ]);
    const progressBarSwitch = h("label", { class: "sbm-switch" }, [
      h("input", Object.assign({ type: "checkbox", onchange: (e) => {
        Config.showProgressBarSegments = e.target.checked;
        Config.save("showProgressBarSegments");
        if (!e.target.checked) removeProgressOverlay();
        else ensureProgressOverlay();
      } }, Config.showProgressBarSegments ? { checked: "checked" } : {})),
      h("span", { class: "track" }),
      h("span", { class: "thumb" })
    ]);
    const serverInput = h("input", {
      type: "text",
      value: Config.serverAddress,
      onchange: (e) => {
        Config.serverAddress = e.target.value.replace(/\/$/, "") || DEFAULT_SERVER;
        Config.save("serverAddress");
        segmentCache.clear();
      }
    });
    const stats = h("div", { class: "sbm-stats" }, [
      h("div", {}, [h("b", { text: String(Config.stats.segmentsSkipped) }), h("span", { text: "segments skipped" })]),
      h("div", {}, [h("b", { text: formatTime(Config.stats.secondsSaved) }), h("span", { text: "time saved" })])
    ]);
    const sheet = h("div", { class: "sbm-sheet" }, [
      h("h2", {}, [
        document.createTextNode("SponsorBlock Settings"),
        h("button", { class: "sbm-close", text: "✕", onclick: closeSettings })
      ]),
      h("div", { class: "sbm-row" }, [h("div", { class: "sbm-row-label" }, [h("b", { text: "Enabled" })]), enableSwitch]),
      h("div", { class: "sbm-row" }, [h("div", { class: "sbm-row-label" }, [h("b", { text: "Show segments on seek bar" })]), progressBarSwitch]),
      stats,
      h("button", { class: "sbm-btn-secondary", text: "Reset stats", onclick: () => {
        Config.resetStats();
        closeSettings();
        openSettings();
      } }),
      h("h2", { style: "margin-top:18px;font-size:14px;color:#aaa;" }, [document.createTextNode("Categories")]),
      ...rows,
      h("div", { class: "sbm-row-label", style: "margin-top:14px;" }, [
        h("b", { text: "Server address" }),
        serverInput
      ])
    ]);
    settingsScreen = h("div", { class: "sbm-overlay-screen", onclick: (e) => {
      if (e.target === settingsScreen) closeSettings();
    } }, [sheet]);
    document.body.appendChild(settingsScreen);
  }

  // src/ui/submissionSheet.ts
  var submitScreen = null;
  function closeSubmit() {
    if (submitScreen) {
      submitScreen.remove();
      submitScreen = null;
    }
  }
  function renderSubmitSheet() {
    const list = h("div", {}, PlaybackState.pendingSubmission.map((seg, idx) => {
      const select = h("select", {
        onchange: (e) => {
          seg.category = e.target.value;
        }
      }, CATEGORIES.filter((c) => !c.isPoi).map(
        (c) => h("option", Object.assign({ value: c.key, text: c.name }, c.key === seg.category ? { selected: "selected" } : {}))
      ));
      return h("div", { class: "sbm-pending-item" }, [
        h("span", { class: "sbm-time", text: `${formatTime(seg.start)} → ${formatTime(seg.end)}` }),
        select,
        h("button", { class: "sbm-del", text: "✕", onclick: () => {
          PlaybackState.pendingSubmission.splice(idx, 1);
          renderSubmitSheet();
        } })
      ]);
    }));
    const video = getVideo();
    const markStart = h("button", { class: "sbm-btn-secondary", text: "Mark start → end", onclick: () => {
      if (!video) return;
      PlaybackState.pendingSubmission.push({ start: video.currentTime, end: video.currentTime + 1, category: "sponsor", actionType: "skip" });
      renderSubmitSheet();
    } });
    const markHighlight = h("button", { class: "sbm-btn-secondary", text: "Mark highlight", onclick: () => {
      if (!video) return;
      PlaybackState.pendingSubmission.push({ start: video.currentTime, end: video.currentTime, category: "poi_highlight", actionType: "poi" });
      renderSubmitSheet();
    } });
    const editCurrent = PlaybackState.pendingSubmission[PlaybackState.pendingSubmission.length - 1];
    const setEndBtn = h("button", { class: "sbm-btn-secondary", text: "Set end = now", onclick: () => {
      if (!video || !editCurrent) return;
      editCurrent.end = video.currentTime;
      renderSubmitSheet();
    } });
    const submitBtn = h("button", {
      class: "sbm-btn-primary",
      text: PlaybackState.pendingSubmission.length ? `Submit ${PlaybackState.pendingSubmission.length} segment(s)` : "Nothing to submit",
      onclick: async () => {
        if (!PlaybackState.pendingSubmission.length || !video) return;
        const valid = PlaybackState.pendingSubmission.filter((s) => s.actionType === "poi" || s.end > s.start);
        if (!valid.length) return;
        const res = await submitSegments(PlaybackState.videoID, valid, video.duration);
        if (res.status === 200) {
          PlaybackState.pendingSubmission = [];
          segmentCache.delete(PlaybackState.videoID ?? "");
          closeSubmit();
          if (PlaybackState.videoID) loadVideo(PlaybackState.videoID);
        } else {
          alert("Submission failed (server said: " + res.status + "). Your segments were kept so you can retry.");
        }
      }
    });
    const sheet = h("div", { class: "sbm-sheet" }, [
      h("h2", {}, [document.createTextNode("Submit a segment"), h("button", { class: "sbm-close", text: "✕", onclick: closeSubmit })]),
      h("div", { class: "sbm-mark-row" }, [markStart, markHighlight]),
      editCurrent ? h("div", { class: "sbm-mark-row" }, [setEndBtn]) : null,
      list,
      submitBtn
    ]);
    if (submitScreen) {
      submitScreen.querySelector(".sbm-sheet").replaceWith(sheet);
    } else {
      submitScreen = h("div", { class: "sbm-overlay-screen", onclick: (e) => {
        if (e.target === submitScreen) closeSubmit();
      } }, [sheet]);
      document.body.appendChild(submitScreen);
    }
  }

  // src/ui/fab.ts
  var fabRow = null;
  function updateFabVisibility() {
    if (!fabRow) return;
    fabRow.style.display = PlaybackState.videoID ? "flex" : "none";
  }
  function createFabRow() {
    const settingsBtn = h("button", { class: "sbm-fab", text: "⚙", title: "SponsorBlock settings", onclick: openSettings });
    const submitBtn = h("button", { class: "sbm-fab", text: "+", title: "Submit a segment", onclick: renderSubmitSheet });
    fabRow = h("div", { class: "sbm-fab-row" }, [submitBtn, settingsBtn]);
    document.body.appendChild(fabRow);
    updateFabVisibility();
  }

  // src/playback.ts
  function chainSkipSegments(sortedSkipSegments, index) {
    const involved = [sortedSkipSegments[index]];
    let end = sortedSkipSegments[index].end;
    for (let i = index + 1; i < sortedSkipSegments.length; i++) {
      const seg = sortedSkipSegments[i];
      if (seg.start > end + 0.5) break;
      if (activeCategoryAction(seg.category) !== "skip") continue;
      if (PlaybackState.overriddenUUIDs.has(seg.uuid)) continue;
      end = Math.max(end, seg.end);
      involved.push(seg);
    }
    return { end, involved };
  }
  var END_OF_VIDEO_SEEK_MARGIN = 0.75;
  function safeSeekTarget(time, video) {
    if (isFinite(video.duration) && video.duration > 0 && time >= video.duration - END_OF_VIDEO_SEEK_MARGIN) {
      return Math.max(0, video.duration - END_OF_VIDEO_SEEK_MARGIN);
    }
    return time;
  }
  function activeCategoryAction(category) {
    return Config.categoryActions[category] || "off";
  }
  function tick() {
    window.requestAnimationFrame(tick);
    if (!Config.enabled) return;
    const video = getVideo();
    if (!video || isAdShowing() || video.paused) return;
    const currentVideoID = getVideoIDFromURL(location.href);
    if (currentVideoID !== PlaybackState.videoID) return;
    const t = video.currentTime;
    handleMuteSegments(video, t);
    handleSkipSegments(video, t);
    handlePoi(video, t);
  }
  function handleMuteSegments(video, t) {
    const muteSegs = PlaybackState.segments.filter(
      (s) => s.actionType === "mute" && activeCategoryAction(s.category) !== "off" && !PlaybackState.overriddenUUIDs.has(s.uuid)
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
  function handleSkipSegments(video, t) {
    const skipSegs = PlaybackState.segments.filter((s) => s.actionType === "skip").sort((a, b) => a.start - b.start);
    for (let i = 0; i < skipSegs.length; i++) {
      const seg = skipSegs[i];
      const action = activeCategoryAction(seg.category);
      if (action === "off") continue;
      if (PlaybackState.overriddenUUIDs.has(seg.uuid)) continue;
      if (action === "skip" && PlaybackState.autoSkippedUUIDs.has(seg.uuid)) continue;
      if (t < seg.start - SKIP_EPSILON || t >= seg.end) continue;
      if (action === "skip") {
        const { end, involved } = chainSkipSegments(skipSegs, i);
        if (end <= t) continue;
        const from = t;
        const target = safeSeekTarget(end, video);
        video.currentTime = target;
        for (const s of involved) PlaybackState.autoSkippedUUIDs.add(s.uuid);
        Config.addStats(target - from);
        showSkipToast(involved, from);
        for (const s of involved) markViewed(s.uuid, PlaybackState.videoID);
        return;
      } else if (action === "notify") {
        if (PlaybackState.shownManualUUIDs.has(seg.uuid)) continue;
        const { end } = chainSkipSegments(skipSegs, i);
        showManualButton(seg, end);
        return;
      }
    }
    if (PlaybackState.manualBtnUUID) {
      const stillActive = skipSegs.some(
        (s) => s.uuid === PlaybackState.manualBtnUUID && t >= s.start - SKIP_EPSILON && t < s.end
      );
      if (!stillActive) removeManualButton();
    }
  }
  function handlePoi(video, t) {
    const poi = PlaybackState.segments.find((s) => s.actionType === "poi");
    if (!poi) return;
    const action = activeCategoryAction(poi.category);
    if (action === "off") return;
    if (action === "skip" && !PlaybackState.poiAutoJumped && t < poi.start && t < 3) {
      PlaybackState.poiAutoJumped = true;
      video.currentTime = poi.start;
      return;
    }
    const leadInStart = Math.max(0, poi.start - POI_CHIP_LEAD_IN_SECONDS);
    if (!PlaybackState.poiShown && !PlaybackState.poiChipEl && t >= leadInStart && t < poi.start - 1) {
      showPoiChip(poi);
    }
    if (PlaybackState.poiChipEl && (t >= poi.start - 1 || t < leadInStart)) {
      removePoiChip();
    }
  }
  async function loadVideo(videoID) {
    resetPlaybackState(videoID);
    const segments = await fetchSegments(videoID);
    if (PlaybackState.videoID !== videoID) return;
    PlaybackState.segments = segments;
    const video = getVideo();
    if (video && !isAdShowing()) {
      handleSkipSegments(video, video.currentTime);
      handleMuteSegments(video, video.currentTime);
    }
    ensureProgressOverlay();
    updateFabVisibility();
  }
  var lastURL = null;
  var lastVideoElement = null;
  function pollNavigation() {
    const href = location.href;
    const videoID = getVideoIDFromURL(href);
    if (href !== lastURL) {
      lastURL = href;
      if (videoID !== PlaybackState.videoID) {
        if (videoID) loadVideo(videoID);
        else resetPlaybackState(null);
      }
    }
    const video = getVideo();
    if (video && video !== lastVideoElement) {
      lastVideoElement = video;
      if (videoID && videoID === PlaybackState.videoID) {
        handleSkipSegments(video, video.currentTime);
      }
    }
    ensureProgressOverlay();
    updateFabVisibility();
  }

  // src/ui/manualButton.ts
  function removeManualButton() {
    if (PlaybackState.manualBtnEl) {
      PlaybackState.manualBtnEl.remove();
      PlaybackState.manualBtnEl = null;
      PlaybackState.manualBtnUUID = null;
    }
  }
  function showManualButton(segment, chainEnd) {
    if (PlaybackState.manualBtnUUID === segment.uuid) return;
    removeManualButton();
    const btn = h("button", {
      class: "sbm-manual-btn",
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
      }
    }, [document.createTextNode(`Skip ${categoryLabel(segment.category)} ▶`)]);
    const rect = getPlayerRect();
    btn.style.left = rect.left + rect.width - 12 + "px";
    btn.style.top = rect.top + rect.height * 0.72 + "px";
    btn.style.transform = "translateX(-100%)";
    document.body.appendChild(btn);
    PlaybackState.manualBtnEl = btn;
    PlaybackState.manualBtnUUID = segment.uuid;
  }

  // src/state.ts
  var PlaybackState = {
    videoID: null,
    segments: [],
    overriddenUUIDs: /* @__PURE__ */ new Set(),
    autoSkippedUUIDs: /* @__PURE__ */ new Set(),
    shownManualUUIDs: /* @__PURE__ */ new Set(),
    poiShown: false,
    poiAutoJumped: false,
    activeMuteUUID: null,
    wasMutedBeforeSegment: false,
    pendingSubmission: [],
    toastEl: null,
    toastTimer: null,
    manualBtnEl: null,
    manualBtnUUID: null,
    poiChipEl: null
  };
  function resetPlaybackState(newVideoID) {
    PlaybackState.videoID = newVideoID;
    PlaybackState.segments = [];
    PlaybackState.overriddenUUIDs = /* @__PURE__ */ new Set();
    PlaybackState.autoSkippedUUIDs = /* @__PURE__ */ new Set();
    PlaybackState.shownManualUUIDs = /* @__PURE__ */ new Set();
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

  // src/main.ts
  function main() {
    if (window.__sbMobileLoaded) return;
    window.__sbMobileLoaded = true;
    if (window.top !== window) return;
    initConfig();
    injectStyles();
    if (hasGM && typeof GM_registerMenuCommand === "function") {
      GM_registerMenuCommand("SponsorBlock Settings", openSettings);
      GM_registerMenuCommand("Submit a segment", renderSubmitSheet);
    }
    boot();
    window.__sbMobileDebug = { Config, PlaybackState, CATEGORIES, getVideoIDFromURL, fetchSegments };
  }
  function boot() {
    if (!document.body) {
      window.requestAnimationFrame(boot);
      return;
    }
    createFabRow();
    window.requestAnimationFrame(tick);
    setInterval(pollNavigation, 500);
    pollNavigation();
  }
  main();
})();
