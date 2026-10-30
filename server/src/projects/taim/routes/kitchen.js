import { Router } from 'express'
import { prisma } from '../../../shared/db.js'
import { validate } from '../../../shared/middleware/validate.js'
import { HttpError } from '../../../shared/lib/httpError.js'
import { idParams } from '../../../shared/schemas/common.js'
import { allow } from '../middleware/staff.js'
import { TITLE_SELECT, titleOf } from '../services/orders.js'

// The kitchen: what's waiting to be cooked, and marking dishes served.
// Reading is open to everyone picked; serving needs advanceDish (Manager,
// Chef, Cook); firing a table's held dishes needs fireHeld (Manager, Chef).
const router = Router()

// How long a served dish stays in "recently served", where it can be undone
const UNDO_MINUTES = 10

// The kitchen may fire a table's held dishes this long after its last dish
// was served (so the guests had time to eat). TAIM_KITCHEN_FIRE_AFTER in .env.
export const FIRE_AFTER_MINUTES = Number.parseInt(process.env.TAIM_KITCHEN_FIRE_AFTER ?? '', 10) >= 0 ? Number.parseInt(process.env.TAIM_KITCHEN_FIRE_AFTER, 10) : 10

const ORDER_SELECT = { id: true, ...TITLE_SELECT }

// GET /api/taim/kitchen – the cooks' list:
//   tickets: one per send of an order (table round or take-out), oldest
//            first, with the dishes still to cook (by seat, shared last)
//   onHold: per order, dishes the waiter is holding back (mains while the
//            starters are eaten), so the kitchen can plan; not cooking yet.
//            With `cooking` (that order's dishes in the kitchen) and
//            `lastServedAt`, for when the kitchen may fire them
//   fireAfterMinutes: how long after the last served dish (setting)
//   recentlyServed: dishes served in the last 10 minutes, newest first, so
//            a tap by mistake can be undone
router.get('/kitchen', async (req, res) => {
    const [cooking, held, served, heldOrders] = await Promise.all([
        prisma.orderItem.findMany({
            where: { status: 'PREPARING', order: { status: 'OPEN' } },
            select: { id: true, seat: true, round: true, firedAt: true, orderId: true, menuItem: { select: { name: true, prepMinutes: true } }, order: { select: ORDER_SELECT } },
            orderBy: [{ firedAt: 'asc' }, { id: 'asc' }],
        }),
        prisma.orderItem.findMany({
            where: { held: true, order: { status: 'OPEN' } },
            select: { id: true, seat: true, orderId: true, menuItem: { select: { name: true, prepMinutes: true } }, order: { select: ORDER_SELECT } },
            orderBy: [{ orderId: 'asc' }, { id: 'asc' }],
        }),
        prisma.orderItem.findMany({
            where: { status: 'SENT_OUT', order: { status: 'OPEN' }, sentOutAt: { gte: new Date(Date.now() - UNDO_MINUTES * 60_000) } },
            select: { id: true, seat: true, sentOutAt: true, menuItem: { select: { name: true } }, order: { select: ORDER_SELECT } },
            orderBy: { sentOutAt: 'desc' },
        }),
        // For each order with held dishes: is anything still cooking, and when was the last dish served
        prisma.orderItem.groupBy({
            by: ['orderId', 'status'],
            where: { order: { status: 'OPEN', items: { some: { held: true } } }, status: { in: ['PREPARING', 'SENT_OUT'] } },
            _count: { _all: true },
            _max: { sentOutAt: true },
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
    const bySeat = (a, b) => (a.seat ?? Infinity) - (b.seat ?? Infinity) || a.id - b.id
    for (const ticket of tickets.values()) ticket.dishes.sort(bySeat)

    const onHold = new Map()
    for (const item of held) {
        if (!onHold.has(item.orderId)) {
            const stats = heldOrders.filter((row) => row.orderId === item.orderId)
            onHold.set(item.orderId, {
                orderId: item.orderId,
                type: item.order.type,
                title: titleOf(item.order),
                cooking: stats.find((row) => row.status === 'PREPARING')?._count._all ?? 0,
                lastServedAt: stats.find((row) => row.status === 'SENT_OUT')?._max.sentOutAt ?? null,
                dishes: [],
            })
        }
        onHold.get(item.orderId).dishes.push({ id: item.id, name: item.menuItem.name, seat: item.seat, prepMinutes: item.menuItem.prepMinutes })
    }
    for (const order of onHold.values()) order.dishes.sort(bySeat)

    res.json({
        tickets: [...tickets.values()],
        onHold: [...onHold.values()],
        fireAfterMinutes: FIRE_AFTER_MINUTES,
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

// POST /api/taim/orders/:id/kitchen-fire – the Chef (or Manager) starts a
// table's held dishes from the kitchen. Only when nothing of that order is
// still cooking and its last dish was served at least FIRE_AFTER_MINUTES ago
// (so the guests had time to eat); the waiter's own "Fire held" has no such
// wait. Only the held dishes go, as the next round, marked kitchenFired so
// the waiter sees "fired by kitchen (Avi)".
router.post('/orders/:id/kitchen-fire', allow('fireHeld'), validate({ params: idParams }), async (req, res) => {
    const { id } = req.valid.params
    await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { id }, select: { status: true, ...TITLE_SELECT } })
        if (!order) throw new HttpError(404, 'Order not found')
        if (order.status !== 'OPEN') throw new HttpError(409, 'This bill is already closed')

        const held = await tx.orderItem.findMany({ where: { orderId: id, held: true }, select: { id: true } })
        if (held.length === 0) throw new HttpError(409, 'Nothing on hold for this order')

        const cooking = await tx.orderItem.count({ where: { orderId: id, status: 'PREPARING' } })
        if (cooking > 0) throw new HttpError(409, `Still cooking for ${titleOf(order)}: fire once it's served`)

        const { _max } = await tx.orderItem.aggregate({ where: { orderId: id }, _max: { sentOutAt: true, round: true } })
        if (_max.sentOutAt) {
            const minutes = Math.floor((Date.now() - _max.sentOutAt.getTime()) / 60_000)
            if (minutes < FIRE_AFTER_MINUTES) {
                throw new HttpError(409, `Served ${minutes} min ago: the kitchen can fire from ${FIRE_AFTER_MINUTES} min (or ask the waiter)`)
            }
        }

        // Only the dishes still on hold (a second tap finds none and changes nothing)
        const { count } = await tx.orderItem.updateMany({
            where: { id: { in: held.map((item) => item.id) }, held: true, status: 'NEW' },
            data: { status: 'PREPARING', held: false, firedAt: new Date(), round: (_max.round ?? 0) + 1, firedById: req.staff.id, kitchenFired: true },
        })
        if (count === 0) throw new HttpError(409, 'Nothing on hold for this order')
    })
    res.status(204).end()
})

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
