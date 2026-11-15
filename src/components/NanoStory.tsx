"use client";

import { motion } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";

interface NanoStoryProps {
  paragraphs: string[];
}

export default function NanoStory({ paragraphs }: NanoStoryProps) {
  let globalWordIndex = 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden"
    >
      {/* إضاءة خلفية ناعمة */}
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-4xl w-full bg-card/90 backdrop-blur-xl border border-border/80 rounded-3xl p-8 sm:p-16 shadow-2xl space-y-10">
        <div className="flex items-center justify-between border-b border-border/60 pb-5">
          <div className="flex items-center gap-2.5 text-primary text-base font-bold">
            <Sparkles className="w-5 h-5" />
            <span>حكايتنا... كلمة بكلمة</span>
          </div>
          <Heart className="w-6 h-6 text-primary fill-primary/30 animate-pulse" />
        </div>

        <div className="space-y-8 text-xl sm:text-2xl leading-[2.4] text-foreground/95">
          {paragraphs.map((paragraph, pIdx) => {
            const words = paragraph.split(" ");

            return (
              <p key={pIdx} className="flex flex-wrap gap-x-2.5 gap-y-2">
                {words.map((word, wIdx) => {
                  const currentDelay = globalWordIndex * 0.12;
                  globalWordIndex++;

                  const randomX = ((wIdx * 17) % 40) - 20;
                  const randomY = ((pIdx * 13 + wIdx) % 30) - 15;

                  return (
                    <motion.span
                      key={`${pIdx}-${wIdx}`}
                      initial={{
                        opacity: 0,
                        x: randomX,
                        y: randomY,
                        scale: 1.5,
                        filter: "blur(10px)",
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        y: 0,
                        scale: 1,
                        filter: "blur(0px)",
                      }}
                      transition={{
                        duration: 0.6,
                        delay: currentDelay,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="relative inline-block"
                    >
                      {/* وميض جزيئات النانو لحظة ظهور الكلمة */}
                      <motion.span
                        initial={{ opacity: 0.9, scale: 1.4 }}
                        animate={{ opacity: 0, scale: 0.5 }}
                        transition={{
                          duration: 0.45,
                          delay: currentDelay,
                        }}
                        className="pointer-events-none absolute inset-0 bg-primary/40 rounded-full blur-sm"
                      />
                      {word}
                    </motion.span>
                  );
                })}
              </p>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}