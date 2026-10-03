"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Link as LinkIcon,
  MoreHorizontal,
  Camera,
  Bell,
  Sparkles,
  MessageSquare,
  FileText,
  Image as ImageIcon,
  Shield,
  CheckCircle2,
  Share2,
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
  const [notifEnabled, setNotifEnabled] = useState(
    user?.notificationsEnabled || false
  );
  const [tweets, setTweets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
  }, []);

  const handleDeletePost = (deletedId: string) => {
    setTweets((prev) => prev.filter((t) => (t._id || t.id) !== deletedId));
    try {
      const localUserPosts = JSON.parse(localStorage.getItem("twiller_user_posts") || "[]");
      const updated = localUserPosts.filter((t: any) => (t._id || t.id) !== deletedId);
      localStorage.setItem("twiller_user_posts", JSON.stringify(updated));
    } catch {}
  };

  if (!user) return null;

  // Filter tweets by current user
  const userTweets = Array.isArray(tweets)
    ? tweets.filter((tweet: any) => {
        const authorObj = typeof tweet.author === "object" ? tweet.author : {};
        const authorId = authorObj._id || authorObj.id || tweet.author;
        const authorEmail = authorObj.email;
        const authorUsername = authorObj.username;

        return (
          authorId === user._id ||
          (authorEmail && authorEmail === user.email) ||
          (authorUsername && (authorUsername === user.username || authorUsername === user.email?.split('@')[0])) ||
          authorId === "user_me"
        );
      })
    : [];

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
          {/* Subtle Glow Overlay */}
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
          {/* Avatar floating neatly over banner bottom */}
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

          {/* Action Buttons */}
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
          <p className="text-gray-400 text-sm font-medium">@{user.username || user.email?.split('@')[0]}</p>
        </div>

        {/* Bio */}
        {user.bio ? (
          <p className="text-gray-200 text-sm leading-relaxed max-w-2xl font-normal">
            {user.bio}
          </p>
        ) : (
          <p className="text-gray-500 text-sm italic">No bio added yet.</p>
        )}

        {/* Metadata Details Row */}
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

        {/* Followers & Following Stats */}
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

        {/* Quick Notifications Switch Box */}
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

        {/* Tab Contents */}
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

        <TabsContent value="replies" className="mt-0 focus-visible:outline-none">
          <Card className="bg-black border-none shadow-none">
            <CardContent className="py-16 text-center">
              <div className="max-w-md mx-auto space-y-3">
                <div className="h-16 w-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto text-gray-500 border border-gray-800">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  No replies yet
                </h3>
                <p className="text-gray-400 text-sm">
                  Replies to other users and posts will appear in this tab.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="highlights" className="mt-0 focus-visible:outline-none">
          <Card className="bg-black border-none shadow-none">
            <CardContent className="py-16 text-center">
              <div className="max-w-md mx-auto space-y-3">
                <div className="h-16 w-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto text-gray-500 border border-gray-800">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Highlight your best posts
                </h3>
                <p className="text-gray-400 text-sm">
                  You must be subscribed to Premium to pin highlights to your profile.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="articles" className="mt-0 focus-visible:outline-none">
          <Card className="bg-black border-none shadow-none">
            <CardContent className="py-16 text-center">
              <div className="max-w-md mx-auto space-y-3">
                <div className="h-16 w-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto text-gray-500 border border-gray-800">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Write long-form articles
                </h3>
                <p className="text-gray-400 text-sm">
                  Publish rich articles and newsletters directly on Twiller.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="mt-0 focus-visible:outline-none">
          <Card className="bg-black border-none shadow-none">
            <CardContent className="py-16 text-center">
              <div className="max-w-md mx-auto space-y-3">
                <div className="h-16 w-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto text-gray-500 border border-gray-800">
                  <ImageIcon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Lights, camera … attachments!
                </h3>
                <p className="text-gray-400 text-sm">
                  When you post photos, videos, or audio clips, they will show up here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-0 focus-visible:outline-none">
          <div className="p-4 sm:p-6">
            <LoginHistory />
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Modal */}
      <Editprofile
        isopen={showEditModal}
        onclose={() => setShowEditModal(false)}
      />
    </div>
  );
}
