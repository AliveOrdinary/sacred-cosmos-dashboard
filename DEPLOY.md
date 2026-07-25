# Reels v1 — Deployment Walkthrough

One evening, six steps, in this order. Branch: `reels-v1`.
Architecture recap: **v8.5 writes the scripts (6 AM) → homelab renders the video →
dashboard is the remote control → Publisher v2.2 ships it.**

---

## 0. Housekeeping (2 min)

- Revoke the read-write GitHub token used during the build session
  (GitHub → Settings → Developer settings → Fine-grained tokens).
- Create a NEW fine-grained token for Portainer: repo access limited to
  `sacred-cosmos-dashboard`, permission **Contents: Read-only**, ~90-day expiry.
  Copy it somewhere safe for Step 4.

## 1. Supabase (5 min)

1. SQL editor → paste the contents of `supabase/migration_reels.sql` → Run.
   Creates the `reel_renders` table with RLS (dashboard reads, render server writes).
2. Storage → New bucket → name exactly `social-videos` → toggle **Public** ON.
3. While here, copy for Step 4: Settings → API → `URL` and the `service_role` key
   (NOT the publishable key — the render server needs write access).

## 2. n8n (15 min)

Import all three from `workflows/`:

1. **Daily-Astro-Workflow-v8_5.json** — import, verify credentials resolved
   (Anthropic, ProKerala, Telegram, Supabase), deactivate v8, activate v8.5.
2. **Social_Media_Publisher_v2_2.json** — import, verify the Bearer Auth
   credential resolved on the new IG/FB reel nodes, deactivate v2.1, activate
   v2.2, and point the production webhook URL check: it should be the SAME
   webhook path as v2.1 so the dashboard's existing
   `VITE_N8N_PUBLISH_WEBHOOK_URL` keeps working. If the imported webhook got a
   new path, update the Netlify/`.env` value OR copy the old path into the node.
3. **Reel_Render_Trigger.json** — import, then open the "Call Render Server"
   node and change the URL to `http://<PORTAINER-HOST-LAN-IP>:3123/render`
   (LAN IP, never a Cloudflare hostname — CF Access OTP would block
   server-to-server calls). Activate it and copy its **production webhook URL**
   for Step 5.

## 3. ElevenLabs (10 min)

1. Sign up → Starter tier ($5/mo; ~2×15s daily ≈ 15 min/month, well inside it).
2. Voice library → filter narration voices → audition with a real line, e.g.
   "Not the exciting one. The boring one you keep negotiating with."
   You want: calm, low, unhurried, zero radio-announcer energy.
3. Copy the chosen **voice ID** and create an **API key** (profile menu).
   Pin the voice ID — the narrator should never change after launch.

## 4. Portainer — deploy the render server (build takes 5–10 min)

Stacks → Add stack → **Repository**:

| Field | Value |
| --- | --- |
| Name | `sacred-reels` |
| Repository URL | `https://github.com/AliveOrdinary/sacred-cosmos-dashboard` |
| Authentication | ON → username `AliveOrdinary` + Step 0 read-only token |
| Reference | `refs/heads/reels-v1` (switch to `refs/heads/main` after merge) |
| Compose path | `reels/docker-compose.yml` |

Environment variables (stack section, not a .env file):
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`.

Deploy. The first build is slow (npm install + Chromium download) and can look
stuck — it isn't. Healthy container logs end with:

```
Bundling Remotion project…
Bundle ready.
Reel render server on :3123
```

Firewall sanity check: the n8n host must reach the Portainer host on 3123
(`curl http://<PORTAINER-HOST-LAN-IP>:3123/health` from the n8n box → `{"ok":true}`).

## 5. Netlify (2 min)

Site settings → Environment variables → add
`N8N_RENDER_WEBHOOK_TARGET` = the Reel Render Trigger production webhook URL
(from Step 2.3). `CF_ACCESS_CLIENT_ID/SECRET` are already set from publish.mjs
and are shared. Redeploy the site once so the function picks it up — note the
site still builds from `main` until you merge, which is fine: `/api/render`
only matters after merge; direct render-server tests below don't need it.

## 6. End-to-end test

1. Run **v8.5 manually once** in n8n. Check the newest `cosmic_data` row in
   Supabase — the payload must now contain a `reel_scripts` key with
   `manifestation` and `elements` filled. Also eyeball the Telegram output.
2. Trigger a render directly (bypasses dashboard, tests the factory):
   `curl -X POST http://<PORTAINER-HOST-LAN-IP>:3123/render -H "Content-Type: application/json" -d '{"composition":"manifestation"}'`
   → instant `202`, then watch container logs. 2–5 min later `reel_renders`
   should show `status: done` with a `video_url`. Open it. Watch your first reel.
3. Repeat for `elements`.
4. Merge `reels-v1` → `main` (dashboard goes live with the ReelPanel), update
   the Portainer stack reference to `main`, then test the full loop from the
   dashboard: Generate → preview appears → Publish → check Instagram.

## Updating the stack after a code change

Portainer git stacks do **not** always re-pull. To be sure a change is live:

1. Stacks → `sacred-reels` → **Pull and redeploy** (tick any "re-pull /
   force rebuild" option offered). CLI equivalent from the repo root:
   `git pull && docker compose -f reels/docker-compose.yml build --no-cache && docker compose -f reels/docker-compose.yml up -d`
2. Confirm in the container logs that the first line reads
   `Sacred Cosmos reel server — build marker: …`. If that line is missing,
   the container is still running old code.
3. `TTS: N synthesized, M reused from cache` after a render confirms the
   caching build is live.

Firewall sanity check (do this after step 4, from n8n itself rather than a
shell): open the Reel Render Trigger workflow → "Call Render Server" node →
**Test step**, or add a temporary HTTP Request node doing
`GET http://<RENDER-HOST-LAN-IP>:3123/health`. Expect `{"ok":true}`.
Portainer console alternative (n8n is Alpine, no curl):
`wget -qO- http://<RENDER-HOST-LAN-IP>:3123/health`

## Known first-run gotchas

- **FB reels: `(#200) Subject does not have permission to post videos on this
  target`** (confirmed on first run). The Page token posts photos fine but
  `/video_reels` additionally requires **`publish_video`**. Options:
  1. Regenerate the Page access token in Graph API Explorer with
     `pages_manage_posts`, `pages_read_engagement` and `publish_video`, then
     update the Bearer credential in n8n. Verify the page is Reels-eligible.
  2. Skip the API entirely: link the IG account to the Page and enable
     Instagram → Settings → "Sharing to other apps" so reels crosspost
     automatically. Zero API work; recommended while FB is a secondary surface.
  The four FB reel nodes are set to **continue on error**, so a missing scope
  can never mark an already-published IG reel as failed.
- **FB reel upload 401**: Meta's `rupload` endpoint sometimes rejects
  `Authorization: Bearer` and wants `OAuth <token>`. Fix is on the
  "FB Reel Upload" node note in v2.2: replace the credential with a manual
  Authorization header.
- **IG reel stuck IN_PROGRESS**: normal for up to ~2 min; the poll loop handles
  it and gives up with a clear error after ~8 min.
- **Render error "No reel_scripts"**: the newest payload predates v8.5 —
  run the daily workflow first.
- **Fonts look wrong in the video**: the container self-hosts fonts via
  fontsource; if Fraunces is missing, the sync-glyphs/npm install step failed —
  rebuild the stack with cache cleared.

## After it works

1. Tuning pass: `cd reels && npm install && npm run studio` on the Mac,
   judge real content, adjust spacing/pacing with Claude.
2. Optional ambient bed: royalty-free track at `reels/public/audio/ambient.mp3`
   in the container (or bake into the image later).
3. Fabric brand migration (posts join the new design) — next build session.
