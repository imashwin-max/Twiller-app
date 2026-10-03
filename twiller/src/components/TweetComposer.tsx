import { useAuth } from "@/context/AuthContext";
import React, { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Image, Smile, Calendar, MapPin, BarChart3, Globe, Mic } from "lucide-react";
import { Separator } from "./ui/separator";
import axios from "axios";
import axiosInstance from "@/lib/axiosInstance";
import AudioTweet from "./AudioTweet";
const TweetComposer = ({ onTweetPosted }: any) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageurl, setimageurl] = useState("");
  const [showAudioModal, setShowAudioModal] = useState(false);
  const maxLength = 200;
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!user || !content.trim()) return;
    setIsLoading(true);
    try {
      const tweetdata = {
        author: user?._id || user?.email,
        content,
        image: imageurl,
      };
      const res = await axiosInstance.post("/post", tweetdata);
      onTweetPosted(res.data);

      // ✅ TASK 1 — Keyword notification trigger
      const KEYWORDS = ["cricket", "science"];
      const hasKeyword = KEYWORDS.some((kw) =>
        content.toLowerCase().includes(kw)
      );
      if (
        hasKeyword &&
        user.notificationsEnabled &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification("🔔 Trending tweet alert!", {
          body: content,
          icon: "/favicon.ico",
        });
      }

      setContent("");
      setimageurl("");
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to post tweet. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const characterCount = content.length;
  const isOverLimit = characterCount > maxLength;
  const isNearLimit = characterCount > maxLength * 0.8;
  if (!user) return null;
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsLoading(true);
    const image = e.target.files[0];
    
    // Instant local preview fallback
    const localUrl = URL.createObjectURL(image);
    setimageurl(localUrl);

    const formdataimg = new FormData();
    formdataimg.set("image", image);
    try {
      const res = await axios.post(
        "https://api.imgbb.com/1/upload?key=97f3fb960c3520d6a88d7e29679cf96f",
        formdataimg
      );
      const url = res.data?.data?.display_url;
      if (url) {
        setimageurl(url);
      }
    } catch (error) {
      console.log("Imgbb upload failed, using local URL preview:", error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Card className="bg-black border-gray-800 border-x-0 border-t-0 rounded-none border-b">
      <CardContent className="p-4">
        <div className="flex space-x-3">
          <Avatar className="h-11 w-11 border border-gray-700">
            <AvatarImage src={user.avatar} alt={user.displayName} />
            <AvatarFallback className="bg-blue-600 text-white font-bold">{user.displayName[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <form onSubmit={handleSubmit}>
              <Textarea
                placeholder="What is happening?!"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-transparent border-none text-xl text-white placeholder-gray-500 resize-none min-h-[100px] focus-visible:ring-0 focus-visible:ring-offset-0 p-0 font-normal"
              />

              {imageurl && (
                <div className="relative my-3 rounded-2xl overflow-hidden border border-gray-800 max-h-64 w-full group">
                  <img src={imageurl} alt="Upload preview" className="w-full h-auto max-h-64 object-cover" />
                  <button
                    type="button"
                    onClick={() => setimageurl("")}
                    className="absolute top-2 right-2 bg-black/80 hover:bg-black text-white rounded-full p-1.5 text-xs font-bold transition-all"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-4 text-blue-400">
                  <label
                    htmlFor="tweetImage"
                    className="p-2 rounded-full hover:bg-blue-900/20 cursor-pointer"
                  >
                    <Image className="h-5 w-5" />
                    <input
                      type="file"
                      accept="image/*"
                      id="tweetImage"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={isLoading}
                    />
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 rounded-full hover:bg-blue-900/20 text-blue-400"
                    type="button"
                    onClick={() => setShowAudioModal(true)}
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 rounded-full hover:bg-blue-900/20"
                  >
                    <BarChart3 className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 rounded-full hover:bg-blue-900/20"
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 rounded-full hover:bg-blue-900/20"
                  >
                    <Calendar className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 rounded-full hover:bg-blue-900/20"
                  >
                    <MapPin className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-blue-400 font-semibold">
                      Everyone can reply
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    {characterCount > 0 && (
                      <div className="flex items-center space-x-2">
                        <div className="relative w-8 h-8">
                          <svg className="w-8 h-8 transform -rotate-90">
                            <circle
                              cx="16"
                              cy="16"
                              r="14"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                              className="text-gray-700"
                            />
                            <circle
                              cx="16"
                              cy="16"
                              r="14"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 14}`}
                              strokeDashoffset={`${
                                2 *
                                Math.PI *
                                14 *
                                (1 - characterCount / maxLength)
                              }`}
                              className={
                                isOverLimit
                                  ? "text-red-500"
                                  : isNearLimit
                                  ? "text-yellow-500"
                                  : "text-blue-500"
                              }
                            />
                          </svg>
                        </div>
                        {isNearLimit && (
                          <span
                            className={`text-sm ${
                              isOverLimit ? "text-red-500" : "text-yellow-500"
                            }`}
                          >
                            {maxLength - characterCount}
                          </span>
                        )}
                      </div>
                    )}
                    <Separator
                      orientation="vertical"
                      className="h-6 bg-gray-700"
                    />

                    <Button
                      type="submit"
                      disabled={!content.trim() || isOverLimit|| isLoading}
                      className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-full px-6"
                    >
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </CardContent>
      {showAudioModal && (
        <AudioTweet
          onClose={() => setShowAudioModal(false)}
          onPosted={(newTweet: any) => onTweetPosted(newTweet)}
        />
      )}
    </Card>
  );
};

export default TweetComposer;
