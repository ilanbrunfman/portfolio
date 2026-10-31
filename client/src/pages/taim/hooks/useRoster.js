import { useCallback, useEffect, useState } from 'react'
import { api } from '@/pages/taim/api/client'

/**
 * The roster (step 8.1, Manager): GET /api/taim/roster plus the actions.
 * Each action waits for the server and then puts the saved person in the
 * list (or loads it again); actions throw on failure (err.fields per field).
 *
 * @returns {{ people: object[]|null, error: string, reload, add, update, setPin }}
 */
export function useRoster() {
    const [people, setPeople] = useState(null) // null = loading
    const [error, setError] = useState('')
    const [attempt, setAttempt] = useState(0)

    useEffect(() => {
        let cancelled = false
        api('/roster')
            .then((list) => { if (!cancelled) { setPeople(list); setError('') } })
            .catch((err) => { if (!cancelled) setError(err.message) })
        return () => { cancelled = true }
    }, [attempt])

    const reload = useCallback(() => setAttempt((n) => n + 1), [])

    /** A new person: { name, role, phone, hourlyRate, startDate, pin } */
    const add = useCallback(async (body) => {
        const person = await api('/roster', { method: 'POST', body })
        setPeople((list) => [...list, person])
        reload() // the server's order (role, then name)
    }, [reload])

    /** Change someone: { name?, role?, phone?, hourlyRate?, startDate?, active? } */
    const update = useCallback(async (id, body) => {
        const person = await api(`/roster/${id}`, { method: 'PATCH', body })
        setPeople((list) => list.map((p) => (p.id === id ? person : p)))
        if (body.active !== undefined) reload() // moves between working here and left
    }, [reload])

    /** Set or reset someone's PIN */
    const setPin = useCallback(async (id, pin) => {
        await api(`/roster/${id}/pin`, { method: 'PUT', body: { pin } })
        reload()
    }, [reload])

    return { people, error, reload, add, update, setPin }
}
