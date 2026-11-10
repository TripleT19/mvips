"use client";

import { useEffect, useRef } from "react";

export type VideoSource =
  | { type: "youtube"; id: string }
  | { type: "file"; src: string; poster?: string }
  | null;

/* ---------- Shared registry so sibling players pause each other ---------- */

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

/* ---------- YouTube IFrame API singleton ---------- */

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
  video: VideoSource;
  title: string;
};

export default function VideoPlayer({ video, title }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const nativeVideoRef = useRef<HTMLVideoElement | null>(null);

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

  useEffect(() => {
    const self = pausableRef.current!;
    registry.add(self);
    return () => {
      registry.delete(self);
    };
  }, []);

  const youtubeId = video?.type === "youtube" ? video.id.trim() : null;

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
        host: "https://www.youtube-nocookie.com",
        width: "100%",
        height: "100%",
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
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

  const handleNativePlay = () => {
    if (pausableRef.current) pauseOthers(pausableRef.current);
  };

  if (!video) return null;

  if (video.type === "youtube") {
    if (!video.id.trim()) return null;
    return (
      <div
        ref={containerRef}
        className="video-player"
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