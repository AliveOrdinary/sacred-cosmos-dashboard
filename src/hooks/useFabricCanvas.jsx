import { useState, useEffect, useRef, useCallback } from 'react'
import * as fabric from 'fabric'
import { useDropzone } from 'react-dropzone'
import { renderToStaticMarkup } from 'react-dom/server'

/**
 * Encapsulates the Fabric.js canvas instance and all canvas mutation commands.
 *
 * Fabric v7 changed the default origin to 'center'. We force every object we
 * create to use originX:'left' / originY:'top' so that `left` and `top`
 * properties always refer to the top-left corner, which makes positioning
 * arithmetic trivial and survives toJSON / loadFromJSON roundtrips.
 */
export function useFabricCanvas({ canvasRef, saveCurrentSlideData }) {
  const [revision, setRevision] = useState(0)
  const [editor, setEditor] = useState(null)
  const [activeObject, setActiveObject] = useState(null)
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1080, height: 1080 })

  const editorRef = useRef(null)
  const activeObjectRef = useRef(null)
  const dimensionsRef = useRef(canvasDimensions)

  useEffect(() => { editorRef.current = editor }, [editor])
  useEffect(() => { activeObjectRef.current = activeObject }, [activeObject])
  useEffect(() => { dimensionsRef.current = canvasDimensions }, [canvasDimensions])

  // Initialize the Fabric canvas once on mount
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 1080, height: 1080,
      backgroundColor: '#0B0914',
      preserveObjectStacking: true,
    })

    setEditor(canvas)
    window.editor = canvas
    window.fabric = fabric

    canvas.on('selection:created', (e) => setActiveObject(e.selected[0]))
    canvas.on('selection:updated', (e) => setActiveObject(e.selected[0]))
    canvas.on('selection:cleared', () => setActiveObject(null))
    canvas.on('object:modified', () => {
      setActiveObject(canvas.getActiveObject())
      setRevision(r => r + 1)
    })

    return () => { canvas.dispose(); setEditor(null) }
  }, [])

  useEffect(() => {
    if (editor) {
      editor.setDimensions({ width: canvasDimensions.width, height: canvasDimensions.height })
      editor.renderAll()
    }
  }, [canvasDimensions, editor])

  const save = useCallback(() => {
    if (editorRef.current) saveCurrentSlideData(editorRef.current)
  }, [saveCurrentSlideData])

  // --- EDITOR ACTION COMMANDS ---

  const addText = useCallback((presetText = 'Double click to edit', options = {}) => {
    const ed = editorRef.current
    if (!ed) return
    const dims = dimensionsRef.current

    // Scale padding and font proportionally to canvas height
    const heightScale = dims.height / 1080
    const PAD = Math.round(60 * heightScale)
    const safeW = dims.width - PAD * 2
    const safeH = dims.height - PAD * 2
    const textW = Math.min(options.width || safeW, safeW)
    let fontSize = options.fontSize || Math.round(36 * heightScale)
    const minFontSize = 12

    // Build base options, always force left/top origin
    const baseOptions = {
      fill: options.fill || '#FDFCF0',
      fontFamily: options.fontFamily || 'sans-serif',
      textAlign: options.textAlign || 'center',
      ...options,
      originX: 'left',
      originY: 'top',
      width: textW,
    }

    // Iteratively reduce font size until text fits within the safe area
    let textObj = null
    while (fontSize >= minFontSize) {
      if (textObj) ed.remove(textObj)
      textObj = new fabric.Textbox(presetText, { ...baseOptions, fontSize })
      ed.add(textObj)
      ed.renderAll()
      if (textObj.height <= safeH) break
      fontSize -= 2
    }

    // Position: center within canvas using top-left origin math
    const finalLeft = options.left !== undefined ? options.left : (dims.width - textW) / 2
    const finalTop = options.top !== undefined ? options.top : (dims.height - textObj.height) / 2
    textObj.set({ left: finalLeft, top: Math.max(PAD, finalTop) })

    ed.setActiveObject(textObj); ed.renderAll(); save()
  }, [save])

  const addRect = useCallback(() => {
    const ed = editorRef.current; if (!ed) return
    const rect = new fabric.Rect({ left: 100, top: 100, fill: '#a855f7', width: 200, height: 200, rx: 8, ry: 8, originX: 'left', originY: 'top' })
    ed.add(rect); ed.setActiveObject(rect); save()
  }, [save])

  const addCircle = useCallback(() => {
    const ed = editorRef.current; if (!ed) return
    const circle = new fabric.Circle({ left: 100, top: 100, fill: '#3b82f6', radius: 100, originX: 'left', originY: 'top' })
    ed.add(circle); ed.setActiveObject(circle); save()
  }, [save])

  const addTriangle = useCallback(() => {
    const ed = editorRef.current; if (!ed) return
    const triangle = new fabric.Triangle({ left: 100, top: 100, fill: '#10b981', width: 200, height: 200, originX: 'left', originY: 'top' })
    ed.add(triangle); ed.setActiveObject(triangle); save()
  }, [save])

  const bringForward = useCallback(() => {
    const ed = editorRef.current; const obj = activeObjectRef.current
    if (!ed || !obj) return
    ed.bringObjectForward(obj); ed.renderAll(); save()
  }, [save])

  const sendBackward = useCallback(() => {
    const ed = editorRef.current; const obj = activeObjectRef.current
    if (!ed || !obj) return
    ed.sendObjectBackwards(obj); ed.renderAll(); save()
  }, [save])

  const addIcon = useCallback(async (IconComponent) => {
    const ed = editorRef.current; if (!ed) return
    const svgString = renderToStaticMarkup(<IconComponent size={100} color="#fdfcf0" strokeWidth={2} />)
    const { objects, options } = await fabric.loadSVGFromString(svgString)
    const iconObj = fabric.util.groupSVGElements(objects, options)
    iconObj.set({ left: 100, top: 100, isIcon: true, originX: 'left', originY: 'top' })
    ed.add(iconObj); ed.setActiveObject(iconObj); save()
  }, [save])

  const updateBackgroundColor = useCallback((color) => {
    const ed = editorRef.current; if (!ed) return
    ed.backgroundColor = color; ed.backgroundImage = null; ed.renderAll()
    save(); setRevision(r => r + 1)
  }, [save])

  const updateGradientBackground = useCallback((colors) => {
    const ed = editorRef.current; if (!ed) return
    const dims = dimensionsRef.current
    const grad = new fabric.Gradient({
      type: 'linear',
      coords: { x1: 0, y1: 0, x2: 0, y2: dims.height },
      colorStops: [{ offset: 0, color: colors[0] }, { offset: 1, color: colors[1] }]
    })
    ed.backgroundColor = grad; ed.backgroundImage = null; ed.renderAll()
    save(); setRevision(r => r + 1)
  }, [save])

  const fillBackgroundWithImage = useCallback(() => {
    const ed = editorRef.current; const obj = activeObjectRef.current
    if (!ed || !obj || obj.type !== 'image') return
    const dims = dimensionsRef.current
    const scale = Math.max(dims.width / obj.width, dims.height / obj.height)
    obj.clone().then(cloned => {
      cloned.set({ scaleX: scale, scaleY: scale, originX: 'left', originY: 'top', left: 0, top: 0 })
      ed.backgroundImage = cloned; ed.remove(obj); ed.discardActiveObject(); ed.renderAll(); save()
    })
  }, [save])

  const deleteSelected = useCallback(() => {
    const ed = editorRef.current; const obj = activeObjectRef.current
    if (!ed || !obj) return
    ed.remove(obj); ed.discardActiveObject(); ed.renderAll()
    setActiveObject(null); save()
  }, [save])

  const duplicateSelected = useCallback(() => {
    const ed = editorRef.current; const obj = activeObjectRef.current
    if (!ed || !obj) return
    obj.clone().then((cloned) => {
      cloned.set({ left: obj.left + 20, top: obj.top + 20, evented: true })
      if (cloned.type === 'activeSelection') {
        cloned.canvas = ed
        cloned.forEachObject((o) => ed.add(o))
        cloned.setCoords()
      } else {
        ed.add(cloned)
      }
      ed.discardActiveObject(); ed.setActiveObject(cloned); ed.requestRenderAll(); save()
    })
  }, [save])

  const updateActiveObjectProp = useCallback((property, value) => {
    const ed = editorRef.current; const obj = activeObjectRef.current
    if (!ed || !obj) return
    if (property === 'fill' && obj.isIcon) {
      obj.set('stroke', value)
      if (obj.type === 'group') obj.getObjects().forEach(o => o.set('stroke', value))
    } else {
      obj.set(property, value)
    }
    ed.renderAll(); setRevision(r => r + 1); save()
  }, [save])

  const onDrop = useCallback(acceptedFiles => {
    const ed = editorRef.current
    if (!ed || acceptedFiles.length === 0) return
    const reader = new FileReader()
    reader.onload = (f) => {
      fabric.Image.fromURL(f.target.result).then((img) => {
        if (img.width > 1000) img.scaleToWidth(800)
        img.set({ left: 100, top: 100, originX: 'left', originY: 'top' })
        ed.add(img); ed.setActiveObject(img); ed.renderAll(); save()
      })
    }
    reader.readAsDataURL(acceptedFiles[0])
  }, [save])

  const dropzone = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    noClick: true
  })

  return {
    editor,
    activeObject,
    setActiveObject,
    canvasDimensions,
    setCanvasDimensions,
    revision,
    dropzone,
    addText, addRect, addCircle, addTriangle,
    bringForward, sendBackward, addIcon,
    updateBackgroundColor, updateGradientBackground, fillBackgroundWithImage,
    deleteSelected, duplicateSelected, updateActiveObjectProp,
  }
}
