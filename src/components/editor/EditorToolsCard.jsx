import * as fabric from 'fabric'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Type, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, ChevronUp, ChevronDown, Square, Circle,
  Triangle, Sparkles, Smartphone, RectangleHorizontal, Copy, Trash2, Maximize
} from 'lucide-react'
import { ICON_LIBRARY, FONTS, COLORS, GRADIENTS } from '@/lib/constants'

export function EditorToolsCard({
  canvasDimensions, setCanvasDimensions,
  addText, addRect, addCircle, addTriangle, addIcon,
  bringForward, sendBackward, duplicateSelected, deleteSelected,
  fillBackgroundWithImage, updateActiveObjectProp,
  updateBackgroundColor, updateGradientBackground,
  activeObject, editor,
  open, getInputProps,
}) {
  return (
    <Card className="bg-slate-900 border-slate-800 text-white shadow-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-emerald-400">Canvas Tools</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">

        {/* Primary actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => addText()} className="flex gap-2 bg-slate-800 hover:bg-slate-700">
            <Type size={16} /> Add Text
          </Button>
          <Button onClick={open} variant="secondary" className="flex gap-2 bg-slate-800 hover:bg-slate-700 relative overflow-hidden">
            <ImageIcon size={16} /> Upload Image
            <input {...getInputProps()} className="absolute inset-0 opacity-0 cursor-pointer hidden" />
          </Button>
        </div>

        {/* Shapes */}
        <div className="grid grid-cols-3 gap-3 pb-4 border-b border-slate-800">
          <Button variant="secondary" onClick={addRect} className="flex gap-2 bg-slate-800 hover:bg-slate-700">
            <Square size={16} /> Rect
          </Button>
          <Button variant="secondary" onClick={addCircle} className="flex gap-2 bg-slate-800 hover:bg-slate-700">
            <Circle size={16} /> Circle
          </Button>
          <Button variant="secondary" onClick={addTriangle} className="flex gap-2 bg-slate-800 hover:bg-slate-700">
            <Triangle size={16} /> Tri
          </Button>
        </div>

        {/* Canvas Size Picker */}
        <div className="flex flex-col gap-2 pb-4 border-b border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Canvas Size</span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Square',   w: 1080, h: 1080, icon: <Square size={16} /> },
              { label: 'Portrait', w: 1080, h: 1350, icon: <RectangleHorizontal size={16} className="rotate-90" /> },
              { label: 'Story',    w: 1080, h: 1920, icon: <Smartphone size={16} /> },
            ].map(({ label, w, h, icon }) => {
              const active = canvasDimensions.width === w && canvasDimensions.height === h
              return (
                <Button
                  key={label}
                  variant={active ? 'default' : 'secondary'}
                  onClick={() => setCanvasDimensions({ width: w, height: h })}
                  className={`flex flex-col h-auto py-2 gap-1 text-xs ${active ? 'bg-purple-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}
                >
                  {icon} {label}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Icon Library */}
        <div className="pb-4 border-b border-slate-800">
          <span className="text-xs text-slate-500 uppercase tracking-wider block mb-2">Icon Library</span>
          <div className="flex gap-2 flex-wrap">
            {ICON_LIBRARY.map((asset) => (
              <Button
                key={asset.name}
                variant="ghost"
                onClick={() => addIcon(asset.icon)}
                className="p-2 h-10 w-10 border border-slate-700 hover:bg-slate-800 hover:border-slate-500 text-slate-400"
              >
                <asset.icon size={20} />
              </Button>
            ))}
          </div>
        </div>

        {/* Contextual Toolbar — Object Selected */}
        {activeObject ? (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {activeObject.type === 'image' ? 'Image Settings' : 'Object Styling'}
            </h4>

            {/* Text-only tools */}
            {(['textbox', 'text', 'i-text', 'Textbox', 'IText'].includes(activeObject.type)) && (
              <>
                {/* Font Family */}
                <div className="flex gap-2 flex-wrap">
                  {FONTS.map(font => (
                    <button
                      key={font}
                      onClick={() => updateActiveObjectProp('fontFamily', font)}
                      className={`text-xs px-2 py-1 rounded border ${activeObject.fontFamily === font ? 'border-purple-500 bg-purple-500/20 text-purple-300' : 'border-slate-700 hover:border-slate-500 text-slate-400'}`}
                      style={{ fontFamily: font }}
                    >
                      {font.split('-')[0]}
                    </button>
                  ))}
                </div>

                {/* Bold / Italic / Underline + Font Size */}
                <div className="flex items-center justify-between">
                  <div className="flex rounded-md border border-slate-700 overflow-hidden">
                    <button onClick={() => updateActiveObjectProp('fontWeight', activeObject.fontWeight === 'bold' ? 'normal' : 'bold')} className={`p-2 hover:bg-slate-800 ${activeObject.fontWeight === 'bold' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}><Bold size={16}/></button>
                    <button onClick={() => updateActiveObjectProp('fontStyle', activeObject.fontStyle === 'italic' ? 'normal' : 'italic')} className={`p-2 hover:bg-slate-800 border-x border-slate-700 ${activeObject.fontStyle === 'italic' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}><Italic size={16}/></button>
                    <button onClick={() => updateActiveObjectProp('underline', !activeObject.underline)} className={`p-2 hover:bg-slate-800 ${activeObject.underline ? 'bg-slate-800 text-white' : 'text-slate-500'}`}><Underline size={16}/></button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Size:</span>
                    <Input
                      type="number"
                      className="w-16 h-8 bg-slate-950 border-slate-700 text-white"
                      value={Math.round(activeObject.fontSize || 40)}
                      onChange={(e) => updateActiveObjectProp('fontSize', parseInt(e.target.value) || 40)}
                    />
                  </div>
                </div>

                {/* Alignment + Glow */}
                <div className="flex items-center justify-between">
                  <div className="flex rounded-md border border-slate-700 overflow-hidden">
                    <button onClick={() => updateActiveObjectProp('textAlign', 'left')} className={`p-2 hover:bg-slate-800 ${activeObject.textAlign === 'left' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}><AlignLeft size={16}/></button>
                    <button onClick={() => updateActiveObjectProp('textAlign', 'center')} className={`p-2 hover:bg-slate-800 border-x border-slate-700 ${activeObject.textAlign === 'center' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}><AlignCenter size={16}/></button>
                    <button onClick={() => updateActiveObjectProp('textAlign', 'right')} className={`p-2 hover:bg-slate-800 ${activeObject.textAlign === 'right' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}><AlignRight size={16}/></button>
                  </div>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => updateActiveObjectProp('shadow', activeObject.shadow ? null : new fabric.Shadow({ color: 'rgba(255,255,255,0.5)', blur: 10, offsetX: 0, offsetY: 0 }))}
                    className={`border-slate-700 h-8 ${activeObject.shadow ? 'bg-purple-600 text-white hover:bg-purple-700' : 'text-slate-300 hover:bg-slate-800'}`}
                  >
                    <Sparkles size={14} className="mr-2" /> Glow
                  </Button>
                </div>

                {/* Line Height & Char Spacing */}
                <div className="flex flex-col gap-3 mt-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-slate-500 w-20">Line Height</span>
                    <input type="range" min="0.5" max="2.5" step="0.1"
                      className="flex-1 accent-purple-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                      value={activeObject.lineHeight ?? 1.16}
                      onChange={(e) => updateActiveObjectProp('lineHeight', parseFloat(e.target.value))} />
                    <span className="text-xs text-slate-400 w-8 text-right">{Number(activeObject.lineHeight ?? 1.16).toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-slate-500 w-20">Spacing</span>
                    <input type="range" min="-100" max="500" step="10"
                      className="flex-1 accent-purple-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                      value={activeObject.charSpacing ?? 0}
                      onChange={(e) => updateActiveObjectProp('charSpacing', parseInt(e.target.value, 10))} />
                    <span className="text-xs text-slate-400 w-8 text-right">{activeObject.charSpacing ?? 0}</span>
                  </div>
                </div>
              </>
            )}

            {/* Color swatches — shapes + text only */}
            {activeObject.type !== 'image' && (
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => updateActiveObjectProp('fill', color)}
                    className={`w-6 h-6 rounded-full border-2 ${activeObject.fill === color ? 'border-white scale-110' : 'border-transparent hover:scale-110'} transition-transform shadow-sm`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}

            {/* Image-specific: Set as Background */}
            {activeObject.type === 'image' && (
              <div className="flex gap-2 mt-2 w-full">
                <Button variant="outline" size="sm" onClick={fillBackgroundWithImage} className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white flex gap-2">
                  <Maximize size={16} /> Set as Background
                </Button>
              </div>
            )}

            {/* Opacity slider */}
            <div className="flex items-center justify-between gap-4 mt-2">
              <span className="text-xs text-slate-500 w-16">Opacity</span>
              <input type="range" min="0.1" max="1" step="0.05"
                className="flex-1 accent-purple-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                value={activeObject.opacity ?? 1}
                onChange={(e) => updateActiveObjectProp('opacity', parseFloat(e.target.value))} />
              <span className="text-xs text-slate-400 w-8 text-right">{Math.round((activeObject.opacity ?? 1) * 100)}%</span>
            </div>
          </div>
        ) : (
          /* Background picker — nothing selected */
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 py-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Slide Background</h4>
            <div className="flex gap-2 flex-wrap">
              {['#0B0914', '#1e1b4b', '#312e81', '#4c1d95', '#701a75', '#831843', '#171717', '#ffffff'].map(color => (
                <button
                  key={color}
                  onClick={() => updateBackgroundColor(color)}
                  className={`w-8 h-8 rounded-full border-2 ${editor?.backgroundColor === color ? 'border-purple-500 scale-110' : 'border-slate-700 hover:scale-110 border-dashed'} transition-transform shadow-sm`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-xs text-slate-500 tracking-wider">Gradients</span>
            <div className="flex gap-2 flex-wrap pb-2 border-b border-slate-800">
              {GRADIENTS.map(grad => (
                <button
                  key={grad.name}
                  onClick={() => updateGradientBackground(grad.colors)}
                  className="w-12 h-8 rounded border-2 border-slate-700 hover:scale-105 transition-transform shadow-sm"
                  style={{ background: `linear-gradient(to bottom, ${grad.colors[0]}, ${grad.colors[1]})` }}
                  title={grad.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Layer controls + Delete */}
        {activeObject && (
          <div className="flex gap-2 mt-4 w-full animate-in fade-in slide-in-from-top-4">
            <Button variant="outline" size="sm" onClick={bringForward} className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white flex gap-2 px-0">
              <ChevronUp size={16} /> Fwd
            </Button>
            <Button variant="outline" size="sm" onClick={sendBackward} className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white flex gap-2 px-0">
              <ChevronDown size={16} /> Back
            </Button>
            <Button variant="outline" size="sm" onClick={duplicateSelected} className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white flex gap-2 px-0">
              <Copy size={14} /> Clone
            </Button>
            <Button variant="destructive" size="sm" onClick={deleteSelected} className="flex-none w-10 p-0 border-none bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center">
              <Trash2 size={16} />
            </Button>
          </div>
        )}

      </CardContent>
    </Card>
  )
}
