import { useEffect, useState } from 'react'

// Debounces raw input, and fires `onBeforeDebounce` right before the delayed
// value commits — used here to snapshot the grid's Flip state right before
// the filtered list changes, so the caller doesn't need its own effect.
export const useDebouncedSearch = (rawValue, delay = 250, onBeforeDebounce) => {
    const [debouncedValue, setDebouncedValue] = useState('')

    useEffect(() => {
        const id = setTimeout(() => {
            onBeforeDebounce?.()
            setDebouncedValue(rawValue.trim().toLowerCase())
        }, delay)

        return () => clearTimeout(id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rawValue, delay])

    return debouncedValue
}