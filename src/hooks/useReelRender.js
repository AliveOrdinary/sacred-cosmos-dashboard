import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const POLL_MS = 6000
const POLL_MAX = 100 // ~10 minutes

const EMPTY = { status: 'idle', videoUrl: null, caption: '', error: null, date: null }

/**
 * Manages the daily reel render: trigger via /api/render (Netlify -> n8n ->
 * render server) and poll the reel_renders table for the result.
 *
 * Publishing is deliberately absent. Trial Reels — the only way to get cold
 * non-follower data at this account size — cannot be posted through the Graph
 * API, so the reel is posted by hand from the phone.
 */
export function useReelRender(composition = 'daily') {
  const [job, setJob] = useState({ ...EMPTY })
  const timers = useRef({})

  const patch = useCallback((fields) => setJob((prev) => ({ ...prev, ...fields })), [])

  const fetchLatest = useCallback(async () => {
    const { data } = await supabase
      .from('reel_renders')
      .select('status, video_url, caption, error, date')
      .eq('composition', composition)
      .order('created_at', { ascending: false })
      .limit(1)
    return data && data.length ? data[0] : null
  }, [composition])

  // Restore latest state on mount so the preview survives a reload.
  useEffect(() => {
    let alive = true
    ;(async () => {
      const row = await fetchLatest()
      if (!alive || !row) return
      patch({
        status: row.status === 'done' ? 'done' : row.status === 'error' ? 'error' : 'idle',
        videoUrl: row.video_url,
        caption: row.caption || '',
        error: row.error,
        date: row.date || null,
      })
    })()
    const t = timers.current
    return () => {
      alive = false
      Object.values(t).forEach(clearInterval)
    }
  }, [fetchLatest, patch])

  const requestRender = useCallback(async () => {
    patch({ status: 'rendering', error: null })
    try {
      await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ composition }),
      })
    } catch {
      // proxy is fire-and-forget; polling decides the real outcome
    }

    clearInterval(timers.current.job)
    let ticks = 0
    timers.current.job = setInterval(async () => {
      ticks += 1
      const row = await fetchLatest()
      if (row?.status === 'done' && row.video_url) {
        clearInterval(timers.current.job)
        patch({
          status: 'done',
          videoUrl: row.video_url,
          caption: row.caption || '',
          error: null,
          date: row.date || null,
        })
      } else if (row?.status === 'error') {
        clearInterval(timers.current.job)
        patch({ status: 'error', error: row.error || 'Render failed' })
      } else if (ticks >= POLL_MAX) {
        clearInterval(timers.current.job)
        patch({ status: 'error', error: 'Timed out waiting for the render server.' })
      }
    }, POLL_MS)
  }, [composition, fetchLatest, patch])

  return { job, requestRender }
}
