import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar, ActiveTab } from "./components/Navbar";
import { LandingPage } from "./components/LandingPage";
import { JournalWorkspace } from "./components/JournalWorkspace";
import { EntryHistory } from "./components/EntryHistory";
import { AiSynthesisView } from "./components/AiSynthesisView";
import { ArchitectureView } from "./components/ArchitectureView";
import { JournalEntry } from "./types";
import { CheckCircle2, Database, ShieldCheck, Cpu } from "lucide-react";

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("workspace");
  const [activePrimaryModel, setActivePrimaryModel] = useState<string>("gemini-3.6-flash");
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => {
        if (d.primaryModel) setActivePrimaryModel(d.primaryModel);
      })
      .catch(() => {});
  }, []);

  const handleEntrySaved = (entry: JournalEntry) => {
    setActiveEntry(entry);
    setToastMessage(`Saved "${entry.title}" to Firestore`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectEntryFromHistory = (entry: JournalEntry) => {
    setActiveEntry(entry);
    setActiveTab("workspace");
  };

  const handleNewEntry = () => {
    setActiveEntry(null);
    setActiveTab("workspace");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] text-[#141414] flex flex-col items-center justify-center font-mono text-xs space-y-4">
        <div className="w-8 h-8 border-2 border-[#141414] border-t-transparent rounded-full animate-spin" />
        <div className="font-bold uppercase tracking-widest">
          Authenticating Session with Firebase...
        </div>
        <div className="text-[10px] opacity-60">
          Checking OAuth Token & Firestore Permissions
        </div>
      </div>
    );
  }

  // If user is not authenticated, show landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] text-[#141414] flex flex-col font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
        <LandingPage />
        <footer className="border-t border-[#141414] bg-[#D9D8D5] py-3 mt-auto">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-widest text-[#141414]/80">
            <div>Firebase Auth • Cloud Firestore • Gemini 3.6 Flash API</div>
            <div>Strict Owner-Bound Access Enforced</div>
          </div>
        </footer>
      </div>
    );
  }

  // Authenticated Dashboard
  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] flex flex-col font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activePrimaryModel={activePrimaryModel}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "workspace" && (
          <JournalWorkspace
            initialEntry={activeEntry}
            onEntrySaved={handleEntrySaved}
            onNewEntry={handleNewEntry}
          />
        )}
        {activeTab === "history" && (
          <EntryHistory
            onSelectEntry={handleSelectEntryFromHistory}
            onNewEntry={handleNewEntry}
          />
        )}
        {activeTab === "analytics" && <AiSynthesisView />}
        {activeTab === "architecture" && <ArchitectureView />}
      </main>

      {/* Persistence Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#141414] text-[#E4E3E0] px-4 py-3 shadow-2xl border border-[#141414] flex items-center gap-3 text-xs font-mono animate-in slide-in-from-bottom-2">
          <div className="w-5 h-5 border border-[#E4E3E0] text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold uppercase tracking-wider text-[11px]">
              Cloud Firestore Synced
            </div>
            <div className="text-zinc-400 text-[10px] truncate max-w-xs">{toastMessage}</div>
          </div>
        </div>
      )}

      {/* Technical Footer */}
      <footer className="border-t border-[#141414] bg-[#D9D8D5] py-3 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-widest text-[#141414]">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span className="font-bold">Session: {user.displayName || user.email || "Authenticated"}</span>
            </div>
            <span className="opacity-40">//</span>
            <span>UID: {user.uid.slice(0, 14)}...</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 opacity-70" />
              <span>Owner Isolation: Active</span>
            </div>
            <span className="opacity-40">//</span>
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 opacity-70" />
              <span>Model: {activePrimaryModel}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
