"use client";

import { useEffect, useState } from "react";

// Ambient number for atmosphere, not a real analytics feed — drifts gently
// on a slow random walk so it never looks frozen or fake-precise.
export default function ListenerCount() {
  const [count, setCount] = useState(41);

  useEffect(() => {
    const id = setInterval(() => {
      setCount((prev) => {
        const step = Math.round((Math.random() - 0.5) * 4);
        return Math.max(12, Math.min(96, prev + step));
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2 text-white/70 text-xs sm:text-sm">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/70" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
      </span>
      <span className="tabular">{count}</span>
      <span className="hidden sm:inline text-white/50">listening tonight</span>
    </div>
  );
}
