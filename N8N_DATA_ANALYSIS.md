# N8N Data Analysis & Future Implementation Roadmap

> **Sacred Cosmos Dashboard** — Comprehensive analysis of the n8n webhook data pipeline, current usage, and untapped potential.
> 
> *Last updated: February 24, 2026*

---

## 1. Data Pipeline Overview

The n8n automation produces a JSON payload **daily**. The payload structure changes based on the day of the week:

| Day | `data_sources.daily` | `data_sources.weekly` | `data_sources.element` | `data_sources.interactive` |
|---|---|---|---|---|
| **Sunday** | ✅ | ✅ | ✅ | ✅ |
| **Mon–Sat** | ✅ | ❌ | ✅ | ✅ |

The `data_sources` flags at the top of each payload tell you exactly which content sections are populated on that particular day. Weekly content is **only** populated on Sundays.

The payload is structured in two tiers:
1. **Raw content objects** (`daily_content_raw`, `weekly_content_raw`, `element_content_raw`) — the core AI-generated astrology content
2. **Pre-formatted outputs** (top-level keys like `comprehensive_blog`, `master_social_post`, `twitter_thread`, etc.) — ready-to-publish content derived from the raw data

---

## 2. Complete Data Schema

Below is every field in the n8n payload, organized by section. Fields marked 🟢 are **currently used** by the dashboard. Fields marked 🔴 are **available but unused**.

### 2.1 Root-Level Metadata

| Field | Type | Description | Status |
|---|---|---|---|
| `data_sources` | `object` | Flags indicating which content sections are populated | 🔴 Unused |
| `generation_timestamp` | `string` (ISO 8601) | When the content was generated | 🔴 Unused |
| `content_quality` | `string` | Quality tag (e.g., "Premium astrology content") | 🔴 Unused |
| `date` | `string` | Human-readable date (e.g., "Tuesday, February 24, 2026") | 🟢 **Used** — fallback for date display in DataFeedCard |
| `total_content_pieces` | `number` | Total count of content items generated (e.g., 19) | 🔴 Unused |
| `content_analytics` | `object` | Blog word count, social char count, element/manifestation flags | 🔴 Unused |

---

### 2.2 `daily_content_raw` — Generated Every Day

This contains the core AI-generated daily astrology content.

| Field | Type | Description | Status |
|---|---|---|---|
| `daily_content_raw.image_prompt` | `string` | AI image generation prompt | 🔴 Unused |
| `daily_content_raw.manifestation_focus` | `string` | Daily manifestation paragraph | 🔴 Unused |
| `daily_content_raw.collective_message` | `string` | Empty in current samples | 🔴 Unused |
| `daily_content_raw.panchangam_wisdom` | `string` | Empty in current samples | 🔴 Unused |
| `daily_content_raw.tithi_significance` | `string` | Empty in current samples | 🔴 Unused |
| `daily_content_raw.nakshatra_guidance` | `string` | Empty in current samples | 🔴 Unused |
| `daily_content_raw.date` | `string` | Date string | 🔴 Unused |
| `daily_content_raw.content_stats` | `object` | Word count, char count, video duration, engagement elements | 🔴 Unused |

#### 2.2.1 `daily_content_raw.individual_horoscopes` — The Richest Sub-Object

| Field | Type | Description | Status |
|---|---|---|---|
| `.cosmic_overview` | `string` | Day's overall cosmic energy paragraph | 🟢 **Used** — displayed in DataFeedCard; used as intro slide in sign carousel |
| `.collective_guidance` | `string` | Universal message for all signs | 🔴 Unused |
| `.manifestation_focus` | `string` | Manifestation guidance paragraph | 🔴 Unused |
| `.timing_wisdom` | `string` | Best times for activities (morning, midday, evening) | 🔴 Unused |
| `.aries` through `.pisces` | `string` | Individual horoscope for each of the 12 signs (full paragraphs) | 🟢 **Used** — displayed in DataFeedCard; used in sign carousel generator |
| `.spiritual_practice` | `string` | Daily recommended spiritual practice | 🔴 Unused |
| `.cosmic_image_prompt` | `string` | Detailed image generation prompt for the day's visual | 🔴 Unused |
| `.content_type` | `string` | Always `"enhanced_daily_horoscopes"` | 🔴 Unused |
| `.quality_indicators` | `object` | Booleans for content quality checks | 🔴 Unused |
| `.generation_timestamp` | `string` | Sub-object generation timestamp | 🔴 Unused |

---

### 2.3 `weekly_content_raw` — Sunday Only

On non-Sundays, this is an empty object `{}`.

| Field | Type | Description | Status |
|---|---|---|---|
| `weekly_content_raw.weekly_theme` | `string` | Week's cosmic theme paragraph | 🔴 Unused |
| `weekly_content_raw.collective_message` | `string` | Universal weekly message | 🔴 Unused |
| `weekly_content_raw.cosmic_timing` | `string` | Day-by-day timing guidance (full paragraph) | 🔴 Unused |
| `weekly_content_raw.spiritual_practice` | `string` | Week-long spiritual practice instructions | 🔴 Unused |
| `weekly_content_raw.manifestation_focus` | `string` | Weekly manifestation focus | 🔴 Unused |
| `weekly_content_raw.{sign}` | `object` | **Per-sign weekly forecasts** (directly under root, no `.signs.` intermediary) with sub-fields: | 🔴 Unused |
| `.{sign}.cosmic_energy` | `string` | Week's energy for the sign | 🔴 Unused |
| `.{sign}.heart_guidance` | `string` | Love & relationships for the week | 🔴 Unused |
| `.{sign}.life_purpose` | `string` | Career & purpose for the week | 🔴 Unused |
| `.{sign}.spiritual_insight` | `string` | Spiritual teaching (Sanskrit/Vedic concept) | 🔴 Unused |
| `.{sign}.lucky_moments` | `string` | Best days for this sign | 🔴 Unused |
| `.{sign}.gentle_challenge` | `string` | Personal growth challenge for the week | 🔴 Unused |

---

### 2.4 `element_content_raw` — Generated Every Day

| Field | Type | Description | Status |
|---|---|---|---|
| `.fire_signs` / `.earth_signs` / `.air_signs` / `.water_signs` | `object` | Element-group messages with `.message`, `.call_to_action`, `.spiritual_practice` | 🟢 **Partially Used** — `.message` shown in DataFeedCard & element carousel; `.call_to_action` used for element carousel caption; `.spiritual_practice` unused |
| `.manifestation_posts` | `array` (4–6 items) | Themed manifestation post objects with `.theme`, `.post`, `.call_to_action`, `.timing` | 🟢 **Partially Used** — `.theme` and `.post` used for manifestation carousel; `.call_to_action`, `.timing` unused |
| `.community_questions` | `array` (5 items) | Engagement questions for community interaction | 🔴 Unused |
| `.weekly_challenge` | `string` | Weekly challenge description | 🔴 Unused |

**Sunday-only fields:**
| Field | Type | Description | Status |
|---|---|---|---|
| `.inclusive_affirmations` | `array` (7 strings) | Universal affirmation statements | 🔴 Unused |

**Rest-day-only fields:**
| Field | Type | Description | Status |
|---|---|---|---|
| `.affirmations` | `object` | Per-element affirmation strings (`fire_signs`, `earth_signs`, `air_signs`, `water_signs`) | 🔴 Unused |
| `.closing_message` | `string` | Inspirational closing message | 🔴 Unused |

---

### 2.5 Top-Level Pre-Formatted Outputs

These are ready-to-publish content pieces derived from the raw data, formatted for specific platforms.

| Field | Type | Description | Status |
|---|---|---|---|
| `comprehensive_blog` | `string` (Markdown) | Full blog combining daily + weekly + all signs | 🔴 Unused |
| `master_social_post` | `string` | Combined social caption with hashtags | 🟢 **Used** — loaded into `PostCaptionCard`; used for date extraction |
| `element_posts` | `object` | Pre-formatted element-group posts (`.fire_signs`, `.earth_signs`, etc.) with `.message`, `.call_to_action`, `.spiritual_practice` | 🔴 Unused |
| `manifestation_posts` | `array` | Top-level manifestation posts with `.theme`, `.content`, `.call_to_action`, `.timing` | 🔴 Unused (uses `.content` not `.post`) |
| `daily_video_script` | `string` | Short video script for daily reel | 🔴 Unused |
| `weekly_video_script` | `string` | Weekly recap video script (Sunday only, empty otherwise) | 🔴 Unused |
| `email_newsletter` | `string` | Ready-to-send email with subject line | 🔴 Unused |
| `twitter_thread` | `array` (14 items) | Ready-to-post Twitter/X thread (1 intro + 12 signs + CTA) | 🔴 Unused |
| `instagram_stories` | `array` (3–4 slides) | Structured IG story sequence with `.slide`, `.text`, `.background`; Sunday adds a 4th weekly theme slide with `.type` | 🟢 **Used** — feeds Instagram Stories generator |

---

## 3. What the Dashboard Currently Uses

### ✅ Currently Implemented

| Feature | Data Source | How It's Used |
|---|---|---|
| **Post Caption Editor** | `master_social_post` | Loaded into an editable `<textarea>` with copy-to-clipboard |
| **Element Messages Feed** | `element_content_raw.{fire/earth/air/water}_signs.message` | Shown in DataFeedCard; "Add to Slide" pushes text to canvas |
| **Manifestation Carousel** | `element_content_raw.manifestation_posts[].theme` + `.post` | Auto-generates multi-slide Fabric.js carousel with gradient backgrounds |
| **Element Carousel** | `element_content_raw.{fire/earth/air/water}_signs.message` + `.call_to_action` | Auto-generates 4-slide element-themed carousel |
| **Sign Carousel** | `daily_content_raw.individual_horoscopes.{sign}` + `.cosmic_overview` | Auto-generates 6-sign + intro carousel (split into 2 parts) |
| **Instagram Stories** | `instagram_stories[]` (top-level) | Auto-generates story-format slides (1080×1920) |
| **Date Display** | `master_social_post` (regex) → `date` (fallback) | Extracted from social post or root date field |

### Summary Stats

| Metric | Count |
|---|---|
| Total unique data fields available | **~65+** |
| Fields currently consumed by dashboard | **~10** |
| **Utilization rate** | **~15%** |

---

## 4. Current Publishing Pipeline (Instagram + Facebook via Graph API)

The immediate plan is to use the Graph API to publish to **Instagram** and **Facebook** simultaneously. Based on the current data, here's what's ready to be used for this flow:

### 4.1 What Can Be Published TODAY with Graph API

| Content Type | Data Field | IG/FB Compatible | Notes |
|---|---|---|---|
| **Carousel Post** | Generated from `element_content_raw.manifestation_posts` | ✅ Yes | Exported as PNG slides → uploaded via Graph API |
| **Post Caption** | `master_social_post` | ✅ Yes | Already has hashtags and engagement hooks |
| **Single Image Post** | Could use `cosmic_image_prompt` or `image_prompt` | ✅ Yes | Need AI image generation step (DALL-E, Midjourney, etc.) |
| **Instagram Stories** | `instagram_stories` (top-level, 3–4 slides) | ✅ Yes | Pre-structured with text + background hints |

### 4.2 Graph API Content Mapping

```
Graph API POST /me/media → {
  image_url:    ← Export from Fabric.js canvas
  caption:      ← master_social_post
  media_type:   "CAROUSEL" | "IMAGE" | "STORIES"
}
```

---

## 5. Future Implementation Possibilities

### Phase 1: Maximize Instagram & Facebook (Graph API)

These implementations use the **existing data** with the **Graph API** you're already connecting.

#### 5.1 — Individual Sign Carousels ✅ DONE
- **Data:** `daily_content_raw.individual_horoscopes.{aries…pisces}` (12 full paragraphs)
- **Implementation:** Auto-generates a sign carousel split into 2 parts (♈–♍ and ♎–♓) with cosmic overview intro slide
- **Status:** Fully implemented in `handleGenerateSignCarousel`

#### 5.2 — Weekly Forecast Carousel (Sundays) ✅ DONE
- **Data:** `weekly_content_raw.{sign}.{cosmic_energy, heart_guidance, life_purpose, spiritual_insight, lucky_moments, gentle_challenge}`
- **Implementation:** Generates weekly forecast carousel split into 2 parts (♈–♍ / ♎–♓) with weekly theme intro slide. Each sign shows cosmic_energy + heart_guidance + life_purpose condensed onto one card.
- **Status:** Fully implemented in `handleGenerateWeeklyCarousel`. Conditionally shown only on Sundays when `weekly_content_raw` has sign data.
- **Note:** Signs are directly under `weekly_content_raw` (no `.signs.` intermediary level)

#### 5.3 — Instagram Stories Pipeline ✅ DONE
- **Data:** `instagram_stories` (top-level, 3–4 slides with `.slide`, `.text`, `.background`)
- **Implementation:** Auto-generates Story-format images (1080×1920) from pre-structured slide data with background theme mapping
- **Status:** Fully implemented in `handleGenerateStories`

#### 5.4 — Element Group Posts ✅ DONE
- **Data:** `element_content_raw.{fire/earth/air/water}_signs` with `.message`, `.call_to_action`, `.spiritual_practice`
- **Implementation:** Generates 4-slide element-themed carousel with element-specific gradients and auto-loaded CTA caption
- **Status:** Fully implemented in `handleGenerateElementPosts`

#### 5.5 — AI Image Generation ✅ DONE
- **Data:** `daily_content_raw.individual_horoscopes.cosmic_image_prompt` + `daily_content_raw.image_prompt`
- **Implementation:** Standalone `AiImageCard` component with Nano Banana API (Gemini 2.5 Flash). User enters API key once (persisted in localStorage), selects/edits prompt, picks aspect ratio, generates on demand. Preview with "Add to Canvas" and "Set as Background" actions. Completely user-initiated — never auto-triggered.
- **Status:** Fully implemented in `useAiImage.js` + `AiImageCard.jsx`

#### 5.6 — Call-to-Action Overlays ✅ DONE
- **Data:** `element_content_raw.manifestation_posts[].call_to_action` + `element_content_raw.{element}_signs.call_to_action`
- **Implementation:** Manifestation and Element carousels now auto-append a final "✨ YOUR COSMIC INVITATION" CTA slide
- **Status:** Fully implemented in `handleGenerateCarousel` and `handleGenerateElementPosts`

#### 5.7 — Spiritual Practice Cards ✅ DONE
- **Data:** `daily_content_raw.individual_horoscopes.spiritual_practice`
- **Implementation:** Single-slide "🧘 TODAY'S SPIRITUAL PRACTICE" post with teal-to-purple gradient
- **Status:** Fully implemented in `handleGenerateSpiritualPractice`

#### 5.8 — Manifestation Focus Posts ✅ DONE
- **Data:** `daily_content_raw.manifestation_focus` (falls back to `individual_horoscopes.manifestation_focus`)
- **Implementation:** Single-slide "✨ MANIFESTATION FOCUS" post with warm amber gradient
- **Status:** Fully implemented in `handleGenerateManifestationFocus`

---

### Phase 2: Extended Platform Support (Beyond Current Graph API Scope)

These features use data that's already being generated but would require **additional platform integrations**.

#### 5.9 — Twitter/X Thread Bot
- **Data:** `twitter_thread` (top-level, 14-item array, pre-chunked for character limits)
- **Implementation:** Post items sequentially via Twitter API v2 as a threaded tweet chain
- **Platform:** Twitter/X API
- **Effort:** Medium — requires Twitter API credentials + thread posting logic

#### 5.10 — Email Newsletter Automation
- **Data:** `email_newsletter` (complete email with subject line)
- **Implementation:** Pipe content into an email service (Mailchimp, Resend, ConvertKit) for daily/weekly sends
- **Platform:** Email API (Mailchimp, Resend, SendGrid)
- **Effort:** Medium

#### 5.11 — Blog Auto-Publishing
- **Data:** `comprehensive_blog` (full Markdown article, ~2000–4000 words)
- **Implementation:** Auto-publish to WordPress, Ghost, or a custom CMS via their APIs
- **Platform:** CMS API
- **Effort:** Medium — Markdown needs to be converted to proper HTML/blocks

#### 5.12 — Video Script Teleprompter / AI Video
- **Data:** `daily_video_script` + `weekly_video_script`
- **Implementation:** Either display scripts in a teleprompter UI or feed them to an AI video generator (HeyGen, Synthesia, D-ID)
- **Platform:** AI Video API or in-app teleprompter mode
- **Effort:** High for AI video, Low for teleprompter

---

### Phase 3: Dashboard Enhancement Features (No External APIs)

These improve the Sacred Cosmos Dashboard itself.

#### 5.13 — Cosmic Timing Widget
- **Data:** `daily_content_raw.individual_horoscopes.timing_wisdom` + `weekly_content_raw.cosmic_timing`
- **Implementation:** A dashboard widget showing "best cosmic windows" for activities throughout the day
- **Effort:** Low

#### 5.14 — Content Calendar View
- **Data:** `weekly_content_raw.cosmic_timing` + date fields
- **Implementation:** A visual calendar showing weekly themes, best posting times, and generated content status
- **Effort:** Medium

#### 5.15 — Community Engagement Bank ✅ DONE
- **Data:** `element_content_raw.community_questions` (5 items)
- **Implementation:** Collapsible section in DataFeedCard showing all 5 questions with individual copy-to-clipboard buttons
- **Status:** Fully implemented in `DataFeedCard.jsx`

#### 5.16 — Quality Analytics Dashboard
- **Data:** `content_analytics` + `daily_content_raw.content_stats` + `daily_content_raw.individual_horoscopes.quality_indicators`
- **Implementation:** Real-time analytics showing word counts, estimated video durations, engagement element tracking, and quality assurance metrics
- **Effort:** Low

#### 5.17 — Multi-Caption Selector ✅ DONE
- **Data:** `master_social_post` + element CTAs + `weekly_content_raw.collective_message` (Sunday)
- **Implementation:** Tabbed PostCaptionCard with "Social Post", "Element CTAs", and "Weekly" (Sunday only) tabs. User clicks tab to load variant, then freely edits.
- **Status:** Fully implemented in `PostCaptionCard.jsx`

---

## 6. Data Differences: Sunday vs Rest Days

Understanding the structural differences matters for conditional UI logic.

| Dimension | Sunday | Mon–Sat |
|---|---|---|
| `data_sources.weekly` | `true` | `false` |
| `weekly_content_raw` | Full object (theme, signs, timing, practices) | Empty `{}` |
| `weekly_video_script` | Populated | Empty `""` |
| `instagram_stories` | 4 slides (includes weekly theme slide with `.type`) | 3 slides (daily only) |
| `total_content_pieces` | 19 | 19 |
| `master_social_post` | Includes weekly theme paragraph | Daily content only |
| `comprehensive_blog` | Includes weekly section | Daily content only |
| `element_content_raw` variations | Has `inclusive_affirmations` (array) | Has `affirmations` (object), `closing_message` |
| `manifestation_posts[].post` | `.post` consistently | `.post` consistently |

> [!TIP]
> **Previous inconsistency resolved:** The manifestation posts in `element_content_raw` now consistently use `.post` on both Sundays and rest days. The top-level `manifestation_posts[]` uses `.content` — but the dashboard reads from `element_content_raw`, so this doesn't affect current functionality.

---

## 7. Priority Recommendations

For your immediate goal of **Instagram + Facebook via Graph API**, here's the recommended priority:

| Priority | Feature | Data Ready? | Effort | Impact |
|---|---|---|---|---|
| ✅ **DONE** | Individual sign carousels (2-part daily) | ✅ | — | Very High engagement |
| ✅ **DONE** | Instagram Stories pipeline (auto-gen Story images) | ✅ | — | High — daily Story reach |
| ✅ **DONE** | Element group posts (4-slide carousel) | ✅ | — | Medium |
| ✅ **DONE** | CTA overlays on carousel final slides | ✅ | — | High — engagement boost |
| ✅ **DONE** | Weekly forecast carousel (Sunday, 2 parts) | ✅ | — | High — premium content |
| ✅ **DONE** | Spiritual practice cards (single slide) | ✅ | — | Medium |
| ✅ **DONE** | Manifestation focus posts (single slide) | ✅ | — | Medium |
| ✅ **DONE** | AI image generation (Nano Banana) | ✅ | — | Very High — unique visuals |
| ✅ **DONE** | Multi-caption selector | ✅ | — | Medium — workflow efficiency |
| ✅ **DONE** | Community engagement bank | ✅ | — | Low-Medium |

---

## 8. Appendix: Full Field Path Reference

<details>
<summary>Click to expand — every JSON path in the payload</summary>

```
# Root
data_sources.daily
data_sources.weekly
data_sources.element
data_sources.interactive
generation_timestamp
content_quality
date
total_content_pieces

# Daily Content Raw
daily_content_raw.image_prompt
daily_content_raw.manifestation_focus
daily_content_raw.collective_message
daily_content_raw.panchangam_wisdom
daily_content_raw.tithi_significance
daily_content_raw.nakshatra_guidance
daily_content_raw.date
daily_content_raw.content_stats.total_words
daily_content_raw.content_stats.social_character_count
daily_content_raw.content_stats.video_estimated_duration
daily_content_raw.content_stats.engagement_elements[]
daily_content_raw.content_stats.content_type

# Individual Horoscopes
daily_content_raw.individual_horoscopes.cosmic_overview       ← CURRENTLY USED
daily_content_raw.individual_horoscopes.collective_guidance
daily_content_raw.individual_horoscopes.manifestation_focus
daily_content_raw.individual_horoscopes.timing_wisdom
daily_content_raw.individual_horoscopes.aries                 ← CURRENTLY USED
daily_content_raw.individual_horoscopes.taurus                ← CURRENTLY USED
daily_content_raw.individual_horoscopes.gemini                ← CURRENTLY USED
daily_content_raw.individual_horoscopes.cancer                ← CURRENTLY USED
daily_content_raw.individual_horoscopes.leo                   ← CURRENTLY USED
daily_content_raw.individual_horoscopes.virgo                 ← CURRENTLY USED
daily_content_raw.individual_horoscopes.libra                 ← CURRENTLY USED
daily_content_raw.individual_horoscopes.scorpio               ← CURRENTLY USED
daily_content_raw.individual_horoscopes.sagittarius            ← CURRENTLY USED
daily_content_raw.individual_horoscopes.capricorn             ← CURRENTLY USED
daily_content_raw.individual_horoscopes.aquarius              ← CURRENTLY USED
daily_content_raw.individual_horoscopes.pisces                ← CURRENTLY USED
daily_content_raw.individual_horoscopes.spiritual_practice
daily_content_raw.individual_horoscopes.cosmic_image_prompt
daily_content_raw.individual_horoscopes.content_type
daily_content_raw.individual_horoscopes.quality_indicators.*
daily_content_raw.individual_horoscopes.generation_timestamp

# Weekly Content Raw (Sunday Only)
weekly_content_raw.weekly_theme
weekly_content_raw.collective_message
weekly_content_raw.cosmic_timing
weekly_content_raw.spiritual_practice
weekly_content_raw.manifestation_focus
weekly_content_raw.{sign}.cosmic_energy
weekly_content_raw.{sign}.heart_guidance
weekly_content_raw.{sign}.life_purpose
weekly_content_raw.{sign}.spiritual_insight
weekly_content_raw.{sign}.lucky_moments
weekly_content_raw.{sign}.gentle_challenge

# Element Content Raw
element_content_raw.fire_signs.message                        ← CURRENTLY USED
element_content_raw.fire_signs.call_to_action                 ← CURRENTLY USED (caption)
element_content_raw.fire_signs.spiritual_practice
element_content_raw.earth_signs.*                             (same structure)
element_content_raw.air_signs.*                               (same structure)
element_content_raw.water_signs.*                             (same structure)
element_content_raw.manifestation_posts[].theme               ← CURRENTLY USED
element_content_raw.manifestation_posts[].post                ← CURRENTLY USED
element_content_raw.manifestation_posts[].call_to_action
element_content_raw.manifestation_posts[].timing
element_content_raw.community_questions[]
element_content_raw.weekly_challenge
element_content_raw.inclusive_affirmations[]                  (Sunday only)
element_content_raw.affirmations.*                            (rest-days only)
element_content_raw.closing_message                          (rest-days only)

# Top-Level Pre-Formatted Outputs
comprehensive_blog
master_social_post                                            ← CURRENTLY USED
element_posts.fire_signs.*
element_posts.earth_signs.*
element_posts.air_signs.*
element_posts.water_signs.*
manifestation_posts[].theme
manifestation_posts[].content                                (note: uses .content, not .post)
manifestation_posts[].call_to_action
manifestation_posts[].timing
daily_video_script
weekly_video_script
email_newsletter
twitter_thread[]
instagram_stories[].slide                                     ← CURRENTLY USED
instagram_stories[].text                                      ← CURRENTLY USED
instagram_stories[].background                                ← CURRENTLY USED
instagram_stories[].type                                      (Sunday weekly slide only)

# Analytics
content_analytics.blog_word_count
content_analytics.social_character_count
content_analytics.element_targeting
content_analytics.manifestation_content
```

</details>
