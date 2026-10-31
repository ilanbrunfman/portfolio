import { useCallback, useEffect, useState } from 'react'
import { api } from '@/pages/taim/api/client'

/**
 * Menu versions (GET /api/taim/menu/versions): every version, newest first,
 * with what changed and income numbers, plus the actions on the draft.
 * Each action reloads the list afterwards (a publish changes two versions
 * at once). Actions throw on failure (err.fields per field).
 *
 * @returns {{ data: { versions: object[], bestId: number|null, lastId: number|null }|null,
 *   error: string, reload, active, draft, startDraft, updateVersion, publish, unschedule, discard, useAgain, compare }}
 *   active = the version in use; draft = the DRAFT or SCHEDULED one (or null)
 */
export function useMenuVersions() {
    const [data, setData] = useState(null) // null = still loading
    const [error, setError] = useState('')
    const [attempt, setAttempt] = useState(0)

    useEffect(() => {
        let cancelled = false
        api('/menu/versions')
            .then((list) => { if (!cancelled) { setData(list); setError('') } })
            .catch((err) => { if (!cancelled) setError(err.message) })
        return () => { cancelled = true }
    }, [attempt])

    const reload = useCallback(() => setAttempt((n) => n + 1), [])

    // Each action: call the API, then load the list again
    const call = useCallback(async (path, options) => {
        const result = await api(path, options)
        reload()
        return result
    }, [reload])

    const startDraft = useCallback((body) => call('/menu/versions', { method: 'POST', body }), [call])
    const updateVersion = useCallback((id, body) => call(`/menu/versions/${id}`, { method: 'PATCH', body }), [call])
    /** Publish now (startsAt null) or from startsAt (a Date) */
    const publish = useCallback(
        (id, startsAt = null) => call(`/menu/versions/${id}/publish`, { method: 'POST', body: { startsAt: startsAt?.toISOString() ?? null } }),
        [call]
    )
    const unschedule = useCallback((id) => call(`/menu/versions/${id}/unschedule`, { method: 'POST' }), [call])
    const discard = useCallback((id) => call(`/menu/versions/${id}`, { method: 'DELETE' }), [call])
    /** An older menu becomes the menu in use again, from now */
    const useAgain = useCallback((id) => call(`/menu/versions/${id}/use`, { method: 'POST' }), [call])
    /** What changed from one version to another: [{ type, name, ... }] */
    const compare = useCallback(async (from, to) => (await api(`/menu/versions/compare?from=${from}&to=${to}`)).changes, [])

    const versions = data?.versions ?? []
    const active = versions.find((v) => v.status === 'ACTIVE') ?? null
    const draft = versions.find((v) => v.status === 'DRAFT' || v.status === 'SCHEDULED') ?? null

    return { data, error, reload, active, draft, startDraft, updateVersion, publish, unschedule, discard, useAgain, compare }
}
