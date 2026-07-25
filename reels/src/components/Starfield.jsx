import React, { useMemo } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { T, W, H, mulberry32 } from '../theme'

// Procedural, seeded starfield. Density + drift come from the day's Cosmic
// Seed so every render differs deterministically. Replaces AI footage.
export const Starfield = ({ seed = 1, density = 46 }) => {
  const frame = useCurrentFrame()
  const stars = useMemo(() => {
    const rnd = mulberry32(seed)
    return Array.from({ length: density }, () => ({
      x: rnd() * W,
      y: rnd() * (H + 120) - 60,
      r: 1.2 + rnd() * 1.8,
      o: 0.2 + rnd() * 0.35,
      tw: 0.5 + rnd() * 1.5, // twinkle speed
      ph: rnd() * Math.PI * 2,
    }))
  }, [seed, density])

  const drift = T.motion.starDrift
  const p = (frame % (drift.durationS * 30)) / (drift.durationS * 30)
  const dx = drift.translatePx[0] * p
  const dy = drift.translatePx[1] * p

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width={W} height={H} style={{ transform: `translate(${dx}px, ${dy}px)` }}>
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill={T.color.text.primary}
            opacity={s.o * (0.75 + 0.25 * Math.sin(frame * 0.05 * s.tw + s.ph))}
          />
        ))}
      </svg>
    </AbsoluteFill>
  )
}
