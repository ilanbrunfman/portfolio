// Step 8.2: the time clock – durations, and turning the popup's date and
// times (local) into instants for the API

const pad = (n) => String(n).padStart(2, '0')

/** 450 → "7 h 30 min" · 45 → "45 min" · 0 → "0 min" */
export function duration(minutes) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`
}

/** A Date → "2026-11-01" (local) for <input type="date"> */
export const dateInput = (date) => {
    const d = new Date(date)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** A Date → "17:05" (local) for <input type="time"> */
export const timeInput = (date) => {
    const d = new Date(date)
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * The popup's date and an "HH:MM" → an instant. A time earlier than
 * `after` is taken as the next day (a shift past midnight: in 17:00, out
 * 01:30); the same time stays the same day.
 */
export function atTime(date, time, after = null) {
    const instant = new Date(`${date}T${time}`)
    if (after && instant < after) instant.setDate(instant.getDate() + 1)
    return instant
}

/** "Sun, Nov 1" */
export const dayLabel = (date) => new Date(date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })

/** The timesheet periods: [from, to) in local time */
export function periodRange(period, now = new Date()) {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    if (period === 'month') return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date(now.getFullYear(), now.getMonth() + 1, 1) }
    start.setDate(start.getDate() - start.getDay()) // this week's Sunday
    if (period === 'last-week') {
        const from = new Date(start)
        from.setDate(from.getDate() - 7)
        return { from, to: start }
    }
    const to = new Date(start)
    to.setDate(to.getDate() + 7)
    return { from: start, to }
}
