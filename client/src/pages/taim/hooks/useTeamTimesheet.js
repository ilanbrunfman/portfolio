import { useCallback, useEffect, useState } from 'react'
import { api } from '@/pages/taim/api/client'

/**
 * Everyone's hours in a period (step 8.2, Manager and Host):
 * GET /api/taim/timesheets/team – one row per person (worked, breaks, days,
 * forgot, on now) and the totals. `enabled: false` loads nothing.
 *
 * @param {{ from: Date, to: Date }} range
 * @param {boolean} enabled
 */
export function useTeamTimesheet(range, enabled) {
    const [data, setData] = useState(null)
    const [error, setError] = useState('')
    const [attempt, setAttempt] = useState(0)
    const reload = useCallback(() => setAttempt((n) => n + 1), [])
    const from = range.from.toISOString()
    const to = range.to.toISOString()

    useEffect(() => {
        if (!enabled) return
        let cancelled = false
        api(`/timesheets/team?${new URLSearchParams({ from, to })}`)
            .then((result) => { if (!cancelled) { setData(result); setError('') } })
            .catch((err) => { if (!cancelled) setError(err.message) })
        return () => { cancelled = true }
    }, [from, to, enabled, attempt])

    return { data, error, reload }
}
