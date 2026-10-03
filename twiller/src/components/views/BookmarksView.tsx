"use client";
import React, { useState } from "react";
import { Bookmark, Trash2, Heart, Repeat2, Share, MessageCircle } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";

const INITIAL_BOOKMARKS = [
  {
    id: "bm-1",
    author: {
      displayName: "Alex Chen",
      username: "designguru",
      avatar: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400",
      verified: true,
    },
    content: "The new design system is finally complete! It took 6 months but the results are incredible. Clean, consistent, and accessible.",
    timestamp: "6h",
    likes: 456,
    retweets: 78,
    comments: 34,
    image: "https://images.pexels.com/photos/196645/pexels-photo-196645.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: "bm-2",
    author: {
      displayName: "Elon Musk",
      username: "elonmusk",
      avatar: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400",
      verified: true,
    },
    content: "Just had an amazing conversation about the future of AI. The possibilities are endless!",
    timestamp: "2h",
    likes: 1247,
    retweets: 324,
    comments: 89,
  },
];

export default function BookmarksView() {
  const [bookmarks, setBookmarks] = useState(INITIAL_BOOKMARKS);

  const removeBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-gray-800 z-10 p-4">
        <h1 className="text-xl font-bold">Bookmarks</h1>
        <p className="text-xs text-gray-400">@your_account</p>
      </div>

      {bookmarks.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <Bookmark className="h-12 w-12 mx-auto mb-3 text-gray-600" />
          <h2 className="text-xl font-bold text-white mb-1">Save posts for later</h2>
          <p className="text-sm">Don't let the good ones fly away! Bookmark posts to easily find them again in the future.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-800">
          {bookmarks.map((tweet) => (
            <Card key={tweet.id} className="bg-black border-gray-800 border-x-0 border-t-0 rounded-none hover:bg-gray-950/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={tweet.author.avatar} alt={tweet.author.displayName} />
                    <AvatarFallback>{tweet.author.displayName[0]}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">{tweet.author.displayName}</span>
                        <span className="text-gray-500 text-xs">@{tweet.author.username} · {tweet.timestamp}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBookmark(tweet.id)}
                        className="p-1 rounded-full text-gray-500 hover:text-red-400 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-white text-sm mb-3 leading-relaxed">{tweet.content}</div>

                    {tweet.image && (
                      <div className="mb-3 rounded-2xl overflow-hidden">
                        <img src={tweet.image} alt="Post image" className="w-full h-auto max-h-80 object-cover" />
                      </div>
                    )}

                    <div className="flex items-center justify-between max-w-md text-gray-500 text-xs">
                      <span className="flex items-center space-x-1 hover:text-blue-400 cursor-pointer"><MessageCircle className="h-4 w-4" /> <span>{tweet.comments}</span></span>
                      <span className="flex items-center space-x-1 hover:text-green-400 cursor-pointer"><Repeat2 className="h-4 w-4" /> <span>{tweet.retweets}</span></span>
                      <span className="flex items-center space-x-1 hover:text-red-400 cursor-pointer"><Heart className="h-4 w-4" /> <span>{tweet.likes}</span></span>
                      <span className="flex items-center space-x-1 hover:text-blue-400 cursor-pointer"><Share className="h-4 w-4" /></span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
