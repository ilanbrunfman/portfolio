import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, UNAUTHORIZED_EVENT } from '@/pages/bank/api/client'

const AuthContext = createContext(null)

/**
 * Who is logged in to the bank tracker.
 * On load it asks GET /api/auth/me; the session itself is an httpOnly
 * cookie the browser sends automatically (JavaScript can't read it).
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [status, setStatus] = useState('checking') // 'checking' | 'ready'

    useEffect(() => {
        let cancelled = false
        api('/auth/me')
            .then((data) => !cancelled && setUser(data.user))
            .catch(() => !cancelled && setUser(null))
            .finally(() => !cancelled && setStatus('ready'))
        return () => { cancelled = true }
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

    const value = useMemo(() => ({ user, status, authenticate, logout }), [user, status, authenticate, logout])
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
    return context
}
