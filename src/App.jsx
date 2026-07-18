import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, LogOut, Loader2, Sparkles, Wand2, Send } from 'lucide-react'

import { useFabricCanvas } from "@/hooks/useFabricCanvas.jsx"
import { useSlides } from "@/hooks/useSlides"
import { useCosmicData } from "@/hooks/useCosmicData"
import { useAuth } from "@/hooks/useAuth"
import { usePublish } from "@/hooks/usePublish"

import { CanvasArea } from "@/components/editor/CanvasArea"
import { SlideTray } from "@/components/editor/SlideTray"
import { EditorToolsCard } from "@/components/editor/EditorToolsCard"
import { DataFeedCard } from "@/components/editor/DataFeedCard"
import { PostCaptionCard } from "@/components/editor/PostCaptionCard"
import { LoginPage } from "@/components/LoginPage"
import { MobileToolsPanel } from "@/components/editor/MobileToolsPanel"

function Dashboard({ user, signOut }) {
  const canvasRef = useRef(null)
  
  // mobileTab tracks which tool panel is active on mobile. Always visible (Lightroom-style).
  const [mobileTab, setMobileTab] = useState('generate')

  // Track breakpoint so we render <CanvasArea> in exactly ONE place (prevents ref collision)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024)
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)')
    const handler = (e) => setIsMobile(!e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

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

  // Publish to social (Supabase Storage → n8n webhook)
  const publishHook = usePublish()

  // Deep-link auto-generate: nudge links open /?generate=<type> and the right
  // generator runs as soon as cosmic data is loaded. Story types also flip the
  // publish toggle to Story so one tap less is needed.
  const autoGenRanRef = useRef(false)
  useEffect(() => {
    if (autoGenRanRef.current) return
    if (!data.cosmicData || data.cosmicData.length === 0) return
    const gen = new URLSearchParams(window.location.search).get('generate')
    if (!gen) return
    autoGenRanRef.current = true
    const run = {
      overview: () => data.handleGenerateDailyOverview(),
      manifestation: () => data.handleGenerateCarousel(),
      elements: () => data.handleGenerateElementPosts(),
      signs1: () => data.handleGenerateSignCarousel(1),
      signs2: () => data.handleGenerateSignCarousel(2),
      story: () => { publishHook.setPostType('story'); return data.handleGenerateStories() },
      practice: () => { publishHook.setPostType('story'); return data.handleGenerateSpiritualPractice() },
      weekly_overview: () => data.handleGenerateWeeklyOverview(),
      weekly_signs1: () => data.handleGenerateWeeklyCarousel(1),
      weekly_signs2: () => data.handleGenerateWeeklyCarousel(2),
      weekly_challenge: () => data.handleGenerateWeeklyChallenge(),
    }[gen]
    if (run) run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.cosmicData])

  // Publish shortcut: header button jumps to the publish surface
  const hasContent = slides.some(sl => (sl.objects?.length ?? 0) > 0)
  const goToPublish = () => {
    if (isMobile) {
      setMobileTab('publish')
    } else {
      document.getElementById('publish-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    // Mobile root: full viewport height (100dvh). Desktop: min-h-screen
    <div className="h-[100dvh] lg:min-h-screen lg:h-auto bg-slate-950 flex flex-col pt-0 lg:p-8 overflow-hidden lg:overflow-visible relative lg:static gap-0 lg:gap-8 hover:!border-none">

      {/* HEADER */}
      <div className="shrink-0 z-40 bg-slate-950/90 backdrop-blur-md px-3 py-2 lg:px-4 lg:py-3 lg:bg-transparent lg:backdrop-blur-none flex justify-between items-center w-full max-w-7xl mx-auto border-b border-slate-800 lg:border-none">
        <div>
          <h1 className="text-lg lg:text-3xl font-bold text-white tracking-tight">Cosmic Editor</h1>
          <p className="hidden md:block text-slate-400">Design dynamic posts fueled by your n8n automation</p>
        </div>
        <div className="flex gap-2 lg:gap-4 items-center">
          {hasContent && (
            <Button
              size="sm"
              onClick={goToPublish}
              className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20"
            >
              <Send size={15} className="lg:mr-2" /> <span className="hidden lg:inline">Publish</span>
            </Button>
          )}

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


      {/* ===================== DESKTOP LAYOUT ===================== */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-8 w-full max-w-7xl mx-auto flex-1 min-h-0 overflow-visible">

        {/* RIGHT: Canvas + Slides + Caption */}
        <div className="lg:col-span-8 flex flex-col gap-6 lg:order-2">
          {!isMobile && (
            <div className="flex-1 min-h-0 flex items-center justify-center relative">
              <CanvasArea
                canvasRef={canvasRef}
                canvasDimensions={canvasDimensions}
                activeSlideIndex={activeSlideIndex}
                isDragActive={isDragActive}
                getRootProps={getRootProps}
                getInputProps={getInputProps}
              />
            </div>
          )}
          <SlideTray
            slides={slides}
            activeSlideIndex={activeSlideIndex}
            switchSlide={(idx) => slideManager.switchSlide(editor, idx)}
            addNewSlide={() => slideManager.addNewSlide(editor)}
            duplicateSlide={(idx, e) => slideManager.duplicateSlide(editor, idx, e)}
            deleteSlide={(idx, e) => slideManager.deleteSlide(editor, idx, e)}
          />
          <div id="publish-card">
          <PostCaptionCard
            postCaption={data.postCaption}
            setPostCaption={data.setPostCaption}
            isCopied={data.isCopied}
            handleCopyCaption={data.handleCopyCaption}
            cosmicData={data.cosmicData}
            editor={editor}
            slides={slides}
            currentIndexRef={currentIndexRef}
            publish={publishHook.publish}
            isPublishing={publishHook.isPublishing}
            publishStatus={publishHook.publishStatus}
            publishMessage={publishHook.publishMessage}
            selectedPlatforms={publishHook.selectedPlatforms}
            togglePlatform={publishHook.togglePlatform}
            postType={publishHook.postType}
            setPostType={publishHook.setPostType}
            resetPublishStatus={publishHook.resetPublishStatus}
          />
          </div>
        </div>

        {/* LEFT: Tool cards */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:order-1">
          <EditorToolsCard
            addText={canvas.addText}
            bringForward={canvas.bringForward}
            sendBackward={canvas.sendBackward}
            duplicateSelected={canvas.duplicateSelected}
            deleteSelected={canvas.deleteSelected}
            updateActiveObjectProp={canvas.updateActiveObjectProp}
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

        </div>
      </div>

      {/* ===================== MOBILE LAYOUT ===================== */}
      {/* Lightroom-style: Canvas (above) → Slide tray → Tool content → Tab bar at bottom */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden lg:hidden">

        {/* CANVAS — fixed height, only rendered on mobile */}
        {isMobile && (
          <div className="shrink-0 h-[48vh] flex items-center justify-center px-1">
            <CanvasArea
              canvasRef={canvasRef}
              canvasDimensions={canvasDimensions}
              activeSlideIndex={activeSlideIndex}
              isDragActive={isDragActive}
              getRootProps={getRootProps}
              getInputProps={getInputProps}
            />
          </div>
        )}

        {/* SLIDE TRAY — compact, right below canvas */}
        <div className="shrink-0 px-2 py-1">
          <SlideTray
            slides={slides}
            activeSlideIndex={activeSlideIndex}
            switchSlide={(idx) => slideManager.switchSlide(editor, idx)}
            addNewSlide={() => slideManager.addNewSlide(editor)}
            duplicateSlide={(idx, e) => slideManager.duplicateSlide(editor, idx, e)}
            deleteSlide={(idx, e) => slideManager.deleteSlide(editor, idx, e)}
          />
        </div>

        {/* TOOL CONTENT — fills space between slide tray and tab bar */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
          <MobileToolsPanel
            activeTab={mobileTab}
            // Generate panel props
            cosmicData={data.cosmicData}
            addText={canvas.addText}
            handlers={{
              handleGenerateCarousel: data.handleGenerateCarousel,
              handleGenerateSignCarousel: data.handleGenerateSignCarousel,
              handleGenerateElementPosts: data.handleGenerateElementPosts,
              handleGenerateStories: data.handleGenerateStories,
              handleGenerateWeeklyCarousel: data.handleGenerateWeeklyCarousel,
              handleGenerateWeeklyOverview: data.handleGenerateWeeklyOverview,
              handleGenerateWeeklyChallenge: data.handleGenerateWeeklyChallenge,
              handleGenerateSpiritualPractice: data.handleGenerateSpiritualPractice,
              handleGenerateDailyOverview: data.handleGenerateDailyOverview,
            }}
            // Tools panel props
            canvasDimensions={canvasDimensions}
            setCanvasDimensions={setCanvasDimensions}
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
            // Caption panel props
            postCaption={data.postCaption}
            setPostCaption={data.setPostCaption}
            isCopied={data.isCopied}
            handleCopyCaption={data.handleCopyCaption}
            currentIndexRef={currentIndexRef}
            publish={publishHook.publish}
            isPublishing={publishHook.isPublishing}
            publishStatus={publishHook.publishStatus}
            publishMessage={publishHook.publishMessage}
            selectedPlatforms={publishHook.selectedPlatforms}
            togglePlatform={publishHook.togglePlatform}
            postType={publishHook.postType}
            setPostType={publishHook.setPostType}
            resetPublishStatus={publishHook.resetPublishStatus}
            isLoading={data.isLoading}
            slides={slides}
          />
        </div>

        {/* BOTTOM TAB BAR — pinned at the very bottom */}
        <div className="shrink-0 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 pb-safe">
          <div className="flex items-center justify-around px-1">
            {[
              { id: 'generate', icon: Sparkles, label: 'Generate', activeColor: 'text-amber-400' },
              { id: 'edit', icon: Wand2, label: 'Tools', activeColor: 'text-indigo-400' },
              { id: 'publish', icon: Send, label: 'Publish', activeColor: 'text-violet-400' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setMobileTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 px-4 transition-colors ${
                  mobileTab === tab.id ? tab.activeColor : 'text-slate-600'
                }`}
              >
                <tab.icon size={20} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
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