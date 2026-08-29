import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Sparkles,
  Shield,
  Database,
  Cpu,
  Lock,
  ArrowRight,
  BookOpen,
  Compass,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export const LandingPage: React.FC = () => {
  const { signInWithGooglePopup, signInAsDemoUser, loading, error } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setLoginError(null);
    try {
      await signInWithGooglePopup();
    } catch (err: any) {
      console.error("Sign-in error", err);
      setLoginError(
        err.message || "Google Sign-In could not complete. You can also explore via Demo Session."
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-[88vh] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Hero Container */}
      <div className="space-y-10 my-auto">
        {/* Editorial Eyebrow & Status Bar */}
        <div className="border border-[#141414] bg-white/70 shadow-xs">
          <div className="bg-[#D9D8D5] px-4 py-2 border-b border-[#141414] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-widest text-[#141414]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-bold">SYSTEM IDENTITY: AUTHENTICATED WORKSPACE</span>
            </div>
            <div className="flex items-center gap-3">
              <span>FIRESTORE: USER-ISOLATED</span>
              <span className="opacity-40">//</span>
              <span>ENGINE: GEMINI 3.6 FLASH</span>
            </div>
          </div>

          <div className="p-8 sm:p-12 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#141414] bg-[#D9D8D5] text-[#141414] text-xs font-mono uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Personal Reflection & Intelligent Journaling</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif italic text-[#141414] tracking-tight leading-[1.1]">
              Conversational Journaling & Deep Reflections with Gemini
            </h1>

            <p className="text-base sm:text-lg text-[#141414]/80 max-w-3xl font-sans leading-relaxed">
              A private, multi-turn AI reflection sanctuary. Converse freely with Gemini 3.6 Flash to unpack thoughts,
              brainstorm creative paths, distill executive takeaways, and securely persist all entries in
              owner-bound Cloud Firestore.
            </p>

            {/* Error Notification if any */}
            {(error || loginError) && (
              <div className="p-4 border border-rose-600 bg-rose-50 text-rose-900 text-xs font-mono flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold uppercase">Authentication Notice</div>
                  <div>{error || loginError}</div>
                  <div className="text-[11px] opacity-80 pt-1">
                    If browser popup blockers are active in iframe mode, click "Explore with Demo Session" below for instant authenticated access.
                  </div>
                </div>
              </div>
            )}

            {/* Call to Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                id="btn-google-signin"
                onClick={handleGoogleSignIn}
                disabled={isSigningIn || loading}
                className="px-6 py-3.5 bg-[#141414] hover:bg-black text-[#E4E3E0] border border-[#141414] text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-3 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSigningIn ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#E4E3E0] border-t-transparent rounded-full animate-spin" />
                    <span>Connecting with Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign In with Google</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <button
                id="btn-demo-signin"
                onClick={signInAsDemoUser}
                className="px-6 py-3.5 bg-white/80 hover:bg-white text-[#141414] border border-[#141414] text-xs font-mono font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Explore with Demo Session</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Feature 1 */}
          <div className="border border-[#141414] bg-white/70 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 border border-[#141414] bg-[#D9D8D5] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#141414]" />
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 border border-[#141414] bg-white">
                Multi-Turn AI
              </span>
            </div>
            <h3 className="font-mono text-xs font-bold uppercase text-[#141414]">
              Conversational Reflection Partner
            </h3>
            <p className="text-xs font-sans text-[#141414]/80 leading-relaxed">
              Engage across 5 distinct reflection modes: Deep Introspection, Brainstorming & Action Steps, Executive Summary,
              Mindful Gratitude, and Freeform dialogue.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="border border-[#141414] bg-white/70 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 border border-[#141414] bg-[#D9D8D5] flex items-center justify-center">
                <Lock className="w-4 h-4 text-[#141414]" />
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 border border-[#141414] bg-white">
                Zero Cross-Read
              </span>
            </div>
            <h3 className="font-mono text-xs font-bold uppercase text-[#141414]">
              Owner-Bound Cloud Firestore
            </h3>
            <p className="text-xs font-sans text-[#141414]/80 leading-relaxed">
              Strict Firestore security rules (<code className="font-mono text-[11px]">/users/{`{userId}`}/entries</code>)
              guarantee that your personal prompts and transcripts are accessible only by your verified UID.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="border border-[#141414] bg-white/70 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 border border-[#141414] bg-[#D9D8D5] flex items-center justify-center">
                <Cpu className="w-4 h-4 text-[#141414]" />
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 border border-[#141414] bg-white">
                Gemini 3.6 Flash
              </span>
            </div>
            <h3 className="font-mono text-xs font-bold uppercase text-[#141414]">
              Executive Summaries & Synthesis
            </h3>
            <p className="text-xs font-sans text-[#141414]/80 leading-relaxed">
              Auto-generate memorable titles, structured key takeaways, mood indicators, and holistic multi-entry
              growth trend syntheses across your history.
            </p>
          </div>
        </div>

        {/* Technical Architecture Overview Bar */}
        <div className="border border-[#141414] bg-[#D9D8D5]/50 p-4 text-xs font-mono flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-800" />
            <span className="font-bold uppercase">Security & Compliance:</span>
            <span className="text-[#141414]/80">No password storage • OAuth 2.0 Tokens • Secret Manager API Keys</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
            <span>Firestore Rules Deployed & Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
