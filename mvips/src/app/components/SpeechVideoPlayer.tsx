"use client";

import { useEffect, useRef } from "react";

type SpeechVideo =
  | { type: "youtube"; id: string }
  | { type: "file"; src: string; poster?: string }
  | null;

/* ---------- Shared registry so siblings pause each other ---------- */

type Pausable = { pause: () => void };
const registry = new Set<Pausable>();

function pauseOthers(except: Pausable) {
  registry.forEach((p) => {
    if (p === except) return;
    try {
      p.pause();
    } catch {
      /* noop */
    }
  });
}

/* ---------- YouTube IFrame API singleton loader ---------- */

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<void> | null = null;

function loadYouTubeAPI(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise<void>((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previous === "function") previous();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  });

  return ytApiPromise;
}

/* ---------- Component ---------- */

type Props = {
  video: SpeechVideo;
  title: string;
};

export default function SpeechVideoPlayer({ video, title }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const nativeVideoRef = useRef<HTMLVideoElement | null>(null);

  /* Stable "pausable" descriptor pointing at whichever player exists */
  const pausableRef = useRef<Pausable | null>(null);
  if (pausableRef.current === null) {
    pausableRef.current = {
      pause: () => {
        const yt = ytPlayerRef.current;
        if (yt?.pauseVideo) {
          try {
            yt.pauseVideo();
          } catch {
            /* noop */
          }
          return;
        }
        const nv = nativeVideoRef.current;
        if (nv) {
          try {
            nv.pause();
          } catch {
            /* noop */
          }
        }
      },
    };
  }

  /* Join the global registry on mount, leave on unmount */
  useEffect(() => {
    const self = pausableRef.current!;
    registry.add(self);
    return () => {
      registry.delete(self);
    };
  }, []);

  const youtubeId = video?.type === "youtube" ? video.id.trim() : null;

  /* ---------- YouTube path ---------- */
  useEffect(() => {
    if (!youtubeId) return;
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    const mount = document.createElement("div");
    mount.style.width = "100%";
    mount.style.height = "100%";
    container.appendChild(mount);

    loadYouTubeAPI().then(() => {
      if (cancelled) return;
      if (!window.YT?.Player) return;

      const player = new window.YT.Player(mount, {
        videoId: youtubeId,
        // Privacy-enhanced embed domain
        host: "https://www.youtube-nocookie.com",
        width: "100%",
        height: "100%",
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            if (!cancelled) ytPlayerRef.current = player;
          },
          onStateChange: (event: any) => {
            if (
              window.YT &&
              event.data === window.YT.PlayerState.PLAYING &&
              ytPlayerRef.current &&
              pausableRef.current
            ) {
              // 🔇 Pause every other player as soon as this one plays
              pauseOthers(pausableRef.current);
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      const p = ytPlayerRef.current;
      if (p) {
        try {
          p.destroy();
        } catch {
          /* noop */
        }
        ytPlayerRef.current = null;
      }
      if (mount.parentNode) mount.parentNode.removeChild(mount);
    };
  }, [youtubeId]);

  /* ---------- Native <video> path ---------- */
  const handleNativePlay = () => {
    if (pausableRef.current) pauseOthers(pausableRef.current);
  };

  if (!video) return null;

  if (video.type === "youtube") {
    if (!video.id.trim()) return null;
    return (
      <div
        ref={containerRef}
        className="speech-video-player"
        aria-label={title}
        role="region"
      />
    );
  }

  return (
    <video
      ref={nativeVideoRef}
      src={video.src}
      poster={video.poster}
      controls
      playsInline
      preload="metadata"
      onPlay={handleNativePlay}
      title={title}
      className="absolute inset-0 h-full w-full bg-black object-cover"
    >
      Your browser does not support the video tag.
    </video>
  );
}