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
      const maxDisplay = Math.min(containerWidth, 600)
      const newScale = maxDisplay / canvasDimensions.width
      setScale(newScale)
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [canvasDimensions.width])

  const scaledWidth = canvasDimensions.width * scale
  const scaledHeight = canvasDimensions.height * scale

  return (
    <Card
      className={`bg-slate-900 border-slate-800 flex flex-col items-center justify-center p-2 lg:p-6 pb-2 lg:pb-6 shadow-2xl transition-all ${isDragActive ? 'border-purple-500 bg-purple-500/5' : ''}`}
      {...getRootProps()}
    >
      {isDragActive && (
        <div className="absolute inset-0 z-50 bg-purple-900/40 backdrop-blur-sm border-2 border-purple-500 border-dashed rounded-xl flex items-center justify-center">
          <h2 className="text-3xl font-bold text-white">Drop image to add to slide</h2>
        </div>
      )}

      <div className="w-full flex justify-between items-center mb-2 lg:mb-6">
        <h3 className="text-slate-400 font-medium uppercase tracking-widest text-sm">
          Design Canvas - Slide {activeSlideIndex + 1}
        </h3>
        <span className="text-xs font-mono text-slate-500 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
          {canvasDimensions.width} x {canvasDimensions.height}
        </span>
      </div>

      {/* Container that holds the scaled canvas */}
      <div
        ref={containerRef}
        className="w-full flex justify-center"
      >
        {/*
          This wrapper has the SCALED dimensions and uses transform: scale()
          to shrink the canvas. transform-origin: top left ensures the
          canvas stays positioned correctly.
        */}
        <div
          className="border border-slate-700 shadow-2xl rounded overflow-hidden"
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
