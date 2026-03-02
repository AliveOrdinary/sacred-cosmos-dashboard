import { Card } from '@/components/ui/card'
import { useRef, useEffect, useState } from 'react'

/**
 * Renders the canvas inside a container that scales it down to fit.
 *
 * CRITICAL: We must NOT apply CSS width/height to the <canvas> element.
 * Fabric.js manages its own canvas sizing internally (1080x1080 etc.).
 * Applying CSS width:'100%' stretches the bitmap and breaks the coordinate
 * system, causing objects to render at wrong positions.
 *
 * Instead, we use CSS transform: scale() on the wrapper div to visually
 * shrink the canvas while preserving its internal coordinate space.
 */
export function CanvasArea({ canvasRef, canvasDimensions, activeSlideIndex, isDragActive, getRootProps, getInputProps }) {
  const containerRef = useRef(null)
  const [scale, setScale] = useState(1)

  // Calculate the scale factor to fit the canvas inside the container
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return
      
      const containerWidth = containerRef.current.clientWidth
      // We also want to constrain by container height so the canvas doesn't bleed off screen vertically
      const containerHeight = containerRef.current.clientHeight
      
      const maxDisplayWidth = Math.min(containerWidth, 600)
      const scaleByWidth = maxDisplayWidth / canvasDimensions.width
      const scaleByHeight = containerHeight / canvasDimensions.height

      // Use whichever scale is smaller to ensure it always fits entirely in the container
      const newScale = Math.min(scaleByWidth, scaleByHeight)
      
      setScale(Math.max(0.1, newScale)) // Ensure scale doesn't go all the way to 0
    }

    updateScale()
    // Re-scale on window resize or when canvas dimension choices change (square vs story)
    window.addEventListener('resize', updateScale)
    
    // Slight delay to ensure flex layout has settled after sheet opens/closes
    const timeoutId = setTimeout(updateScale, 50) 
    
    return () => {
      window.removeEventListener('resize', updateScale)
      clearTimeout(timeoutId)
    }
  }, [canvasDimensions.width, canvasDimensions.height])

  const scaledWidth = canvasDimensions.width * scale
  const scaledHeight = canvasDimensions.height * scale

  return (
    <Card
      className={`bg-slate-950 lg:bg-slate-900 border-none lg:border-solid lg:border-slate-800 w-full h-full flex flex-col items-center justify-center p-0 lg:p-6 pb-0 lg:pb-6 shadow-none lg:shadow-2xl transition-all ${isDragActive ? 'border-purple-500 bg-purple-500/5' : ''}`}
      {...getRootProps()}
    >
      {isDragActive && (
        <div className="absolute inset-0 z-50 bg-purple-900/40 backdrop-blur-sm border-2 border-purple-500 border-dashed rounded-xl flex items-center justify-center">
          <h2 className="text-3xl font-bold text-white">Drop image to add to slide</h2>
        </div>
      )}

      {/* Hidden on mobile, visible on desktop */}
      <div className="hidden lg:flex w-full justify-between items-center mb-6">
        <h3 className="text-slate-400 font-medium uppercase tracking-widest text-sm">
          Design Canvas - Slide {activeSlideIndex + 1}
        </h3>
        <span className="text-xs font-mono text-slate-500 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
          {canvasDimensions.width} x {canvasDimensions.height}
        </span>
      </div>

      {/* Container that holds the scaled canvas - flex-1 ensures it pushes to take all space */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center relative min-h-0"
      >
        {/*
          This wrapper has the SCALED dimensions and uses transform: scale()
          to shrink the canvas. transform-origin: top left ensures the
          canvas stays positioned correctly.
        */}
        <div
          className="border border-slate-800 shadow-[0_0_20px_rgba(0,0,0,0.3)] rounded overflow-hidden"
          style={{
            width: scaledWidth,
            height: scaledHeight,
          }}
        >
          <div
            style={{
              width: canvasDimensions.width,
              height: canvasDimensions.height,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            <canvas ref={canvasRef} />
          </div>
        </div>
      </div>

      <input {...getInputProps()} className="hidden" />
    </Card>
  )
}
