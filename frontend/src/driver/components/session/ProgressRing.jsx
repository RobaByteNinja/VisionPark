import React from "react";

export function ProgressRing({ percentage, timeLeft }) {
  const radius = 110;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      {/* Ambient background glow behind the ring */}
      <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
      
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90 relative z-10"
      >
        {/* Background Track */}
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="text-zinc-200 dark:text-white/10"
        />
        {/* Neon Emerald Progress */}
        <circle
          stroke="#10b981"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + " " + circumference}
          style={{ strokeDashoffset, transition: "stroke-dashoffset 1s linear" }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]"
        />
      </svg>
      
      {/* Centered Timer Text */}
      <div className="absolute flex flex-col items-center justify-center text-center z-20">
        <span className="text-5xl font-bold tracking-tighter text-zinc-900 dark:text-white drop-shadow-md font-mono">
          {timeLeft}
        </span>
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mt-1">
          Remaining
        </span>
      </div>
    </div>
  );
}