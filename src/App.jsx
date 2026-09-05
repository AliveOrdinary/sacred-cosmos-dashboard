import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useReelScript } from "@/hooks/useReelScript"
import { useReelRender } from "@/hooks/useReelRender"
import { LoginPage } from "@/components/LoginPage"
import { ScriptCard } from "@/components/reel/ScriptCard"
import { RenderCard } from "@/components/reel/RenderCard"

// Daily review console.
//
// The job every morning is small and fixed: watch the render, read the script,
// copy the caption, get the file onto the phone. Trial Reels can't be posted
// through the Graph API, so posting is manual and there is no publish button
// here on purpose.

function Header({ meta, onSignOut }) {
  return (
    <header className="flex items-start justify-between gap-4 px-5 pt-6 pb-4">
      <div className="min-w-0">
        <h1 className="text-lg font-medium text-slate-100">Today's reel</h1>
        {meta && (
          <p className="mt-1 text-xs text-slate-500 truncate">
            {meta.date}
            {meta.nakshatra ? ` · ${meta.nakshatra} — ${meta.translation}` : ""}
            {meta.styleVariant ? ` · ${meta.styleVariant.replace("_", " ")}` : ""}
          </p>
        )}
      </div>
      <button
        onClick={onSignOut}
        className="shrink-0 text-xs text-slate-500 hover:text-slate-300 transition-colors"
      >
        Sign out
      </button>
    </header>
  )
}

function Dashboard({ signOut }) {
  const { loading, script, meta, error, reload } = useReelScript()
  const { job, requestRender } = useReelRender("daily")
  const [copied, setCopied] = useState(null)

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1600)
    } catch {
      setCopied("failed")
      setTimeout(() => setCopied(null), 1600)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-2xl pb-20">
        <Header meta={meta} onSignOut={signOut} />

        {loading && <p className="px-5 py-10 text-sm text-slate-500">Loading today's script…</p>}

        {!loading && error && (
          <div className="mx-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm text-amber-300">{error}</p>
            {meta?.failure && (
              <p className="mt-2 text-xs text-amber-200/70">
                {meta.failure.error_details} · stop_reason: {meta.failure.stop_reason}
              </p>
            )}
            <button
              onClick={reload}
              className="mt-3 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
            >
              Reload
            </button>
          </div>
        )}

        {!loading && script && (
          <div className="space-y-4 px-5">
            <RenderCard job={job} onRender={requestRender} />
            <ScriptCard script={script} lens={meta?.lens} copied={copied} onCopy={copy} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const { session, isLoading, signIn, signOut } = useAuth()
  if (isLoading) {
    return <div className="min-h-screen bg-slate-950" />
  }
  if (!session) {
    return <LoginPage signIn={signIn} />
  }
  return <Dashboard signOut={signOut} />
}
