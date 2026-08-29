import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { JournalEntry, ReflectionSynthesis } from "../types";
import { fetchUserJournalEntries } from "../lib/firebase";
import {
  Brain,
  Sparkles,
  TrendingUp,
  Award,
  Layers,
  Compass,
  Calendar,
  Smile,
  RefreshCw,
  Download,
  CheckCircle2,
} from "lucide-react";

export const AiSynthesisView: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid || "demo-user";

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [synthesis, setSynthesis] = useState<ReflectionSynthesis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [modelUsed, setModelUsed] = useState<string>("gemini-3.6-flash");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchUserJournalEntries(userId);
        setEntries(data);
      } catch (e) {
        console.error("Failed to load entries", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [userId]);

  const handleGenerateSynthesis = async () => {
    if (entries.length === 0 || isSynthesizing) return;
    setIsSynthesizing(true);
    try {
      const res = await fetch("/api/journal/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });

      const data = await res.json();
      if (res.ok && data.synthesis) {
        setSynthesis(data.synthesis);
        if (data.modelUsed) setModelUsed(data.modelUsed);
      }
    } catch (err) {
      console.error("Synthesis generation failed:", err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Compute mood stats
  const moodCounts = entries.reduce((acc, entry) => {
    const m = entry.mood || "neutral";
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalTurns = entries.reduce((acc, entry) => acc + (entry.messages?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="border border-[#141414] bg-white/70 shadow-xs overflow-hidden">
        <div className="bg-[#D9D8D5] px-6 py-2.5 border-b border-[#141414] flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-wider text-[#141414]">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 border border-[#141414] bg-[#141414] text-[#E4E3E0] font-bold">
              AGGREGATE AI SYNTHESIS
            </span>
            <span className="opacity-60">// Multi-Document Cognitive Coaching</span>
          </div>

          <div className="flex items-center gap-2">
            <span>MODEL: {modelUsed}</span>
            <span className="opacity-40">//</span>
            <span>ENTRIES: {entries.length}</span>
          </div>
        </div>

        {/* Overview Stats Bento */}
        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 border border-[#141414] bg-white space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#141414]/70">Total Reflections</span>
            <div className="text-2xl font-serif italic text-[#141414]">{entries.length}</div>
            <span className="text-[9px] font-mono text-emerald-800">Saved in Firestore</span>
          </div>

          <div className="p-4 border border-[#141414] bg-white space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#141414]/70">Total Dialogue Turns</span>
            <div className="text-2xl font-serif italic text-[#141414]">{totalTurns}</div>
            <span className="text-[9px] font-mono text-[#141414]/60">User & Gemini Messages</span>
          </div>

          <div className="p-4 border border-[#141414] bg-white space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#141414]/70">Distinct Modes</span>
            <div className="text-2xl font-serif italic text-[#141414]">
              {new Set(entries.map((e) => e.mode)).size}
            </div>
            <span className="text-[9px] font-mono text-[#141414]/60">Introspection Variety</span>
          </div>

          <div className="p-4 border border-[#141414] bg-white space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#141414]/70">Dominant Tone</span>
            <div className="text-2xl font-serif italic text-[#141414] capitalize">
              {Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Contemplative"}
            </div>
            <span className="text-[9px] font-mono text-amber-800">Primary Mood State</span>
          </div>
        </div>
      </div>

      {/* Synthesis Report Container */}
      <div className="border border-[#141414] bg-white/70 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#141414]/20 pb-4">
          <div className="space-y-1">
            <h3 className="text-xl font-serif italic text-[#141414]">
              Longitudinal Growth & Cognitive Patterns
            </h3>
            <p className="text-xs font-sans text-[#141414]/80">
              Gemini 3.6 Flash analyzes your entire history of reflections to discover overarching themes, recurring roadblocks, and positive growth arcs.
            </p>
          </div>

          <button
            id="btn-run-synthesis"
            onClick={handleGenerateSynthesis}
            disabled={entries.length === 0 || isSynthesizing}
            className="px-4 py-2.5 bg-[#141414] hover:bg-black disabled:bg-zinc-400 text-[#E4E3E0] border border-[#141414] text-xs font-mono uppercase font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {isSynthesizing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-[#E4E3E0] border-t-transparent rounded-full animate-spin" />
                <span>Synthesizing History...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{synthesis ? "Re-Synthesize Trends" : "Generate Growth Report"}</span>
              </>
            )}
          </button>
        </div>

        {synthesis ? (
          <div className="space-y-6 animate-in fade-in">
            {/* Trajectory Banner */}
            <div className="p-5 border border-[#141414] bg-[#D9D8D5]/40 space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-[#141414] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-800" />
                Emotional & Cognitive Trajectory ({synthesis.timeframe})
              </span>
              <p className="text-sm font-sans text-[#141414] leading-relaxed italic">
                "{synthesis.overallMoodTrends}"
              </p>
            </div>

            {/* Core Themes Grid */}
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase font-bold text-[#141414] block">
                Identified Core Themes & High-Leverage Actions:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {synthesis.coreThemes.map((item, idx) => (
                  <div key={idx} className="p-4 border border-[#141414] bg-white space-y-2.5">
                    <div className="flex items-center justify-between border-b border-[#141414]/15 pb-1.5">
                      <h4 className="font-serif italic text-base text-[#141414]">{item.theme}</h4>
                      <span className="text-[10px] font-mono bg-[#D9D8D5] px-1.5 py-0.5 border border-[#141414]/30">
                        Pattern 0{idx + 1}
                      </span>
                    </div>
                    <p className="text-xs font-sans text-[#141414]/80 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="p-2.5 bg-[#D9D8D5]/30 border-l-2 border-[#141414] text-[11px] font-sans text-[#141414]">
                      <strong>Actionable Coaching:</strong> {item.actionableAdvice}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth Areas & Closing Encouragement */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 border border-[#141414] bg-white space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-[#141414] flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-700" />
                  Key Mindset Shifts & Growth Areas
                </span>
                <ul className="space-y-1.5 text-xs font-sans text-[#141414] list-disc list-inside">
                  {synthesis.growthAreas.map((area, i) => (
                    <li key={i}>{area}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 border border-[#141414] bg-white space-y-2 flex flex-col justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-[#141414] flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-emerald-800" />
                  Closing Guidance from Gemini
                </span>
                <p className="text-xs font-serif italic text-[#141414] leading-relaxed">
                  "{synthesis.encouragement}"
                </p>
                <div className="text-[9px] font-mono text-[#141414]/60 uppercase pt-2 border-t border-[#141414]/15">
                  Generated via Gemini 3.6 Flash Fallback Ladder
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-10 text-center space-y-3">
            <Layers className="w-8 h-8 text-[#141414] mx-auto opacity-40" />
            <p className="text-xs font-sans text-[#141414]/70 max-w-md mx-auto">
              Click <strong>"Generate Growth Report"</strong> to aggregate your past journal reflections into an actionable cognitive synthesis.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
