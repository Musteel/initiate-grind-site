// components/puzzle/video-player.tsx
'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { Play, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VideoSourceType } from '@/lib/supabase/types'

interface VideoPlayerProps {
  sourceType: VideoSourceType
  sourceRef: string
  pauseAt?: number | null          // seconds — pause here and fire onPause
  autoplay?: boolean
  onPause?: () => void             // called when the pause point is reached
  onEnded?: () => void
  className?: string
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
    Twitch: any
  }
}

// ============================================================
// YouTube Player
// ============================================================
function YouTubePlayer({
  videoId,
  pauseAt,
  autoplay,
  onPause,
  onEnded,
}: {
  videoId: string
  pauseAt?: number | null
  autoplay?: boolean
  onPause?: () => void
  onEnded?: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef    = useRef<any>(null)
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const pauseFiredRef = useRef(false)
  const [ready, setReady] = useState(false)

  const clearPoller = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startPoller = useCallback(() => {
    if (!pauseAt || pauseFiredRef.current) return
    clearPoller()
    intervalRef.current = setInterval(() => {
      if (!playerRef.current) return
      const current = playerRef.current.getCurrentTime?.() ?? 0
      if (current >= pauseAt && !pauseFiredRef.current) {
        pauseFiredRef.current = true
        playerRef.current.pauseVideo()
        clearPoller()
        onPause?.()
      }
    }, 200)
  }, [pauseAt, onPause, clearPoller])

  useEffect(() => {
    let isMounted = true

    function initPlayer() {
      if (!containerRef.current || !isMounted) return
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          autoplay: autoplay ? 1 : 0,
          enablejsapi: 1,
        },
        events: {
          onReady: () => {
            if (isMounted) setReady(true)
          },
          onStateChange: (e: any) => {
            // YT.PlayerState.PLAYING = 1
            if (e.data === 1) startPoller()
            // YT.PlayerState.ENDED = 0
            if (e.data === 0) {
              clearPoller()
              onEnded?.()
            }
          },
        },
      })
    }

    if (window.YT?.Player) {
      initPlayer()
    } else {
      // Load the IFrame Player API
      const existingScript = document.getElementById('yt-iframe-api')
      if (!existingScript) {
        const tag = document.createElement('script')
        tag.id  = 'yt-iframe-api'
        tag.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(tag)
      }
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        prev?.()
        initPlayer()
      }
    }

    return () => {
      isMounted = false
      clearPoller()
      try { playerRef.current?.destroy() } catch {}
    }
  }, [videoId, autoplay, startPoller, clearPoller, onEnded])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0f1114]">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      )}
    </div>
  )
}

// ============================================================
// Twitch Clip Player
// ============================================================
function TwitchPlayer({
  clipSlug,
  onEnded,
}: {
  clipSlug: string
  onEnded?: () => void
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const parent   = typeof window !== 'undefined'
    ? window.location.hostname
    : 'localhost'

  // Twitch clips don't expose a JS API for pause-at, so pauseAt is unsupported
  return (
    <iframe
      ref={iframeRef}
      src={`https://clips.twitch.tv/embed?clip=${clipSlug}&parent=${parent}&autoplay=false`}
      className="w-full h-full border-0"
      allowFullScreen
      allow="autoplay; fullscreen"
      title="Twitch clip"
    />
  )
}

// ============================================================
// Self-hosted / Supabase Storage Player
// ============================================================
function StoragePlayer({
  src,
  pauseAt,
  autoplay,
  onPause,
  onEnded,
}: {
  src: string
  pauseAt?: number | null
  autoplay?: boolean
  onPause?: () => void
  onEnded?: () => void
}) {
  const videoRef     = useRef<HTMLVideoElement>(null)
  const pauseFiredRef = useRef(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !pauseAt) return

    function handleTimeUpdate() {
      if (!video) return
      if (video.currentTime >= pauseAt! && !pauseFiredRef.current) {
        pauseFiredRef.current = true
        video.pause()
        onPause?.()
      }
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    return () => video.removeEventListener('timeupdate', handleTimeUpdate)
  }, [pauseAt, onPause])

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay={autoplay}
      controls
      className="w-full h-full object-contain bg-black"
      onEnded={onEnded}
      playsInline
    >
      Your browser does not support HTML5 video.
    </video>
  )
}

// ============================================================
// Outcome Player — plays after a decision is made
// Supports YouTube/Twitch/Storage, no pause logic needed
// ============================================================
export function OutcomePlayer({
  sourceType,
  sourceRef,
  autoplay = true,
  onEnded,
  className,
}: Omit<VideoPlayerProps, 'pauseAt' | 'onPause'>) {
  return (
    <VideoPlayer
      sourceType={sourceType}
      sourceRef={sourceRef}
      autoplay={autoplay}
      onEnded={onEnded}
      className={className}
    />
  )
}

// ============================================================
// Main VideoPlayer — exported default
// ============================================================
export function VideoPlayer({
  sourceType,
  sourceRef,
  pauseAt,
  autoplay = false,
  onPause,
  onEnded,
  className,
}: VideoPlayerProps) {
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-xl bg-black',
        'aspect-video',
        className
      )}
    >
      {sourceType === 'youtube' && (
        <YouTubePlayer
          videoId={sourceRef}
          pauseAt={pauseAt}
          autoplay={autoplay}
          onPause={onPause}
          onEnded={onEnded}
        />
      )}
      {sourceType === 'twitch' && (
        <TwitchPlayer
          clipSlug={sourceRef}
          onEnded={onEnded}
        />
      )}
      {sourceType === 'storage' && (
        <StoragePlayer
          src={sourceRef}
          pauseAt={pauseAt}
          autoplay={autoplay}
          onPause={onPause}
          onEnded={onEnded}
        />
      )}
    </div>
  )
}
