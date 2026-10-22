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

/** This month in the user's time zone, as 'YYYY-MM' */
export const currentMonth = () => today().slice(0, 7)

/** '2026-10' + n months → '2026-11' (n can be negative) */
export const addMonths = (month, n) => {
    const [y, m] = month.split('-').map(Number)
    const date = new Date(y, m - 1 + n, 1)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** '2026-10' → 'October 2026' (or 'Oct' with { short: true }) */
export const formatMonth = (month, { short = false } = {}) => {
    const [y, m] = month.split('-').map(Number)
    return new Date(y, m - 1, 1).toLocaleDateString('en-US', short ? { month: 'short' } : { month: 'long', year: 'numeric' })
}
