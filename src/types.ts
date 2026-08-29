export type ReflectionMode = "reflection" | "brainstorm" | "summary" | "gratitude" | "freeform";

export type MoodType =
  | "inspired"
  | "calm"
  | "focused"
  | "contemplative"
  | "energized"
  | "overwhelmed"
  | "grateful"
  | "neutral";

export interface JournalMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  mode: ReflectionMode;
  mood?: MoodType | string;
  tags: string[];
  messages: JournalMessage[];
  summary?: string;
  keyTakeaways?: string[];
  modelUsed?: string;
  createdAt: string;
  updatedAt: string;
}

export type JournalInteraction = JournalEntry;

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: string;
  lastLoginAt?: string;
  isDemo?: boolean;
}

export interface ReflectionSynthesis {
  timeframe: string;
  totalEntriesAnalyzed: number;
  overallMoodTrends: string;
  coreThemes: {
    theme: string;
    description: string;
    actionableAdvice: string;
  }[];
  growthAreas: string[];
  encouragement: string;
}
