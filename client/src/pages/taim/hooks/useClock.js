import { useCallback, useEffect, useState } from 'react'
import { api } from '@/pages/taim/api/client'

/**
 * Your time clock (step 8.2): GET /api/taim/clock – your open entry and
 * today's worked minutes, plus who's on now for the Manager and Host –
 * refreshed every 30 seconds, and the clock actions.
 *
 * @returns {{ data: object|null, error: string, reload, act: (step: 'in'|'out'|'break-start'|'break-end') => Promise }}
 */
export function useClock() {
    const [data, setData] = useState(null)
    const [error, setError] = useState('')
    const [attempt, setAttempt] = useState(0)
    const reload = useCallback(() => setAttempt((n) => n + 1), [])

    useEffect(() => {
        let cancelled = false
        let timer
        const load = () =>
            api('/clock')
                .then((result) => { if (!cancelled) { setData(result); setError('') } })
                .catch((err) => { if (!cancelled) setError(err.message) })
                .finally(() => { if (!cancelled) timer = setTimeout(load, 30_000) })
        load()
        return () => { cancelled = true; clearTimeout(timer) }
    }, [attempt])

    /** Clock in, out, start or end a break; throws with the reason. body: { at } to clock in from earlier */
    const act = useCallback(async (step, body) => {
        const mine = await api(`/clock/${step}`, { method: 'POST', ...(body && { body }) })
        setData((current) => ({ ...current, ...mine }))
        reload() // who's on now changed too
    }, [reload])

    return { data, error, reload, act }
}
