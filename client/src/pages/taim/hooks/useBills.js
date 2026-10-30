import { useCallback, useEffect, useState } from 'react'
import { api } from '@/pages/taim/api/client'

/**
 * Where a period starts, in the restaurant's (this device's) time zone:
 * this week (from Sunday), this month or this year. 'today' isn't a date:
 * it's everything since the last "Close the day", which the server knows.
 */
export function periodStart(period, now = new Date()) {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    if (period === 'week') start.setDate(start.getDate() - start.getDay())
    if (period === 'month') start.setDate(1)
    if (period === 'year') start.setMonth(0, 1)
    return start
}

/**
 * The bills of a period (GET /api/taim/bills) with their totals and the
 * days closed in it, and "Close the day" (POST /api/taim/days/close).
 * @param {'today'|'week'|'month'|'year'} period
 * @param {'ALL'|'OPEN'|'CLOSED'} status
 */
export function useBills(period, status) {
    const [data, setData] = useState(null) // null = loading; { since, totals, bills, more, days }
    const [error, setError] = useState('')
    const [attempt, setAttempt] = useState(0)

    const reload = useCallback(() => setAttempt((n) => n + 1), [])

    useEffect(() => {
        let cancelled = false
        const range = period === 'today' ? 'period=today' : `from=${periodStart(period).toISOString()}`
        api(`/bills?${range}&status=${status}`)
            .then((result) => { if (!cancelled) { setData(result); setError('') } })
            .catch((err) => { if (!cancelled) setError(err.message) })
        return () => { cancelled = true }
    }, [period, status, attempt])

    /** End of the day: returns the saved report; throws (e.g. bills still open) */
    const closeDay = useCallback(async () => {
        const day = await api('/days/close', { method: 'POST' })
        reload()
        return day
    }, [reload])

    return { data, error, reload, closeDay }
}
