import { useEffect, useRef } from 'react'

const FADE_DURATION_MS = 500
const FADE_OUT_LEAD_S = 0.55
const RESTART_DELAY_MS = 100

/**
 * Drives the hero video's crossfade loop. `enabled` also gates whether the
 * video is loaded at all: callers should render <source> children only when
 * enabled, and this hook calls video.load() to pick up/drop them.
 */
export function useVideoFadeLoop(enabled: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const fadingOutRef = useRef(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (!enabled) {
      video.pause()
      video.load()
      video.style.opacity = '1'
      return
    }

    const fade = (to: number) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      const from = parseFloat(getComputedStyle(video).opacity) || 0
      const start = performance.now()

      const step = (now: number) => {
        const progress = Math.min(1, (now - start) / FADE_DURATION_MS)
        video.style.opacity = String(from + (to - from) * progress)
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step)
        } else {
          rafRef.current = null
        }
      }
      rafRef.current = requestAnimationFrame(step)
    }

    const handleLoadedData = () => {
      fadingOutRef.current = false
      fade(1)
    }

    const handleTimeUpdate = () => {
      if (
        !fadingOutRef.current &&
        video.duration &&
        video.currentTime >= video.duration - FADE_OUT_LEAD_S
      ) {
        fadingOutRef.current = true
        fade(0)
      }
    }

    const handleEnded = () => {
      video.style.opacity = '0'
      window.setTimeout(() => {
        video.currentTime = 0
        video.play().catch(() => {})
        fadingOutRef.current = false
        fade(1)
      }, RESTART_DELAY_MS)
    }

    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)
    video.load()
    video.play().catch(() => {})

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [enabled])

  return videoRef
}
