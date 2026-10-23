import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, UNAUTHORIZED_EVENT } from '@/pages/bank/api/client'

const AuthContext = createContext(null)

// Waking a sleeping server: try every 5s for about a minute
const MAX_RETRIES = 12
const RETRY_DELAY = 5000

/**
 * Who is logged in to the bank tracker.
 * On load it asks GET /api/auth/me; the session itself is an httpOnly
 * cookie the browser sends automatically (JavaScript can't read it).
 * status: 'checking' (slow = taking a while, e.g. the server is waking up),
 * 'ready', or 'unreachable' (gave up – retry() tries again).
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [status, setStatus] = useState('checking') // 'checking' | 'ready' | 'unreachable'
    const [slow, setSlow] = useState(false) // checking for more than a few seconds
    const [attempt, setAttempt] = useState(0) // bump to check again

    // Ask who's logged in. On free hosting the API sleeps when idle and takes
    // up to a minute to wake, so "can't reach it" is retried for a while.
    useEffect(() => {
        let cancelled = false
        let timer
        const slowTimer = setTimeout(() => !cancelled && setSlow(true), 3000)

        const check = (triesLeft) => {
            api('/auth/me')
                .then((data) => {
                    if (cancelled) return
                    setUser(data.user)
                    setStatus('ready')
                })
                .catch((err) => {
                    if (cancelled) return
                    if (err.status === 401) {
                        setUser(null) // simply not logged in
                        setStatus('ready')
                    } else if (triesLeft > 0) {
                        timer = setTimeout(() => check(triesLeft - 1), RETRY_DELAY)
                    } else {
                        setStatus('unreachable')
                    }
                })
        }
        check(MAX_RETRIES)

        return () => {
            cancelled = true
            clearTimeout(timer)
            clearTimeout(slowTimer)
        }
    }, [attempt])

    /** Try again after 'unreachable' */
    const retry = useCallback(() => {
        setStatus('checking')
        setSlow(false)
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
        () => ({ user, status, slow, retry, authenticate, logout }),
        [user, status, slow, retry, authenticate, logout]
    )
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
    return context
}
