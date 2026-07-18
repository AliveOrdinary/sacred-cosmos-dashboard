import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Type, ChevronUp, ChevronDown, Copy, Trash2,
  Sparkles, Loader2, AlertCircle,
  Check, Flame, Stars, Film, CalendarDays, Calendar,
  BookOpen, Flower2, Target, Minus, Plus,
  Send, Instagram, Facebook, LayoutGrid, CircleDashed
} from 'lucide-react'

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, activeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/50' },
  { id: 'facebook',  label: 'Facebook',  icon: Facebook,  activeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/50' },
]

const POST_TYPES = [
  { id: 'feed',  label: 'Feed',  icon: LayoutGrid },
  { id: 'story', label: 'Story', icon: CircleDashed },
]
import { ZODIAC_SIGNS, SLIDE_THEME, BRAND_SWATCHES } from '@/lib/constants'

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
function GeneratePanel({ cosmicData, isLoading, handlers }) {
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
            disabled={isLoading}
            className={`flex items-center gap-2 px-3 py-3.5 rounded-xl bg-gradient-to-r ${btn.gradient} text-white text-xs font-medium active:scale-95 transition-transform shadow-lg disabled:opacity-40 disabled:pointer-events-none`}
          >
            {isLoading
              ? <Loader2 size={16} className="shrink-0 animate-spin" />
              : <btn.icon size={16} className="shrink-0" />}
            <span className="truncate">{btn.label}</span>
          </button>
        ))}
      </div>

      {isLoading && (
        <p className="text-center text-[11px] text-slate-500 animate-pulse">Building slides…</p>
      )}
    </div>
  )
}


// ═══════════════════════════════════════════════════════
//  TOOLS PANEL — correction-only. Slides arrive on-brand from the
//  generator; mobile just fixes wording, size, color, and layering.
//  The full design toolkit lives on desktop.
// ═══════════════════════════════════════════════════════
function ToolsPanel({
  addText, bringForward, sendBackward, duplicateSelected, deleteSelected,
  updateActiveObjectProp, activeObject,
}) {
  const isText = activeObject && ['textbox', 'text', 'i-text', 'Textbox', 'IText'].includes(activeObject.type)

  const stepFont = (delta) => {
    const next = Math.max(12, Math.min(220, Math.round((activeObject.fontSize || 40) + delta)))
    updateActiveObjectProp('fontSize', next)
  }

  if (!activeObject) {
    return (
      <div className="flex flex-col items-center gap-5 px-4 py-10">
        <p className="text-xs text-slate-500 text-center leading-relaxed">
          Tap an object on the canvas to select it.
          <br />
          Double-tap text to edit the wording.
        </p>
        <button
          onClick={() => addText('New line', {
            fontFamily: SLIDE_THEME.bodyFont,
            fill: SLIDE_THEME.mist,
            fontSize: 34,
            textAlign: 'center',
          })}
          className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium active:scale-95 active:bg-slate-700 transition-all"
        >
          <Type size={16} /> Add text
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-3 py-3">
      <Label>{isText ? 'Text' : 'Selected object'}</Label>

      {/* Font size stepper — no keyboard needed */}
      {isText && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-slate-500">Size</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => stepFont(-4)}
              className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center active:scale-95 active:bg-slate-700 transition-all"
            >
              <Minus size={18} />
            </button>
            <span className="w-10 text-center text-sm font-medium text-slate-200">
              {Math.round(activeObject.fontSize || 40)}
            </span>
            <button
              onClick={() => stepFont(4)}
              className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center active:scale-95 active:bg-slate-700 transition-all"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Brand palette */}
      {activeObject.type !== 'image' && (
        <div className="flex flex-col gap-1.5">
          <Label>Color</Label>
          <HScroll>
            {BRAND_SWATCHES.map(color => (
              <button
                key={color}
                onClick={() => updateActiveObjectProp('fill', color)}
                className={`shrink-0 w-11 h-11 rounded-full border-2 snap-center active:scale-95 transition-transform ${
                  activeObject.fill === color ? 'border-white scale-105' : 'border-slate-700'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </HScroll>
        </div>
      )}

      {/* Opacity */}
      <div className="px-1">
        <SliderRow
          label="Opacity" min={0.1} max={1} step={0.05}
          value={activeObject.opacity ?? 1}
          onChange={(v) => updateActiveObjectProp('opacity', v)}
          display={`${Math.round((activeObject.opacity ?? 1) * 100)}%`}
        />
      </div>

      {/* Actions */}
      <div className="grid grid-cols-4 gap-2 px-1">
        <button onClick={bringForward} className="flex flex-col items-center gap-1 py-3 rounded-xl bg-slate-800/80 text-slate-400 active:bg-slate-700 active:scale-95 transition-all">
          <ChevronUp size={17} /><span className="text-[9px]">Fwd</span>
        </button>
        <button onClick={sendBackward} className="flex flex-col items-center gap-1 py-3 rounded-xl bg-slate-800/80 text-slate-400 active:bg-slate-700 active:scale-95 transition-all">
          <ChevronDown size={17} /><span className="text-[9px]">Back</span>
        </button>
        <button onClick={duplicateSelected} className="flex flex-col items-center gap-1 py-3 rounded-xl bg-slate-800/80 text-slate-400 active:bg-slate-700 active:scale-95 transition-all">
          <Copy size={15} /><span className="text-[9px]">Clone</span>
        </button>
        <button onClick={deleteSelected} className="flex flex-col items-center gap-1 py-3 rounded-xl bg-red-500/10 text-red-400 active:bg-red-500 active:text-white active:scale-95 transition-all">
          <Trash2 size={15} /><span className="text-[9px]">Delete</span>
        </button>
      </div>
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
        className="touch-slider flex-1 accent-purple-500 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer"
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
function CaptionPanel({
  postCaption, setPostCaption, isCopied, handleCopyCaption, cosmicData,
  publish, isPublishing, publishStatus, publishMessage, selectedPlatforms, togglePlatform, resetPublishStatus,
  postType, setPostType,
  editor, slides, currentIndexRef,
}) {
  const [activeTab, setActiveTab] = useState('social')

  // Auto-clear banner after 5 s
  useEffect(() => {
    if (!publishStatus) return
    const t = setTimeout(resetPublishStatus, 5000)
    return () => clearTimeout(t)
  }, [publishStatus, resetPublishStatus])

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
  const handlePublish = () => publish({ editor, slides, currentIndexRef, caption: postCaption })

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

      {/* ── PUBLISH SECTION ── */}
      <div className="shrink-0 px-3 pb-3 flex flex-col gap-2">
        {/* Post type: Feed / Story */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-full bg-slate-800/60 border border-slate-700 p-0.5">
            {POST_TYPES.map(({ id, label, icon: Icon }) => {
              const active = postType === id
              return (
                <button
                  key={id}
                  onClick={() => setPostType?.(id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all active:scale-95 ${
                    active ? 'bg-violet-500/25 text-violet-300' : 'text-slate-500'
                  }`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              )
            })}
          </div>
          {postType === 'story' && (
            <span className="text-[10px] text-slate-500">9:16 · no IG caption</span>
          )}
        </div>

        {/* Platform toggles */}
        <div className="flex gap-2">
          {PLATFORMS.map(({ id, label, icon: Icon, activeClass }) => {
            const active = selectedPlatforms?.includes(id)
            return (
              <button
                key={id}
                onClick={() => togglePlatform(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 ${
                  active ? activeClass : 'bg-slate-800/60 text-slate-500 border-slate-700'
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            )
          })}
        </div>

        {/* Publish button */}
        <button
          onClick={handlePublish}
          disabled={isPublishing || !selectedPlatforms?.length}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white text-sm font-medium disabled:opacity-40 active:scale-95 transition-transform shadow-lg"
        >
          {isPublishing
            ? <><Loader2 size={15} className="animate-spin" />{publishMessage || 'Publishing…'}</>
            : <><Send size={15} />Publish to Social</>
          }
        </button>

        {/* Status banner */}
        {publishStatus === 'success' && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 rounded-xl px-3 py-2 border border-emerald-500/20 animate-in fade-in">
            <Check size={13} className="shrink-0" />{publishMessage}
          </div>
        )}
        {publishStatus === 'error' && (
          <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 rounded-xl px-3 py-2 border border-red-500/20 animate-in fade-in">
            <AlertCircle size={13} className="shrink-0 mt-0.5" />{publishMessage}
          </div>
        )}
      </div>
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
    case 'publish':
      // Pass all publish-related props through to CaptionPanel
      return <CaptionPanel {...props} />
    default:
      return null
  }
}
