# Sacred Cosmos Reels

Remotion project + render server for the daily Manifestation and Elements reels.
Design system comes from `../brand/brand.tokens.json` and `../brand/glyphs/` —
edit those, never hardcode styles here.

## One-time setup

1. Run `supabase/migration_reels.sql` in the Supabase SQL editor, then create a
   **public** Storage bucket named `social-videos`.
2. Audition an ElevenLabs voice (calm, low, unhurried — the writing does the drama):
   list voices with `curl -H "xi-api-key: $KEY" https://api.elevenlabs.io/v1/voices`,
   generate a sample of the July 19 hook with 2–3 candidates, pick one, and pin its
   ID in `.env` as `ELEVENLABS_VOICE_ID`. Never change it after launch.
3. `cp .env.example .env` and fill it in.
4. Optional: drop a royalty-free ambient track at `public/audio/ambient.mp3`
   (it ducks to 12% under the voice automatically; reels work fine without it).
5. From the **repo root**: `docker compose -f reels/docker-compose.yml up -d --build`

## Develop locally (Mac)

```
cd reels && npm install && npm run studio   # visual preview with sample scripts
npm run server                              # real renders against live data
```

## API

- `POST :3123/render` `{ "composition": "manifestation" | "elements", "date": "YYYY-MM-DD"? }`
  → `202` immediately; progress lands in the `reel_renders` table
  (`rendering` → `done` + `video_url`, or `error`). Date omitted = newest payload.
- `GET :3123/health`

## Timing model

Audio-driven: the server synthesizes each spoken line, measures the mp3, and
passes per-line `durationInFrames` as input props. The hook underline draws
while the hook is spoken; beats reveal exactly when the narrator reaches them.
Total reel length = sum of line durations + a 1.5s hold for loop feel.
