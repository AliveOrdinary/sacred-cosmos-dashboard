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

---

## 2. Complete Data Schema

Below is every field in the n8n payload, organized by section. Fields marked 🟢 are **currently used** by the dashboard. Fields marked 🔴 are **available but unused**.

### 2.1 Root-Level Metadata

| Field | Type | Description | Status |
|---|---|---|---|
| `data_sources` | `object` | Flags indicating which content sections are populated | 🔴 Unused |
| `generation_timestamp` | `string` (ISO 8601) | When the content was generated | 🔴 Unused |
| `content_quality` | `string` | Quality tag (e.g., "Premium astrology content") | 🔴 Unused |
| `date` | `string` | Human-readable date (e.g., "Sunday, February 22, 2026") | 🔴 Unused |
| `total_content_pieces` | `number` | Total count of content items generated (e.g., 20) | 🔴 Unused |
| `content_analytics` | `object` | Blog word count, social char count, format count, flags | 🔴 Unused |

---

### 2.2 `daily_content` — Generated Every Day

| Field | Type | Description | Status |
|---|---|---|---|
| `daily_content.blog_content` | `string` (Markdown) | Full long-form blog article (~1700 words) with all 12 sign readings | 🔴 Unused |
| `daily_content.social_media_post` | `string` | Ready-to-post Instagram/FB caption with hashtags | 🟢 **Used** — loaded into `PostCaptionCard` |
| `daily_content.video_script` | `string` | Script for video/reel narration (~60–75s) | 🔴 Unused |
| `daily_content.instagram_story` | `object` (3 slides) | Pre-structured story slides with text + background suggestions | 🔴 Unused |
| `daily_content.twitter_thread` | `array` (14 items) | Ready-to-post Twitter/X thread (1 intro + 12 signs + CTA) | 🔴 Unused |
| `daily_content.image_prompt` | `string` | AI image generation prompt | 🔴 Unused |
| `daily_content.manifestation_focus` | `string` | Daily manifestation paragraph | 🔴 Unused |
| `daily_content.collective_message` | `string` | Empty in samples (may be populated differently) | 🔴 Unused |
| `daily_content.panchangam_wisdom` | `string` | Empty in samples | 🔴 Unused |
| `daily_content.tithi_significance` | `string` | Empty in samples | 🔴 Unused |
| `daily_content.nakshatra_guidance` | `string` | Empty in samples | 🔴 Unused |
| `daily_content.date` | `string` | Date string | 🔴 Unused |
| `daily_content.content_stats` | `object` | Word count, char count, video duration, engagement elements | 🔴 Unused |

#### 2.2.1 `daily_content.individual_horoscopes` — The Richest Sub-Object

| Field | Type | Description | Status |
|---|---|---|---|
| `.cosmic_overview` | `string` | Day's overall cosmic energy paragraph | 🟢 **Used** — displayed in DataFeedCard "Daily Overview" |
| `.collective_guidance` | `string` | Universal message for all signs | 🔴 Unused |
| `.manifestation_focus` | `string` | Manifestation guidance paragraph | 🔴 Unused |
| `.timing_wisdom` | `string` | Best times for activities (morning, midday, evening) | 🔴 Unused |
| `.aries` through `.pisces` | `string` | Individual horoscope for each of the 12 signs (full paragraphs) | 🔴 Unused |
| `.spiritual_practice` | `string` | Daily recommended spiritual practice | 🔴 Unused |
| `.cosmic_image_prompt` | `string` | Detailed image generation prompt for the day's visual | 🔴 Unused |
| `.content_type` | `string` | Always `"enhanced_daily_horoscopes"` | 🔴 Unused |
| `.quality_indicators` | `object` | Booleans for content quality checks | 🔴 Unused |
| `.generation_timestamp` | `string` | Sub-object generation timestamp | 🔴 Unused |

---

### 2.3 `weekly_content` — Sunday Only

On non-Sundays, this is an empty object `{}`.

| Field | Type | Description | Status |
|---|---|---|---|
| `weekly_content.weekly_theme` | `string` | Week's cosmic theme paragraph | 🔴 Unused |
| `weekly_content.collective_message` | `string` | Universal weekly message | 🔴 Unused |
| `weekly_content.cosmic_timing` | `object` | Day-by-day timing guidance (Mon–Tue, Wed–Thu, Fri, Weekend) | 🔴 Unused |
| `weekly_content.spiritual_practice` | `string` | Week-long spiritual practice instructions | 🔴 Unused |
| `weekly_content.manifestation_focus` | `string` | Weekly manifestation focus | 🔴 Unused |
| `weekly_content.signs.[sign]` | `object` | **Per-sign weekly forecasts** with sub-fields: | 🔴 Unused |
| `.signs.[sign].cosmic_energy` | `string` | Week's energy for the sign | 🔴 Unused |
| `.signs.[sign].heart_guidance` | `string` | Love & relationships for the week | 🔴 Unused |
| `.signs.[sign].life_purpose` | `string` | Career & purpose for the week | 🔴 Unused |
| `.signs.[sign].spiritual_insight` | `string` | Spiritual teaching (Sanskrit/Vedic concept) | 🔴 Unused |
| `.signs.[sign].lucky_moments` | `string` | Best days for this sign | 🔴 Unused |
| `.signs.[sign].gentle_challenge` | `string` | Personal growth challenge for the week | 🔴 Unused |

---

### 2.4 `element_content` — Generated Every Day

| Field | Type | Description | Status |
|---|---|---|---|
| `.fire_signs` / `.earth_signs` / `.air_signs` / `.water_signs` | `object` | Element-group messages with `.message`, `.call_to_action`, `.spiritual_practice`; rest-day version adds `.affirmation` | 🟢 **Partially Used** — `.message` shown in DataFeedCard; `.call_to_action`, `.spiritual_practice`, `.affirmation` unused |
| `.manifestation_posts` | `array` (4–6 items) | Themed manifestation post objects with `.theme`, `.post`/`.content`, `.call_to_action`, `.timing`; rest-day version adds `.practical_step` and `.affirmation` | 🟢 **Partially Used** — `.theme` and `.post` used for carousel; `.call_to_action`, `.timing`, `.practical_step`, `.affirmation` unused |
| `.community_questions` | `array` (6 items) | Engagement questions for community interaction | 🔴 Unused |
| `.weekly_challenge` | `object` | Challenge with title, description, daily practice, why_it_works | 🔴 Unused |
| `.inclusive_messages` | `array` (3 items) | Messages for beginners, skeptics, and struggling individuals | 🔴 Unused |
| `.monthly_themes` | `array` or `object` | Monthly theme roadmap with focus areas and mantras | 🔴 Unused |
| `.engagement_starters` | `object` | Per-element conversation starter questions | 🔴 Unused (Sunday only) |
| `.crisis_support_message` | `object` | Mental health support message | 🔴 Unused (Sunday only) |
| `.conversation_starters` | `array` | General engagement questions | 🔴 Unused (RestDays only) |
| `.visual_content_ideas` | `array` | Content creation ideas for visual posts | 🔴 Unused (RestDays only) |
| `.engagement_boosters` | `object` | Save/share/comment/tag prompts | 🔴 Unused (RestDays only) |
| `.inclusive_language_reminders` | `array` | Community-sensitive messaging guidelines | 🔴 Unused (RestDays only) |

---

### 2.5 Top-Level Content Outputs (Pre-Formatted for Various Platforms)

| Field | Type | Description | Status |
|---|---|---|---|
| `comprehensive_blog` | `string` (Markdown) | Full blog combining daily + weekly + all signs | 🔴 Unused |
| `master_social_post` | `string` | Combined social caption (daily + weekly summary) | 🔴 Unused |
| `element_posts` | `object` | Pre-formatted element-group posts for social media | 🔴 Unused |
| `manifestation_posts` | `array` | Top-level duplicate of element_content manifestation posts | 🔴 Unused |
| `daily_video_script` | `string` | Short video script for daily reel | 🔴 Unused |
| `weekly_video_script` | `string` | Weekly recap video script (Sunday only, empty otherwise) | 🔴 Unused |
| `email_newsletter` | `string` | Ready-to-send email with subject line | 🔴 Unused |
| `twitter_thread` | `array` | Top-level Twitter thread (slightly different from daily_content version) | 🔴 Unused |
| `instagram_stories` | `array` (3–4 slides) | Structured IG story sequence with slide type, text, background | 🔴 Unused |
| `visual_content_data` | `object` | Key text snippets optimized for visual overlays | 🔴 Unused |

---

## 3. What the Dashboard Currently Uses

### ✅ Currently Implemented

| Feature | Data Source | How It's Used |
|---|---|---|
| **Post Caption Editor** | `daily_content.social_media_post` | Loaded into an editable `<textarea>` with copy-to-clipboard |
| **Element Messages Feed** | `element_content.{fire/earth/air/water}_signs.message` | Shown in DataFeedCard; "Add to Slide" pushes text to canvas |
| **Manifestation Carousel** | `element_content.manifestation_posts[].theme` + `.post` | Auto-generates multi-slide Fabric.js carousel with gradient backgrounds |
| **Cosmic Overview** | `daily_content.individual_horoscopes.cosmic_overview` | Shown in DataFeedCard; "Add to Slide" button |

### Summary Stats

| Metric | Count |
|---|---|
| Total unique data fields available | **~70+** |
| Fields currently consumed by dashboard | **~5** |
| **Utilization rate** | **~7%** |

---

## 4. Current Publishing Pipeline (Instagram + Facebook via Graph API)

The immediate plan is to use the Graph API to publish to **Instagram** and **Facebook** simultaneously. Based on the current data, here's what's ready to be used for this flow:

### 4.1 What Can Be Published TODAY with Graph API

| Content Type | Data Field | IG/FB Compatible | Notes |
|---|---|---|---|
| **Carousel Post** | Generated from `manifestation_posts` | ✅ Yes | Exported as PNG slides → uploaded via Graph API |
| **Post Caption** | `daily_content.social_media_post` | ✅ Yes | Already has hashtags and engagement hooks |
| **Single Image Post** | Could use `cosmic_image_prompt` or `image_prompt` | ✅ Yes | Need AI image generation step (DALL-E, Midjourney, etc.) |
| **Instagram Stories** | `daily_content.instagram_story` (3 slides) | ✅ Yes | Pre-structured, needs visual rendering |
| **IG Stories (v2)** | `instagram_stories` (top-level, 3–4 slides) | ✅ Yes | Includes `type` and `background` fields |

### 4.2 Graph API Content Mapping

```
Graph API POST /me/media → {
  image_url:    ← Export from Fabric.js canvas
  caption:      ← daily_content.social_media_post
  media_type:   "CAROUSEL" | "IMAGE" | "STORIES"
}
```

---

## 5. Future Implementation Possibilities

### Phase 1: Maximize Instagram & Facebook (Graph API)

These implementations use the **existing data** with the **Graph API** you're already connecting.

#### 5.1 — Individual Sign Carousels
- **Data:** `daily_content.individual_horoscopes.{aries…pisces}` (12 full paragraphs)
- **Implementation:** Generate a 12-slide carousel where each slide is dedicated to one zodiac sign with its daily reading
- **Impact:** Dramatically increases engagement — users seek out "their" sign
- **Effort:** Medium — extend existing `handleGenerateCarousel` to parse per-sign data

#### 5.2 — Weekly Forecast Carousel (Sundays)
- **Data:** `weekly_content.signs.{sign}.{cosmic_energy, heart_guidance, life_purpose, spiritual_insight, lucky_moments, gentle_challenge}`
- **Implementation:** Generate weekly forecast carousel (potentially 12 slides or 4 element-group slides) with multi-section layout
- **Impact:** High — weekly forecasts are premium engagement content. Users save + share these
- **Effort:** Medium — need new carousel template for multi-field per-sign layout

#### 5.3 — Instagram Stories Pipeline
- **Data:** `daily_content.instagram_story` (3 slides) + `instagram_stories` (top-level 3–4 slides)
- **Implementation:** Auto-generate Story-format images (1080×1920) from pre-structured slide data, including background themes
- **Impact:** High — Stories drive daily organic reach and maintain algorithm presence
- **Effort:** Low — already have Story canvas size support; data is pre-structured with text + background hints

#### 5.4 — Element Group Posts
- **Data:** `element_content.{fire/earth/air/water}_signs` with `.message`, `.call_to_action`, `.spiritual_practice`, `.affirmation`
- **Implementation:** Generate 4 individual element-themed posts (one per element) as standalone images or a mini-carousel
- **Impact:** Medium — targeted content groups increase saves/shares within sign communities
- **Effort:** Low — data is already displayed in the feed; just need render + export

#### 5.5 — AI Image Generation for Posts
- **Data:** `daily_content.individual_horoscopes.cosmic_image_prompt` + `daily_content.image_prompt`
- **Implementation:** Feed these prompts to an AI image API (DALL-E/Flux/Midjourney) to auto-generate unique daily header images for posts
- **Impact:** Very High — unique visual identity per day; eliminates need for stock images
- **Effort:** Medium — requires API integration (DALL-E API, Replicate, etc.)

#### 5.6 — Call-to-Action Overlays
- **Data:** `element_content.manifestation_posts[].call_to_action` + `element_content.{element}_signs.call_to_action`
- **Implementation:** Auto-add CTA text as a styled overlay on the final carousel slide (e.g., "Comment 'I embrace my fire'")
- **Impact:** High — engagement bait built into the data; currently wasted
- **Effort:** Low — just a text block on the last slide

#### 5.7 — Spiritual Practice Cards
- **Data:** `daily_content.individual_horoscopes.spiritual_practice` + `weekly_content.spiritual_practice`
- **Implementation:** Generate a standalone spiritual practice post/card with instructions for the daily recommended practice
- **Impact:** Medium — highly saveable content type; builds trust and authority
- **Effort:** Low — single slide with formatted text

#### 5.8 — Manifestation Focus Posts
- **Data:** `daily_content.manifestation_focus` + `daily_content.individual_horoscopes.manifestation_focus`
- **Implementation:** Dedicated daily manifestation post as a single image with beautiful typography
- **Impact:** Medium — manifestation content is peak engagement for the astrology niche
- **Effort:** Low

---

### Phase 2: Extended Platform Support (Beyond Current Graph API Scope)

These features use data that's already being generated but would require **additional platform integrations**.

#### 5.9 — Twitter/X Thread Bot
- **Data:** `daily_content.twitter_thread` (14-item array, pre-chunked for character limits)
- **Implementation:** Post `twitter_thread` items sequentially via Twitter API v2 as a threaded tweet chain
- **Platform:** Twitter/X API
- **Effort:** Medium — requires Twitter API credentials + thread posting logic

#### 5.10 — Email Newsletter Automation
- **Data:** `email_newsletter` (complete email with subject line)
- **Implementation:** Pipe content into an email service (Mailchimp, Resend, ConvertKit) for daily/weekly sends
- **Platform:** Email API (Mailchimp, Resend, SendGrid)
- **Effort:** Medium

#### 5.11 — Blog Auto-Publishing
- **Data:** `daily_content.blog_content` + `comprehensive_blog` (full Markdown articles, ~1800 words)
- **Implementation:** Auto-publish to WordPress, Ghost, or a custom CMS via their APIs
- **Platform:** CMS API
- **Effort:** Medium — Markdown needs to be converted to proper HTML/blocks

#### 5.12 — Video Script Teleprompter / AI Video
- **Data:** `daily_content.video_script` + `daily_video_script` + `weekly_video_script`
- **Implementation:** Either display scripts in a teleprompter UI or feed them to an AI video generator (HeyGen, Synthesia, D-ID)
- **Platform:** AI Video API or in-app teleprompter mode
- **Effort:** High for AI video, Low for teleprompter

---

### Phase 3: Dashboard Enhancement Features (No External APIs)

These improve the Sacred Cosmos Dashboard itself.

#### 5.13 — Cosmic Timing Widget
- **Data:** `daily_content.individual_horoscopes.timing_wisdom` + `weekly_content.cosmic_timing`
- **Implementation:** A dashboard widget showing "best cosmic windows" for activities throughout the day
- **Effort:** Low

#### 5.14 — Content Calendar View
- **Data:** `element_content.monthly_themes` + `weekly_content.cosmic_timing`
- **Implementation:** A visual calendar showing weekly/monthly themes, best posting times, and generated content status
- **Effort:** Medium

#### 5.15 — Community Engagement Bank
- **Data:** `element_content.community_questions` (6 items) + `element_content.engagement_starters` + `element_content.conversation_starters` + `element_content.engagement_boosters`
- **Implementation:** A searchable library of pre-generated engagement prompts, comment replies, and conversation starters organized by element and theme
- **Effort:** Low

#### 5.16 — Quality Analytics Dashboard
- **Data:** `content_analytics` + `daily_content.content_stats` + `daily_content.individual_horoscopes.quality_indicators`
- **Implementation:** Real-time analytics showing word counts, estimated video durations, engagement element tracking, and quality assurance metrics
- **Effort:** Low

#### 5.17 — Weekly Challenge Tracker
- **Data:** `element_content.weekly_challenge` (title, description, daily_practice, why_it_works, share_your_wins)
- **Implementation:** Display the current weekly challenge with a shareable graphic; could auto-generate a weekly challenge post
- **Effort:** Low

#### 5.18 — Inclusive Messaging Templates
- **Data:** `element_content.inclusive_messages` (for_beginners, for_skeptics, for_struggling) + `element_content.crisis_support_message`
- **Implementation:** Quick-access templates for responding to community members, with special handling for crisis support content
- **Effort:** Low

#### 5.19 — Multi-Caption Selector
- **Data:** `daily_content.social_media_post` + `master_social_post` + element-specific posts
- **Implementation:** Instead of a single caption textarea, offer a tabbed or dropdown selector with multiple pre-generated caption variants for different platforms/tones
- **Effort:** Low

#### 5.20 — Visual Content Data Optimizer
- **Data:** `visual_content_data.cosmic_overview`, `.weekly_theme`, `.manifestation_focus`, `.spiritual_practice`
- **Implementation:** These are shorter, optimized text snippets specifically designed for visual overlays. Use them as default text when generating single-slide images (as opposed to the longer blog versions)
- **Effort:** Very Low

---

## 6. Data Differences: Sunday vs Rest Days

Understanding the structural differences matters for conditional UI logic.

| Dimension | Sunday | Mon–Sat |
|---|---|---|
| `data_sources.weekly` | `true` | `false` |
| `weekly_content` | Full object (theme, signs, timing, practices) | Empty `{}` |
| `weekly_video_script` | Populated | Empty `""` |
| `instagram_stories` | 4 slides (includes weekly theme slide) | 3 slides (daily only) |
| `total_content_pieces` | 20 | 19 |
| `master_social_post` | Includes weekly theme paragraph | Daily content only |
| `comprehensive_blog` | Includes weekly section | Daily content only |
| `element_content` variations | Has `engagement_starters`, `crisis_support_message` | Has `conversation_starters`, `visual_content_ideas`, `engagement_boosters`, `inclusive_language_reminders` |
| `manifestation_posts` field name | `.post` | `.content` |
| Element signs extra field | — | `.affirmation` |
| Manifestation posts extra field | — | `.practical_step`, `.affirmation` |

> [!WARNING]
> **Key inconsistency:** The manifestation posts use `.post` on Sundays but `.content` on rest days. The carousel generator currently reads `.post` — this will fail on rest-day data. Also, rest-day data has additional fields like `.affirmation` and `.practical_step` that could enhance the carousel.

---

## 7. Priority Recommendations

For your immediate goal of **Instagram + Facebook via Graph API**, here's the recommended priority:

| Priority | Feature | Data Ready? | Effort | Impact |
|---|---|---|---|---|
| 🥇 **P0** | Fix `.post` vs `.content` inconsistency in carousel gen | ✅ | Trivial | Critical — carousel breaks on rest days |
| 🥇 **P0** | Individual sign carousels (12-slide daily) | ✅ | Medium | Very High engagement |
| 🥈 **P1** | Instagram Stories pipeline (auto-gen Story images) | ✅ | Low | High — daily Story reach |
| 🥈 **P1** | AI image generation from `cosmic_image_prompt` | ✅ | Medium | Very High — unique visuals |
| 🥈 **P1** | CTA overlays on carousel final slides | ✅ | Low | High — engagement boost |
| 🥉 **P2** | Weekly forecast carousel (Sunday) | ✅ | Medium | High — premium content |
| 🥉 **P2** | Element group standalone posts | ✅ | Low | Medium |
| 🥉 **P2** | Multi-caption selector | ✅ | Low | Medium — workflow efficiency |
| 📋 **P3** | Spiritual practice cards | ✅ | Low | Medium |
| 📋 **P3** | Manifestation focus posts | ✅ | Low | Medium |
| 📋 **P3** | Community engagement bank | ✅ | Low | Low-Medium |

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

# Daily Content
daily_content.blog_content
daily_content.social_media_post                     ← CURRENTLY USED
daily_content.video_script
daily_content.instagram_story.slide1.text
daily_content.instagram_story.slide1.background
daily_content.instagram_story.slide2.text
daily_content.instagram_story.slide2.background
daily_content.instagram_story.slide3.text
daily_content.instagram_story.slide3.background
daily_content.twitter_thread[]
daily_content.image_prompt
daily_content.manifestation_focus
daily_content.collective_message
daily_content.panchangam_wisdom
daily_content.tithi_significance
daily_content.nakshatra_guidance
daily_content.date
daily_content.content_stats.total_words
daily_content.content_stats.social_character_count
daily_content.content_stats.video_estimated_duration
daily_content.content_stats.engagement_elements[]
daily_content.content_stats.content_type

# Individual Horoscopes
daily_content.individual_horoscopes.cosmic_overview  ← CURRENTLY USED
daily_content.individual_horoscopes.collective_guidance
daily_content.individual_horoscopes.manifestation_focus
daily_content.individual_horoscopes.timing_wisdom
daily_content.individual_horoscopes.aries
daily_content.individual_horoscopes.taurus
daily_content.individual_horoscopes.gemini
daily_content.individual_horoscopes.cancer
daily_content.individual_horoscopes.leo
daily_content.individual_horoscopes.virgo
daily_content.individual_horoscopes.libra
daily_content.individual_horoscopes.scorpio
daily_content.individual_horoscopes.sagittarius
daily_content.individual_horoscopes.capricorn
daily_content.individual_horoscopes.aquarius
daily_content.individual_horoscopes.pisces
daily_content.individual_horoscopes.spiritual_practice
daily_content.individual_horoscopes.cosmic_image_prompt
daily_content.individual_horoscopes.content_type
daily_content.individual_horoscopes.quality_indicators.*
daily_content.individual_horoscopes.generation_timestamp

# Weekly Content (Sunday Only)
weekly_content.weekly_theme
weekly_content.collective_message
weekly_content.cosmic_timing.monday_tuesday
weekly_content.cosmic_timing.wednesday_thursday
weekly_content.cosmic_timing.friday
weekly_content.cosmic_timing.weekend
weekly_content.spiritual_practice
weekly_content.manifestation_focus
weekly_content.signs.[sign].cosmic_energy
weekly_content.signs.[sign].heart_guidance
weekly_content.signs.[sign].life_purpose
weekly_content.signs.[sign].spiritual_insight
weekly_content.signs.[sign].lucky_moments
weekly_content.signs.[sign].gentle_challenge

# Element Content
element_content.fire_signs.message                   ← CURRENTLY USED
element_content.fire_signs.call_to_action
element_content.fire_signs.spiritual_practice
element_content.fire_signs.affirmation               (rest-days only)
element_content.earth_signs.*                        (same structure)
element_content.air_signs.*                          (same structure)
element_content.water_signs.*                        (same structure)
element_content.manifestation_posts[].theme           ← CURRENTLY USED
element_content.manifestation_posts[].post            ← CURRENTLY USED (Sunday)
element_content.manifestation_posts[].content         (rest-days variant)
element_content.manifestation_posts[].call_to_action
element_content.manifestation_posts[].timing
element_content.manifestation_posts[].practical_step  (rest-days only)
element_content.manifestation_posts[].affirmation     (rest-days only)
element_content.community_questions[]
element_content.weekly_challenge.*
element_content.inclusive_messages[]
element_content.monthly_themes[]
element_content.engagement_starters.*                (Sunday only)
element_content.crisis_support_message.*             (Sunday only)
element_content.conversation_starters[]              (rest-days only)
element_content.visual_content_ideas[]               (rest-days only)
element_content.engagement_boosters.*                (rest-days only)
element_content.inclusive_language_reminders[]        (rest-days only)

# Top-Level Outputs
comprehensive_blog
master_social_post
element_posts.fire_signs.*
element_posts.earth_signs.*
element_posts.air_signs.*
element_posts.water_signs.*
manifestation_posts[].theme
manifestation_posts[].content
manifestation_posts[].call_to_action
manifestation_posts[].timing
daily_video_script
weekly_video_script
email_newsletter
twitter_thread[]
instagram_stories[].slide
instagram_stories[].type
instagram_stories[].text
instagram_stories[].background
visual_content_data.cosmic_overview
visual_content_data.weekly_theme
visual_content_data.manifestation_focus
visual_content_data.spiritual_practice

# Analytics
content_analytics.blog_word_count
content_analytics.social_character_count
content_analytics.total_formats_generated
content_analytics.element_targeting
content_analytics.manifestation_content
content_analytics.video_content
```

</details>
