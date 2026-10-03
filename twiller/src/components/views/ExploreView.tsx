"use client";
import React, { useState } from "react";
import { Search, TrendingUp, Sparkles, Hash, MessageSquare, Heart } from "lucide-react";
import { Input } from "../ui/input";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const TRENDS = [
  { category: "Technology · Trending", hashtag: "#AI2026", posts: "142.5K posts" },
  { category: "Web Development · Trending", hashtag: "#NextJS15", posts: "89.2K posts" },
  { category: "Sports · Trending", hashtag: "#CricketWorldCup", posts: "320.1K posts" },
  { category: "Entertainment · Trending", hashtag: "#MovieTrailer", posts: "45.8K posts" },
  { category: "Coding · Trending", hashtag: "#React19", posts: "67.4K posts" },
  { category: "Business · Trending", hashtag: "#StartupLife", posts: "29.3K posts" },
];

const EXPLORE_POSTS = [
  {
    id: "ex-1",
    author: {
      displayName: "Tech Insider",
      username: "techinsider",
      avatar: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400",
      verified: true,
    },
    content: "Artificial Intelligence is evolving faster than ever in 2026. What's your favorite AI feature this year? 🚀 #AI2026 #TechTrends",
    timestamp: "1h",
    likes: 3420,
    retweets: 890,
  },
  {
    id: "ex-2",
    author: {
      displayName: "Dev Community",
      username: "devcommunity",
      avatar: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400",
      verified: true,
    },
    content: "Next.js 15 brings unbelievable server component performance and instant compilation speeds! Are you using App Router?",
    timestamp: "3h",
    likes: 1890,
    retweets: 412,
  },
];

export default function ExploreView() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("foryou");

  const filteredTrends = TRENDS.filter(t => 
    t.hashtag.toLowerCase().includes(query.toLowerCase()) || 
    t.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen text-white">
      {/* Search Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-gray-800 z-10 p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search X / Twiller"
            className="pl-12 bg-gray-900 border-gray-800 text-white placeholder-gray-400 rounded-full py-3"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-transparent border-b border-gray-800 rounded-none h-auto">
            <TabsTrigger value="foryou" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 py-3 text-sm font-semibold">
              For You
            </TabsTrigger>
            <TabsTrigger value="trending" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 py-3 text-sm font-semibold">
              Trending
            </TabsTrigger>
            <TabsTrigger value="news" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 py-3 text-sm font-semibold">
              News
            </TabsTrigger>
            <TabsTrigger value="sports" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 py-3 text-sm font-semibold">
              Sports
            </TabsTrigger>
            <TabsTrigger value="entertainment" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 py-3 text-sm font-semibold">
              Entertainment
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Featured Banner */}
      <div className="p-4 bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-b border-gray-800">
        <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold uppercase mb-1">
          <Sparkles className="h-4 w-4" />
          <span>Happening Live</span>
        </div>
        <h2 className="text-xl font-bold">Global Tech Summit 2026 Keynote</h2>
        <p className="text-gray-400 text-sm mt-1">Live updates on AI breakthroughs and Next-gen web frameworks.</p>
      </div>

      {/* Trends List */}
      <div className="divide-y divide-gray-800">
        <div className="p-4">
          <h3 className="text-lg font-bold flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <span>Trends for you</span>
          </h3>
        </div>

        {filteredTrends.map((trend, i) => (
          <div key={i} className="p-4 hover:bg-gray-900/50 transition-colors cursor-pointer flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500">{trend.category}</p>
              <p className="font-bold text-white text-base mt-0.5">{trend.hashtag}</p>
              <p className="text-xs text-gray-400 mt-1">{trend.posts}</p>
            </div>
            <Hash className="h-5 w-5 text-gray-600" />
          </div>
        ))}

        {/* Popular Posts */}
        <div className="p-4 bg-black">
          <h3 className="text-lg font-bold mb-4">Popular Conversations</h3>
          <div className="space-y-4">
            {EXPLORE_POSTS.map((post) => (
              <Card key={post.id} className="bg-gray-900 border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.author.avatar} />
                      <AvatarFallback>{post.author.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-1">
                        <span className="font-bold text-sm text-white">{post.author.displayName}</span>
                        <span className="text-xs text-gray-500">@{post.author.username} · {post.timestamp}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-white text-sm mb-3">{post.content}</p>
                  <div className="flex items-center space-x-6 text-gray-400 text-xs">
                    <span className="flex items-center space-x-1"><Heart className="h-4 w-4 text-red-500" /> <span>{post.likes}</span></span>
                    <span className="flex items-center space-x-1"><MessageSquare className="h-4 w-4 text-blue-400" /> <span>{post.retweets}</span></span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
