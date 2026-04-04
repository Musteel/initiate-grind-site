// components/submit/video-source-picker.tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Youtube, Tv2, Upload, X, //CheckCircle2,
  Loader2, AlertCircle, Film,
} from 'lucide-react'
import { cn, parseYouTubeUrl, parseTwitchClipUrl } from '@/lib/utils'
import { VideoPlayer } from '@/components/puzzle/video-player'
import type { VideoSourceType } from '@/lib/supabase'

interface VideoSourcePickerProps {
  label:        string
  sourceType:   VideoSourceType | ''
  sourceRef:    string
  onSourceChange: (type: VideoSourceType, ref: string) => void
  onClear:      () => void
  hint?:        string
}

type Tab = 'youtube' | 'twitch' | 'storage'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'youtube', label: 'YouTube',  icon: <Youtube className="w-4 h-4" /> },
  { id: 'twitch',  label: 'Twitch',   icon: <Tv2 className="w-4 h-4" /> },
  { id: 'storage', label: 'Upload',   icon: <Upload className="w-4 h-4" /> },
]

export function VideoSourcePicker({
  label,
  sourceType,
  sourceRef,
  onSourceChange,
  onClear,
  hint,
}: VideoSourcePickerProps) {
  const [activeTab, setActiveTab] = useState<Tab>(
    (sourceType as Tab) || 'youtube'
  )
  const [urlInput,    setUrlInput]    = useState('')
  const [urlError,    setUrlError]    = useState<string | null>(null)
  const [uploadState, setUploadState] = useState<
    'idle' | 'uploading' | 'done' | 'error'
  >('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError,    setUploadError]    = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasSource = !!sourceType && !!sourceRef

  // ── URL parsing ──────────────────────────────────────────

  function handleUrlSubmit() {
    setUrlError(null)
    const trimmed = urlInput.trim()
    if (!trimmed) return

    if (activeTab === 'youtube') {
      const id = parseYouTubeUrl(trimmed)
      if (!id) {
        setUrlError('Could not extract a YouTube video ID from that URL.')
        return
      }
      onSourceChange('youtube', id)
      setUrlInput('')
    } else if (activeTab === 'twitch') {
      const slug = parseTwitchClipUrl(trimmed)
      if (!slug) {
        setUrlError('Could not extract a Twitch clip slug. Use a clips.twitch.tv or twitch.tv/*/clip/* URL.')
        return
      }
      onSourceChange('twitch', slug)
      setUrlInput('')
    }
  }

  // ── File upload ──────────────────────────────────────────

  const handleFileSelect = useCallback(async (file: File) => {
    setUploadError(null)
    setUploadState('uploading')
    setUploadProgress(0)

    try {
      // 1. Request a signed upload URL from our API
      const res = await fetch('/api/storage/upload-url', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          filename:    file.name,
          contentType: file.type,
          fileSize:    file.size,
        }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Failed to get upload URL')
      }

      const { uploadUrl, storagePath } = await res.json()

      // 2. Upload directly to Supabase Storage via XHR (for progress)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100))
          }
        })
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error(`Upload failed: ${xhr.statusText}`))
        })
        xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.send(file)
      })

      setUploadState('done')
      setUploadProgress(100)
      onSourceChange('storage', storagePath)
    } catch (err: any) {
      setUploadState('error')
      setUploadError(err?.message ?? 'Upload failed')
    }
  }, [onSourceChange])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-300 block">
        {label}
      </label>

      {hint && !hasSource && (
        <p className="text-xs text-slate-600">{hint}</p>
      )}

      {/* Active source preview */}
      {hasSource ? (
        <div className="space-y-2">
          <VideoPlayer
            sourceType={sourceType as VideoSourceType}
            sourceRef={sourceRef}
            className="rounded-xl overflow-hidden"
          />
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Remove video
          </button>
        </div>
      ) : (
        <div className="rounded-xl bg-[#0a0b0d] border border-white/8 overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-white/6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setActiveTab(tab.id); setUrlError(null) }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors flex-1 justify-center',
                  activeTab === tab.id
                    ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-500/5'
                    : 'text-slate-500 hover:text-slate-300'
                )}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-4">
            {/* YouTube / Twitch URL input */}
            {(activeTab === 'youtube' || activeTab === 'twitch') && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  {activeTab === 'youtube'
                    ? 'Paste a YouTube video URL (e.g. https://youtube.com/watch?v=…)'
                    : 'Paste a Twitch clip URL (e.g. https://clips.twitch.tv/… or twitch.tv/*/clip/*)'}
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => { setUrlInput(e.target.value); setUrlError(null) }}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlSubmit())}
                    placeholder={
                      activeTab === 'youtube'
                        ? 'https://youtube.com/watch?v=dQw4w9WgXcQ'
                        : 'https://clips.twitch.tv/SlugHere'
                    }
                    className="flex-1 h-10 rounded-lg px-3 text-sm bg-slate-900 border border-white/8 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
                  />
                  <button
                    type="button"
                    onClick={handleUrlSubmit}
                    disabled={!urlInput.trim()}
                    className="px-4 h-10 rounded-lg bg-amber-500 text-slate-950 text-sm font-semibold hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Use
                  </button>
                </div>
                {urlError && (
                  <p className="flex items-start gap-1.5 text-xs text-red-400">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {urlError}
                  </p>
                )}
              </div>
            )}

            {/* File upload */}
            {activeTab === 'storage' && (
              <div>
                {uploadState === 'uploading' ? (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
                    <div className="w-full max-w-xs">
                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span>Uploading…</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-amber-500 transition-all duration-150"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : uploadState === 'error' ? (
                  <div className="text-center py-6">
                    <AlertCircle className="w-7 h-7 text-red-400 mx-auto mb-2" />
                    <p className="text-sm text-red-400 mb-3">{uploadError}</p>
                    <button
                      type="button"
                      onClick={() => { setUploadState('idle'); setUploadError(null) }}
                      className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                      'border-white/10 hover:border-amber-500/40 hover:bg-amber-500/3'
                    )}
                  >
                    <Film className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-400 mb-1">
                      Drop a video file here, or <span className="text-amber-400">click to browse</span>
                    </p>
                    <p className="text-xs text-slate-600">
                      MP4, WebM, MOV — max 500MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/mov,video/quicktime,video/x-matroska"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileSelect(file)
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
