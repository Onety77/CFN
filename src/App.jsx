import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, addDoc, query, orderBy,
  limit, onSnapshot, updateDoc, doc, serverTimestamp,
  where, getDocs
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
const CA            = "CFNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const BURN_SOL      = 0.01;
const SOLANA_RPC    = "https://api.mainnet-beta.solana.com";
const MEMO_PROG     = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

const REACTIONS = [
  { key: "candle", emoji: "🕯️", label: "I've felt this" },
  { key: "heavy",  emoji: "🪨", label: "heavy"           },
  { key: "eye",    emoji: "👁️", label: "I see you"       },
  { key: "fire",   emoji: "🔥", label: "burn it"         },
  { key: "grave",  emoji: "💀", label: "take it to the grave" },
];

const CATEGORIES = [
  { key: "crypto",  emoji: "💸", label: "Money & Crypto"              },
  { key: "love",    emoji: "❤️",  label: "Love & Betrayal"             },
  { key: "family",  emoji: "👨‍👩‍👧", label: "Family"                      },
  { key: "self",    emoji: "🪞", label: "Things I did to myself"      },
  { key: "online",  emoji: "🌐", label: "Things I did online"         },
  { key: "unsaid",  emoji: "☠️", label: "Things I'd never say out loud"},
  { key: "good",    emoji: "✨", label: "Good things I'm ashamed of"  },
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
// GLOBAL STYLES
// ─────────────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=IBM+Plex+Mono:wght@300;400;500&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  --black:   #070707;
  --deep:    #0b0b09;
  --surface: #101010;
  --border:  #1c1c19;
  --border2: #272723;
  --muted:   #3a3a35;
  --dim:     #66665d;
  --soft:    #96958c;
  --paper:   #ede8da;
  --warm:    #f5f0e3;
  --amber:   #c8922a;
  --amlo:    #8a641d;
  --amhi:    #e8a93a;
  --serif:   'Cormorant Garamond',Georgia,serif;
  --mono:    'IBM Plex Mono','Courier New',monospace;
  --ease:    cubic-bezier(0.23,1,0.32,1);
}

html{scroll-behavior:smooth;font-size:16px}
body{
  background:var(--black);
  color:var(--paper);
  font-family:var(--serif);
  min-height:100vh;
  overflow-x:hidden;
  -webkit-font-smoothing:antialiased;
  cursor:none;
}
@media(max-width:640px){body{cursor:auto}}

::-webkit-scrollbar{width:3px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}
::selection{background:var(--amber);color:var(--black)}

button{cursor:none;border:none;background:none;font-family:inherit;color:inherit;padding:0}
@media(max-width:640px){button{cursor:pointer}}
a{color:inherit;text-decoration:none;cursor:none}
@media(max-width:640px){a{cursor:pointer}}
textarea,input[type=range],input[type=text],input[type=checkbox]{font-family:inherit}
textarea:focus,input:focus{outline:none}

/* ── CUSTOM CURSOR ── */
#cursor{
  position:fixed;z-index:99999;pointer-events:none;
  width:12px;height:12px;border-radius:50%;
  background:var(--amber);
  transform:translate(-50%,-50%);
  transition:transform 0.1s var(--ease),width 0.3s var(--ease),height 0.3s var(--ease),opacity 0.3s;
  mix-blend-mode:difference;
  will-change:transform;
}
#cursor-ring{
  position:fixed;z-index:99998;pointer-events:none;
  width:36px;height:36px;border-radius:50%;
  border:1px solid rgba(200,146,42,0.5);
  transform:translate(-50%,-50%);
  transition:transform 0.18s var(--ease),width 0.4s var(--ease),height 0.4s var(--ease),opacity 0.4s,border-color 0.3s;
  will-change:transform;
}
body.cursor-hover #cursor{width:20px;height:20px;background:var(--amhi)}
body.cursor-hover #cursor-ring{width:52px;height:52px;border-color:rgba(232,169,58,0.8)}
body.cursor-click #cursor{transform:translate(-50%,-50%) scale(0.6)}
@media(max-width:640px){#cursor,#cursor-ring{display:none}}

/* ── LIVING CANVAS (background) ── */
#living-bg{
  position:fixed;inset:0;z-index:0;pointer-events:none;
}

/* ── GRAIN ── */
#grain{
  position:fixed;inset:0;z-index:9997;pointer-events:none;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.042'/%3E%3C/svg%3E");
  opacity:0.55;
}

/* ── VIGNETTE ── */
#vig{
  position:fixed;inset:0;z-index:9996;pointer-events:none;
  background:radial-gradient(ellipse at 50% 40%,transparent 25%,rgba(0,0,0,0.72) 100%);
}

/* ── CONTENT LAYER ── */
#app-layer{position:relative;z-index:10}

/* ── ANIMATIONS ── */
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes confIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
@keyframes modalUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
@keyframes overlayIn{from{opacity:0}to{opacity:1}}
@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
@keyframes flicker{0%,100%{opacity:1}47%{opacity:1}50%{opacity:.58}53%{opacity:1}79%{opacity:.78}82%{opacity:1}}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes glow{0%,100%{box-shadow:0 0 18px rgba(200,146,42,.08)}50%{box-shadow:0 0 38px rgba(200,146,42,.32),0 0 70px rgba(200,146,42,.07)}}
@keyframes candleWave{0%,100%{transform:scaleY(1) scaleX(1)}33%{transform:scaleY(1.08) scaleX(.93) translateX(-1px)}66%{transform:scaleY(.95) scaleX(1.06) translateX(1px)}}
@keyframes rippleOut{0%{transform:scale(0);opacity:.6}100%{transform:scale(3.5);opacity:0}}
@keyframes shimmer{0%{opacity:.4}50%{opacity:.8}100%{opacity:.4}}
@keyframes cardGlow{0%,100%{box-shadow:none}50%{box-shadow:0 0 28px rgba(200,146,42,.06)}}
@keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.006)}}
@keyframes inkDrop{0%{opacity:0;transform:scaleX(0)}100%{opacity:1;transform:scaleX(1)}}
@keyframes floatUp{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-60px)}}

.fade-up{animation:fadeUp .7s var(--ease) both}
.fade-in{animation:fadeIn .5s var(--ease) both}
.flicker{animation:flicker 5s ease-in-out infinite}
.blink{animation:blink 1.1s step-end infinite}
.conf-enter{animation:confIn .85s var(--ease) both}

/* ── LAYOUT ── */
.page{max-width:780px;margin:0 auto;padding:110px 28px 180px;position:relative}
@media(max-width:640px){.page{padding:88px 16px 150px}}

/* ── NAV ── */
.nav{
  position:fixed;top:0;left:0;right:0;z-index:800;
  height:60px;display:flex;align-items:center;justify-content:space-between;
  padding:0 28px;
  background:rgba(7,7,7,.93);
  backdrop-filter:blur(24px) saturate(1.6);
  -webkit-backdrop-filter:blur(24px) saturate(1.6);
  border-bottom:1px solid var(--border);
}
@media(max-width:640px){.nav{padding:0 16px}}
.nav-brand{display:flex;align-items:center;gap:9px;cursor:none}
@media(max-width:640px){.nav-brand{cursor:pointer}}
.nav-brand img{height:26px;width:auto;object-fit:contain;display:block}
.nav-brand-name{font-family:var(--serif);font-style:italic;font-weight:600;font-size:1rem;letter-spacing:.16em;color:var(--warm)}
.nav-right{display:flex;align-items:center;gap:2px}
.nav-lk{
  font-family:var(--mono);font-size:.58rem;letter-spacing:.1em;
  color:var(--dim);padding:6px 11px;border-radius:4px;
  transition:color .2s,background .2s;cursor:none;white-space:nowrap;
}
@media(max-width:640px){.nav-lk{cursor:pointer}}
.nav-lk:hover{color:var(--soft);background:rgba(255,255,255,.03)}
.nav-lk.on{color:var(--paper);background:rgba(255,255,255,.04)}
.nav-lk.chain-on{color:var(--amber)}
.nav-ico{width:30px;height:30px;display:flex;align-items:center;justify-content:center;color:var(--dim);border-radius:4px;transition:color .2s,background .2s;cursor:none}
@media(max-width:640px){.nav-ico{cursor:pointer}}
.nav-ico:hover{color:var(--soft);background:rgba(255,255,255,.04)}
.nav-sep{width:1px;height:14px;background:var(--border2);margin:0 4px;flex-shrink:0}
@media(max-width:640px){.nav-right .nav-lk{display:none}.nav-right .nav-sep:first-of-type{display:none}}

/* ── CA BAR ── */
.ca-bar{
  position:fixed;top:60px;left:0;right:0;z-index:700;
  height:34px;display:flex;align-items:center;justify-content:center;
  background:var(--surface);border-bottom:1px solid var(--border);
}
.ca-pill{
  display:inline-flex;align-items:center;gap:8px;
  padding:4px 14px;border:1px solid var(--border2);
  border-radius:100px;cursor:none;
  transition:border-color .25s,background .25s;
  background:var(--black);
}
@media(max-width:640px){.ca-pill{cursor:pointer}}
.ca-pill:hover{border-color:var(--amlo)}
.ca-pill.copied{border-color:var(--amber);background:rgba(200,146,42,.04)}
.ca-tick{font-family:var(--mono);font-size:.58rem;font-weight:500;color:var(--amber);letter-spacing:.08em}
.ca-sep{width:1px;height:10px;background:var(--border2)}
.ca-addr{font-family:var(--mono);font-size:.56rem;color:var(--dim);letter-spacing:.04em;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ca-ico{font-size:.62rem;color:var(--muted);min-width:10px;transition:color .2s}
.ca-pill.copied .ca-ico{color:var(--amber)}
@media(max-width:400px){.ca-addr{max-width:88px}}

/* ── WALL HEADER ── */
.wall-head{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:36px;padding-bottom:24px;
  border-bottom:1px solid var(--border);
  gap:12px;flex-wrap:wrap;
}
.wall-h1{display:flex;align-items:center;gap:10px}
.wall-title{
  font-family:var(--serif);font-style:italic;font-weight:400;
  font-size:clamp(1.35rem,4vw,1.75rem);color:var(--warm);letter-spacing:.04em;
}
.wall-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.live-dot{display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--amber);animation:pulse 2s ease-in-out infinite}
.live-lbl{font-family:var(--mono);font-size:.58rem;color:var(--dim);letter-spacing:.1em;display:flex;align-items:center;gap:5px}
.filter-tog{
  font-family:var(--mono);font-size:.57rem;letter-spacing:.08em;
  color:var(--dim);padding:5px 10px;
  border:1px solid var(--border);border-radius:4px;
  transition:all .2s;cursor:none;
}
@media(max-width:640px){.filter-tog{cursor:pointer}}
.filter-tog:hover{color:var(--soft);border-color:var(--border2)}
.filter-tog.on{color:var(--amber);border-color:var(--amlo);background:rgba(200,146,42,.04)}

/* ── FILTER STRIP ── */
.fstrip{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:28px;animation:slideDown .25s var(--ease)}
.fchip{
  font-family:var(--mono);font-size:.56rem;letter-spacing:.07em;
  color:var(--dim);padding:5px 11px;
  border:1px solid var(--border);border-radius:100px;
  transition:all .2s;cursor:none;white-space:nowrap;
}
@media(max-width:640px){.fchip{cursor:pointer}}
.fchip:hover{color:var(--soft);border-color:var(--border2)}
.fchip.on{color:var(--amber);border-color:var(--amlo);background:rgba(200,146,42,.05)}

/* ── SEARCH BAR ── */
.search-wrap{position:relative;margin-bottom:32px}
.search-input{
  width:100%;background:transparent;
  border:none;border-bottom:1px solid var(--border);
  padding:8px 0 10px 20px;
  font-family:var(--mono);font-size:.65rem;
  color:var(--paper);letter-spacing:.06em;
  transition:border-color .3s;
  caret-color:var(--amber);
}
.search-input:focus{border-color:var(--border2)}
.search-input::placeholder{color:var(--muted)}
.search-icon{
  position:absolute;left:0;top:50%;transform:translateY(-50%);
  font-size:.75rem;color:var(--muted);
}

/* ══════════════════════════════════════════════════════════
   CONFESSION CARDS — each type has its own distinct feel
   ══════════════════════════════════════════════════════════ */

/* BASE CARD */
.card{
  position:relative;
  padding:28px 0;
  border-bottom:1px solid var(--border);
  transition:border-color .3s;
  overflow:hidden;
}
.card:first-child{border-top:1px solid var(--border)}
.card::before{
  content:'';
  position:absolute;left:0;top:0;bottom:0;
  width:2px;
  background:transparent;
  transition:background .4s;
}
.card:hover{border-bottom-color:var(--border2)}

/* WHISPER CARD */
.card.whisper-card{
  padding:20px 0 20px 20px;
  opacity:.85;
  transition:opacity .3s,border-color .3s;
}
.card.whisper-card::before{background:rgba(150,149,140,.12)}
.card.whisper-card:hover{opacity:1}
.card.whisper-card:hover::before{background:rgba(150,149,140,.4)}
.card.whisper-card .card-text{
  font-size:.82rem;
  color:var(--soft);
  font-weight:300;
  letter-spacing:.025em;
  line-height:1.9;
  font-style:italic;
}

/* NORMAL CARD */
.card.normal-card{
  padding:28px 0;
}
.card.normal-card::before{background:rgba(200,146,42,.1)}
.card.normal-card:hover::before{background:rgba(200,146,42,.3)}
.card.normal-card .card-text{
  font-size:1.06rem;
  color:var(--paper);
  font-style:italic;
  line-height:1.85;
}

/* SCREAM CARD */
.card.scream-card{
  padding:36px 0 36px 0;
  position:relative;
  animation:cardGlow 6s ease-in-out infinite;
}
.card.scream-card::after{
  content:'';
  position:absolute;left:0;right:0;bottom:0;
  height:1px;
  background:linear-gradient(to right,transparent,rgba(200,146,42,.25),transparent);
}
.card.scream-card::before{display:none}
.card.scream-card .card-text{
  font-size:clamp(1.3rem,4vw,1.75rem);
  font-weight:500;
  color:var(--warm);
  font-style:italic;
  line-height:1.7;
  letter-spacing:.01em;
}
@media(max-width:640px){.card.scream-card .card-text{font-size:1.25rem}}

/* BURNED CARD accent */
.card.burned-card{
  background:linear-gradient(to right,rgba(200,146,42,.018),transparent 60%);
}
.card.burned-card::before{background:rgba(200,146,42,.35) !important}

/* ── CARD CONTENT ── */
.card-number{
  font-family:var(--mono);font-size:.52rem;color:var(--muted);
  letter-spacing:.1em;margin-bottom:10px;
}
.card-user{
  font-family:var(--mono);font-size:.58rem;
  color:var(--amlo);letter-spacing:.06em;
  margin-bottom:8px;display:flex;align-items:center;gap:5px;
}
.card-user::before{content:'~';color:var(--muted)}
.card-foot{
  display:flex;align-items:center;gap:10px;
  margin-top:14px;flex-wrap:wrap;
}
.card-time{font-family:var(--mono);font-size:.56rem;color:var(--muted);letter-spacing:.06em}
.card-cat{font-size:.7rem;opacity:.6;line-height:1}
.card-live{
  display:flex;align-items:center;gap:4px;
  font-family:var(--mono);font-size:.52rem;color:var(--amber);letter-spacing:.1em;
}
.chain-pill{
  display:inline-flex;align-items:center;gap:5px;
  font-family:var(--mono);font-size:.52rem;letter-spacing:.07em;
  color:var(--amlo);padding:2px 8px;
  border:1px solid rgba(200,146,42,.18);border-radius:100px;
  transition:all .2s;cursor:none;
}
@media(max-width:640px){.chain-pill{cursor:pointer}}
.chain-pill:hover{color:var(--amber);border-color:rgba(200,146,42,.45);background:rgba(200,146,42,.04)}

/* ── HOVER INK LINE (on card hover) ── */
.card-ink{
  position:absolute;bottom:0;left:0;
  height:1px;width:100%;
  background:linear-gradient(to right,var(--amber),transparent);
  transform:scaleX(0);transform-origin:left;
  transition:transform .5s var(--ease);
}
.card:hover .card-ink{transform:scaleX(1)}

/* ── REACTIONS ── */
.react-bar{display:flex;gap:4px;margin-top:14px;flex-wrap:wrap}
.react-btn{
  display:inline-flex;align-items:center;gap:5px;
  padding:5px 10px;border-radius:100px;
  border:1px solid transparent;
  font-family:var(--mono);font-size:.57rem;
  color:var(--muted);
  transition:all .18s var(--ease);
  position:relative;overflow:hidden;white-space:nowrap;
  cursor:none;
}
@media(max-width:640px){.react-btn{cursor:pointer}}
.react-btn:hover{color:var(--soft);border-color:var(--border2);background:var(--surface)}
.react-btn.on{color:var(--amber);border-color:rgba(200,146,42,.35);background:rgba(200,146,42,.06)}
.react-emoji{font-size:.82rem;line-height:1}
.react-count{letter-spacing:.05em}
.react-ripple{
  position:absolute;border-radius:50%;pointer-events:none;
  background:rgba(200,146,42,.22);
  width:100%;padding-bottom:100%;left:0;top:50%;
  transform:translateY(-50%) scale(0);
  animation:rippleOut .45s ease-out forwards;
}

/* ── FLOATING PARTICLES (emitted on reaction tap) ── */
.float-particle{
  position:fixed;pointer-events:none;z-index:9995;
  font-size:1rem;
  animation:floatUp .9s ease-out forwards;
}

/* ── FAB ── */
.confess-fab{
  position:fixed;bottom:32px;left:50%;
  transform:translateX(-50%);
  z-index:600;
  display:flex;align-items:center;gap:9px;
  padding:13px 38px;
  background:var(--black);border:1px solid var(--amlo);
  border-radius:100px;
  font-family:var(--serif);font-style:italic;font-weight:500;
  font-size:.95rem;letter-spacing:.18em;color:var(--amber);
  transition:all .3s var(--ease);
  animation:glow 4.5s ease-in-out infinite;
  cursor:none;white-space:nowrap;
}
@media(max-width:640px){.confess-fab{cursor:pointer;bottom:calc(68px + env(safe-area-inset-bottom));padding:11px 30px;font-size:.9rem}}
.confess-fab:hover{
  background:var(--amber);border-color:var(--amber);color:var(--black);
  transform:translateX(-50%) translateY(-3px);
  box-shadow:0 10px 38px rgba(200,146,42,.48);
  animation:none;
}
.fab-flame{animation:candleWave 3.2s ease-in-out infinite;display:inline-block}

/* ── MOBILE NAV ── */
.mob-nav{
  position:fixed;bottom:0;left:0;right:0;z-index:800;
  display:none;align-items:stretch;
  background:rgba(7,7,7,.97);
  backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  border-top:1px solid var(--border);
  padding-bottom:env(safe-area-inset-bottom);
}
@media(max-width:640px){.mob-nav{display:flex}}
.mob-item{
  flex:1;display:flex;flex-direction:column;align-items:center;
  gap:3px;padding:8px 0;
  font-family:var(--mono);font-size:.5rem;letter-spacing:.07em;
  color:var(--muted);cursor:pointer;transition:color .2s;
}
.mob-item.on{color:var(--amber)}
.mob-item svg{opacity:.7}
.mob-item.on svg{opacity:1}
.mob-center-btn{
  width:42px;height:42px;border-radius:50%;
  background:var(--amber);display:flex;align-items:center;justify-content:center;
  box-shadow:0 0 20px rgba(200,146,42,.55);margin-bottom:2px;
  transition:transform .2s var(--ease),box-shadow .2s;
}
.mob-item:active .mob-center-btn{transform:scale(.93);box-shadow:0 0 10px rgba(200,146,42,.3)}

/* ── MODAL ── */
.modal-bg{
  position:fixed;inset:0;z-index:900;
  background:rgba(4,4,4,.97);
  backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);
  overflow-y:auto;
  animation:overlayIn .3s var(--ease);
}
.modal-scroll{
  min-height:100%;
  display:flex;align-items:flex-start;justify-content:center;
  padding:72px 24px 60px;
}
@media(max-width:640px){.modal-scroll{padding:64px 16px 48px}}
.modal-body{width:100%;max-width:640px;animation:modalUp .4s var(--ease)}

.modal-eyebrow{
  display:flex;align-items:center;gap:12px;margin-bottom:28px;
}
.m-ey-line{flex:1;height:1px;background:var(--border)}
.m-ey-text{
  font-family:var(--mono);font-size:.55rem;
  color:var(--muted);letter-spacing:.15em;white-space:nowrap;
}

/* Username field */
.username-wrap{
  display:flex;align-items:center;gap:8px;
  margin-bottom:20px;
  padding-bottom:16px;
  border-bottom:1px solid var(--border);
}
.username-prefix{
  font-family:var(--mono);font-size:.65rem;color:var(--amlo);
  letter-spacing:.06em;flex-shrink:0;
}
.username-input{
  flex:1;background:transparent;border:none;
  font-family:var(--mono);font-size:.65rem;
  color:var(--amber);letter-spacing:.06em;
  caret-color:var(--amber);
  transition:color .2s;
}
.username-input::placeholder{color:var(--muted);font-size:.62rem}

.modal-ta{
  width:100%;background:transparent;border:none;
  border-bottom:1px solid var(--border);
  padding:0 0 20px;display:block;
  color:var(--warm);font-style:italic;font-weight:400;
  line-height:1.85;resize:none;min-height:150px;
  caret-color:var(--amber);transition:border-color .3s;
}
.modal-ta:focus{border-bottom-color:var(--border2)}
.modal-ta.whisper{font-size:.88rem}
.modal-ta.normal {font-size:1.1rem}
.modal-ta.scream {font-size:1.55rem}
@media(max-width:640px){.modal-ta.scream{font-size:1.2rem}}

.modal-sec{margin-top:26px}
.modal-lbl{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.modal-lbl-t{font-family:var(--mono);font-size:.56rem;color:var(--muted);letter-spacing:.12em}
.modal-lbl-v{font-family:var(--mono);font-size:.56rem;color:var(--amber);letter-spacing:.1em}

.slider{
  -webkit-appearance:none;appearance:none;
  width:100%;height:2px;
  background:linear-gradient(to right,var(--amber) var(--pct,50%),var(--border2) var(--pct,50%));
  border-radius:1px;cursor:none;
}
@media(max-width:640px){.slider{cursor:pointer}}
.slider::-webkit-slider-thumb{
  -webkit-appearance:none;width:14px;height:14px;
  border-radius:50%;background:var(--amber);
  box-shadow:0 0 8px rgba(200,146,42,.5);
  transition:transform .2s;cursor:none;
}
@media(max-width:640px){.slider::-webkit-slider-thumb{cursor:pointer}}
.slider::-webkit-slider-thumb:hover{transform:scale(1.35)}
.slider-ends{display:flex;justify-content:space-between;margin-top:7px}
.slider-end{font-family:var(--mono);font-size:.54rem;color:var(--border2);letter-spacing:.07em}

.cats-wrap{display:flex;flex-wrap:wrap;gap:7px}
.cat-chip{
  font-family:var(--mono);font-size:.56rem;letter-spacing:.06em;
  color:var(--dim);padding:5px 11px;
  border:1px solid var(--border);border-radius:4px;
  transition:all .18s;cursor:none;white-space:nowrap;
}
@media(max-width:640px){.cat-chip{cursor:pointer}}
.cat-chip:hover{color:var(--soft);border-color:var(--border2)}
.cat-chip.on{color:var(--amber);border-color:var(--amlo);background:rgba(200,146,42,.05)}

.burn-box{
  margin-top:24px;padding:18px 20px;
  border:1px solid var(--border);border-radius:8px;
  transition:border-color .3s,background .3s;cursor:none;
}
@media(max-width:640px){.burn-box{cursor:pointer}}
.burn-box:hover{border-color:var(--border2)}
.burn-box.on{border-color:rgba(200,146,42,.4);background:rgba(200,146,42,.025)}
.burn-row{display:flex;align-items:flex-start;gap:13px}
.burn-cb{width:15px;height:15px;accent-color:var(--amber);margin-top:4px;flex-shrink:0;cursor:none}
@media(max-width:640px){.burn-cb{cursor:pointer}}
.burn-title{font-family:var(--serif);font-style:italic;font-size:.98rem;color:var(--paper);line-height:1.4}
.burn-sub{font-family:var(--mono);font-size:.56rem;color:var(--muted);margin-top:5px;line-height:1.75;letter-spacing:.03em}
.burn-wallet{margin-top:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.wallet-badge{
  font-family:var(--mono);font-size:.56rem;color:var(--amber);
  padding:4px 10px;border:1px solid rgba(200,146,42,.28);
  border-radius:100px;background:rgba(200,146,42,.04);
}
.connect-btn{
  font-family:var(--mono);font-size:.56rem;color:var(--amber);
  letter-spacing:.08em;padding:5px 12px;
  border:1px solid rgba(200,146,42,.4);border-radius:4px;
  transition:background .2s;cursor:none;background:transparent;
}
@media(max-width:640px){.connect-btn{cursor:pointer}}
.connect-btn:hover{background:rgba(200,146,42,.07)}

.submit-row{
  display:flex;align-items:center;justify-content:space-between;
  margin-top:32px;gap:12px;flex-wrap:wrap;
}
.release-btn{
  font-family:var(--serif);font-style:italic;font-weight:500;
  font-size:1.1rem;letter-spacing:.1em;color:var(--paper);
  padding:11px 34px;
  border:1px solid var(--border2);border-radius:4px;
  background:var(--surface);transition:all .3s var(--ease);cursor:none;
}
@media(max-width:640px){.release-btn{cursor:pointer}}
.release-btn:hover:not(:disabled){
  background:var(--amber);border-color:var(--amber);color:var(--black);
  transform:translateY(-2px);box-shadow:0 8px 28px rgba(200,146,42,.35);
}
.release-btn:disabled{opacity:.28;cursor:not-allowed}
.char-cnt{font-family:var(--mono);font-size:.56rem;color:var(--muted);letter-spacing:.06em}
.modal-hint{margin-top:22px;font-family:var(--mono);font-size:.53rem;color:var(--border2);letter-spacing:.07em;line-height:1.8;font-style:italic}
.modal-close{
  position:fixed;top:18px;right:22px;z-index:910;
  width:34px;height:34px;display:flex;align-items:center;justify-content:center;
  font-family:var(--mono);font-size:.68rem;color:var(--dim);
  border:1px solid var(--border);border-radius:50%;
  background:var(--surface);transition:all .2s;cursor:none;
}
@media(max-width:640px){.modal-close{cursor:pointer}}
.modal-close:hover{color:var(--paper);border-color:var(--border2)}

/* ── FULL SCREEN STATES ── */
.full-screen{
  position:fixed;inset:0;z-index:950;
  background:var(--black);
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:20px;
  animation:fadeIn .4s ease;
}
.burn-flame{font-size:3.2rem;animation:candleWave .45s ease-in-out infinite}
.burn-status{font-family:var(--mono);font-size:.68rem;color:var(--amber);letter-spacing:.22em;animation:pulse 1.6s ease infinite}
.burn-note{font-family:var(--mono);font-size:.57rem;color:var(--muted);letter-spacing:.07em;text-align:center;max-width:260px;line-height:1.8}
.done-l1{font-family:var(--serif);font-style:italic;font-size:clamp(1.5rem,5vw,2.2rem);color:var(--paper);animation:fadeUp .7s .15s var(--ease) both}
.done-l2{font-family:var(--serif);font-size:clamp(.88rem,2.5vw,1.05rem);color:var(--dim);animation:fadeUp .7s .45s var(--ease) both}

/* ── CHAIN PAGE ── */
.chain-head{margin-bottom:48px}
.chain-h1{font-family:var(--serif);font-style:italic;font-weight:400;font-size:clamp(1.65rem,5vw,2.4rem);color:var(--warm);margin-bottom:16px;letter-spacing:.03em}
.chain-desc{font-family:var(--mono);font-size:.63rem;color:var(--dim);line-height:1.95;letter-spacing:.04em;max-width:440px}
.chain-rule{width:44px;height:1px;background:linear-gradient(to right,var(--amlo),transparent);margin-top:22px}
.chain-entry{padding:30px 0;border-bottom:1px solid rgba(200,146,42,.07);animation:confIn .7s var(--ease) both}
.chain-entry:first-child{border-top:1px solid rgba(200,146,42,.07)}
.chain-text{font-family:var(--serif);font-style:italic;font-weight:400;color:var(--paper);line-height:1.85;opacity:.87}
.chain-meta{display:flex;align-items:center;gap:12px;margin-top:12px;flex-wrap:wrap}
.chain-time{font-family:var(--mono);font-size:.56rem;color:var(--muted);letter-spacing:.06em}
.chain-tx{
  display:inline-flex;align-items:center;gap:5px;
  font-family:var(--mono);font-size:.54rem;letter-spacing:.07em;
  color:var(--amlo);padding:2px 9px;
  border:1px solid rgba(200,146,42,.15);border-radius:100px;
  transition:all .2s;cursor:none;
}
@media(max-width:640px){.chain-tx{cursor:pointer}}
.chain-tx:hover{color:var(--amber);border-color:rgba(200,146,42,.42);background:rgba(200,146,42,.04)}
.chain-empty{padding:80px 0;text-align:center}
.chain-e-t{font-family:var(--serif);font-style:italic;font-size:1.15rem;color:var(--muted);margin-bottom:10px}
.chain-e-s{font-family:var(--mono);font-size:.58rem;color:var(--border2);letter-spacing:.09em}

/* ── LORE ── */
.lore-h1{font-family:var(--serif);font-style:italic;font-weight:400;font-size:clamp(1.5rem,4.5vw,2rem);color:var(--warm);margin-bottom:52px;letter-spacing:.04em}
.lore-para{padding:32px 0;border-top:1px solid var(--border)}
.lore-para:first-of-type{border-top:none;padding-top:0}
.lore-text{font-family:var(--serif);font-weight:300;line-height:1.95;letter-spacing:.01em}
.lore-text.primary{font-size:clamp(1rem,2.5vw,1.12rem);font-style:italic;color:var(--paper)}
.lore-text.body{font-size:clamp(.88rem,2vw,.96rem);color:rgba(240,235,224,.65)}
.lore-footer{margin-top:60px;padding:26px;border:1px solid var(--border);border-radius:8px;background:var(--surface)}
.lore-f-brand{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.lore-f-name{font-family:var(--mono);font-size:.62rem;color:var(--dim);letter-spacing:.09em}
.lore-f-links{display:flex;gap:18px;margin-top:14px;flex-wrap:wrap}
.lore-f-link{font-family:var(--mono);font-size:.58rem;color:var(--muted);letter-spacing:.09em;transition:color .2s;cursor:none}
@media(max-width:640px){.lore-f-link{cursor:pointer}}
.lore-f-link:hover{color:var(--amber)}

/* ── LOADING / EMPTY ── */
.loading-t{font-family:var(--mono);font-size:.62rem;color:var(--muted);letter-spacing:.12em;padding:48px 0}
.empty-t{font-family:var(--serif);font-style:italic;font-size:1rem;color:var(--muted);padding:60px 0;line-height:1.8}

/* ── TOAST ── */
.toast{
  position:fixed;bottom:110px;left:50%;transform:translateX(-50%);
  z-index:9999;padding:10px 20px;
  background:var(--surface);border:1px solid var(--border2);
  border-radius:4px;white-space:nowrap;
  font-family:var(--mono);font-size:.6rem;color:var(--soft);letter-spacing:.05em;
  animation:fadeUp .3s var(--ease);
}
@media(max-width:640px){.toast{bottom:100px;max-width:90vw;white-space:normal;text-align:center}}

/* ── HOVER GLOW ZONE ── */
.glow-zone{
  position:absolute;
  border-radius:50%;
  background:radial-gradient(circle,rgba(200,146,42,.07) 0%,transparent 70%);
  pointer-events:none;
  transform:translate(-50%,-50%);
  transition:opacity .3s;
  z-index:1;
}
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
// LIVING BACKGROUND CANVAS
// ─────────────────────────────────────────────────────────────────────────────
function LivingBackground({ mousePos }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Spawn dust particles
    for (let i = 0; i < 55; i++) {
      particlesRef.current.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.4 + 0.3,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -Math.random() * 0.18 - 0.05,
        opacity: Math.random() * 0.45 + 0.05,
        life: Math.random(),
        decay: Math.random() * 0.0008 + 0.0002,
      });
    }

    const draw = () => {
      timeRef.current += 0.008;
      const t = timeRef.current;
      const W = canvas.width;
      const H = canvas.height;
      const mx = mousePos.current.x;
      const my = mousePos.current.y;

      ctx.clearRect(0, 0, W, H);

      // ── Deep atmosphere gradient ──
      const atm = ctx.createRadialGradient(W*0.5, H*0.35, 0, W*0.5, H*0.35, H*0.85);
      atm.addColorStop(0, `rgba(18,14,8,${0.0})`);
      atm.addColorStop(0.6, `rgba(10,8,4,${0.0})`);
      atm.addColorStop(1,   `rgba(4,3,2,${0.0})`);
      ctx.fillStyle = atm;
      ctx.fillRect(0, 0, W, H);

      // ── Mouse warm glow ──
      if (mx > 0 && my > 0) {
        const mg = ctx.createRadialGradient(mx, my, 0, mx, my, 260);
        mg.addColorStop(0,   "rgba(200,146,42,0.055)");
        mg.addColorStop(0.4, "rgba(180,120,30,0.022)");
        mg.addColorStop(1,   "rgba(0,0,0,0)");
        ctx.fillStyle = mg;
        ctx.fillRect(0, 0, W, H);

        // Inner warm core
        const mc = ctx.createRadialGradient(mx, my, 0, mx, my, 80);
        mc.addColorStop(0,   "rgba(232,169,58,0.07)");
        mc.addColorStop(1,   "rgba(0,0,0,0)");
        ctx.fillStyle = mc;
        ctx.fillRect(0, 0, W, H);
      }

      // ── Slow breathing glow nodes ──
      const nodes = [
        { x: W*0.15, y: H*0.2,  r: 220, s: 0.7 },
        { x: W*0.8,  y: H*0.15, r: 180, s: 1.1 },
        { x: W*0.5,  y: H*0.6,  r: 280, s: 0.9 },
        { x: W*0.1,  y: H*0.75, r: 160, s: 1.3 },
        { x: W*0.9,  y: H*0.7,  r: 200, s: 0.6 },
      ];
      nodes.forEach((n, i) => {
        const pulse = Math.sin(t * n.s + i * 1.3) * 0.5 + 0.5;
        const alpha = pulse * 0.04;
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
        g.addColorStop(0,   `rgba(200,146,42,${alpha})`);
        g.addColorStop(0.5, `rgba(140,100,28,${alpha * 0.4})`);
        g.addColorStop(1,   "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      });

      // ── Dust particles ──
      particlesRef.current.forEach((p, i) => {
        // Mouse attraction (subtle)
        if (mx > 0 && my > 0) {
          const dx = mx - p.x, dy = my - p.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 200) {
            p.vx += (dx / dist) * 0.004;
            p.vy += (dy / dist) * 0.002;
          }
        }

        p.x += p.vx + Math.sin(t + i) * 0.06;
        p.y += p.vy + Math.cos(t * 0.7 + i * 0.5) * 0.04;
        p.life -= p.decay;

        if (p.life <= 0 || p.y < -10 || p.x < -10 || p.x > W + 10) {
          p.x = Math.random() * W;
          p.y = H + 10;
          p.vx = (Math.random() - 0.5) * 0.12;
          p.vy = -Math.random() * 0.18 - 0.05;
          p.life = 1;
        }

        const fade = Math.sin(p.life * Math.PI);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,146,42,${fade * p.opacity})`;
        ctx.fill();
      });

      // ── Subtle horizontal scan line ──
      const scanY = ((t * 30) % H);
      const sg = ctx.createLinearGradient(0, scanY-2, 0, scanY+2);
      sg.addColorStop(0,   "rgba(200,146,42,0)");
      sg.addColorStop(0.5, "rgba(200,146,42,0.015)");
      sg.addColorStop(1,   "rgba(200,146,42,0)");
      ctx.fillStyle = sg;
      ctx.fillRect(0, scanY - 2, W, 4);

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="living-bg"
      style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM CURSOR
// ─────────────────────────────────────────────────────────────────────────────
function CustomCursor({ mousePos }) {
  const cursorRef = useRef(null);
  const ringRef   = useRef(null);
  const ringPos   = useRef({ x: 0, y: 0 });
  const rafRef    = useRef(null);

  useEffect(() => {
    if (isMobile()) return;

    const move = e => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + "px";
        cursorRef.current.style.top  = e.clientY + "px";
      }
    };

    const smoothRing = () => {
      const target = mousePos.current;
      ringPos.current.x += (target.x - ringPos.current.x) * 0.12;
      ringPos.current.y += (target.y - ringPos.current.y) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.left = ringPos.current.x + "px";
        ringRef.current.style.top  = ringPos.current.y + "px";
      }
      rafRef.current = requestAnimationFrame(smoothRing);
    };
    smoothRing();

    const onEnter = () => document.body.classList.add("cursor-hover");
    const onLeave = () => document.body.classList.remove("cursor-hover");
    const onDown  = () => { document.body.classList.add("cursor-click"); };
    const onUp    = () => { document.body.classList.remove("cursor-click"); };

    document.addEventListener("mousemove", move);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);

    document.querySelectorAll("button,a,[role=button]").forEach(el => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    // MutationObserver to catch dynamically added elements
    const obs = new MutationObserver(() => {
      document.querySelectorAll("button:not([data-cursor]),a:not([data-cursor]),[role=button]:not([data-cursor])").forEach(el => {
        el.setAttribute("data-cursor", "1");
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
      cancelAnimationFrame(rafRef.current);
      obs.disconnect();
    };
  }, []);

  return (
    <>
      <div id="cursor" ref={cursorRef} />
      <div id="cursor-ring" ref={ringRef} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FLOATING EMOJI PARTICLE (on reaction)
// ─────────────────────────────────────────────────────────────────────────────
function FloatParticle({ emoji, x, y, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 950); return () => clearTimeout(t); }, []);
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
    <div className={`ca-pill${copied ? " copied" : ""}`}
      onClick={() => { navigator.clipboard.writeText(CA).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2200); }}
      title="Copy CA">
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
      <div className="nav-brand" onClick={() => setPage("wall")}>
        <img src="/logo.png" alt="ConfessCoin" onError={e=>e.target.style.display="none"} />
        <span className="nav-brand-name">CONFESS</span>
      </div>
      <div className="nav-right">
        <span className={`nav-lk${page==="wall"?" on":""}`} onClick={()=>setPage("wall")}>The Wall</span>
        <span className={`nav-lk${page==="chain"?" chain-on":""}`} onClick={()=>setPage("chain")}>⛓ On‑Chain</span>
        <span className={`nav-lk${page==="lore"?" on":""}`} onClick={()=>setPage("lore")}>Why This Exists</span>
        <div className="nav-sep" />
        <a href={SOCIAL.x}         target="_blank" rel="noopener noreferrer" className="nav-ico" title="X">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
        <a href={SOCIAL.community} target="_blank" rel="noopener noreferrer" className="nav-ico" title="Community">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
        </a>
        <a href={SOCIAL.github}    target="_blank" rel="noopener noreferrer" className="nav-ico" title="GitHub">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>
        </a>
        <div className="nav-sep" />
        <button className="nav-ico" onClick={toggleSound} title={soundOn?"Mute":"Ambient"}
          style={{fontSize:".8rem",opacity:soundOn?1:.38,transition:"opacity .3s"}}>
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
        <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/></svg>Wall
      </div>
      <div className={`mob-item${page==="chain"?" on":""}`} onClick={()=>setPage("chain")}>
        <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>Chain
      </div>
      <div className="mob-item" onClick={onConfess} style={{flex:1.3}}>
        <div className="mob-center-btn">
          <svg width="17" height="17" fill="none" stroke="var(--black)" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
        <span style={{color:"var(--amber)"}}>Confess</span>
      </div>
      <div className={`mob-item${page==="lore"?" on":""}`} onClick={()=>setPage("lore")}>
        <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Why
      </div>
      <div className="mob-item" onClick={()=>navigator.clipboard.writeText(CA).catch(()=>{})}>
        <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>$CFN
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
    // ── Stop any parent click propagation ──
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
      setTimeout(() => setRipple(null), 500);

      // Emit floating particle
      if (e && setParticles) {
        const rect = e.target.getBoundingClientRect();
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
    } catch(e){ console.error("rx",e); }
  }, [active, confId, local, rxData, setParticles]);

  return (
    <div className="react-bar" onClick={e => e.stopPropagation()}>
      {REACTIONS.map(r => (
        <button
          key={r.key}
          className={`react-btn${active===r.key?" on":""}`}
          title={r.label}
          onClick={e => tap(r.key, e)}
          type="button"
        >
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

  // Stable card index for visual variety
  const variant = useMemo(() => {
    const h = data.id ? data.id.charCodeAt(0) % 3 : 0;
    return h;
  }, [data.id]);

  const cardClass = `card conf-enter ${sz}-card${data.burned?" burned-card":""}`;

  return (
    <div className={cardClass} style={{ animationDelay:`${delay}s` }}>
      <div className="card-ink" />

      {/* Card number marker — only for scream */}
      {sz === "scream" && (
        <div className="card-number">— {cat?.emoji || "∅"} —</div>
      )}

      {/* Username */}
      {data.username && (
        <div className="card-user">{data.username}</div>
      )}

      {/* Confession text */}
      <p className="card-text" style={{
        // Subtle variant differences for normal cards
        paddingLeft: sz==="whisper" ? "0" : variant===1 && sz==="normal" ? "14px" : "0",
        borderLeft:  variant===1 && sz==="normal" ? "1px solid var(--border2)" : "none",
      }}>
        {data.text}
      </p>

      <div className="card-foot">
        <span className="card-time">{timeAgo(data.timestamp)}</span>
        {cat && <span className="card-cat" title={cat.label}>{cat.emoji}</span>}
        {isNew && <span className="card-live"><span className="live-dot" />LIVE</span>}
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
// CONFESS MODAL — with username, Phantom mobile deeplink, tagline fix
// ─────────────────────────────────────────────────────────────────────────────
function ConfessModal({ onClose, onDone, setToast }) {
  const [text,     setText]     = useState("");
  const [username, setUsername] = useState("");
  const [sliderV,  setSliderV]  = useState(50);
  const [category, setCategory] = useState("");
  const [burn,     setBurn]     = useState(false);
  const [wallet,   setWallet]   = useState(null);
  const [phase,    setPhase]    = useState("write"); // write | burning | done
  const taRef = useRef(null);
  const sz = sizeKey(sliderV);

  useEffect(() => {
    setTimeout(() => taRef.current?.focus(), 80);
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // ── Phantom wallet connect — mobile deeplink aware ──
  const connectWallet = async () => {
    try {
      if (isMobile()) {
        // On mobile, attempt deeplink first then fallback
        const sol = window.solana || window.phantom?.solana;
        if (!sol?.isPhantom) {
          // Try Phantom universal link deeplink
          const returnUrl = encodeURIComponent(window.location.href);
          window.location.href = `https://phantom.app/ul/v1/connect?app_url=${returnUrl}&redirect_link=${returnUrl}`;
          return null;
        }
        const r = await sol.connect();
        setWallet(r.publicKey.toString());
        return r.publicKey.toString();
      }

      const sol = window.solana || window.phantom?.solana;
      if (!sol?.isPhantom) {
        setToast("Install Phantom wallet at phantom.app");
        return null;
      }
      const r = await sol.connect();
      const addr = r.publicKey.toString();
      setWallet(addr);
      return addr;
    } catch {
      setToast("Wallet connection declined");
      return null;
    }
  };

  const handleBurnToggle = async () => {
    const next = !burn;
    setBurn(next);
    if (next && !wallet) await connectWallet();
  };

  const submit = async () => {
    if (text.trim().length < 3) return;
    let txHash = null, burned = false;

    if (burn) {
      const addr = wallet || await connectWallet();
      if (!addr) { setToast("Connect wallet first"); return; }
      setPhase("burning");

      try {
        const sol  = window.solana || window.phantom?.solana;
        const web3 = window.solanaWeb3;
        if (!web3) throw new Error("Solana web3 not loaded");

        const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, TransactionInstruction } = web3;
        const conn  = new Connection(SOLANA_RPC, "confirmed");
        const pk    = new PublicKey(addr);
        const memoPk= new PublicKey(MEMO_PROG);

        const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");
        const tx = new Transaction({ recentBlockhash: blockhash, feePayer: pk });

        const memo = JSON.stringify({ app:"confessioncoin.xyz", v:1, text: text.trim().slice(0,380), user: username.trim()||null });
        tx.add(new TransactionInstruction({
          keys:[{pubkey:pk,isSigner:true,isWritable:false}],
          programId: memoPk,
          data: Buffer.from(memo,"utf-8"),
        }));
        tx.add(SystemProgram.transfer({
          fromPubkey:pk, toPubkey:pk,
          lamports: Math.round(BURN_SOL * LAMPORTS_PER_SOL),
        }));

        const signed = await sol.signTransaction(tx);
        txHash = await conn.sendRawTransaction(signed.serialize(), { skipPreflight:false });
        await conn.confirmTransaction({ signature:txHash, blockhash, lastValidBlockHeight }, "confirmed");
        burned = true;
      } catch (e) {
        console.error("Burn error:", e);
        const m = e?.message||"";
        if (m.includes("insufficient")||m.includes("0x1")) setToast("Not enough SOL — need ~0.012 SOL including fees");
        else if (m.includes("rejected")||m.includes("User rejected")) setToast("Transaction rejected");
        else setToast("On-chain write failed — saving to wall only");
        setPhase("write"); setBurn(false); return;
      }
    }

    try {
      await addDoc(collection(db, "confessions"), {
        text: text.trim(),
        username: username.trim() || null,
        size: sz, category: category||null,
        burned, txHash: txHash||null,
        timestamp: serverTimestamp(),
        reactions: { candle:0, heavy:0, eye:0, fire:0, grave:0 },
      });
    } catch (e) {
      console.error("Firestore:", e);
      setToast("Could not save — check connection");
      setPhase("write"); return;
    }

    setPhase("done");
    setTimeout(onDone, 2700);
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
            {/* Eyebrow */}
            <div className="modal-eyebrow">
              <span className="m-ey-line" />
              <span className="m-ey-text">secrets are better shared</span>
              <span className="m-ey-line" />
            </div>

            {/* Username */}
            <div className="username-wrap">
              <span className="username-prefix">~</span>
              <input
                type="text"
                className="username-input"
                placeholder="anonymous handle (optional)"
                maxLength={24}
                value={username}
                onChange={e => setUsername(e.target.value.replace(/\s/g,""))}
              />
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
                  fontSize:sz==="whisper"?".88rem":sz==="scream"?"1.55rem":"1.1rem",
                  lineHeight:"1.85",color:"var(--amber)",
                }}>|</span>
              )}
            </div>

            {/* Intensity slider */}
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
                  <button key={c.key}
                    className={`cat-chip${category===c.key?" on":""}`}
                    type="button"
                    onClick={()=>setCategory(category===c.key?"":c.key)}>
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
                  <p className="burn-sub">0.01 SOL · permanently on Solana · immutable · no one can delete it</p>
                  {burn && (
                    <div className="burn-wallet" onClick={e=>e.stopPropagation()}>
                      {wallet
                        ? <span className="wallet-badge">✓ {shortAddr(wallet)}</span>
                        : <button className="connect-btn" type="button" onClick={connectWallet}>Connect Phantom →</button>
                      }
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="submit-row">
              <button className="release-btn" type="button" onClick={submit}
                disabled={text.trim().length<3}>
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
      const q = search.trim().toLowerCase();
      l = l.filter(c => c.username?.toLowerCase()===q || c.text?.toLowerCase().includes(q));
    }
    return l;
  }, [confessions, activeFilter, search]);

  const activeCat = CATEGORIES.find(c=>c.key===activeFilter);

  return (
    <div className="page">
      {/* Header */}
      <div className="wall-head">
        <div className="wall-h1">
          <span style={{fontSize:"1.25rem",animation:"candleWave 3.5s ease-in-out infinite",display:"inline-block"}}>🕯️</span>
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

      {/* Filters */}
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

      {/* Search */}
      <div className="search-wrap">
        <span className="search-icon">⌕</span>
        <input
          type="text"
          className="search-input"
          placeholder="search by username or keyword…"
          value={search}
          onChange={e=>setSearch(e.target.value)}
        />
      </div>

      {/* Confessions */}
      {loading ? (
        <p className="loading-t">reading the wall<span className="blink">_</span></p>
      ) : list.length===0 ? (
        <p className="empty-t">
          {search ? `No confessions found for "${search}"` : activeFilter ? "Nothing in this category yet." : "The wall is empty. Say something real."}
        </p>
      ) : (
        list.map((c,i) => (
          <Card key={c.id} data={c} delay={Math.min(i*0.033,0.5)} setParticles={setParticles} />
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
            <div key={e.id} className="chain-entry" style={{animationDelay:`${i*0.055}s`}}>
              {e.username && <div className="card-user" style={{marginBottom:8}}>{e.username}</div>}
              <p className={`chain-text ${sz}`}>{e.text}</p>
              <div className="chain-meta">
                <span className="chain-time">{timeAgo(e.timestamp)}</span>
                {e.txHash && (
                  <a href={`https://solscan.io/tx/${e.txHash}`}
                    target="_blank" rel="noopener noreferrer" className="chain-tx">
                    <span className="flicker">🔥</span>{shortAddr(e.txHash)} →
                  </a>
                )}
                {e.category && <span style={{fontSize:".72rem",opacity:.55}}>{CATEGORIES.find(c=>c.key===e.category)?.emoji}</span>}
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
        <div key={i} className={`lore-para fade-up`} style={{animationDelay:`${i*.12}s`}}>
          <p className={`lore-text ${p.primary?"primary":"body"}`}>{p.t}</p>
        </div>
      ))}
      <div className="lore-footer fade-up" style={{animationDelay:".7s"}}>
        <div className="lore-f-brand">
          <img src="/logo.png" alt="" style={{height:22,opacity:.65}} onError={e=>e.target.style.display="none"} />
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
      ref.current.loop = true;
      ref.current.volume = 0.14;
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
  const mousePos = useRef({ x: 0, y: 0 });

  useAmbient(sound);

  const openConfess = useCallback(()=>setModal(true),[]);
  const closeModal  = useCallback(()=>setModal(false),[]);
  const onDone      = useCallback(()=>{setModal(false);setPage("wall");},[]);

  const removeParticle = useCallback(id => {
    setParticles(ps => ps.filter(p => p.id !== id));
  }, []);

  return (
    <>
      <style>{CSS}</style>

      {/* Solana web3.js */}
      <script src="https://cdn.jsdelivr.net/npm/@solana/web3.js@latest/lib/index.iife.min.js" />

      {/* Living background canvas */}
      <LivingBackground mousePos={mousePos} />

      {/* Overlay layers */}
      <div id="grain" />
      <div id="vig"   />

      {/* Custom cursor */}
      <CustomCursor mousePos={mousePos} />

      {/* Floating emoji particles */}
      {particles.map(p => (
        <FloatParticle
          key={p.id} emoji={p.emoji} x={p.x} y={p.y}
          onDone={() => removeParticle(p.id)}
        />
      ))}

      {/* Main content */}
      <div id="app-layer">
        <Navbar page={page} setPage={setPage} soundOn={sound} toggleSound={()=>setSound(s=>!s)} />
        <div className="ca-bar"><CopyCA /></div>

        {page==="wall"  && <WallPage setParticles={setParticles} />}
        {page==="chain" && <ChainPage />}
        {page==="lore"  && <LorePage />}

        {/* Desktop FAB */}
        {!modal && (
          <button className="confess-fab" type="button" onClick={openConfess}>
            <span className="fab-flame">🕯️</span>CONFESS
          </button>
        )}

        {/* Mobile nav */}
        <MobileNav page={page} setPage={setPage} onConfess={openConfess} />
      </div>

      {/* Modal */}
      {modal && (
        <ConfessModal onClose={closeModal} onDone={onDone} setToast={setToast} />
      )}

      {/* Toast */}
      {toast && <Toast msg={toast} gone={()=>setToast(null)} />}
    </>
  );
}
