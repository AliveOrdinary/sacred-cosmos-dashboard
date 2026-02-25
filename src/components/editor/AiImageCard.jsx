import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wand2, ImagePlus, Maximize, Loader2, ChevronDown, ChevronUp, X, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import * as fabric from 'fabric'

/**
 * AI Image Generation card — user-initiated only.
 * Uses Gemini API (key from env) to generate images from cosmic prompts.
 */
export function AiImageCard({ cosmicData, aiImage, addImageToCanvas, fillBackgroundWithImage, editor }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [prompt, setPrompt] = useState('')

  const { isGenerating, generatedImageUrl, error, progress, generateImage, clearImage } = aiImage

  // Pre-fill prompt from cosmic data when data changes
  const payload = cosmicData?.[0]
  const cosmicImagePrompt = payload?.daily_content_raw?.individual_horoscopes?.cosmic_image_prompt
  const shortImagePrompt = payload?.daily_content_raw?.image_prompt

  useEffect(() => {
    if (cosmicImagePrompt && !prompt) {
      setPrompt(cosmicImagePrompt)
    }
  }, [cosmicImagePrompt])

  const handleAddToCanvas = () => {
    if (!generatedImageUrl || !editor) return
    const imgEl = new Image()
    imgEl.crossOrigin = 'anonymous'
    imgEl.onload = () => {
      const fabricImg = new fabric.FabricImage(imgEl, {
        originX: 'left',
        originY: 'top',
        left: 50,
        top: 50,
      })
      const maxW = editor.width * 0.8
      const maxH = editor.height * 0.8
      const scale = Math.min(maxW / fabricImg.width, maxH / fabricImg.height)
      fabricImg.scale(scale)
      editor.add(fabricImg)
      editor.setActiveObject(fabricImg)
      editor.renderAll()
    }
    imgEl.onerror = () => {
      alert('Failed to load the generated image. The URL may have expired — try generating again.')
    }
    imgEl.src = generatedImageUrl
  }

  const handleSetAsBackground = () => {
    if (!generatedImageUrl || !fillBackgroundWithImage) return
    const imgEl = new Image()
    imgEl.crossOrigin = 'anonymous'
    imgEl.onload = () => {
      const fabricImg = new fabric.FabricImage(imgEl, {
        originX: 'left',
        originY: 'top',
      })
      editor.add(fabricImg)
      editor.setActiveObject(fabricImg)
      fillBackgroundWithImage()
    }
    imgEl.onerror = () => {
      alert('Failed to load the generated image.')
    }
    imgEl.src = generatedImageUrl
  }

  return (
    <Card className="bg-slate-900 border-slate-800 text-white shadow-xl overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Wand2 size={16} className="text-violet-400" />
          <span className="text-sm font-medium text-slate-300">AI Image Generator</span>
          <span className="text-[10px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">Gemini</span>
        </div>
        {isExpanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
      </button>

      {isExpanded && (
        <CardContent className="p-4 pt-0 flex flex-col gap-3 border-t border-slate-800">

          {/* Quick-fill buttons */}
          {(cosmicImagePrompt || shortImagePrompt) && (
            <div className="flex gap-1.5 flex-wrap mt-3">
              {cosmicImagePrompt && (
                <button
                  onClick={() => setPrompt(cosmicImagePrompt)}
                  className={`text-[10px] px-2 py-1 rounded border transition-colors ${prompt === cosmicImagePrompt ? 'border-violet-500 bg-violet-500/20 text-violet-300' : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}
                >
                  🎨 Cosmic Scene
                </button>
              )}
              {shortImagePrompt && (
                <button
                  onClick={() => setPrompt(shortImagePrompt)}
                  className={`text-[10px] px-2 py-1 rounded border transition-colors ${prompt === shortImagePrompt ? 'border-violet-500 bg-violet-500/20 text-violet-300' : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}
                >
                  🕉️ Vedic Short
                </button>
              )}
            </div>
          )}

          {/* Prompt textarea */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            className="w-full h-20 bg-slate-950 text-slate-300 p-3 text-xs rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none leading-relaxed"
          />

          {/* Generate button */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => generateImage(prompt)}
              disabled={isGenerating || !prompt.trim()}
              size="sm"
              className="flex-1 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white shadow-lg border-0 disabled:opacity-50"
            >
              {isGenerating ? (
                <><Loader2 size={14} className="mr-1.5 animate-spin" /> {progress}</>
              ) : (
                <><Wand2 size={14} className="mr-1.5" /> Generate</>
              )}
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg p-2.5 border border-red-500/20">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Generated image preview */}
          {generatedImageUrl && (
            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4">
              <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
                <img
                  src={generatedImageUrl}
                  alt="AI Generated"
                  className="w-full h-auto max-h-64 object-contain"
                />
                <button
                  onClick={clearImage}
                  className="absolute top-2 right-2 p-1 rounded-full bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleAddToCanvas}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white border-0"
                >
                  <ImagePlus size={14} className="mr-1.5" /> Add to Canvas
                </Button>
                <Button
                  onClick={handleSetAsBackground}
                  size="sm"
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <Maximize size={14} className="mr-1.5" /> Set as BG
                </Button>
              </div>
            </div>
          )}

        </CardContent>
      )}
    </Card>
  )
}
