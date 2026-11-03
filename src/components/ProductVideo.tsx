"use client";

import React, { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

/**
 * A product or review video that plays muted and looping while it is on screen (like Instagram),
 * with tap-to-pause and a sound toggle. Nothing downloads until the slide is near the viewport.
 */
export function ProductVideo({
  src,
  poster,
  active = true,
  className = "",
  label = "Product video",
  startMuted = true,
  controlsClassName = "bottom-3 right-3",
}: {
  src: string;
  poster?: string;
  /** False while the slide is scrolled away in a carousel. */
  active?: boolean;
  className?: string;
  label?: string;
  /** Start with sound (only after a tap, e.g. opening a review full screen). */
  startMuted?: boolean;
  /** Where the pause/sound buttons sit. */
  controlsClassName?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [muted, setMuted] = useState(startMuted);
  const [paused, setPaused] = useState(false);
  const interacted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting && e.intersectionRatio > 0.5), { threshold: [0, 0.5, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // Reduced motion: never autoplay — show the play button until the shopper taps it.
    if (reduce && !interacted.current) {
      el.pause();
      if (!paused) setPaused(true);
      return;
    }
    if (active && visible && !paused) {
      el.play().catch(() => {
        // Browsers may refuse autoplay with sound — retry muted before giving up.
        if (!el.muted) {
          el.muted = true;
          setMuted(true);
          el.play().catch(() => setPaused(true));
        } else setPaused(true);
      });
    } else {
      el.pause();
    }
  }, [active, visible, paused]);

  return (
    <div className={`relative h-full w-full bg-espresso ${className}`}>
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted={muted}
        loop
        playsInline
        preload={visible || active ? "metadata" : "none"}
        aria-label={label}
        onClick={() => {
          interacted.current = true;
          setPaused((p) => !p);
        }}
        className="h-full w-full cursor-pointer object-cover"
      />
      {paused && (
        <button
          type="button"
          onClick={() => {
            interacted.current = true;
            setPaused(false);
          }}
          aria-label="Play video"
          className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur"
        >
          <Play className="ml-1 h-7 w-7 fill-white" />
        </button>
      )}
      <div className={`absolute flex gap-2 ${controlsClassName}`}>
        {!paused && (
          <button
            type="button"
            onClick={() => setPaused(true)}
            aria-label="Pause video"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur"
          >
            <Pause className="h-4 w-4 fill-white" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Turn sound on" : "Mute"}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
