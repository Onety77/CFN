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
const ADMIN_USER = "admin77";
const ADMIN_PASS = "seventyseven";

const REACTIONS = [
  { key:"candle", emoji:"🕯️", label:"I've felt this" },
  { key:"heavy",  emoji:"🪨",  label:"heavy"          },
  { key:"eye",    emoji:"👁️",  label:"I see you"      },
  { key:"fire",   emoji:"🔥",  label:"burn it"        },
  { key:"grave",  emoji:"💀",  label:"to the grave"   },
];
const CATEGORIES = [
  { key:"crypto",  emoji:"💸", label:"Money & Crypto"             },
  { key:"love",    emoji:"❤️",  label:"Love & Betrayal"            },
  { key:"family",  emoji:"👨‍👩‍👧", label:"Family"                     },
  { key:"self",    emoji:"🪞", label:"Things I did to myself"     },
  { key:"online",  emoji:"🌐", label:"Things I did online"        },
  { key:"unsaid",  emoji:"☠️", label:"Things I'd never say aloud" },
  { key:"good",    emoji:"✨", label:"Good things I'm ashamed of" },
];
const SOCIAL = {
  x:         "https://x.com/confessioncoin",
  community: "https://x.com/i/communities/confessioncoin",
  github:    "https://github.com/confessioncoin/confessioncoin",
};

const isMobile  = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const timeAgo   = ts => {
  if (!ts?.toMillis) return "just now";
  const s = Math.floor((Date.now()-ts.toMillis())/1000);
  if (s<5) return "just now";
  if (s<60) return `${s}s ago`;
  if (s<3600) return `${Math.floor(s/60)}m ago`;
  if (s<86400) return `${Math.floor(s/3600)}h ago`;
  if (s<604800) return `${Math.floor(s/86400)}d ago`;
  return new Date(ts.toMillis()).toLocaleDateString("en-US",{month:"short",day:"numeric"});
};
const shortAddr = a => (!a||a.length<10)?a||"":a.slice(0,5)+"…"+a.slice(-4);
const sizeKey   = v => v<30?"whisper":v<70?"normal":"scream";
const getRx     = () => { try{return JSON.parse(localStorage.getItem("cfn_rx")||"{}");}catch{return{};} };
const setRx     = o  => { try{localStorage.setItem("cfn_rx",JSON.stringify(o));}catch{} };
const padNum    = (n, total) => { const d=Math.max(3,String(total).length); return String(n).padStart(d,"0"); };
const buildTweet = (c, num) => {
  const cat = c.category ? CATEGORIES.find(x=>x.key===c.category) : null;
  let t = `🕯️ confession #${num}\n\n"${c.text.trim()}"`;
  if (cat) t += `\n\n${cat.emoji} ${cat.label}`;
  return t + `\n\nconfessioncoin.xyz | $CFN`;
};

/* ─────────── CSS ─────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=Crimson+Pro:ital,wght@0,300;0,400;1,300;1,400&family=IBM+Plex+Mono:wght@300;400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --ink:#05050a;--well:#0d0d16;--surface:#11111c;--border:#1e1e2e;--border2:#2a2a3e;
  --muted:#3a3a58;--dim:#5a5a80;--soft:#9898b8;--pale:#c0c0d8;--paper:#f0ece0;--warm:#f7f2e6;
  --ember:#e8973a;--ember2:#c8792a;--emberlo:#6a4010;--emberhi:#f5b050;
  --serif:'Cormorant Garamond',Georgia,serif;
  --prose:'Crimson Pro',Georgia,serif;
  --mono:'IBM Plex Mono','Courier New',monospace;
  --ease:cubic-bezier(0.16,1,0.3,1);
}
html{font-size:17px;scroll-behavior:smooth}
@media(max-width:640px){html{font-size:18px}}
body{background:var(--ink);color:var(--paper);font-family:var(--serif);min-height:100vh;overflow-x:hidden;-webkit-font-smoothing:antialiased;cursor:none;line-height:1.65}
@media(max-width:640px){body{cursor:auto}}
::selection{background:var(--ember2);color:var(--ink)}
::-webkit-scrollbar{width:2px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--border2)}
button{font-family:inherit;color:inherit;border:none;background:none;padding:0;cursor:pointer}
a{color:inherit;text-decoration:none;cursor:pointer}
textarea,input{font-family:inherit}
textarea:focus,input:focus{outline:none}

/* CURSOR */
#cfn-cursor{position:fixed;z-index:99999;pointer-events:none;border-radius:50%;transform:translate(-50%,-50%);mix-blend-mode:screen;will-change:left,top;transition:width .18s var(--ease),height .18s var(--ease),opacity .3s}
#cfn-cursor .c-core{position:absolute;inset:0;border-radius:50%;background:var(--ember);box-shadow:0 0 10px 2px rgba(232,151,58,.55)}
#cfn-cursor .c-ring{position:absolute;border-radius:50%;border:1px solid rgba(232,151,58,.3);top:50%;left:50%;transform:translate(-50%,-50%);transition:width .35s var(--ease),height .35s var(--ease),opacity .3s}
body.cur-hover #cfn-cursor .c-core{background:var(--emberhi)}
body.cur-click #cfn-cursor{opacity:.4}
@media(max-width:640px){#cfn-cursor{display:none}}

#bg-canvas{position:fixed;inset:0;z-index:0;pointer-events:none}
.grain{position:fixed;inset:0;z-index:9990;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.055'/%3E%3C/svg%3E");opacity:.6;mix-blend-mode:overlay}
.vig{position:fixed;inset:0;z-index:9989;pointer-events:none;background:radial-gradient(ellipse 110% 110% at 50% 50%,transparent 15%,rgba(5,5,10,.88) 100%)}
#app-root{position:relative;z-index:10}

/* KEYFRAMES */
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
@keyframes confIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes modalRise{from{opacity:0;transform:translateY(32px) scale(.982)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.12}}
@keyframes candleFlame{0%,100%{transform:scaleY(1) scaleX(1) translateX(0)}28%{transform:scaleY(1.1) scaleX(.91) translateX(-1px)}62%{transform:scaleY(.92) scaleX(1.07) translateX(1px)}}
@keyframes rippleRing{0%{transform:scale(0);opacity:.5}100%{transform:scale(4);opacity:0}}
@keyframes floatUp{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-70px) scale(1.4)}}
@keyframes adminGlow{0%,100%{box-shadow:0 0 24px rgba(232,151,58,.07)}50%{box-shadow:0 0 48px rgba(232,151,58,.24)}}
@keyframes tweetPop{from{opacity:0;transform:scale(.93) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes cardReveal{from{opacity:0;transform:translateY(8px) scaleX(.992)}to{opacity:1;transform:translateY(0) scaleX(1)}}
@keyframes scanline{0%{top:-2px}100%{top:100%}}
@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
@keyframes breathe{0%,100%{transform:scaleX(1)}50%{transform:scaleX(1.04)}}

.fade-up{animation:fadeUp .8s var(--ease) both}
.blink{animation:blink 1.1s step-end infinite}

/* SCANLINE on canvas */
.scanline{position:fixed;left:0;right:0;height:1px;background:rgba(232,151,58,.03);z-index:9988;pointer-events:none;animation:scanline 8s linear infinite}

/* LAYOUT */
.page{max-width:800px;margin:0 auto;padding:108px 32px 200px;position:relative}
@media(max-width:640px){.page{padding:92px 18px 140px}}

/* NAV */
.nav{position:fixed;top:0;left:0;right:0;z-index:800;display:flex;align-items:center;justify-content:space-between;height:58px;padding:0 28px;background:rgba(5,5,10,.88);backdrop-filter:blur(32px) saturate(2);-webkit-backdrop-filter:blur(32px) saturate(2);border-bottom:1px solid rgba(30,30,46,.9)}
@media(max-width:640px){.nav{padding:0 16px;height:54px}}
.nav-brand{display:flex;align-items:center;gap:10px;cursor:pointer}
.nav-brand img{height:22px;object-fit:contain;opacity:.9}
.nav-brand-name{font-family:var(--serif);font-style:italic;font-weight:600;font-size:.95rem;letter-spacing:.22em;color:var(--warm)}
.nav-center{position:absolute;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:2px}
@media(max-width:640px){.nav-center{display:none}}
.nav-lk{font-family:var(--mono);font-size:.57rem;letter-spacing:.1em;color:var(--dim);padding:5px 11px;border-radius:3px;transition:color .2s,background .2s;white-space:nowrap}
.nav-lk:hover{color:var(--soft);background:rgba(255,255,255,.03)}
.nav-lk.on{color:var(--warm);background:rgba(255,255,255,.04)}
.nav-lk.chain-on{color:var(--ember)}
.nav-right{display:flex;align-items:center;gap:6px}
.nav-ico{width:30px;height:30px;display:flex;align-items:center;justify-content:center;color:var(--dim);border-radius:3px;transition:color .2s,background .2s}
.nav-ico:hover{color:var(--soft);background:rgba(255,255,255,.025)}
.nav-sep{width:1px;height:12px;background:var(--border2);margin:0 2px;flex-shrink:0}
.nav-confess{display:flex;align-items:center;gap:7px;font-family:var(--serif);font-style:italic;font-weight:500;font-size:.84rem;letter-spacing:.14em;color:var(--ember);padding:6px 16px;border:1px solid var(--emberlo);border-radius:100px;background:rgba(232,151,58,.04);transition:all .25s var(--ease)}
.nav-confess:hover{color:var(--ink);background:var(--ember);border-color:var(--ember);box-shadow:0 0 24px rgba(232,151,58,.35)}
@media(max-width:640px){.nav-confess{display:none}}

/* HERO */
.hero{padding:52px 0 44px;border-bottom:1px solid var(--border);margin-bottom:44px;position:relative}
.hero::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(to right,transparent,var(--emberlo),transparent)}
.hero-eyebrow{font-family:var(--mono);font-size:.57rem;letter-spacing:.24em;color:var(--dim);margin-bottom:18px;display:flex;align-items:center;gap:10px}
.hero-eyebrow::before{content:'';display:inline-block;width:26px;height:1px;background:linear-gradient(to right,transparent,var(--emberlo))}
.hero-title{font-family:var(--serif);font-style:italic;font-weight:300;font-size:clamp(2.1rem,5.5vw,3.2rem);color:var(--warm);letter-spacing:.01em;line-height:1.18;margin-bottom:16px}
@media(max-width:640px){.hero-title{font-size:1.95rem;line-height:1.22}}
.hero-sub{font-family:var(--prose);font-weight:300;font-style:italic;font-size:clamp(1.02rem,2.2vw,1.14rem);color:var(--soft);line-height:1.9;max-width:460px}
.hero-meta{display:flex;align-items:center;gap:14px;margin-top:26px;flex-wrap:wrap}
.hero-count{display:flex;align-items:center;gap:6px;font-family:var(--mono);font-size:.58rem;color:var(--dim);letter-spacing:.1em}
.live-dot{display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--ember);animation:pulse 2.2s ease-in-out infinite;box-shadow:0 0 6px rgba(232,151,58,.6)}

/* CA */
.ca-block{display:inline-flex;align-items:center;gap:8px;padding:5px 14px 5px 10px;border:1px solid var(--border2);border-radius:100px;background:var(--well);cursor:pointer;transition:border-color .22s,background .22s;position:relative;overflow:hidden}
.ca-block:hover{border-color:var(--emberlo)}
.ca-block.copied{border-color:var(--ember2);background:rgba(232,151,58,.05)}
.ca-tick{font-family:var(--mono);font-size:.57rem;color:var(--ember);letter-spacing:.07em}
.ca-divider{width:1px;height:10px;background:var(--border2)}
.ca-addr{font-family:var(--mono);font-size:.55rem;color:var(--dim);white-space:nowrap;max-width:160px;overflow:hidden;text-overflow:ellipsis}
@media(max-width:400px){.ca-addr{max-width:80px}}
.ca-copy{font-family:var(--mono);font-size:.55rem;color:var(--muted);transition:color .2s}
.ca-block.copied .ca-copy,.ca-block.copied .ca-addr{color:var(--ember)}

/* CONTROLS */
.controls{display:flex;align-items:center;gap:8px;margin-bottom:22px;flex-wrap:wrap}
.ctrl-btn{font-family:var(--mono);font-size:.56rem;letter-spacing:.08em;color:var(--dim);padding:5px 12px;border:1px solid var(--border);border-radius:100px;transition:all .18s;white-space:nowrap}
.ctrl-btn:hover{color:var(--soft);border-color:var(--border2)}
.ctrl-btn.on{color:var(--ember);border-color:var(--emberlo);background:rgba(232,151,58,.04)}
.fstrip{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px;animation:slideDown .2s var(--ease)}
.fchip{font-family:var(--mono);font-size:.55rem;letter-spacing:.06em;color:var(--dim);padding:4px 11px;border:1px solid var(--border);border-radius:100px;transition:all .16s;white-space:nowrap}
.fchip:hover{color:var(--soft);border-color:var(--border2)}
.fchip.on{color:var(--ember);border-color:var(--emberlo);background:rgba(232,151,58,.04)}
.search-wrap{position:relative;margin-bottom:32px}
.search-input{width:100%;background:transparent;border:none;border-bottom:1px solid var(--border);padding:9px 0 12px 26px;font-family:var(--mono);font-size:.66rem;color:var(--paper);letter-spacing:.05em;transition:border-color .25s;caret-color:var(--ember)}
@media(max-width:640px){.search-input{font-size:.74rem;padding-bottom:14px}}
.search-input:focus{border-color:var(--border2)}
.search-input::placeholder{color:var(--muted)}
.search-icon{position:absolute;left:0;top:50%;transform:translateY(-50%);font-size:.74rem;color:var(--muted)}

/* ════════════════════════════
   CARDS
════════════════════════════ */
.card{
  position:relative;
  padding:36px 0 32px;
  border-bottom:1px solid var(--border);
  overflow:hidden;
  transition:border-color .5s;
  animation:cardReveal .6s var(--ease) both;
}
.card:first-of-type{border-top:1px solid var(--border)}

/* Left accent bar — animates in on hover */
.card::before{
  content:'';position:absolute;left:0;top:15%;bottom:15%;width:1.5px;
  background:linear-gradient(to bottom,transparent,var(--ember2) 35%,var(--ember) 65%,transparent);
  transform:scaleY(0);transform-origin:center;
  transition:transform .6s var(--ease);opacity:.7;
  border-radius:1px;
}
.card:hover::before{transform:scaleY(1)}

/* Warm paper bg on hover */
.card-bg{
  position:absolute;inset:0;
  background:linear-gradient(135deg,rgba(232,151,58,.018) 0%,transparent 60%);
  opacity:0;transition:opacity .6s var(--ease);pointer-events:none;
}
.card:hover .card-bg{opacity:1}

/* Ghost number */
.card-num{
  position:absolute;right:-4px;top:18px;
  font-family:var(--mono);font-weight:300;
  color:rgba(232,151,58,.022);
  line-height:1;pointer-events:none;user-select:none;
  transition:color .6s,font-size .3s;letter-spacing:-.04em;
  font-size:5rem;
}
.card:hover .card-num{color:rgba(232,151,58,.052)}

.card-header{display:flex;align-items:baseline;gap:10px;margin-bottom:12px;flex-wrap:wrap}
.card-user{font-family:var(--mono);font-size:.6rem;letter-spacing:.06em;color:var(--ember2)}
@media(max-width:640px){.card-user{font-size:.68rem}}
.card-user::before{content:'~ ';color:var(--muted)}
.card-cat-badge{font-size:.8rem;opacity:.5}

/* ── TEXT — the soul of it ── */
.card-text{
  font-family:var(--prose);font-style:italic;font-weight:300;
  position:relative;z-index:1;
  transition:color .4s;
  text-rendering:optimizeLegibility;
  -webkit-font-smoothing:antialiased;
}
.card.whisper-card .card-text{
  font-size:1.02rem;line-height:2;
  color:#9a97b8;letter-spacing:.018em;
}
.card.normal-card .card-text{
  font-size:1.2rem;line-height:1.95;
  color:#dedad0;
}
.card.scream-card .card-text{
  font-size:clamp(1.46rem,3.8vw,1.88rem);
  font-family:var(--serif);font-style:italic;font-weight:400;
  line-height:1.68;color:var(--warm);letter-spacing:.004em;
}
@media(max-width:640px){
  .card.whisper-card .card-text{font-size:1.08rem}
  .card.normal-card .card-text{font-size:1.26rem}
  .card.scream-card .card-text{font-size:1.4rem}
}
.card.whisper-card{opacity:.78;transition:opacity .4s,border-color .5s}
.card.whisper-card:hover{opacity:1}
.card:hover .card-text{color:var(--warm)}
.card.burned-card::after{content:'';position:absolute;left:0;right:0;top:0;height:1px;background:linear-gradient(to right,var(--emberlo),transparent 65%)}

/* Admin tappable cards */
.card.admin-mode{cursor:pointer;transition:background .2s,border-color .5s}
.card.admin-mode:hover{background:rgba(232,151,58,.02)}
.card-tweet-hint{position:absolute;top:9px;left:50%;transform:translateX(-50%);font-family:var(--mono);font-size:.49rem;letter-spacing:.13em;color:var(--ember);opacity:0;transition:opacity .22s;white-space:nowrap;pointer-events:none;background:rgba(5,5,10,.85);padding:3px 10px;border-radius:100px;border:1px solid var(--emberlo)}
.card.admin-mode:hover .card-tweet-hint{opacity:1}

.card-foot{display:flex;align-items:center;gap:10px;margin-top:14px;flex-wrap:wrap}
.card-time{font-family:var(--mono);font-size:.57rem;color:var(--muted);letter-spacing:.05em}
@media(max-width:640px){.card-time{font-size:.64rem}}
.card-live{display:flex;align-items:center;gap:4px;font-family:var(--mono);font-size:.53rem;color:var(--ember);letter-spacing:.09em}
.chain-pill{display:inline-flex;align-items:center;gap:4px;font-family:var(--mono);font-size:.53rem;letter-spacing:.06em;color:var(--emberlo);padding:2px 8px;border:1px solid rgba(232,151,58,.15);border-radius:100px;transition:all .18s}
.chain-pill:hover{color:var(--ember);border-color:rgba(232,151,58,.38);background:rgba(232,151,58,.04)}

/* REACTIONS */
.react-bar{display:flex;gap:4px;margin-top:14px;flex-wrap:wrap}
.react-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:100px;border:1px solid transparent;font-family:var(--mono);font-size:.57rem;color:var(--muted);transition:all .15s var(--ease);position:relative;overflow:hidden;white-space:nowrap}
@media(max-width:640px){.react-btn{padding:7px 12px;font-size:.64rem}}
.react-btn:hover{color:var(--soft);border-color:var(--border2);background:var(--well)}
.react-btn.on{color:var(--ember);border-color:rgba(232,151,58,.3);background:rgba(232,151,58,.05)}
.react-emoji{font-size:.85rem;line-height:1}
.react-ripple{position:absolute;border-radius:50%;pointer-events:none;background:rgba(232,151,58,.18);width:120%;padding-bottom:120%;left:-10%;top:50%;transform:translateY(-50%) scale(0);animation:rippleRing .45s ease-out forwards}
.float-p{position:fixed;pointer-events:none;z-index:9995;font-size:1.1rem;animation:floatUp 1s ease-out forwards}

/* MOBILE NAV */
.mob-nav{position:fixed;bottom:0;left:0;right:0;z-index:800;display:none;background:rgba(5,5,10,.97);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border-top:1px solid var(--border);padding-bottom:env(safe-area-inset-bottom)}
@media(max-width:640px){.mob-nav{display:flex;align-items:stretch}}
.mob-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 0 8px;font-family:var(--mono);font-size:.54rem;letter-spacing:.06em;color:var(--muted);transition:color .18s}
.mob-item.on{color:var(--ember)}
.mob-confess-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 0 8px;font-family:var(--serif);font-style:italic;font-size:.68rem;color:var(--ember);letter-spacing:.08em}
.mob-confess-icon{width:38px;height:38px;border-radius:50%;border:1px solid var(--emberlo);background:rgba(232,151,58,.06);display:flex;align-items:center;justify-content:center;font-size:1rem;box-shadow:0 0 16px rgba(232,151,58,.2);transition:all .2s var(--ease)}
.mob-confess-btn:active .mob-confess-icon{transform:scale(.86)}

/* MODAL */
.modal-overlay{position:fixed;inset:0;z-index:900;background:rgba(3,3,8,.97);backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);overflow-y:auto;animation:fadeIn .28s var(--ease)}
.modal-scroll{min-height:100%;display:flex;align-items:flex-start;justify-content:center;padding:66px 24px 52px}
@media(max-width:640px){.modal-scroll{padding:56px 14px 40px}}
.modal-inner{width:100%;max-width:640px;animation:modalRise .38s var(--ease)}
.modal-header{display:flex;align-items:center;gap:14px;margin-bottom:28px}
.modal-rule{flex:1;height:1px;background:var(--border)}
.modal-eyebrow{font-family:var(--mono);font-size:.55rem;color:var(--muted);letter-spacing:.16em;white-space:nowrap}
.uname-row{display:flex;align-items:center;gap:7px;margin-bottom:18px;padding-bottom:15px;border-bottom:1px solid var(--border)}
.uname-prefix{font-family:var(--mono);font-size:.64rem;color:var(--emberlo);flex-shrink:0}
.uname-input{flex:1;background:transparent;border:none;font-family:var(--mono);font-size:.66rem;color:var(--ember);letter-spacing:.05em;caret-color:var(--ember)}
@media(max-width:640px){.uname-input{font-size:.74rem}}
.uname-input::placeholder{color:var(--muted)}
.ta-wrap{position:relative;margin-bottom:4px}
.modal-ta{width:100%;background:transparent;border:none;border-bottom:1px solid var(--border);padding:0 0 22px;font-family:var(--prose);font-style:italic;font-weight:300;color:var(--warm);line-height:1.92;resize:none;min-height:145px;caret-color:var(--ember);transition:border-color .25s;display:block}
.modal-ta:focus{border-bottom-color:var(--border2)}
.modal-ta.whisper{font-size:1.02rem}
.modal-ta.normal{font-size:1.16rem}
.modal-ta.scream{font-size:1.52rem;font-family:var(--serif)}
@media(max-width:640px){.modal-ta.whisper{font-size:1.1rem}.modal-ta.normal{font-size:1.2rem}.modal-ta.scream{font-size:1.3rem}}
.ta-cursor{position:absolute;top:0;left:0;pointer-events:none;line-height:1.92;font-family:var(--prose);font-style:italic;color:var(--ember)}
.modal-sec{margin-top:24px}
.sec-label{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px}
.sec-t{font-family:var(--mono);font-size:.55rem;color:var(--muted);letter-spacing:.12em}
.sec-v{font-family:var(--mono);font-size:.55rem;color:var(--ember);letter-spacing:.1em}
.slider{-webkit-appearance:none;appearance:none;width:100%;height:1px;background:linear-gradient(to right,var(--ember) var(--pct,50%),var(--border2) var(--pct,50%));border-radius:1px;cursor:pointer;display:block}
.slider::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:var(--ember);box-shadow:0 0 8px rgba(232,151,58,.55);transition:transform .18s;cursor:pointer}
.slider::-webkit-slider-thumb:hover{transform:scale(1.4)}
.slider-ends{display:flex;justify-content:space-between;margin-top:6px}
.slider-end{font-family:var(--mono);font-size:.53rem;color:var(--border2);letter-spacing:.07em}
.cats{display:flex;flex-wrap:wrap;gap:6px}
.cat-btn{font-family:var(--mono);font-size:.55rem;letter-spacing:.05em;color:var(--dim);padding:5px 10px;border:1px solid var(--border);border-radius:3px;transition:all .15s;white-space:nowrap}
@media(max-width:640px){.cat-btn{font-size:.64rem;padding:6px 12px}}
.cat-btn:hover{color:var(--soft);border-color:var(--border2)}
.cat-btn.on{color:var(--ember);border-color:var(--emberlo);background:rgba(232,151,58,.04)}
.burn-box{margin-top:22px;padding:17px 18px;border:1px solid var(--border);border-radius:6px;transition:border-color .3s,background .3s;cursor:pointer}
.burn-box:hover{border-color:var(--border2)}
.burn-box.on{border-color:rgba(232,151,58,.38);background:linear-gradient(135deg,rgba(232,151,58,.028),transparent)}
.burn-row{display:flex;align-items:flex-start;gap:13px}
.burn-cb{width:14px;height:14px;accent-color:var(--ember);margin-top:3px;flex-shrink:0;cursor:pointer}
.burn-title{font-family:var(--serif);font-style:italic;font-size:1rem;color:var(--paper);line-height:1.4;margin-bottom:4px}
.burn-sub{font-family:var(--mono);font-size:.55rem;color:var(--muted);line-height:1.78;letter-spacing:.025em}
@media(max-width:640px){.burn-sub{font-size:.64rem}}
.wallet-row{margin-top:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.wallet-badge{display:inline-flex;align-items:center;gap:5px;font-family:var(--mono);font-size:.55rem;color:var(--ember);padding:3px 10px;border:1px solid rgba(232,151,58,.25);border-radius:100px;background:rgba(232,151,58,.04)}
.wallet-dot{width:5px;height:5px;border-radius:50%;background:var(--ember);display:inline-block;box-shadow:0 0 5px var(--ember)}
.connect-btn{font-family:var(--mono);font-size:.55rem;color:var(--ember);letter-spacing:.07em;padding:4px 12px;border:1px solid rgba(232,151,58,.35);border-radius:3px;transition:background .18s;background:transparent}
.connect-btn:hover{background:rgba(232,151,58,.06)}
.wallet-err{margin-top:6px;width:100%;font-family:var(--mono);font-size:.54rem;color:#d07070;letter-spacing:.03em;line-height:1.6}
.submit-row{display:flex;align-items:center;justify-content:space-between;margin-top:28px;gap:12px;flex-wrap:wrap}
.release-btn{font-family:var(--serif);font-style:italic;font-weight:400;font-size:1.12rem;letter-spacing:.1em;color:var(--paper);padding:11px 34px;border:1px solid var(--border2);border-radius:3px;background:var(--surface);transition:all .3s var(--ease)}
@media(max-width:640px){.release-btn{font-size:1.18rem;padding:13px 36px}}
.release-btn:hover:not(:disabled){background:var(--ember);border-color:var(--ember);color:var(--ink);transform:translateY(-1px);box-shadow:0 8px 28px rgba(232,151,58,.35)}
.release-btn:disabled{opacity:.2;cursor:not-allowed}
.char-cnt{font-family:var(--mono);font-size:.55rem;color:var(--muted)}
.modal-hint{margin-top:18px;font-family:var(--mono);font-size:.52rem;color:var(--border2);letter-spacing:.07em;line-height:1.82;font-style:italic}
.modal-close{position:fixed;top:14px;right:18px;z-index:910;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:.65rem;color:var(--dim);border:1px solid var(--border);border-radius:50%;background:var(--surface);transition:all .18s}
.modal-close:hover{color:var(--paper);border-color:var(--border2)}

.full-screen{position:fixed;inset:0;z-index:960;background:var(--ink);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;animation:fadeIn .32s ease}
.fs-flame{font-size:3rem;animation:candleFlame .5s ease-in-out infinite}
.fs-label{font-family:var(--mono);font-size:.65rem;color:var(--ember);letter-spacing:.22em;animation:pulse 1.6s ease infinite}
.fs-note{font-family:var(--mono);font-size:.57rem;color:var(--muted);text-align:center;max-width:240px;line-height:1.92;letter-spacing:.04em}
.done-1{font-family:var(--serif);font-style:italic;font-size:clamp(1.6rem,5vw,2.2rem);color:var(--paper);animation:fadeUp .7s .1s var(--ease) both}
.done-2{font-family:var(--prose);font-style:italic;font-size:clamp(.94rem,2.5vw,1.08rem);color:var(--dim);animation:fadeUp .7s .4s var(--ease) both}

/* ADMIN */
.admin-bar{position:fixed;top:58px;left:0;right:0;z-index:790;height:36px;display:flex;align-items:center;justify-content:center;gap:12px;background:rgba(40,18,4,.96);border-bottom:1px solid var(--emberlo);animation:adminGlow 3s ease-in-out infinite;backdrop-filter:blur(16px)}
@media(max-width:640px){.admin-bar{top:54px}}
.admin-label{font-family:var(--mono);font-size:.54rem;color:var(--ember);letter-spacing:.18em}
.admin-exit{font-family:var(--mono);font-size:.52rem;color:var(--emberlo);padding:3px 9px;border:1px solid var(--emberlo);border-radius:3px;transition:all .18s;letter-spacing:.07em}
.admin-exit:hover{color:var(--ember);border-color:var(--ember)}
.page.has-admin{padding-top:144px}
@media(max-width:640px){.page.has-admin{padding-top:130px}}

/* TWEET POPUP */
.tweet-overlay{position:fixed;inset:0;z-index:950;background:rgba(3,3,8,.93);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:center;padding:24px;animation:fadeIn .22s var(--ease)}
.tweet-card{width:100%;max-width:520px;background:var(--surface);border:1px solid var(--border2);border-radius:12px;padding:28px 28px 24px;animation:tweetPop .3s var(--ease)}
@media(max-width:640px){.tweet-card{padding:22px 18px 20px;border-radius:8px}}
.tweet-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
.tweet-title{font-family:var(--mono);font-size:.56rem;letter-spacing:.14em;color:var(--dim)}
.tweet-close{width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:.64rem;color:var(--dim);border:1px solid var(--border2);border-radius:50%;background:var(--well);transition:all .16s}
.tweet-close:hover{color:var(--paper);border-color:var(--soft)}
.tweet-preview{font-family:var(--prose);font-style:italic;font-weight:300;font-size:1.08rem;color:var(--paper);line-height:1.84;white-space:pre-line;padding:16px;background:var(--well);border:1px solid var(--border);border-radius:6px;margin-bottom:20px}
@media(max-width:640px){.tweet-preview{font-size:1.04rem}}
.tweet-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.tweet-post-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;font-family:var(--serif);font-style:italic;font-weight:500;font-size:1rem;letter-spacing:.1em;color:var(--ink);padding:11px 24px;background:var(--ember);border:1px solid var(--ember);border-radius:100px;transition:all .25s var(--ease)}
.tweet-post-btn:hover{background:var(--emberhi);box-shadow:0 6px 22px rgba(232,151,58,.42);transform:translateY(-1px)}
.tweet-copy-btn{font-family:var(--mono);font-size:.56rem;letter-spacing:.07em;color:var(--dim);padding:10px 16px;border:1px solid var(--border2);border-radius:100px;transition:all .18s;background:transparent}
.tweet-copy-btn:hover{color:var(--soft);border-color:var(--soft)}
.tweet-copy-btn.copied{color:var(--ember);border-color:var(--emberlo)}

/* CHAIN / LORE */
.chain-intro{margin-bottom:52px}
.chain-h1{font-family:var(--serif);font-style:italic;font-weight:300;font-size:clamp(1.6rem,5vw,2.3rem);color:var(--warm);margin-bottom:14px}
.chain-desc{font-family:var(--prose);font-weight:300;font-style:italic;font-size:clamp(.98rem,2vw,1.1rem);color:var(--soft);line-height:2;max-width:420px}
.chain-rule{width:36px;height:1px;background:linear-gradient(to right,var(--emberlo),transparent);margin-top:20px}
.chain-entry{padding:30px 0;border-bottom:1px solid rgba(232,151,58,.06);animation:confIn .65s var(--ease) both}
.chain-entry:first-child{border-top:1px solid rgba(232,151,58,.06)}
.chain-text{font-family:var(--prose);font-style:italic;font-weight:300;line-height:1.94;color:#e2ded4}
@media(max-width:640px){.chain-text{font-size:1.08rem !important}}
.chain-meta{display:flex;align-items:center;gap:10px;margin-top:11px;flex-wrap:wrap}
.chain-time{font-family:var(--mono);font-size:.56rem;color:var(--muted);letter-spacing:.05em}
.chain-tx{display:inline-flex;align-items:center;gap:4px;font-family:var(--mono);font-size:.53rem;color:var(--emberlo);padding:2px 8px;border:1px solid rgba(232,151,58,.13);border-radius:100px;transition:all .18s;letter-spacing:.05em}
.chain-tx:hover{color:var(--ember);border-color:rgba(232,151,58,.38);background:rgba(232,151,58,.04)}
.chain-empty{padding:80px 0;text-align:center}
.chain-e-t{font-family:var(--serif);font-style:italic;font-size:1.18rem;color:var(--muted);margin-bottom:8px}
.chain-e-s{font-family:var(--mono);font-size:.58rem;color:var(--border2);letter-spacing:.09em}
.lore-h1{font-family:var(--serif);font-style:italic;font-weight:300;font-size:clamp(1.5rem,4.5vw,2.1rem);color:var(--warm);margin-bottom:50px;letter-spacing:.03em}
.lore-block{padding:30px 0;border-top:1px solid var(--border)}
.lore-block:first-of-type{border-top:none;padding-top:0}
.lore-p{font-family:var(--prose);font-weight:300;line-height:2.05}
.lore-p.primary{font-size:clamp(1.06rem,2.5vw,1.18rem);font-style:italic;color:var(--paper)}
.lore-p.body{font-size:clamp(.96rem,2vw,1.04rem);color:rgba(192,192,216,.7)}
@media(max-width:640px){.lore-p.primary{font-size:1.12rem}.lore-p.body{font-size:1.02rem}}
.lore-foot{margin-top:58px;padding:26px;border:1px solid var(--border);border-radius:6px;background:var(--well)}
.lore-brand{display:flex;align-items:center;gap:9px;margin-bottom:13px}
.lore-brand-name{font-family:var(--mono);font-size:.6rem;color:var(--dim);letter-spacing:.09em}
.lore-links{display:flex;gap:18px;margin-top:13px;flex-wrap:wrap}
.lore-link{font-family:var(--mono);font-size:.58rem;color:var(--muted);letter-spacing:.08em;transition:color .18s}
.lore-link:hover{color:var(--ember)}
.loading-t{font-family:var(--mono);font-size:.62rem;color:var(--muted);letter-spacing:.12em;padding:48px 0}
.empty-t{font-family:var(--prose);font-style:italic;font-size:1.07rem;color:var(--muted);padding:60px 0;line-height:1.92}
.toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:9999;padding:10px 20px;background:var(--surface);border:1px solid var(--border2);border-radius:3px;font-family:var(--mono);font-size:.62rem;color:var(--soft);letter-spacing:.04em;white-space:nowrap;animation:fadeUp .26s var(--ease)}
@media(max-width:640px){.toast{max-width:88vw;white-space:normal;text-align:center;bottom:90px;font-size:.66rem}}
`;

/* ══════════════════════════════════════════════════
   LIVING CANVAS
   Embers ALWAYS rise. Scroll = impulse burst.
   Tap = ripple rings + spark explosion.
══════════════════════════════════════════════════ */
function LivingCanvas({ mouseRef, scrollRef }) {
  const canvasRef     = useRef(null);
  const raf           = useRef(null);
  const T             = useRef(0);
  const embs          = useRef([]);
  const tapWaves      = useRef([]);
  const tapSparks     = useRef([]);
  const scrollImpulse = useRef(0);

  // Factory — vy is ALWAYS negative (rising), no exceptions
  const mkEmber = useCallback((W, H, scatter = false) => ({
    x:    scatter ? Math.random() * W : Math.random() * W,
    y:    scatter ? Math.random() * H : H + 6 + Math.random() * 30,
    vx:   (Math.random() - .5) * .16,
    vy:   -(Math.random() * .26 + .07),  // ALWAYS NEGATIVE
    r:    Math.random() * 1.35 + .28,
    op:   Math.random() * .5 + .1,
    life: scatter ? Math.random() : .65 + Math.random() * .35,
    dec:  Math.random() * .0008 + .00012,
    hue:  23 + Math.random() * 24,
    wave: Math.random() * Math.PI * 2,
    wAmp: .035 + Math.random() * .07,
    drift: .35 + Math.random() * .65,
  }), []);

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

    // Seed initial embers scattered across full viewport
    embs.current = [];
    for (let i = 0; i < 60; i++) {
      embs.current.push(mkEmber(canvas.width, canvas.height, true));
    }

    const orbs = [
      { cx:.15, cy:.20, r:270, spd:.50, ph:0    },
      { cx:.85, cy:.16, r:205, spd:.76, ph:1.8  },
      { cx:.50, cy:.70, r:340, spd:.38, ph:3.1  },
      { cx:.06, cy:.82, r:180, spd:.92, ph:5.2  },
      { cx:.93, cy:.68, r:230, spd:.62, ph:2.4  },
    ];

    const draw = () => {
      T.current += .006;
      const t  = T.current;
      const W  = canvas.width, H = canvas.height;
      const mx = mouseRef.current.x, my = mouseRef.current.y;

      // Consume scroll delta as a decaying impulse
      if (scrollRef.current.delta !== 0) {
        scrollImpulse.current += scrollRef.current.delta * .18;
        scrollRef.current.delta = 0;
      }
      // Clamp and decay impulse — strong initial kick, fades fast
      scrollImpulse.current = Math.max(-18, Math.min(18, scrollImpulse.current));
      scrollImpulse.current *= .82;

      // Age tap waves
      tapWaves.current = tapWaves.current
        .map(w => ({ ...w, r: w.r + 3.6, opacity: w.opacity * .930 }))
        .filter(w => w.opacity > .008);

      // Age tap sparks — arc upward with gravity
      tapSparks.current = tapSparks.current
        .map(s => ({
          ...s,
          x: s.x + s.vx,
          y: s.y + s.vy,
          vy: s.vy - .032,
          vx: s.vx * .97,
          life: s.life - s.dec,
        }))
        .filter(s => s.life > 0);

      // Clear
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#05050a";
      ctx.fillRect(0, 0, W, H);

      // Breathing orbs
      orbs.forEach(o => {
        const beat  = Math.sin(t * o.spd + o.ph) * .5 + .5;
        const alpha = .026 + beat * .022;
        const rad   = o.r * (.87 + beat * .15);
        const gx    = o.cx * W, gy = o.cy * H;
        const g     = ctx.createRadialGradient(gx, gy, 0, gx, gy, rad);
        g.addColorStop(0,   `hsla(${27 + beat*16},82%,47%,${alpha})`);
        g.addColorStop(.42, `hsla(20,65%,32%,${alpha * .32})`);
        g.addColorStop(1,   "transparent");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      });

      // Mouse glow
      if (mx > 0 && my > 0) {
        const mg = ctx.createRadialGradient(mx, my, 0, mx, my, 300);
        mg.addColorStop(0,   "rgba(232,151,58,.046)");
        mg.addColorStop(.45, "rgba(200,120,40,.013)");
        mg.addColorStop(1,   "transparent");
        ctx.fillStyle = mg; ctx.fillRect(0, 0, W, H);
        const ic = ctx.createRadialGradient(mx, my, 0, mx, my, 82);
        ic.addColorStop(0, "rgba(245,176,80,.07)");
        ic.addColorStop(1, "transparent");
        ctx.fillStyle = ic; ctx.fillRect(0, 0, W, H);
      }

      // Tap ripple rings — two concentric, plus initial bloom
      tapWaves.current.forEach(w => {
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(232,151,58,${w.opacity * .30})`;
        ctx.lineWidth = 1.2; ctx.stroke();

        ctx.beginPath();
        ctx.arc(w.x, w.y, w.r * .62, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(245,176,80,${w.opacity * .13})`;
        ctx.lineWidth = .7; ctx.stroke();

        if (w.r < 25) {
          const ig = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, 28);
          ig.addColorStop(0, `rgba(232,151,58,${w.opacity * .22})`);
          ig.addColorStop(1, "transparent");
          ctx.fillStyle = ig; ctx.fillRect(w.x-28, w.y-28, 56, 56);
        }
      });

      // Tap sparks
      tapSparks.current.forEach(s => {
        const fade = Math.sin(s.life * Math.PI);
        const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3.2);
        sg.addColorStop(0, `hsla(${s.hue},90%,66%,${fade * s.op * .55})`);
        sg.addColorStop(1, "transparent");
        ctx.fillStyle = sg;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue},94%,72%,${fade * s.op})`;
        ctx.fill();
      });

      // ══ EMBERS — the heart of it ══
      const imp = scrollImpulse.current;
      embs.current.forEach((e, i) => {

        // 1. Mouse attraction (very gentle)
        if (mx > 0 && my > 0) {
          const dx = mx - e.x, dy = my - e.y;
          const d  = Math.sqrt(dx*dx + dy*dy);
          if (d < 170 && d > 1) {
            e.vx += (dx / d) * .0022;
            e.vy += (dy / d) * .0009;
          }
        }

        // 2. Scroll impulse — horizontal scatter + vertical acceleration
        //    imp > 0 = scrolling down → embers surge upward faster
        //    imp < 0 = scrolling up   → embers slow slightly
        if (Math.abs(imp) > .05) {
          // Alternate left/right scatter by particle index
          e.vx += imp * (i % 2 === 0 ? 1 : -1) * e.drift * .0012;
          // Boost upward velocity (make vy more negative = faster rise)
          const boost = -imp * e.drift * .0018;
          e.vy += boost;
          // HARD CLAMP: vy must never exceed 0 (no downward drift)
          if (e.vy > -.005) e.vy = -.005;
        }

        // 3. Natural sway + movement
        e.x  += e.vx + Math.sin(t * .85 + e.wave) * e.wAmp;
        e.y  += e.vy;   // vy is always ≤ 0, so always moving UP

        // 4. Velocity decay — vx damps out, vy drifts back to natural rise
        e.vx *= .972;
        // Pull vy toward natural rise speed (lerp)
        const natural = -(Math.random() * .26 + .07);
        e.vy  = e.vy * .984 + natural * .016;
        // SAFETY: never let vy go positive
        if (e.vy > -.002) e.vy = -.002;

        e.life -= e.dec;

        // 5. Respawn from bottom when dead or off-screen
        if (e.life <= 0 || e.y < -20 || e.x < -35 || e.x > W + 35) {
          Object.assign(e, {
            x:    Math.random() * W,
            y:    H + 8 + Math.random() * 28,
            vx:   (Math.random() - .5) * .16,
            vy:   -(Math.random() * .26 + .07),
            life: .7 + Math.random() * .3,
          });
        }

        // 6. Draw
        const fade = Math.min(1, Math.sin(e.life * Math.PI) * 1.35);
        const glow = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 3.4);
        glow.addColorStop(0, `hsla(${e.hue},90%,62%,${fade * e.op * .88})`);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 3.4, 0, Math.PI * 2); ctx.fill();

        ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${e.hue},96%,75%,${fade * Math.min(1, e.op * 1.55)})`;
        ctx.fill();
      });

      // Heat sweep
      const sw = (t * 18) % H;
      const sg = ctx.createLinearGradient(0, sw-4, 0, sw+4);
      sg.addColorStop(0,   "transparent");
      sg.addColorStop(.5,  "rgba(215,148,55,.008)");
      sg.addColorStop(1,   "transparent");
      ctx.fillStyle = sg; ctx.fillRect(0, sw-4, W, 8);

      raf.current = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener("resize", resize); };
  }, []);

  // Tap listener — ripples + spark burst on background taps
  useEffect(() => {
    const spawnBurst = (cx, cy) => {
      tapWaves.current.push({ x: cx, y: cy, r: 0, opacity: 1 });
      const count = 12 + Math.floor(Math.random() * 6);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i / count) + (Math.random() * .5 - .25);
        const spd   = .7 + Math.random() * 2.0;
        tapSparks.current.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 1.4,  // bias upward
          r: .28 + Math.random() * .75,
          op: .5 + Math.random() * .5,
          life: .55 + Math.random() * .45,
          dec: .016 + Math.random() * .014,
          hue: 20 + Math.random() * 28,
        });
      }
    };

    // Also scatter nearby embers on tap
    const scatterEmbers = (cx, cy) => {
      embs.current.forEach(e => {
        const dx = e.x - cx, dy = e.y - cy;
        const d  = Math.sqrt(dx*dx + dy*dy);
        if (d < 120 && d > 1) {
          const force = (120 - d) / 120;
          e.vx += (dx / d) * force * 1.8;
          e.vy += (dy / d) * force * 0.9;
          // After scatter, clamp so they still go up eventually
          if (e.vy > 1.2) e.vy = 1.2; // allow brief downward arc but cap it
        }
      });
    };

    let lastTouch = 0;
    const onPointer = e => {
      if (e.pointerType === "touch") return;
      if (e.target.closest("button,a,input,textarea,select,[role=button]")) return;
      spawnBurst(e.clientX, e.clientY);
      scatterEmbers(e.clientX, e.clientY);
    };
    const onTouch = e => {
      lastTouch = Date.now();
      if (e.target.closest("button,a,input,textarea,select,[role=button]")) return;
      const t = e.touches[0];
      spawnBurst(t.clientX, t.clientY);
      scatterEmbers(t.clientX, t.clientY);
    };

    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("touchstart",  onTouch, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("touchstart",  onTouch);
    };
  }, []);

  return <canvas ref={canvasRef} id="bg-canvas" />;
}

/* ─── CURSOR ─── */
function Cursor({ mouseRef }) {
  const coreRef = useRef(null);
  const ringRef = useRef(null);
  const wrapRef = useRef(null);
  // Ring lags behind core for a trailing effect
  const ringPos = useRef({ x: 0, y: 0 });
  const rafC    = useRef(null);

  useEffect(() => {
    if (isMobile()) return;
    const wrap = wrapRef.current;
    if (!wrap) return;

    const move = e => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      wrap.style.left = e.clientX + "px";
      wrap.style.top  = e.clientY + "px";
    };

    // Animate ring with lerp for trailing effect
    const animate = () => {
      ringPos.current.x += (mouseRef.current.x - ringPos.current.x) * .12;
      ringPos.current.y += (mouseRef.current.y - ringPos.current.y) * .12;
      if (ringRef.current) {
        const dx = mouseRef.current.x - ringPos.current.x;
        const dy = mouseRef.current.y - ringPos.current.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const size = 24 + dist * .8;
        ringRef.current.style.width  = size + "px";
        ringRef.current.style.height = size + "px";
        ringRef.current.style.opacity = Math.max(0, 1 - dist / 80) * .4;
      }
      rafC.current = requestAnimationFrame(animate);
    };
    animate();

    const down = () => document.body.classList.add("cur-click");
    const up   = () => document.body.classList.remove("cur-click");
    const enter = () => document.body.classList.add("cur-hover");
    const leave = () => document.body.classList.remove("cur-hover");

    document.addEventListener("mousemove", move);
    document.addEventListener("mousedown", down);
    document.addEventListener("mouseup",   up);

    const obs = new MutationObserver(() => {
      document.querySelectorAll("button:not([data-c]),a:not([data-c]),[role=button]:not([data-c])").forEach(el => {
        el.setAttribute("data-c", "1");
        el.addEventListener("mouseenter", enter);
        el.addEventListener("mouseleave", leave);
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(rafC.current);
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mousedown", down);
      document.removeEventListener("mouseup",   up);
      obs.disconnect();
    };
  }, []);

  return (
    <div id="cfn-cursor" ref={wrapRef} style={{ width: 7, height: 7 }}>
      <div className="c-core" ref={coreRef} />
      <div className="c-ring" ref={ringRef} style={{ width: 24, height: 24, opacity: .3 }} />
    </div>
  );
}

/* ─── SOLANA ─── */
function useWallet() {
  const [pubkey,     setPubkey]     = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [walletError,setWalletError]= useState(null);
  useEffect(() => {
    const p = window?.phantom?.solana || window?.solana;
    if (p?.isPhantom && p.isConnected && p.publicKey) setPubkey(p.publicKey.toString());
    if (p?.on) {
      const od = () => setPubkey(null);
      const oc = pk => setPubkey(pk.toString());
      p.on("disconnect", od); p.on("connect", oc);
      return () => { p.off?.("disconnect", od); p.off?.("connect", oc); };
    }
  }, []);
  const connect = useCallback(async () => {
    setWalletError(null); setConnecting(true);
    try {
      const p = window?.phantom?.solana || window?.solana;
      if (!p?.isPhantom) {
        if (isMobile()) {
          const u = encodeURIComponent(window.location.href);
          window.location.href = `https://phantom.app/ul/v1/connect?app_url=${u}&redirect_link=${u}&cluster=mainnet-beta`;
          setConnecting(false); return null;
        }
        setWalletError("Phantom not found. Install at phantom.app"); setConnecting(false); return null;
      }
      const r = await p.connect();
      const addr = r.publicKey.toString();
      setPubkey(addr); setConnecting(false); return addr;
    } catch (e) {
      const m = e?.message || "";
      setWalletError(m.includes("rejected") || m.includes("User rejected") ? "Cancelled." : "Connection failed.");
      setConnecting(false); return null;
    }
  }, []);
  return { pubkey, connecting, walletError, connect, setWalletError };
}

async function burnToChain({ pubkey, text, username }) {
  const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, TransactionInstruction } =
    await import("@solana/web3.js");
  const provider = window?.phantom?.solana || window?.solana;
  if (!provider?.isPhantom) throw new Error("Phantom not available");
  if (!provider.publicKey)  throw new Error("Wallet not connected");
  const conn = new Connection(RPC, "confirmed");
  const pk   = new PublicKey(pubkey);
  const bal  = await conn.getBalance(pk);
  const need = Math.round(BURN_SOL * LAMPORTS_PER_SOL) + 12000;
  if (bal < need) { const s = ((need-bal)/LAMPORTS_PER_SOL).toFixed(4); throw new Error(`insufficient_balance:${s}`); }
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");
  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: pk });
  const payload = JSON.stringify({ app:"confessioncoin.xyz", v:2, text:text.trim().slice(0,400), user:username?.trim()||null });
  tx.add(new TransactionInstruction({
    keys: [{ pubkey: pk, isSigner: true, isWritable: false }],
    programId: new PublicKey(MEMO),
    data: Buffer.from(payload, "utf-8"),
  }));
  tx.add(SystemProgram.transfer({ fromPubkey:pk, toPubkey:pk, lamports:Math.round(BURN_SOL*LAMPORTS_PER_SOL) }));
  const signed = await provider.signTransaction(tx);
  const sig = await conn.sendRawTransaction(signed.serialize(), { skipPreflight:false, preflightCommitment:"confirmed" });
  await conn.confirmTransaction({ signature:sig, blockhash, lastValidBlockHeight }, "confirmed");
  return sig;
}

/* ─── TWEET POPUP ─── */
function TweetPopup({ confession, num, onClose }) {
  const [copied, setCopied] = useState(false);
  const text = buildTweet(confession, num);
  const url  = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  return (
    <div className="tweet-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="tweet-card">
        <div className="tweet-header">
          <span className="tweet-title">POST TO X — #{num}</span>
          <button className="tweet-close" onClick={onClose} type="button">✕</button>
        </div>
        <div className="tweet-preview">{text}</div>
        <div className="tweet-actions">
          <a href={url} target="_blank" rel="noopener noreferrer" className="tweet-post-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            Open in X to post
          </a>
          <button className={`tweet-copy-btn${copied?" copied":""}`} type="button"
            onClick={() => { navigator.clipboard.writeText(text).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); }}>
            {copied ? "copied ✓" : "copy text"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── SHARED COMPONENTS ─── */
function FloatParticle({ emoji, x, y, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 1000); return () => clearTimeout(t); }, [onDone]);
  return <div className="float-p" style={{ left:x, top:y, transform:"translate(-50%,-50%)" }}>{emoji}</div>;
}
function CopyCA() {
  const [copied, setCopied] = useState(false);
  return (
    <div className={`ca-block${copied?" copied":""}`}
      onClick={() => { navigator.clipboard.writeText(CA).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); }}>
      <span className="ca-tick">$CFN</span>
      <span className="ca-divider"/>
      <span className="ca-addr">{CA}</span>
      <span className="ca-copy">{copied ? "✓" : "⎘"}</span>
    </div>
  );
}
function Navbar({ page, setPage, soundOn, toggleSound, onConfess }) {
  return (
    <nav className="nav">
      <div className="nav-brand" onClick={() => setPage("wall")}>
        <img src="/logo.png" alt="ConfessCoin" onError={e=>e.target.style.display="none"}/>
        <span className="nav-brand-name">CONFESS</span>
      </div>
      <div className="nav-center">
        <span className={`nav-lk${page==="wall"?" on":""}`} onClick={()=>setPage("wall")}>The Wall</span>
        <span className={`nav-lk${page==="chain"?" chain-on":""}`} onClick={()=>setPage("chain")}>⛓ On‑Chain</span>
        <span className={`nav-lk${page==="lore"?" on":""}`} onClick={()=>setPage("lore")}>Why This Exists</span>
      </div>
      <div className="nav-right">
        <a href={SOCIAL.x} target="_blank" rel="noopener noreferrer" className="nav-ico">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
        <a href={SOCIAL.github} target="_blank" rel="noopener noreferrer" className="nav-ico">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>
        </a>
        <div className="nav-sep"/>
        <button className="nav-ico" onClick={toggleSound} style={{fontSize:".78rem",opacity:soundOn?1:.28,transition:"opacity .25s"}}>{soundOn?"🔔":"🔕"}</button>
        <div className="nav-sep"/>
        <button className="nav-confess" onClick={onConfess}>
          <span style={{animation:"candleFlame 3s ease-in-out infinite",display:"inline-block"}}>🕯️</span>confess
        </button>
      </div>
    </nav>
  );
}
function MobileNav({ page, setPage, onConfess }) {
  return (
    <div className="mob-nav">
      <div className={`mob-item${page==="wall"?" on":""}`} onClick={()=>setPage("wall")}>
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/></svg>Wall
      </div>
      <div className={`mob-item${page==="chain"?" on":""}`} onClick={()=>setPage("chain")}>
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>Chain
      </div>
      <div className="mob-confess-btn" onClick={onConfess}>
        <div className="mob-confess-icon">🕯️</div>confess
      </div>
      <div className={`mob-item${page==="lore"?" on":""}`} onClick={()=>setPage("lore")}>
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Why
      </div>
      <div className="mob-item" onClick={()=>navigator.clipboard.writeText(CA).catch(()=>{})}>
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>$CFN
      </div>
    </div>
  );
}

function ReactionBar({ confId, rxData, setParticles }) {
  const [local,  setLocal]  = useState({...rxData});
  const [active, setActive] = useState(() => getRx()[confId] || null);
  const [ripple, setRipple] = useState(null);
  const synced = useRef(false);
  useEffect(() => { if (!synced.current) { setLocal({...rxData}); synced.current = true; } }, [rxData]);

  const tap = useCallback(async (key, e) => {
    e?.stopPropagation();
    const prev = active, store = getRx(), next = {...local};
    if (prev === key) {
      next[key] = Math.max(0, (next[key]||0) - 1);
      setActive(null); delete store[confId];
    } else {
      if (prev) next[prev] = Math.max(0, (next[prev]||0) - 1);
      next[key] = (next[key]||0) + 1;
      setActive(key); store[confId] = key;
      setRipple(key); setTimeout(() => setRipple(null), 480);
      if (e && setParticles) {
        const r  = e.target.getBoundingClientRect();
        const em = REACTIONS.find(r => r.key === key)?.emoji;
        setParticles(ps => [...ps, { id: Date.now(), emoji: em, x: r.left + r.width/2, y: r.top }]);
      }
    }
    setLocal(next); setRx(store);
    try {
      const upd = {};
      if (prev === key) { upd[`reactions.${key}`] = Math.max(0, (rxData[key]||0) - 1); }
      else { if (prev) upd[`reactions.${prev}`] = Math.max(0, (rxData[prev]||0) - 1); upd[`reactions.${key}`] = (rxData[key]||0) + 1; }
      await updateDoc(doc(db, "confessions", confId), upd);
    } catch (err) { console.error("rx", err); }
  }, [active, confId, local, rxData, setParticles]);

  return (
    <div className="react-bar" onClick={e => e.stopPropagation()}>
      {REACTIONS.map(r => (
        <button key={r.key} className={`react-btn${active===r.key?" on":""}`}
          title={r.label} onClick={e => tap(r.key, e)} type="button">
          {ripple === r.key && <span className="react-ripple"/>}
          <span className="react-emoji">{r.emoji}</span>
          <span>{local[r.key]||0}</span>
        </button>
      ))}
    </div>
  );
}

function Card({ data, idx=0, total=1, setParticles, isAdmin=false, onAdminTap }) {
  const sz  = ["whisper","normal","scream"].includes(data.size) ? data.size : "normal";
  const cat = data.category ? CATEGORIES.find(c => c.key === data.category) : null;
  const isNew = data.timestamp?.toMillis && (Date.now() - data.timestamp.toMillis()) < 12000;
  // Oldest confession = 001, newest = highest number
  const displayNum = padNum(total - idx, total);

  return (
    <div
      className={`card ${sz}-card${data.burned?" burned-card":""}${isAdmin?" admin-mode":""}`}
      style={{ animationDelay: `${Math.min(idx * .045, .55)}s` }}
      onClick={() => { if (isAdmin && onAdminTap) onAdminTap(data, displayNum); }}
    >
      {isAdmin && <span className="card-tweet-hint">TAP TO POST TO X</span>}
      <div className="card-bg"/>
      <div className="card-num">{displayNum}</div>
      <div className="card-header">
        {data.username && <span className="card-user">{data.username}</span>}
        {cat && <span className="card-cat-badge" title={cat.label}>{cat.emoji}</span>}
      </div>
      <p className="card-text">{data.text}</p>
      <div className="card-foot">
        <span className="card-time">{timeAgo(data.timestamp)}</span>
        {isNew && <span className="card-live"><span className="live-dot"/>LIVE</span>}
        {data.burned && data.txHash && (
          <a href={`https://solscan.io/tx/${data.txHash}`} target="_blank" rel="noopener noreferrer"
            className="chain-pill" onClick={e => e.stopPropagation()}>
            <span style={{animation:"candleFlame 3s infinite",display:"inline-block"}}>🔥</span>
            {shortAddr(data.txHash)}
          </a>
        )}
      </div>
      <div onClick={e => e.stopPropagation()}>
        <ReactionBar confId={data.id} rxData={data.reactions||{}} setParticles={setParticles}/>
      </div>
    </div>
  );
}

function ConfessModal({ onClose, onDone, setToast, onAdminLogin }) {
  const [text,     setText]    = useState("");
  const [username, setUsername]= useState("");
  const [sliderV,  setSliderV] = useState(50);
  const [category, setCategory]= useState("");
  const [burn,     setBurn]    = useState(false);
  const [phase,    setPhase]   = useState("write");
  const taRef = useRef(null);
  const sz = sizeKey(sliderV);
  const { pubkey, connecting, walletError, connect, setWalletError } = useWallet();

  useEffect(() => {
    setTimeout(() => taRef.current?.focus(), 80);
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleBurn = async () => {
    const next = !burn; setBurn(next); setWalletError(null);
    if (next && !pubkey) await connect();
  };

  const submit = async () => {
    if (text.trim().length < 3) return;
    // Silent admin unlock
    if (username.trim() === ADMIN_USER && text.trim() === ADMIN_PASS) {
      onAdminLogin(); onClose(); return;
    }
    let txHash = null, burned = false;
    if (burn) {
      let addr = pubkey;
      if (!addr) { addr = await connect(); if (!addr) { setToast("Connect Phantom first"); return; } }
      setPhase("burning");
      try {
        txHash = await burnToChain({ pubkey: addr, text, username });
        burned = true;
      } catch (e) {
        const m = e?.message || "";
        if (m.startsWith("insufficient_balance:")) setToast(`Need ~${m.split(":")[1]} more SOL`);
        else if (m.includes("rejected") || m.includes("User rejected")) setToast("Transaction cancelled.");
        else { setToast("On-chain failed. Saving anyway."); console.error(e); }
        setPhase("write"); setBurn(false); return;
      }
    }
    try {
      await addDoc(collection(db, "confessions"), {
        text: text.trim(), username: username.trim() || null,
        size: sz, category: category || null,
        burned, txHash: txHash || null,
        timestamp: serverTimestamp(),
        reactions: { candle:0, heavy:0, eye:0, fire:0, grave:0 },
      });
    } catch (e) { console.error(e); setToast("Could not save. Check connection."); setPhase("write"); return; }
    setPhase("done");
    setTimeout(onDone, 2600);
  };

  if (phase === "burning") return (
    <div className="full-screen">
      <div className="fs-flame">🔥</div>
      <p className="fs-label">WRITING TO SOLANA</p>
      <p className="fs-note">Your words are being permanently inscribed. This cannot be undone.</p>
    </div>
  );
  if (phase === "done") return (
    <div className="full-screen">
      <p className="done-1">it's gone.</p>
      <p className="done-2">you're lighter now.</p>
    </div>
  );

  return (
    <>
      <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal-scroll"><div className="modal-inner">
          <div className="modal-header">
            <span className="modal-rule"/>
            <span className="modal-eyebrow">secrets are better shared</span>
            <span className="modal-rule"/>
          </div>
          <div className="uname-row">
            <span className="uname-prefix">~</span>
            <input type="text" className="uname-input" placeholder="anonymous handle (optional)"
              maxLength={24} value={username} onChange={e=>setUsername(e.target.value.replace(/\s/g,""))}/>
          </div>
          <div className="ta-wrap">
            <textarea ref={taRef} value={text} onChange={e=>setText(e.target.value)}
              maxLength={1200} rows={6} className={`modal-ta ${sz}`} placeholder=" "/>
            {!text && <span className="ta-cursor blink" style={{fontSize:sz==="whisper"?"1rem":sz==="scream"?"1.52rem":"1.16rem"}}>|</span>}
          </div>
          <div className="modal-sec">
            <div className="sec-label"><span className="sec-t">INTENSITY</span><span className="sec-v">{sz.toUpperCase()}</span></div>
            <input type="range" min="0" max="100" value={sliderV} style={{"--pct":`${sliderV}%`}}
              onChange={e=>setSliderV(+e.target.value)} className="slider"/>
            <div className="slider-ends"><span className="slider-end">whisper</span><span className="slider-end">scream</span></div>
          </div>
          <div className="modal-sec">
            <div className="sec-label"><span className="sec-t">CATEGORY</span><span className="sec-v" style={{color:"var(--border2)"}}>optional</span></div>
            <div className="cats">{CATEGORIES.map(c=>(
              <button key={c.key} className={`cat-btn${category===c.key?" on":""}`}
                type="button" onClick={()=>setCategory(category===c.key?"":c.key)}>
                {c.emoji} {c.label}
              </button>
            ))}</div>
          </div>
          <div className={`burn-box${burn?" on":""}`} onClick={handleBurn}>
            <div className="burn-row">
              <input type="checkbox" checked={burn} readOnly className="burn-cb" onClick={e=>e.stopPropagation()}/>
              <div style={{flex:1}}>
                <p className="burn-title">🔥 Burn this to chain forever</p>
                <p className="burn-sub">0.01 SOL · permanently on Solana · immutable · nobody can delete it</p>
                {burn && (
                  <div className="wallet-row" onClick={e=>e.stopPropagation()}>
                    {pubkey ? <span className="wallet-badge"><span className="wallet-dot"/>{shortAddr(pubkey)}</span>
                      : connecting ? <span style={{fontFamily:"var(--mono)",fontSize:".55rem",color:"var(--dim)"}}>connecting<span className="blink">_</span></span>
                      : <button className="connect-btn" type="button" onClick={async e=>{e.stopPropagation();await connect();}}>Connect Phantom →</button>}
                    {walletError && <p className="wallet-err">{walletError}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="submit-row">
            <button className="release-btn" type="button" onClick={submit}
              disabled={text.trim().length < 3 || (burn && !pubkey)}>release it</button>
            <span className="char-cnt">{text.length} / 1200</span>
          </div>
          <p className="modal-hint">your words live here. or forever on-chain.</p>
        </div></div>
      </div>
      <button className="modal-close" type="button" onClick={onClose}>✕</button>
    </>
  );
}

function WallPage({ setParticles, isAdmin, onAdminTap }) {
  const [confessions,  setConfessions]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filterOpen,   setFilterOpen]   = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [search,       setSearch]       = useState("");

  useEffect(() => {
    const q = query(collection(db,"confessions"), orderBy("timestamp","desc"), limit(80));
    const unsub = onSnapshot(q, snap => {
      setConfessions(snap.docs.map(d => ({id:d.id,...d.data()})));
      setLoading(false);
    }, err => { console.error(err); setLoading(false); });
    return unsub;
  }, []);

  const list = useMemo(() => {
    let l = confessions;
    if (activeFilter) l = l.filter(c => c.category === activeFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const total = confessions.length;
      l = l.filter(c => {
        const idx = confessions.indexOf(c);
        const num = padNum(total - idx, total);
        // Match by padded number OR stripped number OR text/username
        return (
          num === search.trim().padStart(num.length, "0") ||
          num.replace(/^0+/,"") === search.trim().replace(/^0+/,"") ||
          c.username?.toLowerCase().includes(q) ||
          c.text?.toLowerCase().includes(q)
        );
      });
    }
    return l;
  }, [confessions, activeFilter, search]);

  const activeCat = CATEGORIES.find(c => c.key === activeFilter);
  const total     = confessions.length;

  return (
    <div className={`page${isAdmin?" has-admin":""}`}>
      <div className="hero fade-up">
        <div className="hero-eyebrow">THE WALL</div>
        <h1 className="hero-title">Every secret<br/>deserves a witness.</h1>
        <p className="hero-sub">
          Anonymous confessions from the edge of the internet.<br/>
          Some will burn to chain. None will be forgotten.
        </p>
        <div className="hero-meta">
          <span className="hero-count"><span className="live-dot"/>{list.length} confession{list.length!==1?"s":""}</span>
          <CopyCA/>
        </div>
      </div>

      <div className="controls">
        <button className={`ctrl-btn${filterOpen||activeFilter?" on":""}`}
          type="button" onClick={()=>setFilterOpen(f=>!f)}>
          {activeCat ? `${activeCat.emoji} ${activeCat.label}` : "⊞ filter"}
        </button>
        {activeFilter && <button className="ctrl-btn" type="button" onClick={()=>{setActiveFilter(null);setFilterOpen(false)}}>× clear</button>}
      </div>
      {filterOpen && (
        <div className="fstrip">
          <button className={`fchip${!activeFilter?" on":""}`} type="button" onClick={()=>{setActiveFilter(null);setFilterOpen(false)}}>all</button>
          {CATEGORIES.map(cat=>(
            <button key={cat.key} type="button" className={`fchip${activeFilter===cat.key?" on":""}`}
              onClick={()=>{setActiveFilter(cat.key);setFilterOpen(false)}}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      )}

      <div className="search-wrap">
        <span className="search-icon">⌕</span>
        <input type="text" className="search-input"
          placeholder="search by number (001), keyword, or username…"
          value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      {loading ? (
        <p className="loading-t">reading the wall<span className="blink">_</span></p>
      ) : list.length === 0 ? (
        <p className="empty-t">
          {search ? `Nothing found for "${search}".` : activeFilter ? "Nothing in this category yet." : "The wall is empty. Say something real."}
        </p>
      ) : (
        list.map(c => (
          <Card key={c.id} data={c} idx={confessions.indexOf(c)} total={total}
            setParticles={setParticles} isAdmin={isAdmin} onAdminTap={onAdminTap}/>
        ))
      )}
    </div>
  );
}

function ChainPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const q = query(collection(db,"confessions"), where("burned","==",true), orderBy("timestamp","desc"), limit(100));
    const unsub = onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => ({id:d.id,...d.data()})));
      setLoading(false);
    }, err => { console.error(err); setLoading(false); });
    return unsub;
  }, []);
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
      {loading ? <p className="loading-t">reading the chain<span className="blink">_</span></p>
      : entries.length === 0 ? (
        <div className="chain-empty">
          <p className="chain-e-t">The chain is silent.</p>
          <p className="chain-e-s">Be the first to burn something into eternity.</p>
        </div>
      ) : entries.map((e,i) => {
        const sz = ["whisper","normal","scream"].includes(e.size) ? e.size : "normal";
        return (
          <div key={e.id} className="chain-entry" style={{animationDelay:`${i*.05}s`}}>
            {e.username && <div className="card-user" style={{marginBottom:7}}>{e.username}</div>}
            <p className={`chain-text ${sz}`}>{e.text}</p>
            <div className="chain-meta">
              <span className="chain-time">{timeAgo(e.timestamp)}</span>
              {e.txHash && (
                <a href={`https://solscan.io/tx/${e.txHash}`} target="_blank" rel="noopener noreferrer" className="chain-tx">
                  <span style={{animation:"candleFlame 3s infinite",display:"inline-block"}}>🔥</span>{shortAddr(e.txHash)} →
                </a>
              )}
              {e.category && <span style={{fontSize:".72rem",opacity:.5}}>{CATEGORIES.find(c=>c.key===e.category)?.emoji}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LorePage() {
  const paras = [
    { t:"In 2014, someone built ConfessionCoin. They let people write their sins on the Bitcoin blockchain forever. It died. Nobody built it again. Until now.", primary:true },
    { t:"Every platform you've ever used was designed to make you more visible. More legible. More monetizable. This wants nothing from you. You are no one here. Your confession is everything." },
    { t:"The internet never gave people a real place to say the thing. Not to perform it. Not to be brave publicly. Not to build an audience with it. Just to say it — and have it witnessed by strangers who will never know who you are." },
    { t:"The blockchain isn't a gimmick. It's a promise. On-chain confessions can't be deleted by a company, a government, a moderator, or a moment of regret. Some things need to last forever." },
    { t:"We're not building a community. We're building a wall. A very old, very dark, very honest wall. Come and write on it." },
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
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) { ref.current = new Audio("/thesound.mp3"); ref.current.loop = true; ref.current.volume = .13; }
    on ? ref.current.play().catch(()=>{}) : ref.current.pause();
  }, [on]);
}
function Toast({ msg, gone }) {
  useEffect(() => { const t = setTimeout(gone, 3600); return () => clearTimeout(t); }, [gone]);
  return <div className="toast">{msg}</div>;
}

export default function App() {
  const [page,        setPage]        = useState("wall");
  const [modal,       setModal]       = useState(false);
  const [sound,       setSound]       = useState(false);
  const [toast,       setToast]       = useState(null);
  const [particles,   setParticles]   = useState([]);
  const [isAdmin,     setIsAdmin]     = useState(false);
  const [tweetTarget, setTweetTarget] = useState(null);
  const mouseRef  = useRef({ x:0, y:0 });
  const scrollRef = useRef({ delta:0, last:0 });

  useAmbient(sound);

  useEffect(() => {
    const onScroll = () => {
      const cur = window.scrollY;
      scrollRef.current.delta = cur - scrollRef.current.last;
      scrollRef.current.last  = cur;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openConfess    = useCallback(() => setModal(true), []);
  const closeModal     = useCallback(() => setModal(false), []);
  const onDone         = useCallback(() => { setModal(false); setPage("wall"); }, []);
  const removeParticle = useCallback(id => setParticles(ps => ps.filter(p => p.id !== id)), []);
  const onAdminLogin   = useCallback(() => { setIsAdmin(true); setToast("Admin mode active."); }, []);
  const exitAdmin      = useCallback(() => setIsAdmin(false), []);
  const onAdminTap     = useCallback((confession, num) => setTweetTarget({ confession, num }), []);

  return (
    <>
      <style>{CSS}</style>
      <LivingCanvas mouseRef={mouseRef} scrollRef={scrollRef}/>
      <div className="grain"/>
      <div className="vig"/>
      <div className="scanline"/>
      <Cursor mouseRef={mouseRef}/>

      {particles.map(p => (
        <FloatParticle key={p.id} emoji={p.emoji} x={p.x} y={p.y} onDone={() => removeParticle(p.id)}/>
      ))}

      <div id="app-root">
        <Navbar page={page} setPage={setPage} soundOn={sound} toggleSound={() => setSound(s=>!s)} onConfess={openConfess}/>

        {isAdmin && (
          <div className="admin-bar">
            <span className="admin-label">⚡ ADMIN — TAP ANY CONFESSION TO POST</span>
            <button className="admin-exit" type="button" onClick={exitAdmin}>EXIT</button>
          </div>
        )}

        {page === "wall"  && <WallPage  setParticles={setParticles} isAdmin={isAdmin} onAdminTap={onAdminTap}/>}
        {page === "chain" && <ChainPage/>}
        {page === "lore"  && <LorePage/>}

        <MobileNav page={page} setPage={setPage} onConfess={openConfess}/>
      </div>

      {modal && (
        <ConfessModal onClose={closeModal} onDone={onDone} setToast={setToast} onAdminLogin={onAdminLogin}/>
      )}
      {tweetTarget && (
        <TweetPopup confession={tweetTarget.confession} num={tweetTarget.num} onClose={() => setTweetTarget(null)}/>
      )}
      {toast && <Toast msg={toast} gone={() => setToast(null)}/>}
    </>
  );
}