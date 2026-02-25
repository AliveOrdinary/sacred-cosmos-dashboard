import { useState, useRef, useEffect } from 'react'
import * as fabric from 'fabric'
import { supabase } from '@/lib/supabase'
import sundayData from '../../sample data sunday.json'
import restdaysData from '../../sample data restdays.json'
import { GRADIENTS, ZODIAC_SIGNS, STORY_BACKGROUNDS } from '@/lib/constants'

// Sample data for local development
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
  const editorRef = useRef(editor)
  
  console.log("[useCosmicData Render] Received editor:", editor ? "Valid Canvas" : "null")

  useEffect(() => {
    console.log("[useCosmicData useEffect] Editor prop changed to:", editor ? "Valid Canvas" : "null")
    editorRef.current = editor
  }, [editor])

  const [dataSource, setDataSource] = useState('supabase')  // 'supabase' | 'sunday' | 'restdays'
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
      let normalizedPayload

      if (dataSource === 'supabase') {
        // Fetch latest day's data from Supabase
        const { data, error } = await supabase
          .from('cosmic_data')
          .select('*')
          .order('date', { ascending: false })
          .limit(1)
          .single()

        console.log('[Supabase] Response:', { data, error })

        if (error) throw new Error(`Supabase: ${error.message}`)
        if (!data?.payload) throw new Error('No cosmic data found in database yet.')

        // Handle case where n8n stored payload as a JSON string instead of object
        let payload = data.payload
        if (typeof payload === 'string') {
          try { payload = JSON.parse(payload) } catch {}
        }
        normalizedPayload = [payload]
      } else {
        // Sample data for local development
        await new Promise(resolve => setTimeout(resolve, 400))
        const jsonResponse = SAMPLE_DATA[dataSource]
        normalizedPayload = Array.isArray(jsonResponse) ? jsonResponse : [jsonResponse]
      }

      setCosmicData(normalizedPayload)
      if (normalizedPayload.length > 0 && normalizedPayload[0].master_social_post) {
        setPostCaption(normalizedPayload[0].master_social_post)
      }
      try {
        localStorage.setItem('cosmicData', JSON.stringify(normalizedPayload))
      } catch (e) { console.warn('Could not save data to localStorage', e) }
    } catch (error) {
      console.error('Cosmic connection failed:', error)
      alert(`Data fetch failed: ${error.message}`)
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

    const ed = editorRef.current
    if (!ed) {
      console.warn("Editor instance is null, cannot load slides.")
      return
    }

    ed.clear()
    await ed.loadFromJSON(newSlides[0])
    ed.setDimensions({ width: CW, height: CH })
    ed.renderAll()
  }

  // ---------------------------------------------------------------------------
  // MANIFESTATION CAROUSEL  — also loads the social media caption
  // ---------------------------------------------------------------------------
  const handleGenerateCarousel = async () => {
    if (!cosmicData || cosmicData.length === 0) return
    const payload = cosmicData[0]
    const posts = payload.element_content_raw?.manifestation_posts
    if (!posts || posts.length === 0) return

    setIsLoading(true)
    try {
      const items = posts.map(p => ({
        title: p.theme.replace('_', ' ').toUpperCase(),
        body: p.post || p.content || '',
      }))

      // CTA overlay — append a final slide if any post has a call_to_action
      const lastCTA = [...posts].reverse().find(p => p.call_to_action)?.call_to_action
      if (lastCTA) {
        items.push({
          title: '✨ YOUR COSMIC INVITATION',
          body: lastCTA,
          gradientColors: ['#1a0533', '#f59e0b'],
        })
      }

      const { newSlides, CW, CH } = await _buildSlides(items)
      await _loadIntoEditor(newSlides, CW, CH)

      // Auto-load caption
      if (payload.master_social_post) {
        setPostCaption(payload.master_social_post)
      }
    } catch (e) {
      console.error('Failed to generate carousel:', e)
      alert('Failed to auto-generate carousel.')
    } finally {
      setIsLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // ELEMENT POSTS  (4-slide carousel: fire / earth / air / water)
  // ---------------------------------------------------------------------------
  const ELEMENTS = [
    { key: 'fire_signs',  emoji: '🔥', label: 'FIRE SIGNS',  gradient: ['#dc2626', '#f97316'] },
    { key: 'earth_signs', emoji: '🌍', label: 'EARTH SIGNS', gradient: ['#15803d', '#a16207'] },
    { key: 'air_signs',   emoji: '💨', label: 'AIR SIGNS',   gradient: ['#0ea5e9', '#a855f7'] },
    { key: 'water_signs', emoji: '💧', label: 'WATER SIGNS', gradient: ['#1d4ed8', '#06b6d4'] },
  ]

  const handleGenerateElementPosts = async () => {
    if (!cosmicData || cosmicData.length === 0) return
    const payload = cosmicData[0]
    const ec = payload.element_content_raw
    if (!ec) return

    const items = ELEMENTS
      .filter(el => ec[el.key]?.message)
      .map(el => {
        // The message starts with the title in caps, then \n\n, then body
        const raw = ec[el.key].message
        const lines = raw.split('\n\n')
        const title = `${el.emoji} ${lines[0] || el.label}`
        const body = lines.slice(1).join('\n\n')
        return { title, body, gradientColors: el.gradient }
      })

    if (items.length === 0) return

    setIsLoading(true)
    try {
      // CTA overlay — append a combined CTA slide
      const ctaParts = ELEMENTS
        .filter(el => ec[el.key]?.call_to_action)
        .map(el => `${el.emoji} ${ec[el.key].call_to_action}`)
      if (ctaParts.length > 0) {
        items.push({
          title: '✨ YOUR COSMIC INVITATION',
          body: ctaParts.join('\n\n'),
          gradientColors: ['#1a0533', '#f59e0b'],
        })
      }

      const { newSlides, CW, CH } = await _buildSlides(items)
      await _loadIntoEditor(newSlides, CW, CH)

      // Build caption from call_to_action fields
      if (ctaParts.length > 0) {
        const base = payload.master_social_post || ''
        setPostCaption(`${ctaParts.join('\n\n')}\n\n${base}`.trim())
      }
    } catch (e) {
      console.error('Failed to generate element posts:', e)
      alert('Failed to auto-generate element posts.')
    } finally {
      setIsLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // INDIVIDUAL SIGN CAROUSEL  — split into 2 posts of 6 signs each
  //   part 1: ♈ Aries → ♍ Virgo    part 2: ♎ Libra → ♓ Pisces
  // ---------------------------------------------------------------------------
  const handleGenerateSignCarousel = async (part = 1) => {
    if (!cosmicData || cosmicData.length === 0) return
    const payload = cosmicData[0]
    const horoscopes = payload.daily_content_raw?.individual_horoscopes
    if (!horoscopes) return

    const allSigns = ZODIAC_SIGNS.filter(s => horoscopes[s.key])
    if (allSigns.length === 0) return

    // Split into two halves
    const mid = Math.ceil(allSigns.length / 2)
    const signsForPart = part === 1 ? allSigns.slice(0, mid) : allSigns.slice(mid)

    setIsLoading(true)
    try {
      // Cosmic overview as the intro slide
      const introSlide = horoscopes.cosmic_overview ? [{
        title: "TODAY'S COSMIC ENERGY",
        body: horoscopes.cosmic_overview,
        gradientColors: ['#1a0533', '#4a1a7a'],
      }] : []

      const signSlides = signsForPart.map((sign, idx) => ({
        title: `${sign.symbol} ${sign.name.toUpperCase()}`,
        body: horoscopes[sign.key],
        gradientColors: GRADIENTS[(part === 1 ? idx : idx + mid) % GRADIENTS.length].colors,
      }))

      const items = [...introSlide, ...signSlides]

      const { newSlides, CW, CH } = await _buildSlides(items, {
        titleFontSize: 64,
        bodyFontStart: Math.round(30 * Math.sqrt(canvasDimensions.height / 1080)),
      })
      await _loadIntoEditor(newSlides, CW, CH)

      // Auto-load caption
      if (payload.master_social_post) {
        const partLabel = part === 1 ? '(Part 1 of 2)' : '(Part 2 of 2)'
        setPostCaption(`${partLabel}\n\n${payload.master_social_post}`)
      }
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

    // Use the top-level instagram_stories array
    const storySlides = payload.instagram_stories
    if (!storySlides || storySlides.length === 0) return

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

  // ---------------------------------------------------------------------------
  // WEEKLY FORECAST CAROUSEL  (Sunday only — split into 2 parts like signs)
  // ---------------------------------------------------------------------------
  const handleGenerateWeeklyCarousel = async (part = 1) => {
    if (!cosmicData || cosmicData.length === 0) return
    const payload = cosmicData[0]
    const wc = payload.weekly_content_raw
    if (!wc || !wc.weekly_theme) return  // empty on non-Sundays

    const allSigns = ZODIAC_SIGNS.filter(s => wc[s.key])
    if (allSigns.length === 0) return

    const mid = Math.ceil(allSigns.length / 2)
    const signsForPart = part === 1 ? allSigns.slice(0, mid) : allSigns.slice(mid)

    setIsLoading(true)
    try {
      // Intro slide with the weekly theme
      const introSlide = [{
        title: "🌟 THIS WEEK'S COSMIC THEME",
        body: wc.weekly_theme,
        gradientColors: ['#1e1b4b', '#6d28d9'],
      }]

      const signSlides = signsForPart.map((sign, idx) => {
        const data = wc[sign.key]
        // Combine the 3 most impactful sub-fields for a condensed weekly card
        const sections = [
          data.cosmic_energy,
          `❤️ ${data.heart_guidance}`,
          `🎯 ${data.life_purpose}`,
        ].filter(Boolean)
        return {
          title: `${sign.symbol} ${sign.name.toUpperCase()}`,
          body: sections.join('\n\n'),
          gradientColors: GRADIENTS[(part === 1 ? idx : idx + mid) % GRADIENTS.length].colors,
        }
      })

      const items = [...introSlide, ...signSlides]

      const { newSlides, CW, CH } = await _buildSlides(items, {
        titleFontSize: 56,
        bodyFontStart: Math.round(26 * Math.sqrt(canvasDimensions.height / 1080)),
      })
      await _loadIntoEditor(newSlides, CW, CH)

      if (payload.master_social_post) {
        const partLabel = part === 1 ? '(Part 1 of 2)' : '(Part 2 of 2)'
        setPostCaption(`Weekly Forecast ${partLabel}\n\n${payload.master_social_post}`)
      }
    } catch (e) {
      console.error('Failed to generate weekly carousel:', e)
      alert('Failed to auto-generate weekly carousel.')
    } finally {
      setIsLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // SPIRITUAL PRACTICE CARD  (single slide)
  // ---------------------------------------------------------------------------
  const handleGenerateSpiritualPractice = async () => {
    if (!cosmicData || cosmicData.length === 0) return
    const payload = cosmicData[0]
    const practice = payload.daily_content_raw?.individual_horoscopes?.spiritual_practice
    if (!practice) return

    setIsLoading(true)
    try {
      const items = [{
        title: "🧘 TODAY'S SPIRITUAL PRACTICE",
        body: practice,
        gradientColors: ['#134e4a', '#4a1a7a'],
      }]

      const { newSlides, CW, CH } = await _buildSlides(items, {
        titleFontSize: 52,
      })
      await _loadIntoEditor(newSlides, CW, CH)

      if (payload.master_social_post) {
        setPostCaption(payload.master_social_post)
      }
    } catch (e) {
      console.error('Failed to generate spiritual practice:', e)
      alert('Failed to auto-generate spiritual practice card.')
    } finally {
      setIsLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // MANIFESTATION FOCUS CARD  (single slide)
  // ---------------------------------------------------------------------------
  const handleGenerateManifestationFocus = async () => {
    if (!cosmicData || cosmicData.length === 0) return
    const payload = cosmicData[0]
    // Prefer the raw-level field, fall back to individual_horoscopes version
    const focus = payload.daily_content_raw?.manifestation_focus
      || payload.daily_content_raw?.individual_horoscopes?.manifestation_focus
    if (!focus) return

    setIsLoading(true)
    try {
      const items = [{
        title: '✨ MANIFESTATION FOCUS',
        body: focus,
        gradientColors: ['#78350f', '#f59e0b'],
      }]

      const { newSlides, CW, CH } = await _buildSlides(items, {
        titleFontSize: 56,
      })
      await _loadIntoEditor(newSlides, CW, CH)

      if (payload.master_social_post) {
        setPostCaption(payload.master_social_post)
      }
    } catch (e) {
      console.error('Failed to generate manifestation focus:', e)
      alert('Failed to auto-generate manifestation focus card.')
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
    handleGenerateElementPosts,
    handleGenerateStories,
    handleGenerateWeeklyCarousel,
    handleGenerateSpiritualPractice,
    handleGenerateManifestationFocus,
  }
}
