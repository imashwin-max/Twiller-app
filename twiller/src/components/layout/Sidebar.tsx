"use client";
import React, { useState } from 'react';

import {
  Home,
  Search,
  Bell,
  Mail,
  Bookmark,
  User,
  MoreHorizontal,
  Settings,
  LogOut,
  Sparkles
} from 'lucide-react';
import SubscriptionPlans from '../SubscriptionPlans';
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../LanguageSwitcher";
import "@/context/LanguageContext"; // ensures i18n is initialized
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import TwitterLogo from '../Twitterlogo';
import { useAuth } from '@/context/AuthContext';

import TweetComposer from '../TweetComposer';

interface SidebarProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
  onTweetPosted?: (tweet: any) => void;
}

export default function Sidebar({ currentPage = 'home', onNavigate, onTweetPosted }: SidebarProps) {
  const { user, logout } = useAuth();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const { t } = useTranslation("common");

  const navigation = [
    { name: t('home'), icon: Home, current: currentPage === 'home', page: 'home' },
    { name: t('explore'), icon: Search, current: currentPage === 'explore', page: 'explore' },
    { name: t('notifications'), icon: Bell, current: currentPage === 'notifications', page: 'notifications', badge: true },
    { name: t('messages'), icon: Mail, current: currentPage === 'messages', page: 'messages' },
    { name: t('bookmarks'), icon: Bookmark, current: currentPage === 'bookmarks', page: 'bookmarks' },
    { name: t('profile'), icon: User, current: currentPage === 'profile', page: 'profile' },
    { name: t('more', 'More'), icon: MoreHorizontal, current: currentPage === 'more', page: 'more' },
  ];

  return (
    <div className="flex flex-col h-screen w-64 border-r border-gray-800 bg-black">
      <div className="p-4 flex items-center space-x-2">
        <TwitterLogo size="lg" className="text-white" />
        <span className="font-extrabold text-xl tracking-tight text-white hidden md:inline">Twiller</span>
      </div>
      
      <nav className="flex-1 px-2">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <Button
                variant="ghost"
                className={`w-full justify-start text-lg py-5 px-4 rounded-full transition-all duration-200 ${
                  item.current 
                    ? 'font-bold bg-gray-900 text-white shadow-[0_0_15px_rgba(29,155,240,0.15)] border-l-4 border-blue-500' 
                    : 'font-normal text-gray-300 hover:bg-gray-900/80 hover:text-white'
                }`}
                onClick={() => onNavigate?.(item.page)}
              >
                <item.icon className={`mr-4 h-6 w-6 ${item.current ? 'text-blue-400' : 'text-gray-400'}`} />
                {item.name}
                {item.badge && (
                  <span className="ml-auto bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
                    3
                  </span>
                )}
              </Button>
            </li>
          ))}

          {user && (
            <li>
              <Button
                variant="ghost"
                className="w-full justify-start text-lg py-5 px-4 rounded-full hover:bg-yellow-950/30 text-yellow-400 hover:text-yellow-300 font-semibold transition-colors"
                onClick={() => setShowSubscriptionModal(true)}
              >
                <Sparkles className="mr-4 h-6 w-6 text-yellow-500" />
                Premium
              </Button>
            </li>
          )}
        </ul>
        
        <div className="mt-6 px-2 space-y-3">
          <LanguageSwitcher />
          <Button
            onClick={() => setShowPostModal(true)}
            className="w-full bg-gradient-to-r from-blue-500 to-sky-400 hover:from-blue-600 hover:to-sky-500 text-white font-bold py-3.5 rounded-full text-base shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]"
          >
            {t("post")}
          </Button>
        </div>
      </nav>
      
      {user && (
        <div className="p-4 border-t border-gray-800">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start p-3 rounded-full hover:bg-gray-900 border border-transparent hover:border-gray-800 transition-all"
              >
                <Avatar className="h-10 w-10 mr-3 border border-gray-700">
                  <AvatarImage src={user.avatar} alt={user.displayName} />
                  <AvatarFallback className="bg-blue-600 text-white font-bold">{user.displayName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-white font-bold text-sm truncate">{user.displayName}</div>
                  <div className="text-gray-400 text-xs truncate">@{user.username}</div>
                </div>
                <MoreHorizontal className="h-5 w-5 text-gray-400 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-gray-900 border-gray-800 text-white rounded-xl p-1 shadow-2xl">
              <DropdownMenuItem 
                className="text-white hover:bg-gray-800 rounded-lg cursor-pointer py-2"
                onClick={() => onNavigate?.("more")}
              >
                <Settings className="mr-2 h-4 w-4 text-blue-400" />
                Settings & Privacy
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuItem 
                className="text-red-400 hover:bg-red-950/40 rounded-lg cursor-pointer py-2 font-medium"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t("logout")} @{user.username}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {showSubscriptionModal && (
        <SubscriptionPlans onClose={() => setShowSubscriptionModal(false)} />
      )}

      {/* Global Tweet Composer Modal */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-start justify-center z-50 pt-20 p-4">
          <div className="bg-black border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-3 border-b border-gray-800">
              <span className="text-white font-bold text-base px-2">Compose Post</span>
              <button 
                onClick={() => setShowPostModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 text-sm px-2"
              >
                ✕
              </button>
            </div>
            <TweetComposer onTweetPosted={(newTweet: any) => {
              onTweetPosted?.(newTweet);
              setShowPostModal(false);
              onNavigate?.("home");
            }} />
          </div>
        </div>
      )}
    </div>
  );
}