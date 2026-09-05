// The video, and the one action that matters when it's wrong: re-render.
// Download is a plain anchor so iOS Safari hands the mp4 to the share sheet,
// which is how the file actually reaches the Instagram composer.
export function RenderCard({ job, onRender }) {
  const rendering = job.status === 'rendering'

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      {job.videoUrl ? (
        <video
          src={job.videoUrl}
          controls
          playsInline
          className="w-full bg-black aspect-[9/16] object-contain"
        />
      ) : (
        <div className="flex aspect-[9/16] max-h-[52vh] items-center justify-center bg-black/40">
          <p className="px-6 text-center text-sm text-slate-500">
            {rendering ? 'Rendering — this takes a few minutes.' : 'No render yet for today.'}
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 p-3">
        <button
          onClick={onRender}
          disabled={rendering}
          className="flex-1 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-800 transition-colors"
        >
          {rendering ? 'Rendering…' : job.videoUrl ? 'Re-render' : 'Render'}
        </button>
        {job.videoUrl && (
          <a
            href={job.videoUrl}
            download
            className="flex-1 rounded-xl bg-emerald-600/90 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
          >
            Download
          </a>
        )}
      </div>

      {job.error && (
        <p className="border-t border-slate-800 px-4 py-3 text-xs text-red-400">{job.error}</p>
      )}
    </section>
  )
}
