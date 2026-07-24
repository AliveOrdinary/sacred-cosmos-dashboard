import React from 'react'
import { AbsoluteFill, Audio, Sequence, interpolate, useCurrentFrame } from 'remotion'
import { T, FONT } from './theme'
import { ReelFrame } from './components/ReelFrame'
import { Stamp, Ticks } from './components/Stamp'
import { UnderlineDraw } from './components/UnderlineDraw'

// lines: [{ text, src, durationInFrames, kind: 'hook'|'beat'|'cta' }]
// Timing is AUDIO-DRIVEN: the server measures each TTS clip and passes
// durations as props. Visuals sync to the voice, never to a fixed grid.

const lineStart = (lines, i) => lines.slice(0, i).reduce((a, l) => a + l.durationInFrames, 0)

const Beat = ({ text, isCta }) => {
  const frame = useCurrentFrame()
  const o = interpolate(frame, [0, T.motion.beatReveal ? 10 : 10], [0, 1], { extrapolateRight: 'clamp' })
  const y = interpolate(frame, [0, 10], [T.motion.beatReveal.riseFromPx, 0], { extrapolateRight: 'clamp' })
  return (
    <div
      style={{
        fontFamily: FONT.body,
        fontWeight: 300,
        fontSize: T.scale1080.reelBeat,
        lineHeight: 1.58,
        color: T.color.text.dim,
        maxWidth: 780,
        opacity: o,
        transform: `translateY(${y}px)`,
      }}
    >
      {isCta ? <span style={{ color: T.color.ink.red, marginRight: 18 }}>*</span> : null}
      {text}
    </div>
  )
}

export const ManifestationReel = ({ lines, seed = 1, dateLabel = '', ambientSrc = null }) => {
  const frame = useCurrentFrame()
  const hook = lines.find((l) => l.kind === 'hook')
  const beats = lines.filter((l) => l.kind !== 'hook')
  const beatsDone = beats.filter((_, i) => frame >= lineStart(lines, lines.indexOf(beats[i]))).length

  // Underline the tail of the hook (last 3 words), drawn while the hook is spoken.
  const words = (hook?.text || '').replace(/[.]+$/, '').split(' ')
  const cut = Math.max(1, words.length - 3)
  const head = words.slice(0, cut).join(' ')
  const tail = words.slice(cut).join(' ')

  return (
    <ReelFrame seed={seed} mastLeft="DAILY MANIFESTATION" mastRight={dateLabel} ambientSrc={ambientSrc}>
      <Stamp glyph="mark-asterisk" startFrame={6} />

      {/* Hook — persistent through the whole reel */}
      <div
        style={{
          position: 'absolute',
          top: 470,
          left: 100,
          right: 100,
          fontFamily: FONT.display,
          fontWeight: 300,
          fontSize: T.scale1080.reelHook,
          lineHeight: 1.18,
          maxWidth: 880,
        }}
      >
        {head}{' '}
        <UnderlineDraw startFrame={Math.floor((hook?.durationInFrames || 40) * 0.35)} durationInFrames={Math.floor((hook?.durationInFrames || 40) * 0.5)}>
          {tail}
        </UnderlineDraw>
        .
      </div>

      {/* One beat visible at a time, in its own audio-timed sequence */}
      {beats.map((line) => {
        const i = lines.indexOf(line)
        return (
          <Sequence key={i} from={lineStart(lines, i)} durationInFrames={line.durationInFrames} layout="none">
            <div style={{ position: 'absolute', top: 940, left: 100, right: 100 }}>
              <Beat text={line.text} isCta={line.kind === 'cta'} />
            </div>
          </Sequence>
        )
      })}

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
          alignItems: 'center',
          fontFamily: FONT.mono,
          fontSize: T.scale1080.footer,
          color: T.color.text.muted,
        }}
      >
        <span>@sacredcosmos</span>
        <Ticks total={beats.length} done={beatsDone} />
      </div>
    </ReelFrame>
  )
}
