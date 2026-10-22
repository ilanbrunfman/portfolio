import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '@/pages/bank/api/client'

const BankContext = createContext(null)

/**
 * Holds the bank data loaded from the API (accounts + categories) and the
 * actions that change it.
 * Every action calls the server first and only updates local state with
 * what the server sends back, so the UI always matches the database.
 */
export const BankProvider = ({ children }) => {
    const [accounts, setAccounts] = useState([]) // includes archived ones
    const [categories, setCategories] = useState([])
    const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
    const [error, setError] = useState(null)

    // Start a load; state is set only when the request finishes
    const loadAccounts = useCallback((isCancelled = () => false) => {
        // Both requests run at the same time
        Promise.all([api('/accounts?includeArchived=true'), api('/categories')])
            .then(([accountList, categoryList]) => {
                if (isCancelled()) return
                setAccounts(accountList)
                setCategories(categoryList)
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

    /**
     * Re-fetch one account (e.g. its balance after a transaction changed).
     * @param {number} id
     */
    const refreshAccount = useCallback(async (id) => {
        const fresh = await api(`/accounts/${id}`)
        setAccounts((prev) => prev.map((a) => (a.id === id ? fresh : a)))
    }, [])

    const value = useMemo(
        () => ({ accounts, categories, status, error, reload, createAccount, updateAccount, refreshAccount }),
        [accounts, categories, status, error, reload, createAccount, updateAccount, refreshAccount]
    )

    return <BankContext.Provider value={value}>{children}</BankContext.Provider>
}

export const useBank = () => {
    const context = useContext(BankContext)
    if (!context) throw new Error('useBank must be used inside <BankProvider>')
    return context
}
