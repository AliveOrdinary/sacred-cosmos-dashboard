import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { useState, useMemo } from 'react'

export function PostCaptionCard({ postCaption, setPostCaption, isCopied, handleCopyCaption, cosmicData }) {
  const [activeTab, setActiveTab] = useState('social')

  // Build caption variants from loaded data
  const captionVariants = useMemo(() => {
    const variants = []
    if (!cosmicData || cosmicData.length === 0) return variants

    const payload = cosmicData[0]

    // Social Post (always available)
    if (payload.master_social_post) {
      variants.push({
        id: 'social',
        label: 'Social Post',
        text: payload.master_social_post,
      })
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
        variants.push({
          id: 'cta',
          label: 'Element CTAs',
          text: ctaParts.join('\n\n'),
        })
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

  return (
    <Card className="bg-slate-900 border-slate-800 text-white shadow-xl">
      <CardHeader className="p-4 pb-3 flex flex-row justify-between items-center border-b border-slate-800">
        <div>
          <CardTitle className="text-sm font-medium text-emerald-400">Post Caption</CardTitle>
          <CardDescription className="text-xs text-slate-500">Select a variant, then edit before exporting</CardDescription>
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
          className="w-full h-64 bg-slate-950 text-slate-300 p-6 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none font-mono text-sm leading-relaxed"
          placeholder="Your brilliant n8n caption will appear here..."
        />
      </CardContent>
    </Card>
  )
}
