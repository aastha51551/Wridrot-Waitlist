import React, { useState } from "react";
import { Mail, User, ShieldAlert, Sparkles, Loader2 } from "lucide-react";
import { WaitlistUser } from "../types";

interface GothicFormProps {
  onSuccess: (user: WaitlistUser) => void;
}

export default function GothicForm({ onSuccess }: GothicFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Initial validations
    if (!name.trim()) {
      setError("Please enter your name to register");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Kindly provide an authentic email");
      return;
    }

    try {
      setLoading(true);
      

      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "An unexpected error has occured. Please try again later.");
      }

      onSuccess(data.user);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Connection Interrupted. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="gothic-form-container" className="w-full max-w-sm rounded-2xl bg-[#090303]/90 border border-red-950/60 p-6 shadow-2xl backdrop-blur-md">
      
      <div className="mb-5 text-center">
        <h3 className="font-halja text-white text-3xl sm:text-4xl tracking-wide leading-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]">
          JOIN THE WAITLIST 
        </h3>
        <p className="font-mono text-[10px] text-red-500/80 uppercase tracking-widest mt-1">
          Get your digital token now
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        
        {/* Name input */}
        <div className="relative">
          <label className="block text-[9px] font-mono uppercase tracking-widest text-gray-500 mb-1">
            Name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-red-800">
              <User className="w-4 h-4" />
            </span>
            <input
              id="waitlist-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              placeholder="e.g., John Doe"
              maxLength={50}
              className="w-full pl-9 pr-4 py-2 bg-black/90 text-sm text-gray-200 font-sans border border-red-950/70 rounded-lg placeholder-gray-700 focus:outline-none focus:border-red-600 focus:shadow-[0_0_8px_rgba(220,38,38,0.2)] transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {/* Email input */}
        <div className="relative">
          <label className="block text-[9px] font-mono uppercase tracking-widest text-gray-500 mb-1">
            Email ID
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-red-800">
              <Mail className="w-4 h-4" />
            </span>
            <input
              id="waitlist-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="johndoe@gmail.com"
              className="w-full pl-9 pr-4 py-2 bg-black/90 text-sm text-gray-200 font-sans border border-red-950/70 rounded-lg placeholder-gray-700 focus:outline-none focus:border-red-600 focus:shadow-[0_0_8px_rgba(220,38,38,0.2)] transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {/* Error notice panel */}
        {error && (
          <div id="form-error-notice" className="flex items-start gap-2.5 p-3 rounded-lg bg-red-950/35 border border-red-900/40 text-xs text-red-400 font-mono animate-shake">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit seal button */}
        <button
          id="summon-portal-btn"
          type="submit"
          disabled={loading}
          className="w-full group mt-2 relative flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-950/40 hover:bg-red-900 border border-red-800/80 hover:border-red-600 text-[#fff] hover:text-white text-xs font-mono tracking-widest uppercase transition-all shadow-lg hover:shadow-[0_0_15px_rgba(220,38,38,0.3)] active:scale-98 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-red-500" />
              submitting...
            </>
          ) : (
            <>
              SUBMIT
              
            </>
          )}
        </button>

      </form>
      
      <div className="mt-4 text-center">
        <span className="text-[8px] text-gray-600 font-mono tracking-tight">
          BY SUBMITTING YOU CONSENT TO JOIN OUR OFFICIAL WAITLIST
        </span>
      </div>
    </div>
  );
}
