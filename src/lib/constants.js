import { Star, Heart, Cloud, Sun, Moon, Sparkles, Zap } from 'lucide-react'

export const ICON_LIBRARY = [
  { name: 'Star', icon: Star },
  { name: 'Heart', icon: Heart },
  { name: 'Cloud', icon: Cloud },
  { name: 'Sun', icon: Sun },
  { name: 'Moon', icon: Moon },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Zap', icon: Zap },
]

// Basic fonts to select from
export const FONTS = ['sans-serif', 'serif', 'monospace', 'Inter', 'Playfair Display']

// Common brand colors to select from (can be customized)
export const COLORS = ['#FDFCF0', '#0B0914', '#F2D388', '#8B5CF6', '#10B981', '#EF4444', '#3B82F6']

export const GRADIENTS = [
  // Warm
  { name: 'Sunset',     colors: ['#f953c6', '#b91d73'] },
  { name: 'Peach',      colors: ['#ed4264', '#ffedbc'] },
  { name: 'Golden',     colors: ['#f7971e', '#ffd200'] },
  { name: 'Coral',      colors: ['#ff7e5f', '#feb47b'] },
  { name: 'Rose',       colors: ['#f43b47', '#453a94'] },
  // Cool
  { name: 'Ocean',      colors: ['#43cea2', '#185a9d'] },
  { name: 'Sky',        colors: ['#56ccf2', '#2f80ed'] },
  { name: 'Teal',       colors: ['#11998e', '#38ef7d'] },
  { name: 'Ice',        colors: ['#a8edea', '#fed6e3'] },
  // Purple / Mystic
  { name: 'Mystic',     colors: ['#8E2DE2', '#4A00E0'] },
  { name: 'Aurora',     colors: ['#a18cd1', '#fbc2eb'] },
  { name: 'Cosmic',     colors: ['#6a3093', '#a044ff'] },
  { name: 'Dusk',       colors: ['#2c3e50', '#fd746c'] },
  // Dark
  { name: 'Midnight',   colors: ['#0f0c29', '#302b63'] },
  { name: 'Dark Space', colors: ['#141E30', '#243B55'] },
  { name: 'Carbon',     colors: ['#1c1c1c', '#3a3a3a'] },
]

// 12 zodiac signs used by the sign carousel generator
export const ZODIAC_SIGNS = [
  { name: 'Aries',       symbol: '♈', key: 'aries' },
  { name: 'Taurus',      symbol: '♉', key: 'taurus' },
  { name: 'Gemini',      symbol: '♊', key: 'gemini' },
  { name: 'Cancer',      symbol: '♋', key: 'cancer' },
  { name: 'Leo',         symbol: '♌', key: 'leo' },
  { name: 'Virgo',       symbol: '♍', key: 'virgo' },
  { name: 'Libra',       symbol: '♎', key: 'libra' },
  { name: 'Scorpio',     symbol: '♏', key: 'scorpio' },
  { name: 'Sagittarius', symbol: '♐', key: 'sagittarius' },
  { name: 'Capricorn',   symbol: '♑', key: 'capricorn' },
  { name: 'Aquarius',    symbol: '♒', key: 'aquarius' },
  { name: 'Pisces',      symbol: '♓', key: 'pisces' },
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
