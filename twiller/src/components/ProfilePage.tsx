"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Camera,
  Bell,
  Sparkles,
  MessageSquare,
  FileText,
  Image as ImageIcon,
  Shield,
  CheckCircle2,
  Share2,
  Trash2,
  Plus,
  X,
  Send,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import TweetCard from "./TweetCard";
import { Card, CardContent } from "./ui/card";
import Editprofile from "./Editprofile";
import axiosInstance from "@/lib/axiosInstance";
import LoginHistory from "./LoginHistory";

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("posts");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(
    user?.notificationsEnabled || false
  );
  const [tweets, setTweets] = useState<any[]>([]);
  const [userReplies, setUserReplies] = useState<any[]>([]);
  const [userHighlights, setUserHighlights] = useState<any[]>([]);
  const [userArticles, setUserArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Article composer state
  const [articleTitle, setArticleTitle] = useState("");
  const [articleBody, setArticleBody] = useState("");

  const handleNotificationToggle = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("Please allow notifications in your browser settings first.");
        return;
      }
      const newVal = !notifEnabled;
      setNotifEnabled(newVal);
      if (!user) return;
      await axiosInstance.patch(`/user/notifications/${user.email}`, {
        notificationsEnabled: newVal,
      });
    } catch (err) {
      console.error("Failed to update notifications", err);
    }
  };

  const loadLocalData = () => {
    try {
      const savedReplies = JSON.parse(localStorage.getItem("twiller_user_replies") || "[]");
      setUserReplies(savedReplies);
    } catch {}

    try {
      const savedHighlights = JSON.parse(localStorage.getItem("twiller_user_highlights") || "[]");
      setUserHighlights(savedHighlights);
    } catch {}

    try {
      const savedArticles = JSON.parse(localStorage.getItem("twiller_user_articles") || "[]");
      setUserArticles(savedArticles);
    } catch {}
  };

  const fetchTweets = async () => {
    try {
      setLoading(true);
      let remoteTweets: any[] = [];
      try {
        const res = await axiosInstance.get("/post");
        if (Array.isArray(res.data)) {
          remoteTweets = res.data;
        }
      } catch {}

      let localUserPosts: any[] = [];
      try {
        localUserPosts = JSON.parse(localStorage.getItem("twiller_user_posts") || "[]");
      } catch {}

      const combinedMap = new Map();
      [...localUserPosts, ...remoteTweets].forEach((t: any) => {
        const id = t._id || t.id;
        if (id && !combinedMap.has(id)) {
          combinedMap.set(id, t);
        }
      });
      setTweets(Array.from(combinedMap.values()));
    } catch (error) {
      console.log("Failed to fetch tweets for profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTweets();
    loadLocalData();
  }, []);

  const handleDeletePost = (deletedId: string) => {
    setTweets((prev) => prev.filter((t) => (t._id || t.id) !== deletedId));
    setUserHighlights((prev) => prev.filter((t) => (t._id || t.id) !== deletedId));
    try {
      const localUserPosts = JSON.parse(localStorage.getItem("twiller_user_posts") || "[]");
      const updated = localUserPosts.filter((t: any) => (t._id || t.id) !== deletedId);
      localStorage.setItem("twiller_user_posts", JSON.stringify(updated));
    } catch {}

    try {
      const savedHighlights = JSON.parse(localStorage.getItem("twiller_user_highlights") || "[]");
      const updatedH = savedHighlights.filter((h: any) => (h._id || h.id) !== deletedId);
      localStorage.setItem("twiller_user_highlights", JSON.stringify(updatedH));
    } catch {}
  };

  const handleDeleteReply = (replyId: string) => {
    const updated = userReplies.filter((r) => r._id !== replyId);
    setUserReplies(updated);
    try {
      localStorage.setItem("twiller_user_replies", JSON.stringify(updated));
    } catch {}
  };

  const handleDeleteArticle = (articleId: string) => {
    const updated = userArticles.filter((a) => a._id !== articleId);
    setUserArticles(updated);
    try {
      localStorage.setItem("twiller_user_articles", JSON.stringify(updated));
    } catch {}
  };

  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleTitle.trim() || !articleBody.trim()) return;

    const newArticle = {
      _id: "article_" + Date.now(),
      title: articleTitle.trim(),
      body: articleBody.trim(),
      timestamp: new Date().toISOString(),
      author: {
        displayName: user?.displayName || "You",
        username: user?.username || "user",
        avatar: user?.avatar || "https://images.pexels.com/photos/1139743/pexels-photo-1139743.jpeg?auto=compress&cs=tinysrgb&w=400",
      },
    };

    const updated = [newArticle, ...userArticles];
    setUserArticles(updated);
    try {
      localStorage.setItem("twiller_user_articles", JSON.stringify(updated));
    } catch {}

    setArticleTitle("");
    setArticleBody("");
    setShowArticleModal(false);
  };

  if (!user) return null;

  // Filter tweets by current user
  const userTweets = Array.isArray(tweets)
    ? tweets.filter((tweet: any) => {
        const authorObj = typeof tweet.author === "object" ? tweet.author : {};
        const authorId = authorObj._id || authorObj.id || (typeof tweet.author === "string" ? tweet.author : "");
        const authorEmail = authorObj.email || "";
        const authorUsername = authorObj.username || "";

        const currentEmail = (user.email || "").toLowerCase();
        const currentUsername = (user.username || currentEmail.split("@")[0] || "").toLowerCase();
        const tweetEmail = (authorEmail || "").toLowerCase();
        const tweetUsername = (authorUsername || "").toLowerCase();

        return (
          (currentEmail && tweetEmail && currentEmail === tweetEmail) ||
          (currentUsername && tweetUsername && currentUsername === tweetUsername) ||
          (user._id && authorId && user._id === authorId) ||
          authorId === "user_me"
        );
      })
    : [];

  // Media posts (photos or audio clips)
  const mediaTweets = userTweets.filter((t: any) => t.image || t.audioUrl || t.tweetType === "audio");

  return (
    <div className="min-h-screen bg-black text-white pb-16">
      {/* Top Sticky Header */}
      <div className="sticky top-0 bg-black/85 backdrop-blur-md border-b border-gray-800/80 z-20 transition-all">
        <div className="flex items-center px-4 py-3 space-x-6">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-full hover:bg-gray-800/60 text-gray-300 hover:text-white transition-all"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5">
              <h1 className="text-lg font-bold text-white leading-tight">
                {user.displayName}
              </h1>
              <CheckCircle2 className="h-4 w-4 text-blue-400 fill-blue-500/20" />
            </div>
            <p className="text-xs text-gray-400 font-medium">
              {userTweets.length} {userTweets.length === 1 ? "Post" : "Posts"}
            </p>
          </div>
        </div>
      </div>

      {/* Cover Banner & Profile Image */}
      <div className="relative group">
        <div className="h-44 sm:h-52 w-full bg-gradient-to-r from-blue-700 via-purple-700 to-indigo-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 p-2.5 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white border border-white/10 transition-all opacity-90 hover:scale-105"
            onClick={() => setShowEditModal(true)}
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>

        {/* Profile Header Row: Avatar & Action Buttons */}
        <div className="px-4 sm:px-6 relative flex justify-between items-end pb-3">
          <div className="relative -mt-16 sm:-mt-20">
            <div className="relative group/avatar">
              <Avatar className="h-28 w-28 sm:h-34 sm:w-34 ring-4 ring-black shadow-2xl bg-gray-900 rounded-full">
                <AvatarImage src={user.avatar} alt={user.displayName} className="object-cover" />
                <AvatarFallback className="text-3xl font-extrabold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => setShowEditModal(true)}
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity backdrop-blur-[2px]"
              >
                <Camera className="h-6 w-6 text-white drop-shadow" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-3">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-800 hover:border-gray-700 bg-gray-900/80 hover:bg-gray-800 text-gray-300 hover:text-white rounded-full p-2.5"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: user.displayName,
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Profile link copied to clipboard!");
                }
              }}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="border-gray-700 hover:border-gray-500 text-white bg-black hover:bg-gray-900 font-semibold rounded-full px-5 py-2 text-sm shadow-sm transition-all"
              onClick={() => setShowEditModal(true)}
            >
              Edit profile
            </Button>
          </div>
        </div>
      </div>

      {/* User Info Section */}
      <div className="px-4 sm:px-6 pt-2 pb-5 space-y-4 border-b border-gray-800/60">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {user.displayName}
            </h2>
            <CheckCircle2 className="h-5 w-5 text-blue-400 fill-blue-500/20" />
          </div>
          <p className="text-gray-400 text-sm font-medium">@{user.username || user.email?.split("@")[0]}</p>
        </div>

        {user.bio ? (
          <p className="text-gray-200 text-sm leading-relaxed max-w-2xl font-normal">
            {user.bio}
          </p>
        ) : (
          <p className="text-gray-500 text-sm italic">No bio added yet.</p>
        )}

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-gray-400 text-xs sm:text-sm font-medium pt-1">
          <div className="flex items-center space-x-1.5 text-gray-400">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span>{user.location || "Worldwide"}</span>
          </div>

          {user.website && (
            <div className="flex items-center space-x-1.5">
              <LinkIcon className="h-4 w-4 text-gray-500" />
              <a
                href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline truncate max-w-[200px]"
              >
                {user.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}

          <div className="flex items-center space-x-1.5 text-gray-400">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>
              Joined{" "}
              {user.joinedDate
                ? new Date(user.joinedDate).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })
                : "October 2026"}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-sm pt-1">
          <div className="flex items-center space-x-1 hover:underline cursor-pointer">
            <span className="font-bold text-white">0</span>
            <span className="text-gray-400 font-medium">Following</span>
          </div>
          <div className="flex items-center space-x-1 hover:underline cursor-pointer">
            <span className="font-bold text-white">0</span>
            <span className="text-gray-400 font-medium">Followers</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-gray-900/90 to-gray-900/40 rounded-xl border border-gray-800/80 shadow-sm backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Tweet Notifications</p>
              <p className="text-xs text-gray-400">Get instant updates when new posts are published</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              checked={notifEnabled}
              onChange={handleNotificationToggle}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 border border-gray-700"></div>
          </label>
        </div>
      </div>

      {/* Responsive Scrollable Tab Bar */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-gray-800/80 sticky top-[57px] bg-black/90 backdrop-blur-md z-10">
          <TabsList className="flex overflow-x-auto no-scrollbar space-x-1 bg-transparent p-0 h-auto justify-start border-none">
            {[
              { id: "posts", label: "Posts", icon: Sparkles },
              { id: "replies", label: "Replies", icon: MessageSquare },
              { id: "highlights", label: "Highlights", icon: Sparkles },
              { id: "articles", label: "Articles", icon: FileText },
              { id: "media", label: "Media", icon: ImageIcon },
              { id: "security", label: "Security", icon: Shield },
            ].map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex-1 min-w-[90px] py-3.5 px-4 text-sm font-semibold text-gray-400 hover:text-gray-200 hover:bg-gray-900/40 rounded-none transition-all data-[state=active]:text-white data-[state=active]:bg-transparent relative data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-1 data-[state=active]:after:bg-blue-500 data-[state=active]:after:rounded-full"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* 1. POSTS TAB CONTENT */}
        <TabsContent value="posts" className="mt-0 focus-visible:outline-none">
          <div className="divide-y divide-gray-800/60">
            {loading ? (
              <div className="py-16 text-center space-y-3">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-gray-400 text-sm">Loading posts...</p>
              </div>
            ) : userTweets.length > 0 ? (
              userTweets.map((tweet: any) => (
                <TweetCard key={tweet._id || tweet.id} tweet={tweet} onDeletePost={handleDeletePost} />
              ))
            ) : (
              <Card className="bg-black border-none shadow-none">
                <CardContent className="py-16 text-center">
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="h-16 w-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto text-gray-500 border border-gray-800">
                      <Sparkles className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      You haven't posted yet
                    </h3>
                    <p className="text-gray-400 text-sm">
                      When you compose and publish posts, they will be listed here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* 2. REPLIES TAB CONTENT */}
        <TabsContent value="replies" className="mt-0 focus-visible:outline-none">
          <div className="divide-y divide-gray-800/60 p-4 space-y-4">
            {userReplies.length > 0 ? (
              userReplies.map((reply: any) => (
                <div key={reply._id} className="p-4 bg-gray-900/60 rounded-2xl border border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-400 font-semibold">Replied to post</span>
                    <button
                      onClick={() => handleDeleteReply(reply._id)}
                      className="text-gray-500 hover:text-red-400 p-1 rounded-full hover:bg-red-950/40 transition-colors"
                      title="Delete Reply"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {reply.parentContent && (
                    <p className="text-xs text-gray-400 italic border-l-2 border-gray-700 pl-2">
                      "{reply.parentContent}"
                    </p>
                  )}
                  <p className="text-sm font-semibold text-white">{reply.content}</p>
                  <p className="text-[10px] text-gray-500">
                    {new Date(reply.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))
            ) : (
              <Card className="bg-black border-none shadow-none">
                <CardContent className="py-16 text-center">
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="h-16 w-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto text-gray-500 border border-gray-800">
                      <MessageSquare className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white">No replies yet</h3>
                    <p className="text-gray-400 text-sm">
                      When you reply to posts, your replies will remain saved here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* 3. HIGHLIGHTS TAB CONTENT */}
        <TabsContent value="highlights" className="mt-0 focus-visible:outline-none">
          <div className="divide-y divide-gray-800/60">
            {userHighlights.length > 0 ? (
              userHighlights.map((tweet: any) => (
                <TweetCard key={tweet._id || tweet.id} tweet={tweet} onDeletePost={handleDeletePost} />
              ))
            ) : (
              <Card className="bg-black border-none shadow-none">
                <CardContent className="py-16 text-center">
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="h-16 w-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto text-gray-500 border border-gray-800">
                      <Sparkles className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Highlight your best posts</h3>
                    <p className="text-gray-400 text-sm">
                      Click the three-dot option on any post and select "Pin to your profile" to save it here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* 4. ARTICLES TAB CONTENT */}
        <TabsContent value="articles" className="mt-0 focus-visible:outline-none">
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-white">Your Articles</h3>
              <Button
                onClick={() => setShowArticleModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full text-xs px-4 py-2 flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Write Article</span>
              </Button>
            </div>

            {userArticles.length > 0 ? (
              userArticles.map((art: any) => (
                <div key={art._id} className="p-5 bg-gray-900/60 rounded-2xl border border-gray-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-black text-white">{art.title}</h4>
                    <button
                      onClick={() => handleDeleteArticle(art._id)}
                      className="text-gray-500 hover:text-red-400 p-1.5 rounded-full hover:bg-red-950/40 transition-colors"
                      title="Delete Article"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{art.body}</p>
                  <p className="text-xs text-gray-500 font-medium">
                    Published on {new Date(art.timestamp).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              ))
            ) : (
              <Card className="bg-black border-none shadow-none">
                <CardContent className="py-16 text-center">
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="h-16 w-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto text-gray-500 border border-gray-800">
                      <FileText className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Write long-form articles</h3>
                    <p className="text-gray-400 text-sm">
                      Click "Write Article" above to publish long-form posts and newsletters.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* 5. MEDIA TAB CONTENT */}
        <TabsContent value="media" className="mt-0 focus-visible:outline-none">
          <div className="p-4">
            {mediaTweets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mediaTweets.map((tweet: any) => (
                  <div key={tweet._id || tweet.id} className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 p-3 space-y-2">
                    {tweet.image && (
                      <img src={tweet.image} alt="Media" className="w-full h-48 object-cover rounded-xl" />
                    )}
                    {tweet.tweetType === "audio" && tweet.audioUrl && (
                      <audio controls src={tweet.audioUrl} className="w-full" />
                    )}
                    <p className="text-xs text-gray-300 truncate">{tweet.content}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-gray-500">
                        {new Date(tweet.timestamp).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleDeletePost(tweet._id || tweet.id)}
                        className="text-gray-500 hover:text-red-400 p-1 rounded-full hover:bg-red-950/40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="bg-black border-none shadow-none">
                <CardContent className="py-16 text-center">
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="h-16 w-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto text-gray-500 border border-gray-800">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Lights, camera … attachments!</h3>
                    <p className="text-gray-400 text-sm">
                      When you post photos, videos, or audio clips, they will show up here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* 6. SECURITY TAB CONTENT */}
        <TabsContent value="security" className="mt-0 focus-visible:outline-none">
          <div className="p-4 sm:p-6">
            <LoginHistory />
          </div>
        </TabsContent>
      </Tabs>

      {/* Write Article Modal */}
      {showArticleModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="font-bold text-white text-base">Write Long-Form Article</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowArticleModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <form onSubmit={handleCreateArticle} className="p-4 space-y-4">
              <input
                type="text"
                placeholder="Article Title..."
                value={articleTitle}
                onChange={(e) => setArticleTitle(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 text-white font-bold text-lg p-3 rounded-xl focus:outline-none focus:border-blue-500"
              />
              <textarea
                placeholder="Write your article content..."
                rows={6}
                value={articleBody}
                onChange={(e) => setArticleBody(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 text-white text-sm p-3 rounded-xl focus:outline-none focus:border-blue-500 resize-none"
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowArticleModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!articleTitle.trim() || !articleBody.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full px-5 py-2 text-sm flex items-center space-x-1.5"
                >
                  <Send className="h-4 w-4" />
                  <span>Publish</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <Editprofile
        isopen={showEditModal}
        onclose={() => setShowEditModal(false)}
      />
    </div>
  );
}
