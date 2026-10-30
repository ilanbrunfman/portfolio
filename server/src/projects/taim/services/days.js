import { prisma } from '../../../shared/db.js'
import { HttpError } from '../../../shared/lib/httpError.js'
import { TITLE_SELECT, billTotal, lossTotal, titleOf } from './orders.js'

// Business days: closing one (by hand or automatically) and when the
// automatic close is due.
//
// Settings (server/.env, optional):
//   TAIM_DAY_ENDS_AT  "04:00" – if nobody closed the day by then, the server does
//   TAIM_TIME_ZONE    "Asia/Jerusalem" – the restaurant's clock for that time

export const DAY_ENDS_AT = /^([01]\d|2[0-3]):[0-5]\d$/.test(process.env.TAIM_DAY_ENDS_AT ?? '') ? process.env.TAIM_DAY_ENDS_AT : '04:00'
export const TIME_ZONE = process.env.TAIM_TIME_ZONE || 'Asia/Jerusalem'

export const DAY_SELECT = {
    id: true,
    openedAt: true,
    closedAt: true,
    closedBy: { select: { id: true, name: true } }, // null = closed automatically
    billCount: true,
    tableBills: true,
    takeoutBills: true,
    guests: true,
    sales: true,
    cameBack: true,
    cameBackValue: true,
}

/** Bills (with type, status, guests, items) → the totals of a period */
export function totalsOf(bills) {
    const closed = bills.filter((bill) => bill.status === 'CLOSED')
    const sales = closed.reduce((sum, bill) => sum + billTotal(bill.items), 0)
    return {
        bills: bills.length,
        open: bills.length - closed.length,
        closed: closed.length,
        tableBills: bills.filter((bill) => bill.type === 'TABLE').length,
        takeoutBills: bills.filter((bill) => bill.type === 'TAKEOUT').length,
        guests: bills.reduce((sum, bill) => sum + (bill.guests ?? 0), 0),
        sales, // closed bills only: an open bill isn't paid yet
        averageBill: closed.length > 0 ? Math.round(sales / closed.length) : 0,
    }
}

/** How far `timeZone` is ahead of UTC at `date`, in ms (e.g. +3h in Israeli summer) */
function zoneOffset(date, timeZone) {
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
            .formatToParts(date)
            .map((part) => [part.type, Number(part.value)])
    )
    const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
    return asUtc - Math.floor(date.getTime() / 1000) * 1000
}

/**
 * The most recent "end of the day" before `now`: today's 04:00 in the
 * restaurant's time zone if it has passed, otherwise yesterday's.
 * @returns {Date}
 */
export function lastDayEnd(now = new Date(), at = DAY_ENDS_AT, timeZone = TIME_ZONE) {
    const [hour, minute] = at.split(':').map(Number)
    const local = new Date(now.getTime() + zoneOffset(now, timeZone)) // the restaurant's wall clock, read as UTC
    for (const daysBack of [0, 1]) {
        const wall = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - daysBack, hour, minute)
        // wall clock → instant; the offset is taken at that moment (summer / winter time)
        let instant = wall - zoneOffset(new Date(wall), timeZone)
        instant = wall - zoneOffset(new Date(instant), timeZone)
        if (instant <= now.getTime()) return new Date(instant)
    }
    throw new Error('unreachable')
}

/**
 * A time on the restaurant's wall clock → the instant. Month is 0–11; days
 * and hours past the end roll over like Date.UTC does.
 * zonedTime(2026, 9, 30, 4, 0) → 30 Oct 2026, 04:00 in Asia/Jerusalem (02:00 UTC)
 */
export function zonedTime(year, month, day, hour = 0, minute = 0, timeZone = TIME_ZONE) {
    const wall = Date.UTC(year, month, day, hour, minute)
    let instant = wall - zoneOffset(new Date(wall), timeZone)
    instant = wall - zoneOffset(new Date(instant), timeZone)
    return new Date(instant)
}

/** Today's date on the restaurant's clock: { year, month (0–11), day, weekday (0 = Sunday) } */
export function restaurantToday(now = new Date(), timeZone = TIME_ZONE) {
    const local = new Date(now.getTime() + zoneOffset(now, timeZone))
    return { year: local.getUTCFullYear(), month: local.getUTCMonth(), day: local.getUTCDate(), weekday: local.getUTCDay() }
}

/**
 * Close the business day: save its report and lock its bills.
 *   closedById  who tapped "Close the day"; null = closed automatically
 *   before      automatic close: only bills opened before this time (the
 *               set end of the day); the day ends then. Bills opened after it
 *               belong to the next day.
 * Throws 409 while bills are open (naming them) or when there's nothing to
 * close. One close at a time (advisory lock), so two taps make one day.
 */
export async function closeDay({ closedById = null, before } = {}) {
    return prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(7314001)`
        const opened = before ? { openedAt: { lt: before } } : {}

        const open = await tx.order.findMany({ where: { status: 'OPEN', ...opened }, select: TITLE_SELECT, orderBy: { openedAt: 'asc' } })
        if (open.length > 0) {
            const names = open.map(titleOf).join(', ')
            throw new HttpError(409, `${open.length} ${open.length === 1 ? 'bill is' : 'bills are'} still open: ${names}. Close ${open.length === 1 ? 'it' : 'them'} first.`, { open: open.length })
        }

        const last = await tx.businessDay.findFirst({ orderBy: { closedAt: 'desc' }, select: { closedAt: true } })
        const bills = await tx.order.findMany({
            where: { status: 'CLOSED', businessDayId: null, ...opened },
            select: { id: true, type: true, status: true, guests: true, openedAt: true, items: { select: { price: true, status: true, remakeOfId: true } } },
        })
        if (bills.length === 0 || (before && last && last.closedAt >= before)) {
            throw new HttpError(409, 'No bills since the last close: nothing to close')
        }

        const firstOpened = bills.reduce((min, bill) => (bill.openedAt < min ? bill.openedAt : min), bills[0].openedAt)
        const totals = totalsOf(bills)
        const allItems = bills.flatMap((bill) => bill.items)
        const cameBack = allItems.filter((item) => item.status === 'CAME_BACK')

        const day = await tx.businessDay.create({
            data: {
                openedAt: last?.closedAt ?? firstOpened,
                ...(before ? { closedAt: before } : {}),
                closedById,
                billCount: totals.bills,
                tableBills: totals.tableBills,
                takeoutBills: totals.takeoutBills,
                guests: totals.guests,
                sales: totals.sales,
                cameBack: cameBack.length,
                // what came back plus the free remakes made for it
                cameBackValue: lossTotal(allItems),
            },
            select: DAY_SELECT,
        })
        await tx.order.updateMany({ where: { id: { in: bills.map((bill) => bill.id) } }, data: { businessDayId: day.id } })
        return day
    })
}

/**
 * Is the automatic close due? It is when the set end of the day has passed
 * since the last close and bills opened before it aren't in a day yet.
 * `waiting` = how many of them are still open (they hold the close back).
 */
export async function autoCloseStatus(now = new Date()) {
    const dayEnd = lastDayEnd(now)
    const last = await prisma.businessDay.findFirst({ orderBy: { closedAt: 'desc' }, select: { closedAt: true } })
    const notClosed = last && last.closedAt >= dayEnd ? [] : await prisma.order.findMany({ where: { businessDayId: null, openedAt: { lt: dayEnd } }, select: { status: true } })
    return {
        at: DAY_ENDS_AT,
        timeZone: TIME_ZONE,
        dayEnd,
        due: notClosed.length > 0,
        waiting: notClosed.filter((order) => order.status === 'OPEN').length,
    }
}

/**
 * One check of the automatic close (the timer calls it every 15 minutes):
 *   'closed'  – closed the day at the set time; `day` is the report
 *   'waiting' – due, but `open` bills are still open; tries again next time
 *   'not-due' – closed already, or nothing to close
 */
export async function autoCloseDay(now = new Date()) {
    const status = await autoCloseStatus(now)
    if (!status.due) return { result: 'not-due' }
    try {
        return { result: 'closed', day: await closeDay({ before: status.dayEnd }) }
    } catch (err) {
        if (err instanceof HttpError && err.status === 409) {
            return err.open ? { result: 'waiting', open: err.open } : { result: 'not-due' }
        }
        throw err
    }
}
