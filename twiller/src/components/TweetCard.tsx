"use client";

import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  MoreHorizontal,
  Bookmark,
  Send,
  X,
  UserPlus,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axiosInstance";

export default function TweetCard({ tweet }: any) {
  const { user } = useAuth();
  const [tweetstate, settweetstate] = useState(tweet);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(tweet?.likes || 0);
  const [isRetweeted, setIsRetweeted] = useState(false);
  const [retweetsCount, setRetweetsCount] = useState(tweet?.retweets || 0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replies, setReplies] = useState<any[]>(tweet?.replies || []);
  const [commentsCount, setCommentsCount] = useState(tweet?.comments || 0);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const authorObj = typeof tweetstate.author === "object" ? tweetstate.author : null;
  const authorId = authorObj?._id || authorObj?.id || tweetstate.author;
  const authorName = authorObj?.displayName || "Anonymous";
  const authorUsername = authorObj?.username || "user";
  const authorAvatar = authorObj?.avatar || "https://images.pexels.com/photos/1139743/pexels-photo-1139743.jpeg?auto=compress&cs=tinysrgb&w=400";
  const isSelf = user && (user._id === authorId || user.email === authorObj?.email);

  useEffect(() => {
    settweetstate(tweet);
    setLikesCount(tweet?.likes || 0);
    setRetweetsCount(tweet?.retweets || 0);
    setCommentsCount(tweet?.comments || 0);
    setReplies(tweet?.replies || []);

    const userId = user?._id || user?.email || "guest";
    const liked = tweet?.likedBy?.includes(userId) || tweet?.liked;
    const retweeted = tweet?.retweetedBy?.includes(userId) || tweet?.retweeted;
    setIsLiked(!!liked);
    setIsRetweeted(!!retweeted);

    // Check bookmarks in localStorage
    try {
      const savedBookmarks = JSON.parse(localStorage.getItem("twiller_bookmarks") || "[]");
      const bookmarked = savedBookmarks.some((b: any) => (b._id || b.id) === (tweet._id || tweet.id));
      setIsBookmarked(bookmarked);
    } catch {}

    // Check following state in localStorage
    try {
      const savedFollowing = JSON.parse(localStorage.getItem("twiller_following") || "[]");
      setIsFollowingAuthor(savedFollowing.includes(authorUsername));
    } catch {}
  }, [tweet, user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2500);
  };

  // 1. LIKE / UNLIKE HANDLER
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount((prev: number) => (newLikedState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const tweetId = tweetstate._id || tweetstate.id;
      const res = await axiosInstance.post(`/like/${tweetId}`, {
        userId: user?._id || user?.email || "guest",
      });
      if (res.data) {
        settweetstate(res.data);
      }
    } catch (err) {
      console.log("Like request failed, keeping local state:", err);
    }
  };

  // 2. RETWEET / REPOST HANDLER
  const handleRetweet = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newRetweetState = !isRetweeted;
    setIsRetweeted(newRetweetState);
    setRetweetsCount((prev: number) => (newRetweetState ? prev + 1 : Math.max(0, prev - 1)));
    showToast(newRetweetState ? "Reposted to your profile!" : "Repost undone.");

    try {
      const tweetId = tweetstate._id || tweetstate.id;
      const res = await axiosInstance.post(`/retweet/${tweetId}`, {
        userId: user?._id || user?.email || "guest",
      });
      if (res.data) {
        settweetstate(res.data);
      }
    } catch (err) {
      console.log("Retweet request failed, keeping local state:", err);
    }
  };

  // 3. BOOKMARK HANDLER
  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const savedBookmarks = JSON.parse(localStorage.getItem("twiller_bookmarks") || "[]");
      const tweetId = tweetstate._id || tweetstate.id;
      const exists = savedBookmarks.some((b: any) => (b._id || b.id) === tweetId);

      let updated;
      if (exists) {
        updated = savedBookmarks.filter((b: any) => (b._id || b.id) !== tweetId);
        setIsBookmarked(false);
        showToast("Removed from Bookmarks");
      } else {
        updated = [tweetstate, ...savedBookmarks];
        setIsBookmarked(true);
        showToast("Added to your Bookmarks!");
      }
      localStorage.setItem("twiller_bookmarks", JSON.stringify(updated));
    } catch (err) {
      console.error("Bookmark error:", err);
    }
  };

  // 4. SHARE HANDLER
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const tweetUrl = window.location.origin;
    if (navigator.share) {
      navigator
        .share({
          title: `Post by ${authorName}`,
          text: tweetstate.content,
          url: tweetUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(`${tweetstate.content} - via Twiller`);
      showToast("Link copied to clipboard!");
    }
  };

  // 5. FOLLOW / UNFOLLOW HANDLER
  const handleFollowToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const savedFollowing = JSON.parse(localStorage.getItem("twiller_following") || "[]");
      let updated;
      if (isFollowingAuthor) {
        updated = savedFollowing.filter((u: string) => u !== authorUsername);
        setIsFollowingAuthor(false);
        showToast(`Unfollowed @${authorUsername}`);
      } else {
        updated = [...savedFollowing, authorUsername];
        setIsFollowingAuthor(true);
        showToast(`Now following @${authorUsername}!`);
      }
      localStorage.setItem("twiller_following", JSON.stringify(updated));
    } catch (err) {
      console.error("Follow toggle error:", err);
    }
  };

  // 6. COMMENT / REPLY SUBMIT HANDLER
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newReply = {
      _id: "reply_" + Date.now(),
      author: {
        displayName: user?.displayName || "You",
        username: user?.username || "you",
        avatar: user?.avatar || "https://images.pexels.com/photos/1139743/pexels-photo-1139743.jpeg?auto=compress&cs=tinysrgb&w=400",
      },
      content: commentText.trim(),
      timestamp: new Date().toISOString(),
    };

    setReplies((prev: any[]) => [...prev, newReply]);
    setCommentsCount((prev: number) => prev + 1);
    setCommentText("");
    showToast("Reply posted!");

    try {
      const tweetId = tweetstate._id || tweetstate.id;
      await axiosInstance.post(`/comment/${tweetId}`, {
        author: newReply.author,
        content: newReply.content,
      });
    } catch (err) {
      console.log("Comment endpoint call failed, kept local comment:", err);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <>
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-2xl text-xs font-semibold z-50 animate-bounce">
          {toastMessage}
        </div>
      )}

      <Card className="bg-black border-gray-800 border-x-0 border-t-0 rounded-none hover:bg-gray-950/40 transition-colors">
        <CardContent className="p-4">
          <div className="flex space-x-3">
            <Avatar className="h-11 w-11 ring-1 ring-gray-800">
              <AvatarImage src={authorAvatar} alt={authorName} />
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">
                {authorName[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              {/* Header Info Row */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="font-bold text-white text-sm hover:underline truncate">
                    {authorName}
                  </span>
                  {authorObj?.verified && (
                    <CheckCircle2 className="h-4 w-4 text-blue-400 fill-blue-500/20 flex-shrink-0" />
                  )}
                  <span className="text-gray-500 text-xs truncate">@{authorUsername}</span>
                  <span className="text-gray-600 text-xs">·</span>
                  <span className="text-gray-500 text-xs flex-shrink-0">
                    {tweetstate.timestamp && !isNaN(new Date(tweetstate.timestamp).getTime())
                      ? new Date(tweetstate.timestamp).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : "Just now"}
                  </span>
                </div>

                {/* Follow Button for Other Users */}
                {!isSelf && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFollowToggle}
                    className={`ml-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      isFollowingAuthor
                        ? "bg-gray-800 text-gray-300 hover:bg-red-950 hover:text-red-400 border border-gray-700"
                        : "bg-white text-black hover:bg-gray-200"
                    }`}
                  >
                    {isFollowingAuthor ? (
                      <span className="flex items-center space-x-1">
                        <UserCheck className="h-3 w-3" />
                        <span>Following</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1">
                        <UserPlus className="h-3 w-3" />
                        <span>Follow</span>
                      </span>
                    )}
                  </Button>
                )}
              </div>

              {/* Tweet Content Text */}
              <div className="text-gray-100 text-sm mb-3 leading-relaxed break-words">
                {tweetstate.content}
              </div>

              {/* Optional Image */}
              {tweetstate.image && (
                <div className="mb-3 rounded-2xl overflow-hidden border border-gray-800">
                  <img
                    src={tweetstate.image}
                    alt="Post media"
                    className="w-full h-auto max-h-96 object-cover hover:scale-[1.01] transition-transform"
                  />
                </div>
              )}

              {/* Optional Audio Clip */}
              {tweetstate.tweetType === "audio" && tweetstate.audioUrl && (
                <div
                  className="mb-3 p-3 bg-gray-900/90 rounded-2xl border border-gray-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <audio controls src={tweetstate.audioUrl} className="w-full" />
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between max-w-md pt-1 text-gray-500">
                {/* 1. Comment Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCommentModal(true);
                  }}
                  className="flex items-center space-x-1.5 p-2 rounded-full hover:bg-blue-950/40 hover:text-blue-400 group transition-colors"
                >
                  <MessageCircle className="h-4 w-4 group-hover:text-blue-400" />
                  <span className="text-xs font-semibold">{formatNumber(commentsCount)}</span>
                </Button>

                {/* 2. Repost / Retweet Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRetweet}
                  className={`flex items-center space-x-1.5 p-2 rounded-full hover:bg-green-950/40 group transition-colors ${
                    isRetweeted ? "text-green-400 font-bold" : "hover:text-green-400"
                  }`}
                >
                  <Repeat2
                    className={`h-4 w-4 ${isRetweeted ? "text-green-400" : "group-hover:text-green-400"}`}
                  />
                  <span className="text-xs font-semibold">{formatNumber(retweetsCount)}</span>
                </Button>

                {/* 3. Like Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={`flex items-center space-x-1.5 p-2 rounded-full hover:bg-red-950/40 group transition-colors ${
                    isLiked ? "text-red-500 font-bold" : "hover:text-red-400"
                  }`}
                >
                  <Heart
                    className={`h-4 w-4 transition-transform ${
                      isLiked ? "text-red-500 fill-red-500 scale-110" : "group-hover:text-red-400"
                    }`}
                  />
                  <span className="text-xs font-semibold">{formatNumber(likesCount)}</span>
                </Button>

                {/* 4. Bookmark Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBookmark}
                  className={`flex items-center p-2 rounded-full hover:bg-blue-950/40 group transition-colors ${
                    isBookmarked ? "text-blue-400" : "hover:text-blue-400"
                  }`}
                >
                  <Bookmark
                    className={`h-4 w-4 ${isBookmarked ? "text-blue-400 fill-blue-400" : "group-hover:text-blue-400"}`}
                  />
                </Button>

                {/* 5. Share Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="flex items-center p-2 rounded-full hover:bg-blue-950/40 hover:text-blue-400 group transition-colors"
                >
                  <Share className="h-4 w-4 group-hover:text-blue-400" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reply / Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h3 className="font-bold text-white text-base">Reply to post</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCommentModal(false)}
                className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
              {/* Original Post Preview */}
              <div className="flex space-x-3 pb-3 border-b border-gray-800/60">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={authorAvatar} />
                  <AvatarFallback>{authorName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-white text-sm">{authorName}</span>
                    <span className="text-gray-500 text-xs">@{authorUsername}</span>
                  </div>
                  <p className="text-gray-300 text-sm mt-1">{tweetstate.content}</p>
                </div>
              </div>

              {/* Existing Replies List */}
              {replies.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Replies</h4>
                  {replies.map((reply: any, idx: number) => (
                    <div key={reply._id || idx} className="flex space-x-3 p-2.5 bg-gray-900/60 rounded-xl border border-gray-800/60">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={reply.author?.avatar} />
                        <AvatarFallback>{reply.author?.displayName?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white text-xs">{reply.author?.displayName || "User"}</span>
                          <span className="text-gray-500 text-[10px]">@{reply.author?.username || "user"}</span>
                        </div>
                        <p className="text-gray-200 text-xs mt-1">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Form Input */}
              <form onSubmit={handleAddComment} className="pt-2">
                <div className="flex space-x-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-blue-600 text-white font-bold">{user?.displayName?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Post your reply..."
                      rows={3}
                      className="w-full bg-gray-900/80 border border-gray-800 text-white text-sm p-3 rounded-xl focus:outline-none focus:border-blue-500 resize-none placeholder-gray-500"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={!commentText.trim()}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full px-5 py-2 text-sm flex items-center space-x-1.5"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Reply</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
