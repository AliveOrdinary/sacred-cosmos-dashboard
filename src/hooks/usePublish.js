import { useState, useCallback } from 'react'
import * as fabric from 'fabric'
import { supabase } from '@/lib/supabase'

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_PUBLISH_WEBHOOK_URL

const STORY_WIDTH = 1080
const STORY_HEIGHT = 1920
const STORY_BG = '#0B0914'

/**
 * Draws a square slide export centered on a 9:16 (1080x1920) canvas with the
 * cosmic dark background, so stories look intentional instead of letterboxed
 * by Instagram/Facebook.
 */
async function compositeStoryFrame(squareDataURL) {
  const img = new Image()
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = () => reject(new Error('Failed to load slide image for story compositing'))
    img.src = squareDataURL
  })

  const storyCanvas = document.createElement('canvas')
  storyCanvas.width = STORY_WIDTH
  storyCanvas.height = STORY_HEIGHT
  const ctx = storyCanvas.getContext('2d')

  ctx.fillStyle = STORY_BG
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT)

  // Scale to fit, centered
  const scale = Math.min(STORY_WIDTH / img.width, STORY_HEIGHT / img.height)
  const w = img.width * scale
  const h = img.height * scale
  ctx.drawImage(img, (STORY_WIDTH - w) / 2, (STORY_HEIGHT - h) / 2, w, h)

  return storyCanvas.toDataURL('image/jpeg', 0.92)
}

/**
 * Hook that manages the full Publish flow:
 *   1. Export each slide as a PNG blob from a headless Fabric.StaticCanvas
 *   2. Upload each blob to the public `social-images` Supabase Storage bucket
 *   3. POST { caption, image_urls, platforms } to the n8n webhook
 */
export function usePublish() {
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishStatus, setPublishStatus] = useState(null) // null | 'success' | 'error'
  const [publishMessage, setPublishMessage] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState(['instagram', 'facebook'])
  const [postType, setPostType] = useState('feed') // 'feed' | 'story'

  const togglePlatform = useCallback((platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    )
  }, [])

  /**
   * Main publish function.
   * @param {object} editor - Active Fabric.Canvas instance
   * @param {Array} slides - Array of slide JSON states
   * @param {number} currentIndexRef - ref.current of the active slide index (for saving latest state)
   * @param {string} caption - The caption text to send
   */
  const publish = useCallback(
    async ({ editor, slides, currentIndexRef, caption }) => {
      if (!editor) {
        setPublishStatus('error')
        setPublishMessage('Canvas not ready.')
        return
      }
      if (selectedPlatforms.length === 0) {
        setPublishStatus('error')
        setPublishMessage('Select at least one platform.')
        return
      }
      if (!N8N_WEBHOOK_URL) {
        setPublishStatus('error')
        setPublishMessage('Missing VITE_N8N_PUBLISH_WEBHOOK_URL in .env.local')
        return
      }

      setIsPublishing(true)
      setPublishStatus(null)
      setPublishMessage('Exporting slides…')

      try {
        // Snapshot the current slide before exporting
        const allSlides = [...slides]
        allSlides[currentIndexRef.current] = editor.toJSON(['id'])

        const { width = 1080, height = 1080 } = editor
        const exportCanvas = new fabric.StaticCanvas(null, {
          width,
          height,
          backgroundColor: '#0B0914',
        })

        const imageUrls = []

        for (let i = 0; i < allSlides.length; i++) {
          setPublishMessage(`Uploading slide ${i + 1} of ${allSlides.length}…`)

          // Render slide on the headless canvas
          await exportCanvas.loadFromJSON(allSlides[i])
          exportCanvas.renderAll()

          // Convert to blob — for stories, re-composite the square onto a 9:16 frame
          let dataURL = exportCanvas.toDataURL({ format: 'jpeg', quality: 0.92, multiplier: 1 })
          if (postType === 'story') {
            dataURL = await compositeStoryFrame(dataURL)
          }
          const base64 = dataURL.replace(/^data:image\/\w+;base64,/, '')
          const binary = atob(base64)
          const bytes = new Uint8Array(binary.length)
          for (let b = 0; b < binary.length; b++) bytes[b] = binary.charCodeAt(b)
          const blob = new Blob([bytes], { type: 'image/jpeg' })

          // Unique filename — timestamp + index so re-publishes don't collide
          const filename = `${Date.now()}-slide-${i + 1}.jpg`

          const { error: uploadError } = await supabase.storage
            .from('social-images')
            .upload(filename, blob, { contentType: 'image/jpeg', upsert: false })

          if (uploadError) throw new Error(`Upload failed for slide ${i + 1}: ${uploadError.message}`)

          const { data: urlData } = supabase.storage.from('social-images').getPublicUrl(filename)
          imageUrls.push(urlData.publicUrl)
        }

        exportCanvas.dispose()

        // POST to n8n — fire and forget (n8n has a Wait node so connection stays open too long)
        // We use a short timeout: if n8n responds within 10s great, if it times out we still succeed
        // because the request was already delivered (keepalive ensures it finishes even if we abort).
        setPublishMessage('Sending to n8n…')
        const payload = { caption, image_urls: imageUrls, platforms: selectedPlatforms, post_type: postType }
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10_000)

        try {
          const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
            keepalive: true,
          })
          clearTimeout(timeoutId)
          if (!response.ok) {
            const text = await response.text().catch(() => response.statusText)
            throw new Error(`n8n responded with ${response.status}: ${text}`)
          }
        } catch (fetchErr) {
          clearTimeout(timeoutId)
          // AbortError just means n8n is still running its pipeline (expected with Wait node)
          if (fetchErr.name !== 'AbortError') throw fetchErr
        }

        setPublishStatus('success')
        const noun = postType === 'story'
          ? `stor${allSlides.length !== 1 ? 'ies' : 'y'}`
          : `slide${allSlides.length !== 1 ? 's' : ''}`
        setPublishMessage(`Published ${allSlides.length} ${noun}! n8n is processing in the background.`)

      } catch (err) {
        console.error('[usePublish]', err)
        setPublishStatus('error')
        setPublishMessage(err.message)
      } finally {
        setIsPublishing(false)
      }
    },
    [selectedPlatforms, postType]
  )

  const resetPublishStatus = useCallback(() => {
    setPublishStatus(null)
    setPublishMessage('')
  }, [])

  return {
    isPublishing,
    publishStatus,
    publishMessage,
    selectedPlatforms,
    togglePlatform,
    postType,
    setPostType,
    publish,
    resetPublishStatus,
  }
}
