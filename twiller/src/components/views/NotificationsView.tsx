"use client";
import React, { useState } from "react";
import { Bell, Heart, Repeat2, ShieldAlert, Sparkles, UserCheck } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const NOTIFICATIONS = [
  {
    id: "notif-1",
    type: "keyword",
    icon: Bell,
    iconColor: "text-blue-400",
    title: "🔔 Trending Keyword Alert: Cricket & Science",
    description: "New post mentioning your keyword alert configuration!",
    timestamp: "10m ago",
    read: false,
  },
  {
    id: "notif-2",
    type: "like",
    icon: Heart,
    iconColor: "text-red-500",
    actor: {
      displayName: "Elon Musk",
      avatar: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
    title: "Elon Musk liked your post",
    description: '"Just had an amazing conversation about the future of AI..."',
    timestamp: "1h ago",
    read: true,
  },
  {
    id: "notif-3",
    type: "retweet",
    icon: Repeat2,
    iconColor: "text-green-500",
    actor: {
      displayName: "Sarah Johnson",
      avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
    title: "Sarah Johnson retweeted your post",
    description: '"Working on some exciting new features for our app. 🚀"',
    timestamp: "3h ago",
    read: true,
  },
  {
    id: "notif-4",
    type: "security",
    icon: ShieldAlert,
    iconColor: "text-yellow-500",
    title: "🔐 Login Verification Alert",
    description: "A new session was authenticated from Chrome Browser.",
    timestamp: "Yesterday",
    read: true,
  },
];

export default function NotificationsView() {
  const [tab, setTab] = useState("all");

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-gray-800 z-10 p-4 pb-0">
        <h1 className="text-xl font-bold mb-3">Notifications</h1>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-transparent border-b border-gray-800 rounded-none h-auto">
            <TabsTrigger value="all" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 py-3 font-semibold text-sm">
              All
            </TabsTrigger>
            <TabsTrigger value="verified" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 py-3 font-semibold text-sm">
              Verified
            </TabsTrigger>
            <TabsTrigger value="mentions" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 py-3 font-semibold text-sm">
              Mentions
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-gray-800">
        {NOTIFICATIONS.map((n) => {
          const IconComp = n.icon;
          return (
            <div key={n.id} className={`p-4 flex space-x-4 hover:bg-gray-900/50 transition-colors cursor-pointer ${!n.read ? 'bg-blue-950/10' : ''}`}>
              <div className="flex-shrink-0 pt-1">
                <IconComp className={`h-6 w-6 ${n.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                {n.actor && (
                  <Avatar className="h-8 w-8 mb-2">
                    <AvatarImage src={n.actor.avatar} alt={n.actor.displayName} />
                    <AvatarFallback>{n.actor.displayName[0]}</AvatarFallback>
                  </Avatar>
                )}
                <p className="font-semibold text-white text-sm">{n.title}</p>
                <p className="text-gray-400 text-xs mt-0.5">{n.description}</p>
                <p className="text-gray-500 text-xs mt-1">{n.timestamp}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
