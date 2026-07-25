import React from 'react'
import { AbsoluteFill, Audio } from 'remotion'
import { T } from '../theme'
import { Starfield } from './Starfield'
import { Grain } from './Grain'
import { Masthead } from './Masthead'

export const ReelFrame = ({ seed, mastLeft, mastRight, ambientSrc, children }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(120% 90% at 50% 0%, ${T.color.ground.glowTop} 0%, ${T.color.ground.base} 62%, ${T.color.ground.vignette} 100%)`,
      color: T.color.text.primary,
    }}
  >
    <Starfield seed={seed} density={40 + (seed % 21)} />
    <Masthead left={mastLeft} right={mastRight} />
    {children}
    <Grain />
    {ambientSrc ? <Audio src={ambientSrc} volume={0.12} loop /> : null}
  </AbsoluteFill>
)
