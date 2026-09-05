import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Loads the most recent reel script from cosmic_data.
 *
 * Always reads the newest row rather than filtering on today's date: a manual
 * re-run after a failed 6am generation writes a fresh row, and newest-wins is
 * what every other part of this system already assumes.
 */
export function useReelScript() {
  const [state, setState] = useState({ loading: true, script: null, meta: null, error: null })

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }))
    try {
      const { data, error } = await supabase
        .from('cosmic_data')
        .select('payload, date, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
      if (error) throw error
      if (!data || !data.length) {
        setState({ loading: false, script: null, meta: null, error: 'No content rows found.' })
        return
      }
      const row = data[0]
      const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload
      const script = payload?.reel_scripts?.daily || null
      setState({
        loading: false,
        script,
        meta: {
          date: row.date,
          nakshatra: payload?.nakshatra_name,
          translation: payload?.nakshatra_translation,
          lens: payload?.nakshatra_lens,
          styleVariant: script?.style_variant || payload?.style_variant || null,
          failure: payload?.reel_failure || null,
        },
        error: script ? null : 'Newest row has no reel script — check the workflow.',
      })
    } catch (e) {
      setState({ loading: false, script: null, meta: null, error: e.message || String(e) })
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { ...state, reload: load }
}
