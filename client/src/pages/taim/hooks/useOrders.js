import { useCallback, useEffect, useState } from 'react'
import { api } from '@/pages/taim/api/client'

const REFRESH_MS = 5_000

/**
 * The open orders (GET /api/taim/orders), oldest first. Other people open,
 * change and close orders while the screen is open, so it reloads every 5
 * seconds, like the Floor and the Kitchen.
 */
export function useOrders() {
    const [orders, setOrders] = useState(null) // null = loading
    const [error, setError] = useState('')
    const [attempt, setAttempt] = useState(0)
    const reload = useCallback(() => setAttempt((n) => n + 1), [])

    useEffect(() => {
        let cancelled = false
        api('/orders')
            .then((list) => { if (!cancelled) { setOrders(list); setError('') } })
            .catch((err) => { if (!cancelled) setError(err.message) })
        const timer = setTimeout(reload, REFRESH_MS)
        return () => { cancelled = true; clearTimeout(timer) }
    }, [attempt, reload])

    return { orders, error, reload }
}
