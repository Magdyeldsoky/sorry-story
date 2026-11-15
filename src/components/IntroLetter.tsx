"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import FallingPetals from "./FallingPetals";

interface IntroLetterProps {
  text: string;
  dateLabel?: string;
  buttonLabel?: string;
  onComplete: () => void;
}

export default function IntroLetter({
  text,
  dateLabel = "توثيق ذكرى خاصة",
  buttonLabel = "لما تخلصي قرايه دوسي هنا يا حبيبتي",
  onComplete,
}: IntroLetterProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsDone(true);
        clearInterval(interval);
      }
    }, 35); // سرعة كتابة ناعمة وسلسة

    return () => clearInterval(interval);
  }, [text]);

  return (
    <motion.div
      exit={{ opacity: 0, scale: 0.96, filter: "blur(10px)" }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="relative min-h-screen flex items-center justify-center p-6 sm:p-10 overflow-hidden"
    >
      <FallingPetals />

      <div className="relative z-10 max-w-3xl w-full bg-card/90 backdrop-blur-xl border border-border/80 rounded-3xl p-8 sm:p-14 shadow-2xl">
        {/* شارة التاريخ */}
        <div className="flex items-center justify-between border-b border-border/60 pb-5 mb-8">
          <span className="text-xs sm:text-sm font-mono text-primary font-semibold tracking-wider bg-primary/10 px-3 py-1 rounded-full">
            {dateLabel}
          </span>
          <Heart className="w-6 h-6 text-primary fill-primary/30 animate-pulse" />
        </div>

        {/* النص بالخط العربي الجديد وبمسافات مريحة للقراءة */}
        <div className="min-h-[240px] text-xl sm:text-2xl leading-[2.2] text-foreground/95 whitespace-pre-line font-medium">
          {displayedText}
          {!isDone && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
              className="inline-block w-2 h-7 bg-primary mr-1.5 align-middle rounded-full"
            />
          )}
        </div>

        {/* زرار الانتقال */}
        <div className="mt-12 flex justify-center min-h-[64px]">
          {isDone && (
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.5 }}
              onClick={onComplete}
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg sm:text-xl shadow-lg hover:shadow-primary/25 transition-all cursor-pointer"
            >
              <span>{buttonLabel}</span>
              <Heart className="w-6 h-6 fill-current group-hover:scale-125 transition-transform" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}