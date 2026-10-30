import { Router } from 'express'
import { prisma } from '../../../shared/db.js'
import { validate } from '../../../shared/middleware/validate.js'
import { HttpError } from '../../../shared/lib/httpError.js'
import { z } from 'zod'
import { idParams } from '../../../shared/schemas/common.js'
import { allow } from '../middleware/staff.js'
import { TITLE_SELECT, titleOf } from '../services/orders.js'
import { redo } from '../schemas/floor.js'

// The kitchen: what's waiting to be cooked, and marking dishes served.
// Reading is open to everyone picked (the Manager looks, view only);
// starting and serving need advanceDish (Chef, Cook); firing a table's held
// dishes needs fireHeld (Chef).
const router = Router()

// How long a served dish stays in "recently served", where it can be undone
const UNDO_MINUTES = 10

// How long a dish that came back stays in the kitchen's "Came back" list
const CAME_BACK_MINUTES = 30

// The kitchen may fire a table's held dishes this long after its last dish
// was served (so the guests had time to eat). TAIM_KITCHEN_FIRE_AFTER in .env.
export const FIRE_AFTER_MINUTES = Number.parseInt(process.env.TAIM_KITCHEN_FIRE_AFTER ?? '', 10) >= 0 ? Number.parseInt(process.env.TAIM_KITCHEN_FIRE_AFTER, 10) : 10

const ORDER_SELECT = { id: true, ...TITLE_SELECT }

/** A free dish for one that came back: why it came back, and what it replaces if it's another dish */
const remakeInfo = (item) => ({
    reason: item.remakeOf.returns[0]?.reason ?? null,
    replaced: item.remakeOf.menuItemId === item.menuItemId ? null : item.remakeOf.menuItem.name,
})

// /orders/:id/rounds/:round/start
const roundParams = z.object({
    id: z.coerce.number({ error: 'Invalid id' }).int('Invalid id').positive('Invalid id'),
    round: z.coerce.number({ error: 'Invalid round' }).int('Invalid round').positive('Invalid round'),
})

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
//   cameBack: dishes guests gave back in the last 30 minutes, newest first,
//            with the reason, note, who and whether a remake was made
// Free dishes for one that came back carry `remake: { reason, replaced }`
// (replaced = the dish it replaces when it's another one, else null), and
// their tickets come first: the guest is waiting.
router.get('/kitchen', async (req, res) => {
    const [cooking, held, served, heldOrders, returned] = await Promise.all([
        prisma.orderItem.findMany({
            where: { status: 'PREPARING', order: { status: 'OPEN' } },
            select: { id: true, seat: true, toGo: true, round: true, firedAt: true, startedAt: true, startedBy: { select: { name: true } }, orderId: true, menuItem: { select: { name: true, prepMinutes: true } }, order: { select: ORDER_SELECT }, menuItemId: true, remakeOf: { select: { menuItemId: true, menuItem: { select: { name: true } }, returns: { where: { kind: 'RETURN' }, select: { reason: true } } } } },
            orderBy: [{ firedAt: 'asc' }, { id: 'asc' }],
        }),
        prisma.orderItem.findMany({
            where: { held: true, order: { status: 'OPEN' } },
            select: { id: true, seat: true, toGo: true, orderId: true, menuItem: { select: { name: true, prepMinutes: true } }, order: { select: ORDER_SELECT } },
            orderBy: [{ orderId: 'asc' }, { id: 'asc' }],
        }),
        prisma.orderItem.findMany({
            where: { status: 'SENT_OUT', order: { status: 'OPEN' }, sentOutAt: { gte: new Date(Date.now() - UNDO_MINUTES * 60_000) } },
            select: { id: true, seat: true, toGo: true, sentOutAt: true, menuItem: { select: { name: true } }, order: { select: ORDER_SELECT } },
            orderBy: { sentOutAt: 'desc' },
        }),
        // For each order with held dishes: is anything still cooking, and when was the last dish served
        prisma.orderItem.groupBy({
            by: ['orderId', 'status'],
            where: { order: { status: 'OPEN', items: { some: { held: true } } }, status: { in: ['PREPARING', 'SENT_OUT'] } },
            _count: { _all: true },
            _max: { sentOutAt: true },
        }),
        prisma.itemReturn.findMany({
            where: { kind: 'RETURN', createdAt: { gte: new Date(Date.now() - CAME_BACK_MINUTES * 60_000) } },
            select: {
                reason: true,
                note: true,
                createdAt: true,
                staff: { select: { name: true } },
                orderItem: { select: { id: true, seat: true, menuItem: { select: { name: true } }, order: { select: ORDER_SELECT }, remake: { select: { id: true } } } },
            },
            orderBy: { createdAt: 'desc' },
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
                // Start: when the kitchen began this ticket and who (null = waiting)
                startedAt: null,
                startedBy: null,
                remake: false, // a remake ticket: do it first
                dishes: [],
            })
        }
        const ticket = tickets.get(key)
        if (item.remakeOf) ticket.remake = true
        if (item.startedAt && (!ticket.startedAt || item.startedAt < ticket.startedAt)) {
            ticket.startedAt = item.startedAt
            ticket.startedBy = item.startedBy?.name ?? null
        }
        // toGo: pack it, the guest takes it home; startedAt: its prep time counts from then
        ticket.dishes.push({ id: item.id, name: item.menuItem.name, seat: item.seat, toGo: item.toGo, startedAt: item.startedAt, prepMinutes: item.menuItem.prepMinutes, remake: item.remakeOf ? remakeInfo(item) : null })
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
        onHold.get(item.orderId).dishes.push({ id: item.id, name: item.menuItem.name, seat: item.seat, toGo: item.toGo, prepMinutes: item.menuItem.prepMinutes })
    }
    for (const order of onHold.values()) order.dishes.sort(bySeat)

    res.json({
        // remakes first (the guest is waiting), then oldest first
        tickets: [...tickets.values()].sort((a, b) => Number(b.remake) - Number(a.remake)),
        onHold: [...onHold.values()],
        fireAfterMinutes: FIRE_AFTER_MINUTES,
        recentlyServed: served.map((item) => ({ id: item.id, name: item.menuItem.name, seat: item.seat, toGo: item.toGo, title: titleOf(item.order), sentOutAt: item.sentOutAt })),
        cameBack: returned.map((row) => ({
            id: row.orderItem.id,
            name: row.orderItem.menuItem.name,
            title: titleOf(row.orderItem.order),
            seat: row.orderItem.seat,
            reason: row.reason,
            note: row.note,
            by: row.staff.name,
            at: row.createdAt,
            remade: Boolean(row.orderItem.remake),
        })),
    })
})

/**
 * Move one dish from one status to the next (or back), only while its
 * order is open. One UPDATE … WHERE status = from, so two cooks tapping
 * the same dish can't both succeed. 404 unknown, 409 wrong state.
 */
async function moveDish(db, id, from, data, wrongState) {
    const { count } = await db.orderItem.updateMany({ where: { id, status: from, order: { status: 'OPEN' } }, data })
    if (count === 0) {
        const item = await db.orderItem.findUnique({ where: { id }, select: { id: true } })
        if (!item) throw new HttpError(404, 'Dish not found')
        throw new HttpError(409, wrongState)
    }
}

// POST /api/taim/orders/:id/kitchen-fire – the Chef starts a
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

// POST /api/taim/orders/:id/rounds/:round/start – the kitchen starts a
// ticket: its dishes still waiting get startedAt and who started them, and
// their prep times count from now. Already started: 409.
router.post('/orders/:id/rounds/:round/start', allow('advanceDish'), validate({ params: roundParams }), async (req, res) => {
    const { id, round } = req.valid.params
    const { count } = await prisma.orderItem.updateMany({
        where: { orderId: id, round, status: 'PREPARING', startedAt: null, order: { status: 'OPEN' } },
        data: { startedAt: new Date(), startedById: req.staff.id },
    })
    if (count === 0) {
        const cooking = await prisma.orderItem.count({ where: { orderId: id, round, status: 'PREPARING' } })
        throw cooking > 0 ? new HttpError(409, 'This ticket was already started') : new HttpError(404, 'No ticket in the kitchen for this round')
    }
    res.status(204).end()
})

// POST /api/taim/order-items/:id/serve – the dish is out of the kitchen,
// served by whoever tapped it. Never started (a drink, something quick)?
// Then it started now too.
router.post('/order-items/:id/serve', allow('advanceDish'), validate({ params: idParams }), async (req, res) => {
    const { id } = req.valid.params
    const now = new Date()
    await prisma.$transaction(async (tx) => {
        await moveDish(tx, id, 'PREPARING', { status: 'SENT_OUT', sentOutAt: now, servedById: req.staff.id }, 'Only a dish in the kitchen can be marked served')
        await tx.orderItem.updateMany({ where: { id, startedAt: null }, data: { startedAt: now, startedById: req.staff.id } })
    })
    res.status(204).end()
})

// POST /api/taim/order-items/:id/redo { note? } (advanceDish: Chef, Cook) –
// the kitchen made it wrong (burnt, wrong plate) and makes it again. The
// ruined plate is kept as a WASTED copy (a loss, reason MADE_WRONG, who and
// why); the dish itself stays in the kitchen, started again now.
router.post('/order-items/:id/redo', allow('advanceDish'), validate({ params: idParams, body: redo }), async (req, res) => {
    const { id } = req.valid.params
    const now = new Date()
    await prisma.$transaction(async (tx) => {
        const dish = await tx.orderItem.findUnique({ where: { id }, include: { order: { select: { status: true } } } })
        if (!dish) throw new HttpError(404, 'Dish not found')
        // Restart it, only while it's in the kitchen (guarded: two taps can't both redo)
        const { count } = await tx.orderItem.updateMany({
            where: { id, status: 'PREPARING', order: { status: 'OPEN' } },
            data: { startedAt: now, startedById: req.staff.id },
        })
        if (count === 0) throw new HttpError(409, 'Only a dish in the kitchen can be redone')
        const ruined = await tx.orderItem.create({
            data: {
                orderId: dish.orderId,
                menuItemId: dish.menuItemId,
                price: dish.price,
                seat: dish.seat,
                toGo: dish.toGo,
                status: 'WASTED',
                round: dish.round,
                firedAt: dish.firedAt,
                firedById: dish.firedById,
                startedAt: dish.startedAt ?? now,
                startedById: dish.startedById ?? req.staff.id,
            },
        })
        await tx.itemReturn.create({ data: { orderItemId: ruined.id, kind: 'WASTE', reason: 'MADE_WRONG', note: req.valid.body.note, staffId: req.staff.id } })
    })
    res.status(201).end()
})

// POST /api/taim/order-items/:id/unserve – served by mistake: back to the
// kitchen (still started; no longer served)
router.post('/order-items/:id/unserve', allow('advanceDish'), validate({ params: idParams }), async (req, res) => {
    await moveDish(prisma, req.valid.params.id, 'SENT_OUT', { status: 'PREPARING', sentOutAt: null, servedById: null }, 'Only a served dish can go back to the kitchen')
    res.status(204).end()
})

export default router
