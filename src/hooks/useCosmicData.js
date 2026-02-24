import { useState } from 'react'
import * as fabric from 'fabric'
import sundayData from '../../sample data sunday.json'
import restdaysData from '../../sample data restdays.json'
import { GRADIENTS, ZODIAC_SIGNS, STORY_BACKGROUNDS } from '@/lib/constants'

// Temporary sample data map — replace with DB fetch later
const SAMPLE_DATA = {
  sunday: sundayData,
  restdays: restdaysData,
}

/**
 * Manages n8n data fetching, post caption state, and carousel auto-generation.
 *
 * Every Fabric object created here uses explicit originX:'left' / originY:'top'
 * to ensure consistent positioning across StaticCanvas build → toJSON →
 * loadFromJSON into the live Canvas.
 *
 * @param {{ editor, setSlides, setActiveSlideIndex, canvasDimensions, setCanvasDimensions }} deps
 */
export function useCosmicData({ editor, setSlides, setActiveSlideIndex, canvasDimensions, setCanvasDimensions }) {
  const [isLoading, setIsLoading] = useState(false)
  const [dataSource, setDataSource] = useState('sunday')  // 'sunday' | 'restdays'
  const [cosmicData, setCosmicData] = useState(() => {
    try {
      const saved = localStorage.getItem('cosmicData')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [postCaption, setPostCaption] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  const handleGenerate = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      // TODO: Replace with actual DB / API fetch
      const jsonResponse = SAMPLE_DATA[dataSource]
      const normalizedPayload = Array.isArray(jsonResponse) ? jsonResponse : [jsonResponse]

      setCosmicData(normalizedPayload)
      if (normalizedPayload.length > 0 && normalizedPayload[0].daily_content?.social_media_post) {
        setPostCaption(normalizedPayload[0].daily_content.social_media_post)
      }
      try {
        localStorage.setItem('cosmicData', JSON.stringify(normalizedPayload))
      } catch (e) { console.warn('Could not save data to localStorage', e) }
    } catch (error) {
      console.error('Cosmic connection failed:', error)
      alert('Connection failed! Make sure your n8n workflow is Published/Active.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(postCaption)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text', err)
    }
  }

  // ---------------------------------------------------------------------------
  // Shared carousel builder — takes an array of { title, body } and renders
  // them as gradient-backed slides with iterative font scaling.
  // ---------------------------------------------------------------------------
  const _buildSlides = async (items, opts = {}) => {
    const CW = opts.width || canvasDimensions.width
    const CH = opts.height || canvasDimensions.height

    // PAD scales with height. Title is WIDTH-constrained (always 1080px wide)
    const PAD = Math.round(CH * 0.074)
    const safeW = CW - PAD * 2
    const TITLE_TOP = PAD + 20
    const BODY_GAP = Math.round(CH * 0.025)

    const titleFontSize = opts.titleFontSize || 72
    const bodyFontStart = opts.bodyFontStart || Math.round(38 * Math.sqrt(CH / 1080))

    const buildCanvas = new fabric.StaticCanvas(null, { width: CW, height: CH })
    const newSlides = []

    for (let i = 0; i < items.length; i++) {
      buildCanvas.clear()

      // Gradient background
      const gradientColors = items[i].gradientColors
        || GRADIENTS[i % GRADIENTS.length].colors
      buildCanvas.backgroundColor = new fabric.Gradient({
        type: 'linear',
        coords: { x1: 0, y1: 0, x2: 0, y2: CH },
        colorStops: [
          { offset: 0, color: gradientColors[0] },
          { offset: 1, color: gradientColors[1] }
        ]
      })

      // --- TITLE ---
      const titleText = new fabric.Textbox(
        items[i].title,
        {
          originX: 'left',
          originY: 'top',
          left: PAD,
          top: TITLE_TOP,
          width: safeW,
          fontFamily: opts.titleFont || 'Inter',
          fill: opts.titleColor || '#FCD34D',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: titleFontSize,
          charSpacing: 20,
        }
      )
      buildCanvas.add(titleText)
      buildCanvas.renderAll()

      // Compute body zone dynamically
      const BODY_ZONE_TOP = TITLE_TOP + titleText.height + BODY_GAP
      const maxBodyH = CH - BODY_ZONE_TOP - PAD

      // --- BODY TEXT with iterative fit ---
      let bodyFontSize = bodyFontStart
      const minBodyFontSize = 16

      const bodyBaseOptions = {
        originX: 'left',
        originY: 'top',
        left: PAD,
        width: safeW,
        fontFamily: opts.bodyFont || 'Playfair Display',
        fill: '#FDFCF0',
        textAlign: 'center',
        lineHeight: 1.3,
        shadow: new fabric.Shadow({
          color: 'rgba(255, 255, 255, 0.4)',
          blur: 20, offsetX: 0, offsetY: 0
        })
      }

      let bodyText = null
      while (bodyFontSize >= minBodyFontSize) {
        if (bodyText) buildCanvas.remove(bodyText)
        bodyText = new fabric.Textbox(items[i].body, { ...bodyBaseOptions, fontSize: bodyFontSize })
        buildCanvas.add(bodyText)
        buildCanvas.renderAll()
        if (bodyText.height <= maxBodyH) break
        bodyFontSize -= 2
      }

      // Vertically center body in the body zone
      const bodyCenterTop = BODY_ZONE_TOP + (maxBodyH - bodyText.height) / 2
      bodyText.set({ top: Math.max(BODY_ZONE_TOP, bodyCenterTop) })

      buildCanvas.renderAll()
      newSlides.push(buildCanvas.toJSON(['id']))
    }

    buildCanvas.dispose()
    return { newSlides, CW, CH }
  }

  // ---------------------------------------------------------------------------
  // Load generated slides into the editor
  // ---------------------------------------------------------------------------
  const _loadIntoEditor = async (newSlides, CW, CH) => {
    setSlides(newSlides)
    setActiveSlideIndex(0)

    editor.clear()
    await editor.loadFromJSON(newSlides[0])
    editor.setDimensions({ width: CW, height: CH })
    editor.renderAll()
  }

  // ---------------------------------------------------------------------------
  // MANIFESTATION CAROUSEL  (existing feature, now with .post/.content fix)
  // ---------------------------------------------------------------------------
  const handleGenerateCarousel = async () => {
    if (!cosmicData || cosmicData.length === 0) return
    const payload = cosmicData[0]
    const posts = payload.element_content?.manifestation_posts
    if (!posts || posts.length === 0) return

    setIsLoading(true)
    try {
      const items = posts.map(p => ({
        title: p.theme.replace('_', ' ').toUpperCase(),
        body: p.post || p.content || '',   // ← FIX: Sunday uses .post, rest-days use .content
      }))

      const { newSlides, CW, CH } = await _buildSlides(items)
      await _loadIntoEditor(newSlides, CW, CH)
    } catch (e) {
      console.error('Failed to generate carousel:', e)
      alert('Failed to auto-generate carousel.')
    } finally {
      setIsLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // INDIVIDUAL SIGN CAROUSEL  (12-slide daily horoscope)
  // ---------------------------------------------------------------------------
  const handleGenerateSignCarousel = async () => {
    if (!cosmicData || cosmicData.length === 0) return
    const payload = cosmicData[0]
    const horoscopes = payload.daily_content?.individual_horoscopes
    if (!horoscopes) return

    // Verify at least some sign data exists
    const hasSignData = ZODIAC_SIGNS.some(s => horoscopes[s.key])
    if (!hasSignData) return

    setIsLoading(true)
    try {
      const items = ZODIAC_SIGNS
        .filter(s => horoscopes[s.key])   // only signs that have data
        .map((sign, idx) => ({
          title: `${sign.symbol} ${sign.name.toUpperCase()}`,
          body: horoscopes[sign.key],
          gradientColors: GRADIENTS[idx % GRADIENTS.length].colors,
        }))

      const { newSlides, CW, CH } = await _buildSlides(items, {
        titleFontSize: 64,
        bodyFontStart: Math.round(30 * Math.sqrt(canvasDimensions.height / 1080)),
      })
      await _loadIntoEditor(newSlides, CW, CH)
    } catch (e) {
      console.error('Failed to generate sign carousel:', e)
      alert('Failed to auto-generate sign carousel.')
    } finally {
      setIsLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // INSTAGRAM STORIES  (3–4 vertical slides from pre-structured data)
  // ---------------------------------------------------------------------------
  const handleGenerateStories = async () => {
    if (!cosmicData || cosmicData.length === 0) return
    const payload = cosmicData[0]

    // Prefer the top-level instagram_stories array (richer), fall back to daily_content.instagram_story
    let storySlides = payload.instagram_stories
    if (!storySlides || storySlides.length === 0) {
      const igStory = payload.daily_content?.instagram_story
      if (!igStory) return
      // Convert the slide1/slide2/slide3 object format into an array
      storySlides = Object.values(igStory)
    }
    if (storySlides.length === 0) return

    setIsLoading(true)
    try {
      // Stories are always 1080×1920 — switch canvas dimensions first
      const STORY_W = 1080
      const STORY_H = 1920
      setCanvasDimensions({ width: STORY_W, height: STORY_H })

      const defaultGrad = ['#1a0533', '#4a1a7a']

      const items = storySlides.map((slide, idx) => {
        const bgKey = slide.background || ''
        const gradientColors = STORY_BACKGROUNDS[bgKey] || GRADIENTS[idx % GRADIENTS.length].colors || defaultGrad

        return {
          title: '',  // stories don't need a title — all text goes in body
          body: slide.text || '',
          gradientColors,
        }
      })

      const { newSlides, CW, CH } = await _buildSlides(items, {
        width: STORY_W,
        height: STORY_H,
        titleFontSize: 1,          // effectively skip title (empty string)
        bodyFontStart: 42,         // larger default for story format
        bodyFont: 'Inter',
        titleFont: 'Inter',
      })
      await _loadIntoEditor(newSlides, CW, CH)
    } catch (e) {
      console.error('Failed to generate stories:', e)
      alert('Failed to auto-generate Instagram Stories.')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    cosmicData,
    postCaption,
    setPostCaption,
    isCopied,
    dataSource,
    setDataSource,
    handleGenerate,
    handleCopyCaption,
    handleGenerateCarousel,
    handleGenerateSignCarousel,
    handleGenerateStories,
  }
}
