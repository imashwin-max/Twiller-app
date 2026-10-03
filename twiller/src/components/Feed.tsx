"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import LoadingSpinner from "./loading-spinner";
import TweetCard from "./TweetCard";
import TweetComposer from "./TweetComposer";
import axiosInstance from "@/lib/axiosInstance";
import { Sparkles, Users } from "lucide-react";

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

const Feed = () => {
  const [activeTab, setActiveTab] = useState<"foryou" | "following">("foryou");
  const [tweets, setTweets] = useState<any[]>(initialTweets);
  const [loading, setLoading] = useState(false);

  const fetchTweets = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/post");
      if (Array.isArray(res.data) && res.data.length > 0) {
        setTweets(res.data);
      }
    } catch (error) {
      console.log("Backend fetch failed, showing local feed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTweets();
  }, []);

  const handleNewTweet = (newTweet: any) => {
    setTweets((prev: any) => [newTweet, ...prev]);
  };

  // Filter tweets for "Following" vs "For you"
  const displayedTweets =
    activeTab === "following"
      ? tweets.filter((t: any) => t.author?.verified || t.liked)
      : tweets;

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Sticky Top Bar & Dual Button Header */}
      <div className="sticky top-0 bg-black/85 backdrop-blur-md border-b border-gray-800/80 z-20">
        <div className="px-4 pt-3 pb-1">
          <h1 className="text-xl font-bold text-white tracking-tight">Home</h1>
        </div>

        {/* Dual Tab Buttons: For You & Following */}
        <div className="flex w-full border-b border-gray-800/80">
          <button
            onClick={() => setActiveTab("foryou")}
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
            onClick={() => setActiveTab("following")}
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
        {loading && tweets.length === 0 ? (
          <Card className="bg-black border-none shadow-none">
            <CardContent className="py-16 text-center">
              <div className="text-gray-400 space-y-3">
                <LoadingSpinner size="lg" className="mx-auto" />
                <p className="text-sm font-medium">Loading posts...</p>
              </div>
            </CardContent>
          </Card>
        ) : displayedTweets.length > 0 ? (
          displayedTweets.map((tweet: any, index: number) => (
            <TweetCard key={tweet._id || tweet.id || index} tweet={tweet} />
          ))
        ) : (
          <Card className="bg-black border-none shadow-none">
            <CardContent className="py-16 text-center">
              <div className="max-w-md mx-auto space-y-3">
                <div className="h-16 w-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto text-gray-500 border border-gray-800">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Welcome to your Following feed!
                </h3>
                <p className="text-gray-400 text-sm">
                  When you follow creators and users, their latest posts will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Feed;
