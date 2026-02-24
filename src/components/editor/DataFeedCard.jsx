import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Sparkles, Stars, Film } from 'lucide-react'
import { ZODIAC_SIGNS } from '@/lib/constants'

export function DataFeedCard({ cosmicData, addText, handleGenerateCarousel, handleGenerateSignCarousel, handleGenerateStories }) {
  if (!cosmicData || cosmicData.length === 0) return null

  const payload = cosmicData[0]
  const horoscopes = payload.daily_content?.individual_horoscopes
  const hasStories = payload.instagram_stories?.length > 0 || payload.daily_content?.instagram_story

  return (
    <Card className="bg-slate-900 border-slate-800 text-white shadow-xl flex-1 overflow-hidden flex flex-col">
      <CardHeader className="pb-3 border-b border-slate-800 shrink-0">
        <div className="flex justify-between items-start mb-3">
          <div>
            <CardTitle className="text-sm font-medium text-slate-300">Data Feed</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Push content directly to your active slide
            </CardDescription>
          </div>
        </div>

        {/* --- Generator Buttons Row --- */}
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

          {horoscopes && (
            <Button
              onClick={handleGenerateSignCarousel}
              size="sm"
              className="bg-gradient-to-r from-indigo-500 to-purple-700 hover:from-indigo-400 hover:to-purple-600 text-white shadow-lg border-0"
            >
              <Stars size={14} className="mr-1.5" /> Sign Carousel
            </Button>
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

      <CardContent className="p-0 overflow-auto flex-1 h-[600px] fancy-scrollbar">
        <div className="flex flex-col">

          {/* Element Content — fire/earth/air/water signs */}
          {payload.element_content && (
            <div className="border-b border-slate-800 p-4">
              <h4 className="text-xs font-bold text-emerald-400 mb-3 uppercase tracking-wider">Element Content</h4>
              {Object.entries(payload.element_content)
                .filter(([k]) => ['fire_signs', 'earth_signs', 'air_signs', 'water_signs'].includes(k))
                .map(([key, data]) => (
                  <div key={key} className="mb-4 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-medium text-purple-300 capitalize">{key.replace('_', ' ')}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs hover:bg-purple-900/30 hover:text-purple-300"
                        onClick={() => addText(data.message.split('\n\n').join('\n'), { fontSize: 32, fontFamily: 'serif' })}
                      >
                        <Plus size={12} className="mr-1" /> Add to Slide
                      </Button>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-3">{data.message}</p>
                  </div>
                ))}
            </div>
          )}

          {/* Manifestation Posts */}
          {payload.element_content?.manifestation_posts && (
            <div className="border-b border-slate-800 p-4 bg-slate-900">
              <h4 className="text-xs font-bold text-emerald-400 mb-3 uppercase tracking-wider">Manifestation Posts</h4>
              {payload.element_content.manifestation_posts.map((post, idx) => (
                <div key={idx} className="mb-4 bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium text-amber-300 capitalize">{post.theme.replace('_', ' ')}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs hover:bg-amber-900/30 hover:text-amber-300"
                      onClick={() => addText((post.post || post.content || '').split('\n\n').join('\n'), { fontSize: 36, fontFamily: 'serif' })}
                    >
                      <Plus size={12} className="mr-1" /> Add to Slide
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-3 mb-2">{post.post || post.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Daily Overview */}
          {horoscopes && (
            <div className="border-b border-slate-800 p-4">
              <h4 className="text-xs font-bold text-emerald-400 mb-3 uppercase tracking-wider">Daily Overview</h4>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-medium text-blue-300">Cosmic Overview</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs hover:bg-blue-900/30 hover:text-blue-300"
                    onClick={() => addText(horoscopes.cosmic_overview, { fontSize: 28, fontFamily: 'sans-serif' })}
                  >
                    <Plus size={12} className="mr-1" /> Add to Slide
                  </Button>
                </div>
                <p className="text-xs text-slate-400 line-clamp-3">{horoscopes.cosmic_overview}</p>
              </div>
            </div>
          )}

          {/* Individual Sign Horoscopes */}
          {horoscopes && (
            <div className="border-b border-slate-800 p-4">
              <h4 className="text-xs font-bold text-emerald-400 mb-3 uppercase tracking-wider">Individual Horoscopes</h4>
              {ZODIAC_SIGNS
                .filter(sign => horoscopes[sign.key])
                .map(sign => (
                  <div key={sign.key} className="mb-4 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="flex justify-between items-start mb-2">
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
    </Card>
  )
}
