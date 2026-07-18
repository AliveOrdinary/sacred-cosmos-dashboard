import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Type, ImagePlus, ChevronUp, ChevronDown, Copy, Trash2, Minus, Plus,
} from 'lucide-react'
import { SLIDE_THEME, BRAND_SWATCHES } from '@/lib/constants'

// Correction-only editor card — mirrors the mobile Tools panel.
// Slides arrive on-brand from the generators; this card fixes wording,
// size, color, and layering. The old full design toolkit (backgrounds,
// gradients, shapes, icons, fonts, B/I/U) was removed deliberately so
// edits can't drift off-brand.
export function EditorToolsCard({
  addText, bringForward, sendBackward, duplicateSelected, deleteSelected,
  updateActiveObjectProp, activeObject, open,
}) {
  const isText = activeObject && ['textbox', 'text', 'i-text', 'Textbox', 'IText'].includes(activeObject.type)

  const stepFont = (delta) => {
    const next = Math.max(12, Math.min(220, Math.round((activeObject.fontSize || 40) + delta)))
    updateActiveObjectProp('fontSize', next)
  }

  return (
    <Card className="bg-slate-900 border-slate-800 text-white shadow-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-emerald-400">Canvas Tools</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">

        {/* Add content */}
        <div className="flex gap-2">
          <button
            onClick={() => addText('New line', {
              fontFamily: SLIDE_THEME.bodyFont,
              fill: SLIDE_THEME.mist,
              fontSize: 34,
              textAlign: 'center',
            })}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-700 active:scale-95 transition-all"
          >
            <Type size={16} /> Add text
          </button>
          {open && (
            <button
              onClick={open}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-700 active:scale-95 transition-all"
            >
              <ImagePlus size={16} /> Add image
            </button>
          )}
        </div>

        {!activeObject && (
          <p className="text-xs text-slate-500 text-center leading-relaxed py-2">
            Click an object on the canvas to select it.
            <br />
            Double-click text to edit the wording.
          </p>
        )}

        {activeObject && (
          <div className="flex flex-col gap-4 pt-1 border-t border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 pt-3">
              {isText ? 'Text' : 'Selected object'}
            </span>

            {/* Font size stepper */}
            {isText && (
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-slate-500">Size</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => stepFont(-4)}
                    className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center hover:bg-slate-700 active:scale-95 transition-all"
                  >
                    <Minus size={17} />
                  </button>
                  <span className="w-10 text-center text-sm font-medium text-slate-200">
                    {Math.round(activeObject.fontSize || 40)}
                  </span>
                  <button
                    onClick={() => stepFont(4)}
                    className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center hover:bg-slate-700 active:scale-95 transition-all"
                  >
                    <Plus size={17} />
                  </button>
                </div>
              </div>
            )}

            {/* Brand palette */}
            {activeObject.type !== 'image' && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-slate-500">Color</span>
                <div className="flex gap-2 flex-wrap">
                  {BRAND_SWATCHES.map(color => (
                    <button
                      key={color}
                      onClick={() => updateActiveObjectProp('fill', color)}
                      className={`w-10 h-10 rounded-full border-2 active:scale-95 transition-transform ${
                        activeObject.fill === color ? 'border-white scale-105' : 'border-slate-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Opacity */}
            <div className="flex items-center gap-3 px-1">
              <span className="text-xs text-slate-500 w-14">Opacity</span>
              <input
                type="range" min={0.1} max={1} step={0.05}
                value={activeObject.opacity ?? 1}
                onChange={(e) => updateActiveObjectProp('opacity', parseFloat(e.target.value))}
                className="touch-slider flex-1 accent-purple-500 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer"
              />
              <span className="text-xs text-slate-400 w-10 text-right">
                {Math.round((activeObject.opacity ?? 1) * 100)}%
              </span>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-4 gap-2">
              <button onClick={bringForward} className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-slate-800/80 text-slate-400 hover:bg-slate-700 active:scale-95 transition-all">
                <ChevronUp size={16} /><span className="text-[9px]">Fwd</span>
              </button>
              <button onClick={sendBackward} className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-slate-800/80 text-slate-400 hover:bg-slate-700 active:scale-95 transition-all">
                <ChevronDown size={16} /><span className="text-[9px]">Back</span>
              </button>
              <button onClick={duplicateSelected} className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-slate-800/80 text-slate-400 hover:bg-slate-700 active:scale-95 transition-all">
                <Copy size={14} /><span className="text-[9px]">Clone</span>
              </button>
              <button onClick={deleteSelected} className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white active:scale-95 transition-all">
                <Trash2 size={14} /><span className="text-[9px]">Delete</span>
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
