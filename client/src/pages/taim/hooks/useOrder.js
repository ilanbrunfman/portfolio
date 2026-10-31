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

    /**
     * Add a dish for one or more seats, `quantity` each, in one request;
     * a seat is the guest's seat number, or null for shared / take-out.
     * toGo: the guests take it home (a table's bill only)
     * allergyConfirmed: added although it clashes with an allergy (step 5.4)
     */
    const addDish = useCallback(async (menuItemId, seats = [null], quantity = 1, toGo = false, allergyConfirmed = false) => {
        const items = (seats.length > 0 ? seats : [null]).map((seat) => ({ menuItemId, quantity, seat, toGo, allergyConfirmed }))
        setOrder(await api(`/orders/${orderId}/items`, { method: 'POST', body: { items } }))
    }, [orderId])

    /** A guest's allergy on the bill: { seat (null = whole table / take-out), allergens, note }; empty = remove */
    const noteAllergy = useCallback(async (body) => {
        setOrder(await api(`/orders/${orderId}/allergies`, { method: 'PUT', body }))
    }, [orderId])

    /** Change a dish on the bill: { seat?, toGo?, allergyConfirmed? } (another seat, null = shared; to go or not) */
    const updateDish = useCallback(async (itemId, changes) => {
        setOrder(await api(`/orders/${orderId}/items/${itemId}`, { method: 'PATCH', body: changes }))
    }, [orderId])

    /** Food lost without a guest giving it back: { reason: 'CANCELLED' | 'DROPPED', note, remake } */
    const waste = useCallback(async (itemId, data) => {
        setOrder(await api(`/orders/${orderId}/items/${itemId}/waste`, { method: 'POST', body: data }))
    }, [orderId])

    /** The guest gave a served dish back: { reason, note, remake, replaceWithId, sendNow } (the dish given instead is free) */
    const cameBack = useCallback(async (itemId, data) => {
        setOrder(await api(`/orders/${orderId}/items/${itemId}/came-back`, { method: 'POST', body: data }))
    }, [orderId])

    /** Came back marked by mistake: back on the bill (its unserved remake goes) */
    const undoCameBack = useCallback(async (itemId) => {
        setOrder(await api(`/orders/${orderId}/items/${itemId}/came-back`, { method: 'DELETE' }))
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

    return { order, error, reload, addDish, noteAllergy, updateDish, cameBack, undoCameBack, waste, removeDish, send, hold, close, update, undo }
}
