import React from 'react'
import { Audio, Sequence, interpolate, useCurrentFrame } from 'remotion'
import { T, FONT } from './theme'
import { ReelFrame } from './components/ReelFrame'
import { UnderlineDraw } from './components/UnderlineDraw'
import { Glyph } from './components/Glyph'

// lines: hook, fire, earth, air, water, cta — each { text, src, durationInFrames, kind }
// Element rows accumulate into a list as the narrator reaches them.

const lineStart = (lines, i) => lines.slice(0, i).reduce((a, l) => a + l.durationInFrames, 0)
const GLYPH_FOR = { fire: 'el-fire', earth: 'el-earth', air: 'el-air', water: 'el-water' }
const SIGNS_FOR = {
  fire: 'aries · leo · sagittarius',
  earth: 'taurus · virgo · capricorn',
  air: 'gemini · libra · aquarius',
  water: 'cancer · scorpio · pisces',
}

const ElementRow = ({ line, appearFrame }) => {
  const frame = useCurrentFrame()
  const o = interpolate(frame, [appearFrame, appearFrame + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const y = interpolate(frame, [appearFrame, appearFrame + 10], [16, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <div style={{ display: 'flex', gap: 34, alignItems: 'flex-start', opacity: o, transform: `translateY(${y}px)`, marginBottom: 58 }}>
      <div style={{ flexShrink: 0, paddingTop: 6 }}>
        <Glyph name={GLYPH_FOR[line.kind]} size={62} color={T.color.ink.red} />
      </div>
      <div>
        <div style={{ fontFamily: FONT.mono, fontSize: 22, letterSpacing: '0.12em', color: T.color.text.muted, marginBottom: 10 }}>
          {SIGNS_FOR[line.kind]}
        </div>
        <div style={{ fontFamily: FONT.body, fontWeight: 300, fontSize: 44, lineHeight: 1.42, color: T.color.text.body, maxWidth: 720 }}>
          {line.text}
        </div>
      </div>
    </div>
  )
}

export const ElementsReel = ({ lines, seed = 1, dateLabel = '', ambientSrc = null }) => {
  const frame = useCurrentFrame()
  const hook = lines.find((l) => l.kind === 'hook')
  const elements = lines.filter((l) => GLYPH_FOR[l.kind])
  const cta = lines.find((l) => l.kind === 'cta')
  const ctaStart = cta ? lineStart(lines, lines.indexOf(cta)) : 0
  const ctaOn = cta && frame >= ctaStart

  const words = (hook?.text || '').replace(/[.]+$/, '').split(' ')
  const cut = Math.max(1, words.length - 3)

  return (
    <ReelFrame seed={seed} mastLeft="THE ELEMENTS · TONIGHT" mastRight={dateLabel} ambientSrc={ambientSrc}>
      {/* Hook */}
      <div
        style={{
          position: 'absolute',
          top: 320,
          left: 100,
          right: 100,
          fontFamily: FONT.display,
          fontWeight: 300,
          fontSize: 84,
          lineHeight: 1.18,
        }}
      >
        {words.slice(0, cut).join(' ')}{' '}
        <UnderlineDraw startFrame={Math.floor((hook?.durationInFrames || 40) * 0.35)} durationInFrames={Math.floor((hook?.durationInFrames || 40) * 0.5)}>
          {words.slice(cut).join(' ')}
        </UnderlineDraw>
        .
      </div>

      {/* Accumulating element rows */}
      <div style={{ position: 'absolute', top: 640, left: 100, right: 100 }}>
        {elements.map((line) => (
          <ElementRow key={line.kind} line={line} appearFrame={lineStart(lines, lines.indexOf(line))} />
        ))}
      </div>

      {/* CTA */}
      {ctaOn ? (
        <div
          style={{
            position: 'absolute',
            bottom: 240,
            left: 100,
            right: 100,
            fontFamily: FONT.body,
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 42,
            lineHeight: 1.5,
            color: T.color.text.dim,
            opacity: interpolate(frame, [ctaStart, ctaStart + 10], [0, 1], { extrapolateRight: 'clamp' }),
          }}
        >
          <span style={{ color: T.color.ink.red, marginRight: 18, fontStyle: 'normal' }}>*</span>
          {cta.text}
        </div>
      ) : null}

      {/* Per-line voiceover */}
      {lines.map((line, i) =>
        line.src ? (
          <Sequence key={'a' + i} from={lineStart(lines, i)} durationInFrames={line.durationInFrames} layout="none">
            <Audio src={line.src} />
          </Sequence>
        ) : null
      )}

      <div
        style={{
          position: 'absolute',
          left: 100,
          right: 100,
          bottom: 130,
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: FONT.mono,
          fontSize: T.scale1080.footer,
          color: T.color.text.muted,
        }}
      >
        <span>@sacredcosmos</span>
        <span>which one is you?</span>
      </div>
    </ReelFrame>
  )
}
