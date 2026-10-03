"use client";
import { useAuth } from "@/context/AuthContext";
import React, { useState } from "react";
import LoadingSpinner from "../loading-spinner";
import Sidebar from "./Sidebar";
import RightSidebar from "./Rightsidebar";
import ProfilePage from "../ProfilePage";
import ExploreView from "../views/ExploreView";
import NotificationsView from "../views/NotificationsView";
import MessagesView from "../views/MessagesView";
import BookmarksView from "../views/BookmarksView";
import MoreSettingsView from "../views/MoreSettingsView";
import SubscriptionPlans from "../SubscriptionPlans";

const Mainlayout = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState("home");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-4xl font-bold mb-4">X</div>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // If user is not logged in → show children (like login/signup landing pages)
  if (!user) {
    return <>{children}</>;
  }

  const renderContent = () => {
    switch (currentPage) {
      case "explore":
        return <ExploreView />;
      case "notifications":
        return <NotificationsView />;
      case "messages":
        return <MessagesView />;
      case "bookmarks":
        return <BookmarksView />;
      case "profile":
        return <ProfilePage />;
      case "more":
        return <MoreSettingsView />;
      case "home":
      default:
        return children;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      <div className="w-20 sm:w-24 md:w-64 border-r border-gray-800">
        <Sidebar 
          currentPage={currentPage} 
          onNavigate={setCurrentPage} 
          onTweetPosted={() => setCurrentPage("home")}
        />
      </div>
      <main className="flex-1 max-w-2xl border-x border-gray-800 min-h-screen">
        {renderContent()}
      </main>
      <div className="hidden lg:block w-80 p-4">
        <RightSidebar onSubscribe={() => setShowSubscriptionModal(true)} />
      </div>
      {showSubscriptionModal && (
        <SubscriptionPlans onClose={() => setShowSubscriptionModal(false)} />
      )}
    </div>
  );
};

export default Mainlayout;
