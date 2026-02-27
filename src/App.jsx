import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { ImageDown, RefreshCw, LogOut, Loader2 } from 'lucide-react'
import JSZip from "jszip"
import { saveAs } from "file-saver"
import * as fabric from "fabric"

import { useFabricCanvas } from "@/hooks/useFabricCanvas.jsx"
import { useSlides } from "@/hooks/useSlides"
import { useCosmicData } from "@/hooks/useCosmicData"
import { useAuth } from "@/hooks/useAuth"

import { CanvasArea } from "@/components/editor/CanvasArea"
import { SlideTray } from "@/components/editor/SlideTray"
import { EditorToolsCard } from "@/components/editor/EditorToolsCard"
import { DataFeedCard } from "@/components/editor/DataFeedCard"
import { PostCaptionCard } from "@/components/editor/PostCaptionCard"
import { AiImageCard } from "@/components/editor/AiImageCard"
import { useAiImage } from "@/hooks/useAiImage"
import { LoginPage } from "@/components/LoginPage"

function Dashboard({ user, signOut }) {
  const canvasRef = useRef(null)

  // Slide state — editor is passed at call-time to break circular dependency
  const slideManager = useSlides()
  const { slides, activeSlideIndex, setSlides, setActiveSlideIndex, currentIndexRef } = slideManager

  // Canvas hook — saveCurrentSlideData bridges the two hooks
  const saveCurrentSlideData = (editor) => slideManager.saveCurrentSlideData(editor)

  const canvas = useFabricCanvas({ canvasRef, saveCurrentSlideData })
  const { editor, activeObject, canvasDimensions, setCanvasDimensions, dropzone } = canvas
  const { getRootProps, getInputProps, open, isDragActive } = dropzone

  // n8n data + carousel generation
  const data = useCosmicData({ editor, setSlides, setActiveSlideIndex, canvasDimensions, setCanvasDimensions })

  // AI image generation (Nano Banana)
  const aiImage = useAiImage()

  // --- EXPORT ---
  const downloadAllSlides = async () => {
    if (!editor) return
    try {
      const zip = new JSZip()
      const exportCanvas = new fabric.StaticCanvas(null, { width: 1080, height: 1080, backgroundColor: '#0B0914' })

      // Grab the very latest state of the active slide
      const currentSlides = [...slides]
      currentSlides[currentIndexRef.current] = editor.toJSON(['id'])

      for (let i = 0; i < currentSlides.length; i++) {
        await exportCanvas.loadFromJSON(currentSlides[i])
        exportCanvas.renderAll()
        const dataURL = exportCanvas.toDataURL({ format: 'png', quality: 1, multiplier: 1 })
        zip.file(`slide-${i + 1}.png`, dataURL.replace(/^data:image\/(png|jpg);base64,/, ""), { base64: true })
      }

      exportCanvas.dispose()
      saveAs(await zip.generateAsync({ type: "blob" }), "cosmic-carousel.zip")
    } catch (error) {
      console.error("Export failed:", error)
      alert("Failed to export slides!")
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col p-8 gap-8">

      {/* HEADER */}
      <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Cosmic Editor</h1>
          <p className="text-slate-400">Design dynamic posts fueled by your n8n automation</p>
        </div>
        <div className="flex gap-4 items-center">
          <Button
            variant="outline"
            onClick={downloadAllSlides}
            className="border-purple-600 text-purple-300 hover:bg-purple-900/40"
          >
            <ImageDown size={16} className="mr-2" /> Download All (Zip)
          </Button>

          {/* Data source toggle */}
          <div className="flex rounded-lg border border-slate-700 overflow-hidden">
            {[
              { key: 'supabase', label: '⚡ Live' },
              { key: 'sunday', label: 'Sunday' },
              { key: 'restdays', label: 'Rest Days' },
            ].map(src => (
              <button
                key={src.key}
                onClick={() => data.setDataSource(src.key)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  data.dataSource === src.key
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {src.label}
              </button>
            ))}
          </div>

          <Button
            onClick={data.handleGenerate}
            disabled={data.isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
          >
            <RefreshCw size={16} className={`mr-2 ${data.isLoading ? 'animate-spin' : ''}`} />
            {data.isLoading ? "Pulling..." : "Pull New Data"}
          </Button>

          <div className="flex items-center gap-2 ml-2 border-l border-slate-800 pl-4">
            <span className="text-xs text-slate-600 hidden sm:inline">{user?.email}</span>
            <button
              onClick={signOut}
              className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-7xl mx-auto flex-1">

        {/* LEFT COLUMN: Tools + Data (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <EditorToolsCard
            canvasDimensions={canvasDimensions}
            setCanvasDimensions={setCanvasDimensions}
            addText={canvas.addText}
            addRect={canvas.addRect}
            addCircle={canvas.addCircle}
            addTriangle={canvas.addTriangle}
            addIcon={canvas.addIcon}
            bringForward={canvas.bringForward}
            sendBackward={canvas.sendBackward}
            duplicateSelected={canvas.duplicateSelected}
            deleteSelected={canvas.deleteSelected}
            fillBackgroundWithImage={canvas.fillBackgroundWithImage}
            updateActiveObjectProp={canvas.updateActiveObjectProp}
            updateBackgroundColor={canvas.updateBackgroundColor}
            updateGradientBackground={canvas.updateGradientBackground}
            activeObject={activeObject}
            editor={editor}
            open={open}
            getInputProps={getInputProps}
          />

          <DataFeedCard
            cosmicData={data.cosmicData}
            addText={canvas.addText}
            handleGenerateCarousel={data.handleGenerateCarousel}
            handleGenerateSignCarousel={data.handleGenerateSignCarousel}
            handleGenerateElementPosts={data.handleGenerateElementPosts}
            handleGenerateStories={data.handleGenerateStories}
            handleGenerateWeeklyCarousel={data.handleGenerateWeeklyCarousel}
            handleGenerateWeeklyOverview={data.handleGenerateWeeklyOverview}
            handleGenerateWeeklyChallenge={data.handleGenerateWeeklyChallenge}
            handleGenerateSpiritualPractice={data.handleGenerateSpiritualPractice}
            handleGenerateDailyOverview={data.handleGenerateDailyOverview}
          />

          <AiImageCard
            cosmicData={data.cosmicData}
            aiImage={aiImage}
            addImageToCanvas={null}
            fillBackgroundWithImage={canvas.fillBackgroundWithImage}
            editor={editor}
          />
        </div>

        {/* RIGHT COLUMN: Canvas (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <CanvasArea
            canvasRef={canvasRef}
            canvasDimensions={canvasDimensions}
            activeSlideIndex={activeSlideIndex}
            isDragActive={isDragActive}
            getRootProps={getRootProps}
            getInputProps={getInputProps}
          />

          <SlideTray
            slides={slides}
            activeSlideIndex={activeSlideIndex}
            switchSlide={(idx) => slideManager.switchSlide(editor, idx)}
            addNewSlide={() => slideManager.addNewSlide(editor)}
            duplicateSlide={(idx, e) => slideManager.duplicateSlide(editor, idx, e)}
            deleteSlide={(idx, e) => slideManager.deleteSlide(editor, idx, e)}
          />

          <PostCaptionCard
            postCaption={data.postCaption}
            setPostCaption={data.setPostCaption}
            isCopied={data.isCopied}
            handleCopyCaption={data.handleCopyCaption}
            cosmicData={data.cosmicData}
          />
        </div>

      </div>
    </div>
  )
}

function App() {
  const { session, user, isLoading: authLoading, signIn, signOut } = useAuth()

  // --- AUTH GATE ---
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-violet-500" />
      </div>
    )
  }

  if (!session) {
    return <LoginPage signIn={signIn} />
  }

  return <Dashboard user={user} signOut={signOut} />
}

export default App