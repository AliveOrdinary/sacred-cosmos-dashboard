import '@fontsource/fraunces/300.css'
import '@fontsource/fraunces/400.css'
import '@fontsource/newsreader/300.css'
import '@fontsource/newsreader/400.css'
import '@fontsource/courier-prime/400.css'
import '@fontsource/courier-prime/700.css'
import tokens from '../../brand/brand.tokens.json'

export const T = tokens
export const FPS = 30
export const W = 1080
export const H = 1920

export const FONT = {
  display: "'Fraunces', serif",
  body: "'Newsreader', serif",
  mono: "'Courier Prime', monospace",
}

// Small deterministic PRNG so the Cosmic Seed varies each day's render.
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Rough width-aware font sizing. Fraunces averages ~0.52em per glyph, and
// word-boundary wrapping wastes some of each line, so we assume 0.58 to stay
// safe. Returns the largest size (within range) that fits `maxLines`.
export function fitText(text, { maxWidth, maxSize, minSize, maxLines = 3 }) {
  const chars = (text || '').length
  if (!chars) return maxSize
  for (let size = maxSize; size > minSize; size -= 2) {
    const charsPerLine = Math.max(1, Math.floor(maxWidth / (size * 0.58)))
    if (Math.ceil(chars / charsPerLine) <= maxLines) return size
  }
  return minSize
}

// Splits a hook into head text plus a tail phrase that always renders on its
// own line, so the hand-drawn underline can never collide with wrapped text.
export function splitHook(text, tailWords = 3) {
  const clean = (text || '').trim().replace(/[.]+$/, '')
  const words = clean.split(/\s+/)
  if (words.length <= tailWords) return { head: '', tail: clean }
  const cut = words.length - tailWords
  return { head: words.slice(0, cut).join(' '), tail: words.slice(cut).join(' ') }
}
