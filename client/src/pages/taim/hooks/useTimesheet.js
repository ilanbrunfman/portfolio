import { useCallback, useEffect, useState } from 'react'
import { api } from '@/pages/taim/api/client'

/**
 * A timesheet (step 8.2): GET /api/taim/timesheets for a person and a
 * period ({ from, to }), and fixing or adding entries (each with a reason;
 * logged). Actions reload the sheet and throw with err.fields on failure.
 *
 * @param {number|null} staffId  null = your own
 * @param {{ from: Date, to: Date }} range
 */
export function useTimesheet(staffId, range) {
    const [data, setData] = useState(null)
    const [error, setError] = useState('')
    const [attempt, setAttempt] = useState(0)
    const reload = useCallback(() => setAttempt((n) => n + 1), [])
    const from = range.from.toISOString()
    const to = range.to.toISOString()

    useEffect(() => {
        let cancelled = false
        const query = new URLSearchParams({ from, to, ...(staffId && { staffId: String(staffId) }) })
        api(`/timesheets?${query}`)
            .then((result) => { if (!cancelled) { setData(result); setError('') } })
            .catch((err) => { if (!cancelled) setError(err.message) })
        return () => { cancelled = true }
    }, [staffId, from, to, attempt])

    /** New times for an entry: { clockIn, clockOut, breaks, reason } */
    const edit = useCallback(async (id, body) => {
        await api(`/time-entries/${id}`, { method: 'PATCH', body })
        reload()
    }, [reload])

    /** An entry added by hand: { staffId?, clockIn, clockOut, breaks, reason } */
    const add = useCallback(async (body) => {
        await api('/time-entries', { method: 'POST', body })
        reload()
    }, [reload])

    /** Who changed an entry, why, before / after */
    const history = useCallback((id) => api(`/time-entries/${id}/edits`), [])

    return { data, error, reload, edit, add, history }
}
