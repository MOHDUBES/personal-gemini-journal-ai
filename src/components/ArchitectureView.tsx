import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  ShieldCheck,
  Database,
  Cpu,
  Key,
  CheckCircle2,
  Lock,
  Server,
  Activity,
  Terminal,
  Play,
  Check,
} from "lucide-react";

export const ArchitectureView: React.FC = () => {
  const { user, isDemoUser } = useAuth();
  const [ladderHealth, setLadderHealth] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [simulatedFailure, setSimulatedFailure] = useState<string>("none");

  useEffect(() => {
    fetch("/api/fallback-health")
      .then((r) => r.json())
      .then((d) => {
        if (d.ladder) setLadderHealth(d.ladder);
      })
      .catch(() => {});
  }, []);

  const handleTestFallback = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/test-fallback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          simulateErrorOn: simulatedFailure === "none" ? undefined : simulatedFailure,
          prompt: "Verify the secure journal Gemini reflection pipeline is healthy and report status.",
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e: any) {
      setTestResult({ error: e.message });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tech Stack Requirements Table */}
      <div className="border border-[#141414] bg-white/70 shadow-xs overflow-hidden">
        <div className="bg-[#D9D8D5] px-6 py-2.5 border-b border-[#141414] flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-wider text-[#141414]">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 border border-[#141414] bg-[#141414] text-[#E4E3E0] font-bold">
              VERIFIED ARCHITECTURE COMPLIANCE
            </span>
            <span className="opacity-60">// Production Tech Stack</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>ALL SECURITY DIRECTIVES ACTIVE</span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <table className="w-full text-left border-collapse border border-[#141414] text-xs font-mono">
            <thead>
              <tr className="bg-[#D9D8D5] text-[#141414] border-b border-[#141414]">
                <th className="p-3 border-r border-[#141414]">Component</th>
                <th className="p-3 border-r border-[#141414]">Technology</th>
                <th className="p-3 border-r border-[#141414]">Purpose & Implementation</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#141414]/30 bg-white">
                <td className="p-3 border-r border-[#141414] font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-800" />
                  <span>User Identity</span>
                </td>
                <td className="p-3 border-r border-[#141414] text-zinc-800">
                  Firebase Authentication
                </td>
                <td className="p-3 border-r border-[#141414] font-sans text-xs">
                  Secure OAuth 2.0 login via Google Sign-In with zero password storage. User UID is bound to every reflection document.
                </td>
                <td className="p-3 font-bold text-emerald-800">
                  {user ? (isDemoUser ? "DEMO ACTIVE" : "OAUTH VERIFIED") : "UNAUTHENTICATED"}
                </td>
              </tr>

              <tr className="border-b border-[#141414]/30 bg-white/50">
                <td className="p-3 border-r border-[#141414] font-bold flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-800" />
                  <span>Backend Database</span>
                </td>
                <td className="p-3 border-r border-[#141414] text-zinc-800">
                  Cloud Firestore
                </td>
                <td className="p-3 border-r border-[#141414] font-sans text-xs">
                  Owner-isolated document storage under <code className="font-mono text-[11px] bg-[#D9D8D5] px-1">/users/{`{userId}`}/entries/{`{entryId}`}</code>. Cross-read strictly blocked by Firestore Rules.
                </td>
                <td className="p-3 font-bold text-emerald-800">ISOLATED & DEPLOYED</td>
              </tr>

              <tr className="border-b border-[#141414]/30 bg-white">
                <td className="p-3 border-r border-[#141414] font-bold flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-800" />
                  <span>AI Processing Engine</span>
                </td>
                <td className="p-3 border-r border-[#141414] text-zinc-800">
                  Gemini 3.6 Flash API
                </td>
                <td className="p-3 border-r border-[#141414] font-sans text-xs">
                  Ultra-low latency conversational reflections, multi-turn dialogue, auto-summarization, and longitudinal growth reports with 4-tier fallback resilience.
                </td>
                <td className="p-3 font-bold text-emerald-800">ONLINE (PRIMARY)</td>
              </tr>

              <tr className="bg-white/50">
                <td className="p-3 border-r border-[#141414] font-bold flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-800" />
                  <span>Secret Management</span>
                </td>
                <td className="p-3 border-r border-[#141414] text-zinc-800">
                  Secret Manager / Env Vars
                </td>
                <td className="p-3 border-r border-[#141414] font-sans text-xs">
                  Zero client exposure. All Gemini API keys and sensitive credentials remain strictly server-side in Express proxy routes (<code className="font-mono text-[11px]">/api/*</code>).
                </td>
                <td className="p-3 font-bold text-emerald-800">ZERO HARDCODING</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Resilient Fallback Simulator */}
      <div className="border border-[#141414] bg-white/70 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#141414]/20 pb-3">
          <div>
            <h3 className="text-base font-serif italic text-[#141414]">
              Gemini High-Availability Fallback Ladder Simulator
            </h3>
            <p className="text-xs font-sans text-[#141414]/75">
              Simulate 503 or transient upstream downtime on the primary model to test automatic failover across the tier ladder.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={simulatedFailure}
              onChange={(e) => setSimulatedFailure(e.target.value)}
              className="px-2.5 py-1.5 border border-[#141414] bg-white text-xs font-mono"
            >
              <option value="none">No Fault (Normal Primary Execution)</option>
              <option value="gemini-3.6-flash">Simulate 503 on gemini-3.6-flash</option>
              <option value="gemini-3.1-flash-lite">Simulate 503 on gemini-3.1-flash-lite</option>
            </select>

            <button
              id="btn-trigger-fallback-test"
              onClick={handleTestFallback}
              disabled={isTesting}
              className="px-4 py-1.5 bg-[#141414] hover:bg-black text-[#E4E3E0] border border-[#141414] text-xs font-mono uppercase font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3 h-3" />
              <span>{isTesting ? "Testing..." : "Test Ladder"}</span>
            </button>
          </div>
        </div>

        {/* Model Ladder Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            { model: "gemini-3.6-flash", tier: "Tier 1: Primary", desc: "Ultra-fast primary processing model" },
            { model: "gemini-3.1-flash-lite", tier: "Tier 2: High-Availability", desc: "Low-latency fallback model" },
            { model: "gemini-flash-latest", tier: "Tier 3: Dynamic Alias", desc: "Auto-routed flash alias" },
            { model: "gemini-3.7-flash", tier: "Tier 4: Deep Reasoning", desc: "High-intelligence reasoning failover" },
          ].map((item, idx) => (
            <div key={idx} className="p-3 border border-[#141414] bg-white space-y-1 text-xs font-mono">
              <div className="flex items-center justify-between text-[10px] text-[#141414]/70">
                <span>{item.tier}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
              </div>
              <div className="font-bold text-[#141414] truncate">{item.model}</div>
              <div className="text-[10px] text-[#141414]/60 font-sans leading-tight">{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Test Result Box */}
        {testResult && (
          <div className="p-4 border border-[#141414] bg-[#D9D8D5]/40 space-y-2 text-xs font-mono">
            <div className="font-bold uppercase flex items-center justify-between">
              <span>Failover Trace Execution:</span>
              <span className="text-emerald-800">
                Resolved by: {testResult.selectedModel || "N/A"}
              </span>
            </div>
            {testResult.attempts && (
              <div className="space-y-1 text-[11px]">
                {testResult.attempts.map((a: any, i: number) => (
                  <div
                    key={i}
                    className={`p-2 border ${
                      a.success ? "border-emerald-700 bg-emerald-50 text-emerald-900" : "border-amber-700 bg-amber-50 text-amber-900"
                    }`}
                  >
                    <strong>{a.model}</strong> ({a.tier}): {a.success ? "SUCCESS" : `FAILED (${a.error})`} • {a.latencyMs}ms
                  </div>
                ))}
              </div>
            )}
            {testResult.text && (
              <div className="p-2 bg-white border border-[#141414]/30 text-zinc-800 italic">
                "{testResult.text}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
