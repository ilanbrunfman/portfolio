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

    /** Add a dish; `seat` = the guest's seat number, or null for shared / take-out */
    const addDish = useCallback(async (menuItemId, seat = null, quantity = 1) => {
        setOrder(await api(`/orders/${orderId}/items`, { method: 'POST', body: { items: [{ menuItemId, quantity, seat }] } }))
    }, [orderId])

    /** The dish is for another seat (or null = shared) */
    const moveDish = useCallback(async (itemId, seat) => {
        setOrder(await api(`/orders/${orderId}/items/${itemId}`, { method: 'PATCH', body: { seat } }))
    }, [orderId])

    const removeDish = useCallback(async (itemId) => {
        setOrder(await api(`/orders/${orderId}/items/${itemId}`, { method: 'DELETE' }))
    }, [orderId])

    /**
     * Send dishes to the kitchen. itemIds: only those, and the other dishes
     * not sent yet go on hold; none = every dish not sent yet, held ones too
     * ("Fire").
     */
    const send = useCallback(async (itemIds) => {
        setOrder(await api(`/orders/${orderId}/send`, { method: 'POST', body: itemIds ? { itemIds } : {} }))
    }, [orderId])

    /** Put every dish not sent yet on hold, without sending anything */
    const hold = useCallback(async () => {
        setOrder(await api(`/orders/${orderId}/hold`, { method: 'POST', body: {} }))
    }, [orderId])

    const close = useCallback(async () => {
        setOrder(await api(`/orders/${orderId}/close`, { method: 'POST' }))
    }, [orderId])

    /** Fix a seating: { tableId?, guests? } */
    const update = useCallback(async (data) => {
        setOrder(await api(`/orders/${orderId}`, { method: 'PATCH', body: data }))
    }, [orderId])

    /** Undo a seating (only while it has no dishes); the order is gone afterwards */
    const undo = useCallback(async () => {
        await api(`/orders/${orderId}`, { method: 'DELETE' })
    }, [orderId])

    return { order, error, reload, addDish, moveDish, removeDish, send, hold, close, update, undo }
}
