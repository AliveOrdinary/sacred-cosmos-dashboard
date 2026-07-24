// Sacred Cosmos reel render server.
// POST /render { composition: 'manifestation' | 'elements', date?: 'YYYY-MM-DD' }
// Flow: cosmic_data payload -> ElevenLabs TTS per line -> measure durations ->
// Remotion renderMedia -> upload mp4 to Supabase 'social-videos' -> reel_renders row.
import 'dotenv/config'
import express from 'express'
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
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
  const ttsDir = join(PUBLIC_DIR, 'tts', jobId)
  mkdirSync(ttsDir, { recursive: true })
  const lines = []
  const raw = spokenLines(composition, script)
  for (let i = 0; i < raw.length; i++) {
    const file = join(ttsDir, `${i}.mp3`)
    const seconds = await tts(raw[i].text, file)
    lines.push({
      ...raw[i],
      src: `${SELF}/tts/${jobId}/${i}.mp3`,
      durationInFrames: Math.round(seconds * FPS) + 10, // small breath between lines
    })
  }

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

  // 3. Upload
  const objectPath = `${jobId}.mp4`
  const { error: upErr } = await supabase.storage
    .from('social-videos')
    .upload(objectPath, readFileSync(outPath), { contentType: 'video/mp4', upsert: true })
  if (upErr) throw new Error('Storage upload failed: ' + upErr.message)
  const { data: pub } = supabase.storage.from('social-videos').getPublicUrl(objectPath)

  await upsertRender({ date: jobDate, composition, status: 'done', video_url: pub.publicUrl, caption: script.caption || '' })
  rmSync(ttsDir, { recursive: true, force: true })
  console.log(`✔ ${jobId} → ${pub.publicUrl}`)
  return pub.publicUrl
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
