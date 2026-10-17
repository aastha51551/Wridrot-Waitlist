import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { Sparkles, Skull, HelpCircle, Archive, BookOpen, Send, CheckCircle2, Search, ArrowRight, BookOpenCheck } from "lucide-react";
import GothicForm from "./components/GothicForm";
import ThreeDToken from "./components/ThreeDToken";
import FlipbookMagazine from "./components/FlipbookMagazine";
import { WaitlistUser, ShareChannel } from "./types";

export default function App() {
  const [currentUser, setCurrentUser] = useState<WaitlistUser | null>(null);
  const [liveCount, setLiveCount] = useState<number>(0); // Starts from 0 as requested!
  const [retrievalId, setRetrievalId] = useState("");
  const [retrievalError, setRetrievalError] = useState<string | null>(null);
  const [retrievalSuccess, setRetrievalSuccess] = useState(false);
  const [dbSetupError, setDbSetupError] = useState<{ code: string; message: string; projectId: string } | null>(null);

  // Fetch live count from server on load & poll every 6 seconds to keep it real-time!
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/waitlist/count");
        if (res.ok) {
          const data = await res.json();
          setLiveCount(data.count);
          if (data.firestore_error) {
            setDbSetupError(data.firestore_error);
          } else {
            setDbSetupError(null);
          }
        }
      } catch (err) {
        console.error("Failed to query live seeker count:", err);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 6000);
    return () => clearInterval(interval);
  }, []);
  
  
  useEffect(() => {
    const checkUrlState = async () => {
      // 1. Check path segments (e.g. /token/FA-XXXXXX)
      const pathSegments = window.location.pathname.split("/");
      const tokenIndex = pathSegments.indexOf("token");
      if (tokenIndex !== -1 && pathSegments[tokenIndex + 1]) {
        const tokenId = pathSegments[tokenIndex + 1];
        await retrieveUserToken(tokenId);
        return;
      }

      // 2. Check search parameters (e.g. ?token=FA-XXXXX&just_verified=true)
      const params = new URLSearchParams(window.location.search);
      const tokenParam = params.get("token");
      const justVerified = params.get("just_verified");

      if (tokenParam) {
        await retrieveUserToken(tokenParam);
        if (justVerified === "true") {
          triggerGothicConfetti();
          // Strip parameters to clean browser address bar nicely
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };
    checkUrlState();
  }, []);

  // Retrieve user waitlist entries by their Token ID
  const retrieveUserToken = async (id: string) => {
    setRetrievalError(null);
    setRetrievalSuccess(false);
    const cleanedId = id.trim().toUpperCase();

    if (!cleanedId) return;

    try {
      const res = await fetch(`/api/waitlist/token/${cleanedId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Token seal was not found in the archives.");
      }
      const data = await res.json();
      setCurrentUser(data.user);
      setRetrievalSuccess(true);
    } catch (err: any) {
      setRetrievalError(err.message || "Failed to retrieve your token.");
    }
  };

  // Trigger real-time sharing statistics to the server side
  const handleShareRecorded = async (channel: ShareChannel) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/waitlist/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentUser.id, channel })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser({
          ...currentUser,
          shares: data.shares
        });
      }
    } catch (err) {
      console.error("Failed to post share meta:", err);
    }
  };

  // Clean signup enrollment handle
  const handleRegisterSuccess = (user: WaitlistUser) => {
    setCurrentUser(user);
    triggerGothicConfetti();
    // Pre-populate retrieval ID
    setRetrievalId(user.id);
  };

  // Spectacular coven crimson-themed confetti explosion for premium feedback
  const triggerGothicConfetti = () => {
    const end = Date.now() + 1.2 * 1000;
    const colors = ["#7f1d1d", "#f43f5e", "#991b1b", "#fb7185", "#f59e0b"]; // crimson, ruby, gold, amber

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  return (
    <div className="min-h-screen bg-[#030101] flex flex-col items-center relative Selection:bg-red-900 Selection:text-white pb-12 animate-crt select-none">
      

      


      {/* 1. Dynamic Animated Crystal Ball Background */}
      <div className="absolute top-[200px] sm:top-[250px] left-1/2 -translate-x-1/2 pointer-events-none z-0 opacity-15 overflow-visible select-none flex flex-col items-center justify-center scale-90 sm:scale-110">
        {/* Crystal Globe */}
        <div className="relative w-[340px] h-[340px] rounded-full border border-red-950/40 bg-zinc-950/20 backdrop-blur-[1px] animate-ball flex items-center justify-center overflow-hidden">
          
          {/* Inner Swirling Cloud Layers */}
          <div className="absolute w-[260px] h-[260px] rounded-full bg-[radial-gradient(circle_at_center,rgba(185,28,28,0.5)_0%,rgba(9,3,3,0.1)_70%,transparent_100%)] blur-xl animate-mist-1" />
          <div className="absolute w-[220px] h-[220px] rounded-full bg-[radial-gradient(circle_at_center,rgba(147,51,234,0.4)_0%,rgba(9,3,3,0.1)_70%,transparent_100%)] blur-lg animate-mist-2" />
          
          {/* Sparkles / Magic nodes */}
          <div className="absolute top-1/4 left-1/3 w-1.5 h-1.5 rounded-full bg-red-400 blur-[0.5px] animate-sparkle-slow" />
          <div className="absolute top-1/2 right-1/4 w-2 h-2 rounded-full bg-red-500 blur-[0.5px] animate-sparkle-fast" />
          <div className="absolute bottom-1/3 left-1/4 w-1 h-1 rounded-full bg-red-300 blur-[0.5px] animate-sparkle-slow" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 rounded-full bg-purple-400 blur-[0.5px] animate-sparkle-fast" style={{ animationDelay: '0.8s' }} />

          {/* Reflections and highlights (Adds 3D glass effect) */}
          {/* Top highlight curved shine */}
          <div className="absolute top-2 left-6 right-6 h-16 bg-gradient-to-b from-white/10 to-transparent rounded-[50%_50%_10%_10%] opacity-40 blur-[1px]" />
          {/* Bottom internal glow */}
          <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-red-900/20 via-red-950/10 to-transparent rounded-b-full opacity-60" />
          
          {/* Edge Rim Light */}
          <div className="absolute inset-0 rounded-full border-[1.5px] border-t-white/15 border-b-red-900/40 border-l-white/5 border-r-white/5" />
        </div>

        {/* Elegant Pedestal/Stand (SVG for high precision gothic design) */}
        <div className="relative -mt-4 w-[200px] h-[60px] flex justify-center">
          <svg width="100%" height="100%" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-red-950/40">
            {/* Upper Grip Ring */}
            <path d="M 60 4 Q 100 12, 140 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 50 8 Q 100 18, 150 8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
            
            {/* Elegant curved metallic claws holding the globe */}
            <path d="M 55 6 C 45 15, 48 25, 42 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M 145 6 C 155 15, 152 25, 158 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            
            {/* Pedestal Central Stem */}
            <path d="M 90 12 L 85 35 Q 100 38, 115 35 L 110 12" fill="currentColor" opacity="0.15" />
            <path d="M 85 12 L 80 40 L 120 40 L 115 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
            
            {/* Central stem gems / decorations */}
            <circle cx="100" cy="26" r="3" fill="#b91c1c" className="animate-pulse" />
            
            {/* Elegant base platform */}
            <path d="M 40 44 Q 100 52, 160 44 L 170 54 Q 100 59, 30 54 Z" fill="currentColor" opacity="0.1" />
            <path d="M 35 44 Q 100 50, 165 44" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M 25 54 Q 100 60, 175 54" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* 2. Vintage CRT overlay glow effects */}
      <div className="absolute inset-x-0 top-0 h-[600px] bg-gradient-to-b from-red-950/15 via-black/0 to-transparent pointer-events-none" />

      {/* Global Page Layout Container */}
      <div className="container max-w-6xl mx-auto px-4 pt-10 md:pt-16 relative z-10 flex-grow">
        
        {/* Header Branding */}
        <header className="text-center mb-10 md:mb-16">
          <p className="text-[10px] md:text-sm font-mono tracking-[0.25em] text-red-500 uppercase font-semibold mb-3">
            YOUR NIGHTMARE FUEL
          </p>

          <div className="space-y-2">
            <h2 className="font-halja tracking-wide text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[8.5rem] text-white font-normal leading-[0.9] break-words flex flex-wrap items-center justify-center gap-x-1 drop-shadow-[0_4px_20px_rgba(255,255,255,0.2)]">
              <span>WRIDROT</span>
            </h2>
            <h2 className="font-wide text-4xl sm:text-6xl md:text-7xl font-black text-blood tracking-tighter leading-none uppercase break-words">
              MAGAZINE
            </h2>
          </div>

          <p className="max-w-2xl mx-auto font-serif text-xs md:text-sm text-gray-400 mt-5 leading-relaxed leading-6 tracking-wide px-4">
            An online horror magazine by horror fans for horror fans. Step into the world of chilling horror tales, dark folklore, flash fictions, and haunting illustrated stories. Scroll ahead with trembling fingers.
          </p>
        </header>



        {/* Interactive Flipbook Showcase Section */}
        <FlipbookMagazine />

        {dbSetupError && (
          <section id="firebase-setup-helper-card" className="w-full max-w-2xl mx-auto mb-12 p-6 rounded-2xl bg-[#0b0303] border-2 border-dashed border-red-900/80 shadow-[0_0_30px_rgba(239,68,68,0.15)] animate-fade-in relative overflow-hidden text-left relative z-20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-950/10 rounded-full filter blur-2xl pointer-events-none" />
            <div className="flex items-start gap-4">
              <div className="p-2 bg-red-950/40 rounded-full border border-red-900/50 mt-1 flex-shrink-0 animate-pulse">
                <Skull className="w-5 h-5 text-red-500" />
              </div>
              <div className="space-y-4 flex-grow">
                <div>
                  <h3 className="font-serif-goth text-lg text-red-400 font-bold tracking-wide">
                    COVEN VAULT DEPLOYMENT REQUIRED
                  </h3>
                  <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
                    Cloud Firestore is pending activation
                  </p>
                </div>

                <div className="text-xs text-gray-400 leading-relaxed border-l-2 border-red-900/40 pl-4 space-y-3.5">
                  <p>
                    Greetings, architect. The Wridrot Magazine portal is fully compiled, but the cloud database has not yet been enabled in your active Firebase project <strong className="text-red-400">"{dbSetupError.projectId}"</strong>.
                  </p>
                  
                  <div className="space-y-2.5 mt-2 bg-black/40 p-3.5 rounded-xl border border-red-950/40 font-mono text-[11px] text-gray-300">
                    <div className="font-sans font-bold text-red-500/90 text-xs mb-1.5 uppercase flex items-center gap-1.5 border-b border-red-950/45 pb-1">
                      <span>📜 RITUAL SETUP STEPS</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-2">
                      <li>
                        <strong>Open your Firebase Console:</strong>{" "}
                        <a 
                          href={`https://console.firebase.google.com/project/${dbSetupError.projectId}/firestore`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-red-400 underline hover:text-red-300 font-semibold inline-block"
                        >
                          Click here to open project "{dbSetupError.projectId}" direct to Firestore
                        </a>
                      </li>
                      <li>
                        <strong>Navigate to Firestore:</strong> If navigating manually, in the left sidebar click on <strong className="text-white">Build</strong> and select <strong className="text-white font-semibold">Firestore Database</strong>.
                      </li>
                      <li>
                        <strong>Create Database:</strong> Click the orange <strong className="text-red-500 font-semibold">"Create database"</strong> button.
                      </li>
                      <li>
                        <strong>Choose Edition:</strong> Select <strong className="text-white">Enterprise Edition</strong> or keep defaults. Both utilize the generous free Spark quota.
                      </li>
                      <li>
                        <strong>Database Location:</strong> Select your preferred region (such as <strong className="text-white">us-central</strong>, <strong className="text-white font-semibold">eur3</strong>, or closest).
                      </li>
                      <li>
                        <strong>Rules Configuration:</strong> Choose <strong className="text-white">"Start in test mode"</strong> or <strong className="text-white font-semibold">"Start in production mode"</strong>. Your secure coven security rules from `firestore.rules` are already deployed on our end!
                      </li>
                    </ol>
                  </div>
                  
                  <p className="text-[11px] text-gray-500 italic">
                    Once you complete these steps, wait about 15-30 seconds for the Firestore service to stand up, then refresh this page. Your virtual coven tokens will function perfectly!
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* MAIN BODY GRID */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-14 items-start xl:px-8">
          
          {/* LEFT PANEL: Form / Access portal panel (5 columns) */}
          <section className="lg:col-span-5 space-y-8 flex flex-col justify-center">
            {!currentUser ? (
              <>

                {/* Gothic Register Form Component */}
                <GothicForm onSuccess={handleRegisterSuccess} />
              </>
            ) : (
              <div id="waitlist-registered-welcome" className="p-6 rounded-2xl bg-[#090303]/90 border border-emerald-950/60 shadow-2xl space-y-5 animate-fade-in relative overflow-hidden">
                
                {/* Visual success background glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-950/15 rounded-full pointer-events-none filter blur-2xl" />

                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-emerald-950/60 p-2 border border-emerald-900/40">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-gothic text-white font-bold tracking-wider text-base">
                      REGISTERED SUCCESSFULLY
                    </h3>
                    <p className="font-mono text-[9px] text-emerald-400 uppercase tracking-widest">
                      At Rank #{currentUser.displayNumber}
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs text-gray-300 leading-relaxed leading-5">
                  <p>
                    Congratulations, <strong className="text-white text-sans font-semibold">{currentUser.name}</strong>. Your email (<em>{currentUser.email}</em>) has been registered with us. Kindly sign up to our Patreon Page (below the token) to be notified before every magazine issue.
                  </p>
                  <p>
                    Your digital membership token is ready (scroll down if not on PC). You can hover, drag, and tilt the card in 3D using your mouse or screen coordinate. 
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Feel free to download your token to post it on your Instagram, WhatsApp, and socials to flex and invite your friends!
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-900 flex justify-between items-center">
                  <span className="font-mono text-[9px] text-gray-600">
                    WRIDROT MAGAZINE
                  </span>
                  
                  <button
                    id="register-another-btn"
                    onClick={() => {
                      setCurrentUser(null);
                      setRetrievalSuccess(false);
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-red-950/30 text-red-400 border border-red-900/40 hover:bg-neutral-900 text-[10px] font-mono tracking-widest rounded transition-all cursor-pointer"
                  >
                    REGISTER NEW PASS
                  </button>
                </div>
              </div>
            )}

            {/* Retrieval scroll box */}
            <div id="token-retrieval-box" className="p-5 rounded-2xl bg-[#050101]/60 border border-gray-950/80 mt-2 shadow-inner">
              <h4 className="font-mono text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                <Archive className="w-3.5 h-3.5 text-gray-600" />
                RETRIEVE YOUR ID
              </h4>
              
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    id="retrieve-token-input"
                    type="text"
                    value={retrievalId}
                    onChange={(e) => setRetrievalId(e.target.value)}
                    placeholder="ENTER ID (e.g. WM11111)"
                    className="w-full pl-9 pr-3 py-1.5 bg-black text-xs text-gray-300 font-mono border border-gray-900 rounded-lg placeholder-gray-800 focus:outline-none focus:border-red-950/80 transition-all uppercase"
                  />
                </div>
                
                <button
                  id="retrieve-scroll-btn"
                  onClick={() => retrieveUserToken(retrievalId)}
                  className="px-4 py-1.5 bg-neutral-950/40 text-gray-300 border border-neutral-900 hover:border-red-950 hover:text-red-400 text-[10px] font-mono rounded-lg transition-all cursor-pointer flex items-center gap-1"
                >
                  LOAD
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {retrievalError && (
                <p id="retrieve-error-notice" className="text-[10px] text-red-500 font-mono mt-2 pl-1 animate-pulse flex items-center gap-1">
                  ⚠ {retrievalError}
                </p>
              )}
              {retrievalSuccess && (
                <p id="retrieve-success-notice" className="text-[10px] text-emerald-500 font-mono mt-2 pl-1 flex items-center gap-1 bg-emerald-950/10 py-1 px-2 border border-emerald-950/20 rounded">
                  <BookOpenCheck className="w-3.5 h-3.5" />
                  Entry found
                </p>
              )}
            </div>

          </section>

          {/* RIGHT PANEL: Dynamic 3D Token Oracle Display (7 columns) */}
          <section className="lg:col-span-7 flex flex-col items-center justify-center bg-[#070303]/40 border border-red-950/10 p-4 md:p-8 rounded-3xl backdrop-blur-sm self-stretch shrink-0">
            
            {/* Real 3D interactive Token Viewer Canvas */}
            <ThreeDToken 
              user={currentUser} 
              onShareRecorded={handleShareRecorded} 
            />
          </section>

        </main>

        {/* 3. FOOTER (Branding styled exactly after Image 2) */}
        <footer className="w-full border-t border-red-950/20 mt-16 pt-8 pb-4 text-center">
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-5">
            <a 
              href="mailto:wridrotmagazine@gmail.com"
              className="px-5 py-2 hover:bg-red-950/25 border border-red-950/40 hover:border-red-800 text-gray-400 hover:text-red-400 text-[9px] md:text-xs font-mono tracking-widest uppercase rounded font-medium transition-all cursor-pointer inline-block"
            >
              CONTACT US
            </a>
          </div>
          
          <p className="font-mono text-[9px] text-gray-700 tracking-wider">
            © {new Date().getFullYear()} WRIDROT MAGAZINE. ALL RIGHTS RESERVED
          </p>
        </footer>

      </div>
    </div>
  );
}
