"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type AnimatedCircularProgressProps = {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
};

function normalizeScore(score: number) {
  if (score <= 1) return Math.min(100, Math.max(0, score * 100));
  return Math.min(100, Math.max(0, score));
}

function scoreStrokeClass(percent: number) {
  if (percent >= 70) return "stroke-emerald-400";
  if (percent >= 40) return "stroke-amber-400";
  return "stroke-slate-400";
}

function scoreGlowClass(percent: number) {
  if (percent >= 70) return "drop-shadow-[0_0_12px_rgba(52,211,153,0.35)]";
  if (percent >= 40) return "drop-shadow-[0_0_12px_rgba(251,191,36,0.3)]";
  return "drop-shadow-[0_0_12px_rgba(148,163,184,0.25)]";
}

export default function AnimatedCircularProgress({
  score,
  size = 112,
  strokeWidth = 8,
  label = "Match Score",
  className = "",
}: AnimatedCircularProgressProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.35 });

  const percent = useMemo(() => normalizeScore(score), [score]);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const count = useMotionValue(0);
  const rounded = useTransform(count, (value) => Math.round(value));
  const [display, setDisplay] = useState(0);

  useMotionValueEvent(rounded, "change", setDisplay);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(count, percent, {
      duration: 1.15,
      ease: [0.22, 1, 0.36, 1],
    });
    return controls.stop;
  }, [isInView, percent, count]);

  const strokeClass = scoreStrokeClass(percent);
  const glowClass = scoreGlowClass(percent);

  return (
    <div
      ref={ref}
      className={`flex flex-col items-center ${className}`}
      aria-label={`${label}: ${percent}%`}
    >
      <div className={`relative ${glowClass}`} style={{ width: size, height: size }}>
        <motion.svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          initial={false}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-white/10"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className={strokeClass}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={
              isInView
                ? { strokeDashoffset: circumference * (1 - percent / 100) }
                : { strokeDashoffset: circumference }
            }
            transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-bold tabular-nums text-white">
            {display}%
          </span>
        </div>
      </div>
      {label ? (
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
      ) : null}
    </div>
  );
}
