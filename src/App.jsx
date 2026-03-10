import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, addDoc, query, orderBy,
  limit, onSnapshot, updateDoc, doc, serverTimestamp, where
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB_gNokFnucM2nNAhhkRRnPsPNBAShYlMs",
  authDomain: "it-token.firebaseapp.com",
  projectId: "it-token",
  storageBucket: "it-token.firebasestorage.app",
  messagingSenderId: "804328953904",
  appId: "1:804328953904:web:e760545b579bf2527075f5"
};
const fbApp = initializeApp(firebaseConfig);
const db    = getFirestore(fbApp);

const CA       = "CFNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const BURN_SOL = 0.01;
const RPC      = "https://api.mainnet-beta.solana.com";
const MEMO     = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

const REACTIONS = [
  { key:"candle", emoji:"🕯️", label:"I've felt this" },
  { key:"heavy",  emoji:"🪨", label:"heavy"           },
  { key:"eye",    emoji:"👁️", label:"I see you"       },
  { key:"fire",   emoji:"🔥", label:"burn it"         },
  { key:"grave",  emoji:"💀", label:"to the grave"    },
];
const CATEGORIES = [
  { key:"crypto",  emoji:"💸", label:"Money & Crypto"              },
  { key:"love",    emoji:"❤️",  label:"Love & Betrayal"             },
  { key:"family",  emoji:"👨‍👩‍👧", label:"Family"                      },
  { key:"self",    emoji:"🪞", label:"Things I did to myself"      },
  { key:"online",  emoji:"🌐", label:"Things I did online"         },
  { key:"unsaid",  emoji:"☠️", label:"Things I'd never say aloud"  },
  { key:"good",    emoji:"✨", label:"Good things I'm ashamed of"  },
];
const SOCIAL = {
  x:         "https://x.com/confessioncoin",
  community: "https://x.com/i/communities/confessioncoin",
  github:    "https://github.com/confessioncoin/confessioncoin",
};

const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const timeAgo  = ts => {
  if (!ts?.toMillis) return "just now";
  const s = Math.floor((Date.now()-ts.toMillis())/1000);
  if (s<5)      return "just now";
  if (s<60)     return `${s}s ago`;
  if (s<3600)   return `${Math.floor(s/60)}m ago`;
  if (s<86400)  return `${Math.floor(s/3600)}h ago`;
  if (s<604800) return `${Math.floor(s/86400)}d ago`;
  return new Date(ts.toMillis()).toLocaleDateString("en-US",{month:"short",day:"numeric"});
};
const shortAddr = a => (!a||a.length<10)?a||"":a.slice(0,5)+"…"+a.slice(-4);
const sizeKey   = v => v<30?"whisper":v<70?"normal":"scream";
const getRx = () => { try { return JSON.parse(localStorage.getItem("cfn_rx")||"{}"); } catch { return {}; } };
const setRx = o  => { try { localStorage.setItem("cfn_rx",JSON.stringify(o)); } catch {} };

/* ─────────────────────────────────────────────────
   GLOBAL CSS
───────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=Crimson+Pro:ital,wght@0,300;0,400;1,300;1,400&family=IBM+Plex+Mono:wght@300;400&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  --ink:     #05050a;
  --deep:    #090910;
  --well:    #0d0d16;
  --surface: #11111c;
  --lift:    #171724;
  --border:  #1e1e2e;
  --border2: #28283c;
  --muted:   #353550;
  --dim:     #555578;
  --soft:    #8888aa;
  --pale:    #c8c8e0;
  --paper:   #ede8da;
  --warm:    #f5f0e4;
  --ember:   #e8973a;
  --ember2:  #c8792a;
  --emberlo: #6a4010;
  --emberhi: #f5b050;
  --gold:    #d4a840;
  --serif:   'Cormorant Garamond',Georgia,serif;
  --prose:   'Crimson Pro',Georgia,serif;
  --mono:    'IBM Plex Mono','Courier New',monospace;
  --ease:    cubic-bezier(0.16,1,0.3,1);
  --easein:  cubic-bezier(0.4,0,1,1);
}

html{font-size:16px;scroll-behavior:smooth}
@media(max-width:640px){html{font-size:17px}}

body{
  background:var(--ink);
  color:var(--paper);
  font-family:var(--serif);
  min-height:100vh;
  overflow-x:hidden;
  -webkit-font-smoothing:antialiased;
  cursor:none;
}
@media(max-width:640px){body{cursor:auto}}

::selection{background:var(--ember2);color:var(--ink)}
::-webkit-scrollbar{width:2px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border2)}

button{font-family:inherit;color:inherit;border:none;background:none;padding:0;cursor:pointer}
a{color:inherit;text-decoration:none;cursor:pointer}
textarea,input{font-family:inherit}
textarea:focus,input:focus{outline:none}

/* ── CUSTOM CURSOR — single ember dot ── */
#cfn-cursor{
  position:fixed;z-index:99999;pointer-events:none;
  width:7px;height:7px;border-radius:50%;
  background:var(--ember);
  transform:translate(-50%,-50%);
  transition:width .25s var(--ease),height .25s var(--ease),background .25s,opacity .3s;
  mix-blend-mode:screen;
  will-change:left,top;
  box-shadow:0 0 8px 2px rgba(232,151,58,0.55);
}
body.cur-hover #cfn-cursor{width:14px;height:14px;background:var(--emberhi);box-shadow:0 0 16px 4px rgba(245,176,80,0.55)}
body.cur-click #cfn-cursor{width:4px;height:4px;opacity:.6}
@media(max-width:640px){#cfn-cursor{display:none}}

/* ── LIVING CANVAS ── */
#bg-canvas{position:fixed;inset:0;z-index:0;pointer-events:none;display:block}

/* ── GRAIN ── */
.grain{
  position:fixed;inset:0;z-index:9990;pointer-events:none;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
  opacity:.7;mix-blend-mode:overlay;
}

/* ── VIGNETTE ── */
.vig{
  position:fixed;inset:0;z-index:9989;pointer-events:none;
  background:radial-gradient(ellipse 100% 100% at 50% 50%,transparent 20%,rgba(5,5,10,.85) 100%);
}

#app-root{position:relative;z-index:10}

/* ── KEYFRAMES ── */
@keyframes breathe{0%,100%{opacity:.7;transform:scale(1)}50%{opacity:1;transform:scale(1.004)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
@keyframes confIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes modalRise{from{opacity:0;transform:translateY(30px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.18}}
@keyframes candleFlame{
  0%,100%{transform:scaleY(1) scaleX(1) translateX(0);filter:blur(0px)}
  25%{transform:scaleY(1.09) scaleX(.91) translateX(-1px);filter:blur(.3px)}
  60%{transform:scaleY(.94) scaleX(1.07) translateX(1px);filter:blur(.2px)}
}
@keyframes ripple{0%{transform:scale(0);opacity:.5}100%{transform:scale(4);opacity:0}}
@keyframes floatUp{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-70px) scale(1.4)}}
@keyframes shimmerIn{from{opacity:0;transform:scaleX(0)}to{opacity:1;transform:scaleX(1)}}
@keyframes orbPulse{0%,100%{opacity:.55;transform:scale(1)}50%{opacity:.85;transform:scale(1.08)}}

.fade-up{animation:fadeUp .8s var(--ease) both}
.fade-in{animation:fadeIn .5s var(--ease) both}
.blink{animation:blink 1.1s step-end infinite}

/* ── LAYOUT ── */
.page{max-width:800px;margin:0 auto;padding:108px 32px 200px;position:relative}
@media(max-width:640px){.page{padding:94px 18px 140px}}

/* ══════════════════
   NAV
══════════════════ */
.nav{
  position:fixed;top:0;left:0;right:0;z-index:800;
  display:flex;align-items:center;justify-content:space-between;
  height:58px;padding:0 28px;
  background:rgba(5,5,10,.88);
  backdrop-filter:blur(28px) saturate(1.8);
  -webkit-backdrop-filter:blur(28px) saturate(1.8);
  border-bottom:1px solid rgba(30,30,46,.9);
}
@media(max-width:640px){.nav{padding:0 16px;height:54px}}

.nav-brand{display:flex;align-items:center;gap:10px}
.nav-brand img{height:22px;object-fit:contain;opacity:.92}
.nav-brand-name{
  font-family:var(--serif);font-style:italic;font-weight:600;
  font-size:.96rem;letter-spacing:.2em;color:var(--warm);
}

.nav-center{
  position:absolute;left:50%;transform:translateX(-50%);
  display:flex;align-items:center;gap:2px;
}
@media(max-width:640px){.nav-center{display:none}}

.nav-lk{
  font-family:var(--mono);font-size:.56rem;letter-spacing:.1em;
  color:var(--dim);padding:5px 11px;border-radius:3px;
  transition:color .2s,background .2s;white-space:nowrap;
}
.nav-lk:hover{color:var(--soft);background:rgba(255,255,255,.03)}
.nav-lk.on{color:var(--warm);background:rgba(255,255,255,.04)}
.nav-lk.chain-on{color:var(--ember)}

.nav-right{display:flex;align-items:center;gap:6px}
.nav-ico{
  width:30px;height:30px;display:flex;align-items:center;justify-content:center;
  color:var(--dim);border-radius:3px;transition:color .2s,background .2s;
}
.nav-ico:hover{color:var(--soft);background:rgba(255,255,255,.03)}
.nav-sep{width:1px;height:12px;background:var(--border2);margin:0 2px;flex-shrink:0}

/* ── CONFESS BTN in nav (desktop) ── */
.nav-confess{
  display:flex;align-items:center;gap:7px;
  font-family:var(--serif);font-style:italic;font-weight:500;
  font-size:.84rem;letter-spacing:.14em;
  color:var(--ember);
  padding:6px 16px;
  border:1px solid var(--emberlo);
  border-radius:100px;
  background:rgba(232,151,58,.04);
  transition:all .25s var(--ease);
}
.nav-confess:hover{
  color:var(--ink);background:var(--ember);
  border-color:var(--ember);
  box-shadow:0 0 24px rgba(232,151,58,.35);
}
@media(max-width:640px){.nav-confess{display:none}}

/* ══════════════════
   HERO — wall intro
══════════════════ */
.hero{
  padding:56px 0 48px;
  border-bottom:1px solid var(--border);
  margin-bottom:48px;
  position:relative;
}
.hero::after{
  content:'';
  position:absolute;bottom:0;left:0;right:0;height:1px;
  background:linear-gradient(to right,transparent,var(--emberlo),transparent);
}
.hero-eyebrow{
  font-family:var(--mono);font-size:.55rem;letter-spacing:.22em;
  color:var(--dim);margin-bottom:20px;
  display:flex;align-items:center;gap:10px;
}
.hero-eyebrow::before{
  content:'';display:inline-block;width:28px;height:1px;
  background:linear-gradient(to right,transparent,var(--emberlo));
}
.hero-title{
  font-family:var(--serif);font-style:italic;font-weight:300;
  font-size:clamp(2.2rem,6vw,3.4rem);
  color:var(--warm);
  letter-spacing:.01em;line-height:1.18;
  margin-bottom:18px;
}
@media(max-width:640px){.hero-title{font-size:2rem;line-height:1.22}}
.hero-sub{
  font-family:var(--prose);font-weight:300;font-style:italic;
  font-size:clamp(.94rem,2.2vw,1.08rem);
  color:var(--dim);line-height:1.85;
  max-width:460px;
}
.hero-meta{
  display:flex;align-items:center;gap:14px;margin-top:28px;flex-wrap:wrap;
}
.hero-count{
  display:flex;align-items:center;gap:6px;
  font-family:var(--mono);font-size:.56rem;
  color:var(--dim);letter-spacing:.1em;
}
.live-dot{
  display:inline-block;width:5px;height:5px;border-radius:50%;
  background:var(--ember);
  animation:pulse 2.2s ease-in-out infinite;
  box-shadow:0 0 6px rgba(232,151,58,.6);
}

/* CA — integrated elegantly into hero */
.ca-block{
  display:inline-flex;align-items:center;gap:8px;
  padding:5px 14px 5px 10px;
  border:1px solid var(--border2);border-radius:100px;
  background:var(--well);
  cursor:pointer;transition:border-color .22s,background .22s;
  position:relative;overflow:hidden;
}
.ca-block::before{
  content:'';position:absolute;inset:0;
  background:linear-gradient(120deg,transparent 40%,rgba(232,151,58,.06) 100%);
  opacity:0;transition:opacity .3s;
}
.ca-block:hover{border-color:var(--emberlo)}
.ca-block:hover::before{opacity:1}
.ca-block.copied{border-color:var(--ember2);background:rgba(232,151,58,.05)}
.ca-tick{font-family:var(--mono);font-size:.56rem;font-weight:400;color:var(--ember);letter-spacing:.07em}
.ca-divider{width:1px;height:10px;background:var(--border2)}
.ca-addr{font-family:var(--mono);font-size:.54rem;color:var(--dim);letter-spacing:.04em;white-space:nowrap;max-width:160px;overflow:hidden;text-overflow:ellipsis}
@media(max-width:400px){.ca-addr{max-width:88px}}
.ca-copy{font-family:var(--mono);font-size:.54rem;color:var(--muted);transition:color .2s}
.ca-block.copied .ca-copy,.ca-block.copied .ca-addr{color:var(--ember)}

/* ══════════════════
   FILTER & SEARCH
══════════════════ */
.controls{display:flex;align-items:center;gap:8px;margin-bottom:24px;flex-wrap:wrap}
.ctrl-btn{
  font-family:var(--mono);font-size:.55rem;letter-spacing:.08em;
  color:var(--dim);padding:5px 12px;
  border:1px solid var(--border);border-radius:100px;
  transition:all .18s;white-space:nowrap;
}
.ctrl-btn:hover{color:var(--soft);border-color:var(--border2)}
.ctrl-btn.on{color:var(--ember);border-color:var(--emberlo);background:rgba(232,151,58,.04)}

.fstrip{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:22px;animation:slideDown .22s var(--ease)}
.fchip{
  font-family:var(--mono);font-size:.54rem;letter-spacing:.06em;
  color:var(--dim);padding:4px 11px;
  border:1px solid var(--border);border-radius:100px;
  transition:all .16s;white-space:nowrap;
}
.fchip:hover{color:var(--soft);border-color:var(--border2)}
.fchip.on{color:var(--ember);border-color:var(--emberlo);background:rgba(232,151,58,.04)}

.search-wrap{position:relative;margin-bottom:32px}
.search-input{
  width:100%;background:transparent;border:none;
  border-bottom:1px solid var(--border);
  padding:9px 0 11px 26px;
  font-family:var(--mono);font-size:.63rem;
  color:var(--paper);letter-spacing:.05em;
  transition:border-color .25s;caret-color:var(--ember);
}
@media(max-width:640px){.search-input{font-size:.7rem}}
.search-input:focus{border-color:var(--border2)}
.search-input::placeholder{color:var(--muted)}
.search-icon{position:absolute;left:0;top:50%;transform:translateY(-50%);font-size:.7rem;color:var(--muted)}

/* ══════════════════════════════════════════════════
   CONFESSION CARDS — like torn journal pages
══════════════════════════════════════════════════ */
.card{
  position:relative;
  padding:32px 0 28px;
  border-bottom:1px solid var(--border);
  overflow:hidden;
  transition:border-color .4s;
  animation:confIn .7s var(--ease) both;
}
.card:first-of-type{border-top:1px solid var(--border)}

/* Paper texture background that appears on hover */
.card-bg{
  position:absolute;inset:0;
  background:linear-gradient(135deg,rgba(232,151,58,.018) 0%,transparent 60%);
  opacity:0;transition:opacity .5s var(--ease);pointer-events:none;
  border-radius:2px;
}
.card:hover .card-bg{opacity:1}

/* Left flame accent */
.card-flame{
  position:absolute;left:0;top:0;bottom:0;
  width:2px;
  background:linear-gradient(to bottom,transparent,var(--ember2),transparent);
  transform:scaleY(0);transform-origin:center;
  transition:transform .5s var(--ease);
  opacity:.7;
}
.card:hover .card-flame{transform:scaleY(1)}

/* Number watermark */
.card-num{
  position:absolute;right:0;top:24px;
  font-family:var(--mono);font-size:4.5rem;font-weight:300;
  color:rgba(232,151,58,.028);letter-spacing:-.02em;
  line-height:1;pointer-events:none;user-select:none;
  transition:color .5s;
}
.card:hover .card-num{color:rgba(232,151,58,.048)}

.card-header{display:flex;align-items:baseline;gap:10px;margin-bottom:10px}
.card-user{
  font-family:var(--mono);font-size:.56rem;letter-spacing:.06em;
  color:var(--ember2);
}
@media(max-width:640px){.card-user{font-size:.62rem}}
.card-user::before{content:'~ ';color:var(--muted)}
.card-cat{font-size:.72rem;opacity:.5}

/* TEXT variants */
.card-text{
  font-family:var(--prose);font-style:italic;font-weight:300;
  line-height:1.88;color:var(--paper);
  position:relative;z-index:1;
  padding-left:0;
  transition:color .3s;
}
.card:hover .card-text{color:var(--warm)}

.card.whisper-card{opacity:.76;transition:opacity .3s,border-color .4s}
.card.whisper-card:hover{opacity:1}
.card.whisper-card .card-text{
  font-size:.92rem;color:var(--soft);
  font-family:var(--prose);letter-spacing:.015em;
}
@media(max-width:640px){.card.whisper-card .card-text{font-size:1rem}}

.card.normal-card .card-text{
  font-size:1.12rem;
}
@media(max-width:640px){.card.normal-card .card-text{font-size:1.18rem}}

.card.scream-card .card-text{
  font-size:clamp(1.35rem,3.5vw,1.75rem);
  font-family:var(--serif);
  font-weight:400;
  color:var(--warm);
  letter-spacing:.005em;
  line-height:1.62;
}
@media(max-width:640px){.card.scream-card .card-text{font-size:1.3rem}}

/* burned gets amber tint */
.card.burned-card .card-text{color:rgba(237,232,218,.95)}
.card.burned-card::after{
  content:'';
  position:absolute;left:0;right:0;top:0;height:1px;
  background:linear-gradient(to right,var(--emberlo),transparent 60%);
}

.card-foot{display:flex;align-items:center;gap:10px;margin-top:14px;flex-wrap:wrap}
.card-time{font-family:var(--mono);font-size:.54rem;color:var(--muted);letter-spacing:.05em}
@media(max-width:640px){.card-time{font-size:.6rem}}
.card-live{display:flex;align-items:center;gap:4px;font-family:var(--mono);font-size:.52rem;color:var(--ember);letter-spacing:.09em}

.chain-pill{
  display:inline-flex;align-items:center;gap:4px;
  font-family:var(--mono);font-size:.52rem;letter-spacing:.06em;
  color:var(--emberlo);padding:2px 8px;
  border:1px solid rgba(232,151,58,.15);border-radius:100px;
  transition:all .18s;
}
.chain-pill:hover{color:var(--ember);border-color:rgba(232,151,58,.4);background:rgba(232,151,58,.04)}

/* ── REACTIONS ── */
.react-bar{display:flex;gap:4px;margin-top:14px;flex-wrap:wrap}
.react-btn{
  display:inline-flex;align-items:center;gap:5px;
  padding:5px 10px;border-radius:100px;
  border:1px solid transparent;
  font-family:var(--mono);font-size:.55rem;
  color:var(--muted);
  transition:all .16s var(--ease);
  position:relative;overflow:hidden;white-space:nowrap;
}
@media(max-width:640px){.react-btn{padding:6px 12px;font-size:.6rem}}
.react-btn:hover{color:var(--soft);border-color:var(--border2);background:var(--well)}
.react-btn.on{color:var(--ember);border-color:rgba(232,151,58,.3);background:rgba(232,151,58,.05)}
.react-emoji{font-size:.8rem;line-height:1}
@media(max-width:640px){.react-emoji{font-size:.9rem}}
.react-ripple{
  position:absolute;border-radius:50%;pointer-events:none;
  background:rgba(232,151,58,.2);
  width:120%;padding-bottom:120%;left:-10%;top:50%;
  transform:translateY(-50%) scale(0);
  animation:ripple .45s ease-out forwards;
}

/* ── FLOAT PARTICLES ── */
.float-p{
  position:fixed;pointer-events:none;z-index:9995;
  font-size:1.1rem;
  animation:floatUp 1s ease-out forwards;
}

/* ══════════════════
   MOBILE BOTTOM NAV
══════════════════ */
.mob-nav{
  position:fixed;bottom:0;left:0;right:0;z-index:800;
  display:none;
  background:rgba(5,5,10,.96);
  backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);
  border-top:1px solid var(--border);
  padding-bottom:env(safe-area-inset-bottom);
}
@media(max-width:640px){.mob-nav{display:flex;align-items:stretch}}
.mob-item{
  flex:1;display:flex;flex-direction:column;align-items:center;
  gap:4px;padding:10px 0 8px;
  font-family:var(--mono);font-size:.5rem;letter-spacing:.07em;
  color:var(--muted);transition:color .18s;
}
.mob-item.on{color:var(--ember)}
.mob-confess-btn{
  flex:1;display:flex;flex-direction:column;align-items:center;
  gap:4px;padding:10px 0 8px;
  font-family:var(--serif);font-style:italic;font-size:.64rem;
  color:var(--ember);letter-spacing:.08em;transition:color .18s;
}
.mob-confess-icon{
  width:36px;height:36px;border-radius:50%;
  border:1px solid var(--emberlo);
  background:rgba(232,151,58,.06);
  display:flex;align-items:center;justify-content:center;
  font-size:1rem;
  transition:all .2s var(--ease);
  box-shadow:0 0 16px rgba(232,151,58,.2);
}
.mob-confess-btn:active .mob-confess-icon{
  transform:scale(.9);
  box-shadow:0 0 8px rgba(232,151,58,.15);
}

/* ══════════════════
   MODAL
══════════════════ */
.modal-overlay{
  position:fixed;inset:0;z-index:900;
  background:rgba(3,3,8,.97);
  backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
  overflow-y:auto;
  animation:fadeIn .28s var(--ease);
}
.modal-scroll{
  min-height:100%;display:flex;
  align-items:flex-start;justify-content:center;
  padding:68px 24px 56px;
}
@media(max-width:640px){.modal-scroll{padding:58px 14px 44px}}
.modal-inner{width:100%;max-width:640px;animation:modalRise .38s var(--ease)}

.modal-header{
  display:flex;align-items:center;gap:14px;
  margin-bottom:28px;
}
.modal-rule{flex:1;height:1px;background:var(--border)}
.modal-eyebrow{
  font-family:var(--mono);font-size:.54rem;
  color:var(--muted);letter-spacing:.16em;white-space:nowrap;
}

.uname-row{
  display:flex;align-items:center;gap:7px;
  margin-bottom:18px;padding-bottom:16px;
  border-bottom:1px solid var(--border);
}
.uname-prefix{font-family:var(--mono);font-size:.62rem;color:var(--emberlo);flex-shrink:0}
.uname-input{
  flex:1;background:transparent;border:none;
  font-family:var(--mono);font-size:.62rem;
  color:var(--ember);letter-spacing:.05em;caret-color:var(--ember);
}
@media(max-width:640px){.uname-input{font-size:.7rem}}
.uname-input::placeholder{color:var(--muted)}

.ta-wrap{position:relative;margin-bottom:4px}
.modal-ta{
  width:100%;background:transparent;border:none;
  border-bottom:1px solid var(--border);
  padding:0 0 20px;
  font-family:var(--prose);font-style:italic;font-weight:300;
  color:var(--warm);line-height:1.85;
  resize:none;min-height:140px;
  caret-color:var(--ember);
  transition:border-color .25s;display:block;
}
.modal-ta:focus{border-color:var(--border2)}
.modal-ta.whisper{font-size:.96rem}
.modal-ta.normal {font-size:1.12rem}
.modal-ta.scream {font-size:1.55rem;font-family:var(--serif)}
@media(max-width:640px){
  .modal-ta.whisper{font-size:1.05rem}
  .modal-ta.normal{font-size:1.15rem}
  .modal-ta.scream{font-size:1.3rem}
}
.ta-cursor{
  position:absolute;top:0;left:0;
  pointer-events:none;line-height:1.85;
  font-family:var(--prose);font-style:italic;
  color:var(--ember);
}

.modal-sec{margin-top:24px}
.sec-label{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px}
.sec-t{font-family:var(--mono);font-size:.54rem;color:var(--muted);letter-spacing:.12em}
.sec-v{font-family:var(--mono);font-size:.54rem;color:var(--ember);letter-spacing:.1em}

.range-track{position:relative;margin-bottom:6px}
.slider{
  -webkit-appearance:none;appearance:none;
  width:100%;height:1px;
  background:linear-gradient(to right,var(--ember) var(--pct,50%),var(--border2) var(--pct,50%));
  border-radius:1px;cursor:pointer;display:block;
}
.slider::-webkit-slider-thumb{
  -webkit-appearance:none;
  width:12px;height:12px;border-radius:50%;
  background:var(--ember);
  box-shadow:0 0 8px rgba(232,151,58,.5);
  transition:transform .18s;cursor:pointer;
}
.slider::-webkit-slider-thumb:hover{transform:scale(1.4)}
.slider-ends{display:flex;justify-content:space-between;margin-top:6px}
.slider-end{font-family:var(--mono);font-size:.52rem;color:var(--border2);letter-spacing:.07em}

.cats{display:flex;flex-wrap:wrap;gap:6px}
.cat-btn{
  font-family:var(--mono);font-size:.54rem;letter-spacing:.05em;
  color:var(--dim);padding:5px 10px;
  border:1px solid var(--border);border-radius:3px;
  transition:all .15s;white-space:nowrap;
}
@media(max-width:640px){.cat-btn{font-size:.6rem;padding:6px 12px}}
.cat-btn:hover{color:var(--soft);border-color:var(--border2)}
.cat-btn.on{color:var(--ember);border-color:var(--emberlo);background:rgba(232,151,58,.04)}

/* Burn box */
.burn-box{
  margin-top:22px;padding:17px 18px;
  border:1px solid var(--border);border-radius:6px;
  transition:border-color .3s,background .3s;cursor:pointer;
}
.burn-box:hover{border-color:var(--border2)}
.burn-box.on{
  border-color:rgba(232,151,58,.35);
  background:linear-gradient(135deg,rgba(232,151,58,.025),transparent);
}
.burn-row{display:flex;align-items:flex-start;gap:13px}
.burn-cb{width:14px;height:14px;accent-color:var(--ember);margin-top:3px;flex-shrink:0;cursor:pointer}
.burn-title{font-family:var(--serif);font-style:italic;font-size:.98rem;color:var(--paper);line-height:1.4;margin-bottom:4px}
.burn-sub{font-family:var(--mono);font-size:.54rem;color:var(--muted);line-height:1.7;letter-spacing:.025em}
@media(max-width:640px){.burn-sub{font-size:.6rem}}
.wallet-row{margin-top:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.wallet-badge{
  display:inline-flex;align-items:center;gap:5px;
  font-family:var(--mono);font-size:.54rem;color:var(--ember);
  padding:3px 10px;border:1px solid rgba(232,151,58,.25);
  border-radius:100px;background:rgba(232,151,58,.04);
}
.wallet-dot{width:5px;height:5px;border-radius:50%;background:var(--ember);display:inline-block;box-shadow:0 0 5px var(--ember)}
.connect-btn{
  font-family:var(--mono);font-size:.54rem;color:var(--ember);
  letter-spacing:.07em;padding:4px 12px;
  border:1px solid rgba(232,151,58,.35);border-radius:3px;
  transition:background .18s;background:transparent;
}
.connect-btn:hover{background:rgba(232,151,58,.06)}
.wallet-err{
  margin-top:6px;width:100%;
  font-family:var(--mono);font-size:.53rem;color:#d07070;
  letter-spacing:.03em;line-height:1.6;
}

.submit-row{
  display:flex;align-items:center;justify-content:space-between;
  margin-top:30px;gap:12px;flex-wrap:wrap;
}
.release-btn{
  font-family:var(--serif);font-style:italic;font-weight:400;
  font-size:1.08rem;letter-spacing:.1em;
  color:var(--paper);padding:10px 34px;
  border:1px solid var(--border2);border-radius:3px;
  background:var(--surface);
  transition:all .3s var(--ease);
}
@media(max-width:640px){.release-btn{font-size:1.1rem;padding:12px 36px}}
.release-btn:hover:not(:disabled){
  background:var(--ember);border-color:var(--ember);color:var(--ink);
  transform:translateY(-1px);box-shadow:0 8px 28px rgba(232,151,58,.35);
}
.release-btn:disabled{opacity:.22;cursor:not-allowed}
.char-cnt{font-family:var(--mono);font-size:.54rem;color:var(--muted)}
.modal-hint{margin-top:18px;font-family:var(--mono);font-size:.51rem;color:var(--border2);letter-spacing:.07em;line-height:1.8;font-style:italic}

.modal-close{
  position:fixed;top:15px;right:18px;z-index:910;
  width:32px;height:32px;display:flex;align-items:center;justify-content:center;
  font-family:var(--mono);font-size:.65rem;color:var(--dim);
  border:1px solid var(--border);border-radius:50%;
  background:var(--surface);transition:all .18s;
}
.modal-close:hover{color:var(--paper);border-color:var(--border2)}

/* ── FULL SCREENS ── */
.full-screen{
  position:fixed;inset:0;z-index:960;
  background:var(--ink);
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  gap:18px;animation:fadeIn .35s ease;
}
.fs-flame{font-size:3rem;animation:candleFlame .5s ease-in-out infinite}
.fs-label{font-family:var(--mono);font-size:.64rem;color:var(--ember);letter-spacing:.22em;animation:pulse 1.6s ease infinite}
.fs-note{font-family:var(--mono);font-size:.55rem;color:var(--muted);text-align:center;max-width:230px;line-height:1.85;letter-spacing:.04em}
.done-1{font-family:var(--serif);font-style:italic;font-size:clamp(1.6rem,5vw,2.2rem);color:var(--paper);animation:fadeUp .7s .1s var(--ease) both}
.done-2{font-family:var(--prose);font-style:italic;font-size:clamp(.9rem,2.5vw,1.05rem);color:var(--dim);animation:fadeUp .7s .4s var(--ease) both}

/* ── CHAIN PAGE ── */
.chain-intro{margin-bottom:52px}
.chain-h1{font-family:var(--serif);font-style:italic;font-weight:300;font-size:clamp(1.6rem,5vw,2.3rem);color:var(--warm);margin-bottom:14px;letter-spacing:.02em}
.chain-desc{font-family:var(--prose);font-weight:300;font-style:italic;font-size:clamp(.92rem,2vw,1.04rem);color:var(--dim);line-height:2;max-width:420px}
@media(max-width:640px){.chain-desc{font-size:1rem}}
.chain-rule{width:36px;height:1px;background:linear-gradient(to right,var(--emberlo),transparent);margin-top:20px}
.chain-entry{padding:30px 0;border-bottom:1px solid rgba(232,151,58,.06);animation:confIn .65s var(--ease) both}
.chain-entry:first-child{border-top:1px solid rgba(232,151,58,.06)}
.chain-text{font-family:var(--prose);font-style:italic;font-weight:300;line-height:1.88;color:var(--paper);opacity:.88}
@media(max-width:640px){.chain-text{font-size:1.05rem !important}}
.chain-meta{display:flex;align-items:center;gap:10px;margin-top:11px;flex-wrap:wrap}
.chain-time{font-family:var(--mono);font-size:.54rem;color:var(--muted);letter-spacing:.05em}
.chain-tx{
  display:inline-flex;align-items:center;gap:4px;
  font-family:var(--mono);font-size:.52rem;
  color:var(--emberlo);padding:2px 8px;
  border:1px solid rgba(232,151,58,.13);border-radius:100px;
  transition:all .18s;letter-spacing:.05em;
}
.chain-tx:hover{color:var(--ember);border-color:rgba(232,151,58,.38);background:rgba(232,151,58,.04)}
.chain-empty{padding:80px 0;text-align:center}
.chain-e-t{font-family:var(--serif);font-style:italic;font-size:1.15rem;color:var(--muted);margin-bottom:8px}
.chain-e-s{font-family:var(--mono);font-size:.57rem;color:var(--border2);letter-spacing:.09em}

/* ── LORE PAGE ── */
.lore-h1{font-family:var(--serif);font-style:italic;font-weight:300;font-size:clamp(1.5rem,4.5vw,2.1rem);color:var(--warm);margin-bottom:52px;letter-spacing:.03em}
.lore-block{padding:30px 0;border-top:1px solid var(--border)}
.lore-block:first-of-type{border-top:none;padding-top:0}
.lore-p{font-family:var(--prose);font-weight:300;line-height:2}
.lore-p.primary{font-size:clamp(1rem,2.5vw,1.12rem);font-style:italic;color:var(--paper)}
.lore-p.body{font-size:clamp(.9rem,2vw,.98rem);color:rgba(237,232,218,.6)}
@media(max-width:640px){.lore-p.primary{font-size:1.1rem}.lore-p.body{font-size:.98rem}}
.lore-foot{margin-top:60px;padding:26px;border:1px solid var(--border);border-radius:6px;background:var(--well)}
.lore-brand{display:flex;align-items:center;gap:9px;margin-bottom:14px}
.lore-brand-name{font-family:var(--mono);font-size:.6rem;color:var(--dim);letter-spacing:.09em}
.lore-links{display:flex;gap:18px;margin-top:14px;flex-wrap:wrap}
.lore-link{font-family:var(--mono);font-size:.57rem;color:var(--muted);letter-spacing:.08em;transition:color .18s}
.lore-link:hover{color:var(--ember)}

/* ── UTIL ── */
.loading-t{font-family:var(--mono);font-size:.6rem;color:var(--muted);letter-spacing:.12em;padding:48px 0}
.empty-t{font-family:var(--prose);font-style:italic;font-size:1rem;color:var(--muted);padding:60px 0;line-height:1.9}
.toast{
  position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:9999;
  padding:10px 20px;background:var(--surface);
  border:1px solid var(--border2);border-radius:3px;
  font-family:var(--mono);font-size:.6rem;color:var(--soft);
  letter-spacing:.04em;white-space:nowrap;
  animation:fadeUp .28s var(--ease);
}
@media(max-width:640px){.toast{max-width:88vw;white-space:normal;text-align:center;bottom:90px;font-size:.64rem}}
`;

/* ─────────────────────────────────────────────────
   LIVING BACKGROUND CANVAS
   Warm candlelight breathing — embers drifting up,
   slow orbiting glow nodes, heat shimmer.
───────────────────────────────────────────────── */
function LivingCanvas({ mouseRef }) {
  const ref  = useRef(null);
  const raf  = useRef(null);
  const t    = useRef(0);
  const embs = useRef([]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Spawn ember particles
    for (let i = 0; i < 48; i++) {
      embs.current.push({
        x:   Math.random() * window.innerWidth,
        y:   Math.random() * window.innerHeight,
        vx:  (Math.random() - .5) * .14,
        vy:  -(Math.random() * .22 + .06),
        r:   Math.random() * 1.2 + .3,
        op:  Math.random() * .5 + .1,
        life: Math.random(),
        dec: Math.random() * .0009 + .0002,
        hue: 25 + Math.random() * 22, // warm orange-gold
      });
    }

    // Slow glow orbs
    const orbs = [
      { cx:.18, cy:.22, r:260, speed:.55, phase:0    },
      { cx:.82, cy:.18, r:200, speed:.82, phase:1.8  },
      { cx:.5,  cy:.65, r:320, speed:.42, phase:3.1  },
      { cx:.08, cy:.78, r:180, speed:1.0, phase:5.2  },
      { cx:.92, cy:.72, r:220, speed:.68, phase:2.4  },
    ];

    const draw = () => {
      t.current += .006;
      const T  = t.current;
      const W  = canvas.width;
      const H  = canvas.height;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      ctx.clearRect(0,0,W,H);

      // Deep base
      ctx.fillStyle = "#05050a";
      ctx.fillRect(0,0,W,H);

      // Breathing orbs — slow, warm, ambient
      orbs.forEach(o => {
        const beat  = Math.sin(T * o.speed + o.phase) * .5 + .5;
        const alpha = .032 + beat * .028;
        const rad   = o.r * (.9 + beat * .12);
        const gx    = o.cx * W;
        const gy    = o.cy * H;

        const g = ctx.createRadialGradient(gx,gy,0,gx,gy,rad);
        g.addColorStop(0,   `hsla(${28+beat*12},80%,48%,${alpha})`);
        g.addColorStop(.45, `hsla(${22},65%,35%,${alpha*.45})`);
        g.addColorStop(1,   "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(0,0,W,H);
      });

      // Mouse warm proximity glow
      if (mx > 0 && my > 0) {
        const mg = ctx.createRadialGradient(mx,my,0,mx,my,300);
        mg.addColorStop(0,   "rgba(232,151,58,.052)");
        mg.addColorStop(.5,  "rgba(200,120,40,.018)");
        mg.addColorStop(1,   "transparent");
        ctx.fillStyle = mg;
        ctx.fillRect(0,0,W,H);

        // Tight inner glow
        const ic = ctx.createRadialGradient(mx,my,0,mx,my,90);
        ic.addColorStop(0,  "rgba(245,176,80,.065)");
        ic.addColorStop(1,  "transparent");
        ctx.fillStyle = ic;
        ctx.fillRect(0,0,W,H);
      }

      // Ember particles
      embs.current.forEach((e,i) => {
        // Gentle mouse magnetism
        if (mx > 0 && my > 0) {
          const dx = mx - e.x, dy = my - e.y;
          const d  = Math.sqrt(dx*dx+dy*dy);
          if (d < 180) { e.vx += (dx/d)*.003; e.vy += (dy/d)*.0015; }
        }

        // Flicker drift
        e.x  += e.vx + Math.sin(T*1.1+i*.7)*.07;
        e.y  += e.vy + Math.cos(T*.9+i*.5)*.04;
        e.life -= e.dec;

        if (e.life <= 0 || e.y < -12 || e.x < -20 || e.x > W+20) {
          e.x    = Math.random()*W;
          e.y    = H + 10;
          e.vx   = (Math.random()-.5)*.14;
          e.vy   = -(Math.random()*.22+.06);
          e.life = 1;
        }

        const fade = Math.sin(e.life*Math.PI);
        const glow = ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,e.r*2.5);
        glow.addColorStop(0,   `hsla(${e.hue},90%,62%,${fade*e.op})`);
        glow.addColorStop(1,   "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(e.x,e.y,e.r*2.5,0,Math.PI*2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(e.x,e.y,e.r,0,Math.PI*2);
        ctx.fillStyle = `hsla(${e.hue},95%,72%,${fade*(e.op*1.4)})`;
        ctx.fill();
      });

      // Subtle horizontal light sweep
      const sweep  = ((T*22) % H);
      const sweepG = ctx.createLinearGradient(0,sweep-3,0,sweep+3);
      sweepG.addColorStop(0,   "transparent");
      sweepG.addColorStop(.5,  "rgba(200,140,50,.012)");
      sweepG.addColorStop(1,   "transparent");
      ctx.fillStyle = sweepG;
      ctx.fillRect(0,sweep-3,W,6);

      raf.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} id="bg-canvas" />;
}

/* ─────────────────────────────────────────────────
   CURSOR — single ember
───────────────────────────────────────────────── */
function Cursor({ mouseRef }) {
  const el = useRef(null);

  useEffect(() => {
    if (isMobile()) return;

    const move = e => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      if (el.current) {
        el.current.style.left = e.clientX + "px";
        el.current.style.top  = e.clientY + "px";
      }
    };
    const down = () => document.body.classList.add("cur-click");
    const up   = () => document.body.classList.remove("cur-click");

    const onEnter = () => document.body.classList.add("cur-hover");
    const onLeave = () => document.body.classList.remove("cur-hover");

    document.addEventListener("mousemove", move);
    document.addEventListener("mousedown", down);
    document.addEventListener("mouseup",   up);

    const obs = new MutationObserver(() => {
      document.querySelectorAll("button:not([data-c]),a:not([data-c]),[role=button]:not([data-c])").forEach(el => {
        el.setAttribute("data-c","1");
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
      });
    });
    obs.observe(document.body, { childList:true, subtree:true });

    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mousedown", down);
      document.removeEventListener("mouseup",   up);
      obs.disconnect();
    };
  }, []);

  return <div id="cfn-cursor" ref={el} />;
}

/* ─────────────────────────────────────────────────
   SOLANA WALLET HOOK
───────────────────────────────────────────────── */
function useWallet() {
  const [pubkey,      setPubkey]      = useState(null);
  const [connecting,  setConnecting]  = useState(false);
  const [walletError, setWalletError] = useState(null);

  useEffect(() => {
    const p = window?.phantom?.solana || window?.solana;
    if (p?.isPhantom && p.isConnected && p.publicKey) setPubkey(p.publicKey.toString());
    if (p?.on) {
      const onDisc = ()   => setPubkey(null);
      const onConn = (pk) => setPubkey(pk.toString());
      p.on("disconnect", onDisc);
      p.on("connect",    onConn);
      return () => { p.off?.("disconnect",onDisc); p.off?.("connect",onConn); };
    }
  }, []);

  const connect = useCallback(async () => {
    setWalletError(null);
    setConnecting(true);
    try {
      const p = window?.phantom?.solana || window?.solana;
      if (!p?.isPhantom) {
        if (isMobile()) {
          const u = encodeURIComponent(window.location.href);
          window.location.href = `https://phantom.app/ul/v1/connect?app_url=${u}&redirect_link=${u}&cluster=mainnet-beta`;
          setConnecting(false);
          return null;
        }
        setWalletError("Phantom not found. Install at phantom.app");
        setConnecting(false);
        return null;
      }
      const r    = await p.connect();
      const addr = r.publicKey.toString();
      setPubkey(addr);
      setConnecting(false);
      return addr;
    } catch(e) {
      const m = e?.message||"";
      setWalletError(m.includes("rejected")||m.includes("User rejected") ? "Cancelled." : "Connection failed. Try again.");
      setConnecting(false);
      return null;
    }
  }, []);

  return { pubkey, connecting, walletError, connect, setWalletError };
}

/* ─────────────────────────────────────────────────
   BURN TO CHAIN
───────────────────────────────────────────────── */
async function burnToChain({ pubkey, text, username }) {
  const {
    Connection, PublicKey, Transaction,
    SystemProgram, LAMPORTS_PER_SOL, TransactionInstruction,
  } = await import("@solana/web3.js");

  const provider = window?.phantom?.solana || window?.solana;
  if (!provider?.isPhantom) throw new Error("Phantom not available");
  if (!provider.publicKey)  throw new Error("Wallet not connected");

  const conn = new Connection(RPC, "confirmed");
  const pk   = new PublicKey(pubkey);

  const bal    = await conn.getBalance(pk);
  const needed = Math.round(BURN_SOL * LAMPORTS_PER_SOL) + 12000;
  if (bal < needed) {
    const short = ((needed-bal)/LAMPORTS_PER_SOL).toFixed(4);
    throw new Error(`insufficient_balance:${short}`);
  }

  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");
  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: pk });

  const payload = JSON.stringify({
    app:"confessioncoin.xyz", v:2,
    text: text.trim().slice(0,400),
    user: username?.trim()||null,
  });
  tx.add(new TransactionInstruction({
    keys:      [{ pubkey:pk, isSigner:true, isWritable:false }],
    programId: new PublicKey(MEMO),
    data:      Buffer.from(payload,"utf-8"),
  }));
  tx.add(SystemProgram.transfer({ fromPubkey:pk, toPubkey:pk, lamports:Math.round(BURN_SOL*LAMPORTS_PER_SOL) }));

  const signed = await provider.signTransaction(tx);
  const sig    = await conn.sendRawTransaction(signed.serialize(), { skipPreflight:false, preflightCommitment:"confirmed" });
  await conn.confirmTransaction({ signature:sig, blockhash, lastValidBlockHeight }, "confirmed");
  return sig;
}

/* ─────────────────────────────────────────────────
   COMPONENTS
───────────────────────────────────────────────── */
function FloatParticle({ emoji, x, y, onDone }) {
  useEffect(()=>{ const t=setTimeout(onDone,1000); return ()=>clearTimeout(t); },[onDone]);
  return <div className="float-p" style={{left:x,top:y,transform:"translate(-50%,-50%)"}}>{emoji}</div>;
}

function CopyCA() {
  const [copied, setCopied] = useState(false);
  return (
    <div
      className={`ca-block${copied?" copied":""}`}
      onClick={()=>{ navigator.clipboard.writeText(CA).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
      title="Copy contract address"
    >
      <span className="ca-tick">$CFN</span>
      <span className="ca-divider" />
      <span className="ca-addr">{CA}</span>
      <span className="ca-copy">{copied?"✓":"⎘"}</span>
    </div>
  );
}

function Navbar({ page, setPage, soundOn, toggleSound, onConfess }) {
  return (
    <nav className="nav">
      <div className="nav-brand" onClick={()=>setPage("wall")} style={{cursor:"pointer"}}>
        <img src="/logo.png" alt="ConfessCoin" onError={e=>e.target.style.display="none"} />
        <span className="nav-brand-name">CONFESS</span>
      </div>

      <div className="nav-center">
        <span className={`nav-lk${page==="wall"?" on":""}`}       onClick={()=>setPage("wall")}>The Wall</span>
        <span className={`nav-lk${page==="chain"?" chain-on":""}`} onClick={()=>setPage("chain")}>⛓ On‑Chain</span>
        <span className={`nav-lk${page==="lore"?" on":""}`}        onClick={()=>setPage("lore")}>Why This Exists</span>
      </div>

      <div className="nav-right">
        <a href={SOCIAL.x}         target="_blank" rel="noopener noreferrer" className="nav-ico">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
        <a href={SOCIAL.github}    target="_blank" rel="noopener noreferrer" className="nav-ico">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>
        </a>
        <div className="nav-sep" />
        <button className="nav-ico" onClick={toggleSound} style={{fontSize:".78rem",opacity:soundOn?1:.3,transition:"opacity .25s"}}>
          {soundOn?"🔔":"🔕"}
        </button>
        <div className="nav-sep" />
        <button className="nav-confess" onClick={onConfess}>
          <span style={{animation:"candleFlame 3s ease-in-out infinite",display:"inline-block"}}>🕯️</span>
          confess
        </button>
      </div>
    </nav>
  );
}

function MobileNav({ page, setPage, onConfess }) {
  return (
    <div className="mob-nav">
      <div className={`mob-item${page==="wall"?" on":""}`} onClick={()=>setPage("wall")}>
        <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/></svg>
        Wall
      </div>
      <div className={`mob-item${page==="chain"?" on":""}`} onClick={()=>setPage("chain")}>
        <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        Chain
      </div>
      <div className="mob-confess-btn" onClick={onConfess}>
        <div className="mob-confess-icon">🕯️</div>
        confess
      </div>
      <div className={`mob-item${page==="lore"?" on":""}`} onClick={()=>setPage("lore")}>
        <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Why
      </div>
      <div className="mob-item" onClick={()=>navigator.clipboard.writeText(CA).catch(()=>{})}>
        <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        $CFN
      </div>
    </div>
  );
}

function ReactionBar({ confId, rxData, setParticles }) {
  const [local,  setLocal]  = useState({...rxData});
  const [active, setActive] = useState(()=>getRx()[confId]||null);
  const [ripple, setRipple] = useState(null);
  const synced = useRef(false);
  useEffect(()=>{ if(!synced.current){setLocal({...rxData});synced.current=true;} },[rxData]);

  const tap = useCallback(async (key,e) => {
    e?.stopPropagation();
    const prev=active, store=getRx(), next={...local};
    if(prev===key){
      next[key]=Math.max(0,(next[key]||0)-1);
      setActive(null);delete store[confId];
    } else {
      if(prev) next[prev]=Math.max(0,(next[prev]||0)-1);
      next[key]=(next[key]||0)+1;
      setActive(key);store[confId]=key;
      setRipple(key);setTimeout(()=>setRipple(null),480);
      if(e&&setParticles){
        const r=e.target.getBoundingClientRect();
        const em=REACTIONS.find(r=>r.key===key)?.emoji;
        setParticles(ps=>[...ps,{id:Date.now(),emoji:em,x:r.left+r.width/2,y:r.top}]);
      }
    }
    setLocal(next);setRx(store);
    try {
      const upd={};
      if(prev===key){ upd[`reactions.${key}`]=Math.max(0,(rxData[key]||0)-1); }
      else {
        if(prev) upd[`reactions.${prev}`]=Math.max(0,(rxData[prev]||0)-1);
        upd[`reactions.${key}`]=(rxData[key]||0)+1;
      }
      await updateDoc(doc(db,"confessions",confId),upd);
    } catch(err){console.error("rx",err);}
  },[active,confId,local,rxData,setParticles]);

  return (
    <div className="react-bar" onClick={e=>e.stopPropagation()}>
      {REACTIONS.map(r=>(
        <button key={r.key} className={`react-btn${active===r.key?" on":""}`}
          title={r.label} onClick={e=>tap(r.key,e)} type="button">
          {ripple===r.key && <span className="react-ripple"/>}
          <span className="react-emoji">{r.emoji}</span>
          <span className="react-count">{local[r.key]||0}</span>
        </button>
      ))}
    </div>
  );
}

function Card({ data, idx=0, setParticles }) {
  const sz    = ["whisper","normal","scream"].includes(data.size)?data.size:"normal";
  const cat   = data.category?CATEGORIES.find(c=>c.key===data.category):null;
  const isNew = data.timestamp?.toMillis&&(Date.now()-data.timestamp.toMillis())<12000;

  return (
    <div className={`card ${sz}-card${data.burned?" burned-card":""}`}
      style={{animationDelay:`${Math.min(idx*.04,.5)}s`}}>
      <div className="card-bg"/>
      <div className="card-flame"/>
      <div className="card-num">{String(idx+1).padStart(3,"0")}</div>

      <div className="card-header">
        {data.username&&<span className="card-user">{data.username}</span>}
        {cat&&<span className="card-cat" title={cat.label}>{cat.emoji}</span>}
      </div>

      <p className="card-text">{data.text}</p>

      <div className="card-foot">
        <span className="card-time">{timeAgo(data.timestamp)}</span>
        {isNew&&<span className="card-live"><span className="live-dot"/>LIVE</span>}
        {data.burned&&data.txHash&&(
          <a href={`https://solscan.io/tx/${data.txHash}`}
            target="_blank" rel="noopener noreferrer"
            className="chain-pill" onClick={e=>e.stopPropagation()}>
            <span style={{animation:"candleFlame 3s infinite",display:"inline-block"}}>🔥</span>
            {shortAddr(data.txHash)}
          </a>
        )}
      </div>
      <ReactionBar confId={data.id} rxData={data.reactions||{}} setParticles={setParticles}/>
    </div>
  );
}

function ConfessModal({ onClose, onDone, setToast }) {
  const [text,     setText]     = useState("");
  const [username, setUsername] = useState("");
  const [sliderV,  setSliderV]  = useState(50);
  const [category, setCategory] = useState("");
  const [burn,     setBurn]     = useState(false);
  const [phase,    setPhase]    = useState("write");
  const taRef = useRef(null);
  const sz    = sizeKey(sliderV);
  const { pubkey, connecting, walletError, connect, setWalletError } = useWallet();

  useEffect(()=>{
    setTimeout(()=>taRef.current?.focus(),80);
    document.body.style.overflow="hidden";
    return ()=>{ document.body.style.overflow=""; };
  },[]);

  const handleBurn = async () => {
    const next=!burn; setBurn(next); setWalletError(null);
    if(next&&!pubkey) await connect();
  };

  const submit = async () => {
    if(text.trim().length<3) return;
    let txHash=null,burned=false;
    if(burn){
      let addr=pubkey;
      if(!addr){ addr=await connect(); if(!addr){setToast("Connect Phantom first");return;} }
      setPhase("burning");
      try {
        txHash=await burnToChain({pubkey:addr,text,username});
        burned=true;
      } catch(e){
        const m=e?.message||"";
        if(m.startsWith("insufficient_balance:"))
          setToast(`Need ~${m.split(":")[1]} more SOL`);
        else if(m.includes("rejected")||m.includes("User rejected"))
          setToast("Transaction cancelled.");
        else { setToast("On-chain failed. Saving anyway."); console.error(e); }
        setPhase("write"); setBurn(false); return;
      }
    }
    try {
      await addDoc(collection(db,"confessions"),{
        text:text.trim(), username:username.trim()||null,
        size:sz, category:category||null,
        burned, txHash:txHash||null,
        timestamp:serverTimestamp(),
        reactions:{candle:0,heavy:0,eye:0,fire:0,grave:0},
      });
    } catch(e){ console.error(e); setToast("Could not save. Check connection."); setPhase("write"); return; }
    setPhase("done");
    setTimeout(onDone,2600);
  };

  if(phase==="burning") return (
    <div className="full-screen">
      <div className="fs-flame">🔥</div>
      <p className="fs-label">WRITING TO SOLANA</p>
      <p className="fs-note">Your words are being permanently inscribed. This cannot be undone.</p>
    </div>
  );
  if(phase==="done") return (
    <div className="full-screen">
      <p className="done-1">it's gone.</p>
      <p className="done-2">you're lighter now.</p>
    </div>
  );

  return (
    <>
      <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
        <div className="modal-scroll">
          <div className="modal-inner">
            <div className="modal-header">
              <span className="modal-rule"/>
              <span className="modal-eyebrow">secrets are better shared</span>
              <span className="modal-rule"/>
            </div>

            <div className="uname-row">
              <span className="uname-prefix">~</span>
              <input type="text" className="uname-input"
                placeholder="anonymous handle (optional)"
                maxLength={24} value={username}
                onChange={e=>setUsername(e.target.value.replace(/\s/g,""))}/>
            </div>

            <div className="ta-wrap">
              <textarea ref={taRef} value={text}
                onChange={e=>setText(e.target.value)}
                maxLength={1200} rows={6}
                className={`modal-ta ${sz}`} placeholder=" "/>
              {!text&&(
                <span className="ta-cursor blink"
                  style={{fontSize:sz==="whisper"?".96rem":sz==="scream"?"1.55rem":"1.12rem"}}>|</span>
              )}
            </div>

            <div className="modal-sec">
              <div className="sec-label">
                <span className="sec-t">INTENSITY</span>
                <span className="sec-v">{sz.toUpperCase()}</span>
              </div>
              <input type="range" min="0" max="100" value={sliderV}
                style={{"--pct":`${sliderV}%`}}
                onChange={e=>setSliderV(+e.target.value)}
                className="slider"/>
              <div className="slider-ends">
                <span className="slider-end">whisper</span>
                <span className="slider-end">scream</span>
              </div>
            </div>

            <div className="modal-sec">
              <div className="sec-label">
                <span className="sec-t">CATEGORY</span>
                <span className="sec-v" style={{color:"var(--border2)"}}>optional</span>
              </div>
              <div className="cats">
                {CATEGORIES.map(c=>(
                  <button key={c.key} className={`cat-btn${category===c.key?" on":""}`}
                    type="button" onClick={()=>setCategory(category===c.key?"":c.key)}>
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={`burn-box${burn?" on":""}`} onClick={handleBurn}>
              <div className="burn-row">
                <input type="checkbox" checked={burn} readOnly className="burn-cb"
                  onClick={e=>e.stopPropagation()}/>
                <div style={{flex:1}}>
                  <p className="burn-title">🔥 Burn this to chain forever</p>
                  <p className="burn-sub">0.01 SOL · permanently on Solana · immutable · nobody can delete it</p>
                  {burn&&(
                    <div className="wallet-row" onClick={e=>e.stopPropagation()}>
                      {pubkey?(
                        <span className="wallet-badge">
                          <span className="wallet-dot"/>{shortAddr(pubkey)}
                        </span>
                      ):connecting?(
                        <span style={{fontFamily:"var(--mono)",fontSize:".54rem",color:"var(--dim)"}}>
                          connecting<span className="blink">_</span>
                        </span>
                      ):(
                        <button className="connect-btn" type="button"
                          onClick={async e=>{e.stopPropagation();await connect();}}>
                          Connect Phantom →
                        </button>
                      )}
                      {walletError&&<p className="wallet-err">{walletError}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="submit-row">
              <button className="release-btn" type="button" onClick={submit}
                disabled={text.trim().length<3||(burn&&!pubkey)}>
                release it
              </button>
              <span className="char-cnt">{text.length} / 1200</span>
            </div>
            <p className="modal-hint">your words live here. or forever on-chain.</p>
          </div>
        </div>
      </div>
      <button className="modal-close" type="button" onClick={onClose}>✕</button>
    </>
  );
}

function WallPage({ setParticles }) {
  const [confessions,  setConfessions]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filterOpen,   setFilterOpen]   = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [search,       setSearch]       = useState("");

  useEffect(()=>{
    const q=query(collection(db,"confessions"),orderBy("timestamp","desc"),limit(80));
    const unsub=onSnapshot(q,snap=>{
      setConfessions(snap.docs.map(d=>({id:d.id,...d.data()})));
      setLoading(false);
    },err=>{console.error(err);setLoading(false)});
    return unsub;
  },[]);

  const list=useMemo(()=>{
    let l=confessions;
    if(activeFilter) l=l.filter(c=>c.category===activeFilter);
    if(search.trim()){
      const q=search.trim().toLowerCase();
      l=l.filter(c=>c.username?.toLowerCase()===q||c.text?.toLowerCase().includes(q));
    }
    return l;
  },[confessions,activeFilter,search]);

  const activeCat=CATEGORIES.find(c=>c.key===activeFilter);

  return (
    <div className="page">
      {/* Hero */}
      <div className="hero fade-up">
        <div className="hero-eyebrow">THE WALL</div>
        <h1 className="hero-title">Every secret<br/>deserves a witness.</h1>
        <p className="hero-sub">
          Anonymous confessions from the edge of the internet.<br/>
          Some will burn to chain. None will be forgotten.
        </p>
        <div className="hero-meta">
          <span className="hero-count">
            <span className="live-dot"/>
            {list.length} confession{list.length!==1?"s":""}
          </span>
          <CopyCA/>
        </div>
      </div>

      {/* Controls */}
      <div className="controls">
        <button className={`ctrl-btn${filterOpen||activeFilter?" on":""}`}
          type="button" onClick={()=>setFilterOpen(f=>!f)}>
          {activeCat?`${activeCat.emoji} ${activeCat.label}`:"⊞ filter"}
        </button>
        {activeFilter&&(
          <button className="ctrl-btn" type="button"
            onClick={()=>{setActiveFilter(null);setFilterOpen(false)}}>× clear</button>
        )}
      </div>

      {filterOpen&&(
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
          placeholder="search confessions…"
          value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      {loading?(
        <p className="loading-t">reading the wall<span className="blink">_</span></p>
      ):list.length===0?(
        <p className="empty-t">
          {search?`Nothing found for "${search}".`:activeFilter?"Nothing in this category yet.":"The wall is empty. Say something real."}
        </p>
      ):(
        list.map((c,i)=>(
          <Card key={c.id} data={c} idx={i} setParticles={setParticles}/>
        ))
      )}
    </div>
  );
}

function ChainPage() {
  const [entries,setEntries]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    const q=query(collection(db,"confessions"),where("burned","==",true),orderBy("timestamp","desc"),limit(100));
    const unsub=onSnapshot(q,snap=>{
      setEntries(snap.docs.map(d=>({id:d.id,...d.data()})));
      setLoading(false);
    },err=>{console.error(err);setLoading(false)});
    return unsub;
  },[]);
  return (
    <div className="page">
      <div className="chain-intro fade-up">
        <h1 className="chain-h1">The Chain Wall</h1>
        <p className="chain-desc">
          Every post you've ever made can be deleted.<br/>
          Every platform can shut down.<br/>
          Every account can be banned.<br/><br/>
          Not these.<br/>These are on Solana. Forever.
        </p>
        <div className="chain-rule"/>
      </div>
      {loading?(
        <p className="loading-t">reading the chain<span className="blink">_</span></p>
      ):entries.length===0?(
        <div className="chain-empty">
          <p className="chain-e-t">The chain is silent.</p>
          <p className="chain-e-s">Be the first to burn something into eternity.</p>
        </div>
      ):(
        entries.map((e,i)=>{
          const sz=["whisper","normal","scream"].includes(e.size)?e.size:"normal";
          return (
            <div key={e.id} className="chain-entry" style={{animationDelay:`${i*.05}s`}}>
              {e.username&&<div className="card-user" style={{marginBottom:7}}>{e.username}</div>}
              <p className={`chain-text ${sz}`}>{e.text}</p>
              <div className="chain-meta">
                <span className="chain-time">{timeAgo(e.timestamp)}</span>
                {e.txHash&&(
                  <a href={`https://solscan.io/tx/${e.txHash}`}
                    target="_blank" rel="noopener noreferrer" className="chain-tx">
                    <span style={{animation:"candleFlame 3s infinite",display:"inline-block"}}>🔥</span>
                    {shortAddr(e.txHash)} →
                  </a>
                )}
                {e.category&&<span style={{fontSize:".7rem",opacity:.5}}>{CATEGORIES.find(c=>c.key===e.category)?.emoji}</span>}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

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
        <div key={i} className="lore-block fade-up" style={{animationDelay:`${i*.1}s`}}>
          <p className={`lore-p ${p.primary?"primary":"body"}`}>{p.t}</p>
        </div>
      ))}
      <div className="lore-foot fade-up" style={{animationDelay:".6s"}}>
        <div className="lore-brand">
          <img src="/logo.png" alt="" style={{height:20,opacity:.6}} onError={e=>e.target.style.display="none"}/>
          <span className="lore-brand-name">ConfessCoin · <span style={{color:"var(--ember)"}}>$CFN</span></span>
        </div>
        <CopyCA/>
        <div className="lore-links">
          <a href={SOCIAL.x}         target="_blank" rel="noopener noreferrer" className="lore-link">X →</a>
          <a href={SOCIAL.community} target="_blank" rel="noopener noreferrer" className="lore-link">Community →</a>
          <a href={SOCIAL.github}    target="_blank" rel="noopener noreferrer" className="lore-link">GitHub →</a>
        </div>
      </div>
    </div>
  );
}

function useAmbient(on) {
  const ref=useRef(null);
  useEffect(()=>{
    if(!ref.current){ ref.current=new Audio("/thesound.mp3"); ref.current.loop=true; ref.current.volume=.13; }
    on?ref.current.play().catch(()=>{}):ref.current.pause();
  },[on]);
}

function Toast({ msg, gone }) {
  useEffect(()=>{ const t=setTimeout(gone,3600); return ()=>clearTimeout(t); },[gone]);
  return <div className="toast">{msg}</div>;
}

/* ─────────────────────────────────────────────────
   APP ROOT
───────────────────────────────────────────────── */
export default function App() {
  const [page,      setPage]      = useState("wall");
  const [modal,     setModal]     = useState(false);
  const [sound,     setSound]     = useState(false);
  const [toast,     setToast]     = useState(null);
  const [particles, setParticles] = useState([]);
  const mouseRef = useRef({x:0,y:0});

  useAmbient(sound);

  const openConfess    = useCallback(()=>setModal(true),[]);
  const closeModal     = useCallback(()=>setModal(false),[]);
  const onDone         = useCallback(()=>{setModal(false);setPage("wall");},[]);
  const removeParticle = useCallback(id=>setParticles(ps=>ps.filter(p=>p.id!==id)),[]);

  return (
    <>
      <style>{CSS}</style>

      <LivingCanvas mouseRef={mouseRef}/>
      <div className="grain"/>
      <div className="vig"/>
      <Cursor mouseRef={mouseRef}/>

      {particles.map(p=>(
        <FloatParticle key={p.id} emoji={p.emoji} x={p.x} y={p.y}
          onDone={()=>removeParticle(p.id)}/>
      ))}

      <div id="app-root">
        <Navbar page={page} setPage={setPage}
          soundOn={sound} toggleSound={()=>setSound(s=>!s)}
          onConfess={openConfess}/>

        {page==="wall"  && <WallPage  setParticles={setParticles}/>}
        {page==="chain" && <ChainPage/>}
        {page==="lore"  && <LorePage/>}

        <MobileNav page={page} setPage={setPage} onConfess={openConfess}/>
      </div>

      {modal&&<ConfessModal onClose={closeModal} onDone={onDone} setToast={setToast}/>}
      {toast&&<Toast msg={toast} gone={()=>setToast(null)}/>}
    </>
  );
}