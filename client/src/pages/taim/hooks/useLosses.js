import { useEffect, useState } from 'react'
import { api } from '@/pages/taim/api/client'

/**
 * Every dish that came back in a year (GET /api/taim/losses), from 1 Jan to
 * 1 Jan in this device's time zone. The screen groups it by month.
 * @param {number} year
 */
export function useLosses(year) {
    const [data, setData] = useState(null) // null = loading; { total, count, remakes, byReason, byDish, returns }
    const [error, setError] = useState('')
    const [attempt, setAttempt] = useState(0)

    useEffect(() => {
        let cancelled = false
        const from = new Date(year, 0, 1).toISOString()
        const to = new Date(year + 1, 0, 1).toISOString()
        api(`/losses?from=${from}&to=${to}`)
            .then((result) => { if (!cancelled) { setData(result); setError('') } })
            .catch((err) => { if (!cancelled) setError(err.message) })
        return () => { cancelled = true }
    }, [year, attempt])

    return { data, error, reload: () => setAttempt((n) => n + 1) }
}

/** Returns → { total, count, remakes, byReason, byDish }, biggest loss first (like the API, for a month) */
export function summarize(returns) {
    const group = (keyOf) => {
        const groups = new Map()
        for (const row of returns) {
            const g = groups.get(keyOf(row)) ?? { count: 0, value: 0 }
            g.count += 1
            g.value += row.value
            groups.set(keyOf(row), g)
        }
        return [...groups].map(([key, g]) => ({ key, ...g })).sort((a, b) => b.value - a.value || b.count - a.count)
    }
    return {
        total: returns.reduce((sum, row) => sum + row.value, 0),
        count: returns.length,
        remakes: returns.filter((row) => row.remakePrice !== null).length,
        byReason: group((row) => row.reason),
        byDish: group((row) => row.name),
    }
}
