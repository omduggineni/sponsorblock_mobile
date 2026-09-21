// ==UserScript==
// @name         SponsorBlock for YouTube Mobile
// @namespace    https://github.com/omduggineni/sponsorblock_mobile
// @version      1.2.0
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

"use strict";(()=>{var M="https://sponsor.ajay.app",$="SponsorBlockMobileUserscript/1.0.0",J="sbm_";var h=[{key:"sponsor",name:"Sponsor",color:"#00d400",supportsMute:!0,default:"skip"},{key:"selfpromo",name:"Unpaid/Self Promotion",color:"#ffff00",supportsMute:!0,default:"skip"},{key:"interaction",name:"Interaction Reminder",color:"#cc00ff",supportsMute:!0,default:"skip"},{key:"intro",name:"Intermission/Intro",color:"#00ffff",supportsMute:!0,default:"skip"},{key:"outro",name:"Endcards/Credits",color:"#0202ed",supportsMute:!0,default:"skip"},{key:"preview",name:"Preview/Recap",color:"#008fd6",supportsMute:!0,default:"off"},{key:"hook",name:"Hook/Greeting",color:"#395699",supportsMute:!0,default:"off"},{key:"filler",name:"Tangents/Jokes",color:"#7300ff",supportsMute:!0,default:"off"},{key:"music_offtopic",name:"Non-Music Section",color:"#ff9900",supportsMute:!1,default:"off"},{key:"poi_highlight",name:"Highlight",color:"#ff1684",supportsMute:!1,default:"notify",isPoi:!0}],L=new Map(h.map(t=>[t.key,t])),at=h.map(t=>t.key);var ct=typeof GM<"u"&&!!GM&&typeof GM.getValue=="function"&&typeof GM.setValue=="function",lt=typeof GM_getValue=="function"&&typeof GM_setValue=="function";async function v(t,e){try{if(ct){let r=await GM.getValue(t,void 0);return r===void 0?e:r}if(lt){let r=await GM_getValue(t,void 0);return r===void 0?e:r}let o=localStorage.getItem(J+t);return o===null?e:JSON.parse(o)}catch{return e}}async function A(t,e){try{if(ct){await GM.setValue(t,e);return}if(lt){await GM_setValue(t,e);return}localStorage.setItem(J+t,JSON.stringify(e))}catch{}}function pt(){let t={};for(let e of h)t[e.key]=e.default;return t}function At(){let t=new Uint8Array(20);return(window.crypto||window.msCrypto).getRandomValues(t),Array.from(t,e=>e.toString(16).padStart(2,"0")).join("")}var c={enabled:!0,serverAddress:M,categoryActions:pt(),userID:null,minDuration:0,stats:{segmentsSkipped:0,secondsSaved:0},showProgressBarSegments:!0,save(t){A(t,this[t])},setCategoryAction(t,e){this.categoryActions[t]=e,A("categoryActions",this.categoryActions)},addStats(t){this.stats.segmentsSkipped+=1,this.stats.secondsSaved+=Math.max(0,t),A("stats",this.stats)},resetStats(){this.stats={segmentsSkipped:0,secondsSaved:0},A("stats",this.stats)}};async function ut(){c.enabled=await v("enabled",!0),c.serverAddress=await v("serverAddress",M),c.categoryActions=Object.assign(pt(),await v("categoryActions",{})),c.userID=await v("userID",null),c.minDuration=await v("minDuration",0),c.stats=await v("stats",{segmentsSkipped:0,secondsSaved:0}),c.showProgressBarSegments=await v("showProgressBarSegments",!0),c.userID||(c.userID=At(),A("userID",c.userID))}var dt="SponsorBlock Mobile",mt=!1;function g(t,e){if(console.error(`[${dt}] Error in ${t}:`,e),mt)return;mt=!0;let o=e instanceof Error?e.message:String(e);try{alert(`${dt} hit an unexpected error (in ${t}) and may not work correctly on this page:

${o}

Open the browser console for the full stack trace.`)}catch{}}function V(t,e){return((...o)=>{try{let r=e(...o);return r&&typeof r.then=="function"&&r.catch(s=>g(t,s)),r}catch(r){g(t,r)}})}async function It(t){let e=new TextEncoder().encode(t),o=await crypto.subtle.digest("SHA-256",e);return Array.from(new Uint8Array(o),r=>r.toString(16).padStart(2,"0")).join("")}function Ct(t){let e=new URLSearchParams;for(let[r,s]of Object.entries(t||{}))s!=null&&e.set(r,typeof s=="string"?s:JSON.stringify(s));let o=e.toString();return o?"?"+o:""}function H(t,e,{params:o,body:r,headers:s}={}){let a=c.serverAddress+e+Ct(o),l=Object.assign({"X-Client-Name":$},s||{});if(typeof GM_xmlhttpRequest=="function")return new Promise(p=>{let d=!1,m=w=>{d||(d=!0,clearTimeout(b),p(w))},b=setTimeout(()=>m({status:0,text:""}),2e4);GM_xmlhttpRequest({method:t,url:a,headers:r?Object.assign({"Content-Type":"application/json"},l):l,data:r?JSON.stringify(r):void 0,onload:w=>m({status:w.status,text:w.responseText}),onerror:()=>m({status:0,text:""}),ontimeout:()=>m({status:0,text:""})})});let u=r?Object.assign({"Content-Type":"application/json"},l):l;return fetch(a,{method:t,headers:u,body:r?JSON.stringify(r):void 0}).then(async p=>({status:p.status,text:await p.text()})).catch(()=>({status:0,text:""}))}var x=new Map;var Dt=180*1e3;function Pt(){return at.filter(t=>c.categoryActions[t]!=="off")}async function G(t){let e=x.get(t);if(e&&Date.now()-e.fetchedAt<Dt)return e.segments;let o=Pt();if(o.length===0)return x.set(t,{segments:[],fetchedAt:Date.now()}),[];try{let r=(await It(t)).slice(0,5),s=await H("GET","/api/skipSegments/"+r,{params:{categories:o,actionTypes:["skip","mute","poi"]}}),a=[];if(s.status===200){let l=JSON.parse(s.text),u=Array.isArray(l)?l.find(p=>p.videoID===t):null;u&&Array.isArray(u.segments)&&(a=u.segments.map(p=>({uuid:p.UUID,category:p.category,actionType:p.actionType,start:p.segment[0],end:p.segment[1],locked:!!p.locked,votes:p.votes})).sort((p,d)=>p.start-d.start))}return x.set(t,{segments:a,fetchedAt:Date.now()}),a}catch(r){return console.error("[SponsorBlock Mobile] Failed to fetch segments",r),[]}}function Y(t,e){return H("POST","/api/voteOnSponsorTime",{params:{UUID:t,userID:c.userID,type:e}})}function N(t,e){return H("POST","/api/viewedVideoSponsorTime",{params:{UUID:t,videoID:e}})}function ft(t,e,o){return H("POST","/api/skipSegments",{body:{videoID:t,userID:c.userID,videoDuration:o,userAgent:$,segments:e.map(r=>({segment:[r.start,r.end],category:r.category,actionType:r.actionType}))}})}var Ut=`
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
    `;function X(){let t=document.head||document.documentElement;if(!t){window.requestAnimationFrame(X);return}let e=document.createElement("style");e.textContent=Ut,t.appendChild(e)}function i(t,e,o){let r=document.createElement(t);for(let[s,a]of Object.entries(e||{}))s==="class"?r.className=a:s==="text"?r.textContent=a:s.startsWith("on")&&typeof a=="function"?r.addEventListener(s.slice(2),V(`<${t}> ${s}`,a)):r.setAttribute(s,a);for(let s of o||[])s&&r.appendChild(typeof s=="string"?document.createTextNode(s):s);return r}function I(t){t=Math.max(0,Math.round(t));let e=Math.floor(t/3600),o=Math.floor(t%3600/60),r=t%60,s=e>0?String(o).padStart(2,"0"):String(o),a=String(r).padStart(2,"0");return e>0?`${e}:${s}:${a}`:`${s}:${a}`}function q(t){let e=L.get(t);return e?e.name:t}function C(t){try{let e=new URL(t);if(e.searchParams.has("v"))return e.searchParams.get("v");let o=e.pathname.match(/\/shorts\/([\w-]{11})/);if(o)return o[1];let r=e.pathname.match(/\/live\/([\w-]{11})/);return r?r[1]:null}catch{return null}}function K(){return document.getElementById("movie_player")}function f(){let t=K();return t&&t.querySelector("video")||document.querySelector("video")}function W(){let t=K();return!!t&&t.classList.contains("ad-showing")}function k(){let t=K();if(t){let e=t.getBoundingClientRect();if(e.width>0&&e.height>0)return e}return{top:0,left:0,right:window.innerWidth,width:window.innerWidth,height:Math.round(window.innerWidth*9/16)}}function gt(){let t=document.querySelectorAll("yt-progress-bar.ytPlayerProgressBarHost");if(!t.length)return null;for(let e of t)if(e.classList.contains("watch-page-progress-bar"))return e;return t[0]}function D(){n.poiChipEl&&(n.poiChipEl.remove(),n.poiChipEl=null)}function bt(t){if(n.poiChipEl)return;let e=i("button",{class:"sbm-poi-chip",text:"★ Jump to highlight",onclick:()=>{let r=f();r&&(r.currentTime=t.start),D(),n.poiShown=!0}}),o=k();e.style.left=o.left+o.width/2+"px",e.style.top=o.top+14+"px",document.body.appendChild(e),n.poiChipEl=e}function P(){document.querySelectorAll(".sbm-progress-overlay").forEach(t=>t.remove())}function Rt(t,e){let o=t.querySelector("yt-progress-bar-line, .ytProgressBarLineHost");if(o){let r=t.getBoundingClientRect(),s=o.getBoundingClientRect();if(r.height>0&&s.height>0){e.style.top=s.top-r.top+"px",e.style.height=s.height+"px",e.style.transform="none";return}}e.style.top="",e.style.height="",e.style.transform=""}function U(){if(!c.showProgressBarSegments){P();return}let t=f(),e=gt();if(!e||!t||!isFinite(t.duration)||t.duration<=0)return;let o=e.querySelector(":scope > .sbm-progress-overlay");if(o||(getComputedStyle(e).position==="static"&&(e.style.position="relative"),o=i("div",{class:"sbm-progress-overlay"}),e.appendChild(o),o.dataset.videoId=""),Rt(e,o),o.dataset.videoId===n.videoID&&o.dataset.count===String(n.segments.length))return;for(;o.firstChild;)o.removeChild(o.firstChild);let r=t.duration;for(let s of n.segments){if(s.actionType==="poi")continue;let a=L.get(s.category),l=Math.max(0,s.start/r*100),u=Math.max(.3,(s.end-s.start)/r*100),p=i("div",{class:"sbm-progress-seg",style:`left:${l}%;width:${u}%;background:${a?a.color:"#fff"};`});o.appendChild(p)}o.dataset.videoId=n.videoID??"",o.dataset.count=String(n.segments.length)}function R(){n.toastEl&&(n.toastEl.remove(),n.toastEl=null),n.toastTimer&&(clearTimeout(n.toastTimer),n.toastTimer=null)}function ht(t,e){R();let o=t.length===1,r=o?`Skipped ${q(t[0].category)}`:`Skipped ${t.length} segments`,s=i("button",{text:"Undo",onclick:()=>{let p=f();p&&(p.currentTime=Math.max(0,e));for(let d of t)n.overriddenUUIDs.add(d.uuid);R()}}),a=[i("span",{text:r}),s];if(o&&t[0].uuid){let p=t[0],d=i("button",{class:"sbm-vote-btn",text:"👍",onclick:()=>{d.classList.add("sbm-voted"),Y(p.uuid,1)}}),m=i("button",{class:"sbm-vote-btn",text:"👎",onclick:()=>{m.classList.add("sbm-voted"),Y(p.uuid,0)}});a.push(d,m)}let l=i("div",{class:"sbm-toast"},a),u=k();l.style.left=u.left+u.width/2+"px",l.style.top=u.top+u.height*.8+"px",document.body.appendChild(l),n.toastEl=l,n.toastTimer=setTimeout(V("toast auto-dismiss",R),4e3)}var T=null;function z(){T&&(T.remove(),T=null)}function B(){z();let t=h.map(l=>{let u=c.categoryActions[l.key],p=l.isPoi?[["off","Off"],["notify","Show"],["skip","Auto-jump"]]:[["off","Off"],["notify","Manual"],["skip","Auto-skip"]],d=i("div",{class:"sbm-seg-toggle"},p.map(([m,b])=>i("button",{text:b,class:m===u?"active":"",onclick:w=>{c.setCategoryAction(l.key,m);for(let Mt of Array.from(d.children))Mt.classList.remove("active");w.target.classList.add("active"),x.delete(n.videoID??""),n.videoID&&_(n.videoID)}})));return i("div",{class:"sbm-row"},[i("div",{class:"sbm-row-label"},[i("b",{text:l.name}),i("a",{href:`https://wiki.sponsor.ajay.app/w/${encodeURIComponent(l.name.replace(/ /g,"_"))}`,target:"_blank",rel:"noopener",text:"wiki"})]),d])}),e=i("label",{class:"sbm-switch"},[i("input",Object.assign({type:"checkbox",onchange:l=>{c.enabled=l.target.checked,c.save("enabled")}},c.enabled?{checked:"checked"}:{})),i("span",{class:"track"}),i("span",{class:"thumb"})]),o=i("label",{class:"sbm-switch"},[i("input",Object.assign({type:"checkbox",onchange:l=>{c.showProgressBarSegments=l.target.checked,c.save("showProgressBarSegments"),l.target.checked?U():P()}},c.showProgressBarSegments?{checked:"checked"}:{})),i("span",{class:"track"}),i("span",{class:"thumb"})]),r=i("input",{type:"text",value:c.serverAddress,onchange:l=>{c.serverAddress=l.target.value.replace(/\/$/,"")||M,c.save("serverAddress"),x.clear()}}),s=i("div",{class:"sbm-stats"},[i("div",{},[i("b",{text:String(c.stats.segmentsSkipped)}),i("span",{text:"segments skipped"})]),i("div",{},[i("b",{text:I(c.stats.secondsSaved)}),i("span",{text:"time saved"})])]),a=i("div",{class:"sbm-sheet"},[i("h2",{},[document.createTextNode("SponsorBlock Settings"),i("button",{class:"sbm-close",text:"✕",onclick:z})]),i("div",{class:"sbm-row"},[i("div",{class:"sbm-row-label"},[i("b",{text:"Enabled"})]),e]),i("div",{class:"sbm-row"},[i("div",{class:"sbm-row-label"},[i("b",{text:"Show segments on seek bar"})]),o]),s,i("button",{class:"sbm-btn-secondary",text:"Reset stats",onclick:()=>{c.resetStats(),z(),B()}}),i("h2",{style:"margin-top:18px;font-size:14px;color:#aaa;"},[document.createTextNode("Categories")]),...t,i("div",{class:"sbm-row-label",style:"margin-top:14px;"},[i("b",{text:"Server address"}),r])]);T=i("div",{class:"sbm-overlay-screen",onclick:l=>{l.target===T&&z()}},[a]),document.body.appendChild(T)}var y=null;function Q(){y&&(y.remove(),y=null)}function S(){let t=i("div",{},n.pendingSubmission.map((p,d)=>{let m=i("select",{onchange:b=>{p.category=b.target.value}},h.filter(b=>!b.isPoi).map(b=>i("option",Object.assign({value:b.key,text:b.name},b.key===p.category?{selected:"selected"}:{}))));return i("div",{class:"sbm-pending-item"},[i("span",{class:"sbm-time",text:`${I(p.start)} → ${I(p.end)}`}),m,i("button",{class:"sbm-del",text:"✕",onclick:()=>{n.pendingSubmission.splice(d,1),S()}})])})),e=f(),o=i("button",{class:"sbm-btn-secondary",text:"Mark start → end",onclick:()=>{e&&(n.pendingSubmission.push({start:e.currentTime,end:e.currentTime+1,category:"sponsor",actionType:"skip"}),S())}}),r=i("button",{class:"sbm-btn-secondary",text:"Mark highlight",onclick:()=>{e&&(n.pendingSubmission.push({start:e.currentTime,end:e.currentTime,category:"poi_highlight",actionType:"poi"}),S())}}),s=n.pendingSubmission[n.pendingSubmission.length-1],a=i("button",{class:"sbm-btn-secondary",text:"Set end = now",onclick:()=>{!e||!s||(s.end=e.currentTime,S())}}),l=i("button",{class:"sbm-btn-primary",text:n.pendingSubmission.length?`Submit ${n.pendingSubmission.length} segment(s)`:"Nothing to submit",onclick:async()=>{if(!n.pendingSubmission.length||!e)return;let p=n.pendingSubmission.filter(m=>m.actionType==="poi"||m.end>m.start);if(!p.length)return;let d=await ft(n.videoID,p,e.duration);d.status===200?(n.pendingSubmission=[],x.delete(n.videoID??""),Q(),n.videoID&&_(n.videoID)):alert("Submission failed (server said: "+d.status+"). Your segments were kept so you can retry.")}}),u=i("div",{class:"sbm-sheet"},[i("h2",{},[document.createTextNode("Submit a segment"),i("button",{class:"sbm-close",text:"✕",onclick:Q})]),i("div",{class:"sbm-mark-row"},[o,r]),s?i("div",{class:"sbm-mark-row"},[a]):null,t,l]);y?y.querySelector(".sbm-sheet").replaceWith(u):(y=i("div",{class:"sbm-overlay-screen",onclick:p=>{p.target===y&&Q()}},[u]),document.body.appendChild(y))}var j=null,Z=!1;function O(){j&&(j.style.display=n.videoID&&Z?"flex":"none")}function _t(t){Z=t,O()}function xt(){let t=i("button",{class:"sbm-fab",text:"⚙",title:"SponsorBlock settings",onclick:B}),e=i("button",{class:"sbm-fab",text:"+",title:"Submit a segment",onclick:S});j=i("div",{class:"sbm-fab-row"},[e,t]),document.body.appendChild(j),O()}function Ot(){return document.querySelector(".slim-video-action-bar-actions")}function tt(){let t=Ot();if(!t||t.querySelector(":scope > .sbm-action-bar-btn"))return;let e=i("button",{class:"sbm-action-bar-btn","aria-label":"SponsorBlock",title:"SponsorBlock",text:"⏭",onclick:()=>_t(!Z)});t.appendChild(e)}function yt(t,e){let o=[t[e]],r=t[e].end;for(let s=e+1;s<t.length;s++){let a=t[s];if(a.start>r+.5)break;F(a.category)==="skip"&&(n.overriddenUUIDs.has(a.uuid)||(r=Math.max(r,a.end),o.push(a)))}return{end:r,involved:o}}var St=.75;function ot(t,e){return isFinite(e.duration)&&e.duration>0&&t>=e.duration-St?Math.max(0,e.duration-St):t}function F(t){return c.categoryActions[t]||"off"}function nt(){window.requestAnimationFrame(nt);try{if(!c.enabled)return;let t=f();if(!t||W()||t.paused||C(location.href)!==n.videoID)return;let o=t.currentTime;kt(t,o),rt(t,o),Vt(t,o)}catch(t){g("tick",t)}}function kt(t,e){let r=n.segments.filter(s=>s.actionType==="mute"&&F(s.category)!=="off"&&!n.overriddenUUIDs.has(s.uuid)).find(s=>e>=s.start-.15&&e<s.end);r&&n.activeMuteUUID!==r.uuid?(n.wasMutedBeforeSegment=t.muted,t.muted=!0,n.activeMuteUUID=r.uuid):!r&&n.activeMuteUUID&&(t.muted=n.wasMutedBeforeSegment,n.activeMuteUUID=null)}function rt(t,e){let o=n.segments.filter(r=>r.actionType==="skip").sort((r,s)=>r.start-s.start);for(let r=0;r<o.length;r++){let s=o[r],a=F(s.category);if(a!=="off"&&!n.overriddenUUIDs.has(s.uuid)&&!(a==="skip"&&n.autoSkippedUUIDs.has(s.uuid))&&!(e<s.start-.15||e>=s.end)){if(a==="skip"){let{end:l,involved:u}=yt(o,r);if(l<=e)continue;let p=e,d=ot(l,t);t.currentTime=d;for(let m of u)n.autoSkippedUUIDs.add(m.uuid);c.addStats(d-p),ht(u,p);for(let m of u)N(m.uuid,n.videoID);return}else if(a==="notify"){if(n.shownManualUUIDs.has(s.uuid))continue;let{end:l}=yt(o,r);Tt(s,l);return}}}n.manualBtnUUID&&(o.some(s=>s.uuid===n.manualBtnUUID&&e>=s.start-.15&&e<s.end)||E())}function Vt(t,e){let o=n.segments.find(a=>a.actionType==="poi");if(!o)return;let r=F(o.category);if(r==="off")return;if(r==="skip"&&!n.poiAutoJumped&&e<o.start&&e<3){n.poiAutoJumped=!0,t.currentTime=o.start;return}let s=Math.max(0,o.start-20);!n.poiShown&&!n.poiChipEl&&e>=s&&e<o.start-1&&bt(o),n.poiChipEl&&(e>=o.start-1||e<s)&&D()}async function _(t){try{it(t);let e=await G(t);if(n.videoID!==t)return;n.segments=e;let o=f();o&&!W()&&(rt(o,o.currentTime),kt(o,o.currentTime)),U(),tt(),O()}catch(e){g("loadVideo",e)}}var vt=null,wt=null;function st(){try{Ht()}catch(t){g("pollNavigation",t)}}function Ht(){let t=location.href,e=C(t);t!==vt&&(vt=t,e!==n.videoID&&(e?_(e):it(null)));let o=f();o&&o!==wt&&(wt=o,e&&e===n.videoID&&rt(o,o.currentTime)),U(),tt(),O()}function E(){n.manualBtnEl&&(n.manualBtnEl.remove(),n.manualBtnEl=null,n.manualBtnUUID=null)}function Tt(t,e){if(n.manualBtnUUID===t.uuid)return;E();let o=i("button",{class:"sbm-manual-btn",onclick:()=>{let s=f();if(s){let a=s.currentTime,l=ot(e,s);s.currentTime=l,c.addStats(l-a),N(t.uuid,n.videoID)}n.shownManualUUIDs.add(t.uuid),E()}},[document.createTextNode(`Skip ${q(t.category)} ▶`)]),r=k();o.style.left=r.left+r.width-12+"px",o.style.top=r.top+r.height*.72+"px",o.style.transform="translateX(-100%)",document.body.appendChild(o),n.manualBtnEl=o,n.manualBtnUUID=t.uuid}var n={videoID:null,segments:[],overriddenUUIDs:new Set,autoSkippedUUIDs:new Set,shownManualUUIDs:new Set,poiShown:!1,poiAutoJumped:!1,activeMuteUUID:null,wasMutedBeforeSegment:!1,pendingSubmission:[],toastEl:null,toastTimer:null,manualBtnEl:null,manualBtnUUID:null,poiChipEl:null};function it(t){n.videoID=t,n.segments=[],n.overriddenUUIDs=new Set,n.autoSkippedUUIDs=new Set,n.shownManualUUIDs=new Set,n.poiShown=!1,n.poiAutoJumped=!1,n.activeMuteUUID=null,n.wasMutedBeforeSegment=!1,n.pendingSubmission=[],R(),E(),D(),P()}async function Gt(){if(!window.__sbMobileLoaded&&(window.__sbMobileLoaded=!0,!window.frameElement)){try{await ut()}catch(t){g("initConfig",t)}try{X()}catch(t){g("injectStyles",t)}try{typeof GM_registerMenuCommand=="function"&&(GM_registerMenuCommand("SponsorBlock Settings",B),GM_registerMenuCommand("Submit a segment",S))}catch(t){g("GM_registerMenuCommand",t)}Et(),window.__sbMobileDebug={Config:c,PlaybackState:n,CATEGORIES:h,getVideoIDFromURL:C,fetchSegments:G}}}function Et(){if(!document.body){window.requestAnimationFrame(Et);return}try{xt(),window.requestAnimationFrame(nt),setInterval(st,500),st()}catch(t){g("boot",t)}}Gt().catch(t=>g("main",t));})();
