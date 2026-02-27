import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wand2, ImagePlus, Maximize, Layers, Loader2, ChevronDown, ChevronUp, X, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import * as fabric from 'fabric'

/**
 * AI Image Generation card — user-initiated only.
 * Uses Gemini API (key from env) to generate images from cosmic prompts.
 */
export function AiImageCard({ cosmicData, aiImage, addImageToCanvas, fillBackgroundWithImage, editor, slides, setSlides }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [prompt, setPrompt] = useState('')

  const { isGenerating, generatedImageUrl, error, progress, generateImage, clearImage } = aiImage

  // Pre-fill prompt from cosmic data when data changes
  const payload = cosmicData?.[0]
  const cosmicImagePrompt = payload?.daily_content_raw?.individual_horoscopes?.cosmic_image_prompt
  
  useEffect(() => {
    if (cosmicImagePrompt) {
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

  const handleSetAsBackgroundAll = () => {
    if (!generatedImageUrl || !editor || !slides || !setSlides) return
    const imgEl = new Image()
    imgEl.crossOrigin = 'anonymous'
    imgEl.onload = () => {
      const fabricImg = new fabric.FabricImage(imgEl, {
        originX: 'left',
        originY: 'top',
      })
      
      const dims = { width: editor.width || 1080, height: editor.height || 1080 }
      const scale = Math.max(dims.width / fabricImg.width, dims.height / fabricImg.height)
      
      fabricImg.set({
        scaleX: scale,
        scaleY: scale,
        originX: 'left',
        originY: 'top',
        left: 0,
        top: 0
      })
      
      // Update the active editor visually right away
      editor.backgroundImage = fabricImg
      editor.backgroundColor = null
      editor.renderAll()
      editor.fire('object:modified')
      
      // Prepare background JSON
      const bgJson = fabricImg.toObject(['crossOrigin'])
      
      // Update ALL slides natively
      const updatedSlides = slides.map(slideStr => {
        const slide = typeof slideStr === 'string' ? JSON.parse(slideStr) : slideStr
        const clone = JSON.parse(JSON.stringify(slide))
        clone.backgroundImage = bgJson
        clone.background = null // Remove any lingering background properties
        return clone
      })
      
      setSlides(updatedSlides)
    }
    imgEl.onerror = () => {
      alert('Failed to apply image to all slides.')
    }
    imgEl.src = generatedImageUrl
  }

  return (
    <Card className="bg-slate-900 border-slate-800 text-white shadow-xl overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Wand2 size={16} className="text-violet-400" />
          <span className="text-sm font-medium text-slate-300">AI Image Generator</span>
          <span className="text-[10px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">Gemini</span>
        </div>
        {isExpanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
      </button>

      {isExpanded && (
        <CardContent className="p-3 pt-0 flex flex-col gap-2 border-t border-slate-800">

          {/* Prompt textarea */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            className="w-full h-28 bg-slate-950/50 text-slate-300 p-3 text-xs sm:text-[13px] rounded-lg border border-slate-800 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 resize-none leading-relaxed"
          />

          {/* Generate button */}
          <Button
            onClick={() => generateImage(prompt)}
            disabled={isGenerating || !prompt.trim()}
            size="sm"
            className="w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white shadow-md border-0 disabled:opacity-50 rounded-lg"
          >
            {isGenerating ? (
              <><Loader2 size={14} className="mr-1.5 animate-spin" /> {progress}</>
            ) : (
              <><Wand2 size={14} className="mr-1.5" /> Generate</>
            )}
          </Button>

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
                <div className="flex gap-1">
                  <Button
                    onClick={handleSetAsBackground}
                    size="sm"
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-2"
                  >
                    <Maximize size={14} className="mr-1" /> BG
                  </Button>
                  <Button
                    onClick={handleSetAsBackgroundAll}
                    size="sm"
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-2"
                    title="Apply Background to All Slides"
                  >
                    <Layers size={14} className="mr-1" /> All
                  </Button>
                </div>
              </div>
            </div>
          )}

        </CardContent>
      )}
    </Card>
  )
}
