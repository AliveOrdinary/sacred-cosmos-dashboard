import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ImageDown, RefreshCw, LogOut, Loader2, Sparkles, Wand2, Type, Image as ImageIcon } from 'lucide-react'
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
  const [mobileTab, setMobileTab] = useState('generate') // generate, edit, caption, ai

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
    <div className="min-h-screen bg-slate-950 flex flex-col p-4 pb-24 lg:p-8 lg:pb-8 gap-4 lg:gap-8">

      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md -mx-4 px-4 py-3 -mt-4 mb-2 lg:mx-0 lg:px-0 lg:py-0 lg:mt-0 lg:mb-0 lg:bg-transparent lg:backdrop-blur-none flex justify-between items-center w-full max-w-7xl mx-auto border-b border-slate-800 lg:border-none">
        <div>
          <h1 className="text-xl lg:text-3xl font-bold text-white tracking-tight">Cosmic Editor</h1>
          <p className="hidden md:block text-slate-400">Design dynamic posts fueled by your n8n automation</p>
        </div>
        <div className="flex gap-2 lg:gap-4 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadAllSlides}
            className="border-purple-600 text-purple-300 hover:bg-purple-900/40"
          >
            <ImageDown size={16} className="lg:mr-2" /> <span className="hidden lg:inline">Download All (Zip)</span>
          </Button>

          {/* Data is pulled automatically on load. Source toggle removed per user request for clean UI. */}

          <div className="flex items-center gap-2 ml-1 lg:ml-2 border-l border-slate-800 pl-2 lg:pl-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 w-full max-w-7xl mx-auto flex-1">

        {/* RIGHT COLUMN: Canvas + Slides (order-1 on mobile so it's always at the top) */}
        <div className="lg:col-span-8 flex flex-col gap-6 order-1 lg:order-2">
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

          <div className={mobileTab === 'caption' ? 'block' : 'hidden lg:block'}>
            <PostCaptionCard
              postCaption={data.postCaption}
              setPostCaption={data.setPostCaption}
              isCopied={data.isCopied}
              handleCopyCaption={data.handleCopyCaption}
              cosmicData={data.cosmicData}
            />
          </div>
        </div>

        {/* LEFT COLUMN: Tools + Data (order-2 on mobile, toggled by mobileTab) */}
        <div className="lg:col-span-4 flex flex-col gap-6 order-2 lg:order-1">
          <div className={mobileTab === 'edit' ? 'block' : 'hidden lg:block'}>
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
          </div>

          <div className={mobileTab === 'generate' ? 'block' : 'hidden lg:block'}>
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
          </div>

          <div className={mobileTab === 'ai' ? 'block' : 'hidden lg:block'}>
            <AiImageCard
              cosmicData={data.cosmicData}
              aiImage={aiImage}
              addImageToCanvas={null}
              fillBackgroundWithImage={canvas.fillBackgroundWithImage}
              editor={editor}
              slides={slides}
              setSlides={setSlides}
            />
          </div>
        </div>

      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 pb-safe">
        <div className="flex items-center justify-around p-2">
          <button 
            onClick={() => setMobileTab('generate')}
            className={`flex flex-col items-center justify-center w-full py-2 gap-1 rounded-xl transition-colors ${mobileTab === 'generate' ? 'text-amber-400 bg-amber-400/10' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Sparkles size={20} />
            <span className="text-[10px] font-medium">Generate</span>
          </button>
          
          <button 
            onClick={() => setMobileTab('edit')}
            className={`flex flex-col items-center justify-center w-full py-2 gap-1 rounded-xl transition-colors ${mobileTab === 'edit' ? 'text-indigo-400 bg-indigo-400/10' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Wand2 size={20} />
            <span className="text-[10px] font-medium">Tools</span>
          </button>

          <button 
            onClick={() => setMobileTab('caption')}
            className={`flex flex-col items-center justify-center w-full py-2 gap-1 rounded-xl transition-colors ${mobileTab === 'caption' ? 'text-pink-400 bg-pink-400/10' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Type size={20} />
            <span className="text-[10px] font-medium">Caption</span>
          </button>

          <button 
            onClick={() => setMobileTab('ai')}
            className={`flex flex-col items-center justify-center w-full py-2 gap-1 rounded-xl transition-colors ${mobileTab === 'ai' ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <ImageIcon size={20} />
            <span className="text-[10px] font-medium">AI Image</span>
          </button>
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