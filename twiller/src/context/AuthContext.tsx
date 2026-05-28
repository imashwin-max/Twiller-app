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
  login: (email: string, password: string) => Promise<{ requiresOtp?: boolean; blocked?: boolean; message?: string }>;
  signup: (email: string, password: string, username: string, displayName: string) => Promise<void>;
  updateProfile: (profileData: { displayName: string; bio: string; location: string; website: string; avatar: string }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  googlesignin: () => void;
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
    // Check for existing session
    const handleAuthChange = async (firebaseUser: any) => {
      if (firebaseUser?.email) {
        try {
          const res = await axiosInstance.get("/loggedinuser", {
            params: { email: firebaseUser.email },
          });

          if (res.data) {
            setUser(res.data);
            localStorage.setItem("twitter-user", JSON.stringify(res.data));
          }
        } catch (err) {
          console.log("Failed to fetch user:", err);
        }
      } else {
        setUser(null);
        localStorage.removeItem("twitter-user");
      }
      setIsLoading(false);
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
            return;
          }
        } catch (e) {}
      }
      handleAuthChange(null);
    } else {
      const unsubscribe = onAuthStateChanged(auth, handleAuthChange);
      return () => unsubscribe();
    }
  }, []);

  // ── Save login history to backend ──
  const saveLoginHistory = async (email: string) => {
    try {
      await axiosInstance.post(`/login-history/${email}`);
    } catch (err) {
      console.log("Login history save failed:", err);
    }
  };

  // ── Fetch and set user ──
  const fetchAndSetUser = async (email: string) => {
    const res = await axiosInstance.get("/loggedinuser", { params: { email } });
    if (res.data) {
      setUser(res.data);
      localStorage.setItem("twitter-user", JSON.stringify(res.data));
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
        const res = await axiosInstance.get("/loggedinuser", {
          params: { email },
        });
        if (res.data) {
          firebaseuser = {
            email: res.data.email,
            displayName: res.data.displayName,
            photoURL: res.data.avatar,
          };
        } else {
          setIsLoading(false);
          throw new Error("User not found. Please sign up first!");
        }
      } else {
        const usercred = await signInWithEmailAndPassword(auth, email, password);
        firebaseuser = usercred.user;
      }

      const browser = getBrowser();

      // Task 6 — Microsoft browser: skip OTP
      if (browser === "Edge") {
        await fetchAndSetUser(email);
        await saveLoginHistory(email);
        setIsLoading(false);
        return {};
      }

      // Task 6 — Chrome: require OTP
      if (browser === "Chrome") {
        await axiosInstance.post("/send-login-otp", { email });
        setPendingEmail(email);
        setIsLoading(false);
        return { requiresOtp: true };
      }

      // Other browsers: normal login
      await fetchAndSetUser(email);
      await saveLoginHistory(email);
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
    await axiosInstance.post("/verify-login-otp", { email, otp });
    await fetchAndSetUser(email);
    await saveLoginHistory(email);
    setIsLoading(false);
  };

  // ── SIGNUP ──
  const signup = async (email: string, password: string, username: string, displayName: string) => {
    setIsLoading(true);
    let firebaseUser;
    if (isMockAuth) {
      firebaseUser = {
        email,
        displayName,
        photoURL: "https://images.pexels.com/photos/1139743/pexels-photo-1139743.jpeg?auto=compress&cs=tinysrgb&w=400",
      };
    } else {
      const usercred = await createUserWithEmailAndPassword(auth, email, password);
      firebaseUser = usercred.user;
    }

    const newuser: any = {
      username,
      displayName,
      avatar: firebaseUser.photoURL || "https://images.pexels.com/photos/1139743/pexels-photo-1139743.jpeg?auto=compress&cs=tinysrgb&w=400",
      email: firebaseUser.email,
      password: password
    };
    const res = await axiosInstance.post("/register", newuser);
    if (res.data) {
      setUser(res.data);
      localStorage.setItem("twitter-user", JSON.stringify(res.data));
      await saveLoginHistory(firebaseUser.email ?? "")
    }
    setIsLoading(false);
  };

  // ── LOGOUT ──
  const logout = async () => {
    setUser(null);
    if (!isMockAuth) {
      await signOut(auth);
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
    const res = await axiosInstance.patch(`/userupdate/${user.email}`, updatedUser);
    if (res.data) {
      setUser(updatedUser);
      localStorage.setItem("twitter-user", JSON.stringify(updatedUser));
    }
    setIsLoading(false);
  };

  // ── GOOGLE SIGN IN ──
  const googlesignin = async () => {
    setIsLoading(true);
    try {
      let firebaseuser;
      if (isMockAuth) {
        firebaseuser = {
          email: "demo@example.com",
          displayName: "Demo User",
          photoURL: "https://images.pexels.com/photos/1139743/pexels-photo-1139743.jpeg?auto=compress&cs=tinysrgb&w=400",
        };
      } else {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        firebaseuser = result.user;
      }
      
      if (!firebaseuser?.email) throw new Error("No email found");

      let userData;
      try {
        const res = await axiosInstance.get("/loggedinuser", { params: { email: firebaseuser.email } });
        userData = res.data;
      } catch {
        const newuser: any = {
          username: firebaseuser.email.split("@")[0],
          displayName: firebaseuser.displayName || "User",
          avatar: firebaseuser.photoURL || "https://images.pexels.com/photos/1139743/pexels-photo-1139743.jpeg?auto=compress&cs=tinysrgb&w=400",
          email: firebaseuser.email,
        };
        const registerRes = await axiosInstance.post("/register", newuser);
        userData = registerRes.data;
      }

      if (userData) {
        setUser(userData);
        localStorage.setItem("twitter-user", JSON.stringify(userData));
        await saveLoginHistory(firebaseuser.email);
      }
    } catch (error: any) {
      alert(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, updateProfile, logout, isLoading, googlesignin, completeLoginWithOtp }}>
      {children}
    </AuthContext.Provider>
  );
};
