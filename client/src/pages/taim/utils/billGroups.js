// Bills screen: bills grouped by day (Week tab), week (Month tab) or month
// (Year tab), in this device's time zone, newest group first.

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

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
 * Bills (newest first) → groups, newest first, each with its bills and
 * numbers: how many, how many open, sales (what closed bills came to).
 * @param {object[]} bills
 * @param {'week'|'month'|'year'} period
 * @returns {{ key, label, bills: object[], count: number, open: number, sales: number }[]}
 */
export function groupBills(bills, period) {
    const groups = new Map()
    for (const bill of bills) {
        const { key, label } = GROUP_BY[period](new Date(bill.openedAt))
        if (!groups.has(key)) groups.set(key, { key, label, bills: [], count: 0, open: 0, sales: 0 })
        const group = groups.get(key)
        group.bills.push(bill)
        group.count += 1
        if (bill.status === 'OPEN') group.open += 1
        else group.sales += bill.total
    }
    return [...groups.values()]
}
