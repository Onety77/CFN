import { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, addDoc, query, orderBy,
  limit, onSnapshot, updateDoc, doc, serverTimestamp, where
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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const CONTRACT_ADDRESS = "PASTE_YOUR_CA_HERE";
const BURN_SOL = 0.01;

const REACTIONS = [
  { key: "candle", emoji: "🕯️", label: "I've felt this" },
  { key: "heavy",  emoji: "🪨", label: "heavy" },
  { key: "eye",    emoji: "👁️", label: "I see you" },
  { key: "fire",   emoji: "🔥", label: "burn it on-chain" },
  { key: "grave",  emoji: "💀", label: "take it to the grave" },
];

const CATEGORIES = [
  { key: "crypto",  emoji: "💸", label: "Money & Crypto" },
  { key: "love",    emoji: "❤️",  label: "Love & Betrayal" },
  { key: "family",  emoji: "👨‍👩‍👧", label: "Family" },
  { key: "self",    emoji: "🪞", label: "Things I did to myself" },
  { key: "online",  emoji: "🌐", label: "Things I did online" },
  { key: "unsaid",  emoji: "☠️", label: "Never say out loud" },
  { key: "good",    emoji: "✨", label: "Ashamed to feel good about" },
];

const SOCIALS = {
  x:         "https://x.com/confessioncoin",
  community: "https://x.com/i/communities/confessioncoin",
  github:    "https://github.com/confessioncoin/confessioncoin",
};

// ─────────────────────────────────────────────────────────────────────────────
// CSS INJECTION
// ─────────────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Cormorant+SC:wght@300;400;500&family=DM+Mono:ital,wght@0,300;0,400;1,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:         #080807;
    --bg1:        #0d0d0b;
    --bg2:        #121210;
    --bg3:        #1a1a17;
    --surface:    #1f1f1c;
    --border:     rgba(255,255,255,0.06);
    --border2:    rgba(255,255,255,0.1);
    --paper:      #ede8dc;
    --paper2:     #c8c2b4;
    --paper3:     #7a7570;
    --amber:      #c8922a;
    --amber2:     #e0a83a;
    --amber-glow: rgba(200,146,42,0.15);
    --amber-dim:  rgba(200,146,42,0.4);
    --serif:      'Cormorant Garamond', Georgia, serif;
    --serif-sc:   'Cormorant SC', Georgia, serif;
    --mono:       'DM Mono', 'Courier New', monospace;
    --radius:     3px;
    --nav-h:      64px;
    --ca-h:       34px;
  }

  html { scroll-behavior: smooth; font-size: 16px; }

  body {
    background: var(--bg);
    color: var(--paper);
    font-family: var(--serif);
    min-height: 100vh;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Grain */
  body::after {
    content: '';
    position: fixed; inset: 0; z-index: 9998;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23n)' opacity='0.055'/%3E%3C/svg%3E");
    background-size: 200px 200px;
    mix-blend-mode: overlay;
  }

  /* Vignette */
  body::before {
    content: '';
    position: fixed; inset: 0; z-index: 9997;
    pointer-events: none;
    background: radial-gradient(ellipse at center, transparent 40%, rgba(4,4,3,0.65) 100%);
  }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--amber-dim); }
  ::selection { background: var(--amber); color: var(--bg); }

  button { cursor: pointer; border: none; background: none; font-family: inherit; color: inherit; }
  a { color: inherit; text-decoration: none; }
  textarea, input { font-family: inherit; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes flicker {
    0%,100% { opacity:1 }
    41%     { opacity:1 }
    42%     { opacity:.72 }
    43%     { opacity:1 }
    80%     { opacity:.88 }
    81%     { opacity:1 }
  }
  @keyframes blink { 50% { opacity: 0; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse {
    0%,100% { opacity:.5 }
    50%     { opacity:1 }
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes modalIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes burnPulse {
    0%,100% { box-shadow: 0 0 24px rgba(200,146,42,0.18), 0 0 60px rgba(200,146,42,0.05); }
    50%     { box-shadow: 0 0 36px rgba(200,146,42,0.32), 0 0 80px rgba(200,146,42,0.1); }
  }
  @keyframes shimmer {
    from { background-position: -200% 0; }
    to   { background-position: 200% 0; }
  }

  .flicker { animation: flicker 5s ease-in-out infinite; }
  .blink   { animation: blink 1.1s step-end infinite; }
  .pulse   { animation: pulse 2s ease-in-out infinite; }

  /* Range input */
  input[type=range] {
    -webkit-appearance: none;
    width: 100%; height: 2px;
    background: var(--border2);
    border-radius: 1px;
    outline: none; cursor: pointer;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px; height: 16px;
    background: var(--amber);
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.15s;
  }
  input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.2); }
  input[type=range]::-moz-range-thumb {
    width: 16px; height: 16px;
    background: var(--amber);
    border-radius: 50%; border: none;
    cursor: pointer;
  }

  /* Skeleton shimmer */
  .skeleton {
    background: linear-gradient(90deg, var(--bg2) 25%, var(--bg3) 50%, var(--bg2) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 2px;
  }

  /* Nav link hover */
  .nav-item { transition: color 0.22s; }
  .nav-item:hover { color: var(--paper) !important; }

  /* Responsive: hide/show */
  @media (max-width: 768px) {
    .desktop-only { display: none !important; }
    :root { --nav-h: 56px; --ca-h: 30px; }
  }
  @media (min-width: 769px) {
    .mobile-only { display: none !important; }
  }
`;

function GlobalStyles() {
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts?.toMillis) return "just now";
  const s = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (s < 5)    return "just now";
  if (s < 60)   return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function sizeToFontSize(size) {
  return { whisper: "0.8rem", normal: "1.08rem", scream: "1.55rem" }[size] || "1.08rem";
}
function sizeToLineHeight(size) {
  return { whisper: 1.65, normal: 1.85, scream: 1.7 }[size] || 1.85;
}
function shortAddr(a) {
  return a ? `${a.slice(0,5)}…${a.slice(-4)}` : "";
}

// Per-session reaction state (one reaction per confession per session)
const sessionReactions = new Map(); // confessionId -> reacted key | null

// ─────────────────────────────────────────────────────────────────────────────
// AMBIENT AUDIO
// ─────────────────────────────────────────────────────────────────────────────
function useAmbient(on) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) {
      ref.current = new Audio("/thesound.mp3");
      ref.current.loop = true;
      ref.current.volume = 0.13;
    }
    if (on) ref.current.play().catch(() => {});
    else    ref.current.pause();
  }, [on]);
}

// ─────────────────────────────────────────────────────────────────────────────
// COPY HOOK
// ─────────────────────────────────────────────────────────────────────────────
function useCopy(text) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }, [text]);
  return [copied, copy];
}

// ─────────────────────────────────────────────────────────────────────────────
// NAV
// ─────────────────────────────────────────────────────────────────────────────
function Nav({ page, setPage, sound, setSound, onConfess }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const go = (p) => { setPage(p); setMobileOpen(false); };

  const navLinks = [
    { key: "wall",  label: "THE WALL" },
    { key: "chain", label: "ON-CHAIN" },
    { key: "lore",  label: "WHY THIS EXISTS" },
  ];

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        height: "var(--nav-h)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(16px, 4vw, 48px)",
        background: scrolled ? "rgba(8,8,7,0.96)" : "rgba(8,8,7,0.3)",
        borderBottom: `1px solid ${scrolled ? "var(--border)" : "transparent"}`,
        transition: "background 0.4s, border-color 0.4s",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}>
        {/* Logo */}
        <button onClick={() => go("wall")} style={{
          display: "flex", alignItems: "center", gap: "10px",
          flexShrink: 0,
        }}>
          <img src="/logo.png" alt="ConfessCoin" style={{ height: "28px", width: "auto" }}
            onError={e => e.target.style.display = "none"} />
          <span style={{
            fontFamily: "var(--serif-sc)", fontWeight: 300,
            fontSize: "clamp(0.8rem,2.5vw,1rem)", letterSpacing: "0.2em", color: "var(--paper)",
          }}>CONFESS</span>
        </button>

        {/* Desktop right side */}
        <div className="desktop-only" style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          {navLinks.map(l => (
            <button key={l.key} onClick={() => go(l.key)} className="nav-item" style={{
              fontFamily: "var(--mono)", fontSize: "0.6rem", letterSpacing: "0.13em",
              color: page === l.key ? "var(--amber)" : "var(--paper3)",
              paddingBottom: "2px",
              borderBottom: `1px solid ${page === l.key ? "var(--amber)" : "transparent"}`,
              transition: "color 0.22s, border-color 0.22s",
            }}>{l.label}</button>
          ))}

          <div style={{ width: "1px", height: "16px", background: "var(--border2)" }} />

          <SocialIcons />

          <button onClick={() => setSound(s => !s)} title={sound ? "Mute" : "Ambient sound"}
            style={{ fontSize: "0.8rem", opacity: sound ? 1 : 0.3, transition: "opacity 0.3s", lineHeight: 1 }}>
            {sound ? "🔔" : "🔕"}
          </button>

          <button onClick={onConfess} style={{
            fontFamily: "var(--serif-sc)", fontWeight: 400,
            fontSize: "0.62rem", letterSpacing: "0.2em",
            color: "var(--bg)", background: "var(--amber)",
            padding: "10px 24px", borderRadius: "var(--radius)",
            transition: "background 0.2s, transform 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--amber2)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--amber)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >CONFESS</button>
        </div>

        {/* Mobile right side */}
        <div className="mobile-only" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={onConfess} style={{
            fontFamily: "var(--serif-sc)", fontSize: "0.6rem", letterSpacing: "0.15em",
            color: "var(--bg)", background: "var(--amber)", padding: "8px 18px", borderRadius: "var(--radius)",
          }}>CONFESS</button>
          <button onClick={() => setMobileOpen(o => !o)} style={{ color: "var(--paper)", padding: "4px", display: "flex" }}>
            {mobileOpen
              ? <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
              : <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
            }
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          position: "fixed", top: "var(--nav-h)", left: 0, right: 0, zIndex: 999,
          background: "rgba(8,8,7,0.98)",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(24px)",
          padding: "16px clamp(16px,4vw,48px) 28px",
          animation: "fadeIn 0.2s ease",
        }}>
          {navLinks.map(l => (
            <button key={l.key} onClick={() => go(l.key)} style={{
              fontFamily: "var(--mono)", fontSize: "0.72rem", letterSpacing: "0.14em",
              color: page === l.key ? "var(--amber)" : "var(--paper2)",
              display: "block", width: "100%", textAlign: "left",
              padding: "18px 0", borderBottom: "1px solid var(--border)",
            }}>{l.label}</button>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginTop: "20px" }}>
            <SocialIcons />
            <button onClick={() => setSound(s => !s)} style={{ fontSize: "0.8rem", opacity: sound ? 1 : 0.3 }}>
              {sound ? "🔔" : "🔕"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function SocialIcons() {
  return (
    <>
      {[
        {
          href: SOCIALS.x, title: "X / Twitter",
          icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        },
        {
          href: SOCIALS.community, title: "X Community",
          icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        },
        {
          href: SOCIALS.github, title: "GitHub",
          icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>
        },
      ].map(s => (
        <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" title={s.title}
          className="nav-item" style={{ color: "var(--paper3)", display: "flex", alignItems: "center" }}>
          {s.icon}
        </a>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CA BAR
// ─────────────────────────────────────────────────────────────────────────────
function CABar() {
  const [copied, copy] = useCopy(CONTRACT_ADDRESS);
  return (
    <div style={{
      position: "fixed", top: "var(--nav-h)", left: 0, right: 0, zIndex: 998,
      height: "var(--ca-h)",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg1)",
      borderBottom: "1px solid var(--border)",
    }}>
      <button onClick={copy} style={{
        display: "flex", alignItems: "center", gap: "10px",
        fontFamily: "var(--mono)", fontSize: "clamp(0.5rem,1.5vw,0.58rem)",
        letterSpacing: "0.08em",
        color: copied ? "var(--amber)" : "var(--paper3)",
        transition: "color 0.3s",
        maxWidth: "calc(100vw - 32px)",
      }}>
        <span style={{
          background: "rgba(200,146,42,0.12)", color: "var(--amber)",
          padding: "2px 8px", borderRadius: "2px",
          fontSize: "clamp(0.48rem,1.4vw,0.55rem)", letterSpacing: "0.12em", flexShrink: 0,
        }}>$CFN</span>
        <span style={{
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          maxWidth: "clamp(100px,40vw,340px)",
        }}>{CONTRACT_ADDRESS}</span>
        <span style={{ flexShrink: 0, opacity: 0.65 }}>{copied ? "✓ copied" : "⎘ copy"}</span>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REACTION BAR  — one reaction per confession, toggles, switches
// ─────────────────────────────────────────────────────────────────────────────
function ReactionBar({ id, reactions: serverReactions, onBurnRequest }) {
  // Initialize from server + local session state
  const [counts, setCounts] = useState(() => ({ ...serverReactions }));
  const [active, setActive] = useState(() => sessionReactions.get(id) ?? null);

  // Sync when server reactions update (other users reacting live)
  useEffect(() => {
    const prev = active;
    setCounts(sr => {
      const merged = { ...sr };
      // Keep local delta: if we've reacted, adjust server count
      for (const key of Object.keys(sr)) {
        merged[key] = serverReactions[key] ?? 0;
      }
      return merged;
    });
  }, [serverReactions]); // eslint-disable-line

  const handleReact = async (key) => {
    if (key === "fire") { onBurnRequest(id); return; }

    const prev = active;
    const next = prev === key ? null : key;

    // Optimistic: compute new counts
    const updated = { ...counts };
    if (prev) updated[prev] = Math.max(0, (updated[prev] ?? 0) - 1);
    if (next) updated[next] = (updated[next] ?? 0) + 1;

    setActive(next);
    setCounts(updated);
    sessionReactions.set(id, next);

    try {
      const ref = doc(db, "confessions", id);
      const patch = {};
      if (prev) patch[`reactions.${prev}`] = Math.max(0, (serverReactions[prev] ?? 0) - 1);
      if (next) patch[`reactions.${next}`] = (serverReactions[next] ?? 0) + 1;
      if (Object.keys(patch).length) await updateDoc(ref, patch);
    } catch (e) {
      console.error(e);
      // Rollback
      setActive(prev);
      setCounts({ ...serverReactions });
    }
  };

  return (
    <div style={{
      display: "flex", gap: "8px", marginTop: "18px", flexWrap: "wrap",
    }}>
      {REACTIONS.map(r => {
        const isActive = active === r.key;
        const count = counts[r.key] ?? 0;
        return (
          <button key={r.key} onClick={() => handleReact(r.key)} title={r.label}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              fontFamily: "var(--mono)", fontSize: "0.58rem", letterSpacing: "0.04em",
              color: isActive ? "var(--amber)" : "var(--paper3)",
              padding: "6px 11px",
              background: isActive ? "rgba(200,146,42,0.1)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${isActive ? "var(--amber-dim)" : "var(--border)"}`,
              borderRadius: "20px",
              transition: "all 0.18s",
              userSelect: "none",
            }}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.borderColor = "var(--border2)";
                e.currentTarget.style.color = "var(--paper2)";
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--paper3)";
              }
            }}
          >
            <span style={{ fontSize: "0.88rem", lineHeight: 1 }}>{r.emoji}</span>
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFESSION CARD
// ─────────────────────────────────────────────────────────────────────────────
function ConfessionCard({ data, idx, onBurnRequest }) {
  const catInfo = CATEGORIES.find(c => c.key === data.category);
  const isNew = data.timestamp && (Date.now() - data.timestamp.toMillis()) < 20000;

  return (
    <article style={{
      padding: "clamp(24px,4vw,44px) 0",
      borderBottom: "1px solid var(--border)",
      animation: `cardIn 0.55s ${Math.min(idx * 0.04, 0.4)}s ease both`,
    }}>
      {/* Header row: category + live badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
        {catInfo && (
          <span style={{
            fontFamily: "var(--mono)", fontSize: "0.52rem", letterSpacing: "0.1em",
            color: "var(--paper3)",
            background: "var(--bg3)", padding: "3px 9px",
            border: "1px solid var(--border)", borderRadius: "2px",
          }}>{catInfo.emoji} {catInfo.label.toUpperCase()}</span>
        )}
        {isNew && (
          <span style={{
            display: "flex", alignItems: "center", gap: "5px",
            fontFamily: "var(--mono)", fontSize: "0.52rem", letterSpacing: "0.12em",
            color: "var(--amber)",
          }}>
            <span className="pulse" style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--amber)", display: "inline-block" }} />
            LIVE
          </span>
        )}
        {data.burned && data.txHash && (
          <a href={`https://solscan.io/tx/${data.txHash}`}
            target="_blank" rel="noopener noreferrer"
            className="flicker"
            style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              fontFamily: "var(--mono)", fontSize: "0.52rem", letterSpacing: "0.08em",
              color: "var(--amber)",
              border: "1px solid var(--amber-dim)", padding: "3px 9px", borderRadius: "2px",
            }}>
            🔥 on-chain
          </a>
        )}
      </div>

      {/* Text */}
      <p style={{
        fontFamily: "var(--serif)", fontStyle: "italic", fontWeight: 300,
        fontSize: sizeToFontSize(data.size),
        lineHeight: sizeToLineHeight(data.size),
        color: "var(--paper)",
        letterSpacing: "0.01em",
      }}>{data.text}</p>

      {/* Timestamp */}
      <p style={{
        fontFamily: "var(--mono)", fontSize: "0.55rem", letterSpacing: "0.07em",
        color: "var(--paper3)", marginTop: "12px",
      }}>{timeAgo(data.timestamp)}</p>

      <ReactionBar id={data.id} reactions={data.reactions || {}} onBurnRequest={onBurnRequest} />
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFESS MODAL
// ─────────────────────────────────────────────────────────────────────────────
function ConfessModal({ onClose, onDone }) {
  const [text, setText] = useState("");
  const [sizeVal, setSizeVal] = useState(50);
  const [category, setCategory] = useState("");
  const [showCats, setShowCats] = useState(false);
  const [burnMode, setBurnMode] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [phase, setPhase] = useState("compose");
  // compose | submitting | burning | done

  const textRef = useRef(null);
  const size = sizeVal < 34 ? "whisper" : sizeVal < 67 ? "normal" : "scream";

  useEffect(() => {
    const t = setTimeout(() => textRef.current?.focus(), 100);
    document.body.style.overflow = "hidden";
    return () => { clearTimeout(t); document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const fn = e => { if (e.key === "Escape" && phase === "compose") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose, phase]);

  const connectWallet = async () => {
    try {
      const { solana } = window;
      if (!solana?.isPhantom) { window.open("https://phantom.app", "_blank"); return; }
      const res = await solana.connect();
      setWallet(res.publicKey.toString());
    } catch (e) {
      console.error("Wallet connect failed:", e);
    }
  };

  const handleBurnToggle = async () => {
    const newState = !burnMode;
    setBurnMode(newState);
    if (newState && !wallet) await connectWallet();
  };

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 3) return;
    setPhase("submitting");

    let txHash = null;

    if (burnMode && wallet) {
      setPhase("burning");
      try {
        const w3 = window.solanaWeb3;
        if (!w3) throw new Error("Solana web3 not loaded");
        const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, TransactionInstruction } = w3;

        const { solana } = window;
        if (!solana?.isPhantom) throw new Error("No Phantom");

        const conn = new Connection("https://api.mainnet-beta.solana.com", { commitment: "confirmed" });
        const payer = new PublicKey(wallet);
        const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");

        const tx = new Transaction({ recentBlockhash: blockhash, feePayer: payer });

        // Memo: confession permanently written on-chain
        const MEMO_PROGRAM = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
        const memoData = Buffer.from(
          JSON.stringify({ app: "ConfessCoin", ticker: "$CFN", confession: trimmed.slice(0, 400) }),
          "utf8"
        );
        tx.add(new TransactionInstruction({
          keys: [{ pubkey: payer, isSigner: true, isWritable: false }],
          programId: MEMO_PROGRAM,
          data: memoData,
        }));

        // 0.01 SOL to incinerator (permanent proof of burn)
        const INCINERATOR = new PublicKey("1nc1nerator11111111111111111111111111111111");
        tx.add(SystemProgram.transfer({
          fromPubkey: payer,
          toPubkey: INCINERATOR,
          lamports: Math.round(BURN_SOL * LAMPORTS_PER_SOL),
        }));

        const signed = await solana.signTransaction(tx);
        txHash = await conn.sendRawTransaction(signed.serialize(), { skipPreflight: false });
        await conn.confirmTransaction({ signature: txHash, blockhash, lastValidBlockHeight }, "confirmed");
      } catch (e) {
        console.error("Burn error:", e);
        txHash = null;
        setBurnMode(false);
      }
    }

    // Save to Firestore
    try {
      await addDoc(collection(db, "confessions"), {
        text: trimmed,
        size,
        category: category || null,
        burned: burnMode && !!txHash,
        txHash: txHash || null,
        timestamp: serverTimestamp(),
        reactions: { candle: 0, heavy: 0, eye: 0, fire: 0, grave: 0 },
      });
    } catch (e) {
      console.error("Firestore error:", e);
    }

    setPhase("done");
    setTimeout(() => onDone(), 3500);
  };

  // ── BURNING PHASE ──
  if (phase === "burning") {
    return (
      <Overlay>
        <div style={{ textAlign: "center" }}>
          <div className="flicker" style={{ fontSize: "3.5rem", marginBottom: "28px" }}>🔥</div>
          <p style={{ fontFamily: "var(--mono)", fontSize: "0.7rem", letterSpacing: "0.18em", color: "var(--amber)", marginBottom: "14px" }}>
            WRITING TO THE SOLANA CHAIN
          </p>
          <p style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--paper3)", lineHeight: 1.8 }}>
            Permanent. Immutable. Nobody can delete this.<br />
            Please wait.
          </p>
          <div style={{ width: "24px", height: "24px", border: "1px solid var(--amber)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "32px auto 0" }} />
        </div>
      </Overlay>
    );
  }

  // ── DONE PHASE ──
  if (phase === "done") {
    return (
      <Overlay>
        <div style={{ textAlign: "center", animation: "slideUp 0.7s ease" }}>
          <p style={{
            fontFamily: "var(--serif)", fontStyle: "italic", fontWeight: 300,
            fontSize: "clamp(1.8rem,6vw,2.6rem)", color: "var(--paper)",
            marginBottom: "16px", lineHeight: 1.4,
          }}>it's gone.</p>
          <p style={{
            fontFamily: "var(--serif)", fontStyle: "italic", fontWeight: 300,
            fontSize: "clamp(1rem,3vw,1.4rem)", color: "var(--paper3)",
            marginBottom: "36px",
          }}>you're lighter now.</p>
          <span className="flicker" style={{ fontSize: "2rem" }}>🕯️</span>
        </div>
      </Overlay>
    );
  }

  // ── COMPOSE PHASE ──
  return (
    <Overlay onClickOutside={phase === "compose" ? onClose : undefined}>
      <div style={{
        width: "100%", maxWidth: "620px",
        animation: "slideUp 0.4s ease",
        position: "relative",
        padding: "0 clamp(0px,1vw,8px)",
      }}>
        {/* Close btn */}
        <button onClick={onClose} style={{
          position: "absolute", top: "-8px", right: "clamp(-8px,0px,0px)",
          fontFamily: "var(--mono)", fontSize: "0.58rem", letterSpacing: "0.12em",
          color: "var(--paper3)", display: "flex", alignItems: "center", gap: "6px",
          padding: "6px",
        }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          ESC
        </button>

        {/* Label */}
        <p style={{
          fontFamily: "var(--mono)", fontSize: "0.56rem", letterSpacing: "0.18em",
          color: "var(--paper3)", marginBottom: "clamp(20px,4vw,32px)",
          paddingTop: "clamp(28px,4vw,0px)",
        }}>SAY THE THING YOU CAN'T SAY ANYWHERE ELSE</p>

        {/* Textarea area */}
        <div style={{ position: "relative", marginBottom: "clamp(24px,4vw,36px)" }}>
          <textarea
            ref={textRef}
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={1200}
            rows={window.innerWidth < 640 ? 5 : 7}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              borderBottom: "1px solid var(--border2)",
              color: "var(--paper)",
              fontFamily: "var(--serif)", fontStyle: "italic", fontWeight: 300,
              fontSize: sizeToFontSize(size),
              lineHeight: sizeToLineHeight(size),
              resize: "none",
              caretColor: "var(--amber)",
              paddingBottom: "14px",
              outline: "none",
              transition: "font-size 0.2s",
            }}
          />
          {!text && (
            <span className="blink" style={{
              position: "absolute", top: 0, left: 0,
              color: "var(--amber)", fontFamily: "var(--serif)",
              fontSize: sizeToFontSize(size), lineHeight: sizeToLineHeight(size),
              pointerEvents: "none", userSelect: "none",
            }}>|</span>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: "0.52rem", color: "var(--paper3)" }}>
              {text.length} / 1200
            </span>
            <span style={{
              fontFamily: "var(--mono)", fontSize: "0.52rem",
              color: size === "scream" ? "var(--amber)" : size === "whisper" ? "var(--paper3)" : "var(--paper3)",
              letterSpacing: "0.1em",
            }}>
              {size.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Slider */}
        <div style={{ marginBottom: "clamp(20px,4vw,30px)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: "0.55rem", color: "var(--paper3)", letterSpacing: "0.09em" }}>whisper</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: "0.55rem", color: "var(--paper3)", letterSpacing: "0.09em" }}>scream</span>
          </div>
          <input
            type="range" min="0" max="100" value={sizeVal}
            onChange={e => setSizeVal(+e.target.value)}
            style={{
              background: `linear-gradient(to right, var(--amber) ${sizeVal}%, var(--border2) ${sizeVal}%)`,
            }}
          />
        </div>

        {/* Category */}
        <div style={{ marginBottom: "clamp(20px,4vw,28px)" }}>
          <button onClick={() => setShowCats(s => !s)} style={{
            fontFamily: "var(--mono)", fontSize: "0.57rem", letterSpacing: "0.1em",
            color: category ? "var(--amber)" : "var(--paper3)",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <span style={{
              display: "inline-block",
              transform: showCats ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.2s", fontSize: "0.65rem",
            }}>▸</span>
            {category
              ? `${CATEGORIES.find(c => c.key === category)?.emoji}  ${CATEGORIES.find(c => c.key === category)?.label}`
              : "CATEGORIZE (OPTIONAL)"
            }
          </button>

          {showCats && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px", animation: "fadeIn 0.2s ease" }}>
              {CATEGORIES.map(cat => (
                <button key={cat.key}
                  onClick={() => { setCategory(c => c === cat.key ? "" : cat.key); setShowCats(false); }}
                  style={{
                    fontFamily: "var(--mono)", fontSize: "0.55rem", letterSpacing: "0.05em",
                    color: category === cat.key ? "var(--amber)" : "var(--paper3)",
                    padding: "5px 12px",
                    border: `1px solid ${category === cat.key ? "var(--amber-dim)" : "var(--border)"}`,
                    borderRadius: "var(--radius)",
                    background: category === cat.key ? "rgba(200,146,42,0.08)" : "var(--bg2)",
                    transition: "all 0.15s",
                  }}>
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Burn toggle */}
        <div style={{
          marginBottom: "clamp(24px,4vw,36px)",
          padding: "clamp(14px,3vw,20px) clamp(14px,3vw,20px)",
          border: `1px solid ${burnMode ? "var(--amber-dim)" : "var(--border)"}`,
          borderRadius: "var(--radius)",
          background: burnMode ? "rgba(200,146,42,0.03)" : "rgba(255,255,255,0.01)",
          transition: "all 0.3s",
          animation: burnMode ? "burnPulse 4s ease infinite" : "none",
        }}>
          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
            {/* Custom checkbox */}
            <button onClick={handleBurnToggle} style={{
              width: "18px", height: "18px", flexShrink: 0, marginTop: "3px",
              border: `1px solid ${burnMode ? "var(--amber)" : "var(--border2)"}`,
              borderRadius: "3px",
              background: burnMode ? "var(--amber)" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}>
              {burnMode && (
                <svg width="10" height="10" fill="none" stroke="var(--bg)" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontFamily: "var(--serif)", fontStyle: "italic", fontWeight: 300,
                fontSize: "clamp(0.9rem,2.5vw,1.05rem)", color: "var(--paper)", marginBottom: "6px",
              }}>🔥 Burn to chain forever</p>
              <p style={{
                fontFamily: "var(--mono)", fontSize: "0.57rem",
                color: "var(--paper3)", lineHeight: 1.75,
              }}>
                0.01 SOL · written permanently on Solana<br />
                Immutable · no one can delete it · ever
              </p>

              {burnMode && !wallet && (
                <button onClick={connectWallet} style={{
                  marginTop: "12px",
                  fontFamily: "var(--mono)", fontSize: "0.57rem", letterSpacing: "0.09em",
                  color: "var(--amber)",
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "8px 14px",
                  border: "1px solid var(--amber-dim)",
                  borderRadius: "var(--radius)",
                  transition: "background 0.2s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--amber-glow)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Connect Phantom
                </button>
              )}
              {burnMode && wallet && (
                <p style={{ fontFamily: "var(--mono)", fontSize: "0.56rem", color: "var(--amber)", marginTop: "10px" }}>
                  ✓ {shortAddr(wallet)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <button onClick={submit}
          disabled={text.trim().length < 3 || phase !== "compose"}
          style={{
            width: "100%",
            fontFamily: "var(--serif)", fontStyle: "italic", fontWeight: 300,
            fontSize: "clamp(1.1rem,3.5vw,1.35rem)", letterSpacing: "0.04em",
            color: text.trim().length >= 3 ? "var(--paper)" : "var(--paper3)",
            padding: "clamp(14px,3vw,18px) 0",
            borderTop: "1px solid var(--border)",
            borderBottom: `1px solid ${text.trim().length >= 3 ? "var(--amber-dim)" : "var(--border)"}`,
            textAlign: "left",
            opacity: text.trim().length < 3 ? 0.35 : 1,
            transition: "all 0.3s",
            cursor: text.trim().length < 3 ? "default" : "pointer",
          }}
          onMouseEnter={e => { if (text.trim().length >= 3) { e.currentTarget.style.color = "var(--amber)"; e.currentTarget.style.borderBottomColor = "var(--amber)"; } }}
          onMouseLeave={e => { e.currentTarget.style.color = text.trim().length >= 3 ? "var(--paper)" : "var(--paper3)"; e.currentTarget.style.borderBottomColor = text.trim().length >= 3 ? "var(--amber-dim)" : "var(--border)"; }}
        >
          {phase === "submitting" ? "releasing..." : "release it →"}
        </button>
      </div>
    </Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERLAY
// ─────────────────────────────────────────────────────────────────────────────
function Overlay({ children, onClickOutside }) {
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget && onClickOutside) onClickOutside(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(5,5,4,0.96)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "clamp(16px,5vw,60px) clamp(16px,4vw,48px)",
        overflowY: "auto",
        animation: "modalIn 0.3s ease",
      }}
    >
      <div style={{ width: "100%", maxWidth: "620px", position: "relative" }}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WALL PAGE
// ─────────────────────────────────────────────────────────────────────────────
function WallPage({ onBurnRequest }) {
  const [confessions, setConfessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState("");
  const [showCatBar, setShowCatBar] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "confessions"), orderBy("timestamp", "desc"), limit(80));
    const unsub = onSnapshot(q, snap => {
      setConfessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, err => { console.error(err); setLoading(false); });
    return unsub;
  }, []);

  const filtered = catFilter ? confessions.filter(c => c.category === catFilter) : confessions;

  return (
    <PageShell>
      {/* Page header */}
      <header style={{
        paddingTop: "clamp(40px,7vw,72px)",
        paddingBottom: "clamp(32px,5vw,52px)",
        borderBottom: "1px solid var(--border)",
        marginBottom: "clamp(28px,5vw,48px)",
      }}>
        <h1 style={{
          fontFamily: "var(--serif-sc)", fontWeight: 300,
          fontSize: "clamp(2.2rem,10vw,4.5rem)",
          letterSpacing: "0.2em", color: "var(--paper)",
          lineHeight: 1.05, marginBottom: "14px",
        }}>The Wall</h1>
        <p style={{
          fontFamily: "var(--mono)", fontSize: "clamp(0.58rem,1.8vw,0.66rem)",
          color: "var(--paper3)", letterSpacing: "0.1em", lineHeight: 1.9,
          maxWidth: "420px",
        }}>Anonymous. Real. No names. No accounts.<br />Just the truth, witnessed.</p>

        {/* Filter row */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "28px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <span className="pulse" style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#4caf50", display: "inline-block" }} />
            <span style={{ fontFamily: "var(--mono)", fontSize: "0.56rem", letterSpacing: "0.1em", color: "var(--paper3)" }}>
              {filtered.length} confession{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          <button onClick={() => setShowCatBar(s => !s)} style={{
            fontFamily: "var(--mono)", fontSize: "0.56rem", letterSpacing: "0.1em",
            color: catFilter ? "var(--amber)" : "var(--paper3)",
            display: "flex", alignItems: "center", gap: "6px",
            border: "1px solid var(--border)", padding: "5px 12px", borderRadius: "var(--radius)",
            transition: "all 0.2s",
            background: showCatBar ? "var(--bg2)" : "transparent",
          }}>
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M3 6h18M7 12h10M11 18h2" />
            </svg>
            {catFilter ? CATEGORIES.find(c => c.key === catFilter)?.label : "FILTER"}
          </button>

          {catFilter && (
            <button onClick={() => setCatFilter("")} style={{
              fontFamily: "var(--mono)", fontSize: "0.55rem", color: "var(--paper3)", letterSpacing: "0.08em",
            }}>× clear</button>
          )}
        </div>

        {showCatBar && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "14px", animation: "fadeIn 0.2s ease" }}>
            {CATEGORIES.map(cat => (
              <button key={cat.key} onClick={() => { setCatFilter(c => c === cat.key ? "" : cat.key); setShowCatBar(false); }}
                style={{
                  fontFamily: "var(--mono)", fontSize: "0.54rem", letterSpacing: "0.05em",
                  color: catFilter === cat.key ? "var(--amber)" : "var(--paper3)",
                  padding: "5px 12px",
                  border: `1px solid ${catFilter === cat.key ? "var(--amber-dim)" : "var(--border)"}`,
                  borderRadius: "var(--radius)",
                  background: catFilter === cat.key ? "rgba(200,146,42,0.08)" : "var(--bg2)",
                  transition: "all 0.15s",
                }}>{cat.emoji} {cat.label}</button>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {[80, 60, 90, 50, 70].map((w, i) => (
            <div key={i} style={{ padding: "clamp(24px,4vw,44px) 0", borderBottom: "1px solid var(--border)" }}>
              <div className="skeleton" style={{ height: "12px", width: "60px", marginBottom: "16px" }} />
              <div className="skeleton" style={{ height: "16px", width: `${w}%`, marginBottom: "10px" }} />
              <div className="skeleton" style={{ height: "16px", width: `${w - 20}%` }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "80px 0", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "1.2rem", color: "var(--paper3)" }}>
            {catFilter ? "Nothing here yet." : "The wall is empty. Be the first."}
          </p>
        </div>
      ) : (
        filtered.map((c, i) => (
          <ConfessionCard key={c.id} data={c} idx={i} onBurnRequest={onBurnRequest} />
        ))
      )}

      <div style={{ height: "100px" }} />
    </PageShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAIN WALL PAGE
// ─────────────────────────────────────────────────────────────────────────────
function ChainWallPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "confessions"), where("burned", "==", true), orderBy("timestamp", "desc"), limit(100));
    const unsub = onSnapshot(q, snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <PageShell>
      <header style={{ paddingTop: "clamp(40px,7vw,72px)", paddingBottom: "clamp(32px,5vw,52px)", borderBottom: "1px solid var(--border)", marginBottom: "clamp(28px,5vw,48px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
          <span className="flicker" style={{ fontSize: "1.6rem" }}>🔥</span>
          <h1 style={{ fontFamily: "var(--serif-sc)", fontWeight: 300, fontSize: "clamp(2.2rem,10vw,4.5rem)", letterSpacing: "0.2em", color: "var(--paper)", lineHeight: 1.05 }}>
            On-Chain
          </h1>
        </div>
        <p style={{ fontFamily: "var(--mono)", fontSize: "clamp(0.58rem,1.8vw,0.66rem)", color: "var(--paper3)", letterSpacing: "0.1em", lineHeight: 1.9, maxWidth: "480px" }}>
          These confessions are permanent.<br />
          Written on Solana. No one can delete them. Ever.
        </p>
        <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "28px", height: "1px", background: "var(--amber-dim)" }} />
          <span style={{ fontFamily: "var(--mono)", fontSize: "0.56rem", color: "var(--amber)", letterSpacing: "0.14em" }}>
            {loading ? "—" : items.length} PERMANENT RECORD{items.length !== 1 ? "S" : ""}
          </span>
        </div>
      </header>

      {loading ? (
        <p style={{ fontFamily: "var(--mono)", fontSize: "0.63rem", color: "var(--paper3)" }}>
          reading the chain<span className="blink">…</span>
        </p>
      ) : items.length === 0 ? (
        <div style={{ padding: "80px 0" }}>
          <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "1.2rem", color: "var(--paper3)", marginBottom: "12px" }}>Nothing burned yet.</p>
          <p style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--paper3)", lineHeight: 1.8 }}>Be the first to write something that outlasts you.</p>
        </div>
      ) : (
        items.map((item, i) => (
          <div key={item.id} style={{
            padding: "clamp(24px,4vw,44px) 0",
            borderBottom: "1px solid rgba(200,146,42,0.07)",
            animation: `cardIn 0.55s ${Math.min(i * 0.04, 0.4)}s ease both`,
            position: "relative",
          }}>
            <span style={{
              position: "absolute", top: "clamp(24px,4vw,44px)", right: 0,
              fontFamily: "var(--mono)", fontSize: "0.5rem", letterSpacing: "0.16em",
              color: "var(--amber-dim)",
            }}>PERMANENT</span>

            <p style={{
              fontFamily: "var(--serif)", fontStyle: "italic", fontWeight: 300,
              fontSize: sizeToFontSize(item.size),
              lineHeight: sizeToLineHeight(item.size),
              color: "rgba(237,232,220,0.84)",
              paddingRight: "72px",
            }}>{item.text}</p>

            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "16px", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: "0.55rem", color: "var(--paper3)" }}>{timeAgo(item.timestamp)}</span>
              {item.txHash && (
                <a href={`https://solscan.io/tx/${item.txHash}`} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    fontFamily: "var(--mono)", fontSize: "0.55rem", letterSpacing: "0.07em",
                    color: "var(--amber)",
                    border: "1px solid var(--amber-dim)", padding: "3px 10px", borderRadius: "2px",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--amber-glow)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <span className="flicker">🔥</span>
                  {shortAddr(item.txHash)}
                  <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        ))
      )}
      <div style={{ height: "80px" }} />
    </PageShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LORE PAGE
// ─────────────────────────────────────────────────────────────────────────────
function LorePage() {
  const [copied, copy] = useCopy(CONTRACT_ADDRESS);
  const [hovered, setHovered] = useState(null);

  const lore = [
    { n: "01", body: "In 2014, someone built ConfessionCoin. They let people write their sins on the Bitcoin blockchain. It died. Nobody built it again. Until now." },
    { n: "02", body: "Every platform you've ever used was designed to make you more visible. More legible. More monetizable. This one is designed to do the opposite." },
    { n: "03", body: "You are no one here. Your confession is everything. No metrics. No clout. No persona. Just the thing itself, witnessed by strangers who will never know your name." },
    { n: "04", body: "The blockchain part isn't a gimmick. When something lives on-chain, it can't be deleted by a company, a moderator, a moment of regret, or a court order. Some truths deserve to last." },
    { n: "05", body: "We're not building a community. We're building a wall. A very old, very dark, very honest wall. Come and write on it." },
  ];

  return (
    <PageShell>
      <div style={{ paddingTop: "clamp(40px,7vw,72px)" }}>
        <p style={{ fontFamily: "var(--mono)", fontSize: "clamp(0.55rem,1.6vw,0.63rem)", letterSpacing: "0.22em", color: "var(--paper3)", marginBottom: "clamp(40px,6vw,64px)" }}>
          WHY THIS EXISTS
        </p>

        {lore.map((item, i) => (
          <div key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: "grid",
              gridTemplateColumns: "clamp(28px,5vw,52px) 1fr",
              gap: "clamp(16px,3vw,32px)",
              padding: "clamp(24px,4vw,44px) 0",
              borderBottom: "1px solid var(--border)",
              animation: `fadeUp 0.7s ${i * 0.1}s ease both`,
              cursor: "default",
            }}>
            <span style={{
              fontFamily: "var(--mono)", fontSize: "0.58rem", letterSpacing: "0.1em",
              color: hovered === i ? "var(--amber)" : "var(--paper3)",
              paddingTop: "5px", transition: "color 0.25s", userSelect: "none",
            }}>{item.n}</span>
            <p style={{
              fontFamily: "var(--serif)", fontStyle: "italic", fontWeight: 300,
              fontSize: "clamp(0.98rem,2.5vw,1.18rem)", lineHeight: 1.88,
              color: hovered === i ? "var(--paper)" : "rgba(237,232,220,0.68)",
              transition: "color 0.25s",
            }}>{item.body}</p>
          </div>
        ))}

        {/* Info grid */}
        <div style={{
          marginTop: "clamp(40px,7vw,72px)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          overflow: "hidden",
          gap: "1px",
          background: "var(--border)",
        }}>
          {[
            {
              label: "TOKEN",
              body: (
                <div>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "0.7rem", letterSpacing: "0.12em", color: "var(--amber)", marginBottom: "10px" }}>$CFN</p>
                  <button onClick={copy} style={{
                    fontFamily: "var(--mono)", fontSize: "0.55rem", letterSpacing: "0.06em",
                    color: copied ? "var(--amber)" : "var(--paper3)",
                    display: "flex", alignItems: "center", gap: "7px",
                    transition: "color 0.2s",
                  }}>
                    <span style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {CONTRACT_ADDRESS}
                    </span>
                    <span style={{ flexShrink: 0 }}>{copied ? "✓" : "⎘"}</span>
                  </button>
                </div>
              )
            },
            {
              label: "NETWORK",
              body: (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "0.63rem", color: "var(--paper2)" }}>Solana</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "0.57rem", color: "var(--paper3)", lineHeight: 1.7 }}>Burn fee: 0.01 SOL<br />Wallet: Phantom</span>
                </div>
              )
            },
            {
              label: "LINKS",
              body: (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[
                    { href: SOCIALS.x, label: "Twitter / X" },
                    { href: SOCIALS.community, label: "X Community" },
                    { href: SOCIALS.github, label: "GitHub (Original)" },
                  ].map(s => (
                    <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer"
                      className="nav-item"
                      style={{ fontFamily: "var(--mono)", fontSize: "0.58rem", color: "var(--paper3)", letterSpacing: "0.07em", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      {s.label}
                      <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                      </svg>
                    </a>
                  ))}
                </div>
              )
            },
          ].map(block => (
            <div key={block.label} style={{ background: "var(--bg1)", padding: "clamp(18px,3vw,26px)" }}>
              <p style={{ fontFamily: "var(--mono)", fontSize: "0.5rem", letterSpacing: "0.18em", color: "var(--paper3)", marginBottom: "14px", opacity: 0.7 }}>
                {block.label}
              </p>
              {block.body}
            </div>
          ))}
        </div>

        <div style={{ height: "clamp(60px,10vw,100px)" }} />
      </div>
    </PageShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE SHELL
// ─────────────────────────────────────────────────────────────────────────────
function PageShell({ children }) {
  return (
    <div style={{
      maxWidth: "740px",
      margin: "0 auto",
      padding: `calc(var(--nav-h) + var(--ca-h)) clamp(16px,4vw,40px) 0`,
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FLOATING CONFESS BUTTON
// ─────────────────────────────────────────────────────────────────────────────
function FloatingConfessBtn({ onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "fixed",
        bottom: "clamp(18px,4vw,32px)",
        left: "50%", transform: "translateX(-50%)",
        zIndex: 800,
        fontFamily: "var(--serif-sc)", fontWeight: 400,
        fontSize: "clamp(0.62rem,2vw,0.72rem)", letterSpacing: "0.24em",
        color: hovered ? "var(--bg)" : "var(--amber)",
        background: hovered ? "var(--amber)" : "rgba(8,8,7,0.88)",
        border: "1px solid var(--amber)",
        padding: "clamp(12px,2.5vw,16px) clamp(28px,6vw,56px)",
        borderRadius: "var(--radius)",
        transition: "all 0.25s ease",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        whiteSpace: "nowrap",
        animation: "burnPulse 5s ease infinite",
        boxShadow: hovered
          ? "0 0 48px rgba(200,146,42,0.5), 0 8px 32px rgba(0,0,0,0.6)"
          : "0 0 24px rgba(200,146,42,0.12), 0 4px 20px rgba(0,0,0,0.5)",
      }}
    >CONFESS</button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("wall");
  const [showModal, setShowModal] = useState(false);
  const [sound, setSound] = useState(false);

  useAmbient(sound);

  const openModal = useCallback(() => setShowModal(true), []);
  const closeModal = useCallback(() => setShowModal(false), []);
  const handleDone = useCallback(() => { setShowModal(false); setPage("wall"); }, []);
  const handleBurnRequest = useCallback(() => { setShowModal(true); }, []);

  // Load Solana web3.js
  useEffect(() => {
    if (window.solanaWeb3) return;
    const s = document.createElement("script");
    s.src = "https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js";
    document.head.appendChild(s);
  }, []);

  return (
    <>
      <GlobalStyles />
      <Nav page={page} setPage={setPage} sound={sound} setSound={setSound} onConfess={openModal} />
      <CABar />

      <main>
        {page === "wall"  && <WallPage onBurnRequest={handleBurnRequest} />}
        {page === "chain" && <ChainWallPage />}
        {page === "lore"  && <LorePage />}
      </main>

      {page === "wall" && !showModal && <FloatingConfessBtn onClick={openModal} />}

      {showModal && <ConfessModal onClose={closeModal} onDone={handleDone} />}
    </>
  );
}
