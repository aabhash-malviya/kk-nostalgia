"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { playlists, type Track } from "./tracks";
import SeekBar from "./SeekBar";
import { IconNext, IconPause, IconPlay, IconPrev } from "./PlayerIcons";

// The YouTube embed is instantiated at this size (px) and then visually
// scaled down with a CSS transform to fill the small vinyl circle. This
// keeps the underlying player at a size in line with YouTube's embedded
// player guidance while still letting the design use an 80px/64px disc —
// see the README note in this file's sibling docs for more.
const YT_EMBED_BASE = 220;

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function isLikelyYouTubeVideoId(value: string | undefined | null) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{11}$/.test(value.trim());
}

function flatIndexOfFirstPlayable(tracks: Track[]) {
  return tracks.findIndex((t) => isLikelyYouTubeVideoId(t.videoId));
}

export default function Player() {
  // `hasAnyVideoId` is a module-scope-visible constant re-derived from the
  // shared `playlists` data, so it stays true the moment any track gets a
  // valid YouTube videoId — that's what unlocks Prev/Next, letting a listener skip
  // past a still-empty placeholder track to one that plays.
  const hasAnyVideoId = playlists.some((p) => p.tracks.some((t) => isLikelyYouTubeVideoId(t.videoId)));

  const [playlistIndex, setPlaylistIndex] = useState(0);
  const [trackIndex, setTrackIndex] = useState(() =>
    Math.max(0, flatIndexOfFirstPlayable(playlists[0].tracks)),
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const currentPlaylist = playlists[playlistIndex];
  const currentTrack = currentPlaylist.tracks[trackIndex];

  const mountRef = useRef<any>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const desktopSlotRef = useRef<HTMLDivElement | null>(null);
  const mobileSlotRef = useRef<HTMLDivElement | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerReadyRef = useRef(false);
  const commandQueue = useRef<Array<{ func: string; args?: any[] }>>([]);
  const playerInstanceRef = useRef<any>(null);

  function postCommand(func: string, args: any[] = []) {
    // If we have a YT Player instance, call its methods directly.
    const p = playerInstanceRef.current;
    if (p && typeof p[func] === "function") {
      try {
        // call method (seekTo expects seconds)
        return (p as any)[func](...(args || []));
      } catch (err) {
        // fall back to queueing
      }
    }

    // otherwise fall back to the postMessage queue (legacy path)
    const win = mountRef.current?.contentWindow;
    const payload = JSON.stringify({ event: "command", func, args });
    const targetOrigin = "*";
    console.debug("postCommand", { func, args, ready: playerReadyRef.current, hasWin: !!win, hasPlayer: !!p });
    if (!playerReadyRef.current || !win) {
      commandQueue.current.push({ func, args });
      return;
    }
    try {
      win.postMessage(payload, targetOrigin);
    } catch (err) {
      // silent
    }
  }

  const embedUrl = useMemo(() => {
    if (!isLikelyYouTubeVideoId(currentTrack?.videoId)) return null;
    const autoplay = isPlaying ? 1 : 0;
    // Enable controls temporarily for smoke testing so we can manually start playback
    // `enablejsapi=1` lets us control the player via postMessage commands
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `https://www.youtube.com/embed/${currentTrack.videoId}?autoplay=${autoplay}&controls=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&enablejsapi=1&origin=${origin}`;
  }, [currentTrack, isPlaying]);

  const stateRef = useRef({ playlistIndex, trackIndex });
  useEffect(() => {
    stateRef.current = { playlistIndex, trackIndex };
  }, [playlistIndex, trackIndex]);

  // --- keep the single live video stage aligned over whichever of the two
  // responsive layouts (desktop pill / mobile card) is currently visible ---
  useEffect(() => {
    function activeSlot() {
      const d = desktopSlotRef.current;
      const m = mobileSlotRef.current;
      if (d && d.offsetParent !== null) return d;
      if (m && m.offsetParent !== null) return m;
      return null;
    }

    function sync() {
      const slot = activeSlot();
      const stage = stageRef.current;
      if (!slot || !stage) return;
      const rect = slot.getBoundingClientRect();
      stage.style.top = `${rect.top}px`;
      stage.style.left = `${rect.left}px`;
      stage.style.width = `${rect.width}px`;
      stage.style.height = `${rect.height}px`;
      stage.style.visibility = "visible";
    }

    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    const ro = new ResizeObserver(sync);
    if (desktopSlotRef.current) ro.observe(desktopSlotRef.current);
    if (mobileSlotRef.current) ro.observe(mobileSlotRef.current);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      ro.disconnect();
    };
  }, []);

  const advanceTrack = useCallback((direction: 1 | -1) => {
    const { playlistIndex: pIdx, trackIndex: tIdx } = stateRef.current;
    const tracks = playlists[pIdx].tracks;
    const playableTracks = tracks.filter((t) => isLikelyYouTubeVideoId(t.videoId));
    if (playableTracks.length === 0) return;

    let next = tIdx;
    for (let i = 0; i < tracks.length; i++) {
      next = (next + direction + tracks.length) % tracks.length;
      if (isLikelyYouTubeVideoId(tracks[next].videoId)) break;
    }

    setTrackIndex(next);
    setCurrentTime(0);
    setIsPlaying(true);
  }, []);

  useEffect(() => {
    if (!isLikelyYouTubeVideoId(currentTrack?.videoId)) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    setDuration(220);
    setCurrentTime(0);
  }, [currentTrack?.videoId]);

  // The iframe embed is a browser-native player with no cross-origin JS API
  // handshake, so we keep the UI progress moving locally instead of
  // depending on a fragile YouTube Player instance.
  useEffect(() => {
    if (!isPlaying) {
      if (progressTimer.current) clearInterval(progressTimer.current);
      progressTimer.current = null;
      return;
    }

    const tickMs = 250;
    const safeDuration = duration > 0 ? duration : 220;
    progressTimer.current = setInterval(() => {
      setCurrentTime((previous) => {
        const next = Math.min(previous + tickMs / 1000, safeDuration);
        if (next >= safeDuration) {
          setIsPlaying(false);
        }
        return next;
      });
    }, tickMs);

    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
      progressTimer.current = null;
    };
  }, [duration, isPlaying]);

  // Listen for messages from the YouTube iframe to detect ready/state changes
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      // ensure event comes from our iframe
      if (!mountRef.current || e.source !== mountRef.current.contentWindow) return;
      console.debug("yt message raw", e.data);
      let data: any = e.data;
      try {
        if (typeof data === "string") data = JSON.parse(data);
      } catch (err) {
        return;
      }

      if (data && data.event === "onReady") {
        console.debug("yt onReady", data);
        playerReadyRef.current = true;
        // flush queued commands
        const targetOrigin = "*";
        const win = mountRef.current?.contentWindow;
        if (win) {
          for (const cmd of commandQueue.current) {
            try {
              win.postMessage(JSON.stringify({ event: "command", func: cmd.func, args: cmd.args || [] }), targetOrigin);
            } catch (err) {
              // ignore
            }
          }
        }
        commandQueue.current = [];
      }

      if (data && data.event === "onStateChange") {
        const state = data.data ?? data.info ?? null;
        // YouTube states: 1 = playing, 2 = paused
        if (state === 1) setIsPlaying(true);
        else if (state === 2) setIsPlaying(false);
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Load YouTube IFrame API and create a YT.Player instance inside the mount element.
  useEffect(() => {
    let mounted = true;

    function createOrLoadPlayer() {
      if (!mounted || !mountRef.current) return;
      const YT = (window as any).YT;
      if (!YT || !YT.Player) return;

      // If we already have a player instance, load the new video id
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.loadVideoById(currentTrack.videoId);
        } catch (err) {
          // ignore
        }
        return;
      }

      playerInstanceRef.current = new YT.Player(mountRef.current, {
        height: YT_EMBED_BASE,
        width: YT_EMBED_BASE,
        videoId: currentTrack.videoId,
        playerVars: {
          autoplay: isPlaying ? 1 : 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          iv_load_policy: 3,
        },
        events: {
          onReady: (e: any) => {
            playerReadyRef.current = true;
            try {
              const dur = e.target.getDuration();
              if (Number.isFinite(dur) && dur > 0) setDuration(dur);
            } catch (err) {}
            // flush queued commands into the player instance
            for (const cmd of commandQueue.current) {
              try {
                if (playerInstanceRef.current && typeof playerInstanceRef.current[cmd.func] === "function") {
                  playerInstanceRef.current[cmd.func](...(cmd.args || []));
                }
              } catch (err) {}
            }
            commandQueue.current = [];
          },
          onStateChange: (e: any) => {
            const state = e.data;
            if (state === 1) setIsPlaying(true);
            else if (state === 2) setIsPlaying(false);
          },
        },
      });
    }

    if (typeof window !== "undefined") {
      if (!(window as any).YT) {
        if (!document.getElementById("yt-iframe-api")) {
          const tag = document.createElement("script");
          tag.id = "yt-iframe-api";
          tag.src = "https://www.youtube.com/iframe_api";
          document.body.appendChild(tag);
        }
        const prev = (window as any).onYouTubeIframeAPIReady;
        (window as any).onYouTubeIframeAPIReady = function () {
          if (prev) prev();
          createOrLoadPlayer();
        };
      } else {
        createOrLoadPlayer();
      }
    }

    return () => {
      mounted = false;
      if (playerInstanceRef.current && typeof playerInstanceRef.current.destroy === "function") {
        try {
          playerInstanceRef.current.destroy();
        } catch (err) {}
        playerInstanceRef.current = null;
      }
    };
  }, [currentTrack.videoId]);

  // Flush queued commands when the iframe element finishes loading (best-effort)
  function flushQueue(force = false) {
    const win = mountRef.current?.contentWindow;
    const targetOrigin = "*";
    if (!win) return;
    for (const cmd of commandQueue.current) {
      try {
        win.postMessage(JSON.stringify({ event: "command", func: cmd.func, args: cmd.args || [] }), targetOrigin);
        if (!force) console.debug("flushed queued cmd", cmd);
      } catch (err) {
        // ignore
      }
    }
    if (force) commandQueue.current = [];
  }

  // Reset ready state when embed URL changes (new iframe)
  useEffect(() => {
    playerReadyRef.current = false;
    commandQueue.current = [];
  }, [embedUrl]);

  function handlePlayPause() {
    if (!isLikelyYouTubeVideoId(currentTrack.videoId)) return;
    // toggle UI state (will be reconciled with iframe state via postMessage events)
    setIsPlaying((prev) => !prev);
    const cmd = isPlaying ? "pauseVideo" : "playVideo";
    postCommand(cmd);
  }

  function handleSeek(fraction: number) {
    if (!isLikelyYouTubeVideoId(currentTrack.videoId) || duration <= 0) return;
    const nextTime = fraction * duration;
    setCurrentTime(nextTime);
    // send a seek command to the iframe player (queued until ready)
    postCommand("seekTo", [nextTime, true]);
  }

  function handleSelectPlaylist(index: number) {
    if (index === playlistIndex) return;
    setPlaylistIndex(index);
    const tracks = playlists[index].tracks;
    const firstPlayable = Math.max(0, flatIndexOfFirstPlayable(tracks));
    setTrackIndex(firstPlayable);
    const target = tracks[firstPlayable];
    if (target && isLikelyYouTubeVideoId(target.videoId)) {
      setIsPlaying(true);
      setCurrentTime(0);
      setDuration(220);
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="relative z-30 player-root w-full max-w-xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <PlaylistTabs
        playlists={playlists}
        activeIndex={playlistIndex}
        onSelect={handleSelectPlaylist}
      />

      {/* Shared live video stage — one physical iframe, repositioned over
          whichever layout below is visible, so we never run two players. */}
      <div
        ref={stageRef}
        className="fixed z-30 overflow-hidden rounded-full ring-2 ring-white/10"
        style={{ visibility: "hidden" }}
      >
        <div
          className="vinyl-spin absolute inset-0 rounded-full"
          style={{ animationPlayState: isPlaying ? "running" : "paused" }}
        >
          {hasAnyVideoId ? (
            <div
              ref={mountRef}
              title={currentTrack.title}
              className="absolute inset-0 h-full w-full rounded-full border-0 pointer-events-auto"
              style={{
                width: YT_EMBED_BASE,
                height: YT_EMBED_BASE,
                transform: "translate(-50%,-50%)",
                left: "50%",
                top: "50%",
                position: "absolute",
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-ink-2 text-white/40">
              <NoteIcon className="h-1/3 w-1/3" />
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/70 ring-2 ring-white/40" />
      </div>

      <DesktopPlayer
        track={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        progress={progress}
        playDisabled={!currentTrack.videoId}
        navDisabled={!hasAnyVideoId}
        vinylSlotRef={desktopSlotRef}
        onPlayPause={handlePlayPause}
        onPrev={() => advanceTrack(-1)}
        onNext={() => advanceTrack(1)}
        onSeek={handleSeek}
      />
      <MobilePlayer
        track={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        progress={progress}
        playDisabled={!currentTrack.videoId}
        navDisabled={!hasAnyVideoId}
        vinylSlotRef={mobileSlotRef}
        onPlayPause={handlePlayPause}
        onPrev={() => advanceTrack(-1)}
        onNext={() => advanceTrack(1)}
        onSeek={handleSeek}
      />

      {!hasAnyVideoId && (
        <p className="mt-3 text-center text-xs text-white/50">
          Add YouTube video IDs in <code className="text-white/70">components/tracks.ts</code> to start playback.
        </p>
      )}
    </div>
  );
}

function NoteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M9 18a2.5 2.5 0 1 1-2.5-2.5A2.5 2.5 0 0 1 9 18Zm10-2a2.5 2.5 0 1 1-2.5-2.5A2.5 2.5 0 0 1 19 16ZM9 18V6.6a1 1 0 0 1 .76-.97l9-2.25A1 1 0 0 1 20 4.35V16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlaylistTabs({
  playlists: lists,
  activeIndex,
  onSelect,
}: {
  playlists: typeof playlists;
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="mb-3 flex justify-center gap-1.5">
      {lists.map((p, i) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onSelect(i)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            i === activeIndex
              ? "bg-accent/90 text-ink"
              : "bg-white/10 text-white/70 hover:bg-white/15"
          }`}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}

type LayoutProps = {
  track: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  playDisabled: boolean;
  navDisabled: boolean;
  vinylSlotRef: React.RefObject<HTMLDivElement | null>;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (fraction: number) => void;
};

const glassPill =
  "border border-white/10 bg-gradient-to-b from-white/[0.15] to-white/[0.055] backdrop-blur-3xl backdrop-saturate-[1.7] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.2)]";

function DesktopPlayer({
  track,
  currentTime,
  duration,
  progress,
  playDisabled,
  navDisabled,
  vinylSlotRef,
  isPlaying,
  onPlayPause,
  onPrev,
  onNext,
  onSeek,
}: LayoutProps) {
  return (
    <div className={`hidden sm:flex items-center gap-4 rounded-full p-3 pr-5 ${glassPill}`}>
      <div ref={vinylSlotRef} className="relative h-20 w-20 shrink-0 self-start" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-[15px] font-semibold text-white">{track.title}</p>
        <p className="truncate text-[12.5px] text-white/70">{track.artist}</p>
        <div className="mt-1.5">
          <SeekBar progress={progress} onSeek={onSeek} disabled={playDisabled} />
        </div>
        <div className="tabular -mt-1 flex justify-between text-[10.5px] text-white/60">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      <Transport
        isPlaying={isPlaying}
        playDisabled={playDisabled}
        navDisabled={navDisabled}
        onPlayPause={onPlayPause}
        onPrev={onPrev}
        onNext={onNext}
        size="desktop"
      />
    </div>
  );
}

function MobilePlayer({
  track,
  currentTime,
  duration,
  progress,
  playDisabled,
  navDisabled,
  vinylSlotRef,
  isPlaying,
  onPlayPause,
  onPrev,
  onNext,
  onSeek,
}: LayoutProps) {
  return (
    <div className={`flex sm:hidden flex-col gap-3 rounded-[26px] p-4 ${glassPill}`}>
      <div className="flex items-center gap-3">
        <div ref={vinylSlotRef} className="relative h-16 w-16 shrink-0 self-start" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-semibold text-white">{track.title}</p>
          <p className="truncate text-sm text-white/70">{track.artist}</p>
        </div>
      </div>
      <SeekBar progress={progress} onSeek={onSeek} disabled={playDisabled} />
      <div className="flex items-center justify-between">
        <span className="tabular text-[11px] text-white/60">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <Transport
          isPlaying={isPlaying}
          playDisabled={playDisabled}
          navDisabled={navDisabled}
          onPlayPause={onPlayPause}
          onPrev={onPrev}
          onNext={onNext}
          size="mobile"
        />
      </div>
    </div>
  );
}

function Transport({
  isPlaying,
  playDisabled,
  navDisabled,
  onPlayPause,
  onPrev,
  onNext,
  size,
}: {
  isPlaying: boolean;
  playDisabled: boolean;
  navDisabled: boolean;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  size: "desktop" | "mobile";
}) {
  const playSize = size === "desktop" ? "h-11 w-11" : "h-[52px] w-[52px]";
  const sideSize = size === "desktop" ? "h-8 w-8" : "h-11 w-11";
  return (
    <div className="flex items-center gap-1.5 sm:gap-1">
      <button
        type="button"
        onClick={onPrev}
        disabled={navDisabled}
        aria-label="Previous track"
        className={`flex ${sideSize} items-center justify-center rounded-full text-white/80 transition-colors hover:text-white disabled:opacity-30`}
      >
        <IconPrev className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onPlayPause}
        disabled={playDisabled}
        aria-label={isPlaying ? "Pause" : "Play"}
        className={`flex ${playSize} items-center justify-center rounded-full bg-gradient-to-b from-accent to-accent-2 text-ink shadow-[0_6px_16px_-4px_rgba(227,150,58,0.65)] ring-1 ring-white/25 transition-transform active:scale-95 disabled:opacity-30`}
      >
        {isPlaying ? <IconPause className="h-5 w-5" /> : <IconPlay className="ml-0.5 h-5 w-5" />}
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={navDisabled}
        aria-label="Next track"
        className={`flex ${sideSize} items-center justify-center rounded-full text-white/80 transition-colors hover:text-white disabled:opacity-30`}
      >
        <IconNext className="h-5 w-5" />
      </button>
    </div>
  );
}
