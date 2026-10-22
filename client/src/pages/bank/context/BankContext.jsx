import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '@/pages/bank/api/client'

const BankContext = createContext(null)

/**
 * Holds the bank data loaded from the API and the actions that change it.
 * Every action calls the server first and only updates local state with
 * what the server sends back, so the UI always matches the database.
 */
export const BankProvider = ({ children }) => {
    const [accounts, setAccounts] = useState([]) // includes archived ones
    const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
    const [error, setError] = useState(null)

    // Start a load; state is set only when the request finishes
    const loadAccounts = useCallback((isCancelled = () => false) => {
        api('/accounts?includeArchived=true')
            .then((data) => {
                if (isCancelled()) return
                setAccounts(data)
                setStatus('ready')
                setError(null)
            })
            .catch((err) => {
                if (isCancelled()) return
                setError(err.message)
                setStatus('error')
            })
    }, [])

    useEffect(() => {
        let cancelled = false // page closed before the request finished
        loadAccounts(() => cancelled)
        return () => { cancelled = true }
    }, [loadAccounts])

    /** Retry after an error */
    const reload = useCallback(() => {
        setStatus('loading')
        loadAccounts()
    }, [loadAccounts])

    /**
     * POST /api/accounts. Throws on failure (err.fields has per-field messages).
     * @param {{ name: string, type?: string, openingBalance?: number, color?: string }} data
     */
    const createAccount = useCallback(async (data) => {
        const created = await api('/accounts', { method: 'POST', body: data })
        setAccounts((prev) => [...prev, created])
        return created
    }, [])

    /**
     * PATCH /api/accounts/:id with any subset of fields (incl. archived).
     * @param {number} id
     * @param {object} changes
     */
    const updateAccount = useCallback(async (id, changes) => {
        const updated = await api(`/accounts/${id}`, { method: 'PATCH', body: changes })
        setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)))
        return updated
    }, [])

    const value = useMemo(
        () => ({ accounts, status, error, reload, createAccount, updateAccount }),
        [accounts, status, error, reload, createAccount, updateAccount]
    )

    return <BankContext.Provider value={value}>{children}</BankContext.Provider>
}

export const useBank = () => {
    const context = useContext(BankContext)
    if (!context) throw new Error('useBank must be used inside <BankProvider>')
    return context
}
