import { useEffect, useState } from 'react'

/**
 * The current time, updated every `intervalMs` – for "34 min" labels that
 * should keep counting while the screen is open.
 * @param {number} [intervalMs]
 */
export function useNow(intervalMs = 30_000) {
    const [now, setNow] = useState(() => Date.now())
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), intervalMs)
        return () => clearInterval(timer)
    }, [intervalMs])
    return now
}

/** Whole minutes from `date` to `now`, never below 0 */
export const minutesSince = (date, now) => Math.max(0, Math.floor((now - new Date(date).getTime()) / 60_000))
