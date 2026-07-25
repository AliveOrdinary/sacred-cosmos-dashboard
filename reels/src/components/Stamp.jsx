import React from 'react'
import { interpolate, useCurrentFrame } from 'remotion'
import { T } from '../theme'
import { Glyph } from './Glyph'

// Red rubber-stamp mark. Lands with a small press-in at its start frame.
export const Stamp = ({ glyph = 'mark-asterisk', size = 150, startFrame = 6 }) => {
  const frame = useCurrentFrame()
  const t = interpolate(frame, [startFrame, startFrame + 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const scale = 1.25 - 0.25 * t
  return (
    <div
      style={{
        position: 'absolute',
        top: 210,
        right: 96,
        width: size,
        height: size,
        border: `3.5px solid ${T.color.ink.red}`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `rotate(8deg) scale(${scale})`,
        opacity: 0.9 * t,
      }}
    >
      <Glyph name={glyph} size={size * 0.5} color={T.color.ink.red} />
    </div>
  )
}

export const Ticks = ({ total, done }) => (
  <span style={{ display: 'flex', gap: 14 }}>
    {Array.from({ length: total }, (_, i) => (
      <i
        key={i}
        style={{
          display: 'block',
          width: 52,
          height: 2.5,
          background: i < done ? T.color.ink.red : T.color.ui.tickOff,
        }}
      />
    ))}
  </span>
)
