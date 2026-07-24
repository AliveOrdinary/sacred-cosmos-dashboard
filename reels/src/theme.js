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
