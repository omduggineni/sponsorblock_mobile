// ==UserScript==
// @name         SponsorBlock for YouTube Mobile
// @namespace    https://github.com/omduggineni/sponsorblock_mobile
// @version      1.1.1
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
// @updateURL    https://raw.githubusercontent.com/omduggineni/sponsorblock_mobile/main/sponsorblock-mobile.user.js
// @downloadURL  https://raw.githubusercontent.com/omduggineni/sponsorblock_mobile/main/sponsorblock-mobile.user.js
// ==/UserScript==

"use strict";(()=>{var M="https://sponsor.ajay.app",$="SponsorBlockMobileUserscript/1.0.0",J="sbm_";var b=[{key:"sponsor",name:"Sponsor",color:"#00d400",supportsMute:!0,default:"skip"},{key:"selfpromo",name:"Unpaid/Self Promotion",color:"#ffff00",supportsMute:!0,default:"skip"},{key:"interaction",name:"Interaction Reminder",color:"#cc00ff",supportsMute:!0,default:"skip"},{key:"intro",name:"Intermission/Intro",color:"#00ffff",supportsMute:!0,default:"skip"},{key:"outro",name:"Endcards/Credits",color:"#0202ed",supportsMute:!0,default:"skip"},{key:"preview",name:"Preview/Recap",color:"#008fd6",supportsMute:!0,default:"off"},{key:"hook",name:"Hook/Greeting",color:"#395699",supportsMute:!0,default:"off"},{key:"filler",name:"Tangents/Jokes",color:"#7300ff",supportsMute:!0,default:"off"},{key:"music_offtopic",name:"Non-Music Section",color:"#ff9900",supportsMute:!1,default:"off"},{key:"poi_highlight",name:"Highlight",color:"#ff1684",supportsMute:!1,default:"notify",isPoi:!0}],L=new Map(b.map(t=>[t.key,t])),at=b.map(t=>t.key);var x=typeof GM_getValue=="function"&&typeof GM_setValue=="function";function w(t,e){try{if(x){let r=GM_getValue(t,void 0);return r===void 0?e:r}let o=localStorage.getItem(J+t);return o===null?e:JSON.parse(o)}catch{return e}}function A(t,e){try{x?GM_setValue(t,e):localStorage.setItem(J+t,JSON.stringify(e))}catch{}}function ct(){let t={};for(let e of b)t[e.key]=e.default;return t}function At(){let t=new Uint8Array(20);return(window.crypto||window.msCrypto).getRandomValues(t),Array.from(t,e=>e.toString(16).padStart(2,"0")).join("")}var l={enabled:!0,serverAddress:M,categoryActions:ct(),userID:null,minDuration:0,stats:{segmentsSkipped:0,secondsSaved:0},showProgressBarSegments:!0,save(t){A(t,this[t])},setCategoryAction(t,e){this.categoryActions[t]=e,A("categoryActions",this.categoryActions)},addStats(t){this.stats.segmentsSkipped+=1,this.stats.secondsSaved+=Math.max(0,t),A("stats",this.stats)},resetStats(){this.stats={segmentsSkipped:0,secondsSaved:0},A("stats",this.stats)}};function lt(){l.enabled=w("enabled",!0),l.serverAddress=w("serverAddress",M),l.categoryActions=Object.assign(ct(),w("categoryActions",{})),l.userID=w("userID",null),l.minDuration=w("minDuration",0),l.stats=w("stats",{segmentsSkipped:0,secondsSaved:0}),l.showProgressBarSegments=w("showProgressBarSegments",!0),l.userID||(l.userID=At(),A("userID",l.userID))}var pt="SponsorBlock Mobile",dt=!1;function g(t,e){if(console.error(`[${pt}] Error in ${t}:`,e),dt)return;dt=!0;let o=e instanceof Error?e.message:String(e);try{alert(`${pt} hit an unexpected error (in ${t}) and may not work correctly on this page:

${o}

Open the browser console for the full stack trace.`)}catch{}}function H(t,e){return((...o)=>{try{let r=e(...o);return r&&typeof r.then=="function"&&r.catch(s=>g(t,s)),r}catch(r){g(t,r)}})}async function It(t){let e=new TextEncoder().encode(t),o=await crypto.subtle.digest("SHA-256",e);return Array.from(new Uint8Array(o),r=>r.toString(16).padStart(2,"0")).join("")}function Ct(t){let e=new URLSearchParams;for(let[r,s]of Object.entries(t||{}))s!=null&&e.set(r,typeof s=="string"?s:JSON.stringify(s));let o=e.toString();return o?"?"+o:""}function V(t,e,{params:o,body:r,headers:s}={}){let c=l.serverAddress+e+Ct(o),p=Object.assign({"X-Client-Name":$},s||{});if(x&&typeof GM_xmlhttpRequest=="function")return new Promise(a=>{GM_xmlhttpRequest({method:t,url:c,headers:r?Object.assign({"Content-Type":"application/json"},p):p,data:r?JSON.stringify(r):void 0,onload:u=>a({status:u.status,text:u.responseText}),onerror:()=>a({status:0,text:""}),ontimeout:()=>a({status:0,text:""})})});let d=r?Object.assign({"Content-Type":"application/json"},p):p;return fetch(c,{method:t,headers:d,body:r?JSON.stringify(r):void 0}).then(async a=>({status:a.status,text:await a.text()})).catch(()=>({status:0,text:""}))}var y=new Map;var Dt=180*1e3;function Ut(){return at.filter(t=>l.categoryActions[t]!=="off")}async function G(t){let e=y.get(t);if(e&&Date.now()-e.fetchedAt<Dt)return e.segments;let o=Ut();if(o.length===0)return y.set(t,{segments:[],fetchedAt:Date.now()}),[];try{let r=(await It(t)).slice(0,5),s=await V("GET","/api/skipSegments/"+r,{params:{categories:o,actionTypes:["skip","mute","poi"]}}),c=[];if(s.status===200){let p=JSON.parse(s.text),d=Array.isArray(p)?p.find(a=>a.videoID===t):null;d&&Array.isArray(d.segments)&&(c=d.segments.map(a=>({uuid:a.UUID,category:a.category,actionType:a.actionType,start:a.segment[0],end:a.segment[1],locked:!!a.locked,votes:a.votes})).sort((a,u)=>a.start-u.start))}return y.set(t,{segments:c,fetchedAt:Date.now()}),c}catch(r){return console.error("[SponsorBlock Mobile] Failed to fetch segments",r),[]}}function Y(t,e){return V("POST","/api/voteOnSponsorTime",{params:{UUID:t,userID:l.userID,type:e}})}function N(t,e){return V("POST","/api/viewedVideoSponsorTime",{params:{UUID:t,videoID:e}})}function ut(t,e,o){return V("POST","/api/skipSegments",{body:{videoID:t,userID:l.userID,videoDuration:o,userAgent:$,segments:e.map(r=>({segment:[r.start,r.end],category:r.category,actionType:r.actionType}))}})}var mt=`
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
    `;function X(){if(x&&typeof GM_addStyle=="function")try{GM_addStyle(mt);return}catch{}let t=document.head||document.documentElement;if(!t){window.requestAnimationFrame(X);return}let e=document.createElement("style");e.textContent=mt,t.appendChild(e)}function i(t,e,o){let r=document.createElement(t);for(let[s,c]of Object.entries(e||{}))s==="class"?r.className=c:s==="text"?r.textContent=c:s.startsWith("on")&&typeof c=="function"?r.addEventListener(s.slice(2),H(`<${t}> ${s}`,c)):r.setAttribute(s,c);for(let s of o||[])s&&r.appendChild(typeof s=="string"?document.createTextNode(s):s);return r}function I(t){t=Math.max(0,Math.round(t));let e=Math.floor(t/3600),o=Math.floor(t%3600/60),r=t%60,s=e>0?String(o).padStart(2,"0"):String(o),c=String(r).padStart(2,"0");return e>0?`${e}:${s}:${c}`:`${s}:${c}`}function q(t){let e=L.get(t);return e?e.name:t}function C(t){try{let e=new URL(t);if(e.searchParams.has("v"))return e.searchParams.get("v");let o=e.pathname.match(/\/shorts\/([\w-]{11})/);if(o)return o[1];let r=e.pathname.match(/\/live\/([\w-]{11})/);return r?r[1]:null}catch{return null}}function K(){return document.getElementById("movie_player")}function f(){let t=K();return t&&t.querySelector("video")||document.querySelector("video")}function W(){let t=K();return!!t&&t.classList.contains("ad-showing")}function k(){let t=K();if(t){let e=t.getBoundingClientRect();if(e.width>0&&e.height>0)return e}return{top:0,left:0,right:window.innerWidth,width:window.innerWidth,height:Math.round(window.innerWidth*9/16)}}function ft(){let t=document.querySelectorAll("yt-progress-bar.ytPlayerProgressBarHost");if(!t.length)return null;for(let e of t)if(e.classList.contains("watch-page-progress-bar"))return e;return t[0]}function D(){n.poiChipEl&&(n.poiChipEl.remove(),n.poiChipEl=null)}function gt(t){if(n.poiChipEl)return;let e=i("button",{class:"sbm-poi-chip",text:"★ Jump to highlight",onclick:()=>{let r=f();r&&(r.currentTime=t.start),D(),n.poiShown=!0}}),o=k();e.style.left=o.left+o.width/2+"px",e.style.top=o.top+14+"px",document.body.appendChild(e),n.poiChipEl=e}function U(){document.querySelectorAll(".sbm-progress-overlay").forEach(t=>t.remove())}function Pt(t,e){let o=t.querySelector("yt-progress-bar-line, .ytProgressBarLineHost");if(o){let r=t.getBoundingClientRect(),s=o.getBoundingClientRect();if(r.height>0&&s.height>0){e.style.top=s.top-r.top+"px",e.style.height=s.height+"px",e.style.transform="none";return}}e.style.top="",e.style.height="",e.style.transform=""}function P(){if(!l.showProgressBarSegments){U();return}let t=f(),e=ft();if(!e||!t||!isFinite(t.duration)||t.duration<=0)return;let o=e.querySelector(":scope > .sbm-progress-overlay");if(o||(getComputedStyle(e).position==="static"&&(e.style.position="relative"),o=i("div",{class:"sbm-progress-overlay"}),e.appendChild(o),o.dataset.videoId=""),Pt(e,o),o.dataset.videoId===n.videoID&&o.dataset.count===String(n.segments.length))return;for(;o.firstChild;)o.removeChild(o.firstChild);let r=t.duration;for(let s of n.segments){if(s.actionType==="poi")continue;let c=L.get(s.category),p=Math.max(0,s.start/r*100),d=Math.max(.3,(s.end-s.start)/r*100),a=i("div",{class:"sbm-progress-seg",style:`left:${p}%;width:${d}%;background:${c?c.color:"#fff"};`});o.appendChild(a)}o.dataset.videoId=n.videoID??"",o.dataset.count=String(n.segments.length)}function R(){n.toastEl&&(n.toastEl.remove(),n.toastEl=null),n.toastTimer&&(clearTimeout(n.toastTimer),n.toastTimer=null)}function bt(t,e){R();let o=t.length===1,r=o?`Skipped ${q(t[0].category)}`:`Skipped ${t.length} segments`,s=i("button",{text:"Undo",onclick:()=>{let a=f();a&&(a.currentTime=Math.max(0,e));for(let u of t)n.overriddenUUIDs.add(u.uuid);R()}}),c=[i("span",{text:r}),s];if(o&&t[0].uuid){let a=t[0],u=i("button",{class:"sbm-vote-btn",text:"👍",onclick:()=>{u.classList.add("sbm-voted"),Y(a.uuid,1)}}),m=i("button",{class:"sbm-vote-btn",text:"👎",onclick:()=>{m.classList.add("sbm-voted"),Y(a.uuid,0)}});c.push(u,m)}let p=i("div",{class:"sbm-toast"},c),d=k();p.style.left=d.left+d.width/2+"px",p.style.top=d.top+d.height*.8+"px",document.body.appendChild(p),n.toastEl=p,n.toastTimer=setTimeout(H("toast auto-dismiss",R),4e3)}var E=null;function z(){E&&(E.remove(),E=null)}function B(){z();let t=b.map(p=>{let d=l.categoryActions[p.key],a=p.isPoi?[["off","Off"],["notify","Show"],["skip","Auto-jump"]]:[["off","Off"],["notify","Manual"],["skip","Auto-skip"]],u=i("div",{class:"sbm-seg-toggle"},a.map(([m,h])=>i("button",{text:h,class:m===d?"active":"",onclick:Tt=>{l.setCategoryAction(p.key,m);for(let Mt of Array.from(u.children))Mt.classList.remove("active");Tt.target.classList.add("active"),y.delete(n.videoID??""),n.videoID&&_(n.videoID)}})));return i("div",{class:"sbm-row"},[i("div",{class:"sbm-row-label"},[i("b",{text:p.name}),i("a",{href:`https://wiki.sponsor.ajay.app/w/${encodeURIComponent(p.name.replace(/ /g,"_"))}`,target:"_blank",rel:"noopener",text:"wiki"})]),u])}),e=i("label",{class:"sbm-switch"},[i("input",Object.assign({type:"checkbox",onchange:p=>{l.enabled=p.target.checked,l.save("enabled")}},l.enabled?{checked:"checked"}:{})),i("span",{class:"track"}),i("span",{class:"thumb"})]),o=i("label",{class:"sbm-switch"},[i("input",Object.assign({type:"checkbox",onchange:p=>{l.showProgressBarSegments=p.target.checked,l.save("showProgressBarSegments"),p.target.checked?P():U()}},l.showProgressBarSegments?{checked:"checked"}:{})),i("span",{class:"track"}),i("span",{class:"thumb"})]),r=i("input",{type:"text",value:l.serverAddress,onchange:p=>{l.serverAddress=p.target.value.replace(/\/$/,"")||M,l.save("serverAddress"),y.clear()}}),s=i("div",{class:"sbm-stats"},[i("div",{},[i("b",{text:String(l.stats.segmentsSkipped)}),i("span",{text:"segments skipped"})]),i("div",{},[i("b",{text:I(l.stats.secondsSaved)}),i("span",{text:"time saved"})])]),c=i("div",{class:"sbm-sheet"},[i("h2",{},[document.createTextNode("SponsorBlock Settings"),i("button",{class:"sbm-close",text:"✕",onclick:z})]),i("div",{class:"sbm-row"},[i("div",{class:"sbm-row-label"},[i("b",{text:"Enabled"})]),e]),i("div",{class:"sbm-row"},[i("div",{class:"sbm-row-label"},[i("b",{text:"Show segments on seek bar"})]),o]),s,i("button",{class:"sbm-btn-secondary",text:"Reset stats",onclick:()=>{l.resetStats(),z(),B()}}),i("h2",{style:"margin-top:18px;font-size:14px;color:#aaa;"},[document.createTextNode("Categories")]),...t,i("div",{class:"sbm-row-label",style:"margin-top:14px;"},[i("b",{text:"Server address"}),r])]);E=i("div",{class:"sbm-overlay-screen",onclick:p=>{p.target===E&&z()}},[c]),document.body.appendChild(E)}var S=null;function Q(){S&&(S.remove(),S=null)}function v(){let t=i("div",{},n.pendingSubmission.map((a,u)=>{let m=i("select",{onchange:h=>{a.category=h.target.value}},b.filter(h=>!h.isPoi).map(h=>i("option",Object.assign({value:h.key,text:h.name},h.key===a.category?{selected:"selected"}:{}))));return i("div",{class:"sbm-pending-item"},[i("span",{class:"sbm-time",text:`${I(a.start)} → ${I(a.end)}`}),m,i("button",{class:"sbm-del",text:"✕",onclick:()=>{n.pendingSubmission.splice(u,1),v()}})])})),e=f(),o=i("button",{class:"sbm-btn-secondary",text:"Mark start → end",onclick:()=>{e&&(n.pendingSubmission.push({start:e.currentTime,end:e.currentTime+1,category:"sponsor",actionType:"skip"}),v())}}),r=i("button",{class:"sbm-btn-secondary",text:"Mark highlight",onclick:()=>{e&&(n.pendingSubmission.push({start:e.currentTime,end:e.currentTime,category:"poi_highlight",actionType:"poi"}),v())}}),s=n.pendingSubmission[n.pendingSubmission.length-1],c=i("button",{class:"sbm-btn-secondary",text:"Set end = now",onclick:()=>{!e||!s||(s.end=e.currentTime,v())}}),p=i("button",{class:"sbm-btn-primary",text:n.pendingSubmission.length?`Submit ${n.pendingSubmission.length} segment(s)`:"Nothing to submit",onclick:async()=>{if(!n.pendingSubmission.length||!e)return;let a=n.pendingSubmission.filter(m=>m.actionType==="poi"||m.end>m.start);if(!a.length)return;let u=await ut(n.videoID,a,e.duration);u.status===200?(n.pendingSubmission=[],y.delete(n.videoID??""),Q(),n.videoID&&_(n.videoID)):alert("Submission failed (server said: "+u.status+"). Your segments were kept so you can retry.")}}),d=i("div",{class:"sbm-sheet"},[i("h2",{},[document.createTextNode("Submit a segment"),i("button",{class:"sbm-close",text:"✕",onclick:Q})]),i("div",{class:"sbm-mark-row"},[o,r]),s?i("div",{class:"sbm-mark-row"},[c]):null,t,p]);S?S.querySelector(".sbm-sheet").replaceWith(d):(S=i("div",{class:"sbm-overlay-screen",onclick:a=>{a.target===S&&Q()}},[d]),document.body.appendChild(S))}var j=null,Z=!1;function O(){j&&(j.style.display=n.videoID&&Z?"flex":"none")}function Bt(t){Z=t,O()}function ht(){let t=i("button",{class:"sbm-fab",text:"⚙",title:"SponsorBlock settings",onclick:B}),e=i("button",{class:"sbm-fab",text:"+",title:"Submit a segment",onclick:v});j=i("div",{class:"sbm-fab-row"},[e,t]),document.body.appendChild(j),O()}function _t(){return document.querySelector(".slim-video-action-bar-actions")}function tt(){let t=_t();if(!t||t.querySelector(":scope > .sbm-action-bar-btn"))return;let e=i("button",{class:"sbm-action-bar-btn","aria-label":"SponsorBlock",title:"SponsorBlock",text:"⏭",onclick:()=>Bt(!Z)});t.appendChild(e)}function xt(t,e){let o=[t[e]],r=t[e].end;for(let s=e+1;s<t.length;s++){let c=t[s];if(c.start>r+.5)break;F(c.category)==="skip"&&(n.overriddenUUIDs.has(c.uuid)||(r=Math.max(r,c.end),o.push(c)))}return{end:r,involved:o}}var yt=.75;function ot(t,e){return isFinite(e.duration)&&e.duration>0&&t>=e.duration-yt?Math.max(0,e.duration-yt):t}function F(t){return l.categoryActions[t]||"off"}function nt(){window.requestAnimationFrame(nt);try{if(!l.enabled)return;let t=f();if(!t||W()||t.paused||C(location.href)!==n.videoID)return;let o=t.currentTime;wt(t,o),rt(t,o),Lt(t,o)}catch(t){g("tick",t)}}function wt(t,e){let r=n.segments.filter(s=>s.actionType==="mute"&&F(s.category)!=="off"&&!n.overriddenUUIDs.has(s.uuid)).find(s=>e>=s.start-.15&&e<s.end);r&&n.activeMuteUUID!==r.uuid?(n.wasMutedBeforeSegment=t.muted,t.muted=!0,n.activeMuteUUID=r.uuid):!r&&n.activeMuteUUID&&(t.muted=n.wasMutedBeforeSegment,n.activeMuteUUID=null)}function rt(t,e){let o=n.segments.filter(r=>r.actionType==="skip").sort((r,s)=>r.start-s.start);for(let r=0;r<o.length;r++){let s=o[r],c=F(s.category);if(c!=="off"&&!n.overriddenUUIDs.has(s.uuid)&&!(c==="skip"&&n.autoSkippedUUIDs.has(s.uuid))&&!(e<s.start-.15||e>=s.end)){if(c==="skip"){let{end:p,involved:d}=xt(o,r);if(p<=e)continue;let a=e,u=ot(p,t);t.currentTime=u;for(let m of d)n.autoSkippedUUIDs.add(m.uuid);l.addStats(u-a),bt(d,a);for(let m of d)N(m.uuid,n.videoID);return}else if(c==="notify"){if(n.shownManualUUIDs.has(s.uuid))continue;let{end:p}=xt(o,r);kt(s,p);return}}}n.manualBtnUUID&&(o.some(s=>s.uuid===n.manualBtnUUID&&e>=s.start-.15&&e<s.end)||T())}function Lt(t,e){let o=n.segments.find(c=>c.actionType==="poi");if(!o)return;let r=F(o.category);if(r==="off")return;if(r==="skip"&&!n.poiAutoJumped&&e<o.start&&e<3){n.poiAutoJumped=!0,t.currentTime=o.start;return}let s=Math.max(0,o.start-20);!n.poiShown&&!n.poiChipEl&&e>=s&&e<o.start-1&&gt(o),n.poiChipEl&&(e>=o.start-1||e<s)&&D()}async function _(t){try{it(t);let e=await G(t);if(n.videoID!==t)return;n.segments=e;let o=f();o&&!W()&&(rt(o,o.currentTime),wt(o,o.currentTime)),P(),tt(),O()}catch(e){g("loadVideo",e)}}var St=null,vt=null;function st(){try{Ht()}catch(t){g("pollNavigation",t)}}function Ht(){let t=location.href,e=C(t);t!==St&&(St=t,e!==n.videoID&&(e?_(e):it(null)));let o=f();o&&o!==vt&&(vt=o,e&&e===n.videoID&&rt(o,o.currentTime)),P(),tt(),O()}function T(){n.manualBtnEl&&(n.manualBtnEl.remove(),n.manualBtnEl=null,n.manualBtnUUID=null)}function kt(t,e){if(n.manualBtnUUID===t.uuid)return;T();let o=i("button",{class:"sbm-manual-btn",onclick:()=>{let s=f();if(s){let c=s.currentTime,p=ot(e,s);s.currentTime=p,l.addStats(p-c),N(t.uuid,n.videoID)}n.shownManualUUIDs.add(t.uuid),T()}},[document.createTextNode(`Skip ${q(t.category)} ▶`)]),r=k();o.style.left=r.left+r.width-12+"px",o.style.top=r.top+r.height*.72+"px",o.style.transform="translateX(-100%)",document.body.appendChild(o),n.manualBtnEl=o,n.manualBtnUUID=t.uuid}var n={videoID:null,segments:[],overriddenUUIDs:new Set,autoSkippedUUIDs:new Set,shownManualUUIDs:new Set,poiShown:!1,poiAutoJumped:!1,activeMuteUUID:null,wasMutedBeforeSegment:!1,pendingSubmission:[],toastEl:null,toastTimer:null,manualBtnEl:null,manualBtnUUID:null,poiChipEl:null};function it(t){n.videoID=t,n.segments=[],n.overriddenUUIDs=new Set,n.autoSkippedUUIDs=new Set,n.shownManualUUIDs=new Set,n.poiShown=!1,n.poiAutoJumped=!1,n.activeMuteUUID=null,n.wasMutedBeforeSegment=!1,n.pendingSubmission=[],R(),T(),D(),U()}function Vt(){if(!window.__sbMobileLoaded&&(window.__sbMobileLoaded=!0,window.top===window)){try{lt()}catch(t){g("initConfig",t)}try{X()}catch(t){g("injectStyles",t)}try{x&&typeof GM_registerMenuCommand=="function"&&(GM_registerMenuCommand("SponsorBlock Settings",B),GM_registerMenuCommand("Submit a segment",v))}catch(t){g("GM_registerMenuCommand",t)}Et(),window.__sbMobileDebug={Config:l,PlaybackState:n,CATEGORIES:b,getVideoIDFromURL:C,fetchSegments:G}}}function Et(){if(!document.body){window.requestAnimationFrame(Et);return}try{ht(),window.requestAnimationFrame(nt),setInterval(st,500),st()}catch(t){g("boot",t)}}try{Vt()}catch(t){g("main",t)}})();
