"use client";
import { useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function ForgotPassword({ onBack }: { onBack: () => void }) {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let pwd = "";
    for (let i = 0; i < 10; i++)
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    setGeneratedPassword(pwd);
  };

  const handleSubmit = async () => {
    if (!emailOrPhone || !generatedPassword) {
      setError("Please enter your email/phone and generate a password.");
      return;
    }
    try {
      const res = await axiosInstance.post("/forgot-password", {
        emailOrPhone,
        newPassword: generatedPassword,
      });
      setMessage(res.data.message);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong");
      setMessage("");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-2">Forgot Password</h2>
        <p className="text-gray-400 text-sm mb-6">
          Reset your password using your registered email or phone number.
        </p>

        <Input
          placeholder="Email address or phone number"
          value={emailOrPhone}
          onChange={(e) => setEmailOrPhone(e.target.value)}
          className="bg-gray-800 border-gray-700 text-white mb-4"
        />

        <Button
          onClick={generatePassword}
          variant="outline"
          className="w-full mb-3 border-blue-500 text-blue-400 hover:bg-blue-900/20"
        >
          🔑 Generate Password
        </Button>

        {generatedPassword && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 mb-4 text-center">
            <p className="text-gray-400 text-xs mb-1">Your generated password:</p>
            <p className="text-white font-mono font-bold text-lg">{generatedPassword}</p>
            <p className="text-gray-500 text-xs mt-1">Save this password before submitting</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        {message && (
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 mb-4">
            <p className="text-green-400 text-sm">{message}</p>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-full mb-3"
        >
          Reset Password
        </Button>

        <Button
          onClick={onBack}
          variant="ghost"
          className="w-full text-gray-400 hover:text-white"
        >
          ← Back to Login
        </Button>
      </div>
    </div>
  );
}
