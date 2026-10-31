// Bills screen: bills and closed days grouped by day (Week tab), week
// (Month tab) or month (Year tab), in this device's time zone, newest
// group first.

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** A closed day's `date` ("2026-10-30", its restaurant date) → that date, at midnight here */
export function dateOfDay(day) {
    const [year, month, date] = day.date.split('-').map(Number)
    return new Date(year, month - 1, date)
}

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
const shortDate = (date) => date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

/** Which group a bill falls in: a key, and the group's label */
const GROUP_BY = {
    // Week → its days: "Thu, Oct 29"
    week: (date) => {
        const day = startOfDay(date)
        return { key: day.getTime(), label: day.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) }
    },
    // Month → its weeks (Sunday to Saturday, cut to the month): "Oct 25 – 31"
    month: (date) => {
        const first = startOfDay(date)
        first.setDate(first.getDate() - first.getDay())
        const last = new Date(first)
        last.setDate(first.getDate() + 6)
        const from = first.getMonth() === date.getMonth() ? first : new Date(date.getFullYear(), date.getMonth(), 1)
        const to = last.getMonth() === date.getMonth() ? last : new Date(date.getFullYear(), date.getMonth() + 1, 0)
        return { key: first.getTime(), label: `${shortDate(from)} – ${shortDate(to)}` }
    },
    // Year → its months: "October"
    year: (date) => ({ key: date.getMonth(), label: MONTHS[date.getMonth()] }),
}

/**
 * Items (newest first) → groups, newest first: each { key, label, items }.
 * @param {object[]} items
 * @param {'week'|'month'|'year'} period  week → by day, month → by week, year → by month
 * @param {(item: object) => string|Date} dateOf  When the item happened.
 */
export function groupByPeriod(items, period, dateOf) {
    const groups = new Map()
    for (const item of items) {
        const { key, label } = GROUP_BY[period](new Date(dateOf(item)))
        if (!groups.has(key)) groups.set(key, { key, label, items: [] })
        groups.get(key).items.push(item)
    }
    return [...groups.values()]
}

/** Bills → groups, each with how many, how many open, sales (what closed bills came to) */
export const groupBills = (bills, period) =>
    groupByPeriod(bills, period, (bill) => bill.openedAt).map((group) => ({
        ...group,
        count: group.items.length,
        open: group.items.filter((bill) => bill.status === 'OPEN').length,
        sales: group.items.filter((bill) => bill.status !== 'OPEN').reduce((sum, bill) => sum + bill.total, 0),
    }))

/** Closed days → groups (by the date each belongs to), each with its sales and bills */
export const groupDays = (days, period) =>
    groupByPeriod(days, period, dateOfDay).map((group) => ({
        ...group,
        count: group.items.length,
        sales: group.items.reduce((sum, day) => sum + day.sales, 0),
        bills: group.items.reduce((sum, day) => sum + day.billCount, 0),
    }))
