import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, loginWithGoogle, logoutUser, syncUserProfile } from "../lib/firebase";
import { UserProfile } from "../types";

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  isDemoUser: boolean;
  error: string | null;
  signInWithGooglePopup: () => Promise<void>;
  signInAsDemoUser: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (currentUser) {
          setFirebaseUser(currentUser);
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || currentUser.email?.split("@")[0] || "User",
            photoURL: currentUser.photoURL,
            isDemo: false,
          });
          setIsDemoUser(false);
          setError(null);
          // Sync profile to Firestore
          try {
            await syncUserProfile(currentUser);
          } catch (e) {
            console.warn("Background profile sync error:", e);
          }
        } else {
          // If not signed in via Firebase, check if demo session active
          const savedDemo = sessionStorage.getItem("gemini_demo_user");
          if (savedDemo) {
            const demoData: UserProfile = JSON.parse(savedDemo);
            setUser(demoData);
            setIsDemoUser(true);
          } else {
            setUser(null);
            setFirebaseUser(null);
            setIsDemoUser(false);
          }
        }
        setLoading(false);
      },
      (authError) => {
        console.error("Auth state error:", authError);
        setError(authError.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const signInWithGooglePopup = async () => {
    setLoading(true);
    setError(null);
    try {
      const u = await loginWithGoogle();
      setFirebaseUser(u);
      setUser({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName || u.email?.split("@")[0] || "User",
        photoURL: u.photoURL,
        isDemo: false,
      });
      setIsDemoUser(false);
      sessionStorage.removeItem("gemini_demo_user");
    } catch (err: any) {
      console.error("Sign-in failed:", err);
      // Popup blocked or network issue
      const msg = err.code === "auth/popup-blocked"
        ? "Popup was blocked by browser. Please allow popups or use the Demo Session."
        : err.message || "Authentication failed";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInAsDemoUser = () => {
    const demoProfile: UserProfile = {
      uid: "demo-authenticated-user-101",
      displayName: "Alex Rivera",
      email: "alex.rivera@example.com",
      photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      createdAt: new Date().toISOString(),
      isDemo: true,
    };
    setUser(demoProfile);
    setIsDemoUser(true);
    setError(null);
    sessionStorage.setItem("gemini_demo_user", JSON.stringify(demoProfile));
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (firebaseUser) {
        await logoutUser();
      }
      setUser(null);
      setFirebaseUser(null);
      setIsDemoUser(false);
      sessionStorage.removeItem("gemini_demo_user");
    } catch (err: any) {
      console.error("Logout error:", err);
      setError(err.message || "Failed to log out");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        isDemoUser,
        error,
        signInWithGooglePopup,
        signInAsDemoUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
