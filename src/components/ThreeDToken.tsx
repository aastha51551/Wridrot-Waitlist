import React, { useRef, useEffect, useState } from "react";
import { WaitlistUser } from "../types";
import { Download, Sparkles, AlertCircle, Share2, Instagram, MessageCircle, RefreshCw } from "lucide-react";

interface ThreeDTokenProps {
  user: WaitlistUser | null;
  onShareRecorded: (channel: "instagram" | "whatsapp" | "sms") => void;
}

export default function ThreeDToken({ user, onShareRecorded }: ThreeDTokenProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHoveemerald, setIsHoveemerald] = useState(false);
  const [isConjuring, setIsConjuring] = useState(false);
  const [conjuringProgress, setConjuringProgress] = useState(0);
  const [conjuringLabel, setConjuringLabel] = useState("");
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  // Active waitlist details fallback
  const displayName = user?.name || "YOUR NAME";
  const displayNo = user ? `#00${user.displayNumber}` : "#00????";
  const displayTokenId = user?.id || "WM-XXXXXX";
  const displayProphecy = user?.prophecy || "Searching for your name in the archives...";

  // Perspective 3D Tilt effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Normalize coordinates around zero (-1 to 1)
    const normX = (x / rect.width) * 2 - 1;
    const normY = (y / rect.height) * 2 - 1;
    
    // Safe tilt angles
    setRotateX(-normY * 18); // Tilt along X based on cursor Y coordinate
    setRotateY(normX * 18);  // Tilt along Y based on cursor X coordinate
  };

  const handleMouseLeave = () => {
    setIsHoveemerald(false);
    setRotateX(0);
    setRotateY(0);
  };

  const handleMouseEnter = () => {
    setIsHoveemerald(true);
  };

  // HTML5 Canvas dynamic loop drawing the Crystal Ball, Moon, Hands, and Text
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let angle = 0;
    
    // Set device pixel ratio for extra crisp text
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 380 * dpr;
    canvas.height = 420 * dpr;
    ctx.scale(dpr, dpr);

    // Particle cloud settings
    interface Particle {
      x: number;
      y: number;
      z: number;
      size: number;
      color: string;
      speed: number;
    }

    const particles: Particle[] = [];
    for (let i = 0; i < 45; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 50 + Math.random() * 30; // sphere radius range
      particles.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        size: 1 + Math.random() * 2,
        color: Math.random() > 0.4 ? "#ef4444" : "#f59e0b", // emerald or amber embers
        speed: 0.01 + Math.random() * 0.015
      });
    }

    // Main draw function
    const draw = () => {
      angle += 0.015;
      ctx.clearRect(0, 0, 380, 420);

      // Draw a clean, deep solid ambient dark background matching the card container
      ctx.fillStyle = "#090303";
      ctx.fillRect(0, 0, 380, 420);

      // 1. Draw Background Vignette / Ritual Circles (very faint so they do not distract)
      ctx.strokeStyle = "rgba(185, 28, 28, 0.04)";
      ctx.lineWidth = 1;
      
      // Outer pentagram loop
      ctx.beginPath();
      ctx.arc(190, 195, 175, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(185, 28, 28, 0.02)";
      ctx.beginPath();
      ctx.arc(190, 195, 168, 0, Math.PI * 2);
      ctx.stroke();

      // Draw celestial moon coordinates marks
      ctx.fillStyle = "rgba(220, 38, 38, 0.3)";
      for (let i = 0; i < 8; i++) {
        const rad = angle * 0.15 + (i * Math.PI) / 4;
        const mx = 190 + Math.cos(rad) * 168;
        const my = 195 + Math.sin(rad) * 168;
        ctx.beginPath();
        ctx.arc(mx, my, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw gothic corner framing lines
      ctx.strokeStyle = "rgba(185, 28, 28, 0.35)";
      ctx.lineWidth = 1.5;
      
      // Top-left corner
      ctx.beginPath();
      ctx.moveTo(25, 45);
      ctx.lineTo(45, 45);
      ctx.moveTo(25, 45);
      ctx.lineTo(25, 65);
      ctx.stroke();

      // Top-right corner
      ctx.beginPath();
      ctx.moveTo(355, 45);
      ctx.lineTo(335, 45);
      ctx.moveTo(355, 45);
      ctx.lineTo(355, 65);
      ctx.stroke();

      // Bottom-left corner
      ctx.beginPath();
      ctx.moveTo(25, 375);
      ctx.lineTo(45, 375);
      ctx.moveTo(25, 375);
      ctx.lineTo(25, 355);
      ctx.stroke();

      // Bottom-right corner
      ctx.beginPath();
      ctx.moveTo(355, 375);
      ctx.lineTo(335, 375);
      ctx.moveTo(355, 375);
      ctx.lineTo(355, 355);
      ctx.stroke();

      // 2. DRAW CRYSTAL BALL BASICS
      const ballX = 190;
      const ballY = 195;
      const ballRadius = 85;

      // Ball core shadow
      const ballShadowGrad = ctx.createRadialGradient(ballX, ballY, 15, ballX, ballY, ballRadius);
      ballShadowGrad.addColorStop(0, "rgba(26, 0, 0, 0.85)");
      ballShadowGrad.addColorStop(0.7, "rgba(10, 0, 0, 0.95)");
      ballShadowGrad.addColorStop(1, "rgba(0, 0, 0, 1)");
      ctx.fillStyle = ballShadowGrad;
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
      ctx.fill();

      // Ball ambient crimson glow
      const ballGlowGrad = ctx.createRadialGradient(ballX, ballY, 0, ballX, ballY, ballRadius);
      ballGlowGrad.addColorStop(0, "rgba(220, 38, 38, 0.35)");
      ballGlowGrad.addColorStop(0.6, "rgba(220, 38, 38, 0.05)");
      ballGlowGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = ballGlowGrad;
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
      ctx.fill();

      // DRAW 3D PARTICLES (Inside the sphere)
      const cosA = Math.cos(angle * 0.4);
      const sinA = Math.sin(angle * 0.4);

      particles.forEach((p) => {
        // Rotate particle around Y-axis
        const rotatedX = p.x * cosA - p.z * sinA;
        const rotatedZ = p.x * sinA + p.z * cosA;
        
        // Perspective projections
        const d = 180; // focus depth
        const perspectiveScale = d / (d + rotatedZ);
        
        // Map 3D to 2D
        const px = ballX + rotatedX * perspectiveScale;
        const py = ballY + p.y * perspectiveScale;

        // Clip to ball boundaries
        const distFromCenter = Math.hypot(px - ballX, py - ballY);
        if (distFromCenter < ballRadius - 3) {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = 0.15 + (1 - (rotatedZ / 90)) * 0.55; // faded based on depth z
          ctx.beginPath();
          ctx.arc(px, py, p.size * perspectiveScale, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1.0;

      // DRAW STYLIZED GLOWING CRESCENT MOON
      ctx.save();
      ctx.translate(ballX, ballY);
      ctx.rotate(-angle * 0.2); // Slower orbit/spin
      
      const moonScale = 1.0 + Math.sin(angle * 2.5) * 0.05; // Pulse glow!
      ctx.scale(moonScale, moonScale);
      
      ctx.shadowColor = "#f87171";
      ctx.shadowBlur = 15;

      // Draw crescent shape with overlay path
      ctx.fillStyle = "rgba(255, 230, 230, 0.95)";
      ctx.beginPath();
      // Outer arc
      ctx.arc(-10, -5, 32, -Math.PI * 0.5, Math.PI * 0.5, false);
      // Inner carve arc
      ctx.arc(-22, -5, 32, Math.PI * 0.42, -Math.PI * 0.42, true);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
      ctx.shadowBlur = 0; // Reset shadow

      // 3. DRAW PEDESTAL
      ctx.strokeStyle = "rgba(185, 28, 28, 0.45)";
      ctx.fillStyle = "rgba(10, 10, 10, 0.95)";
      ctx.lineWidth = 1.5;

      // Top curve
      ctx.beginPath();
      ctx.ellipse(ballX, ballY + ballRadius - 2, 55, 12, 0, 0, Math.PI);
      ctx.fill();
      ctx.stroke();

      // Base curves
      ctx.fillStyle = "rgba(15, 3, 3, 0.98)";
      ctx.beginPath();
      ctx.moveTo(ballX - 52, ballY + ballRadius + 5);
      ctx.bezierCurveTo(ballX - 52, ballY + ballRadius + 20, ballX - 65, ballY + ballRadius + 22, ballX - 65, ballY + ballRadius + 27);
      ctx.lineTo(ballX + 65, ballY + ballRadius + 27);
      ctx.bezierCurveTo(ballX + 65, ballY + ballRadius + 22, ballX + 52, ballY + ballRadius + 20, ballX + 52, ballY + ballRadius + 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Pedestal seal embellishment
      ctx.strokeStyle = "rgba(220, 38, 38, 0.55)";
      ctx.beginPath();
      ctx.arc(ballX, ballY + ballRadius + 14, 5, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(ballX - 25, ballY + ballRadius + 14);
      ctx.lineTo(ballX + 25, ballY + ballRadius + 14);
      ctx.stroke();

      // 4. DRAW STYLIZED SILHOUETTE HANDS FRAMING THE BALL (Visual Anchor of the App!)
      // Hand Outline Left
      ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "rgba(220, 38, 38, 0.4)";
      ctx.shadowBlur = 8;

      // Arm Left coming in
      ctx.beginPath();
      ctx.moveTo(10, 240);
      ctx.bezierCurveTo(45, 230, 85, 205, 98, 185); // Wrist Left
      
      // Hand Left / Thumb wrapping around sphere bottom-left
      ctx.bezierCurveTo(110, 175, 115, 185, 118, 195);
      ctx.bezierCurveTo(120, 205, 110, 215, 105, 222);
      
      // index finger
      ctx.moveTo(98, 185);
      ctx.bezierCurveTo(105, 170, 118, 160, 124, 165);
      ctx.bezierCurveTo(128, 168, 115, 185, 108, 195);

      // middle finger
      ctx.moveTo(94, 192);
      ctx.bezierCurveTo(105, 176, 125, 168, 128, 174);
      ctx.bezierCurveTo(130, 178, 114, 195, 104, 203);

      // ring finger
      ctx.moveTo(88, 199);
      ctx.bezierCurveTo(98, 186, 120, 180, 122, 187);
      ctx.bezierCurveTo(124, 192, 108, 205, 98, 212);

      ctx.stroke();

      // Hand Outline Right (Top hovering)
      ctx.beginPath();
      // Arm Right coming from top right
      ctx.moveTo(370, 110);
      ctx.bezierCurveTo(345, 105, 290, 85, 250, 85); // Wrist Right
      
      // Index finger hovering over crystal ball
      ctx.bezierCurveTo(225, 85, 195, 95, 180, 108);
      ctx.bezierCurveTo(174, 114, 180, 118, 186, 114);
      ctx.bezierCurveTo(202, 104, 230, 98, 252, 98);

      // Middle finger
      ctx.moveTo(250, 85);
      ctx.bezierCurveTo(220, 85, 162, 116, 155, 128);
      ctx.bezierCurveTo(150, 137, 158, 139, 162, 132);
      ctx.bezierCurveTo(175, 118, 225, 102, 248, 102);

      // Ring finger
      ctx.moveTo(254, 90);
      ctx.bezierCurveTo(230, 92, 175, 134, 168, 146);
      ctx.bezierCurveTo(164, 153, 172, 155, 176, 147);
      ctx.bezierCurveTo(192, 130, 232, 108, 254, 108);

      // Thumb
      ctx.moveTo(270, 83);
      ctx.bezierCurveTo(280, 102, 288, 124, 288, 130);
      ctx.bezierCurveTo(288, 136, 278, 132, 274, 122);
      
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset

      // 5. DRAW GOLD/CRIMSON REFLECTIONS ON GLASS (Over the hands to embed them inside!)
      const reflectionGrad = ctx.createLinearGradient(130, 130, 250, 250);
      reflectionGrad.addColorStop(0, "rgba(255, 255, 255, 0.2)");
      reflectionGrad.addColorStop(0.18, "rgba(255, 255, 255, 0.05)");
      reflectionGrad.addColorStop(0.5, "rgba(255, 255, 255, 0)");
      reflectionGrad.addColorStop(0.85, "rgba(220, 38, 38, 0.12)");
      reflectionGrad.addColorStop(1, "rgba(220, 38, 38, 0.3)");
      
      ctx.fillStyle = reflectionGrad;
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballRadius - 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Curved glass glare stripe
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballRadius - 6, -Math.PI * 0.75, -Math.PI * 0.45);
      ctx.stroke();

      // 6. WRITE CARD TEXT DETAILS (LITERATE STYLING!)
      // Header Text: FORBIDDEN ARCHIVES
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.font = "italic tracking-wider 10px Courier New, monospace";
      ctx.textAlign = "center";
      ctx.fillText("WRIDROT MAGAZINE", 190, 26);

      // Line decoration
      ctx.strokeStyle = "rgba(185, 28, 28, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(110, 32);
      ctx.lineTo(270, 32);
      ctx.stroke();

      // Sub description: WAITLESS TOKEN
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold tracking-tightest 8px sans-serif";
      ctx.fillText("EARLY ACCESS CARD", 190, 42);


      ctx.fillStyle = "#ef4444";
      ctx.font = "bold tracking-widest 26px Georgia, serif";
      ctx.shadowColor = "rgba(239, 68, 68, 0.6)";
      ctx.shadowBlur = 6;
      ctx.fillText(displayNo, 190, 344);
      ctx.shadowBlur = 0;

      // SEEKER NAME
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.font = "bold 15px Courier New, monospace";
      ctx.fillText(displayName.toUpperCase(), 190, 368);

      // TOKEN ID
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "8px Courier New, monospace";
      ctx.fillText(`TOKEN ID: ${displayTokenId}`, 190, 383);

      // CRT Scanline emulation
      ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
      for (let y = 0; y < 420; y += 4) {
        ctx.fillRect(0, y, 380, 1.5);
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [displayName, displayNo, displayTokenId]);

  // Generate high-definition loop video (WebM) of the spinning 3D token using dynamic canvas capturing
  const conjureAnimatedVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsConjuring(true);
    setConjuringProgress(5);
    setConjuringLabel("Forging HD temporal stream...");

    // Capture the output stream from canvas at 30fps
    let stream: MediaStream | null = null;
    try {
      if ((canvas as any).captureStream) {
        stream = (canvas as any).captureStream(30);
      } else if ((canvas as any).mozCaptureStream) {
        stream = (canvas as any).mozCaptureStream(30);
      }
    } catch (err) {
      console.error("Stream capture unsupported:", err);
    }

    if (!stream) {
      alert("Canvas recording is unsupported in your current browser. Try Chrome, Firefox, or Safari.");
      setIsConjuring(false);
      return;
    }

    // Capture video frames with premium high-definition options
    let recorder: MediaRecorder;
    const chunks: Blob[] = [];

    // Configure premium HD video parameters (VP9, 6MBPS high bitrate for uncompressed crisp look)
    const options = { mimeType: "video/webm;codecs=vp9", videoBitsPerSecond: 6000000 };
    try {
      recorder = new MediaRecorder(stream, options);
    } catch (e) {
      try {
        recorder = new MediaRecorder(stream, { mimeType: "video/webm", videoBitsPerSecond: 4000000 });
      } catch (err) {
        recorder = new MediaRecorder(stream);
      }
    }

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onstop = async () => {
      const mimeType = recorder.mimeType || "video/webm";
      let extension = "webm";
      if (mimeType.includes("mp4")) {
        extension = "mp4";
      } else if (mimeType.includes("ogg")) {
        extension = "ogv";
      }

      const videoBlob = new Blob(chunks, { type: mimeType });
      const videoUrl = URL.createObjectURL(videoBlob);
      setGeneratedVideoUrl(videoUrl);

      const fileName = `Forbidden_Archives_HD_Token_${displayTokenId}.${extension}`;

      // Detection for mobile sharing support
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      let shaemeraldSuccessfully = false;

      if (isMobile && navigator.share && navigator.canShare) {
        try {
          const file = new File([videoBlob], fileName, { type: mimeType });
          if (navigator.canShare({ files: [file] })) {
            setConjuringLabel("Opening portal app selector...");
            await navigator.share({
              files: [file],
              title: "Forbidden Archives Authoemerald Token",
              text: `🗝️ I have gained entry to the FORBIDDEN ARCHIVES! I am at Rank ${displayNo}.\n\n Get your token at:\n${window.location.protocol}//${window.location.host}\n\nJoin the cult today.`,
            });
            shaemeraldSuccessfully = true;
          }
        } catch (shareErr: any) {
          console.warn("Mobile Web Share cancelled or failed, falling back to download:", shareErr);
        }
      }

      if (!shaemeraldSuccessfully) {
        // Trigger automatic high-definition file download
        const link = document.createElement("a");
        link.href = videoUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setConjuringProgress(100);
      setConjuringLabel(shaemeraldSuccessfully ? "Shaemerald successfully!" : "Downloaded!");
      setTimeout(() => {
        setIsConjuring(false);
        setConjuringProgress(0);
      }, 1200);
    };

    // Record for exactly 10 seconds to capture a beautiful complete orbit animation
    const duration = 10000;
    const startTime = Date.now();
    recorder.start();

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(95, Math.floor((elapsed / duration) * 100));
      setConjuringProgress(pct);
      setConjuringLabel(`Preparing for HD sharing (${pct}%)...`);

      if (elapsed >= duration) {
        clearInterval(progressInterval);
        try {
          recorder.stop();
        } catch (e) {
          setIsConjuring(false);
        }
      }
    }, 100);
  };

  // Social sharing handlers
  const handleInstagramShare = () => {
    onShareRecorded("instagram");
    conjureAnimatedVideo();
  };

  const handleWhatsappShare = () => {
    onShareRecorded("whatsapp");
    conjureAnimatedVideo();
  };

  const handleTextShare = () => {
    onShareRecorded("sms");
    const shareText = `🗝️ I have gained entry to the FORBIDDEN ARCHIVES! I am at Rank ${displayNo}.\n\n Get your token at:\n${window.location.protocol}//${window.location.host}\n\nJoin the cult today.`;
    navigator.clipboard.writeText(shareText);
    alert("link copied to clipboard!\nSend it via SMS or chat to invite others.");
  };

  return (
    <div id="token-card" className="flex flex-col items-center">
      
      {/* 3D Parallax Container */}
      <div 
        className="relative perspective-1000 p-2 cursor-pointer transition-transform duration-300 active:scale-95"
        style={{ perspective: "1000px" }}
      >
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={handleMouseEnter}
          className="relative w-[340px] h-[375px] md:w-[380px] md:h-[420px] rounded-2xl bg-[#090303] border-2 border-[#b91c1c] overflow-hidden transition-all duration-200 shadow-2xl shadow-emerald-950/40"
          style={{
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            transformStyle: "preserve-3d",
            boxShadow: isHoveemerald 
              ? "0 25px 50px -12px rgba(185, 28, 28, 0.4), inset 0 0 40px rgba(185, 28, 28, 0.2)"
              : "0 15px 35px -12px rgba(0, 0, 0, 0.9), inset 0 0 20px rgba(220, 38, 38, 0.05)"
          }}
        >
          {/* Outer gloss shine overlays */}
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-300 pointer-events-none opacity-20"
            style={{
              background: `linear-gradient(${135 + rotateX * 2}deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 45%, rgba(185,28,28,0.2) 80%, rgba(220,38,38,0.4) 100%)`
            }}
          />

          {/* CRT Noise Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,10,12,0)_99%,rgba(185,28,28,0.15)_100%)] bg-[length:100%_4px] pointer-events-none opacity-25" />

          {/* Core visual drawing canvas */}
          <canvas 
            id="crystal-ball-canvas"
            ref={canvasRef} 
            className="w-full h-full block bg-transparent"
          />
        </div>
      </div>

      {/* Prophecy Omen Card Display */}
      {user && (
        <div id="prophecy-omen" className="w-full max-w-sm mt-6 p-4 rounded-xl bg-black/60 border border-emerald-950/60 shadow-inner text-center animate-fade-in">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-widest bg-emerald-950/60 text-emerald-500 border border-emerald-900/40 mb-2.5">
            
            Your Spell
          </span>
          <p className="font-serif italic text-gray-300 text-sm leading-relaxed leading-6 px-1">
            "By will and word, by earth and flame, let what I seek come in my name. So mote it be."
          </p>
        </div>
      )}

      {/* Sharing Panel Buttons */}
      <div id="sharing-panel" className="w-full max-w-sm mt-6 flex flex-col gap-3">
        {user ? (
          <>
            <div className="text-center text-xs text-emerald-400 font-mono tracking-wider uppercase mb-1">
              Share your Token
            </div>
            
            <div className="grid grid-cols-2 gap-3">

              {/* Download Video */}
              <button
                id="share-instagram-btn"
                onClick={handleInstagramShare}
                disabled={isConjuring}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-black text-xs font-mono tracking-wider border border-pink-700/50 hover:border-pink-500 hover:bg-pink-950/10 text-pink-400 transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-pink-400" />
                DOWNLOAD
              </button>

              {/* Patreon */}
              <a
                id="patreon-btn"
                href="https://patreon.com/Wridrot?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-black text-xs font-mono tracking-wider border border-emerald-700/50 hover:border-emerald-500 hover:bg-emerald-950/20 text-emerald-400 transition-all"
              >
                SIGN UP ON PATREON
              </a>

            </div>

            <button
              id="share-sms-btn"
              onClick={handleTextShare}
              disabled={isConjuring}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-950/80 to-emerald-900/80 hover:from-emerald-900 hover:to-emerald-800 text-xs font-mono tracking-widest text-[#fff] border border-emerald-700/60 hover:shadow-emerald-950/30 hover:shadow-xl transition-all cursor-pointer disabled:opacity-50"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              COPY INVITE LINK
            </button>
            
          </>
        ) : (
          <div className="text-center text-xs text-gray-500 font-mono flex items-center justify-center gap-1.5 py-4 border border-dashed border-gray-900 rounded-lg">
            <AlertCircle className="w-4 h-4 text-gray-600" />
            Submit the waitlist form to get your token
          </div>
        )}
      </div>

      {/* Spooky Conjuring Loading Modal */}
      {isConjuring && (
        <div id="conjuring-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-4">
          <div className="max-w-xs w-full p-6 rounded-2xl bg-[#0a0505] border border-emerald-900 text-center shadow-2xl">
            <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
              <div className="absolute inset-0 rounded-full border border-emerald-500/10 animate-ping" />
            </div>
            
            <h3 className="font-serif text-emerald-500 text-lg mb-2 tracking-wide font-bold">
              GENERATING YOUR TOKEN
            </h3>
            
            <p className="text-xs text-gray-400 font-mono h-8 mb-4">
              {conjuringLabel}
            </p>

            {/* Glowing emerald gothic progress bar */}
            <div className="w-full bg-emerald-950/50 rounded-full h-1.5 overflow-hidden border border-emerald-900/30">
              <div 
                className="bg-emerald-600 h-full transition-all duration-300 shadow-[0_0_10px_#dc2626]" 
                style={{ width: `${conjuringProgress}%` }}
              />
            </div>
            
            <span className="text-[10px] text-emerald-900 font-mono tracking-widest block mt-2 text-right">
              {conjuringProgress}%   DONE
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
