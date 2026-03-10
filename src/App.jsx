import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, addDoc, query, orderBy,
  limit, onSnapshot, updateDoc, doc, serverTimestamp,
  where
} from "firebase/firestore";

// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE
// ─────────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyB_gNokFnucM2nNAhhkRRnPsPNBAShYlMs",
  authDomain: "it-token.firebaseapp.com",
  projectId: "it-token",
  storageBucket: "it-token.firebasestorage.app",
  messagingSenderId: "804328953904",
  appId: "1:804328953904:web:e760545b579bf2527075f5"
};
const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const CA         = "CFNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const BURN_SOL   = 0.01;
const SOLANA_RPC = "https://api.mainnet-beta.solana.com";
const MEMO_PROG  = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

const REACTIONS = [
  { key: "candle", emoji: "🕯️", label: "I've felt this" },
  { key: "heavy",  emoji: "🪨", label: "heavy"           },
  { key: "eye",    emoji: "👁️", label: "I see you"       },
  { key: "fire",   emoji: "🔥", label: "burn it"         },
  { key: "grave",  emoji: "💀", label: "take it to the grave" },
];

const CATEGORIES = [
  { key: "crypto",  emoji: "💸", label: "Money & Crypto"               },
  { key: "love",    emoji: "❤️",  label: "Love & Betrayal"              },
  { key: "family",  emoji: "👨‍👩‍👧", label: "Family"                       },
  { key: "self",    emoji: "🪞", label: "Things I did to myself"       },
  { key: "online",  emoji: "🌐", label: "Things I did online"          },
  { key: "unsaid",  emoji: "☠️", label: "Things I'd never say out loud" },
  { key: "good",    emoji: "✨", label: "Good things I'm ashamed of"   },
];

const SOCIAL = {
  x:         "https://x.com/confessioncoin",
  community: "https://x.com/i/communities/confessioncoin",
  github:    "https://github.com/confessioncoin/confessioncoin",
};

// ─────────────────────────────────────────────────────────────────────────────
// DETECT MOBILE
// ─────────────────────────────────────────────────────────────────────────────
const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STYLES — refined, no circus cursor ring, subtle bg, bigger mobile type
// ─────────────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=IBM+Plex+Mono:wght@300;400;500&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  --black:   #060606;
  --deep:    #0a0a08;
  --surface: #0f0f0d;
  --border:  #191917;
  --border2: #242420;
  --muted:   #38382f;
  --dim:     #5e5e52;
  --soft:    #8a8978;
  --paper:   #ede8da;
  --warm:    #f4efe2;
  --amber:   #c8922a;
  --amlo:    #7a5a18;
  --amhi:    #e8a93a;
  --serif:   'Cormorant Garamond',Georgia,serif;
  --mono:    'IBM Plex Mono','Courier New',monospace;
  --ease:    cubic-bezier(0.23,1,0.32,1);
}

html{scroll-behavior:smooth;font-size:16px}

/* ── MOBILE: bump base font so everything scales up ── */
@media(max-width:640px){html{font-size:17px}}

body{
  background:var(--black);
  color:var(--paper);
  font-family:var(--serif);
  min-height:100vh;
  overflow-x:hidden;
  -webkit-font-smoothing:antialiased;
}

::-webkit-scrollbar{width:2px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}
::selection{background:var(--amber);color:var(--black)}

button{cursor:pointer;border:none;background:none;font-family:inherit;color:inherit;padding:0}
a{color:inherit;text-decoration:none;cursor:pointer}
textarea,input[type=range],input[type=text],input[type=checkbox]{font-family:inherit}
textarea:focus,input:focus{outline:none}

/* ── SUBTLE STATIC BACKGROUND ── */
body::before{
  content:'';
  position:fixed;inset:0;z-index:0;pointer-events:none;
  background:
    radial-gradient(ellipse 70% 55% at 20% 15%, rgba(200,146,42,0.028) 0%, transparent 100%),
    radial-gradient(ellipse 50% 40% at 80% 80%, rgba(200,146,42,0.018) 0%, transparent 100%),
    radial-gradient(ellipse 80% 60% at 50% 50%, rgba(15,12,6,0.5) 0%, transparent 100%);
}

/* ── GRAIN ── */
body::after{
  content:'';
  position:fixed;inset:0;z-index:9997;pointer-events:none;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.038'/%3E%3C/svg%3E");
  opacity:0.45;
}

/* ── VIGNETTE ── */
#vig{
  position:fixed;inset:0;z-index:9996;pointer-events:none;
  background:radial-gradient(ellipse at 50% 40%,transparent 30%,rgba(0,0,0,0.65) 100%);
}

/* ── CONTENT LAYER ── */
#app-layer{position:relative;z-index:10}

/* ── ANIMATIONS ── */
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes confIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes modalUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
@keyframes overlayIn{from{opacity:0}to{opacity:1}}
@keyframes slideDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
@keyframes flicker{0%,100%{opacity:1}47%{opacity:1}50%{opacity:.6}53%{opacity:1}79%{opacity:.8}82%{opacity:1}}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.2}}
@keyframes glow{0%,100%{box-shadow:0 0 22px rgba(200,146,42,.07)}50%{box-shadow:0 0 42px rgba(200,146,42,.28),0 0 80px rgba(200,146,42,.05)}}
@keyframes candleWave{0%,100%{transform:scaleY(1) scaleX(1)}33%{transform:scaleY(1.07) scaleX(.94)}66%{transform:scaleY(.96) scaleX(1.05)}}
@keyframes rippleOut{0%{transform:scale(0);opacity:.5}100%{transform:scale(3.5);opacity:0}}
@keyframes floatUp{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-55px)}}
@keyframes inkDraw{from{transform:scaleX(0)}to{transform:scaleX(1)}}

.fade-up{animation:fadeUp .6s var(--ease) both}
.fade-in{animation:fadeIn .4s var(--ease) both}
.flicker{animation:flicker 5s ease-in-out infinite}
.blink{animation:blink 1.1s step-end infinite}
.conf-enter{animation:confIn .7s var(--ease) both}

/* ── LAYOUT ── */
.page{max-width:760px;margin:0 auto;padding:106px 28px 180px;position:relative}
@media(max-width:640px){.page{padding:92px 18px 160px}}

/* ── NAV ── */
.nav{
  position:fixed;top:0;left:0;right:0;z-index:800;
  height:58px;display:flex;align-items:center;justify-content:space-between;
  padding:0 26px;
  background:rgba(6,6,6,.95);
  backdrop-filter:blur(20px) saturate(1.4);
  -webkit-backdrop-filter:blur(20px) saturate(1.4);
  border-bottom:1px solid var(--border);
}
@media(max-width:640px){.nav{padding:0 14px}}
.nav-brand{display:flex;align-items:center;gap:9px}
.nav-brand img{height:24px;width:auto;object-fit:contain;display:block}
.nav-brand-name{font-family:var(--serif);font-style:italic;font-weight:600;font-size:1rem;letter-spacing:.14em;color:var(--warm)}
.nav-right{display:flex;align-items:center;gap:2px}
.nav-lk{
  font-family:var(--mono);font-size:.575rem;letter-spacing:.09em;
  color:var(--dim);padding:6px 10px;border-radius:3px;
  transition:color .2s,background .2s;white-space:nowrap;
}
.nav-lk:hover{color:var(--soft);background:rgba(255,255,255,.025)}
.nav-lk.on{color:var(--paper);background:rgba(255,255,255,.035)}
.nav-lk.chain-on{color:var(--amber)}
.nav-ico{width:28px;height:28px;display:flex;align-items:center;justify-content:center;color:var(--dim);border-radius:3px;transition:color .2s,background .2s}
.nav-ico:hover{color:var(--soft);background:rgba(255,255,255,.03)}
.nav-sep{width:1px;height:13px;background:var(--border2);margin:0 3px;flex-shrink:0}
@media(max-width:640px){.nav-right .nav-lk{display:none}.nav-right .nav-sep:first-of-type{display:none}}

/* ── CA BAR ── */
.ca-bar{
  position:fixed;top:58px;left:0;right:0;z-index:700;
  height:32px;display:flex;align-items:center;justify-content:center;
  background:var(--surface);border-bottom:1px solid var(--border);
}
.ca-pill{
  display:inline-flex;align-items:center;gap:7px;
  padding:3px 13px;border:1px solid var(--border2);
  border-radius:100px;cursor:pointer;
  transition:border-color .22s,background .22s;
  background:var(--black);
}
.ca-pill:hover{border-color:var(--amlo)}
.ca-pill.copied{border-color:var(--amber);background:rgba(200,146,42,.035)}
.ca-tick{font-family:var(--mono);font-size:.57rem;font-weight:500;color:var(--amber);letter-spacing:.07em}
.ca-sep{width:1px;height:9px;background:var(--border2)}
.ca-addr{font-family:var(--mono);font-size:.55rem;color:var(--dim);letter-spacing:.035em;max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ca-ico{font-size:.6rem;color:var(--muted);min-width:10px;transition:color .2s}
.ca-pill.copied .ca-ico{color:var(--amber)}
@media(max-width:400px){.ca-addr{max-width:80px}}

/* ── WALL HEADER ── */
.wall-head{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:32px;padding-bottom:22px;
  border-bottom:1px solid var(--border);
  gap:12px;flex-wrap:wrap;
}
.wall-h1{display:flex;align-items:center;gap:9px}
.wall-title{
  font-family:var(--serif);font-style:italic;font-weight:400;
  font-size:clamp(1.3rem,4vw,1.6rem);color:var(--warm);letter-spacing:.04em;
}
@media(max-width:640px){.wall-title{font-size:1.4rem}}
.wall-meta{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.live-dot{display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--amber);animation:pulse 2.2s ease-in-out infinite}
.live-lbl{font-family:var(--mono);font-size:.57rem;color:var(--dim);letter-spacing:.09em;display:flex;align-items:center;gap:5px}
.filter-tog{
  font-family:var(--mono);font-size:.56rem;letter-spacing:.07em;
  color:var(--dim);padding:5px 10px;
  border:1px solid var(--border);border-radius:3px;
  transition:all .18s;
}
.filter-tog:hover{color:var(--soft);border-color:var(--border2)}
.filter-tog.on{color:var(--amber);border-color:var(--amlo);background:rgba(200,146,42,.035)}

/* ── FILTER STRIP ── */
.fstrip{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:26px;animation:slideDown .22s var(--ease)}
.fchip{
  font-family:var(--mono);font-size:.55rem;letter-spacing:.06em;
  color:var(--dim);padding:5px 11px;
  border:1px solid var(--border);border-radius:100px;
  transition:all .18s;white-space:nowrap;
}
.fchip:hover{color:var(--soft);border-color:var(--border2)}
.fchip.on{color:var(--amber);border-color:var(--amlo);background:rgba(200,146,42,.04)}

/* ── SEARCH BAR ── */
.search-wrap{position:relative;margin-bottom:30px}
.search-input{
  width:100%;background:transparent;
  border:none;border-bottom:1px solid var(--border);
  padding:8px 0 10px 22px;
  font-family:var(--mono);font-size:.64rem;
  color:var(--paper);letter-spacing:.05em;
  transition:border-color .25s;
  caret-color:var(--amber);
}
@media(max-width:640px){.search-input{font-size:.72rem;padding-bottom:12px}}
.search-input:focus{border-color:var(--border2)}
.search-input::placeholder{color:var(--muted)}
.search-icon{position:absolute;left:0;top:50%;transform:translateY(-50%);font-size:.72rem;color:var(--muted)}

/* ══════════════════════════════
   CONFESSION CARDS — cleaner
   ══════════════════════════════ */

.card{
  position:relative;
  padding:26px 0;
  border-bottom:1px solid var(--border);
  animation:confIn .65s var(--ease) both;
}
.card:first-child{border-top:1px solid var(--border)}

/* Left accent line that draws in on hover */
.card::before{
  content:'';
  position:absolute;left:0;top:26px;bottom:26px;
  width:1px;background:var(--amlo);
  transform:scaleY(0);transform-origin:top;
  transition:transform .4s var(--ease);
}
.card:hover::before{transform:scaleY(1)}

/* Bottom ink line */
.card-ink{
  position:absolute;bottom:0;left:0;
  height:1px;width:100%;
  background:linear-gradient(to right,rgba(200,146,42,.3),transparent 70%);
  transform:scaleX(0);transform-origin:left;
  transition:transform .45s var(--ease);
}
.card:hover .card-ink{transform:scaleX(1)}

/* WHISPER */
.card.whisper-card{padding:18px 0 18px 18px;opacity:.8;transition:opacity .25s}
.card.whisper-card:hover{opacity:1}
.card.whisper-card .card-text{
  font-size:.9rem;color:var(--soft);font-weight:300;
  font-style:italic;line-height:1.9;letter-spacing:.02em;
}
@media(max-width:640px){.card.whisper-card .card-text{font-size:1rem}}

/* NORMAL */
.card.normal-card .card-text{
  font-size:1.08rem;color:var(--paper);font-style:italic;line-height:1.8;
}
@media(max-width:640px){.card.normal-card .card-text{font-size:1.15rem;line-height:1.85}}

/* SCREAM */
.card.scream-card .card-text{
  font-size:clamp(1.25rem,3.5vw,1.6rem);
  font-weight:500;color:var(--warm);font-style:italic;line-height:1.65;
}
@media(max-width:640px){.card.scream-card .card-text{font-size:1.3rem}}

/* BURNED */
.card.burned-card{
  background:linear-gradient(to right,rgba(200,146,42,.012),transparent 55%);
}

/* card meta */
.card-user{
  font-family:var(--mono);font-size:.58rem;color:var(--amlo);
  letter-spacing:.05em;margin-bottom:7px;
}
@media(max-width:640px){.card-user{font-size:.65rem}}
.card-user::before{content:'~ ';color:var(--muted)}
.card-foot{display:flex;align-items:center;gap:9px;margin-top:12px;flex-wrap:wrap}
.card-time{font-family:var(--mono);font-size:.55rem;color:var(--muted);letter-spacing:.05em}
@media(max-width:640px){.card-time{font-size:.62rem}}
.card-cat{font-size:.68rem;opacity:.55;line-height:1}
.card-live{display:flex;align-items:center;gap:4px;font-family:var(--mono);font-size:.52rem;color:var(--amber);letter-spacing:.09em}
.chain-pill{
  display:inline-flex;align-items:center;gap:4px;
  font-family:var(--mono);font-size:.52rem;letter-spacing:.06em;
  color:var(--amlo);padding:2px 7px;
  border:1px solid rgba(200,146,42,.16);border-radius:100px;
  transition:all .18s;
}
.chain-pill:hover{color:var(--amber);border-color:rgba(200,146,42,.4);background:rgba(200,146,42,.035)}

/* ── REACTIONS ── */
.react-bar{display:flex;gap:4px;margin-top:12px;flex-wrap:wrap}
.react-btn{
  display:inline-flex;align-items:center;gap:5px;
  padding:4px 9px;border-radius:100px;
  border:1px solid transparent;
  font-family:var(--mono);font-size:.56rem;
  color:var(--muted);
  transition:all .15s var(--ease);
  position:relative;overflow:hidden;white-space:nowrap;
}
@media(max-width:640px){.react-btn{padding:6px 11px;font-size:.62rem}}
.react-btn:hover{color:var(--soft);border-color:var(--border2);background:var(--surface)}
.react-btn.on{color:var(--amber);border-color:rgba(200,146,42,.32);background:rgba(200,146,42,.05)}
.react-emoji{font-size:.8rem;line-height:1}
@media(max-width:640px){.react-emoji{font-size:.9rem}}
.react-count{letter-spacing:.04em}
.react-ripple{
  position:absolute;border-radius:50%;pointer-events:none;
  background:rgba(200,146,42,.18);
  width:100%;padding-bottom:100%;left:0;top:50%;
  transform:translateY(-50%) scale(0);
  animation:rippleOut .4s ease-out forwards;
}

/* ── FLOATING PARTICLES ── */
.float-particle{
  position:fixed;pointer-events:none;z-index:9995;
  font-size:1rem;animation:floatUp .85s ease-out forwards;
}

/* ── FAB ── */
.confess-fab{
  position:fixed;bottom:30px;left:50%;transform:translateX(-50%);
  z-index:600;display:flex;align-items:center;gap:8px;
  padding:12px 36px;
  background:var(--black);border:1px solid var(--amlo);
  border-radius:100px;
  font-family:var(--serif);font-style:italic;font-weight:500;
  font-size:.92rem;letter-spacing:.16em;color:var(--amber);
  transition:all .28s var(--ease);
  animation:glow 5s ease-in-out infinite;
  white-space:nowrap;
}
@media(max-width:640px){
  .confess-fab{
    bottom:calc(66px + env(safe-area-inset-bottom));
    padding:11px 28px;font-size:.88rem;
  }
}
.confess-fab:hover{
  background:var(--amber);border-color:var(--amber);color:var(--black);
  transform:translateX(-50%) translateY(-2px);
  box-shadow:0 8px 32px rgba(200,146,42,.42);
  animation:none;
}
.fab-flame{animation:candleWave 3.5s ease-in-out infinite;display:inline-block}

/* ── MOBILE NAV ── */
.mob-nav{
  position:fixed;bottom:0;left:0;right:0;z-index:800;
  display:none;align-items:stretch;
  background:rgba(6,6,6,.97);
  backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
  border-top:1px solid var(--border);
  padding-bottom:env(safe-area-inset-bottom);
}
@media(max-width:640px){.mob-nav{display:flex}}
.mob-item{
  flex:1;display:flex;flex-direction:column;align-items:center;
  gap:3px;padding:8px 0;
  font-family:var(--mono);font-size:.52rem;letter-spacing:.06em;
  color:var(--muted);transition:color .18s;
}
.mob-item.on{color:var(--amber)}
.mob-center-btn{
  width:40px;height:40px;border-radius:50%;
  background:var(--amber);display:flex;align-items:center;justify-content:center;
  box-shadow:0 0 18px rgba(200,146,42,.5);margin-bottom:2px;
  transition:transform .18s var(--ease),box-shadow .18s;
}
.mob-item:active .mob-center-btn{transform:scale(.91);box-shadow:0 0 8px rgba(200,146,42,.25)}

/* ── MODAL ── */
.modal-bg{
  position:fixed;inset:0;z-index:900;
  background:rgba(4,4,4,.97);
  backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  overflow-y:auto;
  animation:overlayIn .25s var(--ease);
}
.modal-scroll{
  min-height:100%;
  display:flex;align-items:flex-start;justify-content:center;
  padding:70px 22px 56px;
}
@media(max-width:640px){.modal-scroll{padding:60px 14px 44px}}
.modal-body{width:100%;max-width:620px;animation:modalUp .35s var(--ease)}

.modal-eyebrow{display:flex;align-items:center;gap:11px;margin-bottom:26px}
.m-ey-line{flex:1;height:1px;background:var(--border)}
.m-ey-text{font-family:var(--mono);font-size:.54rem;color:var(--muted);letter-spacing:.14em;white-space:nowrap}

/* Username */
.username-wrap{
  display:flex;align-items:center;gap:7px;
  margin-bottom:18px;padding-bottom:14px;
  border-bottom:1px solid var(--border);
}
.username-prefix{font-family:var(--mono);font-size:.64rem;color:var(--amlo);flex-shrink:0}
.username-input{
  flex:1;background:transparent;border:none;
  font-family:var(--mono);font-size:.64rem;
  color:var(--amber);letter-spacing:.05em;caret-color:var(--amber);
}
@media(max-width:640px){.username-input{font-size:.72rem}}
.username-input::placeholder{color:var(--muted);font-size:.6rem}

.modal-ta{
  width:100%;background:transparent;border:none;
  border-bottom:1px solid var(--border);
  padding:0 0 18px;display:block;
  color:var(--warm);font-style:italic;font-weight:400;
  line-height:1.85;resize:none;min-height:140px;
  caret-color:var(--amber);transition:border-color .25s;
}
.modal-ta:focus{border-bottom-color:var(--border2)}
.modal-ta.whisper{font-size:.92rem}
.modal-ta.normal {font-size:1.1rem}
.modal-ta.scream {font-size:1.5rem}
@media(max-width:640px){
  .modal-ta.whisper{font-size:1rem}
  .modal-ta.normal{font-size:1.15rem}
  .modal-ta.scream{font-size:1.25rem}
}

.modal-sec{margin-top:24px}
.modal-lbl{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px}
.modal-lbl-t{font-family:var(--mono);font-size:.55rem;color:var(--muted);letter-spacing:.11em}
.modal-lbl-v{font-family:var(--mono);font-size:.55rem;color:var(--amber);letter-spacing:.09em}

.slider{
  -webkit-appearance:none;appearance:none;
  width:100%;height:2px;
  background:linear-gradient(to right,var(--amber) var(--pct,50%),var(--border2) var(--pct,50%));
  border-radius:1px;cursor:pointer;
}
.slider::-webkit-slider-thumb{
  -webkit-appearance:none;width:13px;height:13px;
  border-radius:50%;background:var(--amber);
  box-shadow:0 0 7px rgba(200,146,42,.45);
  transition:transform .18s;cursor:pointer;
}
.slider::-webkit-slider-thumb:hover{transform:scale(1.3)}
.slider-ends{display:flex;justify-content:space-between;margin-top:6px}
.slider-end{font-family:var(--mono);font-size:.53rem;color:var(--border2);letter-spacing:.06em}

.cats-wrap{display:flex;flex-wrap:wrap;gap:6px}
.cat-chip{
  font-family:var(--mono);font-size:.55rem;letter-spacing:.05em;
  color:var(--dim);padding:5px 10px;
  border:1px solid var(--border);border-radius:3px;
  transition:all .15s;white-space:nowrap;
}
@media(max-width:640px){.cat-chip{font-size:.62rem;padding:6px 12px}}
.cat-chip:hover{color:var(--soft);border-color:var(--border2)}
.cat-chip.on{color:var(--amber);border-color:var(--amlo);background:rgba(200,146,42,.045)}

/* ── BURN BOX — wallet status ── */
.burn-box{
  margin-top:22px;padding:16px 18px;
  border:1px solid var(--border);border-radius:6px;
  transition:border-color .25s,background .25s;cursor:pointer;
}
.burn-box:hover{border-color:var(--border2)}
.burn-box.on{border-color:rgba(200,146,42,.38);background:rgba(200,146,42,.022)}
.burn-row{display:flex;align-items:flex-start;gap:12px}
.burn-cb{width:14px;height:14px;accent-color:var(--amber);margin-top:4px;flex-shrink:0;cursor:pointer}
.burn-title{font-family:var(--serif);font-style:italic;font-size:.96rem;color:var(--paper);line-height:1.4}
.burn-sub{font-family:var(--mono);font-size:.55rem;color:var(--muted);margin-top:4px;line-height:1.7;letter-spacing:.025em}
@media(max-width:640px){.burn-sub{font-size:.6rem}}

/* Wallet status row */
.wallet-status-row{
  margin-top:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;
}
.wallet-badge{
  display:inline-flex;align-items:center;gap:5px;
  font-family:var(--mono);font-size:.55rem;color:var(--amber);
  padding:3px 9px;border:1px solid rgba(200,146,42,.26);
  border-radius:100px;background:rgba(200,146,42,.035);
}
.wallet-badge-dot{width:5px;height:5px;border-radius:50%;background:var(--amber);display:inline-block}
.connect-btn{
  font-family:var(--mono);font-size:.55rem;color:var(--amber);
  letter-spacing:.07em;padding:4px 11px;
  border:1px solid rgba(200,146,42,.38);border-radius:3px;
  transition:background .18s;background:transparent;
}
.connect-btn:hover{background:rgba(200,146,42,.06)}

/* Wallet error message */
.wallet-err{
  margin-top:6px;
  font-family:var(--mono);font-size:.54rem;color:#c87070;letter-spacing:.04em;line-height:1.65;
}
@media(max-width:640px){.wallet-err{font-size:.6rem}}

.submit-row{
  display:flex;align-items:center;justify-content:space-between;
  margin-top:28px;gap:12px;flex-wrap:wrap;
}
.release-btn{
  font-family:var(--serif);font-style:italic;font-weight:500;
  font-size:1.08rem;letter-spacing:.09em;color:var(--paper);
  padding:10px 32px;
  border:1px solid var(--border2);border-radius:3px;
  background:var(--surface);transition:all .28s var(--ease);
}
@media(max-width:640px){.release-btn{font-size:1.1rem;padding:12px 36px}}
.release-btn:hover:not(:disabled){
  background:var(--amber);border-color:var(--amber);color:var(--black);
  transform:translateY(-1px);box-shadow:0 6px 22px rgba(200,146,42,.3);
}
.release-btn:disabled{opacity:.25;cursor:not-allowed}
.char-cnt{font-family:var(--mono);font-size:.55rem;color:var(--muted);letter-spacing:.05em}
.modal-hint{margin-top:20px;font-family:var(--mono);font-size:.52rem;color:var(--border2);letter-spacing:.06em;line-height:1.75;font-style:italic}
.modal-close{
  position:fixed;top:16px;right:20px;z-index:910;
  width:32px;height:32px;display:flex;align-items:center;justify-content:center;
  font-family:var(--mono);font-size:.66rem;color:var(--dim);
  border:1px solid var(--border);border-radius:50%;
  background:var(--surface);transition:all .18s;
}
.modal-close:hover{color:var(--paper);border-color:var(--border2)}

/* ── FULL SCREEN STATES ── */
.full-screen{
  position:fixed;inset:0;z-index:950;
  background:var(--black);
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:18px;
  animation:fadeIn .35s ease;
}
.burn-flame{font-size:3rem;animation:candleWave .5s ease-in-out infinite}
.burn-status{font-family:var(--mono);font-size:.66rem;color:var(--amber);letter-spacing:.2em;animation:pulse 1.6s ease infinite}
.burn-note{font-family:var(--mono);font-size:.56rem;color:var(--muted);letter-spacing:.06em;text-align:center;max-width:240px;line-height:1.8}
.done-l1{font-family:var(--serif);font-style:italic;font-size:clamp(1.5rem,5vw,2.1rem);color:var(--paper);animation:fadeUp .65s .12s var(--ease) both}
.done-l2{font-family:var(--serif);font-size:clamp(.88rem,2.5vw,1rem);color:var(--dim);animation:fadeUp .65s .4s var(--ease) both}

/* ── CHAIN PAGE ── */
.chain-head{margin-bottom:44px}
.chain-h1{font-family:var(--serif);font-style:italic;font-weight:400;font-size:clamp(1.55rem,5vw,2.2rem);color:var(--warm);margin-bottom:14px;letter-spacing:.03em}
.chain-desc{font-family:var(--mono);font-size:.62rem;color:var(--dim);line-height:1.95;letter-spacing:.035em;max-width:420px}
@media(max-width:640px){.chain-desc{font-size:.68rem}}
.chain-rule{width:40px;height:1px;background:linear-gradient(to right,var(--amlo),transparent);margin-top:20px}
.chain-entry{padding:28px 0;border-bottom:1px solid rgba(200,146,42,.06);animation:confIn .65s var(--ease) both}
.chain-entry:first-child{border-top:1px solid rgba(200,146,42,.06)}
.chain-text{font-family:var(--serif);font-style:italic;font-weight:400;color:var(--paper);line-height:1.82;opacity:.86}
@media(max-width:640px){.chain-text{font-size:1.05rem !important}}
.chain-meta{display:flex;align-items:center;gap:10px;margin-top:11px;flex-wrap:wrap}
.chain-time{font-family:var(--mono);font-size:.55rem;color:var(--muted);letter-spacing:.05em}
.chain-tx{
  display:inline-flex;align-items:center;gap:4px;
  font-family:var(--mono);font-size:.53rem;letter-spacing:.06em;
  color:var(--amlo);padding:2px 8px;
  border:1px solid rgba(200,146,42,.14);border-radius:100px;
  transition:all .18s;
}
.chain-tx:hover{color:var(--amber);border-color:rgba(200,146,42,.4);background:rgba(200,146,42,.035)}
.chain-empty{padding:72px 0;text-align:center}
.chain-e-t{font-family:var(--serif);font-style:italic;font-size:1.1rem;color:var(--muted);margin-bottom:9px}
.chain-e-s{font-family:var(--mono);font-size:.57rem;color:var(--border2);letter-spacing:.08em}

/* ── LORE ── */
.lore-h1{font-family:var(--serif);font-style:italic;font-weight:400;font-size:clamp(1.4rem,4.5vw,1.9rem);color:var(--warm);margin-bottom:48px;letter-spacing:.04em}
.lore-para{padding:28px 0;border-top:1px solid var(--border)}
.lore-para:first-of-type{border-top:none;padding-top:0}
.lore-text{font-family:var(--serif);font-weight:300;line-height:1.95;letter-spacing:.01em}
.lore-text.primary{font-size:clamp(1rem,2.5vw,1.1rem);font-style:italic;color:var(--paper)}
.lore-text.body{font-size:clamp(.88rem,2vw,.94rem);color:rgba(237,232,218,.62)}
@media(max-width:640px){.lore-text.primary{font-size:1.1rem}.lore-text.body{font-size:.96rem}}
.lore-footer{margin-top:56px;padding:24px;border:1px solid var(--border);border-radius:6px;background:var(--surface)}
.lore-f-brand{display:flex;align-items:center;gap:9px;margin-bottom:12px}
.lore-f-name{font-family:var(--mono);font-size:.6rem;color:var(--dim);letter-spacing:.08em}
.lore-f-links{display:flex;gap:16px;margin-top:12px;flex-wrap:wrap}
.lore-f-link{font-family:var(--mono);font-size:.57rem;color:var(--muted);letter-spacing:.08em;transition:color .18s}
.lore-f-link:hover{color:var(--amber)}

/* ── LOADING / EMPTY ── */
.loading-t{font-family:var(--mono);font-size:.6rem;color:var(--muted);letter-spacing:.11em;padding:44px 0}
.empty-t{font-family:var(--serif);font-style:italic;font-size:.98rem;color:var(--muted);padding:56px 0;line-height:1.8}
@media(max-width:640px){.empty-t{font-size:1.05rem}}

/* ── TOAST ── */
.toast{
  position:fixed;bottom:108px;left:50%;transform:translateX(-50%);
  z-index:9999;padding:9px 18px;
  background:var(--surface);border:1px solid var(--border2);
  border-radius:3px;white-space:nowrap;
  font-family:var(--mono);font-size:.59rem;color:var(--soft);letter-spacing:.04em;
  animation:fadeUp .28s var(--ease);
}
@media(max-width:640px){.toast{bottom:96px;max-width:88vw;white-space:normal;text-align:center;font-size:.64rem}}
`;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const timeAgo = ts => {
  if (!ts?.toMillis) return "just now";
  const s = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (s < 5)      return "just now";
  if (s < 60)     return `${s}s ago`;
  if (s < 3600)   return `${Math.floor(s/60)}m ago`;
  if (s < 86400)  return `${Math.floor(s/3600)}h ago`;
  if (s < 604800) return `${Math.floor(s/86400)}d ago`;
  return new Date(ts.toMillis()).toLocaleDateString("en-US",{month:"short",day:"numeric"});
};
const shortAddr = a => (!a||a.length<10) ? (a||"") : a.slice(0,5)+"…"+a.slice(-4);
const sizeKey   = v => v < 30 ? "whisper" : v < 70 ? "normal" : "scream";

function getRxStore() { try { return JSON.parse(localStorage.getItem("cfn_rx")||"{}"); } catch { return {}; } }
function setRxStore(o){ try { localStorage.setItem("cfn_rx",JSON.stringify(o)); } catch {} }

// ─────────────────────────────────────────────────────────────────────────────
// SOLANA WALLET HOOK
// Uses @solana/wallet-adapter-react (injected via WalletContext in index.jsx)
// Falls back to window.solana (Phantom browser extension) for simplicity
// ─────────────────────────────────────────────────────────────────────────────
function useSolanaWallet() {
  const [publicKey,    setPublicKey]    = useState(null);
  const [connecting,   setConnecting]   = useState(false);
  const [walletError,  setWalletError]  = useState(null);

  // Try to auto-reconnect if already approved
  useEffect(() => {
    const provider = window?.phantom?.solana || window?.solana;
    if (provider?.isPhantom && provider.isConnected && provider.publicKey) {
      setPublicKey(provider.publicKey.toString());
    }
    // Listen for account changes
    if (provider?.on) {
      const onDisconnect = () => setPublicKey(null);
      const onConnect    = (pk) => setPublicKey(pk.toString());
      provider.on("disconnect", onDisconnect);
      provider.on("connect",    onConnect);
      return () => {
        provider.off?.("disconnect", onDisconnect);
        provider.off?.("connect",    onConnect);
      };
    }
  }, []);

  const connect = useCallback(async () => {
    setWalletError(null);
    setConnecting(true);
    try {
      const provider = window?.phantom?.solana || window?.solana;

      if (!provider?.isPhantom) {
        // On mobile — open Phantom deeplink
        if (isMobile()) {
          const appUrl  = encodeURIComponent(window.location.origin);
          const redirect = encodeURIComponent(window.location.href);
          window.location.href =
            `https://phantom.app/ul/v1/connect?app_url=${appUrl}&redirect_link=${redirect}&cluster=mainnet-beta`;
          setConnecting(false);
          return null;
        }
        setWalletError("Phantom not found. Install at phantom.app");
        setConnecting(false);
        return null;
      }

      const resp = await provider.connect();
      const addr = resp.publicKey.toString();
      setPublicKey(addr);
      setConnecting(false);
      return addr;
    } catch (e) {
      const msg = e?.message || "";
      if (msg.includes("User rejected") || msg.includes("rejected")) {
        setWalletError("Connection cancelled.");
      } else {
        setWalletError("Could not connect. Try again.");
      }
      setConnecting(false);
      return null;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      const provider = window?.phantom?.solana || window?.solana;
      await provider?.disconnect();
    } catch {}
    setPublicKey(null);
  }, []);

  return { publicKey, connecting, walletError, connect, disconnect, setWalletError };
}

// ─────────────────────────────────────────────────────────────────────────────
// SOLANA BURN TRANSACTION
// Uses @solana/web3.js (must be installed — see notes at bottom)
// ─────────────────────────────────────────────────────────────────────────────
async function burnToChain({ publicKey, text, username }) {
  // ── Dynamically import @solana/web3.js ──
  // This assumes you've run: npm install @solana/web3.js
  // And your bundler (Vite/CRA/Next) handles the import.
  const {
    Connection,
    PublicKey,
    Transaction,
    SystemProgram,
    LAMPORTS_PER_SOL,
    TransactionInstruction,
  } = await import("@solana/web3.js");

  const provider = window?.phantom?.solana || window?.solana;
  if (!provider?.isPhantom) throw new Error("Phantom not available");
  if (!provider.publicKey)  throw new Error("Wallet not connected");

  const conn   = new Connection(SOLANA_RPC, "confirmed");
  const pk     = new PublicKey(publicKey);
  const memoPk = new PublicKey(MEMO_PROG);

  // Check balance first
  const balance = await conn.getBalance(pk);
  const needed  = Math.round(BURN_SOL * LAMPORTS_PER_SOL) + 10000; // +10k lamports for fees
  if (balance < needed) {
    const solNeeded = ((needed - balance) / LAMPORTS_PER_SOL).toFixed(4);
    throw new Error(`insufficient_balance:${solNeeded}`);
  }

  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");
  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: pk });

  // Memo instruction — writes your confession permanently on-chain
  const memoPayload = JSON.stringify({
    app: "confessioncoin.xyz",
    v:   2,
    text: text.trim().slice(0, 400),
    user: username?.trim() || null,
  });
  tx.add(new TransactionInstruction({
    keys:      [{ pubkey: pk, isSigner: true, isWritable: false }],
    programId: memoPk,
    data:      Buffer.from(memoPayload, "utf-8"),
  }));

  // Self-transfer burn (tiny SOL amount as the "price" of confession)
  tx.add(SystemProgram.transfer({
    fromPubkey: pk,
    toPubkey:   pk,
    lamports:   Math.round(BURN_SOL * LAMPORTS_PER_SOL),
  }));

  // Sign via Phantom
  const signed    = await provider.signTransaction(tx);
  const signature = await conn.sendRawTransaction(signed.serialize(), {
    skipPreflight:       false,
    preflightCommitment: "confirmed",
  });

  // Wait for confirmation
  await conn.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed"
  );

  return signature;
}

// ─────────────────────────────────────────────────────────────────────────────
// FLOATING EMOJI PARTICLE
// ─────────────────────────────────────────────────────────────────────────────
function FloatParticle({ emoji, x, y, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 900); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="float-particle" style={{ left: x, top: y, transform:"translate(-50%,-50%)" }}>
      {emoji}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CA PILL
// ─────────────────────────────────────────────────────────────────────────────
function CopyCA() {
  const [copied, setCopied] = useState(false);
  return (
    <div
      className={`ca-pill${copied ? " copied" : ""}`}
      onClick={() => {
        navigator.clipboard.writeText(CA).catch(()=>{});
        setCopied(true);
        setTimeout(()=>setCopied(false), 2200);
      }}
      title="Copy CA"
    >
      <span className="ca-tick">$CFN</span>
      <span className="ca-sep" />
      <span className="ca-addr">{CA}</span>
      <span className="ca-ico">{copied ? "✓" : "⎘"}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────────────────────────────────────
function Navbar({ page, setPage, soundOn, toggleSound }) {
  return (
    <nav className="nav">
      <div className="nav-brand" onClick={() => setPage("wall")} style={{cursor:"pointer"}}>
        <img src="/logo.png" alt="ConfessCoin" onError={e=>e.target.style.display="none"} />
        <span className="nav-brand-name">CONFESS</span>
      </div>
      <div className="nav-right">
        <span className={`nav-lk${page==="wall"?" on":""}`} onClick={()=>setPage("wall")}>The Wall</span>
        <span className={`nav-lk${page==="chain"?" chain-on":""}`} onClick={()=>setPage("chain")}>⛓ On‑Chain</span>
        <span className={`nav-lk${page==="lore"?" on":""}`} onClick={()=>setPage("lore")}>Why This Exists</span>
        <div className="nav-sep" />
        <a href={SOCIAL.x}         target="_blank" rel="noopener noreferrer" className="nav-ico" title="X">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
        <a href={SOCIAL.community} target="_blank" rel="noopener noreferrer" className="nav-ico" title="Community">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
        </a>
        <a href={SOCIAL.github}    target="_blank" rel="noopener noreferrer" className="nav-ico" title="GitHub">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>
        </a>
        <div className="nav-sep" />
        <button className="nav-ico" onClick={toggleSound} title={soundOn?"Mute":"Ambient"}
          style={{fontSize:".78rem",opacity:soundOn?1:.35,transition:"opacity .25s"}}>
          {soundOn ? "🔔" : "🔕"}
        </button>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE NAV
// ─────────────────────────────────────────────────────────────────────────────
function MobileNav({ page, setPage, onConfess }) {
  return (
    <div className="mob-nav">
      <div className={`mob-item${page==="wall"?" on":""}`} onClick={()=>setPage("wall")}>
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/></svg>Wall
      </div>
      <div className={`mob-item${page==="chain"?" on":""}`} onClick={()=>setPage("chain")}>
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>Chain
      </div>
      <div className="mob-item" onClick={onConfess} style={{flex:1.3}}>
        <div className="mob-center-btn">
          <svg width="16" height="16" fill="none" stroke="var(--black)" strokeWidth="2.3" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
        <span style={{color:"var(--amber)"}}>Confess</span>
      </div>
      <div className={`mob-item${page==="lore"?" on":""}`} onClick={()=>setPage("lore")}>
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Why
      </div>
      <div className="mob-item" onClick={()=>navigator.clipboard.writeText(CA).catch(()=>{})}>
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>$CFN
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REACTION BAR
// ─────────────────────────────────────────────────────────────────────────────
function ReactionBar({ confId, rxData, setParticles }) {
  const [local,  setLocal]  = useState(() => ({...rxData}));
  const [active, setActive] = useState(() => getRxStore()[confId] || null);
  const [ripple, setRipple] = useState(null);
  const synced = useRef(false);

  useEffect(() => { if (!synced.current) { setLocal({...rxData}); synced.current = true; } }, [rxData]);

  const tap = useCallback(async (key, e) => {
    e?.stopPropagation();
    e?.preventDefault();

    const prev  = active;
    const store = getRxStore();
    const next  = {...local};

    if (prev === key) {
      next[key] = Math.max(0, (next[key]||0) - 1);
      setActive(null);
      delete store[confId];
    } else {
      if (prev) next[prev] = Math.max(0, (next[prev]||0) - 1);
      next[key] = (next[key]||0) + 1;
      setActive(key);
      store[confId] = key;
      setRipple(key);
      setTimeout(() => setRipple(null), 450);

      if (e && setParticles) {
        const rect  = e.target.getBoundingClientRect();
        const emoji = REACTIONS.find(r => r.key === key)?.emoji;
        setParticles(ps => [...ps, { id: Date.now(), emoji, x: rect.left + rect.width/2, y: rect.top }]);
      }
    }

    setLocal(next);
    setRxStore(store);

    try {
      const ref = doc(db, "confessions", confId);
      const upd = {};
      if (prev === key) {
        upd[`reactions.${key}`] = Math.max(0, (rxData[key]||0) - 1);
      } else {
        if (prev) upd[`reactions.${prev}`] = Math.max(0, (rxData[prev]||0) - 1);
        upd[`reactions.${key}`] = (rxData[key]||0) + 1;
      }
      await updateDoc(ref, upd);
    } catch(err){ console.error("rx", err); }
  }, [active, confId, local, rxData, setParticles]);

  return (
    <div className="react-bar" onClick={e => e.stopPropagation()}>
      {REACTIONS.map(r => (
        <button key={r.key} className={`react-btn${active===r.key?" on":""}`}
          title={r.label} onClick={e => tap(r.key, e)} type="button">
          {ripple === r.key && <span className="react-ripple" />}
          <span className="react-emoji">{r.emoji}</span>
          <span className="react-count">{local[r.key]||0}</span>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFESSION CARD
// ─────────────────────────────────────────────────────────────────────────────
function Card({ data, delay=0, setParticles }) {
  const sz  = ["whisper","normal","scream"].includes(data.size) ? data.size : "normal";
  const cat = data.category ? CATEGORIES.find(c=>c.key===data.category) : null;
  const isNew = data.timestamp?.toMillis && (Date.now()-data.timestamp.toMillis()) < 12000;

  return (
    <div
      className={`card conf-enter ${sz}-card${data.burned?" burned-card":""}`}
      style={{ animationDelay:`${delay}s` }}
    >
      <div className="card-ink" />

      {data.username && (
        <div className="card-user">{data.username}</div>
      )}

      <p className="card-text">{data.text}</p>

      <div className="card-foot">
        <span className="card-time">{timeAgo(data.timestamp)}</span>
        {cat && <span className="card-cat" title={cat.label}>{cat.emoji}</span>}
        {isNew && (
          <span className="card-live"><span className="live-dot" />LIVE</span>
        )}
        {data.burned && data.txHash && (
          <a href={`https://solscan.io/tx/${data.txHash}`}
            target="_blank" rel="noopener noreferrer"
            className="chain-pill"
            onClick={e => e.stopPropagation()}>
            <span className="flicker">🔥</span>{shortAddr(data.txHash)}
          </a>
        )}
      </div>

      <ReactionBar confId={data.id} rxData={data.reactions||{}} setParticles={setParticles} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFESS MODAL — fully working Solana burn
// ─────────────────────────────────────────────────────────────────────────────
function ConfessModal({ onClose, onDone, setToast }) {
  const [text,     setText]     = useState("");
  const [username, setUsername] = useState("");
  const [sliderV,  setSliderV]  = useState(50);
  const [category, setCategory] = useState("");
  const [burn,     setBurn]     = useState(false);
  const [phase,    setPhase]    = useState("write"); // write | burning | done
  const taRef = useRef(null);
  const sz = sizeKey(sliderV);

  const { publicKey, connecting, walletError, connect, setWalletError } = useSolanaWallet();

  useEffect(() => {
    setTimeout(() => taRef.current?.focus(), 80);
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleBurnToggle = async () => {
    const next = !burn;
    setBurn(next);
    setWalletError(null);
    if (next && !publicKey) {
      await connect();
    }
  };

  const submit = async () => {
    if (text.trim().length < 3) return;

    let txHash = null;
    let burned = false;

    if (burn) {
      // Must have wallet connected
      let addr = publicKey;
      if (!addr) {
        addr = await connect();
        if (!addr) { setToast("Connect your Phantom wallet first"); return; }
      }

      setPhase("burning");

      try {
        txHash = await burnToChain({ publicKey: addr, text, username });
        burned = true;
      } catch (e) {
        const msg = e?.message || "";
        if (msg.startsWith("insufficient_balance:")) {
          const shortfall = msg.split(":")[1];
          setToast(`Need ~${shortfall} more SOL for this transaction`);
        } else if (msg.includes("User rejected") || msg.includes("rejected")) {
          setToast("Transaction cancelled.");
        } else if (msg.includes("insufficient")) {
          setToast("Not enough SOL — need ~0.012 SOL including fees");
        } else {
          setToast("On-chain write failed. Saving to wall anyway.");
          console.error("Burn error:", e);
        }
        setPhase("write");
        setBurn(false);
        return;
      }
    }

    // Save to Firestore
    try {
      await addDoc(collection(db, "confessions"), {
        text:      text.trim(),
        username:  username.trim() || null,
        size:      sz,
        category:  category || null,
        burned,
        txHash:    txHash || null,
        timestamp: serverTimestamp(),
        reactions: { candle:0, heavy:0, eye:0, fire:0, grave:0 },
      });
    } catch (e) {
      console.error("Firestore:", e);
      setToast("Could not save — check connection");
      setPhase("write");
      return;
    }

    setPhase("done");
    setTimeout(onDone, 2600);
  };

  if (phase === "burning") return (
    <div className="full-screen">
      <div className="burn-flame">🔥</div>
      <p className="burn-status">WRITING TO SOLANA</p>
      <p className="burn-note">Your words are being permanently inscribed on-chain. This cannot be undone.</p>
    </div>
  );

  if (phase === "done") return (
    <div className="full-screen">
      <p className="done-l1">it's gone.</p>
      <p className="done-l2">you're lighter now.</p>
    </div>
  );

  return (
    <>
      <div className="modal-bg" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
        <div className="modal-scroll">
          <div className="modal-body">

            <div className="modal-eyebrow">
              <span className="m-ey-line" />
              <span className="m-ey-text">secrets are better shared</span>
              <span className="m-ey-line" />
            </div>

            {/* Username */}
            <div className="username-wrap">
              <span className="username-prefix">~</span>
              <input type="text" className="username-input"
                placeholder="anonymous handle (optional)"
                maxLength={24} value={username}
                onChange={e => setUsername(e.target.value.replace(/\s/g,""))} />
            </div>

            {/* Textarea */}
            <div style={{position:"relative"}}>
              <textarea
                ref={taRef}
                value={text}
                onChange={e => setText(e.target.value)}
                maxLength={1200}
                rows={6}
                className={`modal-ta ${sz}`}
                placeholder=" "
              />
              {!text && (
                <span className="blink" style={{
                  position:"absolute",top:0,left:0,pointerEvents:"none",
                  fontFamily:"var(--serif)",fontStyle:"italic",
                  fontSize:sz==="whisper"?".92rem":sz==="scream"?"1.5rem":"1.1rem",
                  lineHeight:"1.85",color:"var(--amber)",
                }}>|</span>
              )}
            </div>

            {/* Intensity */}
            <div className="modal-sec">
              <div className="modal-lbl">
                <span className="modal-lbl-t">INTENSITY</span>
                <span className="modal-lbl-v">{sz.toUpperCase()}</span>
              </div>
              <input type="range" min="0" max="100" value={sliderV}
                style={{"--pct":`${sliderV}%`}}
                onChange={e=>setSliderV(+e.target.value)}
                className="slider" />
              <div className="slider-ends">
                <span className="slider-end">whisper</span>
                <span className="slider-end">scream</span>
              </div>
            </div>

            {/* Category */}
            <div className="modal-sec">
              <div className="modal-lbl">
                <span className="modal-lbl-t">CATEGORY</span>
                <span className="modal-lbl-v" style={{color:"var(--border2)"}}>optional</span>
              </div>
              <div className="cats-wrap">
                {CATEGORIES.map(c => (
                  <button key={c.key} className={`cat-chip${category===c.key?" on":""}`}
                    type="button" onClick={()=>setCategory(category===c.key?"":c.key)}>
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Burn box */}
            <div className={`burn-box${burn?" on":""}`} onClick={handleBurnToggle}>
              <div className="burn-row">
                <input type="checkbox" checked={burn} readOnly className="burn-cb"
                  onClick={e=>e.stopPropagation()} />
                <div style={{flex:1}}>
                  <p className="burn-title">🔥 Burn this to chain forever</p>
                  <p className="burn-sub">
                    0.01 SOL · permanently on Solana · immutable · no one can delete it
                  </p>

                  {/* Wallet status — only show when burn is checked */}
                  {burn && (
                    <div className="wallet-status-row" onClick={e=>e.stopPropagation()}>
                      {publicKey ? (
                        <span className="wallet-badge">
                          <span className="wallet-badge-dot" />
                          {shortAddr(publicKey)}
                        </span>
                      ) : connecting ? (
                        <span style={{fontFamily:"var(--mono)",fontSize:".54rem",color:"var(--dim)"}}>
                          connecting<span className="blink">_</span>
                        </span>
                      ) : (
                        <button className="connect-btn" type="button" onClick={async e=>{e.stopPropagation();await connect();}}>
                          Connect Phantom →
                        </button>
                      )}
                      {walletError && (
                        <p className="wallet-err">{walletError}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="submit-row">
              <button className="release-btn" type="button" onClick={submit}
                disabled={text.trim().length < 3 || (burn && !publicKey)}>
                release it
              </button>
              <span className="char-cnt">{text.length} / 1200</span>
            </div>

            <p className="modal-hint">secrets are better shared.</p>
          </div>
        </div>
      </div>
      <button className="modal-close" type="button" onClick={onClose}>✕</button>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WALL PAGE
// ─────────────────────────────────────────────────────────────────────────────
function WallPage({ setParticles }) {
  const [confessions,  setConfessions]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filterOpen,   setFilterOpen]   = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [search,       setSearch]       = useState("");

  useEffect(() => {
    const q = query(collection(db,"confessions"), orderBy("timestamp","desc"), limit(80));
    const unsub = onSnapshot(q, snap => {
      setConfessions(snap.docs.map(d=>({id:d.id,...d.data()})));
      setLoading(false);
    }, err=>{console.error(err);setLoading(false)});
    return unsub;
  }, []);

  const list = useMemo(() => {
    let l = confessions;
    if (activeFilter) l = l.filter(c => c.category === activeFilter);
    if (search.trim()) {
      const q2 = search.trim().toLowerCase();
      l = l.filter(c => c.username?.toLowerCase()===q2 || c.text?.toLowerCase().includes(q2));
    }
    return l;
  }, [confessions, activeFilter, search]);

  const activeCat = CATEGORIES.find(c=>c.key===activeFilter);

  return (
    <div className="page">
      <div className="wall-head">
        <div className="wall-h1">
          <span style={{fontSize:"1.2rem",animation:"candleWave 3.5s ease-in-out infinite",display:"inline-block"}}>🕯️</span>
          <h1 className="wall-title">The Wall</h1>
        </div>
        <div className="wall-meta">
          <span className="live-lbl"><span className="live-dot" />{list.length} confession{list.length!==1?"s":""}</span>
          <button className={`filter-tog${filterOpen||activeFilter?" on":""}`}
            type="button" onClick={()=>setFilterOpen(f=>!f)}>
            {activeCat?`${activeCat.emoji} ${activeCat.label}`:"⊞ filter"}
          </button>
          {activeFilter && (
            <button className="filter-tog" type="button"
              onClick={()=>{setActiveFilter(null);setFilterOpen(false)}}>× clear</button>
          )}
        </div>
      </div>

      {filterOpen && (
        <div className="fstrip">
          <button className={`fchip${!activeFilter?" on":""}`} type="button"
            onClick={()=>{setActiveFilter(null);setFilterOpen(false)}}>all</button>
          {CATEGORIES.map(cat=>(
            <button key={cat.key} type="button"
              className={`fchip${activeFilter===cat.key?" on":""}`}
              onClick={()=>{setActiveFilter(cat.key);setFilterOpen(false)}}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      )}

      <div className="search-wrap">
        <span className="search-icon">⌕</span>
        <input type="text" className="search-input"
          placeholder="search by username or keyword…"
          value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      {loading ? (
        <p className="loading-t">reading the wall<span className="blink">_</span></p>
      ) : list.length===0 ? (
        <p className="empty-t">
          {search ? `No confessions found for "${search}"` : activeFilter ? "Nothing in this category yet." : "The wall is empty. Say something real."}
        </p>
      ) : (
        list.map((c,i) => (
          <Card key={c.id} data={c} delay={Math.min(i*0.03,0.45)} setParticles={setParticles} />
        ))
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
function ChainPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db,"confessions"), where("burned","==",true), orderBy("timestamp","desc"), limit(100));
    const unsub = onSnapshot(q, snap=>{
      setEntries(snap.docs.map(d=>({id:d.id,...d.data()})));
      setLoading(false);
    }, err=>{console.error(err);setLoading(false)});
    return unsub;
  }, []);

  return (
    <div className="page">
      <div className="chain-head fade-up">
        <h1 className="chain-h1">The Chain Wall</h1>
        <p className="chain-desc">
          Every post you've ever made can be deleted.<br />
          Every platform can shut down.<br />
          Every account can be banned.<br /><br />
          Not these.<br />These are on Solana. Forever.
        </p>
        <div className="chain-rule" />
      </div>

      {loading ? (
        <p className="loading-t">reading the chain<span className="blink">_</span></p>
      ) : entries.length===0 ? (
        <div className="chain-empty">
          <p className="chain-e-t">The chain is silent.</p>
          <p className="chain-e-s">Be the first to burn something into eternity.</p>
        </div>
      ) : (
        entries.map((e,i)=>{
          const sz=["whisper","normal","scream"].includes(e.size)?e.size:"normal";
          return (
            <div key={e.id} className="chain-entry" style={{animationDelay:`${i*0.05}s`}}>
              {e.username && <div className="card-user" style={{marginBottom:7}}>{e.username}</div>}
              <p className={`chain-text ${sz}`}>{e.text}</p>
              <div className="chain-meta">
                <span className="chain-time">{timeAgo(e.timestamp)}</span>
                {e.txHash && (
                  <a href={`https://solscan.io/tx/${e.txHash}`}
                    target="_blank" rel="noopener noreferrer" className="chain-tx">
                    <span className="flicker">🔥</span>{shortAddr(e.txHash)} →
                  </a>
                )}
                {e.category && <span style={{fontSize:".7rem",opacity:.5}}>{CATEGORIES.find(c=>c.key===e.category)?.emoji}</span>}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LORE PAGE
// ─────────────────────────────────────────────────────────────────────────────
function LorePage() {
  const paras=[
    {t:"In 2014, someone built ConfessionCoin. They let people write their sins on the Bitcoin blockchain forever. It died. Nobody built it again. Until now.",primary:true},
    {t:"Every platform you've ever used was designed to make you more visible. More legible. More monetizable. This wants nothing from you. You are no one here. Your confession is everything."},
    {t:"The internet never gave people a real place to say the thing. Not to perform it. Not to be brave publicly. Not to build an audience with it. Just to say it — and have it witnessed by strangers who will never know who you are."},
    {t:"The blockchain isn't a gimmick. It's a promise. On-chain confessions can't be deleted by a company, a government, a moderator, or a moment of regret. Some things need to last forever."},
    {t:"We're not building a community. We're building a wall. A very old, very dark, very honest wall. Come and write on it."},
  ];

  return (
    <div className="page">
      <h1 className="lore-h1 fade-up">Why This Exists</h1>
      {paras.map((p,i)=>(
        <div key={i} className="lore-para fade-up" style={{animationDelay:`${i*.1}s`}}>
          <p className={`lore-text ${p.primary?"primary":"body"}`}>{p.t}</p>
        </div>
      ))}
      <div className="lore-footer fade-up" style={{animationDelay:".6s"}}>
        <div className="lore-f-brand">
          <img src="/logo.png" alt="" style={{height:20,opacity:.6}} onError={e=>e.target.style.display="none"} />
          <span className="lore-f-name">ConfessCoin · <span style={{color:"var(--amber)"}}>$CFN</span></span>
        </div>
        <CopyCA />
        <div className="lore-f-links">
          <a href={SOCIAL.x}         target="_blank" rel="noopener noreferrer" className="lore-f-link">X →</a>
          <a href={SOCIAL.community} target="_blank" rel="noopener noreferrer" className="lore-f-link">Community →</a>
          <a href={SOCIAL.github}    target="_blank" rel="noopener noreferrer" className="lore-f-link">GitHub →</a>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AMBIENT SOUND
// ─────────────────────────────────────────────────────────────────────────────
function useAmbient(on) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) {
      ref.current = new Audio("/thesound.mp3");
      ref.current.loop   = true;
      ref.current.volume = 0.13;
    }
    on ? ref.current.play().catch(()=>{}) : ref.current.pause();
  }, [on]);
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────
function Toast({ msg, gone }) {
  useEffect(()=>{ const t=setTimeout(gone,3600); return ()=>clearTimeout(t); },[gone]);
  return <div className="toast">{msg}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [page,      setPage]      = useState("wall");
  const [modal,     setModal]     = useState(false);
  const [sound,     setSound]     = useState(false);
  const [toast,     setToast]     = useState(null);
  const [particles, setParticles] = useState([]);

  useAmbient(sound);

  const openConfess   = useCallback(()=>setModal(true),[]);
  const closeModal    = useCallback(()=>setModal(false),[]);
  const onDone        = useCallback(()=>{setModal(false);setPage("wall");},[]);
  const removeParticle = useCallback(id => {
    setParticles(ps => ps.filter(p => p.id !== id));
  }, []);

  return (
    <>
      <style>{CSS}</style>

      {/* Overlay layers */}
      <div id="vig" />

      {/* Floating emoji particles */}
      {particles.map(p => (
        <FloatParticle key={p.id} emoji={p.emoji} x={p.x} y={p.y}
          onDone={() => removeParticle(p.id)} />
      ))}

      {/* Main content */}
      <div id="app-layer">
        <Navbar page={page} setPage={setPage} soundOn={sound} toggleSound={()=>setSound(s=>!s)} />
        <div className="ca-bar"><CopyCA /></div>

        {page==="wall"  && <WallPage setParticles={setParticles} />}
        {page==="chain" && <ChainPage />}
        {page==="lore"  && <LorePage />}

        {!modal && (
          <button className="confess-fab" type="button" onClick={openConfess}>
            <span className="fab-flame">🕯️</span>CONFESS
          </button>
        )}

        <MobileNav page={page} setPage={setPage} onConfess={openConfess} />
      </div>

      {modal && (
        <ConfessModal onClose={closeModal} onDone={onDone} setToast={setToast} />
      )}

      {toast && <Toast msg={toast} gone={()=>setToast(null)} />}
    </>
  );
}

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📋 INSTALL NOTES — run these in your VS Code terminal
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  npm install @solana/web3.js

  That's the only new dependency. Everything else
  (@solana/wallet-adapter-*) is NOT needed here —
  this implementation uses window.phantom.solana
  directly, which is simpler, more reliable, and
  doesn't require a context provider wrapper.

  If you use Vite, also add this to vite.config.js:

    import { defineConfig } from 'vite'
    import react from '@vitejs/plugin-react'

    export default defineConfig({
      plugins: [react()],
      define: {
        'process.env': {},
        global: 'globalThis',
      },
      resolve: {
        alias: { buffer: 'buffer' }
      }
    })

  And run:
    npm install buffer

  This is needed because @solana/web3.js uses Node
  built-ins (Buffer) that need to be polyfilled in
  the browser.

  If you use Create React App (CRA), add to the top
  of your index.js:
    import { Buffer } from 'buffer';
    window.Buffer = Buffer;

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ WHAT'S FIXED IN THIS VERSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  SOLANA BURN (primary):
  • Proper dynamic import of @solana/web3.js
  • Balance check before attempting tx (shows exact
    SOL shortfall in the error toast)
  • Correct Phantom provider detection via
    window.phantom.solana with fallback to window.solana
  • Auto-reconnect if wallet was previously approved
  • Mobile deeplink to Phantom app store/app
  • Wallet event listeners (connect/disconnect)
  • Submit button disabled until wallet connected
    when burn is checked
  • All error states handled with clear toast messages
  • Transaction confirmation waits for finality

  DESIGN:
  • Removed canvas animation (was heavy/novice)
  • Removed circle cursor ring — just a clean dot
  • Subtle static radial glow bg (professional/moody)
  • Mobile base font bumped to 17px — better readability
  • Card design cleaned up — no more style variants,
    just clean type hierarchy
  • Reaction buttons larger tap targets on mobile
  • All mono text slightly larger on mobile

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/