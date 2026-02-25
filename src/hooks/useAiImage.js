import { useState, useCallback } from 'react'

// Proxied through Vite dev server (see vite.config.js) to bypass CORS
const API_BASE = '/api/gemini'
const MODEL = 'gemini-2.5-flash-image'
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''

/**
 * Hook for generating AI images via Google's Gemini API.
 * Completely user-initiated — no automatic generation.
 */
export function useAiImage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState('')

  /**
   * Generate an image from a text prompt via Gemini.
   * @param {string} prompt - The text prompt
   */
  const generateImage = useCallback(async (prompt) => {
    if (!API_KEY) {
      setError('Gemini API key not configured. Add VITE_GEMINI_API_KEY to .env.local')
      return
    }
    if (!prompt?.trim()) {
      setError('Please enter a prompt.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedImageUrl(null)
    setProgress('Generating...')

    try {
      const res = await fetch(
        `${API_BASE}/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt.trim() }],
            }],
            generationConfig: {
              responseModalities: ['IMAGE', 'TEXT'],
            },
          }),
        }
      )

      if (!res.ok) {
        const errText = await res.text()
        console.error('[Gemini] HTTP error:', res.status, errText)
        if (res.status === 400) throw new Error('Invalid request. Check your API key and prompt.')
        if (res.status === 403) throw new Error('API key lacks permissions. Enable "Generative Language API" in Google Cloud Console.')
        if (res.status === 429) throw new Error('Rate limit exceeded. Please wait a moment and try again.')
        throw new Error(`API error ${res.status}: ${errText.slice(0, 200)}`)
      }

      const json = await res.json()
      console.log('[Gemini] Response received')

      // Extract image from response parts
      const parts = json.candidates?.[0]?.content?.parts || []
      const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'))

      if (!imagePart) {
        const textPart = parts.find(p => p.text)
        console.warn('[Gemini] No image in response. Text:', textPart?.text)
        throw new Error(textPart?.text || 'No image was generated. Try a different prompt.')
      }

      // Convert base64 to data URL
      const { mimeType, data } = imagePart.inlineData
      const dataUrl = `data:${mimeType};base64,${data}`
      setGeneratedImageUrl(dataUrl)
      setProgress('Done!')
    } catch (e) {
      console.error('[Gemini] Image generation failed:', e)
      setError(e.message)
      setProgress('')
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const clearImage = useCallback(() => {
    setGeneratedImageUrl(null)
    setError(null)
    setProgress('')
  }, [])

  return {
    isGenerating,
    generatedImageUrl,
    error,
    progress,
    generateImage,
    clearImage,
  }
}
