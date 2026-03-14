import React from "react";
import { CarFront } from "lucide-react";

export function Logo({ className = "", showText = true }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-[#09090b] border border-zinc-200 dark:border-white/10 shadow-[0_0_20px_rgba(16,185,129,0.15)] group transition-all duration-300">
        <div className="absolute inset-0 rounded-xl bg-emerald-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CarFront className="relative h-5 w-5 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
      </div>
      {showText && (
        <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white drop-shadow-sm">
          VisionPark
        </span>
      )}
    </div>
  );
}