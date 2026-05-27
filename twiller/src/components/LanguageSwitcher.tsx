"use client";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axiosInstance";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

const LANGUAGES = [
  { code: "en", label: "🇬🇧 English" },
  { code: "es", label: "🇪🇸 Spanish" },
  { code: "hi", label: "🇮🇳 Hindi" },
  { code: "pt", label: "🇧🇷 Portuguese" },
  { code: "zh", label: "🇨🇳 Chinese" },
  { code: "fr", label: "🇫🇷 French" },
];

export default function LanguageSwitcher() {
  const { language, changeLanguage, applyLanguage } = useLanguage();
  const { user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [pendingLang, setPendingLang] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpNote, setOtpNote] = useState("");

  const handleSelectLanguage = async (code: string) => {
    if (code === language) { setShowDropdown(false); return; }
    if (!user?.email) return;
    setShowDropdown(false);
    setPendingLang(code);
    setLoading(true);
    try {
      await changeLanguage(code, user.email);
      const note = code === "fr"
        ? "OTP sent to your registered email address. (Check backend console for simulated OTP)"
        : "OTP sent to your registered mobile number. (Check backend console for simulated OTP)";
      setOtpNote(note);
      setShowOtpModal(true);
      setError("");
    } catch {
      setError("Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      await axiosInstance.post("/verify-language-otp", {
        email: user.email,
        otp,
        language: pendingLang,
      });
      applyLanguage(pendingLang);
      setShowOtpModal(false);
      setOtp("");
      setError("");
    } catch {
      setError("Invalid or expired OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const currentLang = LANGUAGES.find((l) => l.code === language);

  return (
    <>
      {/* Language Selector Button */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-2 text-gray-400 hover:text-white hover:bg-gray-900 rounded-full px-3 py-2 w-full transition-colors"
        >
          <span className="text-xl">🌐</span>
          <span className="text-sm font-medium">{currentLang?.label || "Language"}</span>
        </button>

        {showDropdown && (
          <div className="absolute bottom-12 left-0 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-48 z-50 overflow-hidden">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelectLanguage(lang.code)}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-800 transition-colors flex items-center justify-between
                  ${language === lang.code ? "text-blue-400 font-semibold" : "text-gray-300"}`}
              >
                {lang.label}
                {language === lang.code && <span>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm text-white">
            <h3 className="text-white font-bold text-lg mb-2">
              Verify Language Change
            </h3>
            <p className="text-gray-400 text-sm mb-1">
              Switching to:{" "}
              <span className="text-blue-400 font-semibold">
                {LANGUAGES.find((l) => l.code === pendingLang)?.label}
              </span>
            </p>
            <p className="text-gray-500 text-xs mb-4">{otpNote}</p>

            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-2 mb-3">
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="bg-gray-800 border-gray-700 text-white text-center tracking-widest text-lg mb-4"
            />

            <div className="flex space-x-3">
              <Button
                onClick={() => { setShowOtpModal(false); setOtp(""); setError(""); }}
                variant="outline"
                className="flex-1 border-gray-700 text-gray-400 rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold"
              >
                {loading ? "Verifying..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading && !showOtpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-6 text-white text-center">
            <div className="text-2xl mb-2">📤</div>
            <p>Sending OTP...</p>
          </div>
        </div>
      )}
    </>
  );
}
