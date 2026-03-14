import React from "react";

export function GlassCard({ children, className = "" }) {
  return (
    <div
      className={`
        backdrop-blur-xl rounded-3xl p-8 
        transition-all duration-500
        /* Light Mode Glass */
        bg-white/40 border border-white/60 shadow-xl shadow-zinc-200/50
        /* Dark Mode Glass */
        dark:bg-white/[0.02] dark:border-white/[0.08] dark:shadow-2xl dark:shadow-black/80
        ${className}
      `}
    >
      {children}
    </div>
  );
}