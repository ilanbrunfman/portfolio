import { Router } from 'express'
import { prisma } from '../../../shared/db.js'
import { validate } from '../../../shared/middleware/validate.js'
import { HttpError } from '../../../shared/lib/httpError.js'
import { idParams } from '../../../shared/schemas/common.js'
import { allow } from '../middleware/staff.js'

// The kitchen: what's waiting to be cooked, and marking dishes served.
// Reading is open to everyone picked; serving needs advanceDish (Manager,
// Chef, Cook).
const router = Router()

// How long a served dish stays in "recently served", where it can be undone
const UNDO_MINUTES = 10

const ORDER_SELECT = {
    id: true,
    type: true,
    customerName: true,
    table: { select: { label: true, joined: { select: { label: true }, orderBy: { position: 'asc' } } } },
}

/** "T5", "T1 + T4 + T7" or "Take-out · Maya" */
const titleOf = (order) =>
    order.type === 'TABLE' ? [order.table, ...order.table.joined].map((t) => t.label).join(' + ') : `Take-out · ${order.customerName}`

// GET /api/taim/kitchen – the cooks' list:
//   tickets: one per send of an order (table round or take-out), oldest
//            first, with the dishes still to cook (by seat, shared last)
//   recentlyServed: dishes served in the last 10 minutes, newest first, so
//            a tap by mistake can be undone
router.get('/kitchen', async (req, res) => {
    const [cooking, served] = await Promise.all([
        prisma.orderItem.findMany({
            where: { status: 'PREPARING', order: { status: 'OPEN' } },
            select: { id: true, seat: true, round: true, firedAt: true, orderId: true, menuItem: { select: { name: true, prepMinutes: true } }, order: { select: ORDER_SELECT } },
            orderBy: [{ firedAt: 'asc' }, { id: 'asc' }],
        }),
        prisma.orderItem.findMany({
            where: { status: 'SENT_OUT', order: { status: 'OPEN' }, sentOutAt: { gte: new Date(Date.now() - UNDO_MINUTES * 60_000) } },
            select: { id: true, seat: true, sentOutAt: true, menuItem: { select: { name: true } }, order: { select: ORDER_SELECT } },
            orderBy: { sentOutAt: 'desc' },
        }),
    ])

    // Group dishes into tickets, keeping the oldest-first order of the query
    const tickets = new Map()
    for (const item of cooking) {
        const key = `${item.orderId}-${item.round}`
        if (!tickets.has(key)) {
            tickets.set(key, {
                orderId: item.orderId,
                round: item.round,
                type: item.order.type,
                title: titleOf(item.order),
                firedAt: item.firedAt,
                dishes: [],
            })
        }
        tickets.get(key).dishes.push({ id: item.id, name: item.menuItem.name, seat: item.seat, prepMinutes: item.menuItem.prepMinutes })
    }
    for (const ticket of tickets.values()) ticket.dishes.sort((a, b) => (a.seat ?? Infinity) - (b.seat ?? Infinity) || a.id - b.id)

    res.json({
        tickets: [...tickets.values()],
        recentlyServed: served.map((item) => ({ id: item.id, name: item.menuItem.name, seat: item.seat, title: titleOf(item.order), sentOutAt: item.sentOutAt })),
    })
})

/**
 * Move one dish from one status to the next (or back), only while its
 * order is open. One UPDATE … WHERE status = from, so two cooks tapping
 * the same dish can't both succeed. 404 unknown, 409 wrong state.
 */
async function moveDish(id, from, to, wrongState) {
    const { count } = await prisma.orderItem.updateMany({
        where: { id, status: from, order: { status: 'OPEN' } },
        data: { status: to, sentOutAt: to === 'SENT_OUT' ? new Date() : null },
    })
    if (count === 0) {
        const item = await prisma.orderItem.findUnique({ where: { id }, select: { id: true } })
        if (!item) throw new HttpError(404, 'Dish not found')
        throw new HttpError(409, wrongState)
    }
}

// POST /api/taim/order-items/:id/serve – the dish is out of the kitchen
router.post('/order-items/:id/serve', allow('advanceDish'), validate({ params: idParams }), async (req, res) => {
    await moveDish(req.valid.params.id, 'PREPARING', 'SENT_OUT', 'Only a dish in the kitchen can be marked served')
    res.status(204).end()
})

// POST /api/taim/order-items/:id/unserve – served by mistake: back to the kitchen
router.post('/order-items/:id/unserve', allow('advanceDish'), validate({ params: idParams }), async (req, res) => {
    await moveDish(req.valid.params.id, 'SENT_OUT', 'PREPARING', 'Only a served dish can go back to the kitchen')
    res.status(204).end()
})

export default router
