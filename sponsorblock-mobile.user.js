// ==UserScript==
// @name         SponsorBlock for YouTube Mobile
// @namespace    https://github.com/omduggineni/sponsorblock_mobile
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

"use strict";(()=>{var E="https://sponsor.ajay.app",F="SponsorBlockMobileUserscript/1.0.0",j="sbm_";var g=[{key:"sponsor",name:"Sponsor",color:"#00d400",supportsMute:!0,default:"skip"},{key:"selfpromo",name:"Unpaid/Self Promotion",color:"#ffff00",supportsMute:!0,default:"skip"},{key:"interaction",name:"Interaction Reminder",color:"#cc00ff",supportsMute:!0,default:"skip"},{key:"intro",name:"Intermission/Intro",color:"#00ffff",supportsMute:!0,default:"skip"},{key:"outro",name:"Endcards/Credits",color:"#0202ed",supportsMute:!0,default:"skip"},{key:"preview",name:"Preview/Recap",color:"#008fd6",supportsMute:!0,default:"off"},{key:"hook",name:"Hook/Greeting",color:"#395699",supportsMute:!0,default:"off"},{key:"filler",name:"Tangents/Jokes",color:"#7300ff",supportsMute:!0,default:"off"},{key:"music_offtopic",name:"Non-Music Section",color:"#ff9900",supportsMute:!1,default:"off"},{key:"poi_highlight",name:"Highlight",color:"#ff1684",supportsMute:!1,default:"notify",isPoi:!0}],O=new Map(g.map(t=>[t.key,t])),nt=g.map(t=>t.key);var h=typeof GM_getValue=="function"&&typeof GM_setValue=="function";function v(t,e){try{if(h){let r=GM_getValue(t,void 0);return r===void 0?e:r}let n=localStorage.getItem(j+t);return n===null?e:JSON.parse(n)}catch{return e}}function M(t,e){try{h?GM_setValue(t,e):localStorage.setItem(j+t,JSON.stringify(e))}catch{}}function rt(){let t={};for(let e of g)t[e.key]=e.default;return t}function vt(){let t=new Uint8Array(20);return(window.crypto||window.msCrypto).getRandomValues(t),Array.from(t,e=>e.toString(16).padStart(2,"0")).join("")}var l={enabled:!0,serverAddress:E,categoryActions:rt(),userID:null,minDuration:0,stats:{segmentsSkipped:0,secondsSaved:0},showProgressBarSegments:!0,save(t){M(t,this[t])},setCategoryAction(t,e){this.categoryActions[t]=e,M("categoryActions",this.categoryActions)},addStats(t){this.stats.segmentsSkipped+=1,this.stats.secondsSaved+=Math.max(0,t),M("stats",this.stats)},resetStats(){this.stats={segmentsSkipped:0,secondsSaved:0},M("stats",this.stats)}};function st(){l.enabled=v("enabled",!0),l.serverAddress=v("serverAddress",E),l.categoryActions=Object.assign(rt(),v("categoryActions",{})),l.userID=v("userID",null),l.minDuration=v("minDuration",0),l.stats=v("stats",{segmentsSkipped:0,secondsSaved:0}),l.showProgressBarSegments=v("showProgressBarSegments",!0),l.userID||(l.userID=vt(),M("userID",l.userID))}async function wt(t){let e=new TextEncoder().encode(t),n=await crypto.subtle.digest("SHA-256",e);return Array.from(new Uint8Array(n),r=>r.toString(16).padStart(2,"0")).join("")}function kt(t){let e=new URLSearchParams;for(let[r,s]of Object.entries(t||{}))s!=null&&e.set(r,typeof s=="string"?s:JSON.stringify(s));let n=e.toString();return n?"?"+n:""}function L(t,e,{params:n,body:r,headers:s}={}){let c=l.serverAddress+e+kt(n),p=Object.assign({"X-Client-Name":F},s||{});if(h&&typeof GM_xmlhttpRequest=="function")return new Promise(a=>{GM_xmlhttpRequest({method:t,url:c,headers:r?Object.assign({"Content-Type":"application/json"},p):p,data:r?JSON.stringify(r):void 0,onload:u=>a({status:u.status,text:u.responseText}),onerror:()=>a({status:0,text:""}),ontimeout:()=>a({status:0,text:""})})});let d=r?Object.assign({"Content-Type":"application/json"},p):p;return fetch(c,{method:t,headers:d,body:r?JSON.stringify(r):void 0}).then(async a=>({status:a.status,text:await a.text()})).catch(()=>({status:0,text:""}))}var x=new Map;var Tt=180*1e3;function Et(){return nt.filter(t=>l.categoryActions[t]!=="off")}async function B(t){let e=x.get(t);if(e&&Date.now()-e.fetchedAt<Tt)return e.segments;let n=Et();if(n.length===0)return x.set(t,{segments:[],fetchedAt:Date.now()}),[];try{let r=(await wt(t)).slice(0,5),s=await L("GET","/api/skipSegments/"+r,{params:{categories:n,actionTypes:["skip","mute","poi"]}}),c=[];if(s.status===200){let p=JSON.parse(s.text),d=Array.isArray(p)?p.find(a=>a.videoID===t):null;d&&Array.isArray(d.segments)&&(c=d.segments.map(a=>({uuid:a.UUID,category:a.category,actionType:a.actionType,start:a.segment[0],end:a.segment[1],locked:!!a.locked,votes:a.votes})).sort((a,u)=>a.start-u.start))}return x.set(t,{segments:c,fetchedAt:Date.now()}),c}catch(r){return console.error("[SponsorBlock Mobile] Failed to fetch segments",r),[]}}function $(t,e){return L("POST","/api/voteOnSponsorTime",{params:{UUID:t,userID:l.userID,type:e}})}function H(t,e){return L("POST","/api/viewedVideoSponsorTime",{params:{UUID:t,videoID:e}})}function it(t,e,n){return L("POST","/api/skipSegments",{body:{videoID:t,userID:l.userID,videoDuration:n,userAgent:F,segments:e.map(r=>({segment:[r.start,r.end],category:r.category,actionType:r.actionType}))}})}var at=`
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
    `;function J(){if(h&&typeof GM_addStyle=="function"){GM_addStyle(at);return}let t=document.head||document.documentElement;if(!t){window.requestAnimationFrame(J);return}let e=document.createElement("style");e.textContent=at,t.appendChild(e)}function i(t,e,n){let r=document.createElement(t);for(let[s,c]of Object.entries(e||{}))s==="class"?r.className=c:s==="text"?r.textContent=c:s.startsWith("on")&&typeof c=="function"?r.addEventListener(s.slice(2),c):r.setAttribute(s,c);for(let s of n||[])s&&r.appendChild(typeof s=="string"?document.createTextNode(s):s);return r}function I(t){t=Math.max(0,Math.round(t));let e=Math.floor(t/3600),n=Math.floor(t%3600/60),r=t%60,s=e>0?String(n).padStart(2,"0"):String(n),c=String(r).padStart(2,"0");return e>0?`${e}:${s}:${c}`:`${s}:${c}`}function V(t){let e=O.get(t);return e?e.name:t}function A(t){try{let e=new URL(t);if(e.searchParams.has("v"))return e.searchParams.get("v");let n=e.pathname.match(/\/shorts\/([\w-]{11})/);if(n)return n[1];let r=e.pathname.match(/\/live\/([\w-]{11})/);return r?r[1]:null}catch{return null}}function Y(){return document.getElementById("movie_player")}function f(){let t=Y();return t&&t.querySelector("video")||document.querySelector("video")}function X(){let t=Y();return!!t&&t.classList.contains("ad-showing")}function w(){let t=Y();if(t){let e=t.getBoundingClientRect();if(e.width>0&&e.height>0)return e}return{top:0,left:0,right:window.innerWidth,width:window.innerWidth,height:Math.round(window.innerWidth*9/16)}}function ct(){let t=document.querySelectorAll("yt-progress-bar.ytPlayerProgressBarHost");if(!t.length)return null;for(let e of t)if(e.classList.contains("watch-page-progress-bar"))return e;return t[0]}function C(){o.poiChipEl&&(o.poiChipEl.remove(),o.poiChipEl=null)}function lt(t){if(o.poiChipEl)return;let e=i("button",{class:"sbm-poi-chip",text:"★ Jump to highlight",onclick:()=>{let r=f();r&&(r.currentTime=t.start),C(),o.poiShown=!0}}),n=w();e.style.left=n.left+n.width/2+"px",e.style.top=n.top+14+"px",document.body.appendChild(e),o.poiChipEl=e}function D(){document.querySelectorAll(".sbm-progress-overlay").forEach(t=>t.remove())}function Mt(t,e){let n=t.querySelector("yt-progress-bar-line, .ytProgressBarLineHost");if(n){let r=t.getBoundingClientRect(),s=n.getBoundingClientRect();if(r.height>0&&s.height>0){e.style.top=s.top-r.top+"px",e.style.height=s.height+"px",e.style.transform="none";return}}e.style.top="",e.style.height="",e.style.transform=""}function U(){if(!l.showProgressBarSegments){D();return}let t=f(),e=ct();if(!e||!t||!isFinite(t.duration)||t.duration<=0)return;let n=e.querySelector(":scope > .sbm-progress-overlay");if(n||(getComputedStyle(e).position==="static"&&(e.style.position="relative"),n=i("div",{class:"sbm-progress-overlay"}),e.appendChild(n),n.dataset.videoId=""),Mt(e,n),n.dataset.videoId===o.videoID&&n.dataset.count===String(o.segments.length))return;for(;n.firstChild;)n.removeChild(n.firstChild);let r=t.duration;for(let s of o.segments){if(s.actionType==="poi")continue;let c=O.get(s.category),p=Math.max(0,s.start/r*100),d=Math.max(.3,(s.end-s.start)/r*100),a=i("div",{class:"sbm-progress-seg",style:`left:${p}%;width:${d}%;background:${c?c.color:"#fff"};`});n.appendChild(a)}n.dataset.videoId=o.videoID??"",n.dataset.count=String(o.segments.length)}function P(){o.toastEl&&(o.toastEl.remove(),o.toastEl=null),o.toastTimer&&(clearTimeout(o.toastTimer),o.toastTimer=null)}function pt(t,e){P();let n=t.length===1,r=n?`Skipped ${V(t[0].category)}`:`Skipped ${t.length} segments`,s=i("button",{text:"Undo",onclick:()=>{let a=f();a&&(a.currentTime=Math.max(0,e));for(let u of t)o.overriddenUUIDs.add(u.uuid);P()}}),c=[i("span",{text:r}),s];if(n&&t[0].uuid){let a=t[0],u=i("button",{class:"sbm-vote-btn",text:"👍",onclick:()=>{u.classList.add("sbm-voted"),$(a.uuid,1)}}),m=i("button",{class:"sbm-vote-btn",text:"👎",onclick:()=>{m.classList.add("sbm-voted"),$(a.uuid,0)}});c.push(u,m)}let p=i("div",{class:"sbm-toast"},c),d=w();p.style.left=d.left+d.width/2+"px",p.style.top=d.top+d.height*.8+"px",document.body.appendChild(p),o.toastEl=p,o.toastTimer=setTimeout(P,4e3)}var k=null;function G(){k&&(k.remove(),k=null)}function R(){G();let t=g.map(p=>{let d=l.categoryActions[p.key],a=p.isPoi?[["off","Off"],["notify","Show"],["skip","Auto-jump"]]:[["off","Off"],["notify","Manual"],["skip","Auto-skip"]],u=i("div",{class:"sbm-seg-toggle"},a.map(([m,b])=>i("button",{text:b,class:m===d?"active":"",onclick:yt=>{l.setCategoryAction(p.key,m);for(let St of Array.from(u.children))St.classList.remove("active");yt.target.classList.add("active"),x.delete(o.videoID??""),o.videoID&&_(o.videoID)}})));return i("div",{class:"sbm-row"},[i("div",{class:"sbm-row-label"},[i("b",{text:p.name}),i("a",{href:`https://wiki.sponsor.ajay.app/w/${encodeURIComponent(p.name.replace(/ /g,"_"))}`,target:"_blank",rel:"noopener",text:"wiki"})]),u])}),e=i("label",{class:"sbm-switch"},[i("input",Object.assign({type:"checkbox",onchange:p=>{l.enabled=p.target.checked,l.save("enabled")}},l.enabled?{checked:"checked"}:{})),i("span",{class:"track"}),i("span",{class:"thumb"})]),n=i("label",{class:"sbm-switch"},[i("input",Object.assign({type:"checkbox",onchange:p=>{l.showProgressBarSegments=p.target.checked,l.save("showProgressBarSegments"),p.target.checked?U():D()}},l.showProgressBarSegments?{checked:"checked"}:{})),i("span",{class:"track"}),i("span",{class:"thumb"})]),r=i("input",{type:"text",value:l.serverAddress,onchange:p=>{l.serverAddress=p.target.value.replace(/\/$/,"")||E,l.save("serverAddress"),x.clear()}}),s=i("div",{class:"sbm-stats"},[i("div",{},[i("b",{text:String(l.stats.segmentsSkipped)}),i("span",{text:"segments skipped"})]),i("div",{},[i("b",{text:I(l.stats.secondsSaved)}),i("span",{text:"time saved"})])]),c=i("div",{class:"sbm-sheet"},[i("h2",{},[document.createTextNode("SponsorBlock Settings"),i("button",{class:"sbm-close",text:"✕",onclick:G})]),i("div",{class:"sbm-row"},[i("div",{class:"sbm-row-label"},[i("b",{text:"Enabled"})]),e]),i("div",{class:"sbm-row"},[i("div",{class:"sbm-row-label"},[i("b",{text:"Show segments on seek bar"})]),n]),s,i("button",{class:"sbm-btn-secondary",text:"Reset stats",onclick:()=>{l.resetStats(),G(),R()}}),i("h2",{style:"margin-top:18px;font-size:14px;color:#aaa;"},[document.createTextNode("Categories")]),...t,i("div",{class:"sbm-row-label",style:"margin-top:14px;"},[i("b",{text:"Server address"}),r])]);k=i("div",{class:"sbm-overlay-screen",onclick:p=>{p.target===k&&G()}},[c]),document.body.appendChild(k)}var y=null;function K(){y&&(y.remove(),y=null)}function S(){let t=i("div",{},o.pendingSubmission.map((a,u)=>{let m=i("select",{onchange:b=>{a.category=b.target.value}},g.filter(b=>!b.isPoi).map(b=>i("option",Object.assign({value:b.key,text:b.name},b.key===a.category?{selected:"selected"}:{}))));return i("div",{class:"sbm-pending-item"},[i("span",{class:"sbm-time",text:`${I(a.start)} → ${I(a.end)}`}),m,i("button",{class:"sbm-del",text:"✕",onclick:()=>{o.pendingSubmission.splice(u,1),S()}})])})),e=f(),n=i("button",{class:"sbm-btn-secondary",text:"Mark start → end",onclick:()=>{e&&(o.pendingSubmission.push({start:e.currentTime,end:e.currentTime+1,category:"sponsor",actionType:"skip"}),S())}}),r=i("button",{class:"sbm-btn-secondary",text:"Mark highlight",onclick:()=>{e&&(o.pendingSubmission.push({start:e.currentTime,end:e.currentTime,category:"poi_highlight",actionType:"poi"}),S())}}),s=o.pendingSubmission[o.pendingSubmission.length-1],c=i("button",{class:"sbm-btn-secondary",text:"Set end = now",onclick:()=>{!e||!s||(s.end=e.currentTime,S())}}),p=i("button",{class:"sbm-btn-primary",text:o.pendingSubmission.length?`Submit ${o.pendingSubmission.length} segment(s)`:"Nothing to submit",onclick:async()=>{if(!o.pendingSubmission.length||!e)return;let a=o.pendingSubmission.filter(m=>m.actionType==="poi"||m.end>m.start);if(!a.length)return;let u=await it(o.videoID,a,e.duration);u.status===200?(o.pendingSubmission=[],x.delete(o.videoID??""),K(),o.videoID&&_(o.videoID)):alert("Submission failed (server said: "+u.status+"). Your segments were kept so you can retry.")}}),d=i("div",{class:"sbm-sheet"},[i("h2",{},[document.createTextNode("Submit a segment"),i("button",{class:"sbm-close",text:"✕",onclick:K})]),i("div",{class:"sbm-mark-row"},[n,r]),s?i("div",{class:"sbm-mark-row"},[c]):null,t,p]);y?y.querySelector(".sbm-sheet").replaceWith(d):(y=i("div",{class:"sbm-overlay-screen",onclick:a=>{a.target===y&&K()}},[d]),document.body.appendChild(y))}var N=null;function z(){N&&(N.style.display=o.videoID?"flex":"none")}function dt(){let t=i("button",{class:"sbm-fab",text:"⚙",title:"SponsorBlock settings",onclick:R}),e=i("button",{class:"sbm-fab",text:"+",title:"Submit a segment",onclick:S});N=i("div",{class:"sbm-fab-row"},[e,t]),document.body.appendChild(N),z()}function ut(t,e){let n=[t[e]],r=t[e].end;for(let s=e+1;s<t.length;s++){let c=t[s];if(c.start>r+.5)break;q(c.category)==="skip"&&(o.overriddenUUIDs.has(c.uuid)||(r=Math.max(r,c.end),n.push(c)))}return{end:r,involved:n}}var mt=.75;function Q(t,e){return isFinite(e.duration)&&e.duration>0&&t>=e.duration-mt?Math.max(0,e.duration-mt):t}function q(t){return l.categoryActions[t]||"off"}function Z(){if(window.requestAnimationFrame(Z),!l.enabled)return;let t=f();if(!t||X()||t.paused||A(location.href)!==o.videoID)return;let n=t.currentTime;bt(t,n),tt(t,n),Ct(t,n)}function bt(t,e){let r=o.segments.filter(s=>s.actionType==="mute"&&q(s.category)!=="off"&&!o.overriddenUUIDs.has(s.uuid)).find(s=>e>=s.start-.15&&e<s.end);r&&o.activeMuteUUID!==r.uuid?(o.wasMutedBeforeSegment=t.muted,t.muted=!0,o.activeMuteUUID=r.uuid):!r&&o.activeMuteUUID&&(t.muted=o.wasMutedBeforeSegment,o.activeMuteUUID=null)}function tt(t,e){let n=o.segments.filter(r=>r.actionType==="skip").sort((r,s)=>r.start-s.start);for(let r=0;r<n.length;r++){let s=n[r],c=q(s.category);if(c!=="off"&&!o.overriddenUUIDs.has(s.uuid)&&!(c==="skip"&&o.autoSkippedUUIDs.has(s.uuid))&&!(e<s.start-.15||e>=s.end)){if(c==="skip"){let{end:p,involved:d}=ut(n,r);if(p<=e)continue;let a=e,u=Q(p,t);t.currentTime=u;for(let m of d)o.autoSkippedUUIDs.add(m.uuid);l.addStats(u-a),pt(d,a);for(let m of d)H(m.uuid,o.videoID);return}else if(c==="notify"){if(o.shownManualUUIDs.has(s.uuid))continue;let{end:p}=ut(n,r);ht(s,p);return}}}o.manualBtnUUID&&(n.some(s=>s.uuid===o.manualBtnUUID&&e>=s.start-.15&&e<s.end)||T())}function Ct(t,e){let n=o.segments.find(c=>c.actionType==="poi");if(!n)return;let r=q(n.category);if(r==="off")return;if(r==="skip"&&!o.poiAutoJumped&&e<n.start&&e<3){o.poiAutoJumped=!0,t.currentTime=n.start;return}let s=Math.max(0,n.start-20);!o.poiShown&&!o.poiChipEl&&e>=s&&e<n.start-1&&lt(n),o.poiChipEl&&(e>=n.start-1||e<s)&&C()}async function _(t){ot(t);let e=await B(t);if(o.videoID!==t)return;o.segments=e;let n=f();n&&!X()&&(tt(n,n.currentTime),bt(n,n.currentTime)),U(),z()}var ft=null,gt=null;function et(){let t=location.href,e=A(t);t!==ft&&(ft=t,e!==o.videoID&&(e?_(e):ot(null)));let n=f();n&&n!==gt&&(gt=n,e&&e===o.videoID&&tt(n,n.currentTime)),U(),z()}function T(){o.manualBtnEl&&(o.manualBtnEl.remove(),o.manualBtnEl=null,o.manualBtnUUID=null)}function ht(t,e){if(o.manualBtnUUID===t.uuid)return;T();let n=i("button",{class:"sbm-manual-btn",onclick:()=>{let s=f();if(s){let c=s.currentTime,p=Q(e,s);s.currentTime=p,l.addStats(p-c),H(t.uuid,o.videoID)}o.shownManualUUIDs.add(t.uuid),T()}},[document.createTextNode(`Skip ${V(t.category)} ▶`)]),r=w();n.style.left=r.left+r.width-12+"px",n.style.top=r.top+r.height*.72+"px",n.style.transform="translateX(-100%)",document.body.appendChild(n),o.manualBtnEl=n,o.manualBtnUUID=t.uuid}var o={videoID:null,segments:[],overriddenUUIDs:new Set,autoSkippedUUIDs:new Set,shownManualUUIDs:new Set,poiShown:!1,poiAutoJumped:!1,activeMuteUUID:null,wasMutedBeforeSegment:!1,pendingSubmission:[],toastEl:null,toastTimer:null,manualBtnEl:null,manualBtnUUID:null,poiChipEl:null};function ot(t){o.videoID=t,o.segments=[],o.overriddenUUIDs=new Set,o.autoSkippedUUIDs=new Set,o.shownManualUUIDs=new Set,o.poiShown=!1,o.poiAutoJumped=!1,o.activeMuteUUID=null,o.wasMutedBeforeSegment=!1,o.pendingSubmission=[],P(),T(),C(),D()}function Dt(){window.__sbMobileLoaded||(window.__sbMobileLoaded=!0,window.top===window&&(st(),J(),h&&typeof GM_registerMenuCommand=="function"&&(GM_registerMenuCommand("SponsorBlock Settings",R),GM_registerMenuCommand("Submit a segment",S)),xt(),window.__sbMobileDebug={Config:l,PlaybackState:o,CATEGORIES:g,getVideoIDFromURL:A,fetchSegments:B}))}function xt(){if(!document.body){window.requestAnimationFrame(xt);return}dt(),window.requestAnimationFrame(Z),setInterval(et,500),et()}Dt();})();
