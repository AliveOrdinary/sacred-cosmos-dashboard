import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Check, Send, Loader2, AlertCircle, Instagram, Facebook } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, activeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/50' },
  { id: 'facebook',  label: 'Facebook',  icon: Facebook,  activeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/50' },
]

export function PostCaptionCard({
  postCaption, setPostCaption,
  isCopied, handleCopyCaption,
  cosmicData,
  // publish props
  publish, isPublishing, publishStatus, publishMessage, selectedPlatforms, togglePlatform, resetPublishStatus,
  // editor context (needed by publish)
  editor, slides, currentIndexRef,
}) {
  const [activeTab, setActiveTab] = useState('social')

  // Auto-clear success/error banner after 5 s
  useEffect(() => {
    if (!publishStatus) return
    const t = setTimeout(resetPublishStatus, 5000)
    return () => clearTimeout(t)
  }, [publishStatus, resetPublishStatus])

  // Build caption variants from loaded data
  const captionVariants = useMemo(() => {
    const variants = []
    if (!cosmicData || cosmicData.length === 0) return variants

    const payload = cosmicData[0]

    // Social Post (always available)
    if (payload.master_social_post) {
      variants.push({ id: 'social', label: 'Social Post', text: payload.master_social_post })
    }

    // Element CTAs
    const ec = payload.element_content_raw
    if (ec) {
      const ctaParts = ['fire_signs', 'earth_signs', 'air_signs', 'water_signs']
        .filter(k => ec[k]?.call_to_action)
        .map(k => {
          const emojis = { fire_signs: '🔥', earth_signs: '🌍', air_signs: '💨', water_signs: '💧' }
          return `${emojis[k] || '✨'} ${ec[k].call_to_action}`
        })
      if (ctaParts.length > 0) {
        variants.push({ id: 'cta', label: 'Element CTAs', text: ctaParts.join('\n\n') })
      }
    }

    // Weekly collective message (Sunday only)
    const wc = payload.weekly_content_raw
    if (wc?.collective_message) {
      variants.push({
        id: 'weekly',
        label: 'Weekly',
        text: `🌟 This Week's Message\n\n${wc.collective_message}`,
      })
    }

    return variants
  }, [cosmicData])

  const handleTabClick = (variant) => {
    setActiveTab(variant.id)
    setPostCaption(variant.text)
  }

  const handlePublish = () => {
    publish({ editor, slides, currentIndexRef, caption: postCaption })
  }

  return (
    <Card className="bg-slate-900 border-slate-800 text-white shadow-xl">
      <CardHeader className="p-4 pb-3 flex flex-row justify-between items-center border-b border-slate-800">
        <div>
          <CardTitle className="text-sm font-medium text-emerald-400">Post Caption</CardTitle>
          <CardDescription className="text-xs text-slate-500">Select a variant, then edit before publishing</CardDescription>
        </div>
        <Button
          variant={isCopied ? 'default' : 'secondary'}
          size="sm"
          onClick={handleCopyCaption}
          className={`flex gap-2 ${isCopied ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'}`}
        >
          {isCopied ? <Check size={14} /> : <Copy size={14} />}
          {isCopied ? 'Copied!' : 'Copy'}
        </Button>
      </CardHeader>

      {/* Caption variant tabs */}
      {captionVariants.length > 1 && (
        <div className="flex border-b border-slate-800">
          {captionVariants.map(v => (
            <button
              key={v.id}
              onClick={() => handleTabClick(v)}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === v.id
                  ? 'text-emerald-400 border-b-2 border-emerald-400 bg-slate-800/50'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      <CardContent className="p-0">
        <textarea
          value={postCaption}
          onChange={(e) => setPostCaption(e.target.value)}
          className="w-full h-52 bg-slate-950 text-slate-300 p-6 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none font-mono text-sm leading-relaxed"
          placeholder="Your brilliant n8n caption will appear here..."
        />
      </CardContent>

      {/* ── PUBLISH SECTION ── */}
      <div className="border-t border-slate-800 p-4 flex flex-col gap-3">

        {/* Platform toggles */}
        <div className="flex gap-2">
          {PLATFORMS.map(({ id, label, icon: Icon, activeClass }) => {
            const active = selectedPlatforms.includes(id)
            return (
              <button
                key={id}
                onClick={() => togglePlatform(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  active ? activeClass : 'bg-slate-800/60 text-slate-500 border-slate-700 hover:border-slate-600'
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            )
          })}
        </div>

        {/* Publish button */}
        <Button
          onClick={handlePublish}
          disabled={isPublishing || selectedPlatforms.length === 0}
          className="w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white font-medium shadow-lg shadow-purple-900/30 disabled:opacity-40 transition-all"
        >
          {isPublishing ? (
            <><Loader2 size={15} className="mr-2 animate-spin" />{publishMessage || 'Publishing…'}</>
          ) : (
            <><Send size={15} className="mr-2" />Publish to Social</>
          )}
        </Button>

        {/* Status banner */}
        {publishStatus === 'success' && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-2 border border-emerald-500/20 animate-in fade-in">
            <Check size={14} className="shrink-0" />
            {publishMessage}
          </div>
        )}
        {publishStatus === 'error' && (
          <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20 animate-in fade-in">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            {publishMessage}
          </div>
        )}
      </div>
    </Card>
  )
}
