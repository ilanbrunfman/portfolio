import { Router } from 'express'
import { prisma } from '../../../shared/db.js'
import { validate } from '../../../shared/middleware/validate.js'
import { HttpError } from '../../../shared/lib/httpError.js'
import { allow } from '../middleware/staff.js'
import { billsQuery } from '../schemas/bills.js'
import { TITLE_SELECT, billTotal, titleOf } from '../services/orders.js'

// Reviewing bills (reviewBills: Manager, Chef, Host) and closing the day
// (closeDay: Manager, Chef).
//
// A business day runs from the last close to the next one, so "today" is
// every bill not in a closed day yet – a night past midnight stays one day.
// Closing the day saves its report (BusinessDay) and ties its bills to it;
// from then on they're locked (closed bills can't change anyway, and step
// 6's "came back" will only accept bills not in a closed day).
const router = Router()

// The most bills one list returns; the totals always cover all of them
const LIST_LIMIT = 300

const BILL_SELECT = {
    id: true,
    ...TITLE_SELECT,
    status: true,
    guests: true,
    openedAt: true,
    closedAt: true,
    businessDayId: true,
    openedBy: { select: { id: true, name: true } },
    items: { select: { price: true, status: true } },
}

const DAY_SELECT = {
    id: true,
    openedAt: true,
    closedAt: true,
    closedBy: { select: { id: true, name: true } },
    billCount: true,
    tableBills: true,
    takeoutBills: true,
    guests: true,
    sales: true,
    cameBack: true,
    cameBackValue: true,
}

/** Bills (with items) → the totals of a period */
function totalsOf(bills) {
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

/** A bill row for the list */
const toBillJson = ({ items, table, customerName, ...bill }) => ({
    ...bill,
    title: titleOf({ ...bill, table, customerName }),
    dishCount: items.length,
    total: billTotal(items),
})

// GET /api/taim/bills?period=today | ?from=<ISO>  [&status=ALL|OPEN|CLOSED]
//   since:  where the period starts (today: the last close, or null if the
//           day was never closed)
//   totals: bills, open, closed, tables / take-outs, guests, sales, average bill
//   bills:  newest first, at most 300 (`more` = how many weren't listed)
//   days:   the days closed in the period, newest first (their saved reports)
router.get('/bills', allow('reviewBills'), validate({ query: billsQuery }), async (req, res) => {
    const { period, from, status } = req.valid.query

    let since = from
    let where = { openedAt: { gte: from } }
    if (period === 'today') {
        const last = await prisma.businessDay.findFirst({ orderBy: { closedAt: 'desc' }, select: { closedAt: true } })
        since = last?.closedAt ?? null
        where = { businessDayId: null }
    }

    const [all, days] = await Promise.all([
        prisma.order.findMany({ where, select: BILL_SELECT, orderBy: [{ openedAt: 'desc' }, { id: 'desc' }] }),
        period === 'today'
            ? []
            : prisma.businessDay.findMany({ where: { closedAt: { gte: from } }, select: DAY_SELECT, orderBy: { closedAt: 'desc' } }),
    ])
    const listed = status === 'ALL' ? all : all.filter((bill) => bill.status === status)

    res.json({
        since,
        totals: totalsOf(all),
        bills: listed.slice(0, LIST_LIMIT).map(toBillJson),
        more: Math.max(0, listed.length - LIST_LIMIT),
        days,
    })
})

// POST /api/taim/days/close – end of the day. Refused while bills are open
// (they're named, to close them first) or when there's nothing to close.
// Takes every closed bill not in a day yet, saves the report and locks them.
router.post('/days/close', allow('closeDay'), async (req, res) => {
    const day = await prisma.$transaction(async (tx) => {
        // One close at a time: a second tap waits here, then finds nothing left
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(7314001)`

        const open = await tx.order.findMany({ where: { status: 'OPEN' }, select: TITLE_SELECT, orderBy: { openedAt: 'asc' } })
        if (open.length > 0) {
            const names = open.map(titleOf).join(', ')
            throw new HttpError(409, `${open.length} ${open.length === 1 ? 'bill is' : 'bills are'} still open: ${names}. Close ${open.length === 1 ? 'it' : 'them'} first.`)
        }

        const bills = await tx.order.findMany({
            where: { status: 'CLOSED', businessDayId: null },
            select: { id: true, type: true, status: true, guests: true, openedAt: true, items: { select: { price: true, status: true } } },
        })
        if (bills.length === 0) throw new HttpError(409, 'No bills since the last close: nothing to close')

        const last = await tx.businessDay.findFirst({ orderBy: { closedAt: 'desc' }, select: { closedAt: true } })
        const firstOpened = bills.reduce((min, bill) => (bill.openedAt < min ? bill.openedAt : min), bills[0].openedAt)
        const totals = totalsOf(bills)
        const cameBack = bills.flatMap((bill) => bill.items).filter((item) => item.status === 'CAME_BACK')

        const created = await tx.businessDay.create({
            data: {
                openedAt: last?.closedAt ?? firstOpened,
                closedById: req.staff.id,
                billCount: totals.bills,
                tableBills: totals.tableBills,
                takeoutBills: totals.takeoutBills,
                guests: totals.guests,
                sales: totals.sales,
                cameBack: cameBack.length,
                cameBackValue: cameBack.reduce((sum, item) => sum + item.price, 0),
            },
            select: DAY_SELECT,
        })
        await tx.order.updateMany({ where: { id: { in: bills.map((bill) => bill.id) } }, data: { businessDayId: created.id } })
        return created
    })
    res.status(201).json(day)
})

export default router
