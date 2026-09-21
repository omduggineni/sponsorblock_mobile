// ==UserScript==
// @name         SponsorBlock for YouTube Mobile
// @namespace    https://github.com/omduggineni/sponsorblock_mobile
// @version      1.4.1
// @description  Skips sponsor segments, self-promo, intros and more on m.youtube.com using the crowdsourced SponsorBlock database. Includes submission, voting, and a settings panel built for touch.
// @author       SponsorBlock Mobile (community port)
// @match        https://m.youtube.com/*
// @match        https://www.youtube.com/*
// @icon         https://sponsor.ajay.app/favicon.ico
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @connect      sponsor.ajay.app
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/omduggineni/sponsorblock_mobile/main/sponsorblock-mobile.user.js
// @downloadURL  https://raw.githubusercontent.com/omduggineni/sponsorblock_mobile/main/sponsorblock-mobile.user.js
// ==/UserScript==

(()=>{var I="https://sponsor.ajay.app",J="SponsorBlockMobileUserscript/1.0.0",Y="sbm_";var h=[{key:"sponsor",name:"Sponsor",color:"#00d400",supportsMute:!0,default:"skip"},{key:"selfpromo",name:"Unpaid/Self Promotion",color:"#ffff00",supportsMute:!0,default:"skip"},{key:"interaction",name:"Interaction Reminder",color:"#cc00ff",supportsMute:!0,default:"skip"},{key:"intro",name:"Intermission/Intro",color:"#00ffff",supportsMute:!0,default:"skip"},{key:"outro",name:"Endcards/Credits",color:"#0202ed",supportsMute:!0,default:"skip"},{key:"preview",name:"Preview/Recap",color:"#008fd6",supportsMute:!0,default:"off"},{key:"hook",name:"Hook/Greeting",color:"#395699",supportsMute:!0,default:"off"},{key:"filler",name:"Tangents/Jokes",color:"#7300ff",supportsMute:!0,default:"off"},{key:"music_offtopic",name:"Non-Music Section",color:"#ff9900",supportsMute:!1,default:"off"},{key:"poi_highlight",name:"Highlight",color:"#ff1684",supportsMute:!1,default:"notify",isPoi:!0}],V=new Map(h.map(t=>[t.key,t])),ct=h.map(t=>t.key);var lt=typeof GM<"u"&&!!GM&&typeof GM.getValue=="function"&&typeof GM.setValue=="function",pt=typeof GM_getValue=="function"&&typeof GM_setValue=="function";async function k(t,e){try{if(lt){let r=await GM.getValue(t,void 0);return r===void 0?e:r}if(pt){let r=await GM_getValue(t,void 0);return r===void 0?e:r}let o=localStorage.getItem(Y+t);return o===null?e:JSON.parse(o)}catch{return e}}async function C(t,e){try{if(lt){await GM.setValue(t,e);return}if(pt){await GM_setValue(t,e);return}localStorage.setItem(Y+t,JSON.stringify(e))}catch{}}function dt(){let t={};for(let e of h)t[e.key]=e.default;return t}function At(){let t=new Uint8Array(20);return(window.crypto||window.msCrypto).getRandomValues(t),Array.from(t,e=>e.toString(16).padStart(2,"0")).join("")}var l={enabled:!0,serverAddress:I,categoryActions:dt(),userID:null,minDuration:0,stats:{segmentsSkipped:0,secondsSaved:0},showProgressBarSegments:!0,save(t){C(t,this[t])},setCategoryAction(t,e){this.categoryActions[t]=e,C("categoryActions",this.categoryActions)},addStats(t){this.stats.segmentsSkipped+=1,this.stats.secondsSaved+=Math.max(0,t),C("stats",this.stats)},resetStats(){this.stats={segmentsSkipped:0,secondsSaved:0},C("stats",this.stats)}};async function ut(){l.enabled=await k("enabled",!0),l.serverAddress=await k("serverAddress",I),l.categoryActions=Object.assign(dt(),await k("categoryActions",{})),l.userID=await k("userID",null),l.minDuration=await k("minDuration",0),l.stats=await k("stats",{segmentsSkipped:0,secondsSaved:0}),l.showProgressBarSegments=await k("showProgressBarSegments",!0),l.userID||(l.userID=At(),C("userID",l.userID))}var mt="SponsorBlock Mobile",ft=!1;function g(t,e){if(console.error(`[${mt}] Error in ${t}:`,e),ft)return;ft=!0;let o=e instanceof Error?e.message:String(e);try{alert(`${mt} hit an unexpected error (in ${t}) and may not work correctly on this page:

${o}

Open the browser console for the full stack trace.`)}catch{}}function H(t,e){return((...o)=>{try{let r=e(...o);return r&&typeof r.then=="function"&&r.catch(s=>g(t,s)),r}catch(r){g(t,r)}})}async function It(t){let e=new TextEncoder().encode(t),o=await crypto.subtle.digest("SHA-256",e);return Array.from(new Uint8Array(o),r=>r.toString(16).padStart(2,"0")).join("")}function Ct(t){let e=new URLSearchParams;for(let[r,s]of Object.entries(t||{}))s!=null&&e.set(r,typeof s=="string"?s:JSON.stringify(s));let o=e.toString();return o?"?"+o:""}function G(t,e,{params:o,body:r,headers:s}={}){let a=l.serverAddress+e+Ct(o),c=Object.assign({"X-Client-Name":J},s||{});if(typeof GM_xmlhttpRequest=="function")return new Promise(p=>{let d=!1,m=y=>{d||(d=!0,clearTimeout(b),p(y))},b=setTimeout(()=>m({status:0,text:""}),2e4);GM_xmlhttpRequest({method:t,url:a,headers:r?Object.assign({"Content-Type":"application/json"},c):c,data:r?JSON.stringify(r):void 0,onload:y=>m({status:y.status,text:y.responseText}),onerror:()=>m({status:0,text:""}),ontimeout:()=>m({status:0,text:""})})});let u=r?Object.assign({"Content-Type":"application/json"},c):c;return fetch(a,{method:t,headers:u,body:r?JSON.stringify(r):void 0}).then(async p=>({status:p.status,text:await p.text()})).catch(()=>({status:0,text:""}))}var S=new Map;var Dt=180*1e3;function Pt(){return ct.filter(t=>l.categoryActions[t]!=="off")}async function N(t){let e=S.get(t);if(e&&Date.now()-e.fetchedAt<Dt)return e.segments;let o=Pt();if(o.length===0)return S.set(t,{segments:[],fetchedAt:Date.now()}),[];try{let r=(await It(t)).slice(0,5),s=await G("GET","/api/skipSegments/"+r,{params:{categories:o,actionTypes:["skip","mute","poi"]}}),a=[];if(s.status===200){let c=JSON.parse(s.text),u=Array.isArray(c)?c.find(p=>p.videoID===t):null;u&&Array.isArray(u.segments)&&(a=u.segments.map(p=>({uuid:p.UUID,category:p.category,actionType:p.actionType,start:p.segment[0],end:p.segment[1],locked:!!p.locked,votes:p.votes})).sort((p,d)=>p.start-d.start))}return S.set(t,{segments:a,fetchedAt:Date.now()}),a}catch(r){return console.error("[SponsorBlock Mobile] Failed to fetch segments",r),[]}}function X(t,e){return G("POST","/api/voteOnSponsorTime",{params:{UUID:t,userID:l.userID,type:e}})}function $(t,e){return G("POST","/api/viewedVideoSponsorTime",{params:{UUID:t,videoID:e}})}function gt(t,e,o){return G("POST","/api/skipSegments",{body:{videoID:t,userID:l.userID,videoDuration:o,userAgent:J,segments:e.map(r=>({segment:[r.start,r.end],category:r.category,actionType:r.actionType}))}})}var Ut=`
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
    .sbm-progress-poi {
        position: absolute;
        top: -3px;
        bottom: -3px;
        width: 3px;
        margin-left: -1.5px;
        border-radius: 1px;
    }
    .sbm-fab-row {
        position: fixed;
        right: 10px;
        bottom: 90px;
        display: none;
        flex-direction: column;
        gap: 10px;
        z-index: 2147483000;
    }
    .sbm-action-bar-btn {
        flex: 0 0 auto;
        width: 48px;
        height: 48px;
        background: transparent;
        border: none;
        border-radius: 50%;
        color: inherit;
        font-size: 21px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .sbm-action-bar-btn:active { background: rgba(128,128,128,0.2); }
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
    .sbm-section-label {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        color: #888;
        margin: 22px 0 4px;
    }
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
    .sbm-cat-swatch {
        display: inline-block;
        width: 8px;
        height: 8px;
        margin-left: 6px;
        vertical-align: super;
        border-radius: 1px;
    }
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
    .sbm-pending-item .sbm-pending-category { flex: 1; color: #ff1684; font-size: 13px; font-weight: 600; }
    .sbm-pending-item .sbm-time { font-variant-numeric: tabular-nums; font-size: 12px; color: #ccc; min-width: 92px; }
    .sbm-pending-item button.sbm-del { background: none; border: none; color: #ff6b6b; font-size: 18px; }
    .sbm-mark-row { display: flex; gap: 8px; margin-top: 10px; }
    .sbm-mark-row button { flex: 1; }
    .sbm-toggle-strip { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
    .sbm-toggle-chip { border: 1px solid rgba(255,255,255,0.25); background: transparent; color: #ddd; border-radius: 999px; padding: 6px 10px; font-size: 11px; }
    .sbm-toggle-chip.active { color: #06233a; border-color: transparent; }
    `;function K(){let t=document.head||document.documentElement;if(!t){window.requestAnimationFrame(K);return}let e=document.createElement("style");e.textContent=Ut,t.appendChild(e)}function i(t,e,o){let r=document.createElement(t);for(let[s,a]of Object.entries(e||{}))s==="class"?r.className=a:s==="text"?r.textContent=a:s.startsWith("on")&&typeof a=="function"?r.addEventListener(s.slice(2),H(`<${t}> ${s}`,a)):r.setAttribute(s,a);for(let s of o||[])s&&r.appendChild(typeof s=="string"?document.createTextNode(s):s);return r}function E(t){t=Math.max(0,Math.round(t));let e=Math.floor(t/3600),o=Math.floor(t%3600/60),r=t%60,s=e>0?String(o).padStart(2,"0"):String(o),a=String(r).padStart(2,"0");return e>0?`${e}:${s}:${a}`:`${s}:${a}`}function q(t){let e=V.get(t);return e?e.name:t}function D(t){try{let e=new URL(t);if(e.searchParams.has("v"))return e.searchParams.get("v");let o=e.pathname.match(/\/shorts\/([\w-]{11})/);if(o)return o[1];let r=e.pathname.match(/\/live\/([\w-]{11})/);return r?r[1]:null}catch{return null}}function W(){return document.getElementById("movie_player")}function f(){let t=W();return t&&t.querySelector("video")||document.querySelector("video")}function Q(){let t=W();return!!t&&t.classList.contains("ad-showing")}function T(){let t=W();if(t){let e=t.getBoundingClientRect();if(e.width>0&&e.height>0)return e}return{top:0,left:0,right:window.innerWidth,width:window.innerWidth,height:Math.round(window.innerWidth*9/16)}}function bt(){let t=document.querySelectorAll("yt-progress-bar.ytPlayerProgressBarHost");if(!t.length)return null;for(let e of t)if(e.classList.contains("watch-page-progress-bar"))return e;return t[0]}function P(){n.poiChipEl&&(n.poiChipEl.remove(),n.poiChipEl=null)}function ht(t){if(n.poiChipEl)return;let e=i("button",{class:"sbm-poi-chip",text:"★ Jump to highlight",onclick:()=>{let r=f();r&&(r.currentTime=t.start),P(),n.poiShown=!0}}),o=T();e.style.left=o.left+o.width/2+"px",e.style.top=o.top+14+"px",document.body.appendChild(e),n.poiChipEl=e}function U(){document.querySelectorAll(".sbm-progress-overlay").forEach(t=>t.remove())}function Rt(t,e){let o=t.querySelector("yt-progress-bar-line, .ytProgressBarLineHost");if(o){let r=t.getBoundingClientRect(),s=o.getBoundingClientRect();if(r.height>0&&s.height>0){e.style.top=s.top-r.top+"px",e.style.height=s.height+"px",e.style.transform="none";return}}e.style.top="",e.style.height="",e.style.transform=""}function R(){if(!l.showProgressBarSegments){U();return}let t=f(),e=bt();if(!e||!t||!isFinite(t.duration)||t.duration<=0)return;let o=e.querySelector(":scope > .sbm-progress-overlay");if(o||(getComputedStyle(e).position==="static"&&(e.style.position="relative"),o=i("div",{class:"sbm-progress-overlay"}),e.appendChild(o),o.dataset.videoId=""),Rt(e,o),o.dataset.videoId===n.videoID&&o.dataset.count===String(n.segments.length))return;for(;o.firstChild;)o.removeChild(o.firstChild);let r=t.duration;for(let s of n.segments){let a=V.get(s.category),c=Math.max(0,s.start/r*100);if(s.actionType==="poi"){let d=i("div",{class:"sbm-progress-poi",style:`left:${c}%;background:${a?a.color:"#fff"};`});o.appendChild(d);continue}let u=Math.max(.3,(s.end-s.start)/r*100),p=i("div",{class:"sbm-progress-seg",style:`left:${c}%;width:${u}%;background:${a?a.color:"#fff"};`});o.appendChild(p)}o.dataset.videoId=n.videoID??"",o.dataset.count=String(n.segments.length)}function B(){n.toastEl&&(n.toastEl.remove(),n.toastEl=null),n.toastTimer&&(clearTimeout(n.toastTimer),n.toastTimer=null)}function xt(t,e){B();let o=t.length===1,r=o?`Skipped ${q(t[0].category)}`:`Skipped ${t.length} segments`,s=i("button",{text:"Undo",onclick:()=>{let p=f();p&&(p.currentTime=Math.max(0,e));for(let d of t)n.overriddenUUIDs.add(d.uuid);B()}}),a=[i("span",{text:r}),s];if(o&&t[0].uuid){let p=t[0],d=i("button",{class:"sbm-vote-btn",text:"👍",onclick:()=>{d.classList.add("sbm-voted"),X(p.uuid,1)}}),m=i("button",{class:"sbm-vote-btn",text:"👎",onclick:()=>{m.classList.add("sbm-voted"),X(p.uuid,0)}});a.push(d,m)}let c=i("div",{class:"sbm-toast"},a),u=T();c.style.left=u.left+u.width/2+"px",c.style.top=u.top+u.height*.8+"px",document.body.appendChild(c),n.toastEl=c,n.toastTimer=setTimeout(H("toast auto-dismiss",B),4e3)}var M=null;function z(){M&&(M.remove(),M=null)}function _(){z();let t=h.map(c=>{let u=l.categoryActions[c.key],p=c.isPoi?[["off","Off"],["notify","Show"],["skip","Auto-jump"]]:[["off","Off"],["notify","Manual"],["skip","Auto-skip"]],d=i("div",{class:"sbm-seg-toggle"},p.map(([m,b])=>i("button",{text:b,class:m===u?"active":"",onclick:y=>{l.setCategoryAction(c.key,m);for(let x of Array.from(d.children))x.classList.remove("active");y.target.classList.add("active"),S.delete(n.videoID??""),n.videoID&&O(n.videoID)}})));return i("div",{class:"sbm-row"},[i("div",{class:"sbm-row-label"},[i("b",{},[c.name,i("sup",{class:"sbm-cat-swatch",style:`background:${c.color};`})]),i("a",{href:`https://wiki.sponsor.ajay.app/w/${encodeURIComponent(c.name.replace(/ /g,"_"))}`,target:"_blank",rel:"noopener",text:"wiki"})]),d])}),e=i("label",{class:"sbm-switch"},[i("input",Object.assign({type:"checkbox",onchange:c=>{l.enabled=c.target.checked,l.save("enabled")}},l.enabled?{checked:"checked"}:{})),i("span",{class:"track"}),i("span",{class:"thumb"})]),o=i("label",{class:"sbm-switch"},[i("input",Object.assign({type:"checkbox",onchange:c=>{l.showProgressBarSegments=c.target.checked,l.save("showProgressBarSegments"),c.target.checked?R():U()}},l.showProgressBarSegments?{checked:"checked"}:{})),i("span",{class:"track"}),i("span",{class:"thumb"})]),r=i("input",{type:"text",value:l.serverAddress,onchange:c=>{l.serverAddress=c.target.value.replace(/\/$/,"")||I,l.save("serverAddress"),S.clear()}}),s=i("div",{class:"sbm-stats"},[i("div",{},[i("b",{text:String(l.stats.segmentsSkipped)}),i("span",{text:"segments skipped"})]),i("div",{},[i("b",{text:E(l.stats.secondsSaved)}),i("span",{text:"time saved"})])]),a=i("div",{class:"sbm-sheet"},[i("h2",{},[document.createTextNode("SponsorBlock Settings"),i("button",{class:"sbm-close",text:"✕",onclick:z})]),i("div",{class:"sbm-row"},[i("div",{class:"sbm-row-label"},[i("b",{text:"Enabled"})]),e]),i("div",{class:"sbm-row"},[i("div",{class:"sbm-row-label"},[i("b",{text:"Show segments on seek bar"})]),o]),s,i("button",{class:"sbm-btn-secondary",text:"Reset stats",onclick:()=>{l.resetStats(),z(),_()}}),i("div",{class:"sbm-section-label",text:"Categories"}),...t,i("div",{class:"sbm-row-label",style:"margin-top:14px;"},[i("b",{text:"Server address"}),r])]);M=i("div",{class:"sbm-overlay-screen",onclick:c=>{c.target===M&&z()}},[a]),document.body.appendChild(M)}var v=null;function Z(){v&&(v.remove(),v=null)}function w(){let t=i("div",{},n.pendingSubmission.map((d,m)=>{let b=d.actionType==="poi",y=b?i("span",{class:"sbm-pending-category",text:"Highlight"}):i("select",{onchange:x=>{d.category=x.target.value}},h.filter(x=>!x.isPoi).map(x=>i("option",Object.assign({value:x.key,text:x.name},x.key===d.category?{selected:"selected"}:{}))));return i("div",{class:"sbm-pending-item"},[i("span",{class:"sbm-time",text:b?E(d.start):`${E(d.start)} → ${E(d.end)}`}),y,i("button",{class:"sbm-del",text:"✕",onclick:()=>{n.pendingSubmission.splice(m,1),w()}})])})),e=f(),o=i("button",{class:"sbm-btn-secondary",text:"Mark start → end",onclick:()=>{e&&(n.pendingSubmission.push({start:e.currentTime,end:e.currentTime+1,category:"sponsor",actionType:"skip"}),w())}}),r=i("button",{class:"sbm-btn-secondary",text:"Mark highlight",onclick:()=>{e&&(n.pendingSubmission.push({start:e.currentTime,end:e.currentTime,category:"poi_highlight",actionType:"poi"}),w())}}),s=n.pendingSubmission[n.pendingSubmission.length-1],a=s&&s.actionType!=="poi",c=i("button",{class:"sbm-btn-secondary",text:"Set end = now",onclick:()=>{!e||!a||(s.end=e.currentTime,w())}}),u=i("button",{class:"sbm-btn-primary",text:n.pendingSubmission.length?`Submit ${n.pendingSubmission.length} segment(s)`:"Nothing to submit",onclick:async()=>{if(!n.pendingSubmission.length||!e)return;let d=n.pendingSubmission.filter(b=>b.actionType==="poi"||b.end>b.start);if(!d.length)return;let m=await gt(n.videoID,d,e.duration);m.status===200?(n.pendingSubmission=[],S.delete(n.videoID??""),Z(),n.videoID&&O(n.videoID)):alert("Submission failed (server said: "+m.status+"). Your segments were kept so you can retry.")}}),p=i("div",{class:"sbm-sheet"},[i("h2",{},[document.createTextNode("Submit a segment"),i("button",{class:"sbm-close",text:"✕",onclick:Z})]),i("div",{class:"sbm-mark-row"},[o,r]),a?i("div",{class:"sbm-mark-row"},[c]):null,t,u]);v?v.querySelector(".sbm-sheet").replaceWith(p):(v=i("div",{class:"sbm-overlay-screen",onclick:d=>{d.target===v&&Z()}},[p]),document.body.appendChild(v))}var j=null,tt=!1;function L(){j&&(j.style.display=n.videoID&&tt?"flex":"none")}function _t(t){tt=t,L()}function yt(){let t=i("button",{class:"sbm-fab",text:"⚙",title:"SponsorBlock settings",onclick:_}),e=i("button",{class:"sbm-fab",text:"+",title:"Submit a segment",onclick:w});j=i("div",{class:"sbm-fab-row"},[e,t]),document.body.appendChild(j),L()}function Ot(){return document.querySelector(".slim-video-action-bar-actions")}function et(){let t=Ot();if(!t||t.querySelector(":scope > .sbm-action-bar-btn"))return;let e=i("button",{class:"sbm-action-bar-btn","aria-label":"SponsorBlock",title:"SponsorBlock",text:"⏭",onclick:()=>_t(!tt)});t.appendChild(e)}function St(t,e){let o=[t[e]],r=t[e].end;for(let s=e+1;s<t.length;s++){let a=t[s];if(a.start>r+.5)break;F(a.category)==="skip"&&(n.overriddenUUIDs.has(a.uuid)||(r=Math.max(r,a.end),o.push(a)))}return{end:r,involved:o}}var vt=.75;function nt(t,e){return isFinite(e.duration)&&e.duration>0&&t>=e.duration-vt?Math.max(0,e.duration-vt):t}function F(t){return l.categoryActions[t]||"off"}function rt(){window.requestAnimationFrame(rt);try{if(!l.enabled)return;let t=f();if(!t||Q()||t.paused||D(location.href)!==n.videoID)return;let o=t.currentTime;Et(t,o),st(t,o),Vt(t,o)}catch(t){g("tick",t)}}function Et(t,e){let r=n.segments.filter(s=>s.actionType==="mute"&&F(s.category)!=="off"&&!n.overriddenUUIDs.has(s.uuid)).find(s=>e>=s.start-.15&&e<s.end);r&&n.activeMuteUUID!==r.uuid?(n.wasMutedBeforeSegment=t.muted,t.muted=!0,n.activeMuteUUID=r.uuid):!r&&n.activeMuteUUID&&(t.muted=n.wasMutedBeforeSegment,n.activeMuteUUID=null)}function st(t,e){let o=n.segments.filter(r=>r.actionType==="skip").sort((r,s)=>r.start-s.start);for(let r=0;r<o.length;r++){let s=o[r],a=F(s.category);if(a!=="off"&&!n.overriddenUUIDs.has(s.uuid)&&!(a==="skip"&&n.autoSkippedUUIDs.has(s.uuid))&&!(e<s.start-.15||e>=s.end)){if(a==="skip"){let{end:c,involved:u}=St(o,r);if(c<=e)continue;let p=e,d=nt(c,t);t.currentTime=d;for(let m of u)n.autoSkippedUUIDs.add(m.uuid);l.addStats(d-p),xt(u,p);for(let m of u)$(m.uuid,n.videoID);return}else if(a==="notify"){if(n.shownManualUUIDs.has(s.uuid))continue;let{end:c}=St(o,r);Tt(s,c);return}}}n.manualBtnUUID&&(o.some(s=>s.uuid===n.manualBtnUUID&&e>=s.start-.15&&e<s.end)||A())}function Vt(t,e){let o=n.segments.find(a=>a.actionType==="poi");if(!o)return;let r=F(o.category);if(r==="off")return;if(r==="skip"&&!n.poiAutoJumped&&e<o.start&&e<3){n.poiAutoJumped=!0,t.currentTime=o.start;return}let s=Math.max(0,o.start-20);!n.poiShown&&!n.poiChipEl&&e>=s&&e<o.start-1&&ht(o),n.poiChipEl&&(e>=o.start-1||e<s)&&P()}async function O(t){try{at(t);let e=await N(t);if(n.videoID!==t)return;n.segments=e;let o=f();o&&!Q()&&(st(o,o.currentTime),Et(o,o.currentTime)),R(),et(),L()}catch(e){g("loadVideo",e)}}var wt=null,kt=null;function it(){try{Ht()}catch(t){g("pollNavigation",t)}}function Ht(){let t=location.href,e=D(t);t!==wt&&(wt=t,e!==n.videoID&&(e?O(e):at(null)));let o=f();o&&o!==kt&&(kt=o,e&&e===n.videoID&&st(o,o.currentTime)),R(),et(),L()}function A(){n.manualBtnEl&&(n.manualBtnEl.remove(),n.manualBtnEl=null,n.manualBtnUUID=null)}function Tt(t,e){if(n.manualBtnUUID===t.uuid)return;A();let o=i("button",{class:"sbm-manual-btn",onclick:()=>{let s=f();if(s){let a=s.currentTime,c=nt(e,s);s.currentTime=c,l.addStats(c-a),$(t.uuid,n.videoID)}n.shownManualUUIDs.add(t.uuid),A()}},[document.createTextNode(`Skip ${q(t.category)} ▶`)]),r=T();o.style.left=r.left+r.width-12+"px",o.style.top=r.top+r.height*.72+"px",o.style.transform="translateX(-100%)",document.body.appendChild(o),n.manualBtnEl=o,n.manualBtnUUID=t.uuid}var n={videoID:null,segments:[],overriddenUUIDs:new Set,autoSkippedUUIDs:new Set,shownManualUUIDs:new Set,poiShown:!1,poiAutoJumped:!1,activeMuteUUID:null,wasMutedBeforeSegment:!1,pendingSubmission:[],toastEl:null,toastTimer:null,manualBtnEl:null,manualBtnUUID:null,poiChipEl:null};function at(t){n.videoID=t,n.segments=[],n.overriddenUUIDs=new Set,n.autoSkippedUUIDs=new Set,n.shownManualUUIDs=new Set,n.poiShown=!1,n.poiAutoJumped=!1,n.activeMuteUUID=null,n.wasMutedBeforeSegment=!1,n.pendingSubmission=[],B(),A(),P(),U()}async function Gt(){if(!window.__sbMobileLoaded&&(window.__sbMobileLoaded=!0,!window.frameElement)){try{await ut()}catch(t){g("initConfig",t)}try{K()}catch(t){g("injectStyles",t)}try{typeof GM_registerMenuCommand=="function"&&(GM_registerMenuCommand("SponsorBlock Settings",_),GM_registerMenuCommand("Submit a segment",w))}catch(t){g("GM_registerMenuCommand",t)}Mt(),window.__sbMobileDebug={Config:l,PlaybackState:n,CATEGORIES:h,getVideoIDFromURL:D,fetchSegments:N}}}function Mt(){if(!document.body){window.requestAnimationFrame(Mt);return}try{yt(),window.requestAnimationFrame(rt),setInterval(it,500),it()}catch(t){g("boot",t)}}Gt().catch(t=>g("main",t));})();
