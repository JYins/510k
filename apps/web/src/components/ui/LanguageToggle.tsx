"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/contexts/LocaleContext";

export function LanguageToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <motion.button
      className="h-9 px-3 rounded-full bg-ios-gray-500/60 backdrop-blur-ios text-[13px] font-medium text-white/80 flex items-center justify-center min-w-[52px]"
      onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
      whileTap={{ scale: 0.95 }}
    >
      {locale === "zh" ? "EN" : "中文"}
    </motion.button>
  );
}
