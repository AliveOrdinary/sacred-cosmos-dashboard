import { useState, useRef, useEffect } from 'react'
import * as fabric from 'fabric'
import { supabase } from '@/lib/supabase'
import sundayData from '../../sample data sunday.json'
import restdaysData from '../../sample data restdays.json'
import { ZODIAC_SIGNS, SLIDE_THEME, ELEMENT_ACCENTS } from '@/lib/constants'

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

  useEffect(() => {
    handleGenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSource])

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
  // Cosmic editorial slide builder.
  // Every slide shares one ground (void + indigo bloom), Fraunces titles,
  // Inter body, and an accent (gold by default, element tint on sign slides).
  // Item shape: { eyebrow?, title?, body, glyph?, accent? }
  // ---------------------------------------------------------------------------
  const _toTitleCase = (str) =>
    String(str || '').toLowerCase().replace(/(^|[\s\-·])\p{L}/gu, (m) => m.toUpperCase())

  const _cleanTitle = (str) =>
    _toTitleCase(String(str || '').replace(/^[^\p{L}\p{N}]+/u, '').trim())

  // For hook-style titles: keep the writer's sentence case, just strip any
  // leading emoji and a trailing period.
  const _cleanHook = (str) =>
    String(str || '').replace(/^[^\p{L}\p{N}]+/u, '').replace(/\.\s*$/, '').trim()

  const _dateLabel = (payload) => {
    const d = payload?.date ? new Date(payload.date) : new Date()
    const valid = d instanceof Date && !isNaN(d)
    return (valid ? d : new Date()).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  }

  // Nakshatra-branded eyebrow: "ROHINI · THE GROWTH STAR · JULY 17".
  // Falls back to the plain label for payloads generated before v7.
  const _brandEyebrow = (payload, fallback) => {
    const name = payload?.nakshatra_name
    const trans = payload?.nakshatra_translation
    const date = _dateLabel(payload)
    return name && trans ? `${name} · ${trans} · ${date}` : `${fallback} · ${date}`
  }

  const _buildSlides = async (items, opts = {}) => {
    const CW = opts.width || canvasDimensions.width
    const CH = opts.height || canvasDimensions.height
    const isStory = CH / CW > 1.3
    const S = CW / 1080 // horizontal scale factor relative to design size

    // The canvas measures text with whatever font is available *right now* —
    // wait for the display/body fonts so slides don't render in a fallback.
    try {
      await Promise.all([
        document.fonts.load(`600 64px ${SLIDE_THEME.titleFont}`),
        document.fonts.load(`400 36px ${SLIDE_THEME.bodyFont}`),
        document.fonts.load(`600 24px ${SLIDE_THEME.bodyFont}`),
      ])
    } catch { /* fabric falls back gracefully */ }

    const PAD = Math.round(CW * 0.09)
    const safeW = CW - PAD * 2

    const buildCanvas = new fabric.StaticCanvas(null, { width: CW, height: CH })
    const newSlides = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      buildCanvas.clear()
      const accent = item.accent || SLIDE_THEME.gold

      // ── Ground: void with a soft indigo bloom falling from the top ──
      buildCanvas.backgroundColor = new fabric.Gradient({
        type: 'linear',
        coords: { x1: 0, y1: 0, x2: 0, y2: CH },
        colorStops: [
          { offset: 0, color: SLIDE_THEME.bloom },
          { offset: 0.55, color: SLIDE_THEME.void },
          { offset: 1, color: SLIDE_THEME.void },
        ],
      })

      // ── Signature glyph, barely there ──
      if (item.glyph) {
        buildCanvas.add(new fabric.FabricText(item.glyph, {
          fontFamily: SLIDE_THEME.titleFont,
          fontSize: Math.round(CW * 0.95),
          fill: accent,
          opacity: item.accent ? 0.05 : 0.035,
          originX: 'center',
          originY: 'center',
          left: CW / 2,
          top: CH / 2,
        }))
      }

      let cursorY = isStory ? Math.round(CH * 0.09) : PAD

      // ── Eyebrow ──
      if (item.eyebrow) {
        const longEyebrow = item.eyebrow.length > 38
        const eyebrow = new fabric.Textbox(item.eyebrow.toUpperCase(), {
          originX: 'left', originY: 'top',
          left: PAD, top: cursorY, width: safeW,
          fontFamily: SLIDE_THEME.bodyFont,
          fontWeight: 600,
          fontSize: Math.round((longEyebrow ? 21 : 24) * S),
          charSpacing: longEyebrow ? 180 : 320,
          fill: accent,
          textAlign: 'center',
        })
        buildCanvas.add(eyebrow)
        buildCanvas.renderAll()
        cursorY += eyebrow.height + Math.round(CH * 0.032)
      }

      // ── Title (Fraunces, warm ivory) ──
      if (item.title && item.title.trim()) {
        const baseSize = opts.titleFontSize
          ? Math.round(opts.titleFontSize * S * 1.15)
          : Math.round(66 * S)
        const len = item.title.length
        let size = baseSize
        if (len > 34) size = Math.max(Math.round(40 * S), baseSize - (len - 34) * 1.4)
        else if (len > 18) size = Math.max(Math.round(50 * S), baseSize - (len - 18) * 1)

        const titleBase = {
          originX: 'left', originY: 'top',
          left: PAD, top: cursorY, width: safeW,
          fontFamily: SLIDE_THEME.titleFont,
          fontWeight: 600,
          fill: SLIDE_THEME.moonlight,
          textAlign: 'center',
          lineHeight: 1.12,
        }
        // Measure the rendered lines and shrink until every line truly fits —
        // length-based guessing breaks when font metrics differ at render time.
        const minTitle = Math.round(30 * S)
        let title = null
        while (size >= minTitle) {
          if (title) buildCanvas.remove(title)
          title = new fabric.Textbox(item.title, { ...titleBase, fontSize: size })
          buildCanvas.add(title)
          buildCanvas.renderAll()
          const lineCount = title.textLines ? title.textLines.length : 1
          let maxLine = 0
          for (let li = 0; li < lineCount; li++) {
            maxLine = Math.max(maxLine, title.getLineWidth(li))
          }
          if (maxLine <= safeW * 0.98 && lineCount <= 3) break
          size -= 3
        }
        cursorY += title.height + Math.round(CH * 0.038)
      }

      // ── Accent rule ──
      const rule = new fabric.Rect({
        originX: 'center', originY: 'top',
        left: CW / 2, top: cursorY,
        width: Math.round(70 * S),
        height: Math.max(2, Math.round(2 * S)),
        fill: accent,
        opacity: 0.85,
      })
      buildCanvas.add(rule)
      cursorY += rule.height

      // ── Footer: handle left, slide dots right ──
      const footerY = CH - Math.round(CH * (isStory ? 0.055 : 0.07))
      buildCanvas.add(new fabric.FabricText(SLIDE_THEME.handle.toUpperCase(), {
        originX: 'left', originY: 'center',
        left: PAD, top: footerY,
        fontFamily: SLIDE_THEME.bodyFont,
        fontWeight: 500,
        fontSize: Math.round(21 * S),
        charSpacing: 220,
        fill: SLIDE_THEME.footerInk,
      }))

      if (!isStory && items.length > 1) {
        const r = Math.max(4, Math.round(6 * S))
        const gap = Math.round(16 * S)
        const totalW = items.length * r * 2 + (items.length - 1) * gap
        let dx = CW - PAD - totalW
        for (let d = 0; d < items.length; d++) {
          buildCanvas.add(new fabric.Circle({
            originX: 'left', originY: 'center',
            left: dx, top: footerY,
            radius: r,
            fill: d === i ? accent : SLIDE_THEME.dotOff,
          }))
          dx += r * 2 + gap
        }
      }

      // ── Body: Inter, no glow, iterative fit, centered in remaining zone ──
      const bodyZoneTop = cursorY + Math.round(CH * 0.02)
      const bodyZoneBottom = footerY - Math.round(CH * 0.05)
      const maxBodyH = bodyZoneBottom - bodyZoneTop
      const bodyW = Math.round(safeW * 0.92)

      const bodyBase = {
        originX: 'left', originY: 'top',
        left: (CW - bodyW) / 2,
        width: bodyW,
        fontFamily: SLIDE_THEME.bodyFont,
        fontWeight: 400,
        fill: SLIDE_THEME.mist,
        textAlign: 'center',
        lineHeight: 1.55,
      }

      let bodySize = opts.bodyFontStart || Math.round((isStory ? 40 : 34) * S)
      const minBody = Math.round(20 * S)
      let bodyText = null
      while (bodySize >= minBody) {
        if (bodyText) buildCanvas.remove(bodyText)
        bodyText = new fabric.Textbox(item.body || '', { ...bodyBase, fontSize: bodySize })
        buildCanvas.add(bodyText)
        buildCanvas.renderAll()
        if (bodyText.height <= maxBodyH) break
        bodySize -= 2
      }
      bodyText.set({ top: Math.max(bodyZoneTop, bodyZoneTop + (maxBodyH - bodyText.height) / 2) })

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
      const items = posts.map(p => {
        let bodyText = p.post || p.content || ''
        if (p.call_to_action) bodyText += `\n\n👇 ${p.call_to_action}`
        bodyText += `\n\n👇 Read the caption for today's cosmic manifestation timing`

        return {
          eyebrow: _brandEyebrow(payload, 'Daily Manifestation'),
          title: _cleanTitle(p.theme.replace(/_/g, ' ')),
          glyph: '✦',
          body: bodyText,
        }
      })

      const { newSlides, CW, CH } = await _buildSlides(items, {
        titleFontSize: 58,
      })
      await _loadIntoEditor(newSlides, CW, CH)

      // Auto-load caption with timing from all posts
      const timingParts = posts.filter(p => p.timing).map(p => `✨ ${p.theme.replace(/_/g, ' ').toUpperCase()}: ${p.timing}`)
      if (timingParts.length > 0) {
        setPostCaption(`${timingParts.join('\n\n')}\n\n#Manifestation #CosmicTiming #VedicAstrology`)
      } else if (payload.master_social_post) {
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
    { key: 'fire_signs',  emoji: '🔥', label: 'Fire Signs',  accent: ELEMENT_ACCENTS.fire },
    { key: 'earth_signs', emoji: '🌍', label: 'Earth Signs', accent: ELEMENT_ACCENTS.earth },
    { key: 'air_signs',   emoji: '💨', label: 'Air Signs',   accent: ELEMENT_ACCENTS.air },
    { key: 'water_signs', emoji: '💧', label: 'Water Signs', accent: ELEMENT_ACCENTS.water },
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
          let body = lines.slice(1).join('\n\n')

          if (ec[el.key].call_to_action) {
            body += `\n\n👇 ${ec[el.key].call_to_action}`
          }
          body += `\n\n👇 Read the caption for your element's daily spiritual practice`

          return {
            eyebrow: el.label,
            title: _cleanHook(lines[0]) || el.label,
            glyph: '✦',
            accent: el.accent,
            body,
          }
        })

      if (items.length === 0) return

      setIsLoading(true)
      try {
        const { newSlides, CW, CH } = await _buildSlides(items, {
          titleFontSize: 60,
        })
        await _loadIntoEditor(newSlides, CW, CH)

        // Build caption from spiritual_practice fields
        const practiceParts = ELEMENTS
          .filter(el => ec[el.key]?.spiritual_practice)
          .map(el => `${el.emoji} ${el.label}: ${ec[el.key].spiritual_practice}`)
          
        if (practiceParts.length > 0) {
          setPostCaption(`${practiceParts.join('\n\n')}\n\n#AstrologyElements #SpiritualPractice #DailyRitual`)
        } else if (payload.master_social_post) {
          setPostCaption(payload.master_social_post)
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
      const signSlides = signsForPart.map((sign) => ({
        eyebrow: `${sign.name} · ${sign.element}`,
        title: sign.name,
        glyph: sign.symbol,
        accent: ELEMENT_ACCENTS[sign.element],
        body: horoscopes[sign.key],
      }))

      const items = [...signSlides]

      const { newSlides, CW, CH } = await _buildSlides(items, {
        titleFontSize: 64,
        bodyFontStart: Math.round(36 * Math.sqrt(canvasDimensions.height / 1080)),
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

      const items = storySlides.map((slide) => ({
        eyebrow: _brandEyebrow(payload, 'Sacred Cosmos'),
        title: '',
        glyph: '✦',
        body: slide.text || '',
      }))

      const { newSlides, CW, CH } = await _buildSlides(items, {
        width: STORY_W,
        height: STORY_H,
        bodyFontStart: 42,
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
      const items = []

      signsForPart.forEach((sign) => {
        const data = wc[sign.key]
        
        // Slide 1: Energy, Heart, Purpose
        const part1Body = [
          `🌟 Cosmic Energy\n${data.cosmic_energy}`,
          `💖 Heart Guidance\n${data.heart_guidance}`,
          `🎯 Life Purpose\n${data.life_purpose}`
        ].join('\n\n')

        // Slide 2: Insight, Moments, Challenge
        const part2Body = [
          `🧘 Spiritual Insight\n${data.spiritual_insight}`,
          `✨ Lucky Moments\n${data.lucky_moments}`,
          `🌱 Gentle Challenge\n${data.gentle_challenge}`
        ].join('\n\n')

        items.push({
          eyebrow: `Weekly Forecast · ${sign.element}`,
          title: sign.name,
          glyph: sign.symbol,
          accent: ELEMENT_ACCENTS[sign.element],
          body: part1Body,
        })

        items.push({
          eyebrow: 'Weekly Forecast · Part Two',
          title: sign.name,
          glyph: sign.symbol,
          accent: ELEMENT_ACCENTS[sign.element],
          body: part2Body,
        })
      })

      const { newSlides, CW, CH } = await _buildSlides(items, {
        titleFontSize: 56,
        bodyFontStart: Math.round(36 * Math.sqrt(canvasDimensions.height / 1080)),
      })
      await _loadIntoEditor(newSlides, CW, CH)

      if (wc.weekly_theme) {
        setPostCaption(`${wc.weekly_theme}\n\nSwipe through to see what the cosmos has in store for your sign this week! ✨👇\n\n#WeeklyHoroscope #CosmicForecast`)
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
        eyebrow: _brandEyebrow(payload, 'Spiritual Practice'),
        title: "Today's Practice",
        glyph: '✦',
        body: practice,
      }]

      // Practice runs as a story in the posting rotation — build it 9:16 natively
      const { newSlides, CW, CH } = await _buildSlides(items, {
        width: 1080,
        height: 1920,
        titleFontSize: 52,
      })
      await _loadIntoEditor(newSlides, CW, CH)

      if (payload.daily_content_raw?.individual_horoscopes?.manifestation_focus) {
        setPostCaption(`Taking a moment to ground into today's cosmic energy. ✨\n\n${payload.daily_content_raw.individual_horoscopes.manifestation_focus}\n\nWill you be trying today's practice? Let me know how it feels below! 👇`)
      } else {
        setPostCaption(`Taking a moment to ground into today's cosmic energy. ✨\n\nWill you be trying today's practice? Let me know how it feels below! 👇`)
      }
    } catch (e) {
      console.error('Failed to generate spiritual practice:', e)
      alert('Failed to auto-generate spiritual practice card.')
    } finally {
      setIsLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // DAILY COSMIC OVERVIEW CARD (4-slide carousel)
  // ---------------------------------------------------------------------------
  const handleGenerateDailyOverview = async () => {
    if (!cosmicData || cosmicData.length === 0) return
    const payload = cosmicData[0]
    const horoscopes = payload.daily_content_raw?.individual_horoscopes
    if (!horoscopes) return

    setIsLoading(true)
    try {
      const items = []
      
      const eyebrow = _brandEyebrow(payload, 'Daily Overview')
      if (horoscopes.cosmic_overview) {
        items.push({ eyebrow, title: "Today's Cosmic Energy", glyph: '✦', body: horoscopes.cosmic_overview })
      }
      if (horoscopes.collective_guidance) {
        items.push({ eyebrow, title: 'Collective Guidance', glyph: '✦', body: horoscopes.collective_guidance })
      }
      if (horoscopes.timing_wisdom) {
        items.push({ eyebrow, title: 'Timing Wisdom', glyph: '✦', body: horoscopes.timing_wisdom })
      }
      if (horoscopes.manifestation_focus) {
        items.push({ eyebrow, title: 'Manifestation Focus', glyph: '✦', body: horoscopes.manifestation_focus })
      }

      if (items.length === 0) {
        setIsLoading(false)
        return
      }

      const { newSlides, CW, CH } = await _buildSlides(items, {
        titleFontSize: 56,
      })
      await _loadIntoEditor(newSlides, CW, CH)

      if (payload.master_social_post) {
        setPostCaption(payload.master_social_post)
      }
    } catch (e) {
      console.error('Failed to generate daily overview:', e)
      alert('Failed to auto-generate daily overview carousel.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateWeeklyOverview = async () => {
    if (!cosmicData || cosmicData.length === 0) return
    const payload = cosmicData[0]
    if (!payload?.weekly_content_raw) {
      alert("No weekly_content_raw object found in payload.")
      return
    }

    if (!editor) {
      alert('Editor not initialized!')
      return
    }

    setIsLoading(true)
    try {
      const wc = payload.weekly_content_raw

      const items = []
      
      const eyebrow = 'Weekly Overview'
      if (wc.weekly_theme) {
        items.push({ eyebrow, title: "This Week's Theme", glyph: '✦', body: wc.weekly_theme })
      }

      if (wc.collective_message) {
        items.push({ eyebrow, title: 'Collective Message', glyph: '✦', body: wc.collective_message })
      }

      if (wc.cosmic_timing) {
        items.push({ eyebrow, title: 'Cosmic Timing', glyph: '✦', body: wc.cosmic_timing })
      }

      if (wc.spiritual_practice) {
        items.push({ eyebrow, title: 'Spiritual Practice', glyph: '✦', body: wc.spiritual_practice })
      }

      if (wc.manifestation_focus) {
        items.push({ eyebrow, title: 'Manifestation Focus', glyph: '✦', body: wc.manifestation_focus })
      }

      if (items.length === 0) {
        alert('No core weekly metadata found.')
        setIsLoading(false)
        return
      }

      const { newSlides, CW, CH } = await _buildSlides(items)
      await _loadIntoEditor(newSlides, CW, CH)

      if (wc.weekly_theme) {
        setPostCaption(`${wc.weekly_theme}\n\nSwipe through to see what the cosmos has in store for your sign this week! ✨👇\n\n#WeeklyHoroscope #CosmicForecast`)
      }
    } catch (e) {
      console.error('Failed to generate weekly overview:', e)
      alert("Failed to generate weekly overview. Check console.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateWeeklyChallenge = async () => {
    if (!cosmicData || cosmicData.length === 0) return
    const payload = cosmicData[0]
    const wc = payload.weekly_content_raw
    const weeklyChallenge = wc?.weekly_challenge
    
    if (!weeklyChallenge) {
      alert("No weekly_content_raw.weekly_challenge object found in payload.")
      return
    }

    if (!editor) {
      alert('Editor not initialized!')
      return
    }

    setIsLoading(true)
    try {
      const items = [
        {
          eyebrow: 'Sacred Cosmos',
          title: 'Weekly Challenge',
          glyph: '✦',
          body: weeklyChallenge,
        }
      ]

      const { newSlides, CW, CH } = await _buildSlides(items)
      await _loadIntoEditor(newSlides, CW, CH)

      if (wc.collective_message) {
        setPostCaption(`New week, new cosmic rhythm. 🌊\n\n${wc.collective_message}\n\nDrop a 🤍 in the comments if you are taking on this week's heart practice with me! Let's hold space for each other.`)
      }
    } catch (e) {
      console.error('Failed to generate weekly challenge:', e)
      alert("Failed to generate weekly challenge post. Check console.")
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
    handleGenerateWeeklyOverview,
    handleGenerateWeeklyChallenge,
    handleGenerateSpiritualPractice,
    handleGenerateDailyOverview,
  }
}
