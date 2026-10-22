// Dates travel as 'YYYY-MM-DD' strings (calendar days, no time zone).

/** Today in the user's time zone, as 'YYYY-MM-DD' */
export const today = () => {
    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** '2026-10-20' → 'Tue, Oct 20' (adds the year when it isn't this year) */
export const formatDay = (day) => {
    const date = new Date(`${day}T00:00:00`) // local midnight, so the day never shifts
    const sameYear = date.getFullYear() === new Date().getFullYear()
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        ...(!sameYear && { year: 'numeric' }),
    })
}
