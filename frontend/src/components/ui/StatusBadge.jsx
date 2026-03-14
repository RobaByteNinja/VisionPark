import React from "react";

export function StatusBadge({ status }) {
  const styles = {
    Free: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    Reserved: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    Secured: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
  };

  const indicatorColors = {
    Free: "bg-emerald-500",
    Reserved: "bg-amber-500",
    Secured: "bg-red-500"
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${styles[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${indicatorColors[status]} ${status === "Free" || status === "Reserved" ? "animate-pulse" : ""}`} />
      {status}
    </span>
  );
}