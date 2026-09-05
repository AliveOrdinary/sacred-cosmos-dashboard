import React from 'react'
import {
  AbsoluteFill, Audio, Sequence, useCurrentFrame, useVideoConfig, interpolate, Easing,
} from 'remotion'
import '@fontsource/fraunces/600.css'
import '@fontsource/fraunces/700.css'
import { T, FONT, W, H, mulberry32 } from './theme'
import { Grain } from './components/Grain'
import { Starfield } from './components/Starfield'

// ---------------------------------------------------------------------------
// DailyReel — one argument in six beats.
//
// Two things make this different from the earlier reels: the on-screen text is
// NOT the narration (`show` is a 3-6 word compression of `say`), and the whole
// frame changes per beat so there is always a visual reason to still be
// watching. The day's `styleVariant` picks the register; the layout engine
// underneath is shared.
// ---------------------------------------------------------------------------

const PAD = 96

// Each variant supplies a ground, a type colour, an accent and a per-line hue
// step. Everything else — layout, timing, animation — is common.
const VARIANTS = {
  flat_color: {
    font: FONT.display,
    weight: 700,
    uppercase: false,
    grain: 0.10,
    stars: false,
    ground: (i, rnd) => {
      // Saturated flat blocks, one per line, walking a fixed hue ladder so the
      // sequence feels composed rather than random.
      const HUES = [14, 190, 42, 262, 6, 168, 32, 210, 350]
      const h = HUES[i % HUES.length]
      return { background: `hsl(${h}, ${46 + Math.floor(rnd() * 10)}%, ${13 + (i % 3) * 2}%)` }
    },
    text: '#F4EFE4',
    accent: T.color.ink.red,
  },
  grain_photo: {
    font: FONT.display,
    weight: 600,
    uppercase: false,
    grain: 0.22,
    stars: true,
    ground: () => ({
      background: `radial-gradient(120% 80% at 50% 8%, ${T.color.ground.glowTop} 0%, ${T.color.ground.base} 58%, ${T.color.ground.vignette} 100%)`,
    }),
    text: T.color.text.primary,
    accent: T.color.ink.red,
  },
  mono_accent: {
    font: FONT.display,
    weight: 700,
    uppercase: true,
    grain: 0.14,
    stars: false,
    ground: (i) => ({ background: i % 2 === 0 ? '#0A0A0A' : '#F2F0EA' }),
    text: null, // resolved per line against the alternating ground
    accent: T.color.ink.red,
  },
  kinetic_type: {
    font: FONT.display,
    weight: 700,
    uppercase: true,
    grain: 0.08,
    stars: false,
    ground: () => ({ background: '#08070D' }),
    text: '#FFFFFF',
    accent: T.color.ink.red,
  },
}

// Type fills the frame: the fewer the words, the bigger they get. Sized off the
// longest word so a single long word can never overflow the 1080 width.
function typeSize(text, { uppercase }) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean)
  const longest = words.reduce((a, w) => Math.max(a, w.length), 1)
  const avgGlyph = uppercase ? 0.62 : 0.55
  const byWidth = (W - PAD * 2) / (longest * avgGlyph)
  const byCount = words.length <= 3 ? 210 : words.length <= 5 ? 168 : 132
  return Math.max(64, Math.min(byWidth, byCount))
}

// Word-level entrance. Each word lands slightly after the one before it, so the
// line reads as speech arriving rather than a card appearing.
const Words = ({ text, size, color, font, weight, uppercase, accentWord, accent }) => {
  const frame = useCurrentFrame()
  const words = String(text || '').trim().split(/\s+/).filter(Boolean)
  return (
    <div
      style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center',
        gap: `${Math.round(size * 0.06)}px ${Math.round(size * 0.24)}px`,
        maxWidth: W - PAD * 2,
      }}
    >
      {words.map((w, i) => {
        const start = 3 + i * 3
        const p = interpolate(frame, [start, start + 9], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
        })
        return (
          <span
            key={i}
            style={{
              fontFamily: font,
              fontWeight: weight,
              fontSize: size,
              lineHeight: 1.02,
              color: accentWord === i ? accent : color,
              textTransform: uppercase ? 'uppercase' : 'none',
              letterSpacing: uppercase ? '-0.01em' : '-0.02em',
              opacity: p,
              transform: `translateY(${(1 - p) * size * 0.22}px)`,
              display: 'inline-block',
            }}
          >
            {w}
          </span>
        )
      })}
    </div>
  )
}

// A thin progress hairline: cheap, but it tells a cold viewer the piece has a
// shape and an end, which is exactly the question they are asking at second 3.
const Progress = ({ color }) => {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: 'clamp' })
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 5, background: 'rgba(255,255,255,0.10)' }}>
      <div style={{ height: '100%', width: `${p * 100}%`, background: color, opacity: 0.55 }} />
    </div>
  )
}

const Line = ({ line, index, variant, rnd }) => {
  const v = VARIANTS[variant] || VARIANTS.grain_photo
  const ground = v.ground(index, rnd)
  const isDarkGround =
    variant !== 'mono_accent' ? true : index % 2 === 0
  const color = v.text || (isDarkGround ? '#F2F0EA' : '#0A0A0A')
  const text = line.show || line.text
  const size = typeSize(text, v)

  // The payoff is the screenshot moment — hold it in the accent so it reads as
  // the conclusion rather than one more beat.
  const isPayoff = line.kind === 'payoff'
  const isCta = line.kind === 'cta'

  return (
    <AbsoluteFill style={ground}>
      {v.stars && <Starfield seed={index + 3} />}
      <AbsoluteFill
        style={{
          justifyContent: 'center', alignItems: 'center',
          padding: PAD, textAlign: 'center',
        }}
      >
        {isCta ? (
          <div
            style={{
              fontFamily: FONT.mono, fontSize: 46, lineHeight: 1.5,
              color, letterSpacing: '0.02em', maxWidth: W - PAD * 2,
            }}
          >
            {text}
          </div>
        ) : (
          <Words
            text={text}
            size={isPayoff ? size * 0.82 : size}
            color={isPayoff ? v.accent : color}
            font={v.font}
            weight={v.weight}
            uppercase={v.uppercase}
            accentWord={null}
            accent={v.accent}
          />
        )}
      </AbsoluteFill>
      <Grain opacity={v.grain} />
    </AbsoluteFill>
  )
}

export const DailyReel = ({ lines = [], seed = 1, styleVariant = 'grain_photo' }) => {
  const rnd = mulberry32(seed)
  const v = VARIANTS[styleVariant] || VARIANTS.grain_photo
  let at = 0
  return (
    <AbsoluteFill style={{ background: '#08070D' }}>
      {lines.map((line, i) => {
        const from = at
        at += line.durationInFrames
        return (
          <Sequence key={i} from={from} durationInFrames={line.durationInFrames}>
            <Line line={line} index={i} variant={styleVariant} rnd={rnd} />
            {line.src && <Audio src={line.src} />}
          </Sequence>
        )
      })}
      <Progress color={v.accent} />
    </AbsoluteFill>
  )
}
