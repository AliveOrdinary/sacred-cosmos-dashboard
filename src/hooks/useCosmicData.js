import { useState, useRef, useEffect } from 'react'
import * as fabric from 'fabric'
import { supabase } from '@/lib/supabase'
import sundayData from '../../sample data sunday.json'
import restdaysData from '../../sample data restdays.json'
import { ZODIAC_SIGNS, SLIDE_THEME, ELEMENT_ACCENTS, GLYPH_SVGS, GLYPH_KEY_FOR_SYMBOL } from '@/lib/constants'

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
// Canonical output formats. 'feed' is the square default the editor loads with;
// 'story' is 9:16 for stories and the practice card.
const SLIDE_FORMATS = {
  feed: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
}

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
    // Every generator builds at a DECLARED format. Previously these fell back
    // to the live canvasDimensions, so generating a story left the canvas 9:16
    // and every feed generator afterwards silently inherited it.
    const fmt = SLIDE_FORMATS[opts.format] || null
    const CW = opts.width || fmt?.width || SLIDE_FORMATS.feed.width
    const CH = opts.height || fmt?.height || SLIDE_FORMATS.feed.height
    const isStory = CH / CW > 1.3
    const S = CW / 1080 // horizontal scale factor relative to design size

    // The canvas measures text with whatever font is available *right now* —
    // wait for the display/body fonts so slides don't render in a fallback.
    const fontSpecs = [
      `300 64px ${SLIDE_THEME.titleFont}`,
      `600 64px ${SLIDE_THEME.titleFont}`,
      `400 36px ${SLIDE_THEME.bodyFont}`,
      `400 24px '${SLIDE_THEME.monoFont}'`,
      `700 24px '${SLIDE_THEME.monoFont}'`,
    ]
    try {
      // load() resolving does not guarantee the face is usable yet — verify
      // with check() and keep retrying up to 5s before measuring anything.
      const deadline = Date.now() + 5000
      await Promise.all(fontSpecs.map((f) => document.fonts.load(f)))
      while (!fontSpecs.every((f) => document.fonts.check(f)) && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 150))
        await Promise.all(fontSpecs.map((f) => document.fonts.load(f)))
      }
      if (!fontSpecs.every((f) => document.fonts.check(f))) {
        console.warn('[slides] display fonts not confirmed loaded — measurements may use fallback metrics')
      }
    } catch { /* fabric falls back gracefully */ }

    // Fabric caches character widths per font family. If anything measured
    // before Fraunces/Inter finished loading, the cache holds fallback-font
    // widths under the real font names — making every wrap and line-width
    // measurement wrong even after the fonts load. Flush it so this build
    // measures with the actual fonts.
    try {
      fabric.cache.clearFontCache(SLIDE_THEME.titleFont)
      fabric.cache.clearFontCache(SLIDE_THEME.bodyFont)
      fabric.cache.clearFontCache(SLIDE_THEME.monoFont)
    } catch { /* older fabric builds: cache API absent, measurements unchanged */ }

    const PAD = Math.round(CW * 0.09)
    const safeW = CW - PAD * 2

    const buildCanvas = new fabric.StaticCanvas(null, { width: CW, height: CH })
    const newSlides = []
    const INK = SLIDE_THEME.ink

    // Masthead date label, e.g. "JUL 24"
    const mastDate = (opts.dateLabel || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' })).toUpperCase()

    // Parse each needed stamp glyph once; loadSVGFromString is async.
    const stampCache = {}
    const glyphFor = (symbol) => GLYPH_KEY_FOR_SYMBOL[symbol] || 'mark-asterisk'
    const neededKeys = [...new Set(items.map((it) => glyphFor(it.glyph)))]
    for (const key of neededKeys) {
      try {
        const { objects, options } = await fabric.loadSVGFromString(GLYPH_SVGS[key])
        const good = (objects || []).filter(Boolean)
        good.forEach((o) => o.set({ stroke: INK, fill: '' }))
        stampCache[key] = { objects: good, options }
      } catch (e) {
        console.warn('[slides] glyph parse failed for', key, e)
      }
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      buildCanvas.clear()
      const eyebrowTint = item.accent || SLIDE_THEME.footerInk

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

      // ── Faint starfield, deterministic per slide ──
      for (let st = 0; st < 9; st++) {
        const sx = ((st * 137 + i * 61) % 100) / 100
        const sy = ((st * 211 + i * 97) % 100) / 100
        buildCanvas.add(new fabric.Circle({
          left: Math.round(sx * CW), top: Math.round(CH * 0.16 + sy * CH * 0.8),
          radius: Math.max(1.4, (1.2 + (st % 3) * 0.5) * S),
          fill: SLIDE_THEME.moonlight,
          opacity: 0.16 + (st % 4) * 0.07,
          originX: 'center', originY: 'center',
        }))
      }

      // ── Masthead: mono brand line left, date right, dashed rule under ──
      const mastY = isStory ? Math.round(CH * 0.06) : Math.round(CH * 0.055)
      const mastFont = {
        fontFamily: SLIDE_THEME.monoFont, fontWeight: 400,
        fontSize: Math.round(23 * S), charSpacing: 110,
        fill: SLIDE_THEME.footerInk,
      }
      buildCanvas.add(new fabric.FabricText('SACRED COSMOS', {
        ...mastFont, originX: 'left', originY: 'top', left: PAD, top: mastY,
      }))
      buildCanvas.add(new fabric.FabricText(mastDate, {
        ...mastFont, originX: 'right', originY: 'top', left: CW - PAD, top: mastY,
      }))
      const ruleY = mastY + Math.round(42 * S)
      buildCanvas.add(new fabric.Line([PAD, ruleY, CW - PAD, ruleY], {
        stroke: SLIDE_THEME.dashRule,
        strokeWidth: Math.max(2, Math.round(2 * S)),
        strokeDashArray: [Math.round(9 * S), Math.round(9 * S)],
      }))

      // ── Red stamp, top-right below the rule ──
      const stampEntry = stampCache[glyphFor(item.glyph)]
      if (stampEntry && stampEntry.objects.length) {
        const stampSize = Math.round(140 * S)
        const cx = CW - PAD - stampSize / 2
        const cy = ruleY + Math.round(36 * S) + stampSize / 2
        buildCanvas.add(new fabric.Circle({
          originX: 'center', originY: 'center', left: cx, top: cy,
          radius: stampSize / 2,
          fill: '', stroke: INK, strokeWidth: Math.max(3, Math.round(3.5 * S)),
          angle: 8, opacity: 0.9,
        }))
        const glyphGroup = fabric.util.groupSVGElements(
          stampEntry.objects.map((o) => (o.clone ? o : o)), stampEntry.options
        )
        glyphGroup.set({ originX: 'center', originY: 'center', left: cx, top: cy, angle: 8, opacity: 0.9 })
        glyphGroup.scaleToHeight(stampSize * 0.52)
        buildCanvas.add(glyphGroup)
      }

      let cursorY = ruleY + Math.round(CH * (isStory ? 0.075 : 0.09))

      // ── Eyebrow: lowercase mono label, left-aligned, element-tinted ──
      if (item.eyebrow) {
        const eyebrow = new fabric.Textbox(item.eyebrow.toLowerCase(), {
          originX: 'left', originY: 'top',
          left: PAD, top: cursorY, width: Math.round(safeW * 0.78),
          fontFamily: SLIDE_THEME.monoFont,
          fontWeight: 400,
          fontSize: Math.round(26 * S),
          charSpacing: 130,
          fill: eyebrowTint,
          textAlign: 'left',
        })
        buildCanvas.add(eyebrow)
        buildCanvas.renderAll()
        cursorY += eyebrow.height + Math.round(CH * 0.024)
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
          fontWeight: 300,
          fill: SLIDE_THEME.moonlight,
          textAlign: 'left',
          lineHeight: 1.1,
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

      // ── Red ink rule under the title ──
      const rule = new fabric.Rect({
        originX: 'left', originY: 'top',
        left: PAD, top: cursorY,
        width: Math.round(110 * S),
        height: Math.max(3, Math.round(4 * S)),
        fill: INK,
        opacity: 0.9,
        rx: 2, ry: 2,
      })
      buildCanvas.add(rule)
      cursorY += rule.height

      // ── Footer: handle left, slide dots right ──
      const footerY = CH - Math.round(CH * (isStory ? 0.055 : 0.07))
      buildCanvas.add(new fabric.FabricText(SLIDE_THEME.handle, {
        originX: 'left', originY: 'center',
        left: PAD, top: footerY,
        fontFamily: SLIDE_THEME.monoFont,
        fontWeight: 400,
        fontSize: Math.round(23 * S),
        charSpacing: 110,
        fill: SLIDE_THEME.footerInk,
      }))

      if (!isStory && items.length > 1) {
        // Tick marks, matching the reel progress language
        const tw = Math.round(34 * S)
        const th = Math.max(2, Math.round(3 * S))
        const gap = Math.round(12 * S)
        const totalW = items.length * tw + (items.length - 1) * gap
        let dx = CW - PAD - totalW
        for (let d = 0; d < items.length; d++) {
          buildCanvas.add(new fabric.Rect({
            originX: 'left', originY: 'center',
            left: dx, top: footerY,
            width: tw, height: th,
            fill: d === i ? INK : SLIDE_THEME.dotOff,
          }))
          dx += tw + gap
        }
      }

      // ── Body: Inter, no glow, iterative fit, centered in remaining zone ──
      const bodyZoneTop = cursorY + Math.round(CH * 0.02)
      const bodyZoneBottom = footerY - Math.round(CH * 0.05)
      const maxBodyH = bodyZoneBottom - bodyZoneTop
      const bodyW = Math.round(safeW * 0.96)

      const bodyBase = {
        originX: 'left', originY: 'top',
        left: PAD,
        width: bodyW,
        fontFamily: SLIDE_THEME.bodyFont,
        fontWeight: 300,
        fill: SLIDE_THEME.mist,
        textAlign: 'left',
        lineHeight: 1.6,
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

    // Keep React state in step with what was actually built. useFabricCanvas
    // re-applies canvasDimensions to the editor on change, so if state lags the
    // frame reverts and only a refresh appears to fix it.
    setCanvasDimensions((prev) =>
      prev.width === CW && prev.height === CH ? prev : { width: CW, height: CH }
    )
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
        bodyFontStart: 36,
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
      // Frame follows the declared format via _loadIntoEditor; set it up front
      // too so the canvas visibly switches while the slides build.
      setCanvasDimensions(SLIDE_FORMATS.story)

      const items = storySlides.map((slide) => ({
        eyebrow: _brandEyebrow(payload, 'Sacred Cosmos'),
        title: '',
        glyph: '✦',
        body: slide.text || '',
      }))

      const { newSlides, CW, CH } = await _buildSlides(items, {
        format: 'story',
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

      // Intro slide: the week's theme (keeps each part at intro + 6 = 7 slides,
      // inside the Graph API's 10-image carousel ceiling)
      items.push({
        eyebrow: `This Week · Part ${part} of 2`,
        title: 'The Forecast',
        glyph: '✦',
        accent: '#D8593E',
        body: wc.weekly_theme,
      })

      // One slide per sign: cosmic energy + one guidance line. Everything
      // trimmed here (purpose, insight, lucky moments) moves to the caption.
      signsForPart.forEach((sign) => {
        const data = wc[sign.key]
        items.push({
          eyebrow: `Weekly Forecast · ${sign.element}`,
          title: sign.name,
          glyph: sign.symbol,
          accent: ELEMENT_ACCENTS[sign.element],
          body: `${data.cosmic_energy}\n\n${data.heart_guidance}`,
        })
      })

      const { newSlides, CW, CH } = await _buildSlides(items, {
        titleFontSize: 56,
        bodyFontStart: 36,
      })
      await _loadIntoEditor(newSlides, CW, CH)

      if (wc.weekly_theme) {
        const signLines = signsForPart
          .map((sign) => `${sign.symbol} ${sign.name} — ${wc[sign.key].lucky_moments}`)
          .join('\n')
        setPostCaption(
          `${wc.weekly_theme}\n\nYour lucky moment this week:\n${signLines}\n\nSave your sign, and check the other part for the rest of the zodiac.\n\n#weeklyhoroscope #astrology #zodiacsigns`
        )
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
        format: 'story',
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
