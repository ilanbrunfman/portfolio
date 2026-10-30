import { Router } from 'express'
import { prisma } from '../../../shared/db.js'
import { validate } from '../../../shared/middleware/validate.js'
import { allow } from '../middleware/staff.js'
import { billsQuery } from '../schemas/bills.js'
import { TITLE_SELECT, billTotal, titleOf } from '../services/orders.js'
import { DAY_SELECT, autoCloseStatus, closeDay, totalsOf } from '../services/days.js'

// Reviewing bills (reviewBills: Manager, Chef, Host) and closing the day
// (closeDay: Manager, Chef; or automatically at the set time).
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
    items: { select: { price: true, status: true, remakeOfId: true } },
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
//   autoClose (today only): { at: "04:00", due, waiting } – due = the set
//           time passed and the day isn't closed; waiting = open bills
//           holding it back
router.get('/bills', allow('reviewBills'), validate({ query: billsQuery }), async (req, res) => {
    const { period, from, status } = req.valid.query

    let since = from
    let where = { openedAt: { gte: from } }
    if (period === 'today') {
        const last = await prisma.businessDay.findFirst({ orderBy: { closedAt: 'desc' }, select: { closedAt: true } })
        since = last?.closedAt ?? null
        where = { businessDayId: null }
    }

    const [all, days, autoClose] = await Promise.all([
        prisma.order.findMany({ where, select: BILL_SELECT, orderBy: [{ openedAt: 'desc' }, { id: 'desc' }] }),
        period === 'today'
            ? []
            : prisma.businessDay.findMany({ where: { closedAt: { gte: from } }, select: DAY_SELECT, orderBy: { closedAt: 'desc' } }),
        period === 'today' ? autoCloseStatus() : null,
    ])
    const listed = status === 'ALL' ? all : all.filter((bill) => bill.status === status)

    res.json({
        since,
        totals: totalsOf(all),
        bills: listed.slice(0, LIST_LIMIT).map(toBillJson),
        more: Math.max(0, listed.length - LIST_LIMIT),
        days,
        ...(autoClose && { autoClose: { at: autoClose.at, due: autoClose.due, waiting: autoClose.waiting } }),
    })
})

// POST /api/taim/days/close – end of the day, by hand (closeDay). Refused
// while bills are open (they're named, to close them first) or when there's
// nothing to close. If nobody does it, the server closes the day at the set
// time (services/days.js, autoClose.js).
router.post('/days/close', allow('closeDay'), async (req, res) => {
    res.status(201).json(await closeDay({ closedById: req.staff.id }))
})

export default router
