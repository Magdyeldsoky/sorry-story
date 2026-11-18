"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface NanoLoveTransitionProps {
  onComplete: () => void;
}

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

export default function NanoLoveTransition({
  onComplete,
}: NanoLoveTransitionProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stageText, setStageText] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const computedStyle = getComputedStyle(document.documentElement);
    const primaryColor =
      computedStyle.getPropertyValue("--primary").trim() || "#e11d48";

    const isMobile = width < 768;
    const TOTAL_PARTICLES = isMobile ? 1300 : 2200;
    const particles: Particle[] = [];

    for (let i = 0; i < TOTAL_PARTICLES; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        targetX: Math.random() * width,
        targetY: Math.random() * height,
        vx: 0,
        vy: 0,
        size: isMobile ? Math.random() * 1.8 + 1 : Math.random() * 2.2 + 1.3,
        alpha: Math.random() * 0.4 + 0.6,
      });
    }

    const getTextPoints = (text: string, customFontSize?: number) => {
      const offscreen = document.createElement("canvas");
      offscreen.width = width;
      offscreen.height = height;
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return [];

      let fontSize = customFontSize || (isMobile ? Math.min(width * 0.38, height * 0.45) : Math.min(width * 0.35, height * 0.5));
      if (text === "I") fontSize = isMobile ? Math.min(width * 0.5, height * 0.55) : Math.min(width * 0.45, height * 0.65);

      offCtx.fillStyle = "#ffffff";
      offCtx.font = `900 ${fontSize}px Montserrat, sans-serif`;
      offCtx.textAlign = "center";
      offCtx.textBaseline = "middle";
      offCtx.fillText(text, width / 2, height / 2 - (isMobile ? height * 0.05 : 0));

      const imageData = offCtx.getImageData(0, 0, width, height).data;
      const points: { x: number; y: number }[] = [];

      const step = isMobile ? 3 : 5;
      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const index = (y * width + x) * 4;
          if (imageData[index + 3] > 128) {
            points.push({ x, y });
          }
        }
      }
      return points;
    };

    const getFilledHeartPoints = () => {
      const offscreen = document.createElement("canvas");
      offscreen.width = width;
      offscreen.height = height;
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return [];

      const scale = isMobile ? Math.min(width, height) * 0.013 : Math.min(width, height) * 0.019;
      const centerX = width / 2;
      const centerY = height / 2 - (isMobile ? height * 0.08 : height * 0.04);

      offCtx.fillStyle = "#ffffff";
      offCtx.beginPath();
      for (let t = 0; t <= Math.PI * 2; t += 0.01) {
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(
          13 * Math.cos(t) -
          5 * Math.cos(2 * t) -
          2 * Math.cos(3 * t) -
          Math.cos(4 * t)
        );

        const px = centerX + x * scale;
        const py = centerY + y * scale;

        if (t === 0) {
          offCtx.moveTo(px, py);
        } else {
          offCtx.lineTo(px, py);
        }
      }
      offCtx.closePath();
      offCtx.fill();

      const imageData = offCtx.getImageData(0, 0, width, height).data;
      const points: { x: number; y: number }[] = [];

      const step = isMobile ? 4 : 8;
      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const index = (y * width + x) * 4;
          if (imageData[index + 3] > 128) {
            points.push({ x, y });
          }
        }
      }
      return points;
    };

    const assignTargets = (points: { x: number; y: number }[]) => {
      for (let i = points.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [points[i], points[j]] = [points[j], points[i]];
      }

      for (let i = 0; i < particles.length; i++) {
        if (points.length > 0) {
          const pt = points[i % points.length];
          particles[i].targetX = pt.x;
          particles[i].targetY = pt.y;
        }
      }
    };

    const scatterParticles = () => {
      for (let i = 0; i < particles.length; i++) {
        const angle = Math.random() * Math.PI * 2;
        const force = 8 + Math.random() * 16;
        particles[i].vx += Math.cos(angle) * force;
        particles[i].vy += Math.sin(angle) * force;
        particles[i].targetX = Math.random() * width;
        particles[i].targetY = Math.random() * height;
      }
    };

    const timeouts: NodeJS.Timeout[] = [];

    assignTargets(getTextPoints("I"));

    timeouts.push(setTimeout(() => scatterParticles(), 1900));
    timeouts.push(setTimeout(() => assignTargets(getTextPoints("LOVE")), 2350));

    timeouts.push(setTimeout(() => scatterParticles(), 4300));
    timeouts.push(setTimeout(() => assignTargets(getTextPoints("YOU")), 4750));

    timeouts.push(setTimeout(() => scatterParticles(), 6700));
    timeouts.push(
      setTimeout(() => {
        assignTargets(getTextPoints("Menna", isMobile ? 70 : 130));
      }, 7150)
    );

    timeouts.push(setTimeout(() => scatterParticles(), 9200));
    timeouts.push(
      setTimeout(() => {
        assignTargets(getFilledHeartPoints());
        setStageText("I love you, Menna ❤️");
      }, 9700)
    );

    timeouts.push(
      setTimeout(() => {
        onComplete();
      }, 13200)
    );

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;

        p.vx += dx * 0.065;
        p.vy += dy * 0.065;

        p.vx *= 0.78;
        p.vy *= 0.78;

        p.x += p.vx;
        p.y += p.vy;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = primaryColor;
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = isMobile ? 6 : 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      timeouts.forEach(clearTimeout);
      window.removeEventListener("resize", handleResize);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(12px)" }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-end pb-16 sm:justify-center sm:pb-0 overflow-hidden px-4"
    >
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full pointer-events-none" />

      {stageText && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative z-10 text-center bg-card/90 backdrop-blur-md border border-border/80 py-3.5 px-6 sm:px-8 rounded-2xl shadow-2xl max-w-xs sm:max-w-md"
        >
          <p className="text-xl sm:text-3xl font-bold text-foreground tracking-wide font-sans">
            {stageText}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}