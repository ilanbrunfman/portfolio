import { useCallback, useEffect, useState } from 'react'
import { api } from '@/pages/taim/api/client'

const REFRESH_MS = 20_000

/**
 * The floor: tables (each with its open order's summary, or null) and the
 * open take-out orders. Several people use the floor at once, so it reloads
 * itself every 20 seconds, and after every change made here.
 */
export function useFloor() {
    const [tables, setTables] = useState(null) // null = still loading
    const [takeouts, setTakeouts] = useState([])
    const [error, setError] = useState('')
    const [attempt, setAttempt] = useState(0)

    const reload = useCallback(() => setAttempt((n) => n + 1), [])

    useEffect(() => {
        let cancelled = false
        Promise.all([api('/tables'), api('/orders')])
            .then(([tableList, orders]) => {
                if (cancelled) return
                setTables(tableList)
                setTakeouts(orders.filter((order) => order.type === 'TAKEOUT'))
                setError('')
            })
            .catch((err) => { if (!cancelled) setError(err.message) })
        const timer = setTimeout(reload, REFRESH_MS)
        return () => { cancelled = true; clearTimeout(timer) }
    }, [attempt, reload])

    /** Seat a table → the new order */
    const seatTable = useCallback(async (tableId, guests) => {
        const order = await api('/orders', { method: 'POST', body: { type: 'TABLE', tableId, guests } })
        reload()
        return order
    }, [reload])

    /** Start a take-out ({ customerName, customerPhone }) → the new order */
    const startTakeout = useCallback(async ({ customerName, customerPhone }) => {
        const order = await api('/orders', { method: 'POST', body: { type: 'TAKEOUT', customerName, customerPhone } })
        reload()
        return order
    }, [reload])

    const createTable = useCallback(async (data) => {
        await api('/tables', { method: 'POST', body: data })
        reload()
    }, [reload])

    const closeOrder = useCallback(async (orderId) => {
        await api(`/orders/${orderId}/close`, { method: 'POST' })
        reload()
    }, [reload])

    /** Guests left and the table is clean again */
    const cleanTable = useCallback(async (tableId) => {
        await api(`/tables/${tableId}/clean`, { method: 'POST' })
        reload()
    }, [reload])

    /** A "ready" table isn't clean enough: back to needing cleaning */
    const markNeedsCleaning = useCallback(async (tableId) => {
        await api(`/tables/${tableId}/needs-cleaning`, { method: 'POST' })
        reload()
    }, [reload])

    return { tables, takeouts, error, reload, seatTable, startTakeout, createTable, closeOrder, cleanTable, markNeedsCleaning }
}
