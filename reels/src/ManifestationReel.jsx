import React from 'react'
import { AbsoluteFill, Audio, Sequence, interpolate, useCurrentFrame } from 'remotion'
import { T, FONT, fitText, splitHook } from './theme'
import { ReelFrame } from './components/ReelFrame'
import { Stamp, Ticks } from './components/Stamp'
import { UnderlineDraw } from './components/UnderlineDraw'

// lines: [{ text, src, durationInFrames, kind: 'hook'|'beat'|'cta' }]
// Timing is AUDIO-DRIVEN: the server measures each TTS clip and passes
// durations as props. Visuals sync to the voice, never to a fixed grid.
//
// Layout is CONTENT-DRIVEN: the hook auto-sizes to its length, the tail phrase
// always sits on its own line so the underline can't collide with wrapped
// text, and the beat area flows below the hook instead of sitting at a fixed
// offset. The whole block is vertically centred.

const lineStart = (lines, i) => lines.slice(0, i).reduce((a, l) => a + l.durationInFrames, 0)
const HOOK_WIDTH = 880

const Beat = ({ text, isCta }) => {
  const frame = useCurrentFrame()
  const o = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' })
  const y = interpolate(frame, [0, 10], [T.motion.beatReveal.riseFromPx, 0], { extrapolateRight: 'clamp' })
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        fontFamily: FONT.body,
        fontWeight: 300,
        fontSize: T.scale1080.reelBeat,
        lineHeight: 1.58,
        color: T.color.text.dim,
        maxWidth: 800,
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
  const beatsDone = beats.filter((b) => frame >= lineStart(lines, lines.indexOf(b))).length

  // Split first: the tail is what constrains the type size, because it cannot
  // wrap without breaking the underline.
  const { head, tail } = splitHook(hook?.text)
  const hookSize = fitText(hook?.text, {
    maxWidth: HOOK_WIDTH,
    maxSize: 104,
    minSize: 58,
    maxLines: 3,
    singleLine: tail,
  })
  const hookFrames = hook?.durationInFrames || 40

  return (
    <ReelFrame seed={seed} mastLeft="DAILY MANIFESTATION" mastRight={dateLabel} ambientSrc={ambientSrc}>
      <Stamp glyph="mark-asterisk" startFrame={6} />

      <AbsoluteFill
        style={{
          padding: '300px 100px 240px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {/* Hook — persistent, auto-sized, tail always on its own line */}
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 300,
            fontSize: hookSize,
            lineHeight: 1.16,
            maxWidth: HOOK_WIDTH,
          }}
        >
          {head ? <span>{head} </span> : null}
          <span style={{ display: 'inline-block', marginTop: head ? 4 : 0 }}>
            <UnderlineDraw
              startFrame={Math.floor(hookFrames * 0.35)}
              durationInFrames={Math.floor(hookFrames * 0.5)}
            >
              {tail}
            </UnderlineDraw>
            .
          </span>
        </div>

        {/* Beat area flows below the hook; reserved height prevents jitter */}
        <div style={{ position: 'relative', minHeight: 260, marginTop: 96 }}>
          {beats.map((line) => {
            const i = lines.indexOf(line)
            return (
              <Sequence key={i} from={lineStart(lines, i)} durationInFrames={line.durationInFrames} layout="none">
                <Beat text={line.text} isCta={line.kind === 'cta'} />
              </Sequence>
            )
          })}
        </div>
      </AbsoluteFill>

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
