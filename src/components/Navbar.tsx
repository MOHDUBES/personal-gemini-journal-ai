import React from "react";
import { useAuth } from "../context/AuthContext";
import {
  Sparkles,
  BookOpen,
  History,
  TrendingUp,
  ShieldCheck,
  LogOut,
  User,
  Database,
  Cpu,
} from "lucide-react";

export type ActiveTab = "workspace" | "history" | "analytics" | "architecture";

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activePrimaryModel?: string;
  totalSavedCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activePrimaryModel = "gemini-3.6-flash",
  totalSavedCount = 0,
}) => {
  const { user, isDemoUser, logout } = useAuth();

  const tabs = [
    { id: "workspace" as ActiveTab, label: "Reflection Workspace", icon: Sparkles },
    { id: "history" as ActiveTab, label: "History & Vault", icon: History },
    { id: "analytics" as ActiveTab, label: "Growth Synthesis", icon: TrendingUp },
    { id: "architecture" as ActiveTab, label: "Tech Stack & Security", icon: ShieldCheck },
  ];

  return (
    <header className="border-b border-[#141414] bg-[#E4E3E0] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Branding & User Info Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3 border-b border-[#141414]">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 border border-[#141414] bg-[#141414] text-[#E4E3E0] flex items-center justify-center shadow-xs shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-tighter opacity-60 uppercase">
                  User Authenticated AI Journal // Cloud Firestore
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-serif italic leading-none text-[#141414]">
                Gemini AI Journal & Reflections
              </h1>
            </div>
          </div>

          {/* User Profile & System Status Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Model & DB Badges */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 border border-[#141414] bg-white/60 text-[10px] font-mono text-[#141414]">
              <Cpu className="w-3 h-3 text-purple-800" />
              <span className="opacity-60">AI:</span>
              <span className="font-bold">{activePrimaryModel}</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 border border-[#141414] bg-white/60 text-[10px] font-mono text-[#141414]">
              <Database className="w-3 h-3 text-emerald-800" />
              <span className="opacity-60">STORE:</span>
              <span className="font-bold">ISOLATED</span>
            </div>

            {/* Authenticated User Capsule */}
            {user && (
              <div className="flex items-center gap-2 px-2.5 py-1 border border-[#141414] bg-[#D9D8D5] text-[11px] font-mono">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-5 h-5 rounded-full border border-[#141414] object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-[#141414] bg-white flex items-center justify-center">
                    <User className="w-3 h-3 text-[#141414]" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-bold text-[#141414] leading-tight truncate max-w-[120px]">
                    {user.displayName || "Explorer"}
                  </span>
                  {isDemoUser && (
                    <span className="text-[9px] text-amber-800 font-semibold leading-none">
                      (DEMO SESSION)
                    </span>
                  )}
                </div>

                <button
                  id="btn-signout"
                  onClick={() => logout()}
                  className="ml-2 pl-2 border-l border-[#141414]/30 hover:text-rose-700 text-[#141414] transition cursor-pointer flex items-center gap-1"
                  title="Sign Out"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="text-[9px] uppercase font-bold">Exit</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation Grid */}
        <nav className="flex space-x-1.5 overflow-x-auto py-2 -mb-px scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider border border-[#141414] transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-[#141414] text-[#E4E3E0] font-bold shadow-xs"
                    : "bg-white/50 text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
