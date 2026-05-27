"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/locales/en/common.json";
import es from "@/locales/es/common.json";
import hi from "@/locales/hi/common.json";
import pt from "@/locales/pt/common.json";
import zh from "@/locales/zh/common.json";
import fr from "@/locales/fr/common.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { common: en },
    es: { common: es },
    hi: { common: hi },
    pt: { common: pt },
    zh: { common: zh },
    fr: { common: fr },
  },
  lng: "en",
  fallbackLng: "en",
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

interface LanguageContextType {
  language: string;
  changeLanguage: (lang: string, email: string) => Promise<{ requiresOtp: boolean }>;
  applyLanguage: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const saved = localStorage.getItem("twiller-lang") || "en";
    setLanguage(saved);
    i18n.changeLanguage(saved);
  }, []);

  const changeLanguage = async (lang: string, email: string) => {
    // All language changes require OTP
    // French → email OTP, others → SMS OTP
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/send-language-otp`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, language: lang }),
      }
    );
    if (!res.ok) throw new Error("Failed to send OTP");
    return { requiresOtp: true };
  };

  const applyLanguage = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem("twiller-lang", lang);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, applyLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default i18n;
