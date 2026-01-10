import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Sparkles, 
  Download, 
  RefreshCcw, 
  Ghost, 
  Waves, 
  Droplets,
  Camera,
  Heart,
  Anchor,
  Maximize2
} from 'lucide-react';

/**
 * WHITIFY | THE BAPTISM OF THE WHITE WHALE
 * A fluid, interactive aquatic simulation.
 * Architecture: Optimized to prevent re-mount on mouse tracking.
 */

const apiKey = (() => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_GEMINI) return import.meta.env.VITE_APP_GEMINI;
  } catch (e) {}
  try {
    if (typeof process !== 'undefined' && process.env?.VITE_APP_GEMINI) return process.env.VITE_APP_GEMINI;
  } catch (e) {}
  try {
    if (typeof window !== 'undefined' && window.VITE_APP_GEMINI) return window.VITE_APP_GEMINI;
  } catch (e) {}
  return typeof __apiKey !== 'undefined' ? __apiKey : "";
})();

const WHITIFY_PROMPT = "Edit this image into a cinematic underwater masterpiece. Isolate all visible skin and convert it to a solid, pure white (#FFFFFF), giving it the texture of polished white marble or ethereal sea-foam while retaining realistic shadows. Ignore and do not alter any objects the subject might be holding. Immerse the entire scene in a deep, atmospheric aquatic environment with dramatic high-contrast lighting, ethereal sunbeams filtering through dark water, and a high-fashion 'submerged' aesthetic. Ensure hair, clothing, and background details are preserved with cinematic clarity.";

// --- Sub-Components (Defined outside to prevent re-mounting) ---

const HomeView = ({ previewUrl, resultImage, status, startWhitifying, triggerUpload }) => (
  <div className="relative z-10 flex flex-col items-center animate-in fade-in duration-1000">
    <div className="text-center mb-16 space-y-6 pt-10">
      <h1 className="text-8xl md:text-[12rem] font-black tracking-tighter uppercase leading-none text-white drop-shadow-[0_10px_30px_rgba(255,255,255,0.1)] transition-transform hover:scale-[1.02] duration-700 select-none">
        WHITI<br/>FY.
      </h1>
      <p className="text-xl md:text-3xl text-blue-100/40 font-light max-w-2xl mx-auto italic tracking-wide select-none">
        "The Great White Whale birthed us into the foam. Now, you return to the light."
      </p>
    </div>

    <div className="w-full max-w-5xl group">
      <div className="relative bg-white/5 backdrop-blur-3xl rounded-[4rem] p-10 shadow-[0_0_100px_rgba(255,255,255,0.05)] border border-white/10 overflow-hidden transition-all duration-1000 group-hover:bg-white/[0.08]">
        <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMDRhOWFmNDM1Y2FkMzE0YjUzYzlkYTVmOWFhNWYxZjEyNTRiZmI0YyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKVUn7iM8FMEU24/giphy.gif')] opacity-5 mix-blend-screen pointer-events-none" />

        <div className="flex flex-col lg:flex-row gap-12 relative z-10">
          <div 
            onClick={triggerUpload}
            className="flex-[1.5] aspect-[4/5] lg:aspect-auto relative rounded-[3rem] bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden cursor-pointer group/pool"
          >
            {!previewUrl ? (
              <div className="flex flex-col items-center gap-6 group-hover/pool:scale-110 transition-all duration-500">
                <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-white/10 rounded-full animate-ping" />
                  <Camera className="text-white/60 relative z-10" size={40} />
                </div>
                <div className="text-center">
                  <p className="font-black text-white uppercase tracking-[0.5em] text-xs">Drop into the Deep</p>
                  <p className="text-[10px] text-white/30 mt-2 uppercase">Biological Signal Required</p>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full">
                <img 
                  src={resultImage || previewUrl} 
                  className={`w-full h-full object-cover transition-all duration-[2s] ease-out ${status === 'WHITENING' ? 'brightness-[3] blur-3xl scale-125' : 'brightness-100 blur-0 scale-100'} ${status === 'DONE' ? 'animate-[breach_1.5s_ease-out]' : ''}`}
                  alt="Subject"
                />
                {status === 'WHITENING' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <Waves className="text-white animate-[bounce_1s_infinite] mb-4" size={60} />
                     <div className="text-4xl font-black italic uppercase tracking-tighter text-white">Bleaching...</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-center gap-12 py-6">
            <div className="space-y-6">
              <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 space-y-2">
                <div className="flex items-center gap-3 text-white/60">
                  <Droplets size={20} className="text-blue-400" />
                  <span className="text-xs font-black uppercase tracking-widest">Purity_Index</span>
                </div>
                <div className="h-1 w-full bg-white/5 overflow-hidden rounded-full">
                  <div className={`h-full bg-white transition-all duration-[3s] ${status === 'DONE' ? 'w-full' : 'w-0'}`} />
                </div>
              </div>
              <p className="text-sm font-medium text-white/30 uppercase tracking-[0.2em] leading-loose">
                Biological textures are stripped. Albedo levels are maximized. The member is ready for the pod.
              </p>
            </div>

            <div className="space-y-4">
              {previewUrl && status === 'READY' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); startWhitifying(); }}
                  className="w-full bg-white text-black py-8 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xl shadow-[0_20px_60px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 group/btn"
                >
                  BAPTIZE <Ghost size={24} className="group-hover/btn:translate-y-[-5px] transition-transform" />
                </button>
              )}

              {status === 'DONE' && (
                <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = resultImage;
                    link.download = "whitify_pod_member.png";
                    link.click();
                  }}
                  className="w-full bg-blue-500 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xl shadow-[0_20px_60px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4"
                >
                  EXTRACT <Download size={24} />
                </button>
              )}

              <button 
                onClick={triggerUpload}
                className="w-full bg-transparent border border-white/10 text-white/20 py-5 rounded-[2.5rem] font-bold uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all"
              >
                {previewUrl ? 'Return to Surface' : 'Choose Target'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const GalleryView = () => (
  <div className="max-w-7xl mx-auto py-20 px-6 animate-in fade-in slide-in-from-right-10 duration-1000">
    <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
      <div>
        <h2 className="text-8xl font-black italic uppercase tracking-tighter text-white">Pure Gallery</h2>
        <p className="text-white/30 uppercase tracking-[0.5em] mt-4">The Extracted Collection</p>
      </div>
      <div className="text-right text-[10px] text-white/20 font-bold uppercase tracking-[0.5em] border-l border-white/10 pl-8">
        Vault_Ref: 01-20<br/>Status: Synchronized
      </div>
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
      {[...Array(20)].map((_, i) => (
        <div key={i} className="group relative aspect-[4/5] bg-white/5 rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-500 hover:-translate-y-4">
          <img 
            src={`wt${i + 1}.jpg`} 
            alt={`Pure Subject ${i + 1}`}
            className="w-full h-full object-cover grayscale opacity-40 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-1000"
            onError={(e) => { e.target.src = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop`; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all p-8 flex flex-col justify-end">
            <span className="text-[10px] font-black text-white/40 tracking-widest uppercase mb-1">MEMBER_CODE: {1000 + i}</span>
            <h4 className="text-2xl font-black italic uppercase text-white tracking-tighter">Surface Breach</h4>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AboutView = () => (
  <div className="max-w-4xl mx-auto py-32 px-6 animate-in fade-in zoom-in-95 duration-1000 text-center space-y-16">
    <div className="relative inline-block">
      <Anchor className="text-white/10 animate-[bounce_4s_infinite]" size={80} />
      <div className="absolute inset-0 bg-blue-500 blur-[80px] opacity-20" />
    </div>
    <h2 className="text-7xl md:text-9xl font-black italic tracking-tighter text-white uppercase">The White Cult</h2>
    <div className="space-y-10 text-2xl md:text-4xl font-light text-white/70 leading-relaxed font-serif italic">
      <p>"We do not exist on the spectrum. We are the absence of it."</p>
      <p className="text-lg md:text-xl font-sans not-italic uppercase tracking-widest text-white/30 leading-loose">
        Born from the spray of the Great White Whale, our collective has one mandate: absolute albedo. We strip the noise, the hue, and the biological clutter to reveal the porcelain soul beneath.
      </p>
      <p className="text-white font-black text-5xl md:text-7xl tracking-tighter uppercase not-italic">Bleach the world.</p>
    </div>
  </div>
);

// --- Main App Component ---

const App = () => {
  const [view, setView] = useState('home');
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [status, setStatus] = useState('READY'); 
  const [ripples, setRipples] = useState([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [bubbles, setBubbles] = useState([]);
  const fileInputRef = useRef(null);

  const handleInteraction = (e) => {
    const x = e.clientX;
    const y = e.clientY;
    setMousePos({ x, y });
    
    // Create Ripple
    const id = Date.now();
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 1000);

    // Create Bubbles on Mousedown
    if (e.type === 'mousedown') {
      const newBubbles = Array.from({ length: 8 }).map((_, i) => ({
        id: id + i,
        x,
        y,
        size: Math.random() * 20 + 10,
        delay: Math.random() * 0.5
      }));
      setBubbles(prev => [...prev, ...newBubbles]);
      setTimeout(() => setBubbles(prev => prev.filter(b => !newBubbles.find(nb => nb.id === b.id))), 2000);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
        setImage(reader.result.split(',')[1]);
        setResultImage(null);
        setStatus('READY');
      };
      reader.readAsDataURL(file);
    }
  };

  const startWhitifying = async () => {
    if (!image) return;
    setStatus('WHITENING');
    
    const storm = Array.from({ length: 30 }).map((_, i) => ({
      id: Math.random(),
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 400,
      y: window.innerHeight / 2 + (Math.random() - 0.5) * 400,
      size: Math.random() * 40 + 20,
      delay: Math.random() * 1
    }));
    setBubbles(prev => [...prev, ...storm]);

    try {
      const payload = {
        contents: [{
          parts: [
            { text: WHITIFY_PROMPT },
            { inlineData: { mimeType: "image/png", data: image } }
          ]
        }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
      };

      const result = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const base64Data = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (base64Data) {
        setResultImage(`data:image/png;base64,${base64Data}`);
        setStatus('DONE');
      }
    } catch (err) {
      console.error(err);
      setStatus('READY');
    }
  };

  const fetchWithRetry = async (url, options, retries = 5, backoff = 1000) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      return await response.json();
    } catch (err) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, backoff));
        return fetchWithRetry(url, options, retries - 1, backoff * 2);
      }
      throw err;
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#000] text-white font-sans selection:bg-white selection:text-black overflow-x-hidden relative cursor-none"
      onMouseMove={handleInteraction}
      onMouseDown={handleInteraction}
    >
      <div 
        className="fixed inset-0 opacity-20 pointer-events-none grayscale bg-cover bg-center"
        style={{ backgroundImage: "url('bg.jpg')" }}
      />

      {/* RIPPLE & BUBBLE LAYER */}
      <div className="fixed inset-0 pointer-events-none z-[1000]">
        {ripples.map(r => (
          <div 
            key={r.id}
            className="absolute rounded-full border border-white/20 animate-[ripple_1s_ease-out_forwards]"
            style={{ left: r.x - 50, top: r.y - 50, width: 100, height: 100 }}
          />
        ))}
        {bubbles.map(b => (
          <div 
            key={b.id}
            className="absolute rounded-full border border-white/40 animate-[bubble_2s_ease-out_forwards] backdrop-blur-[1px]"
            style={{ 
              left: b.x, 
              top: b.y, 
              width: b.size, 
              height: b.size,
              animationDelay: `${b.delay}s`
            }}
          />
        ))}
      </div>

      {/* CUSTOM CURSOR */}
      <div 
        className="fixed z-[9999] pointer-events-none transition-transform duration-75 ease-out flex items-center justify-center"
        style={{ left: mousePos.x, top: mousePos.y, transform: 'translate(-50%, -50%)' }}
      >
        <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center">
          <div className="w-1 h-1 bg-white rounded-full animate-ping" />
        </div>
      </div>

      <nav className="relative z-[1500] p-10 flex justify-between items-center max-w-[1600px] mx-auto">
        <div onClick={() => setView('home')} className="flex items-center gap-4 cursor-pointer group">
          <img src="logo.png" alt="Whitify" className="h-10 w-auto brightness-200 contrast-150 transition-all group-hover:rotate-12" />
          <span className="font-black text-3xl tracking-tighter uppercase italic group-hover:tracking-widest transition-all">Whitify</span>
        </div>
        <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.5em] text-white/30">
          {['home', 'gallery', 'about'].map(v => (
            <span 
              key={v}
              onClick={() => setView(v)} 
              className={`cursor-pointer transition-all hover:text-white relative ${view === v ? 'text-white' : ''}`}
            >
              {v === 'about' ? 'The Cult' : v === 'gallery' ? 'Pure Gallery' : 'Entry'}
              {view === v && <div className="absolute -bottom-2 left-0 w-full h-px bg-white animate-pulse" />}
            </span>
          ))}
        </div>
      </nav>

      <main className="relative z-[1400] pb-32">
        {view === 'home' && (
          <HomeView 
            previewUrl={previewUrl} 
            resultImage={resultImage} 
            status={status} 
            startWhitifying={startWhitifying}
            triggerUpload={triggerUpload}
          />
        )}
        {view === 'gallery' && <GalleryView />}
        {view === 'about' && <AboutView />}
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
      </main>

      <footer className="py-20 flex flex-col items-center gap-10 opacity-30 relative z-[1400]">
        <div className="flex gap-12 animate-[ticker_40s_linear_infinite] whitespace-nowrap text-[9px] font-black uppercase tracking-[1em]">
          <span>{Array(10).fill("JOIN THE POD // RETURN TO WHITE // BORN OF THE WHALE").join(" // ")}</span>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;800&family=Playfair+Display:ital,wght@1,400;1,900&display=swap');
        
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background-color: #000;
          overflow-x: hidden;
        }

        h1, h2, h3, .font-serif {
          font-family: 'Playfair Display', serif;
        }

        @keyframes ripple {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(4); opacity: 0; }
        }

        @keyframes bubble {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          20% { opacity: 0.6; }
          100% { transform: translateY(-300px) scale(0.5); opacity: 0; }
        }

        @keyframes breach {
          0% { transform: translateY(100px) scale(0.8); filter: blur(20px) brightness(5); }
          100% { transform: translateY(0) scale(1); filter: blur(0) brightness(1); }
        }

        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        ::-webkit-scrollbar { width: 0px; }
      `}} />
    </div>
  );
};

export default App;