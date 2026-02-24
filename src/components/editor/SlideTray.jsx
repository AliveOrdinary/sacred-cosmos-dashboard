import { Card, CardContent } from '@/components/ui/card'
import { Copy, Trash2, Plus } from 'lucide-react'

export function SlideTray({ slides, activeSlideIndex, switchSlide, addNewSlide, duplicateSlide, deleteSlide }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4 overflow-x-auto">
      {slides.map((slide, idx) => (
        <div
          key={idx}
          onClick={() => switchSlide(idx)}
          className={`group relative flex-shrink-0 w-24 h-24 rounded-md border-2 cursor-pointer transition-all flex items-center justify-center bg-slate-950
            ${activeSlideIndex === idx ? 'border-purple-500 scale-105 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'border-slate-700 hover:border-slate-500'}
          `}
        >
          <span className={`text-xl font-bold ${activeSlideIndex === idx ? 'text-purple-400' : 'text-slate-600'}`}>
            {idx + 1}
          </span>

          {/* Duplicate Slide */}
          <button
            onClick={(e) => duplicateSlide(idx, e)}
            className="absolute -top-2 -left-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
          >
            <Copy size={12} />
          </button>

          {/* Delete Button (Only show on hover and if >1 slides) */}
          {slides.length > 1 && (
            <button
              onClick={(e) => deleteSlide(idx, e)}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      ))}

      <button
        onClick={addNewSlide}
        className="flex-shrink-0 w-24 h-24 rounded-md border-2 border-dashed border-slate-700 hover:border-slate-500 hover:bg-slate-800 cursor-pointer transition-all flex flex-col items-center justify-center text-slate-500"
      >
        <Plus size={24} className="mb-1" />
        <span className="text-xs font-medium">Add Slide</span>
      </button>
    </div>
  )
}
