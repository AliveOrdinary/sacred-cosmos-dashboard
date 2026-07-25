import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clapperboard, Loader2, RefreshCw, Send, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

const COMPS = [
  { key: 'manifestation', label: 'Manifestation Reel', gradient: 'from-amber-500 to-orange-600' },
  { key: 'elements', label: 'Elements Reel', gradient: 'from-emerald-500 to-teal-600' },
]

function ReelRow({ comp, script, job, requestRender, setCaption, publishReel }) {
  // Instagram only by default: FB Reels needs publish_video on the Page token,
  // which the image-posting token does not carry. Toggle Facebook on once that
  // scope is granted.
  const [platforms, setPlatforms] = useState(['instagram'])
  const toggle = (p) =>
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))

  const rendering = job.status === 'rendering'
  const ready = job.status === 'done' && job.videoUrl

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-200 flex items-center gap-2">
          <Clapperboard size={15} className="text-slate-400" /> {comp.label}
        </span>
        <Button
          size="sm"
          disabled={!script || rendering}
          onClick={() => requestRender(comp.key)}
          className={`bg-gradient-to-r ${comp.gradient} text-white min-h-[40px] disabled:opacity-40`}
          title={!script ? 'No reel script in today’s payload — run Daily Workflow v8.5' : undefined}
        >
          {rendering ? (
            <>
              <Loader2 size={14} className="mr-2 animate-spin" /> Rendering…
            </>
          ) : ready ? (
            <>
              <RefreshCw size={14} className="mr-2" /> Re-render
            </>
          ) : (
            'Generate'
          )}
        </Button>
      </div>

      {/* Only complain about a missing script when there is also nothing to
          show. Previously this appeared above an existing render from an
          earlier day, which read as a contradiction. */}
      {!script && !ready && (
        <p className="text-xs text-slate-500">
          No script for today yet. It arrives with the 6 AM run.
        </p>
      )}
      {!script && ready && (
        <p className="text-xs text-amber-500/80">
          Showing an earlier render{job.date ? ` from ${job.date}` : ''}. Today's script isn't in the payload yet.
        </p>
      )}

      {job.status === 'error' && (
        <p className="text-xs text-red-400 flex items-start gap-1.5">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {job.error}
        </p>
      )}

      {ready && (
        <>
          {job.date && script && (
            <p className="text-[11px] text-slate-500">Rendered for {job.date}</p>
          )}
          <video
            key={job.videoUrl}
            src={job.videoUrl}
            controls
            playsInline
            className="w-full rounded-lg bg-black max-h-[70vh]"
          />
          <textarea
            value={job.caption}
            onChange={(e) => setCaption(comp.key, e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2 text-xs text-slate-300 focus:outline-none focus:border-slate-600"
            placeholder="Caption"
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1.5">
              {['instagram', 'facebook'].map((p) => (
                <button
                  key={p}
                  onClick={() => toggle(p)}
                  className={`px-2.5 py-1.5 rounded-full text-[11px] capitalize border transition-colors ${
                    platforms.includes(p)
                      ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              disabled={platforms.length === 0 || job.publishState === 'publishing' || job.publishState === 'published'}
              onClick={() => publishReel(comp.key, platforms)}
              className="bg-violet-600 hover:bg-violet-500 text-white min-h-[40px]"
            >
              {job.publishState === 'publishing' ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" /> Publishing…
                </>
              ) : job.publishState === 'published' ? (
                <>
                  <CheckCircle2 size={14} className="mr-2" /> Published
                </>
              ) : job.publishState === 'failed' ? (
                'Retry publish'
              ) : (
                <>
                  <Send size={14} className="mr-2" /> Publish
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Reels panel: one row per composition. Scripts come from the day's payload
 * (reel_scripts, added in Daily Workflow v8.5); renders run on the homelab
 * Remotion server; publishing reuses the n8n publisher with post_type 'reel'.
 */
export function ReelPanel({ cosmicData, reel, variant = 'stack' }) {
  const scripts = cosmicData?.[0]?.reel_scripts || {}
  const wide = variant === 'wide'
  const rows = COMPS.map((c) => (
    <ReelRow
      key={c.key}
      comp={c}
      script={scripts[c.key]}
      job={reel.jobs[c.key]}
      requestRender={reel.requestRender}
      setCaption={reel.setCaption}
      publishReel={reel.publishReel}
    />
  ))

  // 'wide' is the desktop Reels view: no card chrome, two columns, tall previews.
  if (wide) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clapperboard size={18} className="text-rose-400" /> Reels
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Rendered on the homelab. Scripts arrive with the 6 AM run; renders follow at 6:20.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 items-start">{rows}</div>
      </div>
    )
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Clapperboard size={16} className="text-rose-400" /> Reels
        </h3>
        {rows}
      </CardContent>
    </Card>
  )
}
