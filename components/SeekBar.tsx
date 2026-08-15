"use client";

import { useRef, useState } from "react";

type SeekBarProps = {
  progress: number; // 0..1
  onSeek: (fraction: number) => void;
  disabled?: boolean;
};

function fractionFromPointer(rect: DOMRect, clientX: number) {
  const raw = (clientX - rect.left) / rect.width;
  return Math.min(1, Math.max(0, raw));
}

export default function SeekBar({ progress, onSeek, disabled }: SeekBarProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);
  const shownProgress = Math.min(1, Math.max(0, progress));

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled || !trackRef.current) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    const rect = trackRef.current.getBoundingClientRect();
    onSeek(fractionFromPointer(rect, e.clientX));
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    onSeek(fractionFromPointer(rect, e.clientX));
  }

  function handlePointerUp() {
    setDragging(false);
  }

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(shownProgress * 100)}
      className="group relative flex h-6 w-full touch-none items-center"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
    >
      <div className="relative h-[3px] w-full overflow-visible rounded-full bg-white/15">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent shadow-[0_0_8px_1px_rgba(227,150,58,0.65)]"
          style={{ width: `${shownProgress * 100}%` }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_6px_rgba(227,150,58,0.8)] transition-opacity"
          style={{
            left: `${shownProgress * 100}%`,
            opacity: hovering || dragging ? 1 : 0,
          }}
        />
      </div>
    </div>
  );
}
