// Sacred Cosmos reel render server.
// POST /render { composition: 'manifestation' | 'elements', date?: 'YYYY-MM-DD' }
// Flow: cosmic_data payload -> ElevenLabs TTS per line -> measure durations ->
// Remotion renderMedia -> upload mp4 to Supabase 'social-videos' -> reel_renders row.
import 'dotenv/config'
import express from 'express'
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import { parseFile } from 'music-metadata'

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = join(here, '..')
const PUBLIC_DIR = join(ROOT, 'public')
const FPS = 30
// Silence appended after each spoken line. Elements needs a real beat between
// lines because each one addresses a different audience; manifestation is one
// continuous argument and reads better tight.
const BREATH_FRAMES = { manifestation: 10, elements: 24 }
const HOOK_EXTRA_FRAMES = { manifestation: 4, elements: 14 }
const PORT = Number(process.env.PORT || 3123)
const SELF = process.env.PUBLIC_HOST || `http://127.0.0.1:${PORT}`

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ELEVENLABS_API_KEY', 'ELEVENLABS_VOICE_ID']
for (const k of required) {
  if (!process.env[k]) {
    console.error(`Missing env var ${k} — copy .env.example to .env and fill it in.`)
    process.exit(1)
  }
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const app = express()
app.use(express.json())
app.use(express.static(PUBLIC_DIR))

// Bundle the Remotion project once at boot; renders reuse the serveUrl.
console.log(`Sacred Cosmos reel server — build marker: layout-v2+tts-cache+cdn-bust`)
console.log('Bundling Remotion project…')
const serveUrl = await bundle({ entryPoint: join(ROOT, 'src', 'index.jsx') })
console.log('Bundle ready.')

const COMPOSITION_ID = { manifestation: 'ManifestationReel', elements: 'ElementsReel' }

function spokenLines(composition, script) {
  if (composition === 'manifestation') {
    return [
      { kind: 'hook', text: script.hook },
      ...script.beats.map((b) => ({ kind: 'beat', text: b })),
      { kind: 'cta', text: script.cta },
    ]
  }
  return [
    { kind: 'hook', text: script.hook },
    { kind: 'fire', text: script.fire },
    { kind: 'earth', text: script.earth },
    { kind: 'air', text: script.air },
    { kind: 'water', text: script.water },
    { kind: 'cta', text: script.cta },
  ]
}

// TTS clips are content-addressed: same text + voice + model = same file, so
// re-rendering an unedited script costs zero ElevenLabs credits. This matters
// during tuning passes where the same script is rendered many times.
function ttsCacheKey(text) {
  return createHash('sha1')
    .update([text, process.env.ELEVENLABS_VOICE_ID, process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2'].join('|'))
    .digest('hex')
    .slice(0, 16)
}

async function tts(text, outPath) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2',
        voice_settings: { stability: 0.55, similarity_boost: 0.7, style: 0.2 },
      }),
    }
  )
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`)
  writeFileSync(outPath, Buffer.from(await res.arrayBuffer()))
  const meta = await parseFile(outPath)
  return meta.format.duration || 2
}

async function fetchPayload(date) {
  // Lesson learned in v8 hardening: date-equality filters on Supabase were
  // unreliable — prefer newest-row ordering, with eq() only as a first try.
  if (date) {
    const { data } = await supabase.from('cosmic_data').select('payload, date').eq('date', date).limit(1)
    if (data && data.length) return data[0]
  }
  const { data, error } = await supabase
    .from('cosmic_data')
    .select('payload, date')
    .order('date', { ascending: false })
    .limit(1)
  if (error || !data || !data.length) throw new Error('No cosmic_data rows found: ' + (error?.message || ''))
  return data[0]
}

async function upsertRender(fields) {
  const { error } = await supabase
    .from('reel_renders')
    .upsert({ ...fields, updated_at: new Date().toISOString() }, { onConflict: 'date,composition' })
  if (error) console.error('reel_renders upsert failed:', error.message)
}

async function runJob({ composition, date }) {
  const row = await fetchPayload(date)
  const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload
  const jobDate = row.date
  const script = payload?.reel_scripts?.[composition]
  if (!script) throw new Error(`No reel_scripts.${composition} in payload for ${jobDate} — run Daily Workflow v8.5 first.`)

  await upsertRender({ date: jobDate, composition, status: 'rendering', video_url: null, error: null, caption: script.caption || '' })

  // 1. TTS per line, measure durations
  const jobId = `${jobDate}-${composition}`
  const ttsDir = join(PUBLIC_DIR, 'tts')
  mkdirSync(ttsDir, { recursive: true })
  const lines = []
  const raw = spokenLines(composition, script)
  let synthesized = 0
  let reused = 0
  for (let i = 0; i < raw.length; i++) {
    const key = ttsCacheKey(raw[i].text)
    const file = join(ttsDir, `${key}.mp3`)
    let seconds
    if (existsSync(file)) {
      seconds = (await parseFile(file)).format.duration || 2
      reused += 1
    } else {
      seconds = await tts(raw[i].text, file)
      synthesized += 1
    }
    lines.push({
      ...raw[i],
      src: `${SELF}/tts/${key}.mp3`,
      durationInFrames:
        Math.round(seconds * FPS) +
        (BREATH_FRAMES[composition] ?? 10) +
        (raw[i].kind === 'hook' ? HOOK_EXTRA_FRAMES[composition] ?? 0 : 0),
    })
  }
  console.log(`TTS: ${synthesized} synthesized, ${reused} reused from cache`)

  // 2. Render
  const seed = Number(String(jobDate).replace(/\D/g, '').slice(-6)) || 1
  const dateLabel = new Date(jobDate + 'T12:00:00Z')
    .toLocaleDateString('en-US', { day: '2-digit', month: 'short', timeZone: 'UTC' })
    .toUpperCase()
  const ambientPath = join(PUBLIC_DIR, 'audio', 'ambient.mp3')
  const inputProps = {
    lines,
    seed,
    dateLabel,
    ambientSrc: existsSync(ambientPath) ? `${SELF}/audio/ambient.mp3` : null,
  }
  const comp = await selectComposition({ serveUrl, id: COMPOSITION_ID[composition], inputProps })
  const outPath = join(PUBLIC_DIR, 'out', `${jobId}.mp4`)
  mkdirSync(dirname(outPath), { recursive: true })
  await renderMedia({ composition: comp, serveUrl, codec: 'h264', outputLocation: outPath, inputProps })

  // 3. Upload. Supabase serves public objects through a CDN, so overwriting a
  // fixed path leaves stale bytes cached for up to an hour — during a tuning
  // session that looks exactly like "the render didn't change anything".
  // A per-render suffix guarantees a fresh URL every time.
  const stamp = Date.now()
  const objectPath = `${jobId}-${stamp}.mp4`
  const { error: upErr } = await supabase.storage
    .from('social-videos')
    .upload(objectPath, readFileSync(outPath), {
      contentType: 'video/mp4',
      upsert: true,
      cacheControl: '300',
    })
  if (upErr) throw new Error('Storage upload failed: ' + upErr.message)
  const { data: pub } = supabase.storage.from('social-videos').getPublicUrl(objectPath)

  // Drop earlier renders of this same date+composition so the bucket doesn't
  // accumulate one file per tuning iteration.
  try {
    const { data: existing } = await supabase.storage.from('social-videos').list('', { limit: 100 })
    const stale = (existing || [])
      .filter((f) => f.name.startsWith(`${jobId}-`) && f.name !== objectPath)
      .map((f) => f.name)
    if (stale.length) await supabase.storage.from('social-videos').remove(stale)
  } catch (e) {
    console.warn('Could not prune old renders:', e.message)
  }

  await upsertRender({ date: jobDate, composition, status: 'done', video_url: pub.publicUrl, caption: script.caption || '' })
  pruneTtsCache()
  console.log(`✔ ${jobId} → ${pub.publicUrl}`)
  return pub.publicUrl
}

// Keep the cache bounded: drop clips untouched for two weeks. Yesterday's
// lines never recur (the prompt forbids repeats), so retention beyond that
// buys nothing.
function pruneTtsCache(maxAgeDays = 14) {
  const dir = join(PUBLIC_DIR, 'tts')
  if (!existsSync(dir)) return
  const cutoff = Date.now() - maxAgeDays * 86400000
  for (const f of readdirSync(dir)) {
    const full = join(dir, f)
    try {
      if (statSync(full).mtimeMs < cutoff) rmSync(full, { force: true })
    } catch { /* ignore */ }
  }
}

const busy = new Set()

app.post('/render', (req, res) => {
  const composition = req.body?.composition === 'elements' ? 'elements' : 'manifestation'
  const date = req.body?.date || null
  if (busy.has(composition)) return res.status(409).json({ status: 'busy', composition })
  busy.add(composition)
  res.status(202).json({ status: 'rendering', composition })
  runJob({ composition, date })
    .catch(async (err) => {
      console.error(`✖ ${composition} render failed:`, err.message)
      const row = await fetchPayload(date).catch(() => null)
      if (row) await upsertRender({ date: row.date, composition, status: 'error', error: String(err.message).slice(0, 500) })
    })
    .finally(() => busy.delete(composition))
})

app.get('/health', (_req, res) => res.json({ ok: true, busy: [...busy] }))

app.listen(PORT, () => console.log(`Reel render server on :${PORT}`))
