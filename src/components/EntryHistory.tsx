import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { JournalEntry, MoodType, ReflectionMode } from "../types";
import { fetchUserJournalEntries, deleteJournalEntryFromFirestore } from "../lib/firebase";
import ReactMarkdown from "react-markdown";
import {
  Search,
  Filter,
  Calendar,
  Tag,
  Clock,
  Sparkles,
  Trash2,
  ExternalLink,
  Download,
  BookOpen,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
} from "lucide-react";

interface EntryHistoryProps {
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
}

export const EntryHistory: React.FC<EntryHistoryProps> = ({
  onSelectEntry,
  onNewEntry,
}) => {
  const { user } = useAuth();
  const userId = user?.uid || "demo-user";

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedMood, setSelectedMood] = useState<string>("all");
  const [selectedMode, setSelectedMode] = useState<string>("all");
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      const data = await fetchUserJournalEntries(userId);
      setEntries(data);
      if (data.length > 0 && !selectedEntry) {
        setSelectedEntry(data[0]);
      }
    } catch (err) {
      console.error("Failed to load entries:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [userId]);

  // Filtered and searched entries
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.summary && entry.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      entry.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      entry.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMood = selectedMood === "all" || entry.mood === selectedMood;
    const matchesMode = selectedMode === "all" || entry.mode === selectedMode;

    return matchesSearch && matchesMood && matchesMode;
  });

  const handleDeleteEntry = async (entryId: string) => {
    setIsDeleting(true);
    try {
      await deleteJournalEntryFromFirestore(userId, entryId);
      const updated = entries.filter((e) => e.id !== entryId);
      setEntries(updated);
      if (selectedEntry?.id === entryId) {
        setSelectedEntry(updated.length > 0 ? updated[0] : null);
      }
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportEntry = (entry: JournalEntry) => {
    const md = `# ${entry.title}
*Date:* ${new Date(entry.createdAt).toLocaleString()} | *Mode:* ${entry.mode} | *Mood:* ${entry.mood || "N/A"} | *Tags:* ${entry.tags.join(", ")}

${entry.summary ? `## Executive Summary\n${entry.summary}\n\n` : ""}${
      entry.keyTakeaways && entry.keyTakeaways.length > 0
        ? `## Key Insights & Takeaways\n${entry.keyTakeaways.map((t) => `- ${t}`).join("\n")}\n\n`
        : ""
    }## Conversation Transcript
${entry.messages.map((m) => `### ${m.role === "user" ? "You" : "Gemini 3.6 Flash"} (${new Date(m.timestamp).toLocaleTimeString()})\n${m.content}`).join("\n\n")}
`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${entry.title.toLowerCase().replace(/[^a-z0-9]/g, "-") || "journal-entry"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls Bar */}
      <div className="border border-[#141414] bg-white/70 shadow-xs overflow-hidden">
        <div className="bg-[#D9D8D5] px-6 py-2.5 border-b border-[#141414] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 border border-[#141414] bg-[#141414] text-[#E4E3E0] text-[10px] font-mono font-bold uppercase tracking-wider">
              Private History Vault
            </span>
            <span className="text-[10px] font-mono opacity-60 uppercase">// User-Isolated Document Storage</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadEntries}
              className="px-2.5 py-1 bg-white text-[#141414] hover:bg-[#D9D8D5] text-[10px] font-mono uppercase border border-[#141414] flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={onNewEntry}
              className="px-3 py-1 bg-[#141414] text-[#E4E3E0] hover:bg-black text-[10px] font-mono uppercase font-bold border border-[#141414] flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>New Reflection</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#141414]/50" />
              <input
                id="input-search-history"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reflections, insights, tags..."
                className="w-full pl-9 pr-3 py-2 border border-[#141414] bg-white text-xs font-mono focus:outline-hidden"
              />
            </div>

            {/* Mode Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-[#141414]/70 shrink-0">Mode:</span>
              <select
                id="select-filter-mode"
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="w-full px-2.5 py-2 border border-[#141414] bg-white text-xs font-mono focus:outline-hidden"
              >
                <option value="all">All Modes</option>
                <option value="reflection">🪞 Deep Reflection</option>
                <option value="brainstorm">💡 Brainstorming</option>
                <option value="summary">📋 Executive Summary</option>
                <option value="gratitude">🌿 Mindful Gratitude</option>
                <option value="freeform">💬 Freeform</option>
              </select>
            </div>

            {/* Mood Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-[#141414]/70 shrink-0">Mood:</span>
              <select
                id="select-filter-mood"
                value={selectedMood}
                onChange={(e) => setSelectedMood(e.target.value)}
                className="w-full px-2.5 py-2 border border-[#141414] bg-white text-xs font-mono focus:outline-hidden"
              >
                <option value="all">All Moods</option>
                <option value="inspired">✨ Inspired</option>
                <option value="focused">🎯 Focused</option>
                <option value="calm">🧘 Calm</option>
                <option value="contemplative">💭 Contemplative</option>
                <option value="energized">⚡ Energized</option>
                <option value="grateful">🙏 Grateful</option>
                <option value="overwhelmed">🌧️ Overwhelmed</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-[#141414]/70 pt-1">
            <span>Showing {filteredEntries.length} of {entries.length} reflections</span>
            <span>Collection: <code className="bg-[#D9D8D5] px-1 py-0.5 border border-[#141414]/30">/users/{userId.slice(0, 8)}.../entries</code></span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Entry Cards List & Selected Entry Detail Viewer */}
      {entries.length === 0 && !isLoading ? (
        <div className="border border-[#141414] bg-white/70 p-12 text-center space-y-4 shadow-xs">
          <BookOpen className="w-10 h-10 text-[#141414] mx-auto opacity-40" />
          <h3 className="text-xl font-serif italic text-[#141414]">No Journal Entries Found</h3>
          <p className="text-xs text-[#141414]/75 max-w-md mx-auto font-sans leading-relaxed">
            You haven't saved any reflections yet. Start a new multi-turn reflection session with Gemini 3.6 Flash to build your private journal.
          </p>
          <button
            onClick={onNewEntry}
            className="px-4 py-2.5 bg-[#141414] text-[#E4E3E0] hover:bg-black border border-[#141414] text-xs font-mono uppercase font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Create Your First Reflection</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: List of Entries */}
          <div className="lg:col-span-5 space-y-3 max-h-[720px] overflow-y-auto pr-1">
            {filteredEntries.map((entry) => {
              const isSelected = selectedEntry?.id === entry.id;
              return (
                <div
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className={`p-4 border transition cursor-pointer space-y-2.5 shadow-xs ${
                    isSelected
                      ? "border-2 border-[#141414] bg-white"
                      : "border-[#141414]/40 bg-white/60 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 border border-[#141414] bg-[#D9D8D5] text-[#141414]">
                      {entry.mode}
                    </span>
                    <span className="text-[10px] font-mono text-[#141414]/60">
                      {new Date(entry.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <h4 className="font-serif italic text-base text-[#141414] leading-snug line-clamp-1">
                    {entry.title}
                  </h4>

                  {entry.summary ? (
                    <p className="text-xs font-sans text-[#141414]/80 line-clamp-2 leading-relaxed">
                      {entry.summary}
                    </p>
                  ) : (
                    <p className="text-xs font-sans text-[#141414]/60 italic line-clamp-2">
                      {entry.messages[0]?.content || "No message content"}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#141414]/15 text-[10px] font-mono">
                    <div className="flex items-center gap-1.5 text-[#141414]/70">
                      <MessageSquare className="w-3 h-3" />
                      <span>{entry.messages.length} turns</span>
                      {entry.mood && <span>• {entry.mood}</span>}
                    </div>

                    <div className="flex items-center gap-1">
                      {entry.tags.slice(0, 2).map((t) => (
                        <span key={t} className="px-1.5 py-0.5 bg-[#D9D8D5] text-[9px] border border-[#141414]/30">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Selected Entry Transcript & Details */}
          <div className="lg:col-span-7">
            {selectedEntry ? (
              <div className="border border-[#141414] bg-white/80 shadow-xs overflow-hidden flex flex-col justify-between">
                {/* Header Bar */}
                <div className="bg-[#D9D8D5] p-4 border-b border-[#141414] flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-[#141414]/70">
                      <span>{new Date(selectedEntry.createdAt).toLocaleString()}</span>
                      <span>•</span>
                      <span>MODEL: {selectedEntry.modelUsed || "gemini-3.6-flash"}</span>
                    </div>
                    <h3 className="text-xl font-serif italic text-[#141414]">{selectedEntry.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectEntry(selectedEntry)}
                      className="px-2.5 py-1 bg-[#141414] hover:bg-black text-[#E4E3E0] border border-[#141414] text-[10px] font-mono uppercase font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open in Workspace</span>
                    </button>

                    <button
                      onClick={() => handleExportEntry(selectedEntry)}
                      className="px-2 py-1 bg-white hover:bg-[#D9D8D5] text-[#141414] border border-[#141414] text-[10px] font-mono uppercase flex items-center gap-1 cursor-pointer"
                      title="Download Markdown"
                    >
                      <Download className="w-3 h-3" />
                    </button>

                    {deleteConfirmId === selectedEntry.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDeleteEntry(selectedEntry.id)}
                          disabled={isDeleting}
                          className="px-2 py-1 bg-rose-700 hover:bg-rose-800 text-white border border-rose-900 text-[10px] font-mono uppercase font-bold cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 bg-white text-[#141414] border border-[#141414] text-[10px] font-mono uppercase cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(selectedEntry.id)}
                        className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-800 border border-[#141414] text-[10px] font-mono uppercase flex items-center gap-1 cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-5 sm:p-6 space-y-6 max-h-[600px] overflow-y-auto">
                  {/* Summary & Takeaways Section */}
                  {selectedEntry.summary && (
                    <div className="p-4 border border-[#141414] bg-[#D9D8D5]/30 space-y-3">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#141414] flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-amber-700" />
                        Executive AI Synthesis
                      </span>
                      <p className="text-xs font-sans text-[#141414] leading-relaxed italic">
                        "{selectedEntry.summary}"
                      </p>

                      {selectedEntry.keyTakeaways && selectedEntry.keyTakeaways.length > 0 && (
                        <div className="pt-2 border-t border-[#141414]/20 space-y-1.5">
                          <span className="text-[10px] font-mono uppercase text-[#141414]/70">Key Insights:</span>
                          <ul className="list-disc list-inside text-xs font-sans space-y-1 text-[#141414]">
                            {selectedEntry.keyTakeaways.map((point, idx) => (
                              <li key={idx}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Multi-Turn Conversation Log */}
                  <div className="space-y-4">
                    <span className="text-[10px] font-mono uppercase font-bold text-[#141414]/70 block border-b border-[#141414]/20 pb-1">
                      Multi-Turn Dialogue ({selectedEntry.messages.length} turns)
                    </span>

                    {selectedEntry.messages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`p-4 border text-xs leading-relaxed space-y-1 ${
                          m.role === "user"
                            ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                            : "bg-white text-[#141414] border-[#141414]"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono opacity-75">
                          <span>{m.role === "user" ? "You (Prompt)" : "Gemini 3.6 Flash (Reflection)"}</span>
                          <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
                        </div>
                        {m.role === "user" ? (
                          <p className="font-sans whitespace-pre-wrap">{m.content}</p>
                        ) : (
                          <div className="prose prose-sm max-w-none text-[#141414] prose-headings:font-serif prose-p:my-1">
                            <ReactMarkdown>{m.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-[#141414] bg-white/60 p-12 text-center text-[#141414]/60 font-mono text-xs">
                Select a reflection from the left to view the full dialogue transcript and executive summary.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
