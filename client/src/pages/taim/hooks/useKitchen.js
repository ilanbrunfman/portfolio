import { useCallback, useEffect, useState } from 'react'
import { api } from '@/pages/taim/api/client'

const REFRESH_MS = 5_000

/**
 * The kitchen's list (GET /api/taim/kitchen): tickets to cook, oldest
 * first, and dishes served in the last few minutes. New orders arrive
 * while the screen is open, so it reloads itself every 5 seconds (polling;
 * live push with WebSockets could replace it later) and after each tap.
 */
export function useKitchen() {
    const [data, setData] = useState(null) // null = still loading; { tickets, recentlyServed }
    const [error, setError] = useState('')
    const [attempt, setAttempt] = useState(0)

    const reload = useCallback(() => setAttempt((n) => n + 1), [])

    useEffect(() => {
        let cancelled = false
        api('/kitchen')
            .then((result) => { if (!cancelled) { setData(result); setError('') } })
            .catch((err) => { if (!cancelled) setError(err.message) })
        const timer = setTimeout(reload, REFRESH_MS)
        return () => { cancelled = true; clearTimeout(timer) }
    }, [attempt, reload])

    /** Start a ticket: its dishes' prep times count from now */
    const start = useCallback(async (orderId, round) => {
        await api(`/orders/${orderId}/rounds/${round}/start`, { method: 'POST' })
        reload()
    }, [reload])

    /** The dish is out of the kitchen */
    const serve = useCallback(async (dishId) => {
        await api(`/order-items/${dishId}/serve`, { method: 'POST' })
        reload()
    }, [reload])

    /** Made wrong: the ruined plate counts as waste and the dish starts again */
    const redo = useCallback(async (dishId, note = null) => {
        await api(`/order-items/${dishId}/redo`, { method: 'POST', body: { note } })
        reload()
    }, [reload])

    /** Served by mistake: back to the kitchen */
    const unserve = useCallback(async (dishId) => {
        await api(`/order-items/${dishId}/unserve`, { method: 'POST' })
        reload()
    }, [reload])

    /** Chef / Manager: start a table's held dishes (refused until its earlier dishes were served a while ago) */
    const fire = useCallback(async (orderId) => {
        await api(`/orders/${orderId}/kitchen-fire`, { method: 'POST' })
        reload()
    }, [reload])

    return { data, error, reload, start, serve, unserve, redo, fire }
}
