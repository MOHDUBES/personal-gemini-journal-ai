import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { JournalEntry, UserProfile } from "../types";

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase Auth & Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Initialize Cloud Firestore using the configured database ID
const dbId = (firebaseConfig as any).firestoreDatabaseId;
export const db = dbId && dbId !== "(default)"
  ? getFirestore(app, dbId)
  : getFirestore(app);

// Helper: Sign In with Google popup
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Upsert user profile to Firestore
    if (result.user) {
      await syncUserProfile(result.user);
    }
    return result.user;
  } catch (error: any) {
    console.error("Google Sign-In error:", error);
    throw error;
  }
}

// Helper: Sign out
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// Sync user profile document (owner-bound under /users/{userId})
export async function syncUserProfile(user: User): Promise<void> {
  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const now = new Date().toISOString();

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "Explorer",
        photoURL: user.photoURL || "",
        createdAt: now,
        lastLoginAt: now,
      });
    } else {
      await updateDoc(userRef, {
        lastLoginAt: now,
        displayName: user.displayName || userSnap.data()?.displayName || "Explorer",
        photoURL: user.photoURL || userSnap.data()?.photoURL || "",
      });
    }
  } catch (err) {
    console.warn("Could not sync user profile to Firestore:", err);
  }
}

// Helper to recursively strip undefined values from objects before Firestore operations
export function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (typeof obj === "object" && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = stripUndefined(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

// Save or Update an Interaction in Firestore (/users/{userId}/interactions/{interactionId})
export async function saveJournalEntryToFirestore(
  userId: string,
  entry: JournalEntry
): Promise<void> {
  try {
    const cleanPayload = stripUndefined(entry);
    const interactionRef = doc(db, "users", userId, "interactions", entry.id);
    await setDoc(interactionRef, cleanPayload, { merge: true });

    // Also sync to legacy entries path for smooth backwards compatibility
    try {
      const entryRef = doc(db, "users", userId, "entries", entry.id);
      await setDoc(entryRef, cleanPayload, { merge: true });
    } catch {
      // Non-blocking
    }
  } catch (err) {
    console.error("Failed to save interaction to Firestore:", err);
    // Fallback to local storage for demo/offline resilience
    saveToLocalStorage(userId, entry);
    throw err;
  }
}

// Fetch all entries / interactions for a specific user (/users/{userId}/interactions)
export async function fetchUserJournalEntries(userId: string): Promise<JournalEntry[]> {
  try {
    // 1. Try fetching from /users/{userId}/interactions
    const interactionsRef = collection(db, "users", userId, "interactions");
    const q = query(interactionsRef, orderBy("updatedAt", "desc"));
    const snapshot = await getDocs(q);

    const entries: JournalEntry[] = [];
    snapshot.forEach((docSnap) => {
      entries.push(docSnap.data() as JournalEntry);
    });

    // 2. If empty, check /users/{userId}/entries as fallback
    if (entries.length === 0) {
      try {
        const entriesRef = collection(db, "users", userId, "entries");
        const fallbackQ = query(entriesRef, orderBy("updatedAt", "desc"));
        const fallbackSnap = await getDocs(fallbackQ);
        fallbackSnap.forEach((docSnap) => {
          entries.push(docSnap.data() as JournalEntry);
        });
      } catch {
        // Continue
      }
    }

    if (entries.length === 0) {
      // Check local storage fallback
      const localEntries = getFromLocalStorage(userId);
      if (localEntries.length > 0) return localEntries;
    }

    return entries;
  } catch (err) {
    console.warn("Firestore read failed, falling back to local cache:", err);
    return getFromLocalStorage(userId);
  }
}

// Delete a journal entry / interaction
export async function deleteJournalEntryFromFirestore(
  userId: string,
  entryId: string
): Promise<void> {
  try {
    const interactionRef = doc(db, "users", userId, "interactions", entryId);
    await deleteDoc(interactionRef);
    try {
      const entryRef = doc(db, "users", userId, "entries", entryId);
      await deleteDoc(entryRef);
    } catch {
      // Non-blocking
    }
    deleteFromLocalStorage(userId, entryId);
  } catch (err) {
    console.error("Failed to delete entry from Firestore:", err);
    deleteFromLocalStorage(userId, entryId);
    throw err;
  }
}

// Local Storage Fallback helpers for demo/offline resilience
function getLocalStorageKey(userId: string): string {
  return `gemini_journal_entries_${userId}`;
}

export function saveToLocalStorage(userId: string, entry: JournalEntry): void {
  try {
    const key = getLocalStorageKey(userId);
    const existing = getFromLocalStorage(userId);
    const filtered = existing.filter((e) => e.id !== entry.id);
    const updated = [entry, ...filtered];
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.error("Local storage save error", e);
  }
}

export function getFromLocalStorage(userId: string): JournalEntry[] {
  try {
    const key = getLocalStorageKey(userId);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function deleteFromLocalStorage(userId: string, entryId: string): void {
  try {
    const key = getLocalStorageKey(userId);
    const existing = getFromLocalStorage(userId);
    const filtered = existing.filter((e) => e.id !== entryId);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (e) {
    console.error("Local storage delete error", e);
  }
}
