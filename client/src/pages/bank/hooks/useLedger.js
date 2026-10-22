import { useCallback, useEffect, useState } from 'react'
import { api } from '@/pages/bank/api/client'
import { filtersToQuery } from '@/pages/bank/components/ledger-filters/filters'

const PAGE_SIZE = 50

/**
 * An account's transactions, newest first, loaded one page at a time.
 * Mount it with key={accountId} so switching accounts starts fresh.
 *
 * @param {number} accountId
 * @param {object} [filters]  { q, type, categoryId, from, to } – '' = not set
 * @returns {{ items: object[], totals: { count: number, moneyIn: number, moneyOut: number } | null,
 *            stale: boolean, status: 'loading'|'ready'|'error', error: string|null,
 *            hasMore: boolean, loadingMore: boolean, loadMore: () => void, reload: () => void }}
 */
export function useLedger(accountId, filters = {}) {
    // `query` = the filters this data was loaded for
    const [page, setPage] = useState({ items: [], nextCursor: null, totals: null, query: null, status: 'loading', error: null })
    const [loadingMore, setLoadingMore] = useState(false)
    const [version, setVersion] = useState(0) // bump to re-fetch the first page

    // A string, so the effect below only re-runs when a filter really changes
    const filterQuery = filtersToQuery(filters)

    const fetchPage = useCallback(
        (cursor) => {
            const params = new URLSearchParams(filterQuery)
            params.set('limit', PAGE_SIZE)
            if (cursor) params.set('cursor', cursor)
            return api(`/accounts/${accountId}/transactions?${params}`)
        },
        [accountId, filterQuery]
    )

    // First page (again on reload or when filters change). Existing rows stay visible meanwhile.
    useEffect(() => {
        let cancelled = false
        fetchPage()
            .then((data) => !cancelled && setPage({ items: data.items, nextCursor: data.nextCursor, totals: data.totals, query: filterQuery, status: 'ready', error: null }))
            .catch((err) => !cancelled && setPage((prev) => ({ ...prev, status: 'error', error: err.message })))
        return () => { cancelled = true }
    }, [fetchPage, filterQuery, version])

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
        totals: page.totals,
        // true while the shown rows belong to the previous filters
        stale: page.status === 'ready' && page.query !== filterQuery,
        status: page.status,
        error: page.error,
        hasMore: Boolean(page.nextCursor),
        loadingMore,
        loadMore,
        reload,
    }
}
