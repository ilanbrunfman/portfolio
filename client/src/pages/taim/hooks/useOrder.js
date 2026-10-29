import { useCallback, useEffect, useState } from 'react'
import { api } from '@/pages/taim/api/client'

/**
 * One order (GET /api/taim/orders/:id) and the actions on it. Each action
 * returns the server's updated order, which replaces the local copy.
 * Actions throw on failure so the screen can say why.
 * @param {number} orderId
 */
export function useOrder(orderId) {
    const [order, setOrder] = useState(null) // null = still loading
    const [error, setError] = useState('')
    const [attempt, setAttempt] = useState(0)

    useEffect(() => {
        let cancelled = false
        api(`/orders/${orderId}`)
            .then((data) => { if (!cancelled) { setOrder(data); setError('') } })
            .catch((err) => { if (!cancelled) setError(err.message) })
        return () => { cancelled = true }
    }, [orderId, attempt])

    const reload = useCallback(() => setAttempt((n) => n + 1), [])

    const addDish = useCallback(async (menuItemId) => {
        setOrder(await api(`/orders/${orderId}/items`, { method: 'POST', body: { items: [{ menuItemId, quantity: 1 }] } }))
    }, [orderId])

    const removeDish = useCallback(async (itemId) => {
        setOrder(await api(`/orders/${orderId}/items/${itemId}`, { method: 'DELETE' }))
    }, [orderId])

    const close = useCallback(async () => {
        setOrder(await api(`/orders/${orderId}/close`, { method: 'POST' }))
    }, [orderId])

    return { order, error, reload, addDish, removeDish, close }
}
