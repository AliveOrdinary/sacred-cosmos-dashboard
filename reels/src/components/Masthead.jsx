import React from 'react'
import { T, FONT } from '../theme'

export const Masthead = ({ left, right }) => (
  <div style={{ position: 'absolute', top: 120, left: 100, right: 100 }}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        fontFamily: FONT.mono,
        fontSize: T.scale1080.masthead,
        letterSpacing: '0.1em',
        color: T.color.text.muted,
      }}
    >
      <span>{left}</span>
      <span>{right}</span>
    </div>
    <div style={{ borderTop: `2px dashed ${T.color.ui.dashRule}`, marginTop: 28 }} />
  </div>
)
