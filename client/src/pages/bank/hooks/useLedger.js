import { useCallback, useEffect, useState } from 'react'
import { api } from '@/pages/bank/api/client'

const PAGE_SIZE = 50

/**
 * An account's transactions, newest first, loaded one page at a time.
 * Mount it with key={accountId} so switching accounts starts fresh.
 *
 * @param {number} accountId
 * @returns {{ items: object[], status: 'loading'|'ready'|'error', error: string|null,
 *            hasMore: boolean, loadingMore: boolean, loadMore: () => void, reload: () => void }}
 */
export function useLedger(accountId) {
    const [page, setPage] = useState({ items: [], nextCursor: null, status: 'loading', error: null })
    const [loadingMore, setLoadingMore] = useState(false)
    const [version, setVersion] = useState(0) // bump to re-fetch the first page

    const fetchPage = useCallback(
        (cursor) => api(`/accounts/${accountId}/transactions?limit=${PAGE_SIZE}${cursor ? `&cursor=${cursor}` : ''}`),
        [accountId]
    )

    // First page (and again on reload). Existing rows stay visible meanwhile.
    useEffect(() => {
        let cancelled = false
        fetchPage()
            .then((data) => !cancelled && setPage({ items: data.items, nextCursor: data.nextCursor, status: 'ready', error: null }))
            .catch((err) => !cancelled && setPage((prev) => ({ ...prev, status: 'error', error: err.message })))
        return () => { cancelled = true }
    }, [fetchPage, version])

    const reload = useCallback(() => setVersion((v) => v + 1), [])

    // Next (older) page, appended below
    const loadMore = useCallback(async () => {
        if (!page.nextCursor || loadingMore) return
        setLoadingMore(true)
        try {
            const data = await fetchPage(page.nextCursor)
            setPage((prev) => ({ ...prev, items: [...prev.items, ...data.items], nextCursor: data.nextCursor }))
        } catch (err) {
            setPage((prev) => ({ ...prev, error: err.message }))
        } finally {
            setLoadingMore(false)
        }
    }, [fetchPage, page.nextCursor, loadingMore])

    return {
        items: page.items,
        status: page.status,
        error: page.error,
        hasMore: Boolean(page.nextCursor),
        loadingMore,
        loadMore,
        reload,
    }
}
