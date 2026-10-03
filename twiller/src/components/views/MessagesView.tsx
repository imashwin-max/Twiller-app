"use client";
import React, { useState } from "react";
import { Search, Send, Plus, MoreVertical, Image as ImageIcon } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAuth } from "@/context/AuthContext";

const CONVERSATIONS = [
  {
    id: "c-1",
    user: {
      displayName: "Elon Musk",
      username: "elonmusk",
      avatar: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400",
      verified: true,
    },
    lastMessage: "Looking forward to testing the new audio tweet features!",
    timestamp: "12m",
    messages: [
      { sender: "them", text: "Hey! Loved the Twiller update!", time: "10:30 AM" },
      { sender: "me", text: "Thanks Elon! We just improved backend response speeds.", time: "10:32 AM" },
      { sender: "them", text: "Looking forward to testing the new audio tweet features!", time: "10:35 AM" },
    ],
  },
  {
    id: "c-2",
    user: {
      displayName: "Sarah Johnson",
      username: "sarahtech",
      avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400",
      verified: false,
    },
    lastMessage: "Did you review the PR for language translations?",
    timestamp: "2h",
    messages: [
      { sender: "them", text: "Did you review the PR for language translations?", time: "8:15 AM" },
    ],
  },
  {
    id: "c-3",
    user: {
      displayName: "Alex Chen",
      username: "designguru",
      avatar: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400",
      verified: true,
    },
    lastMessage: "The new dark mode contrast looks incredible!",
    timestamp: "1d",
    messages: [
      { sender: "them", text: "The new dark mode contrast looks incredible!", time: "Yesterday" },
    ],
  },
];

export default function MessagesView() {
  const { user } = useAuth();
  const [activeConvId, setActiveConvId] = useState("c-1");
  const [inputMessage, setInputMessage] = useState("");
  const [conversations, setConversations] = useState(CONVERSATIONS);

  const activeConv = conversations.find(c => c.id === activeConvId) || conversations[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg = {
      sender: "me",
      text: inputMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setConversations(prev => prev.map(c => {
      if (c.id === activeConvId) {
        return {
          ...c,
          lastMessage: inputMessage,
          messages: [...c.messages, newMsg],
        };
      }
      return c;
    }));

    setInputMessage("");
  };

  return (
    <div className="h-screen flex text-white overflow-hidden">
      {/* Left panel — Chats list */}
      <div className="w-80 border-r border-gray-800 flex flex-col h-full bg-black">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h1 className="text-xl font-bold">Messages</h1>
          <Button variant="ghost" size="sm" className="p-2 rounded-full hover:bg-gray-900">
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search Direct Messages"
              className="pl-9 bg-gray-900 border-gray-800 text-sm text-white placeholder-gray-400 rounded-full py-2"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-800">
          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveConvId(c.id)}
              className={`p-3 flex space-x-3 hover:bg-gray-900/60 cursor-pointer transition-colors ${c.id === activeConvId ? 'bg-gray-900/80 border-r-2 border-blue-500' : ''}`}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={c.user.avatar} />
                <AvatarFallback>{c.user.displayName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-sm text-white truncate">{c.user.displayName}</span>
                  <span className="text-xs text-gray-500 ml-1">{c.timestamp}</span>
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">{c.lastMessage}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — Chat details */}
      <div className="flex-1 flex flex-col h-full bg-black">
        {/* Chat header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-black/90 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={activeConv.user.avatar} />
              <AvatarFallback>{activeConv.user.displayName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-bold text-base text-white">{activeConv.user.displayName}</h2>
              <p className="text-xs text-gray-400">@{activeConv.user.username}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="p-2 rounded-full hover:bg-gray-900">
            <MoreVertical className="h-5 w-5 text-gray-400" />
          </Button>
        </div>

        {/* Message history */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {activeConv.messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'me' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                  m.sender === 'me'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-800 text-gray-100 rounded-bl-none'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[10px] text-gray-500 mt-1 px-1">{m.time}</span>
            </div>
          ))}
        </div>

        {/* Message Input box */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-800 flex items-center space-x-2 bg-black">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Start a new message"
            className="flex-1 bg-gray-900 border-gray-800 text-white text-sm rounded-full px-4 py-2 focus-visible:ring-1 focus-visible:ring-blue-500"
          />
          <Button type="submit" size="icon" className="bg-blue-500 hover:bg-blue-600 rounded-full h-9 w-9">
            <Send className="h-4 w-4 text-white" />
          </Button>
        </form>
      </div>
    </div>
  );
}
