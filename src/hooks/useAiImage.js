import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Hook for generating AI images via Google's Gemini API securely through a Supabase Edge Function.
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
   * @param {string} aspectRatio - e.g., '1:1', '16:9', '9:16'
   */
  const generateImage = useCallback(async (prompt, aspectRatio = '1:1') => {
    if (!prompt?.trim()) {
      setError('Please enter a prompt.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedImageUrl(null)
    setProgress('Generating image through Cosmic Portal...')

    try {
      // Safely call the deployed edge function without exposing keys to the browser
      console.log('[useAiImage] Invoking Supabase edge function generate-image...')
      const enhancedPrompt = `Generate a beautiful, high-quality image representing: ${prompt.trim()}. Very important: only return an image, no text.`
      const { data, error: functionError } = await supabase.functions.invoke('generate-image', {
        body: { prompt: enhancedPrompt, aspectRatio },
      })

      if (functionError) {
        throw new Error(functionError.message || 'Edge function error.')
      }
      
      if (data?.error) {
         throw new Error(data.error)
      }

      // The Edge Function returns the raw Gemini response payload
      const parts = data?.candidates?.[0]?.content?.parts || []
      const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'))

      if (!imagePart) {
        const textPart = parts.find(p => p.text)
        console.warn('[Gemini] No image in response. Text:', textPart?.text)
        throw new Error(textPart?.text || 'No image was returned from the generator.')
      }

      // Convert base64 to data URL
      const { mimeType, data: base64Data } = imagePart.inlineData
      setGeneratedImageUrl(`data:${mimeType};base64,${base64Data}`)
      setProgress('Done!')
    } catch (e) {
      console.error('[useAiImage] Image generation failed:', e)
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
