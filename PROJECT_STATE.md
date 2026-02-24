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

## 🐛 Known Bugs & Current Blockers

*   **Typography Scaling & Bounding Box Overflows (Fabric v7):**
    *   **Status:** **[RESOLVED]** — see Canvas CSS Scaling Fix above.
*   **Manifestation Posts `.post` vs `.content` Field Inconsistency:**
    *   **Status:** **[RESOLVED]** — carousel generator and DataFeedCard now use `post.post || post.content` fallback.

## 📝 Usage Notes

*   Always invoke `canvas.renderAll()` after applying dimensional or positional changes, especially before querying `height`/`width` properties on Fabric objects (e.g. `textObj.height`).
*   **Never apply CSS `width`/`height` to the `<canvas>` element.** Fabric manages its own sizing. Use CSS `transform: scale()` on a wrapper div. See `CanvasArea.jsx`.
*   **Always set `originX: 'left', originY: 'top'`** on every Fabric object. Fabric v7 defaults to `center` origin which makes `left`/`top` refer to the object's center point — all coordinate math must use top-left conventions.
*   **Measure after render:** When computing layout that depends on text height (e.g. `BODY_ZONE_TOP`), always call `renderAll()` first and then read `textObj.height`. Never pre-compute based on font size alone.
*   **JSX in hooks:** Any hook file containing JSX (e.g. `renderToStaticMarkup(<Component />)`) **must** use the `.jsx` extension. Vite will not transform JSX in `.js` files — causes a silent white screen.
*   **Hook dependency ordering:** `useSlides` receives `editor` at call-time (not hook-init-time) to avoid a circular dependency with `useFabricCanvas`. Slide mutations are wired in `App.jsx` as inline lambdas: `(idx, e) => slideManager.deleteSlide(editor, idx, e)`.
*   **Font size scaling principle:** Title font is WIDTH-constrained (canvas is always 1080px wide across all formats — never scale title by height ratio). Body font uses `Math.sqrt(CH / 1080)` for mild height scaling.
