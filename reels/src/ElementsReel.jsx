import React from 'react'
import { AbsoluteFill, Audio, Sequence, interpolate, useCurrentFrame } from 'remotion'
import { T, FONT, fitText, splitHook } from './theme'
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

// A row fades in when the narrator reaches it, sits at full weight while its
// line is spoken, then recedes to a dim "already said" state. That contrast is
// what makes four lines read as four separate call-outs rather than a list.
const ElementRow = ({ line, appearFrame, endFrame }) => {
  const frame = useCurrentFrame()
  const IN = 10
  const entry = interpolate(frame, [appearFrame, appearFrame + IN], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const y = interpolate(frame, [appearFrame, appearFrame + IN], [16, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  // 1 while active, easing to 0 once the voice has moved on
  const active = interpolate(frame, [endFrame - 8, endFrame + 6], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const opacity = entry * (0.42 + 0.58 * active)
  const glyphSize = 62 + 6 * active

  return (
    <div
      style={{
        display: 'flex',
        gap: 34,
        alignItems: 'flex-start',
        opacity,
        transform: `translateY(${y}px)`,
        marginBottom: 44,
      }}
    >
      <div style={{ flexShrink: 0, paddingTop: 6, width: 68 }}>
        <Glyph name={GLYPH_FOR[line.kind]} size={glyphSize} color={T.color.ink.red} />
      </div>
      <div>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 22,
            letterSpacing: '0.12em',
            color: active > 0.5 ? T.color.ink.red : T.color.text.muted,
            marginBottom: 10,
          }}
        >
          {SIGNS_FOR[line.kind]}
        </div>
        <div
          style={{
            fontFamily: FONT.body,
            fontWeight: 300,
            fontSize: 42,
            lineHeight: 1.38,
            color: active > 0.5 ? T.color.text.primary : T.color.text.body,
            maxWidth: 720,
          }}
        >
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

  const hookSize = fitText(hook?.text, { maxWidth: 880, maxSize: 84, minSize: 54, maxLines: 2 })
  const { head, tail } = splitHook(hook?.text)
  const hookFrames = hook?.durationInFrames || 40

  return (
    <ReelFrame seed={seed} mastLeft="THE ELEMENTS · TONIGHT" mastRight={dateLabel} ambientSrc={ambientSrc}>
      <AbsoluteFill
        style={{
          padding: '290px 100px 330px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {/* Hook — auto-sized, tail on its own line */}
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 300,
            fontSize: hookSize,
            lineHeight: 1.16,
            maxWidth: 880,
            marginBottom: 76,
          }}
        >
          {head ? <span>{head} </span> : null}
          <span style={{ display: 'inline-block' }}>
            <UnderlineDraw startFrame={Math.floor(hookFrames * 0.35)} durationInFrames={Math.floor(hookFrames * 0.5)}>
              {tail}
            </UnderlineDraw>
            .
          </span>
        </div>

        {/* Accumulating element rows */}
        <div>
          {elements.map((line) => {
            const start = lineStart(lines, lines.indexOf(line))
            return (
              <ElementRow
                key={line.kind}
                line={line}
                appearFrame={start}
                endFrame={start + line.durationInFrames}
              />
            )
          })}
        </div>
      </AbsoluteFill>

      {/* CTA */}
      {ctaOn ? (
        <div
          style={{
            position: 'absolute',
            bottom: 236,
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
