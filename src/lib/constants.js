import { Star, Heart, Cloud, Sun, Moon, Sparkles, Zap, Flame, Droplets, Wind, Mountain, Feather, Leaf, Infinity, Eye, Hexagon, CircleDashed } from 'lucide-react'

export const ICON_LIBRARY = [
  { name: 'Star', icon: Star },
  { name: 'Heart', icon: Heart },
  { name: 'Cloud', icon: Cloud },
  { name: 'Sun', icon: Sun },
  { name: 'Moon', icon: Moon },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Zap', icon: Zap },
  { name: 'Flame', icon: Flame },
  { name: 'Water', icon: Droplets },
  { name: 'Wind', icon: Wind },
  { name: 'Earth', icon: Mountain },
  { name: 'Air', icon: Feather },
  { name: 'Nature', icon: Leaf },
  { name: 'Infinity', icon: Infinity },
  { name: 'Vision', icon: Eye },
  { name: 'Sacred', icon: Hexagon },
  { name: 'Aura', icon: CircleDashed },
]

// Extended slide background colors
export const BACKGROUND_COLORS = [
  // Deep/Vibrant
  '#0B0914', '#1e1b4b', '#312e81', '#4c1d95', '#701a75', '#831843', '#9f1239', '#7f1d1d',
  // Grays/Neutrals
  '#171717', '#262626', '#404040', '#525252', '#737373',
  // Cools/Earthy
  '#064e3b', '#065f46', '#0f766e', '#0369a1', '#1d4ed8',
  // Lights/Whites
  '#ffffff', '#f8fafc', '#f1f5f9', '#fdf4ff', '#fff1f2', '#fffbeb'
]

// Basic fonts to select from
export const FONTS = ['sans-serif', 'serif', 'monospace', 'Inter', 'Playfair Display', 'Fraunces']

// ── Annotated Observatory slide system ────────────────────────────────────
// Values come from brand/brand.tokens.json — the single source of truth
// shared with the Remotion reels. Change the brand there, not here.
import brandTokens from '../../brand/brand.tokens.json'

// Sign + apparatus glyphs as raw SVG, same files the reels consume.
import glyphAries from '../../brand/glyphs/aries.svg?raw'
import glyphTaurus from '../../brand/glyphs/taurus.svg?raw'
import glyphGemini from '../../brand/glyphs/gemini.svg?raw'
import glyphCancer from '../../brand/glyphs/cancer.svg?raw'
import glyphLeo from '../../brand/glyphs/leo.svg?raw'
import glyphVirgo from '../../brand/glyphs/virgo.svg?raw'
import glyphLibra from '../../brand/glyphs/libra.svg?raw'
import glyphScorpio from '../../brand/glyphs/scorpio.svg?raw'
import glyphSagittarius from '../../brand/glyphs/sagittarius.svg?raw'
import glyphCapricorn from '../../brand/glyphs/capricorn.svg?raw'
import glyphAquarius from '../../brand/glyphs/aquarius.svg?raw'
import glyphPisces from '../../brand/glyphs/pisces.svg?raw'
import glyphAsterisk from '../../brand/glyphs/mark-asterisk.svg?raw'

export const GLYPH_SVGS = {
  aries: glyphAries, taurus: glyphTaurus, gemini: glyphGemini, cancer: glyphCancer,
  leo: glyphLeo, virgo: glyphVirgo, libra: glyphLibra, scorpio: glyphScorpio,
  sagittarius: glyphSagittarius, capricorn: glyphCapricorn, aquarius: glyphAquarius,
  pisces: glyphPisces, 'mark-asterisk': glyphAsterisk,
}

// Unicode symbols still flow through item.glyph from the generators — map
// them back to SVG keys so no call site needs changing.
export const GLYPH_KEY_FOR_SYMBOL = {
  '\u2648': 'aries', '\u2649': 'taurus', '\u264A': 'gemini', '\u264B': 'cancer',
  '\u264C': 'leo', '\u264D': 'virgo', '\u264E': 'libra', '\u264F': 'scorpio',
  '\u2650': 'sagittarius', '\u2651': 'capricorn', '\u2652': 'aquarius',
  '\u2653': 'pisces', '\u2726': 'mark-asterisk',
}

export const SLIDE_THEME = {
  void: brandTokens.color.ground.base,
  bloom: brandTokens.color.ground.glowTop,
  moonlight: brandTokens.color.text.primary,
  mist: brandTokens.color.text.body,
  ink: brandTokens.color.ink.red,
  gold: brandTokens.color.ink.red, // deprecated alias — red ink is THE accent now
  footerInk: brandTokens.color.text.muted,
  dotOff: brandTokens.color.ui.tickOff,
  dashRule: brandTokens.color.ui.dashRule,
  handle: '@sacredcosmos',
  titleFont: brandTokens.type.display.family,
  bodyFont: brandTokens.type.body.family,
  monoFont: brandTokens.type.apparatus.family,
}

// Per-element tints from the brand tokens. Chrome stays red-ink; these tint
// the eyebrow text only, so element carousels stay distinguishable without
// breaking the one-accent rule.
export const ELEMENT_ACCENTS = { ...brandTokens.color.elementTint }

// Colors offered in the editors — brand palette only, so edits stay on-theme
export const BRAND_SWATCHES = [
  SLIDE_THEME.moonlight,
  SLIDE_THEME.mist,
  SLIDE_THEME.ink,
  ELEMENT_ACCENTS.fire,
  ELEMENT_ACCENTS.earth,
  ELEMENT_ACCENTS.air,
  ELEMENT_ACCENTS.water,
]

// Common brand colors to select from (can be customized)
export const COLORS = ['#FDFCF0', '#0B0914', '#F2D388', '#8B5CF6', '#10B981', '#EF4444', '#3B82F6']

export const GRADIENTS = [
  // Disciplined family on the shared dark base — the feed reads as one body
  // of work. Element duotones + two neutrals; nothing brighter belongs here.
  { name: 'Observatory', colors: ['#16142B', '#0B0A16'] },
  { name: 'Vignette',    colors: ['#0B0A16', '#070610'] },
  { name: 'Ember',       colors: ['#2A1610', '#0B0A16'] },
  { name: 'Moss',        colors: ['#142014', '#0B0A16'] },
  { name: 'Silver',      colors: ['#191D26', '#0B0A16'] },
  { name: 'Deep Teal',   colors: ['#0E1F20', '#0B0A16'] },
]

// 12 zodiac signs used by the sign carousel generator
export const ZODIAC_SIGNS = [
  { name: 'Aries',       symbol: '♈', key: 'aries',       element: 'fire' },
  { name: 'Taurus',      symbol: '♉', key: 'taurus',      element: 'earth' },
  { name: 'Gemini',      symbol: '♊', key: 'gemini',      element: 'air' },
  { name: 'Cancer',      symbol: '♋', key: 'cancer',      element: 'water' },
  { name: 'Leo',         symbol: '♌', key: 'leo',         element: 'fire' },
  { name: 'Virgo',       symbol: '♍', key: 'virgo',       element: 'earth' },
  { name: 'Libra',       symbol: '♎', key: 'libra',       element: 'air' },
  { name: 'Scorpio',     symbol: '♏', key: 'scorpio',     element: 'water' },
  { name: 'Sagittarius', symbol: '♐', key: 'sagittarius', element: 'fire' },
  { name: 'Capricorn',   symbol: '♑', key: 'capricorn',   element: 'earth' },
  { name: 'Aquarius',    symbol: '♒', key: 'aquarius',    element: 'air' },
  { name: 'Pisces',      symbol: '♓', key: 'pisces',      element: 'water' },
]

// Maps the background hint strings from n8n IG story data → gradient color pairs
export const STORY_BACKGROUNDS = {
  'cosmic Sanskrit':  ['#1a0533', '#4a1a7a'],
  'cosmic_gradient':  ['#1a0533', '#4a1a7a'],
  'sacred geometry':  ['#0d1b2a', '#1b4965'],
  'mystical purple':  ['#2d1b69', '#7b2ff7'],
  'mystical_purple':  ['#2d1b69', '#7b2ff7'],
  'fire_energy':      ['#7f1d1d', '#dc2626'],
  'call_to_action':   ['#4a1a7a', '#f59e0b'],
  'weekly_theme':     ['#1e1b4b', '#6d28d9'],
  'element_spotlight': ['#7f1d1d', '#dc2626'],
}

// Default blank slide state
export const getEmptyCanvasJSON = () => ({
  version: "6.5.0",
  objects: [],
  background: "#0B0914"
})
