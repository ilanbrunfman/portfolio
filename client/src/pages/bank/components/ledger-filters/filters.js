// Ledger filter helpers (kept out of LedgerFilters.jsx so that file only
// exports a component).

export const FILTER_KEYS = ['q', 'type', 'categoryId', 'from', 'to']

/** No filters set ('' = not set) */
export const EMPTY_FILTERS = Object.fromEntries(FILTER_KEYS.map((key) => [key, '']))

/** URLSearchParams → filters object */
export const filtersFromParams = (params) =>
    Object.fromEntries(FILTER_KEYS.map((key) => [key, params.get(key) ?? '']))

/** filters object → 'q=pizza&type=expense' (only the ones that are set) */
export const filtersToQuery = (filters) =>
    new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString()

export const hasFilters = (filters) => Object.values(filters).some(Boolean)
