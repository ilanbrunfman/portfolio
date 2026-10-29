import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, UNAUTHORIZED_EVENT } from '@/pages/taim/api/client'

const StaffContext = createContext(null)

/**
 * Who is using Ta'im right now.
 * On load it asks GET /api/taim/session; the choice itself lives in an
 * httpOnly cookie the browser sends automatically.
 *
 * session: { staff: { id, name, role }, rights: string[], screens: string[] }
 *          or null when nobody is picked yet
 * status:  'checking', 'ready', or 'unreachable' (the API isn't running –
 *          retry() checks again)
 */
export const StaffProvider = ({ children }) => {
    const [session, setSession] = useState(null)
    const [status, setStatus] = useState('checking') // 'checking' | 'ready' | 'unreachable'
    const [attempt, setAttempt] = useState(0) // bump to check again

    // Who's picked? 401 = nobody yet; any other failure = the API (or its
    // database) isn't running
    useEffect(() => {
        let cancelled = false
        api('/session')
            .then((data) => {
                if (cancelled) return
                setSession(data)
                setStatus('ready')
            })
            .catch((err) => {
                if (cancelled) return
                setSession(null)
                setStatus(err.status === 401 ? 'ready' : 'unreachable')
            })
        return () => { cancelled = true }
    }, [attempt])

    /** Try again after 'unreachable' */
    const retry = useCallback(() => {
        setStatus('checking')
        setAttempt((n) => n + 1)
    }, [])

    // Any later request that comes back 401 → back to "Who are you?"
    useEffect(() => {
        const handle = () => setSession(null)
        window.addEventListener(UNAUTHORIZED_EVENT, handle)
        return () => window.removeEventListener(UNAUTHORIZED_EVENT, handle)
    }, [])

    /** Pick who you are */
    const pick = useCallback(async (staffId) => {
        setSession(await api('/session', { method: 'POST', body: { staffId } }))
    }, [])

    /** Switch person: forget who was picked */
    const switchPerson = useCallback(async () => {
        try {
            await api('/session', { method: 'DELETE' })
        } finally {
            setSession(null) // even if the request failed, forget it here
        }
    }, [])

    /** May the picked person do this? e.g. can('editMenu') – the server checks too */
    const can = useCallback((right) => Boolean(session?.rights.includes(right)), [session])

    const value = useMemo(
        () => ({ session, status, retry, pick, switchPerson, can }),
        [session, status, retry, pick, switchPerson, can]
    )
    return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>
}

export const useStaff = () => {
    const context = useContext(StaffContext)
    if (!context) throw new Error('useStaff must be used inside <StaffProvider>')
    return context
}
