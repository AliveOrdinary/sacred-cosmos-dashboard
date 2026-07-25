import React from 'react'
import { interpolate, useCurrentFrame } from 'remotion'
import { T } from '../theme'

// Hand-drawn red underline that draws itself between startFrame and
// startFrame+durationInFrames. Wrap the phrase it belongs to.
export const UnderlineDraw = ({ children, startFrame = 0, durationInFrames = 20 }) => {
  const frame = useCurrentFrame()
  const progress = interpolate(frame, [startFrame, startFrame + durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const dash = 980
  return (
    <span style={{ position: 'relative', whiteSpace: 'nowrap' }}>
      {children}
      <svg
        viewBox="0 0 620 22"
        preserveAspectRatio="none"
        style={{ position: 'absolute', left: '-2%', bottom: -10, width: '104%', height: 26, overflow: 'visible' }}
      >
        <path
          d="M6 15 Q 155 4 310 14 T 614 11"
          stroke={T.color.ink.red}
          strokeWidth={6.5}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={dash}
          strokeDashoffset={dash * (1 - progress)}
        />
      </svg>
    </span>
  )
}
