import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Stars, Film, Flame, CalendarDays, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { ZODIAC_SIGNS } from '@/lib/constants'
import { useState } from 'react'

export function DataFeedCard({ cosmicData, addText, handleGenerateCarousel, handleGenerateSignCarousel, handleGenerateElementPosts, handleGenerateStories }) {
  const [showRawData, setShowRawData] = useState(false)

  if (!cosmicData || cosmicData.length === 0) return null

  const payload = cosmicData[0]
  const horoscopes = payload.daily_content?.individual_horoscopes
  const hasStories = payload.instagram_stories?.length > 0 || payload.daily_content?.instagram_story
  const manifCount = payload.element_content?.manifestation_posts?.length || 0
  const signCount = horoscopes ? ZODIAC_SIGNS.filter(s => horoscopes[s.key]).length : 0
  const storyCount = payload.instagram_stories?.length || (payload.daily_content?.instagram_story ? Object.keys(payload.daily_content.instagram_story).length : 0)
  const elementCount = payload.element_content ? ['fire_signs', 'earth_signs', 'air_signs', 'water_signs'].filter(k => payload.element_content[k]).length : 0

  // Try to extract date from the social media post or use today
  const dateMatch = payload.daily_content?.social_media_post?.match(/(?:Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),?\s+\w+\s+\d{1,2},?\s+\d{4}/i)
  const dateLabel = dateMatch ? dateMatch[0] : new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

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
          {payload.element_content?.manifestation_posts && (
            <Button
              onClick={handleGenerateCarousel}
              size="sm"
              className="bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white shadow-lg border-0"
            >
              <Sparkles size={14} className="mr-1.5" /> Manifestation
            </Button>
          )}

          {payload.element_content && (
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
        </div>
      </CardHeader>

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
              {payload.element_content && (
                <div className="border-b border-slate-800 p-4">
                  <h4 className="text-xs font-bold text-emerald-400 mb-3 uppercase tracking-wider">Element Content</h4>
                  {Object.entries(payload.element_content)
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
              {payload.element_content?.manifestation_posts && (
                <div className="border-b border-slate-800 p-4">
                  <h4 className="text-xs font-bold text-emerald-400 mb-3 uppercase tracking-wider">Manifestation Posts</h4>
                  {payload.element_content.manifestation_posts.map((post, idx) => (
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
