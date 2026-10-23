import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, UNAUTHORIZED_EVENT } from '@/pages/bank/api/client'

const AuthContext = createContext(null)

/**
 * Who is logged in to the bank tracker.
 * On load it asks GET /api/auth/me; the session itself is an httpOnly
 * cookie the browser sends automatically (JavaScript can't read it).
 * status: 'checking', 'ready', or 'unreachable' (the API isn't running –
 * retry() checks again).
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [status, setStatus] = useState('checking') // 'checking' | 'ready' | 'unreachable'
    const [attempt, setAttempt] = useState(0) // bump to check again

    // Ask who's logged in: 401 = not logged in; any other failure = the API
    // (or its database) isn't running
    useEffect(() => {
        let cancelled = false
        api('/auth/me')
            .then((data) => {
                if (cancelled) return
                setUser(data.user)
                setStatus('ready')
            })
            .catch((err) => {
                if (cancelled) return
                setUser(null)
                setStatus(err.status === 401 ? 'ready' : 'unreachable')
            })
        return () => { cancelled = true }
    }, [attempt])

    /** Try again after 'unreachable' */
    const retry = useCallback(() => {
        setStatus('checking')
        setAttempt((n) => n + 1)
    }, [])

    // Any request that comes back 401 (e.g. the session expired) → log out here too
    useEffect(() => {
        const handle = () => setUser(null)
        window.addEventListener(UNAUTHORIZED_EVENT, handle)
        return () => window.removeEventListener(UNAUTHORIZED_EVENT, handle)
    }, [])

    /** @param {'login'|'signup'} mode  @param {{ email: string, password: string }} credentials */
    const authenticate = useCallback(async (mode, credentials) => {
        const data = await api(`/auth/${mode}`, { method: 'POST', body: credentials })
        setUser(data.user)
    }, [])

    const logout = useCallback(async () => {
        try {
            await api('/auth/logout', { method: 'POST' })
        } finally {
            setUser(null) // even if the request failed, forget the user here
        }
    }, [])

    const value = useMemo(
        () => ({ user, status, retry, authenticate, logout }),
        [user, status, retry, authenticate, logout]
    )
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
    return context
}
