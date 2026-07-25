import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const PUBLISH_WEBHOOK = import.meta.env.VITE_N8N_PUBLISH_WEBHOOK_URL
const POLL_MS = 6000
const POLL_MAX = 100 // ~10 minutes

const EMPTY = { status: 'idle', videoUrl: null, caption: '', error: null, publishState: null }

/**
 * Manages reel renders: trigger via /api/render (Netlify -> n8n -> render
 * server), poll the reel_renders table for the result, publish via the same
 * n8n publisher webhook the image flow uses (post_type: 'reel').
 */
export function useReelRender() {
  const [jobs, setJobs] = useState({ manifestation: { ...EMPTY }, elements: { ...EMPTY } })
  const timers = useRef({})

  const patch = useCallback((composition, fields) => {
    setJobs((prev) => ({ ...prev, [composition]: { ...prev[composition], ...fields } }))
  }, [])

  const fetchLatest = useCallback(async (composition) => {
    const { data } = await supabase
      .from('reel_renders')
      .select('status, video_url, caption, error, date')
      .eq('composition', composition)
      .order('created_at', { ascending: false })
      .limit(1)
    return data && data.length ? data[0] : null
  }, [])

  // Restore latest state on mount so previews survive reloads.
  useEffect(() => {
    let alive = true
    ;['manifestation', 'elements'].forEach(async (c) => {
      const row = await fetchLatest(c)
      if (!alive || !row) return
      patch(c, {
        status: row.status === 'done' ? 'done' : row.status === 'error' ? 'error' : 'idle',
        videoUrl: row.video_url,
        caption: row.caption || '',
        error: row.error,
      })
    })
    const t = timers.current
    return () => {
      alive = false
      Object.values(t).forEach(clearInterval)
    }
  }, [fetchLatest, patch])

  const requestRender = useCallback(
    async (composition) => {
      patch(composition, { status: 'rendering', error: null, publishState: null })
      try {
        await fetch('/api/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ composition }),
        })
      } catch {
        // proxy is fire-and-forget; polling decides the real outcome
      }

      clearInterval(timers.current[composition])
      let ticks = 0
      timers.current[composition] = setInterval(async () => {
        ticks += 1
        const row = await fetchLatest(composition)
        if (row?.status === 'done' && row.video_url) {
          clearInterval(timers.current[composition])
          patch(composition, { status: 'done', videoUrl: row.video_url, caption: row.caption || '', error: null })
        } else if (row?.status === 'error') {
          clearInterval(timers.current[composition])
          patch(composition, { status: 'error', error: row.error || 'Render failed' })
        } else if (ticks >= POLL_MAX) {
          clearInterval(timers.current[composition])
          patch(composition, { status: 'error', error: 'Timed out waiting for the render server.' })
        }
      }, POLL_MS)
    },
    [fetchLatest, patch]
  )

  const setCaption = useCallback((composition, caption) => patch(composition, { caption }), [patch])

  const publishReel = useCallback(
    async (composition, platforms) => {
      const job = jobs[composition]
      if (!job.videoUrl || !PUBLISH_WEBHOOK) return
      patch(composition, { publishState: 'publishing' })
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10_000)
        const res = await fetch(PUBLISH_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            post_type: 'reel',
            video_url: job.videoUrl,
            caption: job.caption,
            platforms,
            image_urls: [],
          }),
          signal: controller.signal,
          keepalive: true,
        }).catch((e) => {
          if (e.name !== 'AbortError') throw e
          return { ok: true } // n8n still processing (Wait/poll nodes) — expected
        })
        clearTimeout(timeoutId)
        if (!res.ok) throw new Error('Publisher responded ' + res.status)
        patch(composition, { publishState: 'published' })
      } catch (e) {
        console.error('Reel publish failed:', e)
        patch(composition, { publishState: 'failed' })
      }
    },
    [jobs, patch]
  )

  return { jobs, requestRender, setCaption, publishReel }
}
