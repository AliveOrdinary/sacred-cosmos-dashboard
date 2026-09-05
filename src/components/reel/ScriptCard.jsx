// The script as it will be heard and seen: `say` is what the voice reads,
// `show` is the on-screen type. They are deliberately different strings, so
// they're displayed together — that pairing is the thing worth reviewing.
function Beat({ index, say, show }) {
  return (
    <li className="flex gap-3 py-3 border-t border-slate-800/70 first:border-t-0">
      <span className="mt-0.5 w-5 shrink-0 text-right font-mono text-xs text-slate-600">
        {index}
      </span>
      <div className="min-w-0">
        <p className="text-[15px] leading-relaxed text-slate-200">{say}</p>
        <p className="mt-1.5 font-mono text-xs uppercase tracking-wide text-emerald-400/80">
          {show}
        </p>
      </div>
    </li>
  )
}

export function ScriptCard({ script, lens, copied, onCopy }) {
  const beats = Array.isArray(script.beats) ? script.beats : []
  const wordCount = [
    script.hook,
    ...beats.map((b) => b.say),
    script.payoff,
    script.share_cta,
  ]
    .join(' ')
    .trim()
    .split(/\s+/).length
  // ~150 wpm conversational TTS, plus a beat of breath between clips.
  const seconds = Math.round((wordCount / 150) * 60 + beats.length * 0.3)

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      {lens && <p className="mb-4 text-xs italic text-slate-500">{lens}</p>}

      <p className="text-xl font-medium leading-snug text-slate-100">{script.hook}</p>
      <p className="mt-2 font-mono text-xs uppercase tracking-wide text-emerald-400/80">
        {script.hook_show}
      </p>

      <ol className="mt-5">
        {beats.map((b, i) => (
          <Beat key={i} index={i + 1} say={b.say} show={b.show} />
        ))}
      </ol>

      <p className="mt-5 border-t border-slate-800 pt-4 text-lg leading-snug text-amber-300/90">
        {script.payoff}
      </p>
      <p className="mt-3 text-sm text-slate-400">{script.share_cta}</p>

      <p className="mt-5 text-xs text-slate-600">
        {wordCount} spoken words · roughly {seconds}s
        {seconds > 65 && <span className="text-amber-400/80"> — long, consider trimming a beat</span>}
      </p>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onCopy(script.caption, 'caption')}
          className="flex-1 rounded-xl bg-slate-800 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
        >
          {copied === 'caption' ? 'Copied' : 'Copy caption'}
        </button>
        <button
          onClick={() => onCopy(script.payoff, 'payoff')}
          className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
        >
          {copied === 'payoff' ? 'Copied' : 'Payoff'}
        </button>
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-300">
          Caption
        </summary>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-400">
          {script.caption}
        </p>
      </details>
    </section>
  )
}
