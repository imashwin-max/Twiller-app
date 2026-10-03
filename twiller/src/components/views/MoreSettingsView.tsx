"use client";
import React, { useState } from "react";
import { Settings, Globe, ShieldCheck, Sparkles, LogOut, Bell, User, Key, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import LanguageSwitcher from "../LanguageSwitcher";
import LoginHistory from "../LoginHistory";
import SubscriptionPlans from "../SubscriptionPlans";
import axiosInstance from "@/lib/axiosInstance";

export default function MoreSettingsView() {
  const { user, logout } = useAuth();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(user?.notificationsEnabled || false);

  const handleNotificationToggle = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("Please allow notifications in browser settings.");
        return;
      }
    }
    const newVal = !notifEnabled;
    setNotifEnabled(newVal);
    if (user?.email) {
      await axiosInstance.patch(`/user/notifications/${user.email}`, {
        notificationsEnabled: newVal,
      });
    }
  };

  return (
    <div className="min-h-screen text-white p-4 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-800 pb-4">
        <h1 className="text-2xl font-bold flex items-center space-x-2">
          <Settings className="h-6 w-6 text-blue-400" />
          <span>Settings & Privacy</span>
        </h1>
        <p className="text-gray-400 text-xs mt-1">Manage your account preferences, subscriptions, and security.</p>
      </div>

      {/* User Info Card */}
      {user && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold">
              {user.displayName[0]}
            </div>
            <div>
              <h2 className="font-bold text-base">{user.displayName}</h2>
              <p className="text-gray-400 text-xs">@{user.username} · {user.email}</p>
              <div className="inline-block mt-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                Plan: {user.plan || "Free"}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowSubscriptionModal(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xs px-4 py-2 rounded-full flex items-center space-x-1"
          >
            <Sparkles className="h-4 w-4" />
            <span>Upgrade</span>
          </button>
        </div>
      )}

      {/* Settings Sections */}
      <div className="space-y-4">
        {/* Section 1: Language */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <h3 className="text-base font-bold mb-3 flex items-center space-x-2 text-blue-400">
            <Globe className="h-5 w-5" />
            <span>Display Language & OTP</span>
          </h3>
          <p className="text-gray-400 text-xs mb-3">Change your preferred application language. Language changes trigger email/SMS OTP verification.</p>
          <LanguageSwitcher />
        </div>

        {/* Section 2: Notifications */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold flex items-center space-x-2 text-blue-400">
              <Bell className="h-5 w-5" />
              <span>Browser Keyword Notifications</span>
            </h3>
            <p className="text-gray-400 text-xs mt-1">Receive desktop alerts for trending keywords (e.g. "cricket", "science").</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifEnabled}
              onChange={handleNotificationToggle}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-checked:bg-blue-500 rounded-full transition-colors
              after:content-[''] after:absolute after:top-[2px] after:left-[2px]
              after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
              peer-checked:after:translate-x-5"></div>
          </label>
        </div>

        {/* Section 3: Security & Login History */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <h3 className="text-base font-bold mb-3 flex items-center space-x-2 text-blue-400">
            <ShieldCheck className="h-5 w-5" />
            <span>Security & Login History</span>
          </h3>
          <LoginHistory />
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full bg-red-950/40 hover:bg-red-900/60 border border-red-800 text-red-400 font-bold py-3 rounded-2xl flex items-center justify-center space-x-2 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Log out @{user?.username}</span>
        </button>
      </div>

      {showSubscriptionModal && (
        <SubscriptionPlans onClose={() => setShowSubscriptionModal(false)} />
      )}
    </div>
  );
}
