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

    // Start a load; state is set only when the request finishes.
    // Returns the promise so callers can wait for fresh balances.
    const loadAccounts = useCallback((isCancelled = () => false) => {
        // Both requests run at the same time
        return Promise.all([api('/accounts?includeArchived=true'), api('/categories')])
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
     * POST /api/bank/accounts. Throws on failure (err.fields has per-field messages).
     * @param {{ name: string, type?: string, openingBalance?: number, color?: string }} data
     */
    const createAccount = useCallback(async (data) => {
        const created = await api('/accounts', { method: 'POST', body: data })
        setAccounts((prev) => [...prev, created])
        return created
    }, [])

    /**
     * PATCH /api/bank/accounts/:id with any subset of fields (incl. archived).
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

    /**
     * POST /api/bank/transactions, then refresh that account's balance.
     * @param {{ accountId: number, date: string, amount: number, description: string, categoryId?: number|null, note?: string|null }} data
     */
    const createTransaction = useCallback(async (data) => {
        const created = await api('/transactions', { method: 'POST', body: data })
        await refreshAccount(data.accountId)
        return created
    }, [refreshAccount])

    /**
     * PATCH /api/bank/transactions/:id, then refresh the account's balance.
     * @param {object} transaction  The existing transaction (needs id, accountId).
     * @param {object} changes
     */
    const updateTransaction = useCallback(async (transaction, changes) => {
        const updated = await api(`/transactions/${transaction.id}`, { method: 'PATCH', body: changes })
        await refreshAccount(transaction.accountId)
        return updated
    }, [refreshAccount])

    /**
     * DELETE /api/bank/transactions/:id. A transfer deletes both sides, so the
     * other account is refreshed too (simplest: reload all accounts).
     * @param {object} transaction
     */
    const deleteTransaction = useCallback(async (transaction) => {
        await api(`/transactions/${transaction.id}`, { method: 'DELETE' })
        if (transaction.transferId) await loadAccounts()
        else await refreshAccount(transaction.accountId)
    }, [refreshAccount, loadAccounts])

    /**
     * POST /api/bank/transfers, then refresh both accounts' balances.
     * @param {{ fromAccountId: number, toAccountId: number, amount: number, date: string, description?: string, note?: string|null }} data
     */
    const createTransfer = useCallback(async (data) => {
        const created = await api('/transfers', { method: 'POST', body: data })
        await Promise.all([refreshAccount(data.fromAccountId), refreshAccount(data.toAccountId)])
        return created
    }, [refreshAccount])

    /**
     * PATCH /api/bank/transfers/:transferId. Up to four accounts can be affected
     * (old and new from/to), so all accounts are reloaded.
     */
    const updateTransfer = useCallback(async (transferId, changes) => {
        const updated = await api(`/transfers/${transferId}`, { method: 'PATCH', body: changes })
        await loadAccounts()
        return updated
    }, [loadAccounts])

    /** DELETE /api/bank/transfers/:transferId (both sides) */
    const deleteTransfer = useCallback(async (transferId) => {
        await api(`/transfers/${transferId}`, { method: 'DELETE' })
        await loadAccounts()
    }, [loadAccounts])

    const value = useMemo(
        () => ({
            accounts, categories, status, error, reload,
            createAccount, updateAccount, refreshAccount,
            createTransaction, updateTransaction, deleteTransaction,
            createTransfer, updateTransfer, deleteTransfer,
        }),
        [
            accounts, categories, status, error, reload,
            createAccount, updateAccount, refreshAccount,
            createTransaction, updateTransaction, deleteTransaction,
            createTransfer, updateTransfer, deleteTransfer,
        ]
    )

    return <BankContext.Provider value={value}>{children}</BankContext.Provider>
}

export const useBank = () => {
    const context = useContext(BankContext)
    if (!context) throw new Error('useBank must be used inside <BankProvider>')
    return context
}
