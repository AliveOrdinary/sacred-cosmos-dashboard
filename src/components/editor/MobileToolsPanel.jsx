import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Type, Image as ImageIcon, Square, Circle, Triangle,
  ChevronUp, ChevronDown, Copy, Trash2, Maximize,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Sparkles, Smartphone, RectangleHorizontal,
  Wand2, ImagePlus, Layers, Loader2, X, AlertCircle,
  Check, Flame, Stars, Film, CalendarDays, Calendar,
  BookOpen, Flower2, MessageSquare, Target
} from 'lucide-react'
import { ICON_LIBRARY, FONTS, COLORS, GRADIENTS, BACKGROUND_COLORS } from '@/lib/constants'
import { ZODIAC_SIGNS } from '@/lib/constants'
import * as fabric from 'fabric'

// ─── SECTION LABEL ───
function Label({ children }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 px-1">
      {children}
    </span>
  )
}

// ─── HORIZONTAL SCROLL STRIP ───
function HScroll({ children, className = '' }) {
  return (
    <div className={`flex gap-2 overflow-x-auto scrollbar-hide snap-x px-1 ${className}`}>
      {children}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
//  GENERATE PANEL
// ═══════════════════════════════════════════════════════
function GeneratePanel({ cosmicData, addText, handlers }) {
  if (!cosmicData || cosmicData.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500 text-sm">
        No cosmic data loaded
      </div>
    )
  }

  const payload = cosmicData[0]
  const horoscopes = payload.daily_content_raw?.individual_horoscopes
  const hasStories = payload.instagram_stories?.length > 0
  const hasWeekly = payload.weekly_content_raw?.weekly_theme && ZODIAC_SIGNS.some(s => payload.weekly_content_raw[s.key])
  const hasPractice = !!horoscopes?.spiritual_practice
  const hasManifest = !!(payload.daily_content_raw?.manifestation_focus || horoscopes?.manifestation_focus)
  const hasDailyOverview = !!horoscopes

  const dateMatch = payload.master_social_post?.match(/(?:Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),?\s+\w+\s+\d{1,2},?\s+\d{4}/i)
  const dateLabel = dateMatch ? dateMatch[0] : (payload.date || new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }))

  // Build button list
  const buttons = []

  if (payload.element_content_raw?.manifestation_posts) {
    buttons.push({ label: 'Manifestation', icon: Sparkles, gradient: 'from-amber-500 to-amber-700', onClick: handlers.handleGenerateCarousel })
  }
  if (payload.element_content_raw) {
    buttons.push({ label: 'Elements', icon: Flame, gradient: 'from-emerald-500 to-teal-700', onClick: handlers.handleGenerateElementPosts })
  }
  if (horoscopes) {
    buttons.push({ label: 'Signs ♈–♍', icon: Stars, gradient: 'from-indigo-500 to-purple-700', onClick: () => handlers.handleGenerateSignCarousel(1) })
    buttons.push({ label: 'Signs ♎–♓', icon: Stars, gradient: 'from-purple-600 to-indigo-800', onClick: () => handlers.handleGenerateSignCarousel(2) })
  }
  if (hasStories) {
    buttons.push({ label: 'Stories', icon: Film, gradient: 'from-pink-500 to-rose-700', onClick: handlers.handleGenerateStories })
  }
  if (hasWeekly) {
    buttons.push({ label: 'Weekly ♈–♍', icon: Calendar, gradient: 'from-blue-500 to-indigo-700', onClick: () => handlers.handleGenerateWeeklyCarousel(1) })
    buttons.push({ label: 'Weekly ♎–♓', icon: Calendar, gradient: 'from-indigo-600 to-blue-800', onClick: () => handlers.handleGenerateWeeklyCarousel(2) })
    buttons.push({ label: 'Week Overview', icon: BookOpen, gradient: 'from-purple-600 to-fuchsia-500', onClick: handlers.handleGenerateWeeklyOverview })
    buttons.push({ label: 'Week Challenge', icon: Target, gradient: 'from-pink-600 to-rose-500', onClick: handlers.handleGenerateWeeklyChallenge })
  }
  if (hasPractice) {
    buttons.push({ label: 'Practice', icon: Flower2, gradient: 'from-teal-500 to-purple-700', onClick: handlers.handleGenerateSpiritualPractice })
  }
  if (hasDailyOverview) {
    buttons.push({ label: 'Daily Overview', icon: CalendarDays, gradient: 'from-amber-600 to-yellow-500', onClick: handlers.handleGenerateDailyOverview })
  }

  return (
    <div className="flex flex-col gap-3 px-3 py-2">
      {/* Date badge */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
        <CalendarDays size={12} className="text-slate-600" />
        <span className="text-slate-400">{dateLabel}</span>
      </div>

      {/* Generator grid — 2 cols, large touch-friendly buttons */}
      <div className="grid grid-cols-2 gap-2">
        {buttons.map((btn) => (
          <button
            key={btn.label}
            onClick={btn.onClick}
            className={`flex items-center gap-2 px-3 py-3 rounded-xl bg-gradient-to-r ${btn.gradient} text-white text-xs font-medium active:scale-95 transition-transform shadow-lg`}
          >
            <btn.icon size={16} className="shrink-0" />
            <span className="truncate">{btn.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════
//  TOOLS PANEL
// ═══════════════════════════════════════════════════════
function ToolsPanel({
  canvasDimensions, setCanvasDimensions,
  addText, addRect, addCircle, addTriangle, addIcon,
  bringForward, sendBackward, duplicateSelected, deleteSelected,
  fillBackgroundWithImage, updateActiveObjectProp,
  updateBackgroundColor, updateGradientBackground,
  activeObject, editor, open, getInputProps,
}) {
  return (
    <div className="flex flex-col gap-3 px-1 py-2">

      {/* Background Colors */}
      <div className="flex flex-col gap-1.5">
        <Label>Background</Label>
        <HScroll>
          {BACKGROUND_COLORS.map(color => (
            <button
              key={color}
              onClick={() => updateBackgroundColor(color)}
              className={`shrink-0 w-9 h-9 rounded-full border-2 snap-center active:scale-95 transition-transform ${
                editor?.backgroundColor === color ? 'border-purple-400 scale-110 ring-2 ring-purple-400/30' : 'border-slate-700'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </HScroll>
      </div>

      {/* Gradients */}
      <div className="flex flex-col gap-1.5">
        <Label>Gradients</Label>
        <HScroll>
          {GRADIENTS.map(grad => (
            <button
              key={grad.name}
              onClick={() => updateGradientBackground(grad.colors)}
              className="shrink-0 w-14 h-9 rounded-lg border border-slate-700 snap-center active:scale-95 transition-transform"
              style={{ background: `linear-gradient(135deg, ${grad.colors[0]}, ${grad.colors[1]})` }}
            />
          ))}
        </HScroll>
      </div>

      {/* Quick actions — 2×2 grid */}
      <div className="flex flex-col gap-1.5">
        <Label>Add</Label>
        <div className="grid grid-cols-4 gap-2 px-1">
          {[
            { icon: Type, label: 'Text', onClick: () => addText() },
            { icon: ImageIcon, label: 'Image', onClick: open },
            { icon: Square, label: 'Rect', onClick: addRect },
            { icon: Circle, label: 'Circle', onClick: addCircle },
          ].map(item => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-slate-800/80 text-slate-300 active:bg-slate-700 active:scale-95 transition-all"
            >
              <item.icon size={18} />
              <span className="text-[10px]">{item.label}</span>
            </button>
          ))}
          <input {...getInputProps()} className="hidden" />
        </div>
      </div>

      {/* Canvas size */}
      <div className="flex flex-col gap-1.5">
        <Label>Canvas</Label>
        <div className="flex gap-2 px-1">
          {[
            { label: 'Square', w: 1080, h: 1080, icon: Square },
            { label: 'Portrait', w: 1080, h: 1350, icon: RectangleHorizontal },
            { label: 'Story', w: 1080, h: 1920, icon: Smartphone },
          ].map(({ label, w, h, icon: Icon }) => {
            const active = canvasDimensions.width === w && canvasDimensions.height === h
            return (
              <button
                key={label}
                onClick={() => setCanvasDimensions({ width: w, height: h })}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                  active ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-slate-800/80 text-slate-400'
                }`}
              >
                <Icon size={14} className={label === 'Portrait' ? 'rotate-90' : ''} />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Icons */}
      <div className="flex flex-col gap-1.5">
        <Label>Icons</Label>
        <HScroll>
          {ICON_LIBRARY.map(asset => (
            <button
              key={asset.name}
              onClick={() => addIcon(asset.icon)}
              className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-400 snap-center active:bg-slate-700 active:scale-95 transition-all"
            >
              <asset.icon size={20} />
            </button>
          ))}
        </HScroll>
      </div>

      {/* ─── Object editing (when something is selected) ─── */}
      {activeObject ? (
        <div className="flex flex-col gap-3 pt-2 border-t border-slate-800 animate-in fade-in">
          <Label>{activeObject.type === 'image' ? 'Image' : 'Selected Object'}</Label>

          {/* Text-only tools */}
          {(['textbox', 'text', 'i-text', 'Textbox', 'IText'].includes(activeObject.type)) && (
            <>
              {/* Font family — horizontal scroll */}
              <HScroll>
                {FONTS.map(font => (
                  <button
                    key={font}
                    onClick={() => updateActiveObjectProp('fontFamily', font)}
                    className={`shrink-0 text-xs px-3 py-2 rounded-lg snap-center active:scale-95 transition-all ${
                      activeObject.fontFamily === font ? 'bg-purple-500/20 text-purple-300 border border-purple-500' : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                    style={{ fontFamily: font }}
                  >
                    {font.split('-')[0]}
                  </button>
                ))}
              </HScroll>

              {/* B / I / U + Size */}
              <div className="flex items-center justify-between px-1 gap-2">
                <div className="flex rounded-xl overflow-hidden border border-slate-700">
                  <button onClick={() => updateActiveObjectProp('fontWeight', activeObject.fontWeight === 'bold' ? 'normal' : 'bold')} className={`p-2.5 active:bg-slate-700 ${activeObject.fontWeight === 'bold' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400'}`}><Bold size={16}/></button>
                  <button onClick={() => updateActiveObjectProp('fontStyle', activeObject.fontStyle === 'italic' ? 'normal' : 'italic')} className={`p-2.5 border-x border-slate-700 active:bg-slate-700 ${activeObject.fontStyle === 'italic' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400'}`}><Italic size={16}/></button>
                  <button onClick={() => updateActiveObjectProp('underline', !activeObject.underline)} className={`p-2.5 active:bg-slate-700 ${activeObject.underline ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400'}`}><Underline size={16}/></button>
                </div>
                <div className="flex rounded-xl overflow-hidden border border-slate-700">
                  <button onClick={() => updateActiveObjectProp('textAlign', 'left')} className={`p-2.5 active:bg-slate-700 ${activeObject.textAlign === 'left' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400'}`}><AlignLeft size={16}/></button>
                  <button onClick={() => updateActiveObjectProp('textAlign', 'center')} className={`p-2.5 border-x border-slate-700 active:bg-slate-700 ${activeObject.textAlign === 'center' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400'}`}><AlignCenter size={16}/></button>
                  <button onClick={() => updateActiveObjectProp('textAlign', 'right')} className={`p-2.5 active:bg-slate-700 ${activeObject.textAlign === 'right' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400'}`}><AlignRight size={16}/></button>
                </div>
              </div>

              {/* Glow */}
              <div className="flex items-center gap-2 px-1">
                <button
                  onClick={() => updateActiveObjectProp('shadow', activeObject.shadow ? null : new fabric.Shadow({ color: 'rgba(255,255,255,0.5)', blur: 10, offsetX: 0, offsetY: 0 }))}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${activeObject.shadow ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
                >
                  <Sparkles size={14} /> Glow
                </button>
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-[10px] text-slate-500">Size</span>
                  <input
                    type="number"
                    className="w-14 h-8 bg-slate-800 border border-slate-700 text-white text-xs text-center rounded-lg"
                    value={Math.round(activeObject.fontSize || 40)}
                    onChange={(e) => updateActiveObjectProp('fontSize', parseInt(e.target.value) || 40)}
                  />
                </div>
              </div>

              {/* Sliders: Line Height + Spacing */}
              <div className="flex flex-col gap-2 px-1">
                <SliderRow label="Line Ht" min={0.5} max={2.5} step={0.1} value={activeObject.lineHeight ?? 1.16} onChange={(v) => updateActiveObjectProp('lineHeight', v)} display={Number(activeObject.lineHeight ?? 1.16).toFixed(1)} />
                <SliderRow label="Spacing" min={-100} max={500} step={10} value={activeObject.charSpacing ?? 0} onChange={(v) => updateActiveObjectProp('charSpacing', v)} display={activeObject.charSpacing ?? 0} />
              </div>
            </>
          )}

          {/* Color swatches */}
          {activeObject.type !== 'image' && (
            <HScroll>
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => updateActiveObjectProp('fill', color)}
                  className={`shrink-0 w-8 h-8 rounded-full border-2 snap-center active:scale-95 transition-transform ${
                    activeObject.fill === color ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </HScroll>
          )}

          {/* Image: Set as BG */}
          {activeObject.type === 'image' && (
            <button
              onClick={fillBackgroundWithImage}
              className="flex items-center justify-center gap-2 py-2.5 mx-1 rounded-xl bg-slate-800 text-slate-300 text-xs active:bg-slate-700 active:scale-95 transition-all border border-slate-700"
            >
              <Maximize size={14} /> Set as Background
            </button>
          )}

          {/* Opacity */}
          <div className="px-1">
            <SliderRow label="Opacity" min={0.1} max={1} step={0.05} value={activeObject.opacity ?? 1} onChange={(v) => updateActiveObjectProp('opacity', v)} display={`${Math.round((activeObject.opacity ?? 1) * 100)}%`} />
          </div>

          {/* Layer controls */}
          <div className="grid grid-cols-4 gap-2 px-1">
            <button onClick={bringForward} className="flex flex-col items-center gap-1 py-2 rounded-xl bg-slate-800/80 text-slate-400 active:bg-slate-700 active:scale-95 transition-all">
              <ChevronUp size={16} /><span className="text-[9px]">Fwd</span>
            </button>
            <button onClick={sendBackward} className="flex flex-col items-center gap-1 py-2 rounded-xl bg-slate-800/80 text-slate-400 active:bg-slate-700 active:scale-95 transition-all">
              <ChevronDown size={16} /><span className="text-[9px]">Back</span>
            </button>
            <button onClick={duplicateSelected} className="flex flex-col items-center gap-1 py-2 rounded-xl bg-slate-800/80 text-slate-400 active:bg-slate-700 active:scale-95 transition-all">
              <Copy size={14} /><span className="text-[9px]">Clone</span>
            </button>
            <button onClick={deleteSelected} className="flex flex-col items-center gap-1 py-2 rounded-xl bg-red-500/10 text-red-400 active:bg-red-500 active:text-white active:scale-95 transition-all">
              <Trash2 size={14} /><span className="text-[9px]">Delete</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-4 text-xs text-slate-600">
          Tap an object on the canvas to edit
        </div>
      )}
    </div>
  )
}

// ─── SLIDER ROW ───
function SliderRow({ label, min, max, step, value, onChange, display }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-slate-500 w-12 shrink-0">{label}</span>
      <input
        type="range" min={min} max={max} step={step}
        className="flex-1 accent-purple-500 h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <span className="text-[10px] text-slate-400 w-10 text-right shrink-0">{display}</span>
    </div>
  )
}


// ═══════════════════════════════════════════════════════
//  CAPTION PANEL
// ═══════════════════════════════════════════════════════
function CaptionPanel({ postCaption, setPostCaption, isCopied, handleCopyCaption, cosmicData }) {
  const [activeTab, setActiveTab] = useState('social')

  const captionVariants = useMemo(() => {
    const variants = []
    if (!cosmicData || cosmicData.length === 0) return variants
    const payload = cosmicData[0]
    if (payload.master_social_post) variants.push({ id: 'social', label: 'Social', text: payload.master_social_post })
    const ec = payload.element_content_raw
    if (ec) {
      const ctaParts = ['fire_signs', 'earth_signs', 'air_signs', 'water_signs']
        .filter(k => ec[k]?.call_to_action)
        .map(k => {
          const emojis = { fire_signs: '🔥', earth_signs: '🌍', air_signs: '💨', water_signs: '💧' }
          return `${emojis[k] || '✨'} ${ec[k].call_to_action}`
        })
      if (ctaParts.length > 0) variants.push({ id: 'cta', label: 'CTAs', text: ctaParts.join('\n\n') })
    }
    const wc = payload.weekly_content_raw
    if (wc?.collective_message) variants.push({ id: 'weekly', label: 'Weekly', text: `🌟 This Week's Message\n\n${wc.collective_message}` })
    return variants
  }, [cosmicData])

  const handleTabClick = (v) => { setActiveTab(v.id); setPostCaption(v.text) }

  return (
    <div className="flex flex-col h-full">
      {/* Variant tabs — horizontal pills */}
      {captionVariants.length > 1 && (
        <div className="flex gap-2 px-3 py-2 border-b border-slate-800">
          {captionVariants.map(v => (
            <button
              key={v.id}
              onClick={() => handleTabClick(v)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
                activeTab === v.id ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      {/* Textarea */}
      <div className="flex-1 relative px-3 py-2">
        <textarea
          value={postCaption}
          onChange={(e) => setPostCaption(e.target.value)}
          className="w-full h-full min-h-[120px] bg-slate-900/50 text-slate-300 p-3 text-sm leading-relaxed rounded-xl border border-slate-800 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 resize-none"
          placeholder="Your caption appears here..."
        />
        <button
          onClick={handleCopyCaption}
          className={`absolute top-4 right-5 p-2 rounded-lg transition-all active:scale-90 ${
            isCopied ? 'bg-emerald-500 text-white' : 'bg-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          {isCopied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════
//  AI IMAGE PANEL
// ═══════════════════════════════════════════════════════
function AiPanel({ cosmicData, aiImage, fillBackgroundWithImage, editor, slides, setSlides }) {
  const [prompt, setPrompt] = useState('')
  const { isGenerating, generatedImageUrl, error, progress, generateImage, clearImage } = aiImage

  const payload = cosmicData?.[0]
  const cosmicImagePrompt = payload?.daily_content_raw?.individual_horoscopes?.cosmic_image_prompt

  useEffect(() => {
    if (cosmicImagePrompt) setPrompt(cosmicImagePrompt)
  }, [cosmicImagePrompt])

  const handleAddToCanvas = () => {
    if (!generatedImageUrl || !editor) return
    const imgEl = new Image()
    imgEl.crossOrigin = 'anonymous'
    imgEl.onload = () => {
      const fabricImg = new fabric.FabricImage(imgEl, { originX: 'left', originY: 'top', left: 50, top: 50 })
      const scale = Math.min((editor.width * 0.8) / fabricImg.width, (editor.height * 0.8) / fabricImg.height)
      fabricImg.scale(scale)
      editor.add(fabricImg)
      editor.setActiveObject(fabricImg)
      editor.renderAll()
    }
    imgEl.src = generatedImageUrl
  }

  const handleSetBg = () => {
    if (!generatedImageUrl || !fillBackgroundWithImage) return
    const imgEl = new Image()
    imgEl.crossOrigin = 'anonymous'
    imgEl.onload = () => {
      const fabricImg = new fabric.FabricImage(imgEl, { originX: 'left', originY: 'top' })
      editor.add(fabricImg)
      editor.setActiveObject(fabricImg)
      fillBackgroundWithImage()
    }
    imgEl.src = generatedImageUrl
  }

  const handleSetBgAll = () => {
    if (!generatedImageUrl || !editor || !slides || !setSlides) return
    const imgEl = new Image()
    imgEl.crossOrigin = 'anonymous'
    imgEl.onload = () => {
      const fabricImg = new fabric.FabricImage(imgEl, { originX: 'left', originY: 'top' })
      const dims = { width: editor.width || 1080, height: editor.height || 1080 }
      const scale = Math.max(dims.width / fabricImg.width, dims.height / fabricImg.height)
      fabricImg.set({ scaleX: scale, scaleY: scale, originX: 'left', originY: 'top', left: 0, top: 0 })
      editor.backgroundImage = fabricImg
      editor.backgroundColor = null
      editor.renderAll()
      editor.fire('object:modified')
      const bgJson = fabricImg.toObject(['crossOrigin'])
      const updated = slides.map(s => {
        const slide = typeof s === 'string' ? JSON.parse(s) : s
        const clone = JSON.parse(JSON.stringify(slide))
        clone.backgroundImage = bgJson
        clone.background = null
        return clone
      })
      setSlides(updated)
    }
    imgEl.src = generatedImageUrl
  }

  return (
    <div className="flex flex-col gap-2 px-3 py-2">
      {/* Prompt */}
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the image to generate..."
        className="w-full h-20 bg-slate-900/50 text-slate-300 p-3 text-xs rounded-xl border border-slate-800 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 resize-none leading-relaxed"
      />

      {/* Generate button */}
      <button
        onClick={() => generateImage(prompt)}
        disabled={isGenerating || !prompt.trim()}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white text-sm font-medium disabled:opacity-40 active:scale-95 transition-transform shadow-lg"
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> {progress}</span>
        ) : (
          <span className="flex items-center justify-center gap-2"><Wand2 size={16} /> Generate</span>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 rounded-xl p-2.5 border border-red-500/20">
          <AlertCircle size={14} className="shrink-0 mt-0.5" /> <span>{error}</span>
        </div>
      )}

      {/* Image preview */}
      {generatedImageUrl && (
        <div className="flex flex-col gap-2 animate-in fade-in">
          <div className="relative rounded-xl overflow-hidden border border-slate-700">
            <img src={generatedImageUrl} alt="AI Generated" className="w-full h-auto max-h-40 object-contain bg-slate-950" />
            <button onClick={clearImage} className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-slate-400 active:text-white">
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={handleAddToCanvas} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs active:scale-95 transition-transform">
              <ImagePlus size={14} /> Add
            </button>
            <button onClick={handleSetBg} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs border border-slate-700 active:scale-95 transition-transform">
              <Maximize size={14} /> BG
            </button>
            <button onClick={handleSetBgAll} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs border border-slate-700 active:scale-95 transition-transform">
              <Layers size={14} /> All
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


// ═══════════════════════════════════════════════════════
//  MAIN EXPORT
// ═══════════════════════════════════════════════════════
export function MobileToolsPanel({ activeTab, ...props }) {
  switch (activeTab) {
    case 'generate':
      return <GeneratePanel {...props} />
    case 'edit':
      return <ToolsPanel {...props} />
    case 'caption':
      return <CaptionPanel {...props} />
    case 'ai':
      return <AiPanel {...props} />
    default:
      return null
  }
}
