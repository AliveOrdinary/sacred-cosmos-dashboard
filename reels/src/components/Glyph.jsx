import React from 'react'
import { GLYPHS } from '../brand/glyphPaths'

// Renders a brand glyph as crisp stroked SVG. `color` maps to currentColor
// because every glyph file uses stroke="currentColor".
export const Glyph = ({ name, size = 96, color = '#E8E2D5', style = {} }) => {
  const g = GLYPHS[name]
  if (!g) return null
  return (
    <svg
      viewBox={g.viewBox}
      width={size}
      height={size * 1.2}
      fill="none"
      stroke="currentColor"
      strokeWidth={7}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color, display: 'block', ...style }}
      dangerouslySetInnerHTML={{ __html: g.inner }}
    />
  )
}
