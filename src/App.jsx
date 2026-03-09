import { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, addDoc, getDocs, query,
  orderBy, limit, onSnapshot, updateDoc, doc, serverTimestamp, where
} from "firebase/firestore";

// ─── FIREBASE ────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyB_gNokFnucM2nNAhhkRRnPsPNBAShYlMs",
  authDomain: "it-token.firebaseapp.com",
  projectId: "it-token",
  storageBucket: "it-token.firebasestorage.app",
  messagingSenderId: "804328953904",
  appId: "1:804328953904:web:e760545b579bf2527075f5"
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CONTRACT_ADDRESS = "PASTE_CA_HERE"; // <-- replace with real CA
const BURN_AMOUNT_SOL = 0.01;
const REACTIONS = [
  { key: "candle", symbol: "🕯️", label: "I've felt this" },
  { key: "heavy",  symbol: "🪨", label: "heavy" },
  { key: "eye",    symbol: "👁️", label: "I see you" },
  { key: "fire",   symbol: "🔥", label: "burn it" },
  { key: "grave",  symbol: "💀", label: "take it to the grave" },
];
const CATEGORIES = [
  { key: "crypto",  symbol: "💸", label: "Money & Crypto" },
  { key: "love",    symbol: "❤️",  label: "Love & Betrayal" },
  { key: "family",  symbol: "👨‍👩‍👧", label: "Family" },
  { key: "self",    symbol: "🪞", label: "Things I did to myself" },
  { key: "online",  symbol: "🌐", label: "Things I did online" },
  { key: "unsaid",  symbol: "☠️", label: "Things I'd never say out loud" },
  { key: "good",    symbol: "✨", label: "Good things I'm ashamed to feel good about" },
];
const SOCIAL = {
  x:          "https://x.com/confessioncoin",
  xCommunity: "https://x.com/i/communities/confessioncoin",
  github:     "https://github.com/confessioncoin/confessioncoin",
};

// ─── GLOBAL STYLES ─────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=JetBrains+Mono:wght@300;400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:       #0e0e0e;
      --bg2:      #141414;
      --paper:    #f0ebe0;
      --amber:    #c8922a;
      --amber-dim:#8a6520;
      --muted:    #4a4540;
      --faint:    #222018;
      --serif:    'IM Fell English', Georgia, serif;
      --mono:     'JetBrains Mono', 'Courier New', monospace;
    }

    html { scroll-behavior: smooth; }

    body {
      background: var(--bg);
      color: var(--paper);
      font-family: var(--serif);
      min-height: 100vh;
      overflow-x: hidden;
      cursor: default;
    }

    /* paper texture overlay */
    body::before {
      content: '';
      position: fixed; inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
      pointer-events: none; z-index: 9999;
      opacity: 0.6;
    }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--amber-dim); border-radius: 2px; }

    ::selection { background: var(--amber); color: var(--bg); }

    .fade-in {
      animation: fadeIn 1.4s ease forwards;
      opacity: 0;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .flicker {
      animation: flicker 4s ease-in-out infinite;
    }
    @keyframes flicker {
      0%,100% { opacity: 1; }
      48%      { opacity: 1; }
      50%      { opacity: 0.7; }
      52%      { opacity: 1; }
      80%      { opacity: 0.85; }
      82%      { opacity: 1; }
    }

    .blink {
      animation: blink 1.1s step-end infinite;
    }
    @keyframes blink { 50% { opacity: 0; } }

    @keyframes charIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes burnOut {
      0%   { opacity: 1; filter: none; }
      60%  { opacity: 0.6; filter: sepia(1) brightness(1.8) contrast(1.2); }
      100% { opacity: 0; filter: sepia(1) brightness(3) blur(4px); }
    }

    @keyframes modalIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    @keyframes pulseAmber {
      0%,100% { box-shadow: 0 0 0 0 rgba(200,146,42,0); }
      50%     { box-shadow: 0 0 20px 4px rgba(200,146,42,0.25); }
    }

    textarea:focus { outline: none; }
    button { cursor: pointer; border: none; background: none; font-family: var(--serif); }
    a { color: inherit; text-decoration: none; }

    .nav-link:hover { color: var(--amber); transition: color 0.3s; }
  `}</style>
);

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return "just now";
  const s = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function sizeStyle(size) {
  const map = { whisper: "0.72rem", normal: "1rem", scream: "1.6rem" };
  return map[size] || "1rem";
}

function truncate(addr) {
  if (!addr) return "";
  return addr.slice(0,4) + "..." + addr.slice(-4);
}

// ─── COPY CA ─────────────────────────────────────────────────────────────────
function CopyCA() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div onClick={copy} title="Click to copy contract address" style={{
      display: "inline-flex", alignItems: "center", gap: "8px",
      fontFamily: "var(--mono)", fontSize: "0.65rem",
      color: copied ? "var(--amber)" : "var(--muted)",
      cursor: "pointer", transition: "color 0.3s",
      border: "1px solid", borderColor: copied ? "var(--amber)" : "var(--muted)",
      borderRadius: "4px", padding: "4px 10px", letterSpacing: "0.03em",
    }}>
      <span>$CFN</span>
      <span style={{ color: "var(--muted)", fontSize: "0.6rem" }}>|</span>
      <span style={{ maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {CONTRACT_ADDRESS}
      </span>
      <span style={{ fontSize: "0.6rem" }}>{copied ? "✓ copied" : "⎘"}</span>
    </div>
  );
}

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
function Navbar({ page, setPage, soundOn, toggleSound }) {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "18px 32px",
      background: "linear-gradient(to bottom, rgba(14,14,14,0.98) 0%, rgba(14,14,14,0) 100%)",
    }}>
      {/* LOGO */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <img
          src="/logo.png"
          alt="ConfessCoin"
          style={{ height: "32px", width: "auto", opacity: 0.92 }}
          onError={e => { e.target.style.display = "none"; }}
        />
        <span
          onClick={() => setPage("wall")}
          style={{
            fontFamily: "var(--serif)", fontStyle: "italic",
            fontSize: "1.1rem", letterSpacing: "0.12em",
            color: "var(--paper)", cursor: "pointer",
          }}
        >
          CONFESS
        </span>
      </div>

      {/* NAV */}
      <div style={{ display: "flex", alignItems: "center", gap: "28px", fontFamily: "var(--mono)", fontSize: "0.65rem", letterSpacing: "0.12em", color: "var(--muted)" }}>
        <span
          className="nav-link"
          onClick={() => setPage("wall")}
          style={{ color: page === "wall" ? "var(--paper)" : undefined, cursor: "pointer" }}
        >THE WALL</span>
        <span
          className="nav-link"
          onClick={() => setPage("chain")}
          style={{ color: page === "chain" ? "var(--amber)" : undefined, cursor: "pointer" }}
        >⛓ ON-CHAIN</span>
        <span
          className="nav-link"
          onClick={() => setPage("lore")}
          style={{ color: page === "lore" ? "var(--paper)" : undefined, cursor: "pointer" }}
        >WHY THIS EXISTS</span>

        <div style={{ width: "1px", height: "14px", background: "var(--muted)" }} />

        {/* Social */}
        <a href={SOCIAL.x} target="_blank" rel="noopener noreferrer" className="nav-link" title="X">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>
        <a href={SOCIAL.xCommunity} target="_blank" rel="noopener noreferrer" className="nav-link" title="X Community">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z"/>
          </svg>
        </a>
        <a href={SOCIAL.github} target="_blank" rel="noopener noreferrer" className="nav-link" title="GitHub">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
          </svg>
        </a>

        <div style={{ width: "1px", height: "14px", background: "var(--muted)" }} />

        {/* Sound toggle */}
        <span
          onClick={toggleSound}
          title={soundOn ? "Silence" : "Ambient sound"}
          style={{ cursor: "pointer", fontSize: "0.8rem", opacity: soundOn ? 1 : 0.4, transition: "opacity 0.3s" }}
        >🔔</span>
      </div>
    </nav>
  );
}

// ─── REACTION BAR ────────────────────────────────────────────────────────────
function ReactionBar({ confessionId, reactions, onBurnPrompt }) {
  const [reacted, setReacted] = useState({});

  const handleReact = async (key) => {
    if (reacted[key]) return;
    if (key === "fire") { onBurnPrompt(confessionId); return; }
    try {
      const ref = doc(db, "confessions", confessionId);
      const upd = {};
      upd[`reactions.${key}`] = (reactions[key] || 0) + 1;
      await updateDoc(ref, upd);
      setReacted(r => ({ ...r, [key]: true }));
    } catch {}
  };

  return (
    <div style={{ display: "flex", gap: "18px", marginTop: "14px", flexWrap: "wrap" }}>
      {REACTIONS.map(r => (
        <button
          key={r.key}
          onClick={() => handleReact(r.key)}
          title={r.label}
          style={{
            display: "flex", alignItems: "center", gap: "5px",
            fontFamily: "var(--mono)", fontSize: "0.62rem",
            color: reacted[r.key] ? "var(--amber)" : "var(--muted)",
            opacity: reacted[r.key] ? 1 : 0.7,
            transition: "all 0.2s",
            padding: "2px 0",
          }}
        >
          <span style={{ fontSize: "0.85rem" }}>{r.symbol}</span>
          <span>{reactions[r.key] || 0}</span>
        </button>
      ))}
    </div>
  );
}

// ─── CONFESSION CARD ─────────────────────────────────────────────────────────
function ConfessionCard({ data, index, onBurnPrompt }) {
  const isNew = data.timestamp && (Date.now() - data.timestamp.toMillis()) < 10000;

  return (
    <div
      className="fade-in"
      style={{
        animationDelay: `${index * 0.06}s`,
        padding: "28px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        maxWidth: "680px",
      }}
    >
      <p style={{
        fontFamily: "var(--serif)",
        fontStyle: "italic",
        fontSize: sizeStyle(data.size),
        lineHeight: 1.75,
        color: "var(--paper)",
        letterSpacing: "0.01em",
      }}>
        {data.text}
      </p>

      <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "14px" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--muted)" }}>
          {timeAgo(data.timestamp)}
        </span>
        {data.category && (
          <span style={{ fontFamily: "var(--mono)", fontSize: "0.58rem", color: "var(--amber-dim)" }}>
            {CATEGORIES.find(c => c.key === data.category)?.symbol}
          </span>
        )}
        {data.burned && data.txHash && (
          <a
            href={`https://solscan.io/tx/${data.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            title="View on Solana"
            className="flicker"
            style={{ fontSize: "0.85rem", opacity: 0.85 }}
          >🔥</a>
        )}
        {isNew && (
          <span style={{ fontFamily: "var(--mono)", fontSize: "0.55rem", color: "var(--amber)", opacity: 0.7 }}>
            ● live
          </span>
        )}
      </div>

      <ReactionBar
        confessionId={data.id}
        reactions={data.reactions || {}}
        onBurnPrompt={onBurnPrompt}
      />
    </div>
  );
}

// ─── CONFESS MODAL ───────────────────────────────────────────────────────────
function ConfessModal({ onClose, onSubmitted }) {
  const [text, setText] = useState("");
  const [size, setSize] = useState(50);
  const [category, setCategory] = useState("");
  const [burnForever, setBurnForever] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [phase, setPhase] = useState("write"); // write | submitting | done | burning
  const [showCategories, setShowCategories] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.focus();
  }, []);

  const sizeLabel = size < 33 ? "whisper" : size < 66 ? "normal" : "scream";

  const connectWallet = async () => {
    try {
      const { solana } = window;
      if (!solana?.isPhantom) {
        alert("Phantom wallet not found. Please install it from phantom.app");
        return;
      }
      const resp = await solana.connect();
      setWalletAddress(resp.publicKey.toString());
    } catch {}
  };

  const handleSubmit = async () => {
    if (!text.trim() || text.trim().length < 3) return;

    setPhase("submitting");

    let txHash = null;

    if (burnForever) {
      // Solana burn flow
      try {
        const { solana, solanaWeb3 } = window;
        if (!solana?.isPhantom) throw new Error("No phantom");

        // We encode the confession as a memo instruction
        const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = solanaWeb3;
        const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
        const pubkey = new PublicKey(walletAddress);
        const MEMO_PROGRAM = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

        const { blockhash } = await connection.getLatestBlockhash();
        const tx = new Transaction({ recentBlockhash: blockhash, feePayer: pubkey });

        // Add memo
        const memoIx = {
          keys: [],
          programId: MEMO_PROGRAM,
          data: Buffer.from(text.trim().slice(0, 566)),
        };
        tx.add(memoIx);

        // Also send 0.01 SOL to self (proof of burn)
        tx.add(SystemProgram.transfer({
          fromPubkey: pubkey,
          toPubkey: pubkey,
          lamports: BURN_AMOUNT_SOL * LAMPORTS_PER_SOL,
        }));

        const signed = await solana.signTransaction(tx);
        txHash = await connection.sendRawTransaction(signed.serialize());
        setPhase("burning");
        await connection.confirmTransaction(txHash, "confirmed");
      } catch (e) {
        console.error("Burn failed:", e);
        setBurnForever(false);
        txHash = null;
      }
    }

    // Save to Firebase
    try {
      await addDoc(collection(db, "confessions"), {
        text: text.trim(),
        size: sizeLabel,
        category: category || null,
        burned: burnForever && !!txHash,
        txHash: txHash || null,
        timestamp: serverTimestamp(),
        reactions: { candle: 0, heavy: 0, eye: 0, fire: 0, grave: 0 },
      });
    } catch {}

    setPhase("done");
    setTimeout(() => {
      onSubmitted();
    }, 3000);
  };

  // Phase: burning animation
  if (phase === "burning") {
    return (
      <div style={overlayStyle}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "24px", animation: "flicker 0.5s ease infinite" }}>🔥</div>
          <p style={{ fontFamily: "var(--mono)", fontSize: "0.75rem", color: "var(--amber)", letterSpacing: "0.1em" }}>
            writing to the chain...
          </p>
          <p style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--muted)", marginTop: "12px" }}>
            this will take a moment. it lives forever after this.
          </p>
        </div>
      </div>
    );
  }

  // Phase: done
  if (phase === "done") {
    return (
      <div style={overlayStyle}>
        <div className="fade-in" style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "1.4rem", color: "var(--paper)", marginBottom: "16px" }}>
            it's gone.
          </p>
          <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "1.1rem", color: "var(--muted)" }}>
            you're lighter now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...overlayStyle, animation: "modalIn 0.4s ease" }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: "100%", maxWidth: "680px", padding: "0 24px",
        display: "flex", flexDirection: "column", gap: "28px",
      }}>
        {/* Textarea */}
        <div style={{ position: "relative" }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={1200}
            style={{
              width: "100%", minHeight: "200px",
              background: "transparent", border: "none",
              color: "var(--paper)",
              fontFamily: "var(--serif)", fontStyle: "italic",
              fontSize: sizeStyle(sizeLabel),
              lineHeight: 1.8, resize: "none",
              caretColor: "var(--amber)",
            }}
          />
          {!text && (
            <span className="blink" style={{
              position: "absolute", top: 0, left: 0,
              color: "var(--amber)", fontSize: sizeStyle(sizeLabel),
              fontFamily: "var(--serif)", pointerEvents: "none",
            }}>|</span>
          )}
          <div style={{
            position: "absolute", bottom: "-20px", right: 0,
            fontFamily: "var(--mono)", fontSize: "0.58rem", color: "var(--muted)",
          }}>{text.length}/1200</div>
        </div>

        {/* Size slider */}
        <div style={{ marginTop: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: "0.58rem", color: "var(--muted)" }}>whisper</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: "0.58rem", color: "var(--amber)", letterSpacing: "0.05em" }}>{sizeLabel}</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: "0.58rem", color: "var(--muted)" }}>scream</span>
          </div>
          <input
            type="range" min="0" max="100" value={size}
            onChange={e => setSize(Number(e.target.value))}
            style={{
              width: "100%", accentColor: "var(--amber)",
              background: "transparent", height: "2px",
            }}
          />
        </div>

        {/* Category picker */}
        <div>
          <button
            onClick={() => setShowCategories(s => !s)}
            style={{
              fontFamily: "var(--mono)", fontSize: "0.6rem",
              color: category ? "var(--amber)" : "var(--muted)",
              letterSpacing: "0.08em",
            }}
          >
            {category ? `${CATEGORIES.find(c => c.key === category)?.symbol} ${CATEGORIES.find(c => c.key === category)?.label}` : "▸ categorize (optional)"}
          </button>
          {showCategories && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "12px" }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => { setCategory(cat.key); setShowCategories(false); }}
                  style={{
                    fontFamily: "var(--mono)", fontSize: "0.6rem",
                    color: category === cat.key ? "var(--amber)" : "var(--muted)",
                    padding: "5px 10px",
                    border: `1px solid ${category === cat.key ? "var(--amber)" : "var(--muted)"}`,
                    borderRadius: "3px", letterSpacing: "0.05em",
                    transition: "all 0.2s",
                  }}
                >{cat.symbol} {cat.label}</button>
              ))}
            </div>
          )}
        </div>

        {/* Burn forever */}
        <div style={{
          padding: "18px 20px",
          border: burnForever ? "1px solid var(--amber)" : "1px solid var(--muted)",
          borderRadius: "4px", transition: "border-color 0.3s",
        }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: "14px", cursor: "pointer" }}>
            <input
              type="checkbox" checked={burnForever}
              onChange={e => {
                setBurnForever(e.target.checked);
                if (e.target.checked && !walletAddress) connectWallet();
              }}
              style={{ accentColor: "var(--amber)", marginTop: "2px", width: "14px", height: "14px", flexShrink: 0 }}
            />
            <div>
              <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "0.95rem", color: "var(--paper)" }}>
                🔥 Burn this to chain forever
              </p>
              <p style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--muted)", marginTop: "5px", lineHeight: 1.6 }}>
                0.01 SOL · written permanently on Solana · immutable · no one can delete it
              </p>
              {burnForever && walletAddress && (
                <p style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--amber)", marginTop: "6px" }}>
                  ✓ {truncate(walletAddress)}
                </p>
              )}
              {burnForever && !walletAddress && (
                <button
                  onClick={connectWallet}
                  style={{
                    fontFamily: "var(--mono)", fontSize: "0.6rem",
                    color: "var(--amber)", marginTop: "6px",
                    letterSpacing: "0.05em",
                  }}
                >connect phantom →</button>
              )}
            </div>
          </label>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || text.trim().length < 3 || phase === "submitting"}
          style={{
            alignSelf: "flex-start",
            fontFamily: "var(--serif)", fontStyle: "italic",
            fontSize: "1.1rem", letterSpacing: "0.06em",
            color: text.trim().length >= 3 ? "var(--paper)" : "var(--muted)",
            transition: "color 0.3s",
            padding: "10px 0",
            animation: text.trim().length >= 3 ? "pulseAmber 3s ease infinite" : "none",
          }}
        >
          {phase === "submitting" ? "releasing..." : "release it"}
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: "24px", right: "32px",
            fontFamily: "var(--mono)", fontSize: "0.65rem",
            color: "var(--muted)", letterSpacing: "0.08em",
          }}
        >esc</button>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed", inset: 0, zIndex: 500,
  background: "rgba(10,10,10,0.97)",
  display: "flex", alignItems: "center", justifyContent: "center",
  animation: "modalIn 0.3s ease",
};

// ─── THE WALL PAGE ────────────────────────────────────────────────────────────
function WallPage({ onBurnPrompt }) {
  const [confessions, setConfessions] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "confessions"),
      orderBy("timestamp", "desc"),
      limit(60)
    );
    const unsub = onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setConfessions(docs);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = activeCategory
    ? confessions.filter(c => c.category === activeCategory)
    : confessions;

  return (
    <div style={{ paddingTop: "96px", paddingBottom: "120px", maxWidth: "800px", margin: "0 auto", padding: "96px 32px 140px" }}>

      {/* Filter bar */}
      <div style={{ marginBottom: "48px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <button
          onClick={() => setShowFilter(s => !s)}
          style={{
            fontFamily: "var(--mono)", fontSize: "0.6rem", letterSpacing: "0.1em",
            color: activeCategory ? "var(--amber)" : "var(--muted)",
          }}
        >⊞ filter {activeCategory ? "· " + CATEGORIES.find(c => c.key === activeCategory)?.symbol : ""}</button>

        {activeCategory && (
          <button
            onClick={() => setActiveCategory(null)}
            style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.06em" }}
          >× clear</button>
        )}

        {showFilter && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", width: "100%" }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => { setActiveCategory(cat.key); setShowFilter(false); }}
                style={{
                  fontFamily: "var(--mono)", fontSize: "0.58rem",
                  color: activeCategory === cat.key ? "var(--amber)" : "var(--muted)",
                  padding: "4px 10px",
                  border: `1px solid ${activeCategory === cat.key ? "var(--amber)" : "var(--faint)"}`,
                  borderRadius: "3px", letterSpacing: "0.04em",
                  transition: "all 0.2s", background: "var(--bg2)",
                }}
              >{cat.symbol} {cat.label}</button>
            ))}
          </div>
        )}
      </div>

      {/* Live count */}
      <div style={{ marginBottom: "40px" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.1em" }}>
          {filtered.length} confession{filtered.length !== 1 ? "s" : ""} {activeCategory ? "in this category" : "on the wall"}
        </span>
      </div>

      {loading ? (
        <p style={{ fontFamily: "var(--mono)", fontSize: "0.7rem", color: "var(--muted)" }}>
          reading the wall<span className="blink">...</span>
        </p>
      ) : filtered.length === 0 ? (
        <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "1rem", color: "var(--muted)" }}>
          nothing here yet. be the first.
        </p>
      ) : (
        filtered.map((c, i) => (
          <ConfessionCard key={c.id} data={c} index={i} onBurnPrompt={onBurnPrompt} />
        ))
      )}
    </div>
  );
}

// ─── CHAIN WALL PAGE ──────────────────────────────────────────────────────────
function ChainWallPage() {
  const [burned, setBurned] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "confessions"),
      where("burned", "==", true),
      orderBy("timestamp", "desc"),
      limit(100)
    );
    const unsub = onSnapshot(q, snap => {
      setBurned(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <div style={{ paddingTop: "96px", paddingBottom: "140px", maxWidth: "800px", margin: "0 auto", padding: "96px 32px 140px" }}>
      <div style={{ marginBottom: "56px" }}>
        <h1 style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "2rem", color: "var(--paper)", marginBottom: "16px" }}>
          The Chain Wall
        </h1>
        <p style={{ fontFamily: "var(--mono)", fontSize: "0.68rem", color: "var(--muted)", lineHeight: 1.8, maxWidth: "500px" }}>
          Everything else on the internet disappears. These don't.<br />
          Written permanently on the Solana blockchain. Immutable. Forever.
        </p>
        <div style={{ marginTop: "20px", width: "60px", height: "1px", background: "var(--amber-dim)" }} />
      </div>

      {loading ? (
        <p style={{ fontFamily: "var(--mono)", fontSize: "0.7rem", color: "var(--muted)" }}>
          reading the chain<span className="blink">...</span>
        </p>
      ) : burned.length === 0 ? (
        <div>
          <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "1rem", color: "var(--muted)" }}>
            No confessions have been burned yet.
          </p>
          <p style={{ fontFamily: "var(--mono)", fontSize: "0.65rem", color: "var(--muted)", marginTop: "12px" }}>
            Be the first to write something that lasts.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {burned.map((c, i) => (
            <div
              key={c.id}
              className="fade-in"
              style={{
                animationDelay: `${i * 0.08}s`,
                padding: "32px 0",
                borderBottom: "1px solid rgba(200,146,42,0.12)",
              }}
            >
              <p style={{
                fontFamily: "var(--serif)", fontStyle: "italic",
                fontSize: sizeStyle(c.size),
                color: "var(--paper)", lineHeight: 1.8,
                opacity: 0.9,
              }}>{c.text}</p>

              <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "0.58rem", color: "var(--amber-dim)" }}>
                  {timeAgo(c.timestamp)}
                </span>
                {c.txHash && (
                  <a
                    href={`https://solscan.io/tx/${c.txHash}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      fontFamily: "var(--mono)", fontSize: "0.58rem",
                      color: "var(--amber)", letterSpacing: "0.05em",
                      textDecoration: "none",
                    }}
                  >🔥 {truncate(c.txHash)} →</a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── LORE PAGE ────────────────────────────────────────────────────────────────
function LorePage() {
  return (
    <div style={{ paddingTop: "120px", paddingBottom: "160px", maxWidth: "600px", margin: "0 auto", padding: "120px 32px 160px" }}>
      <h1 style={{
        fontFamily: "var(--serif)", fontStyle: "italic",
        fontSize: "1.6rem", color: "var(--paper)",
        marginBottom: "52px", letterSpacing: "0.04em",
      }}>
        Why This Exists
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        {[
          "In 2014, someone built ConfessionCoin. They let people write their sins on the Bitcoin blockchain. It died. Nobody built it again. Until now.",
          "The internet never gave people a real place to say the thing. Not to perform it. Not to build an audience with it. Not to be brave about it. Just to say it — and have it witnessed by strangers who will never know who you are.",
          "Every platform you've ever used was designed to make you more visible. More legible. More monetizable. This one is designed to do the opposite. You are no one here. Your confession is everything.",
          "The blockchain part isn't a gimmick. It's a promise. When something is written on-chain, it can't be taken down by a company, a government, a moderator, or a moment of regret. Some things deserve to last. Some things need to last.",
          "We're not building a community. We're building a wall. A very old, very dark, very honest wall. Come and write on it.",
        ].map((para, i) => (
          <p key={i} className="fade-in" style={{
            animationDelay: `${i * 0.2}s`,
            fontFamily: "var(--serif)", fontStyle: i % 2 === 0 ? "italic" : "normal",
            fontSize: i === 0 ? "1.05rem" : "0.95rem",
            lineHeight: 1.9,
            color: i === 0 ? "var(--paper)" : "rgba(240,235,224,0.7)",
            paddingLeft: i === 0 ? 0 : "20px",
            borderLeft: i === 0 ? "none" : "1px solid var(--muted)",
          }}>{para}</p>
        ))}
      </div>

      <div style={{ marginTop: "64px", padding: "28px", border: "1px solid var(--faint)", borderRadius: "4px" }}>
        <p style={{ fontFamily: "var(--mono)", fontSize: "0.62rem", color: "var(--muted)", lineHeight: 1.8, marginBottom: "16px" }}>
          $CFN · ConfessCoin
        </p>
        <CopyCA />
        <div style={{ marginTop: "20px", display: "flex", gap: "20px" }}>
          <a href={SOCIAL.x} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.08em" }}
            className="nav-link">X →</a>
          <a href={SOCIAL.xCommunity} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.08em" }}
            className="nav-link">community →</a>
          <a href={SOCIAL.github} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.08em" }}
            className="nav-link">github →</a>
        </div>
      </div>
    </div>
  );
}

// ─── FLOATING CONFESS BUTTON ──────────────────────────────────────────────────
function ConfessButton({ onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "fixed", bottom: "36px", left: "50%",
        transform: "translateX(-50%)",
        zIndex: 200,
        fontFamily: "var(--serif)", fontStyle: "italic",
        fontSize: "1rem", letterSpacing: "0.18em",
        color: hovered ? "var(--bg)" : "var(--amber)",
        background: hovered ? "var(--amber)" : "transparent",
        border: "1px solid var(--amber)",
        padding: "14px 44px",
        borderRadius: "2px",
        transition: "all 0.3s ease",
        boxShadow: hovered ? "0 0 32px rgba(200,146,42,0.5)" : "0 0 16px rgba(200,146,42,0.15)",
        backdropFilter: "blur(8px)",
      }}
    >
      CONFESS
    </button>
  );
}

// ─── SOUND ────────────────────────────────────────────────────────────────────
function useAmbientSound(enabled) {
  const audioRef = useRef(null);
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/thesound.mp3");
      audioRef.current.loop = true;
      audioRef.current.volume = 0.18;
    }
    if (enabled) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [enabled]);
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("wall");
  const [showConfess, setShowConfess] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [burnTarget, setBurnTarget] = useState(null);

  useAmbientSound(soundOn);

  const handleBurnPrompt = (confessionId) => {
    setBurnTarget(confessionId);
    setShowConfess(true);
  };

  const handleSubmitted = () => {
    setShowConfess(false);
    setPage("wall");
  };

  return (
    <>
      <GlobalStyles />

      {/* Solana Web3 CDN */}
      <script
        src="https://cdnjs.cloudflare.com/ajax/libs/solana-web3.js/1.91.8/index.iife.min.js"
        onLoad={() => { window.solanaWeb3 = window.solanaWeb3 || {}; }}
      />

      <Navbar
        page={page}
        setPage={setPage}
        soundOn={soundOn}
        toggleSound={() => setSoundOn(s => !s)}
      />

      {/* CA Bar */}
      <div style={{
        position: "fixed", top: "64px", left: 0, right: 0, zIndex: 90,
        display: "flex", justifyContent: "center", padding: "6px",
        background: "rgba(14,14,14,0.85)", borderBottom: "1px solid var(--faint)",
        backdropFilter: "blur(6px)",
      }}>
        <CopyCA />
      </div>

      {/* Pages */}
      <div style={{ paddingTop: "30px" }}>
        {page === "wall"  && <WallPage onBurnPrompt={handleBurnPrompt} />}
        {page === "chain" && <ChainWallPage />}
        {page === "lore"  && <LorePage />}
      </div>

      {/* Confess button - only on wall */}
      {page === "wall" && !showConfess && (
        <ConfessButton onClick={() => setShowConfess(true)} />
      )}

      {/* Modal */}
      {showConfess && (
        <ConfessModal
          onClose={() => setShowConfess(false)}
          onSubmitted={handleSubmitted}
        />
      )}
    </>
  );
}