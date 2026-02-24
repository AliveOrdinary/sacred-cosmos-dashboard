import { useState, useEffect, useRef } from 'react'
import { getEmptyCanvasJSON } from '@/lib/constants'

/**
 * Manages the multi-slide state: CRUD operations and localStorage persistence.
 *
 * NOTE: This hook does NOT take `editor` at init time to avoid a circular
 * dependency with useFabricCanvas. Instead, slide functions that need to
 * interact with the canvas accept `editor` as a call-time argument.
 */
export function useSlides() {
  const [slides, setSlides] = useState(() => {
    try {
      const saved = localStorage.getItem('cosmicSlides')
      return saved ? JSON.parse(saved) : [getEmptyCanvasJSON()]
    } catch { return [getEmptyCanvasJSON()] }
  })

  const [activeSlideIndex, setActiveSlideIndex] = useState(0)

  const currentIndexRef = useRef(activeSlideIndex)

  useEffect(() => {
    currentIndexRef.current = activeSlideIndex
  }, [activeSlideIndex])

  useEffect(() => {
    try {
      localStorage.setItem('cosmicSlides', JSON.stringify(slides))
    } catch (e) {
      console.warn('Could not save slides to localStorage (might be too large)', e)
    }
  }, [slides])

  const saveCurrentSlideData = (editor) => {
    if (!editor) return slides

    const currentJson = editor.toJSON(['id'])
    const newSlides = [...slides]
    newSlides[currentIndexRef.current] = currentJson

    setSlides(newSlides)
    return newSlides
  }

  const switchSlide = async (editor, index) => {
    if (!editor || index === activeSlideIndex) return

    const updatedSlides = saveCurrentSlideData(editor)
    setActiveSlideIndex(index)

    editor.clear()
    await editor.loadFromJSON(updatedSlides[index])
    editor.renderAll()
  }

  const addNewSlide = (editor) => {
    const updatedSlides = saveCurrentSlideData(editor)
    const newSlides = [...updatedSlides, getEmptyCanvasJSON()]
    setSlides(newSlides)

    const newIdx = newSlides.length - 1
    setActiveSlideIndex(newIdx)

    if (editor) {
      editor.clear()
      editor.backgroundColor = '#0B0914'
      editor.renderAll()
    }
  }

  const duplicateSlide = async (editor, index, e) => {
    e.stopPropagation()

    const updatedSlides = saveCurrentSlideData(editor)
    const duplicateData = JSON.parse(JSON.stringify(updatedSlides[index]))

    const newSlides = [...updatedSlides]
    newSlides.splice(index + 1, 0, duplicateData)
    setSlides(newSlides)

    setActiveSlideIndex(index + 1)

    if (editor) {
      editor.clear()
      await editor.loadFromJSON(duplicateData)
      editor.renderAll()
    }
  }

  const deleteSlide = async (editor, indexToDel, e) => {
    e.stopPropagation()
    if (slides.length <= 1) return

    const newSlides = [...slides]
    newSlides.splice(indexToDel, 1)
    setSlides(newSlides)

    if (activeSlideIndex === indexToDel) {
      const targetIdx = Math.max(0, indexToDel - 1)
      setActiveSlideIndex(targetIdx)
      if (editor) {
        editor.clear()
        await editor.loadFromJSON(newSlides[targetIdx])
        editor.renderAll()
      }
    } else if (activeSlideIndex > indexToDel) {
      setActiveSlideIndex(prev => prev - 1)
    }
  }

  return {
    slides,
    setSlides,
    activeSlideIndex,
    setActiveSlideIndex,
    currentIndexRef,
    saveCurrentSlideData,
    switchSlide,
    addNewSlide,
    duplicateSlide,
    deleteSlide,
  }
}
