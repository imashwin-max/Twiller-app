"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import LoadingSpinner from "./loading-spinner";
import TweetCard from "./TweetCard";
import TweetComposer from "./TweetComposer";
import axiosInstance from "@/lib/axiosInstance";
import { Sparkles, Users, RefreshCw, UserPlus, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";

interface Tweet {
  id: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    verified?: boolean;
  };
  content: string;
  timestamp: string;
  likes: number;
  retweets: number;
  comments: number;
  liked?: boolean;
  retweeted?: boolean;
  image?: string;
}

const initialTweets: Tweet[] = [
  {
    id: "1",
    author: {
      id: "2",
      username: "elonmusk",
      displayName: "Elon Musk",
      avatar:
        "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400",
      verified: true,
    },
    content:
      "Just had an amazing conversation about the future of AI. The possibilities are endless!",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    likes: 1247,
    retweets: 324,
    comments: 89,
    liked: false,
    retweeted: false,
  },
  {
    id: "2",
    author: {
      id: "3",
      username: "sarahtech",
      displayName: "Sarah Johnson",
      avatar:
        "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400",
      verified: false,
    },
    content:
      "Working on some exciting new features for our app. Can't wait to share what we've been building! 🚀",
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    likes: 89,
    retweets: 23,
    comments: 12,
    liked: true,
    retweeted: false,
  },
  {
    id: "3",
    author: {
      id: "4",
      username: "designguru",
      displayName: "Alex Chen",
      avatar:
        "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400",
      verified: true,
    },
    content:
      "The new design system is finally complete! It took 6 months but the results are incredible. Clean, consistent, and accessible.",
    timestamp: new Date(Date.now() - 21600000).toISOString(),
    likes: 456,
    retweets: 78,
    comments: 34,
    liked: false,
    retweeted: true,
    image:
      "https://images.pexels.com/photos/196645/pexels-photo-196645.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];

const suggestedUsers = [
  {
    displayName: "Elon Musk",
    username: "elonmusk",
    avatar: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400",
    verified: true,
  },
  {
    displayName: "Sarah Johnson",
    username: "sarahtech",
    avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400",
    verified: false,
  },
  {
    displayName: "Alex Chen",
    username: "designguru",
    avatar: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400",
    verified: true,
  },
];

const Feed = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"foryou" | "following">("foryou");
  const [allTweets, setAllTweets] = useState<any[]>(initialTweets);
  const [followingTweets, setFollowingTweets] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load following list from localStorage
  const refreshFollowingList = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("twiller_following") || "[]");
      setFollowingList(saved);
      return saved;
    } catch {
      return [];
    }
  };

  useEffect(() => {
    refreshFollowingList();
  }, []);

  // Function 1: Dedicated Handler for "For You" Button
  const handleForYouClick = async () => {
    setActiveTab("foryou");
    try {
      setLoading(true);
      const res = await axiosInstance.get("/post");
      if (Array.isArray(res.data) && res.data.length > 0) {
        setAllTweets(res.data);
      }
    } catch (error) {
      console.log("For You feed fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function 2: Dedicated Handler for "Following" Button
  const handleFollowingClick = async () => {
    setActiveTab("following");
    const followedUsernames = refreshFollowingList();
    try {
      setLoading(true);
      const res = await axiosInstance.get("/post");
      const posts = Array.isArray(res.data) && res.data.length > 0 ? res.data : initialTweets;
      
      const filtered = posts.filter((tweet: any) => {
        const authorObj = typeof tweet.author === "object" ? tweet.author : {};
        const authorUsername = authorObj.username || "";
        const authorId = authorObj._id || authorObj.id;
        const authorEmail = authorObj.email;

        const isFollowed = followedUsernames.includes(authorUsername);
        const isSelf = user && (user._id === authorId || user.email === authorEmail);
        return isFollowed || isSelf;
      });

      setFollowingTweets(filtered);
    } catch (error) {
      console.log("Following feed fetch error:", error);
      setFollowingTweets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleForYouClick();
  }, []);

  const handleNewTweet = (newTweet: any) => {
    setAllTweets((prev: any) => [newTweet, ...prev]);
    if (activeTab === "following") {
      setFollowingTweets((prev: any) => [newTweet, ...prev]);
    }
  };

  const followSuggestedUser = (username: string) => {
    try {
      const saved = JSON.parse(localStorage.getItem("twiller_following") || "[]");
      if (!saved.includes(username)) {
        const updated = [...saved, username];
        localStorage.setItem("twiller_following", JSON.stringify(updated));
        setFollowingList(updated);
        handleFollowingClick();
      }
    } catch (err) {}
  };

  const displayedTweets = activeTab === "foryou" ? allTweets : followingTweets;

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Sticky Top Header & Dual Buttons */}
      <div className="sticky top-0 bg-black/85 backdrop-blur-md border-b border-gray-800/80 z-20">
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white tracking-tight">Home</h1>
          <button
            onClick={activeTab === "foryou" ? handleForYouClick : handleFollowingClick}
            className="p-1.5 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            title="Refresh feed"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
          </button>
        </div>

        {/* Dual Tab Buttons */}
        <div className="flex w-full border-b border-gray-800/80">
          <button
            type="button"
            onClick={handleForYouClick}
            className={`flex-1 py-3.5 text-center font-bold text-sm transition-all relative flex items-center justify-center space-x-2 ${
              activeTab === "foryou"
                ? "text-white"
                : "text-gray-500 hover:text-gray-300 hover:bg-gray-900/40"
            }`}
          >
            <span>For you</span>
            {activeTab === "foryou" && (
              <span className="absolute bottom-0 h-1 w-16 bg-blue-500 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={handleFollowingClick}
            className={`flex-1 py-3.5 text-center font-bold text-sm transition-all relative flex items-center justify-center space-x-2 ${
              activeTab === "following"
                ? "text-white"
                : "text-gray-500 hover:text-gray-300 hover:bg-gray-900/40"
            }`}
          >
            <span>Following</span>
            {activeTab === "following" && (
              <span className="absolute bottom-0 h-1 w-16 bg-blue-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Tweet Composer */}
      <TweetComposer onTweetPosted={handleNewTweet} />

      {/* Tweet List Container */}
      <div className="divide-y divide-gray-800/60">
        {loading && displayedTweets.length === 0 ? (
          <Card className="bg-black border-none shadow-none">
            <CardContent className="py-16 text-center">
              <div className="text-gray-400 space-y-3">
                <LoadingSpinner size="lg" className="mx-auto" />
                <p className="text-sm font-medium">
                  {activeTab === "foryou" ? "Loading recommended posts..." : "Loading following feed..."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : displayedTweets.length > 0 ? (
          displayedTweets.map((tweet: any, index: number) => (
            <TweetCard key={tweet._id || tweet.id || index} tweet={tweet} />
          ))
        ) : (
          <Card className="bg-black border-none shadow-none">
            <CardContent className="py-12 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="h-14 w-14 bg-gray-900 rounded-full flex items-center justify-center mx-auto text-blue-400 border border-gray-800">
                  <Users className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Welcome to your Following feed!
                </h3>
                <p className="text-gray-400 text-sm">
                  Follow creators below to see their posts on your timeline:
                </p>

                {/* Who to follow suggestion card */}
                <div className="space-y-3 pt-2 text-left">
                  {suggestedUsers.map((su) => (
                    <div key={su.username} className="flex items-center justify-between p-3 bg-gray-900/80 rounded-2xl border border-gray-800">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={su.avatar} />
                          <AvatarFallback>{su.displayName[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-1">
                            <span className="font-bold text-white text-sm">{su.displayName}</span>
                            {su.verified && <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />}
                          </div>
                          <p className="text-gray-400 text-xs">@{su.username}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => followSuggestedUser(su.username)}
                        className="bg-white text-black hover:bg-gray-200 font-bold rounded-full px-4 text-xs"
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1" />
                        Follow
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Feed;
