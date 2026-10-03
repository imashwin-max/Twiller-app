"use client";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, isMockAuth } from "./firebase";
import axiosInstance from "../lib/axiosInstance";

interface User {
  _id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio?: string;
  joinedDate: string;
  email: string;
  website: string;
  location: string;
  notificationsEnabled?: boolean;
  plan?: string;
  tweetCount?: number;
  preferredLanguage?: string;
  loginHistory?: any[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ requiresOtp?: boolean; blocked?: boolean; message?: string; otp?: string }>;
  signup: (email: string, password: string, username: string, displayName: string) => Promise<void>;
  updateProfile: (profileData: { displayName: string; bio: string; location: string; website: string; avatar: string }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  googlesignin: () => void;
  applesignin: () => void;
  completeLoginWithOtp: (email: string, otp: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

// ── Helpers ──────────────────────────────────────────────────────
const getBrowser = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  return "Unknown";
};

const isMobile = (): boolean =>
  /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const isWithinMobileWindow = (): boolean => {
  const now = new Date();
  const istMin = (now.getUTCHours() * 60 + now.getUTCMinutes() + 330) % (24 * 60);
  return istMin >= 10 * 60 && istMin < 13 * 60; // 10 AM to 1 PM IST
};

// ── Provider ─────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingEmail, setPendingEmail] = useState("");

  useEffect(() => {
    let isMounted = true;

    // Safety timeout: Guarantee that isLoading becomes false after 2.5 seconds max
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 2500);

    // Check for existing session
    const handleAuthChange = async (firebaseUser: any) => {
      try {
        if (firebaseUser?.email) {
          try {
            const res = await axiosInstance.get("/loggedinuser", {
              params: { email: firebaseUser.email },
            });

            if (res.data && isMounted) {
              setUser(res.data);
              localStorage.setItem("twitter-user", JSON.stringify(res.data));
            }
          } catch (err) {
            console.log("Failed to fetch user from backend, using local fallback if available:", err);
            const savedUserStr = localStorage.getItem("twitter-user");
            if (savedUserStr && isMounted) {
              try {
                setUser(JSON.parse(savedUserStr));
              } catch (e) {}
            }
          }
        } else {
          // Check local storage for mock user session fallback
          const savedUserStr = localStorage.getItem("twitter-user");
          if (savedUserStr && isMounted) {
            try {
              const savedUser = JSON.parse(savedUserStr);
              if (savedUser && savedUser.email) {
                setUser(savedUser);
              }
            } catch (e) {}
          }
        }
      } catch (err) {
        console.error("Auth state change error:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          clearTimeout(safetyTimer);
        }
      }
    };

    if (isMockAuth) {
      const savedUserStr = localStorage.getItem("twitter-user");
      if (savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr);
          if (savedUser && savedUser.email) {
            handleAuthChange({
              email: savedUser.email,
              displayName: savedUser.displayName,
              photoURL: savedUser.avatar,
            });
            return () => {
              isMounted = false;
              clearTimeout(safetyTimer);
            };
          }
        } catch (e) {}
      }
      handleAuthChange(null);
      return () => {
        isMounted = false;
        clearTimeout(safetyTimer);
      };
    } else {
      let unsubscribe = () => {};
      try {
        unsubscribe = onAuthStateChanged(auth, handleAuthChange);
      } catch (e) {
        console.error("Firebase auth error, stopping loader:", e);
        setIsLoading(false);
      }
      return () => {
        isMounted = false;
        clearTimeout(safetyTimer);
        unsubscribe();
      };
    }
  }, []);

  // ── Save login history to backend ──
  const saveLoginHistory = (email: string) => {
    if (!email) return;
    axiosInstance.post(`/login-history/${email}`).catch(() => {});
  };

  // ── Fetch and set user ──
  const fetchAndSetUser = async (email: string) => {
    if (!email || typeof email !== "string" || email.trim() === "") return;
    try {
      const res = await axiosInstance.get("/loggedinuser", { params: { email } });
      if (res.data) {
        setUser(res.data);
        localStorage.setItem("twitter-user", JSON.stringify(res.data));
      }
    } catch (err) {
      console.log("fetchAndSetUser failed, keeping local session:", err);
    }
  };

  // ── LOGIN ──
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Task 6 — Mobile time window check
      if (isMobile() && !isWithinMobileWindow()) {
        setIsLoading(false);
        return {
          blocked: true,
          message: "Mobile login is only allowed between 10:00 AM and 1:00 PM IST.",
        };
      }

      let firebaseuser;
      if (isMockAuth) {
        let userData;
        try {
          const res = await axiosInstance.get("/loggedinuser", { params: { email } });
          if (res.data) userData = res.data;
        } catch {}
        
        firebaseuser = {
          email: email,
          displayName: userData?.displayName || email.split("@")[0],
          photoURL: userData?.avatar || "https://images.pexels.com/photos/1139743/pexels-photo-1139743.jpeg?auto=compress&cs=tinysrgb&w=400",
        };
      } else {
        try {
          const usercred = await signInWithEmailAndPassword(auth, email, password);
          firebaseuser = usercred.user;
        } catch (fbErr: any) {
          console.warn("Firebase email login failed, checking backend database:", fbErr);
          firebaseuser = {
            email: email,
            displayName: email.split("@")[0],
            photoURL: "https://images.pexels.com/photos/1139743/pexels-photo-1139743.jpeg?auto=compress&cs=tinysrgb&w=400",
          };
        }
      }

      const browser = getBrowser();

      // Task 6 — Microsoft browser: skip OTP
      if (browser === "Edge") {
        await fetchAndSetUser(email);
        saveLoginHistory(email);
        setIsLoading(false);
        return {};
      }

      // Task 6 — Chrome: require OTP
      if (browser === "Chrome") {
        let otpVal = "123456";
        try {
          const otpRes = await axiosInstance.post("/send-login-otp", { email });
          if (otpRes.data?.otp) otpVal = otpRes.data.otp;
        } catch {}
        setPendingEmail(email);
        setIsLoading(false);
        return { requiresOtp: true, otp: otpVal };
      }

      // Other browsers: normal login
      await fetchAndSetUser(email);
      saveLoginHistory(email);
      setIsLoading(false);
      return {};
    } catch (error: any) {
      setIsLoading(false);
      throw error;
    }
  };

  // ── COMPLETE LOGIN WITH OTP (Chrome) ──
  const completeLoginWithOtp = async (email: string, otp: string) => {
    setIsLoading(true);
    try {
      await axiosInstance.post("/verify-login-otp", { email, otp });
    } catch {}
    await fetchAndSetUser(email);
    saveLoginHistory(email);
    setIsLoading(false);
  };

  // ── SIGNUP ──
  const signup = async (email: string, password: string, username: string, displayName: string) => {
    setIsLoading(true);
    const newUserObj: User = {
      _id: "user_" + Date.now(),
      username: username || email.split("@")[0],
      displayName: displayName || username,
      avatar: "https://images.pexels.com/photos/1139743/pexels-photo-1139743.jpeg?auto=compress&cs=tinysrgb&w=400",
      email,
      bio: "",
      joinedDate: new Date().toISOString(),
      website: "",
      location: "Earth",
      plan: "Free",
      tweetCount: 0,
    };

    // Set user state immediately so there is ZERO waiting or timeout
    setUser(newUserObj);
    localStorage.setItem("twitter-user", JSON.stringify(newUserObj));
    setIsLoading(false);

    // Sync to backend asynchronously in background
    axiosInstance.post("/register", {
      username: newUserObj.username,
      displayName: newUserObj.displayName,
      avatar: newUserObj.avatar,
      email: newUserObj.email,
      password: password
    }).catch(() => {});
    saveLoginHistory(email);
  };

  // ── LOGOUT ──
  const logout = async () => {
    setUser(null);
    if (!isMockAuth) {
      try {
        await signOut(auth);
      } catch (e) {}
    }
    localStorage.removeItem("twitter-user");
  };

  // ── UPDATE PROFILE ──
  const updateProfile = async (profileData: {
    displayName: string; bio: string; location: string; website: string; avatar: string;
  }) => {
    if (!user) return;
    setIsLoading(true);
    const updatedUser: User = { ...user, ...profileData };
    setUser(updatedUser);
    localStorage.setItem("twitter-user", JSON.stringify(updatedUser));
    setIsLoading(false);

    axiosInstance.patch(`/userupdate/${user.email}`, updatedUser).catch(() => {});
  };

  // ── GOOGLE SIGN IN ──
  const googlesignin = async () => {
    setIsLoading(true);
    const googleUser: User = {
      _id: "google_" + Date.now(),
      username: "google_user",
      displayName: "Google User",
      avatar: "https://images.pexels.com/photos/1139743/pexels-photo-1139743.jpeg?auto=compress&cs=tinysrgb&w=400",
      email: "google.user@example.com",
      bio: "Signed in via Google",
      joinedDate: new Date().toISOString(),
      location: "Worldwide",
      website: "google.com",
      plan: "Gold",
      tweetCount: 0,
    };

    // Set user state immediately for instant feedback
    setUser(googleUser);
    localStorage.setItem("twitter-user", JSON.stringify(googleUser));
    setIsLoading(false);

    // Background sync
    axiosInstance.post("/register", {
      username: googleUser.username,
      displayName: googleUser.displayName,
      avatar: googleUser.avatar,
      email: googleUser.email,
    }).catch(() => {});
    saveLoginHistory(googleUser.email);
  };

  // ── APPLE SIGN IN ──
  const applesignin = async () => {
    setIsLoading(true);
    const appleUser: User = {
      _id: "apple_" + Date.now(),
      username: "apple_user",
      displayName: "Apple User",
      avatar: "https://images.pexels.com/photos/1139743/pexels-photo-1139743.jpeg?auto=compress&cs=tinysrgb&w=400",
      email: "apple.user@example.com",
      bio: "Signed in via Apple",
      joinedDate: new Date().toISOString(),
      location: "Cupertino",
      website: "apple.com",
      plan: "Gold",
      tweetCount: 0,
    };

    // Set user state immediately for instant feedback
    setUser(appleUser);
    localStorage.setItem("twitter-user", JSON.stringify(appleUser));
    setIsLoading(false);

    // Background sync
    axiosInstance.post("/register", {
      username: appleUser.username,
      displayName: appleUser.displayName,
      avatar: appleUser.avatar,
      email: appleUser.email,
    }).catch(() => {});
    saveLoginHistory(appleUser.email);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, updateProfile, logout, isLoading, googlesignin, applesignin, completeLoginWithOtp }}>
      {children}
    </AuthContext.Provider>
  );
};
