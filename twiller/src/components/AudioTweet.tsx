"use client";
import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axiosInstance";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function AudioTweet({ onClose, onPosted }: any) {
  const { user } = useAuth();
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const isWithinTimeWindow = () => {
    const now = new Date();
    // Convert current UTC time to IST (UTC + 5:30)
    const istMinutes = (now.getUTCHours() * 60 + now.getUTCMinutes() + 330) % (24 * 60);
    return istMinutes >= 14 * 60 && istMinutes < 19 * 60; // 2 PM to 7 PM
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setError("");
    } catch (err: any) {
      setError("Microphone access denied or not supported.");
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      setError("File exceeds 100 MB limit."); return;
    }
    const duration = await getAudioDuration(file);
    if (duration > 300) {
      setError("Audio exceeds 5 minute limit."); return;
    }
    setAudioBlob(file);
    setAudioUrl(URL.createObjectURL(file));
    setError("");
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = document.createElement("audio");
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => resolve(audio.duration);
    });
  };

  const sendOtp = async () => {
    if (!isWithinTimeWindow()) {
      setError("Audio tweets can only be posted between 2:00 PM and 7:00 PM IST."); return;
    }
    setLoading(true);
    try {
      await axiosInstance.post("/send-audio-otp", { email: user?.email });
      setOtpSent(true);
      setError("");
    } catch {
      setError("Failed to send OTP");
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    try {
      await axiosInstance.post("/verify-audio-otp", { email: user?.email, otp });
      setVerified(true);
      setError("");
    } catch {
      setError("Invalid or expired OTP");
    }
  };

  const postAudioTweet = async () => {
    if (!audioBlob || !user) return;
    setLoading(true);
    try {
      // In production we would upload the audio file to a service.
      // For this demo and complete local setup, we pass the local object URL
      // (or store as a simulated base64/placeholder audio url)
      const tweetData = {
        author: user._id,
        content: "🎙️ Audio Tweet",
        tweetType: "audio",
        audioUrl: audioUrl,
      };
      const res = await axiosInstance.post("/post", tweetData);
      onPosted(res.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to post");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">🎙️ Audio Tweet</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <p className="text-yellow-500 text-xs mb-4">⏰ Only available 2:00 PM – 7:00 PM IST · Max 5 min / 100 MB</p>

        {error && <div className="bg-red-900/30 border border-red-700 rounded-lg p-2 mb-3 text-red-400 text-sm">{error}</div>}

        {!audioUrl ? (
          <div className="space-y-3">
            <Button onClick={recording ? stopRecording : startRecording}
              className={`w-full ${recording ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"} text-white rounded-full font-semibold`}>
              {recording ? "⏹ Stop Recording" : "🎙 Start Recording"}
            </Button>
            <div className="text-center text-gray-500 text-sm">or</div>
            <label className="block w-full text-center border border-gray-700 rounded-full py-2 text-gray-400 hover:text-white cursor-pointer hover:border-gray-500 transition-colors">
              📁 Upload Audio File
              <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            <audio controls src={audioUrl} className="w-full mt-2" />
            <Button onClick={() => { setAudioUrl(""); setAudioBlob(null); }} variant="outline"
              className="w-full border-gray-700 text-gray-400 mt-2 hover:bg-gray-800 hover:text-white transition-colors">Remove & Re-record</Button>

            {!otpSent ? (
              <Button onClick={sendOtp} disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-full mt-4 font-semibold">
                {loading ? "Sending OTP..." : "Verify with OTP to Post"}
              </Button>
            ) : !verified ? (
              <div className="space-y-2 mt-4">
                <p className="text-gray-400 text-sm">Enter OTP sent to {user?.email} (Check your server log console for simulated OTP)</p>
                <Input value={otp} onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP" className="bg-gray-800 border-gray-700 text-white text-center tracking-widest font-mono text-lg" />
                <Button onClick={verifyOtp} className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold mt-2">
                  Verify OTP
                </Button>
              </div>
            ) : (
              <Button onClick={postAudioTweet} disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-full mt-4 font-semibold">
                {loading ? "Posting..." : "✅ Post Audio Tweet"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
