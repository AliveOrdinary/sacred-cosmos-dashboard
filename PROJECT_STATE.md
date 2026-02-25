# Sacred Cosmos Dashboard - Project State

## 🌟 Accomplishments

*   **Fabric.js Canvas Integration:** Successfully integrated `fabric.js` (v7) into a React frontend to power the "Cosmic Editor" design canvas.
*   **n8n Webhook Data Integration:** Connected the dashboard to an n8n webhook API to dynamically pull daily horoscope and manifestation posts into the "Data Feed" panel.
*   **Dynamic Carousel Generation:** Implemented a feature to automatically parse the JSON data feed and construct a sequence of Instagram/Carousel slides pre-populated with titles, bodies, and styling.
*   **Slide Management:** Built functional pagination logic allowing users to add, duplicate, delete, and navigate between multiple slides within the editor.
*   **State Persistence:** Ensured that slide canvas state is serialized to JSON and persisted across slide navigations, keeping edits intact.
*   **Shape & Background Tools:** Enabled adding basic vector shapes (Rectangles, Circles, Triangles) and dynamically altering the slide background (solid colors, 16 gradients).
*   **Element Styling Capabilities:** Connected specific styling controls (font size, font family, text alignment, glow/shadow, opacity, layer sorting) to active fabric objects.
*   **Component Refactor:** Broke the 1183-line `App.jsx` monolith into focused files: `src/lib/constants.js`, `src/hooks/useFabricCanvas.jsx`, `src/hooks/useSlides.js`, `src/hooks/useCosmicData.js`, and 5 UI components under `src/components/editor/`. `App.jsx` is now ~130 lines of composition.
*   **Canvas CSS Scaling Fix:** Replaced CSS `width: 100%; height: 100%` on `<canvas>` with `transform: scale()` on a wrapper div in `CanvasArea.jsx`. This was the root cause of all coordinate distortion.
*   **Text Overflow Resolution:** Every Fabric object now has explicit `originX: 'left', originY: 'top'`. Text uses iterative font-size reduction (step −2px) to fit within a padded safe area. Carousel body zone computed dynamically from actual rendered title height to prevent overlap.
*   **Adaptive Canvas Sizes:** Carousel generation and `addText` both adapt to Square (1080×1080), Portrait (1080×1350), and Story (1080×1920). PAD, BODY_GAP, and body font scale with canvas height. Title font capped at 72px (width-constrained). Body zone top is measured after title renders.
*   **Expanded Gradient Library:** `GRADIENTS` in `constants.js` expanded from 4 → 16 presets grouped as Warm, Cool, Purple/Mystic, and Dark — inspired by Instagram's palette.
*   **N8N Data Analysis & Future Roadmap:** Created comprehensive `N8N_DATA_ANALYSIS.md` documenting all ~70+ data fields from the n8n webhook, mapping the 5 currently used fields (7% utilization), and proposing 20 future implementations organized into 3 phases with priority rankings for the Instagram + Facebook Graph API pipeline.
*   **Manifestation Carousel `.post`/`.content` Fix:** The carousel generator now reads `posts[i].post || posts[i].content` to handle both Sunday (`.post`) and rest-day (`.content`) data formats.
*   **Individual Sign Carousel:** New "Sign Carousel" button generates a 12-slide zodiac carousel from `daily_content.individual_horoscopes`, one slide per sign with emoji + name title and full horoscope reading. Uses shared `_buildSlides` helper.
*   **Instagram Stories Pipeline:** New "Stories" button generates 3–5 portrait slides at 1080×1920 from `instagram_stories` or `daily_content.instagram_story`. Automatically switches the canvas to Story dimensions. Background gradients mapped from the n8n `background` hint strings via `STORY_BACKGROUNDS` constant.
*   **Data Source Toggle:** Temporary Sunday/Rest Days toggle in the header allows testing both sample datasets. Will be replaced by database fetch later.
*   **Shared Carousel Builder:** Extracted `_buildSlides` helper in `useCosmicData.js` to eliminate code duplication across all three carousel generators (manifestation, sign, stories).
*   **Caption Auto-Loading:** Manifestation, Element Posts, and Sign Carousel generators now automatically populate the `PostCaptionCard` with the relevant `daily_content.social_media_post` text. Sign carousels prepend a "(Part 1 of 2)" / "(Part 2 of 2)" label. Stories intentionally do not load a caption.
*   **Sign Carousel Split (2×6):** The Sign Carousel generator now accepts a `part` parameter (1 or 2), producing two separate posts: Part 1 covers ♈ Aries → ♍ Virgo, Part 2 covers ♎ Libra → ♓ Pisces. The `DataFeedCard` shows two buttons: "Signs ♈–♍" and "Signs ♎–♓".
*   **Cosmic Overview Intro Slide:** Both sign carousel parts now prepend a "TODAY'S COSMIC ENERGY" intro slide from `horoscopes.cosmic_overview` before the 6 individual sign slides (7 slides total per part).
*   **Element Posts Generator:** New `handleGenerateElementPosts` creates a 4-slide carousel (🔥 Fire, 🌍 Earth, 💨 Air, 💧 Water) from `element_content` messages with element-themed gradients. Caption is assembled from all four `call_to_action` fields.
*   **DataFeedCard UI Cleanup:** Replaced the massive raw data dump (4 element cards + 5 manifestation cards + 1 cosmic overview + 12 horoscope cards) with a compact "Content Generators" panel. Shows only the 5 generator buttons + a date/counts summary line. Raw data is preserved behind a collapsed "Raw Data Preview" toggle for advanced use.
*   **N8N Data Structure Migration (Feb 24, 2026):** Updated all data access paths in `useCosmicData.js` and `DataFeedCard.jsx` to match the restructured n8n webhook payload. Three major key renames: `daily_content` → `daily_content_raw`, `element_content` → `element_content_raw`, `weekly_content` → `weekly_content_raw`. Pre-formatted outputs (`social_media_post`, `blog_content`, `video_script`, `twitter_thread`) moved from nested `daily_content` to top-level keys (`master_social_post`, `comprehensive_blog`, `daily_video_script`, `twitter_thread`). Dead `daily_content.instagram_story` fallback removed (stories now only at top-level `instagram_stories`). Weekly per-sign path simplified from `weekly_content.signs.{sign}` to `weekly_content_raw.{sign}`. Comprehensive `N8N_DATA_ANALYSIS.md` rewritten to reflect the new schema.
*   **CTA Overlay Slides:** Manifestation and Element carousels now auto-append a final "✨ YOUR COSMIC INVITATION" slide using the `call_to_action` data. Element carousel combines all 4 element CTAs into one closing slide.
*   **Weekly Forecast Carousel:** New `handleGenerateWeeklyCarousel(part)` generates a Sunday-only weekly forecast carousel split into 2 parts (♈–♍ / ♎–♓). Each sign slide shows condensed cosmic_energy + heart_guidance + life_purpose. Intro slide shows the weekly theme. Weekly buttons are conditionally hidden on rest days.
*   **Spiritual Practice Card:** New `handleGenerateSpiritualPractice` generates a single "🧘 TODAY'S SPIRITUAL PRACTICE" slide from `daily_content_raw.individual_horoscopes.spiritual_practice` with teal-to-purple gradient.
*   **Manifestation Focus Card:** New `handleGenerateManifestationFocus` generates a single "✨ MANIFESTATION FOCUS" slide from `daily_content_raw.manifestation_focus` with warm amber gradient.
*   **AI Image Generator (Gemini):** New `AiImageCard` component + `useAiImage` hook. User-initiated only — never automatic. Uses Google's Gemini 2.5 Flash Image model via `generativelanguage.googleapis.com` (proxied through Vite dev server to bypass CORS). API key stored in `.env.local` (`VITE_GEMINI_API_KEY`). Prompts pre-filled from cosmic data (`cosmic_image_prompt` and `image_prompt`), preview with "Add to Canvas" and "Set as Background" actions.
*   **Multi-Caption Selector:** Upgraded `PostCaptionCard` with tabbed caption variants — "Social Post" (master_social_post), "Element CTAs" (combined fire/earth/air/water CTAs), and "Weekly" (collective_message, Sunday only). User clicks tab to load variant, then freely edits.
*   **Community Engagement Bank:** Collapsible "Community Questions" section in `DataFeedCard` showing 5 pre-generated engagement prompts from `element_content_raw.community_questions`, each with individual copy-to-clipboard button.
*   **Supabase Integration (Feb 25, 2026):** Connected dashboard to Supabase for persistent storage and authentication.
    *   **Database:** `cosmic_data` table with JSONB `payload` column, `date` (unique), `generation_timestamp`, `is_sunday` flag. RLS enabled — authenticated users can read, only service role can write.
    *   **Auth:** Email/password login via `useAuth` hook + `LoginPage.jsx`. Auth gate in `App.jsx` — loading spinner → login page → editor. Sign-out button with user email in header.
    *   **Live Data Fetching:** `useCosmicData.js` updated with "⚡ Live" data source that queries `cosmic_data` table for the latest day's payload. Handles string-wrapped payloads from n8n (auto-parses). Falls back to sample data via "Sunday"/"Rest Days" toggle for dev.
    *   **n8n → Supabase:** Daily data pushed via n8n's built-in Supabase node (Create operation) directly into the `cosmic_data` table. No Edge Function needed.
    *   **Environment:** `.env.local` holds `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_GEMINI_API_KEY`. Supabase client in `src/lib/supabase.js` uses publishable key (not legacy anon key).
    *   **Vite Proxy:** `vite.config.js` proxies `/api/gemini` → `generativelanguage.googleapis.com` for CORS-free Gemini API calls from localhost.
    *   **Migration file:** `supabase/migration.sql` for table + RLS policy creation.

## 🐛 Known Bugs & Current Blockers

*   **Typography Scaling & Bounding Box Overflows (Fabric v7):**
    *   **Status:** **[RESOLVED]** — see Canvas CSS Scaling Fix above.
*   **Manifestation Posts `.post` vs `.content` Field Inconsistency:**
    *   **Status:** **[RESOLVED]** — The n8n workflow now consistently uses `.post` in `element_content_raw.manifestation_posts[]` for both Sunday and rest-day data. The top-level `manifestation_posts[]` uses `.content`. The carousel generator reads from `element_content_raw` so this is no longer an issue. The `post.post || post.content` fallback remains as a safety net.
*   **n8n Payload String Wrapping:**
    *   **Status:** **[RESOLVED]** — Fixed by mapping `{{ $json }}` (raw object) instead of `{{ JSON.stringify($json) }}` in n8n's Supabase node. `useCosmicData.js` retains a `typeof payload === 'string' → JSON.parse()` safety net.

## 📝 Usage Notes

*   Always invoke `canvas.renderAll()` after applying dimensional or positional changes, especially before querying `height`/`width` properties on Fabric objects (e.g. `textObj.height`).
*   **Never apply CSS `width`/`height` to the `<canvas>` element.** Fabric manages its own sizing. Use CSS `transform: scale()` on a wrapper div. See `CanvasArea.jsx`.
*   **Always set `originX: 'left', originY: 'top'`** on every Fabric object. Fabric v7 defaults to `center` origin which makes `left`/`top` refer to the object's center point — all coordinate math must use top-left conventions.
*   **Measure after render:** When computing layout that depends on text height (e.g. `BODY_ZONE_TOP`), always call `renderAll()` first and then read `textObj.height`. Never pre-compute based on font size alone.
*   **JSX in hooks:** Any hook file containing JSX (e.g. `renderToStaticMarkup(<Component />)`) **must** use the `.jsx` extension. Vite will not transform JSX in `.js` files — causes a silent white screen.
*   **Hook dependency ordering:** `useSlides` receives `editor` at call-time (not hook-init-time) to avoid a circular dependency with `useFabricCanvas`. Slide mutations are wired in `App.jsx` as inline lambdas: `(idx, e) => slideManager.deleteSlide(editor, idx, e)`.
*   **Font size scaling principle:** Title font is WIDTH-constrained (canvas is always 1080px wide across all formats — never scale title by height ratio). Body font uses `Math.sqrt(CH / 1080)` for mild height scaling.
*   **Environment variables:** All secrets live in `.env.local` (git-ignored). Must prefix with `VITE_` for Vite to expose to client code. Restart dev server after editing `.env.local`.
*   **Supabase RLS:** The `cosmic_data` table is read-only for authenticated users. Only the service role key (used by n8n) can insert/update data.
