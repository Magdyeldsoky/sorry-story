"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Petal {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  rotate: number;
}

export default function FallingPetals() {
  const [petals, setPetals] = useState<Petal[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 7 + Math.random() * 6,
      size: 14 + Math.random() * 14,
      rotate: Math.random() * 360,
    }));
    setPetals(generated);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {petals.map((petal) => (
        <motion.div
          key={petal.id}
          initial={{ y: -50, x: 0, rotate: petal.rotate, opacity: 0 }}
          animate={{
            y: "110vh",
            x: [0, 25, -25, 15, 0],
            rotate: petal.rotate + 360,
            opacity: [0, 0.85, 0.85, 0],
          }}
          transition={{
            duration: petal.duration,
            delay: petal.delay,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            left: `${petal.left}%`,
            width: petal.size,
            height: petal.size * 0.75,
          }}
          className="absolute top-0 rounded-tl-full rounded-br-full bg-primary/40 shadow-sm backdrop-blur-[1px]"
        />
      ))}
    </div>
  );
}