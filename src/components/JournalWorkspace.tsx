import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  JournalEntry,
  JournalMessage,
  ReflectionMode,
  MoodType,
} from "../types";
import { saveJournalEntryToFirestore } from "../lib/firebase";
import ReactMarkdown from "react-markdown";
import {
  Sparkles,
  Send,
  Save,
  Plus,
  Tag,
  Smile,
  Brain,
  Download,
  Copy,
  Check,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  FileText,
  Trash2,
} from "lucide-react";

interface JournalWorkspaceProps {
  initialEntry?: JournalEntry | null;
  onEntrySaved?: (entry: JournalEntry) => void;
  onNewEntry?: () => void;
}

const MODES: { id: ReflectionMode; label: string; desc: string; icon: string }[] = [
  { id: "reflection", label: "Deep Reflection", desc: "Thoughtful introspection & guided questions", icon: "🪞" },
  { id: "brainstorm", label: "Brainstorming", desc: "Strategic ideation & action planning", icon: "💡" },
  { id: "summary", label: "Executive Summary", desc: "Clarity, synthesis & core takeaways", icon: "📋" },
  { id: "gratitude", label: "Mindful Gratitude", desc: "Savoring positives & cultivating resilience", icon: "🌿" },
  { id: "freeform", label: "Freeform Conversation", desc: "Open-ended conversational companion", icon: "💬" },
];

const MOODS: { id: MoodType; label: string; icon: string }[] = [
  { id: "inspired", label: "Inspired", icon: "✨" },
  { id: "focused", label: "Focused", icon: "🎯" },
  { id: "calm", label: "Calm", icon: "🧘" },
  { id: "contemplative", label: "Contemplative", icon: "💭" },
  { id: "energized", label: "Energized", icon: "⚡" },
  { id: "grateful", label: "Grateful", icon: "🙏" },
  { id: "overwhelmed", label: "Overwhelmed", icon: "🌧️" },
  { id: "neutral", label: "Neutral", icon: "⚖️" },
];

const STARTER_PROMPTS = [
  "What is the single most important lesson or challenge I faced today, and how did I respond?",
  "I have a creative project idea but feel stuck on the next steps. Can you help me brainstorm?",
  "I'm feeling pulled in multiple directions. Help me reflect on my real priorities.",
  "What are 3 small things that went well today that I might be taking for granted?",
  "I made a difficult decision recently and want to reflect on my underlying motivations.",
];

export const JournalWorkspace: React.FC<JournalWorkspaceProps> = ({
  initialEntry,
  onEntrySaved,
  onNewEntry,
}) => {
  const { user, firebaseUser } = useAuth();
  const userId = user?.uid || "demo-user";

  const [entryId, setEntryId] = useState<string>(
    initialEntry?.id || `entry-${Date.now()}`
  );
  const [title, setTitle] = useState<string>(initialEntry?.title || "Untitled Reflection");
  const [mode, setMode] = useState<ReflectionMode>(initialEntry?.mode || "reflection");
  const [mood, setMood] = useState<MoodType | string>(initialEntry?.mood || "focused");
  const [tagInput, setTagInput] = useState<string>("");
  const [tags, setTags] = useState<string[]>(initialEntry?.tags || ["Journal", "Reflection"]);
  const [messages, setMessages] = useState<JournalMessage[]>(initialEntry?.messages || []);
  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [summary, setSummary] = useState<string | undefined>(initialEntry?.summary);
  const [keyTakeaways, setKeyTakeaways] = useState<string[] | undefined>(initialEntry?.keyTakeaways);
  const [modelUsed, setModelUsed] = useState<string>(initialEntry?.modelUsed || "gemini-3.6-flash");

  const [isSending, setIsSending] = useState<boolean>(false);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state if initialEntry prop changes
  useEffect(() => {
    if (initialEntry) {
      setEntryId(initialEntry.id);
      setTitle(initialEntry.title);
      setMode(initialEntry.mode);
      setMood(initialEntry.mood || "focused");
      setTags(initialEntry.tags || []);
      setMessages(initialEntry.messages || []);
      setSummary(initialEntry.summary);
      setKeyTakeaways(initialEntry.keyTakeaways);
      setModelUsed(initialEntry.modelUsed || "gemini-3.6-flash");
    }
  }, [initialEntry]);

  // Scroll to bottom of message list on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // Handle Tag addition
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const clean = tagInput.trim();
      if (!tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Send message to Gemini 3.6 Flash reflection endpoint
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputPrompt;
    if (!textToSend.trim() || isSending) return;

    const userMessage: JournalMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputPrompt("");
    setIsSending(true);
    setSaveStatus("idle");

    try {
      const token = firebaseUser ? await firebaseUser.getIdToken() : null;
      const res = await fetch("/api/journal/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: newMessages,
          mode,
          mood,
          userPrompt: "",
        }),
      });

      const data = await res.json();
      if (res.ok && data.message) {
        const modelMessage: JournalMessage = {
          id: data.message.id || `msg-${Date.now()}-model`,
          role: "model",
          content: data.message.content,
          timestamp: data.message.timestamp || new Date().toISOString(),
        };
        const updatedMessages = [...newMessages, modelMessage];
        setMessages(updatedMessages);
        if (data.selectedModel) setModelUsed(data.selectedModel);

        // Auto-save updated entry to Firestore
        await autoSaveEntry(updatedMessages, data.selectedModel || modelUsed);
      } else {
        throw new Error(data.error || "Failed to generate reflection");
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      // Append error notification as model note
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          role: "model",
          content: `*Note: Reflection generation encountered a transient issue: ${err.message}. Please try resending.*`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // Auto-save helper
  const autoSaveEntry = async (currentMessages: JournalMessage[], currentModel: string) => {
    try {
      const now = new Date().toISOString();
      const entryPayload: JournalEntry = {
        id: entryId,
        userId,
        title: title === "Untitled Reflection" && currentMessages.length > 0
          ? currentMessages[0].content.slice(0, 36) + "..."
          : title,
        mode,
        mood,
        tags,
        messages: currentMessages,
        summary,
        keyTakeaways,
        modelUsed: currentModel,
        createdAt: initialEntry?.createdAt || now,
        updatedAt: now,
      };

      await saveJournalEntryToFirestore(userId, entryPayload);
      setSaveStatus("saved");
      if (onEntrySaved) onEntrySaved(entryPayload);
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (e) {
      console.warn("Auto-save notice:", e);
    }
  };

  // Explicit Save to Firestore
  const handleSaveToFirestore = async () => {
    if (messages.length === 0) return;
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const entryPayload: JournalEntry = {
        id: entryId,
        userId,
        title,
        mode,
        mood,
        tags,
        messages,
        summary,
        keyTakeaways,
        modelUsed,
        createdAt: initialEntry?.createdAt || now,
        updatedAt: now,
      };

      await saveJournalEntryToFirestore(userId, entryPayload);
      setSaveStatus("saved");
      if (onEntrySaved) onEntrySaved(entryPayload);
      setTimeout(() => setSaveStatus("idle"), 4000);
    } catch (err) {
      console.error("Save error:", err);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  // Generate AI Executive Summary & Key Takeaways
  const handleGenerateSummary = async () => {
    if (messages.length === 0 || isSummarizing) return;
    setIsSummarizing(true);

    try {
      const token = firebaseUser ? await firebaseUser.getIdToken() : null;
      const res = await fetch("/api/journal/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages,
          currentTitle: title !== "Untitled Reflection" ? title : "",
        }),
      });

      const result = await res.json();
      if (res.ok && result.data) {
        const { title: newTitle, summary: newSummary, keyTakeaways: newTakeaways, mood: newMood, tags: newTags } = result.data;
        if (title === "Untitled Reflection" || !title.trim()) {
          setTitle(newTitle);
        }
        setSummary(newSummary);
        setKeyTakeaways(newTakeaways);
        if (newMood) setMood(newMood);
        if (newTags && Array.isArray(newTags)) {
          const merged = Array.from(new Set([...tags, ...newTags]));
          setTags(merged);
        }

        // Persist with new summary
        const now = new Date().toISOString();
        const updatedEntry: JournalEntry = {
          id: entryId,
          userId,
          title: newTitle || title,
          mode,
          mood: newMood || mood,
          tags: Array.from(new Set([...tags, ...(newTags || [])])),
          messages,
          summary: newSummary,
          keyTakeaways: newTakeaways,
          modelUsed: result.modelUsed || modelUsed,
          createdAt: initialEntry?.createdAt || now,
          updatedAt: now,
        };

        await saveJournalEntryToFirestore(userId, updatedEntry);
        setSaveStatus("saved");
        if (onEntrySaved) onEntrySaved(updatedEntry);
      }
    } catch (err) {
      console.error("Summarization error:", err);
    } finally {
      setIsSummarizing(false);
    }
  };

  // Reset to brand new entry
  const handleStartNew = () => {
    const newId = `entry-${Date.now()}`;
    setEntryId(newId);
    setTitle("Untitled Reflection");
    setMode("reflection");
    setMood("focused");
    setTags(["Journal", "Reflection"]);
    setMessages([]);
    setInputPrompt("");
    setSummary(undefined);
    setKeyTakeaways(undefined);
    setSaveStatus("idle");
    if (onNewEntry) onNewEntry();
  };

  // Copy message text
  const handleCopyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Export entry to Markdown
  const handleExportMarkdown = () => {
    const md = `# ${title}
*Date:* ${new Date().toLocaleDateString()} | *Mode:* ${mode} | *Mood:* ${mood} | *Tags:* ${tags.join(", ")}

${summary ? `## Executive Summary\n${summary}\n\n` : ""}${
      keyTakeaways && keyTakeaways.length > 0
        ? `## Key Insights & Takeaways\n${keyTakeaways.map((t) => `- ${t}`).join("\n")}\n\n`
        : ""
    }## Conversation Transcript
${messages.map((m) => `### ${m.role === "user" ? "You" : "Gemini 3.6 Flash"} (${new Date(m.timestamp).toLocaleTimeString()})\n${m.content}`).join("\n\n")}
`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, "-") || "journal-entry"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header Panel */}
      <div className="border border-[#141414] bg-white/70 shadow-xs overflow-hidden">
        {/* Top Meta Bar */}
        <div className="bg-[#D9D8D5] px-4 py-2 border-b border-[#141414] flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-wider text-[#141414]">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 border border-[#141414] bg-[#141414] text-[#E4E3E0] font-bold">
              ACTIVE WORKSPACE
            </span>
            <span className="opacity-60">//</span>
            <span>MODEL: {modelUsed}</span>
          </div>

          <div className="flex items-center gap-2">
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-emerald-800 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>SYNCED TO FIRESTORE</span>
              </span>
            )}
            {saveStatus === "error" && (
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 text-rose-800 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>SAVED LOCALLY</span>
                </span>
                <button
                  onClick={handleSaveToFirestore}
                  className="px-2 py-0.5 bg-rose-700 hover:bg-rose-800 text-white text-[9px] font-mono uppercase font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Retry Cloud Save</span>
                </button>
              </div>
            )}

            <button
              onClick={handleStartNew}
              className="px-2.5 py-1 bg-white border border-[#141414] hover:bg-[#D9D8D5] text-[#141414] flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>New Entry</span>
            </button>

            <button
              onClick={handleSaveToFirestore}
              disabled={isSaving || messages.length === 0}
              className="px-3 py-1 bg-[#141414] hover:bg-black disabled:bg-zinc-400 text-[#E4E3E0] border border-[#141414] flex items-center gap-1.5 cursor-pointer font-bold"
            >
              <Save className="w-3 h-3" />
              <span>{isSaving ? "Saving..." : "Save to Cloud"}</span>
            </button>
          </div>
        </div>

        {/* Title & Metadata Configuration Bar */}
        <div className="p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Title Input */}
            <div className="flex-1">
              <input
                id="input-entry-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your reflection a title..."
                className="w-full text-xl sm:text-2xl font-serif italic text-[#141414] bg-transparent border-b border-dashed border-[#141414]/30 focus:border-[#141414] focus:outline-hidden py-1 px-0"
              />
            </div>

            {/* Mood Dropdown Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-[#141414]/70">Mood:</span>
              <select
                id="select-entry-mood"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="px-2.5 py-1 text-xs font-mono border border-[#141414] bg-white focus:outline-hidden"
              >
                {MOODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.icon} {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-[#141414]/20">
            {MODES.map((m) => {
              const isSelected = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`p-2.5 text-left border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-2 border-[#141414] bg-[#D9D8D5] text-[#141414] shadow-xs"
                      : "border-[#141414]/40 bg-white/50 text-[#141414]/70 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{m.icon}</span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#141414]" />
                    )}
                  </div>
                  <div className="font-mono text-xs font-bold uppercase mt-1 truncate">
                    {m.label}
                  </div>
                  <div className="text-[10px] opacity-75 truncate">{m.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Tags bar */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Tag className="w-3.5 h-3.5 opacity-60" />
            {tags.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 border border-[#141414] bg-white text-[10px] font-mono uppercase flex items-center gap-1.5"
              >
                <span>{t}</span>
                <button
                  onClick={() => handleRemoveTag(t)}
                  className="hover:text-rose-600 cursor-pointer text-xs"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              placeholder="+ add tag and press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="text-xs font-mono bg-transparent border-b border-[#141414]/20 px-1 py-0.5 focus:border-[#141414] focus:outline-hidden w-36"
            />
          </div>
        </div>
      </div>

      {/* Main Dialogue & Reflection Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Dialogue Stream */}
        <div className="lg:col-span-2 space-y-4">
          <div className="border border-[#141414] bg-white/70 shadow-xs min-h-[480px] flex flex-col justify-between">
            {/* Conversation Messages */}
            <div className="p-5 sm:p-6 space-y-6 flex-1 overflow-y-auto max-h-[580px]">
              {messages.length === 0 ? (
                <div className="py-10 text-center space-y-6">
                  <div className="w-12 h-12 border border-[#141414] bg-[#D9D8D5] mx-auto flex items-center justify-center">
                    <Brain className="w-6 h-6 text-[#141414]" />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h3 className="font-serif italic text-lg text-[#141414]">
                      Begin your reflection session
                    </h3>
                    <p className="text-xs text-[#141414]/75 font-sans leading-relaxed">
                      Write down your experiences, decisions, or dilemmas. Gemini 3.6 Flash will respond with structured questions,
                      empathetic feedback, and creative perspectives.
                    </p>
                  </div>

                  {/* Starter Prompts */}
                  <div className="space-y-2 max-w-lg mx-auto text-left">
                    <span className="text-[10px] font-mono uppercase text-[#141414]/70 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" />
                      Suggested Starter Inquiries:
                    </span>
                    <div className="space-y-1.5">
                      {STARTER_PROMPTS.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(prompt)}
                          className="w-full p-2.5 border border-[#141414]/30 bg-white/90 hover:bg-white text-left text-xs font-sans text-[#141414] transition cursor-pointer hover:border-[#141414] flex items-center justify-between group"
                        >
                          <span className="line-clamp-1 italic">"{prompt}"</span>
                          <span className="text-[10px] font-mono opacity-0 group-hover:opacity-100 uppercase ml-2 shrink-0">
                            Use →
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={msg.id || index}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1`}
                    >
                      {/* Sender Meta Bar */}
                      <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-[#141414]/60 px-1">
                        <span>{isUser ? "You" : "Gemini 3.6 Flash"}</span>
                        <span>•</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        {!isUser && (
                          <button
                            onClick={() => handleCopyMessage(msg.content, index)}
                            className="hover:text-[#141414] cursor-pointer flex items-center gap-0.5 ml-1"
                            title="Copy response"
                          >
                            {copiedIndex === index ? <Check className="w-2.5 h-2.5 text-emerald-700" /> : <Copy className="w-2.5 h-2.5" />}
                          </button>
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={`p-4 sm:p-5 max-w-[90%] border shadow-xs ${
                          isUser
                            ? "bg-[#141414] text-[#E4E3E0] border-[#141414] font-sans text-sm leading-relaxed"
                            : "bg-white border-[#141414] text-[#141414] font-sans text-sm leading-relaxed"
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <div className="prose prose-sm max-w-none text-[#141414] prose-headings:font-serif prose-headings:italic prose-headings:text-[#141414] prose-p:leading-relaxed prose-strong:text-[#141414] prose-strong:font-bold prose-ul:my-2 prose-li:my-0.5">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {isSending && (
                <div className="flex flex-col items-start space-y-1">
                  <div className="text-[10px] font-mono uppercase text-[#141414]/60 px-1">
                    Gemini 3.6 Flash reflecting...
                  </div>
                  <div className="p-4 border border-[#141414] bg-white text-[#141414] text-xs font-mono flex items-center gap-3">
                    <div className="w-3.5 h-3.5 border-2 border-[#141414] border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing dialogue and synthesizing perspective...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Composer Box */}
            <div className="border-t border-[#141414] bg-[#D9D8D5] p-3 sm:p-4">
              <div className="flex items-end gap-2">
                <textarea
                  id="textarea-journal-prompt"
                  ref={textareaRef}
                  rows={3}
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Write your reflection in ${mode} mode... (Press Ctrl+Enter to send)`}
                  className="flex-1 p-3 border border-[#141414] bg-white text-xs font-sans text-[#141414] placeholder:text-[#141414]/50 focus:outline-hidden resize-y min-h-[72px]"
                />

                <button
                  id="btn-send-journal-prompt"
                  onClick={() => handleSendMessage()}
                  disabled={!inputPrompt.trim() || isSending}
                  className="px-4 py-3 bg-[#141414] hover:bg-black disabled:bg-zinc-400 text-[#E4E3E0] border border-[#141414] text-xs font-mono uppercase font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition h-[72px] shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 text-[10px] font-mono text-[#141414]/70">
                <span>Shift+Enter for newline • Ctrl+Enter to send</span>
                <span>Owner: {userId.slice(0, 14)}...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: AI Summary, Insights & Takeaways Panel */}
        <div className="space-y-4">
          {/* Executive Summary Card */}
          <div className="border border-[#141414] bg-white/70 shadow-xs overflow-hidden">
            <div className="bg-[#D9D8D5] px-4 py-2 border-b border-[#141414] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-[#141414]" />
                <h3 className="font-serif italic text-xs text-[#141414]">AI Summary & Insights</h3>
              </div>
              <button
                id="btn-generate-summary"
                onClick={handleGenerateSummary}
                disabled={messages.length === 0 || isSummarizing}
                className="px-2 py-0.5 bg-[#141414] hover:bg-black disabled:bg-zinc-400 text-[#E4E3E0] border border-[#141414] text-[9px] font-mono uppercase font-bold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                <span>{isSummarizing ? "Distilling..." : "Generate Insights"}</span>
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs font-sans">
              {summary ? (
                <div className="space-y-3">
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold text-[#141414]/70 block mb-1">
                      Executive Synthesis:
                    </span>
                    <p className="text-[#141414] leading-relaxed bg-[#D9D8D5]/40 p-3 border border-[#141414]/30 italic">
                      "{summary}"
                    </p>
                  </div>

                  {keyTakeaways && keyTakeaways.length > 0 && (
                    <div>
                      <span className="font-mono text-[10px] uppercase font-bold text-[#141414]/70 block mb-1.5">
                        Key Takeaways & Action Points:
                      </span>
                      <ul className="space-y-1.5 list-none pl-0">
                        {keyTakeaways.map((point, idx) => (
                          <li
                            key={idx}
                            className="p-2 border border-[#141414]/20 bg-white flex items-start gap-2 text-[11px]"
                          >
                            <span className="w-4 h-4 border border-[#141414] bg-[#D9D8D5] flex items-center justify-center font-mono text-[9px] shrink-0 mt-0.5">
                              0{idx + 1}
                            </span>
                            <span className="leading-snug">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center text-[#141414]/60 space-y-2">
                  <FileText className="w-6 h-6 mx-auto opacity-40" />
                  <p className="text-[11px]">
                    No summary generated yet. Have a short conversation, then click <strong>"Generate Insights"</strong> to produce key takeaways.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions & Export Card */}
          <div className="border border-[#141414] bg-white/70 shadow-xs p-4 space-y-3 text-xs font-mono">
            <div className="font-bold uppercase text-[10px] text-[#141414] border-b border-[#141414]/20 pb-1 flex items-center justify-between">
              <span>Session Controls</span>
              <span className="text-[9px] opacity-60">FIRESTORE ISOLATED</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleExportMarkdown}
                disabled={messages.length === 0}
                className="w-full p-2 bg-white hover:bg-[#D9D8D5] text-[#141414] border border-[#141414] flex items-center justify-between text-xs cursor-pointer transition disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5" />
                  <span>Export as Markdown (.md)</span>
                </div>
                <span className="text-[10px] opacity-60">SAVE FILE</span>
              </button>

              <button
                onClick={handleStartNew}
                className="w-full p-2 bg-white hover:bg-[#D9D8D5] text-[#141414] border border-[#141414] flex items-center justify-between text-xs cursor-pointer transition"
              >
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear & New Blank Entry</span>
                </div>
                <span className="text-[10px] opacity-60">RESET</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
