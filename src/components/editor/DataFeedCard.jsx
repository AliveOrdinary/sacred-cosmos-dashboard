import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Stars, Film, Flame, CalendarDays, ChevronDown, ChevronUp, Plus, BookOpen, Flower2, Calendar, MessageSquare, Copy, Check } from 'lucide-react'
import { ZODIAC_SIGNS } from '@/lib/constants'
import { useState } from 'react'

export function DataFeedCard({ cosmicData, addText, handleGenerateCarousel, handleGenerateSignCarousel, handleGenerateElementPosts, handleGenerateStories, handleGenerateWeeklyCarousel, handleGenerateSpiritualPractice, handleGenerateManifestationFocus }) {
  const [showRawData, setShowRawData] = useState(false)
  const [showQuestions, setShowQuestions] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState(null)

  if (!cosmicData || cosmicData.length === 0) return null

  const payload = cosmicData[0]
  const horoscopes = payload.daily_content_raw?.individual_horoscopes
  const hasStories = payload.instagram_stories?.length > 0
  const manifCount = payload.element_content_raw?.manifestation_posts?.length || 0
  const signCount = horoscopes ? ZODIAC_SIGNS.filter(s => horoscopes[s.key]).length : 0
  const storyCount = payload.instagram_stories?.length || 0
  const elementCount = payload.element_content_raw ? ['fire_signs', 'earth_signs', 'air_signs', 'water_signs'].filter(k => payload.element_content_raw[k]).length : 0
  const wc = payload.weekly_content_raw
  const hasWeekly = wc && wc.weekly_theme && ZODIAC_SIGNS.some(s => wc[s.key])
  const hasPractice = !!horoscopes?.spiritual_practice
  const hasManifest = !!(payload.daily_content_raw?.manifestation_focus || horoscopes?.manifestation_focus)

  // Try to extract date from the social media post or use today
  const dateMatch = payload.master_social_post?.match(/(?:Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),?\s+\w+\s+\d{1,2},?\s+\d{4}/i)
  const dateLabel = dateMatch ? dateMatch[0] : (payload.date || new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }))

  return (
    <Card className="bg-slate-900 border-slate-800 text-white shadow-xl flex-1 overflow-hidden flex flex-col">
      <CardHeader className="pb-3 border-b border-slate-800 shrink-0">
        <div className="flex justify-between items-start mb-2">
          <div>
            <CardTitle className="text-sm font-medium text-slate-300">Content Generators</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              One-click post creation from your n8n data
            </CardDescription>
          </div>
        </div>

        {/* --- Data Loaded Summary --- */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3 flex-wrap">
          <CalendarDays size={12} className="text-slate-600" />
          <span className="text-slate-400">{dateLabel}</span>
          <span className="text-slate-700">·</span>
          {manifCount > 0 && <span>{manifCount} manifestations</span>}
          {manifCount > 0 && elementCount > 0 && <span className="text-slate-700">·</span>}
          {elementCount > 0 && <span>{elementCount} elements</span>}
          {elementCount > 0 && signCount > 0 && <span className="text-slate-700">·</span>}
          {signCount > 0 && <span>{signCount} signs</span>}
          {signCount > 0 && storyCount > 0 && <span className="text-slate-700">·</span>}
          {storyCount > 0 && <span>{storyCount} stories</span>}
        </div>

        {/* --- Generator Buttons --- */}
        <div className="flex flex-wrap gap-2">
          {payload.element_content_raw?.manifestation_posts && (
            <Button
              onClick={handleGenerateCarousel}
              size="sm"
              className="bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white shadow-lg border-0"
            >
              <Sparkles size={14} className="mr-1.5" /> Manifestation
            </Button>
          )}

          {payload.element_content_raw && (
            <Button
              onClick={handleGenerateElementPosts}
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-teal-700 hover:from-emerald-400 hover:to-teal-600 text-white shadow-lg border-0"
            >
              <Flame size={14} className="mr-1.5" /> Elements
            </Button>
          )}

          {horoscopes && (
            <>
              <Button
                onClick={() => handleGenerateSignCarousel(1)}
                size="sm"
                className="bg-gradient-to-r from-indigo-500 to-purple-700 hover:from-indigo-400 hover:to-purple-600 text-white shadow-lg border-0"
              >
                <Stars size={14} className="mr-1.5" /> Signs ♈–♍
              </Button>
              <Button
                onClick={() => handleGenerateSignCarousel(2)}
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-indigo-800 hover:from-purple-500 hover:to-indigo-700 text-white shadow-lg border-0"
              >
                <Stars size={14} className="mr-1.5" /> Signs ♎–♓
              </Button>
            </>
          )}

          {hasStories && (
            <Button
              onClick={handleGenerateStories}
              size="sm"
              className="bg-gradient-to-r from-pink-500 to-rose-700 hover:from-pink-400 hover:to-rose-600 text-white shadow-lg border-0"
            >
              <Film size={14} className="mr-1.5" /> Stories
            </Button>
          )}

          {hasWeekly && (
            <>
              <Button
                onClick={() => handleGenerateWeeklyCarousel(1)}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-indigo-700 hover:from-blue-400 hover:to-indigo-600 text-white shadow-lg border-0"
              >
                <Calendar size={14} className="mr-1.5" /> Weekly ♈–♍
              </Button>
              <Button
                onClick={() => handleGenerateWeeklyCarousel(2)}
                size="sm"
                className="bg-gradient-to-r from-indigo-600 to-blue-800 hover:from-indigo-500 hover:to-blue-700 text-white shadow-lg border-0"
              >
                <Calendar size={14} className="mr-1.5" /> Weekly ♎–♓
              </Button>
            </>
          )}

          {hasPractice && (
            <Button
              onClick={handleGenerateSpiritualPractice}
              size="sm"
              className="bg-gradient-to-r from-teal-500 to-purple-700 hover:from-teal-400 hover:to-purple-600 text-white shadow-lg border-0"
            >
              <Flower2 size={14} className="mr-1.5" /> Practice
            </Button>
          )}

          {hasManifest && (
            <Button
              onClick={handleGenerateManifestationFocus}
              size="sm"
              className="bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-white shadow-lg border-0"
            >
              <BookOpen size={14} className="mr-1.5" /> Manifest
            </Button>
          )}
        </div>
      </CardHeader>

      {/* --- Community Questions Bank --- */}
      {payload.element_content_raw?.community_questions?.length > 0 && (
        <div className="border-t border-slate-800">
          <button
            onClick={() => setShowQuestions(!showQuestions)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-slate-500 hover:text-slate-400 hover:bg-slate-800/50 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <MessageSquare size={12} />
              Community Questions ({payload.element_content_raw.community_questions.length})
            </span>
            {showQuestions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showQuestions && (
            <div className="px-4 pb-3 flex flex-col gap-2">
              {payload.element_content_raw.community_questions.map((q, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 bg-slate-950 rounded-lg p-2.5 border border-slate-800 group"
                >
                  <p className="flex-1 text-xs text-slate-400 leading-relaxed">{q}</p>
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(q)
                      setCopiedIdx(idx)
                      setTimeout(() => setCopiedIdx(null), 1500)
                    }}
                    className="shrink-0 p-1 rounded text-slate-600 hover:text-emerald-400 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedIdx === idx ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- Collapsible Raw Data (Advanced) --- */}
      <div className="border-t border-slate-800">
        <button
          onClick={() => setShowRawData(!showRawData)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-slate-500 hover:text-slate-400 hover:bg-slate-800/50 transition-colors"
        >
          <span>Raw Data Preview</span>
          {showRawData ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showRawData && (
          <CardContent className="p-0 overflow-auto max-h-[400px] fancy-scrollbar border-t border-slate-800/50">
            <div className="flex flex-col">

              {/* Element Content */}
              {payload.element_content_raw && (
                <div className="border-b border-slate-800 p-4">
                  <h4 className="text-xs font-bold text-emerald-400 mb-3 uppercase tracking-wider">Element Content</h4>
                  {Object.entries(payload.element_content_raw)
                    .filter(([k]) => ['fire_signs', 'earth_signs', 'air_signs', 'water_signs'].includes(k))
                    .map(([key, data]) => (
                      <div key={key} className="mb-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-medium text-purple-300 capitalize">{key.replace('_', ' ')}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs hover:bg-purple-900/30 hover:text-purple-300"
                            onClick={() => addText(data.message.split('\n\n').join('\n'), { fontSize: 32, fontFamily: 'serif' })}
                          >
                            <Plus size={12} className="mr-1" /> Add
                          </Button>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">{data.message}</p>
                      </div>
                    ))}
                </div>
              )}

              {/* Manifestation Posts */}
              {payload.element_content_raw?.manifestation_posts && (
                <div className="border-b border-slate-800 p-4">
                  <h4 className="text-xs font-bold text-emerald-400 mb-3 uppercase tracking-wider">Manifestation Posts</h4>
                  {payload.element_content_raw.manifestation_posts.map((post, idx) => (
                    <div key={idx} className="mb-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-medium text-amber-300 capitalize">{post.theme.replace('_', ' ')}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs hover:bg-amber-900/30 hover:text-amber-300"
                          onClick={() => addText((post.post || post.content || '').split('\n\n').join('\n'), { fontSize: 36, fontFamily: 'serif' })}
                        >
                          <Plus size={12} className="mr-1" /> Add
                        </Button>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{post.post || post.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Individual Sign Horoscopes */}
              {horoscopes && (
                <div className="p-4">
                  <h4 className="text-xs font-bold text-emerald-400 mb-3 uppercase tracking-wider">Individual Horoscopes</h4>
                  {ZODIAC_SIGNS
                    .filter(sign => horoscopes[sign.key])
                    .map(sign => (
                      <div key={sign.key} className="mb-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-medium text-indigo-300">
                            {sign.symbol} {sign.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs hover:bg-indigo-900/30 hover:text-indigo-300"
                            onClick={() => addText(horoscopes[sign.key], { fontSize: 28, fontFamily: 'serif' })}
                          >
                            <Plus size={12} className="mr-1" /> Add
                          </Button>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">{horoscopes[sign.key]}</p>
                      </div>
                    ))}
                </div>
              )}

            </div>
          </CardContent>
        )}
      </div>
    </Card>
  )
}
