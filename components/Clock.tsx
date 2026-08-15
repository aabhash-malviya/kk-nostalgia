"use client";

import { useEffect, useState } from "react";

const formatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

function splitParts(date: Date) {
  const parts = formatter.formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "";
  const dayPeriod = parts.find((p) => p.type === "dayPeriod")?.value ?? "";
  return { hour, minute, dayPeriod };
}

export default function Clock() {
  const [time, setTime] = useState(() => splitParts(new Date()));

  useEffect(() => {
    const id = setInterval(() => setTime(splitParts(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="tabular flex items-baseline gap-1 text-white/85 text-sm sm:text-base">
      <span>{time.hour}</span>
      <span className="clock-colon">:</span>
      <span>{time.minute}</span>
      <span className="text-[0.7em] text-white/60 ml-0.5">{time.dayPeriod}</span>
    </div>
  );
}
